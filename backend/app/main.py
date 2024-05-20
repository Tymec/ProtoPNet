import hashlib
import json
from io import BytesIO
from uuid import uuid4

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app import BOXMAP_URL, HEATMAP_URL, MODEL_INFO_PATH, MODEL_PATH, ORIGINAL_URL, RATE_LIMIT, STATIC_DIR
from app.firebase import FirebaseManager
from app.s3 import get_transfer_manager, upload_image
from net.inference import (
    box_by_top_k_prototype,
    get_classification,
    get_confidence_map,
    heatmap_by_top_k_prototype,
    load_model,
    predict,
)


class PredictResponse(BaseModel):
    prediction: str
    confidence: dict[str, float]
    heatmap_urls: list[str] | None
    boxmap_urls: list[str] | None
    document_id: str | None


class FeedbackData(BaseModel):
    selected_images: list[str]
    document_id: str


class FeedbackResponse(BaseModel):
    pass


class HistoryItem(PredictResponse):
    image_url: str
    flagged: list[int]
    timestamp: str


class UserHistoryResponse(BaseModel):
    history: list[HistoryItem]


model = load_model(MODEL_PATH, MODEL_INFO_PATH)
firebase = FirebaseManager()

limiter = Limiter(key_func=get_remote_address)
app = FastAPI()
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(STATIC_DIR / "favicon.ico")


@app.get("/robots.txt", include_in_schema=False)
async def robots():
    return FileResponse(STATIC_DIR / "robots.txt")


@app.post("/predict")
@limiter.limit(RATE_LIMIT)
async def get_prediction(
    request: Request,
    image: UploadFile = File(...),
    k: int = Form(
        default=10,
        description="Number of items to return (of each: heatmap and boxmap)",
        gt=0,
    ),
    user_id: str = Form(
        default="",
        description="User ID",
    ),
) -> PredictResponse:
    if image.content_type not in [
        "image/jpeg",
        "image/png",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG OR PNG images are allowed.",
        )

    contents = await image.read()
    image_data = ""
    try:
        image_data = Image.open(BytesIO(contents))
    except UnidentifiedImageError:
        raise HTTPException(
            status_code=400,
            detail="Invalid file format.",
        )

    # Use the cached prediction if it exists
    image_hash = hashlib.sha256(image_data.tobytes()).hexdigest()
    cached_prediction = firebase.find_by_image(image_hash, user_id)
    if cached_prediction:
        pred_id, pred_data = cached_prediction
        if pred_data["user_id"] != user_id and user_id != "anonymous":
            pred_id = firebase.add_document(
                pred_data["image"],
                pred_data["hash"],
                pred_data["prediction"],
                pred_data["confidence"],
                pred_data["heatmaps"],
                pred_data["boxmaps"],
                user_id,
                pred_data["flagged"],
            )

        return PredictResponse(
            prediction=pred_data["prediction"],
            confidence=pred_data["confidence"],
            heatmap_urls=pred_data["heatmaps"],
            boxmap_urls=pred_data["boxmaps"],
            document_id=pred_id,
        )

    s3t = get_transfer_manager(workers=20)
    original_image_url = upload_image(
        s3t,
        f"{ORIGINAL_URL}/{uuid4()}.jpg",
        image_data.convert("RGB"),
    )

    pred, con, act, pat, img = predict(model, image_data)
    confidence_map = get_confidence_map(con)

    return_data = PredictResponse(
        prediction=get_classification(pred),
        confidence=confidence_map,
        heatmap_urls=None,
        boxmap_urls=None,
        document_id=None,
    )

    heatmap_urls: list[str] = []
    heatmaps = heatmap_by_top_k_prototype(act, pat, img, k)
    for heatmap in heatmaps:
        url = upload_image(
            s3t,
            f"{HEATMAP_URL}/{uuid4()}.jpg",
            heatmap,
        )

        if url is None:
            raise HTTPException(
                status_code=500,
                detail="Could not upload heatmap to S3.",
            )

        heatmap_urls.append(url)
    return_data.heatmap_urls = heatmap_urls

    boxmaps = box_by_top_k_prototype(act, pat, img, k)
    boxmap_urls: list[str] = []
    for boxmap in boxmaps:
        url = upload_image(
            s3t,
            f"{BOXMAP_URL}/{uuid4()}.jpg",
            boxmap,
        )

        if url is None:
            raise HTTPException(
                status_code=500,
                detail="Could not upload boxmap to S3.",
            )

        boxmap_urls.append(url)
    return_data.boxmap_urls = boxmap_urls

    return_data.document_id = firebase.add_document(
        original_image_url,
        image_hash,
        return_data.prediction,
        confidence_map,
        heatmap_urls,
        boxmap_urls,
        user_id,
    )

    # Uncomment to make thread wait for uploads to finish
    s3t.shutdown()

    return return_data


@app.post("/feedback")
async def get_feedback(
    selected_images: str = Form(
        default="[]",
        description="List of indices of images to be flagged",
    ),
    document_id: str = Form(
        ...,
        description="Document ID of the prediction",
    ),
) -> FeedbackResponse:
    if document_id is None:
        raise HTTPException(
            status_code=400,
            detail="Document ID is required.",
        )
    selected_images = json.loads(selected_images)
    firebase.update_flagged(document_id, selected_images)
    return FeedbackResponse()


@app.get("/user_history", response_model=UserHistoryResponse)
async def get_user_history(user_id: str):
    if not user_id:
        raise HTTPException(status_code=400, detail="User ID is required.")

    history = [
        HistoryItem(
            image_url=doc["image"],
            prediction=doc["prediction"],
            confidence=doc["confidence"],
            heatmap_urls=doc["heatmaps"],
            boxmap_urls=doc["boxmaps"],
            flagged=doc["flagged"],
            timestamp=doc["timestamp"],
            document_id=doc["id"],
        )
        for doc in firebase.get_user_history(user_id)
    ]
    sorted_history = sorted(history, key=lambda x: x.timestamp, reverse=True)
    return UserHistoryResponse(history=sorted_history)

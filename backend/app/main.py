from io import BytesIO
from uuid import uuid4

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError
from pydantic import BaseModel

from app import BOXMAP_URL, HEATMAP_URL, MODEL_INFO_PATH, MODEL_PATH, STATIC_DIR
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


model = load_model(MODEL_PATH, MODEL_INFO_PATH)
app = FastAPI()

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
async def get_prediction(
    image: UploadFile = File(...),
    k: int = Form(
        default=10,
        description="Number of items to return (of each: heatmap and boxmap)",
        gt=0,
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

    pred, con, act, pat, img = predict(model, image_data)
    confidence_map = get_confidence_map(con)

    return_data = PredictResponse(
        prediction=get_classification(pred),
        confidence=confidence_map,
        heatmap_urls=None,
        boxmap_urls=None,
    )

    s3t = get_transfer_manager(workers=20)

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

    # Uncomment to make thread wait for uploads to finish
    s3t.shutdown()

    return return_data

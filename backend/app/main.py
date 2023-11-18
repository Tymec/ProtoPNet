from enum import Enum
from io import BytesIO
from uuid import uuid4

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from net.inference import (
    box_by_top_k_prototype,
    get_classification,
    get_confidence_map,
    heatmap_by_top_k_prototype,
    load_model,
    predict,
)
from PIL import Image
from pydantic import BaseModel

from app import BOX_DIR, CWD, FAVICON_PATH, HEATMAP_DIR, MODEL_INFO_PATH, MODEL_PATH, ROBOTS_PATH, STATIC_DIR


class PredictReturnType(str, Enum):
    NONE = "none"
    BOTH = "both"
    HEATMAPS = "heatmaps"
    BOXES = "boxes"


class PredictResponse(BaseModel):
    prediction: str
    confidence: dict[str, float]
    heatmap_urls: list[str] | None
    box_urls: list[str] | None


# load model
model = load_model(MODEL_PATH, MODEL_INFO_PATH)

app = FastAPI()

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(FAVICON_PATH)


@app.get("/robots.txt", include_in_schema=False)
async def robots():
    return FileResponse(ROBOTS_PATH)


@app.get("/")
async def root():
    return {
        "message": "Hello World",
    }


@app.post("/predict")
async def get_prediction(
    image: UploadFile = File(...),
    return_type: PredictReturnType = Form(
        default=PredictReturnType.BOTH,
        description="Type of items to return ['none/both'/'heatmaps'/'boxes']",
    ),
    k: int = Form(
        default=10,
        description="Number of items to return (of each: heatmap and box)",
        gt=0,
    ),
) -> PredictResponse:
    # Check file type
    if image.content_type not in [
        "image/jpeg",
        "image/png",
    ]:
        raise HTTPException(
            status_code=400,
            detail="Only JPEG OR PNG images are allowed.",
        )

    contents = await image.read()
    image_data = Image.open(BytesIO(contents))

    pred, con, act, pat, img = predict(model, image_data)
    confidence_map = get_confidence_map(con)

    return_data = PredictResponse(
        prediction=get_classification(pred),
        confidence=confidence_map,
        heatmap_urls=None,
        box_urls=None,
    )

    # Save heatmaps
    if return_type == PredictReturnType.HEATMAPS or return_type == PredictReturnType.BOTH:
        heatmaps = heatmap_by_top_k_prototype(act, pat, img, k)

        # make sure heatmap_dir exists
        HEATMAP_DIR.mkdir(parents=True, exist_ok=True)

        heatmap_urls: list[str] = []
        for heatmap in heatmaps:
            heatmap_url = HEATMAP_DIR / f"{uuid4()}.jpg"
            heatmap.save(heatmap_url)  # todo: use database to save img
            relative_path = heatmap_url.relative_to(CWD)
            heatmap_urls.append(str(relative_path))
        return_data.heatmap_urls = heatmap_urls

    # Save boxes
    if return_type == PredictReturnType.BOXES or return_type == PredictReturnType.BOTH:
        boxes = box_by_top_k_prototype(act, pat, img, k)

        # make sure box_dir exists
        BOX_DIR.mkdir(parents=True, exist_ok=True)

        box_urls: list[str] = []
        for box in boxes:
            box_url = BOX_DIR / f"{uuid4()}.jpg"
            box.save(box_url)  # todo: use databse to save img
            relative_path = box_url.relative_to(CWD)
            box_urls.append(str(relative_path))
        return_data.box_urls = box_urls

    return return_data

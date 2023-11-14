from enum import Enum
from os import remove
from typing import Optional
from uuid import uuid4

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from net.inference import (
    CLASSIFICATIONS,
    box_by_top_k_prototype,
    heatmap_by_top_k_prototype,
    load_model,
    predict,
    sanity_check,
)

from app import BOX_DIR, CWD, FAVICON_PATH, HEATMAP_DIR, INFO_PATH, MODEL_PATH, ROBOTS_PATH, STATIC_DIR


class ReturnType(str, Enum):
    heatmaps = "heatmaps"
    boxes = "boxes"
    both = "both"


app = FastAPI()

app.mount(
    "/static",
    StaticFiles(directory=STATIC_DIR),
    name="static",
)

# load machine
model = load_model(MODEL_PATH, 0)

# model check
if not sanity_check(model, INFO_PATH):
    raise RuntimeError("Model did not pass the sanity check.")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(FAVICON_PATH)


@app.get("/robots.txt", include_in_schema=False)
async def robots():
    return FileResponse(ROBOTS_PATH)


@app.get("/")
async def root():
    return {"message": "Hello World"}


@app.post("/predict")
async def get_prediction(
    image: UploadFile = File(...),
    return_type: Optional[ReturnType] = Query(
        ReturnType.both, description="Types of item to return ['both'/'heatmaps'/'boxes']"
    )
):
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

    # Temprarily saving the input image
    input_file_path = STATIC_DIR / str(uuid4())
    with input_file_path.open(mode="wb") as f:
        f.write(contents)

    proto = predict(model, input_file_path, 0)
    # Remove input image
    remove(input_file_path)

    heatmap_urls = []

    # Save heatmaps
    if return_type == ReturnType.heatmaps or return_type == ReturnType.both:
        heatmaps = heatmap_by_top_k_prototype(proto.activation, proto.pattern, proto.img, 10)

        for heatmap in heatmaps:
            heatmap_url = HEATMAP_DIR / f"{uuid4()}.jpg"
            heatmap.save(heatmap_url)  # todo: use database to save img
            heatmap_urls.append(heatmap_url.relative_to(CWD))

    box_urls = []

    # Save boxes
    if return_type == ReturnType.boxes or return_type == ReturnType.both:
        boxes = box_by_top_k_prototype(proto.activation, proto.pattern, proto.img, 10)

        for box in boxes:
            box_url = BOX_DIR / f"{uuid4()}.jpg"
            box.save(box_url)  # todo: use databse to save img
            box_urls.append(box_url.relative_to(CWD))

    # Response
    return {
        "prediction": CLASSIFICATIONS[proto.prediction],
        "heatmap_urls": heatmap_urls,
        "box_urls": box_urls,
    }

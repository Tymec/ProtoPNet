from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app import *
from tempfile import NamedTemporaryFile
from os import remove
from uuid import uuid4

# ? importing like this due to the use of the loadmodel() function in the 'inference' module
import sys
sys.path.append(str(CWD) + "/net")
from inference import *

app = FastAPI()

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# load machine
model_path = Path("model/100push0.7413.pth")
model = load_model(model_path, 0)

# make check
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
async def get_prediction(image: UploadFile=File(...)):

    # Check file type
    if image.content_type not in ["image/jpeg", "image/png"]:
        raise HTTPException(status_code=400, detail="Only JPEG OR PNG images are allowed.")

    contents = await image.read()   

    # Temprarily saving the input image
    input_file_path = STATIC_DIR / str(uuid4()) 
    with input_file_path.open(mode="wb") as f:
        f.write(contents)
    
    proto = predict(model, input_file_path, 0)
    # Remove input image
    remove(input_file_path)

    # Save heatmaps
    heatmap_urls = []
    heatmaps = heatmap_by_top_k_prototype(proto.activation, proto.pattern, proto.img, 10)

    for heatmap in heatmaps:
        uuid = str(uuid4())
        heatmap.save(STATIC_DIR / f"{uuid}.jpg")
        heatmap_urls.append(f"/static/{uuid}.jpg")

    
    # Save boxes
    box_urls = []
    boxes = box_by_top_k_prototype(proto.activation, proto.pattern, proto.img, 10)

    for box in boxes:
        uuid = str(uuid4())
        box.save(STATIC_DIR / f"{uuid}.jpg")
        box_urls.append(f"/static/{uuid}.jpg")


    # Response
    return {
        "prediction": CLASSIFICATIONS[proto.prediction],
        "heatmap_urls": heatmap_urls,
        "box_urls": box_urls
    }

# todo: delete static/*.jpg from time to time

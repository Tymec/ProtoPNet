from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app import *
from net.inference import *


app = FastAPI()

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# load machine
model = load_model(MODEL_PATH)

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


# if __name__ == "__main__":
#     img_path = Path("static/Black_Footed_Albatross_0001_796111.jpg")
#     model_path = Path("model/100push0.7413.pth")
#     info_path = Path("model/bb100.npy")

#     ppnet = load_model(model_path, 0)

#     if not sanity_check(ppnet, info_path):
#         raise RuntimeError("Model did not pass the sanity check!")

#     proto = predict(ppnet, img_path, 0)
#     print(f"Prediction: {CLASSIFICATIONS[proto.prediction]} ({proto.prediction})")

#     heatmaps = heatmap_by_top_k_prototype(proto.activation, proto.pattern, proto.img, 10)
#     for i, im in enumerate(heatmaps):
#         im.save(f"static/actual/heat_{i}.jpg")
#         continue

#     boxes = box_by_top_k_prototype(proto.activation, proto.pattern, proto.img, 10)
#     for i, im in enumerate(boxes):
#         im.save(f"static/actual/box_{i}.jpg")
#         continue

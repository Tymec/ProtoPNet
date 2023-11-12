from fastapi import FastAPI
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app import FAVICON_PATH, ROBOTS_PATH, STATIC_DIR

app = FastAPI()

app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")


@app.get("/favicon.ico", include_in_schema=False)
async def favicon():
    return FileResponse(FAVICON_PATH)


@app.get("/robots.txt", include_in_schema=False)
async def robots():
    return FileResponse(ROBOTS_PATH)


@app.get("/")
async def root():
    return {"message": "Hello World"}

import os
from pathlib import Path

CWD = Path.cwd()

STATIC_DIR = CWD / "static"
MODEL_DIR = CWD / "model"

BOXMAP_URL = "generated/boxmaps"
HEATMAP_URL = "generated/heatmaps"

MODEL_PATH = MODEL_DIR / "100push0.7413.state.pth"
MODEL_INFO_PATH = MODEL_DIR / "bb100.npy"

S3_BUCKET = os.environ.get("S3_BUCKET", "")
S3_ACCESS = os.environ.get("S3_ACCESS", "")
S3_SECRET = os.environ.get("S3_SECRET", "")
S3_REGION = os.environ.get("S3_REGION", "")

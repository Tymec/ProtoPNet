from pathlib import Path

CWD = Path.cwd()
STATIC_DIR = CWD / "static"
MODEL_DIR = CWD / "model"

FAVICON_PATH = STATIC_DIR / "favicon.ico"
ROBOTS_PATH = STATIC_DIR / "robots.txt"
MODEL_PATH = MODEL_DIR / "100push0.7413.state.pth"
MODEL_INFO_PATH = MODEL_DIR / "bb100.npy"
BOX_DIR = STATIC_DIR / "boxmap"
HEATMAP_DIR = STATIC_DIR / "heatmap"

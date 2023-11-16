from pathlib import Path

CWD = Path.cwd()
STATIC_DIR = CWD / "static"
FAVICON_PATH = STATIC_DIR / "favicon.ico"
ROBOTS_PATH = STATIC_DIR / "robots.txt"
MODEL_PATH = CWD / "model" / "100push0.7413.pth"
INFO_PATH = CWD / "model" / "bb100.npy"
BOX_DIR = STATIC_DIR / "boxmap"
HEATMAP_DIR = STATIC_DIR / "heatmap"

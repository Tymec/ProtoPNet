from pathlib import Path

PATH = Path("/root/projects/ProtoPNet/backend/net/test_cropped")

dirs = []
dir_count = 0
for d in PATH.iterdir():
    if not d.is_dir():
        continue

    dir_count += 1
    dirs.append(d)

classes = ["Unknown"] * dir_count
for d in dirs:
    idx, name = d.name.split(".")

    try:
        idx = int(idx)
    except ValueError:
        print(f"Skipping {d.name!r}, invalid index")
        continue

    classes[idx - 1] = name

print(classes)

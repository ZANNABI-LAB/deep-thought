import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

TOLERANCE = 30


def cutout(img: Image.Image) -> Image.Image:
    a = np.asarray(img.convert('RGBA')).astype(int)
    h, w = a.shape[:2]
    bg = np.median([a[2, 2, :3], a[2, -3, :3], a[-3, 2, :3], a[-3, -3, :3]], axis=0)
    near = np.abs(a[..., :3] - bg).sum(2) < TOLERANCE
    seen = np.zeros((h, w), bool)
    queue = deque([(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)])
    for p in queue:
        seen[p] = True
    while queue:
        y, x = queue.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx] and near[ny, nx]:
                seen[ny, nx] = True
                queue.append((ny, nx))
    a[..., 3] = np.where(seen, 0, 255)
    return Image.fromarray(a.astype(np.uint8))


def main() -> None:
    src, out, width = Path(sys.argv[1]), Path(sys.argv[2]), int(sys.argv[3])
    prop = cutout(Image.open(src))
    prop = prop.crop(prop.getbbox())
    prop = prop.resize((width, round(prop.height * width / prop.width)), Image.LANCZOS)
    prop.save(out, lossless=True, method=6)
    print(out.name, prop.size)


if __name__ == '__main__':
    main()

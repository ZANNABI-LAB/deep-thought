import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

TOLERANCE = 30
SCALE = 0.42 * 1.12
GAP = 44


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


def split(img: Image.Image) -> tuple[Image.Image, Image.Image]:
    empty = np.where(~(np.asarray(img)[..., 3] > 40).any(0))[0]
    middle = empty[(empty > img.width * 0.3) & (empty < img.width * 0.8)]
    cut = int(middle[len(middle) // 2])
    chair, console = img.crop((0, 0, cut, img.height)), img.crop((cut, 0, img.width, img.height))
    return chair.crop(chair.getbbox()), console.crop(console.getbbox())


def main() -> None:
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    seat = cutout(Image.open(src))
    chair, console = split(seat.crop(seat.getbbox()))
    gap = int(np.where(~(np.asarray(seat.crop(seat.getbbox()))[..., 3] > 40).any(0))[0].size)
    size = lambda im: (round(im.width * SCALE), round(im.height * SCALE))
    chair, console = chair.resize(size(chair), Image.LANCZOS), console.resize(size(console), Image.LANCZOS)
    width = chair.width + round(gap * SCALE) + GAP + console.width
    height = max(chair.height, console.height)
    sheet = Image.new('RGBA', (width, height))
    sheet.alpha_composite(chair, (0, height - chair.height))
    sheet.alpha_composite(console, (width - console.width, height - console.height))
    sheet.save(out, lossless=True, method=6)
    print(out.name, sheet.size, 'chair', chair.size, 'console', console.size)


if __name__ == '__main__':
    main()

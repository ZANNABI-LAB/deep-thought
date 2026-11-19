import sys
from pathlib import Path

from PIL import Image

FRAME = 512
COLS = 7
CROP = (90, 0, 400, 462)
UNIT = 0.477


def main() -> None:
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    sheet = Image.open(src).convert('RGBA')
    cells = [sheet.crop((i % COLS * FRAME, i // COLS * FRAME, i % COLS * FRAME + FRAME, i // COLS * FRAME + FRAME)).crop(CROP) for i in range(0, 48, 2)]
    w, h = round((CROP[2] - CROP[0]) * UNIT * 2), round((CROP[3] - CROP[1]) * UNIT * 2)
    strip = Image.new('RGBA', (w * len(cells), h))
    for i, c in enumerate(cells):
        strip.alpha_composite(c.resize((w, h), Image.LANCZOS), (i * w, 0))
    strip.save(out, quality=88, alpha_quality=90, method=6)
    print(out.name, len(cells), (w, h))


if __name__ == '__main__':
    main()

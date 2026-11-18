import sys
from pathlib import Path

from PIL import Image

from cockpit_seat import cutout

WIDTH = 554


def main() -> None:
    src, out = Path(sys.argv[1]), Path(sys.argv[2])
    desk = cutout(Image.open(src))
    desk = desk.crop(desk.getbbox())
    desk = desk.resize((WIDTH, round(desk.height * WIDTH / desk.width)), Image.LANCZOS)
    desk.save(out, lossless=True, method=6)
    print(out.name, desk.size)


if __name__ == '__main__':
    main()

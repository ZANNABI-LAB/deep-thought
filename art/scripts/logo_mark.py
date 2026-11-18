import re
import subprocess
import sys
import tempfile
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw, ImageFilter

PAD = 0.03
CLOSE = 41
FAVICON = 64


def masks(src: str) -> tuple[Image.Image, Image.Image]:
    white = Image.open(src).convert('L').point(lambda v: 255 if v > 128 else 0)
    fill = white.filter(ImageFilter.MaxFilter(CLOSE))
    w, h = fill.size
    for corner in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(fill, corner, 128)
    silhouette = fill.point(lambda v: 0 if v == 128 else 255).filter(ImageFilter.MinFilter(CLOSE))
    return white, ImageChops.lighter(silhouette, white)


def square(bbox: tuple[int, int, int, int]) -> tuple[float, float, float]:
    x0, y0, x1, y1 = bbox
    side = max(x1 - x0, y1 - y0) * (1 + 2 * PAD)
    return (x0 + x1 - side) / 2, (y0 + y1 - side) / 2, side


def trace(mask: Image.Image, work: Path, name: str) -> tuple[str, str]:
    pbm, svg = work / f'{name}.pbm', work / f'{name}.svg'
    mask.point(lambda v: 0 if v else 255).convert('1').save(pbm)
    subprocess.run(['potrace', str(pbm), '-s', '-o', str(svg), '-t', '8', '-a', '1', '-O', '0.4', '--flat'], check=True)
    text = svg.read_text()
    transform = re.search(r'<g transform="([^"]+)"', text).group(1)
    d = ' '.join(p.replace('\n', ' ') for p in re.findall(r'<path d="([^"]+)"', text))
    return transform, d


def build_svg(src: str, out: str) -> None:
    white, silhouette = masks(src)
    with tempfile.TemporaryDirectory() as tmp:
        transform, d_sil = trace(silhouette, Path(tmp), 'sil')
        _, d_white = trace(white, Path(tmp), 'white')
    x, y, side = square(silhouette.getbbox())
    Path(out).write_text(
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{x:.0f} {y:.0f} {side:.0f} {side:.0f}">'
        f'<g transform="{transform}"><path fill="#000" d="{d_sil}"/><path fill="#fff" d="{d_white}"/></g></svg>\n'
    )


def build_favicon(src: str, out: str) -> None:
    white, silhouette = masks(src)
    body = silhouette.copy()
    ImageDraw.floodfill(body, (body.width // 2, body.height // 2), 128)
    body = body.point(lambda v: 255 if v == 128 else 0)
    image = Image.new('RGBA', body.size, (0, 0, 0, 0))
    image.paste((0, 0, 0, 255), mask=body)
    image.paste((255, 255, 255, 255), mask=ImageChops.multiply(white, body))
    x, y, side = square(body.getbbox())
    image.crop((round(x), round(y), round(x + side), round(y + side))).resize((FAVICON, FAVICON), Image.LANCZOS).save(out, optimize=True)


if __name__ == '__main__':
    command, src, out = sys.argv[1:4]
    {'svg': build_svg, 'favicon': build_favicon}[command](src, out)

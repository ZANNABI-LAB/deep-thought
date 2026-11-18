import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageStat

CELL = 256
COLS = 5
OUT_W, OUT_H = 200, 240
FOOT_PAD = 6
HELMET = 82
SAME = 3.0

CLIPS = {
    'idle': ('zannabi-idle-v1-trimmed.png', 17, 'loop', 1),
    'turn': ('zannabi-turn-v1.png', 25, 'keys', [0, 6, 18]),
    'turn-around': ('zannabi-turn-around-v1.png', 25, 'keys', [0, 5, 11, 17, 24]),
    'walk': ('zannabi-walking-v1.png', 11, 'loop', 1),
    'wave': ('zannabi-wave-v1.png', 25, 'return', 1),
    'look': ('zannabi-look-v1.png', 25, 'return', 1),
    'yawn': ('zannabi-yawn-v1.png', 25, 'return', 1),
    'doze': ('zannabi-doze-v1.png', 25, 'return', 1),
    'hop': ('zannabi-hop-v1.png', 25, 'return', 1),
    'turn-back': ('zannabi-turn-back-v1.png', 25, 'end', 2),
    'breathe': ('zannabi-breathe-v1.png', 24, 'still', 1),
    'tilt': ('zannabi-tilt-v1.png', 25, 'return', 1),
    'look-up': ('zannabi-look-up-v1.png', 25, 'return', 1),
    'palm': ('zannabi-palm-v1.png', 25, 'return', 1),
    'doodle': ('zannabi-doodle-v1.png', 25, 'return', 1),
    'ledge-sit': ('zannabi-ledge-sit-v1.png', 25, 'keys', [18, 24]),
    'ledge-read': ('zannabi-ledge-read-v1.png', 25, 'loop', 1),
}


def frames(path: Path, count: int) -> list[Image.Image]:
    sheet = Image.open(path).convert('RGBA')
    return [sheet.crop((i % COLS * CELL, i // COLS * CELL, i % COLS * CELL + CELL, i // COLS * CELL + CELL)) for i in range(count)]


def diff(a: Image.Image, b: Image.Image) -> float:
    return sum(ImageStat.Stat(ImageChops.difference(a, b)).mean)


def trim(clip: list[Image.Image], kind: str) -> list[Image.Image]:
    if kind == 'still':
        return clip
    while len(clip) > 2 and diff(clip[-1], clip[-2]) < SAME:
        clip = clip[:-1]
    if kind != 'end':
        while len(clip) > 2 and diff(clip[-1], clip[0]) < SAME:
            clip = clip[:-1]
    return clip


def helmet(img: Image.Image) -> tuple[float, float, float]:
    alpha = img.getchannel('A')
    left, top, right, bottom = img.getbbox()
    best = (0, 0, 0)
    for y in range(top, min(top + 70, bottom)):
        row = [x for x in range(left, right) if alpha.getpixel((x, y)) > 128]
        if row and row[-1] - row[0] > best[0]:
            best = (row[-1] - row[0], row[0], row[-1])
    width, x0, x1 = best
    return width, (x0 + x1) / 2, bottom


def place(img: Image.Image, scale: float, anchor: tuple[float, float]) -> Image.Image:
    size = round(CELL * scale)
    scaled = img.resize((size, size), Image.LANCZOS)
    cell = Image.new('RGBA', (OUT_W, OUT_H))
    ox = round(OUT_W / 2 - anchor[0] * scale)
    oy = round(OUT_H - FOOT_PAD - anchor[1] * scale)
    cell.alpha_composite(scaled.crop((max(0, -ox), max(0, -oy), size, size)), (max(0, ox), max(0, oy)))
    return cell


def main() -> None:
    src, out_dir = Path(sys.argv[1]), Path(sys.argv[2])
    for name, (file, count, kind, every) in CLIPS.items():
        if kind == 'keys':
            source = frames(src / file, count)
            strip = Image.new('RGBA', (OUT_W * len(every), OUT_H))
            for i, index in enumerate(every):
                w, cx, g = helmet(source[index])
                strip.alpha_composite(place(source[index], HELMET / w, (cx, g)), (i * OUT_W, 0))
            strip.save(out_dir / f'zannabi-{name}.webp', quality=88, alpha_quality=90, method=6)
            print(f'{name}: {len(every)} frames, bbox {strip.getbbox()}')
            continue
        clip = trim(frames(src / file, count), kind)
        clip = clip[::every] if (len(clip) - 1) % every == 0 else clip[::every] + [clip[-1]]
        w0, cx0, g0 = helmet(clip[0])
        w1, cx1, g1 = helmet(clip[-1])
        s0, s1 = HELMET / w0, HELMET / w1
        if abs(s1 / s0 - 1) < 0.03:
            s1 = s0
        strip = Image.new('RGBA', (OUT_W * len(clip), OUT_H))
        last = max(1, len(clip) - 1)
        for i, img in enumerate(clip):
            t = i / last
            anchor = (cx0 + (cx1 - cx0) * t, g0 + (g1 - g0) * t)
            strip.alpha_composite(place(img, s0 + (s1 - s0) * t, anchor), (i * OUT_W, 0))
        strip.save(out_dir / f'zannabi-{name}.webp', quality=88, alpha_quality=90, method=6)
        print(f"{name}: {len(clip)} frames, bbox {strip.getbbox()}")


if __name__ == '__main__':
    main()

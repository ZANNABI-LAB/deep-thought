import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter

SCALE, X0, Y0 = 2.08, 176, 164
PIVOT = (384, 652.8)
FRAME = 768
LIMIT = (-60, -60, 360, 254)
EDGE = 12
OUTLINE = (40, 26, 38)
MAX_W = 16000
EVEN = list(range(0, 56, 2))
CLIPS = {
    'idle': ('idleC', EVEN),
    'walk': ('walkB', list(range(0, 28, 2))),
    'turn': ('turnA', list(range(4, 36, 2))),
    'turn-stop': ('stopA', list(range(30, 46, 2))),
    'turn-around': ('aroundB', EVEN[1:-1]),
    'wave': ('waveVB', EVEN[1:23]),
    'look': ('lookA', EVEN[1:-1]),
    'yawn': ('yawnA', EVEN[1:-1]),
    'doze': ('dozeA', EVEN[1:-1]),
    'hop': ('hopA', EVEN[1:-1]),
    'saber': ('saberS1', EVEN[1:-1], 0.8),
    'saber-2': ('saberS3', EVEN[1:-1], 0.8),
    'sit': ('stoolB', EVEN[1:]),
    'read': ('loopPage', EVEN[1:]),
    'read-nod': ('loopNod', EVEN[1:]),
    'stand': ('standA', EVEN[1:-1]),
    'turn-back': ('RbackB', EVEN[:17]),
    'turn-front': ('RfrontA', EVEN[2:23]),
    'breathe': ('RbreatheA', EVEN),
    'look-up': ('RlookupB', EVEN[1:-1]),
    'console': ('RconsoleA', EVEN[1:-1]),
    'console-2': ('RconsoleB', EVEN[1:-1]),
}
WALKERS = {'walk': None, 'turn': ('walkB', 16), 'turn-stop': ('idleC', 0)}


def frames(path: Path) -> list[Image.Image]:
    sheet = Image.open(path).convert('RGBA')
    cols = sheet.width // FRAME
    out = []
    for i in range(cols * (sheet.height // FRAME)):
        cell = sheet.crop((i % cols * FRAME, i // cols * FRAME, i % cols * FRAME + FRAME, i // cols * FRAME + FRAME))
        if cell.getbbox() is None:
            break
        out.append(cell)
    return out


def defringe(img: Image.Image) -> Image.Image:
    a = np.asarray(img).copy()
    eroded = np.asarray(Image.fromarray(a[..., 3]).filter(ImageFilter.MinFilter(3)))
    edge = (a[..., 3] > 0) & (eroded < 200)
    a[edge, 0], a[edge, 1], a[edge, 2] = OUTLINE
    a[..., 3] = np.where(eroded > 0, a[..., 3], 0)
    return Image.fromarray(a)


def fit(s: float) -> tuple[float, float, float]:
    return SCALE * s, PIVOT[0] - (PIVOT[0] - X0) * s, PIVOT[1] - (PIVOT[1] - Y0) * s


def to_cell(frame: Image.Image, r: int, box: list[int], s: float = 1) -> Image.Image:
    scale, x0, y0 = fit(s)
    frame = frame.copy()
    a = np.asarray(frame).copy()
    a[:EDGE, :, 3] = a[-EDGE:, :, 3] = a[:, :EDGE, 3] = a[:, -EDGE:, 3] = 0
    frame = Image.fromarray(a)
    bx, by, bw, bh = box
    k = r / scale
    size = round(FRAME * k)
    im = frame.resize((size, size), Image.LANCZOS)
    out = Image.new('RGBA', (bw * r, bh * r))
    px, py = round(-bx * r - x0 * k), round(-by * r - y0 * k)
    out.alpha_composite(im.crop((max(0, -px), max(0, -py), size, size)), (max(0, px), max(0, py)))
    return defringe(out)


def advance(seq: list[Image.Image], after: Image.Image | None) -> list[int]:
    a = [np.asarray(f).astype(float)[630:657] for f in seq + ([after] if after else [])]
    out = []
    for k in range(len(seq)):
        pa, pb = a[k], a[(k + 1) % len(a)]
        ma = pa[..., 3] > 128
        best = None
        for dx in range(-40, 6):
            sh = np.roll(pb, -dx, axis=1)
            mb = sh[..., 3] > 128
            m = ma & mb
            if m.sum() < 60:
                continue
            err = np.abs(pa[..., :3] - sh[..., :3]).sum(2)[m].mean() + (ma ^ mb).sum() * 0.5 / max(1, ma.sum()) * 255
            if best is None or err < best[0]:
                best = (err, dx)
        out.append(max(0, round(-best[1] / SCALE)) if best else 0)
    return out


def main() -> None:
    raw, out, only = Path(sys.argv[1]), Path(sys.argv[2]), set(sys.argv[3:])
    meta = json.loads((out / 'zannabi-v4.json').read_text()) if only else {}
    for name, (src, idx, *rest) in CLIPS.items():
        s = rest[0] if rest else 1
        scale, x0, y0 = fit(s)
        if only and name not in only:
            continue
        seq = [frames(raw / f'{src}.png')[i] for i in idx]
        boxes = [f.getbbox() for f in seq]
        ux0 = (min(b[0] for b in boxes) - x0) / scale
        uy0 = (min(b[1] for b in boxes) - y0) / scale
        ux1 = (max(b[2] for b in boxes) - x0) / scale
        uy1 = (max(b[3] for b in boxes) - y0) / scale
        bx, by = max(LIMIT[0], min(0, int(np.floor(ux0)) - 2)), max(LIMIT[1], min(0, int(np.floor(uy0)) - 2))
        box = [bx, by, min(LIMIT[2], max(200, int(np.ceil(ux1)) + 2)) - bx, min(LIMIT[3], max(240, int(np.ceil(uy1)) + 2)) - by]
        entry = {'frames': len(seq), 'box': box, 'cols': []}
        if name in WALKERS:
            after = WALKERS[name] and frames(raw / f'{WALKERS[name][0]}.png')[WALKERS[name][1]]
            entry['advance'] = advance(seq, after)
        for r in (1, 2):
            cells = [to_cell(f, r, box, s) for f in seq]
            fw, fh = box[2] * r, box[3] * r
            cols = max(1, min(len(cells), MAX_W // fw))
            sheet = Image.new('RGBA', (fw * cols, fh * -(-len(cells) // cols)))
            for i, c in enumerate(cells):
                sheet.alpha_composite(c, ((i % cols) * fw, (i // cols) * fh))
            sheet.save(out / f"zannabi-{name}{'@2x' if r == 2 else ''}.webp", quality=88, alpha_quality=90, method=6)
            entry['cols'].append(cols)
        meta[name] = entry
        print(name, entry)
    (out / 'zannabi-v4.json').write_text(json.dumps(meta, indent=1))


if __name__ == '__main__':
    main()

"""우주선 창틀 GPT 그림 → 2px 격자 픽셀 아트 PNG + 늘이는 이음 위치.

python3 art/scripts/window_frame.py <원본 .png> <창틀 .png> <불빛 .png>
원본은 art/refs/concept/window-frame-gpt-v2.png (1672×941, 창 안쪽 투명).
1. 2×2 평균으로 836×470 격자에 맞추고, 반투명 경계는 50%에서 자른다.
2. GPT가 그린 가짜 글자 판 4곳은 줄마다 어두운 색으로 채워 빈 홈으로 만든다.
3. 색을 줄인다. 면적이 작은 주황 표시등은 따로 줄여야 회색으로 묻히지 않는다.
4. 주황 표시등은 창틀에서 꺼진 색으로 바꾸고, 켜진 불빛만 따로 불빛 PNG로 뺀다. 웹에서 깜빡이게 한다.
5. 화면 비율에 맞춰 늘릴 때 복제할 열 2개·행 2개와 불빛 위치를 출력한다 (WindowFrame.tsx의 SEAMS·LIGHTS).
"""

import json
import sys

import numpy as np
from PIL import Image

W, H = 836, 470
FAKE_TEXT = [(201, 3, 245, 11), (592, 3, 635, 11), (206, 429, 247, 438), (586, 429, 632, 437)]
STEEL_COLORS = 40
WARM_COLORS = 8
TOP, BOTTOM, SIDE = 22, 406, 48  # 창 안쪽 경계 (대략)
LIGHT_GAP = 6  # 이만큼 가까운 주황 픽셀은 같은 표시등
UNLIT = (0.32, 0.22, 0.2)  # 꺼진 표시등 = 켜진 색에 채널별로 곱한다


def downscale(src: Image.Image) -> np.ndarray:
    a = np.asarray(src.convert('RGBA')).astype(float) / 255
    a[..., :3] *= a[..., 3:4]
    a = a[: H * 2, : W * 2].reshape(H, 2, W, 2, 4).mean(axis=(1, 3))
    alpha = a[..., 3]
    rgb = np.where(alpha[..., None] > 0, a[..., :3] / np.maximum(alpha[..., None], 1e-6), 0)
    return np.dstack([rgb * 255, (alpha > 0.5) * 255]).round().clip(0, 255).astype(np.uint8)


def erase_fake_text(px: np.ndarray) -> None:
    for x0, y0, x1, y1 in FAKE_TEXT:
        block = px[y0:y1, x0:x1, :3].astype(float)
        lum = block.mean(axis=2)
        for r in range(block.shape[0]):
            dark = lum[r] <= np.percentile(lum[r], 30)
            px[y0 + r, x0:x1, :3] = block[r][dark].mean(axis=0).round()


def warm_mask(px: np.ndarray) -> np.ndarray:
    r, g, b = (px[..., i].astype(int) for i in range(3))
    return (px[..., 3] > 0) & (r > b + 40) & (r > 110)


def quantize(px: np.ndarray) -> None:
    opaque = px[..., 3] > 0
    warm = warm_mask(px)
    for mask, colors in ((opaque & ~warm, STEEL_COLORS), (warm, WARM_COLORS)):
        if not mask.any():
            continue
        strip = Image.fromarray(px[mask][:, :3][None, :, :])
        reduced = strip.quantize(colors, method=Image.Quantize.MEDIANCUT).convert('RGB')
        px[mask, :3] = np.asarray(reduced)[0]


def flatness(lines: np.ndarray) -> np.ndarray:
    """이웃 줄과의 차이. 작을수록 그 줄을 복제해도 티가 안 난다"""
    d = np.abs(np.diff(lines.astype(int), axis=0)).sum(axis=(1, 2))
    score = np.full(len(lines), np.inf)
    score[1:-1] = d[:-1] + d[1:]
    return score


def find_seams(px: np.ndarray) -> dict:
    rgb = px[..., :3]
    cols = np.concatenate([rgb[:TOP], rgb[BOTTOM:]], axis=0).transpose(1, 0, 2)  # 위·아래 띠의 열
    rows = np.concatenate([rgb[:, :SIDE], rgb[:, W - SIDE :]], axis=1)  # 좌우 띠의 행
    cs, rs = flatness(cols), flatness(rows)

    def best(score: np.ndarray, lo: int, hi: int) -> int:
        return int(lo + np.argmin(score[lo:hi]))

    # 가운데 패널·모서리·좌우 표시등을 피해 양쪽에 하나씩
    return {
        'x': [best(cs, 120, 330), best(cs, W - 330, W - 120)],
        'y': [best(rs, 70, 150), best(rs, 220, 360)],
    }


def split_lights(px: np.ndarray) -> tuple[np.ndarray, list[list[int]]]:
    """켜진 불빛만 남긴 그림과 표시등마다 [x, y, w, h]. 창틀의 불빛은 꺼진 색으로 바꾼다"""
    warm = warm_mask(px)
    lights = np.zeros_like(px)
    lights[warm] = px[warm]
    px[warm, :3] = (px[warm, :3] * np.array(UNLIT)).round().astype(np.uint8)

    # 픽셀 하나씩 상자로 시작해, 가까운 상자끼리 더 합칠 게 없을 때까지 합친다
    boxes = [[x, y, x, y] for y, x in zip(*np.where(warm))]
    merged = True
    while merged:
        merged = False
        for i, a in enumerate(boxes):
            for b in boxes[i + 1 :]:
                if a[0] - LIGHT_GAP <= b[2] and b[0] - LIGHT_GAP <= a[2] and a[1] - LIGHT_GAP <= b[3] and b[1] - LIGHT_GAP <= a[3]:
                    a[:] = [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]
                    boxes.remove(b)
                    merged = True
                    break
            if merged:
                break
    rects = sorted([int(x0), int(y0), int(x1 - x0 + 1), int(y1 - y0 + 1)] for x0, y0, x1, y1 in boxes)
    return lights, rects


def main() -> None:
    src, frame_out, lights_out = sys.argv[1:4]
    px = downscale(Image.open(src))
    erase_fake_text(px)
    quantize(px)
    lights, rects = split_lights(px)
    Image.fromarray(px, 'RGBA').save(frame_out, optimize=True)
    Image.fromarray(lights, 'RGBA').save(lights_out, optimize=True)
    print(json.dumps({'size': [W, H], 'seams': find_seams(px), 'lights': rects}))


if __name__ == '__main__':
    main()

"""홈 가운데 로고 GPT 그림 → 픽셀 아트 PNG 세 장 (배경 투명): 바탕·반짝이·토성.

python3 art/scripts/logo.py <원본 .png> <출력 폴더>
원본은 art/refs/concept/logo-gpt-v1.png (1808×870, 검정 배경). 정확한 도트 격자가 없는 GPT 그림이라
작은 문구의 획(약 4.3px)이 한 칸이 되도록 420px 폭으로 줄이고, 색을 크림·보라·배경 셋에 맞춘다.
반짝이와 토성은 따로 움직이도록 바탕에서 빼서 각자 한 장에 담는다. 위치는 출력 JSON을
components/space/HomeLogo.tsx의 SPARKLES·PLANET으로 옮긴다. 화면에서는 창틀 도트와 같은 크기로 키운다.
"""

import json
import sys
from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image

WIDTH = 420
CREAM = (250, 232, 188)
PURPLE = (154, 126, 176)
BACKGROUND = (0, 0, 0)

# 따로 움직일 조각이 들어 있는 상자 [x, y, w, h]. 이 안에 통째로 들어가는 덩어리만 그 조각이 된다
SPARKLE_BOXES = [
    (61, 25, 7, 10),  # 위 문구 왼쪽 마름모
    (353, 25, 7, 10),  # 위 문구 오른쪽 마름모
    (81, 57, 14, 15),
    (94, 78, 7, 7),
    (37, 141, 14, 14),
    (368, 81, 15, 15),
    (319, 64, 6, 7),  # 토성 옆 작은 별
]
PLANET_BOX = (316, 61, 47, 28)


def pixelate(src: Image.Image) -> np.ndarray:
    height = round(src.height * WIDTH / src.width)
    small = np.asarray(src.convert('RGB').resize((WIDTH, height), Image.BOX)).astype(float)
    colors = np.array([CREAM, PURPLE, BACKGROUND], float)
    nearest = ((small[:, :, None, :] - colors[None, None]) ** 2).sum(-1).argmin(-1)
    out = np.zeros((height, WIDTH, 4), np.uint8)
    out[..., :3] = colors[nearest]
    out[..., 3] = np.where(nearest == 2, 0, 255)
    return out


def components(opaque: np.ndarray) -> list[tuple[tuple[int, int, int, int], list[tuple[int, int]]]]:
    """8방향으로 이어진 덩어리마다 (상자, 픽셀들)"""
    h, w = opaque.shape
    seen = np.zeros_like(opaque)
    found = []
    for y, x in zip(*np.where(opaque)):
        if seen[y, x]:
            continue
        seen[y, x] = True
        queue, pixels = deque([(y, x)]), []
        while queue:
            cy, cx = queue.popleft()
            pixels.append((cy, cx))
            for ny in range(cy - 1, cy + 2):
                for nx in range(cx - 1, cx + 2):
                    if 0 <= ny < h and 0 <= nx < w and opaque[ny, nx] and not seen[ny, nx]:
                        seen[ny, nx] = True
                        queue.append((ny, nx))
        ys, xs = zip(*pixels)
        found.append(((min(xs), min(ys), max(xs) - min(xs) + 1, max(ys) - min(ys) + 1), pixels))
    return found


def inside(box: tuple[int, int, int, int], outer: tuple[int, int, int, int]) -> bool:
    x, y, w, h = box
    ox, oy, ow, oh = outer
    return ox <= x and oy <= y and x + w <= ox + ow and y + h <= oy + oh


def main() -> None:
    src, out_dir = sys.argv[1], Path(sys.argv[2])
    px = pixelate(Image.open(src))
    base, sparkles, planet = px.copy(), np.zeros_like(px), np.zeros_like(px)
    for box, pixels in components(px[..., 3] > 0):
        if any(inside(box, s) for s in SPARKLE_BOXES):
            layer = sparkles
        elif inside(box, PLANET_BOX):
            layer = planet
        else:
            continue
        for y, x in pixels:
            layer[y, x] = px[y, x]
            base[y, x] = 0
    for name, layer in (('home-logo', base), ('home-logo-sparkles', sparkles), ('home-logo-planet', planet)):
        Image.fromarray(layer, 'RGBA').save(out_dir / f'{name}.png', optimize=True)
    print(json.dumps({'size': [WIDTH, px.shape[0]], 'sparkles': SPARKLE_BOXES, 'planet': PLANET_BOX}))


if __name__ == '__main__':
    main()

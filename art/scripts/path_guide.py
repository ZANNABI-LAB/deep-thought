"""
돌길 가이드 그림: 섬 바닥 그림 위에 돌길 띠(주황)·건물 받침판 자리(빨강)·사용 지점(흰 점)을 그린다. GPT에 바닥 그림과 함께 넘긴다.
입력은 tools/path_guide.tscn이 내보낸 JSON (바닥 그림 픽셀 좌표).

사용: python3 art/scripts/path_guide.py <guide.json> <floor.png> <출력.png> [--labels]
"""
import json
import math
import sys

from PIL import Image, ImageDraw, ImageFont

NAMES = {'READING': 'DOME', 'PROJECTS': 'ROCKET', 'WRITING': 'WRITING', 'ASK': 'TERMINAL', 'ARCADE': 'ARCADE', 'LAB': 'ANTENNA'}


def band(line, width, k):
    """중심선 양옆으로 width/2만큼 띄운 다각형. 픽셀을 바닥 단위(등방)로 바꿔 계산하고 되돌린다"""
    pts = [(x / k[0], y / k[1]) for x, y in line]
    left, right = [], []
    for i, (x, y) in enumerate(pts):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, len(pts) - 1)]
        dx, dy = b[0] - a[0], b[1] - a[1]
        n = math.hypot(dx, dy) or 1.0
        ox, oy = -dy / n * width / 2, dx / n * width / 2
        left.append(((x + ox) * k[0], (y + oy) * k[1]))
        right.append(((x - ox) * k[0], (y - oy) * k[1]))
    return left + right[::-1]


def hull(pts):
    """볼록 껍질 (받침판 테두리만 잡힌 건물도 속까지 채운다)"""
    pts = sorted(set(map(tuple, pts)))
    def half(ps):
        h = []
        for p in ps:
            while len(h) >= 2 and (h[-1][0] - h[-2][0]) * (p[1] - h[-2][1]) - (h[-1][1] - h[-2][1]) * (p[0] - h[-2][0]) <= 0:
                h.pop()
            h.append(p)
        return h
    lo, hi = half(pts), half(pts[::-1])
    return lo[:-1] + hi[:-1]


def main():
    src, floor_path, out = sys.argv[1:4]
    labels = '--labels' in sys.argv
    d = json.load(open(src))
    k = d['px_per_unit']
    base = Image.open(floor_path).convert('RGBA')
    over = Image.new('RGBA', base.size, (0, 0, 0, 0))
    g = ImageDraw.Draw(over)
    for p in d['paths'].values():
        g.polygon(hull(p['solid']), fill=(230, 40, 40, 150))
    for p in d['paths'].values():
        g.polygon(band(p['line'], d['width'], k), fill=(255, 150, 0, 170))
        g.line([tuple(q) for q in p['line']], fill=(255, 240, 200, 255), width=2)
        x, y = p['door']
        g.ellipse((x - 5, y - 5, x + 5, y + 5), fill=(255, 255, 255, 255), outline=(0, 0, 0, 255))
    img = Image.alpha_composite(base, over)
    if labels:
        g = ImageDraw.Draw(img)
        try:
            font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 18)
        except OSError:
            font = ImageFont.load_default()
        for name, p in d['paths'].items():
            xs = [q[0] for q in p['solid']]
            ys = [q[1] for q in p['solid']]
            cx, cy = sum(xs) / len(xs), sum(ys) / len(ys)
            g.text((cx, cy), NAMES.get(name, name), fill=(255, 255, 255, 255), font=font, anchor='mm', stroke_width=3, stroke_fill=(0, 0, 0, 255))
    img.save(out)
    print('GUIDE', out, img.size)


main()

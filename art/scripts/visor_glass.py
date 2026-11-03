"""
Zannabi 얼굴 창 유리 메시: art/blender/visor_scan.py가 잰 정면 깊이·색에서 얼굴 창(헬멧의 밝은 무채색이 아닌 곳:
검은 테두리·살색 얼굴·선글라스)을 가운데에서 이어지는 만큼 골라 그 모양 그대로 유리를 만든다.
출력은 Godot 좌표(키 1.8, 앞 +Z) OBJ (apps/universe-godot/assets/zannabi/visor_v3.obj, ZannabiLook이 머리 뼈에 붙인다).

곡면 (2026-11-03 피드백: 측면의 평평한 수직 구간·위아래 꺾임 없이, 이마 테두리부터 턱 테두리까지 매끄럽게 볼록한 곡선):
- 하나의 타원체 캡을 창 테두리 깊이(흰 테두리 안쪽으로 TUCK)에 맞춘다: 어느 단면도 매끄러운 볼록 곡선
- 높이는 코·선글라스와 CLEAR 이상 떨어지게 (얼굴은 줄이거나 옮기지 않는다)
- 법선은 메시 면에서 계산 (깊이 격자 기울기는 가장자리에서 틀어져 셰이딩이 각져 보였다)

사용: python3 art/scripts/visor_glass.py <scan.json> <출력.obj> [미리보기.png|-]
"""
import json
import sys
from collections import deque

import numpy as np

# 헬멧 색: 밝고(가장 어두운 채널 > HELMET_MIN) 무채색(채널 차 < HELMET_SAT). 깊이로는 못 가른다 (헬멧 앞면이 납작해 구 맞춤이 어긋남)
HELMET_MIN = 120
HELMET_SAT = 24
SEED = (0.0, 1.34)  # 얼굴 창 가운데
GROW = 3           # 창을 칸 수만큼 넓혀 흰 테두리 안쪽에 겹친다 (접합부 숨김)
TUCK = 0.008       # 가장자리는 테두리 면보다 이만큼 뒤
CLEAR = 0.03       # 코·선글라스와 유리 사이 최소 여유
RINGS, SPOKES = 24, 128   # 방사형 메시 (격자 메시는 가장자리가 계단져 보였다)
SMOOTH_SPOKES = 5  # 각도별 창 반지름을 고르게
MARGIN = 0.02      # 창 가장자리보다 이만큼 더 뻗어 흰 테두리 안쪽에 숨긴다


def grow(m, n):
    for _ in range(n):
        g = m.copy()
        g[1:] |= m[:-1]; g[:-1] |= m[1:]; g[:, 1:] |= m[:, :-1]; g[:, :-1] |= m[:, 1:]
        m = g
    return m


src, out = sys.argv[1], sys.argv[2]
d = json.load(open(src))
D = np.array([[np.nan if v is None else v for v in r] for r in d['depth']])
C = np.array([[[255, 255, 255] if v is None else v for v in r] for r in d['rgb']], int)
helmet = (C.min(2) > HELMET_MIN) & (C.max(2) - C.min(2) < HELMET_SAT)
st = d['step']
xs = d['x0'] + np.arange(d['nx']) * st
ys = d['y0'] + np.arange(d['ny']) * st
X, Y = np.meshgrid(xs, ys)

# 얼굴 창: 가운데에서 이어진 헬멧 아닌 칸. 행마다 좌우 끝 사이를 채워 작은 구멍(선글라스 반사 등)을 메운다
core = np.zeros(D.shape, bool)
sj, si = round((SEED[1] - d['y0']) / st), round((SEED[0] - d['x0']) / st)
q = deque([(sj, si)])
while q:
    j, i = q.popleft()
    if j < 0 or i < 0 or j >= D.shape[0] or i >= D.shape[1] or core[j, i] or helmet[j, i] or np.isnan(D[j, i]):
        continue
    core[j, i] = True
    q.extend([(j + 1, i), (j - 1, i), (j, i + 1), (j, i - 1)])
for j in range(core.shape[0]):
    idx = np.where(core[j])[0]
    if len(idx):
        core[j, idx[0]:idx[-1] + 1] = True
mask = grow(core, GROW)

# 곡면 = 타원체 캡 z = z0 + h·√(1 - ((x-cx)/a)² - ((y-cy)/b)²). 창 테두리(창 바로 바깥 헬멧 칸) 깊이에 맞춘다:
# a·b는 격자로 찾고 z0·h는 최소제곱. 어느 단면도 매끄러운 볼록 곡선이 된다.
# (테두리 깊이를 창 안으로 퍼뜨린 바탕면 + 돔은 옆쪽 깊은 테두리 쪽으로 가운데가 꺼져 S자로 꺾였다)
ring = grow(mask, 1) & ~mask & ~np.isnan(D)
rj, ri = np.where(ring)
mj, mi = np.where(mask)
cj, ci = np.where(core)
cx, cy = X[cj, ci].mean(), Y[cj, ci].mean()
ax = (X[cj, ci].max() - X[cj, ci].min()) / 2
ay = (Y[cj, ci].max() - Y[cj, ci].min()) / 2
zr = D[rj, ri] - TUCK


def cap(a, b, x, y):
    return np.sqrt(np.clip(1 - ((x - cx) / a) ** 2 - ((y - cy) / b) ** 2, 0, 1))


best = None
for a in np.linspace(ax * 1.0, ax * 2.5, 31):
    for b in np.linspace(ay * 1.0, ay * 3.0, 41):
        sr = cap(a, b, X[rj, ri], Y[rj, ri])
        A = np.c_[np.ones_like(sr), sr]
        (z0, h), *_ = np.linalg.lstsq(A, zr, rcond=None)
        err = np.abs(A @ np.array([z0, h]) - zr).mean()
        if h > 0 and (best is None or err < best[0]):
            best = (err, a, b, z0, h)
err, a, b, z0, h = best
sm = cap(a, b, X[mj, mi], Y[mj, mi])
# 코·선글라스와 CLEAR 이상: 부족하면 h를 키운다 (얼굴은 그대로)
inner = core[mj, mi] & ~np.isnan(D[mj, mi]) & (sm > 0.3)
need = np.max((D[mj, mi][inner] + CLEAR - z0) / sm[inner])
h_fit = h
h = max(h, need)
Z = np.full(D.shape, np.nan)
Z[mj, mi] = z0 + h * sm
gap = (Z[mj, mi] - D[mj, mi])[inner]
edge_err = (z0 + h * cap(a, b, X[rj, ri], Y[rj, ri])) - zr
print('CAP a %.3f b %.3f (창 반폭 %.3f, %.3f) z0 %.3f h %.3f (맞춤 %.3f) 테두리 오차 평균 %.3f 최대 앞 %.3f  얼굴 여유 최소 %.3f' % (
    a, b, ax, ay, z0, h, h_fit, err, edge_err.max(), gap.min()))

# 메시: 창 가운데에서 방사형 (고리 RINGS × 각도 SPOKES). 가장자리가 격자 계단 없이 매끄러운 곡선이 된다.
# 각도마다 창(core) 가장자리까지 거리를 재서 고르게 다듬고, MARGIN만큼 흰 테두리 안쪽으로 더 뻗는다 (접합부 숨김)
r_core = []
for th in np.linspace(0, 2 * np.pi, SPOKES, endpoint=False):
    r = 0.0
    while True:
        x, y = cx + (r + st) * np.cos(th), cy + (r + st) * np.sin(th)
        jj, ii = round((y - d['y0']) / st), round((x - d['x0']) / st)
        if jj < 0 or ii < 0 or jj >= D.shape[0] or ii >= D.shape[1] or not core[jj, ii]:
            break
        r += st
    r_core.append(r)
r_core = np.array(r_core)
k = np.ones(SMOOTH_SPOKES) / SMOOTH_SPOKES
r_core = np.convolve(np.r_[r_core[-SMOOTH_SPOKES:], r_core, r_core[:SMOOTH_SPOKES]], k, 'same')[SMOOTH_SPOKES:-SMOOTH_SPOKES]
verts, uvs = [], []
for ring_k in range(RINGS + 1):
    f = ring_k / RINGS
    for s_k, th in enumerate(np.linspace(0, 2 * np.pi, SPOKES, endpoint=False)):
        r = f * (r_core[s_k] + MARGIN)
        x, y = cx + r * np.cos(th), cy + r * np.sin(th)
        z = z0 + h * cap(a, b, x, y) - TUCK * max(0.0, (r - r_core[s_k]) / MARGIN)   # 테두리 밖은 헬멧 면 뒤로
        verts.append((x, y, z))
        uvs.append((max(0.0, r_core[s_k] - r), 0.0))
        if ring_k == 0:
            break   # 가운데 한 점
faces = []
for s_k in range(SPOKES):
    faces.append((0, 1 + s_k, 1 + (s_k + 1) % SPOKES))
for ring_k in range(1, RINGS):
    base0, base1 = 1 + (ring_k - 1) * SPOKES, 1 + ring_k * SPOKES
    for s_k in range(SPOKES):
        n = (s_k + 1) % SPOKES
        faces.append((base0 + s_k, base1 + s_k, base1 + n))
        faces.append((base0 + s_k, base1 + n, base0 + n))
V = np.array(verts)
N = np.zeros_like(V)
for t in faces:
    n = np.cross(V[t[1]] - V[t[0]], V[t[2]] - V[t[0]])
    for k in t:
        N[k] += n
N /= np.maximum(np.linalg.norm(N, axis=1, keepdims=True), 1e-9)
N[N[:, 2] < 0] *= -1   # 앞(+Z)을 향하게
with open(out, 'w') as f:
    f.write('# Zannabi v3 visor glass (art/scripts/visor_glass.py)\n')
    for v in verts:
        f.write('v %.4f %.4f %.4f\n' % v)
    for n in N:
        f.write('vn %.4f %.4f %.4f\n' % tuple(n))
    for uv in uvs:
        f.write('vt %.4f %.4f\n' % uv)
    for t in faces:
        f.write('f %s %s %s\n' % tuple('%d/%d/%d' % (k + 1, k + 1, k + 1) for k in t))
print('VISOR', len(verts), 'verts', len(faces), 'tris', 'z %.3f..%.3f' % (V[:, 2].min(), V[:, 2].max()))

if len(sys.argv) > 3 and sys.argv[3] != '-':
    # 측면 단면 그래프: 창 가운데 세로 단면의 유리(파랑)·얼굴과 헬멧(빨강) 깊이
    from PIL import Image, ImageDraw
    img = Image.new('RGB', (600, 600), 'white')
    g = ImageDraw.Draw(img)
    ci0 = round((cx - d['x0']) / st)
    toxy = lambda y, z: (300 + (z - 0.25) * 1500, 560 - (y - 1.0) * 1000)
    for j in range(D.shape[0]):
        if mask[j, ci0]:
            g.point(toxy(Y[j, ci0], Z[j, ci0]), fill=(0, 0, 255))
        if not np.isnan(D[j, ci0]):
            g.point(toxy(Y[j, ci0], D[j, ci0]), fill=(220, 0, 0))
    img.save(sys.argv[3])

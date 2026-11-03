"""
Zannabi 동작 정의 (대기·걷기·점프·달리며 점프·인사) — art/blender/rig_zannabi_v3.py가 불러 쓴다.

자세는 "뼈 이름 + 아마추어 축 기준 회전"으로 적는다 (hips, spine, chest, head, upper_arm/forearm/hand.L·R, thigh/shin/foot.L·R).
- 키프레임마다 메시의 가장 낮은 점을 바닥(z=0)에 맞출 수 있다 (GROUND)
- 동작 이름 끝의 -loop는 Godot가 가져올 때 반복 재생으로 설정한다
"""
import math

import bpy
from mathutils import Matrix

FPS = 30


def world_rot(rig, bone, axis, deg):
    """아마추어 축 기준 회전을 뼈 로컬 회전(쿼터니언)으로."""
    m = rig.data.bones[bone].matrix_local.to_3x3()
    r = Matrix.Rotation(math.radians(deg), 3, axis)
    return (m.inverted() @ r @ m).to_quaternion()


GROUND = 'ground'   # hips_z 대신 이 값을 주면 메시의 가장 낮은 점이 바닥(z=0)에 닿도록 골반 높이를 맞춘다


def pose_bones(rig, poses, hips_z):
    """poses: {뼈: [(축, 각도), ...]} 아마추어 축 기준. 나머지 뼈는 기본 자세."""
    for pb in rig.pose.bones:
        q = None
        for axis, deg in poses.get(pb.name, []):
            r = world_rot(rig, pb.name, axis, deg)
            q = r if q is None else r @ q
        pb.rotation_mode = 'QUATERNION'
        pb.rotation_quaternion = q if q is not None else (1, 0, 0, 0)
    # hips 뼈는 위(+Z)를 향하므로 로컬 Y가 아마추어 Z다
    rig.pose.bones['hips'].location = (0, hips_z, 0)


def lowest_z(mesh):
    dg = bpy.context.evaluated_depsgraph_get()
    ev = mesh.evaluated_get(dg)
    me = ev.to_mesh()
    z = min((ev.matrix_world @ v.co).z for v in me.vertices)
    ev.to_mesh_clear()
    return z


def key(rig, mesh, frame, poses, hips_z=0.0):
    """hips_z: 숫자, GROUND(접지), (GROUND, 추가 높이)(체공: 접지 자세 기준으로 그만큼 띄움)"""
    lift = 0.0
    if isinstance(hips_z, tuple):
        hips_z, lift = hips_z
    if hips_z == GROUND:
        # 동작(이미 넣은 키)이나 앞서 만든 동작의 NLA 트랙이 연결된 채로 평가하면 손으로 잡은 자세를 덮어쓴다.
        # 잠시 모두 끄고 잰다
        ad = rig.animation_data
        act, use_nla = ad.action, ad.use_nla
        ad.action, ad.use_nla = None, False
        pose_bones(rig, poses, 0.0)
        bpy.context.view_layer.update()
        hips_z = -lowest_z(mesh) + lift
        ad.action, ad.use_nla = act, use_nla
    pose_bones(rig, poses, hips_z)
    for pb in rig.pose.bones:
        pb.keyframe_insert('rotation_quaternion', frame=frame)
    rig.pose.bones['hips'].keyframe_insert('location', frame=frame)
    return hips_z


def action(rig, mesh, name, frames, loop, interpolation='BEZIER'):
    act = bpy.data.actions.new(name + ('-loop' if loop else ''))
    act.use_fake_user = True
    rig.animation_data_create()
    rig.animation_data.action = act
    lifts = [round(key(rig, mesh, f, poses, hz), 3) for f, poses, hz in frames]
    print('ACTION', name, 'hips', lifts)
    for fc in act.fcurves:
        for kp in fc.keyframe_points:
            kp.interpolation = interpolation
    track = rig.animation_data.nla_tracks.new()
    track.name = act.name
    track.strips.new(act.name, int(frames[0][0]), act)
    rig.animation_data.action = None
    return act


# 넓적다리·정강이 길이. rig_zannabi_v3.py가 실제 뼈 길이로 바꾼다
THIGH = 0.16
SHIN = 0.14


def planted(drop):
    """골반을 drop만큼 내릴 때 발이 제자리·바닥에 평평하게 있도록 하는 (thigh, shin, foot) 각도.
    thigh는 앞으로(-), shin은 그 아래를 뒤로 접는다. 발 끝이 골반 바로 아래에 오게 푼다."""
    best = None
    for i in range(0, 900):
        a = math.radians(i / 10)
        sb = THIGH / SHIN * math.sin(a)
        if sb >= 1:
            break
        b = math.asin(sb)
        err = abs(THIGH * math.cos(a) + SHIN * math.cos(b) - (THIGH + SHIN - drop))
        if best is None or err < best[0]:
            best = (err, math.degrees(a), math.degrees(b))
    _, a, b = best
    return -a, a + b, -b


def legs(side, thigh, shin=0.0, foot=0.0):
    return {f'thigh.{side}': [('X', thigh)], f'shin.{side}': [('X', shin)], f'foot.{side}': [('X', foot)]}


def merge(*ps):
    out = {}
    for p in ps:
        for k, v in p.items():
            out[k] = out.get(k, []) + v
    return out


def scaled(p, k):
    return {b: [(ax, d * k) for ax, d in v] for b, v in p.items()}


IDLE_FRAMES = 120   # 4초


def idle(rig, mesh):
    """숨쉬기(2초 × 2) + 느린 체중 이동. 후반에 고개를 갸웃하며 옆을 두리번거린다(원숭이의 호기심)."""
    def pose(t):
        s = math.sin(t * 4 * math.pi)                 # 숨쉬기 2번
        w = math.sin(t * 2 * math.pi + 0.8)           # 체중 이동 1번
        # 2.0~3.8초: 고개를 오른쪽으로 돌리며 갸웃 → 돌아옴
        look = _smooth(min(max((t - 0.5) / 0.12, 0.0), 1.0)) * (1 - _smooth(min(max((t - 0.8) / 0.15, 0.0), 1.0)))
        return ({
            'hips': [('Y', 1.5 * w)],
            'spine': [('Y', -1.0 * w)],
            'chest': [('X', 2.5 * s)],
            'head': [('X', -1.5 * s), ('Z', 2 * math.sin(t * 2 * math.pi + 1.6) + 16 * look), ('Y', -0.8 * w - 9 * look)],
            'upper_arm.L': [('Y', -4 * s), ('X', 2 * w)],
            'upper_arm.R': [('Y', 4 * s), ('X', -2 * w - 6 * look)],
            'forearm.L': [('X', -4 - 2 * s)],
            'forearm.R': [('X', -4 - 2 * s - 8 * look)],
        }, GROUND)
    return action(rig, mesh, 'idle', [(f, *pose(f / IDLE_FRAMES)) for f in range(0, IDLE_FRAMES + 1, 6)], True)


# 걷기 = 달 걸음: 한 발씩 디딜 때마다 두 발이 다 떠오르는 체공이 있는 느릿한 깡충 걸음 (2026-10-30 사용자 요청)
# 디딘 발은 이동 속도와 같은 속도로 뒤로 가서 미끄러지지 않는다.
# 2026-11-02 "총총총 말고 통~ 통~": 걸음 수를 줄이고(한 걸음 0.5초) 짧게 디딘 뒤 길고 높게 떠서 한 걸음에 멀리 간다.
# 다리가 짧아(0.3) 디딘 동안 가는 거리는 작으므로, 거리 대부분은 체공 중에 간다. 게임은 이 속도 그대로 재생한다
WALK_FRAMES = 30          # 한 주기(두 걸음) 1초
WALK_CONTACT = 0.24       # 한 걸음(반 주기) 중 발이 바닥에 닿아 있는 비율. 나머지는 두 발이 다 뜬 체공
WALK_HALF_STRIDE = 0.17
WALK_FLIGHT = 0.4         # 체공 중 최대 높이
WALK_SPEED = 2 * WALK_HALF_STRIDE / (WALK_FRAMES * 0.5 * WALK_CONTACT / FPS)   # 발이 미끄러지지 않는 이동 속도 (단위/초)


def _smooth(u):
    return u * u * (3 - 2 * u)


def thigh_for(y, shin_deg):
    """발목이 골반보다 y만큼 뒤(+)에 오게 하는 넓적다리 각도(도). 무릎을 shin_deg만큼 굽힌 두 뼈로 푼다.
    발은 바닥과 평평하게 유지하므로 발목 아래(발)는 앞뒤 위치에 영향이 없다."""
    lo, hi = -80.0, 80.0
    for _ in range(40):
        mid = (lo + hi) / 2
        t = math.radians(mid)
        if THIGH * math.sin(t) + SHIN * math.sin(t + math.radians(shin_deg)) < y:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def moon_leg(p):
    """(thigh, shin, foot). p: 0~1, 앞쪽 접지에서 시작. 디딤은 주기의 WALK_CONTACT/2"""
    c = WALK_CONTACT * 0.5
    if p < c:
        u = p / c
        y = -WALK_HALF_STRIDE + 2 * WALK_HALF_STRIDE * u
        # 디디며 무릎을 굽혀 받았다가 펴며 밀어 올린다(우주복 무게 + 낮은 중력)
        shin = 36 * math.sin(math.pi * u)
        thigh = thigh_for(y, shin)
        return thigh, shin, -(thigh + shin)
    u = (p - c) / (1 - c)
    y = WALK_HALF_STRIDE - 2 * WALK_HALF_STRIDE * _smooth(u)
    lift = math.sin(math.pi * u)
    shin = 40 * lift
    thigh = thigh_for(y, shin) - 16 * lift
    return thigh, shin, -(thigh + shin) + 12 * lift * lift


def walk(rig, mesh):
    """달 걸음: 디딜 때마다 둥실 떠오르고 천천히 내려온다. 팔은 바깥으로 벌려 균형을 잡고, 헬멧은 한 박자 늦게."""
    def pose(t):
        lt, ls, lf = moon_leg(t % 1.0)
        rt, rs, rf = moon_leg((t + 0.5) % 1.0)
        ph = t * 2 * math.pi
        a = math.cos(ph - 0.5)                  # 1: 왼다리가 앞 (팔은 살짝 늦게)
        q = (t % 0.5) / 0.5
        # 체공: 디딘 발을 떼는 순간부터 다음 발을 디딜 때까지. 빨리 올라가서 정점 근처에 오래 머물다 내려온다 (통~)
        fly = 0.0 if q < WALK_CONTACT else math.sin(math.pi * ((q - WALK_CONTACT) / (1 - WALK_CONTACT)) ** 0.85) ** 0.7
        return (merge(
            legs('L', lt, ls, lf), legs('R', rt, rs, rf),
            {
                # 팔은 몸 옆에 자연스럽게, 떠오를 때만 살짝 벌어진다 (크게 벌리면 어색하다는 피드백)
                'upper_arm.L': [('X', 22 * a), ('Y', -3 - 5 * fly)],
                'upper_arm.R': [('X', -22 * a), ('Y', 3 + 5 * fly)],
                'forearm.L': [('X', -16)],
                'forearm.R': [('X', -16)],
                'hips': [('Y', 2 * math.sin(ph))],
                'spine': [('X', -5), ('Z', 4 * a)],
                'chest': [('X', -2 + 3 * fly)],
                'head': [('X', 2 - 4 * fly), ('Z', -3 * math.cos(ph - 1.2))],
            }), (GROUND, WALK_FLIGHT * fly))
    return action(rig, mesh, 'walk', [(f, *pose(f / WALK_FRAMES)) for f in range(0, WALK_FRAMES + 1)], True, 'LINEAR')


CROUCH_DROP = 0.10
LAND_DROP = 0.055


def jump(rig, mesh):
    """제자리 점프: 짧은 웅크림 → 도약(팔 벌림) → 공중에서 다리 접기 → 착지 충격 흡수 → 원래 자세.
    바닥에 닿는 프레임은 GROUND로 접지를 맞춘다."""
    ct, cs, cf = planted(CROUCH_DROP)
    lt, ls, lf = planted(LAND_DROP)
    crouch = merge(legs('L', ct, cs, cf), legs('R', ct, cs, cf), {
        'spine': [('X', -12)], 'chest': [('X', -4)], 'head': [('X', 10)],
        'upper_arm.L': [('X', 30), ('Y', 6)], 'upper_arm.R': [('X', 30), ('Y', -6)],
        'forearm.L': [('X', -15)], 'forearm.R': [('X', -15)],
    })
    up = merge(legs('L', 6, 10, 28), legs('R', 6, 10, 28), {
        'spine': [('X', 4)], 'head': [('X', -8)],
        'upper_arm.L': [('Y', -42)], 'upper_arm.R': [('Y', 42)],
    })
    # 정점: 다리를 접고 두 팔을 번쩍 드는 "야호" 자세 (원숭이의 장난기)
    tuck = merge(legs('L', -34, 58, 6), legs('R', -34, 58, 6), {
        'spine': [('X', 3)], 'head': [('X', -6)],
        'upper_arm.L': [('Y', -78), ('X', -10)], 'upper_arm.R': [('Y', 78), ('X', -10)],
        'forearm.L': [('Y', -15)], 'forearm.R': [('Y', 15)],
    })
    fall = merge(legs('L', -8, 14, 12), legs('R', -8, 14, 12), {
        'upper_arm.L': [('Y', -26)], 'upper_arm.R': [('Y', 26)],
    })
    land = merge(legs('L', lt, ls, lf), legs('R', lt, ls, lf), {
        'spine': [('X', -8)], 'head': [('X', 6)],
        'upper_arm.L': [('Y', -10), ('X', 15)], 'upper_arm.R': [('Y', 10), ('X', 15)],
    })
    # 30fps. 이륙 0~5(준비 0.1초만: 조작 반응성), 상승 5~10, 정점 10~14, 하강 14~18, 착지 18~25
    return action(rig, mesh, 'jump', [
        (0, {}, GROUND),
        (3, scaled(crouch, 0.7), GROUND),
        (4, merge(scaled(crouch, 0.3), scaled(up, 0.5)), GROUND),   # 바닥을 밀며 펴지는 순간
        (6, up, 0.16),
        (10, tuck, 0.40),
        (14, tuck, 0.40),
        (18, fall, 0.08),
        (20, land, GROUND),
        (23, merge(scaled(land, 0.25), {'head': [('X', -4)]}), GROUND),   # 착지 후 작은 출렁임(헬멧 관성)
        (26, {}, GROUND),
    ], False)


def jump_move(rig, mesh):
    """달리며 점프: 다리와 팔을 앞뒤로 크게 벌린 도약 자세(왼다리·오른팔 앞). 걷기 중에 바로 이어지도록
    웅크림은 짧게, 착지는 앞다리부터."""
    stride = merge(
        legs('L', -38, 24, -6), legs('R', 32, 46, 18),
        {
            'upper_arm.L': [('X', 38), ('Y', -8)], 'upper_arm.R': [('X', -42), ('Y', 8)],
            'forearm.L': [('X', -10)], 'forearm.R': [('X', -25)],
            'spine': [('X', -6), ('Z', -6)], 'hips': [('Z', 6)], 'head': [('X', 4)],
        })
    reach = merge(
        legs('L', -30, 10, -10), legs('R', 22, 52, 22),
        {
            'upper_arm.L': [('X', 30), ('Y', -12)], 'upper_arm.R': [('X', -32), ('Y', 12)],
            'forearm.R': [('X', -20)],
            'spine': [('X', -3), ('Z', -4)], 'hips': [('Z', 4)],
        })
    lt, ls, lf = planted(LAND_DROP)
    land = merge(
        legs('L', lt - 6, ls, lf + 6), legs('R', 18, 30, -40),
        {
            'upper_arm.L': [('X', 18)], 'upper_arm.R': [('X', -18)],
            'spine': [('X', -8)], 'head': [('X', 5)],
        })
    push = merge(legs('L', 10, 20, -30), legs('R', -20, 30, -10), {
        'upper_arm.L': [('X', 15)], 'upper_arm.R': [('X', -15)], 'spine': [('X', -6)],
    })
    # 제자리 점프와 같은 타이밍
    return action(rig, mesh, 'jump-move', [
        (0, {}, GROUND),
        (3, push, GROUND),
        (4, merge(scaled(push, 0.5), scaled(stride, 0.5)), GROUND),
        (6, stride, 0.18),
        (10, stride, 0.40),
        (14, reach, 0.36),
        (18, reach, 0.08),
        (20, land, GROUND),
        (25, {}, GROUND),
    ], False)


def greet(rig, mesh):
    """인사: 카메라(위)를 올려다보고 → 살짝 웅크렸다 두 팔을 번쩍 들고 깡충 → 착지 후 팔 든 채로 한 번 더 흔들고 내린다.
    대기 중 Godot가 몸을 카메라 쪽으로 돌리고 재생한다 (2026-11-02 사용자 선택 A안).
    한 팔 흔들기는 어깨·팔꿈치 메시가 깨져서, 점프 정점의 두 팔 든 자세(문제없음)를 쓴다.
    고개는 머리만 젖히면 목이 늘어나 찢어지므로 가슴·허리와 나눠 조금씩 든다."""
    look = {'head': [('X', -6)], 'chest': [('X', -6)], 'spine': [('X', -4)]}
    ct, cs, cf = planted(CROUCH_DROP * 0.7)
    lt, ls, lf = planted(LAND_DROP)
    crouch = merge(look, legs('L', ct, cs, cf), legs('R', ct, cs, cf), {
        'upper_arm.L': [('X', 20), ('Y', 6)], 'upper_arm.R': [('X', 20), ('Y', -6)],
        'forearm.L': [('X', -12)], 'forearm.R': [('X', -12)],
    })
    def cheer(k):   # 두 팔 번쩍 (jump tuck 팔). k: 팔 벌림 흔들기 (+ 넓게)
        return merge(look, {
            'upper_arm.L': [('Y', -78 - k), ('X', -10)], 'upper_arm.R': [('Y', 78 + k), ('X', -10)],
            'forearm.L': [('Y', -15)], 'forearm.R': [('Y', 15)],
        })
    air = merge(cheer(0), legs('L', -20, 36, 6), legs('R', -20, 36, 6))
    land = merge(cheer(-6), legs('L', lt, ls, lf), legs('R', lt, ls, lf))
    return action(rig, mesh, 'greet', [
        (0, {}, GROUND),
        (6, look, GROUND),
        (10, crouch, GROUND),
        (14, merge(cheer(0), legs('L', 4, 8, 20), legs('R', 4, 8, 20)), 0.12),
        (19, air, 0.26),
        (24, merge(cheer(0), legs('L', -6, 12, 10), legs('R', -6, 12, 10)), 0.08),
        (27, land, GROUND),
        (32, cheer(0), GROUND),
        (37, cheer(-14), GROUND),
        (42, cheer(0), GROUND),
        (50, scaled(cheer(0), 0.3), GROUND),
        (58, {}, GROUND),
    ], False)

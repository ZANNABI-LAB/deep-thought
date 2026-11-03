"""
Zannabi v3 (Tripo 리깅 완료 모델) → Godot용 GLB: 방향·키 정리 + 대기·걷기·점프·인사·앉기(수레) 동작.

입력: art/models/zannabi-v3/rig-out/<작업>/model.glb (Tripo 멀티뷰 생성 → Tripo 리깅 v3.0, 키 1.0, 앞 +X)
- 앞을 -Y(Godot +Z)로 돌리고 키를 1.8로 맞춘다. 캐릭터 왼쪽(L_) = +X가 된다 (zannabi_motions.py 자세의 약속)
- 동작은 zannabi_motions.py의 자세 함수를 그대로 쓴다. 자세는 "뼈 이름 + 아마추어 축 회전"이라 뼈 이름만 맞추면 된다:
  Tripo 뼈 중 동작에 쓰는 것만 그 이름(hips, spine, chest, head, upper_arm.L, …)으로 바꾼다.
  비틀림·손가락·눈 뼈는 부모를 따라간다. Godot(zannabi_player.gd, zannabi_look.gd)도 hips·head 이름을 쓴다
- 가중치는 Tripo 것을 그대로 쓴다 (팔 들기·무릎 굽힘에서 메시가 깨지지 않음을 확인)
- 재질은 색 텍스처만 남긴 무광 (export_godot.py matte와 같다)

사용: blender -b --factory-startup -P art/blender/rig_zannabi_v3.py -- <입력.glb> <출력.glb>
"""
import math
import os
import sys

import bpy
from mathutils import Matrix

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import zannabi_motions as R  # noqa: E402

HEIGHT = 1.8
RENAME = {
    'Hip': 'hips', 'Spine01': 'spine', 'Spine02': 'chest', 'Head': 'head',
    'L_Upperarm': 'upper_arm.L', 'L_Forearm': 'forearm.L', 'L_Hand': 'hand.L',
    'R_Upperarm': 'upper_arm.R', 'R_Forearm': 'forearm.R', 'R_Hand': 'hand.R',
    'L_Thigh': 'thigh.L', 'L_Calf': 'shin.L', 'L_Foot': 'foot.L',
    'R_Thigh': 'thigh.R', 'R_Calf': 'shin.R', 'R_Foot': 'foot.R',
}


def matte(obj):
    """Tripo 재질은 metallic + ORM·노멀맵이라 번쩍인다. 색 텍스처만 남기고 무광으로"""
    for m in obj.data.materials:
        tree = m.node_tree
        bsdf = next(n for n in tree.nodes if n.bl_idname == 'ShaderNodeBsdfPrincipled')
        for name in ('Metallic', 'Roughness', 'Normal'):
            for link in list(bsdf.inputs[name].links):
                tree.links.remove(link)
        bsdf.inputs['Metallic'].default_value = 0.0
        bsdf.inputs['Roughness'].default_value = 1.0
        bsdf.inputs['Specular IOR Level'].default_value = 0.0
        for n in list(tree.nodes):
            if n.bl_idname in ('ShaderNodeNormalMap', 'ShaderNodeSeparateColor') or (
                n.bl_idname == 'ShaderNodeTexImage' and not n.outputs['Color'].links
            ):
                tree.nodes.remove(n)
        m.use_backface_culling = True


def sit(rig, mesh):
    """수레 짐칸에 앉기: 다리를 앞으로 뻗고(무릎은 살짝) 엉덩이를 짐칸 바닥에 붙이고, 두 손은 앞 롤바를 잡는다.
    부츠가 커서 무릎을 직각으로 굽히면 발이 짐칸 바닥을 뚫는다. 골반 높이는 그대로(0) 두고 Godot(Rover)가 자리에 맞춘다.
    달리는 동안 몸이 살짝 출렁인다 (반복)"""
    t, sh = -80, 18

    def pose(k):
        b = math.sin(k * 2 * math.pi)
        return R.merge(R.legs('L', t, sh, -8), R.legs('R', t, sh, -8), {
            'spine': [('X', -8 - 1.5 * b)], 'chest': [('X', -3 + 1.5 * b)], 'head': [('X', 6 - 2 * b)],
            'upper_arm.L': [('X', -62), ('Y', -4)], 'upper_arm.R': [('X', -62), ('Y', 4)],
            'forearm.L': [('X', -18)], 'forearm.R': [('X', -18)],
        })
    return R.action(rig, mesh, 'sit', [(f, pose(f / 40), 0.0) for f in range(0, 41, 5)], True)


def bone_len(rig, a, b):
    return (rig.data.bones[a].head_local - rig.data.bones[b].head_local).length


def main():
    argv = sys.argv[sys.argv.index('--') + 1:]
    src, dst = os.path.abspath(argv[0]), os.path.abspath(argv[1])
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.fps = R.FPS
    bpy.ops.import_scene.gltf(filepath=src)
    rig = next(o for o in sc.objects if o.type == 'ARMATURE')
    mesh = next(o for o in sc.objects if o.type == 'MESH' and o.vertex_groups)
    for o in list(sc.objects):
        if o not in (rig, mesh):   # Tripo가 같이 넣은 도우미 구(Icosphere) 등
            bpy.data.objects.remove(o)

    # 방향·키: 앞 +X → -Y, 발바닥 z=0, 키 1.8
    zs = [(mesh.matrix_world @ v.co).z for v in mesh.data.vertices]
    s = HEIGHT / (max(zs) - min(zs))
    rig.matrix_world = Matrix.Scale(s, 4) @ Matrix.Rotation(math.radians(-90), 4, 'Z') @ Matrix.Translation((0, 0, -min(zs))) @ rig.matrix_world
    bpy.ops.object.select_all(action='DESELECT')
    rig.select_set(True)
    mesh.select_set(True)
    bpy.context.view_layer.objects.active = rig
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    rig.name = 'zannabi-rig'
    mesh.name = 'zannabi'

    for old, new in RENAME.items():
        rig.data.bones[old].name = new   # 정점 그룹 이름도 같이 바뀐다
    assert 'hips' in mesh.vertex_groups or any(g.name == 'thigh.L' for g in mesh.vertex_groups), 'vertex groups not renamed'

    # 다리 길이에 맞춰 발 디딤 계산과 걷기 보폭을 바꾼다 (이동 속도는 비슷하게: 디딤 비율을 늘린다)
    R.THIGH = bone_len(rig, 'thigh.L', 'shin.L')
    R.SHIN = bone_len(rig, 'shin.L', 'foot.L')
    R.WALK_HALF_STRIDE = 0.17 * (R.THIGH + R.SHIN) / 0.30
    R.WALK_CONTACT = 0.30
    R.WALK_SPEED = 2 * R.WALK_HALF_STRIDE / (R.WALK_FRAMES * 0.5 * R.WALK_CONTACT / R.FPS)
    print('LEGS thigh %.3f shin %.3f half-stride %.3f speed %.3f' % (R.THIGH, R.SHIN, R.WALK_HALF_STRIDE, R.WALK_SPEED))

    matte(mesh)
    for fn in (R.idle, R.walk, R.jump, R.jump_move, R.greet):
        fn(rig, mesh)
    sit(rig, mesh)

    bpy.ops.object.select_all(action='DESELECT')
    mesh.select_set(True)
    rig.select_set(True)
    bpy.ops.export_scene.gltf(
        filepath=dst, export_format='GLB', use_selection=True, export_yup=True,
        export_animations=True, export_animation_mode='NLA_TRACKS', export_force_sampling=True,
        export_frame_step=1, export_skins=True, export_def_bones=False,
    )
    print('RIGGED', dst, [a.name for a in bpy.data.actions], 'WALK_SPEED %.4f' % R.WALK_SPEED)


main()

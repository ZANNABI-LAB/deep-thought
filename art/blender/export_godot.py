"""
Tripo GLB → Godot용 GLB (1단계: 정리).
- 앞(-Y, glTF/Godot 기준 +Z)·키·발 위치를 맞추고, 재질은 색 텍스처만 남긴 무광으로 바꾼다.
  잉크 일러스트 표현은 Godot 셰이더가 맡는다.
- 면 수는 여기서 줄이지 않는다. Blender Decimate는 UV 경계를 뭉개 선화에 긁힌 줄을 만든다.
  2단계에서 gltfpack(meshoptimizer)이 UV 경계를 지키며 줄인다 (art/scripts/build_godot_zannabi.sh).

사용: blender -b --factory-startup -P art/blender/export_godot.py -- <tripo.glb> <출력.glb> [--front +x|-x|+y|-y] [--width W | --height H]
  --width: 건물처럼 키 대신 바닥 폭(가로·세로 중 긴 쪽, 단위)으로 크기를 맞춘다. 없으면 키 1.8 (캐릭터)
  --height: 키를 H로 맞춘다 (소품)
  --drop x,y,z: 크기를 맞춘 뒤 좌표(Blender, 앞 -Y)를 담는 떨어진 조각을 지운다. 여러 번 줄 수 있다 (Tripo가 만든 떠 있는 조각 정리)
"""
import json
import os
import sys

import bmesh
import bpy
from mathutils import Vector

HEIGHT = 1.8
# Tripo 앞 방향 → Blender -Y로 돌리는 변환
TO_FRONT = {
    '+x': lambda v: Vector((v.y, -v.x, v.z)),
    '-x': lambda v: Vector((-v.y, v.x, v.z)),
    '+y': lambda v: Vector((-v.x, -v.y, v.z)),
    '-y': lambda v: v.copy(),
}


def matte(obj):
    """Tripo 재질은 metallic 1 + ORM·노멀맵이라 도자기처럼 번쩍인다. 색 텍스처만 남기고 무광으로 만든다."""
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


def drop_parts(obj, points, margin=0.02):
    """points를 경계 상자에 담는 연결 조각(면이 이어진 덩어리)을 지운다."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.faces.ensure_lookup_table()
    seen, doomed = set(), []
    for f in bm.faces:
        if f.index in seen:
            continue
        comp, stack = [], [f]
        seen.add(f.index)
        while stack:
            c = stack.pop()
            comp.append(c)
            for e in c.edges:
                for g in e.link_faces:
                    if g.index not in seen:
                        seen.add(g.index)
                        stack.append(g)
        vs = {v for c in comp for v in c.verts}
        lo = [min(v.co[i] for v in vs) for i in range(3)]
        hi = [max(v.co[i] for v in vs) for i in range(3)]
        if any(all(lo[i] - margin <= p[i] <= hi[i] + margin for i in range(3)) for p in points):
            doomed.extend(comp)
            print('DROP', len(comp), 'faces', [round(x, 2) for x in lo], [round(x, 2) for x in hi])
    bmesh.ops.delete(bm, geom=doomed, context='FACES')
    bm.to_mesh(obj.data)
    bm.free()


def measure(obj):
    """건물 충돌용 치수를 잰다 (Godot 좌표: x 그대로, z = -Blender y).
    plate: 바닥 단면, plate_h: 위를 향한 면의 넓이가 가장 큰 높이(받침판 윗면),
    body: 받침판 위 단면의 5~95% 분위 범위(배관·등 같은 돌출물 제외), height: 꼭대기."""
    vs = [v.co for v in obj.data.vertices]
    base = [v for v in vs if v.z <= 0.05]
    plate = (min(v.x for v in base), max(v.x for v in base), -max(v.y for v in base), -min(v.y for v in base))
    bins = {}
    for p in obj.data.polygons:
        # 받침판은 0.2~0.35. 그 위는 보지 않는다 (돔 안쪽 바닥처럼 더 넓은 높은 바닥이 있을 수 있다)
        if p.normal.z > 0.9 and 0.05 < p.center.z < 0.6:
            k = round(p.center.z / 0.02)
            bins[k] = bins.get(k, 0.0) + p.area
    plate_area = (plate[1] - plate[0]) * (plate[3] - plate[2])
    plate_h = 0.0
    if bins:
        k, a = max(bins.items(), key=lambda kv: kv[1])
        if a > 0.15 * plate_area:
            plate_h = round(k * 0.02, 3)
    sel = [v for v in vs if plate_h + 0.2 <= v.z <= plate_h + 1.2] or base
    q = lambda xs, f: sorted(xs)[int(f * (len(xs) - 1))]
    xs, ys = [v.x for v in sel], [v.y for v in sel]
    body = (q(xs, 0.05), q(xs, 0.95), -q(ys, 0.95), -q(ys, 0.05))
    return {
        'plate': [round(x, 3) for x in plate],
        'plate_h': plate_h,
        'body': [round(x, 3) for x in body],
        'height': round(max(v.z for v in vs), 3),
    }


def main():
    argv = sys.argv[sys.argv.index('--') + 1:]
    src, dst = os.path.abspath(argv[0]), os.path.abspath(argv[1])
    front = argv[argv.index('--front') + 1] if '--front' in argv else '+x'
    width = float(argv[argv.index('--width') + 1]) if '--width' in argv else None
    height = float(argv[argv.index('--height') + 1]) if '--height' in argv else HEIGHT
    drops = [tuple(float(x) for x in argv[i + 1].split(',')) for i, a in enumerate(argv) if a == '--drop']

    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=src)
    meshes = [o for o in bpy.context.scene.objects if o.type == 'MESH']
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes:
        o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    if len(meshes) > 1:
        bpy.ops.object.join()
    obj = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    obj.parent = None
    obj.name = os.path.splitext(os.path.basename(dst))[0]

    turn = TO_FRONT[front]
    for v in obj.data.vertices:
        v.co = turn(v.co)
    xs, ys, zs = ([getattr(v.co, a) for v in obj.data.vertices] for a in 'xyz')
    s = width / max(max(xs) - min(xs), max(ys) - min(ys)) if width else height / (max(zs) - min(zs))
    cx, cy, z0 = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2, min(zs)
    for v in obj.data.vertices:
        v.co = Vector(((v.co.x - cx) * s, (v.co.y - cy) * s, (v.co.z - z0) * s))
    if drops:
        drop_parts(obj, drops)
    if width:
        dims = measure(obj)
        with open(os.path.splitext(dst)[0] + '.json', 'w') as f:
            json.dump(dims, f, indent=1)
        print('MEASURED', dims)
    for p in obj.data.polygons:
        p.use_smooth = True
    matte(obj)

    for o in list(bpy.context.scene.objects):
        if o is not obj:
            bpy.data.objects.remove(o)
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=dst, export_format='GLB', use_selection=False, export_yup=True)
    print('EXPORTED', dst, len(obj.data.polygons), 'faces')


main()

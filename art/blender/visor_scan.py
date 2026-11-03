"""
Zannabi 얼굴 창 재기: 정면(Godot +Z)에서 격자로 광선을 쏴서 처음 맞는 깊이와 그 점의 텍스처 색을 저장한다 (art/scripts/visor_glass.py가 유리 메시로 만든다).
입력은 rig_zannabi_v3.py 결과(기본 자세, Godot 좌표로 키 1.8·앞 +Z). Blender 좌표 = (Gx, -Gz, Gy).
사용: blender -b --factory-startup -P art/blender/visor_scan.py -- <zannabi-v3-rigged.glb> <출력.json>
"""
import json
import sys

import bpy
import numpy as np
from mathutils import Vector
from mathutils.bvhtree import BVHTree
from mathutils.interpolate import poly_3d_calc

X0, X1, Y0, Y1, STEP = -0.45, 0.45, 0.95, 1.8, 0.005

argv = sys.argv[sys.argv.index('--') + 1:]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=argv[0])
mesh = next(o for o in bpy.context.scene.objects if o.type == 'MESH')
dg = bpy.context.evaluated_depsgraph_get()
ev = mesh.evaluated_get(dg)
me = ev.to_mesh()
co = [ev.matrix_world @ v.co for v in me.vertices]
bvh = BVHTree.FromPolygons(co, [p.vertices[:] for p in me.polygons])
uv = me.uv_layers.active.data
img = next(n.image for n in mesh.data.materials[0].node_tree.nodes if n.bl_idname == 'ShaderNodeTexImage')
W, H = img.size
pix = np.array(img.pixels[:]).reshape(H, W, img.channels)


def color(index, loc):
    poly = me.polygons[index]
    w = poly_3d_calc([co[v] for v in poly.vertices], loc)
    u = sum(wi * uv[li].uv[0] for wi, li in zip(w, poly.loop_indices))
    v = sum(wi * uv[li].uv[1] for wi, li in zip(w, poly.loop_indices))
    c = pix[min(H - 1, max(0, int(v * H))), min(W - 1, max(0, int(u * W)))]
    return [round(float(x) * 255) for x in c[:3]]
nx, ny = round((X1 - X0) / STEP) + 1, round((Y1 - Y0) / STEP) + 1
depth, rgb = [], []
for j in range(ny):
    row, crow = [], []
    for i in range(nx):
        gx, gy = X0 + i * STEP, Y0 + j * STEP
        hit = bvh.ray_cast(Vector((gx, -2.0, gy)), Vector((0, 1, 0)))
        row.append(None if hit[0] is None else round(-hit[0].y, 4))
        crow.append(None if hit[0] is None else color(hit[2], hit[0]))
    depth.append(row)
    rgb.append(crow)
json.dump({'x0': X0, 'y0': Y0, 'step': STEP, 'nx': nx, 'ny': ny, 'depth': depth, 'rgb': rgb}, open(argv[1], 'w'))
print('SCAN', nx, ny)

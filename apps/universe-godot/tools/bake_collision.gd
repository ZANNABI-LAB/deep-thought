## 건물 바닥 충돌 굽기: 보이는 메시를 위에서 격자로 재서 높이맵을 만들고 <이름>.json의 "ground"에 넣는다.
## 낮은 턱(받침판·계단, CLIMB 이하)은 경사로로 다듬어 걸어 올라가게 하고, 높은 블럭·벽은 그대로 막는다.
## 모델(.glb)을 다시 내보냈으면 다시 굽는다. 확인은 tools/path_qa.tscn(통행)·tools/island_shot.tscn(화면)
## godot --headless --path apps/universe-godot res://tools/bake_collision.tscn
extends Node3D

const STEP := 0.1
const MARGIN := 1.2  # 받침판 밖 경사로·돌출 블럭 여유 (경사가 격자 끝에서 절벽이 되지 않게)
const CAP := 2.0  # 이보다 높은 곳은 벽 (Zannabi 키 1.8)
## 이 높이 차까지는 경사로로 잇는다 (받침판 0.24~0.34, 계단). 그 이상은 점프로 오르는 블럭
const CLIMB := 0.45
## 이보다 높은 면(벽·지붕)에서는 경사를 내리지 않는다. 층층이 이어도 벽까지 언덕이 되지 않게
const WALK_MAX := 1.0
## 경사로 기울기 (높이/거리, 약 31°). 8방향 격자·삼각형 보간으로 대각선에서는 더 가팔라지므로 최대 45°보다 넉넉히 둔다.
## 경사는 턱 바깥에만 붙여 발이 묻히지 않게 한다
const SLOPE := 0.6
## 이 높이 이상이면 보이는 메시가 있는 칸 (ground.solid)
const SOLID := 0.05

func _ready() -> void:
	var playground := load("res://scripts/playground.gd")
	var done := {}
	for b in playground.BUILDINGS:
		var scene: PackedScene = b.scene
		if done.has(scene.resource_path):
			continue
		done[scene.resource_path] = true
		var model: Node3D = scene.instantiate()
		add_child(model)
		var body := StaticBody3D.new()
		add_child(body)
		for mi in model.find_children("*", "MeshInstance3D", true, false):
			var cs := CollisionShape3D.new()
			cs.shape = (mi as MeshInstance3D).mesh.create_trimesh_shape()
			cs.transform = (mi as MeshInstance3D).global_transform
			body.add_child(cs)
		await get_tree().physics_frame
		await get_tree().physics_frame
		_bake(scene.resource_path.get_basename() + ".json")
		model.queue_free()
		body.queue_free()
		await get_tree().physics_frame
	get_tree().quit()

func _bake(path: String) -> void:
	var m: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(path))
	var plate: Array = m.plate
	var x0: float = plate[0] - MARGIN
	var z0: float = plate[2] - MARGIN
	var nx := int(ceil((plate[1] - plate[0] + MARGIN * 2) / STEP)) + 1
	var nz := int(ceil((plate[3] - plate[2] + MARGIN * 2) / STEP)) + 1
	# 격자점마다 둘레 반 칸 안의 3×3 표본 중 가장 높은 값: 격자 사이 보간으로 얇은 벽·모서리가 낮아지지 않게
	var raw := PackedFloat32Array()
	raw.resize(nx * nz)
	var space := get_world_3d().direct_space_state
	for iz in nz:
		for ix in nx:
			var top := 0.0
			for sz in [-0.5, 0.0, 0.5]:
				for sx in [-0.5, 0.0, 0.5]:
					top = maxf(top, _height(space, x0 + (ix + sx) * STEP, z0 + (iz + sz) * STEP))
			raw[iz * nx + ix] = top
	var h := []
	for v in _ramp(raw, nx, nz):
		h.append(snappedf(v, 0.01))
	# solid: 경사를 덧붙이기 전에 보이는 메시가 있는 칸 ("1"/"0" 문자열). 돌길이 받침판·계단의 보이는 가장자리를 찾는 데 쓴다
	var solid := ""
	for v in raw:
		solid += "1" if v >= SOLID else "0"
	m.ground = {"x0": snappedf(x0, 0.001), "z0": snappedf(z0, 0.001), "step": STEP, "nx": nx, "nz": nz, "h": h, "solid": solid}
	var f := FileAccess.open(path, FileAccess.WRITE)
	f.store_string(JSON.stringify(m))
	print("BAKE %s %dx%d" % [path.get_file(), nx, nz])

## 격자점의 바닥 높이. 위에서 처음 맞은 면이 뒷면(아래를 향한 면)이면 벽 속이라 CAP으로 본다
func _height(space: PhysicsDirectSpaceState3D, x: float, z: float) -> float:
	var q := PhysicsRayQueryParameters3D.create(Vector3(x, CAP, z), Vector3(x, -0.5, z))
	q.hit_back_faces = true
	var any := space.intersect_ray(q)
	if not any:
		return 0.0
	q.hit_back_faces = false
	var front := space.intersect_ray(q)
	if not front or any.position.y > front.position.y + 0.01:
		return CAP
	return maxf(front.position.y, 0.0)

## 낮은 턱 바깥에 기울기 SLOPE로 내려가는 경사를 덧붙인다. 높이 차가 CLIMB를 넘는 곳(블럭·벽)은 손대지 않는다.
## 이미 덧붙인 경사 높이와 비교하므로 받침판 위 블럭처럼 층층이 쌓인 턱도 계단처럼 이어진다
func _ramp(raw: PackedFloat32Array, nx: int, nz: int) -> PackedFloat32Array:
	var h := raw.duplicate()
	var changed := true
	while changed:
		changed = false
		for iz in nz:
			for ix in nx:
				var i := iz * nx + ix
				for d in [Vector2i(1, 0), Vector2i(-1, 0), Vector2i(0, 1), Vector2i(0, -1), Vector2i(1, 1), Vector2i(-1, -1), Vector2i(1, -1), Vector2i(-1, 1)]:
					var jx: int = ix + d.x
					var jz: int = iz + d.y
					if jx < 0 or jz < 0 or jx >= nx or jz >= nz:
						continue
					var j := jz * nx + jx
					var want: float = h[j] - SLOPE * STEP * Vector2(d).length()
					if want - h[i] > 0.001 and h[j] <= WALK_MAX and h[j] - h[i] <= CLIMB:
						h[i] = want
						changed = true
	return h

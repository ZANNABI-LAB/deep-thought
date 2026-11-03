## 섬 위 건물 하나: 모델(원본 색) + 바닥 충돌(구운 높이맵: 받침판·계단은 경사로, 높은 블럭은 벽) + 몸체 충돌 + 실루엣 선 영역.
##
## def 항목 (모델 좌표: 앞 +Z, 바닥 y=0, 단위 = 월드 단위)
##   name, scene: PackedScene, pos: Vector3, yaw: float(도, 선택)
##   door: Vector2   문·조작대 앞 바닥 (모델 좌표 x, z, 받침판 밖). 이름표 클릭 때 걸어가 멈출 곳. use_point()로 월드 좌표
##   id, title       시설 ID(packages/contracts WORLD_OBJECTS)와 데스크톱 안내 이름 (접근·실행은 Interactor)
## 치수는 모델 옆 <이름>.json에서 읽는다 (art/blender/export_godot.py가 잰 plate·plate_h·body·height,
## tools/bake_collision.tscn이 구운 ground: 높이맵 h와 보이는 메시가 있는 칸 solid)
class_name Building
extends Node3D

var def: Dictionary
var camera: Camera3D
## 실루엣 선을 다시 찍게 하는 움직이는 몸 (Zannabi)
var watch: Node3D

static func spawn(parent: Node3D, camera: Camera3D, building_def: Dictionary, watch_node: Node3D) -> Building:
	var b := Building.new()
	b.def = building_def
	b.camera = camera
	b.watch = watch_node
	b.name = building_def.name
	b.position = building_def.pos
	b.rotation_degrees.y = building_def.get("yaw", 0.0)
	parent.add_child(b)
	return b

func _ready() -> void:
	_load_measured()
	var model: Node3D = def.scene.instantiate()
	PaintLook.apply(model)
	add_child(model)
	# 선 영역: 바닥 대각선과 높이를 모두 담는 정사각형 (여유 20%)
	var r: Vector4 = def.plate
	var size := maxf(Vector2(r.y - r.x, r.w - r.z).length(), def.height) * 1.2
	Outline.attach(get_parent(), camera, self, size, def.height / 2.0, watch)
	_add_collision()

## 문·조작대 앞 바닥의 월드 좌표 (바닥 높이 0)
func use_point() -> Vector3:
	var u: Vector2 = def.door
	var p := to_global(Vector3(u.x, 0.0, u.y))
	return Vector3(p.x, 0.0, p.z)

## 문 앞(from)에서 건물 가운데 쪽으로 가다가 처음 받침판·계단의 보이는 가장자리에 닿는 바닥 점 (월드, y = 0). 돌길이 끝나는 곳
func plate_entry(from: Vector3) -> Vector3:
	var l := to_local(from)
	var dir := -Vector2(l.x, l.z).normalized()
	var at := Vector2(l.x, l.z)
	for i in 200:
		if _solid_at(at):
			break
		at += dir * 0.05
	var p := to_global(Vector3(at.x, 0.0, at.y))
	return Vector3(p.x, 0.0, p.z)

## 바닥 점 위에 보이는 받침판·계단·건물이 있는지
func on_plate(world: Vector3) -> bool:
	var l := to_local(world)
	return _solid_at(Vector2(l.x, l.z))

## 받침판 사각형 가장자리까지 거리 (밖이면 양수, 안이면 0)
func near_distance(world: Vector3) -> float:
	var l := to_local(world)
	var r: Vector4 = def.plate
	return Vector2(maxf(maxf(r.x - l.x, l.x - r.y), 0.0), maxf(maxf(r.z - l.z, l.z - r.w), 0.0)).length()

func _solid_at(at: Vector2) -> bool:
	var g: Dictionary = def.ground
	var ix := roundi((at.x - g.x0) / g.step)
	var iz := roundi((at.y - g.z0) / g.step)
	if ix < 0 or iz < 0 or ix >= int(g.nx) or iz >= int(g.nz):
		return false
	return g.solid.unicode_at(iz * int(g.nx) + ix) == 49  # "1"

func _load_measured() -> void:
	var path: String = def.scene.resource_path.get_basename() + ".json"
	var m: Dictionary = JSON.parse_string(FileAccess.get_file_as_string(path))
	def.plate = Vector4(m.plate[0], m.plate[1], m.plate[2], m.plate[3])
	def.plate_h = m.plate_h
	def.body = Vector4(m.body[0], m.body[1], m.body[2], m.body[3])
	def.height = m.height
	def.ground = m.ground

func _add_collision() -> void:
	var body := StaticBody3D.new()
	add_child(body)
	body.add_child(_ground_shape(def.ground))
	# 몸체: 받침판 위 단면 상자 (키의 90%까지)
	var r: Vector4 = def.body
	var box := BoxShape3D.new()
	box.size = Vector3(r.y - r.x, def.height * 0.9 - def.plate_h, r.w - r.z)
	var shape := CollisionShape3D.new()
	shape.shape = box
	shape.position = Vector3((r.x + r.y) / 2.0, def.plate_h + box.size.y / 2.0, (r.z + r.w) / 2.0)
	body.add_child(shape)

## 바닥 높이맵: 격자 간격 step. HeightMapShape3D는 간격 1이라 모양을 1/step로 키워 두고 충돌체를 step배로 줄인다
func _ground_shape(g: Dictionary) -> CollisionShape3D:
	var step: float = g.step
	var nx := int(g.nx)
	var nz := int(g.nz)
	var data := PackedFloat32Array()
	for v in g.h:
		data.append(v / step)
	var hm := HeightMapShape3D.new()
	hm.map_width = nx
	hm.map_depth = nz
	hm.map_data = data
	var shape := CollisionShape3D.new()
	shape.shape = hm
	shape.scale = Vector3.ONE * step
	shape.position = Vector3(g.x0 + (nx - 1) * step / 2.0, 0.0, g.z0 + (nz - 1) * step / 2.0)
	return shape

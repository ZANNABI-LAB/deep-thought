## 섬 위 소품 하나 (연료통 등): 모델(원본 색) + 바닥 원통 충돌. 탈 수 있는 수레는 Rover.
## 원통 반지름은 모델 바닥 크기(가로·세로 중 짧은 쪽의 절반 × FILL)에서 잰다. 선 영역은 따로 두지 않는다 (작아서 계산이 아깝다)
##
## def: scene: PackedScene, pos: Vector3, yaw: float(도, 선택), scale: float(선택), radius: float(충돌 반지름, 선택)
class_name Prop
extends Node3D

## 바닥 크기 대비 충돌 원통 비율 (모서리까지 막으면 옆으로 비켜 걷기 어렵다)
const FILL := 0.9

var def: Dictionary

static func spawn(parent: Node3D, prop_def: Dictionary) -> Prop:
	var p := Prop.new()
	p.def = prop_def
	p.name = prop_def.name
	p.position = prop_def.pos
	p.rotation_degrees.y = prop_def.get("yaw", 0.0)
	p.scale = Vector3.ONE * prop_def.get("scale", 1.0)
	parent.add_child(p)
	return p

func _ready() -> void:
	var model: Node3D = def.scene.instantiate()
	PaintLook.apply(model)
	add_child(model)
	var box := bounds(model)
	var body := StaticBody3D.new()
	add_child(body)
	var shape := CollisionShape3D.new()
	var cyl := CylinderShape3D.new()
	cyl.radius = def.get("radius", minf(box.size.x, box.size.z) / 2.0 * FILL)
	cyl.height = box.size.y
	shape.shape = cyl
	shape.position = Vector3(box.get_center().x, box.size.y / 2.0, box.get_center().z)
	body.add_child(shape)

## 모델 전체 메시의 경계 상자 (모델 부모 좌표)
static func bounds(model: Node3D) -> AABB:
	var box := AABB()
	var first := true
	for m: MeshInstance3D in model.find_children("*", "MeshInstance3D", true, false):
		var b: AABB = model.global_transform.affine_inverse() * m.global_transform * m.get_aabb()
		box = b if first else box.merge(b)
		first = false
	return box

## 탈 수 있는 화물 수레. 가까이 가서 E로 타고(Zannabi가 짐칸에 앉는다), WASD로 몰고, E로 내린다 (Interactor가 E를 나눠 준다).
## 수레는 Zannabi가 탔을 때만 움직이므로, 건물 선 영역은 Zannabi(watch)를 따라 다시 찍혀 수레 마스크도 따라간다
## 몸은 CharacterBody3D라 건물·소품·섬 가장자리 벽에 막힌다. 모델 앞 = +Z (전조등·롤바 쪽)
## 키 입력 방향(화면 기준 8방향)으로 차체를 돌리며 나아가고, 달리는 동안 차체가 살짝 출렁인다
class_name Rover
extends CharacterBody3D

const SPEED := 3.6
const ACCEL := 5.0
const DECEL := 7.0
## 방향 전환 (라디안/초). 차체가 입력 방향과 많이 어긋나면 먼저 돌고 나서 나아간다
const TURN := 2.6
## 짐칸에 앉는 자리 (수레 좌표): Zannabi 원점(발바닥 기준)이 놓일 곳. 앉기 동작은 골반을 그대로 두므로 엉덩이가 짐칸 바닥(0.73)에 닿게 낮춘다
const SEAT := Vector3(0, 0.3, -0.25)
## 내릴 때 수레 옆으로 이만큼 떨어진 곳에 선다 (왼쪽 → 오른쪽 → 뒤 순서로 빈 곳)
const EXIT_GAP := 0.75
## 타기·내리기 안내를 띄울 높이 (수레 위)
const PROMPT_HEIGHT := 2.9   # 앉은 Zannabi 헬멧(약 2.4) 위
## 세운 자리 둘레에서 길찾기 격자를 다시 잴 반지름: 반 대각선(약 1.15) + 몸 반지름(0.5) + 여유
const NAV_RADIUS := 2.0

## 타던 수레를 세웠다 (from: 타기 시작한 자리). 길찾기 격자가 두 자리 주변을 다시 잰다
signal parked(from: Vector3)

var def: Dictionary
var model: Node3D
## 타고 있는 Zannabi (없으면 null)
var rider: ZannabiPlayer
var _t := 0.0
var _half := Vector3.ONE * 0.5
var _boarded_at := Vector3.ZERO

static func spawn(parent: Node3D, rover_def: Dictionary) -> Rover:
	var r := Rover.new()
	r.def = rover_def
	r.name = rover_def.name
	r.position = rover_def.pos
	r.rotation_degrees.y = rover_def.get("yaw", 0.0)
	parent.add_child(r)
	return r

func _ready() -> void:
	model = def.scene.instantiate()
	PaintLook.apply(model)
	add_child(model)
	var box := Prop.bounds(model)
	_half = box.size / 2.0
	var shape := CollisionShape3D.new()
	var bs := BoxShape3D.new()
	bs.size = Vector3(box.size.x * 0.92, 0.9, box.size.z * 0.92)
	shape.shape = bs
	shape.position = Vector3(box.get_center().x, 0.55, box.get_center().z)
	add_child(shape)
	motion_mode = CharacterBody3D.MOTION_MODE_FLOATING   # 바닥 위를 미끄러진다 (중력·경사 없음)

## Zannabi가 탄다 / 내린다 (ZannabiPlayer.mount·dismount가 부른다)
func board(by: ZannabiPlayer) -> void:
	rider = by
	_boarded_at = global_position

func leave() -> void:
	rider = null
	velocity = Vector3.ZERO
	parked.emit(_boarded_at)

## 수레 가장자리까지 거리 (수레 둘레에서 가까이 왔는지)
func near_distance(world: Vector3) -> float:
	var l := to_local(world)
	return Vector2(maxf(absf(l.x) - _half.x, 0.0), maxf(absf(l.z) - _half.z, 0.0)).length()

## 앉는 자리 (월드)
func seat_transform() -> Transform3D:
	return global_transform * Transform3D(Basis(), SEAT)

## 내릴 자리: 옆·뒤 중 Zannabi 몸이 들어가는 빈 곳
func exit_point(exclude: Array[RID]) -> Vector3:
	var space := get_world_3d().direct_space_state
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.4
	capsule.height = 1.4
	var q := PhysicsShapeQueryParameters3D.new()
	q.shape = capsule
	q.exclude = exclude + [get_rid()]
	var side := _half.x + EXIT_GAP
	var back := _half.z + EXIT_GAP
	for local in [Vector3(side, 0, 0), Vector3(-side, 0, 0), Vector3(0, 0, -back), Vector3(0, 0, back)]:
		var p: Vector3 = global_transform * local
		q.transform = Transform3D(Basis(), p + Vector3(0, 0.95, 0))
		if space.intersect_shape(q, 1).is_empty():
			return Vector3(p.x, 0, p.z)
	return global_transform * Vector3(side, 0, 0)

func _physics_process(delta: float) -> void:
	var dir := rider.drive_direction() if rider else Vector3.ZERO
	var speed := Vector2(velocity.x, velocity.z).length()
	var want := 0.0
	if dir != Vector3.ZERO:
		var yaw := atan2(dir.x, dir.z)
		var diff := angle_difference(rotation.y, yaw)
		rotation.y = rotate_toward(rotation.y, rotation.y + diff, TURN * delta)
		# 많이 어긋나 있으면 거의 제자리에서 돌고, 맞을수록 빨리 나아간다
		want = SPEED * clampf(cos(diff), 0.0, 1.0)
	speed = move_toward(speed, want, (ACCEL if want > speed else DECEL) * delta)
	velocity = global_transform.basis.z * speed
	move_and_slide()
	global_position.y = 0.0
	# 출렁임: 달리는 속도만큼 차체가 위아래·앞뒤로 살짝
	_t += delta * (6.0 + speed * 3.0)
	var k := speed / SPEED
	model.position.y = 0.025 * k * absf(sin(_t))
	model.rotation.x = 0.03 * k * sin(_t * 0.5)

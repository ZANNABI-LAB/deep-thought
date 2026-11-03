## 조작 가능한 Zannabi. WASD(화면 기준 8방향) + 스페이스 점프(낮은 중력). 수레(Rover)에 타면 WASD로 수레를 몬다.
## 마우스 클릭으로는 움직이지 않는다 (클릭은 오브젝트 선택용). 목적지 이동은 walk_to()·walk_path()로만 (이름표 클릭 등).
## 점프 높이는 물리가 맡고, 애니메이션은 자세만 맡는다: 공중 자세는 위아래 속도에 맞춰 고른다.
class_name ZannabiPlayer
extends CharacterBody3D

## walk_to·walk_path의 목적지에 닿았다 (키 입력으로 취소되면 오지 않는다)
signal arrived

const MODEL := preload("res://assets/zannabi/zannabi_v3.glb")
## rig_zannabi_v3.py WALK_SPEED. 이 속도일 때 디딘 발이 바닥과 같이 움직인다
## 이동 속도도 이 값이라 걷기 동작이 배속 없이 재생된다 (보폭을 넓혀 속도를 동작에 담았다)
const WALK_SPEED := 2.8266
## 출발·정지를 순간이 아니라 가속·감속으로 (단위/초²). 걷기 재생 속도가 실제 속도를 따라가서 발도 같이 느려진다
const ACCEL := 9.0
const DECEL := 11.0
const TURN_SPEED := 7.0
## 동작 사이를 섞는 시간 (초)
const BLEND := 0.28
const LAND_BLEND := 0.3
## 이 속도보다 빠르면 걷기, 느리면 대기 (두 값을 달리 둬서 경계에서 깜빡이지 않게)
const WALK_ON := 0.15
const WALK_OFF := 0.08
## 달 중력: 점프 높이 JUMP_HEIGHT, 체공 AIR_TIME 초
const JUMP_HEIGHT := 0.72
const AIR_TIME := 1.3
const GRAVITY := 8.0 * JUMP_HEIGHT / (AIR_TIME * AIR_TIME)
const JUMP_VELOCITY := 4.0 * JUMP_HEIGHT / AIR_TIME
## 점프 애니메이션 구간 (초, art/blender/zannabi_motions.py jump 키프레임 30fps 기준)
const CROUCH_END := 0.13      # 웅크림 끝 = 발이 떨어지는 순간
const RISE := Vector2(0.17, 0.4)   # 상승 자세 → 정점 자세
const FALL := Vector2(0.47, 0.6)   # 정점 → 착지 직전
const LAND := 0.63
## 인사: 가만히 서 있으면 GREET_DELAY초 뒤 카메라 쪽으로 돌아서 인사하고, 계속 서 있으면 GREET_EVERY초마다 다시 한다
const GREET_DELAY := 1.5
const GREET_EVERY := 12.0
## 카메라가 있는 바닥 방향 (playground.gd AZIMUTH 45°). 정사영이라 어디 서 있든 같다
const CAMERA_YAW := PI / 4.0

var model: Node3D
## 웹 입력창에 글자를 치는 동안 끈다 (웹 → PAUSE_INPUT / RESUME_INPUT)
var input_enabled := true
var player: AnimationPlayer
var target := Vector3.INF
## walk_path로 받은 남은 경유점 (target 다음부터)
var _route := PackedVector3Array()
var _jump_anim := ""
var _crouch := -1.0
var _idle_time := 0.0
## 시설 가까이에서 바라볼 방향 (Interactor가 정한다). NAN이면 없음 → 대기 중 카메라 인사
var focus_yaw := NAN
## 타고 있는 수레 (없으면 null). 타는 동안은 짐칸 자리를 따라가고 키 입력은 수레가 쓴다
var riding: Rover
var _shape: CollisionShape3D
var _next_greet := GREET_DELAY

func _ready() -> void:
	model = MODEL.instantiate()
	add_child(model)
	ZannabiLook.apply(model)
	player = model.find_children("*", "AnimationPlayer", true, false)[0]
	_strip_jump_lift()
	_shape = CollisionShape3D.new()
	var capsule := CapsuleShape3D.new()
	capsule.radius = 0.35
	capsule.height = 1.8
	_shape.shape = capsule
	_shape.position.y = 0.9
	add_child(_shape)
	player.play("idle")

## 점프 동작 속 골반의 위쪽 이동(높이)은 물리가 맡으므로 지운다. 웅크림·착지의 아래쪽 이동은 남긴다
func _strip_jump_lift() -> void:
	for name in ["jump", "jump-move"]:
		var anim := player.get_animation(name)
		for t in anim.get_track_count():
			if anim.track_get_type(t) != Animation.TYPE_POSITION_3D or not str(anim.track_get_path(t)).ends_with(":hips"):
				continue
			var rest: Vector3 = anim.track_get_key_value(t, 0)
			for k in anim.track_get_key_count(t):
				var v: Vector3 = anim.track_get_key_value(t, k)
				v.y = minf(v.y, rest.y)
				anim.track_set_key_value(t, k, v)

func _unhandled_input(event: InputEvent) -> void:
	if input_enabled and not riding and event is InputEventKey and event.pressed and not event.echo and event.physical_keycode == KEY_SPACE:
		_start_jump()

## 바닥의 한 점까지 걸어가서 멈춘다. 키 입력이 들어오면 취소된다
func walk_to(point: Vector3) -> void:
	target = Vector3(point.x, 0, point.z)
	_route.clear()

## 꺾은선을 따라 걷는다 (첫 점은 지금 위치). 마지막 점에서 멈추고 arrived를 알린다
func walk_path(path: PackedVector3Array) -> void:
	_route = path.slice(1)
	_next_waypoint()

func _next_waypoint() -> void:
	if _route.is_empty():
		target = Vector3.INF
		return
	target = Vector3(_route[0].x, 0, _route[0].z)
	_route = _route.slice(1)

## 수레에 탄다: 몸 충돌을 끄고 짐칸에 앉는다
func mount(rover: Rover) -> void:
	riding = rover
	rover.board(self)
	target = Vector3.INF
	_route.clear()
	velocity = Vector3.ZERO
	_jump_anim = ""
	_crouch = -1.0
	_shape.disabled = true
	player.speed_scale = 1.0
	player.play("sit", BLEND)

## 수레에서 내린다: 수레 옆 빈 곳에 선다
func dismount() -> void:
	if not riding:
		return
	var at := riding.exit_point([get_rid()])
	model.rotation.y = riding.rotation.y
	_shape.disabled = false
	global_position = at
	var rover := riding
	riding = null
	rover.leave()
	velocity = Vector3.ZERO
	_reset_idle()
	player.play("idle", BLEND)

## 수레를 몰 방향 (화면 기준 WASD)
func drive_direction() -> Vector3:
	return _key_direction()

func _reset_idle() -> void:
	_idle_time = 0.0
	_next_greet = GREET_DELAY

func _start_jump() -> void:
	if not is_on_floor() or _crouch >= 0.0 or _jump_anim != "":
		return
	var moving := Vector2(velocity.x, velocity.z).length() > 0.1
	_jump_anim = "jump-move" if moving else "jump"
	_reset_idle()
	player.play(_jump_anim, 0.12)
	_crouch = 0.0

## 화면 기준 WASD → 바닥 방향 (카메라가 45° 방위에서 내려다본다)
func _key_direction() -> Vector3:
	if not input_enabled:
		return Vector3.ZERO
	var v := Vector2(
		float(Input.is_physical_key_pressed(KEY_D)) - float(Input.is_physical_key_pressed(KEY_A)),
		float(Input.is_physical_key_pressed(KEY_S)) - float(Input.is_physical_key_pressed(KEY_W)))
	if v == Vector2.ZERO:
		return Vector3.ZERO
	var right := Vector3(1, 0, -1).normalized()
	var down := Vector3(1, 0, 1).normalized()
	return (right * v.x + down * v.y).normalized()

func _physics_process(delta: float) -> void:
	if riding:
		var seat := riding.seat_transform()
		global_position = seat.origin
		model.rotation = Vector3(0, riding.rotation.y, 0)
		if player.current_animation != "sit":
			player.play("sit", BLEND)
		# 달리는 속도만큼 출렁임을 빨리 (멈춰 있으면 천천히 숨쉬듯)
		player.speed_scale = 0.4 + Vector2(riding.velocity.x, riding.velocity.z).length() / Rover.SPEED
		return
	var dir := _key_direction()
	if dir != Vector3.ZERO:
		target = Vector3.INF
		_route.clear()
	elif target != Vector3.INF:
		var to := target - global_position
		to.y = 0
		# 중간 경유점은 일찍 넘겨서 꺾을 때 서지 않게 한다 (촘촘한 점은 한 번에 여러 개)
		while not _route.is_empty() and to.length() < 0.4:
			_next_waypoint()
			to = target - global_position
			to.y = 0
		if to.length() < 0.05:
			target = Vector3.INF
			arrived.emit()
		else:
			dir = to.normalized()

	var speed := WALK_SPEED
	if target != Vector3.INF and dir != Vector3.ZERO and _route.is_empty():
		# 목적지에 가까워지면 미리 감속해서 부드럽게 멈춘다
		var dist := Vector2(target.x - global_position.x, target.z - global_position.z).length()
		speed = minf(speed, sqrt(2.0 * DECEL * dist))
	var flat := Vector2(velocity.x, velocity.z)
	var want := Vector2(dir.x, dir.z) * speed
	flat = flat.move_toward(want, (ACCEL if want.length() > flat.length() else DECEL) * delta)
	velocity.x = flat.x
	velocity.z = flat.y
	if dir != Vector3.ZERO:
		var yaw := atan2(dir.x, dir.z)
		model.rotation.y = lerp_angle(model.rotation.y, yaw, 1.0 - exp(-TURN_SPEED * delta))
		_reset_idle()
	elif not is_nan(focus_yaw):
		# 시설 가까이: 시설을 보고 서 있는다 (인사하지 않는다)
		model.rotation.y = lerp_angle(model.rotation.y, focus_yaw, 1.0 - exp(-TURN_SPEED * delta))
		_reset_idle()
	elif player.current_animation == "greet":
		model.rotation.y = lerp_angle(model.rotation.y, CAMERA_YAW, 1.0 - exp(-TURN_SPEED * delta))
	elif is_on_floor() and _jump_anim == "":
		_idle_time += delta

	# 점프: 웅크림이 끝나는 순간 뛰어오른다
	if _crouch >= 0.0:
		_crouch += delta
		if _crouch >= CROUCH_END:
			_crouch = -1.0
			velocity.y = JUMP_VELOCITY
	if not is_on_floor():
		velocity.y -= GRAVITY * delta
	var was_air := not is_on_floor()
	move_and_slide()
	_animate(dir, was_air)

func _animate(dir: Vector3, was_air: bool) -> void:
	if _jump_anim != "":
		if _crouch >= 0.0:
			return  # 웅크림은 그대로 재생
		if not is_on_floor():
			# 공중 자세를 위아래 속도로 고른다: 올라가는 중 → 정점 → 내려오는 중
			var k := velocity.y / JUMP_VELOCITY
			var t := lerpf(RISE.x, RISE.y, 1.0 - k) if k > 0.0 else lerpf(FALL.x, FALL.y, minf(1.0, -k))
			player.seek(t, true)
			player.speed_scale = 0.0
			return
		if was_air:
			player.speed_scale = 1.0
			player.seek(LAND, true)
			if dir != Vector3.ZERO:
				# 걸으며 착지하면 착지 자세에서 바로 걷기로 이어 간다
				_jump_anim = ""
				player.play("walk", LAND_BLEND)
				return
		if player.current_animation_position < player.current_animation_length - 0.02 and player.is_playing():
			return
		_jump_anim = ""
		player.play("idle", LAND_BLEND)
		return
	var speed := Vector2(velocity.x, velocity.z).length()
	var walking := player.current_animation == "walk"
	walking = speed > WALK_OFF if walking else speed > WALK_ON
	var want := "walk" if walking else "idle"
	if not walking:
		if player.current_animation == "greet" and player.is_playing():
			return  # 인사는 끝까지
		if _idle_time >= _next_greet:
			_next_greet = _idle_time + GREET_EVERY
			player.speed_scale = 1.0
			player.play("greet", BLEND)
			return
	# 걷기 재생 속도 = 실제 속도 / 발이 미끄러지지 않는 속도. 가속·감속 중에도 발이 바닥에 붙는다
	player.speed_scale = clampf(speed / WALK_SPEED, 0.35, 2.0) if walking else 1.0
	if player.current_animation != want:
		player.play(want, BLEND)

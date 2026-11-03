## 수레 타기 QA: 수레 옆으로 걸어가 E로 타고(짐칸에 앉는지), 키(S·A)로 몰아 움직이고 방향이 바뀌는지, E로 내려 수레 옆 빈 곳에 서는지,
## 길찾기 격자가 수레의 새 자리로 갱신되는지, 수레가 돌길을 막으면 이름표 클릭 이동이 돌아가는지 본다.
## 창 모드(WSLg는 창 포커스 때문에 키 흉내가 먹지 않는다)면 키 대신 직접 태우고 옮겨 탄 장면만 저장한다: ride-park.png, ride-drive.png
## godot --headless --fixed-fps 60 --path apps/universe-godot res://tools/ride_qa.tscn -- <출력 폴더>
extends Node

var _scene: Node

func _ready() -> void:
	var out: String = OS.get_cmdline_user_args()[0] if OS.get_cmdline_user_args().size() > 0 else "user://ride_qa"
	DirAccess.make_dir_recursive_absolute(out)
	_scene = load("res://scenes/playground.tscn").instantiate()
	get_tree().root.add_child.call_deferred(_scene)
	await get_tree().create_timer(1.2).timeout
	var player: ZannabiPlayer = _scene._player
	var it: Interactor = _scene._interactor
	var rover: Rover = it.rover
	var shots := DisplayServer.get_name() != "headless"
	if shots:
		player.global_position = rover.exit_point([player.get_rid()])
		player.mount(rover)
		await _frames(30)
		await _shot("%s/ride-park.png" % out)
		rover.global_position = Vector3(0.6, 0, 2.2)   # 텔레포트 아래 광장을 달리는 장면
		rover.rotation.y = deg_to_rad(20.0)
		rover.velocity = rover.global_transform.basis.z * Rover.SPEED * 0.8
		await _frames(10)
		await _shot("%s/ride-drive.png" % out)
		get_tree().quit()
		return
	var fails := 0
	# 1) 수레 옆까지 걸어간다
	var side: Vector3 = rover.global_transform * Vector3(rover._half.x + 0.5, 0, 0)
	player.walk_to(side)
	await _frames(240)
	while not _scene._nav.ready:   # 길찾기 격자를 다 잰 뒤에 몬다 (세운 뒤 갱신을 보려고)
		await get_tree().physics_frame
	var near := it.rover_active
	# 2) E로 탄다
	await _tap(KEY_E)
	await _frames(20)
	var seated := player.riding == rover and player.global_position.distance_to(rover.seat_transform().origin) < 0.05
	var sit_anim: String = player.player.current_animation
	if shots:
		await _shot("%s/ride-sit.png" % out)
	# 3) S(화면 아래, 텔레포트 옆 빈 광장 쪽)로 1.5초 몰고, 이어서 A(화면 왼쪽)로 1초
	var start := rover.global_position
	var yaw0 := rover.rotation.y
	await _hold(KEY_S, 90)
	var moved := rover.global_position.distance_to(start)
	var yaw1 := rover.rotation.y
	await _hold(KEY_A, 60)
	var turned := absf(angle_difference(yaw0, yaw1)) > 0.3 or absf(angle_difference(yaw1, rover.rotation.y)) > 0.3
	await _frames(60)   # 감속해서 멈춤
	if shots:
		await _shot("%s/ride-drive.png" % out)
	var still_seated := player.global_position.distance_to(rover.seat_transform().origin) < 0.05
	# 4) E로 내린다
	var rover_at := rover.global_position
	await _tap(KEY_E)
	await _frames(20)
	var off := player.riding == null and not player._shape.disabled
	var gap := rover.near_distance(player.global_position)
	var parked := rover.global_position.distance_to(rover_at) < 0.05
	# 길찾기 격자: 떠난 자리는 비고, 새 자리는 막힌다 (playground가 parked 신호로 다시 잰다)
	var nav: NavGrid = _scene._nav
	var nav_ok := nav.is_free(nav.cell_of(start)) and not nav.is_free(nav.cell_of(rover.global_position))
	# 5) 수레를 돌길 한가운데 세워 두면 이름표 클릭 이동이 길찾기로 돌아간다
	var route: PackedVector3Array = _scene._stone_paths.routes["READING"]
	player.mount(rover)
	rover.global_position = route[route.size() / 2]
	await _frames(3)
	player.dismount()
	player.global_position = Vector3.ZERO
	await _frames(3)
	var reached := [false]
	it.used.connect(func(id: String) -> void: reached[0] = id == "library-dome")
	_scene.move_to_object("library-dome")
	for i in 900:
		await get_tree().physics_frame
		if reached[0]:
			break
	var detour: bool = reached[0]
	var ok := near and seated and sit_anim == "sit" and moved > 1.5 and turned and still_seated and off and gap > 0.3 and parked and nav_ok and detour
	if not ok:
		fails += 1
	print("RIDE_QA 접근 %s  탐 %s(%s)  이동 %.2f  회전 %s  탄 채 %s  내림 %s  수레와 간격 %.2f  주차 %s  길찾기 갱신 %s  막힌 돌길 우회 %s" % [
		"o" if near else "x", "o" if seated else "x", sit_anim, moved, "o" if turned else "x",
		"o" if still_seated else "x", "o" if off else "x", gap, "o" if parked else "x", "o" if nav_ok else "x", "o" if detour else "x"])
	print("RIDE_QA fails %d" % fails)
	get_tree().quit()

func _hold(key: Key, frames: int) -> void:
	var ev := InputEventKey.new()
	ev.physical_keycode = key
	ev.keycode = key
	ev.pressed = true
	Input.parse_input_event(ev)
	await _frames(frames)
	ev = ev.duplicate()
	ev.pressed = false
	Input.parse_input_event(ev)
	await get_tree().physics_frame

func _tap(key: Key) -> void:
	for pressed in [true, false]:
		var ev := InputEventKey.new()
		ev.physical_keycode = key
		ev.keycode = key
		ev.pressed = pressed
		Input.parse_input_event(ev)
		await get_tree().process_frame

func _frames(n: int) -> void:
	for i in n:
		await get_tree().physics_frame

func _shot(path: String) -> void:
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(path)

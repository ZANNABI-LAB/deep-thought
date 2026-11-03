## 접근성·상호작용 QA: 텔레포트에서 건물마다 돌길(StonePaths.routes)을 따라 문 앞(Building.use_point)까지 걸어갔다 돌아오고,
## 시설 접근·실행(Interactor)을 확인한다.
## 1)~2) NavGrid(scripts/nav_grid.gd)로 바닥 격자를 재서 돌길 중심선이 몸(반지름 0.5)이 지나는 빈칸만 지나는지(통로 폭 1.0 이상),
##   돌판이 받침판 밑으로 들어가지 않는지 보고
## 3) 갈 때는 WASD(8방향 키 입력)로, 올 때는 walk_to로 물리 이동한다.
## 문 앞에서: 도착 → 시설 활성화·안내 표시 → 시설 봄 → E 실행 → 떠나면 해제를 확인한다.
## godot --path apps/universe-godot --fixed-fps 60 --resolution 1600x1000 res://tools/path_qa.tscn -- <출력 폴더> [debug] [건물 이름...]
##   debug: 찾은 경로를 주황 선으로 그린다 (기본은 숨김)
##   출력(창 모드): all.png(전체), <건물>-door.png(문 앞에서 시설을 보는 장면). --headless면 그림 없이 결과만
extends Node

var _scene: Node
var _player: ZannabiPlayer
var _nav := NavGrid.new()
var _keys := {}

func _ready() -> void:
	var args := OS.get_cmdline_user_args()
	var out: String = args[0]
	var debug := args.has("debug")
	var only := []
	for a in args.slice(1):
		if a == a.to_upper() and a.length() > 2:
			only.append(a)
	DirAccess.make_dir_recursive_absolute(out)
	_scene = load("res://scenes/playground.tscn").instantiate()
	get_tree().root.add_child.call_deferred(_scene)
	await get_tree().create_timer(1.2).timeout
	_player = _scene._player
	_player.process_mode = Node.PROCESS_MODE_DISABLED  # 격자를 재는 동안 몸이 걸리지 않게
	await _nav.build((_scene as Node3D).get_world_3d(), [_player.get_rid()], get_tree())
	_player.process_mode = Node.PROCESS_MODE_INHERIT
	var shots := DisplayServer.get_name() != "headless"
	var fails := 0
	var debug_paths := []
	for b in _scene.BUILDINGS:
		var building: Building = _scene.get_node(b.name)
		var goal := building.use_point()
		var route: PackedVector3Array = _scene._stone_paths.routes[b.name]
		var smooth: PackedVector3Array = PackedVector3Array([Vector3.ZERO]) + route
		var path := smooth
		var blocked := 0
		var under := 0
		for p in _dense(smooth):
			if not _nav.is_free(_nav.cell_of(p)):
				blocked += 1
			# 길 가장자리 돌판도 받침판 밖에 있어야 한다 (중심선이 폭의 절반 이상 떨어짐). 문으로 들어가는 마지막 접근 구간은 그 건물만 뺀다
			for bb: Building in _scene._interactor.buildings:
				if bb == building and p.distance_to(goal) < StonePaths.APPROACH + 0.05:
					continue
				if bb.near_distance(p) < StonePaths.WIDTH / 2.0:
					under += 1
		debug_paths.append(path)
		if not only.is_empty() and not only.has(b.name):
			continue
		var it: Interactor = _scene._interactor
		# 갈 때: 키보드(8방향)로 수동 이동하듯. 창 모드(WSLg)는 창이 포커스를 잃으면 Godot이 눌린 키를 놓아 버려서
		# 키 흉내가 먹지 않는다 → 스크린샷용 창 모드에서는 walk_to로 간다 (키 이동 검증은 --headless에서)
		var there: float
		if shots:
			there = await _walk_to(smooth)
		else:
			there = await _walk_keys(smooth)
		var near := _flat_dist(_player.global_position, goal)
		await _frames(30)
		var shown := it.active == building and it._label.visible
		var faced := absf(angle_difference(_player.model.rotation.y, it.face_yaw(building))) < 0.25
		var used := [false]
		var on_used := func(id: String) -> void: used[0] = id == b.id
		it.used.connect(on_used)
		_tap(KEY_E)
		await _frames(5)
		it.used.disconnect(on_used)
		if shots:
			await _shot_around(building, "%s/%s-door.png" % [out, b.name])
		# 올 때: walk_to로
		var reversed := smooth.duplicate()
		reversed.reverse()
		var back := await _walk_to(reversed)
		var home := _flat_dist(_player.global_position, Vector3.ZERO)
		var cleared := it.active == null and not it._label.visible
		var ok: bool = blocked == 0 and under == 0 and near < 0.35 and shown and faced and used[0] and cleared and home < 0.6
		if not ok:
			fails += 1
		print("PATH_QA %-9s %s  막힘 %d  받침판 근접 %d  길이 %.1f  최소 통로 폭 %.2f  키 이동 %.1f초(오차 %.2f)  안내 %s  시설 봄 %s  E %s  이탈 해제 %s  복귀 %.1f초" % [
			b.name, "ok" if ok else "FAIL", blocked, under, _length(smooth), _nav.min_width(smooth), there, near,
			"o" if shown else "x", "o" if faced else "x", "o" if used[0] else "x", "o" if cleared else "x", back])
	print("PATH_QA fails %d" % fails)
	if shots:
		if debug:
			for p in debug_paths:
				_draw_debug(p)
		_player.global_position = Vector3.ZERO
		_player.velocity = Vector3.ZERO
		await _frames(30)
		await RenderingServer.frame_post_draw
		get_viewport().get_texture().get_image().save_png(out + "/all.png")
	get_tree().quit()

## 키 입력으로 걷기: 다음 점 방향을 8방향 중 가까운 쪽으로 눌러 간다 (화면 기준 WASD). 걸린 시간(초)
func _walk_keys(path: PackedVector3Array) -> float:
	var right := Vector3(1, 0, -1).normalized()
	var down := Vector3(1, 0, 1).normalized()
	var i := 1
	var frames := 0
	while frames < 1500:
		var to := path[i] - _player.global_position
		to.y = 0.0
		var last := i == path.size() - 1
		if to.length() < (0.2 if last else 0.45):
			if last:
				break
			i += 1
			continue
		var d := to.normalized()
		var sx := d.dot(right)
		var sy := d.dot(down)
		_set_keys({KEY_D: sx > 0.38, KEY_A: sx < -0.38, KEY_S: sy > 0.38, KEY_W: sy < -0.38})
		await get_tree().physics_frame
		frames += 1
	_set_keys({})
	await _frames(30)
	return frames / 60.0

func _set_keys(want: Dictionary) -> void:
	for key in [KEY_W, KEY_A, KEY_S, KEY_D]:
		var on: bool = want.get(key, false)
		if on != _keys.get(key, false):
			var ev := InputEventKey.new()
			ev.physical_keycode = key
			ev.keycode = key
			ev.pressed = on
			Input.parse_input_event(ev)
			_keys[key] = on

func _tap(key: Key) -> void:
	for pressed in [true, false]:
		var ev := InputEventKey.new()
		ev.physical_keycode = key
		ev.keycode = key
		ev.pressed = pressed
		Input.parse_input_event(ev)
		await get_tree().process_frame

## walk_to로 꺾은선을 따라 걷는다. 걸린 시간(초)
func _walk_to(path: PackedVector3Array) -> float:
	var i := 1
	var frames := 0
	_player.walk_to(path[i])
	while frames < 1500:
		await get_tree().physics_frame
		frames += 1
		var to := path[i] - _player.global_position
		to.y = 0.0
		var last := i == path.size() - 1
		if to.length() < (0.1 if last else 0.4):
			if last:
				break
			i += 1
			_player.walk_to(path[i])
	await _frames(20)
	return frames / 60.0

func _frames(n: int) -> void:
	for i in n:
		await get_tree().physics_frame

## 0.1 간격으로 촘촘히
func _dense(path: PackedVector3Array) -> PackedVector3Array:
	var out := PackedVector3Array()
	for i in range(1, path.size()):
		var n := int(ceil(path[i - 1].distance_to(path[i]) / 0.1)) + 1
		for k in n:
			out.append(path[i - 1].lerp(path[i], float(k) / n))
	out.append(path[-1])
	return out

func _flat_dist(a: Vector3, b: Vector3) -> float:
	return Vector2(a.x - b.x, a.z - b.z).length()

func _length(path: PackedVector3Array) -> float:
	var d := 0.0
	for i in range(1, path.size()):
		d += path[i - 1].distance_to(path[i])
	return d

## 디버그 경로: 꺾은선마다 납작한 주황 띠
func _draw_debug(path: PackedVector3Array) -> void:
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_color = Color(1.0, 0.55, 0.1, 0.8)
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	for i in range(1, path.size()):
		var a := path[i - 1]
		var b := path[i]
		var seg := MeshInstance3D.new()
		var box := BoxMesh.new()
		box.size = Vector3(0.12, 0.02, a.distance_to(b) + 0.12)
		seg.mesh = box
		seg.material_override = mat
		_scene.add_child(seg)
		seg.global_transform = Transform3D(Basis.looking_at(b - a, Vector3.UP), (a + b) / 2.0 + Vector3(0, 0.06, 0))

func _shot_around(building: Building, path: String) -> void:
	await RenderingServer.frame_post_draw
	var img := get_viewport().get_texture().get_image()
	var cam: Camera3D = _scene._camera
	var mid := (building.global_position + building.use_point()) / 2.0
	var at := Vector2i(cam.unproject_position(mid + Vector3(0, 1.2, 0)))
	var rect := Rect2i(at - Vector2i(230, 190), Vector2i(460, 360)).intersection(Rect2i(Vector2i.ZERO, img.get_size()))
	img.get_region(rect).save_png(path)

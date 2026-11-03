## 돌길 가이드 데이터: 돌길 중심선(StonePaths)과 건물 받침판 영역을 섬 바닥 그림(assets/island/floor.png)의 픽셀 좌표로 내보낸다.
## art/scripts/path_guide.py가 이것으로 바닥 그림 위에 가이드를 그리고, GPT가 그 가이드를 따라 돌길을 그려 넣는다.
## godot --headless --path apps/universe-godot res://tools/path_guide.tscn -- <출력.json>
##   바닥 위 점 P → 그림 픽셀 = FLOOR_PAD_PX + (P·화면 오른쪽, P·화면 아래쪽 × sin(내려다보는 각)) × FLOOR_PX_PER_UNIT / (1, FLOOR_SQUASH)
extends Node

func _ready() -> void:
	var out: String = OS.get_cmdline_user_args()[0]
	var scene: Node3D = load("res://scenes/playground.tscn").instantiate()
	get_tree().root.add_child.call_deferred(scene)
	await get_tree().create_timer(0.5).timeout
	var to_px := func(p: Vector3) -> Array:
		var v := Vector2(p.dot(scene.SCREEN_RIGHT), p.dot(scene.SCREEN_DOWN) * sin(deg_to_rad(scene.ELEVATION)))
		var px: Vector2 = scene.FLOOR_PAD_PX + v * scene.FLOOR_PX_PER_UNIT / Vector2(1.0, scene.FLOOR_SQUASH)
		return [snappedf(px.x, 0.1), snappedf(px.y, 0.1)]
	var data := {"floor": [scene.FLOOR_TEXTURE.get_width(), scene.FLOOR_TEXTURE.get_height()],
		"px_per_unit": [scene.FLOOR_PX_PER_UNIT, scene.FLOOR_PX_PER_UNIT * sin(deg_to_rad(scene.ELEVATION)) / scene.FLOOR_SQUASH],
		"width": StonePaths.WIDTH, "teleport": [to_px.call(Vector3.ZERO), scene.TELEPORT_RADIUS], "paths": {}}
	for b in scene.BUILDINGS:
		var building: Building = scene.get_node(b.name)
		var line: Array = []
		for p in scene._stone_paths.routes[b.name]:
			line.append(to_px.call(p))
		line.append(to_px.call(scene._stone_paths.ends[b.name]))
		# 받침판 영역: 0.1 간격으로 바닥을 훑어 보이는 받침판·계단·건물이 있는 점
		var solid: Array = []
		var at := building.global_position
		for iz in range(-60, 61):
			for ix in range(-60, 61):
				var p := at + Vector3(ix * 0.1, 0, iz * 0.1)
				if building.on_plate(p):
					solid.append(to_px.call(p))
		data.paths[b.name] = {"line": line, "door": to_px.call(building.use_point()), "solid": solid}
	var f := FileAccess.open(out, FileAccess.WRITE)
	f.store_string(JSON.stringify(data))
	f.close()
	print("PATH_GUIDE ", out)
	get_tree().quit()

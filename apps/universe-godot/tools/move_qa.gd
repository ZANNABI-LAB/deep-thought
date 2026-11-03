## 이름표 클릭 이동 QA: 웹의 MOVE_TO_OBJECT처럼 move_to_object를 불러 시설에서 시설로 연달아 걸어가게 하고,
## 문 앞에서 실행(used)됐는지, 걸린 시간을 본다. 텔레포트에서 출발해 건물 사이를 이어 다니는 길(굽지 않은 경로)을 확인한다.
## godot --headless --fixed-fps 60 --path apps/universe-godot res://tools/move_qa.tscn
extends Node

const ORDER := ["library-dome", "arcade-room", "radio-tower", "writing-station", "ai-terminal", "rocket-hangar", "library-dome"]
const LIMIT := 900  # 프레임 (15초)

func _ready() -> void:
	var scene: Node3D = load("res://scenes/playground.tscn").instantiate()
	get_tree().root.add_child.call_deferred(scene)
	await get_tree().create_timer(1.2).timeout
	while not scene._nav.ready:
		await get_tree().process_frame
	var fails := 0
	for id in ORDER:
		var b: Building = scene._building_of(id)
		var used := [false]
		var on_used := func(used_id: String) -> void: used[0] = used_id == id
		scene._interactor.used.connect(on_used)
		scene.move_to_object(id)
		var frames := 0
		while not used[0] and frames < LIMIT:
			await get_tree().physics_frame
			frames += 1
		scene._interactor.used.disconnect(on_used)
		if not used[0]:
			fails += 1
			var path: PackedVector3Array = scene._nav.find_path(scene._player.global_position, b.use_point())
			print("MOVE_QA   멈춘 곳 %s  문 앞 %s  남은 경로 %d점 %s" % [scene._player.global_position.snappedf(0.01), b.use_point().snappedf(0.01), path.size(), path])
		print("MOVE_QA %-16s %s  %.1f초" % [id, "ok" if used[0] else "FAIL", frames / 60.0])
	print("MOVE_QA fails %d" % fails)
	get_tree().quit()

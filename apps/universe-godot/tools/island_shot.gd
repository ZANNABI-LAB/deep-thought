## 섬 전체 장면 한 장: 등장 연출이 끝난 뒤 화면을 저장한다. 배치·섬 바닥 확인용.
## godot --path apps/universe-godot --resolution 1600x1000 res://tools/island_shot.tscn -- <출력 PNG> [painted] [nofloor]
##   painted: 배경 투명 (웹 배경 모드), nofloor: 임시 바닥·헬리패드를 숨기고 건물·Zannabi만 (GPT에 줄 배치 그림)
extends Node

func _ready() -> void:
	var scene: Node = load("res://scenes/playground.tscn").instantiate()
	get_tree().root.add_child.call_deferred(scene)
	await get_tree().create_timer(1.5).timeout
	if "nofloor" in OS.get_cmdline_user_args():
		for child in scene.get_children():
			if child is MeshInstance3D or child is Label:
				child.visible = false
	await RenderingServer.frame_post_draw
	get_viewport().get_texture().get_image().save_png(OS.get_cmdline_user_args()[0])
	var cam: Camera3D = scene._camera
	print("SHOT origin %s  +1 right %s  +1 down %s" % [cam.unproject_position(Vector3.ZERO), cam.unproject_position(scene.SCREEN_RIGHT), cam.unproject_position(scene.SCREEN_DOWN)])
	get_tree().quit()

## Tripo 모델 재질: 원본 색 텍스처에 부드러운 명암만 더한 paint.gdshader로 바꾼다.
## add_outline이면 실루엣 선(Outline)용 마스크 쌍둥이 메시도 붙인다. 선은 Outline.attach가 붙은 대상(Zannabi·건물) 주변에만 그려지지만,
## 그 영역 안에 놓인 소품·수레도 마스크가 있어야 건물 선이 소품을 가로지르지 않는다
class_name PaintLook

const PAINT := preload("res://shaders/paint.gdshader")
const MASK := preload("res://shaders/outline_mask.gdshader")

static func apply(model: Node3D, add_outline := true) -> void:
	_paint(model)
	if add_outline:
		Outline.add_mask_twins(model, mask_material())

static func _paint(node: Node) -> void:
	if node is MeshInstance3D:
		var mesh: Mesh = node.mesh
		for i in mesh.get_surface_count():
			var src := mesh.surface_get_material(i) as BaseMaterial3D
			var mat := ShaderMaterial.new()
			mat.shader = PAINT
			if src:
				mat.set_shader_parameter("raw_tex", src.albedo_texture)
			node.set_surface_override_material(i, mat)
	for child in node.get_children():
		_paint(child)

static func mask_material() -> ShaderMaterial:
	var mat := ShaderMaterial.new()
	mat.shader = MASK
	return mat

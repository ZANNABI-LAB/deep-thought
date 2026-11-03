## Zannabi 모델 재질(원본 색) + 얼굴 창 유리 + 실루엣 선 마스크.
## 유리 = 얼굴 창 모양 그대로 만든 곡면 (assets/zannabi/visor_v3.obj, 모델 좌표: 키 1.8, 앞 +Z).
## art/blender/visor_scan.py로 정면에서 깊이·색을 재고 art/scripts/visor_glass.py가 헬멧 색이 아닌 창 영역을
## 창 테두리에 맞춘 타원체 캡으로 덮었다 (이마~턱이 매끄러운 볼록 곡선, 코·선글라스와 0.03 여유, 접합부는 흰 테두리 안)
class_name ZannabiLook

const VISOR := preload("res://shaders/visor.gdshader")
const VISOR_MESH := preload("res://assets/zannabi/visor_v3.obj")

static func apply(model: Node3D) -> void:
	PaintLook.apply(model, false)
	var visor := MeshInstance3D.new()
	visor.name = "Visor"
	visor.mesh = VISOR_MESH
	var mat := ShaderMaterial.new()
	mat.shader = VISOR
	visor.material_override = mat
	visor.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	_attach_to_head(model, visor)
	Outline.add_mask_twins(model, PaintLook.mask_material())

## 유리를 머리 뼈에 붙인다 (유리 위치는 모델 좌표라 머리 뼈 기본 자세 기준으로 바꾼다)
static func _attach_to_head(model: Node3D, visor: Node3D) -> void:
	var sk := model.find_children("*", "Skeleton3D", true, false)[0] as Skeleton3D
	var bone := sk.find_bone("head")
	var attach := BoneAttachment3D.new()
	attach.bone_name = "head"
	sk.add_child(attach)
	var rest := sk.global_transform.affine_inverse() * model.global_transform
	visor.transform = sk.get_bone_global_rest(bone).affine_inverse() * rest * visor.transform
	attach.add_child(visor)

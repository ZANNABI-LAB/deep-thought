## 화면 공간 실루엣 선 (1px). 대상 카메라를 따라가는 보조 카메라가 MASK_LAYER만 찍어 마스크 화면을 만들고,
## 그 위에 outline.gdshader가 선을 그린 오버레이를 덮는다. 직교 카메라 전용.
## follow 주변 정사각형만 찍고 계산한다 (화면 전체보다 수십 배 싸다).
## 건물처럼 움직이지 않는 대상은 화면이 바뀌거나 watch(Zannabi)가 영역에 들어와 있을 때만 다시 찍는다
class_name Outline
extends CanvasLayer

const MASK_LAYER := 20
const LINES := preload("res://shaders/outline.gdshader")
## 선 굵기 (px). 게임 시점 QA에서 확정 (없음은 어색, 1.5~2px은 무거움)
const LINE_PX := 1.0
## 캐릭터 주변 영역 (월드 단위): 중심 높이와 한 변. 키 1.8 + 점프 + 팔을 담는다
const REGION_CENTER_Y := 1.1
const REGION_SIZE := 2.7

var target: Camera3D
var follow: Node3D
## 움직이지 않는 대상의 영역에 들어올 수 있는 움직이는 몸 (없으면 follow가 움직이는 대상이라 매 프레임 찍는다)
var watch: Node3D
var region_size := REGION_SIZE
var region_center_y := REGION_CENTER_Y
var _viewport: SubViewport
var _camera: Camera3D
var _rect: ColorRect
var _key := ""
var _watched := false

static func attach(parent: Node, camera: Camera3D, follow_node: Node3D,
		size := REGION_SIZE, center_y := REGION_CENTER_Y, watch_node: Node3D = null) -> Outline:
	var o := Outline.new()
	o.target = camera
	o.follow = follow_node
	o.watch = watch_node
	o.region_size = size
	o.region_center_y = center_y
	parent.add_child(o)
	return o

## 메시마다 같은 메시를 마스크 재질로 MASK_LAYER에 하나 더 둔다 (리깅된 메시는 같은 뼈대를 따라간다)
static func add_mask_twins(node: Node, material: Material) -> void:
	for child in node.get_children():
		add_mask_twins(child, material)
	if node is MeshInstance3D and not node.has_meta("outline_twin"):
		var twin := MeshInstance3D.new()
		twin.mesh = node.mesh
		twin.material_override = material
		twin.layers = 1 << (MASK_LAYER - 1)
		twin.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
		twin.set_meta("outline_twin", true)
		node.add_child(twin)
		if node.skin:
			twin.skin = node.skin
			twin.skeleton = twin.get_path_to(node.get_node(node.skeleton))

func _ready() -> void:
	target.set_cull_mask_value(MASK_LAYER, false)
	_viewport = SubViewport.new()
	_viewport.transparent_bg = true
	_viewport.msaa_3d = Viewport.MSAA_DISABLED
	add_child(_viewport)
	_camera = Camera3D.new()
	_camera.cull_mask = 1 << (MASK_LAYER - 1)
	_camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	_viewport.add_child(_camera)
	_camera.current = true
	_rect = ColorRect.new()
	_rect.mouse_filter = Control.MOUSE_FILTER_IGNORE
	var mat := ShaderMaterial.new()
	mat.shader = LINES
	mat.set_shader_parameter("mask", _viewport.get_texture())
	mat.set_shader_parameter("radius", LINE_PX / 2.0)
	_rect.material = mat
	add_child(_rect)
	_sync()

func _process(_delta: float) -> void:
	_sync()

func _sync() -> void:
	var screen := get_viewport().get_visible_rect().size
	# 화면 1px = target.size / 화면 높이 (월드 단위). 영역을 정수 px에 맞춰 선이 원래 화면 픽셀과 겹치게 한다
	var unit := target.size / screen.y
	var box := int(ceil(region_size / unit))
	var center := target.unproject_position(follow.global_position + Vector3.UP * region_center_y)
	var corner := (center - Vector2(box, box) / 2.0).round()
	var mid := corner + Vector2(box, box) / 2.0
	_camera.global_transform = target.global_transform
	_camera.near = target.near
	_camera.far = target.far
	_camera.size = box * unit
	_camera.h_offset = target.h_offset + (mid.x - screen.x / 2.0) * unit
	_camera.v_offset = target.v_offset - (mid.y - screen.y / 2.0) * unit
	_viewport.size = Vector2i(box, box)
	_rect.position = corner
	_rect.size = Vector2(box, box)
	_rect.material.set_shader_parameter("texel", Vector2.ONE / box)
	if watch == null:
		_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
		return
	var key := "%s %d %s" % [corner, box, target.global_transform.origin]
	var inside := Rect2(corner, Vector2(box, box)).intersects(_watch_rect(unit))
	if inside:
		_viewport.render_target_update_mode = SubViewport.UPDATE_ALWAYS
	elif key != _key or _watched:
		_viewport.render_target_update_mode = SubViewport.UPDATE_ONCE   # 바뀐 화면이나 막 떠난 몸을 한 번 다시 찍는다
	_key = key
	_watched = inside

## watch 몸이 화면에서 차지할 수 있는 사각형 (캐릭터 영역 크기)
func _watch_rect(unit: float) -> Rect2:
	var size := REGION_SIZE / unit
	var c := target.unproject_position(watch.global_position + Vector3.UP * REGION_CENTER_Y)
	return Rect2(c - Vector2(size, size) / 2.0, Vector2(size, size))

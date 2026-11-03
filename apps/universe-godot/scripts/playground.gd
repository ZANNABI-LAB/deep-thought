## 홈 월드: 섬 바닥 그림 위에 건물 6개·소품·Zannabi를 두고, 웹(apps/web GodotStage)과 메시지를 주고받는다 (packages/contracts).
## 카메라(고각 아이소, 정사영)는 섬 가운데에 고정하고, 섬 전체가 화면(웹 UI 사이 빈 영역)에 들어오도록 배율을 정한다.
## 좌표: "화면 축"(오른쪽, 아래쪽) = 바닥 위 방향. 텔레포트 패드 가운데가 원점
extends Node3D

const ELEVATION := 36.0  # 26.6°는 다닥다닥, 40°는 너무 높음 (2026-11-02)
const AZIMUTH := 45.0
## 화면 축 (카메라 방위 45°): 화면 오른쪽, 화면 아래쪽으로 가는 바닥 방향
const SCREEN_RIGHT := Vector3(0.70710678, 0, -0.70710678)
const SCREEN_DOWN := Vector3(0.70710678, 0, 0.70710678)
## 섬 바닥 그림 (GPT, 원본 art/refs/island-floor-gpt-v5-raw.png: tools/path_guide.tscn 가이드를 따라 돌길까지 그린 것). 카메라가 고정이라 카메라를 향한 판에 그대로 깐다.
## 텔레포트 패드 윗면 중심 픽셀 = 월드 원점. 그림은 33°에서 그려졌다(패드 타원 세로/가로 0.545) → 세로를 sin(36°)/sin(33°)배로 늘린다
const FLOOR_TEXTURE := preload("res://assets/island/floor.png")
const FLOOR_PAD_PX := Vector2(771, 428)
const FLOOR_PX_PER_UNIT := 47.0
const FLOOR_SQUASH := 1.08
## 그림에서 섬(절벽 포함)이 차지하는 픽셀 범위 (magick -trim으로 잰 값)
const FLOOR_ISLAND_PX := Rect2(97, 34, 1336, 922)
## 걸을 수 있는 윗면: 화면 축 기준 타원. 중심(오른쪽, 아래쪽)과 반지름 (월드 단위, 패드 = 원점). 가장자리 바위에서 0.8 안쪽
const ISLAND_CENTER := Vector2(0.19, 0.18)
const ISLAND_RADII := Vector2(12.6, 13.15)
## 그림 속 크레이터·바위: 화면 축 좌표(x, y)와 반지름(z). 원통 충돌로 막는다 (그림 픽셀에서 환산)
const OBSTACLES := [
	Vector3(-9.1, -7.3, 1.8), Vector3(8.7, 8.7, 2.1), Vector3(-4.8, -12.0, 1.4),
	Vector3(7.2, -10.9, 1.5), Vector3(11.7, 2.0, 1.1), Vector3(-9.4, 5.3, 1.1),
]
## 섬 전체를 담는 화면 비율 (가로, 세로). 세로에는 뒤쪽 건물이 섬 위로 솟는 여유 BUILDING_TOP을 더한다
const FIT := Vector2(0.62, 0.9)
## 웹이 히어로·패널 사이 빈 영역(SET_SAFE_AREA)을 알려 주면 그 폭의 이만큼에 섬을 맞춘다
const SAFE_FIT := 0.94
const BUILDING_TOP := 4.0

## 건물 자리: art/refs/village-layout-v1.png(GPT 배치 그림)의 받침판 중심을 텔레포트·섬 크기에 맞춰 옮긴 값.
##   at = 화면 축 좌표(오른쪽, 아래쪽). 모델은 같은 카메라로 그린 단독 그림(art/refs/v2-*.png)에서 만들어 모두 0°일 때 그림과 같다.
##   Tripo는 입력 그림에 보인 면만 정확하므로 돌리지 않는다.
## door: 문·계단·조작대 앞 바닥 (모델 좌표 x, z, 받침판 가장자리에서 0.7 밖). 이름표를 클릭하면 여기까지 걸어가 실행한다.
##   위치는 모델 렌더에서 잰 좌표: READING 계단(카메라 쪽 모서리라 대각선 밖), PROJECTS·WRITING·ARCADE 왼쪽 아래 면(+z) 문,
##   ASK·LAB 오른쪽 아래 면(+x) 조작대 (tools/path_qa.tscn으로 왕복 확인). 접근·실행 범위는 건물 둘레 전체 (Interactor.NEAR)
## 받침판·몸체 충돌과 외곽선 영역은 모델 옆 <이름>.json 치수로 정한다
const BUILDINGS := [
	{"name": "READING", "at": Vector2(-2.15, -8.3), "door": Vector2(2.7, 2.1), "id": "library-dome", "title": "도서관", "scene": preload("res://assets/buildings/library_dome.glb")},
	{"name": "PROJECTS", "at": Vector2(4.8, -7.0), "door": Vector2(-0.15, 3.2), "id": "rocket-hangar", "title": "발사대", "scene": preload("res://assets/buildings/rocket_hangar.glb")},
	{"name": "WRITING", "at": Vector2(9.5, -1.1), "door": Vector2(-0.45, 3.05), "id": "writing-station", "title": "집필실", "scene": preload("res://assets/buildings/writing_station.glb")},
	{"name": "ASK", "at": Vector2(-6.1, 3.8), "door": Vector2(2.55, -0.05), "id": "ai-terminal", "title": "터미널", "scene": preload("res://assets/buildings/ai_terminal.glb")},
	{"name": "ARCADE", "at": Vector2(3.4, 9.0), "door": Vector2(-0.4, 3.08), "id": "arcade-room", "title": "아케이드", "scene": preload("res://assets/buildings/arcade_room.glb")},
	{"name": "LAB", "at": Vector2(-7.5, -3.5), "door": Vector2(2.87, 0.0), "id": "radio-tower", "title": "안테나", "scene": preload("res://assets/buildings/radio_tower.glb")},
]
## 텔레포트 패드 반지름 (그림 144px / 47px). 돌길이 이 가장자리에서 시작한다
const TELEPORT_RADIUS := 3.0
## 돌길 경로 (scripts/stone_paths.gd): 텔레포트 가장자리에서 방사형으로 시설 사용 지점까지. "bend"(도)로 출발 방향을 돌린다
const STONE_PATHS := {
	"READING": {}, "PROJECTS": {}, "WRITING": {}, "ASK": {"bend": 20}, "ARCADE": {"bend": -12}, "LAB": {},
}
## 소품 (scripts/prop.gd, 그림 art/refs/prop-*.png, 빌드 art/scripts/build_godot_prop.sh). at: 화면 축 좌표, yaw: 도, scale: 크기(선택)
##   돌길 띠(폭 1.2)·받침판·텔레포트·바위에서 떨어지고 건물 뒤에 가려지지 않는 빈 바닥에 둔다 (tools/path_qa.tscn이 길이 막히지 않는지 확인).
##   상자·가로등·표지판은 어색해서 뺐다. 보급품은 로켓 보급 구역 하나로 모은다
const PROPS := [
	# 로켓 보급 구역: 로켓 기단 가까이 하나로 모은다 (로켓 계단·집필실 진입로 사이 통로는 비움, 길 쪽으로 늘어서지 않게)
	{"name": "RocketFuel", "at": Vector2(5.7, -3.2), "yaw": 0.0, "scene": preload("res://assets/props/fuel_tanks.glb")},
	{"name": "RocketFuel2", "at": Vector2(6.25, -3.95), "yaw": 70.0, "scene": preload("res://assets/props/fuel_tanks.glb")},
	# E로 타는 수레 (scripts/rover.gd): 보급 구역 왼쪽(텔레포트 쪽)에 주차, 앞(전조등)이 카메라 쪽(화면 아래 = 월드 yaw 45°)
	{"name": "Rover", "at": Vector2(3.8, -1.8), "yaw": 45.0, "ride": true, "scene": preload("res://assets/props/cargo_rover.glb")},
]
## 등장 연출: 첫 프레임이 그려진 뒤 섬이 점처럼 작은 크기에서 통통 튀듯 커진다
const REVEAL_TIME := 0.8
const REVEAL_FROM := 0.02  # 거의 점에서 시작해 "없다가 나타나는" 느낌

var _player: ZannabiPlayer
var _camera: Camera3D
var _offset: Vector3
var _focus: Vector3
## -1: 첫 프레임 대기, 0 이상: 등장 연출 경과 시간
var _reveal_t := -1.0
var _stats_timer := 0.0
var _web_message_cb: JavaScriptObject  # 참조를 들고 있어야 콜백이 사라지지 않는다
## 섬을 둘 화면 가로 범위 (0~1, 왼쪽·오른쪽). 웹 UI가 없으면 화면 전체
var _safe := Vector2(0.0, 1.0)
var _nav := NavGrid.new()
## 이름표 클릭으로 걸어가는 중인 시설 (문 앞에 도착하면 실행). 격자를 재는 중이면 다 잰 뒤에 출발
var _walk_target: Building
var _interactor := Interactor.new()
var _stone_paths := StonePaths.new()
## 마지막으로 웹에 보낸 이름표 자리·수레 안내 (바뀔 때만 다시 보낸다)
var _sent_anchors := ""
var _sent_ride := ""

func _ready() -> void:
	if _web_paints_background():
		# 배경 그림은 웹이 깐다: 섬·캐릭터 밖은 투명하게
		RenderingServer.set_default_clear_color(Color(0, 0, 0, 0))
		get_viewport().transparent_bg = true
	else:
		RenderingServer.set_default_clear_color(Color("#080f1f"))
	_build_ground()
	_player = ZannabiPlayer.new()
	add_child(_player)
	_camera = Camera3D.new()
	_camera.projection = Camera3D.PROJECTION_ORTHOGONAL
	add_child(_camera)
	_camera.current = true
	var el := deg_to_rad(ELEVATION)
	var az := deg_to_rad(AZIMUTH)
	_offset = Vector3(cos(el) * sin(az), sin(el), cos(el) * cos(az)) * 60.0
	_camera.far = 200.0
	_camera.look_at_from_position(_offset, Vector3.ZERO)
	# 그림 속 섬(+ 위로 솟는 건물)의 가운데를 본다
	var island := _floor_island_rect()
	_focus = _on_view(island.get_center() - Vector2(0, BUILDING_TOP / 2.0))
	_add_floor_painting()
	Outline.attach(self, _camera, _player)
	for b in BUILDINGS:
		var building_def: Dictionary = b.duplicate()
		building_def.pos = _on_floor(b.at)
		_interactor.buildings.append(Building.spawn(self, _camera, building_def, _player))
	for p in PROPS:
		var prop_def: Dictionary = p.duplicate()
		prop_def.pos = _on_floor(p.at)
		if p.get("ride", false):
			_interactor.rover = Rover.spawn(self, prop_def)
			_interactor.rover.parked.connect(_on_rover_parked)
		else:
			Prop.spawn(self, prop_def)
	_interactor.player = _player
	add_child(_interactor)
	var by_name := {}
	for b in _interactor.buildings:
		by_name[b.name] = b
	_stone_paths.name = "StonePaths"
	add_child(_stone_paths)
	_stone_paths.build(STONE_PATHS, by_name, TELEPORT_RADIUS)
	_announce_first_frame()
	_player.arrived.connect(_on_arrived)
	_build_nav.call_deferred()
	if OS.has_feature("web"):
		_web_message_cb = JavaScriptBridge.create_callback(_on_web_message)
		JavaScriptBridge.get_interface("window").addEventListener("message", _web_message_cb)
	var help := Label.new()
	help.text = "WASD: move    Space: jump"  # 기본 폰트에 한글이 없다
	help.position = Vector2(16, 12)
	help.add_theme_color_override("font_color", Color("#c9cdd6"))
	help.visible = not OS.has_feature("web")  # 데스크톱 시험에서만
	add_child(help)

func _process(delta: float) -> void:
	if OS.has_feature("web"):
		_report_to_web(delta)
	_camera.size = _fit_height() / _reveal_scale(delta)
	var focus := _view_focus()
	_camera.position = focus + _offset
	_camera.look_at(focus)
	if OS.has_feature("web") and _reveal_t >= REVEAL_TIME:
		_send_anchors()
		_send_ride_prompt()

## 화면 축 좌표(오른쪽, 아래쪽) → 바닥 위 월드 좌표
func _on_floor(at: Vector2) -> Vector3:
	return SCREEN_RIGHT * at.x + SCREEN_DOWN * at.y

## 그림 속 섬(절벽 포함)이 차지하는 화면 평면 사각형 (월드 단위, 패드 = 원점, x 오른쪽, y 아래쪽)
func _floor_island_rect() -> Rect2:
	var scale := Vector2(1.0, FLOOR_SQUASH) / FLOOR_PX_PER_UNIT
	return Rect2((FLOOR_ISLAND_PX.position - FLOOR_PAD_PX) * scale, FLOOR_ISLAND_PX.size * scale)

## 화면 평면 좌표(오른쪽, 아래쪽, 월드 단위) → 원점을 지나는 카메라 평면 위의 월드 좌표
func _on_view(at: Vector2) -> Vector3:
	var b := _camera.global_transform.basis
	return b.x * at.x - b.y * at.y

## 섬 그림: 카메라를 향한 판. 정사영이라 시선 방향으로 멀리 밀어도 화면 위치는 같다 → 모든 것 뒤에 그려진다
func _add_floor_painting() -> void:
	var size := Vector2(FLOOR_TEXTURE.get_width(), FLOOR_TEXTURE.get_height() * FLOOR_SQUASH) / FLOOR_PX_PER_UNIT
	var center := (Vector2(FLOOR_TEXTURE.get_width(), FLOOR_TEXTURE.get_height()) / 2.0 - FLOOR_PAD_PX) * Vector2(1.0, FLOOR_SQUASH) / FLOOR_PX_PER_UNIT
	var quad := MeshInstance3D.new()
	quad.name = "FloorPainting"
	var mesh := QuadMesh.new()
	mesh.size = size
	quad.mesh = mesh
	var mat := StandardMaterial3D.new()
	mat.shading_mode = BaseMaterial3D.SHADING_MODE_UNSHADED
	mat.albedo_texture = FLOOR_TEXTURE
	mat.transparency = BaseMaterial3D.TRANSPARENCY_ALPHA
	mat.texture_filter = BaseMaterial3D.TEXTURE_FILTER_LINEAR_WITH_MIPMAPS
	quad.material_override = mat
	quad.cast_shadow = GeometryInstance3D.SHADOW_CASTING_SETTING_OFF
	add_child(quad)
	var b := _camera.global_transform.basis
	quad.global_transform = Transform3D(b, _on_view(center) - b.z * 40.0)

## 섬 전체가 FIT 비율(웹 UI가 있으면 빈 영역의 SAFE_FIT) 안에 들어오는 카메라 세로 크기 (월드 단위)
func _fit_height() -> float:
	var screen := get_viewport().get_visible_rect().size
	var island := _floor_island_rect().size + Vector2(0, BUILDING_TOP)
	var fit_x := FIT.x if _safe == Vector2(0.0, 1.0) else (_safe.y - _safe.x) * SAFE_FIT
	var px_per_unit := minf(screen.x * fit_x / island.x, screen.y * FIT.y / island.y)
	return screen.y / px_per_unit

## 카메라가 볼 점: 섬 가운데가 빈 영역 가운데에 오도록 화면 가로로 민다
func _view_focus() -> Vector3:
	var screen := get_viewport().get_visible_rect().size
	var width := _camera.size * screen.x / screen.y
	return _focus + _camera.global_transform.basis.x * (0.5 - (_safe.x + _safe.y) / 2.0) * width

## 웹 페이지 주소에 ?bg=web 이 있으면 배경 그림은 웹이 깔고 Godot은 투명하게 그린다
## 데스크톱에서는 -- painted 인자로 같은 모드를 시험할 수 있다
func _web_paints_background() -> bool:
	if not OS.has_feature("web"):
		return "painted" in OS.get_cmdline_user_args()
	# 숫자로 받는다 (불리언 비교 결과는 GDScript로 넘어오며 null이 될 수 있다)
	return int(JavaScriptBridge.eval("new URLSearchParams(location.search).get('bg') === 'web' ? 1 : 0")) == 1

## 첫 프레임이 실제로 그려진 뒤에 웹에 WORLD_READY를 알리고 등장 연출을 시작한다. 모션 줄이기 설정이면 연출 없이 바로 제 크기로
func _announce_first_frame() -> void:
	await RenderingServer.frame_post_draw
	var instant := false
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.parent.postMessage({type:'WORLD_READY'}, window.location.origin)")
		instant = int(JavaScriptBridge.eval("matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 0")) == 1
	_reveal_t = REVEAL_TIME if instant else 0.0

## 화면 배율 (1 = 제 크기). 첫 프레임 전에는 작은 크기로 기다린다
func _reveal_scale(delta: float) -> float:
	if _reveal_t < 0.0:
		return REVEAL_FROM
	# 첫 프레임 직후는 셰이더 준비로 한 프레임이 길 수 있어 연출이 건너뛰지 않게 자른다
	_reveal_t = minf(_reveal_t + minf(delta, 1.0 / 30.0), REVEAL_TIME)
	var t := _reveal_t / REVEAL_TIME - 1.0
	var back := 1.0 + 2.4 * t * t * t + 1.4 * t * t  # ease-out-back: 끝에서 살짝 넘쳤다 돌아온다
	return lerpf(REVEAL_FROM, 1.0, back)

## 1초마다 FPS를 window.__godotStats에 남긴다 (apps/web/e2e/godot.spec.ts가 읽는다)
func _report_to_web(delta: float) -> void:
	_stats_timer += delta
	if _stats_timer >= 1.0:
		_stats_timer = 0.0
		JavaScriptBridge.eval("window.__godotStats = {fps: %d, frames: %d}" % [Engine.get_frames_per_second(), Engine.get_process_frames()])

## 웹 → 월드 메시지 (packages/contracts WebToWorld). 같은 출처에서 온 것만 받는다
func _on_web_message(args: Array) -> void:
	var event: JavaScriptObject = args[0]
	if event.origin != JavaScriptBridge.get_interface("location").origin or event.data == null:
		return
	match str(event.data.type):
		"PAUSE_INPUT":
			_player.input_enabled = false
		"RESUME_INPUT":
			_player.input_enabled = true
		"SET_SAFE_AREA":
			var w := float(JavaScriptBridge.eval("window.innerWidth"))
			if w > 0.0:
				_safe = Vector2(clampf(float(event.data.left) / w, 0.0, 1.0), clampf(float(event.data.right) / w, 0.0, 1.0))
				if _safe.y - _safe.x < 0.3:  # 좁은 화면: 웹 UI가 섬 위가 아니라 아래에 쌓인다
					_safe = Vector2(0.0, 1.0)
		"MOVE_TO_OBJECT":
			move_to_object(str(event.data.objectId))

## 이름표 클릭: 그 시설 문 앞까지 걸어가서 실행한다 (격자를 재는 중이면 다 잰 뒤에 출발)
func move_to_object(object_id: String) -> void:
	_player.dismount()   # 수레를 타고 있으면 내려서 걸어간다
	_walk_target = _building_of(object_id)
	if _walk_target and _nav.ready:
		_walk_to_building()

func _building_of(object_id: String) -> Building:
	for b in BUILDINGS:
		if b.id == object_id:
			return get_node(b.name)
	return null

## 길찾기 격자: 첫 프레임 뒤에 여러 프레임에 나눠 잰다 (그동안 캐릭터 몸은 빼고)
func _build_nav() -> void:
	# 첫 프레임을 먼저 그린다 (frame_post_draw는 헤드리스에서 오지 않아 프레임 진행으로 기다린다)
	for i in 2:
		await get_tree().process_frame
	await _nav.build(get_world_3d(), [_player.get_rid()], get_tree())
	if _walk_target:
		_walk_to_building()

## 문 앞까지 길을 찾아 걷는다. 이미 건물 가까이면 바로 실행
func _walk_to_building() -> void:
	var b := _walk_target
	if _interactor.active == b:
		_walk_target = null
		_interactor.use()
		return
	# 텔레포트 위에서 출발하면 돌길을 따라 걷는다 (보이는 길 = 걷는 길). 그 밖이거나 돌길을 수레가 막았으면 길찾기
	var path: PackedVector3Array
	if Vector2(_player.global_position.x, _player.global_position.z).length() < TELEPORT_RADIUS and _stone_paths.routes.has(b.name):
		path = PackedVector3Array([_player.global_position]) + _stone_paths.routes[b.name]
		if _nav.all_free(path):
			_player.walk_path(path)
			return
	path = _nav.find_path(_player.global_position, b.use_point())
	if path.is_empty():
		path = PackedVector3Array([_player.global_position, b.use_point()])
	_player.walk_path(_nav.smooth(path))

## 수레를 세웠다: 떠난 자리와 새 자리 주변의 길찾기 격자를 다시 잰다 (몸 충돌을 되살린 뒤라 Zannabi는 뺀다)
func _on_rover_parked(from: Vector3) -> void:
	await get_tree().physics_frame   # 물리 공간에 몸 위치가 반영된 뒤에 잰다
	_nav.refresh(get_world_3d(), [_player.get_rid()], from, Rover.NAV_RADIUS)
	_nav.refresh(get_world_3d(), [_player.get_rid()], _interactor.rover.global_position, Rover.NAV_RADIUS)

func _on_arrived() -> void:
	var b := _walk_target
	_walk_target = null
	if b and _interactor.active == b:
		_interactor.use()

## 건물마다 이름표 자리(건물 중간 높이, CSS px)를 웹에 알린다 (packages/contracts OBJECT_ANCHORS). 이름표는 건물에 겹쳐 뜬다
func _send_anchors() -> void:
	var screen := get_viewport().get_visible_rect().size
	var parts := []
	for def in BUILDINGS:
		var b: Building = get_node(def.name)
		var p := _camera.unproject_position(b.global_position + Vector3(0, b.def.height * 0.5, 0))
		parts.append("'%s':{x:%d,y:%d}" % [def.id, roundi(p.x), roundi(p.y)])
	var key := ",".join(parts) + "@%dx%d" % [screen.x, screen.y]
	if key == _sent_anchors:
		return
	_sent_anchors = key
	# 뷰포트 픽셀 → iframe CSS px
	JavaScriptBridge.eval("(() => { const k = window.innerWidth / %f; const a = {%s};" % [screen.x, ",".join(parts)]
		+ " for (const id in a) { a[id].x *= k; a[id].y *= k; }"
		+ " window.parent.postMessage({type:'OBJECT_ANCHORS', anchors:a}, window.location.origin); })()")

## 수레 안내(E 타기·내리기)를 웹에 알린다 (packages/contracts RIDE_PROMPT). 웹이 건물 이름표와 같은 모양으로 수레 위에 띄운다
func _send_ride_prompt() -> void:
	var rover := _interactor.rover
	if not rover:
		return
	var action := "'dismount'" if _player.riding else ("'ride'" if _interactor.rover_active else "null")
	var screen := get_viewport().get_visible_rect().size
	var p := _camera.unproject_position(rover.global_position + Vector3(0, Rover.PROMPT_HEIGHT, 0))
	var key := "%s@%d,%d@%dx%d" % [action, roundi(p.x), roundi(p.y), screen.x, screen.y]
	if key == _sent_ride:
		return
	_sent_ride = key
	JavaScriptBridge.eval("(() => { const k = window.innerWidth / %f;" % screen.x
		+ " window.parent.postMessage({type:'RIDE_PROMPT', action:%s, at:{x:%d*k, y:%d*k}}, window.location.origin); })()" % [action, roundi(p.x), roundi(p.y)])

func _build_ground() -> void:
	var body := StaticBody3D.new()
	add_child(body)
	var shape := CollisionShape3D.new()
	var box := BoxShape3D.new()
	box.size = Vector3(80, 1, 80)
	shape.shape = box
	shape.position.y = -0.5
	body.add_child(shape)
	# 섬 바깥으로 못 나가게 타원 둘레에 벽
	var segments := 64
	for i in segments:
		var a := (i + 0.5) * TAU / segments
		var at := ISLAND_CENTER + Vector2(cos(a) * ISLAND_RADII.x, sin(a) * ISLAND_RADII.y)
		var tangent := _on_floor(Vector2(-sin(a) * ISLAND_RADII.x, cos(a) * ISLAND_RADII.y)).normalized()
		var wall := CollisionShape3D.new()
		var wb := BoxShape3D.new()
		wb.size = Vector3(TAU * ISLAND_RADII.y / segments + 0.6, 3, 0.4)
		wall.shape = wb
		wall.position = _on_floor(at) + Vector3(0, 1.5, 0)
		wall.basis = Basis(tangent, Vector3.UP, tangent.cross(Vector3.UP))
		body.add_child(wall)

	# 그림 속 크레이터·바위
	for o in OBSTACLES:
		var col := CollisionShape3D.new()
		var cyl := CylinderShape3D.new()
		cyl.radius = o.z
		cyl.height = 3.0
		col.shape = cyl
		col.position = _on_floor(Vector2(o.x, o.y)) + Vector3(0, 1.5, 0)
		body.add_child(col)

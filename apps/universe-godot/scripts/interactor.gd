## 시설 접근·실행: Zannabi가 건물 받침판에서 NEAR 안으로 들어오면 그 건물이 활성화된다 (여럿이면 가장 가까운 건물 하나).
## 활성화되면 웹에 OBJECT_NEAR(이름표 강조), 벗어나면 OBJECT_LEAVE, E를 누르면 INTERACT를 보낸다.
## 활성 건물이 있는 동안 Zannabi는 멈춰 서면 그 건물을 본다 (인사하지 않는다).
## 웹이 아닐 때(데스크톱 시험)는 건물 위에 "E · 시설명" 안내를 띄운다. 웹에서는 웹 이름표가 그 역할을 한다
## 수레(Rover): 건물보다 가까우면 E가 수레로 간다 ("E · 타기"). 타는 동안은 건물을 활성화하지 않고 E는 내리기 ("E · 내리기").
## 수레 안내: 웹에서는 웹이 건물 이름표와 같은 모양으로 띄운다 (playground RIDE_PROMPT). 데스크톱 시험에서는 Godot 글자로
class_name Interactor
extends Node

signal used(object_id: String)

## 받침판 가장자리에서 이 거리 안이면 가까이 온 것 (문·조작대 앞 걸음 목표 door는 0.7 밖)
const NEAR := 1.2
## 수레 가장자리에서 이 거리 안이면 탈 수 있다
const RIDE_NEAR := 1.2
const FONT := preload("res://assets/fonts/pad-label.otf")

var player: ZannabiPlayer
var buildings: Array[Building] = []
var rover: Rover
## 지금 E가 수레로 가는지 (타기)
var rover_active := false
## 지금 활성화된 건물 (없으면 null)
var active: Building
var _label: Label3D
var _ride_label: Label3D

func _ready() -> void:
	_label = _make_label()
	_ride_label = _make_label()

func _make_label() -> Label3D:
	var l := Label3D.new()
	l.font = FONT
	l.font_size = 30
	l.outline_size = 10
	l.outline_modulate = Color("#0b1220")
	l.billboard = BaseMaterial3D.BILLBOARD_ENABLED
	l.no_depth_test = true
	l.fixed_size = true
	l.pixel_size = 0.0011
	l.visible = false
	add_child(l)
	return l

func _physics_process(_delta: float) -> void:
	var best: Building
	var best_d := NEAR
	if not player.riding:
		for b in buildings:
			var d := b.near_distance(player.global_position)
			if d < best_d:
				best_d = d
				best = b
	rover_active = false
	if rover and not player.riding and rover.near_distance(player.global_position) < minf(RIDE_NEAR, best_d):
		rover_active = true
		best = null
	_ride_label.visible = rover != null and (rover_active or player.riding != null) and not OS.has_feature("web")
	if _ride_label.visible:
		_ride_label.text = "E · 내리기" if player.riding else "E · 타기"
		_ride_label.global_position = rover.global_position + Vector3(0, Rover.PROMPT_HEIGHT, 0)
	if best != active:
		if active:
			_post("{type:'OBJECT_LEAVE', objectId:'%s'}" % active.def.id)
		active = best
		if active:
			_post("{type:'OBJECT_NEAR', objectId:'%s'}" % active.def.id)
		_label.visible = active != null and not OS.has_feature("web")
		if active:
			_label.text = "E · " + active.def.title
			_label.global_position = active.global_position + Vector3(0, active.def.height + 0.6, 0)
	if active:
		player.focus_yaw = face_yaw(active)
	else:
		player.focus_yaw = NAN

## 지금 위치에서 건물 가운데를 보는 방향 (월드 yaw)
func face_yaw(b: Building) -> float:
	var d := b.global_position - player.global_position
	return atan2(d.x, d.z)

func _unhandled_input(event: InputEvent) -> void:
	if not (player.input_enabled and event is InputEventKey and event.pressed and not event.echo \
			and event.physical_keycode == KEY_E):
		return
	if player.riding:
		player.dismount()
	elif rover_active:
		player.mount(rover)
	elif active:
		use()

## 시설 실행: 웹에 INTERACT를 알린다
func use() -> void:
	if not active:
		return
	used.emit(active.def.id)
	_post("{type:'INTERACT', objectId:'%s'}" % active.def.id)

func _post(message: String) -> void:
	if OS.has_feature("web"):
		JavaScriptBridge.eval("window.parent.postMessage(%s, window.location.origin)" % message)

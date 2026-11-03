## 돌길 경로: 텔레포트 가장자리에서 방사형으로 뻗어 시설 사용 지점(문·계단·조작대 앞)까지 가는 중심선. 그리지는 않는다.
## 돌길 그림은 섬 바닥 그림(assets/island/floor.png, 원본 art/refs/island-floor-gpt-v5-raw.png)에 들어 있고, 이 중심선으로 만든 가이드(tools/path_guide.tscn)를 따라 그렸다.
## 걷는 길(이름표 클릭 이동·tools/path_qa)도 이 중심선을 따른다.
##   텔레포트 가장자리(접근점 방향) → 3차 베지어 → 접근점(사용 지점에서 건물 반대쪽으로 APPROACH) → 사용 지점
## 출발은 텔레포트 반지름 방향, 도착은 문 정면 방향이라 문 앞에서 살짝 꺾여 정면으로 들어간다.
class_name StonePaths
extends Node3D

const WIDTH := 1.2
## 사용 지점에서 이만큼 바깥의 접근점을 지나 문을 정면으로 들어간다
const APPROACH := 0.9
## 베지어 손잡이 길이 (출발·도착 사이 거리 비율). 클수록 그 방향을 오래 유지한다. 도착 쪽을 길게 둬서 문 앞에서 급히 꺾지 않게
const HANDLE_START := 0.3
const HANDLE_END := 0.55

## 경로 이름 → 중심선 (월드 좌표, y = 0): 텔레포트 가장자리 → 사용 지점
var routes := {}
## 경로 이름 → 받침판 입구 (Building.plate_entry). 그림 속 길은 여기까지 이어진다
var ends := {}

## defs: 이름 → {"bend": 출발 방향을 돌리는 각도(도, 선택)}. buildings: 이름 → Building. radius: 텔레포트 반지름
func build(defs: Dictionary, buildings: Dictionary, radius: float) -> void:
	for name in defs:
		var b: Building = buildings[name]
		var door := b.use_point()
		var edge := b.plate_entry(door)
		var out := (door - edge).normalized()
		var approach := door + out * APPROACH
		var radial := Vector3(approach.x, 0, approach.z).normalized().rotated(Vector3.UP, deg_to_rad(defs[name].get("bend", 0.0)))
		var start := radial * radius
		var d := start.distance_to(approach)
		var line := _bezier(start, start + radial * d * HANDLE_START, approach + out * d * HANDLE_END, approach, 0.1)
		line.append(door)
		routes[name] = line
		ends[name] = edge

func _bezier(p0: Vector3, p1: Vector3, p2: Vector3, p3: Vector3, step: float) -> PackedVector3Array:
	var out := PackedVector3Array()
	var n := maxi(int(ceil(p0.distance_to(p3) / step)), 1)
	for k in n + 1:
		var t := float(k) / n
		var u := 1.0 - t
		out.append(u * u * u * p0 + 3.0 * u * u * t * p1 + 3.0 * u * t * t * p2 + t * t * t * p3)
	return out

## 섬 바닥 길찾기 격자: Zannabi 몸(캡슐, 여유 포함)이 들어가는 칸을 물리 질의로 재고, 벽에서 떨어진 칸을 선호하는 A*로 경로를 찾는다.
## 게임(웹 이름표 클릭 → 문 앞까지 걷기)과 tools/path_qa.tscn(통행 QA)이 같이 쓴다.
## 처음 한 번 전체를 재고(build는 여러 프레임에 나눠 돈다), 수레를 다른 곳에 세우면 그 주변만 다시 잰다 (refresh)
class_name NavGrid
extends RefCounted

const STEP := 0.25
const EXTENT := 16.0
## 몸 반지름 0.35 + 여유 → 빈칸만 지나면 통로 폭 1.0 이상
const BODY_RADIUS := 0.5
## 이보다 낮은 턱(받침판·계단 경사)은 걸어서 넘는다고 보고 판정하지 않는다
const STEP_UP := 0.5
## 벽에서 이만큼(칸) 안쪽 빈칸은 비용을 올려 통로 가운데로 다니게 한다 (폭 1.2~1.4 목표)
const WALL_MARGIN := 2
const WALL_COST := 4.0

var ready := false
var _nx := 0
var _free := PackedByteArray()
var _astar: AStarGrid2D

## 칸마다 몸이 들어가는지: 턱 높이 위로 띄운 캡슐이 아무것에도 닿지 않으면 빈칸. exclude = 캐릭터 몸
func build(world: World3D, exclude: Array[RID], tree: SceneTree) -> void:
	_nx = int(EXTENT * 2.0 / STEP)
	_free.resize(_nx * _nx)
	var q := _query(exclude)
	var space := world.direct_space_state
	for iz in _nx:
		for ix in _nx:
			_free[iz * _nx + ix] = _measure(space, q, ix, iz)
		if iz % 8 == 0:  # 웹에서 한 프레임이 길게 멈추지 않게 잘게 나눈다
			await tree.physics_frame
	_astar = AStarGrid2D.new()
	_astar.region = Rect2i(0, 0, _nx, _nx)
	_astar.cell_size = Vector2(STEP, STEP)
	_astar.diagonal_mode = AStarGrid2D.DIAGONAL_MODE_ONLY_IF_NO_OBSTACLES
	_astar.update()
	for iz in _nx:
		for ix in _nx:
			_update_point(Vector2i(ix, iz))
		if iz % 8 == 0:
			await tree.process_frame
	ready = true

## 바닥 점 둘레 radius 안의 칸만 다시 잰다 (수레를 다른 곳에 세웠을 때: 떠난 자리와 새 자리). 한 프레임에 끝난다
func refresh(world: World3D, exclude: Array[RID], center: Vector3, radius: float) -> void:
	if not ready:
		return
	var q := _query(exclude)
	var space := world.direct_space_state
	var lo := cell_of(center - Vector3(radius, 0, radius))
	var hi := cell_of(center + Vector3(radius, 0, radius))
	for iz in range(lo.y, hi.y + 1):
		for ix in range(lo.x, hi.x + 1):
			_free[iz * _nx + ix] = _measure(space, q, ix, iz)
	# 벽 가까움 비용은 바뀐 칸에서 WALL_MARGIN 칸까지 번진다
	var m := Vector2i(WALL_MARGIN, WALL_MARGIN)
	var a := (lo - m).clamp(Vector2i.ZERO, Vector2i(_nx - 1, _nx - 1))
	var b := (hi + m).clamp(Vector2i.ZERO, Vector2i(_nx - 1, _nx - 1))
	for iz in range(a.y, b.y + 1):
		for ix in range(a.x, b.x + 1):
			_update_point(Vector2i(ix, iz))

## 턱 높이 위로 띄운 캡슐 (몸 반지름 + 여유). exclude = 캐릭터 몸
func _query(exclude: Array[RID]) -> PhysicsShapeQueryParameters3D:
	var capsule := CapsuleShape3D.new()
	capsule.radius = BODY_RADIUS
	capsule.height = 1.8 - STEP_UP
	var q := PhysicsShapeQueryParameters3D.new()
	q.shape = capsule
	q.exclude = exclude
	q.collide_with_areas = false
	return q

func _measure(space: PhysicsDirectSpaceState3D, q: PhysicsShapeQueryParameters3D, ix: int, iz: int) -> int:
	var c := cell_pos(ix, iz)
	q.transform = Transform3D(Basis(), Vector3(c.x, STEP_UP + (q.shape as CapsuleShape3D).height / 2.0, c.z))
	return 1 if space.intersect_shape(q, 1).is_empty() else 0

func _update_point(c: Vector2i) -> void:
	var solid := _free[c.y * _nx + c.x] == 0
	_astar.set_point_solid(c, solid)
	_astar.set_point_weight_scale(c, WALL_COST if not solid and wall_dist(c, WALL_MARGIN) <= WALL_MARGIN * STEP else 1.0)

func cell_pos(ix: int, iz: int) -> Vector3:
	return Vector3(-EXTENT + (ix + 0.5) * STEP, 0.0, -EXTENT + (iz + 0.5) * STEP)

func cell_of(p: Vector3) -> Vector2i:
	return Vector2i(clampi(int((p.x + EXTENT) / STEP), 0, _nx - 1), clampi(int((p.z + EXTENT) / STEP), 0, _nx - 1))

func is_free(c: Vector2i) -> bool:
	return c.x >= 0 and c.y >= 0 and c.x < _nx and c.y < _nx and _free[c.y * _nx + c.x] == 1

## 가장 가까운 막힌 칸까지 거리 (월드 단위, 칸 중심 기준)
func wall_dist(c: Vector2i, limit: int = 8) -> float:
	var best := INF
	for dz in range(-limit, limit + 1):
		for dx in range(-limit, limit + 1):
			if not is_free(c + Vector2i(dx, dz)):
				best = minf(best, Vector2(dx, dz).length() * STEP)
	return best

## 막힌 칸이면 가장 가까운 빈칸 (반지름 1.5 안)
func nearest_free(c: Vector2i) -> Vector2i:
	var best := Vector2i(-1, -1)
	var best_d := INF
	var r := int(1.5 / STEP)
	for dz in range(-r, r + 1):
		for dx in range(-r, r + 1):
			var n := c + Vector2i(dx, dz)
			if is_free(n) and Vector2(dx, dz).length() < best_d:
				best_d = Vector2(dx, dz).length()
				best = n
	return best

## A* (8방향, 벽 가까운 칸은 비싸게) → 시선이 통하는 점만 남긴 꺾은선. 길이 없으면 빈 배열
func find_path(from: Vector3, to: Vector3) -> PackedVector3Array:
	var start := nearest_free(cell_of(from))
	var goal := nearest_free(cell_of(to))
	if start.x < 0 or goal.x < 0:
		return PackedVector3Array()
	var cells := _astar.get_id_path(start, goal)
	if cells.is_empty():
		return PackedVector3Array()
	var pts := PackedVector3Array()
	pts.append(Vector3(from.x, 0.0, from.z))
	var anchor := cells[0]
	for i in range(1, cells.size()):
		if not _line_free(anchor, cells[i]):
			anchor = cells[i - 1]
			pts.append(cell_pos(anchor.x, anchor.y))
	pts.append(Vector3(to.x, 0.0, to.z))
	return pts

func _line_free(a: Vector2i, b: Vector2i) -> bool:
	var n := int(ceil(Vector2(b - a).length() * 3.0)) + 1
	for i in n + 1:
		var c := Vector2(a).lerp(Vector2(b), float(i) / n).round()
		var cell := Vector2i(c)
		if not is_free(cell) or wall_dist(cell, 1) <= STEP:
			return false
	return true

## 꺾임을 둥글게 (Chaikin). 다듬은 점이 검증된 빈칸을 벗어나면 그 단계는 버린다
func smooth(path: PackedVector3Array) -> PackedVector3Array:
	var cur := path
	for it in 3:
		var nxt := PackedVector3Array()
		nxt.append(cur[0])
		for i in range(cur.size() - 1):
			nxt.append(cur[i].lerp(cur[i + 1], 0.25))
			nxt.append(cur[i].lerp(cur[i + 1], 0.75))
		nxt.append(cur[-1])
		if not all_free(nxt):
			break
		cur = nxt
	return cur

func all_free(path: PackedVector3Array) -> bool:
	for i in range(1, path.size()):
		var n := int(ceil(path[i - 1].distance_to(path[i]) / (STEP * 0.5))) + 1
		for k in n + 1:
			if not is_free(cell_of(path[i - 1].lerp(path[i], float(k) / n))):
				return false
	return true

## 경로에서 가장 좁은 곳의 통로 폭 추정 = 2 × (몸 반지름 여유 + 가장 가까운 막힌 칸까지 거리 − 반 칸)
func min_width(path: PackedVector3Array) -> float:
	var w := INF
	for p in path:
		w = minf(w, 2.0 * (BODY_RADIUS + wall_dist(cell_of(p)) - STEP / 2.0))
	return w

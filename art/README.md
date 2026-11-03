# art — 3D 에셋 파이프라인

GPT 기준 그림 → Tripo 3D 생성 → Blender 정리(·리깅) → gltfpack 면 축소 → Godot(`apps/universe-godot/assets`).
그림체(원본 색 + 명암 + 1px 실루엣)는 Godot 셰이더가 맡는다. Tripo 원본(`art/models/`)과 중간 결과(`art/build/`)는
용량이 커서 git에 두지 않는다. 다시 만들려면 Tripo로 다시 생성한다 (크레딧이 든다).

```text
art/refs/                       기준 그림
  village-layout-v1.png         건물 배치 기준 (받침판 중심 → playground.gd BUILDINGS)
  v2-<건물>.png                  건물 단독 그림 (같은 카메라, Tripo 입력)
  prop-<소품>.png                소품 그림 (Tripo 입력)
  zannabi-v3-front.png, zannabi-v3-turnaround.png   Zannabi 정면·4방향 (Tripo multiview 입력)
  zannabi-v3-visor-guide.png    얼굴 창 유리 모양 가이드
  island-floor-gpt-v5-raw.png   섬 바닥 그림 원본 (투명 마스크를 입혀 assets/island/floor.png)
  space/space-bg-gpt-v1.png     홈 배경 그림 원본
  space/space-bg-v3.png         홈 배경 (v1에서 왼쪽 위 소행성을 지움) → apps/web/public/world/space-bg.webp (WebP 품질 85)
  logo-mark-gpt-v3.png          헤더 로고 (GPT 흑백)
  logo-mark-gpt-v2.png          파비콘 (GPT 흑백)
art/blender/
  export_godot.py               방향(-Y 앞)·크기(키 또는 바닥 폭)·바닥 z=0 정리, 무광 재질, 건물 충돌 치수 <이름>.json
  rig_zannabi_v3.py             Zannabi v3: Tripo 뼈 이름 맞추기 + 동작 (zannabi_motions.py를 쓴다)
  zannabi_motions.py            동작 정의 (idle/walk/jump/jump-move/greet, 통통 걸음 계산)
  visor_scan.py                 얼굴 창 깊이·색 측정 → art/scripts/visor_glass.py가 유리 메시를 만든다
art/scripts/
  build_godot_building.sh       건물 (pnpm art:building <이름>)
  build_godot_prop.sh           소품 (pnpm art:prop <이름>)
  build_godot_zannabi_v3.sh     Zannabi (pnpm art:zannabi)
  visor_glass.py                얼굴 창 유리 메시 (assets/zannabi/visor_v3.obj)
  path_guide.py                 돌길 가이드 그림 (tools/path_guide.tscn 데이터 → GPT에 바닥 그림과 함께 준다)
  logo_mark.py                  로고 그림 → 헤더 SVG(public/brand/zannabi-mark.svg)·파비콘(app/icon.png). potrace 필요
```

## 순서

```bash
# 1) Tripo 생성 (원본은 art/models/<이름>/tripo-out/<작업>/model.glb)
cd art/models && tripo make ../refs/v2-<건물>.png --model tripo-v3.1 -o <건물>/tripo-out --name <건물> --yes
# Zannabi: 4방향을 잘라 multiview로 만들고 Tripo 리깅(rig-out/)까지
# 2) Godot 에셋으로
pnpm art:building <이름>     # → assets/buildings/<이름>.glb + <이름>.json
pnpm art:prop <이름>         # → assets/props/<이름>.glb
pnpm art:zannabi             # → assets/zannabi/zannabi_v3.glb
# 3) 건물을 바꿨으면 바닥 충돌을 다시 굽고 QA
godot --headless --path apps/universe-godot res://tools/bake_collision.tscn
```

Blender 4.5 LTS(`blender`), Node(gltfpack은 npx로 받는다), tripo CLI 필요.

## 동작 기준 (zannabi_motions.py)

- 키프레임마다 메시의 가장 낮은 점을 바닥(z=0)에 맞춘다 (`GROUND`)
- 걷기 = 통통 걸음: 한 걸음 0.5초, 짧게 디디고 체공 0.4로 멀리 간다. 디딘 발이 이동 속도와 같이 움직여 미끄러지지 않는다.
  `WALK_SPEED`(빌드 로그)가 게임 이동 속도(`zannabi_player.gd`)다
- 점프 높이는 게임 물리가 맡는다. 게임이 점프 동작의 골반 상승을 지우고 위아래 속도로 공중 자세를 고른다
- 동작 이름 끝 `-loop`는 Godot가 반복 재생으로 가져온다

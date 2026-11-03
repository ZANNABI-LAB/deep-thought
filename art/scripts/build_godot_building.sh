#!/usr/bin/env bash
# Tripo 건물 모델 → Godot 에셋 (apps/universe-godot/assets/buildings/<이름>.glb)
# 1) Blender: 앞(-Y)·바닥 폭·무광 재질 정리, 떠 있는 조각 지우기
# 2) gltfpack: UV 경계를 지키며 면 수를 줄인다
# 3) 충돌 치수(받침판·몸체)를 <이름>.json으로
# 사용: build_godot_building.sh <이름>   (건물별 설정은 아래 표)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NAME="$1"
BUILD="$ROOT/art/build/godot"
OUT="$ROOT/apps/universe-godot/assets/buildings/$NAME.glb"
# 이름) 정리 옵션 (바닥 폭 = 콘셉트에서 Zannabi 대비 크기)
case "$NAME" in
  library_dome)    ARGS=(--front -y --width 4.9) ;;  # 크기: art/refs/village-layout-v1.png 받침판 폭
  rocket_hangar)   ARGS=(--front -y --width 5.0) ;;
  writing_station) ARGS=(--front -y --width 5.1) ;;
  ai_terminal)     ARGS=(--front -y --width 3.7) ;;
  arcade_room)     ARGS=(--front -y --width 4.75) ;;
  radio_tower)     ARGS=(--front -y --width 4.35) ;;
  *) echo "모르는 건물: $NAME" >&2; exit 1 ;;
esac
# Tripo 원본: art/models/<이름의 _를 -로>/tripo-out/<작업 폴더>/model.glb
SRC=$(ls "$ROOT/art/models/${NAME//_/-}"/tripo-out/*/model.glb | head -1)
mkdir -p "$BUILD" "$(dirname "$OUT")"
blender -b --factory-startup -P "$ROOT/art/blender/export_godot.py" -- "$SRC" "$BUILD/$NAME-full.glb" "${ARGS[@]}"
npx --yes gltfpack@0.25.0 -i "$BUILD/$NAME-full.glb" -o "$OUT" -si 0.01 -se 0.015 -noq   # 게임 크기에서 5%와 구분 안 됨 (메시 2.3MB → 0.55MB)
cp "$BUILD/$NAME-full.json" "${OUT%.glb}.json"   # 충돌 치수 (Building.gd가 읽는다)
echo "OK $OUT"

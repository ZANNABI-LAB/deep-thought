#!/usr/bin/env bash
# Tripo 소품 모델 → Godot 에셋 (apps/universe-godot/assets/props/<이름>.glb)
# 1) Blender: 앞(-Y)·키·무광 재질 정리  2) gltfpack: UV 경계를 지키며 면 수를 줄인다
# 사용: build_godot_prop.sh <이름>   (소품별 키는 아래 표, 그림: art/refs/prop-<이름의 _를 ->.png)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
NAME="$1"
BUILD="$ROOT/art/build/godot"
OUT="$ROOT/apps/universe-godot/assets/props/$NAME.glb"
case "$NAME" in
  fuel_tanks)   ARGS=(--front -y --height 1.5) ;;
  cargo_rover)  ARGS=(--front -y --height 1.45) ;;   # 2026-11-03 Zannabi가 짐칸에 타도록 키움
  *) echo "모르는 소품: $NAME" >&2; exit 1 ;;
esac
# Tripo 원본: art/models/<이름의 _를 -로>/tripo-out/<작업 폴더>/model.glb
SRC=$(ls "$ROOT/art/models/${NAME//_/-}"/tripo-out/*/model.glb | head -1)
mkdir -p "$BUILD" "$(dirname "$OUT")"
blender -b --factory-startup -P "$ROOT/art/blender/export_godot.py" -- "$SRC" "$BUILD/$NAME-full.glb" "${ARGS[@]}"
npx --yes gltfpack@0.25.0 -i "$BUILD/$NAME-full.glb" -o "$OUT" -si 0.003 -se 0.015 -noq   # 소품은 화면에서 작다 (약 4천 면)
echo "OK $OUT"

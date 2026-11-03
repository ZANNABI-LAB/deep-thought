#!/usr/bin/env bash
# Zannabi v3 (Tripo 멀티뷰 생성 + Tripo 리깅) → Godot 에셋 (apps/universe-godot/assets/zannabi/zannabi_v3.glb)
# 1) Blender: 방향·키 정리, 뼈 이름 맞추기, 무광 재질, 대기·걷기·점프·인사 동작 (art/blender/rig_zannabi_v3.py)
# 2) gltfpack: 뼈대·동작을 유지한 채 면 수를 줄이고 정리한다
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
SRC="${1:-$(ls "$ROOT"/art/models/zannabi-v3/rig-out/*/model.glb | head -1)}"
BUILD="$ROOT/art/build/godot"
OUT="$ROOT/apps/universe-godot/assets/zannabi/zannabi_v3.glb"
mkdir -p "$BUILD" "$(dirname "$OUT")"
blender -b --factory-startup -P "$ROOT/art/blender/rig_zannabi_v3.py" -- "$SRC" "$BUILD/zannabi-v3-rigged.glb"
npx --yes gltfpack@0.25.0 -i "$BUILD/zannabi-v3-rigged.glb" -o "$OUT" -si 0.6 -noq   # 2.8만 → 약 1.7만 면
echo "OK $OUT"

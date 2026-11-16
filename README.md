# Deep Thought — Zannabi's Little Universe

읽고, 탐험하고, 질문하고, 놀 수 있는 개인 지식 우주.

- 설계: [docs/DESIGN.md](./docs/DESIGN.md)
- 3D 에셋 파이프라인: [art/README.md](./art/README.md)

## 구조

```text
apps/web             Next.js — 홈(배경 그림 + 투명한 Godot 월드 + 이름표·시설 위젯)과 글 페이지
apps/universe-godot  Godot 4.7 월드 — 섬, 건물, Zannabi(조작·동작), 수레, 웹 빌드
packages/contracts   건물 레지스트리와 월드↔웹 메시지 타입 (단일 기준)
art/                 기준 그림, Blender·빌드 스크립트
docs/                설계 문서와 콘셉트 이미지
```

## 글쓰기

`apps/web/content/writing/_template.mdx`를 복사해 영문 소문자·하이픈 이름으로 저장한다 (예: `bff-pattern.mdx`). `draft: true`면 개발 서버에서만 보인다.

## 개발

```bash
pnpm install
# Godot 월드를 웹으로 내보내기 (apps/web/public/godot/, 배포용으로 커밋한다)
godot --headless --path apps/universe-godot --export-release "Web" ../web/public/godot/index.html
pnpm dev          # http://localhost:3000
pnpm test         # 단위 테스트
pnpm typecheck
pnpm --filter @deep-thought/web build && pnpm e2e

# Godot 월드를 데스크톱 창으로 (WASD 이동, Space 점프, E 실행·수레 타기)
godot --path apps/universe-godot

# Godot QA (배치를 바꾸면): 돌길 통행 · 이름표 클릭 이동 · 수레
godot --headless --fixed-fps 60 --path apps/universe-godot res://tools/path_qa.tscn -- /tmp/qa
godot --headless --fixed-fps 60 --path apps/universe-godot res://tools/move_qa.tscn
godot --headless --fixed-fps 60 --path apps/universe-godot res://tools/ride_qa.tscn -- /tmp/qa
```

필요한 도구: Node 24, pnpm 10, Godot 4.7.2(웹 내보내기 템플릿), Blender 4.5 LTS(에셋 빌드 때만).

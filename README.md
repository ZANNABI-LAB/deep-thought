# Deep Thought — Zannabi's Little Universe

읽고, 탐험하고, 질문하고, 놀 수 있는 개인 지식 우주.

- 설계: [docs/DESIGN.md](./docs/DESIGN.md)
- 기준 그림: [art/README.md](./art/README.md)

## 구조

```text
apps/web    Next.js — 홈과 글 페이지
art/        기준 그림
docs/       설계 문서
```

이 브랜치(`redesign/cockpit`)는 새 홈(우주선 창 + HUD)을 만드는 중이라 홈에는 창밖 우주 배경만 있다. 배포 중인 `main`은 v2.0 Godot 섬 월드다.

## 글쓰기

`apps/web/content/writing/_template.mdx`를 복사해 영문 소문자·하이픈 이름으로 저장한다 (예: `bff-pattern.mdx`). `draft: true`면 개발 서버에서만 보인다.

## 개발

```bash
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # 단위 테스트
pnpm typecheck
pnpm --filter @deep-thought/web build
```

필요한 도구: Node 24, pnpm 10.

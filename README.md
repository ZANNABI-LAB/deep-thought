# Deep Thought — Zannabi's Little Universe

읽고, 탐험하고, 질문하고, 놀 수 있는 개인 지식 우주.

- 설계: [docs/DESIGN.md](./docs/DESIGN.md)
- 기준 그림: [art/README.md](./art/README.md)

## 구조

```text
apps/web    Next.js — 홈, 글(Writing), 준비 중 페이지
art/        기준 그림
docs/       설계 문서
```

홈은 우주선 창 너머 우주와 조종석에서 지내는 Zannabi(HUD 메뉴), 나머지 페이지는 같은 메뉴를 쓰는 HUD 스타일이다. 지금은 PC 웹만 맞춘다(폰·태블릿은 PC 화면을 축소해서 보여 준다).

## 글쓰기

`apps/web/content/writing/_template.mdx`를 복사해 영문 소문자·하이픈 이름으로 저장한다 (예: `bff-pattern.mdx`). `draft: true`면 개발 서버에서만 보인다.

## 개발

```bash
pnpm install
pnpm dev          # http://localhost:3000 (개발용: ?layout 배치 보기, ?zannabi=read,saber 동작 순서 고정)
pnpm test         # 단위 테스트
pnpm typecheck
pnpm --filter @deep-thought/web build
```

필요한 도구: Node 24, pnpm 10.

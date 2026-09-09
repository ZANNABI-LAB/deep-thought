# Deep Thought

백엔드 엔지니어의 Applied AI 학습 기록 · 개인 기술 블로그

🔗 https://deep-thought.space

## 구조

```
deep-thought/
├─ apps/
│  └─ web/          Next.js 16 (App Router) — Vercel 배포
├─ content/
│  ├─ posts/        기술 포스트 (마크다운, 132편)
│  └─ logs/         빌드 로그 — 학습·제작 기록
├─ docs/plans/      기획서
└─ scripts/         콘텐츠 파이프라인
```

`apps/api`(Spring Boot / FastAPI)는 필요 시점에 추가한다. 자세한 근거는 기획서 참조.

## 개발

```bash
npm install          # 루트에서 워크스페이스 일괄 설치
npm run dev          # apps/web 개발 서버
npm run build
npm run lint
```

## 배포

| 대상 | 플랫폼 |
|---|---|
| `apps/web` | **Vercel** (Root Directory: `apps/web`) |
| `apps/api` | **AWS** (예정) |

## 문서

- [마스터 기획서](docs/plans/2026-09-08-deep-thought-rebuild-plan.md)

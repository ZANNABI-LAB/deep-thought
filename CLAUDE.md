# Deep Thought

개인 기술 블로그 + 굿즈 스토어 모노레포. 제작 주체는 **ZANNABI LAB**.

## 목표

1. **블로그 전면 재구축** — 숙원 사업. 그 자체로 목적이며 중단 조건이 없다
2. **SEO 색인 회복 + AdSense 승인** — 명시적 목표
3. **굿즈 스토어** — 브랜딩 수단. **독자 지표 게이트 통과 시에만** 착수

굿즈의 1차 목적은 수익이 아니라 브랜딩이며, 수익 기준은 "손해만 안 보면 성공"이다.

> 상세 근거·리스크·일정은 [마스터 기획서](docs/plans/2026-09-08-deep-thought-rebuild-plan.md)에 있다. **작업 전 반드시 참조할 것.**

## 절대 규칙

- **색인된 5개 URL은 유지한다.** 2026-09-09 Search Console 확인 결과 색인된 페이지는 5개뿐이다.
  `/` · `/profile` · `/portfolio` · `/log/2026-03-07-first-log` · `/tech/authentication-authorization-security`
  나머지 131편은 미색인이므로 URL 재설계가 자유롭다. **단 평면 구조(`/tech/[slug]`)를 권장** —
  카테고리를 경로에 넣으면 카테고리 정리 시 URL이 깨지고, 날짜를 넣으면 콘텐츠가 낡아 보인다.
- **완료 정의(DoD)는 "배포됨"이다.** 브랜치에 커밋된 것은 완료가 아니다.
  (2026-08 리뉴얼 6개 브랜치가 미머지로 사장된 전례가 있다)
- **SEO 자산을 빠뜨리지 않는다.** sitemap / robots / feed.xml / OG / canonical / JSON-LD는
  눈에 보이지 않아 이관 시 누락되기 쉽다.

## 기술 스택

- **프론트**: Next.js 16 (App Router) + TypeScript + Tailwind CSS v4 — Vercel
- **백엔드**: 미정 (필요 시점에 추가). 커머스는 Spring Boot + Kotlin, AI 서비스는 Python 후보
- **DB**: Neon (Postgres + pgvector) — Supabase는 폐기됨
- **워크스페이스**: npm workspaces (JVM은 Gradle로 별도 관리)

## 콘텐츠 축

| 축 | 성격 | 역할 |
|---|---|---|
| `content/posts` (Tech) | 매일메일 아카이브 기반 | 유입. **견해 주입 후 발행**이 원칙 |
| `content/logs` (Log) | 직접 작성 | 관계·차별화. 학습·제작 기록 |

**AI가 견해까지 대신 쓰면 의미가 없다.** 검색엔진과 AdSense가 보는 것은
"AI가 썼는가"가 아니라 "이 사이트에만 있는 정보인가"다.

## 컨벤션

- 파일명 kebab-case, 컴포넌트명 PascalCase, import alias `@/`
- 커밋: `feat:` `fix:` `refactor:` `style:` `docs:` `chore:` `content:`
- 브랜치: `main`(프로덕션) / `feat/*` / `content/*`

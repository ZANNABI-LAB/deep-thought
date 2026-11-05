# Deep Thought 2.0 — Zannabi's Little Universe

> **Design & Technical Blueprint v2.0**
> 작성일: 2026-10-30 · 갱신: 2026-11-05
> 상태: 섬·건물·Zannabi v3·이름표 상호작용·수레, 홈 헤더·히어로·오른쪽 패널, 시설 위젯 틀, Writing 페이지 완료. 다음은 첫 글과 Projects
> 기존 사이트: https://deep-thought.space/ (이전하지 않음, §8 참고)

### v1.1 → v2.0 주요 변경

- 월드 엔진: Phaser → **Godot 4.7 웹 빌드** (홈 화면 전체). Phaser는 Arcade 미니게임 후보로만 남긴다
- 그림체: 픽셀 아트 → **페인팅 3D** (원본 색 텍스처 + 부드러운 명암 + 1px 실루엣. 처음의 흑백 잉크는 2026-11-03에 건물과 같은 그림체로 바꿈)
- 화면 합성: **웹이 배경 그림을 깔고, 그 위에 투명한 Godot 화면**을 얹는다
- 이동: 클릭 이동 → **WASD 8방향 + Space 점프**. 클릭은 오브젝트 선택용
- 로딩: 정적 포스터 바꿔치기 → **섬이 없다가 커지며 나타나는 등장 연출**
- 모바일: 월드를 불러오지 않는다 (정적 그림 + 링크)

---

## 0. 기준 그림

| 그림 | 쓰임 |
| --- | --- |
| [홈 콘셉트](./assets/deep-thought-home-concept.png) | 화면 구성(히어로·섬·오른쪽 패널)과 분위기의 기준. 섬·건물 그림체는 §4.4 |
| [Zannabi 로고](./assets/zannabi-original-logo.png) | 브랜드 출발점 (흑백 우주 원숭이) |
| `art/refs/logo-mark-gpt-v3.png` | 헤더 로고 (콘셉트 헤더 로고를 GPT가 따라 그림). 파비콘은 `logo-mark-gpt-v2.png`. 변환은 `art/scripts/logo_mark.py` |
| `art/refs/zannabi-v3-turnaround.png` | Zannabi v3 4방향 (Tripo 입력). 유리 모양은 `art/refs/zannabi-v3-visor-guide.png` |
| `art/refs/space/space-bg-v3.png` | 홈 배경 그림 (섬·UI 없는 우주). 원본 `space-bg-gpt-v1.png`에서 헤더 로고 뒤 소행성을 지웠다 |

콘셉트 이미지는 아트 디렉션 기준이며 게임 리소스로 쓰지 않는다. 글 제목·날짜·문구는 예시다.

---

## 1. 프로젝트 비전

**Deep Thought는 읽고, 탐험하고, 질문하고, 놀 수 있는 개인 지식 우주다.**

- **사이트 이름:** Deep Thought
- **세계관:** *Zannabi's Little Universe*
- **마스코트:** **Zannabi(잔나비)**, 우주를 탐험하는 원숭이 ("잔나비"는 원숭이의 옛 우리말)
- **부브랜드:** Zannabi Lab (마스코트와 연구소 세계관). 사이트 이름을 바꾸지 않는다
- **메인 문장:** *A little universe of ideas.*
- **주제:** 소프트웨어 엔지니어링, AI/에이전트, 사이드 프로젝트, 독서·철학, 사고와 실험의 기록

### 핵심 원칙

1. 게임처럼 재미있지만 **블로그로서도 훌륭해야 한다.**
2. 월드는 **보조 탐색 경로**다. 메뉴·검색·직접 URL로 모든 콘텐츠에 갈 수 있어야 한다.
3. 귀여운 마스코트와 전문적인 콘텐츠 UI를 분리해 표현한다.
4. 첫인상보다 **읽기·접근성·성능·모바일**을 우선한다.
5. 글과 프로젝트가 늘어도 월드를 다시 만들지 않고 확장할 수 있어야 한다.
6. **사용자는 게임을 기다리지 않는다.** 웹 UI와 배경은 즉시 보이고, 월드는 준비되는 대로 살아난다.

---

## 2. 의사결정 기록

| 항목 | 결정 | 근거 |
| --- | --- | --- |
| 리뉴얼 범위 | 이름(Deep Thought)만 유지하고 전부 새로 만든다 | — |
| 테마 | **다크 전용** | 우주 배경 전제. 라이트 테마 유지 비용 제거 |
| 레포 | **새 모노레포, 공개 예정** | 글은 어차피 공개. Actions 무료, 포트폴리오 가치 |
| 콘텐츠 원본 | 레포 안 **MDX**, 정적 생성 | 색인에 유리, DB 장애와 무관 |
| 기존 자산 | **이전하지 않음** (글, `/tech/*` URL, 생성 파이프라인, 조회수, 챗봇) | 새로 시작. 옛 URL은 404 |
| 초기 콘텐츠 | 매일메일 주제를 **직접 복습한 뒤 자기 말로 쓴 글** | 원문 복사·자동 생성 아님 |
| vault 연동 | **보류** | §8.3 |
| 월드 엔진 | **Godot 4.7** 웹 빌드 (Compatibility 렌더러, 단일 스레드) | 실시간 3D 렌더가 필요해서 (2026-10-30) |
| 화면 합성 | 웹 배경 그림 + 투명 Godot iframe + 웹 UI | 배경은 그림이 가장 예쁘고 가볍다. 월드는 섬·캐릭터만 그린다 |
| 그림체 | 건물·소품·Zannabi 모두 **페인팅 3D** (원본 색·같은 명암·1px 외곽선) | 흑백 잉크 Zannabi는 선이 흐려지고 관절에서 휘어서 v3에서 바꿨다 (2026-11-03) |
| 건물 제작 | 같은 카메라로 그린 단독 GPT 그림(`art/refs/v2-*.png`) → Tripo → `pnpm art:building <이름>` | 0°에서 그림과 같은 면이 보인다 (돌리지 않는다) |
| 카메라 | 섬 중심에 **고정**, 섬 전체가 화면 62%×90% 안에 들어오는 배율 | 콘셉트처럼 섬 전체를 보여 준다 |
| 시점 | **고각 아이소메트릭** (높이 36°, 방위 45°, 정사영) | 26.6°는 건물이 다닥다닥, 40°는 너무 높았다 (2026-11-02) |
| 이동 | **WASD 8방향 + Space 점프**, 마우스 클릭 이동 없음 | 클릭은 오브젝트 선택에 쓴다 (2026-10-30) |
| 로딩 연출 | 첫 프레임이 그려진 뒤 **섬이 2%→100%로 커지며 나타남** (0.8초) | 포스터 맞춤이 필요 없고 "살아나는" 순간이 보인다 |
| 진입 카메라 연출 | **없음** | 시험해 봤지만 등장 연출로 충분 (2026-10-30) |
| 모바일 | **Godot을 불러오지 않음.** 정적 그림 + 링크 | 약 11MB 다운로드, 키보드 없음, 캐릭터가 너무 작음 |
| 상호작용 | 건물에 겹친 **이름표**(근접 시 활성화·E) → 시설 내용은 오브젝트 옆 **툴팁형 위젯**(웹, 예정) | 장소와 기능이 연결됨 |
| 오른쪽 패널 | 지금은 Ask Deep Thought(준비 중)만 둔다. Mission Log, Quick Routes, Arcade는 뺐다 | 글과 페이지가 아직 없다 (2026-11-05) |
| 헤드라인 폰트 | **세리프** | 콘셉트의 분위기 |
| 미니게임 | Star Patrol → Moon Breaker (`/arcade/*` 전용, 엔진 미정. Phaser PoC는 정리하며 뺐다) | 홈 월드와 무관한 별도 게임 |

---

## 3. 홈 화면 구조

### 3.1 네 개의 층

```text
④ 웹 UI (DOM)         헤더 · 왼쪽 히어로 · 오른쪽 패널
③ 월드 오버레이 (DOM)  건물 이름표 · 수레 안내 · 시설 위젯(예정)
② Godot 월드 (iframe)  투명 배경 위에 섬 · 건물 · Zannabi (실시간 3D 렌더)
① 배경 그림 (img)      행성 · 성운 · 별 · 먼 소행성 (public/world/space-bg.webp)
```

- **①** 웹이 페이지와 함께 바로 보여 준다. `object-fit: cover`.
- **②** Godot 화면은 섬·캐릭터 밖이 투명하다 (`?bg=web`). 준비 전에는 숨겨 두고(opacity 0), `WORLD_READY` 뒤 0.25초 동안 보이게 한다.
- **③** 이름표·안내·위젯은 선명한 텍스트의 웹 요소다. 위치는 월드가 알려 준다 (§6.4).
- **④** 헤더, 히어로, 패널은 월드 로딩과 무관하게 먼저 그려진다. 스타일은 컴포넌트별 CSS Modules, `globals.css`는 토큰·기본 스타일만.

### 3.2 데스크톱 레이아웃

```text
┌──────────────────────────────────────────────────────────────────────┐
│ ◉ DEEP THOUGHT                    Explore                            │
├──────────────┬───────────────────────────────────┬───────────────────┤
│ > ZANNABI LAB│                                   │ Ask Deep Thought  │
│ A little     │      [ 섬 — 화면 전체 ]           │ (준비 중)         │
│ universe     │                                   │                   │
│ of ideas.    │      이름표 · 툴팁 위젯 (DOM)     │                   │
│ > Start      │                                   │                   │
│ [WASD]  [E]  │                                   │                   │
└──────────────┴───────────────────────────────────┴───────────────────┘
```

- 히어로와 패널은 월드 위에 떠 있다. 빈 곳 클릭은 `pointer-events` 규칙으로 월드에 내려간다.
- 헤더 메뉴는 지금 Explore(홈)와 Writing을 둔다. 다른 메뉴는 페이지를 만든 뒤 넣는다.
- 패널은 1024px 이상에서만 보인다.
- 섬이 히어로·패널 사이 빈 영역에 오도록 웹이 `SET_SAFE_AREA`로 알려 준다.
- 1024px 미만은 모바일 레이아웃(§3.4).

### 3.3 로딩 흐름

1. **0초**: 헤더·히어로·패널·배경 그림이 보인다. 가운데(섬 자리)는 비어 있다.
2. **다운로드**: Godot 엔진(wasm, Brotli 약 6.9MB)과 게임 데이터(pck 약 6.9MB). 셸이 `WORLD_PROGRESS`(바이트)를 보낸다.
3. **엔진 시작**: 다운로드 100%는 준비 완료가 아니다. Godot이 첫 프레임을 실제로 그린 뒤(`frame_post_draw`) `WORLD_READY`를 보낸다.
4. **등장**: 섬과 Zannabi가 점처럼 작은 크기에서 0.8초 동안 커지고 끝에서 살짝 넘쳤다 돌아온다(ease-out-back). 카메라 확대라 선이 흐려지지 않는다.
5. `prefers-reduced-motion`이면 커지지 않고 바로 보인다.
6. 실패(WebGL 2 없음, 다운로드·초기화 실패)해도 배경과 웹 UI는 그대로다. 셸이 `WORLD_ERROR`를 보내면 로딩 문구를 작은 안내로 바꾼다.
7. 월드는 루트 레이아웃(`WorldHost`)에 있다. 홈을 처음 열 때만 시작하고, 다른 페이지로 가면 숨긴 채 `SLEEP_WORLD`로 멈췄다가 돌아오면 `WAKE_WORLD`로 그대로 잇는다. 글 페이지로 바로 들어오면 엔진을 내려받지 않는다.
8. Godot 셸에는 로딩 화면·로고가 없다 (`apps/universe-godot/web/shell.html`, 부트 스플래시 끔).

### 3.4 모바일

- **Godot을 불러오지 않는다.** 기본 화면은 정적 그림 + 탭할 수 있는 링크 영역.
- 그림 아래로 Mission Log → Ask → Quick Routes → Arcade 순서로 쌓는다.
- 월드를 켜는 조건(제안): `(pointer: fine)` 이고 화면 폭 1024px 이상.

---

## 4. 시각 디자인 시스템

### 4.1 컬러 토큰

| 토큰 | 값 | 용도 |
| --- | --- | --- |
| `space` | `#080F1F` | 페이지 배경 |
| `surface` | `#131E35` | 카드, 패널 |
| `surface-raised` | `#1A2742` | 호버, 툴팁 위젯 |
| `border` | `#24314F` | 카드 테두리, 구분선 |
| `text-primary` | `#F4F5F7` | 제목, UI 텍스트 |
| `text-body` | `#D6D9E0` | 긴 본문 |
| `text-secondary` | `#A9B1C3` | 보조 설명, 날짜 |
| `text-muted` | `#7C869B` | 캡션, 비활성 |
| `accent-blue` | `#3B82F6` | 링크, 활성 상태, 안내 |
| `accent-blue-soft` | `#93C5FD` | 포커스 링, 본문 링크 |
| `accent-purple` | `#A78BFA` | **Arcade 전용** |
| `status-online` | `#34D399` | Mission Log 점 같은 상태 표시 |
| `code-bg` | `#0D1629` | 코드 블록 |

- `apps/web/app/globals.css`에는 지금 쓰는 토큰만 둔다. 나머지는 쓰는 화면을 만들 때 넣는다.
- 대비는 실제 배경 위에서 WCAG AA로 측정한 뒤 확정한다.
- 블루는 탐색과 지식, 퍼플은 Arcade에만 쓴다.

### 4.2 타이포그래피

| 역할 | 폰트 | 쓰는 곳 |
| --- | --- | --- |
| 헤드라인 (영문) | 세리프: Newsreader 350 | "A little universe of ideas.", 섹션 제목 |
| 헤드라인 (한글) | Pretendard 700 (마루 부리는 npm에 없어 보류) | 한글이 섞인 글 제목 |
| 본문·UI | Pretendard | 본문, 버튼, 카드 |
| 라벨·상태 | JetBrains Mono | `> ZANNABI LAB`, MISSION LOG, 키 안내, 날짜 |
| 헤더 글자 로고 | Pretendard 700, 대문자, 자간 0.2em | `DEEP THOUGHT` |

### 4.3 컴포넌트 원칙

- 둥근 모서리, 얇은 테두리, 절제된 글로우, 모듈형 카드
- 웹 UI는 고해상도 텍스트와 SVG, 월드는 3D 렌더로 분리한다
- 이름표: 어두운 반투명 배경 + 아이콘 + 모노 대문자 라벨. 건물마다 대표색 네온(도서관 앰버, 발사대 빨강 주황, 집필실 하늘색, 터미널 청록, 아케이드 보라, 안테나 연두, 수레 앰버). 활성화되면 제자리에서 1.1배 + 테두리 네온 + 글자 뒤에 E가 펼쳐진다

### 4.4 월드 아트 규격 (페인팅 3D, 2026-11-03 확정)

| 항목 | 규격 |
| --- | --- |
| 표현 | Tripo 원본 색 텍스처 + 부드러운 명암 한 단계 (`shaders/paint.gdshader`, unshaded). 건물·소품·Zannabi 모두 같은 그림체 |
| 외곽선 | 화면 공간 실루엣만 **1px** (`scripts/outline.gd`). Zannabi·건물 주변 영역만 계산하고, 건물 영역은 화면이 바뀌거나 Zannabi가 들어올 때만 다시 찍는다 |
| 카메라 | 정사영, 높이 36°, 방위 45°. 섬 전체(+ 건물 높이 여유)가 화면 비율에 맞게 배율을 정한다 |
| 섬 바닥 | GPT 그림 한 장(`assets/island/floor.png`, 돌길 포함)을 카메라를 향한 판에 깐다. 길은 `StonePaths` 경로로 만든 가이드를 따라 그렸다 |
| 제작 | GPT 기준 그림 → Tripo 3D 생성 → Blender 정리 → gltfpack 면 축소 → Godot (`art/README.md`) |
| 텍스처 | 최대 1024px, 손실 WebP 품질 0.85 (가져오기 설정) |

### 4.5 Zannabi (v3 확정)

| 항목 | 값 |
| --- | --- |
| 모델 | GPT 4방향 그림(`art/refs/zannabi-v3-turnaround.png`, 흰 몸·선 최소, 다리 약 27%, 둥근 헬멧) → Tripo multiview v3.1 → Tripo 리깅 v3.0 → `assets/zannabi/zannabi_v3.glb` |
| 동작 | `art/blender/rig_zannabi_v3.py`: Tripo 뼈 이름을 맞춰 `zannabi_motions.py` 동작을 그대로 쓴다. idle, walk(한 걸음 0.5초·체공 0.4 "통~ 통~"), jump, jump-move, greet, sit(수레) |
| 이동 | 2.83단위/초 (걷기 동작 기준 속도 그대로, 발 미끄러짐 없음). 가속 9 / 감속 11 |
| 점프 | 저중력 물리: 높이 0.72, 체공 1.3초. 동작은 자세만 맡는다 |
| 유리창 | 얼굴 창 모양 그대로 만든 타원체 캡(`assets/zannabi/visor_v3.obj`, `art/scripts/visor_glass.py`) + `visor.gdshader`(살짝 청록빛, 반사 약하게). 머리 뼈에 붙임 |

---

## 5. 월드 디자인

### 5.1 오브젝트

| 오브젝트 | 이름표 | 툴팁 위젯 내용 (예정) | 이동할 페이지 (예정) |
| --- | --- | --- | --- |
| Writing Station | WRITING | 카테고리·시리즈 둘러보기, 랜덤 글 하나 | `/writing` |
| Library Dome | READING | 읽은 책과 메모 | `/reading` |
| Rocket Hangar | PROJECTS | 대표 프로젝트 2~3개 | `/projects` |
| AI Terminal | ASK | Ask Deep Thought 입력창 | — |
| Arcade Room | ARCADE | 게임 목록, 내 최고 점수 | `/arcade/[game]` |
| Radio Tower | LAB | 지금 연구·실험 중인 것들 | — |
| Zannabi | — | 소개 대사, 이스터에그 | `/about` |

섬: 떠 있는 돌 섬, 가운데 텔레포트 패드(Zannabi 시작 위치)에서 건물마다 돌길이 뻗는다. 로켓 옆 보급 구역에 연료통과 탈 수 있는 수레. 배치 기준은 `art/refs/village-layout-v1.png`.

### 5.2 오브젝트 레지스트리 (단일 기준)

모든 오브젝트 정보는 `packages/contracts/src/objects.ts` 한 곳에 둔다. 월드와 웹이 모두 여기서 읽는다. 이 레지스트리가 곧 **허용 목록**이다.

- 위치·문 앞 지점·상호작용 거리는 Godot `scripts/playground.gd`의 `BUILDINGS`에 `id`(= objectId)로 둔다. 이름표 기준점(건물 중간 높이)은 월드가 계산해 보낸다.
- 오브젝트를 추가할 때: 레지스트리 한 줄 + `BUILDINGS` 한 줄(모델·자리·문) + 돌길 + QA, 위젯을 만든 뒤에는 위젯 컴포넌트.

---

## 6. 상호작용

### 6.1 입력

| 입력 | 동작 |
| --- | --- |
| WASD | 화면 기준 8방향 이동 |
| Space | 점프 (저중력) |
| E | 가까운 건물 실행(`INTERACT`), 수레가 더 가까우면 타기·내리기 |
| 이름표 클릭 | 문 앞까지 걸어가서 실행 (`MOVE_TO_OBJECT` → 텔레포트 위면 돌길, 아니면 길찾기). 수레를 타고 있으면 먼저 내린다 |
| 땅 클릭 | **아무 일도 없다** (클릭은 오브젝트 선택용) |
| Escape | 열린 위젯 닫기 |

### 6.2 상태 흐름

```text
평소 ──받침판 1.2 안──▶ 근접 (OBJECT_NEAR: 이름표 활성화 + E, Zannabi가 건물을 본다)
                │
                └─E / 이름표 클릭─▶ 실행 (INTERACT) ─▶ 옆에 시설 위젯
                              │
     멀어짐 / Escape / × / E 다시 누르기 ─▶ 닫힘
```

- Writing 위젯은 최신 글과 글 목록 링크를 보여 준다 (글이 없으면 Coming soon). 나머지 시설은 Coming soon이고, 콘텐츠를 만들면서 하나씩 채운다.
- **읽기 위젯**: 열린 상태에서도 이동할 수 있고, 상호작용 거리를 벗어나면 닫힌다.
- **입력 위젯**: 입력창에 포커스가 있는 동안 웹이 `PAUSE_INPUT`을 보낸다 (구현됨).

### 6.3 툴팁 위젯 배치

- 위젯은 건물 이름표가 그 자리에서 위로 펼쳐진 말풍선이다. 맨 아래 줄이 이름표 자리에 그대로 남고 E 자리에 닫기가 온다. 카메라는 움직이지 않는다.
- 크기: 너비 약 210px. 섬을 가리지 않게 내용은 짧게 두고, 긴 목록은 페이지로 보낸다.

### 6.4 월드와 웹의 연결

Godot은 iframe 안에서 돈다. 메시지는 같은 출처(`location.origin`)끼리만 `postMessage`로 주고받고, 타입은 `packages/contracts/src/events.ts`가 기준이다.

```ts
export type WorldToWeb =
  | { type: 'WORLD_READY' }                                   // 첫 프레임을 그린 뒤
  | { type: 'WORLD_PROGRESS'; loaded: number; total: number } // 셸(다운로드 바이트)
  | { type: 'WORLD_ERROR'; reason: 'unsupported' | 'failed' }  // 셸(지원 안 됨·시작 실패)
  | { type: 'OBJECT_NEAR'; objectId: WorldObjectId }
  | { type: 'OBJECT_LEAVE'; objectId: WorldObjectId }
  | { type: 'INTERACT'; objectId: WorldObjectId }
  | { type: 'WORLD_ESCAPE' }                                  // 셸(월드 포커스 중 Escape)
  | { type: 'OBJECT_ANCHORS'; anchors: Partial<Record<WorldObjectId, ScreenPoint>> } // 이름표 자리 (바뀔 때만)
  | { type: 'RIDE_PROMPT'; action: 'ride' | 'dismount' | null; at: ScreenPoint };  // 수레 안내 (바뀔 때만)

export type WebToWorld =
  | { type: 'PAUSE_INPUT' }
  | { type: 'RESUME_INPUT' }
  | { type: 'MOVE_TO_OBJECT'; objectId: WorldObjectId }
  | { type: 'SET_SAFE_AREA'; left: number; right: number }
  | { type: 'SLEEP_WORLD' }                                   // 셸이 프레임을 멈춘다
  | { type: 'WAKE_WORLD' };
```

아케이드를 만들 때 필요한 메시지를 추가한다.

- 월드는 **무엇과 상호작용했는지만** 알린다. 무엇을 열지는 웹이 레지스트리로 정한다.
- Godot 쪽: `JavaScriptBridge`로 `window.parent.postMessage`, 받는 쪽은 `addEventListener("message")` 콜백 (`scripts/playground.gd`).
- 주의: `JavaScriptBridge.eval`의 불리언 결과는 null로 올 수 있다. 숫자(1/0)로 받는다.
- 이름표·수레 안내 자리: 월드가 화면 좌표를 계산해 값이 바뀔 때만 보낸다. 웹은 React 상태 대신 DOM `translate`에 바로 넣는다.
- iframe은 메시지 수신을 연 뒤에 주소를 넣는다 (캐시로 Godot이 먼저 뜨면 한 번뿐인 `WORLD_READY`를 놓친다). 그래도 놓치면 `OBJECT_ANCHORS`를 준비 신호로 본다.

### 6.5 접근성

- 월드는 `aria-hidden`. 같은 목적지를 패널과 헤더 메뉴의 일반 링크로 모두 제공한다.
- 시설 위젯은 `role="dialog"`. 열린 채로 걸을 수 있도록 포커스는 월드에 둔다. 입력창이 있는 위젯을 만들면 다시 정한다.
- `prefers-reduced-motion`: 등장 연출을 끈다.
- 월드를 한 번도 쓰지 않아도 모든 콘텐츠에 갈 수 있어야 한다.

---

## 7. Zannabi Arcade

| 순서 | 게임 | 형식 |
| --- | --- | --- |
| 1 | **Star Patrol** | 고정 화면 우주 슈팅 (예정. Phaser PoC는 정리하며 뺐다) |
| 2 | **Moon Breaker** | 우주 테마 벽돌깨기 |

- 전용 URL `/arcade/[game]`에서만 돈다. 홈 월드와 코드가 섞이지 않는다.
- 점수는 처음엔 브라우저 로컬 저장.
- 고전 게임의 **장르와 추상적 메커니즘**만 참고한다. 원작 코드·그래픽·음악·캐릭터·상표·적 디자인을 따라 하지 않는다.

---

## 8. 콘텐츠 · SEO · 운영

### 8.1 콘텐츠

- 원본: `apps/web/content/{writing,projects,reading}/*.mdx`, 빌드 시 정적 생성. 지금은 `writing`만 있다.
- 초기 글: 매일메일에서 주제를 고른 뒤 직접 공부하고 **자기 말로 다시 쓴 글**.
- 프런트매터 스키마는 빌드 시 검증한다 (제목, 요약, 날짜, 카테고리, 태그, 시리즈, 커버 이미지, 초안). 틀리면 빌드가 멈춘다 (`lib/writing.ts`).
- 새 글은 `content/writing/_template.mdx`를 복사해 영문 소문자·하이픈 이름으로 저장한다. `draft: true`면 개발 서버에서만 보인다.

### 8.2 URL

| 경로 | 내용 |
| --- | --- |
| `/` | 홈 (월드) |
| `/writing`, `/writing/[slug]` | 글 목록, 글 상세 (구현됨) |
| `/projects`, `/projects/[slug]` | 프로젝트 |
| `/reading` | 독서 기록 |
| `/about` | 소개 |
| `/arcade`, `/arcade/[game]` | 아케이드 |

- 기존 `/tech/*` 등은 **리디렉션하지 않고 404**.

### 8.3 vault 연동 (보류)

vault 정책이 정리되면 다시 다룬다. 후보안: vault의 `publish: true` 노트만 GitHub Actions가 MDX로 변환해 블로그 레포에 **PR로** 보낸다.

### 8.4 SEO 체크리스트

- [x] `generateStaticParams`로 모든 글 정적 생성
- [ ] `generateMetadata`: title, description, canonical 완료. OG 이미지 남음
- [x] `sitemap.xml`, `robots.txt`
- [x] 글마다 `BlogPosting` JSON-LD
- [ ] 홈의 히어로·Mission Log·패널 링크가 HTML로 먼저 렌더링
- [ ] 오픈 후 Search Console에 sitemap 제출

### 8.5 공개 레포 운영

- `.env*`는 커밋하지 않는다. secret scanning과 push protection을 켠다.
- 라이선스(제안): 코드 MIT, 글 CC BY-NC 4.0.

---

## 9. 기술 아키텍처

### 9.1 구성

```text
Browser
└── Next.js 16 (App Router) + React 19 + TypeScript
    ├── SiteHeader · Hero · AskPanel (components/) · 글 페이지 (app/writing/, content/writing/)
    ├── GodotStage (components/world/GodotStage.tsx)
    │   ├── ① 배경 그림 <img data-testid="space-plate">
    │   ├── ② <iframe src="/godot/index.html?bg=web">  Godot 웹 빌드
    │   └── ③ 건물 이름표 · 수레 안내 (위치는 월드가 알려 준다)
```

### 9.2 폴더 구조

```text
deep-thought/
├── apps/
│   ├── web/                     Next.js 홈(배경 그림 + Godot 월드 + 이름표 + 헤더·히어로). public/godot/ 은 Godot 내보내기 결과 (git 제외)
│   └── universe-godot/          Godot 4.7 프로젝트
│       ├── scenes/playground.tscn   홈 월드
│       ├── scripts/                 playground(배치·웹 메시지), building, prop, rover, zannabi_player/look,
│       │                            interactor(접근·E), nav_grid(길찾기), stone_paths(돌길 경로), paint_look, outline
│       ├── shaders/                 paint, outline, outline_mask, visor
│       ├── tools/                   bake_collision(건물 바닥 충돌 굽기), path_guide(돌길 가이드 데이터),
│       │                            path_qa·move_qa·ride_qa(통행·클릭 이동·수레 QA), island_shot(화면 캡처)
│       ├── web/shell.html           로딩 화면 없는 HTML 셸
│       └── export_presets.cfg       Web 프리셋 (tools/ · web/ 제외)
├── packages/contracts/          objects.ts(건물 레지스트리), events.ts(월드↔웹 메시지)
├── art/                         기준 그림, Blender·빌드 스크립트 (art/README.md). Tripo 원본은 git에 두지 않는다
└── docs/DESIGN.md
```

### 9.3 빌드

```bash
# Godot → 웹 (apps/universe-godot 에서)
godot --headless --path apps/universe-godot --export-release "Web" ../web/public/godot/index.html
pnpm --filter @deep-thought/web build
```

- Godot 템플릿: `~/.local/share/godot/export_templates/4.7.2.stable` (웹만).
- 배포 시 `public/godot/`을 CI에서 만들거나 별도 저장소에 올리는 방식은 미정.

### 9.4 테스트와 QA

- 단위: Vitest (`packages/contracts`)
- E2E: Playwright `e2e/godot.spec.ts` (월드 준비, 이름표 클릭 → 걸어가서 실행, E 키)
- Godot (`--headless --fixed-fps 60`): `tools/path_qa.tscn`(돌길 6개 통행·접근·E), `tools/move_qa.tscn`(이름표 클릭 이동 7회), `tools/ride_qa.tscn`(수레 타기·운전·내리기). 배치를 바꾸면 세 가지를 다시 돌린다

### 9.5 성능 (측정값)

| 항목 | 값 |
| --- | --- |
| 엔진 wasm | 39.5MB, Brotli 6.9MB |
| pck | 6.9MB (건물 6·소품 2·Zannabi, 텍스처 1024 WebP) |
| 외곽선 | 7개 영역(Zannabi + 건물 6) 중 Zannabi가 없는 건물 영역은 다시 찍지 않는다 |
| 캐시 | 지금 `max-age=0`이라 재방문에도 wasm을 다시 받는다 → 버전 경로 + immutable 필요 |

---

## 10. 로드맵

| 단계 | 상태 | 내용 |
| --- | --- | --- |
| 1. Zannabi | **완료** | v3 모델(페인팅 그림체), Tripo 리깅, 통통 걸음·점프·인사·앉기, 유리창 |
| 2. 웹 통합 | **완료** | Godot 웹 빌드, 투명 합성, 배경 그림, 등장 연출 |
| 3. 섬 · 건물 | **완료** | 건물 6개, GPT 섬 바닥(돌길 포함), 연료통·탈 수 있는 수레 |
| 4. 상호작용 | **진행 중** | 근접·E·이름표(건물별 네온)·클릭 이동·수레, 헤더·히어로·오른쪽 패널, 시설 위젯 틀 완료 |
| 5. Blog | **진행 중** | MDX, 글 목록·상세, SEO 완료 → 초기 글 |
| 6. 로딩 마무리 | 예정 | 캐시, 실패 처리, 모바일 정적 화면 |
| 7. Arcade | 예정 | 미니게임 |
| 8. Launch | 예정 | 접근성, 성능 예산, 배포, Search Console |

**오픈 조건은 월드 완성이 아니라 글 읽기 경험 완성이다.**

시설 콘텐츠 순서: Writing → Projects → Reading → Ask → Arcade → Lab. 오픈에는 Writing·Projects가 필수이고, Lab은 마지막으로 미룬다.

### 10.1 섬 · 건물 구현 메모

- **배치** (`scripts/playground.gd` BUILDINGS·PROPS): 화면 축 좌표(오른쪽, 아래쪽), 텔레포트 패드 가운데 = 원점. 건물은 GPT 배치 그림(`art/refs/village-layout-v1.png`)의 받침판 중심을 옮긴 값이고, 모델은 같은 카메라로 그린 단독 그림(`art/refs/v2-*.png`)에서 만들어 0°일 때 그림과 같다 (돌리지 않는다)
- **건물 코드** (`scripts/building.gd`): 바닥 = 구운 높이맵 충돌, 몸체 = 상자 충돌. 접근은 받침판 1.2 안 (`Interactor`)
- **바닥 충돌 굽기** (`tools/bake_collision.tscn`, 모델을 다시 내보내면 다시 굽기): 보이는 메시를 0.1 격자로 재서 `<이름>.json`의 `ground`에 넣는다. 0.45 이하의 턱(받침판·계단)은 바깥에 경사를 덧붙여 걸어 올라가고, 높은 블럭·벽은 막는다
- **돌길**: `scripts/stone_paths.gd`가 텔레포트 가장자리 → 문 정면까지 베지어 경로를 만들고, 그 경로를 `tools/path_guide.tscn` + `art/scripts/path_guide.py`로 가이드 그림으로 그려 GPT가 바닥 그림에 칠했다. 이름표 클릭 이동도 이 경로를 걷는다
- **수레** (`scripts/rover.gd`): E로 타서 WASD로 몰고 E로 내린다. 웹 안내는 `RIDE_PROMPT`

---

## 11. 미정 사항

| 항목 | 상태 |
| --- | --- |
| `public/godot/` 배포 방식 | 배포 전 결정 |
| 배경 그림 해상도 | 1672×940. 큰 화면에서 흐리면 2560 이상으로 다시 받기 |
| vault 연동 정책 | 보류 |
| Ask Deep Thought 범위 | 보류. 지금은 준비 중 패널만 둔다. 단순 검색 → RAG 범위 결정 |
| Mission Log | 보류. 글이 올라오면 패널에 얹는다 |
| 헤더 검색·Launch 버튼 | 보류. 검색은 글이 생긴 뒤, Launch는 동작을 정한 뒤 |
| 홈 하단 바 | 보류. 문구를 정한 뒤 얹는다 |

### 계속 점검할 질문

- 글을 읽으러 온 방문자가 첫 화면에서 바로 글로 갈 수 있는가?
- 게임을 하지 않는 방문자가 소외되지 않는가?
- Zannabi의 귀여움과 기술 글의 전문성이 서로를 해치지 않는가?
- 콘텐츠가 두 배로 늘어도 월드를 다시 만들지 않고 유지할 수 있는가?

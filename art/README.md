# art — 기준 그림

홈 시안·창틀·로고와 Zannabi의 기준 그림을 둔다. 쓰임은 [docs/DESIGN.md §1](../docs/DESIGN.md).

```text
art/refs/
  concept/home-gpt-v3.png          홈 시안 (ChatGPT). Zannabi 모습은 기준과 다르다
  concept/logo-gpt-v2.png          홈 로고 원본 (ChatGPT, 1808×870, 검정 배경)
  concept/window-frame-gpt-v2.png  창틀 원본 (ChatGPT, 1672×941, 창 안쪽 투명)
  space/space-bg-v3-4k.webp        창밖 우주 (ChatGPT 1672×940을 Bytedance Image Upscale로 4096×2304, 무손실 WebP)
  logo-mark-gpt-v3.png             헤더 로고 (GPT 흑백)
  cockpit/stool-gpt-v1.png         등받이 없는 의자 원본 (ChatGPT, 검정 배경)
  cockpit/desk-gpt-v3.png          조종 데스크 원본, 오른쪽 끝에 책 더미·메모 (ChatGPT, 1484×1060, 검정 배경)
  cockpit/hologram-dummy-gpt-v1.png 수련용 홀로그램 더미와 투사기 (ChatGPT, 1484×1060, 검정 배경)
  cockpit/ask-terminal-gpt-v1.png  Ask 카드 단말기 (ChatGPT, 1752×897, 검정 배경) → public/world/ask-terminal.webp
  zannabi-gpt-style-v1.png         잔나비 모습 기준 (v4 대기, ChatGPT, 데스크와 같은 그림체)
```

- 시안 그림은 ChatGPT(구독)로 직접 뽑는다. 업스케일은 Higgsfield `bytedance_image_upscale`·`bytedance_video_upscale`, 영상은 Kling 3.0 Omni (Frames)를 쓴다.
- 창밖 영상: `space-bg-v3-4k.webp`를 시작 프레임으로 Kling pro 10초 → 4K 업스케일 → ffmpeg로 정방향+역방향 핑퐁 → `public/world/space-loop-4k.mp4`. 포스터는 첫 프레임
- 생성 스크립트는 결과를 확정하며 지웠다(2026-11-19, git 기록에 있음). 중간 결과물과 AutoSprite에 넣은 입력 그림(걷기·뒷모습·드론·지구본)은 git에 두지 않는다. 결과는 public/에 있고 자세는 AutoSprite 캐릭터에 저장돼 있다.


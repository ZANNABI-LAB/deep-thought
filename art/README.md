# art — 기준 그림

홈 시안·창틀·로고와 Zannabi, 파비콘의 기준 그림을 둔다. 쓰임은 [docs/DESIGN.md §1](../docs/DESIGN.md).

```text
art/refs/
  concept/home-gpt-v3.png          홈 시안 (ChatGPT). Zannabi 모습은 기준과 다르다
  concept/logo-gpt-v2.png          홈 로고 원본 (ChatGPT, 1808×870, 검정 배경)
  concept/window-frame-gpt-v2.png  창틀 원본 (ChatGPT, 1672×941, 창 안쪽 투명)
  deep-thought-terminal-gpt-v1.png Zannabi 모습 기준 (유리 헬멧)
  zannabi-v5-turnaround.png        Zannabi 4방향 (헬멧 없는 몸)
  zannabi-v5-views/                4방향을 한 장씩 자른 것
  space/space-bg-v3.png            창밖 우주 (1672×940, GPT)
  space/space-bg-v3-4k.webp        위 그림을 Bytedance Image Upscale로 4096×2304 (무손실 WebP)
  logo-mark-gpt-v3.png             헤더 로고 (GPT 흑백)
  logo-mark-gpt-v2.png             옛 파비콘 (2026-11-19까지)
  favicon-terminal-42.png          파비콘 (32px 직접 찍은 단말기, 화면에 42). app/icon.png는 이걸 2배 최근접 확대
  cockpit/stool-gpt-v1.png         등받이 없는 의자 원본 (ChatGPT, 검정 배경)
  cockpit/desk-gpt-v3.png          조종 데스크 원본, 오른쪽 끝에 책 더미·메모 (ChatGPT, 1484×1060, 검정 배경)
  cockpit/hologram-dummy-gpt-v1.png 수련용 홀로그램 더미와 투사기 (ChatGPT, 1484×1060, 검정 배경)
  zannabi-gpt-style-v1.png         잔나비 v4 대기 기준 (ChatGPT, 데스크와 같은 그림체)
  zannabi-gpt-walk-v1.png          잔나비 v4 걷기 기준 (옆모습)
  zannabi-gpt-back-v1.png          잔나비 v4 뒷모습 기준
art/scripts/
  logo_mark.py                     GPT 흑백 그림 → 웹 SVG(public/brand/). potrace 필요
  logo.py                          로고 원본 → public/brand/home-logo-{630,1260,1808}.webp (배경 투명)
  cockpit_prop.py                  소품 원본 → public/world/ (배경 제거 후 폭 지정. 데스크 554, 의자 141 = 1080p의 2배 해상도)
  zannabi_v4.py                    AutoSprite 원본 시트 폴더 → public/world/zannabi-*.webp·@2x (칸 변환·번짐 제거·이동량 측정)
  hologram.py                      홀로그램 애니메이션 시트 → public/world/hologram-dummy.webp
  window_frame.py                  창틀 원본 → public/world/window-frame.png·window-lights.png + 이음·불빛 위치(JSON 출력을 WindowFrame.tsx에 옮긴다)
```

- 시안 그림은 ChatGPT(구독)로 직접 뽑는다. 업스케일은 Higgsfield `bytedance_image_upscale`·`bytedance_video_upscale`, 영상은 Kling 3.0 Omni (Frames)를 쓴다.
- 창밖 영상: `space-bg-v3-4k.webp`를 시작 프레임으로 Kling pro 10초 → 4K 업스케일 → ffmpeg로 정방향+역방향 핑퐁 → `public/world/space-loop-4k.mp4`. 포스터는 첫 프레임
- 중간 결과물은 git에 두지 않는다.

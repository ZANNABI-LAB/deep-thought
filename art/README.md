# art — 기준 그림

홈 콘셉트(우주선 창 + HUD)와 Zannabi, 로고의 기준 그림을 둔다. 쓰임은 [docs/DESIGN.md §1](../docs/DESIGN.md).

```text
art/refs/
  concept/cockpit-gpt-v2.png       홈 콘셉트 (GPT). Zannabi 모습은 잘못 그려졌다
  concept/cockpit-gpt-v1.png       같은 콘셉트의 앞선 시안
  deep-thought-terminal-gpt-v1.png Zannabi 모습 기준 (유리 헬멧)
  zannabi-v5-turnaround.png        Zannabi 4방향 (헬멧 없는 몸)
  zannabi-v5-views/                4방향을 한 장씩 자른 것
  space/space-bg-v3.png            창밖 우주 (1672×940, GPT)
  space/space-bg-v3-4k.webp        위 그림을 Bytedance Image Upscale로 4096×2304 (무손실 WebP)
  logo-mark-gpt-v3.png             헤더 로고 (GPT 흑백)
  logo-mark-gpt-v2.png             파비콘
art/scripts/
  logo_mark.py                     GPT 흑백 그림 → 웹 SVG(public/brand/)·파비콘(app/icon.png). potrace 필요
```

- 그림 생성은 GPT Image(Higgsfield `gpt_image_2_6`), 업스케일은 Higgsfield `bytedance_image_upscale`, 영상은 Kling 3.0 Omni (Frames)를 쓴다.
- 중간 결과물은 git에 두지 않는다.

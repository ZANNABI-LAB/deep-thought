/**
 * 생성 이미지 → 정돈된 도트 아트
 *
 * 이미지 생성 모델은 "픽셀 아트"를 요청해도 경계에 안티에일리어싱을 섞고
 * 색을 수십~수백 개로 내놓는다. 그대로는 dot-to-svg가 무손실 변환을 하지 못한다.
 *
 * 이 스크립트는 두 가지를 한다.
 *   1. 격자 스냅  — 셀 크기를 추정(또는 지정)해 셀당 최빈색으로 뭉갠다
 *   2. 팔레트 강제 — 브랜드 3색으로 최근접 양자화한다
 *
 * 사용법:
 *   npx tsx scripts/pixelize.ts <input.png> <output.png> [--grid N] [--palette a,b,c]
 *
 *   --grid     출력 격자 칸 수 (예: 64 → 64x64 도트). 생략 시 런 길이로 추정
 *   --palette  쉼표로 구분한 hex. 생략 시 브랜드 3색
 *   --scale    출력 배율 (기본 1 = 격자 크기 그대로)
 */
import fs from "node:fs";
import { PNG } from "pngjs";

const BRAND = ["#05080a", "#dce7df", "#3dff88"];

/** 채도(max-min). 이 값 미만이면 무채색으로 본다. */
const CHROMA_THRESHOLD = 60;

const chroma = (r: number, g: number, b: number) =>
  Math.max(r, g, b) - Math.min(r, g, b);

const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
};

const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

/**
 * 팔레트 최근접 선택 — 단순 RGB 거리를 쓰지 않는다.
 *
 * 순수 RGB 거리로는 중간 회색이 형광 그린에 더 가깝게 계산된다.
 * 예: (110,120,115) → 검정 34,594 / 흰색 36,085 / #3DFF88 21,067.
 * 그 결과 안티에일리어싱된 선 경계가 통째로 초록으로 번진다.
 *
 * 그래서 채도로 먼저 갈라낸다. 무채색 픽셀은 무채색 팔레트끼리만,
 * 유채색 픽셀은 전체 팔레트에서 고른다.
 */
const makePicker = (pal: [number, number, number][]) => {
  const achromatic = pal
    .map((c, i) => [i, c] as const)
    .filter(([, c]) => chroma(c[0], c[1], c[2]) < CHROMA_THRESHOLD);

  return (r: number, g: number, b: number): number => {
    const pool =
      chroma(r, g, b) < CHROMA_THRESHOLD && achromatic.length > 0
        ? achromatic
        : pal.map((c, i) => [i, c] as const);
    let bi = pool[0][0];
    let bd = Infinity;
    for (const [i, [pr, pg, pb]] of pool) {
      const d = (r - pr) ** 2 + (g - pg) ** 2 + (b - pb) ** 2;
      if (d < bd) { bd = d; bi = i; }
    }
    return bi;
  };
};

/**
 * 가로 런 길이의 최빈값으로 격자 셀 크기를 추정한다.
 * 안티에일리어싱된 1~2px 런은 노이즈이므로 3px 미만은 버린다.
 */
const guessCell = (png: PNG): number => {
  const { width: w, height: h, data } = png;
  const counts = new Map<number, number>();
  const at = (x: number, y: number) => {
    const o = (y * w + x) * 4;
    return (data[o] << 16) | (data[o + 1] << 8) | data[o + 2];
  };
  for (let y = 0; y < h; y += Math.max(1, Math.floor(h / 120))) {
    let cur = at(0, y);
    let n = 1;
    for (let x = 1; x < w; x++) {
      const c = at(x, y);
      if (c === cur) n++;
      else {
        if (n >= 3) counts.set(n, (counts.get(n) ?? 0) + 1);
        cur = c;
        n = 1;
      }
    }
  }
  const best = [...counts].sort((a, b) => b[1] - a[1])[0];
  return best ? best[0] : 1;
};

const main = () => {
  const [input, output, ...rest] = process.argv.slice(2);
  if (!input || !output) {
    console.error("사용법: tsx scripts/pixelize.ts <input.png> <output.png> [--grid N] [--palette a,b,c] [--scale N]");
    process.exit(1);
  }
  const flag = (name: string) => {
    const i = rest.indexOf(`--${name}`);
    return i >= 0 ? rest[i + 1] : undefined;
  };
  const palette = (flag("palette")?.split(",") ?? BRAND).map((s) => s.trim().toLowerCase());
  const pal = palette.map(hexToRgb);
  const scale = Number(flag("scale") ?? 1);

  const pick = makePicker(pal);

  const png = PNG.sync.read(fs.readFileSync(input));
  const { width: w, height: h, data } = png;

  const gridFlag = flag("grid");
  const cell = gridFlag ? w / Number(gridFlag) : guessCell(png);
  const gx = Math.max(1, Math.round(w / cell));
  const gy = Math.max(1, Math.round(h / cell));

  // 셀마다 최빈색을 뽑고 팔레트로 최근접 양자화
  const out = new PNG({ width: gx * scale, height: gy * scale });
  const usage = new Map<string, number>();

  for (let cy = 0; cy < gy; cy++) {
    for (let cx = 0; cx < gx; cx++) {
      const x0 = Math.floor((cx * w) / gx);
      const x1 = Math.max(x0 + 1, Math.floor(((cx + 1) * w) / gx));
      const y0 = Math.floor((cy * h) / gy);
      const y1 = Math.max(y0 + 1, Math.floor(((cy + 1) * h) / gy));

      // 셀 안의 픽셀을 팔레트로 투표시킨다 (평균은 경계를 흐리므로 쓰지 않는다)
      const votes = new Array(pal.length).fill(0);
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const o = (y * w + x) * 4;
          votes[pick(data[o], data[o + 1], data[o + 2])]++;
        }
      }
      const chosen = votes.indexOf(Math.max(...votes));
      const [r, g, b] = pal[chosen];
      usage.set(palette[chosen], (usage.get(palette[chosen]) ?? 0) + 1);

      for (let sy = 0; sy < scale; sy++) {
        for (let sx = 0; sx < scale; sx++) {
          const o = (((cy * scale + sy) * gx * scale) + (cx * scale + sx)) * 4;
          out.data[o] = r; out.data[o + 1] = g; out.data[o + 2] = b; out.data[o + 3] = 255;
        }
      }
    }
  }

  fs.writeFileSync(output, PNG.sync.write(out));
  console.log(`${input} ${w}x${h}`);
  console.log(`  셀 크기 ${cell.toFixed(1)}px ${gridFlag ? "(지정)" : "(추정)"} → 격자 ${gx}x${gy}`);
  console.log(`  팔레트 ${palette.length}색 강제`);
  for (const [hex, n] of [...usage].sort((a, b) => b[1] - a[1]))
    console.log(`    ${hex}  ${(n * 100 / (gx * gy)).toFixed(1)}%`);
  console.log(`  → ${output} (${out.width}x${out.height})`);
};

main();

/**
 * 도트 이미지 → SVG 벡터 변환기
 *
 * 굿즈 인쇄에는 벡터가 필수다. 마스코트 원본(1254px)을 900mm 장패드에 그대로 쓰면
 * 실효 35 DPI로, 인쇄 기준(300 DPI = 10,629px)에 한참 못 미친다.
 *
 * 색 수가 적은 도트 이미지는 픽셀을 사각형으로 환원할 수 있어 손실 없이 벡터화된다.
 * 같은 색 픽셀을 가로 런으로 묶고, 상하로 동일한 런을 다시 병합해 사각형 수를 줄인다.
 *
 * 사용법:
 *   npx tsx scripts/dot-to-svg.ts <input.png> <output.svg> [--bg <#rrggbb>]
 *
 *   --bg   배경색. 해당 색은 출력하지 않는다 (투명 배경).
 *          생략하면 가장 많이 쓰인 색을 배경으로 본다.
 */
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

const toHex = (r: number, g: number, b: number) =>
  "#" + [r, g, b].map((v) => v.toString(16).padStart(2, "0")).join("");

/** 한 색상의 픽셀 마스크를 최소 개수의 사각형으로 환원한다. */
const maskToRects = (mask: Uint8Array, w: number, h: number): Rect[] => {
  // 1단계 — 가로 런 추출
  const runs: Rect[] = [];
  for (let y = 0; y < h; y++) {
    let x = 0;
    while (x < w) {
      if (!mask[y * w + x]) {
        x++;
        continue;
      }
      const start = x;
      while (x < w && mask[y * w + x]) x++;
      runs.push({ x: start, y, w: x - start, h: 1 });
    }
  }

  // 2단계 — 위아래로 x/너비가 같은 런을 세로 병합
  const open = new Map<string, Rect>();
  const out: Rect[] = [];
  let cursor = 0;
  for (let y = 0; y < h; y++) {
    const seen = new Set<string>();
    while (cursor < runs.length && runs[cursor].y === y) {
      const run = runs[cursor++];
      const key = `${run.x}:${run.w}`;
      seen.add(key);
      const prev = open.get(key);
      if (prev && prev.y + prev.h === y) prev.h++;
      else {
        if (prev) out.push(prev);
        open.set(key, run);
      }
    }
    for (const [key, rect] of open) {
      if (!seen.has(key)) {
        out.push(rect);
        open.delete(key);
      }
    }
  }
  out.push(...open.values());
  return out;
};

/**
 * 생성된 사각형들을 다시 비트맵으로 펼쳐 원본과 대조한다.
 * 인쇄 도안은 육안 확인이 어려우므로 변환할 때마다 무손실을 기계적으로 보장한다.
 */
const verify = (
  layers: { hex: string; rects: Rect[] }[],
  original: string[],
  w: number,
  h: number,
  bg: string
): number => {
  const canvas = new Array<string>(w * h).fill(bg);
  for (const { hex, rects } of layers)
    for (const r of rects)
      for (let y = r.y; y < r.y + r.h; y++)
        for (let x = r.x; x < r.x + r.w; x++) canvas[y * w + x] = hex;
  let diff = 0;
  for (let i = 0; i < w * h; i++) if (canvas[i] !== original[i]) diff++;
  return diff;
};

const rectsToPath = (rects: Rect[]) =>
  rects.map((r) => `M${r.x} ${r.y}h${r.w}v${r.h}h${-r.w}z`).join("");

const main = () => {
  const [input, output, ...rest] = process.argv.slice(2);
  if (!input || !output) {
    console.error("사용법: tsx scripts/dot-to-svg.ts <input.png> <output.svg> [--bg #rrggbb]");
    process.exit(1);
  }
  const bgFlag = rest.indexOf("--bg");
  const bgOverride = bgFlag >= 0 ? rest[bgFlag + 1]?.toLowerCase() : undefined;

  const png = PNG.sync.read(fs.readFileSync(input));
  const { width: w, height: h, data } = png;

  // 색상별 마스크 수집
  const masks = new Map<string, Uint8Array>();
  const counts = new Map<string, number>();
  const original = new Array<string>(w * h);
  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    if (data[o + 3] < 128) continue; // 투명 픽셀 무시
    const hex = toHex(data[o], data[o + 1], data[o + 2]);
    original[i] = hex;
    let mask = masks.get(hex);
    if (!mask) masks.set(hex, (mask = new Uint8Array(w * h)));
    mask[i] = 1;
    counts.set(hex, (counts.get(hex) ?? 0) + 1);
  }

  const bg =
    bgOverride ?? [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";

  const layers: { hex: string; rects: Rect[] }[] = [];
  let totalRects = 0;
  for (const [hex, mask] of [...masks].sort(
    (a, b) => (counts.get(b[0]) ?? 0) - (counts.get(a[0]) ?? 0)
  )) {
    if (hex === bg) continue;
    const rects = maskToRects(mask, w, h);
    totalRects += rects.length;
    layers.push({ hex, rects });
  }

  for (let i = 0; i < w * h; i++) if (original[i] === undefined) original[i] = bg;
  const diff = verify(layers, original, w, h, bg);

  const body = layers
    .map((l) => `<path fill="${l.hex}" d="${rectsToPath(l.rects)}"/>`)
    .join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges">${body}</svg>\n`;
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, svg);

  const px = [...counts.values()].reduce((a, b) => a + b, 0);
  console.log(`${path.basename(input)} ${w}x${h}`);
  console.log(`  색상 ${masks.size}종 (배경 ${bg} 제외)`);
  console.log(`  픽셀 ${px.toLocaleString()} → 사각형 ${totalRects.toLocaleString()} (${(totalRects / px * 100).toFixed(2)}%)`);
  console.log(`  → ${output} (${(fs.statSync(output).size / 1024).toFixed(1)} KB)`);
  if (diff === 0) {
    console.log("  검증: 무손실 ✓");
  } else {
    console.error(`  검증 실패: ${diff.toLocaleString()}px 불일치`);
    process.exitCode = 1;
  }
};

main();

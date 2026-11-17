'use client';

import { useEffect, useRef } from 'react';
import styles from './WindowFrame.module.css';

/** art/scripts/window_frame.py가 만든 2px 격자 창틀·불빛과 그 스크립트가 출력한 위치 */
const FRAME_SRC = '/world/window-frame.png';
const LIGHTS_SRC = '/world/window-lights.png';
const ART = { w: 836, h: 470 };
const SEAMS = { x: [261, 625], y: [127, 334] };

/** 표시등 [x, y, w, h]와 밝기가 오가는 주기(ms)·최저 밝기 */
const LIGHTS = [
  { rect: [13, 165, 6, 32], period: 6800, min: 0.6 }, // 왼쪽 세로 막대
  { rect: [82, 430, 18, 4], period: 3400, min: 0.35 }, // 왼쪽 아래
  { rect: [88, 4, 18, 4], period: 4600, min: 0.35 }, // 왼쪽 위
  { rect: [731, 5, 18, 3], period: 3900, min: 0.35 }, // 오른쪽 위
  { rect: [737, 430, 17, 4], period: 5200, min: 0.35 }, // 오른쪽 아래
  { rect: [817, 165, 6, 32], period: 7400, min: 0.6 }, // 오른쪽 세로 막대
] as const;

type Span = { from: number; size: number; to: number; at: number };

/** 원본 길이 length를 target까지 늘린다. 이음 줄 하나를 늘어난 만큼 복제한다. at은 늘어난 그림에서의 시작 위치 */
function spans(length: number, seams: number[], target: number): Span[] {
  const extra = Math.max(0, target - length);
  const share = [Math.floor(extra / 2), extra - Math.floor(extra / 2)];
  const out: Omit<Span, 'at'>[] = [];
  let prev = 0;
  seams.forEach((seam, i) => {
    out.push({ from: prev, size: seam - prev, to: seam - prev });
    out.push({ from: seam, size: 1, to: share[i] ?? 0 });
    prev = seam;
  });
  out.push({ from: prev, size: length - prev, to: length - prev });
  let at = 0;
  return out
    .filter((s) => s.to > 0)
    .map((s) => {
      const span = { ...s, at };
      at += s.to;
      return span;
    });
}

/** 원본 좌표를 늘어난 그림의 좌표로 옮긴다. 표시등은 이음 줄에 걸치지 않는다 */
function place(list: Span[], value: number) {
  const span = list.find((s) => s.size > 1 && value >= s.from && value < s.from + s.size) ?? list[0]!;
  return span.at + value - span.from;
}

/** 창밖 우주를 감싸는 우주선 창틀. 도트가 뭉개지지 않게 정수배로만 키우고, 표시등은 따로 깜빡인다 */
export function WindowFrame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const frame = new Image();
    const lights = new Image();
    frame.src = FRAME_SRC;
    lights.src = LIGHTS_SRC;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const ready = () => frame.complete && frame.naturalWidth > 0 && lights.complete && lights.naturalWidth > 0;

    // 표시등마다 화면에서의 자리 [x, y, w, h] (기기 픽셀)
    let spots: [number, number, number, number][] = [];

    const draw = () => {
      if (!ready()) return;
      const w = Math.round(innerWidth * devicePixelRatio);
      const h = Math.round(innerHeight * devicePixelRatio);
      canvas.width = w;
      canvas.height = h;
      const scale = Math.max(1, Math.min(Math.floor(w / ART.w), Math.floor(h / ART.h)));
      const cols = spans(ART.w, SEAMS.x, Math.ceil(w / scale));
      const rows = spans(ART.h, SEAMS.y, Math.ceil(h / scale));
      // 정수배로 키운 그림이 화면보다 몇 px 크면 가운데에 맞춘다
      const left = Math.floor((w - cols.reduce((n, c) => n + c.to, 0) * scale) / 2);
      const top = Math.floor((h - rows.reduce((n, r) => n + r.to, 0) * scale) / 2);

      ctx.imageSmoothingEnabled = false;
      for (const row of rows) {
        for (const col of cols) {
          ctx.drawImage(frame, col.from, row.from, col.size, row.size, left + col.at * scale, top + row.at * scale, col.to * scale, row.to * scale);
        }
      }
      spots = LIGHTS.map(({ rect: [x, y, lw, lh] }) => [left + place(cols, x) * scale, top + place(rows, y) * scale, lw * scale, lh * scale]);
      shine(performance.now());
    };

    // 꺼진 불빛 위에 켜진 불빛을 밝기만 바꿔 다시 얹는다
    const shine = (now: number) => {
      LIGHTS.forEach(({ rect: [x, y, lw, lh], period, min }, i) => {
        const [sx, sy, sw, sh] = spots[i]!;
        const wave = still ? 1 : 0.5 + 0.5 * Math.sin((now / period + i * 0.37) * Math.PI * 2);
        ctx.clearRect(sx, sy, sw, sh);
        ctx.globalAlpha = 1;
        ctx.drawImage(frame, x, y, lw, lh, sx, sy, sw, sh);
        ctx.globalAlpha = min + (1 - min) * wave;
        ctx.drawImage(lights, x, y, lw, lh, sx, sy, sw, sh);
      });
      ctx.globalAlpha = 1;
    };

    let frameId = 0;
    let last = 0;
    const tick = (now: number) => {
      // 불빛은 천천히 바뀌니 초당 20번이면 충분하다
      if (now - last > 50 && spots.length) {
        shine(now);
        last = now;
      }
      frameId = requestAnimationFrame(tick);
    };

    frame.addEventListener('load', draw);
    lights.addEventListener('load', draw);
    window.addEventListener('resize', draw);
    draw();
    if (!still) frameId = requestAnimationFrame(tick);
    return () => {
      frame.removeEventListener('load', draw);
      lights.removeEventListener('load', draw);
      window.removeEventListener('resize', draw);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}

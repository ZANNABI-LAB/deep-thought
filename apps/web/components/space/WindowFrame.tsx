'use client';

import { useEffect, useRef } from 'react';
import { usable } from '@/lib/image';
import { reducedMotion } from '@/lib/motion';
import styles from './WindowFrame.module.css';

export const FRAME_SRC = '/world/window-frame.png';
export const LIGHTS_SRC = '/world/window-lights.png';
const ART = { w: 836, h: 470 };
const SEAMS = { x: [261, 625], y: [127, 334] };
const SILL: [number, number] = [457, 6];
const GLASS = { left: 48, top: 22, right: 788, bottom: 407 };

export type GlassLayout = { left: number; top: number; right: number; bottom: number; px: number };

type Rect = readonly [x: number, y: number, w: number, h: number];

const STRIPS: { box: Rect; dots: Rect[]; offset: number }[] = [
  { box: [88, 4, 18, 4], dots: [[88, 4, 4, 4], [94, 4, 5, 4], [102, 4, 4, 4]], offset: 0 },
  { box: [731, 5, 18, 3], dots: [[731, 5, 4, 3], [737, 5, 5, 3], [745, 5, 4, 3]], offset: 1100 },
  { box: [82, 430, 18, 4], dots: [[82, 430, 4, 4], [88, 430, 5, 4], [96, 430, 4, 4]], offset: 1900 },
  { box: [737, 430, 17, 4], dots: [[737, 430, 4, 4], [743, 430, 5, 4], [751, 430, 3, 4]], offset: 700 },
];
const BARS: { box: Rect; cells: Rect[]; offset: number }[] = [
  { box: [13, 165, 6, 32], cells: [[13, 165, 6, 15], [13, 180, 6, 17]], offset: 0 },
  { box: [817, 165, 6, 32], cells: [[817, 165, 6, 15], [817, 180, 6, 17]], offset: 1800 },
];

const OFF = 0.15;
const DOT_MS = 450;
const ALL_ON_MS = 1100;
const BREATH_MS = 3600;
const GLOW = 4;
const GLOW_BLUR = 2;
const GLOW_RES = 4;

function stripLevel(t: number, dot: number) {
  const phase = t % (DOT_MS * 3 + ALL_ON_MS);
  if (phase >= DOT_MS * 3) return 0.9;
  return Math.floor(phase / DOT_MS) === dot ? 1 : OFF;
}

function barLevel(t: number, cell: number) {
  const wave = 0.5 + 0.5 * Math.sin((t / BREATH_MS) * Math.PI * 2 + cell * Math.PI);
  return OFF + (1 - OFF) * wave;
}

type Span = { from: number; size: number; to: number; at: number };

function spans(length: number, seams: number[], target: number, fixed: [number, number] | null = null): Span[] {
  const extra = Math.max(0, target - length - (fixed?.[1] ?? 0));
  const share = [Math.floor(extra / 2), extra - Math.floor(extra / 2)];
  const cuts = [...seams.map((at, i) => [at, share[i] ?? 0] as const), ...(fixed ? [fixed] : [])].sort((a, b) => a[0] - b[0]);
  const out: Omit<Span, 'at'>[] = [];
  let prev = 0;
  cuts.forEach(([seam, amount]) => {
    out.push({ from: prev, size: seam - prev, to: seam - prev });
    out.push({ from: seam, size: 1, to: amount });
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

function place(list: Span[], value: number) {
  const span = list.find((s) => s.size > 1 && value >= s.from && value < s.from + s.size) ?? list[0]!;
  return span.at + value - span.from;
}

export function WindowFrame({ onLayout }: { onLayout: (layout: GlassLayout) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onLayoutRef = useRef(onLayout);
  onLayoutRef.current = onLayout;

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const frame = new Image();
    const lights = new Image();
    frame.src = FRAME_SRC;
    lights.src = LIGHTS_SRC;
    const still = reducedMotion();
    const ready = () => usable(frame);

    let scale = 1;
    let toScreen = (r: Rect): Rect => r;
    const glows = new Map<Rect, HTMLCanvasElement>();
    const glowOf = (rect: Rect) => {
      let glow = glows.get(rect);
      if (!glow) {
        const [x, y, w, h] = rect;
        glow = document.createElement('canvas');
        glow.width = (w + GLOW * 2) * GLOW_RES;
        glow.height = (h + GLOW * 2) * GLOW_RES;
        const g = glow.getContext('2d')!;
        g.imageSmoothingEnabled = false;
        g.filter = `blur(${GLOW_BLUR * GLOW_RES}px)`;
        g.drawImage(lights, x, y, w, h, GLOW * GLOW_RES, GLOW * GLOW_RES, w * GLOW_RES, h * GLOW_RES);
        glows.set(rect, glow);
      }
      return glow;
    };
    const paint = (box: Rect, parts: { rect: Rect; level: number }[]) => {
      const pad: Rect = [box[0] - GLOW, box[1] - GLOW, box[2] + GLOW * 2, box[3] + GLOW * 2];
      const [px, py, pw, ph] = toScreen(pad);
      ctx.clearRect(px, py, pw, ph);
      ctx.drawImage(frame, ...pad, px, py, pw, ph);
      if (!usable(lights)) return;
      for (const { rect, level } of parts) {
        const [sx, sy, sw, sh] = toScreen(rect);
        ctx.globalAlpha = level;
        ctx.drawImage(lights, ...rect, sx, sy, sw, sh);
        const [gx, gy, gw, gh] = toScreen([rect[0] - GLOW, rect[1] - GLOW, rect[2] + GLOW * 2, rect[3] + GLOW * 2]);
        ctx.globalCompositeOperation = 'lighter';
        ctx.imageSmoothingEnabled = true;
        ctx.globalAlpha = level * 0.7;
        ctx.drawImage(glowOf(rect), gx, gy, gw, gh);
        ctx.imageSmoothingEnabled = false;
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    };

    const shine = (t: number) => {
      STRIPS.forEach(({ box, dots, offset }) => {
        paint(box, dots.map((rect, i) => ({ rect, level: still ? 1 : stripLevel(t + offset, i) })));
      });
      BARS.forEach(({ box, cells, offset }) => {
        paint(box, cells.map((rect, i) => ({ rect, level: still ? 1 : barLevel(t + offset, i) })));
      });
    };

    const draw = () => {
      if (!ready()) return;
      const w = Math.round(innerWidth * devicePixelRatio);
      const h = Math.round(innerHeight * devicePixelRatio);
      canvas.width = w;
      canvas.height = h;
      const fit = Math.max(1, Math.min(Math.floor(w / ART.w), Math.floor(h / ART.h)));
      scale = Math.min(fit, Math.max(1, Math.round(Math.min(w / (ART.w * 2), h / (ART.h * 2)))));
      const cols = spans(ART.w, SEAMS.x, Math.ceil(w / scale));
      const rows = spans(ART.h, SEAMS.y, Math.ceil(h / scale), SILL);
      const left = Math.floor((w - cols.reduce((n, c) => n + c.to, 0) * scale) / 2);
      const top = Math.floor((h - rows.reduce((n, r) => n + r.to, 0) * scale) / 2);
      toScreen = ([x, y, rw, rh]) => [left + place(cols, x) * scale, top + place(rows, y) * scale, rw * scale, rh * scale];

      ctx.imageSmoothingEnabled = false;
      for (const row of rows) {
        for (const col of cols) {
          ctx.drawImage(frame, col.from, row.from, col.size, row.size, left + col.at * scale, top + row.at * scale, col.to * scale, row.to * scale);
        }
      }
      const dpr = devicePixelRatio;
      onLayoutRef.current({
        left: (left + place(cols, GLASS.left) * scale) / dpr,
        top: (top + place(rows, GLASS.top) * scale) / dpr,
        right: (w - left - place(cols, GLASS.right) * scale) / dpr,
        bottom: (h - top - place(rows, GLASS.bottom) * scale) / dpr,
        px: scale / dpr,
      });
      shine(performance.now());
    };

    let frameId = 0;
    let last = 0;
    const tick = (now: number) => {
      if (now - last > 50 && ready() && usable(lights)) {
        shine(now);
        last = now;
      }
      frameId = requestAnimationFrame(tick);
    };

    let resizeId = 0;
    const onResize = () => {
      cancelAnimationFrame(resizeId);
      resizeId = requestAnimationFrame(draw);
    };

    const bare = () => onLayoutRef.current({ left: 0, top: 0, right: 0, bottom: 0, px: 1 / devicePixelRatio });
    frame.addEventListener('load', draw);
    frame.addEventListener('error', bare);
    lights.addEventListener('load', draw);
    window.addEventListener('resize', onResize);
    draw();
    if (!still) frameId = requestAnimationFrame(tick);
    return () => {
      frame.removeEventListener('load', draw);
      frame.removeEventListener('error', bare);
      lights.removeEventListener('load', draw);
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);
      cancelAnimationFrame(resizeId);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}

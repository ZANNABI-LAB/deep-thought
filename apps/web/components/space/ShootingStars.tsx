'use client';

import { useEffect, useRef } from 'react';
import styles from './ShootingStars.module.css';

/** 배경 그림 좌표계(1280×720). 화면에는 background-size: cover와 같은 방식으로 맞춘다 */
const ART = { w: 1280, h: 720 };

const TOP_PLANET = { x: 1020, y: 75, r: 172 + 24 }; // 대기빛 여유 포함
const BOTTOM_PLANET = { x: -120, y: 1050, r: 558 + 30 };

/** 별똥별이 앞을 지나가면 안 되는 천체 (중심·반지름) */
const BODIES = [
  TOP_PLANET,
  BOTTOM_PLANET,
  { x: 836, y: 94, r: 30 }, // 위 행성 옆 바위들
  { x: 893, y: 128, r: 16 },
  { x: 110, y: 485, r: 24 }, // 왼쪽 바위
  { x: 275, y: 630, r: 16 },
];

/**
 * 두 행성이 마주 보는 축. 별똥별은 이 축을 따라 위 행성 쪽에서 아래 행성 쪽으로 떨어지고,
 * 축 양옆의 빈 통로 안에서만 나온다
 */
const AXIS = (() => {
  const vx = BOTTOM_PLANET.x - TOP_PLANET.x;
  const vy = BOTTOM_PLANET.y - TOP_PLANET.y;
  const length = Math.hypot(vx, vy);
  return { angle: Math.atan2(vy, vx), from: TOP_PLANET.r + 40, to: length - BOTTOM_PLANET.r - 40 };
})();
const LANE_HALF_WIDTH = 140;

const GAP_MS: [number, number] = [7000, 19000];
const DEMO_GAP_MS: [number, number] = [500, 1100];

type Meteor = {
  x: number; // 시작점 (그림 좌표)
  y: number;
  dx: number; // 단위 방향
  dy: number;
  travel: number; // 머리가 움직이는 거리
  tail: number; // 꼬리 최대 길이
  width: number;
  peak: number; // 최대 밝기 0..1
  duration: number;
  start: number;
};

const rand = (min: number, max: number) => min + Math.random() * (max - min);

/** 선분 a→b와 원 사이 최단 거리가 반지름보다 작으면 겹친다 */
function hitsBody(ax: number, ay: number, bx: number, by: number) {
  return BODIES.some(({ x, y, r }) => {
    const vx = bx - ax;
    const vy = by - ay;
    const t = Math.max(0, Math.min(1, ((x - ax) * vx + (y - ay) * vy) / (vx * vx + vy * vy)));
    return Math.hypot(ax + vx * t - x, ay + vy * t - y) < r;
  });
}

function spawn(now: number): Meteor | null {
  const ux = Math.cos(AXIS.angle);
  const uy = Math.sin(AXIS.angle);
  for (let i = 0; i < 24; i++) {
    const angle = AXIS.angle + rand(-4, 4) * (Math.PI / 180);
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const travel = rand(140, 260);
    const tail = travel * rand(0.45, 0.7);
    const along = rand(AXIS.from, AXIS.to - travel);
    const across = rand(-LANE_HALF_WIDTH, LANE_HALF_WIDTH);
    const x = TOP_PLANET.x + ux * along - uy * across;
    const y = TOP_PLANET.y + uy * along + ux * across;
    const ex = x + dx * travel;
    const ey = y + dy * travel;
    if ([x, ex].some((v) => v < 20 || v > ART.w - 20) || [y, ey].some((v) => v < 20 || v > ART.h - 20)) continue;
    if (hitsBody(x - dx * tail, y - dy * tail, ex, ey)) continue;
    return {
      x,
      y,
      dx,
      dy,
      travel,
      tail,
      width: rand(0.9, 1.5),
      peak: rand(0.55, 0.95),
      duration: travel * rand(2.6, 3.6),
      start: now,
    };
  }
  return null;
}

/** 창밖 우주 위에 가끔 별똥별을 그린다. 반복 영상에 넣으면 같은 자리에서 반복돼 티가 나서 코드로 둔다 */
export function ShootingStars() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const demo = process.env.NODE_ENV !== 'production' && new URLSearchParams(location.search).has('meteors');
    const [gapMin, gapMax] = demo ? DEMO_GAP_MS : GAP_MS;

    let scale = 1;
    let offsetX = 0;
    let offsetY = 0;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      const { innerWidth: w, innerHeight: h } = window;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      scale = Math.max(w / ART.w, h / ART.h);
      offsetX = (w - ART.w * scale) / 2;
      offsetY = (h - ART.h * scale) / 2;
      ctx.setTransform(dpr * scale, 0, 0, dpr * scale, dpr * offsetX, dpr * offsetY);
    };
    resize();
    window.addEventListener('resize', resize);

    let meteors: Meteor[] = [];
    let frame = 0;
    let timer = 0;

    const draw = (m: Meteor, now: number) => {
      const t = (now - m.start) / m.duration;
      const ease = 1 - (1 - t) ** 2; // 들어올 때 빠르고 끝에서 살짝 느려진다
      const hx = m.x + m.dx * m.travel * ease;
      const hy = m.y + m.dy * m.travel * ease;
      // 꼬리는 처음에 자라고, 사라질 때 머리 쪽으로 줄어든다
      const len = m.tail * Math.min(1, t * 3) * (t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1);
      const alpha = m.peak * Math.min(1, t * 6) * (t > 0.55 ? 1 - (t - 0.55) / 0.45 : 1);
      const tx = hx - m.dx * len;
      const ty = hy - m.dy * len;

      const trail = ctx.createLinearGradient(hx, hy, tx, ty);
      trail.addColorStop(0, `rgb(232 240 255 / ${alpha})`);
      trail.addColorStop(0.25, `rgb(170 196 255 / ${alpha * 0.45})`);
      trail.addColorStop(1, 'rgb(120 150 255 / 0)');
      ctx.strokeStyle = trail;
      ctx.lineWidth = m.width;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(tx, ty);
      ctx.stroke();

      const glow = ctx.createRadialGradient(hx, hy, 0, hx, hy, m.width * 3.2);
      glow.addColorStop(0, `rgb(245 248 255 / ${alpha})`);
      glow.addColorStop(1, 'rgb(170 196 255 / 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(hx, hy, m.width * 3.2, 0, Math.PI * 2);
      ctx.fill();
    };

    const tick = (now: number) => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
      meteors = meteors.filter((m) => now - m.start < m.duration);
      for (const m of meteors) draw(m, now);
      frame = meteors.length ? requestAnimationFrame(tick) : 0;
    };

    // 별똥별이 없을 때는 프레임을 돌리지 않는다
    const schedule = () => {
      timer = window.setTimeout(() => {
        if (!document.hidden) {
          const m = spawn(performance.now());
          if (m) meteors.push(m);
          if (!frame) frame = requestAnimationFrame(tick);
        }
        schedule();
      }, rand(gapMin, gapMax));
    };
    schedule();

    return () => {
      window.removeEventListener('resize', resize);
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.canvas} aria-hidden="true" />;
}

'use client';

import { useEffect, useRef } from 'react';
import styles from './Zannabi.module.css';

const CELL_W = 200;
const CELL_H = 240;
const BODY_HALF = 64;
const CLIPS: Record<Clip, { frames: number; fps: number; ease?: boolean; advance?: number[]; lead?: number; tail?: number; seated?: boolean }> = {
  idle: { frames: 17, fps: 10 },
  turn: { frames: 7, fps: 11, lead: 1, advance: [0, 0, 1, 2, 4, 6, 8] },
  'turn-stop': { frames: 12, fps: 11, tail: 1, advance: [6, 4, 3, 2, 1, 1, 0, 0, 0, 0, 0, 0] },
  'turn-around': { frames: 14, fps: 11, lead: 1, advance: [0, 0, 0, 0, 0, 0, 0, 0, 0, -2, 0, 0, -2, 0] },
  walk: { frames: 11, fps: 11, advance: [3, 11, 7, 7, 11, 14, 8, 0, 9, 10, 8] },
  wave: { frames: 22, fps: 12, ease: true },
  look: { frames: 22, fps: 11, ease: true },
  yawn: { frames: 22, fps: 11, ease: true },
  doze: { frames: 22, fps: 11, ease: true },
  hop: { frames: 18, fps: 12, ease: true },
  'turn-back': { frames: 13, fps: 12, ease: true, lead: 1, advance: [-2, 0, -2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] },
  'turn-front': { frames: 11, fps: 12, ease: true, tail: 1, advance: [0, 1, 4, 0, 0, 0, 0, 3, 2, 0, 0] },
  breathe: { frames: 24, fps: 9 },
  tilt: { frames: 20, fps: 10, ease: true },
  palm: { frames: 21, fps: 10, ease: true },
  'look-up': { frames: 18, fps: 10, ease: true },
  sit: { frames: 28, fps: 11, ease: true, seated: true },
  read: { frames: 27, fps: 10, seated: true },
  'read-nod': { frames: 27, fps: 10, seated: true },
  stand: { frames: 23, fps: 11, ease: true, seated: true },
};
const WALK_ENTRY = 7;
const sum = (list: number[] = []) => list.reduce((total, d) => total + d, 0);
const travel = (clip: Clip) => sum(CLIPS[clip].advance);
const STRIDE = travel('walk');
const STOP = travel('turn-stop');
const TRIP = travel('turn') + sum(CLIPS.walk.advance?.slice(WALK_ENTRY)) + STOP;
const AROUND = travel('turn-around');
const SEAT_EDGE = 1;
const SEAT_BODY = 42;
const PACE: [number, number] = [0.8, 1.25];
const READS: Clip[] = ['read', 'read-nod'];
const DESK_W = 554;
const DESK_H = 305;
const DESK_LIGHTS: [number, number, number, number, 'amber' | 'violet', number][] = [
  [64, 44, 22, 14, 'violet', 300],
  [249, 116, 21, 14, 'amber', 0],
  [281, 116, 21, 14, 'amber', 1200],
];
const REST_MS: [number, number] = [3000, 8000];
const MIN_TRIP = 0.25;
const WAVE_COOLDOWN_MS = 20000;
const HOVER_MS = 900;

type Clip =
  | 'idle'
  | 'turn'
  | 'turn-stop'
  | 'turn-around'
  | 'walk'
  | 'wave'
  | 'look'
  | 'yawn'
  | 'doze'
  | 'hop'
  | 'turn-back'
  | 'turn-front'
  | 'breathe'
  | 'tilt'
  | 'palm'
  | 'look-up'
  | 'sit'
  | 'read'
  | 'read-nod'
  | 'stand';
type Step = { clip: Clip; repeat?: number; walk?: boolean; flip?: boolean; from?: number; pace?: number; cycles?: number };
type Behavior = 'walk' | 'look' | 'yawn' | 'doze' | 'hop' | 'gaze' | 'wave' | 'read';

const GAZE_MOMENTS: Clip[] = ['tilt', 'palm', 'look-up'];

const between = ([min, max]: [number, number]) => min + Math.random() * (max - min);
const count = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
const shuffle = <T,>(list: T[]) => [...list].sort(() => Math.random() - 0.5);

function plan(behavior: Behavior): Step[] {
  switch (behavior) {
    case 'walk':
      return [{ clip: 'turn' }, { clip: 'walk', walk: true, from: WALK_ENTRY }, { clip: 'turn-stop' }];
    case 'gaze': {
      const moments = shuffle(GAZE_MOMENTS).slice(0, count(1, 3));
      return [
        { clip: 'turn-back' },
        ...moments.flatMap((clip): Step[] => [{ clip: 'breathe', repeat: count(1, 3) }, { clip }]),
        { clip: 'breathe', repeat: count(1, 2) },
        { clip: 'turn-front' },
      ];
    }
    default:
      return [{ clip: behavior }];
  }
}
const WEIGHTS: [Behavior, number][] = [
  ['walk', 40],
  ['read', 10],
  ['look', 12],
  ['gaze', 12],
  ['yawn', 8],
  ['doze', 6],
  ['hop', 6],
];

function pick(previous: Behavior | null): Behavior {
  const options = WEIGHTS.filter(([b]) => b === 'walk' || b !== previous);
  let roll = Math.random() * options.reduce((sum, [, w]) => sum + w, 0);
  for (const [behavior, weight] of options) {
    roll -= weight;
    if (roll < 0) return behavior;
  }
  return 'walk';
}

export function Zannabi() {
  const laneRef = useRef<HTMLDivElement>(null);
  const seatRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lane = laneRef.current!;
    const seat = seatRef.current!;
    const body = bodyRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const hud = lane.parentElement!;
    const logo = hud.querySelector<HTMLElement>('[data-zannabi-anchor] img')!;

    const images = new Map(
      (Object.keys(CLIPS) as Clip[]).map((clip) => {
        const img = new Image();
        img.src = `/world/zannabi-${clip}.webp`;
        return [clip, img];
      }),
    );

    let width = 0;
    let margin = 0;
    let scale = 1;
    let seatX = 0;
    let x = 0;
    let target = 0;
    let drawn = '';
    const measure = () => {
      const dpr = devicePixelRatio;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      ctx.imageSmoothingQuality = 'high';
      drawn = '';
      lane.style.width = `${(logo.offsetLeft + logo.offsetWidth / 2) * 2}px`;
      scale = canvas.clientHeight / CELL_H;
      margin = BODY_HALF * scale;
      width = Math.max(0, lane.clientWidth - margin * 2);
      seatX = parseFloat(getComputedStyle(seat).left) - (SEAT_EDGE + SEAT_BODY) * scale - margin + canvas.clientWidth / 2;
      x = Math.min(x, width);
      target = Math.min(target, width);
    };
    measure();

    x = width * 0.55;
    target = x;
    let dir = 1;
    let queue: Step[] = [];
    let step: Step | null = null;
    let tick = 0;
    let loops = 0;
    let restUntil = performance.now() + between(REST_MS);
    let previous: Behavior | null = null;
    let waveWanted = false;
    let wavedAt = -Infinity;
    let arrived = false;

    const clip = (): Clip => step?.clip ?? 'idle';
    const clamp = (value: number) => Math.min(Math.max(value, 0), width);
    const pace = () => step?.pace ?? 1;
    const frameCount = () => CLIPS[clip()].frames - (CLIPS[clip()].tail ?? 0);

    const paint = () => {
      const current = clip();
      const shift = CLIPS[current].seated ? SEAT_BODY * scale : 0;
      const left = Math.round((margin + x - canvas.clientWidth / 2 + shift) * devicePixelRatio) / devicePixelRatio;
      const key = `${current} ${tick} ${left} ${dir}`;
      if (key === drawn) return;
      drawn = key;
      body.style.transform = `translateX(${left}px) scaleX(${dir})`;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(images.get(current)!, tick * CELL_W, 0, CELL_W, CELL_H, 0, 0, canvas.width, canvas.height);
    };

    const toSeat = (): Step[] | null => {
      const d = (seatX - x) / scale;
      const toward = d > 0 ? 1 : -1;
      const before = toward !== dir;
      const after = toward !== 1;
      const length = Math.abs(d) + (before ? AROUND : 0) - (after ? AROUND : 0);
      const cycles = Math.max(0, Math.round((length - TRIP) / STRIDE));
      const k = length / (TRIP + cycles * STRIDE);
      if (k < PACE[0] || k > PACE[1]) return null;
      const reads = Array.from({ length: count(2, 4) }, (): Step => ({ clip: READS[Math.floor(Math.random() * READS.length)]! }));
      return [
        ...(before ? [{ clip: 'turn-around', flip: true } as Step] : []),
        { clip: 'turn', pace: k },
        { clip: 'walk', walk: true, from: WALK_ENTRY, pace: k, cycles },
        { clip: 'turn-stop', pace: k },
        ...(after ? [{ clip: 'turn-around', flip: true } as Step] : []),
        { clip: 'sit' },
        ...reads,
        { clip: 'stand' },
      ];
    };

    const start = (behavior: Behavior): void => {
      if (behavior === 'read') {
        const trip = toSeat();
        if (!trip) return start('walk');
        previous = behavior;
        queue = trip;
        return next();
      }
      previous = behavior;
      if (behavior === 'wave') {
        waveWanted = false;
        wavedAt = performance.now();
      }
      if (behavior === 'walk') {
        const edge = Math.min(STRIDE * scale, width / 4);
        do target = edge + Math.random() * (width - edge * 2);
        while (width > 0 && Math.abs(target - x) < width * MIN_TRIP);
        arrived = false;
      }
      queue = plan(behavior);
      if (behavior === 'walk' && (target > x ? 1 : -1) !== dir) queue.unshift({ clip: 'turn-around', flip: true });
      next();
    };

    const next = (): void => {
      if (step?.flip) dir = -dir;
      step = queue.shift() ?? null;
      seat.toggleAttribute('data-seated', !!step && !!CLIPS[step.clip].seated);
      tick = step?.from ?? 0;
      if (step && !step.from && CLIPS[step.clip].lead) {
        x = clamp(x + dir * (CLIPS[step.clip].advance?.[0] ?? 0) * scale * pace());
        tick = CLIPS[step.clip].lead!;
      }
      loops = 0;
      if (step) return;
      if (waveWanted) return start('wave');
      restUntil = performance.now() + between(REST_MS);
    };

    const advance = (now: number) => {
      if (!step) {
        tick = (tick + 1) % CLIPS.idle.frames;
        if (tick !== 0) return;
        if (waveWanted) start('wave');
        else if (now >= restUntil) start(pick(previous));
        return;
      }
      const steps = CLIPS[step.clip].advance;
      if (steps) x = clamp(x + dir * (steps[tick] ?? 0) * scale * pace());
      if (step.walk) {
        if (step.cycles === undefined && (target - x) * dir <= STOP * scale) arrived = true;
        tick = (tick + 1) % frameCount();
        if (tick === 0) loops += 1;
        if (tick === 0 && (arrived || loops > (step.cycles ?? Infinity))) next();
        return;
      }
      tick += 1;
      if (tick < frameCount()) return;
      loops += 1;
      if (loops < (step.repeat ?? 1)) {
        tick = 0;
        return;
      }
      next();
    };

    const greet = () => {
      if (performance.now() - wavedAt < WAVE_COOLDOWN_MS || (previous === 'wave' && step)) return;
      waveWanted = true;
      if (CLIPS[clip()].seated) {
        queue = queue.filter((s) => s.clip === 'stand');
        return;
      }
      const sit = queue.findIndex((s) => s.clip === 'sit');
      if (sit >= 0) queue = queue.slice(0, sit);
      if (step?.walk) arrived = true;
    };

    const interval = () => {
      const { fps, ease, frames } = CLIPS[clip()];
      let weight = 1;
      if (ease && step) weight = 0.7 + 0.9 * (1 - Math.sin((Math.PI * tick) / Math.max(1, frames - 1)));
      return (1000 / fps) * weight;
    };

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let id = 0;
    let last = 0;
    let acc = 0;
    const loop = (now: number) => {
      acc += Math.min(now - last, 250);
      last = now;
      let wait = interval();
      while (acc >= wait) {
        acc -= wait;
        advance(now);
        wait = interval();
      }
      paint();
      id = requestAnimationFrame(loop);
    };
    let alive = true;
    let ready = false;
    const observer = new ResizeObserver(() => {
      measure();
      if (ready && still) paint();
    });
    observer.observe(hud);
    observer.observe(logo);
    Promise.all([...images.values()].map((img) => img.decode())).then(() => {
      if (!alive) return;
      ready = true;
      if (still) return paint();
      last = performance.now();
      id = requestAnimationFrame(loop);
    });

    let hover = 0;
    const enter = () => {
      clearTimeout(hover);
      hover = window.setTimeout(greet, HOVER_MS);
    };
    const leave = () => clearTimeout(hover);
    canvas.addEventListener('pointerenter', enter);
    canvas.addEventListener('pointerleave', leave);
    canvas.addEventListener('click', greet);
    return () => {
      alive = false;
      cancelAnimationFrame(id);
      observer.disconnect();
      clearTimeout(hover);
      canvas.removeEventListener('pointerenter', enter);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('click', greet);
    };
  }, []);

  return (
    <div ref={laneRef} className={styles.lane} aria-hidden>
      <div className={styles.desk}>
        <img src="/world/cockpit-desk.webp" alt="" width={DESK_W} height={DESK_H} />
        {DESK_LIGHTS.map(([x, y, w, h, tone, delay]) => (
          <span
            key={`${x}-${y}`}
            className={styles[tone]}
            style={{ left: `${(x / DESK_W) * 100}%`, top: `${(y / DESK_H) * 100}%`, width: `${(w / DESK_W) * 100}%`, height: `${(h / DESK_H) * 100}%`, animationDelay: `${delay}ms` }}
          />
        ))}
      </div>
      <div ref={seatRef} className={styles.seat}>
        <img src="/world/cockpit-chair.webp" alt="" width={169} height={215} />
      </div>
      <div ref={bodyRef} className={styles.body}>
        <canvas ref={canvasRef} className={styles.sprite} />
      </div>
    </div>
  );
}

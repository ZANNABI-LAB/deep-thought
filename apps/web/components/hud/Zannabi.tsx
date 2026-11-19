'use client';

import { useEffect, useRef } from 'react';
import { HUD_EVENT } from '@/components/space/CockpitHud';
import styles from './Zannabi.module.css';

type Box = [x: number, y: number, w: number, h: number];
type Spec = { frames: number; cols: [number, number]; fps?: number; advance?: number[]; box?: Box; seated?: boolean; hits?: number[] };

const CELL: Box = [0, 0, 200, 240];
const CANVAS: Box = [-52, -18, 317, 272];
const FPS = 14;
const BODY_HALF = 64;
const CLIPS: Record<Clip, Spec> = {
  idle: { frames: 28, cols: [28, 28], fps: 7 },
  walk: { frames: 14, cols: [14, 14], advance: [0, 6, 7, 8, 10, 6, 12, 3, 7, 8, 11, 8, 6, 9] },
  turn: { frames: 16, cols: [16, 16], advance: [2, 4, 7, 6, 7, 3, 2, 0, 5, 7, 6, 6, 7, 5, 2, 1] },
  'turn-stop': { frames: 8, cols: [8, 8], advance: [12, 13, 0, 0, 0, 0, 0, 0] },
  'turn-around': { frames: 26, cols: [26, 26] },
  wave: { frames: 26, cols: [26, 26] },
  look: { frames: 26, cols: [26, 26] },
  yawn: { frames: 26, cols: [26, 26] },
  doze: { frames: 26, cols: [26, 26] },
  hop: { frames: 26, cols: [26, 26], box: [0, -18, 200, 258] },
  saber: { frames: 26, cols: [26, 25], box: [-52, 0, 317, 254], hits: [6, 15] },
  sit: { frames: 27, cols: [27, 27], seated: true },
  read: { frames: 27, cols: [27, 27], seated: true },
  'read-nod': { frames: 27, cols: [27, 27], seated: true },
  stand: { frames: 26, cols: [26, 26], seated: true },
  'turn-back': { frames: 26, cols: [26, 26] },
  'turn-front': { frames: 26, cols: [26, 26] },
  breathe: { frames: 28, cols: [28, 28], fps: 7 },
  tilt: { frames: 26, cols: [26, 26] },
  palm: { frames: 26, cols: [26, 26] },
  'look-up': { frames: 26, cols: [26, 26] },
  console: { frames: 26, cols: [26, 26] },
};
const WALK_ENTRY = 8;
const sum = (list: number[] = []) => list.reduce((total, d) => total + d, 0);
const travel = (clip: Clip) => sum(CLIPS[clip].advance);
const STRIDE = travel('walk');
const STOP = travel('turn-stop');
const TRIP = travel('turn') + sum(CLIPS.walk.advance?.slice(WALK_ENTRY)) + STOP;
const STOOL_GAP = 22;
const PACE: [number, number] = [0.8, 1.25];
const READS: Clip[] = ['read', 'read-nod'];
const HOLO = { frames: 24, fps: 14, w: 296, h: 441, dummy: 21 };
const SABER_REACH = 240;
const PILOT_AT = 0.3;
const DESK_W = 554;
const DESK_H = 307;
const DESK_LIGHTS: [number, number, number, number, 'amber' | 'violet', number][] = [
  [65, 46, 22, 14, 'violet', 300],
  [249, 118, 21, 14, 'amber', 0],
  [281, 118, 20, 14, 'amber', 1200],
];
const REST_MS: [number, number] = [3000, 8000];
const STILL_MS: [number, number] = [1000, 3000];
const MIN_TRIP = 0.25;
const WAVE_COOLDOWN_MS = 20000;
const HOVER_MS = 900;
const FIRST: Clip[] = ['idle', 'turn', 'walk', 'turn-stop', 'turn-around', 'wave'];

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
  | 'stand'
  | 'saber'
  | 'console';
type Holo = 'appear' | 'disappear';
type Step = {
  clip: Clip;
  repeat?: number;
  walk?: boolean;
  flip?: boolean;
  from?: number;
  pace?: number;
  cycles?: number;
  scene?: boolean;
  holo?: Holo;
  hud?: boolean;
};
const NEEDS: Record<Behavior, Clip[]> = {
  walk: ['turn', 'walk', 'turn-stop', 'turn-around'],
  read: ['turn', 'walk', 'turn-stop', 'turn-around', 'sit', 'read', 'read-nod', 'stand'],
  saber: ['turn', 'walk', 'turn-stop', 'turn-around', 'saber'],
  pilot: ['turn', 'walk', 'turn-stop', 'turn-around', 'turn-back', 'console', 'breathe', 'turn-front'],
  gaze: ['turn-back', 'breathe', 'tilt', 'palm', 'look-up', 'turn-front'],
  look: ['look'],
  yawn: ['yawn'],
  doze: ['doze'],
  hop: ['hop'],
  wave: ['wave'],
};
type Behavior = 'walk' | 'look' | 'yawn' | 'doze' | 'hop' | 'gaze' | 'wave' | 'read' | 'saber' | 'pilot';

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
        ...moments.flatMap((clip): Step[] => [{ clip: 'breathe', repeat: count(1, 2) }, { clip }]),
        { clip: 'breathe' },
        { clip: 'turn-front' },
      ];
    }
    default:
      return [{ clip: behavior as Clip }];
  }
}
const WEIGHTS: [Behavior, number][] = [
  ['walk', 40],
  ['read', 10],
  ['saber', 8],
  ['pilot', 10],
  ['look', 12],
  ['gaze', 12],
  ['yawn', 8],
  ['doze', 6],
  ['hop', 6],
];

function pick(previous: Behavior | null, loaded: Set<Clip>): Behavior {
  const options = WEIGHTS.filter(([b]) => (b === 'walk' || b !== previous) && NEEDS[b].every((c) => loaded.has(c)));
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
  const deskRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const holoRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lane = laneRef.current!;
    const seat = seatRef.current!;
    const desk = deskRef.current!;
    const body = bodyRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const hit = hitRef.current!;
    const holo = holoRef.current!;
    const holoCtx = holo.getContext('2d')!;
    const hud = lane.parentElement!;
    const logo = hud.querySelector<HTMLElement>('[data-zannabi-anchor] img')!;

    const R = devicePixelRatio > 1.25 ? 2 : 1;
    const images = new Map<Clip, HTMLImageElement>();
    const loaded = new Set<Clip>();
    const load = (clip: Clip) => {
      const img = new Image();
      img.src = `/world/zannabi-${clip}${R === 2 ? '@2x' : ''}.webp`;
      images.set(clip, img);
      return img.decode().then(() => loaded.add(clip));
    };
    const holoImg = new Image();
    holoImg.src = '/world/hologram-dummy.webp';

    let width = 0;
    let margin = 0;
    let scale = 1;
    let seatX = 0;
    let saberX = 0;
    let pilotX = 0;
    let x = 0;
    let target = 0;
    let drawn = '';
    let holoDrawn = -1;
    const measure = () => {
      const dpr = devicePixelRatio;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      holo.width = Math.round(holo.clientWidth * dpr);
      holo.height = Math.round(holo.clientHeight * dpr);
      for (const c of [ctx, holoCtx]) c.imageSmoothingQuality = 'high';
      drawn = '';
      holoDrawn = -1;
      lane.style.width = `${(logo.offsetLeft + logo.offsetWidth / 2) * 2}px`;
      scale = body.clientHeight / CELL[3];
      margin = BODY_HALF * scale;
      width = Math.max(0, lane.clientWidth - margin * 2);
      const stool = getComputedStyle(seat);
      seatX = parseFloat(stool.left) + parseFloat(stool.width) / 2 + STOOL_GAP * scale - margin;
      pilotX = desk.offsetLeft + desk.offsetWidth * PILOT_AT - margin;
      saberX = holo.offsetLeft + (HOLO.dummy - SABER_REACH) * scale - margin + body.clientWidth / 2;
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
    let stillUntil = 0;
    let previous: Behavior | null = null;
    let waveWanted = false;
    let wavedAt = -Infinity;
    let arrived = false;
    let holoMode: Holo | 'on' | 'off' = 'off';
    let holoTick = HOLO.frames - 1;
    let holoAcc = 0;

    const clip = (): Clip => step?.clip ?? 'idle';
    const clamp = (value: number) => Math.min(Math.max(value, 0), width);
    const pace = () => step?.pace ?? 1;
    const spec = (): Spec => CLIPS[clip()];

    const paint = () => {
      const current = clip();
      const left = Math.round((margin + x - body.clientWidth / 2) * devicePixelRatio) / devicePixelRatio;
      const key = `${current} ${tick} ${left} ${dir}`;
      if (key === drawn) return;
      drawn = key;
      body.style.transform = `translateX(${left}px) scaleX(${dir})`;
      const { box = CELL, cols } = spec();
      const [bx, by, bw, bh] = box;
      const k = canvas.width / CANVAS[2];
      const col = cols[R - 1]!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        images.get(current)!,
        (tick % col) * bw * R,
        Math.floor(tick / col) * bh * R,
        bw * R,
        bh * R,
        (bx - CANVAS[0]) * k,
        (by - CANVAS[1]) * k,
        bw * k,
        bh * k,
      );
    };

    const paintHolo = () => {
      if (holoTick === holoDrawn) return;
      holoDrawn = holoTick;
      holoCtx.clearRect(0, 0, holo.width, holo.height);
      holoCtx.drawImage(holoImg, holoTick * HOLO.w, 0, HOLO.w, HOLO.h, 0, 0, holo.width, holo.height);
    };

    const advanceHolo = () => {
      if (holoMode === 'appear') {
        holoTick -= 1;
        if (holoTick === 0) holoMode = 'on';
      } else if (holoMode === 'disappear') {
        holoTick += 1;
        if (holoTick === HOLO.frames - 1) holoMode = 'off';
      }
      holo.toggleAttribute('data-on', holoMode === 'on');
    };

    const flash = () =>
      holo.animate(
        [
          { filter: 'brightness(2.6)', transform: 'translateX(3%)' },
          { filter: 'brightness(1.4)', transform: 'translateX(-2%)' },
          { filter: 'none', transform: 'none' },
        ],
        { duration: 260, easing: 'ease-out' },
      );

    const walkTo = (spot: number): Step[] | null => {
      const d = (spot - x) / scale;
      const toward = d > 0 ? 1 : -1;
      const before = toward !== dir;
      const after = toward !== 1;
      const length = Math.abs(d);
      const cycles = Math.max(0, Math.round((length - TRIP) / STRIDE));
      const k = length / (TRIP + cycles * STRIDE);
      if (k < PACE[0] || k > PACE[1]) return null;
      return [
        ...(before ? [{ clip: 'turn-around', flip: true } as Step] : []),
        { clip: 'turn', pace: k },
        { clip: 'walk', walk: true, from: WALK_ENTRY, pace: k, cycles },
        { clip: 'turn-stop', pace: k },
        ...(after ? [{ clip: 'turn-around', flip: true } as Step] : []),
      ];
    };

    const scenes: Record<'read' | 'saber' | 'pilot', () => Step[]> = {
      read: () => [
        { clip: 'sit', scene: true },
        ...Array.from({ length: count(2, 4) }, (): Step => ({ clip: READS[Math.floor(Math.random() * READS.length)]!, scene: true })),
        { clip: 'stand', scene: true },
      ],
      saber: () => [
        { clip: 'idle', holo: 'appear', scene: true },
        { clip: 'saber', scene: true },
        { clip: 'idle', holo: 'disappear', scene: true },
      ],
      pilot: () => [
        { clip: 'turn-back', scene: true },
        { clip: 'console', hud: true, scene: true },
        { clip: 'breathe', repeat: count(1, 2), scene: true },
        { clip: 'console', scene: true },
        { clip: 'turn-front', hud: false, scene: true },
      ],
    };
    const spots = { read: () => seatX, saber: () => saberX, pilot: () => pilotX };
    const signal = (on: boolean) => {
      desk.toggleAttribute('data-active', on);
      window.dispatchEvent(new CustomEvent(HUD_EVENT, { detail: on }));
    };

    const start = (behavior: Behavior): void => {
      if (behavior === 'read' || behavior === 'saber' || behavior === 'pilot') {
        const trip = walkTo(spots[behavior]());
        if (!trip) return start('walk');
        previous = behavior;
        arrived = false;
        queue = [...trip, ...scenes[behavior]()];
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
      if (step?.hud !== undefined) signal(step.hud);
      if (step?.holo) {
        holoMode = step.holo;
        holoTick = step.holo === 'appear' ? HOLO.frames - 1 : 0;
        holoAcc = 0;
      }
      tick = step?.from ?? 0;
      loops = 0;
      if (step) return;
      if (waveWanted) return start('wave');
      restUntil = performance.now() + between(REST_MS);
    };

    const advance = (now: number) => {
      if (!step) {
        if (tick === 0 && now < stillUntil && !waveWanted) return;
        tick = (tick + 1) % CLIPS.idle.frames;
        if (tick !== 0) return;
        stillUntil = now + between(STILL_MS);
        if (waveWanted) start('wave');
        else if (now >= restUntil) start(pick(previous, loaded));
        return;
      }
      const steps = spec().advance;
      if (steps) x = clamp(x + dir * (steps[tick] ?? 0) * scale * pace());
      if (step.walk) {
        if (step.cycles === undefined && (target - x) * dir <= STOP * scale) arrived = true;
        tick = (tick + 1) % spec().frames;
        if (tick === 0) loops += 1;
        if (tick === 0 && (arrived || loops > (step.cycles ?? Infinity))) next();
        return;
      }
      tick += 1;
      if (spec().hits?.includes(tick)) flash();
      if (tick < spec().frames) return;
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
      if (spec().seated) {
        queue = queue.filter((s) => s.clip === 'stand');
        return;
      }
      if (step?.scene && previous === 'pilot') {
        queue = queue.filter((s) => s.clip === 'turn-front');
        return;
      }
      if (step?.scene) return;
      const scene = queue.findIndex((s) => s.scene);
      if (scene >= 0) queue = queue.slice(0, scene);
      if (step?.walk) arrived = true;
    };

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let id = 0;
    let last = 0;
    let acc = 0;
    let holoLast = 0;
    const loop = (now: number) => {
      acc += Math.min(now - last, 250);
      last = now;
      while (acc >= 1000 / (spec().fps ?? FPS)) {
        acc -= 1000 / (spec().fps ?? FPS);
        advance(now);
      }
      if (holoMode === 'appear' || holoMode === 'disappear') {
        holoAcc += Math.min(now - holoLast, 250);
        while (holoAcc >= 1000 / HOLO.fps) {
          holoAcc -= 1000 / HOLO.fps;
          advanceHolo();
        }
      }
      holoLast = now;
      paint();
      paintHolo();
      id = requestAnimationFrame(loop);
    };
    let alive = true;
    let ready = false;
    const observer = new ResizeObserver(() => {
      measure();
      if (ready && still) {
        paint();
        paintHolo();
      }
    });
    observer.observe(hud);
    observer.observe(logo);
    Promise.all([...FIRST.map(load), holoImg.decode()]).then(() => {
      if (!alive) return;
      ready = true;
      for (const clip of Object.keys(CLIPS) as Clip[]) if (!images.has(clip)) load(clip);
      if (still) {
        paint();
        return paintHolo();
      }
      last = holoLast = performance.now();
      id = requestAnimationFrame(loop);
    });

    let hover = 0;
    const enter = () => {
      clearTimeout(hover);
      hover = window.setTimeout(greet, HOVER_MS);
    };
    const leave = () => clearTimeout(hover);
    hit.addEventListener('pointerenter', enter);
    hit.addEventListener('pointerleave', leave);
    hit.addEventListener('click', greet);
    return () => {
      alive = false;
      signal(false);
      cancelAnimationFrame(id);
      observer.disconnect();
      clearTimeout(hover);
      hit.removeEventListener('pointerenter', enter);
      hit.removeEventListener('pointerleave', leave);
      hit.removeEventListener('click', greet);
    };
  }, []);

  return (
    <div ref={laneRef} className={styles.lane} aria-hidden>
      <div ref={deskRef} className={styles.desk}>
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
        <img src="/world/cockpit-stool.webp" alt="" width={141} height={130} />
      </div>
      <canvas ref={holoRef} className={styles.holo} />
      <div ref={bodyRef} className={styles.body}>
        <canvas ref={canvasRef} className={styles.sprite} />
        <div ref={hitRef} className={styles.hit} />
      </div>
    </div>
  );
}

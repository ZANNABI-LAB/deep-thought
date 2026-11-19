'use client';

import { useEffect, useRef } from 'react';
import { HUD_EVENT } from '@/components/space/CockpitHud';
import styles from './Zannabi.module.css';
import {
  type Behavior,
  type Box,
  type Clip,
  type Holo,
  type Place,
  type Spec,
  type Step,
  CLIPS,
  FIRST,
  FPS,
  IDLE_CUTS,
  MIN_TRIP,
  NEAR,
  NEEDS,
  PACE,
  READS,
  REST_MS,
  SHORT,
  SHORT_PACE,
  STILL_MS,
  STOP,
  STRIDE,
  TRIP,
  WALK_ENTRY,
  between,
  count,
  isPlace,
  pick,
  sum,
} from './zannabi-motion';

const CELL: Box = [0, 0, 200, 240];
const CANVAS: Box = [-60, -60, 420, 314];
const BODY_HALF = 64;
const STOOL_GAP = 22;
const HOLO = { frames: 24, fps: 14, w: 296, h: 441, dummy: 21 };
const DRONE = { w: 200, h: 304, frames: 49, fps: 21, crop: 491, from: 11, to: 36 };
const DRONE_DY = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 23, 45, 63, 68, 71, 71, 63, 35, 9, -15, -24, -31, -35, -36, -37, -38, -39, -39, -39, -35, -30, -19, -12, -4, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
const GLOBE = { size: 176, spin: 24, off: 25, fps: 21, spinFps: 10.5 };
const SABER_REACH = 250;
const PILOT_AT = 0.3;
const DESK_W = 554;
const DESK_H = 307;
const DESK_LIGHTS: [number, number, number, number, 'amber' | 'violet', number][] = [
  [65, 46, 22, 14, 'violet', 300],
  [249, 118, 21, 14, 'amber', 0],
  [281, 118, 20, 14, 'amber', 1200],
];
const HOLD_MS = 900;
const NOTICE = { reach: 1.8, cooldown: 25000 };
const DONE_MS = 1100;
const ANSWER_MS = 4500;
const TERM_GAP = 17;
const DECK = { left: 66, bottom: 4.8 };
const ROAM: { left: [number, number]; bottom: [number, number]; chance: number } = { left: [24, 58], bottom: [26, 40], chance: 0.7 };
const LANE_CQH = 27.5;
const DIGITS = '0123456789ABCDEF';
const SHAKE_MS = 420;

function Tip({ children }: { children: string }) {
  const label = (
    <>
      {children}
      <svg viewBox="0 0 24 24" aria-hidden>
        <path d="M5 12h14M13 6l6 6-6 6" />
      </svg>
    </>
  );
  return (
    <span className={styles.tip}>
      <span className={styles.label}>{label}</span>
      <span className={styles.fill} />
      <span className={`${styles.label} ${styles.over}`} aria-hidden>
        {label}
      </span>
      <svg className={styles.check} viewBox="0 0 24 24" aria-hidden>
        <path d="M5 12.5l4.5 4.5L19 7.5" />
      </svg>
    </span>
  );
}

export function Zannabi() {
  const laneRef = useRef<HTMLDivElement>(null);
  const seatRef = useRef<HTMLDivElement>(null);
  const deskRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hitRef = useRef<HTMLDivElement>(null);
  const holoRef = useRef<HTMLCanvasElement>(null);
  const globeRef = useRef<HTMLCanvasElement>(null);
  const projectorRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<HTMLDivElement>(null);
  const readoutRef = useRef<HTMLSpanElement>(null);
  const droneRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const lane = laneRef.current!;
    const seat = seatRef.current!;
    const desk = deskRef.current!;
    const body = bodyRef.current!;
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const hit = hitRef.current!;
    const holo = holoRef.current!;
    const projector = projectorRef.current!;
    const terminal = termRef.current!;
    const readout = readoutRef.current!;
    const drone = droneRef.current!;
    const droneCtx = drone.getContext('2d')!;
    const droneBody = drone.parentElement!;
    const holoCtx = holo.getContext('2d')!;
    const globe = globeRef.current!;
    const globeCtx = globe.getContext('2d')!;
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
    const droneImg = new Image();
    droneImg.src = '/world/cockpit-drone.webp';
    const globeSpin = new Image();
    const globeOff = new Image();

    let width = 0;
    let margin = 0;
    let scale = 1;
    let seatX = 0;
    let saberX = 0;
    let pilotX = 0;
    let askX = 0;
    let x = 0;
    let drawn = '';
    let holoDrawn = -1;
    let globeDrawn = '';
    let droneDrawn = -1;
    const measure = () => {
      const dpr = devicePixelRatio;
      canvas.width = Math.round(canvas.clientWidth * dpr);
      canvas.height = Math.round(canvas.clientHeight * dpr);
      holo.width = Math.round(holo.clientWidth * dpr);
      holo.height = Math.round(holo.clientHeight * dpr);
      globe.width = globe.height = Math.round(globe.clientWidth * dpr);
      drone.width = Math.round(drone.clientWidth * dpr);
      drone.height = Math.round(drone.clientHeight * dpr);
      droneDrawn = -1;
      for (const c of [ctx, holoCtx, globeCtx]) c.imageSmoothingQuality = 'high';
      globeDrawn = '';
      drawn = '';
      holoDrawn = -1;
      lane.style.width = `${(logo.offsetLeft + logo.offsetWidth / 2) * 2}px`;
      scale = body.clientHeight / CELL[3];
      margin = BODY_HALF * scale;
      width = Math.max(0, lane.clientWidth - margin * 2);
      const stool = getComputedStyle(seat);
      seatX = parseFloat(stool.left) + parseFloat(stool.width) / 2 + STOOL_GAP * scale - margin;
      pilotX = desk.offsetLeft + desk.offsetWidth * PILOT_AT - margin;
      askX = (DECK.left * lane.clientHeight) / LANE_CQH - TERM_GAP * scale - margin;
      saberX = holo.offsetLeft + (HOLO.dummy - SABER_REACH) * scale - margin + body.clientWidth / 2;
      x = Math.min(x, width);
    };
    measure();

    x = width * 0.55;
    let dir = 1;
    let queue: Step[] = [];
    let step: Step | null = null;
    let tick = 0;
    let loops = 0;
    let restUntil = performance.now() + between(REST_MS);
    let stillUntil = 0;
    let previous: Behavior | null = null;
    let waveWanted = false;
    let wanted: Place | null = null;
    let arrived = false;
    let holoMode: Holo | 'on' | 'off' = 'off';
    let holoTick = HOLO.frames - 1;
    let holoAcc = 0;
    let globeMode: 'off' | 'appear' | 'on' | 'disappear' = 'off';
    let globeTick = 0;
    let globeAcc = 0;
    let droneTick = 0;
    let droneAcc = 0;

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
      body.style.setProperty('--dir', `${dir}`);
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

    const paintGlobe = () => {
      const key = `${globeMode} ${globeTick}`;
      if (key === globeDrawn) return;
      globeDrawn = key;
      globeCtx.clearRect(0, 0, globe.width, globe.height);
      if (globeMode === 'off') return;
      const img = globeMode === 'on' ? globeSpin : globeOff;
      globeCtx.drawImage(img, globeTick * GLOBE.size, 0, GLOBE.size, GLOBE.size, 0, 0, globe.width, globe.height);
    };

    const paintDrone = () => {
      if (droneTick === droneDrawn || !droneImg.complete) return;
      droneDrawn = droneTick;
      droneCtx.clearRect(0, 0, drone.width, drone.height);
      droneCtx.drawImage(droneImg, droneTick * DRONE.w, 0, DRONE.w, DRONE.h, 0, 0, drone.width, drone.height);
      const lift = DRONE_DY[droneTick]! / DRONE.crop;
      droneBody.style.translate = `0 ${lift * 100}%`;
      terminal.style.setProperty('--lift', `${lift}`);
    };

    const park = (left: number, bottom: number) => {
      terminal.style.left = `${left}cqh`;
      terminal.style.bottom = `${bottom}cqh`;
    };
    const roam = () => park(between(ROAM.left), between(ROAM.bottom));

    const advanceDrone = () => {
      const state = terminal.dataset.state;
      if ((state === 'compute' || state === 'answer') && (droneTick < DRONE.from || droneTick > DRONE.to)) return;
      droneTick = (droneTick + 1) % DRONE.frames;
      if (state === 'idle' && droneTick === DRONE.from && Math.random() < ROAM.chance) roam();
    };

    const advanceGlobe = () => {
      if (globeMode === 'appear') {
        globeTick -= 1;
        if (globeTick <= 0) {
          globeMode = 'on';
          globeTick = 0;
        }
      } else if (globeMode === 'on') {
        globeTick = (globeTick + 1) % GLOBE.spin;
      } else if (globeMode === 'disappear') {
        globeTick += 1;
        if (globeTick >= GLOBE.off - 1) globeMode = 'off';
      }
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

    const leg = (from: number, facing: number, spot: number): Step[] | null => {
      const length = Math.abs(spot - from) / scale;
      const turn: Step[] = (spot > from ? 1 : -1) !== facing ? [{ clip: 'turn-around', flip: true }] : [];
      const even = Math.max(0, (length - TRIP) / STRIDE);
      for (const cycles of [Math.round(even), Math.floor(even), Math.ceil(even)]) {
        const k = length / (TRIP + cycles * STRIDE);
        if (k >= PACE[0] && k <= PACE[1])
          return [...turn, { clip: 'turn', pace: k }, { clip: 'walk', walk: true, from: WALK_ENTRY, pace: k, cycles }, { clip: 'turn-stop', pace: k }];
      }
      const short = length / SHORT;
      if (short >= SHORT_PACE[0] && short <= SHORT_PACE[1]) return [...turn, { clip: 'turn', pace: short }, { clip: 'turn-stop', pace: short }];
      return null;
    };

    const route = (spot: number, face?: number): Step[] | null => {
      let steps: Step[] | null = [];
      let end = dir;
      if (Math.abs(spot - x) / scale > NEAR) {
        end = spot > x ? 1 : -1;
        steps = leg(x, dir, spot);
        for (const side of [-end, end]) {
          if (steps) break;
          for (const reach of [1, 1.5]) {
            const via = spot + side * TRIP * reach * scale;
            if (via < 0 || via > width) continue;
            const out = leg(x, dir, via);
            const back = out && leg(via, via > x ? 1 : -1, spot);
            if (back) {
              steps = [...out!, ...back];
              break;
            }
          }
        }
      }
      if (!steps) return null;
      return face && face !== end ? [...steps, { clip: 'turn-around', flip: true }] : steps;
    };

    const clearSpot = () => {
      const unit = lane.clientHeight / LANE_CQH;
      const blocks = [seat, desk, holo]
        .map((el): [number, number] => [el.offsetLeft - margin, el.offsetLeft + el.offsetWidth - margin])
        .concat([[DECK.left * unit - margin, DECK.left * unit + terminal.offsetWidth - margin]])
        .map(([a, b]): [number, number] => [a - BODY_HALF * scale, b + BODY_HALF * scale])
        .sort((a, b) => a[0] - b[0]);
      let best: [number, number] = [0, 0];
      let edge = 0;
      for (const [a, b] of [...blocks, [width, width] as [number, number]]) {
        if (Math.min(a, width) - edge > best[1] - best[0]) best = [edge, Math.min(a, width)];
        edge = Math.max(edge, b);
      }
      return (best[0] + best[1]) / 2;
    };
    const places: Record<Place, { at: () => number; face?: number; scene: () => Step[] }> = {
      read: {
        at: () => seatX,
        face: 1,
        scene: () => [
          { clip: 'sit', scene: true },
          ...Array.from({ length: count(2, 4) }, (): Step => ({ clip: READS[Math.floor(Math.random() * READS.length)]!, scene: true })),
          { clip: 'stand', scene: true },
        ],
      },
      saber: {
        at: () => saberX,
        face: 1,
        scene: () => [
          { clip: 'idle', holo: 'appear', scene: true },
          { clip: Math.random() < 0.5 ? 'saber' : 'saber-2', scene: true },
          { clip: 'bow', scene: true },
          { clip: 'idle', holo: 'disappear', scene: true },
        ],
      },
      pilot: {
        at: () => pilotX,
        face: 1,
        scene: () => [
          { clip: 'turn-back', scene: true },
          { clip: 'console', hud: true, scene: true },
          { clip: 'breathe', repeat: count(1, 2), scene: true },
          { clip: 'console-2', scene: true },
          { clip: 'turn-front', hud: false, scene: true },
        ],
      },
      gaze: {
        at: clearSpot,
        face: 1,
        scene: () => [
          { clip: 'turn-back', scene: true },
          { clip: 'breathe', repeat: count(1, 2), scene: true },
          { clip: 'look-up', scene: true },
          { clip: 'breathe', scene: true },
          { clip: 'turn-front', scene: true },
        ],
      },
      ask: {
        at: () => askX,
        face: 1,
        scene: () => [
          { clip: 'turn-back', scene: true },
          { clip: 'type', term: 'compute', repeat: 2, scene: true },
          { clip: 'turn-front', term: 'answer', scene: true },
          { clip: 'thumbs', scene: true },
        ],
      },
    };
    let computing = 0;
    let answered = 0;
    const think = (state: 'idle' | 'call' | 'compute' | 'answer') => {
      clearInterval(computing);
      clearTimeout(answered);
      terminal.dataset.state = state;
      if (state === 'idle') roam();
      else park(DECK.left, DECK.bottom);
      if (state === 'compute') {
        computing = window.setInterval(() => {
          readout.textContent = Array.from({ length: 3 }, () =>
            Array.from({ length: 6 }, () => DIGITS[Math.floor(Math.random() * DIGITS.length)]).join(''),
          ).join('\n');
        }, 70);
      }
      if (state === 'answer') answered = window.setTimeout(() => think('idle'), ANSWER_MS);
    };
    const signal = (on: boolean) => {
      desk.toggleAttribute('data-active', on);
      if (on && (globeMode === 'off' || globeMode === 'disappear')) {
        if (globeMode === 'off') globeTick = GLOBE.off - 1;
        globeMode = 'appear';
      } else if (!on && (globeMode === 'on' || globeMode === 'appear')) {
        if (globeMode === 'on') globeTick = 0;
        globeMode = 'disappear';
      }
      window.dispatchEvent(new CustomEvent(HUD_EVENT, { detail: on }));
    };

    const wander = (): Step[] | null => {
      const edge = Math.min(STRIDE * scale, width / 4);
      for (let tries = 0; tries < 8; tries += 1) {
        const spot = edge + Math.random() * (width - edge * 2);
        if (Math.abs(spot - x) < width * MIN_TRIP) continue;
        const steps = route(spot);
        if (steps) return steps;
      }
      return null;
    };

    const start = (behavior: Behavior): void => {
      if (behavior === 'ask') think('call');
      else if (terminal.dataset.state === 'call') think('idle');
      if (isPlace(behavior)) {
        const place = places[behavior];
        const trip = route(place.at(), place.face);
        if (!trip) return start('walk');
        previous = behavior;
        arrived = false;
        queue = [...trip, ...place.scene()];
        return next();
      }
      previous = behavior;
      arrived = false;
      if (behavior === 'wave') {
        waveWanted = false;
      }
      queue = (behavior === 'walk' ? wander() : [{ clip: behavior as Clip }]) ?? [];
      next();
    };

    const next = (): void => {
      if (step?.flip) dir = -dir;
      step = queue.shift() ?? null;
      seat.toggleAttribute('data-seated', !!step && !!CLIPS[step.clip].seated);
      if (step?.hud !== undefined) signal(step.hud);
      if (step?.term) think(step.term);
      if (step?.holo) {
        holoMode = step.holo;
        holoTick = step.holo === 'appear' ? HOLO.frames - 1 : 0;
        holoAcc = 0;
      }
      tick = step?.from ?? (step ? (CLIPS[step.clip].start ?? 0) : 0);
      loops = 0;
      if (step) return;
      if (asked()) return answer();
      restUntil = performance.now() + (demo.length ? 1200 : between(REST_MS));
    };

    const advance = (now: number) => {
      if (!step) {
        if (asked() && IDLE_CUTS.has(tick)) return answer();
        if (tick === 0 && now < stillUntil) return;
        tick = (tick + 1) % CLIPS.idle.frames;
        if (tick !== 0) return;
        stillUntil = now + between(STILL_MS);
        if (now >= restUntil) start(rehearse() ?? pick(previous, loaded));
        return;
      }
      const steps = spec().advance;
      if (steps) x = clamp(x + dir * (steps[tick] ?? 0) * scale * pace());
      if (step.walk) {
        tick = (tick + 1) % spec().frames;
        if (tick === 0) loops += 1;
        if (tick === 0 && (arrived || loops > (step.cycles ?? 0))) next();
        return;
      }
      tick += 1;
      if (spec().hits?.includes(tick)) flash();
      if (tick < spec().frames) return;
      loops += 1;
      if (loops < (step.repeat ?? 1)) {
        tick = spec().start ?? 0;
        return;
      }
      next();
    };

    const asked = () => waveWanted || wanted !== null;
    const answer = () => {
      if (waveWanted) return start('wave');
      const place = wanted!;
      wanted = null;
      start(place);
    };

    const wrapUp = () => {
      const keep = (clip: Clip) => {
        queue = queue.filter((s) => s.clip === clip);
      };
      if (spec().seated) return keep('stand');
      if (step?.scene) return (previous === 'pilot' || previous === 'gaze') && keep('turn-front');
      const scene = queue.findIndex((s) => s.scene);
      if (scene >= 0) queue = queue.slice(0, scene);
      if (step?.walk) arrived = true;
    };

    const greet = () => {
      if (previous === 'wave' && step) return;
      waveWanted = true;
      wrapUp();
    };

    const redirect = (place: Place) => {
      if (!step?.walk || waveWanted) return false;
      const { at, face, scene } = places[place];
      const rest = sum(CLIPS.walk.advance?.slice(tick)) * scale * pace();
      const length = ((at() - x) * dir - rest) / scale;
      if (length <= 0) return false;
      const even = Math.max(0, (length - STOP) / STRIDE);
      for (const cycles of [Math.round(even), Math.floor(even), Math.ceil(even)]) {
        const k = length / (cycles * STRIDE + STOP);
        if (k < PACE[0] || k > PACE[1]) continue;
        step.cycles = loops;
        queue = [
          ...(cycles > 0 ? [{ clip: 'walk', walk: true, pace: k, cycles: cycles - 1 } as Step] : []),
          { clip: 'turn-stop', pace: k },
          ...(face && face !== dir ? [{ clip: 'turn-around', flip: true } as Step] : []),
          ...scene(),
        ];
        if (previous === 'ask' && place !== 'ask') think('idle');
        previous = place;
        wanted = null;
        if (place === 'ask') think('call');
        return true;
      }
      return false;
    };

    const go = (place: Place) => {
      if ((previous === place && queue.some((s) => s.scene)) || !NEEDS[place].every((c) => loaded.has(c))) return;
      if (redirect(place)) return;
      wanted = place;
      wrapUp();
    };
    const holds: [HTMLElement, () => void][] = [
      [seat, () => go('read')],
      [desk, () => go('pilot')],
      [projector, () => go('saber')],
      [terminal, () => go('ask')],
      [hit, greet],
    ];
    let held: HTMLElement | null = null;
    let holdTimer = 0;
    const flag = (el: HTMLElement, name: string, ms: number) => {
      el.removeAttribute(name);
      void el.offsetWidth;
      el.setAttribute(name, '');
      window.setTimeout(() => el.removeAttribute(name), ms);
    };
    const release = () => {
      clearTimeout(holdTimer);
      if (held?.hasAttribute('data-holding')) flag(held, 'data-shake', SHAKE_MS);
      held?.removeAttribute('data-holding');
      held = null;
    };
    const presses = holds.map(([el, act]) => {
      const press = (event: PointerEvent) => {
        if (event.button !== 0 || el.hasAttribute('data-done')) return;
        event.preventDefault();
        release();
        held = el;
        el.setAttribute('data-holding', '');
        holdTimer = window.setTimeout(() => {
          el.removeAttribute('data-holding');
          flag(el, 'data-done', DONE_MS);
          act();
        }, HOLD_MS);
      };
      return [el, press] as const;
    });

    const demo =
      process.env.NODE_ENV !== 'production'
        ? (new URLSearchParams(location.search).get('zannabi') ?? '').split(',').filter((b): b is Behavior => b in NEEDS)
        : [];
    let demoAt = 0;
    const rehearse = (): Behavior | null => {
      const behavior = demo[demoAt++ % demo.length];
      if (!behavior || !NEEDS[behavior].every((c) => loaded.has(c))) return null;
      return behavior;
    };

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let id = 0;
    let last = 0;
    let acc = 0;
    let holoLast = 0;
    let globeLast = 0;
    let droneLast = 0;
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
      if (globeMode !== 'off') {
        globeAcc += Math.min(now - globeLast, 250);
        const rate = 1000 / (globeMode === 'on' ? GLOBE.spinFps : GLOBE.fps);
        while (globeAcc >= rate) {
          globeAcc -= rate;
          advanceGlobe();
        }
      }
      globeLast = now;
      droneAcc += Math.min(now - droneLast, 250);
      droneLast = now;
      while (droneAcc >= 1000 / DRONE.fps) {
        droneAcc -= 1000 / DRONE.fps;
        advanceDrone();
      }
      paintDrone();
      paint();
      paintHolo();
      paintGlobe();
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
      globeSpin.src = '/world/cockpit-globe-spin.webp';
      globeOff.src = '/world/cockpit-globe-off.webp';
      if (still) {
        paint();
        return paintHolo();
      }
      last = holoLast = globeLast = droneLast = performance.now();
      id = requestAnimationFrame(loop);
    });

    for (const [el, press] of presses) {
      el.addEventListener('pointerdown', press);
      el.addEventListener('pointerleave', release);
    }
    window.addEventListener('pointerup', release);
    let noticedAt = -Infinity;
    const approach = (event: PointerEvent) => {
      if (step || waveWanted || wanted || performance.now() - noticedAt < NOTICE.cooldown || !loaded.has('notice')) return;
      const box = body.getBoundingClientRect();
      const dx = event.clientX - (box.left + box.width / 2);
      const dy = event.clientY - (box.top + box.height / 2);
      if (Math.hypot(dx, dy) > box.width * NOTICE.reach || hit.contains(event.target as Node)) return;
      noticedAt = performance.now();
      start('notice');
    };
    window.addEventListener('pointermove', approach);
    window.addEventListener('pointercancel', release);
    return () => {
      alive = false;
      signal(false);
      cancelAnimationFrame(id);
      observer.disconnect();
      release();
      think('idle');
      for (const [el, press] of presses) {
        el.removeEventListener('pointerdown', press);
        el.removeEventListener('pointerleave', release);
      }
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointermove', approach);
      window.removeEventListener('pointercancel', release);
    };
  }, []);

  return (
    <div ref={laneRef} className={styles.lane} aria-hidden>
      <div ref={deskRef} className={styles.desk}>
        <img src="/world/cockpit-desk.webp" alt="" width={DESK_W} height={DESK_H} draggable={false} />
        <Tip>Pilot the ship</Tip>
        {DESK_LIGHTS.map(([x, y, w, h, tone, delay]) => (
          <span
            key={`${x}-${y}`}
            className={styles[tone]}
            style={{ left: `${(x / DESK_W) * 100}%`, top: `${(y / DESK_H) * 100}%`, width: `${(w / DESK_W) * 100}%`, height: `${(h / DESK_H) * 100}%`, animationDelay: `${delay}ms` }}
          />
        ))}
        <canvas ref={globeRef} className={styles.globe} />
      </div>
      <div ref={seatRef} className={styles.seat}>
        <img src="/world/cockpit-stool.webp" alt="" width={141} height={130} draggable={false} />
        <Tip>Read a book</Tip>
      </div>
      <div ref={termRef} className={styles.terminal} data-state="idle">
        <span className={styles.shadow} />
        <span className={styles.drone}>
          <canvas ref={droneRef} className={styles.droneArt} />
          <span className={styles.screen}>
            <span className={styles.idle}>COMPUTING</span>
            <span ref={readoutRef} className={styles.compute} />
            <span className={styles.answer}>42</span>
          </span>
        </span>
        <Tip>Ask Deep Thought</Tip>
      </div>
      <canvas ref={holoRef} className={styles.holo} />
      <div ref={projectorRef} className={styles.projector}>
        <Tip>Saber training</Tip>
      </div>
      <div ref={bodyRef} className={styles.body}>
        <canvas ref={canvasRef} className={styles.sprite} />
        <div ref={hitRef} className={styles.hit}>
          <Tip>Say hi</Tip>
        </div>
      </div>
    </div>
  );
}

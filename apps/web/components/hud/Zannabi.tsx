'use client';

import { useEffect, useRef, useState } from 'react';
import { HUD_EVENT } from '@/components/space/CockpitHud';
import { usable } from '@/lib/image';
import { reducedMotion } from '@/lib/motion';
import { between, count } from '@/lib/random';
import * as L from './cockpit-layout';
import { DESK, DRONE, GLOBE, HOLO } from './cockpit-sheets';
import styles from './Zannabi.module.css';
import {
  type Behavior,
  type Box,
  type Clip,
  type Place,
  type Spec,
  type Step,
  CLIPS,
  FIRST,
  FPS,
  GLIDE_FRAMES,
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
  isPlace,
  pick,
  sum,
} from './zannabi-motion';

const CELL: Box = [0, 0, L.CELL.w, L.CELL.h];
const CANVAS = L.CANVAS;
const MIN_ZOOM = 0.3;
const PLACES = (Object.keys(NEEDS) as Behavior[]).filter(isPlace);

type Fade = { mode: 'off' | 'appear' | 'on' | 'disappear'; tick: number; last: number };
type Clock = { acc: number; at: number };

const fade = (f: Fade, on: boolean) => {
  if (on && (f.mode === 'off' || f.mode === 'disappear')) {
    if (f.mode === 'off') f.tick = f.last;
    f.mode = 'appear';
  } else if (!on && (f.mode === 'on' || f.mode === 'appear')) {
    if (f.mode === 'on') f.tick = 0;
    f.mode = 'disappear';
  }
};

const stepFade = (f: Fade) => {
  if (f.mode === 'appear' && --f.tick <= 0) {
    f.tick = 0;
    f.mode = 'on';
  } else if (f.mode === 'disappear' && ++f.tick >= f.last) {
    f.tick = f.last;
    f.mode = 'off';
  }
};

const run = (clock: Clock, now: number, fps: number, active: boolean, step: () => void) => {
  if (active) {
    clock.acc += Math.min(now - clock.at, 250);
    while (clock.acc >= 1000 / fps) {
      clock.acc -= 1000 / fps;
      step();
    }
  }
  clock.at = now;
};
const HOLD_MS = 900;
const NOTICE = { reach: 1.8, cooldown: 25000 };
const DONE_MS = 1100;
const ANSWER_MS = 4500;
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
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') setGuide(new URLSearchParams(location.search).has('layout'));
  }, []);

  useEffect(() => {
    const lane = laneRef.current!;
    const logo = lane.parentElement!.querySelector<HTMLElement>('[data-logo] img')!;
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

    const R = devicePixelRatio > 1.25 ? 2 : 1;
    const images = new Map<Clip, HTMLImageElement>();
    const loaded = new Set<Clip>();
    const requests = new Map<Clip, Promise<void>>();
    const load = (clip: Clip) => {
      let request = requests.get(clip);
      if (!request) {
        const img = new Image();
        img.src = `/world/zannabi-${clip}${R === 2 ? '@2x' : ''}.webp`;
        images.set(clip, img);
        request = img.decode().then(
          () => void loaded.add(clip),
          () => {},
        );
        requests.set(clip, request);
      }
      return request;
    };
    const has = (behavior: Behavior) => NEEDS[behavior].every((c) => loaded.has(c));
    const ensure = (behavior: Behavior) => Promise.all(NEEDS[behavior].map(load));
    let fetching = false;
    const prefetch = () => {
      const missing = (Object.keys(NEEDS) as Behavior[]).filter((b) => !has(b) && NEEDS[b].some((c) => !requests.has(c)));
      if (fetching || !missing.length) return;
      fetching = true;
      ensure(missing[Math.floor(Math.random() * missing.length)]!).then(() => {
        fetching = false;
      });
    };
    const holoImg = new Image();
    holoImg.src = '/world/hologram-dummy.webp';
    const droneImg = new Image();
    droneImg.src = '/world/cockpit-drone.webp';
    const globeSpin = new Image();
    const globeOff = new Image();

    let zoom = 1;
    let x = L.WALK.from + (L.WALK.to - L.WALK.from) * 0.55;
    let drawn = '';
    let holoDrawn = -1;
    let globeDrawn = '';
    let droneDrawn = -1;
    const measure = () => {
      const hud = getComputedStyle(lane.parentElement!);
      const inner = lane.parentElement!.clientWidth - parseFloat(hud.paddingLeft) - parseFloat(hud.paddingRight);
      zoom = Math.max(MIN_ZOOM, Math.min(1, (inner - Math.max(380, inner * 0.31)) / L.ROOM.w));
      lane.style.setProperty('--zoom', `${zoom}`);
      let resized = false;
      for (const c of [canvas, holo, globe, drone]) {
        const { width, height } = c.getBoundingClientRect();
        const w = Math.round(width * devicePixelRatio);
        const h = Math.round(height * devicePixelRatio);
        if (c.width === w && c.height === h) continue;
        c.width = w;
        c.height = h;
        resized = true;
      }
      if (!resized) return;
      for (const c of [ctx, holoCtx, globeCtx, droneCtx]) c.imageSmoothingQuality = 'high';
      drawn = '';
      holoDrawn = -1;
      globeDrawn = '';
      droneDrawn = -1;
    };
    measure();

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
    const holoFade: Fade = { mode: 'off', tick: HOLO.frames - 1, last: HOLO.frames - 1 };
    const globeFade: Fade = { mode: 'off', tick: 0, last: GLOBE.off - 1 };
    let droneTick = 0;

    const clip = (): Clip => step?.clip ?? 'idle';
    const clamp = (value: number) => Math.min(Math.max(value, L.WALK.from), L.WALK.to);
    const pace = () => step?.pace ?? 1;
    const spec = (): Spec => CLIPS[clip()];

    const paint = () => {
      const current = clip();
      const left = Math.round((x - L.BODY.w / 2) * devicePixelRatio * zoom) / (devicePixelRatio * zoom);
      const key = `${current} ${tick} ${left} ${dir}`;
      if (key === drawn) return;
      drawn = key;
      body.style.transform = `translateX(${left}px) scaleX(${dir})`;
      body.style.setProperty('--dir', `${dir}`);
      const img = images.get(current);
      if (!img || !usable(img)) return;
      const { box = CELL, cols } = spec();
      const [bx, by, bw, bh] = box;
      const k = canvas.width / CANVAS[2];
      const col = cols[R - 1]!;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(
        img,
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
      if (holoFade.tick === holoDrawn || !usable(holoImg)) return;
      holoDrawn = holoFade.tick;
      holoCtx.clearRect(0, 0, holo.width, holo.height);
      holoCtx.drawImage(holoImg, holoFade.tick * HOLO.w, 0, HOLO.w, HOLO.h, 0, 0, holo.width, holo.height);
    };

    const advanceHolo = () => {
      stepFade(holoFade);
      holo.toggleAttribute('data-on', holoFade.mode === 'on');
    };

    const paintGlobe = () => {
      const img = globeFade.mode === 'on' ? globeSpin : globeOff;
      const key = `${globeFade.mode} ${globeFade.tick}`;
      if (key === globeDrawn || (globeFade.mode !== 'off' && !usable(img))) return;
      globeDrawn = key;
      globeCtx.clearRect(0, 0, globe.width, globe.height);
      if (globeFade.mode === 'off') return;
      globeCtx.drawImage(img, globeFade.tick * GLOBE.size, 0, GLOBE.size, GLOBE.size, 0, 0, globe.width, globe.height);
    };

    const paintDrone = () => {
      if (droneTick === droneDrawn || !usable(droneImg)) return;
      droneDrawn = droneTick;
      droneCtx.clearRect(0, 0, drone.width, drone.height);
      droneCtx.drawImage(droneImg, droneTick * DRONE.w, 0, DRONE.w, DRONE.h, 0, 0, drone.width, drone.height);
      const lift = DRONE.dy[droneTick]! / DRONE.crop;
      droneBody.style.translate = `0 ${lift * 100}%`;
      terminal.style.setProperty('--lift', `${lift}`);
    };

    let parked = L.DRONE.y;
    const park = (left: number, bottom: number) => {
      parked = bottom;
      terminal.style.left = `${left}px`;
      terminal.style.bottom = `${bottom}px`;
    };
    const ceiling = () => {
      const room = (lane.getBoundingClientRect().bottom - logo.getBoundingClientRect().bottom) / zoom;
      return room - L.DRONE.h * L.DRONE_REACH - L.LOGO_GAP;
    };
    const roam = () => {
      const top = Math.min(L.ROAM.y[1], ceiling());
      park(between(L.ROAM.x), between([Math.min(L.ROAM.y[0], top), top]));
    };

    const advanceDrone = () => {
      const state = terminal.dataset.state;
      if ((state === 'compute' || state === 'answer') && (droneTick < DRONE.from || droneTick > DRONE.to)) return;
      droneTick = (droneTick + 1) % DRONE.frames;
      if (state === 'idle' && droneTick === DRONE.from && Math.random() < L.ROAM.chance) roam();
    };

    const advanceGlobe = () => {
      if (globeFade.mode === 'on') globeFade.tick = (globeFade.tick + 1) % GLOBE.spin;
      else stepFade(globeFade);
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
      const length = Math.abs(spot - from) / L.PX;
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
      if (Math.abs(spot - x) / L.PX > NEAR) {
        end = spot > x ? 1 : -1;
        steps = leg(x, dir, spot);
        if (!steps && Math.abs(spot - x) / L.PX < SHORT * SHORT_PACE[0]) {
          steps = [{ clip: 'idle', glide: spot - x, stop: GLIDE_FRAMES }];
          end = dir;
        }
      }
      if (!steps) return null;
      return face && face !== end ? [...steps, { clip: 'turn-around', flip: true }] : steps;
    };

    const clearSpot = () => {
      let best: [number, number] = [L.WALK.from, L.WALK.from];
      let edge = L.WALK.from;
      for (const [a, b] of [...[...L.BLOCKS].sort((m, n) => m[0] - n[0]), [L.WALK.to, L.WALK.to] as [number, number]]) {
        if (Math.min(a, L.WALK.to) - edge > best[1] - best[0]) best = [edge, Math.min(a, L.WALK.to)];
        edge = Math.max(edge, b);
      }
      return (best[0] + best[1]) / 2;
    };
    const places: Record<Place, { at: () => number; face?: number; scene: () => Step[] }> = {
      read: {
        at: () => L.SPOTS.read,
        face: 1,
        scene: () => [
          { clip: 'sit', scene: true },
          ...Array.from({ length: count(2, 4) }, (): Step => ({ clip: READS[Math.floor(Math.random() * READS.length)]!, scene: true })),
          { clip: 'stand', scene: true },
        ],
      },
      saber: {
        at: () => L.SPOTS.saber,
        face: 1,
        scene: () => [
          { clip: 'idle', holo: 'appear', scene: true },
          { clip: Math.random() < 0.5 ? 'saber' : 'saber-2', scene: true },
          { clip: 'bow', scene: true },
          { clip: 'idle', holo: 'disappear', scene: true },
        ],
      },
      pilot: {
        at: () => L.SPOTS.pilot,
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
        at: () => L.SPOTS.ask,
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
      else park(L.DECK.x, L.DECK.y);
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
      fade(globeFade, on);
      window.dispatchEvent(new CustomEvent(HUD_EVENT, { detail: on }));
    };

    const wander = (): Step[] | null => {
      const span = L.WALK.to - L.WALK.from;
      const edge = Math.min(STRIDE * L.PX, span / 4);
      for (let tries = 0; tries < 8; tries += 1) {
        const spot = L.WALK.from + edge + Math.random() * (span - edge * 2);
        if (Math.abs(spot - x) < span * MIN_TRIP) continue;
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
      if (step?.holo) fade(holoFade, step.holo === 'appear');
      tick = step?.from ?? (step ? (CLIPS[step.clip].start ?? 0) : 0);
      loops = 0;
      if (step) return;
      if (asked()) return answer();
      prefetch();
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
      if (steps) x = clamp(x + dir * (steps[tick] ?? 0) * L.PX * pace());
      if (step.walk) {
        tick = (tick + 1) % spec().frames;
        if (tick === 0) loops += 1;
        if (tick === 0 && (arrived || loops > (step.cycles ?? 0))) next();
        return;
      }
      if (step.glide) x = clamp(x + step.glide / (step.stop ?? spec().frames));
      tick += 1;
      if (spec().hits?.includes(tick)) flash();
      if (tick < (step.stop ?? spec().frames)) return;
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
      const rest = sum(CLIPS.walk.advance?.slice(tick)) * L.PX * pace();
      const length = ((at() - x) * dir - rest) / L.PX;
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

    const go = (place: Place): void => {
      if (previous === place && queue.some((s) => s.scene)) return;
      if (!has(place)) {
        ensure(place).then(() => alive && has(place) && go(place));
        return;
      }
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
    const lift = () => {
      const poked = held === hit && hit.hasAttribute('data-holding');
      release();
      if (poked && !step && !waveWanted && !wanted && loaded.has('notice')) start('notice');
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
      const behavior = demo[demoAt % demo.length];
      if (!behavior) return null;
      if (!has(behavior)) {
        ensure(behavior);
        return null;
      }
      demoAt += 1;
      return behavior;
    };

    const still = reducedMotion();
    let id = 0;
    const clocks = { body: { acc: 0, at: 0 }, holo: { acc: 0, at: 0 }, globe: { acc: 0, at: 0 }, drone: { acc: 0, at: 0 } };
    const loop = (now: number) => {
      const body = clocks.body;
      body.acc += Math.min(now - body.at, 250);
      body.at = now;
      while (body.acc >= 1000 / (spec().fps ?? FPS)) {
        body.acc -= 1000 / (spec().fps ?? FPS);
        advance(now);
      }
      run(clocks.holo, now, HOLO.fps, holoFade.mode === 'appear' || holoFade.mode === 'disappear', advanceHolo);
      run(clocks.globe, now, globeFade.mode === 'on' ? GLOBE.spinFps : GLOBE.fps, globeFade.mode !== 'off', advanceGlobe);
      run(clocks.drone, now, DRONE.fps, true, advanceDrone);
      paintDrone();
      paint();
      paintHolo();
      paintGlobe();
      id = requestAnimationFrame(loop);
    };
    let alive = true;
    let ready = false;
    const repaint = () => {
      paint();
      paintHolo();
      paintDrone();
    };
    const observer = new ResizeObserver(() => {
      measure();
      if (terminal.dataset.state === 'idle' && parked > ceiling()) roam();
      if (ready && still) repaint();
    });
    observer.observe(lane.parentElement!);
    const quiet = () => {};
    Promise.all([...FIRST.map(load), holoImg.decode().catch(quiet), droneImg.decode().catch(quiet)]).then(async () => {
      if (!alive) return;
      ready = true;
      if (still) return repaint();
      globeSpin.src = '/world/cockpit-globe-spin.webp';
      globeOff.src = '/world/cockpit-globe-off.webp';
      const now = performance.now();
      for (const clock of Object.values(clocks)) clock.at = now;
      id = requestAnimationFrame(loop);
      for (const place of PLACES) if (alive) await ensure(place);
    });

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

    lane.toggleAttribute('data-still', still);
    if (!still) {
      for (const [el, press] of presses) {
        el.addEventListener('pointerdown', press);
        el.addEventListener('pointerleave', release);
      }
      window.addEventListener('pointerup', lift);
      window.addEventListener('pointermove', approach);
      window.addEventListener('pointercancel', release);
    }
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
      window.removeEventListener('pointerup', lift);
      window.removeEventListener('pointermove', approach);
      window.removeEventListener('pointercancel', release);
    };
  }, []);

  return (
    <div ref={laneRef} className={styles.lane} style={{ width: L.ROOM.w, height: L.ROOM.h }} aria-hidden>
      <div ref={deskRef} className={styles.desk} style={L.box(L.DESK)}>
        <img src="/world/cockpit-desk.webp" alt="" width={DESK.w} height={DESK.h} draggable={false} />
        <Tip>Pilot the ship</Tip>
        {DESK.lights.map(([x, y, w, h, tone, delay]) => (
          <span
            key={`${x}-${y}`}
            className={styles[tone]}
            style={{ left: `${(x / DESK.w) * 100}%`, top: `${(y / DESK.h) * 100}%`, width: `${(w / DESK.w) * 100}%`, height: `${(h / DESK.h) * 100}%`, animationDelay: `${delay}ms` }}
          />
        ))}
        <canvas ref={globeRef} className={styles.globe} style={{ left: `${L.GLOBE.x * 100}%`, bottom: `${L.GLOBE.y * 100}%`, width: L.GLOBE.w }} />
      </div>
      <div ref={seatRef} className={styles.seat} style={L.box(L.SEAT)}>
        <img src="/world/cockpit-stool.webp" alt="" width={141} height={130} draggable={false} />
        <Tip>Read a book</Tip>
      </div>
      <div ref={termRef} className={styles.terminal} style={L.box(L.DRONE)} data-state="idle">
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
      <canvas ref={holoRef} className={styles.holo} style={L.box(L.HOLO)} />
      <div ref={projectorRef} className={styles.projector} style={L.box(L.PROJECTOR)}>
        <Tip>Saber training</Tip>
      </div>
      <div ref={bodyRef} className={styles.body} style={{ aspectRatio: `${L.CELL.w} / ${L.CELL.h}` }}>
        <canvas
          ref={canvasRef}
          className={styles.sprite}
          style={{
            left: `${(CANVAS[0] / L.CELL.w) * 100}%`,
            top: `${(CANVAS[1] / L.CELL.h) * 100}%`,
            width: `${(CANVAS[2] / L.CELL.w) * 100}%`,
            height: `${(CANVAS[3] / L.CELL.h) * 100}%`,
          }}
        />
        <div ref={hitRef} className={styles.hit}>
          <Tip>Say hi</Tip>
        </div>
      </div>
      {guide && <LayoutGuide />}
    </div>
  );
}

function LayoutGuide() {
  const rects: [string, L.Rect][] = [
    ['seat', L.SEAT],
    ['desk', L.DESK],
    ['holo', L.HOLO],
    ['projector', L.PROJECTOR],
    ['deck', { ...L.DRONE, ...L.DECK }],
    ['roam', { x: L.ROAM.x[0], y: L.ROAM.y[0], w: L.ROAM.x[1] - L.ROAM.x[0] + L.DRONE.w, h: L.ROAM.y[1] - L.ROAM.y[0] + L.DRONE.h }],
  ];
  return (
    <div className={styles.guide}>
      <span className={styles.walk} style={{ left: L.WALK.from, width: L.WALK.to - L.WALK.from }} />
      {rects.map(([name, rect]) => (
        <span key={name} className={styles.rect} style={L.box(rect)} data-name={name} />
      ))}
      {Object.entries(L.SPOTS).map(([name, at]) => (
        <span key={name} className={styles.spot} style={{ left: at }} data-name={name} />
      ))}
    </div>
  );
}

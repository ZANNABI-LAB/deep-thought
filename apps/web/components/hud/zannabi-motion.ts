export type Box = [x: number, y: number, w: number, h: number];
export type Spec = { frames: number; start?: number; cols: [number, number]; fps?: number; advance?: number[]; box?: Box; seated?: boolean; hits?: number[] };

export const FPS = 14;
const SPECS = {
  idle: { frames: 28, cols: [28, 28], fps: 7 },
  walk: { frames: 14, cols: [14, 14], advance: [0, 6, 7, 8, 10, 6, 12, 3, 7, 8, 11, 8, 6, 9] },
  turn: { frames: 16, cols: [16, 16], advance: [2, 4, 7, 6, 7, 3, 2, 0, 5, 7, 6, 6, 7, 5, 2, 1] },
  'turn-stop': { frames: 8, cols: [8, 8], advance: [12, 13, 0, 0, 0, 0, 0, 0] },
  'turn-around': { frames: 20, cols: [20, 20], fps: 18 },
  wave: { frames: 22, cols: [22, 22] },
  look: { frames: 26, cols: [26, 26] },
  yawn: { frames: 26, cols: [26, 26] },
  doze: { frames: 26, cols: [26, 26] },
  hop: { frames: 26, cols: [26, 26], box: [0, -18, 200, 258] },
  saber: { frames: 26, cols: [26, 20], box: [-60, -60, 393, 314], hits: [5, 14] },
  'saber-2': { frames: 26, cols: [26, 20], box: [-60, -60, 393, 314], hits: [3, 8, 12, 15] },
  sit: { frames: 27, cols: [27, 27], seated: true },
  read: { frames: 27, cols: [27, 27], seated: true },
  'read-nod': { frames: 27, cols: [27, 27], seated: true },
  stand: { frames: 26, cols: [26, 26], seated: true },
  'turn-back': { frames: 17, cols: [17, 17], fps: 16 },
  'turn-front': { frames: 21, cols: [21, 21], fps: 16 },
  breathe: { frames: 28, cols: [28, 28], fps: 7 },
  'look-up': { frames: 26, cols: [26, 26] },
  console: { frames: 26, cols: [26, 26] },
  type: { frames: 25, cols: [25, 25] },
  thumbs: { frames: 23, cols: [23, 23] },
  notice: { frames: 22, cols: [22, 22] },
  music: { frames: 25, cols: [25, 25] },
  dance: { frames: 26, cols: [26, 26], box: [-21, 0, 242, 240] },
  moonjump: { frames: 28, cols: [28, 28], box: [0, -43, 200, 283] },
  stretch: { frames: 26, cols: [26, 26] },
  sitdeck: { frames: 25, cols: [25, 25], box: [0, 0, 200, 243] },
  wobble: { frames: 24, cols: [24, 24] },
  bow: { frames: 23, cols: [23, 23] },
  'console-2': { frames: 26, cols: [26, 26] },
} satisfies Record<string, Spec>;
export type Clip = keyof typeof SPECS;
export const CLIPS: Record<Clip, Spec> = SPECS;
export const WALK_ENTRY = 8;
export const sum = (list: number[] = []) => list.reduce((total, d) => total + d, 0);
const travel = (clip: Clip) => sum(CLIPS[clip].advance);
export const STRIDE = travel('walk');
export const STOP = travel('turn-stop');
export const TRIP = travel('turn') + sum(CLIPS.walk.advance?.slice(WALK_ENTRY)) + STOP;
export const SHORT = travel('turn') + STOP;
export const PACE: [number, number] = [0.7, 1.3];
export const SHORT_PACE: [number, number] = [0.7, 1];
export const NEAR = 4;
export const READS: Clip[] = ['read', 'read-nod'];
export const REST_MS: [number, number] = [3000, 8000];
export const STILL_MS: [number, number] = [1000, 3000];
export const MIN_TRIP = 0.25;
export const IDLE_CUTS = new Set([0, 1, 2, 3, 11, 12, 13, 14, 23, 24, 25, 26, 27]);
export const FIRST: Clip[] = ['idle', 'turn', 'walk', 'turn-stop', 'turn-around', 'wave'];

export type Holo = 'appear' | 'disappear';
export type Step = {
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
  term?: 'compute' | 'answer';
};
const WALKING: Clip[] = ['turn', 'walk', 'turn-stop', 'turn-around'];
const NEEDED = {
  walk: WALKING,
  read: [...WALKING, 'sit', 'read', 'read-nod', 'stand'],
  saber: [...WALKING, 'saber', 'saber-2', 'bow'],
  pilot: [...WALKING, 'turn-back', 'console', 'console-2', 'breathe', 'turn-front'],
  ask: [...WALKING, 'turn-back', 'type', 'turn-front', 'thumbs'],
  gaze: [...WALKING, 'turn-back', 'breathe', 'look-up', 'turn-front'],
  look: ['look'],
  yawn: ['yawn'],
  doze: ['doze'],
  hop: ['hop'],
  wave: ['wave'],
  notice: ['notice'],
  music: ['music'],
  dance: ['dance'],
  moonjump: ['moonjump'],
  stretch: ['stretch'],
  sitdeck: ['sitdeck'],
  wobble: ['wobble'],
} satisfies Record<string, Clip[]>;
export type Behavior = keyof typeof NEEDED;
export const NEEDS: Record<Behavior, Clip[]> = NEEDED;
const PLACES = ['read', 'saber', 'pilot', 'ask', 'gaze'] as const;
export type Place = (typeof PLACES)[number];
export const isPlace = (b: Behavior): b is Place => (PLACES as readonly Behavior[]).includes(b);

export const between = ([min, max]: [number, number]) => min + Math.random() * (max - min);
export const count = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));

const WEIGHTS: [Behavior, number][] = [
  ['walk', 40],
  ['read', 10],
  ['saber', 8],
  ['pilot', 10],
  ['ask', 6],
  ['look', 12],
  ['gaze', 12],
  ['yawn', 8],
  ['doze', 6],
  ['hop', 6],
  ['music', 6],
  ['dance', 5],
  ['moonjump', 5],
  ['stretch', 5],
  ['sitdeck', 4],
  ['wobble', 3],
];

export function pick(previous: Behavior | null, loaded: Set<Clip>): Behavior {
  const options = WEIGHTS.filter(([b]) => (b === 'walk' || b !== previous) && NEEDS[b].every((c) => loaded.has(c)));
  let roll = Math.random() * options.reduce((sum, [, w]) => sum + w, 0);
  for (const [behavior, weight] of options) {
    roll -= weight;
    if (roll < 0) return behavior;
  }
  return 'walk';
}

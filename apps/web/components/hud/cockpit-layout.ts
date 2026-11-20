export type Rect = { x: number; y: number; w: number; h: number };

export const ROOM = { w: 784.3, h: 252 };
export const CELL = { w: 200, h: 240 };
export const PX = ROOM.h / CELL.h;
export const BODY = { w: CELL.w * PX, half: 64 * PX };
export const CANVAS: [x: number, y: number, w: number, h: number] = [-60, -60, 420, 314];

const fit = (x: number, y: number, h: number, ratio: number): Rect => ({ x, y, w: h * ratio, h });

export const SEAT = fit(153.49, 6.33, 65.07, 141 / 130);
export const DESK = fit(262.46, 9.17, 153.39, 554 / 307);
export const HOLO = fit(629.0, -4.31, 231.39, 296 / 441);
export const PROJECTOR: Rect = { x: 666.0, y: -4.31, w: 94.93, h: 46.19 };
export const DRONE = fit(375.71, 302.4, 105.39, 262 / 361);
export const GLOBE = { x: 0.327, y: 1.13, w: 73.31 };

export const DECK = { x: 568.13, y: 43.97 };
export const ROAM = { x: [219.92, 531.49] as [number, number], y: [238.27, 366.53] as [number, number], chance: 0.7 };
export const LOGO_GAP = 25.2;
export const DRONE_REACH = 1.1;

export const WALK = { from: BODY.half, to: HOLO.x - BODY.half };

export const SPOTS = {
  read: SEAT.x + SEAT.w / 2 + 22 * PX,
  pilot: DESK.x + DESK.w * 0.3,
  ask: DECK.x - 17 * PX,
  saber: HOLO.x + (21 - 250) * PX + BODY.w / 2,
};

export const BLOCKS: [number, number][] = [SEAT, DESK, HOLO, { ...DRONE, x: DECK.x }].map((r) => [r.x - BODY.half, r.x + r.w + BODY.half]);

export const box = (r: Rect) => ({ left: `${r.x}px`, bottom: `${r.y}px`, width: `${r.w}px`, height: `${r.h}px` });

export const HOLO = { frames: 24, fps: 14, w: 296, h: 441 };

export const DRONE = {
  w: 200,
  h: 304,
  frames: 49,
  fps: 21,
  crop: 491,
  from: 11,
  to: 36,
  dy: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 3, 23, 45, 63, 68, 71, 71, 63, 35, 9, -15, -24, -31, -35, -36, -37, -38, -39, -39, -39, -35, -30, -19, -12, -4, -1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

export const GLOBE = { size: 176, spin: 24, off: 25, fps: 21, spinFps: 10.5 };

export const DESK = {
  w: 554,
  h: 307,
  lights: [
    [65, 46, 22, 14, 'violet', 300],
    [249, 118, 21, 14, 'amber', 0],
    [281, 118, 20, 14, 'amber', 1200],
  ] as [number, number, number, number, 'amber' | 'violet', number][],
};

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*/<>';

export type Scramble = { settle: number; spread: number; blank?: boolean };

export const scramble = (text: string, elapsed: number, { settle, spread, blank }: Scramble) =>
  [...text]
    .map((char, i) => {
      if (char === ' ' || elapsed >= settle + i * spread) return char;
      if (blank && elapsed < i * spread * 0.5) return ' ';
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    })
    .join('');

export const settled = (text: string, elapsed: number, { settle, spread }: Scramble) => elapsed >= settle + text.length * spread;

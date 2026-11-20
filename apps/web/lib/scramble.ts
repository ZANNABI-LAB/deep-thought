import { useEffect, useState } from 'react';
import { reducedMotion } from './motion';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*/<>';

type Scramble = { settle: number; spread: number; blank?: boolean; delay?: number; step?: number };

export const scramble = (text: string, elapsed: number, { settle, spread, blank }: Scramble) =>
  [...text]
    .map((char, i) => {
      if (char === ' ' || elapsed >= settle + i * spread) return char;
      if (blank && elapsed < i * spread * 0.5) return ' ';
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    })
    .join('');

export const settled = (text: string, elapsed: number, { settle, spread }: Scramble) => elapsed >= settle + text.length * spread;

export function useScramble(text: string, options: Scramble, run: unknown) {
  const [line, setLine] = useState(text);
  const { settle, spread, blank, delay = 0, step = 40 } = options;

  useEffect(() => {
    if (!run || reducedMotion()) return setLine(text);
    const type = { settle, spread, blank };
    const begin = performance.now() + delay;
    let id = 0;
    let last = 0;
    const frame = (now: number) => {
      const elapsed = now - begin;
      const done = settled(text, elapsed, type);
      if (now - last >= step || done) {
        last = now;
        setLine(elapsed < 0 ? '' : done ? text : scramble(text, elapsed, type));
      }
      if (!done) id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [run, text, settle, spread, blank, delay, step]);

  return line;
}

'use client';

import { useEffect, useState } from 'react';
import styles from './CockpitHud.module.css';

export const HUD_EVENT = 'cockpit:hud';

const TARGET = { x: 930, y: 140, r: 11 };
const TEXT = { x: 975, y: 118 };
const READOUT = 'TARGET: KEPLER-442b · 4.2 AU';
const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*/<>';
const START_MS = 550;
const SETTLE_MS = 420;
const SPREAD_MS = 24;

const scramble = (text: string, elapsed: number) =>
  [...text]
    .map((char, i) => {
      if (char === ' ' || elapsed >= SETTLE_MS + i * SPREAD_MS) return char;
      if (elapsed < i * SPREAD_MS * 0.5) return ' ';
      return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
    })
    .join('');

export function CockpitHud() {
  const [on, setOn] = useState(false);
  const [line, setLine] = useState('');

  useEffect(() => {
    const toggle = (event: Event) => setOn((event as CustomEvent<boolean>).detail);
    window.addEventListener(HUD_EVENT, toggle);
    return () => window.removeEventListener(HUD_EVENT, toggle);
  }, []);

  useEffect(() => {
    if (!on) return setLine('');
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return setLine(READOUT);
    const begin = performance.now();
    let id = 0;
    let last = 0;
    const frame = (now: number) => {
      const elapsed = now - begin - START_MS;
      const done = elapsed >= SETTLE_MS + READOUT.length * SPREAD_MS;
      if (now - last >= 45 || done) {
        last = now;
        setLine(elapsed < 0 ? '' : scramble(READOUT, elapsed));
      }
      if (!done) id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [on]);

  const { x, y, r } = TARGET;
  const c = 5;
  return (
    <svg className={styles.hud} data-on={on || undefined} viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g className={styles.reticle} style={{ transformOrigin: `${x}px ${y}px` }}>
        <path
          d={`M${x - r} ${y - r + c}V${y - r}H${x - r + c}M${x + r - c} ${y - r}H${x + r}V${y - r + c}M${x - r} ${y + r - c}V${y + r}H${x - r + c}M${x + r - c} ${y + r}H${x + r}V${y + r - c}M${x - 3} ${y}H${x + 3}M${x} ${y - 3}V${y + 3}`}
          className={styles.line}
        />
      </g>
      <polyline points={`${x + r},${y - r + 2} ${x + r + 18},${TEXT.y - 3} ${TEXT.x - 6},${TEXT.y - 3}`} pathLength={1} className={`${styles.line} ${styles.leader}`} />
      <text x={TEXT.x} y={TEXT.y} className={styles.text}>
        {line}
      </text>
    </svg>
  );
}

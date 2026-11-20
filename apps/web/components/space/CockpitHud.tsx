'use client';

import { useEffect, useState } from 'react';
import { useScramble } from '@/lib/scramble';
import styles from './CockpitHud.module.css';

export const HUD_EVENT = 'cockpit:hud';

const TARGET = { x: 930, y: 140, r: 11 };
const TEXT = { x: 975, y: 118 };
const READOUT = 'TARGET: KEPLER-442b · 4.2 AU';
const TYPE = { settle: 420, spread: 24, blank: true, delay: 550, step: 45 };

export function CockpitHud() {
  const [on, setOn] = useState(false);
  const line = useScramble(READOUT, TYPE, on);

  useEffect(() => {
    const toggle = (event: Event) => setOn((event as CustomEvent<boolean>).detail);
    window.addEventListener(HUD_EVENT, toggle);
    return () => window.removeEventListener(HUD_EVENT, toggle);
  }, []);

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
        {on ? line : ''}
      </text>
    </svg>
  );
}

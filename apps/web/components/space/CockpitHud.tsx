'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './CockpitHud.module.css';

export const HUD_EVENT = 'cockpit:hud';

const PLANET = { x: 1035, y: 78, r: 186 };
const TICKS = Array.from({ length: 24 }, (_, i) => (i * 360) / 24);
const READOUT = ['TARGET  KEPLER-442b', 'DIST    1,206.4 LY', 'VECTOR  041.7° / -12.3°', 'STATUS  LOCKED'];

export function CockpitHud() {
  const [on, setOn] = useState(false);
  const [lines, setLines] = useState(0);
  const timer = useRef(0);

  useEffect(() => {
    const toggle = (event: Event) => setOn((event as CustomEvent<boolean>).detail);
    window.addEventListener(HUD_EVENT, toggle);
    return () => window.removeEventListener(HUD_EVENT, toggle);
  }, []);

  useEffect(() => {
    clearInterval(timer.current);
    if (!on) return setLines(0);
    timer.current = window.setInterval(() => setLines((n) => (n < READOUT.length ? n + 1 : n)), 380);
    return () => clearInterval(timer.current);
  }, [on]);

  return (
    <svg className={styles.hud} data-on={on || undefined} viewBox="0 0 1280 720" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <g className={styles.reticle} style={{ transformOrigin: `${PLANET.x}px ${PLANET.y}px` }}>
        <circle cx={PLANET.x} cy={PLANET.y} r={PLANET.r} className={styles.ring} />
        <g className={styles.spin} style={{ transformOrigin: `${PLANET.x}px ${PLANET.y}px` }}>
          <circle cx={PLANET.x} cy={PLANET.y} r={PLANET.r + 14} className={styles.dash} />
        </g>
        {TICKS.map((deg) => (
          <line
            key={deg}
            x1={PLANET.x}
            y1={PLANET.y - PLANET.r - 4}
            x2={PLANET.x}
            y2={PLANET.y - PLANET.r - (deg % 90 === 0 ? 22 : 10)}
            transform={`rotate(${deg} ${PLANET.x} ${PLANET.y})`}
            className={styles.tick}
          />
        ))}
        <path d={`M${PLANET.x - 40} ${PLANET.y}h-30M${PLANET.x + 40} ${PLANET.y}h30M${PLANET.x} ${PLANET.y + 40}v30`} className={styles.cross} />
      </g>
      <g className={styles.panel}>
        <path d="M640 236h-14v14M842 236h14v14M640 352h-14v-14M842 352h14v-14" className={styles.corner} />
        {READOUT.slice(0, lines).map((text, i) => (
          <text key={text} x={648} y={262 + i * 24} className={styles.text}>
            {text}
          </text>
        ))}
      </g>
      <rect x="0" width="1280" height="3" className={styles.scan} />
    </svg>
  );
}

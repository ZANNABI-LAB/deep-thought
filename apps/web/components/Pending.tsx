'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { scramble, settled } from '@/lib/scramble';
import hud from './Hud.module.css';
import { PageShell } from './PageShell';
import styles from './Pending.module.css';

const STATUS = 'COMING SOON';
const TYPE = { settle: 360, spread: 55, blank: true };
const STEP_MS = 40;

export function Pending({ current, area, message }: { current: string; area: string; message: string }) {
  const [line, setLine] = useState(STATUS);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const begin = performance.now();
    let id = 0;
    let last = 0;
    const frame = (now: number) => {
      const elapsed = now - begin;
      const done = settled(STATUS, elapsed, TYPE);
      if (now - last >= STEP_MS || done) {
        last = now;
        setLine(done ? STATUS : scramble(STATUS, elapsed, TYPE));
      }
      if (!done) id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <PageShell current={current}>
      <p className={hud.eyebrow}>&gt; {area}</p>
      <h1 className={hud.heading} aria-label={STATUS}>
        <span aria-hidden>{line}</span>
      </h1>
      <p className={hud.lede}>{message}</p>
      <Link href="/" className={`${hud.link} ${styles.back}`}>
        ← BACK TO COCKPIT
      </Link>
    </PageShell>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { scramble, settled } from '@/lib/scramble';
import styles from './Pending.module.css';

const TYPE = { settle: 360, spread: 55, blank: true };
const STEP_MS = 40;

export function Pending({ area, status, message }: { area: string; status: 'COMING SOON' | 'ACCESS DENIED'; message: string }) {
  const [line, setLine] = useState<string>(status);

  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const begin = performance.now();
    let id = 0;
    let last = 0;
    const frame = (now: number) => {
      const elapsed = now - begin;
      const done = settled(status, elapsed, TYPE);
      if (now - last >= STEP_MS || done) {
        last = now;
        setLine(done ? status : scramble(status, elapsed, TYPE));
      }
      if (!done) id = requestAnimationFrame(frame);
    };
    id = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(id);
  }, [status]);

  return (
    <main className={styles.page} data-status={status === 'ACCESS DENIED' ? 'denied' : 'soon'}>
      <p className={styles.area}>&gt; {area}</p>
      <h1 className={styles.status} aria-label={status}>
        <span aria-hidden>{line}</span>
      </h1>
      <p className={styles.message}>{message}</p>
      <Link href="/" className={styles.back}>
        ← BACK TO COCKPIT
      </Link>
    </main>
  );
}

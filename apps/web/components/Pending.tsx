'use client';

import Link from 'next/link';
import { useScramble } from '@/lib/scramble';
import hud from './Hud.module.css';
import { PageShell } from './PageShell';
import styles from './Pending.module.css';

const STATUS = 'COMING SOON';
const TYPE = { settle: 360, spread: 55, blank: true };

export function Pending({ current, area, message }: { current: string; area: string; message: string }) {
  const line = useScramble(STATUS, TYPE, true);

  return (
    <PageShell current={current}>
      <p className={hud.eyebrow}>&gt; Deep Thought / {area}</p>
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

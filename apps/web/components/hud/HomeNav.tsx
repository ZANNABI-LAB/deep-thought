'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { scramble, settled } from '@/lib/scramble';
import styles from './HomeNav.module.css';

type Item = { label: string; href?: string; locked?: boolean };

const ITEMS: Item[] = [
  { label: 'Home', href: '/' },
  { label: 'Writing', href: '/writing' },
  { label: 'Portfolio' },
  { label: 'Lab', locked: true },
  { label: 'Arcade' },
  { label: 'About me' },
];

const HOVER = { settle: 160, spread: 45 };
const STEP_MS = 40;

function Label({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const running = useRef(0);

  const play = () => {
    const el = ref.current;
    if (!el || running.current || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const begin = performance.now();
    let last = 0;
    const frame = (now: number) => {
      const elapsed = now - begin;
      const done = settled(text, elapsed, HOVER);
      if (now - last >= STEP_MS || done) {
        last = now;
        el.textContent = done ? text : scramble(text, elapsed, HOVER);
      }
      running.current = done ? 0 : requestAnimationFrame(frame);
    };
    running.current = requestAnimationFrame(frame);
  };

  return (
    <span ref={ref} onPointerEnter={play} onFocus={play}>
      {text}
    </span>
  );
}

export function HomeNav({ current = '/' }: { current?: string }) {
  return (
    <nav className={styles.nav} aria-label="Main">
      <ul className={styles.list}>
        {ITEMS.map(({ label, href, locked }) =>
          href ? (
            <li key={label}>
              <Link href={href} className={styles.item} aria-label={label} aria-current={href === current ? 'page' : undefined}>
                <Label text={label} />
              </Link>
            </li>
          ) : (
            <li key={label}>
              <span className={styles.item} aria-disabled="true" title={locked ? '잠겨 있어요' : '준비 중이에요'}>
                <Label text={label} />
                {locked && (
                  <svg className={styles.lock} viewBox="0 0 12 14" aria-hidden>
                    <path d="M3 6V4a3 3 0 0 1 6 0v2M2 6h8v7H2zM6 9v2" />
                  </svg>
                )}
              </span>
            </li>
          ),
        )}
      </ul>
    </nav>
  );
}

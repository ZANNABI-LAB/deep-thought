'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useScramble } from '@/lib/scramble';
import styles from './HomeNav.module.css';

type Item = { label: string; href: string };

const ITEMS: Item[] = [
  { label: 'Home', href: '/' },
  { label: 'Writing', href: '/writing' },
  { label: 'Portfolio', href: '/portfolio' },
  { label: 'Arcade', href: '/arcade' },
  { label: 'About me', href: '/about' },
];

const HOVER = { settle: 160, spread: 45 };

function Label({ text }: { text: string }) {
  const [hovered, setHovered] = useState(0);
  const line = useScramble(text, HOVER, hovered);
  const play = () => setHovered((n) => n + 1);

  return (
    <span onPointerEnter={play} onFocus={play}>
      {line}
    </span>
  );
}

export function HomeNav({ current, className }: { current: string; className?: string }) {
  return (
    <nav className={className ? `${styles.nav} ${className}` : styles.nav} aria-label="Main">
      <ul className={styles.list}>
        {ITEMS.map(({ label, href }) => (
          <li key={label}>
            <Link href={href} className={styles.item} aria-label={label} aria-current={href === current ? 'page' : undefined}>
              <Label text={label} />
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

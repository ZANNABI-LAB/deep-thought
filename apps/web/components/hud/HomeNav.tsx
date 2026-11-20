import Link from 'next/link';
import frame from './Frame.module.css';
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

export function HomeNav({ current = '/' }: { current?: string }) {
  return (
    <nav className={`${frame.frame} ${frame.pill} ${styles.nav}`} aria-label="Main">
      <ul className={styles.list}>
        {ITEMS.map(({ label, href, locked }) => (
          <li key={label}>
            {href ? (
              <Link href={href} className={styles.item} aria-current={href === current ? 'page' : undefined}>
                {label}
              </Link>
            ) : (
              <span className={styles.item} aria-disabled="true" title={locked ? '잠겨 있어요' : '준비 중이에요'}>
                {label}
                {locked && (
                  <svg className={styles.lock} viewBox="0 0 12 14" aria-hidden>
                    <path d="M3 6V4a3 3 0 0 1 6 0v2M2 6h8v7H2zM6 9v2" />
                  </svg>
                )}
              </span>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

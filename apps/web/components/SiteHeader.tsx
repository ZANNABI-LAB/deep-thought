import Link from 'next/link';
import styles from './SiteHeader.module.css';

const NAV = [
  { href: '/', label: 'Explore' },
  { href: '/writing', label: 'Writing' },
] as const;

export type NavHref = (typeof NAV)[number]['href'];

export function SiteHeader({ current }: { current: NavHref }) {
  return (
    <header className={styles.header}>
      <Link href="/" className={styles.brand} aria-label="Deep Thought 홈">
        <img className={styles.mark} src="/brand/zannabi-mark.svg" alt="" width={60} height={60} />
        <span className={styles.name}>Deep Thought</span>
      </Link>
      <nav className={styles.nav} aria-label="주 메뉴">
        {NAV.map(({ href, label }) => (
          <Link key={href} href={href} aria-current={href === current ? 'page' : undefined}>
            {label}
          </Link>
        ))}
      </nav>
    </header>
  );
}

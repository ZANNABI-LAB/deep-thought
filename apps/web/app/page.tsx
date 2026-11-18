import type { Metadata } from 'next';
import Link from 'next/link';
import { SpaceScene } from '@/components/space/SpaceScene';
import { RSS_ALTERNATE, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  alternates: { canonical: '/', types: RSS_ALTERNATE },
};

export default function Home() {
  return (
    <main className={styles.home}>
      <SpaceScene />
      <div className={styles.hidden}>
        <h1>{SITE_NAME}</h1>
        <p>{SITE_DESCRIPTION}</p>
        <Link href="/writing">Writing</Link>
      </div>
    </main>
  );
}

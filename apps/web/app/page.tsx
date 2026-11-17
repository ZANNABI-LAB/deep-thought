import type { Metadata } from 'next';
import Link from 'next/link';
import { SpaceBackdrop } from '@/components/space/SpaceBackdrop';
import { ShootingStars } from '@/components/space/ShootingStars';
import { WindowFrame } from '@/components/space/WindowFrame';
import { RSS_ALTERNATE, SITE_DESCRIPTION, SITE_NAME } from '@/lib/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  alternates: { canonical: '/', types: RSS_ALTERNATE },
};

/** 새 홈(우주선 창 + HUD)을 만드는 동안은 창밖 우주 배경만 둔다. 글자는 검색·낭독기용 */
export default function Home() {
  return (
    <main className={styles.home}>
      <SpaceBackdrop />
      <ShootingStars />
      <WindowFrame />
      <div className={styles.hidden}>
        <h1>{SITE_NAME}</h1>
        <p>{SITE_DESCRIPTION}</p>
        <Link href="/writing">Writing</Link>
      </div>
    </main>
  );
}

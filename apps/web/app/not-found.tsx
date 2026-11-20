import Link from 'next/link';
import hud from '@/components/Hud.module.css';
import { PageShell } from '@/components/PageShell';
import styles from './not-found.module.css';

export default function NotFound() {
  return (
    <PageShell current="">
      <p className={hud.eyebrow}>&gt; Signal lost // 404</p>
      <h1 className={styles.title}>이 좌표에는 아무것도 없어요.</h1>
      <p className={hud.lede}>찾는 페이지가 우주 저편으로 떠내려갔거나, 처음부터 없었던 곳이에요.</p>
      <Link href="/" className={`${hud.link} ${styles.back}`}>
        ← Back to cockpit
      </Link>
    </PageShell>
  );
}

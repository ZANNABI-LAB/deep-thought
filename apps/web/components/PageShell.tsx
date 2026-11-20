import { HomeNav } from '@/components/hud/HomeNav';
import styles from './PageShell.module.css';

export function PageShell({ current, children }: { current: string; children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <HomeNav current={current} className={styles.nav} />
      <main className={styles.main}>{children}</main>
    </div>
  );
}

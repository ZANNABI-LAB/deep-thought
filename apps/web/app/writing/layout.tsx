import { SiteHeader } from '@/components/SiteHeader';
import styles from './layout.module.css';

export default function WritingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.shell}>
      <SiteHeader current="/writing" />
      <main className={styles.main}>{children}</main>
    </div>
  );
}

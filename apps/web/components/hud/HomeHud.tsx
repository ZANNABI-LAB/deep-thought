import { HomeLogo } from '@/components/space/HomeLogo';
import styles from './HomeHud.module.css';

export function HomeHud({ shown }: { shown: boolean }) {
  return (
    <div className={styles.hud}>
      <div className={styles.logo}>
        <HomeLogo shown={shown} />
      </div>
    </div>
  );
}

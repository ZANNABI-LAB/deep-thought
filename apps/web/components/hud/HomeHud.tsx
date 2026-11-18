import { HomeLogo } from '@/components/space/HomeLogo';
import styles from './HomeHud.module.css';

export function HomeHud() {
  return (
    <div className={styles.hud}>
      <div className={styles.logo}>
        <HomeLogo />
      </div>
    </div>
  );
}

import { HomeLogo } from '@/components/space/HomeLogo';
import styles from './HomeHud.module.css';
import { Zannabi } from './Zannabi';

export function HomeHud() {
  return (
    <div className={styles.hud}>
      <div className={styles.logo} data-logo>
        <HomeLogo />
      </div>
      <Zannabi />
    </div>
  );
}

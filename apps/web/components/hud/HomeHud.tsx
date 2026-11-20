import { HomeLogo } from '@/components/space/HomeLogo';
import { HomeNav } from './HomeNav';
import styles from './HomeHud.module.css';
import { Zannabi } from './Zannabi';

export function HomeHud() {
  return (
    <div className={styles.hud}>
      <div className={styles.logo} data-logo>
        <div className={styles.brand}>
          <HomeNav />
          <HomeLogo />
        </div>
      </div>
      <Zannabi />
    </div>
  );
}

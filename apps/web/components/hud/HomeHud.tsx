import { HomeLogo } from '@/components/space/HomeLogo';
import { HomeNav } from './HomeNav';
import styles from './HomeHud.module.css';
import { Zannabi } from './Zannabi';

export function HomeHud() {
  return (
    <div className={styles.hud}>
      <div className={styles.logo} data-logo>
        <div className={styles.brand}>
          <HomeNav current="/" className={styles.nav} />
          <HomeLogo />
        </div>
      </div>
      <Zannabi />
    </div>
  );
}

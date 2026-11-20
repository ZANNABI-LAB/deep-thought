import { HomeLogo } from '@/components/space/HomeLogo';
import { HomeNav } from './HomeNav';
import styles from './HomeHud.module.css';
import { Zannabi } from './Zannabi';

export function HomeHud() {
  return (
    <div className={styles.hud}>
      <HomeNav />
      <div className={styles.logo} data-logo>
        <HomeLogo />
      </div>
      <Zannabi />
    </div>
  );
}

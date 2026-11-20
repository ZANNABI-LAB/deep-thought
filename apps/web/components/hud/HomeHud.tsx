import { HomeLogo } from '@/components/space/HomeLogo';
import { SINCE, SITE_NAME } from '@/lib/site';
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
      <p className={styles.copyright}>
        <span className={styles.mark}>©</span> {SINCE} {SITE_NAME}. All rights reserved.
      </p>
    </div>
  );
}

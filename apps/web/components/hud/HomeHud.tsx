import { HomeLogo } from '@/components/space/HomeLogo';
import { AskCard, type PostIndex } from './AskCard';
import { HomeNav } from './HomeNav';
import styles from './HomeHud.module.css';
import { Zannabi } from './Zannabi';

export function HomeHud({ posts }: { posts: PostIndex[] }) {
  return (
    <div className={styles.hud}>
      <div className={styles.logo} data-logo>
        <div className={styles.brand}>
          <HomeNav />
          <HomeLogo />
        </div>
      </div>
      <div className={styles.panel}>
        <AskCard posts={posts} />
      </div>
      <Zannabi />
    </div>
  );
}

import { SiteHeader } from '@/components/SiteHeader';
import { Hero } from '@/components/home/Hero';
import { GodotStage } from '@/components/world/GodotStage';
import styles from './page.module.css';

/** 섬은 히어로(data-safe="left")와 패널(data-safe="right") 사이에 맞춰진다 (GodotStage) */
export default function Home() {
  return (
    <div className={styles.home}>
      <GodotStage />
      <div className={styles.ui}>
        <SiteHeader current="/" />
        <Hero />
        <aside className={styles.panel} data-safe="right" />
      </div>
    </div>
  );
}

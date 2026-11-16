import type { Metadata } from 'next';
import { SiteHeader } from '@/components/SiteHeader';
import { AskPanel } from '@/components/home/AskPanel';
import { Hero } from '@/components/home/Hero';
import { RSS_ALTERNATE } from '@/lib/site';
import styles from './page.module.css';

export const metadata: Metadata = {
  alternates: { canonical: '/', types: RSS_ALTERNATE },
};

/** 월드는 루트 레이아웃의 WorldHost가 띄운다. 섬은 히어로(data-safe="left")와 패널(data-safe="right") 사이에 맞춰진다 */
export default function Home() {
  return (
    <div className={styles.home}>
      <div className={styles.ui}>
        <SiteHeader current="/" />
        <Hero />
        <aside className={styles.panel} data-safe="right">
          <AskPanel />
        </aside>
      </div>
    </div>
  );
}

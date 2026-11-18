'use client';

import { useLayoutEffect, useRef } from 'react';
import styles from './HomeLogo.module.css';

type Rect = readonly [x: number, y: number, w: number, h: number];

const SIZE = { w: 420, h: 202 };
const SPARKLES_SRC = '/brand/home-logo-sparkles.png';
const PLANET_SRC = '/brand/home-logo-planet.png';
const DIAMONDS = [
  { rect: [61, 25, 7, 10], period: 3200, delay: 0 },
  { rect: [353, 25, 7, 10], period: 3200, delay: 1600 },
] as const;
const SPARKLES = [
  { rect: [81, 57, 14, 15], period: 2600, delay: 400 },
  { rect: [94, 78, 7, 7], period: 3800, delay: 1200 },
  { rect: [37, 141, 14, 14], period: 4400, delay: 2100 },
  { rect: [368, 81, 15, 15], period: 3000, delay: 900 },
  { rect: [319, 64, 6, 7], period: 2200, delay: 1800 },
] as const;
const PLANET: Rect = [316, 61, 47, 28];

const dots = (n: number) => `calc(var(--logo-px) * ${n})`;

function cutout(src: string, [x, y, w, h]: Rect): React.CSSProperties {
  return {
    width: dots(w),
    height: dots(h),
    backgroundImage: `url(${src})`,
    backgroundSize: `${dots(SIZE.w)} ${dots(SIZE.h)}`,
    backgroundPosition: `${dots(-x)} ${dots(-y)}`,
  };
}

const placed = (src: string, rect: Rect) => ({ ...cutout(src, rect), left: dots(rect[0]), top: dots(rect[1]) });

const twinkle = (period: number, delay: number) => ({ animationDuration: `${period}ms`, animationDelay: `${delay}ms` });

function Diamond({ index }: { index: 0 | 1 }) {
  const { rect, period, delay } = DIAMONDS[index];
  return <span className={`${styles.sparkle} ${styles.diamond}`} style={{ ...cutout(SPARKLES_SRC, rect), ...twinkle(period, delay) }} />;
}

export function HomeLogo({ shown }: { shown: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  // 가운데 정렬로 생긴 소수점 위치에서는 도트가 흐려져서 기기 픽셀 경계에 맞춘다
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el?.parentElement) return;
    const align = () => {
      const dpr = devicePixelRatio;
      el.style.translate = '';
      const { left, top } = el.getBoundingClientRect();
      el.style.translate = `${Math.round(left * dpr) / dpr - left}px ${Math.round(top * dpr) / dpr - top}px`;
    };
    const observer = new ResizeObserver(align);
    observer.observe(el.parentElement);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={styles.art} data-shown={shown || undefined}>
      <img className={styles.base} src="/brand/home-logo.png" width={SIZE.w} height={SIZE.h} alt="Deep Thought" />
      <p className={styles.kicker}>
        <Diamond index={0} />
        <span className={styles.kickerText}>A little universe of ideas</span>
        <Diamond index={1} />
      </p>
      <p className={styles.tagline}>Still computing the answer.</p>
      {SPARKLES.map(({ rect, period, delay }) => (
        <span key={rect.join()} className={styles.sparkle} style={{ ...placed(SPARKLES_SRC, rect), ...twinkle(period, delay) }} />
      ))}
      <span className={styles.planet} style={placed(PLANET_SRC, PLANET)} />
    </div>
  );
}

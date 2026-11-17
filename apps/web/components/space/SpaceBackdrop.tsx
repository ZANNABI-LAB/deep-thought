'use client';

import { useEffect, useRef } from 'react';
import styles from './SpaceBackdrop.module.css';

const POSTER = '/world/space-loop-poster.webp';
const VIDEO = '/world/space-loop-4k.mp4';

/** 창밖 우주. 정지 그림을 먼저 깔고, 움직임을 허용한 데스크톱에서만 반복 영상을 받아 재생한다 */
export function SpaceBackdrop() {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const still = matchMedia('(prefers-reduced-motion: reduce), (max-width: 768px)');
    if (still.matches) return;
    video.src = VIDEO;
    video.play().catch(() => {}); // 자동 재생이 막히면 포스터가 그대로 남는다
  }, []);

  return (
    <div className={styles.backdrop} style={{ backgroundImage: `url(${POSTER})` }} aria-hidden="true">
      <video ref={videoRef} className={styles.video} poster={POSTER} muted loop playsInline preload="none" />
    </div>
  );
}

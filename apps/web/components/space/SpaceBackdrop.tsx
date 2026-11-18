'use client';

import { useEffect, useRef } from 'react';
import styles from './SpaceBackdrop.module.css';

export const POSTER = '/world/space-loop-poster.webp';
const VIDEO = '/world/space-loop-4k.mp4';

// 정지 그림을 먼저 깔고, 움직임을 허용한 데스크톱에서만 반복 영상을 재생한다
export function SpaceBackdrop({ onReady }: { onReady?: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let alive = true;
    const poster = new Image();
    poster.src = POSTER;
    poster
      .decode()
      .catch(() => {})
      .then(() => alive && onReadyRef.current?.());

    const video = videoRef.current;
    const still = matchMedia('(prefers-reduced-motion: reduce), (max-width: 768px)');
    if (video && !still.matches) {
      video.src = VIDEO;
      video.play().catch(() => {}); // 자동 재생이 막히면 포스터가 그대로 남는다
    }
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className={styles.backdrop} style={{ backgroundImage: `url(${POSTER})` }} aria-hidden="true">
      <video ref={videoRef} className={styles.video} poster={POSTER} muted loop playsInline preload="none" />
    </div>
  );
}

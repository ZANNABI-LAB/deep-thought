'use client';

import { useEffect, useRef } from 'react';
import styles from './SpaceBackdrop.module.css';

export const POSTER = '/world/space-loop-poster.webp';
const VIDEO = '/world/space-loop-4k.mp4';

export function SpaceBackdrop({ onReady }: { onReady: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const onReadyRef = useRef(onReady);
  onReadyRef.current = onReady;

  useEffect(() => {
    let alive = true;
    const poster = new Image();
    poster.src = POSTER;
    poster.decode().finally(() => alive && onReadyRef.current());

    const video = videoRef.current;
    const still = matchMedia('(prefers-reduced-motion: reduce), (max-width: 768px)');
    if (video && !still.matches) {
      video.src = VIDEO;
      video.play().catch(() => {});
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

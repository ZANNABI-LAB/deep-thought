'use client';

import { useEffect, useRef } from 'react';
import { reducedMotion } from '@/lib/motion';
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
    const done = () => alive && onReadyRef.current();
    poster.decode().then(done, done);

    const video = videoRef.current;
    if (video && !reducedMotion() && !matchMedia('(hover: none)').matches) {
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

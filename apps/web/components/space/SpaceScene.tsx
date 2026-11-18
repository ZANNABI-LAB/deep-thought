'use client';

import { useCallback, useEffect, useState } from 'react';
import { preload } from 'react-dom';
import { HomeHud } from '@/components/hud/HomeHud';
import { ShootingStars } from './ShootingStars';
import { POSTER, SpaceBackdrop } from './SpaceBackdrop';
import styles from './SpaceScene.module.css';
import { FRAME_SRC, type GlassLayout, LIGHTS_SRC, WindowFrame } from './WindowFrame';

// 창밖이 거의 다 드러났을 때 (SpaceScene.module.css의 .space 전환과 맞춘다)
const HUD_DELAY_MS = 1600;
const LOGO_SHARE = 0.28;
const LOGO_ART_W = 420;

/** 로고 도트 크기(CSS px). 기기 픽셀 기준 2배 미만은 0.25배, 그 위는 정수배 단위 */
function logoPx(glassWidth: number, dpr: number) {
  const target = (glassWidth * LOGO_SHARE * dpr) / LOGO_ART_W;
  const device = target < 2 ? Math.max(1, Math.round(target * 4) / 4) : Math.round(target);
  return device / dpr;
}

/** 어두운 창틀 → (전원) 표시등 → 실내 밝기 → 창밖 → HUD 순서로 켜진다 */
export function SpaceScene() {
  preload(POSTER, { as: 'image', fetchPriority: 'high' });
  preload(FRAME_SRC, { as: 'image', fetchPriority: 'high' });
  preload(LIGHTS_SRC, { as: 'image' });

  const [spaceReady, setSpaceReady] = useState(false);
  const [frameReady, setFrameReady] = useState(false);
  const [glass, setGlass] = useState<GlassLayout | null>(null);
  const [hudOn, setHudOn] = useState(false);
  const onSpaceReady = useCallback(() => setSpaceReady(true), []);
  const onFrameReady = useCallback(() => setFrameReady(true), []);
  const powered = spaceReady && frameReady;

  useEffect(() => {
    if (!powered) return;
    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timer = setTimeout(() => setHudOn(true), still ? 0 : HUD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [powered]);

  const vars = glass && {
    '--glass-left': `${glass.left}px`,
    '--glass-top': `${glass.top}px`,
    '--glass-right': `${glass.right}px`,
    '--glass-bottom': `${glass.bottom}px`,
    '--px': `${glass.px}px`,
    '--logo-px': `${logoPx(innerWidth - glass.left - glass.right, devicePixelRatio)}px`,
  };

  return (
    <div
      className={styles.scene}
      style={vars as React.CSSProperties}
      data-frame={frameReady || undefined}
      data-powered={powered || undefined}
      data-hud={hudOn || undefined}
    >
      <div className={styles.space}>
        <SpaceBackdrop onReady={onSpaceReady} />
        <ShootingStars />
      </div>
      <div className={styles.frame}>
        <WindowFrame lit={powered} onReady={onFrameReady} onLayout={setGlass} />
      </div>
      {glass && (
        <div className={styles.hud}>
          <HomeHud shown={hudOn} />
        </div>
      )}
    </div>
  );
}

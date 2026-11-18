'use client';

import { useCallback, useState } from 'react';
import { preload } from 'react-dom';
import { HomeHud } from '@/components/hud/HomeHud';
import { ShootingStars } from './ShootingStars';
import { POSTER, SpaceBackdrop } from './SpaceBackdrop';
import styles from './SpaceScene.module.css';
import { FRAME_SRC, type GlassLayout, LIGHTS_SRC, WindowFrame } from './WindowFrame';

export function SpaceScene() {
  preload(POSTER, { as: 'image', fetchPriority: 'high' });
  preload(FRAME_SRC, { as: 'image', fetchPriority: 'high' });
  preload(LIGHTS_SRC, { as: 'image' });

  const [spaceReady, setSpaceReady] = useState(false);
  const [glass, setGlass] = useState<GlassLayout | null>(null);
  const onSpaceReady = useCallback(() => setSpaceReady(true), []);

  const vars = glass && {
    '--glass-left': `${glass.left}px`,
    '--glass-top': `${glass.top}px`,
    '--glass-right': `${glass.right}px`,
    '--glass-bottom': `${glass.bottom}px`,
    '--px': `${glass.px}px`,
  };

  return (
    <div
      className={styles.scene}
      style={vars as React.CSSProperties}
      data-space={spaceReady || undefined}
    >
      <div className={styles.space}>
        <SpaceBackdrop onReady={onSpaceReady} />
        <ShootingStars />
      </div>
      <div className={styles.frame}>
        <WindowFrame onLayout={setGlass} />
      </div>
      {glass && (
        <div className={styles.hud}>
          <HomeHud />
        </div>
      )}
    </div>
  );
}

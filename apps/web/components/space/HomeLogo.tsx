import styles from './HomeLogo.module.css';

/** art/scripts/logo.py가 만든 로고(420×202)와 따로 움직일 조각 [x, y, w, h] */
const SIZE = { w: 420, h: 202 };
/** 반짝이마다 깜빡이는 주기·시작 지연(ms) */
const SPARKLES = [
  { rect: [61, 25, 7, 10], period: 3200, delay: 0 },
  { rect: [353, 25, 7, 10], period: 3200, delay: 1600 },
  { rect: [81, 57, 14, 15], period: 2600, delay: 400 },
  { rect: [94, 78, 7, 7], period: 3800, delay: 1200 },
  { rect: [37, 141, 14, 14], period: 4400, delay: 2100 },
  { rect: [368, 81, 15, 15], period: 3000, delay: 900 },
  { rect: [319, 64, 6, 7], period: 2200, delay: 1800 },
] as const;
const PLANET = [316, 61, 47, 28] as const;

/** 그림 한 장에서 rect 부분만 잘라 그 자리에 놓는다 (크기는 창틀 도트 --px 기준) */
function piece(src: string, [x, y, w, h]: readonly [number, number, number, number]): React.CSSProperties {
  return {
    left: `calc(var(--px) * ${x})`,
    top: `calc(var(--px) * ${y})`,
    width: `calc(var(--px) * ${w})`,
    height: `calc(var(--px) * ${h})`,
    backgroundImage: `url(${src})`,
    backgroundSize: `calc(var(--px) * ${SIZE.w}) calc(var(--px) * ${SIZE.h})`,
    backgroundPosition: `calc(var(--px) * ${-x}) calc(var(--px) * ${-y})`,
  };
}

/**
 * 홈 가운데 로고. shown이 켜지면 위에서 아래로 한 줄씩 그려지듯 나타나고,
 * 반짝이는 각자 깜빡이고 토성은 1~2도트씩 천천히 떠다닌다
 */
export function HomeLogo({ shown }: { shown: boolean }) {
  return (
    <div className={styles.wrap}>
      <div className={styles.art} data-shown={shown || undefined}>
        <img
          className={styles.base}
          src="/brand/home-logo.png"
          width={SIZE.w}
          height={SIZE.h}
          alt="Deep Thought — A little universe of ideas. Still computing the answer."
        />
        {SPARKLES.map(({ rect, period, delay }) => (
          <span
            key={rect.join()}
            className={styles.sparkle}
            style={{ ...piece('/brand/home-logo-sparkles.png', rect), animationDuration: `${period}ms`, animationDelay: `${delay}ms` }}
          />
        ))}
        <span className={styles.planet} style={piece('/brand/home-logo-planet.png', PLANET)} />
      </div>
    </div>
  );
}

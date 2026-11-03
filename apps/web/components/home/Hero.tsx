import { Icon } from '../Icon';
import styles from './Hero.module.css';

export function Hero() {
  return (
    <section className={styles.hero} data-safe="left" aria-labelledby="hero-title">
      <p className={`${styles.eyebrow} mono`}>&gt; Zannabi Lab // Est. 2026</p>
      <h1 id="hero-title" className={styles.title}>
        A little universe
        <br />
        of ideas.
      </h1>
      <p className={styles.lede}>삶, 우주, 그리고 모든 것을 탐구하는 작은 연구소입니다.</p>
      <p className={styles.cta}>
        <span aria-hidden="true">&gt;</span>
        <span>Start exploring.</span>
      </p>
      <KeyGuide />
    </section>
  );
}

function KeyGuide() {
  return (
    <dl className={`${styles.keys} mono`} aria-label="섬 조작법">
      <div>
        <dt className={styles.wasd} aria-label="W A S D">
          <kbd>W</kbd>
          <kbd>A</kbd>
          <kbd>S</kbd>
          <kbd>D</kbd>
        </dt>
        <dd>Move</dd>
      </div>
      <div>
        <dt>
          <kbd className={styles.wide}>Space</kbd>
        </dt>
        <dd>Jump</dd>
      </div>
      <div>
        <dt>
          <kbd>E</kbd>
        </dt>
        <dd>Interact</dd>
      </div>
      <div>
        <dt aria-label="마우스">
          <Icon name="mouse" size={18} />
        </dt>
        <dd>Click</dd>
      </div>
    </dl>
  );
}

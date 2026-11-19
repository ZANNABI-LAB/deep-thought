import styles from './HomeLogo.module.css';

export function HomeLogo() {
  return (
    <img
      className={styles.logo}
      src="/brand/home-logo-1260.webp"
      srcSet="/brand/home-logo-630.webp 630w, /brand/home-logo-1260.webp 1260w, /brand/home-logo-1808.webp 1808w"
      sizes="28vw"
      width={1808}
      height={870}
      alt="Deep Thought - A little universe of ideas. Still computing the answer."
    />
  );
}

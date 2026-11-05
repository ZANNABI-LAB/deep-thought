import { Icon } from '../Icon';
import styles from './AskPanel.module.css';

export function AskPanel() {
  return (
    <section className={styles.ask} aria-labelledby="ask-title">
      <p className={`${styles.eyebrow} mono`}>&gt; Coming soon</p>
      <h2 id="ask-title" className={styles.title}>
        Ask
        <br />
        Deep Thought
      </h2>
      <div className={styles.field}>
        <img className={styles.zannabi} src="/brand/zannabi-sitting.svg" alt="" />
        <span className={`${styles.star} ${styles.starLarge}`} aria-hidden="true">
          ✦
        </span>
        <span className={`${styles.star} ${styles.starSmall}`} aria-hidden="true">
          ✦
        </span>
        <input className={styles.input} type="text" placeholder="Under construction..." aria-label="질문 (준비 중)" disabled />
        <button className={styles.send} type="button" aria-label="보내기 (준비 중)" disabled>
          <Icon name="arrow-right" size={16} />
        </button>
      </div>
    </section>
  );
}

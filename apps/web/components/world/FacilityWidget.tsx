import Link from 'next/link';
import type { Ref } from 'react';
import { WORLD_OBJECTS, type WorldObjectId } from '@deep-thought/contracts';
import { Icon } from '../Icon';
import styles from './FacilityWidget.module.css';

export interface LatestPost {
  slug: string;
  title: string;
}

interface Props {
  ref: Ref<HTMLElement>;
  id: WorldObjectId;
  latestPost?: LatestPost;
  onClose: () => void;
}

/** 건물 이름표가 위로 펼쳐진 말풍선. 맨 아래 줄이 이름표 자리에 온다 */
export function FacilityWidget({ ref, id, latestPost, onClose }: Props) {
  const { label, icon } = WORLD_OBJECTS[id];

  return (
    <section ref={ref} className={styles.widget} role="dialog" aria-label={label} data-kind={id} data-testid="facility-widget">
      <div className={styles.card}>
        {id === 'writing-station' ? <WritingBody latestPost={latestPost} /> : <p className={styles.soon}>Coming soon</p>}
        <div className={styles.tag}>
          <Icon name={icon} size={14} />
          <span className={styles.name}>{label}</span>
          <button type="button" className={styles.close} aria-label="닫기" onClick={onClose}>
            <Icon name="close" size={14} />
          </button>
        </div>
      </div>
    </section>
  );
}

function WritingBody({ latestPost }: { latestPost?: LatestPost }) {
  return (
    <>
      {latestPost ? (
        <Link href={`/writing/${latestPost.slug}`} className={styles.post}>
          {latestPost.title}
        </Link>
      ) : (
        <p className={styles.soon}>Coming soon</p>
      )}
      <Link href="/writing" className={styles.more}>
        All writing →
      </Link>
    </>
  );
}

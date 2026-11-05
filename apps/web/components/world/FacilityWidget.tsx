import type { Ref } from 'react';
import { WORLD_OBJECTS, type WorldObjectId } from '@deep-thought/contracts';
import { Icon } from '../Icon';
import styles from './FacilityWidget.module.css';

interface Props {
  ref: Ref<HTMLElement>;
  id: WorldObjectId;
  onClose: () => void;
}

/** 건물 이름표가 위로 펼쳐진 말풍선. 맨 아래 줄이 이름표 자리에 온다 */
export function FacilityWidget({ ref, id, onClose }: Props) {
  const { label, icon } = WORLD_OBJECTS[id];

  return (
    <section ref={ref} className={styles.widget} role="dialog" aria-label={label} data-kind={id} data-testid="facility-widget">
      <div className={styles.card}>
        <p className={styles.soon}>Coming soon</p>
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

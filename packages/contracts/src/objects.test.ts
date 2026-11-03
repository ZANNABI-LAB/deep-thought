import { describe, expect, it } from 'vitest';
import { WORLD_OBJECT_IDS, isWorldObjectId } from './objects';

describe('오브젝트 레지스트리', () => {
  it('레지스트리에 없는 값은 허용하지 않는다', () => {
    expect(isWorldObjectId('writing-station')).toBe(true);
    expect(isWorldObjectId('toString')).toBe(false);
    expect(isWorldObjectId('https://evil.example')).toBe(false);
    expect(isWorldObjectId(42)).toBe(false);
  });

  it('건물 6개', () => {
    expect(WORLD_OBJECT_IDS).toHaveLength(6);
  });
});

/**
 * 월드 오브젝트 레지스트리 — 월드(Godot)와 웹이 함께 읽는 단일 기준.
 * 여기에 없는 오브젝트는 상호작용할 수 없다 (허용 목록 역할). 위치·거리 같은 공간 정보는 월드(playground.gd BUILDINGS)가 objectId로 둔다.
 */

export type IconName = 'file-text' | 'terminal' | 'gamepad' | 'book-open' | 'rocket' | 'flask';

export interface WorldObjectDef {
  /** 건물 이름표 글자 */
  label: string;
  icon: IconName;
}

export const WORLD_OBJECTS = {
  'library-dome': { label: 'READING', icon: 'book-open' },
  'rocket-hangar': { label: 'PROJECTS', icon: 'rocket' },
  'radio-tower': { label: 'LAB', icon: 'flask' },
  'writing-station': { label: 'WRITING', icon: 'file-text' },
  'ai-terminal': { label: 'ASK', icon: 'terminal' },
  'arcade-room': { label: 'ARCADE', icon: 'gamepad' },
} as const satisfies Record<string, WorldObjectDef>;

export type WorldObjectId = keyof typeof WORLD_OBJECTS;

export const WORLD_OBJECT_IDS = Object.keys(WORLD_OBJECTS) as WorldObjectId[];

export function isWorldObjectId(value: unknown): value is WorldObjectId {
  return typeof value === 'string' && Object.hasOwn(WORLD_OBJECTS, value);
}

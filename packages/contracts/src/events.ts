import type { WorldObjectId } from './objects';

/** 월드 → 웹. 월드는 "무엇과 상호작용했는지"만 알리고, 무엇을 열지는 웹이 정한다. */
export type WorldToWeb =
  | { type: 'WORLD_READY' }
  /** 엔진 파일 내려받기 진행률 (바이트). total이 0이면 아직 모름 */
  | { type: 'WORLD_PROGRESS'; loaded: number; total: number }
  /** 브라우저가 지원하지 않거나(WebGL 2 등) 엔진 시작에 실패했다. 배경·웹 UI는 그대로 두고 작은 안내만 띄운다 */
  | { type: 'WORLD_ERROR'; reason: 'unsupported' | 'failed' }
  | { type: 'OBJECT_NEAR'; objectId: WorldObjectId }
  | { type: 'OBJECT_LEAVE'; objectId: WorldObjectId }
  | { type: 'INTERACT'; objectId: WorldObjectId }
  /** 키 입력은 월드에 머물러서 웹이 Escape를 직접 받지 못한다. 셸이 대신 알린다 */
  | { type: 'WORLD_ESCAPE' }
  /** 건물마다 이름표를 띄울 자리 (건물 중간 높이, iframe 기준 CSS px). 카메라·화면 크기가 바뀔 때만 온다 */
  | { type: 'OBJECT_ANCHORS'; anchors: Partial<Record<WorldObjectId, ScreenPoint>> }
  /** 수레 안내: 가까이 가면 'ride'(E로 타기), 타는 동안 'dismount'(E로 내리기), 아니면 null. 자리는 수레 위 (iframe 기준 CSS px). 바뀔 때만 온다 */
  | { type: 'RIDE_PROMPT'; action: 'ride' | 'dismount' | null; at: ScreenPoint };

/** 웹 → 월드 */
export type WebToWorld =
  /** 웹 입력창에 글자를 치는 동안 월드 키 입력을 멈춘다 */
  | { type: 'PAUSE_INPUT' }
  | { type: 'RESUME_INPUT' }
  /** 이름표를 클릭하면 캐릭터가 걸어가서 상호작용한다 */
  | { type: 'MOVE_TO_OBJECT'; objectId: WorldObjectId }
  /** 섬이 웹 UI에 가리지 않도록 비어 있는 화면 가로 범위(CSS px)를 알린다 */
  | { type: 'SET_SAFE_AREA'; left: number; right: number };

export interface ScreenPoint {
  /** 캔버스 왼쪽 위 기준 CSS px */
  x: number;
  y: number;
}

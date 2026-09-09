/** 정규화된 최상위 카테고리. 굿즈 인쇄 시 색 구분 한계를 고려해 7종으로 고정한다. */
export const CATEGORIES = [
  "Frontend",
  "Backend",
  "Infrastructure",
  "Architecture",
  "Security",
  "Testing",
  "Design Pattern",
] as const;

export type Category = (typeof CATEGORIES)[number];

interface ContentBase {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  summary: string;
}

/** 기술 포스트 — 매일메일 아카이브 기반 */
export interface Post extends ContentBase {
  shortTitle: string;
  category: Category;
  author: string;
  /** 출처. "maeil-mail"이면 자동 생성 기반임을 밝힌다 */
  source: string;
  sourceUrl: string;
  references: string[];
  /** 본인 견해가 담겼는지. 색인·차별화의 핵심 지표 */
  hasOpinion: boolean;
}

/** 빌드 로그 — 직접 작성한 학습·제작 기록 */
export interface Log extends ContentBase {}

export interface Rendered<T> {
  meta: T;
  html: string;
}

export const SITE_URL = 'https://deep-thought.space';
export const SITE_NAME = 'Deep Thought';
export const SINCE = 2026;
export const SITE_DESCRIPTION = '코드, 기술, 책, 그리고 더 깊은 생각까지. Zannabi와 함께 탐험하는 개인 지식 연구소.';
export const AUTHOR = { name: '신중선', jobTitle: 'Backend Developer' };
export const GA_ID = 'G-SEG9MW5TKD';
export const FEED_PATH = '/feed.xml';
export const RSS_ALTERNATE = { 'application/rss+xml': [{ url: FEED_PATH, title: SITE_NAME }] };
export const OG_IMAGE = { url: '/opengraph-image.jpg', width: 1200, height: 630, alt: 'Deep Thought - 우주선 창 너머 우주와 조종석의 Zannabi' };
export const OPEN_GRAPH_BASE = { siteName: SITE_NAME, locale: 'ko_KR', images: [OG_IMAGE] };

export function jsonLdScript(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

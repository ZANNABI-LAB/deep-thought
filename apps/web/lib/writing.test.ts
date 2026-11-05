import { describe, expect, it } from 'vitest';
import { formatDate, parsePost } from './writing';

const source = (fields: string) => `---\n${fields}\n---\n\n본문\n`;
const valid = 'title: 제목\nsummary: 요약\ndate: 2026-11-05\ncategory: Web';

describe('parsePost', () => {
  it('파일 이름을 slug로 쓰고 기본값을 채운다', () => {
    const post = parsePost('hello-world.mdx', source(valid));
    expect(post).toMatchObject({ slug: 'hello-world', title: '제목', tags: [], draft: false });
    expect(formatDate(post.date)).toBe('2026. 11. 05');
  });

  it('필수 항목이 없으면 파일 이름과 함께 실패한다', () => {
    expect(() => parsePost('no-title.mdx', source('summary: 요약\ndate: 2026-11-05\ncategory: Web'))).toThrow(/no-title\.mdx/);
  });

  it('날짜가 틀리면 실패한다', () => {
    expect(() => parsePost('bad-date.mdx', source(valid.replace('2026-11-05', '어제')))).toThrow(/bad-date\.mdx/);
  });

  it('URL에 쓸 수 없는 파일 이름은 실패한다', () => {
    expect(() => parsePost('한글 제목.mdx', source(valid))).toThrow(/파일 이름/);
  });
});

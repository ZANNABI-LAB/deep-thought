import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { z } from 'zod';

const WRITING_DIR = path.join(process.cwd(), 'content/writing');
const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const frontmatter = z.object({
  title: z.string().min(1),
  summary: z.string().min(1),
  date: z.coerce.date(),
  category: z.string().min(1),
  tags: z.array(z.string()).default([]),
  series: z.string().optional(),
  cover: z.string().optional(),
  draft: z.boolean().default(false),
});

export type Post = z.infer<typeof frontmatter> & { slug: string };

export function parsePost(fileName: string, source: string): Post {
  const slug = fileName.replace(/\.mdx$/, '');
  if (!SLUG.test(slug)) throw new Error(`${fileName}: 파일 이름은 영문 소문자·숫자·하이픈만 쓴다`);
  const result = frontmatter.safeParse(matter(source).data);
  if (!result.success) throw new Error(`${fileName}: ${z.prettifyError(result.error)}`);
  return { ...result.data, slug };
}

export function getPosts(): Post[] {
  return readdirSync(WRITING_DIR)
    .filter((name) => name.endsWith('.mdx') && !name.startsWith('_'))
    .map((name) => parsePost(name, readFileSync(path.join(WRITING_DIR, name), 'utf8')))
    .filter((post) => !post.draft || process.env.NODE_ENV !== 'production')
    .sort((a, b) => b.date.getTime() - a.date.getTime());
}

export function getPost(slug: string): Post | undefined {
  return getPosts().find((post) => post.slug === slug);
}

export function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10).replaceAll('-', '. ');
}

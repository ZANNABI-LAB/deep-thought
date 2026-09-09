import matter from "gray-matter";
import type { Post, Rendered } from "@/types/content";
import { byDateDesc, normalizeCategory, readMarkdownDir } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";

const OPINION_HEADING = /^##\s+.*(견해|생각|덧붙|경험)/m;

const toPost = (slug: string, raw: string): { post: Post; body: string } => {
  const { data, content } = matter(raw);
  const { category, extraTags } = normalizeCategory(String(data.category ?? ""));

  const post: Post = {
    slug,
    title: String(data.title ?? slug),
    shortTitle: String(data.shortTitle ?? data.title ?? slug),
    date: String(data.date ?? ""),
    tags: [...new Set([...(data.tags ?? []), ...extraTags])].map(String),
    category,
    summary: String(data.summary ?? ""),
    author: String(data.author ?? "신중선"),
    source: String(data.source ?? ""),
    sourceUrl: String(data.sourceUrl ?? ""),
    references: (data.references ?? []).map(String),
    // 본인 견해 섹션이 있는지. 자동 생성 글과 구분하는 유일한 신호다.
    hasOpinion: OPINION_HEADING.test(content),
  };
  return { post, body: content };
};

let cache: Post[] | null = null;

export const getAllPosts = (): Post[] => {
  if (cache) return cache;
  cache = readMarkdownDir("posts")
    .map(({ slug, raw }) => toPost(slug, raw).post)
    .sort(byDateDesc);
  return cache;
};

export const getPostSlugs = (): string[] => getAllPosts().map((p) => p.slug);

export const getPost = async (
  slug: string
): Promise<Rendered<Post> | null> => {
  const found = readMarkdownDir("posts").find((f) => f.slug === slug);
  if (!found) return null;
  const { post, body } = toPost(slug, found.raw);
  return { meta: post, html: await renderMarkdown(body) };
};

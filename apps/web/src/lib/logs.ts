import matter from "gray-matter";
import type { Log, Rendered } from "@/types/content";
import { byDateDesc, readMarkdownDir } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";

const toLog = (slug: string, raw: string): { log: Log; body: string } => {
  const { data, content } = matter(raw);
  return {
    log: {
      slug,
      title: String(data.title ?? slug),
      date: String(data.date ?? ""),
      tags: (data.tags ?? []).map(String),
      summary: String(data.summary ?? ""),
    },
    body: content,
  };
};

let cache: Log[] | null = null;

export const getAllLogs = (): Log[] => {
  if (cache) return cache;
  cache = readMarkdownDir("logs")
    .map(({ slug, raw }) => toLog(slug, raw).log)
    .sort(byDateDesc);
  return cache;
};

export const getLogSlugs = (): string[] => getAllLogs().map((l) => l.slug);

export const getLog = async (slug: string): Promise<Rendered<Log> | null> => {
  const found = readMarkdownDir("logs").find((f) => f.slug === slug);
  if (!found) return null;
  const { log, body } = toLog(slug, found.raw);
  return { meta: log, html: await renderMarkdown(body) };
};

import { getAllPosts } from "@/lib/posts";
import { getAllLogs } from "@/lib/logs";

const BASE = "https://deep-thought.space";

const escape = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export const GET = () => {
  const items = [
    ...getAllPosts().map((p) => ({ ...p, path: `/tech/${p.slug}` })),
    ...getAllLogs().map((l) => ({ ...l, path: `/log/${l.slug}` })),
  ]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30)
    .map(
      (i) => `    <item>
      <title>${escape(i.title)}</title>
      <link>${BASE}${i.path}</link>
      <guid>${BASE}${i.path}</guid>
      <description>${escape(i.summary)}</description>
      <pubDate>${new Date(i.date).toUTCString()}</pubDate>
    </item>`
    )
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Deep Thought</title>
    <link>${BASE}</link>
    <description>백엔드 엔지니어의 Applied AI 학습 기록</description>
    <language>ko</language>
${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
};

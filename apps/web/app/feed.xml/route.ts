import { FEED_PATH, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import { getPosts } from '@/lib/writing';

export const dynamic = 'force-static';

function escapeXml(text: string): string {
  return text.replace(/[<>&'"]/g, (c) => `&#${c.charCodeAt(0)};`);
}

export function GET() {
  const posts = getPosts();
  const items = posts
    .map((post) => {
      const url = `${SITE_URL}/writing/${post.slug}`;
      return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${url}</link>
      <guid>${url}</guid>
      <description>${escapeXml(post.summary)}</description>
      <category>${escapeXml(post.category)}</category>
      <pubDate>${post.date.toUTCString()}</pubDate>
    </item>`;
    })
    .join('');
  const lastBuild = (posts[0]?.date ?? new Date()).toUTCString();
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${SITE_NAME}</title>
    <link>${SITE_URL}</link>
    <description>${escapeXml(SITE_DESCRIPTION)}</description>
    <language>ko</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${SITE_URL}${FEED_PATH}" rel="self" type="application/rss+xml"/>${items}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' } });
}

import type { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/posts";
import { getAllLogs } from "@/lib/logs";

const BASE = "https://deep-thought.space";

const sitemap = (): MetadataRoute.Sitemap => {
  const posts = getAllPosts();
  const logs = getAllLogs();
  const latest = (arr: { date: string }[]) =>
    arr.length ? new Date(arr[0].date) : new Date();

  return [
    { url: BASE, lastModified: latest([...posts, ...logs]), priority: 1 },
    { url: `${BASE}/tech`, lastModified: latest(posts), priority: 0.9 },
    { url: `${BASE}/log`, lastModified: latest(logs), priority: 0.9 },
    { url: `${BASE}/profile`, priority: 0.6 },
    { url: `${BASE}/portfolio`, priority: 0.6 },
    { url: `${BASE}/privacy`, priority: 0.2 },
    ...posts.map((p) => ({
      url: `${BASE}/tech/${p.slug}`,
      lastModified: new Date(p.date),
      priority: 0.7,
    })),
    ...logs.map((l) => ({
      url: `${BASE}/log/${l.slug}`,
      lastModified: new Date(l.date),
      priority: 0.8,
    })),
  ];
};

export default sitemap;

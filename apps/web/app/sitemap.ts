import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/site';
import { getPosts } from '@/lib/writing';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE_URL },
    { url: `${SITE_URL}/writing` },
    ...getPosts().map((post) => ({ url: `${SITE_URL}/writing/${post.slug}`, lastModified: post.date })),
  ];
}

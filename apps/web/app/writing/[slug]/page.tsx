import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AUTHOR, jsonLdScript, OG_IMAGE, OPEN_GRAPH_BASE, SITE_URL } from '@/lib/site';
import { formatDate, getPost, getPosts } from '@/lib/writing';
import hud from '@/components/Hud.module.css';
import styles from './page.module.css';

interface Props {
  params: Promise<{ slug: string }>;
}

export const dynamicParams = false;

export function generateStaticParams() {
  return getPosts().map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: `/writing/${slug}` },
    openGraph: {
      ...OPEN_GRAPH_BASE,
      type: 'article',
      url: `/writing/${slug}`,
      title: post.title,
      description: post.summary,
      publishedTime: post.date.toISOString(),
      authors: [AUTHOR.name],
      tags: post.tags,
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();
  const { default: Content } = await import(`@/content/writing/${slug}.mdx`);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.summary,
    datePublished: post.date.toISOString(),
    url: `${SITE_URL}/writing/${post.slug}`,
    inLanguage: 'ko',
    keywords: post.tags,
    author: { '@type': 'Person', name: AUTHOR.name, url: SITE_URL },
    image: `${SITE_URL}${OG_IMAGE.url}`,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(jsonLd) }} />
      <Link href="/writing" className={hud.link}>
        ← Writing
      </Link>
      <header className={styles.header}>
        <p className={styles.meta}>
          {post.category} · {formatDate(post.date)}
        </p>
        <h1 className={styles.title}>{post.title}</h1>
        <p className={styles.summary}>{post.summary}</p>
      </header>
      <div className={styles.prose}>
        <Content />
      </div>
    </article>
  );
}

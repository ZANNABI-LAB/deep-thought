import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDate, getPost, getPosts } from '@/lib/writing';
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
    openGraph: { type: 'article', title: post.title, description: post.summary, publishedTime: post.date.toISOString() },
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
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <Link href="/writing" className={`${styles.back} mono`}>
        &lt; Writing
      </Link>
      <header className={styles.header}>
        <p className={`${styles.meta} mono`}>
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

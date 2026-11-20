import type { Metadata } from 'next';
import Link from 'next/link';
import { OPEN_GRAPH_BASE, RSS_ALTERNATE } from '@/lib/site';
import { formatDate, getPosts } from '@/lib/writing';
import hud from '@/components/Hud.module.css';
import styles from './page.module.css';

const DESCRIPTION = '배우고 이해한 것을 기록합니다.';

export const metadata: Metadata = {
  title: 'Writing',
  description: DESCRIPTION,
  alternates: { canonical: '/writing', types: RSS_ALTERNATE },
  openGraph: { ...OPEN_GRAPH_BASE, title: 'Writing', description: DESCRIPTION, url: '/writing' },
};

export default function WritingPage() {
  const posts = getPosts();

  return (
    <>
      <p className={hud.eyebrow}>&gt; Deep Thought / Writing</p>
      <h1 className={hud.heading}>Writing</h1>
      <p className={hud.lede}>{DESCRIPTION}</p>
      {posts.length === 0 ? (
        <p className={styles.empty}>첫 글을 쓰는 중이에요.</p>
      ) : (
        <ul className={styles.list}>
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/writing/${post.slug}`} className={styles.post}>
                <span className={styles.meta}>
                  {post.category} · {formatDate(post.date)}
                </span>
                <span className={styles.postTitle}>
                  {post.title}
                  <span className={styles.arrow} aria-hidden>
                    →
                  </span>
                </span>
                <span className={styles.summary}>{post.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

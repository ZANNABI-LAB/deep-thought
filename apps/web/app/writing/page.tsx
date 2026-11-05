import type { Metadata } from 'next';
import Link from 'next/link';
import { formatDate, getPosts } from '@/lib/writing';
import styles from './page.module.css';

const DESCRIPTION = '배우고 이해한 것을 기록합니다.';

export const metadata: Metadata = {
  title: 'Writing',
  description: DESCRIPTION,
  alternates: { canonical: '/writing' },
};

export default function WritingPage() {
  const posts = getPosts();

  return (
    <>
      <p className={`${styles.eyebrow} mono`}>&gt; Writing Station</p>
      <h1 className={styles.title}>Writing</h1>
      <p className={styles.lede}>{DESCRIPTION}</p>
      {posts.length === 0 ? (
        <p className={styles.empty}>첫 글을 쓰는 중이에요.</p>
      ) : (
        <ul className={styles.list}>
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/writing/${post.slug}`} className={styles.post}>
                <span className={`${styles.meta} mono`}>
                  {post.category} · {formatDate(post.date)}
                </span>
                <span className={styles.postTitle}>{post.title}</span>
                <span className={styles.summary}>{post.summary}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

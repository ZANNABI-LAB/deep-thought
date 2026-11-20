'use client';

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import frame from './Frame.module.css';
import styles from './AskCard.module.css';

export type PostIndex = { slug: string; title: string; summary: string; category: string; tags: string[] };

const LIMIT = 3;

function Sparkle({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" aria-hidden>
      <path d="M10 0C11 7 13 9 20 10 13 11 11 13 10 20 9 13 7 11 0 10 7 9 9 7 10 0Z" />
    </svg>
  );
}

export function AskCard({ posts }: { posts: PostIndex[] }) {
  const [query, setQuery] = useState('');
  const [asked, setAsked] = useState<string | null>(null);
  const [found, setFound] = useState<PostIndex[]>([]);

  const ask = (event: FormEvent) => {
    event.preventDefault();
    const term = query.trim().toLowerCase();
    if (!term) return;
    setAsked(query.trim());
    setFound(
      posts
        .filter((post) => [post.title, post.summary, post.category, ...post.tags].some((field) => field.toLowerCase().includes(term)))
        .slice(0, LIMIT),
    );
  };

  return (
    <section className={`${frame.frame} ${styles.card}`} aria-labelledby="ask-title">
      <Sparkle className={styles.sparkTop} />
      <Sparkle className={styles.sparkSide} />
      <span className={styles.art} aria-hidden />
      <h2 id="ask-title" className={styles.title}>
        Ask
        <br />
        Deep Thought
      </h2>
      <form className={styles.field} onSubmit={ask} role="search">
        <input
          className={styles.input}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="블로그에 질문하기_"
          aria-label="블로그에 질문하기"
          enterKeyHint="search"
        />
        <button className={styles.send} type="submit" aria-label="질문 보내기">
          <svg viewBox="0 0 24 24" aria-hidden>
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </form>
      {asked !== null && (
        <div className={styles.answer} aria-live="polite">
          {posts.length === 0 ? (
            <p className={styles.note}>아직 공개된 글이 없어요. 첫 글을 쓰는 중이에요.</p>
          ) : found.length === 0 ? (
            <p className={styles.note}>‘{asked}’에 맞는 글을 찾지 못했어요.</p>
          ) : (
            <ul className={styles.results}>
              {found.map((post) => (
                <li key={post.slug}>
                  <Link href={`/writing/${post.slug}`} className={styles.result}>
                    <span>{post.title}</span>
                    <span aria-hidden>→</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

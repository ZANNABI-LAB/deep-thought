import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPost, getPostSlugs } from "@/lib/posts";

type Params = { params: Promise<{ slug: string }> };

export const generateStaticParams = async () =>
  getPostSlugs().map((slug) => ({ slug }));

export const generateMetadata = async ({ params }: Params): Promise<Metadata> => {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return {};
  const { meta } = post;
  return {
    title: meta.title,
    description: meta.summary,
    keywords: meta.tags,
    alternates: { canonical: `/tech/${slug}` },
    openGraph: {
      type: "article",
      title: meta.title,
      description: meta.summary,
      publishedTime: meta.date,
      url: `/tech/${slug}`,
    },
  };
};

const TechPost = async ({ params }: Params) => {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();
  const { meta, html } = post;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.summary,
    datePublished: meta.date,
    keywords: meta.tags.join(", "),
    author: { "@type": "Person", name: meta.author },
    publisher: { "@type": "Organization", name: "Deep Thought" },
    mainEntityOfPage: `https://deep-thought.space/tech/${slug}`,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/tech" className="font-mono text-[11px] tracking-wider text-text-faint hover:text-text-muted">
        ← TECH
      </Link>

      <header className="mt-7">
        <div className="flex items-center gap-2.5">
          <span className="size-[5px] bg-accent" />
          <span className="font-mono text-[11px] tracking-[0.14em] text-text-muted">
            {meta.category.toUpperCase()} · {meta.date.replaceAll("-", ".")}
          </span>
        </div>
        <h1 className="mt-3.5 text-[25px] font-bold leading-[1.45] tracking-[-0.02em]">
          {meta.title}
        </h1>
        {meta.tags.length > 0 && (
          <ul className="mt-5 flex flex-wrap gap-2">
            {meta.tags.map((t) => (
              <li key={t} className="border border-line px-2 py-1 font-mono text-[11px] text-text-muted">
                {t}
              </li>
            ))}
          </ul>
        )}
      </header>

      <div
        className="prose mt-10"
        dangerouslySetInnerHTML={{ __html: html }}
      />

      {meta.source === "maeil-mail" && (
        <p className="mt-14 border-t border-line-soft pt-5 font-mono text-[11px] leading-relaxed text-text-faint">
          이 글은{" "}
          <a href={meta.sourceUrl} className="hover:text-text-muted" target="_blank" rel="noopener noreferrer">
            매일메일
          </a>
          의 질문을 바탕으로 작성되었습니다.
        </p>
      )}
    </article>
  );
};

export default TechPost;

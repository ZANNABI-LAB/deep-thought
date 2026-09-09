import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getLog, getLogSlugs } from "@/lib/logs";

type Params = { params: Promise<{ slug: string }> };

export const generateStaticParams = async () =>
  getLogSlugs().map((slug) => ({ slug }));

export const generateMetadata = async ({ params }: Params): Promise<Metadata> => {
  const { slug } = await params;
  const log = await getLog(slug);
  if (!log) return {};
  return {
    title: log.meta.title,
    description: log.meta.summary,
    keywords: log.meta.tags,
    alternates: { canonical: `/log/${slug}` },
    openGraph: {
      type: "article",
      title: log.meta.title,
      description: log.meta.summary,
      publishedTime: log.meta.date,
      url: `/log/${slug}`,
    },
  };
};

const LogPost = async ({ params }: Params) => {
  const { slug } = await params;
  const log = await getLog(slug);
  if (!log) notFound();
  const { meta, html } = log;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: meta.title,
    description: meta.summary,
    datePublished: meta.date,
    author: { "@type": "Person", name: "신중선" },
    publisher: { "@type": "Organization", name: "Deep Thought" },
    mainEntityOfPage: `https://deep-thought.space/log/${slug}`,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Link href="/log" className="font-mono text-[11px] tracking-wider text-text-faint hover:text-text-muted">
        ← LOG
      </Link>

      <header className="mt-7">
        <div className="flex items-center gap-2.5">
          <span className="size-[5px] bg-accent" />
          <span className="font-mono text-[11px] tracking-[0.14em] text-text-muted">
            {meta.date.replaceAll("-", ".")}
          </span>
        </div>
        <h1 className="mt-3.5 text-[25px] font-bold leading-[1.45] tracking-[-0.02em]">
          {meta.title}
        </h1>
      </header>

      <div className="prose mt-10" dangerouslySetInnerHTML={{ __html: html }} />
    </article>
  );
};

export default LogPost;

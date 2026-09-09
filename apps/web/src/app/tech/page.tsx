import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export const metadata: Metadata = {
  title: "Tech",
  description: "기술 포스트 목록",
  alternates: { canonical: "/tech" },
};

const TechList = () => {
  const posts = getAllPosts();
  return (
    <div>
      <h1 className="text-xl font-bold tracking-tight">Tech</h1>
      <p className="mt-1.5 font-mono text-[11px] tracking-wider text-text-faint">
        {posts.length} POSTS
      </p>
      <ul className="mt-9">
        {posts.map((p) => (
          <li key={p.slug} className="border-t border-line-soft">
            <Link href={`/tech/${p.slug}`} className="flex gap-5 py-3.5 hover:text-accent">
              <span className="w-[86px] shrink-0 font-mono text-xs text-text-faint">
                {p.category}
              </span>
              <span className="text-[15px]">{p.title}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TechList;

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Portfolio",
  alternates: { canonical: "/portfolio" },
};

const Page = () => (
  <div>
    <h1 className="text-xl font-bold tracking-tight">Portfolio</h1>
    <p className="mt-4 text-sm text-text-muted">준비 중입니다.</p>
  </div>
);

export default Page;

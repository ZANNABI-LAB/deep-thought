import type { Metadata } from "next";
import { IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
import Link from "next/link";
import "./globals.css";

/**
 * 머니그라피 픽셀 — 본문까지 전면 적용한다.
 *
 * 서브셋은 scripts/subset-fonts.ts가 빌드마다 콘텐츠에서 다시 뜬다(66 KB).
 * 단일 굵기라 bold는 브라우저 합성에 맡기지 않고 자간·색으로 위계를 만든다.
 */
const pixel = localFont({
  src: "../../public/fonts/Moneygraphy-Pixel.woff2",
  variable: "--font-sans-kr",
  display: "swap",
  weight: "400",
  adjustFontFallback: false,
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://deep-thought.space"),
  title: {
    default: "Deep Thought",
    template: "%s | Deep Thought",
  },
  description: "백엔드 엔지니어의 Applied AI 학습 기록 · 개인 기술 블로그",
  alternates: { canonical: "/", types: { "application/rss+xml": "/feed.xml" } },
  openGraph: {
    type: "website",
    siteName: "Deep Thought",
    locale: "ko_KR",
    url: "/",
  },
};

const NAV = [
  { href: "/tech", label: "Tech" },
  { href: "/log", label: "Log" },
  { href: "/profile", label: "Profile" },
  { href: "/portfolio", label: "Portfolio" },
];

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      name: "Deep Thought",
      url: "https://deep-thought.space",
      inLanguage: "ko",
    },
    {
      "@type": "Person",
      name: "신중선",
      url: "https://deep-thought.space/profile",
    },
  ],
};

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang="ko" className={`${pixel.variable} ${mono.variable}`}>
    <body className="min-h-screen bg-bg font-sans text-text antialiased">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <header className="site-header">
        <nav className="mx-auto flex h-[var(--nav-height)] max-w-3xl items-center gap-6 px-6">
          {/* 마크는 재제작 예정이라 헤더에서 뺀다. 새 마크가 나오면 이 Link 안에
            * Image로 다시 넣으면 된다. 후보 도안은 design/assets/에 있다. */}
          <Link href="/" className="text-[16px] font-semibold tracking-tight">
            Deep Thought
          </Link>
          <div className="flex gap-4 text-[14px] text-text-muted">
            {NAV.map(({ href, label }) => (
              <Link key={href} href={href} className="hover:text-text">
                {label}
              </Link>
            ))}
          </div>
        </nav>
      </header>

      <main className="site-main mx-auto max-w-3xl px-6">{children}</main>

      <footer className="site-footer">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-6 py-8 font-mono text-[11px] tracking-wider text-text-faint">
          <span>© 2026 DEEP THOUGHT</span>
          <span className="flex gap-4">
          <Link href="/privacy" className="hover:text-text-muted">PRIVACY</Link>
          <a href="/feed.xml" className="hover:text-text-muted">RSS</a>
          <a
            href="https://github.com/ZANNABI-LAB"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-text-muted"
          >
            ZANNABI LAB
          </a>
          </span>
        </div>
      </footer>
    </body>
  </html>
);

export default RootLayout;

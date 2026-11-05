import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono, Newsreader } from 'next/font/google';
import { WorldHost } from '@/components/world/WorldHost';
import { SITE_URL } from '@/lib/site';
import { getPosts } from '@/lib/writing';
import './globals.css';

const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains' });
const newsreader = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--font-newsreader' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: 'Deep Thought — A little universe of ideas', template: '%s · Deep Thought' },
  description: '코드, 기술, 책, 그리고 더 깊은 생각까지. Zannabi와 함께 탐험하는 개인 지식 연구소.',
};

export const viewport: Viewport = { themeColor: '#080F1F' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [latest] = getPosts();

  return (
    <html lang="ko" className={`${jetbrains.variable} ${newsreader.variable}`}>
      <body>
        <WorldHost latestPost={latest && { slug: latest.slug, title: latest.title }} />
        {children}
      </body>
    </html>
  );
}

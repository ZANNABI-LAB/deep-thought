import type { Metadata, Viewport } from 'next';
import { JetBrains_Mono } from 'next/font/google';
import './globals.css';

const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains' });

export const metadata: Metadata = {
  title: { default: 'Deep Thought — A little universe of ideas', template: '%s · Deep Thought' },
  description: '코드, 기술, 책, 그리고 더 깊은 생각까지. Zannabi와 함께 탐험하는 개인 지식 연구소.',
};

export const viewport: Viewport = { themeColor: '#080F1F' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={jetbrains.variable}>
      <body>{children}</body>
    </html>
  );
}

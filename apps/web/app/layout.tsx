import { GoogleAnalytics } from '@next/third-parties/google';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata, Viewport } from 'next';
import { IBM_Plex_Mono, Instrument_Serif, JetBrains_Mono, Newsreader } from 'next/font/google';
import { AUTHOR, GA_ID, jsonLdScript, OPEN_GRAPH_BASE, RSS_ALTERNATE, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from '@/lib/site';
import './globals.css';

const jetbrains = JetBrains_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-jetbrains' });
const newsreader = Newsreader({ subsets: ['latin'], style: ['normal', 'italic'], axes: ['opsz'], variable: '--font-newsreader' });
const plex = IBM_Plex_Mono({ subsets: ['latin'], weight: ['400', '500'], variable: '--font-plex' });
const instrument = Instrument_Serif({ subsets: ['latin'], weight: '400', variable: '--font-instrument' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: `${SITE_NAME} - A little universe of ideas`, template: `%s · ${SITE_NAME}` },
  description: SITE_DESCRIPTION,
  authors: [{ name: AUTHOR.name }],
  alternates: { types: RSS_ALTERNATE },
  openGraph: { type: 'website', ...OPEN_GRAPH_BASE },
  twitter: { card: 'summary_large_image' },
  verification: {
    google: 'Rb4p0xrGmuz3tPkebAeRxpWCLbaG5ffXvDn8yoJUQ6c',
    other: { 'naver-site-verification': 'be210a5940ac2c67d682e36441a60b385f3354a5' },
  },
};

export const viewport: Viewport = { themeColor: '#080F1F' };

const siteJsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'WebSite', name: SITE_NAME, url: SITE_URL, inLanguage: 'ko', description: SITE_DESCRIPTION },
    { '@type': 'Person', name: AUTHOR.name, jobTitle: AUTHOR.jobTitle, url: SITE_URL },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${jetbrains.variable} ${newsreader.variable} ${plex.variable} ${instrument.variable}`}>
      <body>
        {children}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(siteJsonLd) }} />
        <SpeedInsights />
      </body>
      {process.env.VERCEL_ENV === 'production' && <GoogleAnalytics gaId={GA_ID} />}
    </html>
  );
}

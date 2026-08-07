import type { Metadata } from 'next';
import LiarsDiceClient from '../LiarsDiceClient';

export const metadata: Metadata = {
  title: 'Liar\'s Dice Roller - Anti-Cheat Timer & Top 5 History Logs',
  description:
    'Online Liar\'s Dice roller designed for party and bar games! Features an anti-cheat timer showing time elapsed since the last roll, cup cover, and top 5 roll history.',
  keywords: 'Liar\'s Dice, Dice Roller, Anti-cheat Timer, Party Game, Bar Games, Dice Cup Cover, Top 5 History',
  alternates: {
    canonical: 'https://tools.cjkuo.net/liars-dice/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/liars-dice/',
      en: 'https://tools.cjkuo.net/liars-dice/en/',
      'x-default': 'https://tools.cjkuo.net/liars-dice/en/',
    },
  },
  openGraph: {
    title: 'Liar\'s Dice Roller - Anti-Cheat Timer & Top 5 History Logs',
    description: 'Online Liar\'s Dice roller with anti-cheat timer showing time elapsed since last roll and top 5 history records.',
    url: 'https://tools.cjkuo.net/liars-dice/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Liar\'s Dice Roller - Anti-Cheat Timer & Top 5 History Logs',
    description: 'Online Liar\'s Dice roller with anti-cheat timer showing time elapsed since last roll and top 5 history records.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Liar\'s Dice Roller',
  url: 'https://tools.cjkuo.net/liars-dice/en/',
  description: 'Online Liar\'s Dice roller with anti-cheat timer showing time elapsed since last roll and top 5 history records.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function LiarsDiceEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LiarsDiceClient lang="en" />
    </>
  );
}

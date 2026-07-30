import type { Metadata } from 'next';
import LuckyWheelClient from '../LuckyWheelClient';

export const metadata: Metadata = {
  title: 'Lucky Wheel & Slot Spinner - Free Online Random Picker & Prize Draw',
  description:
    'Free online Lucky Wheel and Slot Machine prize drawer! Customize prize titles, weights, quantities, and colors. Features fullscreen stage, realistic physics spin animation, and history log.',
  keywords: 'lucky wheel, slot machine spinner, random picker, prize draw, raffle generator, spin wheel online, decision maker, giveaway wheel',
  alternates: {
    canonical: 'https://tools.cjkuo.net/lucky-wheel/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/lucky-wheel/',
      en: 'https://tools.cjkuo.net/lucky-wheel/en/',
    },
  },
  openGraph: {
    title: 'Lucky Wheel & Slot Spinner - Free Online Random Picker & Prize Draw',
    description: 'Free online prize wheel and slot spinner with customizable items, probability weights, physics rotation animation, sound effects, and TXT import/export.',
    url: 'https://tools.cjkuo.net/lucky-wheel/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lucky Wheel & Slot Spinner - Free Online Random Picker & Prize Draw',
    description: 'Free online prize wheel and slot spinner with customizable items, probability weights, physics rotation animation, sound effects, and TXT import/export.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Lucky Wheel & Slot Spinner',
  url: 'https://tools.cjkuo.net/lucky-wheel/en/',
  description: 'Free online Lucky Wheel and Slot Machine prize drawer supporting custom prizes, probability weights, colors, and fullscreen stage.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function LuckyWheelEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LuckyWheelClient lang="en" />
    </>
  );
}

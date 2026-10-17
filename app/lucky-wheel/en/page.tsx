import type { Metadata } from 'next';
import LuckyWheelClient from '../LuckyWheelClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';
import { TRANSLATIONS } from '../translations';

export const metadata: Metadata = {
  title: 'Lucky Wheel & Slot Spinner - Free Online Random Picker & Gala Raffle',
  description:
    'Free online Lucky Wheel and Slot Machine prize drawer! Customize prize titles, weights, quantities, award tiers, batch draws, and quick text list paste with fullscreen stage mode.',
  keywords: 'lucky wheel, slot machine spinner, random picker, prize draw, raffle generator, spin wheel online, gala raffle, giveaway wheel',
  alternates: {
    canonical: 'https://tools.cjkuo.net/lucky-wheel/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/lucky-wheel/',
      en: 'https://tools.cjkuo.net/lucky-wheel/en/',
      'x-default': 'https://tools.cjkuo.net/lucky-wheel/en/',
    },
  },
  openGraph: {
    title: 'Lucky Wheel & Slot Spinner - Free Online Random Picker & Gala Raffle',
    description: 'Free online prize wheel and slot spinner with customizable items, dual-draw gala mode, batch draws, quick text paste, and CSV export.',
    url: 'https://tools.cjkuo.net/lucky-wheel/en/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Lucky Wheel & Slot Spinner - Free Online Random Picker & Gala Raffle',
    description: 'Free online prize wheel and slot spinner with customizable items, dual-draw gala mode, batch draws, quick text paste, and CSV export.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Lucky Wheel & Slot Spinner',
  url: 'https://tools.cjkuo.net/lucky-wheel/en/',
  description: 'Free online Lucky Wheel and Slot Machine prize drawer supporting custom prizes, probability weights, dual-draw gala mode, and fullscreen stage.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema(TRANSLATIONS.en.faqItems);

export default function LuckyWheelEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <LuckyWheelClient lang="en" />
    </>
  );
}

import type { Metadata } from 'next';
import ContractionTimerClient from '../ContractionTimerClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';
import { FAQ_ITEMS } from '../translations';

export const metadata: Metadata = {
  title: 'Contraction Timer - Free Online Labor Contraction Tracker & Frequency Calculator',
  description:
    'Free online contraction timer. Tap to start and stop; it uses your latest 5 contractions to calculate how often they come, how long they last, how regular they are and how long the pattern has lasted, with a 6-hour trend chart and a one-tap summary to share. Data stays on your device and is deleted after 6 hours.',
  keywords: 'contraction timer, contraction tracker, labor contractions, contraction frequency, contraction duration, labor timer, early labor',
  alternates: {
    canonical: 'https://tools.cjkuo.net/contraction-timer/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/contraction-timer/',
      en: 'https://tools.cjkuo.net/contraction-timer/en/',
      'x-default': 'https://tools.cjkuo.net/contraction-timer/en/',
    },
  },
  openGraph: {
    title: 'Contraction Timer - Free Labor Contraction Tracker',
    description: 'Time contractions with one tap and see frequency, duration, regularity and how long the pattern has lasted.',
    url: 'https://tools.cjkuo.net/contraction-timer/en/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Contraction Timer - Free Labor Contraction Tracker',
    description: 'Time contractions with one tap and see frequency, duration, regularity and how long the pattern has lasted.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Contraction Timer',
  url: 'https://tools.cjkuo.net/contraction-timer/en/',
  description: 'Free online contraction timer that calculates frequency, duration, regularity and a 6-hour trend, with data stored only on your device.',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema(FAQ_ITEMS.en);

export default function ContractionTimerEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ContractionTimerClient lang="en" />
    </>
  );
}

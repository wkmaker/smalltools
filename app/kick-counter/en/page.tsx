import type { Metadata } from 'next';
import KickCounterClient from '../KickCounterClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';
import { FAQ_ITEMS } from '../translations';

export const metadata: Metadata = {
  title: 'Fetal Kick Counter - Free Online Fetal Movement Tracker & Cardiff 10-Kick Timer',
  description:
    'Free online fetal kick counter. Supports Count to 10 (Cardiff) and 1-Hour Observation methods, automatically tagging combo kicks within 2 minutes. Track distinct episodes vs total taps with 14-day vitality charts and emergency phone scripts. Data stays on your device.',
  keywords: 'kick counter, fetal movement tracker, count to 10 kicks, baby kicks, cardiff kick count, 28 weeks fetal movement, pregnancy kick counter',
  alternates: {
    canonical: 'https://tools.cjkuo.net/kick-counter/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/kick-counter/',
      en: 'https://tools.cjkuo.net/kick-counter/en/',
      'x-default': 'https://tools.cjkuo.net/kick-counter/en/',
    },
  },
  openGraph: {
    title: 'Fetal Kick Counter - Free Online Fetal Movement Tracker',
    description: 'Track baby kicks with ease! Auto-tags combo movements, tracks time to 10 kicks, and offers quick scripts to read.',
    url: 'https://tools.cjkuo.net/kick-counter/en/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Fetal Kick Counter - Free Online Fetal Movement Tracker',
    description: 'Track baby kicks with ease! Auto-tags combo movements, tracks time to 10 kicks, and offers quick scripts to read.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Fetal Kick Counter',
  url: 'https://tools.cjkuo.net/kick-counter/en/',
  description: 'Online fetal kick tracker with Count to 10 and 1-hour observation modes, combo tagging, and vitality charts.',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema(FAQ_ITEMS.en);

export default function KickCounterEnPage() {
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
      <KickCounterClient lang="en" />
    </>
  );
}

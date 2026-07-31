import type { Metadata } from 'next';
import TimeClient from '../TimeClient';

export const metadata: Metadata = {
  title: 'Target Countdown Timer - Free Online Event Countdown & Accumulator',
  description:
    'A beautiful online target countdown timer & time accumulator! Customize event title, choose time units (years, months, days, hours, mins, secs), view in full screen, and share via direct link.',
  keywords: 'target countdown timer, online timer, event countdown, time accumulator, anniversary countdown, time management, full screen timer',
  alternates: {
    canonical: 'https://tools.cjkuo.net/time/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/time/',
      en: 'https://tools.cjkuo.net/time/en/',
      'x-default': 'https://tools.cjkuo.net/time/en/',
    },
  },
  openGraph: {
    title: 'Target Countdown Timer - Free Online Event Countdown & Accumulator',
    description: 'A beautiful online target countdown timer & time accumulator with customizable event titles and fullscreen mode.',
    url: 'https://tools.cjkuo.net/time/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Target Countdown Timer - Free Online Event Countdown & Accumulator',
    description: 'A beautiful online target countdown timer & time accumulator with customizable event titles and fullscreen mode.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Target Countdown Timer',
  url: 'https://tools.cjkuo.net/time/en/',
  description: 'A beautiful online target countdown timer & time accumulator with customizable event titles and fullscreen mode.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function TimeEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TimeClient lang="en" />
    </>
  );
}

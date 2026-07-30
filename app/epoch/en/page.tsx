import type { Metadata } from 'next';
import EpochClient from '../EpochClient';

export const metadata: Metadata = {
  title: 'Epoch Timestamp Converter - Free Online Unix Timestamp & Date Converter',
  description:
    'Free online Unix Epoch timestamp converter tool! Auto second/millisecond detection, instant 2-way conversion, multi-timezone comparison (Taipei, UTC, PST), and conversion history.',
  keywords: 'epoch timestamp converter, unix timestamp, timestamp converter, epoch converter, unix time, timestamp to date, date to timestamp',
  alternates: {
    canonical: 'https://tools.cjkuo.net/epoch/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/epoch/',
      en: 'https://tools.cjkuo.net/epoch/en/',
    },
  },
  openGraph: {
    title: 'Epoch Timestamp Converter - Free Online Unix Timestamp & Date Converter',
    description: 'Free online Unix Epoch timestamp converter with multi-timezone comparison and history.',
    url: 'https://tools.cjkuo.net/epoch/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Epoch Timestamp Converter - Free Online Unix Timestamp & Date Converter',
    description: 'Free online Unix Epoch timestamp converter with multi-timezone comparison and history.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Epoch Timestamp Converter',
  url: 'https://tools.cjkuo.net/epoch/en/',
  description: 'Free online Unix Epoch timestamp converter tool supporting auto second/millisecond detection and multi-timezone comparison.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function EpochEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <EpochClient lang="en" />
    </>
  );
}

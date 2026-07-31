import type { Metadata } from 'next';
import TextUtilityClient from '../TextUtilityClient';

export const metadata: Metadata = {
  title: 'Text Utility & Stats - Free Online Character Counter, Case Converter & Text Formatter',
  description:
    'Free professional online Text Utility & Statistics tool! Supports real-time character count, word count, line count, case conversion, removing duplicate/empty lines, and text formatting.',
  keywords:
    'word count, character counter, case converter, text utility, text formatter, remove duplicate lines, remove space, online text tool',
  alternates: {
    canonical: 'https://tools.cjkuo.net/text-utility/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/text-utility/',
      en: 'https://tools.cjkuo.net/text-utility/en/',
      'x-default': 'https://tools.cjkuo.net/text-utility/en/',
    },
  },
  openGraph: {
    title: 'Text Utility & Stats - Free Online Character Counter, Case Converter & Text Formatter',
    description: 'Instant text case conversion, space removal, and multi-dimensional text statistics.',
    url: 'https://tools.cjkuo.net/text-utility/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Text Utility & Stats - Free Online Character Counter, Case Converter & Text Formatter',
    description: 'Instant text case conversion, space removal, and multi-dimensional text statistics.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Text Utility & Stats',
  url: 'https://tools.cjkuo.net/text-utility/en/',
  description: 'Free online text processing & formatting tool with case conversion, space cleanup, and character stats.',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function TextUtilityEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TextUtilityClient lang="en" />
    </>
  );
}

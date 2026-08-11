import type { Metadata } from 'next';
import CompoundInterestClient from '../CompoundInterestClient';

export const metadata: Metadata = {
  title: 'Compound Interest Calculator - Free Investment & SIP Growth Calculator',
  description:
    'Free online compound interest calculator. Calculate lump sum and recurring investments (SIP), annual returns, asset growth charts, and breakdown schedules.',
  keywords: 'compound interest calculator, investment calculator, sip calculator, return rate, compound growth',
  alternates: {
    canonical: 'https://tools.cjkuo.net/compound-interest/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/compound-interest/',
      en: 'https://tools.cjkuo.net/compound-interest/en/',
      'x-default': 'https://tools.cjkuo.net/compound-interest/en/',
    },
  },
  openGraph: {
    title: 'Compound Interest Calculator - Free Investment & SIP Growth Calculator',
    description: 'Calculate compound interest for lump sum & recurring investments with visual growth charts.',
    url: 'https://tools.cjkuo.net/compound-interest/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compound Interest Calculator - Free Investment & SIP Growth Calculator',
    description: 'Calculate compound interest for lump sum & recurring investments with visual growth charts.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Compound Interest Calculator',
  url: 'https://tools.cjkuo.net/compound-interest/en/',
  description: 'Free online compound interest calculator with investment growth chart and breakdown table.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function CompoundInterestEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CompoundInterestClient lang="en" />
    </>
  );
}

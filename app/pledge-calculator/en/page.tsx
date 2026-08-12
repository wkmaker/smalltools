import type { Metadata } from 'next';
import PledgeCalculatorClient from '../PledgeCalculatorClient';

export const metadata: Metadata = {
  title: 'Stock Margin & Pledge Calculator - Margin Call & Stress Test Tool',
  description:
    'Free online stock margin pledge calculator! Supports maintenance ratio calculation, 130% margin call price threshold, stress testing, and cash replenishment simulation.',
  keywords: 'stock pledge calculator, margin call price, maintenance ratio, stock loan, margin ratio, stock leverage',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pledge-calculator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pledge-calculator/',
      en: 'https://tools.cjkuo.net/pledge-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/pledge-calculator/en/',
    },
  },
  openGraph: {
    title: 'Stock Margin & Pledge Calculator - Margin Call & Stress Test Tool',
    description: 'Calculate stock pledge margin ratios, 130% margin call price thresholds, and market drop stress test.',
    url: 'https://tools.cjkuo.net/pledge-calculator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stock Margin & Pledge Calculator - Margin Call & Stress Test Tool',
    description: 'Calculate stock pledge margin ratios, 130% margin call price thresholds, and market drop stress test.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Stock Margin & Pledge Calculator',
  url: 'https://tools.cjkuo.net/pledge-calculator/en/',
  description: 'Free online stock pledge margin calculator with SVG gauge and market crash stress testing.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function PledgeCalculatorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PledgeCalculatorClient lang="en" />
    </>
  );
}

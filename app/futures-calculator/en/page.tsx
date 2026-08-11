import type { Metadata } from 'next';
import FuturesCalculatorClient from '../FuturesCalculatorClient';

export const metadata: Metadata = {
  title: 'Futures Risk & Margin Calculator - Taiwan Index Futures Leverage Estimator',
  description:
    'Free online Taiwan futures risk & margin calculator! Supports Long/Short positions, actual leverage, 0-60% adverse stress testing, and margin call threshold estimation.',
  keywords: 'Futures Calculator, Taiwan Index Futures, TX Futures, MTX Futures, TMF Futures, Futures Margin Call, Liquidation Calculator, Futures Risk Level',
  alternates: {
    canonical: 'https://tools.cjkuo.net/futures-calculator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/futures-calculator/',
      en: 'https://tools.cjkuo.net/futures-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/futures-calculator/en/',
    },
  },
  openGraph: {
    title: 'Futures Risk & Margin Calculator - Taiwan Index Futures Leverage Estimator',
    description: 'Essential risk control calculator for futures traders. Real-time adverse stress simulation, actual leverage, and margin call thresholds.',
    url: 'https://tools.cjkuo.net/futures-calculator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Futures Risk & Margin Calculator - Taiwan Index Futures Leverage Estimator',
    description: 'Essential risk control calculator for futures traders. Real-time adverse stress simulation, actual leverage, and margin call thresholds.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Taiwan Futures Risk & Margin Calculator',
  url: 'https://tools.cjkuo.net/futures-calculator/en/',
  description: 'Free online Taiwan Index Futures risk and margin calculator supporting long/short positions, leverage estimation, and margin call thresholds.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function FuturesCalculatorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FuturesCalculatorClient lang="en" />
    </>
  );
}

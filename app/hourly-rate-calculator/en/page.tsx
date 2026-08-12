import type { Metadata } from 'next';
import HourlyRateCalculatorClient from '../HourlyRateCalculatorClient';

export const metadata: Metadata = {
  title: 'Real Hourly Rate Calculator - Deduct Commute & Overtime, Taiwan PR Percentile Rank',
  description:
    'Free online Real Hourly Rate Calculator! Deduct commute time, unpaid overtime, and work expenses to accurately calculate your true net hourly earnings and compare with official Taiwan salary percentile ranks.',
  keywords: 'Real Hourly Rate Calculator, Hourly Rate, Minimum Wage, Salary Percentile Rank, Commute Time, Unpaid Overtime, Salary Percentile, Earnings Calculator',
  alternates: {
    canonical: 'https://tools.cjkuo.net/hourly-rate-calculator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/hourly-rate-calculator/',
      en: 'https://tools.cjkuo.net/hourly-rate-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/hourly-rate-calculator/en/',
    },
  },
  openGraph: {
    type: 'website',
    title: 'Real Hourly Rate Calculator - Deduct Commute & Overtime, Taiwan PR Percentile Rank',
    description: 'Deduct commute time, unpaid overtime, and work expenses to accurately calculate your true net hourly earnings.',
    url: 'https://tools.cjkuo.net/hourly-rate-calculator/en/',
    images: [{ url: '/support.svg', width: 1200, height: 630, alt: 'Real Hourly Rate Calculator' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real Hourly Rate Calculator - Deduct Commute & Overtime, Taiwan PR Percentile Rank',
    description: 'Deduct commute time, unpaid overtime, and work expenses to accurately calculate your true net hourly earnings.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Real Hourly Rate Calculator',
  url: 'https://tools.cjkuo.net/hourly-rate-calculator/en/',
  description: 'Free online Real Hourly Rate Calculator supporting commute/overtime deduction and salary percentile ranking.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function HourlyRateCalculatorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HourlyRateCalculatorClient lang="en" />
    </>
  );
}

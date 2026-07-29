import type { Metadata } from 'next';
import MySalaryCalculatorClient from '../MySalaryCalculatorClient';

export const metadata: Metadata = {
  title: 'Taiwan Salary & Tax Calculator - Free Online Net Pay & Employer Cost Calculator',
  description:
    'Free online Taiwan salary, labor insurance, health insurance & pension calculator. Supports up-to-date brackets, take-home pay, tax withholding, and employer total cost breakdowns.',
  keywords: 'Taiwan salary calculator, Taiwan labor insurance, Taiwan health insurance, take home pay Taiwan, labor pension Taiwan',
  alternates: {
    canonical: 'https://tools.cjkuo.net/my-salary-calculator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/my-salary-calculator/',
      en: 'https://tools.cjkuo.net/my-salary-calculator/en/',
    },
  },
  openGraph: {
    title: 'Taiwan Salary & Tax Calculator - Free Online Net Pay & Employer Cost Calculator',
    description: 'Calculate Taiwan labor insurance, health insurance, tax withholding, net salary, and total employer labor cost.',
    url: 'https://tools.cjkuo.net/my-salary-calculator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taiwan Salary & Tax Calculator - Free Online Net Pay & Employer Cost Calculator',
    description: 'Calculate Taiwan labor insurance, health insurance, tax withholding, net salary, and total employer labor cost.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Taiwan Salary & Tax Calculator',
  url: 'https://tools.cjkuo.net/my-salary-calculator/en/',
  description: 'Free online Taiwan salary, labor insurance, health insurance & pension calculator.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function MySalaryCalculatorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MySalaryCalculatorClient lang="en" />
    </>
  );
}

import type { Metadata } from 'next';
import ResignationCalculatorClient from '../ResignationCalculatorClient';

export const metadata: Metadata = {
  title: 'Resignation & Notice Period Calculator - Free Taiwan Labor Law Tool',
  description:
    'Calculate official notice periods, last working days, resignation effective dates, and unused annual leave payouts based on Article 16 of the Taiwan Labor Standards Act.',
  keywords: 'resignation calculator, notice period Taiwan, Labor Standards Act Article 16, last working day, effective resignation date, annual leave payout',
  alternates: {
    canonical: 'https://tools.cjkuo.net/resignation-calculator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/resignation-calculator/',
      en: 'https://tools.cjkuo.net/resignation-calculator/en/',
    },
  },
  openGraph: {
    title: 'Resignation & Notice Period Calculator - Free Taiwan Labor Law Tool',
    description: 'Calculate official notice periods, last working days, and effective dates in Taiwan.',
    url: 'https://tools.cjkuo.net/resignation-calculator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resignation & Notice Period Calculator - Taiwan Labor Law Tool',
    description: 'Calculate official notice periods, last working days, and effective dates in Taiwan.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Resignation & Notice Period Calculator',
  url: 'https://tools.cjkuo.net/resignation-calculator/en/',
  description: 'Calculate official notice periods, last working days, and effective dates based on Taiwan Labor Law.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function EnglishResignationCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ResignationCalculatorClient lang="en" />
    </>
  );
}

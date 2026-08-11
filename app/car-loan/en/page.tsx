import type { Metadata } from 'next';
import CarLoanClient from '../CarLoanClient';

export const metadata: Metadata = {
  title: 'Car Loan Calculator - Auto Loan Monthly Payment & Interest Rate',
  description:
    'Free online car loan calculator. Calculate monthly auto loan payments, total interest, APR, grace periods, stepped low payments, balloon payments, and amortization schedules.',
  keywords: 'car loan calculator, auto loan calculator, car payment, car interest rate, balloon payment, car apr',
  alternates: {
    canonical: 'https://tools.cjkuo.net/car-loan/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/car-loan/',
      en: 'https://tools.cjkuo.net/car-loan/en/',
      'x-default': 'https://tools.cjkuo.net/car-loan/en/',
    },
  },
  openGraph: {
    title: 'Car Loan Calculator - Auto Loan Monthly Payment & Interest Rate',
    description: 'Calculate monthly auto loan payments, interest, APR, and complete amortization schedules.',
    url: 'https://tools.cjkuo.net/car-loan/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Car Loan Calculator - Auto Loan Monthly Payment & Interest Rate',
    description: 'Calculate monthly auto loan payments, interest, APR, and complete amortization schedules.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Car Loan Calculator',
  url: 'https://tools.cjkuo.net/car-loan/en/',
  description: 'Free online auto loan payment calculator with complete amortization table and APR solver.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function CarLoanEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CarLoanClient lang="en" />
    </>
  );
}

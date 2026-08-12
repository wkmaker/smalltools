import type { Metadata } from 'next';
import PersonalLoanClient from '../PersonalLoanClient';

export const metadata: Metadata = {
  title: 'Personal Loan Calculator - Free Online Loan & APR Solver',
  description:
    'Free online personal loan calculator! Supports equal payment, equal principal, origination fee amortization, APR solver, and monthly repayment schedules.',
  keywords: 'personal loan calculator, loan payment, apr calculator, loan interest, loan amortization schedule',
  alternates: {
    canonical: 'https://tools.cjkuo.net/personal-loan/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/personal-loan/',
      en: 'https://tools.cjkuo.net/personal-loan/en/',
      'x-default': 'https://tools.cjkuo.net/personal-loan/en/',
    },
  },
  openGraph: {
    title: 'Personal Loan Calculator - Free Online Loan & APR Solver',
    description: 'Calculate monthly personal loan payments, total interest, and effective APR.',
    url: 'https://tools.cjkuo.net/personal-loan/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Personal Loan Calculator - Free Online Loan & APR Solver',
    description: 'Calculate monthly personal loan payments, total interest, and effective APR.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Personal Loan Calculator',
  url: 'https://tools.cjkuo.net/personal-loan/en/',
  description: 'Free online personal loan calculator with APR solver and monthly schedule.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function PersonalLoanEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PersonalLoanClient lang="en" />
    </>
  );
}

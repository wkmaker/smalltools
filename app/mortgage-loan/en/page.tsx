import type { Metadata } from 'next';
import MortgageLoanClient from '../MortgageLoanClient';

export const metadata: Metadata = {
  title: 'Mortgage Loan Calculator - Free Online House Loan & APR Solver',
  description:
    'Free online mortgage loan calculator! Supports property price down payment sync, grace period, stepped interest rates, combined loans, and APR solver.',
  keywords: 'mortgage calculator, house loan calculator, apr solver, grace period, stepped rate loan, loan schedule',
  alternates: {
    canonical: 'https://tools.cjkuo.net/mortgage-loan/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/mortgage-loan/',
      en: 'https://tools.cjkuo.net/mortgage-loan/en/',
      'x-default': 'https://tools.cjkuo.net/mortgage-loan/en/',
    },
  },
  openGraph: {
    title: 'Mortgage Loan Calculator - Free Online House Loan & APR Solver',
    description: 'Calculate monthly mortgage payments, grace period amortization, stepped interest rates, and APR.',
    url: 'https://tools.cjkuo.net/mortgage-loan/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Mortgage Loan Calculator - Free Online House Loan & APR Solver',
    description: 'Calculate monthly mortgage payments, grace period amortization, stepped interest rates, and APR.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Mortgage Loan Calculator',
  url: 'https://tools.cjkuo.net/mortgage-loan/en/',
  description: 'Free online mortgage loan calculator supporting grace periods, stepped rates, and APR solver.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function MortgageLoanEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MortgageLoanClient lang="en" />
    </>
  );
}

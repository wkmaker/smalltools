import type { Metadata } from 'next';
import MortgageLoanClient from '../MortgageLoanClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

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

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is the difference between Equal Monthly Payments (Amortization) and Equal Principal Payments?',
    a: 'The two primary mortgage repayment methods serve different financial goals:\n\n① Equal Principal and Interest (Standard Amortization):\nYour total monthly payment remains constant throughout the loan term. Earlier payments consist mostly of interest, while later payments consist primarily of principal. This predictability is ideal for salaried employees and families budgeting monthly income.\n\n② Equal Principal Payment:\nA fixed amount of principal is repaid every month, while interest declines as the remaining balance shrinks. Monthly payments start at their highest and decline each month. Total interest expense is typically 15% to 25% lower than equal amortization, making it suitable for borrowers with strong initial cash flow.',
  },
  {
    q: 'What is a Mortgage Grace Period, and what are the risks involved?',
    a: 'A mortgage grace period is an initial window (typically 1 to 5 years) during which the borrower only pays interest and no principal:\n\n① Key Advantages:\nSubstantially lowers monthly cash outflow during the initial period, helping buyers allocate funds for renovations, furniture, and moving expenses.\n\n② Compressed Amortization Risk:\nOnce the grace period ends, the entire principal balance must be repaid over a shortened remaining term. For example, on a 30-year mortgage with a 5-year grace period, principal must be fully amortized in the remaining 25 years, causing monthly payments from year 6 onward to surge by 40% to 70%.',
  },
  {
    q: 'What are Stepped Interest Rates and Combined Loan Schemes (e.g., Policy + Bank Loan)?',
    a: 'Stepped interest rates and blended loan structures are common in residential property financing:\n\n① Stepped Interest Rates:\nThe loan term is divided into multiple stages. Lenders often provide discounted lower rates for the first 1 to 2 years, with rates stepping up based on benchmark indexes in later stages.\n\n② Combined Loans (e.g., Policy Loan capped at 10M + Commercial Mortgage):\nGovernment-subsidized policy loans (such as Taiwan Young Adult First-Time Homebuyer Loans) are capped at 10 million TWD. If you require 15 million TWD, the extra 5 million TWD is financed under a standard bank mortgage. This calculator supports separate terms, grace periods, and rates for both loans.',
  },
  {
    q: 'What is Annual Percentage Rate (APR), and why should I look beyond nominal interest rates?',
    a: 'Annual Percentage Rate (APR) measures the comprehensive annual cost of borrowing by factoring in the nominal interest rate alongside all upfront fees:\n\n① Inclusion of Origination Fees:\nOrigination fees, appraisal fees, credit check fees, and documentation charges are discounted into the periodic cash flows to reveal the true annualized rate.\n\n② Objective Comparison:\nWhen comparing loan quotes across different financial institutions, APR provides an apples-to-apples metric to identify whether a low-rate offer with hefty upfront fees is actually more expensive than a zero-fee standard rate loan.',
  },
  {
    q: 'How are Loan-to-Value (LTV) ratios and down payments determined?',
    a: 'Lenders determine maximum loan amounts based on professional property appraisals rather than contract purchase prices:\n\n① Typical Down Payment Ratios:\nStandard residential homebuyer loans generally offer 70% to 80% LTV, requiring buyers to prepare 20% to 30% in down payment capital plus an additional 300,000 to 500,000 TWD for deed taxes, escrow fees, insurance, and notary costs.\n\n② Underwriting Criteria:\nKey determinants include property location and age, credit history, debt-to-income (DTI) ratio (ideally under 60%), employment stability, and central bank macroprudential mortgage regulations.',
  },
  {
    q: 'Can I pay off my mortgage early or make lump-sum prepayments? Are there penalty fees?',
    a: 'Prepayment terms depend on your specific mortgage contract:\n\n① Lock-in / Prepayment Penalty Period:\nMost mortgage agreements include a 2 to 3 year lock-in period. Refinancing or settling the entire balance during this period may incur a 0.5% to 1.5% penalty on the prepaid amount.\n\n② Post-Lockout Discharge:\nOnce the lock-in period expires, partial or full prepayments are fee-free. After complete payoff, obtain the official Mortgage Discharge Certificate from your lender and cancel the registered property lien with the local land registry office.',
  },
  {
    q: "Are the mortgage calculator's results legally binding? (Financial Disclaimer)",
    a: 'All monthly repayment amounts, amortization schedules, total interest costs, and APR calculations generated by this tool are theoretical estimates based on standard compound interest mathematics for personal financial planning only.\n\nFinal approved loan amounts, LTV caps, interest rates, grace period eligibility, origination fees, and monthly payment obligations are subject to formal underwriting and contractual approval issued by your lending institution.',
  },
]);

export default function MortgageLoanEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <MortgageLoanClient lang="en" />
    </>
  );
}

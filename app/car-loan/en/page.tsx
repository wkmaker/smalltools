import type { Metadata } from 'next';
import CarLoanClient from '../CarLoanClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

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

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is the typical interest rate for an auto loan, and how do new vs. used car loans differ?',
    a: 'Auto loan interest rates vary based on vehicle age, credit score, loan term, and the lender:\n\n① New Car Loans:\nTypically offer the lowest rates, generally ranging between 2.5% and 5.0% APR. Automakers may also offer promotional low APRs or dealer incentives.\n\n② Used Car / Refinance Loans:\nDue to vehicle depreciation and collateral risk, used car loan rates typically range from 4.5% to 12.0%+ depending on credit tier and vehicle mileage.\n\n③ Credit & Income Factors:\nA solid credit score, verifiable income history, and a lower debt-to-income (DTI) ratio significantly help in securing top-tier interest rates.',
  },
  {
    q: 'Which repayment method is better: Equal Monthly Payment (Amortization) or Equal Principal Payment?',
    a: 'The two repayment methods cater to different financial strategies:\n\n① Equal Principal and Interest (Standard Amortization):\nYour monthly payment remains constant throughout the loan term. Interest represents a larger portion of earlier payments and gradually declines. This makes monthly budgeting predictable and straightforward.\n\n② Equal Principal Payment:\nYou repay a fixed amount of principal each month, plus accrued interest on the remaining balance. Monthly payments start at their highest and decline over time. Total interest paid is lower, which suits borrowers who have higher initial cash flow and want to save on total interest.',
  },
  {
    q: 'What are Balloon Payments and Stepped Low Monthly Payments? What are the hidden risks?',
    a: 'These creative financing options are designed to lower upfront monthly payments for buyers:\n\n① Balloon Payment Structure:\nA significant portion of the principal (e.g. 20% to 30%) is deferred to the final payment. Monthly installments during the term are substantially lower, but the borrower must pay off the balloon lump sum, refinance it, or trade in the vehicle at maturity.\n\n② Stepped Low Payments:\nPayments are kept very low for the first 1 to 2 years, followed by sharp step-up increases in monthly installments for the remaining years.\n\n③ Associated Risks:\nBecause the principal is amortized much more slowly, total interest costs are substantially higher than standard loans. If vehicle market value depreciates faster than expected or if the borrower lacks funds for the balloon payment, refinancing at higher rates or repossession risks may arise.',
  },
  {
    q: 'What is Annual Percentage Rate (APR), and why should I look beyond the nominal interest rate?',
    a: 'Annual Percentage Rate (APR) reflects the true, all-in annualized cost of borrowing by factoring in the nominal interest rate along with mandatory fees (such as loan origination, vehicle mortgage registration, and documentation fees) amortized over the loan term.\n\n① Impact of Fixed Fees:\nOn shorter-term or smaller car loans, a $3,500 to $5,000 upfront fee can increase the effective borrowing cost by 1.0% to 2.0% above the advertised rate.\n\n② Accurate Comparison:\nComparing offers based on APR rather than nominal rates ensures an apples-to-apples evaluation without hidden fee surprises.',
  },
  {
    q: 'What is the Vehicle Mortgage Registration Fee (動保設定費)?',
    a: 'When financing a vehicle, the lender places a legal lien on the vehicle title registered with motor vehicle regulatory authorities to prevent unauthorized resale before loan completion.\n\nLenders and finance companies charge a one-time administrative and filing fee (typically around TWD 3,500 to 5,000 / USD 100 to 200) either deducted from the disbursed loan proceeds or billed at vehicle delivery.',
  },
  {
    q: 'Can I pay off my auto loan early, and is there a prepayment penalty?',
    a: 'Early repayment terms depend on your specific loan agreement:\n\n① Lock-in / Prepayment Penalty Period:\nMost auto loan contracts specify a lock-in window (typically 12 to 20 months). Settling the loan early within this period may incur a 3% to 5% penalty on the remaining principal.\n\n② Post-Lockout Settlement:\nOnce the lock-in period expires, you can typically pay off the remaining balance without penalties. After full payoff, obtain the official Release of Lien / Certificate of Settlement from your lender and cancel the vehicle registration lien.',
  },
  {
    q: "Is the car loan calculator's result legally binding? (Financial Disclaimer)",
    a: 'All monthly payments, total interest figures, amortization schedules, and APR computations generated by this tool are theoretical estimates based on standard compound interest formulas for budgeting and educational purposes only.\n\nFinal interest rates, maximum loan-to-value (LTV) limits, origination fees, prepayment terms, and approved payment schedules are subject to formal underwriting and contractual terms issued by your lending bank or licensed automotive finance company.',
  },
]);

export default function CarLoanEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <CarLoanClient lang="en" />
    </>
  );
}


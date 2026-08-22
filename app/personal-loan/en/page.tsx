import type { Metadata } from 'next';
import PersonalLoanClient from '../PersonalLoanClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

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

const faqJsonLd = generateFaqSchema([
  {
    q: 'Why is this Personal Loan Calculator needed? How does it help identify telemarketing sales tactics and eliminate information asymmetry?',
    a: 'Borrowers frequently encounter packaged marketing claims from telemarketers or loan sales representatives that obscure the true cost of borrowing:\n\n① The "Low Daily / Monthly Payment" Trap:\nSales pitches often emphasize affordable payments (e.g. "Only $10 a day" or "$300 a month") by extending terms to 7 years, significantly inflating total lifetime interest paid.\n\n② "Tiered / Teaser Introductory Rates":\nPromotions advertising "Starting at 0.88% APR" often only apply to the first 3 months, after which rates jump to 8% to 12%+, making the overall loan much more expensive than expected.\n\n③ Concealed Origination & Administrative Fees:\nAttractive nominal rates may come with $200 to $300 (TWD 6,000 to 9,000) upfront processing fees, neutralizing any nominal rate advantage.\n\n④ Calculator Purpose & Transparency:\nThis tool was created specifically to eliminate information asymmetry. By entering your loan amount, monthly payment, term, and origination fees, our APR solver reveals your true effective borrowing cost and monthly principal/interest schedule, empowering you to make informed financial decisions.',
  },
  {
    q: 'What is the typical interest rate range for personal loans, and what factors determine it?',
    a: 'Personal loan interest rates typically depend on employment stability, credit rating, and borrower risk profile:\n\n① Common Rate Ranges:\nPrime tier borrowers (civil servants, healthcare workers, employees of large public corporations) generally receive rates between 2.1% and 4.5% APR. Standard private-sector employees typically see rates between 5.0% and 10.0%, while higher-risk applicants may be quoted 10.0% to 15.0% (statutory cap is 16.0%).\n\n② Key Underwriting Factors:\nThese include credit scores (no delinquent credit card balances or cash advances), verifiable job tenure (ideally 6+ months), debt-to-income limits (DBR 22x rule), and official income proof (bank statements or tax withholding slips).',
  },
  {
    q: 'How do Equal Monthly Payments (Amortization) and Equal Principal Payments differ for personal loans?',
    a: 'The mechanisms and financial trade-offs are as follows:\n\n① Equal Principal and Interest (Standard Amortization):\nYour monthly payment remains constant throughout the loan tenure. Earlier installments consist mostly of interest, while later payments consist mostly of principal. Predictable payments make monthly budgeting easy, making this the default choice for most lenders.\n\n② Equal Principal Payment:\nYou repay a fixed amount of principal each month, with interest computed on the reducing balance. Monthly payments start at their highest and decline over time. Total interest expense is lower than standard amortization, ideal for borrowers with strong initial cash flow.',
  },
  {
    q: 'What is Annual Percentage Rate (APR), and why do origination fees significantly increase borrowing costs?',
    a: 'Annual Percentage Rate (APR) reflects the true annualized cost of borrowing by factoring in the nominal interest rate along with all mandatory upfront fees (origination fees, account management charges, and credit check costs):\n\n① Impact of Upfront Fees:\nBecause personal loan amounts are relatively moderate (e.g., $10,000 to $30,000 / TWD 300,000 to 1,000,000), an upfront origination fee of $200 to $300 (TWD 6,000 to 9,000) can increase the effective APR by 0.5% to 1.5% above the advertised rate.\n\n② Objective Price Comparison:\nAlways compare loan offers based on their total APR rather than nominal introductory rates to avoid hidden fee surprises.',
  },
  {
    q: 'What is the DBR 22x Rule (Debt Burden Ratio)? What is my maximum borrowing capacity?',
    a: 'The DBR 22x rule is a regulatory ceiling established by financial supervisory authorities to prevent over-indebtedness:\n\n① Statutory Limit:\nAn individual\'s total unsecured borrowing balance (including personal loans, credit card installment plans, revolving credit, and cash card balances) across all financial institutions cannot exceed 22 times their average monthly income.\n\n② Practical Approval Limits:\nIn practice, conservative banks generally cap total unsecured borrowing at 15 to 18 times monthly income to maintain safety margins.',
  },
  {
    q: 'Can I pay off my personal loan early? What is a Lock-in / Prepayment Penalty Period?',
    a: 'Early payoff terms depend on the specific loan contract:\n\n① Lock-in / Prepayment Penalty Window:\nMost personal loan contracts include a 12 to 18 month lock-in period. Settling all or part of the loan principal early within this window typically incurs a 1.5% to 3.0% prepayment penalty fee.\n\n② Revolving / Flexible Personal Loans:\nCertain lenders offer revolving personal credit lines that accrue interest on a daily basis with zero prepayment penalties, though nominal interest rates are generally slightly higher.',
  },
  {
    q: 'Should I submit loan applications to multiple banks simultaneously? What are the risks of frequent credit inquiries?',
    a: 'Submitting simultaneous applications to multiple lenders triggers adverse credit scoring consequences:\n\n① Excessive Credit Inquiries:\nEach application causes a hard inquiry on your central credit report. Generating 3 or more hard inquiries within a 3-month window signals urgent liquidity distress to lenders, negatively impacting your credit score and potentially causing outright application rejections.\n\n② Recommended Approach:\nEvaluate bank rate matrices beforehand, target 1 or 2 institutions that best match your financial profile, and avoid shotgun applications.',
  },
  {
    q: "Are the personal loan calculator's estimates legally binding? (Financial Disclaimer)",
    a: 'All monthly installment computations, interest breakdowns, amortization schedules, and APR metrics provided by this calculator are theoretical estimates based on standard compound interest mathematics for personal budgeting only.\n\nActual approved loan amounts, interest rates, origination fees, prepayment conditions, and monthly payment schedules are determined solely by your lender based on formal underwriting and credit assessments.',
  },
]);

export default function PersonalLoanEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <PersonalLoanClient lang="en" />
    </>
  );
}

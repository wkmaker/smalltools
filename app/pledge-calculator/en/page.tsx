import type { Metadata } from 'next';
import PledgeCalculatorClient from '../PledgeCalculatorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Stock Margin & Pledge Calculator - Margin Call & Stress Test Tool',
  description:
    'Free online stock margin pledge calculator! Supports maintenance ratio calculation, 130% margin call price threshold, stress testing, and cash replenishment simulation.',
  keywords: 'stock pledge calculator, margin call price, maintenance ratio, stock loan, margin ratio, stock leverage',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pledge-calculator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pledge-calculator/',
      en: 'https://tools.cjkuo.net/pledge-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/pledge-calculator/en/',
    },
  },
  openGraph: {
    title: 'Stock Margin & Pledge Calculator - Margin Call & Stress Test Tool',
    description: 'Calculate stock pledge margin ratios, 130% margin call price thresholds, and market drop stress test.',
    url: 'https://tools.cjkuo.net/pledge-calculator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Stock Margin & Pledge Calculator - Margin Call & Stress Test Tool',
    description: 'Calculate stock pledge margin ratios, 130% margin call price thresholds, and market drop stress test.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Stock Margin & Pledge Calculator',
  url: 'https://tools.cjkuo.net/pledge-calculator/en/',
  description: 'Free online stock pledge margin calculator with SVG gauge and market crash stress testing.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is stock pledging, and how are loan-to-value (LTV) and maintenance ratios calculated?',
    a: `Stock pledging allows investors to use held shares as collateral for cash loans.

Formulas:
① Max Loan Amount:
Total Stock Market Value × Pledge Ratio (usually up to 60% in Taiwan).

② Maintenance Ratio (%):
(Current Total Stock Value ÷ Total Loan Amount) × 100%.

For instance, pledging $1M in stock to borrow $600K results in an initial maintenance ratio of 166.7%.`,
  },
  {
    q: 'What happens when the maintenance ratio falls below 130%? What is a Margin Call and Liquidation?',
    a: `Margin calls and liquidation mechanisms:

① Margin Call:
If market drops reduce collateral value below 130%, brokers issue a margin call requiring additional cash or shares within 2 business days to restore maintenance above 166%.

② Forced Liquidation:
Failing to meet margin calls results in brokers forcibly selling pledged shares at market open on the 3rd business day.`,
  },
  {
    q: 'How is the 130% Margin Call Threshold Stock Price calculated?',
    a: `Margin Call Price Formula:

① Formula:
Margin Call Price = (Total Loan Amount × 1.3) ÷ Total Shares.

② Example:
Borrowing $600,000 against 1,000 shares yields a threshold price of ($600,000 × 1.3) ÷ 1,000 = $780. Our calculator automatically computes and displays this threshold.`,
  },
  {
    q: 'How can investors increase their maintenance ratio during a market crash?',
    a: `Three common strategies:

① Repay Loan Principal:
Directly reduces loan amount (denominator), rapidly elevating maintenance ratio.

② Deposit Additional Collateral Shares:
Transfer other eligible stocks into the pledge account to increase total collateral value (numerator).

③ Deposit Cash Margin:
Deposit cash directly into the margin account as required by brokers.`,
  },
  {
    q: 'What are the leverage risks of stock pledging? What does broker "umbrella recall" risk mean?',
    a: `Stock pledging is inherently leverage. During market crashes, collateral value drops rapidly, accelerating margin call risks.

Crucially, beware of broker "umbrella recall" risks:
① Refusal to extend or demanding early repayment:
Brokers retain full discretion to deny loan extensions upon 6-month term expiration, especially during market turmoil or when total lending quotas are reached.

② Floating interest rate hikes:
Brokers may adjust pledge interest rates based on market capital costs.

Always maintain conservative leverage and reserve liquidity!`,
  },
  {
    q: 'Are calculation results identical across all brokers and banks? (Disclaimer & Variations)',
    a: `Results provided by this tool are for estimation and reference only. Please refer to your broker's official statements for actual settlement numbers.

Variations between institutions include:
① Reference Price for Maintenance Ratio:
Some brokers use previous day closing prices, while others use real-time intraday or daily closing prices.

② Pledge Ratio Caps:
High-volatility or small-cap stocks may have lower pledge ratios (e.g. 40%–50% instead of 60%).

③ Fees & Charges:
Origination fees or wire transfer costs are excluded from calculations.`,
  },
  {
    q: 'Who receives dividends and stock distributions during stock pledging?',
    a: `Dividends and stock splits belong 100% to the borrower!

The borrower retains underlying stock ownership throughout the pledge term. Cash dividends are deposited into your settlement account.`,
  },
  {
    q: 'How is pledge loan interest calculated, and what is the maximum loan duration?',
    a: `Interest and loan duration:

① Interest Calculation:
Interest is calculated daily (Annual Rate ÷ 365 × Days) and settled semi-annually.

② Term & Extensions:
Standard terms are 6 months, expandable up to 1.5–2 years upon request provided maintenance ratios remain healthy.`,
  },
]);

export default function PledgeCalculatorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <PledgeCalculatorClient lang="en" />
    </>
  );
}

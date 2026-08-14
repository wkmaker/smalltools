import type { Metadata } from 'next';
import CompoundInterestClient from '../CompoundInterestClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Compound Interest Calculator - Free Investment, SIP & Stock Growth Calculator',
  description:
    'Free online compound interest calculator. Calculate lump sum and recurring investments (SIP), annual returns, asset growth charts, and breakdown schedules.',
  keywords: 'compound interest calculator, investment calculator, sip calculator, return rate, compound growth, future value calculator, monthly compounding calculator, rule of 72 calculator, stock investment growth',
  alternates: {
    canonical: 'https://tools.cjkuo.net/compound-interest/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/compound-interest/',
      en: 'https://tools.cjkuo.net/compound-interest/en/',
      'x-default': 'https://tools.cjkuo.net/compound-interest/en/',
    },
  },
  openGraph: {
    title: 'Compound Interest Calculator - Free Investment, SIP & Stock Growth Calculator',
    description: 'Calculate compound interest for lump sum & recurring investments with visual growth charts.',
    url: 'https://tools.cjkuo.net/compound-interest/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Compound Interest Calculator - Free Investment, SIP & Stock Growth Calculator',
    description: 'Calculate compound interest for lump sum & recurring investments with visual growth charts.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Compound Interest Calculator',
  url: 'https://tools.cjkuo.net/compound-interest/en/',
  description: 'Free online compound interest calculator with investment growth chart and breakdown table.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is compound interest? How does it differ from simple interest?',
    a: `Compound interest is the interest calculated on the initial principal as well as all accumulated interest from previous periods. In simple terms, it is "interest earned on interest."

Unlike simple interest (where interest is calculated solely on the original principal), compound interest creates an exponential growth curve over time.

Often referred to as the "eighth wonder of the world," the compounding effect becomes dramatically pronounced over longer investment horizons, eventually causing interest earnings to far exceed original contributions.`,
  },
  {
    q: 'What is the Rule of 72? How to quickly estimate doubling time?',
    a: `The Rule of 72 is a quick financial mental math formula used to estimate the number of years required to double your investment value given a fixed annual rate of return.

Formula: Doubling Time (Years) ≈ 72 / Annual Return Rate (%).

Examples:
① At a 6% annual return, your money doubles in ~12 years (72 / 6).
② At a 12% annual return, your money doubles in ~6 years (72 / 12).

This rule offers a handy shortcut to gauge wealth multiplication speed without complex calculation engines.`,
  },
  {
    q: 'Lump-Sum vs Recurring Contribution (DCA): Which yields higher compound returns?',
    a: `Both investment strategies serve distinct market conditions and capital profiles:

① Lump-Sum Investment: If the overall market trend is bullish, allocating all capital upfront maximizes time-in-the-market, historically outperforming DCA in overall long-term yield.

② Dollar-Cost Averaging (DCA): Ideal for regular income earners. Monthly contributions automatically purchase more shares during market pullbacks, smoothing entry costs and reducing psychological timing stress.

This calculator allows you to model both initial lump-sum and recurring (monthly/annual) contributions simultaneously.`,
  },
  {
    q: 'How does compounding frequency (Monthly vs Annual) affect total returns?',
    a: `Higher compounding frequency generates slightly higher effective annual yields!

For example, with $100,000 at an 8% annual return over 20 years:
① Annual Compounding (Once per year): End balance is ~$466,095.
② Monthly Compounding (12 times per year): End balance is ~$492,680 (over $26,000 more!).

This difference occurs because earned interest is reinvested back into the balance every single month. Our calculator supports Monthly, Quarterly, Annual compounding, and Simple interest modes.`,
  },
  {
    q: 'How should I account for inflation when calculating compound interest?',
    a: `Nominal returns do not reflect purchasing power deterioration over long horizons. To evaluate true future purchasing power, apply the real return rate formula:

Formula: Real Return Rate ≈ Nominal Annual Return Rate - Annual Inflation Rate.

For example, if your nominal investment portfolio yields 7% per year and average inflation is 2.5%, your real return rate is ~4.5%. When planning long-term retirement funds, consider subtracting expected inflation from your return rate to estimate purchasing power accurately.`,
  },
  {
    q: 'Is my financial inputs or calculation data stored on any server?',
    a: `100% No! This calculator operates purely client-side inside your browser engine.

All inputs—including principal, monthly contribution amounts, rates of return, and financial projection schedules—are computed transiently in your local browser memory.

No financial numbers are sent to backend server logs or database systems, ensuring complete privacy for your personal wealth planning.`,
  },
  {
    q: 'Investment & Financial Planning Disclaimer',
    a: `[Financial Planning Disclaimer]

① All calculations, projected rates of return, and growth schedules produced by this tool are provided solely for educational, analytical, and informational reference, and do not constitute financial advice or investment solicitation.

② Market investments carry inherent risk of capital loss. Past performance is no guarantee of future results, and actual yields vary due to market volatility, transaction fees, taxes, and inflation.

③ Always evaluate your personal risk tolerance and consult a certified financial planner before committing real capital.`,
  },
]);

export default function CompoundInterestEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <CompoundInterestClient lang="en" />
    </>
  );
}


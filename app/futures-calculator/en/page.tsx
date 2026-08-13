import type { Metadata } from 'next';
import FuturesCalculatorClient from '../FuturesCalculatorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Futures Risk & Margin Calculator - Taiwan Index Futures Leverage Estimator',
  description:
    'Free online Taiwan futures risk & margin calculator! Supports Long/Short positions, actual leverage, 0-60% adverse stress testing, and margin call threshold estimation.',
  keywords: 'Futures Calculator, Taiwan Index Futures, TX Futures, MTX Futures, TMF Futures, Futures Margin Call, Liquidation Calculator, Futures Risk Level',
  alternates: {
    canonical: 'https://tools.cjkuo.net/futures-calculator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/futures-calculator/',
      en: 'https://tools.cjkuo.net/futures-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/futures-calculator/en/',
    },
  },
  openGraph: {
    title: 'Futures Risk & Margin Calculator - Taiwan Index Futures Leverage Estimator',
    description: 'Essential risk control calculator for futures traders. Real-time adverse stress simulation, actual leverage, and margin call thresholds.',
    url: 'https://tools.cjkuo.net/futures-calculator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Futures Risk & Margin Calculator - Taiwan Index Futures Leverage Estimator',
    description: 'Essential risk control calculator for futures traders. Real-time adverse stress simulation, actual leverage, and margin call thresholds.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Taiwan Futures Risk & Margin Calculator',
  url: 'https://tools.cjkuo.net/futures-calculator/en/',
  description: 'Free online Taiwan Index Futures risk and margin calculator supporting long/short positions, leverage estimation, and margin call thresholds.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What are Initial Margin and Maintenance Margin in futures trading?',
    a: `Futures use a margin-based trading framework:

① Initial Margin:
Minimum capital required in your account to open a new futures position.

② Maintenance Margin:
Minimum equity threshold required to keep a position open. Falling below this triggers a post-market Margin Call.`,
  },
  {
    q: 'What are the differences between TX (Large), MTX (Mini), and TMF (Micro) Taiwan Index Futures?',
    a: `Comparison of Taiwan Index Futures contracts:

① TX (Large):
NT$200 per point. Initial margin ~NT$241,000.

② MTX (Mini):
NT$50 per point (1/4 of TX). Initial margin ~NT$60,250.

③ TMF (Micro):
NT$10 per point (1/5 of MTX). Initial margin ~NT$12,050.

Investors can select contracts matching their capital size and risk tolerance.`,
  },
  {
    q: 'What is a Futures Margin Call and Forced Liquidation? Does forced liquidation guarantee loss prevention during extreme market volatility?',
    a: `Risk management rules and extreme slippage risks:

① Margin Call:
Issued after market close if equity falls below Maintenance Margin, requiring deposits back up to Initial Margin by 12:00 PM next business day.

② Forced Liquidation:
If intraday risk indicator drops below 25%, brokers automatically liquidate positions via market orders without prior notice.

③ [Extreme Volatility Slippage & Over-Loss Risk]:
Crucial Warning: Triggering liquidation threshold DOES NOT guarantee an ideal exit price!

During extreme market crashes, limit locks, overnight gaps, or severe slippage, broker liquidation market orders may fail to execute immediately or fill at catastrophic prices. This can result in losses exceeding your entire account capital (Over-Loss deficit requiring cash repayment).

Traders must never rely on forced liquidation as a safety net and must strictly control leverage and risk.`,
  },
  {
    q: 'How is actual leverage calculated, and what are the risks of high leverage?',
    a: `Calculation and leverage risks:

① Actual Leverage Formula:
Actual Leverage = Total Contract Nominal Value ÷ Total Capital Deposited.

② Example:
At 22,000 points, 1 TX contract is worth NT$4,400,000. Depositing only initial margin (NT$241,000) yields 18.25x leverage! A 5.4% adverse market move wipes out 100% of equity.

③ Recommendation:
Maintain 2x to 3x initial margin to prevent liquidation risks.`,
  },
  {
    q: 'What is Adverse Movement Range (Points Tolerance)?',
    a: `Adverse Movement Range represents the maximum index points the market can move against your position before triggering margin calls or liquidation.

Formulas:
① Long Adverse Points = (Current Equity - Maintenance Margin) ÷ Point Value.
② Short Adverse Points = (Current Equity - Maintenance Margin) ÷ Point Value.`,
  },
  {
    q: 'What are the risks of holding overnight futures positions?',
    a: `Overnight positions face gap risks driven by global market movements.

Risk mitigation strategies:
① Avoid Major Events: Close positions before Fed interest rate decisions or major earnings calls.
② Lower Leverage: Reduce position lot sizes and leverage multiples.
③ Use Stop-Loss Orders: Set stop-loss orders or stop-limit orders.
④ Micro Hedging: Utilize Micro Taiwan Index Futures (TMF) for fine-tuned hedging.`,
  },
]);

export default function FuturesCalculatorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <FuturesCalculatorClient lang="en" />
    </>
  );
}

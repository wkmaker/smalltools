import type { Metadata } from 'next';
import HourlyRateCalculatorClient from '../HourlyRateCalculatorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Real Hourly Rate Calculator - Deduct Commute & Overtime, Taiwan PR Percentile Rank',
  description:
    'Free online Real Hourly Rate Calculator! Deduct commute time, unpaid overtime, and work expenses to accurately calculate your true net hourly earnings and compare with official Taiwan salary percentile ranks.',
  keywords: 'Real Hourly Rate Calculator, Hourly Rate, Minimum Wage, Salary Percentile Rank, Commute Time, Unpaid Overtime, Salary Percentile, Earnings Calculator',
  alternates: {
    canonical: 'https://tools.cjkuo.net/hourly-rate-calculator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/hourly-rate-calculator/',
      en: 'https://tools.cjkuo.net/hourly-rate-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/hourly-rate-calculator/en/',
    },
  },
  openGraph: {
    type: 'website',
    title: 'Real Hourly Rate Calculator - Deduct Commute & Overtime, Taiwan PR Percentile Rank',
    description: 'Deduct commute time, unpaid overtime, and work expenses to accurately calculate your true net hourly earnings.',
    url: 'https://tools.cjkuo.net/hourly-rate-calculator/en/',
    images: [{ url: '/support.svg', width: 1200, height: 630, alt: 'Real Hourly Rate Calculator' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Real Hourly Rate Calculator - Deduct Commute & Overtime, Taiwan PR Percentile Rank',
    description: 'Deduct commute time, unpaid overtime, and work expenses to accurately calculate your true net hourly earnings.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Real Hourly Rate Calculator',
  url: 'https://tools.cjkuo.net/hourly-rate-calculator/en/',
  description: 'Free online Real Hourly Rate Calculator supporting commute/overtime deduction and salary percentile ranking.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'What is "Real Hourly Rate"? Why is "Monthly Salary ÷ Contract Hours" misleading?',
    a: 'Many people calculate their hourly rate simply as "Monthly Salary ÷ 176 Hours", but this ignores significant hidden commitments:\n\n① Revealing True Income After Hidden Costs:\nWhile official government labor statistics do not account for commute time, standby duties, or out-of-pocket work expenses, comparing your real hourly rate provides clear insight into your actual financial return on time.\n\n② Hidden Time & Direct Work Expenses:\nDaily commuting, uncompensated overtime, weekend messaging, transport fares, business wardrobe, and work dining directly dilute your real hourly earnings.\n\n③ Real Net Earnings Formula:\nReal Hourly Rate = (Net Take-Home Salary - Work Expenses) ÷ (Contract Hours + Unpaid Overtime + Commute Hours). Subtracting these consumed life costs gives you the true basis for career decisions and life balance.',
  },
  {
    q: 'How severely do commuting time and unpaid overtime dilute your true hourly earnings?',
    a: 'The dilutive impact of hidden hours is substantial:\n\n① Baseline Scenario:\nA monthly salary of $50,000 TWD (22 working days × 8 hours = 176 hours) yields a nominal hourly rate of ~$284 TWD/hr.\n\n② Commute & Overtime Impact:\nAdding 2 hours of daily commuting (44 hrs/mo) plus 1 hour of unpaid overtime (22 hrs/mo) increases total monthly committed time to 242 hours. Even without deducting transit costs, the real hourly rate drops sharply to ~$206 TWD/hr—a 27.5% reduction in real hourly value.',
  },
  {
    q: 'What is the data source and statistical methodology for the Taiwan Salary Percentile Rank (PR)?',
    a: 'The Taiwan Salary Percentile Rank (PR) database in this tool is built directly on official national labor statistics:\n\n① Authoritative Official Data:\nSynchronized from official DGBAS (Directorate-General of Budget, Accounting and Statistics) annual reports on "Salary Median and Distribution Statistics" and "Employee Earnings Surveys".\n\n② Piecewise Linear Interpolation:\nWe use piecewise mathematical interpolation algorithms across deciles and percentiles to fit smooth continuous distributions, ensuring accurate percentile mappings.',
  },
  {
    q: 'What is Purchasing Power Parity (PPP)? What does your hourly rate mean across global economies?',
    a: 'Salaries cannot be compared solely through nominal foreign exchange rates; local cost of living must be factored in:\n\n① PPP Principles:\nBased on OECD and World Bank Purchasing Power Parity (PPP) indices alongside Numbeo global living metrics, we adjust for local food, housing, transport, and service costs.\n\n② Global Equivalency Mapping:\nThis calculator translates your earnings into purchasing power equivalents across major economies (US, Japan, UK, Germany, Singapore, etc.), aiding overseas job assessments, remote work pricing, and relocation planning.',
  },
  {
    q: 'If my computed real hourly rate falls below the statutory minimum hourly wage, is my employer in violation?',
    a: 'There is a distinction between statutory working hours and commute time under labor law:\n\n① Statutory Wage Floor (Labor Standards Act Art. 21 & 24):\nContracted working hours divided into base wages must not fall below the national statutory minimum hourly wage. If an employer mandates uncompensated overtime without overtime pay (1.34x for the first 2 hours, 1.67x for subsequent hours), resulting in sub-minimum pay, it violates labor law.\n\n② Commute Time Distinction:\nStandard home-to-office commuting is not considered statutory working time unless traveling on employer-directed business dispatches or designated standby duty.',
  },
  {
    q: 'How can freelancers and project-based contractors utilize real hourly rates for project quotes?',
    a: 'Freelancers frequently fall into the trap of high headline revenue but low hourly returns:\n\n① Hidden Project Costs:\nIncludes pre-project discovery, client revision rounds, software licensing, and specialized gear amortizations.\n\n② Precision Quote Formula:\nUsing Project Mode: (Total Project Fee - Direct Out-of-Pocket Costs) ÷ (Core Dev Hours + Client Communication & Revision Hours) ensures healthy profit margins and sustainable pricing.',
  },
  {
    q: 'Are the real hourly rates and PR ranking benchmarks legally binding? (Statistical Disclaimer)',
    a: 'All real hourly rate computations, percentile ranks (PR), and global purchasing power simulations provided by this tool are statistical approximations based on public open data from DGBAS, OECD, and WID for personal career evaluation only.\n\nActual contractual wages, working hours, and labor conditions are governed by formal employment contracts and relevant labor legislation determinations.',
  },
]);

export default function HourlyRateCalculatorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <HourlyRateCalculatorClient lang="en" />
    </>
  );
}

import type { Metadata } from 'next';
import ResignationCalculatorClient from '../ResignationCalculatorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Resignation & Notice Period Calculator - Free Taiwan Labor Law Tool',
  description:
    'Calculate official notice periods, last working days, resignation effective dates, and unused annual leave payouts based on Article 16 of the Taiwan Labor Standards Act.',
  keywords: 'resignation calculator, notice period Taiwan, Labor Standards Act Article 16, last working day, effective resignation date, annual leave payout',
  alternates: {
    canonical: 'https://tools.cjkuo.net/resignation-calculator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/resignation-calculator/',
      en: 'https://tools.cjkuo.net/resignation-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/resignation-calculator/en/',
    },
  },
  openGraph: {
    title: 'Resignation & Notice Period Calculator - Free Taiwan Labor Law Tool',
    description: 'Calculate official notice periods, last working days, and effective dates in Taiwan.',
    url: 'https://tools.cjkuo.net/resignation-calculator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Resignation & Notice Period Calculator - Taiwan Labor Law Tool',
    description: 'Calculate official notice periods, last working days, and effective dates in Taiwan.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Resignation & Notice Period Calculator',
  url: 'https://tools.cjkuo.net/resignation-calculator/en/',
  description: 'Calculate official notice periods, last working days, and effective dates based on Taiwan Labor Law.',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'Does the Taiwan resignation notice period include weekends and public holidays?',
    a: 'Yes. According to Ministry of Labor rulings and Taiwan judicial precedents, notice periods are calculated in calendar days (including weekends, National Holidays, and rest days). For example, a 10-day notice period consists of 10 consecutive calendar days starting from the day AFTER notice is given.',
  },
  {
    q: 'How are the notice start date, last working day, and effective resignation date calculated?',
    a: `Based on Taiwan Labor Standards Act (LSA) Article 16:

① Notice Date: The day you officially notify your employer (manager/HR).
② Notice Start Date: LSA uses Civil Code Art. 120 (first day excluded). Notice begins on the day AFTER notification.
③ Last Working Day: The final contractual employment date when the required notice days are fully satisfied.
④ Effective Resignation Date: The day AFTER the last working day, on which labor and health insurance policies are officially canceled/transferred.`,
  },
  {
    q: 'Can the official last working day be a weekend or national holiday? How does it differ from the last office day?',
    a: `Yes! The contractual last working day can fall on a weekend or public holiday.

Distinctions between key date concepts:
① Actual Last Office Day: The last day you physically attend the office and provide labor (e.g. Friday).
② Contractual Last Working Day: The last official day your employment contract remains active (can be set to Sunday), with salary and insurance calculated until 24:00 that day.
③ Effective Resignation Date: The date employment is officially terminated and insurance is canceled (the day after the last working day, e.g. Monday).`,
  },
  {
    q: 'If I have unused annual leave, do I have to work on my last day?',
    a: `No! As long as handovers are complete, you can take statutory annual leave on your final working day.

Options for handling annual leave:
① Taking Leave: You may take annual leave during the notice period (including the last day). You do not need to attend office on leave days, while salary and insurance remain valid through the last working day.
② Cashing Out: If you choose not to take leave, LSA Art. 38(4) mandates that employers must cash out 100% of unused annual leave days upon contract termination.`,
  },
  {
    q: 'Do employees with less than 3 months of tenure need to give notice? Does resignation require employer approval?',
    a: `Probation and resignation approval rules:

① Tenure < 3 Months: Under LSA Article 16, no statutory notice period is required for employment under 3 months.
② Employer Approval: Resignation is a unilateral right under Taiwan law. Once you give proper notice (via email or message), resignation takes effect automatically upon the end date without requiring approval.`,
  },
  {
    q: 'Who is entitled to paid Job-Seeking Leave during the notice period?',
    a: 'Under LSA Article 16(2), paid job-seeking leave (up to 2 days per week with full salary) applies ONLY when the employer terminates the employee (involuntary severance). Voluntary resignations do not qualify for paid job-seeking leave.',
  },
  {
    q: 'What happens if an employee fails to provide sufficient notice?',
    a: 'The employment contract still terminates on the announced date. However, if early departure causes direct, proven financial damages to the business (e.g. operational shutdown), the employer may seek civil compensation under Taiwan Civil Code. It is highly recommended to satisfy notice requirements or negotiate a mutual release.',
  },
  {
    q: 'What documents should I request from HR upon leaving?',
    a: `Ensure you request:

① Certificate of Service / Employment Certificate (LSA Art. 19 mandates employers cannot refuse issuing this).
② Health Insurance Cancellation/Transfer Form.
③ Voluntary Pension Contribution confirmation & Tax Withholding Statements.`,
  },
  {
    q: 'How is prorated salary calculated if resignation takes effect early? What if the employer asks me to leave earlier than the notice period ends? Must salary be paid on the final day?',
    a: `Salary calculations and worker rights for early departure:

① Prorated Salary Calculation: For monthly-salaried employees who work a partial month, salary must be calculated based on actual calendar days employed in that month (including working days, rest days, and statutory holidays). Employers CANNOT deduct pay for rest days and weekends.
② Effective Departure Date: The resignation date is the actual final date of employment. If both parties agree to end early, salary and labor/health insurance cancellation apply to that actual final day.
③ Employer Demanding Early Departure: If the employer requests the employee to leave earlier than the full notice period, the employer MUST pay notice compensation ("notice pay") for the remaining notice days under LSA Art. 16.
④ Salary Payday Regulations: Final month salary does not have to be paid in cash on the last day. The employer may disburse it on the scheduled regular payday. Employers CANNOT withhold pay under the pretext of incomplete handovers.`,
  },
]);

export default function EnglishResignationCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <ResignationCalculatorClient lang="en" />
    </>
  );
}

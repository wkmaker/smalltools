import type { Metadata } from 'next';
import MySalaryCalculatorClient from '../MySalaryCalculatorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Taiwan Salary & Tax Calculator - Free Online Net Pay & Employer Cost Calculator',
  description:
    'Free online Taiwan salary, labor insurance, health insurance & pension calculator. Supports up-to-date brackets, take-home pay, tax withholding, and employer total cost breakdowns.',
  keywords: 'Taiwan salary calculator, Taiwan labor insurance, Taiwan health insurance, take home pay Taiwan, labor pension Taiwan',
  alternates: {
    canonical: 'https://tools.cjkuo.net/my-salary-calculator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/my-salary-calculator/',
      en: 'https://tools.cjkuo.net/my-salary-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/my-salary-calculator/en/',
    },
  },
  openGraph: {
    title: 'Taiwan Salary & Tax Calculator - Free Online Net Pay & Employer Cost Calculator',
    description: 'Calculate Taiwan labor insurance, health insurance, tax withholding, net salary, and total employer labor cost.',
    url: 'https://tools.cjkuo.net/my-salary-calculator/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taiwan Salary & Tax Calculator - Free Online Net Pay & Employer Cost Calculator',
    description: 'Calculate Taiwan labor insurance, health insurance, tax withholding, net salary, and total employer labor cost.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Taiwan Salary & Tax Calculator',
  url: 'https://tools.cjkuo.net/my-salary-calculator/en/',
  description: 'Free online Taiwan salary, labor insurance, health insurance & pension calculator.',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'The monthly meal allowance ($3,000 TWD) is tax-exempt for income tax. Must it be included when declaring Labor and Health Insurance salary brackets?',
    a: 'Yes, it must be fully included! Income tax exemptions and statutory labor insurance wages operate under different legal definitions:\n\n① Income Tax Exemption Perspective (Tax Law):\nUnder Ministry of Finance regulations, employer-provided monthly meal allowances up to $3,000 TWD per employee are exempt from personal consolidated income tax, serving as a statutory tax benefit for workers.\n\n② "Regular Remuneration" under the Labor Standards Act (Labor Law):\nAccording to Article 2 of the Labor Standards Act, any payment granted to workers for work performed on a regular, recurring basis (including base salary, fixed duty allowances, meal allowances, and attendance bonuses) legally constitutes "wage/salary."\n\n③ Meal Allowances Cannot Be Excluded from Social Insurance:\nWhen reporting declared salary brackets for Labor Insurance, National Health Insurance, and mandatory 6% Labor Pension contributions, the base must be the full agreed monthly remuneration (Base + Meal Allowance + Fixed Allowances). Excluding the $3,000 TWD meal allowance constitutes unlawful "underreporting of insured salary," subjecting employers to administrative fines and depriving workers of their full statutory pension and benefit rights.',
  },
  {
    q: 'How are Taiwan Labor Insurance and National Health Insurance calculated? What are the contribution shares?',
    a: 'Taiwan statutory social insurance premium rates and cost-sharing ratios among employees, employers, and government are as follows:\n\n① Labor Insurance (Ordinary Risk 11% + Employment Insurance 1% = 12% total):\nEmployee pays 20%, employer pays 70%, and government subsidizes 10%. Formula: Insured Salary Bracket × 12% × 20%.\n\n② National Health Insurance (Current rate 5.17%):\nEmployee pays 30% (including eligible dependents, capped at 3 dependents), employer pays 60% (factoring in statutory average dependent coefficient of 0.56), and government subsidizes 10%. Formula: Insured Health Bracket × 5.17% × 30% × (1 + Dependents Count).\n\n③ Salary Bracket System:\nContributions are determined by mapping gross monthly salary to official government tiered wage brackets rather than direct multiplication of gross earnings.',
  },
  {
    q: 'How are Health Insurance Dependents charged? What happens if an employee has more than 3 dependents?',
    a: 'Health insurance dependent billing and statutory protection caps operate as follows:\n\n① Dependent Coverage Principle:\nNon-working spouses, direct ascendants (parents, grandparents), and minor/dependent children enrolled under the primary insured employee are each charged one full employee health insurance contribution.\n\n② 3-Dependent Statutory Cap (National Health Insurance Act Article 18):\nTo alleviate the financial burden on larger families, statutory dependent charges are strictly capped at 3 dependents. If an employee has 4 or more dependents, all dependents from the 4th onward receive free coverage. The maximum deduction is strictly limited to 4 units (Employee + 3 Dependents).',
  },
  {
    q: 'What is Voluntary Labor Pension Self-Contribution (0% to 6%)? What are the tax and retirement benefits?',
    a: 'Voluntary labor pension self-contribution provides significant dual financial benefits:\n\n① Immediate Income Tax Deduction:\nEmployees can voluntarily contribute between 1% and 6% of their monthly wage into their individual pension account. The entire self-contributed amount is 100% tax-deductible from gross annual personal consolidated income, offering meaningful tax savings for higher tax bracket earners.\n\n② Dedicated Portable Account & Guaranteed Return:\nContributions are deposited into the employee\'s individual retirement account with the Bureau of Labor Insurance. The account is fully portable across employers and guarantees a statutory return rate no lower than the 2-year bank fixed deposit interest rate.',
  },
  {
    q: 'How is Monthly Salary Withholding Tax calculated? What are the standard withholding methods?',
    a: 'Income tax withholding on monthly employment earnings operates under Ministry of Finance regulations:\n\n① MOF Tax Withholding Table (Matrix Lookup):\nTax is withheld according to official monthly salary tax withholding tables based on taxable earnings and claimed dependents count. If earnings fall below the minimum withholding threshold (e.g., ~$88,501 TWD for single filers with zero dependents), zero tax is withheld.\n\n② Fixed 5% Withholding Rate:\nIf requested or without exemption filings, a flat 5% rate is applied. Under statutory threshold rules, if the computed tax is under 2,000 TWD (monthly salary below ~40,000 TWD), no withholding is required.\n\n③ Annual Tax Reconciliation:\nAll monthly withheld taxes are credited on annual tax returns filed in May, where excess deductions are refunded and underpayments settled.',
  },
  {
    q: 'What is the Employer Total Labor Cost for hiring an employee in Taiwan?',
    a: 'An employer\'s statutory labor cost for hiring a full-time employee in Taiwan is significantly higher than gross agreed wages:\n\n① Gross Monthly Salary:\nAgreed contract wage paid to the employee (including base salary, fixed allowances, and performance bonuses).\n\n② Mandatory Statutory Employer Contributions:\nIncludes employer labor insurance share (70%), employer health insurance share (60% × 1.56 dependent factor), occupational accident insurance, and mandatory 6% labor pension contributions (legally funded entirely by the employer and never deducted from worker wages).\n\n③ Total Cost Ratio:\nTotal employer labor expense typically equates to approximately 115% to 120% of the employee\'s gross monthly salary.',
  },
  {
    q: 'How do statutory minimum wage increases affect Labor and Health Insurance brackets?',
    a: 'When the government officially raises the national statutory minimum wage, social insurance bracket tables automatically adjust:\n\n① Bottom Bracket Upward Adjustment:\nThe Ministry of Labor and Ministry of Health and Welfare adjust Tier 1 of their respective insurance tables to match the new minimum wage floor.\n\n② Automatic Coverage Realignment:\nWorkers earning at or below minimum wage are automatically mapped to the new base tier, slightly adjusting deductions while elevating benefit protection ceilings (e.g., maternity benefits, injury compensations, and pension accruals).',
  },
  {
    q: "Are the salary calculator's computations legally binding? (Legal & Tax Disclaimer)",
    a: 'All payroll calculations, net pay figures, insurance contribution amounts, and employer overhead totals generated by this calculator are mathematical simulations based on published Taiwan statutory regulations for personal verification and budgeting purposes only.\n\nActual monthly net salaries, deductions, and tax withholdings are governed strictly by formal pay slips issued by employing enterprises and official determinations from administrative authorities (Bureau of Labor Insurance, National Health Insurance Administration, and National Taxation Bureau).',
  },
]);

export default function MySalaryCalculatorEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <MySalaryCalculatorClient lang="en" />
    </>
  );
}

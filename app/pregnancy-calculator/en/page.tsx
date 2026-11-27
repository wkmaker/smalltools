import type { Metadata } from 'next';
import PregnancyCalculatorClient from '../PregnancyCalculatorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: { absolute: 'Pregnancy & Maternity Leave Calculator - Due Date, Milestones & Statutory Leave Estimator | Online Toolbox' },
  description:
    'Free online pregnancy and maternity leave calculator. Calculate estimated due date (EDD), gestational age, 40-week clinical checkup milestones, fetal development size benchmarks, statutory maternity leave duration, and parental leave allowance.',
  keywords: 'pregnancy calculator, due date calculator, maternity leave, gestational age, ultrasound dating, ivf due date, pregnancy milestones, hospital bag checklist',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pregnancy-calculator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pregnancy-calculator/',
      en: 'https://tools.cjkuo.net/pregnancy-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/pregnancy-calculator/en/',
    },
  },
  openGraph: {
    title: 'Pregnancy & Maternity Leave Calculator - Due Date & Benefits Estimator',
    description: 'Calculate due date, pregnancy milestones, fetal growth benchmarks, and statutory maternity benefits.',
    url: 'https://tools.cjkuo.net/pregnancy-calculator/en/',
    siteName: 'Online Toolbox',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Pregnancy & Maternity Leave Calculator',
    description: 'Calculate due date, pregnancy milestones, fetal growth benchmarks, and statutory maternity benefits.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Pregnancy & Maternity Leave Calculator',
  url: 'https://tools.cjkuo.net/pregnancy-calculator/en/',
  description: 'Online pregnancy and maternity leave calculator for due dates, milestones, and statutory benefits.',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: 'How is the Estimated Due Date (EDD) calculated? Why do actual delivery dates vary?',
    a: 'The most common standard is Naegele\'s Rule: 280 days (40 weeks) from the first day of the last menstrual period (LMP), assuming a 28-day cycle.\n\nOnly about 5% of babies are born precisely on their due date. Delivery between 37 and 42 weeks is considered full term. Ultrasound measurements (crown-rump length) in the first trimester are often used to refine the due date.',
  },
  {
    q: 'There are so many prenatal checkup items—do I really need to do every single one?',
    a: 'When facing numerous public and optional self-paid prenatal tests, parents-to-be can evaluate their choices through two core principles:\n\n① First Priority: Respect Your Doctor\'s Professional Judgment\nEvery pregnancy differs by maternal age, medical history, and fetal condition. Your OB-GYN\'s clinical judgment is paramount and must always be respected first. Discuss directly with your doctor which tests are medically necessary for your stage.\n\n② Practical Consideration: Assess What You Can Financially Afford\nBeyond government-funded routine checkups, advanced optional screenings (such as NIPT, detailed Level II anatomy ultrasound, or genetic panels) can be expensive. Weigh these options thoughtfully based on what your household budget can comfortably afford.\n\n[Personal Experience]\nFrom my own experience, doing all these prenatal tests admittedly cost quite a lot of money—yet I am genuinely glad we did them, because they helped us catch several issues early on so we could resolve them in time. Ultimately, prenatal testing is just like buying insurance: the best outcome is that nothing is wrong, but it is also one of the best ways to detect and reduce potential problems early.',
  },
  {
    q: 'How many days of paid prenatal checkup leave are granted by law?',
    a: 'Under Taiwan Act of Gender Equality in Employment Article 15:\n\n① Duration: General employees are entitled to 7 days of fully paid prenatal checkup leave (civil servants receive 8 days of pre-maternity leave).\n② Wage: Full salary is paid during checkup leave.\n③ Flexibility & 2027 Update: Checkup leave can be taken in full days, half days, or hours, and under the 2027 amendment any unused days may be taken on workdays following maternity leave.',
  },
  {
    q: 'Does the 2027 14-week (98-day) maternity leave include weekends and holidays?',
    a: 'Yes. Under the amendment passed on Nov 13, 2026 (effective Jan 1, 2027), statutory maternity leave is extended from 8 weeks (56 days) to 14 consecutive weeks (98 calendar days), including weekends and holidays.\n\nThe first 8 weeks are mandatory for postpartum recovery, while weeks 9-14 allow voluntary early return to work. Employees with 6+ months of tenure receive 100% wages (50% under 6 months), with employer subsidies for weeks 9-14. For legacy 8-week leave or enhanced company policies, use the Custom Adjustment input (-42 or any positive/negative days).',
  },
  {
    q: 'How many days of paid paternity / partner leave are available under the 2027 rules?',
    a: 'Under the 2027 amendment, spouses and partners are entitled to 14 days (doubled from 7 days) of fully paid paternity and prenatal checkup companion leave, with government wage subsidies for the added days.',
  },
  {
    q: 'What is the maternity insurance cash benefit and top-up subsidy?',
    a: 'Insured working mothers with at least 280 days of labor insurance prior to delivery (181 days for premature birth) receive a lump-sum grant equal to 2 months (60 days) of average monthly insured salary. Eligible ROC nationals also receive an automatic government top-up bringing the combined benefit to TWD 100,000 per birth (scaled proportionally for twins or more).',
  },
  {
    q: 'How do the 2027 parental leave rules and 6+3 allowance work?',
    a: 'Under the 2027 amendments:\n\n① Age Limit Expanded: Parents may apply for up to 2 years of parental leave before the child turns 9 (previously age 3).\n② 60-Day Flexible Childcare Leave: Up to 60 days per year per child can be taken on a daily basis without breaking seniority.\n③ 6+3 Allowance: Eligible parents receive 80% of average insured wages (60% employment insurance + 20% subsidy) for 6 months each; once both parents complete 6 months, each may extend for 3 more months (up to 18 months combined).',
  },
  {
    q: 'Are the statutory maternity leave and subsidy calculations applicable outside Taiwan?',
    a: 'The default leave entitlements (7 days prenatal checkup leave, 2027 14-week maternity leave, 14 days partner leave), maternity cash benefits (2 months + top-up to TWD 100,000), and 6+3 parental leave allowance are based on the latest labor laws of Taiwan (R.O.C.).\n\n[Medical Timelines & Milestones] The due date estimation, fetal growth size comparisons, and 40-week clinical ultrasound milestones follow universal obstetric standards and are globally applicable.\n\n[Leaves & Government Benefits] If you reside outside Taiwan or have enhanced company policies, you can use the Custom Maternity Leave Adjustment field to add or subtract days. Always verify official eligibility with your local labor authority.',
  },
  {
    q: 'Why was this pregnancy calculator developed? A message from the developer to parents-to-be [Warm Wishes]',
    a: 'When first stepping into the journey of pregnancy and prenatal care, facing intricate clinical milestones and statutory leave policies can feel overwhelming, and it is completely normal to feel uncertain about what to do next. I built this tool hoping to organize clear timelines, fetal growth milestones, and maternity benefits so we can all navigate this journey with peace of mind and grow together.\n\nI will continue refining and expanding this tool based on ongoing experiences and community feedback. Wishing all couples and families a smooth, joyful journey and the safe arrival of a happy, healthy baby!',
  },
]);

export default function PregnancyCalculatorEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <PregnancyCalculatorClient lang="en" />
    </>
  );
}

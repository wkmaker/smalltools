import type { Metadata } from 'next';
import PregnancyCalculatorClient from '../PregnancyCalculatorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Pregnancy & Maternity Leave Calculator - Due Date, Milestones & Statutory Leave Estimator',
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
    images: [{ url: '/support.svg' }],
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
    q: 'How many days of paid prenatal checkup leave are granted by law?',
    a: 'Under gender equality labor laws (such as Taiwan Act of Gender Equality in Employment Article 15):\n\n① Duration: Female employees are entitled to 8 days of paid prenatal checkup leave.\n② Wage: Full salary is paid during checkup leaves.\n③ Flexibility: Checkup leave can be taken in increments of full days, half days, or hours.',
  },
  {
    q: 'Does the 8-week (56-day) maternity leave include weekends and holidays?',
    a: 'Yes, statutory 8-week maternity leave is counted in consecutive calendar days (56 days), including weekends and national holidays.\n\nEmployees with more than 6 months of tenure receive 100% full regular wages, while those with less than 6 months receive 50% wages.',
  },
  {
    q: 'How many days of paid paternity / partner leave are available?',
    a: 'Partners and spouses are entitled to 7 days of fully paid paternity and pregnancy checkup companion leave to support prenatal care and childbirth recovery.',
  },
  {
    q: 'What is the maternity insurance cash benefit and who qualifies?',
    a: 'Insured working mothers who have maintained active labor insurance for at least 280 days prior to delivery receive a lump-sum grant equivalent to 2 full months (60 days) of average monthly insured salary.',
  },
  {
    q: 'How does the 80% parental leave allowance work?',
    a: 'Eligible parents taking leave of absence to care for children under 3 years old receive up to 6 months of allowance at 80% of average insured wages (60% employment insurance + 20% government subsidy). Both parents can now apply concurrently.',
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

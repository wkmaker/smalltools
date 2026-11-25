import type { Metadata } from 'next';
import TaiwanIdGeneratorClient from '../TaiwanIdGeneratorClient';
import { TRANSLATIONS } from '../translations';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: {
    absolute:
      'Taiwan National ID Generator & Validator - Free Online Mock ID & ARC Tool | Online Toolbox',
  },
  description:
    'Free client-side Taiwan National ID and New/Legacy Resident Certificate (ARC) generator and validator. Filter by 26 counties and gender, batch export TXT/CSV/JSON, and inspect checksum weights for QA testing.',
  keywords:
    'Taiwan ID generator,Taiwan National ID validator,Taiwan ARC generator,new UI number Taiwan,checksum validator,QA test data,mock Taiwan ID',
  alternates: {
    canonical: 'https://tools.cjkuo.net/taiwan-id-generator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/taiwan-id-generator/',
      en: 'https://tools.cjkuo.net/taiwan-id-generator/en/',
      'x-default': 'https://tools.cjkuo.net/taiwan-id-generator/en/',
    },
  },
  openGraph: {
    title: 'Taiwan National ID Generator & Validator - Free Online Mock ID & ARC Tool',
    description:
      'Pure client-side Taiwan National ID and New/Legacy Resident ID generator & validator with batch export and checksum breakdown.',
    url: 'https://tools.cjkuo.net/taiwan-id-generator/en/',
    siteName: 'Online Toolbox',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Taiwan National ID Generator & Validator - Free Online Mock ID & ARC Tool',
    description:
      'Pure client-side Taiwan National ID and New/Legacy Resident ID generator & validator with batch export and checksum breakdown.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Taiwan National ID Generator & Validator',
  url: 'https://tools.cjkuo.net/taiwan-id-generator/en/',
  description:
    'Pure client-side generator and validator for Taiwan National ID and New/Legacy Resident Certificate numbers with batch export and checksum breakdown.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema(TRANSLATIONS.en.faqItems);

export default function TaiwanIdGeneratorEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }}
      />
      <TaiwanIdGeneratorClient lang="en" />
    </>
  );
}

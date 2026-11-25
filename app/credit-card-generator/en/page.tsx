import type { Metadata } from 'next';
import CreditCardGeneratorClient from '../CreditCardGeneratorClient';
import { TRANSLATIONS } from '../translations';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: {
    absolute:
      'Test Credit Card Generator & Luhn Validator - Random Mock Cards for QA Testing | Online Toolbox',
  },
  description:
    'Free client-side random test credit card generator and Luhn (Mod 10) validator. Multi-select Visa, Mastercard, JCB, Amex, UnionPay, and Discover, customize BIN prefixes, and export batches. Randomly generated for QA/dev testing only — not real working cards.',
  keywords:
    'test credit card generator,Luhn validator,Luhn algorithm,Visa test card,Mastercard test card,Stripe test cards,BIN generator,QA payment testing,mock credit card',
  alternates: {
    canonical: 'https://tools.cjkuo.net/credit-card-generator/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/credit-card-generator/',
      en: 'https://tools.cjkuo.net/credit-card-generator/en/',
      'x-default': 'https://tools.cjkuo.net/credit-card-generator/en/',
    },
  },
  openGraph: {
    title: 'Test Credit Card Generator & Luhn Validator - Random Mock Cards for QA',
    description:
      'Pure client-side random test credit card generator & Luhn validator supporting 6 networks, custom BIN prefixes, and sandbox test card quick lookup.',
    url: 'https://tools.cjkuo.net/credit-card-generator/en/',
    siteName: 'Online Toolbox',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Test Credit Card Generator & Luhn Validator - Random Mock Cards for QA',
    description:
      'Pure client-side random test credit card generator & Luhn validator supporting 6 networks, custom BIN prefixes, and sandbox test card quick lookup.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Test Credit Card Generator & Luhn Validator',
  url: 'https://tools.cjkuo.net/credit-card-generator/en/',
  description:
    'Pure client-side random test credit card generator and Luhn algorithm validator for QA and software development. Randomly generated only — not real working cards.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqJsonLd = generateFaqSchema(TRANSLATIONS.en.faqItems);

export default function CreditCardGeneratorEnPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }}
      />
      <CreditCardGeneratorClient lang="en" />
    </>
  );
}

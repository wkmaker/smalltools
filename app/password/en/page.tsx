import type { Metadata } from 'next';
import PasswordGeneratorClient from '../PasswordGeneratorClient';

export const metadata: Metadata = {
  title: 'Secure Password Generator - Free Online CSPRNG Random Password Tool',
  description:
    'Free online CSPRNG cryptographically secure password generator! Customize length, uppercase/lowercase letters, digits, and symbols with live entropy evaluation.',
  keywords: 'Password Generator,CSPRNG,secure password,random password generator,strong password,password strength',
  alternates: {
    canonical: 'https://tools.cjkuo.net/password/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/password/',
      en: 'https://tools.cjkuo.net/password/en/',
      'x-default': 'https://tools.cjkuo.net/password/en/',
    },
  },
  openGraph: {
    title: 'Secure Password Generator - Free Online CSPRNG Random Password Tool',
    description: 'Cryptographically secure client-side password generator with live strength analysis.',
    url: 'https://tools.cjkuo.net/password/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Secure Password Generator - Free Online CSPRNG Random Password Tool',
    description: 'Cryptographically secure client-side password generator with live strength analysis.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Secure Password Generator',
  url: 'https://tools.cjkuo.net/password/en/',
  description: 'Free online cryptographically secure CSPRNG random password generator.',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function PasswordEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PasswordGeneratorClient lang="en" />
    </>
  );
}

import type { Metadata } from 'next';
import UrlEncoderClient from '../UrlEncoderClient';

export const metadata: Metadata = {
  title: 'URL Encoder & Decoder - Free Online encodeURIComponent Tool',
  description:
    'Free online URL encoder and decoder tool! Supports encodeURIComponent and decodeURIComponent with instant bidirectional query parameter breakdown.',
  keywords: 'URL Encoder,URL Decoder,encodeURIComponent,decodeURIComponent,URL encode,percent encoding',
  alternates: {
    canonical: 'https://tools.cjkuo.net/url/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/url/',
      en: 'https://tools.cjkuo.net/url/en/',
    },
  },
  openGraph: {
    title: 'URL Encoder & Decoder - Free Online encodeURIComponent Tool',
    description: 'Fast client-side URL encoder and decoder supporting Unicode & query parameter breakdown.',
    url: 'https://tools.cjkuo.net/url/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'URL Encoder & Decoder - Free Online encodeURIComponent Tool',
    description: 'Fast client-side URL encoder and decoder supporting Unicode & query parameter breakdown.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'URL Encoder & Decoder',
  url: 'https://tools.cjkuo.net/url/en/',
  description: 'Free online URL encoder and decoder tool with query parameter table editing.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function UrlEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <UrlEncoderClient lang="en" />
    </>
  );
}

import type { Metadata } from 'next';
import Base64Client from '../Base64Client';

export const metadata: Metadata = {
  title: 'Base64 Encoder & Decoder - Free Online Text & URL-Safe Base64 Converter',
  description:
    'Free online Base64 encoder and decoder tool! Supports UTF-8 Chinese characters, URL-Safe format, instant bidirectional conversion, and file preview/conversion.',
  keywords: 'Base64,Base64 encoder,Base64 decoder,Base64 converter,URL Safe Base64,UTF-8 Base64,online Base64',
  alternates: {
    canonical: 'https://tools.cjkuo.net/base64/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/base64/',
      en: 'https://tools.cjkuo.net/base64/en/',
      'x-default': 'https://tools.cjkuo.net/base64/en/',
    },
  },
  openGraph: {
    title: 'Base64 Encoder & Decoder - Free Online Text & URL-Safe Base64 Converter',
    description: 'Fast client-side Base64 encoder and decoder tool supporting UTF-8 & URL-Safe modes.',
    url: 'https://tools.cjkuo.net/base64/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Base64 Encoder & Decoder - Free Online Text & URL-Safe Base64 Converter',
    description: 'Fast client-side Base64 encoder and decoder tool supporting UTF-8 & URL-Safe modes.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Base64 Encoder & Decoder',
  url: 'https://tools.cjkuo.net/base64/en/',
  description: 'Free online Base64 encoder and decoder tool, supporting UTF-8 and URL-Safe formats.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function Base64EnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Base64Client lang="en" />
    </>
  );
}

import type { Metadata } from 'next';
import JsonFormatterClient from '../JsonFormatterClient';

export const metadata: Metadata = {
  title: 'JSON Formatter & Validator - Free Online JSON Beautifier & Minifier',
  description:
    'Free online JSON formatter, validator, beautifier, and minifier tool! Features syntax error positioning, tree view, indentation options, and file export.',
  keywords: 'JSON Formatter,JSON Validator,JSON Beautifier,JSON Minifier,JSON syntax check,JSON parser',
  alternates: {
    canonical: 'https://tools.cjkuo.net/json/en/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/json/',
      en: 'https://tools.cjkuo.net/json/en/',
      'x-default': 'https://tools.cjkuo.net/json/en/',
    },
  },
  openGraph: {
    title: 'JSON Formatter & Validator - Free Online JSON Beautifier & Minifier',
    description: 'Fast client-side JSON formatting tool with live syntax linting and interactive tree view.',
    url: 'https://tools.cjkuo.net/json/en/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON Formatter & Validator - Free Online JSON Beautifier & Minifier',
    description: 'Fast client-side JSON formatting tool with live syntax linting and interactive tree view.',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'JSON Formatter & Validator',
  url: 'https://tools.cjkuo.net/json/en/',
  description: 'Free online JSON formatter, validator, beautifier, and minifier tool.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function JsonEnPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <JsonFormatterClient lang="en" />
    </>
  );
}

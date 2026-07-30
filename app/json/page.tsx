import type { Metadata } from 'next';
import JsonFormatterClient from './JsonFormatterClient';

export const metadata: Metadata = {
  title: 'JSON 格式化與驗證器 - 免費線上 JSON Formatter & Validator',
  description:
    '專業免費的線上 JSON 格式化、縮排、驗證與美化工具！支援語法高亮、壓縮縮排與錯誤定位，純前端運算安全隱密。',
  keywords: 'JSON格式化,JSON Formatter,JSON驗證,JSON Validator,JSON美化,JSON壓縮,JSON排版',
  alternates: {
    canonical: 'https://tools.cjkuo.net/json/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/json/',
      en: 'https://tools.cjkuo.net/json/en/',
    },
  },
  openGraph: {
    title: 'JSON 格式化與驗證器 - 免費線上 JSON Formatter & Validator',
    description: '極速純前端 JSON 格式化工具，支援語法高亮與精準錯誤定位。',
    url: 'https://tools.cjkuo.net/json/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON 格式化與驗證器 - 免費線上 JSON Formatter & Validator',
    description: '極速純前端 JSON 格式化工具，支援語法高亮與精準錯誤定位。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'JSON 格式化與驗證器',
  url: 'https://tools.cjkuo.net/json/',
  description: '專業免費的線上 JSON 格式化與美化工具，支援語法驗證與壓縮。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function JsonPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <JsonFormatterClient />
    </>
  );
}

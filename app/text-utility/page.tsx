import type { Metadata } from 'next';
import TextUtilityClient from './TextUtilityClient';

export const metadata: Metadata = {
  title: '文字處理助手 - 免費線上字數統計、大小寫轉換與文字排版工具',
  description:
    '專業免費的線上文字處理助手！支援即時中英文/字元數/行數統計、大小寫轉換、去除重複行與多餘空白、正則替換等極速線上文字排版。',
  keywords: '字數統計,文字處理,大小寫轉換,文字排版,去除空白,去除重複行,線上文字工具,正則替換',
  alternates: {
    canonical: 'https://tools.cjkuo.net/text-utility/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/text-utility/',
      en: 'https://tools.cjkuo.net/text-utility/en/',
      'x-default': 'https://tools.cjkuo.net/text-utility/en/',
    },
  },
  openGraph: {
    title: '文字處理助手 - 免費線上字數統計、大小寫轉換與文字排版工具',
    description: '即時進行文字大小寫轉換、空白字元處理，與多維度中英文統計。',
    url: 'https://tools.cjkuo.net/text-utility/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '文字處理助手 - 免費線上字數統計、大小寫轉換與文字排版工具',
    description: '即時進行文字大小寫轉換、空白字元處理，與多維度中英文統計。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '文字處理助手',
  url: 'https://tools.cjkuo.net/text-utility/',
  description: '專業免費的線上文字處理與排版工具，支援大小寫轉換、空白清理與字數統計。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function TextUtilityPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TextUtilityClient />
    </>
  );
}

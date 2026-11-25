import type { Metadata } from 'next';
import TaiwanIdGeneratorClient from './TaiwanIdGeneratorClient';
import { TRANSLATIONS } from './translations';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '台灣身分證產生器與驗證器 - 免費線上國民身分證、新舊式居留證測試字號產生工具',
  description:
    '免費純前端台灣身分證字號產生器與驗證工具！支援國民身分證（1/2）、新式居留證（8/9）與舊式居留證（A–D），可指定 26 縣市與性別、批次匯出 TXT/CSV/JSON 並逐步拆解加權檢查碼演算法。',
  keywords:
    '台灣身分證產生器,身分證字號產生器,身分證驗證,居留證產生器,新式統一證號,外來人口統一證號,身分證檢查碼,測試假資料,Taiwan ID generator',
  alternates: {
    canonical: 'https://tools.cjkuo.net/taiwan-id-generator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/taiwan-id-generator/',
      en: 'https://tools.cjkuo.net/taiwan-id-generator/en/',
      'x-default': 'https://tools.cjkuo.net/taiwan-id-generator/en/',
    },
  },
  openGraph: {
    title: '台灣身分證產生器與驗證器 - 免費線上國民身分證與居留證測試工具',
    description:
      '純前端台灣身分證與新／舊式居留證產生及驗證器，支援縣市性別篩選、批次匯出與加權檢查碼拆解。',
    url: 'https://tools.cjkuo.net/taiwan-id-generator/',
  },
  twitter: {
    card: 'summary_large_image',
    title: '台灣身分證產生器與驗證器 - 免費線上國民身分證與居留證測試工具',
    description:
      '純前端台灣身分證與新／舊式居留證產生及驗證器，支援縣市性別篩選、批次匯出與加權檢查碼拆解。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '台灣身分證產生器與驗證器',
  url: 'https://tools.cjkuo.net/taiwan-id-generator/',
  description:
    '純前端台灣國民身分證字號與新／舊式外來人口統一證號產生及驗證工具，支援縣市性別篩選、批次匯出與檢查碼演算法拆解。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema(TRANSLATIONS['zh-TW'].faqItems);

export default function TaiwanIdGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }}
      />
      <TaiwanIdGeneratorClient lang="zh-TW" />
    </>
  );
}

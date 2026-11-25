import type { Metadata } from 'next';
import CreditCardGeneratorClient from './CreditCardGeneratorClient';
import { TRANSLATIONS } from './translations';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: '測試信用卡號產生器與 Luhn 驗證器 - 免費線上 Visa/Mastercard/JCB/Amex 隨機測試卡號工具',
  description:
    '純前端隨機測試信用卡號產生與 Luhn (Mod 10) 演算法驗證工具！支援多選 Visa、Mastercard、JCB、Amex、銀聯與 Discover、自訂 BIN 前綴與批次匯出。所有卡號皆為隨機產生、並非實際可用的信用卡，專供軟體開發與金流測試使用。',
  keywords:
    '測試信用卡號產生器,信用卡號產生器,Luhn驗證,Luhn演算法,Visa測試卡號,Mastercard測試卡號,JCB測試卡號,Amex測試卡號,Stripe測試卡號,金流測試,BIN產生器',
  alternates: {
    canonical: 'https://tools.cjkuo.net/credit-card-generator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/credit-card-generator/',
      en: 'https://tools.cjkuo.net/credit-card-generator/en/',
      'x-default': 'https://tools.cjkuo.net/credit-card-generator/en/',
    },
  },
  openGraph: {
    title: '測試信用卡號產生器與 Luhn 驗證器 - 僅供開發測試之隨機卡號工具',
    description:
      '純前端隨機測試信用卡號產生與 Luhn 驗證器，支援 6 大發卡組織多選、自訂 BIN 前綴、批次匯出與沙盒測試卡速查。',
    url: 'https://tools.cjkuo.net/credit-card-generator/',
  },
  twitter: {
    card: 'summary_large_image',
    title: '測試信用卡號產生器與 Luhn 驗證器 - 僅供開發測試之隨機卡號工具',
    description:
      '純前端隨機測試信用卡號產生與 Luhn 驗證器，支援 6 大發卡組織多選、自訂 BIN 前綴、批次匯出與沙盒測試卡速查。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '測試信用卡號產生器與 Luhn 驗證器',
  url: 'https://tools.cjkuo.net/credit-card-generator/',
  description:
    '純前端隨機測試信用卡號產生與 Luhn 演算法驗證工具，所有號碼皆為隨機產生、並非實際可用的信用卡，專供軟體開發與金流表單測試。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema(TRANSLATIONS['zh-TW'].faqItems);

export default function CreditCardGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }}
      />
      <CreditCardGeneratorClient lang="zh-TW" />
    </>
  );
}

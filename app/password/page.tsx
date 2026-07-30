import type { Metadata } from 'next';
import PasswordGeneratorClient from './PasswordGeneratorClient';

export const metadata: Metadata = {
  title: '高強度亂數密碼產生器 - 免費線上客製化密碼生成工具',
  description:
    '專業免費的線上高強度密碼產生器！支援自訂長度、大小寫英文字母、數字與特殊符號組合，即時計算密碼強度熵值 (Entropy)。',
  keywords: '密碼產生器,亂數密碼,高強度密碼,密碼生成器,Password Generator,隨機密碼',
  alternates: {
    canonical: 'https://tools.cjkuo.net/password/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/password/',
      en: 'https://tools.cjkuo.net/password/en/',
    },
  },
  openGraph: {
    title: '高強度亂數密碼產生器 - 免費線上客製化密碼生成工具',
    description: '安全純前端亂數密碼產生器，支援強度熵值評估與自訂字元組合。',
    url: 'https://tools.cjkuo.net/password/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '高強度亂數密碼產生器 - 免費線上客製化密碼生成工具',
    description: '安全純前端亂數密碼產生器，支援強度熵值評估與自訂字元組合。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '高強度亂數密碼產生器',
  url: 'https://tools.cjkuo.net/password/',
  description: '專業免費的線上客製化亂數密碼產生器，支援密碼強度熵值評估。',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function PasswordPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PasswordGeneratorClient />
    </>
  );
}

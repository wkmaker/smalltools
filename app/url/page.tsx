import type { Metadata } from 'next';
import UrlEncoderClient from './UrlEncoderClient';

export const metadata: Metadata = {
  title: 'URL 編碼解碼器 - 免費線上網址 encodeURIComponent 與 decodeURIComponent 工具',
  description:
    '專業免費的線上 URL 編碼與解碼工具！支援 encodeURIComponent 與 decodeURIComponent，即時轉換含中文與特殊符號之網址。',
  keywords: 'URL編碼,URL解碼,URL Encoder,URL Decoder,encodeURIComponent,decodeURIComponent,網址轉碼',
  alternates: {
    canonical: 'https://tools.cjkuo.net/url/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/url/',
      en: 'https://tools.cjkuo.net/url/en/',
    },
  },
  openGraph: {
    title: 'URL 編碼解碼器 - 免費線上網址 encodeURIComponent 與 decodeURIComponent 工具',
    description: '極速純前端 URL 編解碼工具，支援中文字元與查詢參數轉換。',
    url: 'https://tools.cjkuo.net/url/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'URL 編碼解碼器 - 免費線上網址 encodeURIComponent 與 decodeURIComponent 工具',
    description: '極速純前端 URL 編解碼工具，支援中文字元與查詢參數轉換。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'URL 編碼解碼器',
  url: 'https://tools.cjkuo.net/url/',
  description: '專業免費的線上 URL 編碼與解碼工具，支援中文與特殊字元轉換。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function UrlPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <UrlEncoderClient />
    </>
  );
}

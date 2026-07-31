import type { Metadata } from 'next';
import Base64Client from './Base64Client';

export const metadata: Metadata = {
  title: 'Base64 編碼解碼器 - 免費線上文字與 URL 安全 Base64 轉換工具',
  description:
    '專業免費的線上 Base64 編碼與解碼工具！支援 UTF-8 中文字元、URL Safe Safe-Base64 格式、即時雙向轉換與一鍵複製。',
  keywords: 'Base64,Base64編碼,Base64解碼,Base64轉換器,URL Safe Base64,UTF-8 Base64,線上Base64',
  alternates: {
    canonical: 'https://tools.cjkuo.net/base64/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/base64/',
      en: 'https://tools.cjkuo.net/base64/en/',
      'x-default': 'https://tools.cjkuo.net/base64/en/',
    },
  },
  openGraph: {
    title: 'Base64 編碼解碼器 - 免費線上文字與 URL 安全 Base64 轉換工具',
    description: '極速純前端 Base64 編解碼工具，支援中文字元 UTF-8 與 URL-Safe 模式。',
    url: 'https://tools.cjkuo.net/base64/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Base64 編碼解碼器 - 免費線上文字與 URL 安全 Base64 轉換工具',
    description: '極速純前端 Base64 編解碼工具，支援中文字元 UTF-8 與 URL-Safe 模式。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Base64 編碼解碼器',
  url: 'https://tools.cjkuo.net/base64/',
  description: '專業免費的線上 Base64 編碼與解碼工具，支援中文字元與 URL-Safe 格式。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function Base64Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Base64Client />
    </>
  );
}

import type { Metadata } from 'next';
import QrGeneratorClient from './QrGeneratorClient';

export const metadata: Metadata = {
  title: 'QR Code 產生器 - 免費線上藝術設計、Logo 內嵌與向量 SVG 輸出工具',
  description:
    '專業免費的線上藝術 QR Code 產生器！支援自訂點體樣式、雙色漸層、中央 Logo 拖曳內嵌、自動 30% 高容錯率及 PNG/SVG/WEBP 向量圖檔匯出。',
  keywords: 'QR Code產生器,QR Code製造機,藝術QR Code,QR Code Logo,向量QR Code,SVG QR Code,免費QR Code',
  alternates: {
    canonical: 'https://tools.cjkuo.net/qr-generator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/qr-generator/',
      en: 'https://tools.cjkuo.net/qr-generator/en/',
    },
  },
  openGraph: {
    title: 'QR Code 產生器 - 免費線上藝術設計、Logo 內嵌與向量 SVG 輸出工具',
    description: '即時設計您專屬的藝術 QR Code。支援液態點、漸層、Logo 置中與向量 SVG 輸出。',
    url: 'https://tools.cjkuo.net/qr-generator/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Code 產生器 - 免費線上藝術設計、Logo 內嵌與向量 SVG 輸出工具',
    description: '即時設計專屬藝術 QR Code，支援漸層、Logo 置中與向量 SVG 輸出。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Designer QR Code 產生器',
  url: 'https://tools.cjkuo.net/qr-generator/',
  description: '專業免費的藝術 QR Code 產生器，支援液態化點體、漸層色彩與中央 Logo 內嵌。',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function QrGeneratorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <QrGeneratorClient />
    </>
  );
}

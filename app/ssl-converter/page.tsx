import type { Metadata } from 'next';
import SslConverterClient from './SslConverterClient';

export const metadata: Metadata = {
  title: 'SSL 憑證格式轉換器 - 免費線上 PFX/P12/PEM/DER 憑證轉換與效能驗證工具',
  description:
    '專業免費的線上 SSL 憑證格式轉換工具！支援 PFX/P12, PEM, DER 雙向純前端安全轉換、憑證過期時間自動檢測與私鑰模數配對雜湊比對。',
  keywords: 'SSL憑證轉換,PFX轉PEM,PEM轉PFX,DER轉PEM,P12轉換,SSL憑證,私鑰轉換,憑證效期查詢',
  alternates: {
    canonical: 'https://tools.cjkuo.net/ssl-converter/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/ssl-converter/',
      en: 'https://tools.cjkuo.net/ssl-converter/en/',
      'x-default': 'https://tools.cjkuo.net/ssl-converter/en/',
    },
  },
  openGraph: {
    title: 'SSL 憑證格式轉換器 - 免費線上 PFX/P12/PEM/DER 憑證轉換與效能驗證工具',
    description: '純前端 SSL 憑證格式轉換工具，一鍵雙向轉換 PFX, PEM, DER，具備憑證效期警告。',
    url: 'https://tools.cjkuo.net/ssl-converter/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SSL 憑證格式轉換器 - 免費線上 PFX/P12/PEM/DER 憑證轉換與效能驗證工具',
    description: '純前端 SSL 憑證格式轉換工具，一鍵雙向轉換 PFX, PEM, DER，具備憑證效期警告。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'SSL 憑證格式轉換器',
  url: 'https://tools.cjkuo.net/ssl-converter/',
  description: '專業免費的純前端 SSL 憑證格式轉換工具，支援 PFX/P12, PEM, DER 憑證雙向安全轉換與私鑰配對驗證。',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function SslConverterPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <SslConverterClient />
    </>
  );
}

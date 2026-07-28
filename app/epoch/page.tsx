import type { Metadata } from 'next';
import EpochClient from './EpochClient';

export const metadata: Metadata = {
  title: 'Epoch 時間戳記轉換器 - 免費線上 Unix Timestamp 與日期雙向轉換工具',
  description:
    '專業免費的線上 Unix Epoch 時間戳記轉換工具！支援秒/毫秒自動判定、即時雙向轉換、台北時間/UTC/美西時間(PST)等多時區比較與歷史紀錄。',
  keywords: 'Epoch轉換器,Unix時間戳記,Timestamp轉換,時間戳記,Unix Epoch,時間轉換,秒轉日期,毫秒轉日期',
  alternates: {
    canonical: 'https://tools.cjkuo.net/epoch/',
  },
  openGraph: {
    title: 'Epoch 時間戳記轉換器 - 免費線上 Unix Timestamp 與日期雙向轉換工具',
    description: '專業免費的 Unix 時間戳記轉換工具，支援雙向即時轉換、多時區比較與歷史紀錄。',
    url: 'https://tools.cjkuo.net/epoch/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Epoch 時間戳記轉換器 - 免費線上 Unix Timestamp 與日期雙向轉換工具',
    description: '專業免費的 Unix 時間戳記轉換工具，支援雙向即時轉換、多時區比較與歷史紀錄。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Epoch 萬年時間戳記轉換器',
  url: 'https://tools.cjkuo.net/epoch/',
  description: '專業免費的線上 Unix Epoch 時間戳記轉換工具，支援秒與毫秒自動判定及多時區比較。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function EpochPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <EpochClient />
    </>
  );
}

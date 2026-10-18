import type { Metadata } from 'next';
import ContractionTimerClient from './ContractionTimerClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';
import { FAQ_ITEMS } from './translations';

export const metadata: Metadata = {
  title: '宮縮計時器 - 免費線上陣痛紀錄、宮縮頻率與規律計算工具',
  description:
    '免費線上宮縮計時器，按一下開始、再按一下停止，自動以最近 5 次宮縮算出多久痛一次、一次痛多久、規律程度與已維持多久，並繪製 6 小時趨勢圖，一鍵複製摘要傳給另一半。資料只存在本機、不上傳，6 小時後自動刪除。',
  keywords: '宮縮計時器,宮縮紀錄,陣痛計時,陣痛紀錄,宮縮頻率,宮縮間隔,規律宮縮,待產,產兆,contraction timer',
  alternates: {
    canonical: 'https://tools.cjkuo.net/contraction-timer/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/contraction-timer/',
      en: 'https://tools.cjkuo.net/contraction-timer/en/',
      'x-default': 'https://tools.cjkuo.net/contraction-timer/en/',
    },
  },
  openGraph: {
    title: '宮縮計時器 - 免費線上陣痛紀錄與宮縮規律計算',
    description: '一鍵計時宮縮，自動算出多久痛一次、痛多久、規律維持多久，並可一鍵複製摘要。',
    url: 'https://tools.cjkuo.net/contraction-timer/',
  },
  twitter: {
    card: 'summary_large_image',
    title: '宮縮計時器 - 免費線上陣痛紀錄與宮縮規律計算',
    description: '一鍵計時宮縮，自動算出多久痛一次、痛多久、規律維持多久，並可一鍵複製摘要。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '宮縮計時器',
  url: 'https://tools.cjkuo.net/contraction-timer/',
  description: '免費線上宮縮計時器，自動計算宮縮頻率、持續時間、規律程度與 6 小時趨勢，資料只存在本機。',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema(FAQ_ITEMS['zh-TW']);

export default function ContractionTimerPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <ContractionTimerClient lang="zh-TW" />
    </>
  );
}

import type { Metadata } from 'next';
import KickCounterClient from './KickCounterClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';
import { FAQ_ITEMS } from './translations';

export const metadata: Metadata = {
  title: '胎動計數器 - 免費線上數胎動、連環踢判定與寶寶活力紀錄工具',
  description:
    '免費線上胎動計數器！支援「數滿 10 次法 (Cardiff)」與「1 小時定時法 (Sadovsky)」，自動辨識 2 分鐘內連續動作為連環踢，精準計算醫學有效胎動波數與總踢擊數，繪製 14 天達標耗時活力走勢圖，並提供電話報備防慌照唸小抄。資料僅存本機無上傳。',
  keywords: '胎動計數器,數胎動,胎動記錄,胎動計算,連環踢,胎動次數,28週胎動,Cardiff,胎動減少,kick counter',
  alternates: {
    canonical: 'https://tools.cjkuo.net/kick-counter/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/kick-counter/',
      en: 'https://tools.cjkuo.net/kick-counter/en/',
      'x-default': 'https://tools.cjkuo.net/kick-counter/en/',
    },
  },
  openGraph: {
    title: '胎動計數器 - 免費線上數胎動與寶寶活力紀錄',
    description: '寶寶有動就按！自動標記連環踢，精算有效胎動波數與達標耗時，提供一鍵複製防慌小抄。',
    url: 'https://tools.cjkuo.net/kick-counter/',
  },
  twitter: {
    card: 'summary_large_image',
    title: '胎動計數器 - 免費線上數胎動與寶寶活力紀錄',
    description: '寶寶有動就按！自動標記連環踢，精算有效胎動波數與達標耗時，提供一鍵複製防慌小抄。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '胎動計數器',
  url: 'https://tools.cjkuo.net/kick-counter/',
  description: '免費線上胎動計數器，支援數滿 10 次與 1 小時定時法，自動標記連環踢並評估寶寶活力。',
  applicationCategory: 'HealthApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema(FAQ_ITEMS['zh-TW']);

export default function KickCounterPage() {
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
      <KickCounterClient lang="zh-TW" />
    </>
  );
}

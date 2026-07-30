import type { Metadata } from 'next';
import TimeClient from './TimeClient';

export const metadata: Metadata = {
  title: '線上目標計時器 - 免費倒數計時與時間累計工具',
  description:
    '唯美精緻的線上目標計時器與倒數工具！支援自訂事件標題、時分秒與年月日時顯示格式、全螢幕播放與一鍵複製分享連結。適用於考試倒數、紀念日與時間管理。',
  keywords: '目標計時器,倒數計時器,線上倒數,時間累計,考試倒數,紀念日倒數,時間管理工具,全螢幕計時器',
  alternates: {
    canonical: 'https://tools.cjkuo.net/time/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/time/',
      en: 'https://tools.cjkuo.net/time/en/',
    },
  },
  openGraph: {
    title: '線上目標計時器 - 免費倒數計時與時間累計工具',
    description: '唯美精緻的線上目標計時器與倒數工具，支援自訂事件名稱、顯示格式選擇與全螢幕展示。',
    url: 'https://tools.cjkuo.net/time/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '線上目標計時器 - 免費倒數計時與時間累計工具',
    description: '唯美精緻的線上目標計時器與倒數工具，支援自訂事件名稱、顯示格式選擇與全螢幕展示。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '線上目標計時器',
  url: 'https://tools.cjkuo.net/time/',
  description: '唯美精緻的線上目標計時器與倒數工具，支援自訂事件名稱、顯示格式選擇與全螢幕展示。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function TimePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <TimeClient />
    </>
  );
}

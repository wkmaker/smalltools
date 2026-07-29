import type { Metadata } from 'next';
import LuckyWheelClient from './LuckyWheelClient';

export const metadata: Metadata = {
  title: '幸運轉盤抽獎小工具 - 免費線上自訂轉盤與機率抽獎',
  description:
    '免費線上幸運轉盤抽獎小工具，支援靈活自訂獎項名稱、數量、機率權重與扇區顏色。提供全螢幕抽獎舞台、真實物理減速動畫與中獎歷史紀錄。',
  keywords: '轉盤抽獎,線上抽獎工具,幸運大轉盤,機率抽獎,全螢幕抽獎,尾牙抽獎,會議抽獎,免費轉盤',
  alternates: {
    canonical: 'https://tools.cjkuo.net/lucky-wheel/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/lucky-wheel/',
      en: 'https://tools.cjkuo.net/lucky-wheel/en/',
    },
  },
  openGraph: {
    title: '幸運轉盤抽獎小工具 - 免費線上自訂轉盤與機率抽獎',
    description: '免費線上轉盤抽獎工具，支援自訂獎項數量、權重比例與色彩，附帶真實物理旋轉動畫。',
    url: 'https://tools.cjkuo.net/lucky-wheel/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '幸運轉盤抽獎小工具 - 免費線上自訂轉盤與機率抽獎',
    description: '免費線上轉盤抽獎工具，支援自訂獎項數量、權重比例與色彩，附帶真實物理旋轉動畫。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '幸運轉盤抽獎小工具',
  url: 'https://tools.cjkuo.net/lucky-wheel/',
  description: '免費線上幸運轉盤抽獎小工具，支援靈活自訂獎項名稱、數量、權重與扇區顏色。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function LuckyWheelPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LuckyWheelClient lang="zh-TW" />
    </>
  );
}

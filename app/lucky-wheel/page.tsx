import type { Metadata } from 'next';
import LuckyWheelClient from './LuckyWheelClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';
import { TRANSLATIONS } from './translations';

export const metadata: Metadata = {
  title: '幸運轉盤抽獎小工具 - 免費線上自訂轉盤、尾牙雙抽與拉霸機',
  description:
    '免費線上幸運轉盤與拉霸機抽獎工具，支援尾牙獎項池雙抽、多人連抽、快速批次貼上名單、不在場放棄重抽、網址分享轉盤與全螢幕抽獎舞台。',
  keywords: '轉盤抽獎,線上抽獎工具,幸運大轉盤,尾牙抽獎,拉霸機抽獎,全螢幕抽獎,名單抽獎,免費轉盤',
  alternates: {
    canonical: 'https://tools.cjkuo.net/lucky-wheel/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/lucky-wheel/',
      en: 'https://tools.cjkuo.net/lucky-wheel/en/',
      'x-default': 'https://tools.cjkuo.net/lucky-wheel/en/',
    },
  },
  openGraph: {
    title: '幸運轉盤抽獎小工具 - 免費線上自訂轉盤、尾牙雙抽與拉霸機',
    description: '免費線上轉盤抽獎工具，支援尾牙雙抽模式、多人連抽、快速貼上名單、權重比例與全螢幕舞台。',
    url: 'https://tools.cjkuo.net/lucky-wheel/',
  },
  twitter: {
    card: 'summary_large_image',
    title: '幸運轉盤抽獎小工具 - 免費線上自訂轉盤、尾牙雙抽與拉霸機',
    description: '免費線上轉盤抽獎工具，支援尾牙雙抽模式、多人連抽、快速貼上名單、權重比例與全螢幕舞台。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '幸運轉盤抽獎小工具',
  url: 'https://tools.cjkuo.net/lucky-wheel/',
  description: '免費線上幸運轉盤抽獎小工具，支援靈活自訂獎項名稱、數量、權重、尾牙雙抽與批次名單貼上。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema(TRANSLATIONS['zh-TW'].faqItems);

export default function LuckyWheelPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <LuckyWheelClient lang="zh-TW" />
    </>
  );
}

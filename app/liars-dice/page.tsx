import type { Metadata } from 'next';
import LiarsDiceClient from './LiarsDiceClient';

export const metadata: Metadata = {
  title: '吹牛骰子搖骰器 - 防作弊計時器與歷史 5 次紀錄工具',
  description:
    '專為酒吧派對與好友聚會打造的吹牛骰子搖骰器！具備防作弊計時器，精確顯示距離最後一次搖骰過多久的分跟秒，並支援歷史前 5 次搖骰紀錄與骰杯遮擋功能。',
  keywords: '吹牛骰子,搖骰器,吹牛,骰子,防作弊,計時器,酒吧遊戲,派對遊戲,Liar\'s Dice,骰杯遮擋',
  alternates: {
    canonical: 'https://tools.cjkuo.net/liars-dice/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/liars-dice/',
      en: 'https://tools.cjkuo.net/liars-dice/en/',
      'x-default': 'https://tools.cjkuo.net/liars-dice/en/',
    },
  },
  openGraph: {
    title: '吹牛骰子搖骰器 - 防作弊計時器與歷史 5 次紀錄工具',
    description: '專為酒吧派對打造的吹牛骰子搖骰器！顯示距離最後一次搖骰的時間與歷史 5 次紀錄。',
    url: 'https://tools.cjkuo.net/liars-dice/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '吹牛骰子搖骰器 - 防作弊計時器與歷史 5 次紀錄工具',
    description: '專為酒吧派對打造的吹牛骰子搖骰器！顯示距離最後一次搖骰的時間與歷史 5 次紀錄。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '吹牛骰子搖骰器',
  url: 'https://tools.cjkuo.net/liars-dice/',
  description: '專為酒吧派對打造的吹牛骰子搖骰器！顯示距離最後一次搖骰的時間與歷史 5 次紀錄。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function LiarsDicePage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <LiarsDiceClient lang="zh-TW" />
    </>
  );
}

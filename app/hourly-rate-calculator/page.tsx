import type { Metadata } from 'next';
import HourlyRateCalculatorClient from './HourlyRateCalculatorClient';

export const metadata: Metadata = {
  title: '真實時薪計算器 - 扣除通勤與隱形加班，全台打工人 PR 排行榜',
  description:
    '免費線上真實時薪計算器！扣除通勤時間、無酬加班與額外支出，幫您精準計算每小時生命的真實淨收益，並對照台灣最新薪資 PR 統計與合規判定。',
  keywords: '真實時薪計算器,時薪計算,最低時薪,薪資PR,打工人,通勤時間,隱形加班,薪資排行,計算機',
  alternates: {
    canonical: 'https://tools.cjkuo.net/hourly-rate-calculator/',
  },
  openGraph: {
    type: 'website',
    title: '真實時薪計算器 - 扣除通勤與隱形加班，全台打工人 PR 排行榜',
    description: '扣除通勤時間、無酬加班與額外支出，幫您精準計算每小時生命的真實淨收益，並對照全台薪資 PR 排行。',
    url: 'https://tools.cjkuo.net/hourly-rate-calculator/',
    images: [{ url: '/support.svg', width: 1200, height: 630, alt: '真實時薪計算器 - 全台打工人 PR 排行榜' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '真實時薪計算器 - 扣除通勤與隱形加班，全台打工人 PR 排行榜',
    description: '扣除通勤時間、無酬加班與額外支出，幫您精準計算每小時生命的真實淨收益。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '真實時薪計算器',
  url: 'https://tools.cjkuo.net/hourly-rate-calculator/',
  description: '專業免費的線上真實時薪與 PR 排行計算工具。',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function HourlyRateCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <HourlyRateCalculatorClient />
    </>
  );
}

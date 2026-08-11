import type { Metadata } from 'next';
import FuturesCalculatorClient from './FuturesCalculatorClient';

export const metadata: Metadata = {
  title: '台股期貨槓桿計算機 - 免費線上大台/小台/微台保證金與逆風點數估算器',
  description:
    '專業免費的線上台指期 (大台/小台/微台) 槓桿與維持率計算器！支援多空部位切換、實質本金槓桿試算、逆風壓力點數模擬與追繳斷頭臨界點估算。',
  keywords: '期貨槓桿計算機,台指期計算機,大台保證金,小台保證金,微台保證金,期貨斷頭點數,期貨維持率,期貨保證金',
  alternates: {
    canonical: 'https://tools.cjkuo.net/futures-calculator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/futures-calculator/',
      en: 'https://tools.cjkuo.net/futures-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/futures-calculator/en/',
    },
  },
  openGraph: {
    title: '台股期貨槓桿計算機 - 免費線上大台/小台/微台保證金與逆風點數估算器',
    description: '期貨交易者的風控警示器。即時模擬大盤逆風、實質資金槓桿、追繳與斷頭臨界點試算。',
    url: 'https://tools.cjkuo.net/futures-calculator/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '台股期貨槓桿計算機 - 免費線上大台/小台/微台保證金與逆風點數估算器',
    description: '期貨交易者的風控警示器。即時模擬大盤逆風、實質資金槓桿、追繳與斷頭臨界點試算。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '台股期貨槓桿與逆風點數估算器',
  url: 'https://tools.cjkuo.net/futures-calculator/',
  description: '專業免費的台指期 (大台/小台/微台) 槓桿與維持率計算器，支援逆風壓力點數與斷頭臨界估算。',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function FuturesCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <FuturesCalculatorClient />
    </>
  );
}

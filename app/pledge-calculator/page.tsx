import type { Metadata } from 'next';
import PledgeCalculatorClient from './PledgeCalculatorClient';

export const metadata: Metadata = {
  title: '股票質押維持率計算機 - 免費線上台股斷頭價與壓力測試工具',
  description:
    '專業免費的線上台股股票質押借款與維持率試算工具！支援多檔股票質押成數試算、130% 斷頭追繳臨界股價計算、大盤大跌壓力測試與補繳保證金評估。',
  keywords: '股票質押,維持率計算機,斷頭價,追繳股價,股票貸款,維持率130,股票借款,台股槓桿',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pledge-calculator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pledge-calculator/',
      en: 'https://tools.cjkuo.net/pledge-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/pledge-calculator/en/',
    },
  },
  openGraph: {
    title: '股票質押維持率計算機 - 免費線上台股斷頭價與壓力測試工具',
    description: '台股投資人的槓桿守護者。即時模擬大盤跌幅、維持率指針儀表板、追繳臨界價與補繳保證金試算。',
    url: 'https://tools.cjkuo.net/pledge-calculator/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '股票質押維持率計算機 - 免費線上台股斷頭價與壓力測試工具',
    description: '台股投資人的槓桿守護者。即時模擬大盤跌幅、維持率指針儀表板、追繳臨界價與補繳保證金試算。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '股票質押與維持率壓力測試器',
  url: 'https://tools.cjkuo.net/pledge-calculator/',
  description: '專業免費的台股股票質押借款與維持率試算工具，支援 130% 追繳臨界股價與大跌壓力測試。',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function PledgeCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PledgeCalculatorClient />
    </>
  );
}

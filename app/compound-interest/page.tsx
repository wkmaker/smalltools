import type { Metadata } from 'next';
import CompoundInterestClient from './CompoundInterestClient';

export const metadata: Metadata = {
  title: '複利試算器 - 免費線上定期定額與投資複利計算機',
  description:
    '專業免費的線上複利試算器！支援單筆投資與定期定額投入、年化報酬率設定，精算資產翻倍時間與投資資產成長曲線。',
  keywords: '複利試算器,定期定額計算機,投資複利,年化報酬率,資產翻倍,複利效應,理財計算機',
  alternates: {
    canonical: 'https://tools.cjkuo.net/compound-interest/',
  },
  openGraph: {
    title: '複利試算器 - 免費線上定期定額與投資複利計算機',
    description: '精算定期定額與單筆投資複利效應，提供年度資產成長圖表與本金利息佔比分析。',
    url: 'https://tools.cjkuo.net/compound-interest/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '複利試算器 - 免費線上定期定額與投資複利計算機',
    description: '精算定期定額與單筆投資複利效應，提供年度資產成長圖表與本金利息佔比分析。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '複利試算器',
  url: 'https://tools.cjkuo.net/compound-interest/',
  description: '專業免費的投資複利試算器，支援單筆與定期定額計算資產成長。',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function CompoundInterestPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CompoundInterestClient />
    </>
  );
}

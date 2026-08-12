import type { Metadata } from 'next';
import MortgageLoanClient from './MortgageLoanClient';

export const metadata: Metadata = {
  title: '房屋貸款試算器 - 免費線上房貸月付額、寬限期與 APR 計算機',
  description:
    '專業免費的線上房屋貸款計算機！支援房屋總價與自備款成數雙向連動、寬限期、多段式階梯利率、本息/本金均攤、開辦手續費攤提與 APR 實質年利率試算。',
  keywords: '房貸計算機,房屋貸款試算,房貸月付額,寬限期,階梯利率,新青安房貸,本息平均攤還,本金平均攤還,房貸首期',
  alternates: {
    canonical: 'https://tools.cjkuo.net/mortgage-loan/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/mortgage-loan/',
      en: 'https://tools.cjkuo.net/mortgage-loan/en/',
      'x-default': 'https://tools.cjkuo.net/mortgage-loan/en/',
    },
  },
  openGraph: {
    title: '房屋貸款試算器 - 免費線上房貸月付額、寬限期與 APR 計算機',
    description: '專業免費的線上房屋貸款計算機，支援寬限期、多段式利率與實質年利率試算。',
    url: 'https://tools.cjkuo.net/mortgage-loan/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '房屋貸款試算器 - 免費線上房貸月付額、寬限期與 APR 計算機',
    description: '專業免費的線上房屋貸款計算機，支援寬限期、多段式利率與實質年利率試算。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '房貸計算機',
  url: 'https://tools.cjkuo.net/mortgage-loan/',
  description: '專業免費的線上房屋貸款計算機，支援寬限期、多段階梯利率與 APR 實質年利率評估。',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function MortgageLoanPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MortgageLoanClient />
    </>
  );
}

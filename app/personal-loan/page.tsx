import type { Metadata } from 'next';
import PersonalLoanClient from './PersonalLoanClient';

export const metadata: Metadata = {
  title: '個人信貸試算器 - 免費線上信用貸款與 APR 實質年利率計算機',
  description:
    '專業免費的線上個人信貸計算機！支援本息均攤、本金均攤、開辦費/手續費攤提與 APR 實質總費用年率試算，即時提供月還款額與歷期攤還明細表。',
  keywords: '信貸計算機,個人信貸試算,信用貸款,APR計算機,實質年利率,本息平均攤還,本金平均攤還,貸款利息計算',
  alternates: {
    canonical: 'https://tools.cjkuo.net/personal-loan/',
  },
  openGraph: {
    title: '個人信貸試算器 - 免費線上信用貸款與 APR 實質年利率計算機',
    description: '專業免費的線上信貸計算機，支援手續費攤提與 APR 實質年利率試算。',
    url: 'https://tools.cjkuo.net/personal-loan/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '個人信貸試算器 - 免費線上信用貸款與 APR 實質年利率計算機',
    description: '專業免費的線上信貸計算機，支援手續費攤提與 APR 實質年利率試算。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '信貸計算機',
  url: 'https://tools.cjkuo.net/personal-loan/',
  description: '專業免費的線上個人信貸計算機，支援本息均攤、本金均攤與 APR 實質年利率求解試算。',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function PersonalLoanPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PersonalLoanClient />
    </>
  );
}

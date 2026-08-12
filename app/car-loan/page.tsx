import type { Metadata } from 'next';
import CarLoanClient from './CarLoanClient';

export const metadata: Metadata = {
  title: '車貸試算器 - 免費線上汽車貸款月付金與利息計算機',
  description:
    '專業免費的線上車貸試算器！支援本息均勻攤還與本金均勻攤還，精算月繳金額、利息總額與還款明細表。',
  keywords: '車貸試算器,汽車貸款計算機,車貸月付金,車貸利率,本息均勻攤還,本金均勻攤還,汽車貸款',
  alternates: {
    canonical: 'https://tools.cjkuo.net/car-loan/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/car-loan/',
      en: 'https://tools.cjkuo.net/car-loan/en/',
      'x-default': 'https://tools.cjkuo.net/car-loan/en/',
    },
  },
  openGraph: {
    title: '車貸試算器 - 免費線上汽車貸款月付金與利息計算機',
    description: '精算車貸月付金與利息總額，提供完整月度還款本金與利息攤還明細表。',
    url: 'https://tools.cjkuo.net/car-loan/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '車貸試算器 - 免費線上汽車貸款月付金與利息計算機',
    description: '精算車貸月付金與利息總額，提供完整月度還款本金與利息攤還明細表。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '車貸試算器',
  url: 'https://tools.cjkuo.net/car-loan/',
  description: '專業免費的車貸試算器，支援本息與本金平均攤還計算與還款明細表。',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function CarLoanPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <CarLoanClient />
    </>
  );
}

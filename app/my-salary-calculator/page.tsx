import type { Metadata } from 'next';
import MySalaryCalculatorClient from './MySalaryCalculatorClient';

export const metadata: Metadata = {
  title: '薪資勞健保計算機 - 免費線上實領薪水、勞退自提與雇主成本算薪水工具',
  description:
    '專業免費的線上台灣薪資勞保健保計算機！支援最新法規級距、實領薪資試算、勞退自提%、預扣所得稅與雇主負擔成本明細。',
  keywords: '薪資計算機,勞健保試算,實領薪水,算薪水,勞保費計算,健保費計算,勞退自提,雇主負擔成本',
  alternates: {
    canonical: 'https://tools.cjkuo.net/my-salary-calculator/',
  },
  openGraph: {
    title: '薪資勞健保計算機 - 免費線上實領薪水、勞退自提與雇主成本算薪水工具',
    description: '一鍵精準試算台灣勞保、健保與勞退提繳金額。同時呈現員工薪資明細與雇主總營運勞務成本。',
    url: 'https://tools.cjkuo.net/my-salary-calculator/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '薪資勞健保計算機 - 免費線上實領薪水、勞退自提與雇主成本算薪水工具',
    description: '一鍵精準試算台灣勞保、健保與勞退提繳金額。同時呈現員工薪資明細與雇主總營運勞務成本。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '薪資勞健保計算機',
  url: 'https://tools.cjkuo.net/my-salary-calculator/',
  description: '專業免費的線上台灣薪資勞保健保計算機，一鍵算得出實領薪資與雇主營運成本。',
  applicationCategory: 'FinanceApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function MySalaryCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <MySalaryCalculatorClient />
    </>
  );
}

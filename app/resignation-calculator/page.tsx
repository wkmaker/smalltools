import type { Metadata } from 'next';
import ResignationCalculatorClient from './ResignationCalculatorClient';

export const metadata: Metadata = {
  title: '離職時間與預告期計算機 - 免費線上勞基法預告期、離職生效日與特休試算工具',
  description:
    '專業免費的線上台灣離職時間與預告期計算機！依據勞基法第 16 條精準試算法定預告天數、預告起算日、最後在職日、實際最後出勤日與離職生效退保日。支援特休排休與折算代金試算，並可一鍵生成離職預告 Email 範本。',
  keywords: '離職計算機,離職預告期,勞基法第16條,離職生效日,最後在職日,特休折現,離職預告範本,謀職假',
  alternates: {
    canonical: 'https://tools.cjkuo.net/resignation-calculator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/resignation-calculator/',
      en: 'https://tools.cjkuo.net/resignation-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/resignation-calculator/en/',
    },
  },
  openGraph: {
    title: '離職時間與預告期計算機 - 免費線上勞基法預告期、離職生效日與特休試算工具',
    description: '一鍵精準試算台灣勞基法定預告期、離職生效日、最後出勤日與特休假不休假工資代金。',
    url: 'https://tools.cjkuo.net/resignation-calculator/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '離職時間與預告期計算機 - 免費線上勞基法預告期與離職生效日試算',
    description: '一鍵精準試算台灣勞基法定預告期、離職生效日、最後出勤日與特休假不休假工資代金。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '離職時間與預告期計算機',
  url: 'https://tools.cjkuo.net/resignation-calculator/',
  description: '專業免費的線上台灣離職時間與預告期計算機，一鍵算出離職生效日與特休代金。',
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function ResignationCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ResignationCalculatorClient lang="zh-TW" />
    </>
  );
}

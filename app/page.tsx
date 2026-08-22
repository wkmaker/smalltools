import { Suspense } from 'react';
import type { Metadata } from 'next';
import HomeClient from './HomeClient';

export const metadata: Metadata = {
  title: '工具庫 | 免費線上工具集 - 房貸/信貸/JSON/圖片/密碼/SSL 計算機',
  description:
    '免費線上工具庫，包含房貸計算機、信貸計算機、JSON格式化、Base64編碼解碼、SSL憑證轉換、密碼生成器、圖片壓縮裁切等 20+ 精緻實用工具，無廣告、免下載。',
  keywords:
    '免費線上工具,房貸計算機,信貸計算機,JSON格式化,Base64編碼,SSL憑證轉換,密碼生成器,圖片壓縮,台股期貨,複利計算機,薪資計算機',
  alternates: {
    canonical: 'https://tools.cjkuo.net/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/',
      en: 'https://tools.cjkuo.net/en/',
      'x-default': 'https://tools.cjkuo.net/en/',
    },
  },
  openGraph: {
    title: '工具庫 | 免費線上工具集 - 20+ 精緻實用工具',
    description:
      '免費線上工具庫，包含房貸計算機、信貸計算機、JSON格式化、Base64編碼解碼、SSL憑證轉換、密碼生成器、圖片壓縮裁切等 20+ 精緻實用工具，無廣告、免下載。',
    url: 'https://tools.cjkuo.net/',
    siteName: '工具庫',
    locale: 'zh_TW',
    type: 'website',
    images: [
      {
        url: '/img/StockSnap_00F7DB5857.webp',
        width: 1200,
        height: 630,
        alt: '工具庫 - 免費線上工具集',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: '工具庫 | 免費線上工具集 - 20+ 精緻實用工具',
    description:
      '免費線上工具庫，包含房貸計算機、信貸計算機、JSON格式化、Base64編碼解碼、SSL憑證轉換、密碼生成器、圖片壓縮裁切等 20+ 精緻實用工具，無廣告、免下載。',
    images: ['/img/StockSnap_00F7DB5857.webp'],
  },
};

const schemaJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '工具庫',
  url: 'https://tools.cjkuo.net/',
  description:
    '免費線上工具庫，包含房貸計算機、信貸計算機、JSON格式化、Base64編碼解碼、SSL憑證轉換、密碼生成器、圖片壓縮裁切等 20+ 精緻實用工具。',
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://tools.cjkuo.net/?search={search_term_string}',
    },
    'query-input': 'required name=search_term_string',
  },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }}
      />
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-screen text-text-sub">
            載入中...
          </div>
        }
      >
        <HomeClient lang="zh-TW" />
      </Suspense>
    </>
  );
}

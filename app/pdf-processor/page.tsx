import type { Metadata } from 'next';
import PdfProcessorClient from './PdfProcessorClient';

export const metadata: Metadata = {
  title: 'PDF 頁面組合器 - 免費線上多檔合併、頁面排序、刪除、旋轉與圖片轉檔',
  description:
    '專業免費的線上 PDF 頁面組合器！支援多檔 PDF 合併、拖曳頁面排序、單頁旋轉與刪除、PNG/JPG 圖片插入轉檔與無失真 PDF 匯出。100% 瀏覽器本機安全運算。',
  keywords: 'PDF頁面組合器,PDF合併,PDF分割,PDF旋轉,PDF刪除頁面,PDF轉檔,圖片轉PDF,PNG轉PDF,JPG轉PDF',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pdf-processor/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pdf-processor/',
      en: 'https://tools.cjkuo.net/pdf-processor/en/',
    },
  },
  openGraph: {
    title: 'PDF 頁面組合器 - 免費線上多檔合併、頁面排序、刪除與旋轉',
    description: '純前端強大 PDF 頁面組合器！支援多檔合併、拖曳排序、單頁旋轉與刪除、圖片插入與轉檔。',
    url: 'https://tools.cjkuo.net/pdf-processor/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF 頁面組合器 - 免費線上多檔合併、頁面排序、刪除與旋轉',
    description: '純前端強大 PDF 頁面組合器！支援多檔合併、拖曳排序、單頁旋轉與刪除、圖片插入與轉檔。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PDF 頁面組合器',
  url: 'https://tools.cjkuo.net/pdf-processor/',
  description: '專業免費的純前端 PDF 頁面組合器，支援多檔合併、拖曳排序、單頁旋轉刪除與圖片轉 PDF 匯出。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function PdfProcessorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PdfProcessorClient />
    </>
  );
}

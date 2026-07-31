import type { Metadata } from 'next';
import PdfCompressorClient from './PdfCompressorClient';

export const metadata: Metadata = {
  title: 'PDF 壓縮大師 - 免費線上圖片深度壓縮、文字無損與頂級隱私',
  description:
    '專業免費的線上 PDF 壓縮大師！支援多檔批次壓縮、即時預檢估算與圖片明細清單。100% 保持原生文字與向量線條清晰可複製，零伺服器依賴，隱私最安全。',
  keywords: 'PDF壓縮大師,PDF壓縮,PDF圖片壓縮,PDF瘦身,PDF檔案縮小,線上PDF壓縮,免費PDF工具,純前端PDF壓縮',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pdf-compressor/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pdf-compressor/',
      en: 'https://tools.cjkuo.net/pdf-compressor/en/',
      'x-default': 'https://tools.cjkuo.net/pdf-compressor/en/',
    },
  },
  openGraph: {
    title: 'PDF 壓縮大師 - 免費線上瘦身與頂級隱私',
    description: '純前端極速 PDF 壓縮大師！支援多檔批次處理、即時預檢估算與圖片明細，100% 本地端運算。',
    url: 'https://tools.cjkuo.net/pdf-compressor/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF 壓縮大師 - 免費線上瘦身與頂級隱私',
    description: '純前端極速 PDF 壓縮大師！支援多檔批次處理、即時預檢估算與圖片明細，100% 本地端運算。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PDF 壓縮大師',
  url: 'https://tools.cjkuo.net/pdf-compressor/',
  description: '專業免費的純前端 PDF 壓縮大師，支援多檔批次、結構預檢估算與圖片明細，100% 瀏覽器本地運算。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function PdfCompressorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <PdfCompressorClient />
    </>
  );
}

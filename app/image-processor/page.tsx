import type { Metadata } from 'next';
import ImageProcessorClient from './ImageProcessorClient';

export const metadata: Metadata = {
  title: '萬能圖片處理大師 - 免費線上圖片裁切、壓縮、尺寸縮放與 WebP 批次轉檔工具',
  description:
    '專業免費的線上萬能圖片處理工具！支援圖片裁切、尺寸等比例縮放、品質壓縮轉檔 (PNG/JPG/WebP) 與多檔處理。',
  keywords: '圖片處理,圖片裁切,圖片壓縮,圖片轉檔,WebP轉換,圖片縮放,批次壓縮圖片,線上圖片編輯',
  alternates: {
    canonical: 'https://tools.cjkuo.net/image-processor/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/image-processor/',
      en: 'https://tools.cjkuo.net/image-processor/en/',
    },
  },
  openGraph: {
    title: '萬能圖片處理大師 - 免費線上圖片裁切、壓縮、尺寸縮放與 WebP 批次轉檔工具',
    description: '純前端萬能圖片處理工具，支援裁切、尺寸調整與高速壓縮轉檔。',
    url: 'https://tools.cjkuo.net/image-processor/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: '萬能圖片處理大師 - 免費線上圖片裁切、壓縮、尺寸縮放與 WebP 批次轉檔工具',
    description: '純前端萬能圖片處理工具，支援裁切、尺寸調整與高速壓縮轉檔。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '萬能圖片處理大師',
  url: 'https://tools.cjkuo.net/image-processor/',
  description: '專業免費的純前端圖片處理工具，支援手動裁切、尺寸縮放與 WebP 壓縮轉檔。',
  applicationCategory: 'MultimediaApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

export default function ImageProcessorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ImageProcessorClient lang="zh-TW" />
    </>
  );
}

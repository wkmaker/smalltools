import type { Metadata } from 'next';
import ScreenCaptureClient from './ScreenCaptureClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';
import { TRANSLATIONS } from './translations';

export const metadata: Metadata = {
  title: '極簡線上螢幕錄影工具 - 免安裝電腦螢幕錄影、麥克風旁白收音與無浮水印錄製',
  description:
    '免安裝、無浮水印且 100% 於瀏覽器本地執行的極簡螢幕錄影工具。支援系統音訊與麥克風旁白即時混音，錄製完成後可直接本地下載，或透過安全握手通道快捷傳送至 PRV5 私密分享。',
  keywords:
    '線上螢幕錄影 免安裝螢幕錄影 電腦錄影 麥克風收音 系統聲音混音 無浮水印 screen recorder webm 錄製工具 螢幕擷取',
  alternates: {
    canonical: 'https://tools.cjkuo.net/screen-capture/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/screen-capture/',
      en: 'https://tools.cjkuo.net/screen-capture/en/',
      'x-default': 'https://tools.cjkuo.net/screen-capture/en/',
    },
  },
  openGraph: {
    title: '極簡線上螢幕錄影工具 - 免安裝電腦螢幕錄影、麥克風旁白收音與無浮水印錄製',
    description:
      '純前端 100% 本地執行之極簡螢幕錄製工具，支援麥克風與系統音混音、高畫質無浮水印，並支援一鍵本機下載與 PRV5 私密分享。',
    url: 'https://tools.cjkuo.net/screen-capture/',
  },
  twitter: {
    card: 'summary_large_image',
    title: '極簡線上螢幕錄影工具 - 免安裝電腦螢幕錄影、麥克風旁白收音與無浮水印錄製',
    description:
      '純前端 100% 本地執行之極簡螢幕錄製工具，支援麥克風與系統音混音、高畫質無浮水印，並支援一鍵本機下載與 PRV5 私密分享。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: '極簡線上螢幕錄影工具',
  url: 'https://tools.cjkuo.net/screen-capture/',
  description:
    '純前端 100% 本地執行之極簡螢幕錄製工具，支援電腦畫面擷取、麥克風旁白即時混音與 WebM/MKV/MP4 高清錄製。',
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema(TRANSLATIONS['zh-TW'].faqItems);

export default function ScreenCapturePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <ScreenCaptureClient lang="zh-TW" />
    </>
  );
}

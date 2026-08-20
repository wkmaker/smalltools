import type { Metadata } from 'next';
import PdfProcessorClient from './PdfProcessorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

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
      'x-default': 'https://tools.cjkuo.net/pdf-processor/en/',
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

const faqJsonLd = generateFaqSchema([
  {
    q: 'PDF 頁面組合器支援哪些核心功能？如何合併多個 PDF？',
    a: `本工具是一站式的純前端 PDF 頁面編輯器，支援：

① 多檔合併與圖片插入：可同時拖曳載入多個 PDF 檔案以及 PNG/JPG 圖片，自動依序拆解為單頁畫布。
② 視覺化拖曳排序：透過滑鼠拖曳（或點擊左右箭頭按鈕）自由調換頁面順序。
③ 單頁旋轉與刪除：支援單頁 90° 順時針旋轉與一鍵刪除多餘頁面。
④ 一鍵高畫質匯出：將排版完成的頁面無失真重組為單一全新 PDF 檔案。`,
  },
  {
    q: '可以將 PNG 或 JPG 圖片直接插入 PDF 中並轉為 PDF 頁面嗎？',
    a: `可以！您可以將一至多張 PNG、JPG 或 WebP 圖片直接拖入工作區。工具會自動將圖片轉換為高解析度 PDF 頁面，並允許您與其他 PDF 頁面混合排序與合併。`,
  },
  {
    q: '如何放大檢視特定頁面的細節？',
    a: `點擊任意頁面縮圖右上角的「檢視」按鈕（或雙擊頁面），即可開啟「滿版超清動態縮放 Lightbox」。

在檢視視窗中，工具會以 JIT 高解析度即時無損渲染該頁面，並提供滑鼠滾輪縮放、平移拖曳、90° 旋轉與鍵盤左右鍵快捷翻頁功能。`,
  },
  {
    q: '合併或旋轉 PDF 頁面後，原本的文字會變成圖片或失真嗎？',
    a: `絕不失真！工具底層直接操作 PDF 的原生頁面物件樹 (Object Tree)，保留原本所有的向量字型、文字層與高解析度素材，合併或旋轉過程不進行任何破壞性畫質壓縮，文字依然清晰且支援全選複製。`,
  },
  {
    q: '如果部分頁面方向橫豎顛倒，可以單獨旋轉特定頁面嗎？',
    a: `可以！您可以在頁面縮圖卡片上點擊「旋轉 90°」按鈕，每點擊一次即順時針旋轉 90 度（支援 90° / 180° / 270° 校正）。在匯出時，系統會精確寫入對應的 /Rotate 頁面標籤，校正顛倒的文件方向。`,
  },
  {
    q: '如果要合併的 PDF 檔案有密碼保護，該如何處理？',
    a: `當您載入設有開啟密碼的 PDF 檔案時，系統會自動彈出解鎖視窗。輸入正確密碼後，工具會在瀏覽器本機記憶體完成解密，並將各頁面順利載入至畫布中供您自由組合。`,
  },
  {
    q: '處理涉及合約或機密資料的 PDF 安全嗎？',
    a: `100% 隱私安全！本工具絕不上傳任何檔案至外部伺服器。所有頁面拆解、拖曳重組、旋轉與新檔合成運算皆 100% 於您的瀏覽器本地記憶體中完成，甚至斷網也能離線順暢操作。`,
  },
]);

export default function PdfProcessorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <PdfProcessorClient />
    </>
  );
}

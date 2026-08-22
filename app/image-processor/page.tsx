import type { Metadata } from 'next';
import ImageProcessorClient from './ImageProcessorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

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
      'x-default': 'https://tools.cjkuo.net/image-processor/en/',
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

const faqJsonLd = generateFaqSchema([
  {
    q: '為什麼推薦將網站圖片轉換為 WebP 格式？與傳統 JPG/PNG 相比有何優勢？',
    a: 'WebP 是 Google 開發的新世代現代圖片格式：\n\n① 顯著縮減檔案體積：\n相較於同等畫質的 JPEG，WebP 體積通常可縮減 25% 至 35%；相較於無損 PNG，體積更可縮減 26% 以上。\n\n② 兼具透明通道與動畫支援：\nWebP 同時支援 PNG 的透明背景 (Alpha Channel) 與豐富色彩表現，大幅提升網頁載入速度與 Google PageSpeed 效能分數。',
  },
  {
    q: '在線上處理個人生活照、身分證件或公司機密商品圖是否安全？',
    a: '絕對安全！本工具為 100% 純前端（Client-Side）本地運算架構：\n\n① 零伺服器上傳：\n所有圖片解碼、Canvas 裁切、尺寸縮放與品質壓縮皆直接在您的瀏覽器記憶體中執行。\n\n② 零雲端留存：\n圖片資料從未離開您的裝置，不經任何後端伺服器轉發或儲存，即使拔掉網路線亦能正常使用。',
  },
  {
    q: '圖片壓縮品質 (Quality) 建議設定多少？會不會造成肉眼可見的模糊？',
    a: '建議的壓縮品質平衡點：\n\n① 網頁與社群推薦 (75% ~ 85%)：\n在 80% 左右的品質設定下，人眼幾乎無法察覺任何畫質損失，但檔案大小可縮減 60% ~ 80% 以上，為性價比最佳區間。\n\n② 高清印刷或攝影展示 (90% ~ 95%)：\n保留極致細節與色彩漸層。\n\n③ 內建即時滑動對比：\n本工具提供左右拖曳對比視窗，讓您即時檢驗壓縮前後的細節差異。',
  },
  {
    q: '什麼是「保持等比例縮放」？如何自訂固定長寬像素 (Resolution)？',
    a: '尺寸調整機制的彈性配置：\n\n① 保持等比例 (Keep Aspect Ratio)：\n勾選後只需輸入寬度（或高度），系統會自動換算對應數值，確保圖片不失真、不變形。\n\n② 自由調整與比例預設：\n取消勾選可自由指定長寬像素，或點選 1:1, 4:3, 16:9, 9:16 等常用比例預設範本。',
  },
  {
    q: '本工具支援哪些圖片格式？是否支援多檔批次壓縮與 ZIP 打包下載？',
    a: '支援廣泛的輸入格式與批次工作流：\n\n① 支援上傳格式：\n支援 PNG, JPG/JPEG, WebP, GIF, SVG, AVIF, BMP 等格式。\n\n② 批次處理與 ZIP 打包：\n可一次拖曳多張圖片匯入，套用相同的壓縮與尺寸規則後，一鍵生成並下載包含所有成果的 ZIP 壓縮包。',
  },
  {
    q: '「裁切 (Crop)」與「旋轉/翻轉 (Rotate & Flip)」功能如何搭配操作？',
    a: '直觀的可視化編輯介面：\n\n① 旋轉與翻轉：\n可即時進行 90 度順時針/逆時針旋轉，以及水平/垂直鏡像翻轉。\n\n② 視覺化自由裁切：\n在畫布上直接拖曳選取框微調裁切區域，系統會在下載時自動套用幾何變換與裁切邊界。',
  },
  {
    q: '若介面提示「目標像素大於原圖，放大可能導致模糊」該如何處理？',
    a: '點陣圖放大原理解析：\n\n① 插值放大限制：\n點陣圖片（點陣圖）在強制放大至超越原始解析度時，瀏覽器需透過內插演算法生成額外像素，可能產生鋸齒或模糊。\n\n② 最佳實踐：\n建議以縮小或等比例維持原圖尺寸為主；若確有放大需求，請評估是否改用向量格式 (SVG) 或更高解析度的原始素材。',
  },
]);

export default function ImageProcessorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <ImageProcessorClient lang="zh-TW" />
    </>
  );
}

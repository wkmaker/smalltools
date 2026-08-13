import type { Metadata } from 'next';
import QrGeneratorClient from './QrGeneratorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'QR Code 產生器 - 免費線上藝術設計、Logo 內嵌與向量 SVG 輸出工具',
  description:
    '專業免費的線上藝術 QR Code 產生器！支援自訂點體樣式、雙色漸層、中央 Logo 拖曳內嵌、自動 30% 高容錯率及 PNG/SVG/WEBP 向量圖檔匯出。',
  keywords: 'QR Code產生器,QR Code製造機,藝術QR Code,QR Code Logo,向量QR Code,SVG QR Code,免費QR Code',
  alternates: {
    canonical: 'https://tools.cjkuo.net/qr-generator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/qr-generator/',
      en: 'https://tools.cjkuo.net/qr-generator/en/',
      'x-default': 'https://tools.cjkuo.net/qr-generator/en/',
    },
  },
  openGraph: {
    title: 'QR Code 產生器 - 免費線上藝術設計、Logo 內嵌與向量 SVG 輸出工具',
    description: '即時設計您專屬的藝術 QR Code。支援液態點、漸層、Logo 置中與向量 SVG 輸出。',
    url: 'https://tools.cjkuo.net/qr-generator/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'QR Code 產生器 - 免費線上藝術設計、Logo 內嵌與向量 SVG 輸出工具',
    description: '即時設計專屬藝術 QR Code，支援漸層、Logo 置中與向量 SVG 輸出。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Designer QR Code 產生器',
  url: 'https://tools.cjkuo.net/qr-generator/',
  description: '專業免費的藝術 QR Code 產生器，支援液態化點體、漸層色彩與中央 Logo 內嵌。',
  applicationCategory: 'DesignApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '本工具產生的 QR Code 有安全與隱私洩漏的疑慮嗎？資料會不會被儲存在伺服器？',
    a: '完全不會！本工具採用 100% 純前端技術 (Client-Side Browser-Based) 運作，所有的圖片生成、資料編碼與名片運算都在您自己的瀏覽器內部完成。您的輸入內容、聯絡資訊或 Logo 完全不會上傳至任何後端伺服器，絕無隱私洩漏或第三方追蹤疑慮。',
  },
  {
    q: '藝術 QR Code 插入中央 Logo 後，手機掃描會不會失敗？',
    a: '不會。QR Code 具備「容錯機制 (Error Correction Level)」。當您拖曳上傳 Logo 時，本工具會自動將容錯等級調高至 H 級 (Highest, 30%)，即使中央高達 30% 面積被 Logo 遮擋，周圍的關鍵數據與校正點仍能被手機相機 100% 精準解碼。',
  },
  {
    q: '為什麼建議選用向量 SVG 格式輸出？與 PNG / WEBP 有何差別？',
    a: 'SVG 是無損向量圖檔（Vector Graphic），無論放大至大樓看板或印刷名片皆不會失真點陣化，設計師亦可在 Illustrator / Figma 中繼續微調，且能作為 Inline SVG 直接嵌入網頁，無須額外 HTTP 請求，極有利於 Core Web Vitals 與 SEO 效能。PNG 與 WEBP 則是點陣圖檔，WEBP 具備高壓縮率與高清品質，是網頁圖片展示 (Web Image SEO) 的最佳選擇；PNG 則適合用於社群分享與簡訊傳送。',
  },
  {
    q: '產生的 QR Code 有使用期限或掃描次數限制嗎？收費方式如何？',
    a: '完全免費且永久有效！本工具產生的內容為「靜態原生碼 (Static QR Code)」，資料直接寫入二維碼矩陣中，不經過任何中繼轉址伺服器。沒有掃描次數上限、沒有使用期限，更無廣告干擾，只要您的原始連結沒有失效，二維碼就永久有效。',
  },
  {
    q: '如何產生掃描後能直接加入手機通訊錄的 vCard 名片 QR Code？',
    a: '只要切換頂部標籤至「聯絡名片 (vCard)」，輸入姓名、電話、Email 與公司職稱即可生成。手機掃描後會跳出「新增至聯絡人」提示。因部分 iOS / Android 系統基於安全與隱私防護，原生相機直接掃描時可能僅讀取姓名與電話，若需確保地址、備註或公司分機 100% 完整填入，建議使用本工具提供的「下載 .vcf 數位名片檔」功能，傳送 .vcf 檔開啟即可無痛儲存至通訊錄！',
  },
  {
    q: '這個 Designer QR Code 產生器適合哪些情境與使用者？',
    a: '非常適合四大情境：① 行銷與設計師：製作活動海報、展場 DM、帶有品牌漸層色的專屬二維碼並導出向量 SVG；② 商家與餐廳老闆：引導 Google 評論、FB 粉專按讚、菜單連結或 WiFi 快速連線；③ 活動主辦與 HR：報到連結、講義下載、行事曆行程 (.ics) 與展場離線應用；④ 一般使用者：交換 vCard 數位名片與分享家用 WiFi。',
  },
]);

export default function QrGeneratorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <QrGeneratorClient />
    </>
  );
}

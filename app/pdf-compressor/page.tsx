import type { Metadata } from 'next';
import PdfCompressorClient from './PdfCompressorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

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

const faqJsonLd = generateFaqSchema([
  {
    q: 'PDF 壓縮大師是如何縮小檔案體積的？文字和表格會變模糊嗎？',
    a: `100% 不會模糊！PDF 檔案體積龐大通常是因為內嵌了高解析度的相片或掃描圖片。本工具專門針對 PDF 內部的「點陣圖片 (Bitmap Images)」進行深度智慧降採樣 (Downsampling) 與 WebP/JPEG 畫質壓縮，同時對原生文字內容、向量線條、表格與字型檔進行 100% 原生無損保護，確保壓縮後的 PDF 文字依然能清晰放大與任意複製搜尋。`,
  },
  {
    q: '「輕度」、「平衡」與「極致」三種壓縮預設有何差異？如何自訂 DPI？',
    a: `本工具提供三大推薦模式與進階微調：

① 輕度壓縮 (Light)：品質 0.85 / 200 DPI，微幅瘦身並維持極高列印精緻度。
② 平衡壓縮 (Balanced - 推薦)：品質 0.70 / 144 DPI，大幅縮減約 60% 體積，適合公文傳閱與電子郵件附件。
③ 極致壓縮 (Maximum)：品質 0.50 / 96 DPI，強效瘦身約 80%，適合網頁快速載入與螢幕線上閱讀。

您亦可展開「進階微調設定」自由調整 Quality (1~100) 與 Max DPI (96/144/200)。`,
  },
  {
    q: '可以同時壓縮多個 PDF 檔案嗎？支援 ZIP 打包下載嗎？',
    a: `支援！您可以一次拖曳上傳多份 PDF 檔案進行批次排隊處理。壓縮完成後，您可以個別下載各檔案的壓縮成品，亦可點擊頂部「打包 ZIP 下載」按鈕，一鍵將所有已瘦身的 PDF 檔案打包為單一 ZIP 壓縮檔下載。`,
  },
  {
    q: '什麼是「結構預檢」與「圖片明細」？為什麼有些圖片會顯示「已保護」？',
    a: `在正式壓縮前，工具會自動掃描 PDF 結構並列出所有內嵌圖片的解析度、寬高與色彩格式。

若內嵌圖片解析度原本就低於目標 DPI、檔案極小或屬於特殊透明遮罩 (Alpha Mask)，系統會智慧決策為「已保護 (Protected)」並跳過重壓，防止因過度壓縮反而導致體積膨脹或畫質崩壞。`,
  },
  {
    q: '受密碼保護的 PDF 檔案可以進行壓縮嗎？',
    a: `可以。若上傳的 PDF 設有開啟密碼，系統會即時彈出密碼輸入框。在您輸入正確密碼後，瀏覽器會在本地解開加密區塊並繼續進行圖片壓縮與結構瘦身。`,
  },
  {
    q: '如果我的 PDF 只有純文字而沒有任何圖片，壓縮效果如何？',
    a: `PDF 的體積若主要由龐大的內嵌字型 (Embedded Fonts) 或大量純向量幾何線條組成，由於工具堅持「文字與向量 100% 原生無損可複製」，壓縮幅度會相對有限（約 5%~15% 結構最佳化）。本工具最顯著的瘦身效果（減小 50%~80%）主要來自包含掃描頁面、照片或插圖的 PDF 文件。`,
  },
  {
    q: '上傳機密文件或合約進行 PDF 壓縮安全嗎？檔案會被上傳到後端嗎？',
    a: `100% 安全無虞！本工具採用「零伺服器架構 (Zero-Server Architecture)」，所有 PDF 解析、圖片重繪降採樣與重組工作均 100% 於您的瀏覽器記憶體本地完成，絕無任何資料上傳至任何雲端伺服器，甚至在斷網環境下也能完美離線執行。`,
  },
]);

export default function PdfCompressorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <PdfCompressorClient />
    </>
  );
}

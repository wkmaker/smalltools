import type { Metadata } from 'next';
import JsonFormatterClient from './JsonFormatterClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'JSON 格式化與驗證器 - 免費線上 JSON Formatter & Validator',
  description:
    '專業免費的線上 JSON 格式化、縮排、驗證與美化工具！支援語法高亮、壓縮縮排與錯誤定位，純前端運算安全隱密。',
  keywords: 'JSON格式化,JSON Formatter,JSON驗證,JSON Validator,JSON美化,JSON壓縮,JSON排版',
  alternates: {
    canonical: 'https://tools.cjkuo.net/json/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/json/',
      en: 'https://tools.cjkuo.net/json/en/',
      'x-default': 'https://tools.cjkuo.net/json/en/',
    },
  },
  openGraph: {
    title: 'JSON 格式化與驗證器 - 免費線上 JSON Formatter & Validator',
    description: '極速純前端 JSON 格式化工具，支援語法高亮與精準錯誤定位。',
    url: 'https://tools.cjkuo.net/json/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'JSON 格式化與驗證器 - 免費線上 JSON Formatter & Validator',
    description: '極速純前端 JSON 格式化工具，支援語法高亮與精準錯誤定位。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'JSON 格式化與驗證器',
  url: 'https://tools.cjkuo.net/json/',
  description: '專業免費的線上 JSON 格式化與美化工具，支援語法驗證與壓縮。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是 JSON 格式？為什麼現代 Web API 與前端開發廣泛採用 JSON？',
    a: 'JSON（JavaScript Object Notation）是一種輕量級的開放文字資料交換格式：\n\n① 簡潔易讀與高解析效能：\n具備人類直觀可讀性與電腦極速解析特性，相比 XML 更加輕量，能大幅節省網路頻寬與序列化開銷。\n\n② 語言原生相容：\n與 JavaScript 原生物件 (Object) 及陣列 (Array) 結構完美對應，在各主流後端語言（Python、Go、Java、Node.js、Rust）中皆有內建高效解析支援，為 RESTful API 與微服務通訊的黃金標準。',
  },
  {
    q: '常見的 JSON 語法錯誤 (Syntax Error) 有哪些？如何快速除錯？',
    a: '常見的 JSON 格式語法錯誤包括：\n\n① 尾隨逗號 (Trailing Comma)：\n在物件或陣列的最後一個元素後方多加了逗號 `,`（標準 JSON 嚴格禁止尾隨逗號）。\n\n② 引號不符合規範：\n鍵名 (Key) 或字串值使用了單引號 或未加引號，標準 JSON 規定所有 Key 與字串必須使用雙引號。\n\n③ 包含註解或特殊跳脫字元：\n標準 JSON（RFC 8259）不允許加入單行或多行註解。本工具在解析失敗時會精確標示出錯行號與字元位置，協助快速修正。',
  },
  {
    q: '在線上貼上包含 API Key、Token 或機密商業資料的 JSON 是否安全？',
    a: '絕對安全！本工具採用 100% 純前端（Client-Side）本地瀏覽器運算架構：\n\n① 零後端傳輸：\n所有 JSON 格式化、縮排排版、錯誤定位與互動樹狀圖渲染皆完全在您的電腦瀏覽器記憶體中執行。\n\n② 零雲端儲存：\n系統不會向任何伺服器發送或備份您的輸入內容，即使在斷網離線環境下依然能正常操作，確保企業機密與個人隱私安全無虞。',
  },
  {
    q: 'JSON「格式化美化 (Beautify)」與「壓縮縮排 (Minify)」有何差異？各自適用於何種情境？',
    a: '兩者主要在於閱讀性與傳輸效率的權衡：\n\n① 格式化美化 (Beautify)：\n自動加入換行與 2 空格/4 空格/Tab 階層縮排，使巢狀資料層次分明，適合開發者 Debug、閱覽 API 回應結果或撰寫技術文件。\n\n② 壓縮縮排 (Minify)：\n移除所有不必要的空格、換行符號與縮排，將整個 JSON 壓縮成單行文字，體積通常可縮減 30%~50%，適合正式上線環境傳輸以降低網路延遲與頻寬消耗。',
  },
  {
    q: '標準 JSON、JSON5 與 JavaScript 物件字面量 (Object Literal) 有何主要區別？',
    a: '三者的語法寬容度與設計目標不同：\n\n① 標準 JSON（RFC 8259）：\n語法最為嚴格，鍵名與字串必須使用雙引號，不支援註解、尾隨逗號、多行字串或十六進位數值。\n\n② JSON5 與 JS Object：\n為人類手寫配置而擴充的超集格式，允許單引號、省略 Key 的引號、尾隨逗號以及單行與多行註解。本工具遵循最嚴格的標準 JSON 規範進行驗證。',
  },
  {
    q: '如何處理龐大 JSON 檔案（例如超過 50MB）在瀏覽器中的卡頓問題？',
    a: '處理大型資料集時的效能建議：\n\n① 避免過度 DOM 節點渲染：\n超過數萬行的大型 JSON 若一次性渲染語法高亮 DOM 節點，容易佔用過多瀏覽器記憶體。\n\n② 建議操作方式：\n建議使用本工具的「純文字視圖」或「收折根節點樹狀圖」，亦可直接點擊「一鍵壓縮 (Minify)」快速輸出壓縮代碼，避免 UI 重繪造成的短暫延遲。',
  },
  {
    q: '本 JSON 格式化工具支援哪些實用功能與快捷操作？',
    a: '本工具整合全方位開發者工作流：\n\n① 互動式可折疊樹狀導航 (Interactive Collapsible Tree View)：\n支援點擊節點展開/收折各階層物件與陣列，便於探索深層巢狀結構。\n\n② 多功能操作面板：\n支援自訂 2 空格/4 空格/Tab 縮排切換、即時行號語法驗證、一鍵清空、一鍵複製與匯出下載為 `.json` 檔案。',
  },
]);

export default function JsonPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <JsonFormatterClient />
    </>
  );
}

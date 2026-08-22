import type { Metadata } from 'next';
import Base64Client from './Base64Client';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'Base64 編碼解碼器 - 免費線上文字與 URL 安全 Base64 轉換工具',
  description:
    '專業免費的線上 Base64 編碼與解碼工具！支援 UTF-8 中文字元、URL Safe Safe-Base64 格式、即時雙向轉換與一鍵複製。',
  keywords: 'Base64,Base64編碼,Base64解碼,Base64轉換器,URL Safe Base64,UTF-8 Base64,線上Base64',
  alternates: {
    canonical: 'https://tools.cjkuo.net/base64/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/base64/',
      en: 'https://tools.cjkuo.net/base64/en/',
      'x-default': 'https://tools.cjkuo.net/base64/en/',
    },
  },
  openGraph: {
    title: 'Base64 編碼解碼器 - 免費線上文字與 URL 安全 Base64 轉換工具',
    description: '極速純前端 Base64 編解碼工具，支援中文字元 UTF-8 與 URL-Safe 模式。',
    url: 'https://tools.cjkuo.net/base64/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Base64 編碼解碼器 - 免費線上文字與 URL 安全 Base64 轉換工具',
    description: '極速純前端 Base64 編解碼工具，支援中文字元 UTF-8 與 URL-Safe 模式。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Base64 編碼解碼器',
  url: 'https://tools.cjkuo.net/base64/',
  description: '專業免費的線上 Base64 編碼與解碼工具，支援中文字元與 URL-Safe 格式。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是 Base64 編碼？為什麼需要將二進位或文字轉換為 Base64？',
    a: 'Base64 是一種基於 64 個可列印 ASCII 字元（A-Z, a-z, 0-9, +, /）的二進位轉文字編碼法：\n\n① 解決傳輸亂碼問題：\n網路早期許多通訊協議（如 Email MIME、HTTP Header、URL 參數）僅支援 7-bit 或 ASCII 文字傳輸。直接傳輸原始二進位數據（如圖片、音訊、憑證）容易因傳輸節點編碼轉換而損毀。\n\n② 安全傳輸媒介：\n透過 Base64 將任意二進位位元組流轉換為標準純文字，能確保在任何媒介與資料庫中 100% 完整無損地傳遞。',
  },
  {
    q: '為什麼中文或特殊符號在 Base64 解碼時容易出現亂碼？本工具如何解決？',
    a: '傳統解碼出現亂碼的主因與解決方案如下：\n\n① 原生 API 限制：\n瀏覽器傳統的 `btoa()` 與 `atob()` 僅原生支援 8-bit Latin1 字元集。當字串包含多位元組的 UTF-8 中文字元或 Emoji 表情符號時，會直接拋出 `InvalidCharacterError` 錯誤。\n\n② 本工具之 UTF-8 深度支援：\n本工具採用 `encodeURIComponent` 與 TypedArray 位元組流轉換演算法，原生支援繁體中文、各國多語系文字與 Emoji 表情符號之雙向正確編碼與解碼，徹底告別亂碼困擾。',
  },
  {
    q: '什麼是「URL-Safe Base64」？它與標準 Base64 有何不同？',
    a: 'URL-Safe Base64 是為適應網址與檔案路徑而衍生的標準變體（RFC 4648 §5）：\n\n① 替換特殊字元：\n標準 Base64 中的 `+` 與 `/` 在 URL 網址中具有特殊語意（如 `+` 代表空白、`/` 代表目錄路徑）。URL-Safe 格式將 `+` 替換為 `-`（減號）、將 `/` 替換為 `_`（底線）。\n\n② 移除補位符號：\nURL-Safe 格式通常會移除結尾的 `=` 補位字元，使其能直接安全嵌入 HTTP GET 網址參數、檔名或 JWT (JSON Web Token) 的 Token 字串中。',
  },
  {
    q: '資料在經過 Base64 編碼後，為什麼檔案體積會膨脹約 33%？',
    a: '體積膨脹是 Base64 的數學換算特性：\n\n① 3 位元組轉 4 字元：\nBase64 將每 3 個原始位元組（3 Bytes × 8 bits = 24 bits）重新切分為 4 個 6-bit 單位（4 × 6 = 24 bits），每個 6-bit 單位對應至一個 ASCII 字元。\n\n② 固定膨脹比率：\n編碼後的輸出字元數固定為原始位元組數的 4/3 倍（即約增加 33.3% 體積）。若原始數據長度無法被 3 整除，結尾會補上 1 至 2 個 `=` 作為填充符號。',
  },
  {
    q: '什麼是「Data URL (data:image/png;base64,...)」？在前端開發有哪些應用場景？',
    a: 'Data URL 是一種將小型檔案直接以 Base64 內聯嵌入 HTML/CSS 的前綴協議：\n\n① 語法結構：\n標準格式為 `data:[<MIME-type>][;base64],<data>`，例如 `data:image/svg+xml;base64,...`。\n\n② 應用場景與優缺點：\n適合將小於 10KB 的小圖標 (Icon)、SVG 或字型直接內嵌在單一 HTML/CSS 檔案中，減少 HTTP 網路連線請求次數以加速首屏渲染；但大於 50KB 的檔案建議仍以外部檔案載入以利瀏覽器快取。',
  },
  {
    q: 'Base64 是一種加密演算法嗎？可以用來儲存機密密碼嗎？',
    a: '絕對不是！Base64 僅是一種「公開透明的資料編碼格式」：\n\n① 零安全性：\nBase64 沒有密鑰概念，任何人都可以使用公開演算法直接反向解碼還原出原始內容。\n\n② 安全防護建議：\n切勿將 Base64 用於儲存或傳輸密碼、API 金鑰或敏感個人資料。若需資料保密，請採用 AES、RSA 等標準密碼學加密技術，或使用 SHA-256、bcrypt 等安全雜湊函數。',
  },
  {
    q: '在線上進行檔案與圖片轉 Base64 是否有資料外洩風險？',
    a: '完全沒有！本工具為 100% 純前端（Client-Side）運算架構：\n\n① 本機記憶體處理：\n透過瀏覽器 HTML5 FileReader API 直接在您的本機記憶體中完成檔案編碼與預覽。\n\n② 零雲端上傳：\n所有文字與檔案數據均不會上傳至任何伺服器或第三方平台，確保您的商業機密與隱私安全。',
  },
]);

export default function Base64Page() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <Base64Client />
    </>
  );
}

import type { Metadata } from 'next';
import UrlEncoderClient from './UrlEncoderClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'URL 編碼解碼器 - 免費線上網址 encodeURIComponent 與 decodeURIComponent 工具',
  description:
    '專業免費的線上 URL 編碼與解碼工具！支援 encodeURIComponent 與 decodeURIComponent，即時轉換含中文與特殊符號之網址。',
  keywords: 'URL編碼,URL解碼,URL Encoder,URL Decoder,encodeURIComponent,decodeURIComponent,網址轉碼',
  alternates: {
    canonical: 'https://tools.cjkuo.net/url/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/url/',
      en: 'https://tools.cjkuo.net/url/en/',
      'x-default': 'https://tools.cjkuo.net/url/en/',
    },
  },
  openGraph: {
    title: 'URL 編碼解碼器 - 免費線上網址 encodeURIComponent 與 decodeURIComponent 工具',
    description: '極速純前端 URL 編解碼工具，支援中文字元與查詢參數轉換。',
    url: 'https://tools.cjkuo.net/url/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'URL 編碼解碼器 - 免費線上網址 encodeURIComponent 與 decodeURIComponent 工具',
    description: '極速純前端 URL 編解碼工具，支援中文字元與查詢參數轉換。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'URL 編碼解碼器',
  url: 'https://tools.cjkuo.net/url/',
  description: '專業免費的線上 URL 編碼與解碼工具，支援中文與特殊字元轉換。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是 URL 編碼（Percent-encoding 百分比編碼）？為什麼網址需要編碼？',
    a: 'URL（統一資源定位器）在標準 RFC 3986 規範中僅允許使用 ASCII 字元集中的一部分安全字元（未保留字元包含 A-Z, a-z, 0-9, -, _, ., ~）。\n\n① 解決非 ASCII 字元傳輸問題：\n中文字、日文、Emoji 或其他 Unicode 字元在傳輸時，必須先轉為 UTF-8 位元組，再將每個位元組以「%」加上兩位十六進位數表示（例如「中」編碼為「%E4%B8%AD」）。\n\n② 避免語法歧義與解析錯誤：\n在 URL 中，問號 (?) 代表查詢參數開始、等號 (=) 代表鍵值分隔、井字號 (#) 代表錨點。若參數內容本身包含「&」、「=」、「?」或空格，必須先進行百分比編碼，否則後端伺服器會發生欄位切分錯誤。',
  },
  {
    q: 'encodeURIComponent() 與 encodeURI() 有什麼關鍵差別？我該在何時使用哪一個？',
    a: '兩者的核心差異在於「對 URL 保留字元（保留結構符號）」的處理策略：\n\n① encodeURIComponent()（推薦用於 Query 參數值）：\n會對所有保留字元（包含 : / ? # [ ] @ ! $ & \' ( ) * + , ; =）進行編碼。適合用於「網址參數的 Key 或 Value」，防止參數內容破壞整個網址結構。\n\n② encodeURI()（適用於完整 URL 整體轉碼）：\n會保留完整 URL 結構中的協定、路徑分隔與參數符號（如 ://, /, ?, &, # 不會被編碼），僅對非 ASCII 字元（如中文）及空格轉碼。若拿來編碼含 & 或 = 的參數值，則無法防止語意衝突。\n\n③ 結論簡記：處理單一參數內容請選 encodeURIComponent()；處理整串完整網址請選 encodeURI()。',
  },
  {
    q: '空格在 URL 中應該編碼為「%20」還是「+」？兩者有什麼差別？',
    a: '這取決於編碼規範與所在網址位置：\n\n① RFC 3986 標準規範（%20）：\n在標準 URI 規範與 HTTP 規範中，空格一律編碼為 %20。這在 Path 路徑部分（如 /user%20guide/）是唯一合法的表示方式。\n\n② application/x-www-form-urlencoded 表單規範（+）：\n早期 HTML Form 表單以 GET 或 POST 送出 application/x-www-form-urlencoded 資料時，規範將空格轉為加號「+」。現今多數後端框架（如 PHP, Spring, ASP.NET, Express）在解析 Query String 參數時，能相容將 + 與 %20 同時還原為空格。\n\n本工具下方提供「空格轉 +」快速切換開關，方便相容不同後端系統的需求。',
  },
  {
    q: '什麼是「二次編碼 / 雙重編碼 (Double Encoding)」？如何避免這種錯誤？',
    a: '雙重編碼是指「已經被 URL 編碼過的字串，被再次執行一次 URL 編碼」的常見 Bug：\n\n① 現象與範例：\n中文字「中」首次編碼為「%E4%B8%AD」，若前端或反向代理未經判算再次呼叫 encodeURIComponent，百分比符號「%」會被二次轉碼為「%25」，字串變成「%25E4%25B8%25AD」。\n\n② 嚴重後果：\n後端伺服器在接收並執行一次解碼後，拿到的是字串「%E4%B8%AD」而非原始中文「中」，導致搜尋失敗、檔案路徑找不到或資料庫存入亂碼。\n\n③ 防範策略：\n在轉發或組裝 URL 時，確認資料進入管道的狀態，使用解析器只對原始純文字進行單次編碼，或在解碼端進行容錯判定。',
  },
  {
    q: '為什麼部分網址在 decodeURIComponent() 時會跳出「URI malformed」錯誤？',
    a: '「URI malformed (格式錯誤)」通常發生在以下情境：\n\n① 不完整的百分比序列：\n字串末尾截斷遺留了「%」或單一十六進位字元（如「%E」而非「%E4」）。\n\n② 無效的 UTF-8 位元組序列：\n中文字通常由 3 個連續 UTF-8 位元組（3 組 %XX）組成。若字串被不當截字，只留下前 1 或 2 組位元組（例如只有「%E4%B8」缺少最後一組），decodeURIComponent() 判定無法重構合法 Unicode 字元即會拋出例外。\n\n③ 非 UTF-8 編碼字串：\n早期以 Big5 或 GB2312 編碼的十六進位網址，直接用現代 UTF-8 解碼器處理時會因字節不合規範而報錯。',
  },
  {
    q: '什麼是 Base64 與 URL 編碼的差別？兩者可以互相替代嗎？',
    a: '兩者的設計目標與運作機制完全不同，不能直接互相取代：\n\n① URL 編碼 (Percent-encoding)：\n僅針對非法或特殊字元以 %XX 進行替換，原本合法的 ASCII 英文與數字維持不變，長度增加有限，主要用於確保網址語法合規與參數正確傳遞。\n\n② Base64 編碼：\n將任意二進位數據或字串轉換為由 64 個可列印字元（A-Z, a-z, 0-9, +, /）組成的文字，編碼後長度固定增加約 33%。標準 Base64 包含的「+」、「/」與「=」字元在 URL 中仍屬於保留字元，若要放在 URL 中必須再做 URL 編碼或改採「Base64URL」規範。',
  },
  {
    q: '本線上工具的資料安全性與隱私保護（無伺服器端紀錄聲明）',
    a: '本工具為 100% 純前端（Client-side）純 JavaScript 執行之離線計算工具：\n\n① 零伺服器傳輸：\n您所輸入、貼上或解析的任何網址、機密 API Key、Token 或 Query 參數，完全只在您的瀏覽器記憶體中運算，絕不會上傳或發送至任何雲端伺服器與第三方資料庫。\n\n② 隱私無痕：\n無快取與無日誌記錄，請安心用於開發除錯、授權網址 (OAuth Callback) 與機密參數之檢視與編輯。',
  },
]);

export default function UrlPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <UrlEncoderClient />
    </>
  );
}


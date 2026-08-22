import type { Metadata } from 'next';
import HarCleanerClient from './HarCleanerClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'HAR 敏感資料清理工具 - 免費線上 HTTP Archive 脫敏與大檔瘦身工具',
  description:
    '專業免費的線上 HAR 封包脫敏與清理工具 (HAR Sensitive Data Sanitizer)！支援自動清除 Cookie、Authorization 標頭、Bearer JWT、API 密鑰、敏感 Query 參數與 POST Payload，100% 本機瀏覽器運算守護隱私。',
  keywords:
    'HAR清理,HAR脫敏,HTTP Archive,HAR Sanitizer,Cookie清理,Authorization,JWT脫敏,API Key,封包除錯,HAR瘦身,DevTools',
  alternates: {
    canonical: 'https://tools.cjkuo.net/har-cleaner/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/har-cleaner/',
      en: 'https://tools.cjkuo.net/har-cleaner/en/',
      'x-default': 'https://tools.cjkuo.net/har-cleaner/en/',
    },
  },
  openGraph: {
    title: 'HAR 敏感資料清理工具 - 免費線上 HTTP Archive 脫敏與大檔瘦身工具',
    description:
      '專業純前端 HAR 封包脫敏神器！自動清除 Cookie、Token、密鑰與機密個資，並可清理大檔圖片 Base64，100% 本地運算。',
    url: 'https://tools.cjkuo.net/har-cleaner/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HAR 敏感資料清理工具 - 免費線上 HTTP Archive 脫敏與大檔瘦身工具',
    description:
      '專業純前端 HAR 封包脫敏神器！自動清除 Cookie、Token、密鑰與機密個資，並可清理大檔圖片 Base64，100% 本地運算。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'HAR 敏感資料清理工具',
  url: 'https://tools.cjkuo.net/har-cleaner/',
  description:
    '專業免費的線上 HAR 封包脫敏與清理工具 (HAR Sensitive Data Sanitizer)，100% 純前端本機運算，安全去識別化。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是 HAR (HTTP Archive) 檔案？為什麼直接分享會有資安風險？',
    a: 'HAR (HTTP Archive) 是一種基於 JSON 的標準格式，用於記錄瀏覽器或客戶端與伺服器之間的所有 HTTP/HTTPS 請求與回應細節：\n\n① 涵蓋高度敏感憑據：\nHAR 檔案會忠實記錄請求發送時的 `Authorization` 標頭 (如 Bearer JWT、Basic Auth)、`Cookie` / `Set-Cookie` (含有使用者的登入 Session ID、購物車與身分識別碼)。\n\n② 容易遭到帳號劫持 (Account Takeover)：\n若未經脫敏即將 HAR 檔上傳至公開 Jira、GitHub Issue 或直接傳送給第三方廠商，攻擊者可藉由 HAR 內的 Cookie 或 Token 直接重放請求 (Replay Attack)，無需密碼即可劫持您的真實帳號。',
  },
  {
    q: '本工具是如何進行脫敏與清理的？我的封包資料會被上傳到伺服器嗎？',
    a: '100% 絕對安全！本工具採用純前端 (Client-Side) 零伺服器架構：\n\n① 記憶體內本機即時處理：\n所有 HAR 解析、正則表達式掃描、JSON 遞迴脫敏與檔案生成皆完全在您的瀏覽器 JavaScript 執行環境中完成。\n\n② 零雲端留存：\n封包內容絕不會透過網路發送到任何後端伺服器或第三方分析平台，即使拔掉網路線（離線狀態）也能順暢使用。',
  },
  {
    q: '什麼是「大檔媒體瘦身 (Media Stripping)」？開啟後有何好處？',
    a: '「大檔媒體瘦身」是本工具極具實用價值的特色功能：\n\n① 解決 HAR 檔案動輒數十 MB 的痛點：\n瀏覽器在錄製 HAR 時，會將所有圖片 (PNG, JPEG, WebP)、字型 (WOFF2)、影片及二進位檔案以 Base64 形式編碼寫入 Response Body，導致檔案體積迅速膨脹至 30MB~100MB。\n\n② 保留關鍵排錯資訊同時大幅減重：\n開啟此選項後，系統會清除這類二進位 Base64 酬載，但完整保留 HTTP 狀態碼 (如 200, 404, 500)、連線時間軸、請求與回應 Headers 以及 JSON API 數據，瞬間將檔案壓縮 90% 以上 (<1MB)，便於郵件寄送與客服上傳。',
  },
  {
    q: '工具支援脫敏哪些敏感欄位與模式？',
    a: '系統內建多層級的智慧偵測引擎：\n\n① 身分認證與標頭：\n自動脫敏 `Authorization`, `Proxy-Authorization`, `X-Api-Key`, `X-Auth-Token`, `Bearer`, `Cookie`, `Set-Cookie` 等。\n\n② 網址與表單機密 Key：\n自動攔截 `token`, `access_token`, `auth`, `api_key`, `secret`, `password`, `code`, `session_id`, `refresh_token` 等。\n\n③ 深度正則掃描 (Deep Regex)：\n自動識別並脫敏 JWT 簽章字串 (`eyJ...`)、AWS Access Key (`AKIA...`)、Stripe 密鑰 (`sk_live_...`)、電子郵件地址與 RSA/OpenSSH 私鑰。',
  },
  {
    q: '清理過後的 HAR 檔案能否重新載入到 Chrome DevTools 或 Postman 中？',
    a: '完全相容！本工具嚴格遵循 W3C HAR 1.2 規格：\n\n① 保持標準 JSON 結構：\n脫敏程序僅替換敏感字串內容（如將值替換為 `[REDACTED]`），絕不破壞 JSON 語法、陣列結構或時間戳記欄位。\n\n② 跨工具完美載入：\n匯出的 `.har` 檔案可直接重新拖曳回 Google Chrome DevTools Network 面板、Charles Proxy、Wireshark、Postman、Fiddler 或 Datadog 中正常檢視與分析。',
  },
  {
    q: '如果我有系統專屬的自訂敏感欄位（如 `customer_ssn`），該如何處理？',
    a: '您可以透過「自訂敏感欄位」功能靈活擴充：\n\n① 自訂關鍵字清單：\n在輸入框中填寫欄位名稱（以逗號或換行分隔），如 `customer_ssn, internal_org_id, pay_secret`。\n\n② 全域自動匹配：\n系統會在 Request Headers、Query 參數、POST Form 表單以及遞迴 JSON Body 中同步比對並自動脫敏該欄位。',
  },
  {
    q: '什麼是「第三方追蹤請求過濾 (Tracker Filter)」？',
    a: '過濾無效噪音請求：\n\n① 排除干擾分析的追蹤代碼：\n在錄製網站操作時，通常會伴隨大量的 Google Analytics, Facebook Pixel, Hotjar, Sentry, Datadog 等遙測封包。\n\n② 提升除錯專注度：\n開啟此功能後，系統可自動剔除這些第三方追蹤請求，讓 HAR 檔案只專注於您要排查的核心業務 API 與系統連線。',
  },
  {
    q: '如何快速驗證本工具的效果？',
    a: '一鍵體驗示範封包：\n\n① 點擊「載入示範 HAR 封包」：\n系統會載入包含真實常見情境（含 Bearer JWT、登入 Cookie、敏感 Query 參數、JSON 密碼與肥大圖片酬載）的測試 HAR。\n\n② 立即檢視對照：\n您可以切換規則開關、檢視請求詳細面板，並觀察檔案大小與脫敏前後的差異高亮。',
  },
]);

export default function HarCleanerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <HarCleanerClient lang="zh-TW" />
    </>
  );
}

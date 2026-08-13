import type { Metadata } from 'next';
import SslConverterClient from './SslConverterClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'SSL 憑證格式轉換器 - 免費線上 PFX/P12/PEM/DER 憑證轉換與效能驗證工具',
  description:
    '專業免費的線上 SSL 憑證格式轉換工具！支援 PFX/P12, PEM, DER 雙向純前端安全轉換、憑證過期時間自動檢測與私鑰模數配對雜湊比對。',
  keywords: 'SSL憑證轉換,PFX轉PEM,PEM轉PFX,DER轉PEM,P12轉換,SSL憑證,私鑰轉換,憑證效期查詢',
  alternates: {
    canonical: 'https://tools.cjkuo.net/ssl-converter/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/ssl-converter/',
      en: 'https://tools.cjkuo.net/ssl-converter/en/',
      'x-default': 'https://tools.cjkuo.net/ssl-converter/en/',
    },
  },
  openGraph: {
    title: 'SSL 憑證格式轉換器 - 免費線上 PFX/P12/PEM/DER 憑證轉換與效能驗證工具',
    description: '純前端 SSL 憑證格式轉換工具，一鍵雙向轉換 PFX, PEM, DER，具備憑證效期警告。',
    url: 'https://tools.cjkuo.net/ssl-converter/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SSL 憑證格式轉換器 - 免費線上 PFX/P12/PEM/DER 憑證轉換與效能驗證工具',
    description: '純前端 SSL 憑證格式轉換工具，一鍵雙向轉換 PFX, PEM, DER，具備憑證效期警告。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'SSL 憑證格式轉換器',
  url: 'https://tools.cjkuo.net/ssl-converter/',
  description: '專業免費的純前端 SSL 憑證格式轉換工具，支援 PFX/P12, PEM, DER 憑證雙向安全轉換與私鑰配對驗證。',
  applicationCategory: 'SecurityApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '在線上進行 SSL 憑證與私鑰 (Private Key) 格式轉換安全嗎？私鑰會不會外洩？',
    a: `100% 安全！SSL 私鑰相當於伺服器的數位印章與加密金鑰，一旦流出將面臨中間人攻擊 (MITM) 風險。傳統線上轉換器會將私鑰傳輸至後端伺服器運算，存在伺服器 Log 留存或網路攔截風險。

本工具採用「零伺服器 (Zero-Server Architecture)」原則，100% 於您的瀏覽器記憶體內完成處理。甚至在您開啟本網頁後切斷網路 (WiFi / 網線)，依然能 100% 離線完成所有 PFX 解密與 PEM/DER 轉譯，絕無任何傳輸疑慮。`,
  },
  {
    q: '為什麼可以在前端網頁執行 OpenSSL 級別的憑證運算，而不需後端伺服器服務？',
    a: '過往憑證轉碼仰賴伺服器端的 OpenSSL 指令。本工具運用現代瀏覽器強大的 Web Cryptography API 與高效率 JavaScript 密碼學引擎 (Node-Forge)，可在瀏覽器本地記憶體中直接剖析 ASN.1 二進位結構、解密 3DES / AES 加密的 PKCS#12 容器、並進行 RSA / ECC 密碼學 Modulus 雜湊比對。全過程零伺服器延遲、零硬碟寫入，且完全不消耗伺服器頻寬與運算資源。',
  },
  {
    q: '為什麼「自動偵測補鏈 (AIA CA Chain Auto-Fix)」對網站營運極為重要？',
    a: `當部署 SSL 憑證時，若未包含「中繼憑證 (Intermediate CA)」，會引發嚴重的相容性災難：

① 電腦版 Chrome/Edge 可能正常：因為桌面瀏覽器會自動下載 AIA 候補憑證或讀取本機快取。
② 手機版 iOS Safari、Android 或 API 客戶端直接崩潰：跳出 NET::ERR_CERT_AUTHORITY_INVALID 警告或 API 呼叫失敗 (unable to get local issuer certificate)。

本工具能自動解析憑證內的 AIA (Authority Information Access) 擴充欄位，精準抓取缺漏的官方 CA 下載網址，協助您一鍵合成分開的中繼憑證鏈！`,
  },
  {
    q: '常見的 SSL 憑證格式 (PFX/P12, PEM, CRT, DER) 有何不同？在什麼伺服器使用？',
    a: `SSL 憑證格式主要分為三大類別與對應伺服器：

① PEM / CRT / KEY (Base64 ASCII)：
純文字編碼檔（內文以 -----BEGIN CERTIFICATE----- 開頭），廣泛用於 Nginx、Apache、Cloudflare、AWS ELB 及 Node.js 伺服器。

② PFX / P12 (PKCS#12 二進位包)：
將伺服器憑證、私鑰與 CA 中繼鏈加密打包為單一檔，專用於 Windows IIS、Azure Web Apps 及 Tomcat / Java Web App。

③ DER / CER (ASN.1 二進位編碼)：
二進位原生格式，常見於 Java Web Server (Keystore)、嵌入式設備或舊版 Windows/Android 系統存取驗證。`,
  },
  {
    q: '為什麼將 PFX / P12 轉換為 PEM 時會需要輸入密碼？',
    a: '.pfx 或 .p12 是經過 3DES 或 AES 密碼學加密的 PKCS#12 二進位包裹，專門用來保護極為敏感的私鑰 (Private Key)。轉換時必須輸入當初在 IIS 或 Server 匯出時設定的保護密碼，瀏覽器本機的密碼引擎才能解開 PKCS#12 加密區塊並提煉出 PEM 憑證與私鑰。',
  },
  {
    q: '如何確認我上傳的 SSL 私鑰 (Private Key) 與憑證 (Certificate) 是否相互配對？',
    a: 'SSL 憑證與私鑰共享相同的公鑰模數 (Modulus)。本工具會自動對上傳的憑證與私鑰計算 SHA-256 雜湊值 (Hash)，若兩者的 Modulus Hash 100% 一致，即代表這組私鑰與憑證精準配對，免除部署至 Nginx/Apache 伺服器時才發現私鑰錯配導致 Web Server 啟動失敗的窘境。',
  },
  {
    q: '憑證過期後還能使用本工具進行格式轉換嗎？過期警告機制如何運作？',
    a: '可以。過期的憑證依然可以進行格式轉換（例如將過期憑證轉為 PEM 以利歸檔備份）。同時，工具會在結果面板自動解析憑證的「發行對象 (Subject)」、「頒發者 (Issuer)」與「有效期限 (Not After)」，若憑證過期或即將於 30 天內到期，會觸發醒目提示提醒您儘速續期。',
  },
]);

export default function SslConverterPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <SslConverterClient />
    </>
  );
}

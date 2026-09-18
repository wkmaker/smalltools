import type { Metadata } from 'next';
import PacGeneratorClient from './PacGeneratorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'PAC 規則產生器 - 免費線上 Proxy Auto-Config 腳本視覺化產生工具',
  description:
    '專業免費的線上 PAC (Proxy Auto-Config) 代理自動配置檔案產生器！提供直觀視覺化介面編排分流規則，支援 IPv4/IPv6 (isInNetEx) 雙棧網段、自訂代理池、故障轉移 Fallback 與一鍵 Data URI 匯出。',
  keywords: 'PAC產生器,PAC檔案,Proxy Auto-Config,代理自動配置,FindProxyForURL,isInNet,isInNetEx,SOCKS5,HTTP代理,分流規則',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pac-generator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pac-generator/',
      en: 'https://tools.cjkuo.net/pac-generator/en/',
      'x-default': 'https://tools.cjkuo.net/pac-generator/en/',
    },
  },
  openGraph: {
    title: 'PAC 規則產生器 - 免費線上 Proxy Auto-Config 腳本產生工具',
    description: '視覺化編排 PAC 分流規則，支援 IPv4/IPv6 雙棧子網與一鍵 Data URI 匯出，100% 瀏覽器本地安全生成。',
    url: 'https://tools.cjkuo.net/pac-generator/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PAC 規則產生器 - 免費線上 Proxy Auto-Config 腳本產生工具',
    description: '視覺化編排 PAC 分流規則，支援 IPv4/IPv6 雙棧子網與一鍵 Data URI 匯出，100% 瀏覽器本地安全生成。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PAC 規則產生器',
  url: 'https://tools.cjkuo.net/pac-generator/',
  description: '專業免費的線上 PAC 代理自動配置腳本產生工具，支援 IPv4/IPv6 雙棧與多重代理節點。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是 PAC (Proxy Auto-Config) 檔案？運作原理是什麼？',
    a: `PAC（Proxy Auto-Config，代理自動配置）是一種由 Netscape 於 1996 年制定的網路技術標準。

PAC 檔案本質上是一段定義了名為 FindProxyForURL(url, host) 的 JavaScript 函式。當作業系統或瀏覽器（如 Chrome, Edge, Safari, Firefox）發出 HTTP、HTTPS 或 FTP 連線請求前，會自動調用該函式：

① 傳入參數：正在請求的完整目標網址 (url) 與目標伺服器主機名稱 (host)。
② 執行邏輯：依據腳本內定義的條件比對（網域、IP 網段、主機名類型或時間）。
③ 回傳結果：返回如 "DIRECT"（直連不經代理）或 "PROXY 10.0.0.1:8080"（指定經由代理轉發）。

這種機制讓企業與個人無需手動切換開關，就能兼顧內網高速存取與外網安全分流。`,
  },
  {
    q: '如何在各作業系統與瀏覽器中載入 PAC 檔案？',
    a: `各平台的設定步驟如下：

① Windows 10 / 11：
開啟「設定」➔「網路和網際網路」➔「Proxy」➔ 在「自動 Proxy 設定」區域開啟「使用安裝程式碼」，在指令碼位址填入 PAC 網址或本工具產生的 Data URL，點擊「儲存」。

② macOS (Sequoia / Sonoma / Ventura)：
前往「系統設定」➔「網路」➔ 選取當前連線之網路介面（如 Wi-Fi）➔ 點擊「詳細資訊...」➔ 切換至「代理伺服器」標籤 ➔ 開啟「自動代理伺服器設定 (PAC)」➔ 貼上 URL。

③ iOS / iPadOS：
進入「設定」➔「Wi-Fi」➔ 點擊目前已連線 Wi-Fi 最右側的「(i)」圖示 ➔ 滑至底部點擊「設定代理伺服器」➔ 勾選「自動」➔ 在 URL 欄位填入網址。

④ 瀏覽器外掛 (如 SwitchyOmega)：
在情境模式中新增「PAC 情境」，直接將腳本貼入程式碼區塊或填入 PAC 網址即可即時生效。`,
  },
  {
    q: 'PAC 中的 IPv6 擴充函式 (isInNetEx) 與傳統 isInNet 有何重大差異？',
    a: `傳統 PAC 規範僅支援 32 位元的 IPv4 函式（如 isInNet、dnsResolve、myIpAddress）。如果將 IPv6 位址傳入傳統 isInNet()，在許多系統與瀏覽器中會直接拋出異常或誤判為 false。

為了解決 IPv6 雙棧（Dual-Stack）環境的路由問題，微軟與各大瀏覽器推出了 IPv6 PAC 擴展標準：

① isInNetEx(host, "2001:db8::/32")：直接原生支援標準 IPv6 CIDR 語法（例如 fc00::/7 私有網段或 fe80::/10 區域鏈路網段），亦向下相容 IPv4。
② dnsResolveEx(host)：解析目標主機並返回分號分隔的所有 IPv4 與 IPv6 IP 清單。
③ myIpAddressEx()：返回本機的所有 IPv4 與 IPv6 網路介面位址清單。

本產生器預設支援 isInNetEx 語法，兼顧現代企業與家用 IPv6 網路分流需求。`,
  },
  {
    q: '代理字串中的 DIRECT、PROXY 與 SOCKS5 備援鏈（Fallback）如何運作？',
    a: `PAC 允許單次比對回傳多個代理伺服器選項，以分號「;」區隔，瀏覽器會依序嘗試連線：

例如回傳："PROXY 10.0.0.1:8080; PROXY 10.0.0.2:8080; DIRECT"

① 優先連線：瀏覽器優先嘗試連線至 10.0.0.1:8080。
② 自動故障轉移 (Failover)：若第一台代理伺服器無回應、連線逾時或拒絕連線，瀏覽器會在數秒內無縫降階改連 10.0.0.2:8080。
③ 最終保底 (Fallback)：若兩台代理伺服器皆故障，瀏覽器最後會以 DIRECT 直連嘗試存取目標網站。

這種容錯鏈機制能大幅減少單一代理節點當機對整間公司或個人工作造成的斷網衝擊。`,
  },
  {
    q: '為什麼寫了 PAC 規則後，有些網域依然無法如預期走代理？',
    a: `常見的原因包括以下幾點：

① 規則比對順序不對：PAC 腳本是「由上至下依序執行」且「命中即回傳 (Short-circuit)」。若最上方放置了涵蓋範圍過大的萬用規則，後面的特殊規則將永遠無法被執行。
② 網域比對語法細微差異：dnsDomainIs(host, ".google.com") 只能比對子網域（如 mail.google.com），若直接訪問根網域 google.com 則不會命中。本工具產生的規則已自動補齊根網域相符判斷。
③ DNS 阻斷或逾時：若在 PAC 中濫用 dnsResolve()，瀏覽器在發送請求前必須等待本機 DNS 回應。若 DNS 伺服器延遲高或解析失敗，會導致整個網路瀏覽停頓甚至放棄代理。
④ 本機瀏覽器快取：許多瀏覽器會快取 PAC 腳本達數小時，修改 PAC 後建議重啟瀏覽器或在 chrome://net-internals/#proxy 點擊「Clear bad proxies / Re-apply settings」。`,
  },
  {
    q: '如何使用 Data URI 格式代替 HTTP 伺服器掛載 PAC 檔案？',
    a: `傳統上 PAC 檔案必須架設在一台具備正確認證與 MIME Type（application/x-ns-proxy-autoconfig）的 Web 伺服器上。

但現代作業系統（包括 macOS 與部分 Windows 組建）以及瀏覽器擴充功能均支援 RFC 2397 Data URI 語法：
data:application/x-ns-proxy-autoconfig;base64,....

點擊本工具的「複製 Data URI」按鈕，即可將整份 PAC 腳本以 Base64 編碼內嵌為單一字串。您可以直接將此字串貼入系統的 PAC 網址輸入框中，完全無需自己架設網頁伺服器或購買雲端主機！`,
  },
]);

export default function PacGeneratorPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <PacGeneratorClient lang="zh-TW" />
    </>
  );
}

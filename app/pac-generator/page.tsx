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
    q: 'PAC 分流規則支援哪些條件模式？各自適用什麼場景？',
    a: `本工具支援 8 種條件模式，涵蓋主機、網域、URL、IP 與正則表達式：

① 純主機名稱 (isPlainHostName)：
比對不含任何點號「.」的主機名稱（如 http://intranet/ 或 http://hr/）。常用於將內部局域網服務設為 DIRECT 直連，免去繁瑣的網段列舉。

② 網域後綴 (dnsDomainIs)：
比對特定網域及其所有子網域。例如填入「.google.com」會同時命中 mail.google.com、drive.google.com 與根網域 google.com。

③ 完整網域名稱 (localHostOrDomainIs / host ===)：
精確比對單一主機名。例如填入「api.github.com」僅對該主機生效，不會影響 raw.githubusercontent.com。

④ 主機名萬用字元 (shExpMatch host)：
使用星號「*」與問號「?」比對主機名結構。例如「*.internal.net」或「git-*.company.com」。

⑤ 完整 URL 萬用字元 (shExpMatch url)：
針對完整 URL 進行萬用字元比對（包含協定與路徑）。例如「https://*.secure.bank/*」或「ftp://*」。

⑥ IPv4 網段 / CIDR (isInNet)：
比對目標伺服器的 IPv4 IP 位址區間。支援標準 CIDR 格式，例如「10.0.0.0/8」、「172.16.0.0/12」或「192.168.1.0/24」。

⑦ IPv6 網段 / CIDR (isInNetEx)：
利用現代瀏覽器擴充的 isInNetEx() 函式，支援原生 IPv6 CIDR 比對。例如企業 ULA 私有網段「fc00::/7」或測試網段「2001:db8::/32」。

⑧ 正則表達式 (RegEx)：
採用 JavaScript 正則表達式進行深度比對。例如「^https?://.*\\.internal(:[0-9]+)?/」，適合複雜的多層過濾需求。`,
  },
  {
    q: '比對 IP 前先行解析主機網域名稱 (dnsResolve) 有何差別？何時該開啟？',
    a: `此選項決定在執行 IPv4/IPv6 網段比對（如 isInNet 或 isInNetEx）時，是否強制先將目標主機名稱轉換為 IP 位址：

① 未開啟（預設建議，效能最佳）：
腳本直接生成 isInNet(host, ...)。
當請求的網址本身就是 IP（例如 http://192.168.1.1/ 或 http://[fc00::1]/）時直接比對；若為一般網域（如 google.com），現代瀏覽器底層會自動處理或快速略過，完全不會產生多餘的同步 DNS 阻塞延遲。

② 開啟後（強制解析模式）：
腳本會改為生成 isInNet(dnsResolve(host), ...)。
在進行網段比對前，強制瀏覽器必須先發出一次同步 DNS 請求，將主機名稱解析為實體 IP 後再進行比對。

適用場景：
僅在特定舊型環境（例如舊版 Windows WinINet、部分 Android WebView 或特定代理客戶端中，其 isInNet 遇到網域名稱不會自動解析而直接回傳 false）才需要開啟。在一般現代瀏覽器中保持關閉即可獲得最流暢的連線體驗。`,
  },
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

④ Firefox 瀏覽器：
進入「設定」➔「一般」➔ 滑動至「網路設定」點擊「設定...」➔ 選擇「自動代理設定網址 (PAC)」➔ 貼入 URL 並確定。

⑤ 瀏覽器外掛 (如 SwitchyOmega)：
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

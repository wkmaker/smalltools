import type { Metadata } from 'next';
import PacTesterClient from './PacTesterClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'PAC 測試與除錯器 - 免費線上 Proxy Auto-Config 沙盒執行與模擬工具',
  description:
    '專業免費的線上 PAC (Proxy Auto-Config) 測試與除錯器！提供純前端安全沙盒模擬 FindProxyForURL 執行，支援單一網址深度 Trace、批量網址回歸測試、IPv6 (isInNetEx) 擴充與虛擬 DNS 環境。',
  keywords: 'PAC測試器,PAC除錯,Proxy Auto-Config,FindProxyForURL,isInNetEx,代理模擬器,PAC沙盒,批量測試,IPv6 PAC',
  alternates: {
    canonical: 'https://tools.cjkuo.net/pac-tester/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/pac-tester/',
      en: 'https://tools.cjkuo.net/pac-tester/en/',
      'x-default': 'https://tools.cjkuo.net/pac-tester/en/',
    },
  },
  openGraph: {
    title: 'PAC 測試與除錯器 - 免費線上 Proxy Auto-Config 模擬工具',
    description: '純前端沙盒模擬 PAC 執行，提供單一網址 Trace、批量回歸測試與 IPv6 擴充支援。',
    url: 'https://tools.cjkuo.net/pac-tester/',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PAC 測試與除錯器 - 免費線上 Proxy Auto-Config 模擬工具',
    description: '純前端沙盒模擬 PAC 執行，提供單一網址 Trace、批量回歸測試與 IPv6 擴充支援。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'PAC 測試與除錯器',
  url: 'https://tools.cjkuo.net/pac-tester/',
  description: '專業免費線上 PAC 腳本測試與除錯工具，支援單一網址 Trace 與批量回歸測試。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '除錯器是否支援 IPv6？如何測試 isInNetEx 與 IPv6 網段？',
    a: `是的，本除錯器具備純前端沙盒引擎，完整支援現代 IPv6 PAC 擴展標準：

① 128 位元 CIDR 前綴比對：
底層以 BigInt 精確運算，支援 isInNetEx(host, "fc00::/7")、isInNetEx(host, "2001:db8::/32") 等任何 IPv6 CIDR 遮罩。

② IPv6 目標網址與主機名稱：
您可在單一或批量測試中直接輸入帶有方括號的 IPv6 網址（如 https://[fc00::1]/service 或 http://[2001:db8::1]:8080/），沙盒能自動解析並比對。

③ 虛擬客戶端雙棧 IP (myIpAddressEx)：
在「虛擬環境與 DNS 模擬」頁籤中，可自訂模擬客戶端的 IPv6 位址，供腳本中的 myIpAddressEx() 使用。

④ Mock DNS IPv6 映射：
您可以在 Mock DNS 中將特定內部網域映射到 IPv6 位址（例如 internal.svc 2001:db8::100），以此測試網域名稱解析後的 IPv6 分流策略。`,
  },
  {
    q: '為什麼需要 PAC 測試與除錯器？傳統排查有何痛點？',
    a: `在作業系統或瀏覽器（如 Chrome / Edge / macOS）中套用 PAC 檔案時，整個網路棧是處於「黑箱狀態」的：

① 缺乏日誌與報錯：若 PAC 腳本發生語法錯誤或例外，瀏覽器通常會直接靜默忽略，並全部降階走 DIRECT 直連，使用者完全不知道哪裡出錯。
② 快取干擾除錯：瀏覽器通常會快取 PAC 解析結果數十分鐘，即使修改了設定也很難確認是否生效。
③ 無法追蹤命中邏輯：當配置了數十條規則時，很難肉眼判斷特定網址到底是被哪一條規則攔截。

本工具提供純前端沙盒環境，即時顯示每個網址的命中步驟與執行耗時，徹底解決黑箱除錯的痛苦。`,
  },
  {
    q: '如何利用單一網址 Trace (執行軌跡) 抓出規則遮蔽（Dead Code）問題？',
    a: `PAC 腳本的 FindProxyForURL 函式遵循「由上而下依序比對，命中即退出 (Short-circuit)」原則。

若在前面寫了一條範圍過寬的規則（例如 shExpMatch(host, "*.internal") 或廣域子網），它會在特殊規則之前被命中並直接 return。

透過本工具的「單一網址深度除錯 (Trace)」面板：
① 您可以看到腳本調用 PAC 函式（如 dnsDomainIs、isInNetEx、isPlainHostName）的完整順序。
② 每個函式的傳入參數與 true/false 比對結果一目了然。
③ 您可以精確定位究竟是哪一行判斷式搶先觸發了 return，從而輕鬆修正規則順序。`,
  },
  {
    q: '批量回歸測試 (Batch Verification) 在企業部署前有什麼重要性？',
    a: `企業網路環境通常涵蓋數十個內外部系統（如內部 GitLab、Jira、辦公雲端 Office 365、公有雲 AWS/GCP、生產資料庫等）。

當網路管理員需要「新增一個網域走代理」或「調整內部網段」時，最擔心的就是「改了一條規則，卻意外導致其他 5 個內部系統無法連線」。

使用批量測試功能：
① 預先儲存一組包含內網、外網、開發本機、API 伺服器的 20~50 個常用網址。
② 修改 PAC 腳本後，點擊「執行批量測試」，毫秒級產出所有網址的分流走向報表。
③ 透過狀態分類篩選（DIRECT / PROXY / ERROR）與 CSV 匯出，確保本次修改零副作用。`,
  },
  {
    q: '模擬環境 (Mock Context) 的本機 IP 與 DNS 解析功能如何使用？',
    a: `許多企業 PAC 規則會根據「使用者目前在哪裡」決定分流策略：
例如：若 myIpAddress() 在公司內網 10.x.x.x，則直接連線；若在咖啡廳或家裡（公網 IP），則走 VPN 代理。

在傳統本機測試中，您很難假裝自己在不同的 IP 網段。
透過本工具的「虛擬環境 (Mock Context)」設定：
① 您可以任意指定模擬客戶端 IPv4（如 10.100.1.5 或 203.0.113.88）與 IPv6 位址。
② 您可以自訂 Mock DNS 映射（例如指定 dev.internal 解析為 192.168.99.1）。
如此即可在不更動任何本機網路介面的情況下，完整模擬跨地域、跨網段的 PAC 分流邏輯。`,
  },
  {
    q: '為什麼我的 PAC 在測試器中跑出 SOCKS5，但瀏覽器卻說連線失敗？',
    a: `PAC 檔案的職責僅為「決策路由走向」，它告訴瀏覽器「請把這個網址送給 SOCKS5 127.0.0.1:1080」。

若測試器評估為 SOCKS5 127.0.0.1:1080，但實際瀏覽器無法上網，通常是以下外部原因：
① 代理伺服器本體未啟動：本機的 SOCKS5 客戶端（如 Clash、v2ray、SSH Tunnel）沒有在指定埠號（1080）監聽。
② 防火牆阻擋：作業系統防火牆或防毒軟體阻擋了對 127.0.0.1 或遠端 Proxy 主機的連線。
③ 代理類型不相容：某些舊版軟體不支援 SOCKS5 語法（需寫成 SOCKS）。
建議在回傳字串中使用 Fallback 鏈，例如 "SOCKS5 127.0.0.1:1080; DIRECT"，防範代理中斷時直接斷網。`,
  },
  {
    q: 'PAC 檔案中的效能瓶頸（如 dnsResolve 阻塞）該如何透過此工具評估？',
    a: `在 PAC 腳本中，最嚴重的效能殺手就是頻繁呼叫 dnsResolve() 或 isResolvable()。

瀏覽器在評估 PAC 腳本時通常是同步且單執行緒的。如果腳本中對每個網址都進行 DNS 解析，而 DNS 伺服器有 100ms 延遲，使用者每次點擊網頁就會卡頓 100ms。

優化原則：
① 優先以純字串比對：優先使用 isPlainHostName() 與 dnsDomainIs()，完全零 DNS 開銷。
② 善用 IPv6 CIDR 擴充：使用 isInNetEx() 支援 IPv4/IPv6 前綴比對，避免將 IP 解析邏輯寫死在前端。
③ 觀察執行耗時：本測試器顯示毫秒級 executionTimeMs，若單次評估超過 5ms 即需檢視是否有過多巢狀比對。`,
  },
]);

export default function PacTesterPage() {
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
      <PacTesterClient lang="zh-TW" />
    </>
  );
}

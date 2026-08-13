import type { Metadata } from 'next';
import DnsDigClient from './DnsDigClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'DNS DIG 線上查詢工具 - 免費 Cloudflare/Google DoH 網域 DNS 記錄檢索器',
  description:
    '專業免費的線上 DNS DIG 網路診斷工具！支援 Cloudflare 與 Google DNS over HTTPS (DoH) API，即時檢索 A, AAAA, CNAME, MX, TXT, NS 等紀錄。',
  keywords: 'DNS查詢,DIG工具,DNS Lookup,DNS記錄,Cloudflare DoH,Google DoH,網域診斷,MX記錄查詢',
  alternates: {
    canonical: 'https://tools.cjkuo.net/dns-dig/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/dns-dig/',
      en: 'https://tools.cjkuo.net/dns-dig/en/',
      'x-default': 'https://tools.cjkuo.net/dns-dig/en/',
    },
  },
  openGraph: {
    title: 'DNS DIG 線上查詢工具 - 免費 Cloudflare/Google DoH 網域 DNS 記錄檢索器',
    description: '工程師的線上 DNS 診斷利器。支援 Cloudflare/Google DoH 自由切換、自動網域清理與記錄檢索。',
    url: 'https://tools.cjkuo.net/dns-dig/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DNS DIG 線上查詢工具 - 免費 Cloudflare/Google DoH 網域 DNS 記錄檢索器',
    description: '工程師的線上 DNS 診斷利器。支援 Cloudflare/Google DoH 自由切換、自動網域清理與記錄檢索。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'DIG 網路診斷工具 (DNS Lookup)',
  url: 'https://tools.cjkuo.net/dns-dig/',
  description: '專業免費的線上 DNS DIG 網路診斷工具，利用 Cloudflare 與 Google DoH API 即時查詢各類 DNS 記錄。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是 DNS Over HTTPS (DoH)？與傳統 UDP 53 埠 DNS 查詢有何不同？',
    a: '傳統 DNS 查詢透過 UDP/TCP Port 53 以明文發送，容易遭 ISP 電信業者、公共 Wi-Fi 監聽或中間人竄改 (DNS Hijacking)。DoH (RFC 8484) 將 DNS 查詢封裝在 TLS 加密通道中 (HTTPS 443 埠)，不僅大幅提升網路隱私防護，更能繞過企業防火牆對 53 埠的干擾限制。本工具預設支援 Cloudflare (1.1.1.1)、Google (8.8.8.8) 與 AliDNS 即時切換查詢。',
  },
  {
    q: '常見的 DNS 紀錄類型 (A, AAAA, CNAME, MX, TXT, NS, CAA) 代表什麼意思？',
    a: `常見 DNS 紀錄功能如下：

① A 紀錄：將網域名稱指向 IPv4 位址（如 192.0.2.1）。
② AAAA 紀錄：將網域名稱指向 IPv6 位址（如 2001:db8::1）。
③ CNAME 紀錄：網域別名，將網域指向另一個目標網域名稱。
④ MX 紀錄：郵件伺服器紀錄，指定接收該網域 Email 的 Mail Server 及其優先權 (Priority)。
⑤ TXT 紀錄：文字紀錄，常用於 SPF、DKIM、DMARC 郵件防偽認證及網域所有權驗證。
⑥ NS 紀錄：指定託管該網域 DNS 解析的權威名稱伺服器 (Name Server)。
⑦ CAA 紀錄：指定僅允許哪些 CA 憑證頒發機構為該網域簽發 SSL 憑證。`,
  },
  {
    q: '什麼是 DNS 全球快取生效時間 (DNS Propagation) 與 TTL？',
    a: 'TTL (Time To Live) 代表 DNS 紀錄在各級 DNS 伺服器中的「快取快照有效秒數」（例如 TTL=300 代表快取 5 分鐘）。當您修改網域 IP 或 DNS 紀錄時，全球 ISP 電信業者與 DNS 快取伺服器需要數分鐘至 48 小時逐步更新舊快取，此過程稱為 DNS 擴散 (Propagation)。本工具查詢結果會精準顯示目前各紀錄剩餘的 TTL 秒數。',
  },
  {
    q: '為什麼在設定網域指向時，A 紀錄與 CNAME 不能同時共存在 Root 網域（@ 裸網域）？',
    a: '依據 RFC 1034 規範，CNAME 紀錄代表「全權移交」，任何設定 CNAME 的網域名稱不得再共存其他紀錄類型 (如 MX, TXT)。由於 Root 網域 (example.com) 必須包含 NS 與 SOA 紀錄，因此傳統上 Root 網域不能設 CNAME。解決方案是使用 Cloudflare 的 CNAME Flattening 或 ALIAS 紀錄技術。',
  },
  {
    q: '什麼是最新 RFC 9460 HTTPS / SVCB 紀錄？為什麼傳統 DIG 查詢看不懂？',
    a: 'HTTPS (TYPE 65) 與 SVCB (TYPE 64) 是網際網路工程任務組 (IETF) 推出的最新 DNS 規格，允許瀏覽器在發出 HTTP/3 或 QUIC 請求前，直接透過 DNS 取得目標伺服器的 ALPN (HTTP/2 / HTTP/3 協定)、ECH (Encrypted Client Hello 隱私防護) 與自訂 Port。由於這是二進位 Wire Format，傳統命令列 dig 工具若版本過舊會顯示為 TYPE65 原生十六進位，本工具內建 RFC 9460 解碼引擎，能自動解析為易讀的格式。',
  },
  {
    q: '在本工具查詢 DNS 紀錄，結果會被快取嗎？與其他第三方 DNS 網站有何不同？',
    a: `本工具 100% 由您的瀏覽器直接發起 HTTP/2 連線連至官方 DoH 端點 (Cloudflare 1.1.1.1 / Google 8.8.8.8)，全程絕不經過任何第三方中繼代理伺服器 (No Third-Party Proxy Server)！

這帶來三大核心優勢：
① 100% 直連零轉手：查詢請求由您自己的瀏覽器直連官方 DNS 伺服器，絕無中間伺服器截留或記錄。
② 零快取即時反應：不經過第三方網站伺服器快取，只要上游 DNS 完成更新，即可立即查驗最新數據。
③ 極致隱私保護：本伺服器完全不收集、不紀錄您的查詢目標網域或 IP 歷程，確保診斷時的絕對隱私。`,
  },
  {
    q: '為什麼我在 DNS 代管商 (如 GoDaddy, Cloudflare, Namecheap) 修改了紀錄，查詢結果卻顯示舊的 IP 或沒有生效？',
    a: `網域 DNS 修改未即時生效，通常由以下 4 大關鍵原因造成：

① TTL (快取時間) 尚未過期：
在您修改之前，舊的 DNS 紀錄已經被全球 ISP 電信業者（如中華電信、遠傳）或您的電腦/手機快取。必須等待舊紀錄的 TTL 秒數倒數歸零（例如 300 秒或 86400 秒），快取伺服器才會向權威 DNS 抓取新資料。

② 本機電腦或瀏覽器 DNS 快取殘留：
您的作業系統或瀏覽器（如 Chrome/Edge）會建立本機快取。可嘗試執行 ipconfig /flushdns (Windows) 或清空瀏覽器快取，並切換手機行動網路 (4G/5G) 測試。

③ 名稱伺服器 (NS 紀錄) 指向錯誤或修改中：
若您剛更換 DNS 代管商（如將 NS 改為 Cloudflare），NS 轉移屬於頂級網域 (TLD) 層級的異動，全球廣播擴散需要 24 至 48 小時才能完整生效。

④ 權威 DNS 伺服器同步延遲：
部分 DNS 代管平台在您點擊「儲存」後，內部叢集伺服器之間需要數秒至數分鐘進行資料同步。您可以透過本工具切換 Cloudflare DoH 或 Google DoH 交叉比對最新解析狀況！`,
  },
]);

export default function DnsDigPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <DnsDigClient lang="zh-TW" />
    </>
  );
}

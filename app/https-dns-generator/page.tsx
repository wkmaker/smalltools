import type { Metadata } from 'next';
import HttpsDnsGeneratorClient from './HttpsDnsGeneratorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'DNS HTTPS 紀錄 (Type 65) 設定產生器與教學 - 免費線上 DNS 產生工具',
  description:
    '免費線上 DNS HTTPS (Type 65) 紀錄產生器與設定教學。支援 RFC 9460 規範之服務模式 (Service Mode) 與別名模式 (Alias Mode)，透過勾選與填空即時生成 ALPN、ipv4hint、ipv6hint、port 等參數。',
  keywords: 'DNS HTTPS record generator, Type 65, RFC 9460, SVCB, Cloudflare HTTPS record, ALPN, ipv4hint, ipv6hint, DNS 設定教學',
  alternates: {
    canonical: 'https://tools.cjkuo.net/https-dns-generator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/https-dns-generator/',
      en: 'https://tools.cjkuo.net/https-dns-generator/en/',
      'x-default': 'https://tools.cjkuo.net/https-dns-generator/en/',
    },
  },
  openGraph: {
    title: 'DNS HTTPS 紀錄 (Type 65) 設定產生器與教學',
    description: '視覺化勾選與填空即時產生符合 RFC 9460 規範的 DNS HTTPS (Type 65) 紀錄。',
    url: 'https://tools.cjkuo.net/https-dns-generator/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'DNS HTTPS 紀錄 (Type 65) 設定產生器與教學',
    description: '視覺化勾選與填空即時產生符合 RFC 9460 規範的 DNS HTTPS (Type 65) 紀錄。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'DNS HTTPS 紀錄 (Type 65) 設定產生器與教學',
  url: 'https://tools.cjkuo.net/https-dns-generator/',
  description: '線上可視化 DNS HTTPS (Type 65 / RFC 9460) 紀錄產生與設定指南小工具。',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是 DNS HTTPS 紀錄 (Type 65 / RFC 9460)？它能解決什麼問題？',
    a: 'DNS HTTPS 紀錄（Resource Record Type 65）是 IETF 於 RFC 9460 頒布的新世代 DNS 資源紀錄規格（為 SVCB 針對 HTTPS 服務之特化版）：\n\n① 整合協定參數與位址查詢：\n傳統連線需先查詢 A/AAAA 取得 IP，再透過 HTTP 請求或 Alt-Svc 標頭協商 HTTP/2 或 HTTP/3。HTTPS 紀錄能讓客戶端在 DNS 階段一次取得 IP、支援協定 (ALPN)、自訂 Port 與 ECH 加密公鑰。\n\n② 根網域別名別名支援：\n克服了 RFC 1034 中根網域 (Zone Apex) 無法設定 CNAME 的長年技術限制。',
  },
  {
    q: 'HTTPS 紀錄的「服務模式 (Service Mode)」與「別名模式 (Alias Mode)」有何差別？',
    a: '兩者的區別主要取決於 SvcPriority（優先權）數值：\n\n① Alias Mode（優先權 = 0）：\n當 Priority 為 0 時即為別名模式，僅需指定 TargetName 目標主機。其行為類似 CNAME 但允許安全設定於根網域 (Apex Domain)，客戶端將自動轉向查詢目標主機之 HTTPS 紀錄。\n\n② Service Mode（優先權 ≥ 1）：\n優先權數值越小越優先。此模式下可綁定各項 SvcParams 參數（如 `alpn="h2,h3"`、`port=8443`、`ipv4hint` 等），指示瀏覽器直接發起最佳連線。',
  },
  {
    q: '為什麼 HTTPS 紀錄能加速 HTTP/3 (QUIC) 連線並免除 0-RTT 握手延遲？',
    a: '加速機制主要來自通訊協定預知能力：\n\n① 免除 Alt-Svc 升級往返：\n過去瀏覽器首次造訪網站時必須先發起 TCP/TLS (HTTP/1.1 或 HTTP/2) 連線，收到伺服器回傳 `Alt-Svc: h3=":443"` 標頭後，下一次連線才會嘗試 HTTP/3。\n\n② DNS 階段直接發起 QUIC：\n透過 HTTPS 紀錄宣告 `alpn="h3,h2"`，現代瀏覽器（如 Chrome, Safari, Firefox）在 DNS 解析當下即知曉網站支援 HTTP/3，首個請求即可直接發起 UDP QUIC 握手，省下完整 1 次 Round-Trip 延遲。',
  },
  {
    q: '什麼是 `ipv4hint` 與 `ipv6hint`？對提升連線效能有何幫助？',
    a: 'IP Hint 參數是嵌入在 HTTPS 紀錄中的 IP 快取提示：\n\n① 減少額外 DNS 查詢往返：\n當 TargetName 指向跨網域 CDN 或別名主機時，客戶端通常需額外發起 A/AAAA 查詢。`ipv4hint` 與 `ipv6hint` 提供一組建議 IP，允許客戶端在非同步驗證 A/AAAA 紀錄的同時直接嘗試連線。\n\n② 嚴格驗證機制：\nRFC 9460 規範客戶端仍須在背景完成權威 A/AAAA 驗證，兼顧極速首屏連線與 DNS 安全性。',
  },
  {
    q: 'HTTPS 紀錄如何支援 ECH (Encrypted Client Hello) 隱私保護技術？',
    a: 'ECH 是 TLS 1.3 的重大隱私升級：\n\n① 隱藏 SNI (伺服器名稱指示)：\n傳統 TLS 握手中的 Client Hello 封包包含明文 SNI 網域名稱，容易遭中繼 ISP 或網路監聽者窺探瀏覽目標。\n\n② 透過 DNS 發布 ECH 公鑰：\nHTTPS 紀錄中可攜帶 `ech="Base64..."` 參數發布網站公鑰，客戶端在發起 TLS 握手前即利用該公鑰將整個 Client Hello 內層加密，徹底杜絕 SNI 洩漏。',
  },
  {
    q: '為什麼 HTTPS 紀錄可以用在根網域 (Zone Apex) 取代 CNAME 限制？',
    a: '解決了 DNS 規範的歷史痛點：\n\n① CNAME 衝突問題：\n依據 DNS 規範，根網域（如 `example.com`）必須具備 SOA 與 NS 紀錄，而 CNAME 規定不能與任何其他紀錄共存，導致根網域無法直接指向 CDN 節點主機。\n\n② Alias Mode 完美相容：\nHTTPS 紀錄（Priority 0 Alias Mode）作為獨立資源紀錄型別，可與 SOA/NS 和平共存，提供標準化、跨 DNS 服務商相容的根網域名稱別名解析。',
  },
  {
    q: 'Cloudflare、AWS Route53 與 BIND 9 在設定 HTTPS 紀錄時格式有何不同？',
    a: '各大 DNS 供應商提供不同層級的後台輸入欄位：\n\n① Cloudflare DNS：\n提供結構化 4 欄位介面（名稱、優先權、目標、值 SvcParams），可分項填寫。\n\n② AWS Route 53：\n直接在單一 Value 欄位貼上 RFC 9460 完整參數字串（如 `1 . alpn="h2,h3"`）。\n\n③ BIND 9 / NSD Zone File：\n標準單行格式，例如 `@ IN HTTPS 1 . alpn="h2,h3" ipv4hint=203.0.113.1`。本工具提供一鍵切換與各平台填寫教學。',
  },
  {
    q: '為什麼有些 DNS 原始回應解析出來看起來像亂碼，而本工具能正常呈現？',
    a: '底層二進位 Wire Format 與展示層解碼之技術差異：\n\n① 原始回應為二進位十六進位編碼：\nHTTPS 紀錄（Type 65）在底層網路封包傳輸時採用二進位二元組（Key-Value Wire Format）編碼。舊版終端機指令（如舊版 `dig TYPE65`）或不支援 RFC 9460 的 DNS 工具，會將其當作未知紀錄（Unknown RR Type），並輸出十六進位原始字串（例如 `\\# 22 00010000010005026832...`）甚至不可讀字元，看起來就像亂碼。\n\n② 本工具內建標準 RFC 9460 語法解析引擎：\n本工具具備完整的 RFC 9460 解碼引擎，能自動將二進位或十六進位資料反向解析還原為人類易讀的參數（如 ALPN 協定、IP Hints、ECH 加密金鑰等），並可直接轉換成各大雲端服務商的標準設定語法。',
  },
]);

export default function HttpsDnsGeneratorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <HttpsDnsGeneratorClient lang="zh-TW" />
    </>
  );
}

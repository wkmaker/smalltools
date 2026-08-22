import type { Metadata } from 'next';
import IpDetectorClient from './IpDetectorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'IP 檢測助手 - 免費線上 IPv4/IPv6 查詢、IP 地理位置與連線延遲診斷',
  description:
    '專業免費的線上 IP 檢測與診斷工具！即時查詢您的外網 IPv4 與 IPv6 位址、地理位置、Cloudflare 節點資訊及各大公有雲 (AWS, GCP, Azure) 連線延遲 (Latency)。',
  keywords: 'IP檢測,我的IP,IPv4查詢,IPv6查詢,IP位置,IP地理位置,連線延遲,Cloudflare Trace',
  alternates: {
    canonical: 'https://tools.cjkuo.net/ip-detector/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/ip-detector/',
      en: 'https://tools.cjkuo.net/ip-detector/en/',
      'x-default': 'https://tools.cjkuo.net/ip-detector/en/',
    },
  },
  openGraph: {
    title: 'IP 檢測助手 - 免費線上 IPv4/IPv6 查詢與連線延遲診斷',
    description: '即時檢測您的 IPv4/IPv6，解析 Cloudflare Trace 與隱私狀態，並診斷各大公有雲與 CDN 之連線延遲。',
    url: 'https://tools.cjkuo.net/ip-detector/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IP 檢測助手 - 免費線上 IPv4/IPv6 查詢與連線延遲診斷',
    description: '即時檢測您的 IPv4/IPv6，解析 Cloudflare Trace 與隱私狀態，並診斷各大公有雲與 CDN 之連線延遲。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'IP 檢測助手',
  url: 'https://tools.cjkuo.net/ip-detector/',
  description: '專業免費的網路 IP 檢測與診斷助手，支援 IPv4/IPv6 雙棧查詢與公有雲延遲量測。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
  {
    q: '什麼是 IPv4 與 IPv6？兩者有何核心技術差異？',
    a: 'IPv4 與 IPv6 是網際網路通訊協定的不同世代標準：\n\n① IPv4（32 位元）：\n採用 4 組 0~255 的十進位數字組成（例如 `203.0.113.1`），全球總容量僅約 43 億個位址，目前已全數配發完畢，主要依賴 NAT（網路位址轉譯）共用 IP。\n\n② IPv6（128 位元）：\n採用 8 組十六進位數字組成（例如 `2001:db8::1`），可提供高達 3.4 × 10^38 個位址（近乎無限），具備原生端到端加密通訊、更簡化的封包標頭與更佳的路由傳輸效能。',
  },
  {
    q: '為什麼我的設備只顯示 IPv4 而沒有檢測出 IPv6？',
    a: '未偵測到 IPv6 通常有以下幾個常見原因：\n\n① 電信寬頻服務商 (ISP)：\n部分家用寬頻或行動網路業者尚未全面為用戶開啟原生 IPv6 雙棧 (Dual-Stack) 服務。\n\n② 家用路由器未啟用 IPv6：\n許多 Wi-Fi 分享器或路由器預設關閉 IPv6 DHCP/SLAAC 功能，需進入路由器後台開啟。\n\n③ VPN 或 Proxy 代理限制：\n若您正在使用 VPN 軟體，部分 VPN 伺服器僅轉發 IPv4 流量並停用 IPv6 以防 DNS/IP 洩漏。',
  },
  {
    q: '什麼是 Cloudflare Trace 與邊緣節點 (Colo Data Center)？',
    a: 'Cloudflare Trace 提供了用戶端連線至全球邊緣網路的第一手診斷數據：\n\n① 機房代碼 (Colo)：\n顯示離您最近且目前承接連線的 Cloudflare 國際機場代碼（例如 TPE 代表台北、HKG 代表香港、NRT 代表東京）。\n\n② 連線協定與安全性：\n檢測您與邊緣伺服器握手所採用的最高連線協議（如 HTTP/2、HTTP/3 QUIC）及 TLS 加密狀態。',
  },
  {
    q: '公網 IP (Public IP) 與私有/虛擬 IP (Private IP) 有何區別？',
    a: '兩者的網路路由範圍完全不同：\n\n① 私有區域 IP（如 `192.168.x.x`、`10.x.x.x`、`172.16.x.x`）：\n僅在您的家庭或公司內部區域網路 (LAN) 有效，外部網際網路無法直接存取。\n\n② 公網 IP（Public IP）：\n由電信業者配發給您對外連線的唯一全球識別碼，本工具檢測顯示的即是您的公網 IP 位址。',
  },
  {
    q: 'IP 地理位置 (GeoIP) 與 ASN 自治系統編號是如何被判定的？精準度如何？',
    a: '地理資訊來自全球 IP 分配資料庫（如 MaxMind、IPinfo 等）：\n\n① ASN (Autonomous System Number)：\n代表負責路由您網路流量的電信網路自治系統組織（如中華電信 AS3462、台灣固網 AS9924）。\n\n② 精準度說明：\nIP 地理定位通常精準對應至「國家」與「城市」級別，但因動態 IP 池調度，無法精確定位至特定街道或住家門牌，保障使用者實體安全。',
  },
  {
    q: '為什麼要提供各大公有雲（AWS, GCP, Azure, Cloudflare）與常見服務的連線檢測？',
    a: '提供一站式網路健康度與節點通暢性診斷：\n\n① 單一頁面快速檢測全球服務訪問能力：\n讓工程師、網管與使用者能快速透過單一儀表板，確認當前網路節點/IP 是否能正常無阻礙地連線各大主流雲端廠商、CDN 與核心服務（如 AWS, GCP, Cloudflare, GitHub 等），迅速排查是否遭遇路由繞遠路、服務異常或 DNS 污染。\n\n② 瀏覽器端直接請求、所有連線透明可見：\n本檢測完全由您的瀏覽器端向各大雲端業者端點發起真實請求，並非透過第三方中間代理伺服器代跑轉發。所有網路請求在瀏覽器 DevTools 開發者工具中皆清晰可見，數據百分之百真實且透明安全。',
  },
  {
    q: '本 IP 檢測助手是否會記錄或儲存我的 IP 歷史隱私數據？',
    a: '絕對不會！本檢測助手秉持極致隱私保護原則：\n\n① 純前端即時請求：\n所有 IP 查詢與延遲測速皆由瀏覽器向各端點即時發出，本站伺服器完全不記錄、不儲存亦不販售任何訪客的 IP 位址或歷史測速紀錄。\n\n② 診斷數據隨開隨測：\n所有資訊僅於您開啟網頁的當下於本地瀏覽器展示，關閉網頁後立即銷毀。',
  },
]);

export default function IpDetectorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      {faqJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      )}
      <IpDetectorClient lang="zh-TW" />
    </>
  );
}

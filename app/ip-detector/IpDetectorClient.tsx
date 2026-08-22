'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './ip-detector.module.css';

interface CloudTarget {
  key: string;
  name: string;
  url: string;
  latency: number | null;
  status: 'loading' | 'connected' | 'failed';
}

interface CfTraceInfo {
  ip?: string;
  colo?: string;
  loc?: string;
  http?: string;
  uag?: string;
  latency?: number;
  error?: boolean;
}

interface GeoInfo {
  org?: string;
  asn?: string;
  network?: string;
  location?: string;
  latlon?: string;
  timezone?: string;
  currency?: string;
  source?: string;
  error?: boolean;
}

interface IpDetectorClientProps {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: '線上 IP 檢測助手',
    subtitle: 'MY IP ADDRESS & DIAGNOSTICS',
    description:
      '專業免費的線上 IP 檢測與診斷工具！支援 IPv4/IPv6 雙棧即時查詢、Cloudflare Trace 機房節點解析、IP 地理位置與 10 大公有雲 (AWS, GCP, Azure) 連線延遲診斷。',
    ipv4Title: 'IPv4 地址',
    ipv6Title: 'IPv6 地址',
    detecting: '偵測中...',
    unsupported: '不支援',
    copyBtn: '複製',
    cfTraceTitle: 'Cloudflare Trace 連線診斷',
    cfLoading: '讀取連線資訊中...',
    cfError: 'Cloudflare 診斷失敗 / 網路連線阻斷',
    connIp: '連線 IP:',
    coloNode: '機房節點 (colo):',
    geoLoc: '地理位置 (loc):',
    httpProto: '最高連線協定:',
    latency: '連線延遲 (Latency):',
    tlsSecurity: '連線加密狀態:',
    tlsSecured: 'TLS 傳輸加密 (安全)',
    browserUa: '瀏覽器 UA (User Agent):',
    geoTitle: 'IP 地理位置與網路拓撲資訊',
    geoLoading: '正在解析 IP 地理位置...',
    geoError: '地理資訊查詢失敗，請稍後重試',
    ispOrg: '電信商 / 機構 (ISP/Org):',
    asnLabel: '自治系統號碼 (ASN):',
    cidrLabel: '路由網路區段 (CIDR):',
    locationLabel: '地理位置 (國家/城市):',
    latlonLabel: '經緯度座標 (Lat/Lon):',
    timezoneLabel: '時區 (Timezone):',
    currencyLabel: '當地貨幣代碼:',
    dataSource: '資料來源:',
    cloudTitle: '主流公有雲與 CDN 連線延遲診斷 (Latency Ping)',
    retestBtn: '重新測試',
    testing: '測速中...',
    failed: '連線逾時/失敗',
    recheckAllBtn: '重新檢測所有網路診斷數據',
    copiedToast: '已複製到剪貼簿',
    unknown: '未知',
    faqTitle: '常見問題與專業指南 (FAQ)',
    faqSubtitle: '深入了解 IPv4/IPv6 協定架構、Cloudflare 節點路由、公有雲延遲判定與隱私安全性',
    faqItems: [
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
    ],
  },
  en: {
    title: 'My IP Address & Network Diagnostics',
    subtitle: 'MY IP ADDRESS & DIAGNOSTICS',
    description:
      'Professional free online IP address detector and diagnostic tool. Supports dual-stack IPv4/IPv6 lookup, Cloudflare Trace edge analysis, IP geolocation, and latency diagnostics for major cloud providers (AWS, GCP, Azure).',
    ipv4Title: 'IPv4 Address',
    ipv6Title: 'IPv6 Address',
    detecting: 'Detecting...',
    unsupported: 'Unsupported',
    copyBtn: 'Copy',
    cfTraceTitle: 'Cloudflare Trace Diagnostics',
    cfLoading: 'Loading connection details...',
    cfError: 'Cloudflare diagnosis failed / Connection blocked',
    connIp: 'Connected IP:',
    coloNode: 'Data Center (colo):',
    geoLoc: 'Location (loc):',
    httpProto: 'Highest Protocol:',
    latency: 'Latency:',
    tlsSecurity: 'Transport Security:',
    tlsSecured: 'TLS Encrypted (Secure)',
    browserUa: 'User Agent (UA):',
    geoTitle: 'IP Geolocation & Network Info',
    geoLoading: 'Fetching geolocation data...',
    geoError: 'Geolocation lookup failed, fallback unavailable',
    ispOrg: 'ISP / Organization:',
    asnLabel: 'ASN:',
    cidrLabel: 'Network (CIDR):',
    locationLabel: 'Location:',
    latlonLabel: 'Coordinates (Lat/Lon):',
    timezoneLabel: 'Timezone:',
    currencyLabel: 'Currency:',
    dataSource: 'Data Source:',
    cloudTitle: 'Cloud & CDN Service Latency Diagnostics',
    retestBtn: 'Retest Latency',
    testing: 'Testing...',
    failed: 'Connection Failed',
    recheckAllBtn: 'Re-run All Network Diagnostics',
    copiedToast: 'Copied',
    unknown: 'Unknown',
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Learn about IPv4/IPv6 architectures, Cloudflare edge routing, cloud latency benchmarks, and privacy protection',
    faqItems: [
      {
        q: 'What is the technical difference between IPv4 and IPv6 addresses?',
        a: 'IPv4 and IPv6 represent different generations of the Internet Protocol:\n\n① IPv4 (32-bit):\nFormatted as four decimal blocks (e.g. `203.0.113.1`), yielding ~4.3 billion unique addresses globally. The IPv4 pool is completely exhausted, requiring Network Address Translation (NAT) for shared access.\n\n② IPv6 (128-bit):\nFormatted as eight hexadecimal groups (e.g. `2001:db8::1`), providing 3.4 × 10^38 addresses (virtually inexhaustible), native end-to-end encryption support, and streamlined packet routing.',
      },
      {
        q: 'Why does my device show a public IPv4 address but no IPv6 address?',
        a: 'An undetected IPv6 address usually stems from several network factors:\n\n① ISP Configuration:\nYour Internet Service Provider (ISP) may not have provisioned dual-stack IPv6 connectivity on your broadband or mobile plan.\n\n② Home Router Settings:\nMany consumer Wi-Fi routers disable IPv6 DHCP/SLAAC routing by default; enabling IPv6 in the router admin panel resolves this.\n\n③ VPN or Proxy Restrictions:\nCertain VPN providers route only IPv4 traffic and deliberately disable IPv6 to prevent DNS and IPv6 leaks.',
      },
      {
        q: 'What is Cloudflare Trace and what does the edge data center code (Colo) mean?',
        a: 'Cloudflare Trace provides live diagnostic metadata from your nearest edge node:\n\n① Colo Airport Code:\nIdentifies the nearest Cloudflare data center handling your request (e.g., TPE for Taipei, HKG for Hong Kong, NRT for Tokyo, SFO for San Francisco).\n\n② Protocol & Security:\nDetects your client TLS cipher negotiation and the highest negotiated HTTP protocol (HTTP/2 or HTTP/3 QUIC).',
      },
      {
        q: 'How does a Public IP address differ from a Private / Local IP address?',
        a: 'Their routing scopes and network boundaries differ:\n\n① Private IP (`192.168.x.x`, `10.x.x.x`, `172.16.x.x`):\nUsed exclusively inside your local home or corporate network (LAN) and cannot be directly routed across the public Internet.\n\n② Public IP:\nA globally unique address assigned by your ISP that identifies your modem or gateway to the worldwide web. This tool displays your outward-facing Public IP.',
      },
      {
        q: 'How are IP Geolocation (GeoIP) and ASN Autonomous System Numbers determined?',
        a: 'Location data is derived from global IP allocation databases (MaxMind, IPinfo):\n\n① ASN (Autonomous System Number):\nIdentifies the carrier network routing your traffic (e.g. Chunghwa Telecom AS3462, Comcast AS7922).\n\n② Accuracy Overview:\nGeolocation is generally accurate to the country and metro city level. For privacy reasons, IP geolocation does not pinpoint individual street addresses.',
      },
      {
        q: 'Why does this tool test latency to major public clouds (AWS, GCP, Azure, Cloudflare) and popular services?',
        a: 'Providing comprehensive, single-page network reachability and health diagnostics:\n\n① Unified Global Service Reachability Audit:\nEngineers and users can verify from a single dashboard whether their current network node/IP can reach major cloud infrastructure, CDNs, and critical platforms (AWS, GCP, Cloudflare, GitHub, etc.) without routing sub-optimizations or ISP throttling.\n\n② Direct Browser Requests with Full Visibility:\nAll reachability tests are executed directly from your local browser to the target cloud provider endpoints—never routed through opaque third-party proxy relays. Every single request is fully inspectable in your browser Developer Tools (Network tab), guaranteeing 100% genuine and transparent metrics.',
      },
      {
        q: 'Does this IP detection tool record, log, or track my IP history?',
        a: 'Never! We strictly enforce a zero-logging privacy policy:\n\n① Direct Client-Side Requests:\nAll IP detection and ping measurements are dispatched in real-time by your browser. No IP addresses or test results are logged, stored, or monetized on our servers.\n\n② Ephemeral Session Data:\nAll diagnostics live solely in your browser memory and are permanently cleared when you close the tab.',
      },
    ],
  },
};

const CLOUD_ENDPOINTS: Array<{ key: string; name: string; url: string }> = [
  { key: 'aws', name: 'Amazon AWS', url: 'https://checkip.amazonaws.com/' },
  { key: 'gcp', name: 'Google Cloud', url: 'https://clients3.google.com/generate_204' },
  { key: 'azure', name: 'Microsoft Azure', url: 'https://azure.microsoft.com/' },
  { key: 'aliyun', name: 'Alibaba Cloud', url: 'https://www.aliyun.com/' },
  { key: 'tencent', name: 'Tencent Cloud', url: 'https://www.tencentcloud.com/' },
  { key: 'apple', name: 'Apple Captive', url: 'https://captive.apple.com/hotspot-detect.html' },
  { key: 'fastly', name: 'Fastly CDN', url: 'https://www.fastly.com/' },
  { key: 'akamai', name: 'Akamai CDN', url: 'https://www.akamai.com/' },
  { key: 'line', name: 'LINE', url: 'https://line.me/' },
  { key: 'facebook', name: 'Meta / FB', url: 'https://www.facebook.com/' },
];

export default function IpDetectorClient({ lang = 'zh-TW' }: IpDetectorClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  const [ipv4, setIpv4] = useState<string>(t.detecting);
  const [ipv4Status, setIpv4Status] = useState<'loading' | 'success' | 'unsupported'>('loading');

  const [ipv6, setIpv6] = useState<string>(t.detecting);
  const [ipv6Status, setIpv6Status] = useState<'loading' | 'success' | 'unsupported'>('loading');

  const [cfTrace, setCfTrace] = useState<CfTraceInfo | null>(null);
  const [cfLoading, setCfLoading] = useState<boolean>(true);

  const [geoInfo, setGeoInfo] = useState<GeoInfo | null>(null);
  const [geoLoading, setGeoLoading] = useState<boolean>(true);

  const [cloudTargets, setCloudTargets] = useState<CloudTarget[]>(
    CLOUD_ENDPOINTS.map(ep => ({ ...ep, latency: null, status: 'loading' }))
  );

  const [toast, setToast] = useState<string>('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 2500);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f0ff');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 240, 255, 0.6)');
  }, []);

  // 1. 檢測 IPv4
  const detectIpv4 = useCallback(async () => {
    setIpv4(t.detecting);
    setIpv4Status('loading');
    try {
      const res = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(4000),
      });
      const data = await res.json();
      if (data && data.ip) {
        setIpv4(data.ip);
        setIpv4Status('success');
      } else {
        throw new Error('No IP');
      }
    } catch {
      setIpv4(t.unsupported);
      setIpv4Status('unsupported');
    }
  }, [t.detecting, t.unsupported]);

  // 2. 檢測 IPv6
  const detectIpv6 = useCallback(async () => {
    setIpv6(t.detecting);
    setIpv6Status('loading');
    try {
      const res = await fetch('https://api6.ipify.org?format=json', {
        signal: AbortSignal.timeout(4000),
      });
      const data = await res.json();
      if (data && data.ip) {
        setIpv6(data.ip);
        setIpv6Status('success');
      } else {
        throw new Error('No IP');
      }
    } catch {
      setIpv6(t.unsupported);
      setIpv6Status('unsupported');
    }
  }, [t.detecting, t.unsupported]);

  // 3. 檢測 Cloudflare Trace
  const detectCfTrace = useCallback(async () => {
    setCfLoading(true);
    const start = performance.now();
    try {
      const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
        signal: AbortSignal.timeout(4500),
      });
      const latency = Math.round(performance.now() - start);
      const text = await res.text();
      const lines = text.split('\n');
      const map: Record<string, string> = {};
      lines.forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          map[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
      });

      setCfTrace({
        ip: map.ip || t.unknown,
        colo: map.colo || t.unknown,
        loc: map.loc || t.unknown,
        http: map.http || t.unknown,
        uag: map.uag || (typeof navigator !== 'undefined' ? navigator.userAgent : t.unknown),
        latency,
      });
    } catch {
      setCfTrace({ error: true });
    } finally {
      setCfLoading(false);
    }
  }, [t.unknown]);

  // 4. 檢測 IP 地理位置
  const detectGeoLocation = useCallback(async () => {
    setGeoLoading(true);

    try {
      const res = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(4500),
      });
      const raw = await res.json();
      if (raw.error) throw new Error(raw.reason || 'Rate limit');

      const locStr = [raw.city, raw.region, raw.country_name].filter(Boolean).join(', ') || t.unknown;
      const latlonStr = raw.latitude != null && raw.longitude != null ? `${raw.longitude}, ${raw.latitude}` : t.unknown;
      const tzStr = raw.timezone ? `${raw.timezone} (UTC${raw.utc_offset || ''})` : t.unknown;
      const currStr = raw.currency ? `${raw.currency} (${raw.currency_name || ''})` : t.unknown;

      setGeoInfo({
        org: raw.org || t.unknown,
        asn: raw.asn || t.unknown,
        network: raw.network || undefined,
        location: locStr,
        latlon: latlonStr,
        timezone: tzStr,
        currency: currStr,
        source: 'ipapi.co',
      });
    } catch {
      try {
        const resFallback = await fetch('https://ipwhois.app/json/', {
          signal: AbortSignal.timeout(4500),
        });
        const rawFallback = await resFallback.json();
        if (!rawFallback.success) throw new Error('ipwhois failed');

        const locStr = [rawFallback.city, rawFallback.region, rawFallback.country].filter(Boolean).join(', ') || t.unknown;
        const latlonStr =
          rawFallback.latitude != null && rawFallback.longitude != null
            ? `${rawFallback.longitude}, ${rawFallback.latitude}`
            : t.unknown;
        const tzStr = rawFallback.timezone ? `${rawFallback.timezone} (UTC${rawFallback.timezone_gmt || ''})` : t.unknown;
        const currStr = rawFallback.currency_code ? `${rawFallback.currency_code} (${rawFallback.currency || ''})` : t.unknown;

        setGeoInfo({
          org: rawFallback.org || rawFallback.isp || t.unknown,
          asn: rawFallback.asn || t.unknown,
          network: undefined,
          location: locStr,
          latlon: latlonStr,
          timezone: tzStr,
          currency: currStr,
          source: 'ipwhois.app',
        });
      } catch {
        setGeoInfo({ error: true });
      }
    } finally {
      setGeoLoading(false);
    }
  }, [t.unknown]);

  // 5. 測速公有雲
  const runCloudDiagnostics = useCallback(async () => {
    setCloudTargets(prev => prev.map(target => ({ ...target, latency: null, status: 'loading' })));

    const updated = await Promise.all(
      CLOUD_ENDPOINTS.map(async ep => {
        const start = performance.now();
        try {
          await fetch(ep.url, {
            mode: 'no-cors',
            cache: 'no-store',
            signal: AbortSignal.timeout(4500),
          });
          const latency = Math.round(performance.now() - start);
          return { ...ep, latency, status: 'connected' as const };
        } catch {
          return { ...ep, latency: null, status: 'failed' as const };
        }
      })
    );

    setCloudTargets(updated);
  }, []);

  const runAllChecks = useCallback(() => {
    detectIpv4();
    detectIpv6();
    detectCfTrace();
    detectGeoLocation();
    runCloudDiagnostics();
  }, [detectIpv4, detectIpv6, detectCfTrace, detectGeoLocation, runCloudDiagnostics]);

  useEffect(() => {
    runAllChecks();
  }, [runAllChecks]);

  const copyText = (text: string, label: string) => {
    if (!text || text === t.detecting || text === t.unsupported) return;
    navigator.clipboard.writeText(text).then(() => showToast(`${t.copiedToast} ${label}`));
  };

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#00f0ff"
      accentGlow="rgba(0, 240, 255, 0.6)"
      extraHeaderControls={
        <Link
          href={lang === 'en' ? '/ip-detector/' : '/ip-detector/en/'}
          className="relative inline-flex items-center justify-center gap-1.5 h-[42px] px-3.5 text-xs font-semibold rounded-xl bg-white/[.06] border border-white/10 text-text-sub hover:text-text-main backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-[var(--theme-color,#00f0ff)] hover:shadow-[0_0_12px_var(--theme-glow,rgba(0,240,255,0.4))] select-none"
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>{lang === 'en' ? '繁體中文' : 'English'}</span>
        </Link>
      }
    >

      <div className="flex flex-col gap-8 text-left w-full">
        {/* 頂部：IPv4 & IPv6 雙棧卡片 */}
        <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
          {/* IPv4 卡片 */}
          <div
            className={`${styles.ipCard} ${
              ipv4Status === 'success' ? styles.ipCardSuccess : ipv4Status === 'unsupported' ? styles.ipCardUnsupported : ''
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-sub font-semibold uppercase tracking-[1px]">{t.ipv4Title}</span>
              <button
                type="button"
                onClick={() => copyText(ipv4, t.ipv4Title)}
                disabled={ipv4Status !== 'success'}
                className={`text-sm font-medium ${styles.accentValue} hover:underline disabled:opacity-40 cursor-pointer`}
              >
                {t.copyBtn}
              </button>
            </div>
            <div className={styles.ipBadge}>{ipv4}</div>
          </div>

          {/* IPv6 卡片 */}
          <div
            className={`${styles.ipCard} ${
              ipv6Status === 'success' ? styles.ipCardSuccess : ipv6Status === 'unsupported' ? styles.ipCardUnsupported : ''
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-sub font-semibold uppercase tracking-[1px]">{t.ipv6Title}</span>
              <button
                type="button"
                onClick={() => copyText(ipv6, t.ipv6Title)}
                disabled={ipv6Status !== 'success'}
                className={`text-sm font-medium ${styles.accentValue} hover:underline disabled:opacity-40 cursor-pointer`}
              >
                {t.copyBtn}
              </button>
            </div>
            <div
              className={`${styles.ipBadge} ${
                ipv6Status === 'unsupported' ? 'text-amber-500 dark:text-amber-400 text-shadow-none text-xl' : ''
              }`}
            >
              {ipv6}
            </div>
          </div>
        </div>

        {/* 中部：雙欄連線與地理隱私資訊 */}
        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
          {/* 左欄：Cloudflare Trace 連線診斷 */}
          <div className={styles.cardPanel}>
            <h3 className={`text-sm ${styles.accentValue} uppercase tracking-[1px] font-semibold border-b border-border-glass pb-3`}>
              {t.cfTraceTitle}
            </h3>

            {cfLoading ? (
              <div className="py-8 text-center text-sm text-text-sub font-mono">
                <span className={`${styles.statusDot} ${styles.statusDotLoading} mr-2`} /> {t.cfLoading}
              </div>
            ) : cfTrace?.error ? (
              <div className="py-6 text-center text-sm text-red-500 dark:text-red-400 flex items-center justify-center gap-2">
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{t.cfError}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3 font-mono text-xs">
                <div className={styles.detailRow}>
                  <span className="text-sm font-semibold text-text-sub">{t.connIp}</span>
                  <span className="text-sm text-text-main font-bold">{cfTrace?.ip || t.unknown}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className="text-sm font-semibold text-text-sub">{t.coloNode}</span>
                  <span className={`text-sm ${styles.accentValue} font-bold`}>{cfTrace?.colo || t.unknown}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className="text-sm font-semibold text-text-sub">{t.geoLoc}</span>
                  <span className="text-sm text-text-main font-bold">{cfTrace?.loc || t.unknown}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className="text-sm font-semibold text-text-sub">{t.httpProto}</span>
                  <span className="text-sm text-text-main font-bold">{cfTrace?.http || t.unknown}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className="text-sm font-semibold text-text-sub">{t.latency}</span>
                  <span className={`text-sm ${styles.successText} font-bold`}>
                    {cfTrace?.latency !== undefined ? `${cfTrace.latency} ms` : '-'}
                  </span>
                </div>
                <div className="flex flex-col gap-1 bg-select-bg p-3 rounded-xl border border-border-glass">
                  <span className="text-sm font-semibold text-text-sub">{t.browserUa}</span>
                  <span className="text-xs text-text-sub break-all leading-relaxed">{cfTrace?.uag || t.unknown}</span>
                </div>
              </div>
            )}
          </div>

          {/* 右欄：IP 地理位置與 ISP 診斷 */}
          <div className={styles.cardPanel}>
            <h3 className={`text-sm ${styles.accentValue} uppercase tracking-[1px] font-semibold border-b border-border-glass pb-3`}>
              {t.geoTitle}
            </h3>

            {geoLoading ? (
              <div className="py-8 text-center text-sm text-text-sub font-mono">
                <span className={`${styles.statusDot} ${styles.statusDotLoading} mr-2`} /> {t.geoLoading}
              </div>
            ) : geoInfo?.error ? (
              <div className="py-6 text-center text-sm text-red-500 dark:text-red-400 flex items-center justify-center gap-2">
                <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                </svg>
                <span>{t.geoError}</span>
              </div>
            ) : (
              <div className="flex flex-col gap-3 font-mono text-xs">
                <div className={styles.detailRow}>
                  <span className="text-sm font-semibold text-text-sub">{t.ispOrg}</span>
                  <span className="text-sm text-text-main font-bold truncate max-w-[60%]">{geoInfo?.org || t.unknown}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className="text-sm font-semibold text-text-sub">{t.asnLabel}</span>
                  <span className="text-sm text-text-main font-bold">{geoInfo?.asn || t.unknown}</span>
                </div>
                {geoInfo?.network && (
                  <div className={styles.detailRow}>
                    <span className="text-sm font-semibold text-text-sub">{t.cidrLabel}</span>
                    <span className="text-sm text-text-main font-bold">{geoInfo.network}</span>
                  </div>
                )}
                <div className={styles.detailRow}>
                  <span className="text-sm font-semibold text-text-sub">{t.locationLabel}</span>
                  <span className="text-sm text-text-main font-bold truncate max-w-[60%]">{geoInfo?.location || t.unknown}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className="text-sm font-semibold text-text-sub">{t.latlonLabel}</span>
                  <span className="text-sm text-text-main font-bold">{geoInfo?.latlon || t.unknown}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className="text-sm font-semibold text-text-sub">{t.timezoneLabel}</span>
                  <span className="text-sm text-text-main font-bold truncate max-w-[60%]">{geoInfo?.timezone || t.unknown}</span>
                </div>
                <div className={styles.detailRow}>
                  <span className="text-sm font-semibold text-text-sub">{t.currencyLabel}</span>
                  <span className="text-sm text-text-main font-bold">{geoInfo?.currency || t.unknown}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-text-sub pt-1">
                  <span>{t.dataSource}</span>
                  <span>{geoInfo?.source}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部：公有雲與 CDN 連線延遲測速 */}
        <div className={styles.cardPanel}>
          <div className="flex justify-between items-center border-b border-border-glass pb-3">
            <h3 className={`text-sm ${styles.accentValue} uppercase tracking-[1px] font-semibold`}>
              {t.cloudTitle}
            </h3>
            <button
              type="button"
              onClick={runCloudDiagnostics}
              className={styles.accentBtn}
            >
              {t.retestBtn}
            </button>
          </div>

          <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
            {cloudTargets.map(target => (
              <div key={target.key} className={styles.targetCard}>
                <div className="flex items-center gap-2">
                  <span
                    className={`${styles.statusDot} ${
                      target.status === 'loading'
                        ? styles.statusDotLoading
                        : target.status === 'connected'
                        ? styles.statusDotConnected
                        : styles.statusDotFailed
                    }`}
                  />
                </div>
                <span className="text-sm font-bold text-text-main">{target.name}</span>
                <span
                  className={`text-sm font-mono font-bold ${
                    target.status === 'connected'
                      ? styles.successText
                      : target.status === 'failed'
                      ? 'text-red-500 dark:text-red-400'
                      : 'text-text-sub'
                  }`}
                >
                  {target.status === 'loading'
                    ? t.testing
                    : target.status === 'connected' && target.latency !== null
                    ? `${target.latency} ms`
                    : t.failed}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={runAllChecks}
              className={`${styles.accentBtn} !rounded-full !py-3.5 !px-10`}
            >
              {t.recheckAllBtn}
            </button>
          </div>
        </div>

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection
            title={t.faqTitle}
            subtitle={t.faqSubtitle}
            items={t.faqItems}
            accentColor="#00f0ff"
          />
        </div>
      </div>

      {/* Toast 提示條 */}
      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] backdrop-blur-md shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

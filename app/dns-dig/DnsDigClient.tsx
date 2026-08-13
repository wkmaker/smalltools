'use client';

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './dns-dig.module.css';

import { formatDnsData, DnsAnswer } from './dnsDecoder';

interface DnsResponse {
  Status: number;
  TC?: boolean;
  RD?: boolean;
  RA?: boolean;
  AD?: boolean;
  CD?: boolean;
  Question?: { name: string; type: number }[];
  Answer?: DnsAnswer[];
  Authority?: DnsAnswer[];
  Comment?: string;
}

interface DnsDigClientProps {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: '線上 DNS DIG 網路診斷工具',
    subtitle: 'ONLINE DNS LOOKUP & DIAGNOSTICS',
    description:
      '專業免費的線上 DNS DIG 網路診斷工具！串接 Cloudflare, Google 與 阿里雲 DoH (DNS over HTTPS) API，支援 A, CNAME, MX, TXT, HTTPS 等全紀錄類型即時檢索與 RFC 9460 轉譯。',
    settingsTitle: 'DNS 查詢設定',
    shareBtn: '複製查詢連結',
    shareToast: '已複製 DNS 查詢分享連結',
    domainLabel: '查詢網域名稱 (Domain / URL)',
    domainPlaceholder: '例如：cjkuo.net 或貼上網址',
    providerLabel: 'DNS 查詢伺服器 (DoH)',
    providerCloudflare: 'Cloudflare DNS (1.1.1.1)',
    providerGoogle: 'Google DNS (8.8.8.8)',
    providerAliDNS: '阿里雲 DNS (AliDNS)',
    typeLabel: '查詢紀錄類型 (Type)',
    queryBtn: '進行 DIG 查詢',
    querying: '請求中...',
    resultTitle: '解析診斷成果看板',
    statusLabel: '響應狀態 (Status)',
    durationLabel: '查詢耗時 (Duration)',
    answerTitle: '答覆紀錄 (Answer)',
    colName: '網域名稱',
    colType: '類型',
    colTTL: 'TTL',
    colData: '記錄值 (Data)',
    noRecords: '查無對應的紀錄或該網域未設定解析。',
    enterDomainToast: '請輸入欲查詢的網域名稱！',
    typeSwitchedToast: '已切換紀錄類型，請進行查詢',
    rawJsonTitle: '檢視完整 DoH JSON 數據',
    copyJsonBtn: '複製 JSON',
    copyJsonToast: '已複製 JSON 數據',
    copyCellToast: '已複製',
    queryErrorMsg: '查詢 DNS 發生連線錯誤，請檢查網域或 API 回應。',

    faqTitle: '常問問題與專業指南 (FAQ)',
    faqSubtitle: '深入了解 DNS Over HTTPS (DoH) 加密運作、DNS 紀錄類型與 RFC 9460 解碼',
    faqItems: [
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
    ],
  },
  en: {
    title: 'Online DNS DIG Tool',
    subtitle: 'ONLINE DNS LOOKUP & DIAGNOSTICS',
    description:
      'Free online DNS DIG diagnostic tool! Query Cloudflare, Google, and AliDNS over HTTPS (DoH) APIs for instant lookup of A, AAAA, CNAME, MX, TXT, NS, and HTTPS records with RFC 9460 decoding.',
    settingsTitle: 'DNS Settings',
    shareBtn: 'Copy Share Link',
    shareToast: 'DNS lookup link copied to clipboard',
    domainLabel: 'Target Domain Name (Domain / URL)',
    domainPlaceholder: 'e.g., cjkuo.net or paste URL',
    providerLabel: 'DNS Provider (DoH)',
    providerCloudflare: 'Cloudflare DNS (1.1.1.1)',
    providerGoogle: 'Google DNS (8.8.8.8)',
    providerAliDNS: 'Alibaba Cloud DNS (AliDNS)',
    typeLabel: 'Record Type',
    queryBtn: 'Execute DIG Lookup',
    querying: 'Querying...',
    resultTitle: 'Diagnostic Results Dashboard',
    statusLabel: 'Response Status',
    durationLabel: 'Query Duration',
    answerTitle: 'Answer Records',
    colName: 'Domain Name',
    colType: 'Type',
    colTTL: 'TTL',
    colData: 'Record Data',
    noRecords: 'No matching records found for this domain.',
    enterDomainToast: 'Please enter a target domain name!',
    typeSwitchedToast: 'Record type switched, ready to query',
    rawJsonTitle: 'View Full DoH JSON Response',
    copyJsonBtn: 'Copy JSON',
    copyJsonToast: 'JSON data copied to clipboard',
    copyCellToast: 'Copied',
    queryErrorMsg: 'DNS query connection error. Please check domain or API availability.',

    faqTitle: 'Frequently Asked Questions & Guide',
    faqSubtitle: 'Learn more about DNS Over HTTPS (DoH), record types, TTL propagation, and RFC 9460 decoding.',
    faqItems: [
      {
        q: 'What is DNS over HTTPS (DoH), and how does it differ from traditional DNS?',
        a: 'Traditional DNS queries use unencrypted UDP/TCP port 53 in plaintext, vulnerable to ISP eavesdropping and DNS spoofing/hijacking. DoH (RFC 8484) encrypts DNS queries inside TLS tunnels over HTTPS (port 443), dramatically enhancing privacy while bypassing firewalls blocking port 53. Our tool supports switching between Cloudflare (1.1.1.1), Google (8.8.8.8), and AliDNS endpoints instantly.',
      },
      {
        q: 'What do common DNS record types (A, AAAA, CNAME, MX, TXT, NS, CAA) mean?',
        a: `Common DNS record types and functions:

① A Record: Maps a domain name to an IPv4 address (e.g. 192.0.2.1).
② AAAA Record: Maps a domain name to an IPv6 address (e.g. 2001:db8::1).
③ CNAME Record: Canonical Name alias pointing one domain to another target domain.
④ MX Record: Mail Exchange record specifying email servers and priority for the domain.
⑤ TXT Record: Text record used for SPF, DKIM, DMARC email authentication, and domain verification.
⑥ NS Record: Identifies the authoritative name servers hosting DNS for the domain.
⑦ CAA Record: Certificate Authority Authorization specifying which CAs can issue SSL certs for the domain.`,
      },
      {
        q: 'What is DNS Propagation and TTL?',
        a: 'TTL (Time To Live) is the number of seconds DNS resolvers cache a record (e.g. TTL=300 means 5 minutes). When updating DNS records, global ISPs and resolvers gradually refresh old cached data over 5 minutes to 48 hours—a process known as DNS Propagation. Our tool displays the remaining TTL seconds for every query response.',
      },
      {
        q: 'Why can\'t A and CNAME records coexist on the apex/root domain (@)?',
        a: 'According to RFC 1034, a CNAME record claims full alias authority over a node, prohibiting coexisting records of any other type (such as MX or SOA). Since root domains (example.com) must contain SOA and NS records, CNAME cannot exist at the root. Solution: Use Cloudflare CNAME Flattening or ALIAS records.',
      },
      {
        q: 'What is the new RFC 9460 HTTPS / SVCB record, and why don\'t legacy dig tools display it properly?',
        a: 'HTTPS (TYPE 65) and SVCB (TYPE 64) are modern IETF specifications enabling browsers to retrieve HTTP/3, QUIC, ALPN protocols, and Encrypted Client Hello (ECH) parameters directly from DNS before establishing HTTP connections. Legacy command-line dig tools output raw hexadecimal TYPE65 blobs, whereas our tool includes a built-in RFC 9460 binary decoder to render human-readable parameters.',
      },
      {
        q: 'How does this tool query DNS records? Does it use intermediate third-party servers?',
        a: `Queries are sent 100% directly from your own browser via HTTP/2 to official DoH endpoints (Cloudflare 1.1.1.1 or Google 8.8.8.8), completely bypassing any intermediate third-party proxy servers (No Third-Party Proxy Server)!

Key advantages:
① Direct Browser-to-DNS Connection: Queries travel straight from your client IP to official DNS servers without intermediate interception or data logging.
② Zero Proxy Caching: No intermediate server caching, allowing you to verify DNS changes immediately after saving them at your registrar.
③ Complete Privacy Guarantee: Our servers never store, log, or track your queried domains or IP history.`,
      },
      {
        q: 'Why didn\'t my DNS update take effect immediately after updating records at my registrar (GoDaddy, Cloudflare, Namecheap)?',
        a: `Delayed DNS updates are typically caused by four primary factors:

① Unexpired TTL (Cache Timeout):
Before your change, the old DNS record was cached by global ISPs and resolvers. You must wait until the old TTL seconds count down to zero (e.g. 300s or 86400s) before resolvers request fresh records.

② Local OS & Browser DNS Caching:
Your local operating system and browser (Chrome/Safari) maintain their own DNS cache:
- Windows: Run ipconfig /flushdns in Command Prompt.
- Mac: Run sudo dscacheutil -flushcache in Terminal.
- Try opening an Incognito window or testing via mobile cellular network (4G/5G).

③ Nameserver (NS) Delegation Changes:
If you recently changed your DNS provider (e.g. updating NS records to Cloudflare), TLD-level delegation updates take 24 to 48 hours to fully propagate globally.

④ Authoritative Cluster Synchronization:
Some DNS providers require a few seconds to minutes for changes to sync across all internal cluster nodes after saving. You can switch between Cloudflare DoH and Google DoH in this tool to cross-verify propagation status!`,
      },
    ],
  },
};

const RCODE_MAP: Record<number, string> = {
  0: 'NOERROR (Success)',
  1: 'FORMERR (Format Error)',
  2: 'SERVFAIL (Server Failure)',
  3: 'NXDOMAIN (Non-Existent Domain)',
  4: 'NOTIMP (Not Implemented)',
  5: 'REFUSED (Query Refused)',
};

const TYPE_MAP: Record<number, string> = {
  1: 'A',
  2: 'NS',
  5: 'CNAME',
  6: 'SOA',
  12: 'PTR',
  15: 'MX',
  16: 'TXT',
  28: 'AAAA',
  33: 'SRV',
  35: 'NAPTR',
  43: 'DS',
  46: 'RRSIG',
  47: 'NSEC',
  48: 'DNSKEY',
  50: 'NSEC3',
  52: 'TLSA',
  55: 'HIP',
  59: 'CDS',
  60: 'CDNSKEY',
  61: 'OPENPGPKEY',
  62: 'CSYNC',
  64: 'SVCB',
  65: 'HTTPS',
  250: 'TSIG',
  251: 'IXFR',
  252: 'AXFR',
  255: 'ANY',
  257: 'CAA',
  32768: 'TA',
  32769: 'DLV',
};

const RECORD_TYPES = [
  'A',
  'AAAA',
  'CNAME',
  'TXT',
  'MX',
  'NS',
  'SRV',
  'HTTPS',
  'SVCB',
  'CAA',
  'SOA',
  'PTR',
  'DS',
  'DNSKEY',
  'TLSA',
  'TSIG',
  'ANY',
];

function cleanDomainInput(raw: string): string {
  let cleaned = raw.trim();
  if (!cleaned) return '';

  cleaned = cleaned.replace(/\/+$/, '');

  if (/^https?:\/\//i.test(cleaned) || cleaned.includes('/')) {
    if (!/^https?:\/\//i.test(cleaned)) {
      cleaned = 'http://' + cleaned;
    }
    try {
      const urlObj = new URL(cleaned);
      return urlObj.hostname;
    } catch {
      const match = raw.match(/^(?:https?:\/\/)?([^/?#:]+)/i);
      if (match) return match[1];
    }
  } else {
    const parts = cleaned.split(':');
    if (parts.length > 0) {
      if (cleaned.includes(':') && !cleaned.includes('.')) {
        return cleaned;
      }
      return parts[0];
    }
  }
  return cleaned.toLowerCase();
}

export default function DnsDigClient({ lang = 'zh-TW' }: DnsDigClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  const [domain, setDomain] = useState<string>('cjkuo.net');
  const [recordType, setRecordType] = useState<string>('A');
  const [provider, setProvider] = useState<'cloudflare' | 'google' | 'alidns'>('cloudflare');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<DnsResponse | null>(null);
  const [queryDuration, setQueryDuration] = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [toast, setToast] = useState<string>('');
  const [isRawJsonOpen, setIsRawJsonOpen] = useState<boolean>(false);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const isMountedRef = useRef<boolean>(false);

  const domainInputId = useId();
  const providerSelectId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 2500);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#8b5cf6');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(139, 92, 246, 0.6)');
  }, []);

  // 無感更新 URL
  const syncToURL = useCallback((d: string, s: string, t: string) => {
    if (typeof window === 'undefined' || !isMountedRef.current) return;
    const params = new URLSearchParams();
    if (d) params.set('d', d);
    params.set('s', s);
    params.set('t', t);
    window.history.replaceState(null, '', '?' + params.toString());
  }, []);

  // 核心 DoH 查詢處理
  const executeQuery = useCallback(async (targetDomain: string, targetProvider: string, targetType: string) => {
    const cleaned = cleanDomainInput(targetDomain);
    if (!cleaned) return;

    syncToURL(cleaned, targetProvider, targetType);

    if (activeAbortControllerRef.current) {
      activeAbortControllerRef.current.abort();
    }

    const controller = new AbortController();
    activeAbortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    setLoading(true);
    setErrorMsg('');
    setResult(null);
    setQueryDuration(null);

    const startTime = performance.now();

    try {
      let url = '';
      let headers: HeadersInit = {};

      if (targetProvider === 'cloudflare') {
        url = `https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(cleaned)}&type=${targetType}`;
        headers = { Accept: 'application/dns-json' };
      } else if (targetProvider === 'google') {
        url = `https://dns.google/resolve?name=${encodeURIComponent(cleaned)}&type=${targetType}`;
      } else {
        url = `https://dns.alidns.com/resolve?name=${encodeURIComponent(cleaned)}&type=${targetType}`;
      }

      const res = await fetch(url, { headers, signal: controller.signal });
      clearTimeout(timeoutId);

      const duration = Math.round(performance.now() - startTime);
      setQueryDuration(duration);

      if (!res.ok) throw new Error(`HTTP Error! Status: ${res.status}`);

      const data: DnsResponse = await res.json();
      setResult(data);
    } catch (err: unknown) {
      if ((err as Error).name === 'AbortError') return;
      setErrorMsg((err as Error).message || t.queryErrorMsg);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
    }
  }, [syncToURL, t.queryErrorMsg]);

  // 初次掛載與 URL 參數初始化防護
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    let initDomain = 'cjkuo.net';
    let initProvider: 'cloudflare' | 'google' | 'alidns' = 'cloudflare';
    let initRecordType = 'A';

    const d = params.get('d');
    const s = params.get('s') as 'cloudflare' | 'google' | 'alidns' | null;
    const reqType = params.get('t');

    if (d) initDomain = d;
    if (s && ['cloudflare', 'google', 'alidns'].includes(s)) initProvider = s;
    if (reqType && RECORD_TYPES.includes(reqType.toUpperCase())) initRecordType = reqType.toUpperCase();

    setDomain(initDomain);
    setProvider(initProvider);
    setRecordType(initRecordType);

    isMountedRef.current = true;

    const cleaned = cleanDomainInput(initDomain);
    if (cleaned) {
      executeQuery(cleaned, initProvider, initRecordType);
    }
  }, [executeQuery]);

  const handleQuery = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const cleaned = cleanDomainInput(domain);
    if (!cleaned) {
      showToast(t.enterDomainToast);
      return;
    }
    setDomain(cleaned);
    executeQuery(cleaned, provider, recordType);
  };

  const handleDomainInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setDomain(val);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => {
      const cleaned = cleanDomainInput(val);
      if (cleaned) {
        setDomain(cleaned);
        executeQuery(cleaned, provider, recordType);
      }
    }, 1000);
  };

  const handleProviderChange = (newProvider: 'cloudflare' | 'google' | 'alidns') => {
    setProvider(newProvider);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const cleaned = cleanDomainInput(domain);
    if (cleaned) {
      executeQuery(cleaned, newProvider, recordType);
    }
  };

  const handleRecordTypeChange = (newType: string) => {
    setRecordType(newType);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const cleaned = cleanDomainInput(domain);
    if (cleaned) {
      executeQuery(cleaned, provider, newType);
    } else {
      showToast(t.typeSwitchedToast);
    }
  };

  const copyShareLink = () => {
    const cleaned = cleanDomainInput(domain);
    syncToURL(cleaned, provider, recordType);
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => showToast(t.shareToast));
  };

  const copyCellText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => showToast(`${t.copyCellToast}: ${text}`));
  };

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#8b5cf6"
      accentGlow="rgba(139, 92, 246, 0.6)"
      extraHeaderControls={
        <Link
          href={lang === 'en' ? '/dns-dig/' : '/dns-dig/en/'}
          className="relative inline-flex items-center justify-center gap-1.5 h-[42px] px-3.5 text-xs font-semibold rounded-xl bg-white/[.06] border border-white/10 text-text-sub hover:text-text-main backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-[var(--theme-color,#8b5cf6)] hover:shadow-[0_0_12px_var(--theme-glow,rgba(139,92,246,0.4))] select-none"
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

      <div className="grid grid-cols-[0.8fr_1.2fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
        {/* 左欄：查詢參數設定區 */}
        <div className={styles.cardPanel}>
          <div className="flex justify-between items-center border-b border-border-glass pb-3">
            <h3 className="text-sm text-[#8b5cf6] uppercase tracking-[1px] font-semibold">
              {t.settingsTitle}
            </h3>
            <button
              onClick={copyShareLink}
              className="px-3 py-1 text-sm font-medium bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#8b5cf6] rounded-lg hover:bg-[#8b5cf6] hover:text-[#030305] transition-all cursor-pointer"
            >
              {t.shareBtn}
            </button>
          </div>

          {/* 網域名稱 */}
          <div className="flex flex-col gap-2">
            <label htmlFor={domainInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
              {t.domainLabel}
            </label>
            <input
              id={domainInputId}
              type="text"
              value={domain}
              onChange={handleDomainInputChange}
              onBlur={() => setDomain(cleanDomainInput(domain))}
              onKeyDown={e => e.key === 'Enter' && handleQuery()}
              placeholder={t.domainPlaceholder}
              className={styles.inputBox}
            />
          </div>

          {/* DoH 伺服器 */}
          <div className="flex flex-col gap-2 border-t border-border-glass pt-4">
            <label htmlFor={providerSelectId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
              {t.providerLabel}
            </label>
            <select
              id={providerSelectId}
              value={provider}
              onChange={e => handleProviderChange(e.target.value as 'cloudflare' | 'google' | 'alidns')}
              className="w-full bg-select-bg border border-border-glass text-text-main px-4 py-3 rounded-xl text-sm outline-none cursor-pointer font-mono"
            >
              <option value="cloudflare">{t.providerCloudflare}</option>
              <option value="google">{t.providerGoogle}</option>
              <option value="alidns">{t.providerAliDNS}</option>
            </select>
          </div>

          {/* 紀錄類型選單 (無障礙 W3C 標籤規範：標題改用 span) */}
          <div className="flex flex-col gap-2 border-t border-border-glass pt-4">
            <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
              {t.typeLabel}
            </span>
            <div className="grid grid-cols-4 gap-1.5 max-sm:grid-cols-3">
              {RECORD_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handleRecordTypeChange(type)}
                  className={`py-1.5 text-sm font-semibold font-mono rounded-lg cursor-pointer transition-all border ${
                    recordType === type
                      ? 'bg-[#8b5cf6]/20 border-[#8b5cf6]/40 text-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                      : 'border-transparent text-text-sub hover:text-text-main hover:bg-white/[.04]'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleQuery}
            disabled={loading}
            className="w-full py-3.5 bg-[#8b5cf6]/15 border border-[#8b5cf6]/40 text-[#8b5cf6] font-semibold text-base rounded-xl hover:bg-[#8b5cf6] hover:text-[#030305] transition-all cursor-pointer shadow-[0_0_15px_rgba(139,92,246,0.2)] disabled:opacity-50"
          >
            {loading ? t.querying : t.queryBtn}
          </button>
        </div>

        {/* 右欄：解析結果展示區 */}
        <div className={styles.cardPanel}>
          <h3 className="text-sm text-[#8b5cf6] uppercase tracking-[1px] font-semibold border-b border-border-glass pb-3">
            {t.resultTitle}
          </h3>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-500 dark:text-red-400 p-4 rounded-xl text-sm flex items-center gap-2">
              <svg className="w-5 h-5 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{errorMsg}</span>
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* 狀態與耗時 Summary */}
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 font-mono">
                <div className={styles.summaryBox}>
                  <span className="text-xs font-semibold text-text-sub">{t.statusLabel}</span>
                  <span
                    className={`text-base font-bold ${
                      result.Status === 0 ? styles.successText : 'text-red-500 dark:text-red-400'
                    }`}
                  >
                    {RCODE_MAP[result.Status] || `UNKNOWN (${result.Status})`}
                  </span>
                </div>

                <div className={styles.summaryBox}>
                  <span className="text-xs font-semibold text-text-sub">{t.durationLabel}</span>
                  <span className="text-base font-bold text-[#8b5cf6]">
                    {queryDuration !== null ? `${queryDuration} ms` : '-'}
                  </span>
                </div>
              </div>

              {/* 答覆紀錄 Answer Table */}
              <div className="flex flex-col gap-2">
                <span className="text-sm text-text-sub font-semibold uppercase tracking-[1px]">
                  {t.answerTitle} {result.Answer && result.Answer.length > 0 ? `(${result.Answer.length})` : '(0)'}
                </span>
                <div className={styles.tableContainer}>
                  <table className="w-full text-sm font-mono text-left">
                    <thead>
                      <tr className={styles.tableHeader}>
                        <th className="p-3 w-[25%]">{t.colName}</th>
                        <th className="p-3 w-[12%]">{t.colType}</th>
                        <th className="p-3 w-[12%]">{t.colTTL}</th>
                        <th className="p-3 w-[51%]">{t.colData}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.Answer && result.Answer.length > 0 ? (
                        result.Answer.map((ans, idx) => {
                          const dispData = formatDnsData(ans);
                          const typeText = TYPE_MAP[ans.type] || `TYPE-${ans.type}`;

                          return (
                            <tr key={idx} className={styles.tableRow}>
                              <td
                                onClick={() => copyCellText(ans.name)}
                                className={`p-3 text-text-main font-medium ${styles.copyableCell}`}
                                title={t.colName}
                              >
                                {ans.name}
                              </td>
                              <td className="p-3 text-[#8b5cf6] font-bold">{typeText}</td>
                              <td className="p-3 text-text-sub">{ans.TTL}s</td>
                              <td
                                onClick={() => copyCellText(dispData)}
                                className={`p-3 ${styles.dataValueText} break-all ${styles.copyableCell}`}
                                title={dispData !== ans.data ? `RFC 3597: ${ans.data}` : dispData}
                              >
                                {dispData}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-text-sub text-sm">
                            {t.noRecords}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Raw JSON 展示 */}
              <div className={styles.rawJsonPanel}>
                <div
                  className={styles.rawJsonHeader}
                  onClick={() => setIsRawJsonOpen(!isRawJsonOpen)}
                >
                  <div className="flex items-center gap-2">
                    <svg
                      className={`w-4 h-4 transition-transform duration-200 ${
                        isRawJsonOpen ? 'rotate-90' : ''
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                    <span>{t.rawJsonTitle}</span>
                  </div>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation();
                      navigator.clipboard
                        .writeText(JSON.stringify(result, null, 2))
                        .then(() => showToast(t.copyJsonToast));
                    }}
                    className={styles.copyJsonBtn}
                  >
                    {t.copyJsonBtn}
                  </button>
                </div>
                {isRawJsonOpen && (
                  <pre className={styles.rawJson}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast 提示條 */}
      {toast && (
        <div className={styles.toast}>
          {toast}
        </div>
      )}

      {/* 通用 FAQ 常見問題區塊 */}
      <FaqSection
        items={t.faqItems}
        title={t.faqTitle}
        subtitle={t.faqSubtitle}
        accentColor="#8b5cf6"
      />
    </ToolLayout>
  );
}

'use client';

import { useState, useEffect, useCallback, useId, useRef } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './https-dns-generator.module.css';

interface Props {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: 'DNS HTTPS 紀錄 (Type 65) 設定產生器',
    subtitle: 'RFC 9460 TYPE 65 GENERATOR',
    description:
      '免費線上 DNS HTTPS (Type 65) 紀錄產生器與設定教學。支援 RFC 9460 規範之服務模式 (Service Mode) 與別名模式 (Alias Mode)，透過視覺化勾選與填空即時生成 ALPN、ipv4hint、ipv6hint、port 等參數，並提供 Cloudflare、AWS Route53 等代管商對照填寫指南。',
    configTitle: '設定參數 (勾選與填空)',
    presetTitle: '常用預設情境 (點擊快速帶入)：',
    presetStandard: 'HTTP/2 + HTTP/3 (推薦)',
    presetAlias: 'Apex 域名別名 (Priority 0)',
    presetPort: '自訂 Port (8443) + IP Hint',
    presetReset: '重置預設',
    modeLabel: '運作模式 (Mode)',
    serviceMode: 'Service Mode (優先權 > 0)',
    aliasMode: 'Alias Mode (優先權 = 0)',
    hostLabel: '名稱 (Host / Subdomain)',
    ttlLabel: 'TTL 時間 (秒)',
    priorityLabel: '優先權 (Priority)',
    targetLabel: '目標主機 (TargetName)',
    paramsSection: 'SvcParams 服務參數配置',
    alpnLabel: 'ALPN 支援應用協定 (可多選)：',
    portLabel: '埠號 (Port)',
    echLabel: 'Encrypted Client Hello (ech) Base64',
    copyShareBtn: '複製帶參數之分享連結',
    fullRecordTitle: '完整 BIND / RFC 9460 格式紀錄',
    copyRecordBtn: '一鍵複製',
    coreFieldsTitle: 'DNS 管理介面【4大核心欄位】對照表',
    nameField: '1. 名稱 (Name / Host)',
    nameDesc: '子網域或 `@` (根網域)。',
    prioField: '2. 優先權 (Priority)',
    prioDesc: '`0` 代表別名模式；`1` 以上代表服務模式。',
    targetField: '3. 目標 (TargetName)',
    targetDesc: '填寫 `.` 代表本網域本身。',
    valueField: '4. 內容 / 值 (Value / SvcParams)',
    valueDesc: '包含 alpn, port, ip 等服務參數。',
    guideTitle: '各大 DNS 代管商填寫指南',
    copyBtn: '複製',
    presetLoadedStandard: '已載入標準 HTTP/2 + HTTP/3 預設情境',
    presetLoadedAlias: '已載入 Apex 域名別名 (Priority 0) 預設情境',
    presetLoadedPort: '已載入自訂 Port (8443) + IP Hint 預設情境',
    presetCleared: '已重置設定欄位',
    copiedText: '已複製',
    copiedShare: '已複製帶參數之分享連結！',
    emptyVal: '(空)',
    cfTitle: 'Cloudflare DNS 設定說明：',
    select: '選擇',
    enter: '輸入',
    leaveEmpty: '(留空)',
    r53Title: 'AWS Route53 設定說明：',
    enterFullLine: '輸入完整單行',
    gcdnsTitle: 'Google Cloud DNS 設定說明：',
    subdomainOrEmpty: '輸入子網域或留空',
    pasteFullValue: '貼上完整紀錄值',
    bindTitle: 'BIND 9 Zone File 設定說明：',
    bindDesc: '將以下這行直接加入 Zone 檔中：',

    // FAQ
    faqTitle: '常見問題與專業指南 (FAQ)',
    faqSubtitle: '深入了解 RFC 9460 Type 65 規範、HTTP/3 握手加速、ECH 隱私保護與根網域別名配置',
    faqItems: [
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
    ],
  },
  en: {
    title: 'DNS HTTPS Record (Type 65) Generator',
    subtitle: 'RFC 9460 TYPE 65 GENERATOR',
    description:
      'Free online DNS HTTPS (Type 65) record generator based on RFC 9460. Visually generate Service Mode and Alias Mode records with ALPN, IP hints, port, and step-by-step DNS provider tutorials.',
    configTitle: 'Configuration & Presets',
    presetTitle: 'Quick Presets (Click to load):',
    presetStandard: 'HTTP/2 + HTTP/3 (Recommended)',
    presetAlias: 'Apex Domain Alias (Priority 0)',
    presetPort: 'Custom Port (8443) + IP Hint',
    presetReset: 'Reset',
    modeLabel: 'Mode',
    serviceMode: 'Service Mode (Priority > 0)',
    aliasMode: 'Alias Mode (Priority = 0)',
    hostLabel: 'Host / Name',
    ttlLabel: 'TTL (Sec)',
    priorityLabel: 'Priority',
    targetLabel: 'TargetName',
    paramsSection: 'SvcParams Parameters',
    alpnLabel: 'ALPN Protocols:',
    portLabel: 'Port',
    echLabel: 'Encrypted Client Hello (ech)',
    copyShareBtn: 'Copy Shareable Link with Parameters',
    fullRecordTitle: 'Full BIND / RFC 9460 Record',
    copyRecordBtn: 'Copy Full Record',
    coreFieldsTitle: 'DNS Admin Panel [4 Core Fields] Breakdown',
    nameField: '1. Name / Host',
    nameDesc: 'Subdomain or `@` (root domain).',
    prioField: '2. Priority (SvcPriority)',
    prioDesc: '0 = Alias Mode; >=1 = Service Mode.',
    targetField: '3. Target (TargetName)',
    targetDesc: '`.` means self domain.',
    valueField: '4. Value / Content (SvcParams)',
    valueDesc: 'SvcParams options (alpn, port, ip).',
    guideTitle: 'DNS Provider Tutorials & Guides',
    copyBtn: 'Copy',
    presetLoadedStandard: 'Loaded standard HTTP/2 + HTTP/3 preset',
    presetLoadedAlias: 'Loaded Apex Domain Alias preset',
    presetLoadedPort: 'Loaded Custom Port (8443) preset',
    presetCleared: 'Reset all fields',
    copiedText: 'Copied',
    copiedShare: 'Copied share URL!',
    emptyVal: '(empty)',
    cfTitle: 'Cloudflare DNS Instructions:',
    select: 'Select',
    enter: 'Enter',
    leaveEmpty: '(leave empty)',
    r53Title: 'AWS Route53 Instructions:',
    enterFullLine: 'Enter full single line',
    gcdnsTitle: 'Google Cloud DNS Instructions:',
    subdomainOrEmpty: 'Enter subdomain or leave empty',
    pasteFullValue: 'Paste full record value',
    bindTitle: 'BIND 9 Zone File Instructions:',
    bindDesc: 'Add the following line directly into your Zone file:',

    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Learn about RFC 9460 Type 65 specs, HTTP/3 QUIC acceleration, ECH encryption, and Apex aliasing',
    faqItems: [
      {
        q: 'What is a DNS HTTPS Record (Type 65 / RFC 9460) and what problems does it solve?',
        a: 'The DNS HTTPS record (Resource Record Type 65) is a next-generation standard standardized in RFC 9460 (a specialized form of SVCB for HTTPS):\n\n① Consolidated Protocol Discovery & IP Resolution:\nHistorically, clients queried A/AAAA records first and negotiated HTTP/2 or HTTP/3 later via Alt-Svc headers. HTTPS records allow clients to retrieve IP addresses, supported application protocols (ALPN), custom ports, and ECH public keys in a single initial DNS lookup.\n\n② Apex Domain Aliasing:\nOvercomes the classic RFC 1034 limitation prohibiting CNAME records at the domain root (Zone Apex).',
      },
      {
        q: 'What is the difference between Service Mode and Alias Mode in HTTPS records?',
        a: 'The behavior is governed by the SvcPriority field:\n\n① Alias Mode (Priority = 0):\nWhen SvcPriority is 0, the record acts as a CNAME-like alias to a TargetName. It safely functions at the domain root (Zone Apex) while directing the client to query HTTPS records at the target.\n\n② Service Mode (Priority ≥ 1):\nLower priority numbers take precedence. In this mode, developers can bind SvcParams (such as `alpn="h2,h3"`, `port=8443`, `ipv4hint`) instructing the client to initiate the optimal connection directly.',
      },
      {
        q: 'How does an HTTPS record accelerate HTTP/3 (QUIC) and eliminate 0-RTT negotiation delays?',
        a: 'Speed gains stem from upfront protocol knowledge during DNS resolution:\n\n① Eliminating Alt-Svc Round Trips:\nPreviously, first-time visitors connected over TCP/TLS first and only discovered HTTP/3 after receiving an `Alt-Svc: h3=":443"` header from the origin server.\n\n② Direct UDP QUIC Handshake:\nWith `alpn="h3,h2"` declared in the DNS HTTPS record, modern browsers (Chrome, Safari, Firefox) immediately initiate UDP QUIC on the very first packet, saving a full round-trip delay.',
      },
      {
        q: 'What are `ipv4hint` and `ipv6hint`, and how do they improve latency?',
        a: 'IP Hint parameters provide cached IP hints inside the HTTPS record payload:\n\n① Reducing Extra DNS Round-Trips:\nWhen the TargetName points to an external CDN hostname, clients typically require secondary A/AAAA lookups. `ipv4hint` and `ipv6hint` supply fallback IP addresses for immediate concurrent connection attempts.\n\n② Strict Security Compliance:\nRFC 9460 mandates that clients still asynchronously validate authoritative A/AAAA records, preserving both low latency and DNS integrity.',
      },
      {
        q: 'How does the HTTPS record enable Encrypted Client Hello (ECH) privacy protection?',
        a: 'ECH represents a major TLS 1.3 privacy enhancement:\n\n① Masking the Server Name Indication (SNI):\nTraditional TLS handshakes expose the requested domain name in plaintext Client Hello packets, enabling eavesdroppers and transit ISPs to inspect browsing habits.\n\n② Distributing ECH Keys via DNS:\nOrigin servers publish their cryptographic public keys via the `ech="Base64..."` SvcParam. The browser encrypts the entire inner Client Hello before transmission, completely sealing SNI leaks.',
      },
      {
        q: 'Why can HTTPS records be configured at the Root Domain (Zone Apex) where CNAME fails?',
        a: 'It resolves a fundamental DNS specification conflict:\n\n① CNAME Exclusivity Rule:\nDNS standards require SOA and NS records at the root domain (`example.com`), and CNAME records cannot coexist with any other record type.\n\n② Alias Mode Compatibility:\nAs an independent record type, Priority 0 HTTPS Alias records comfortably coexist with SOA, NS, and MX records, offering standard cross-provider root aliasing.',
      },
      {
        q: 'How do Cloudflare, AWS Route 53, and BIND 9 differ when creating HTTPS records?',
        a: 'DNS providers accommodate HTTPS records across varying interface designs:\n\n① Cloudflare DNS:\nProvides a dedicated 4-field modal (Name, Priority, Target, Value/SvcParams) for structured entry.\n\n② AWS Route 53:\nAllows pasting the full RFC 9460 presentation parameter string directly into the single value field (e.g. `1 . alpn="h2,h3"`).\n\n③ BIND 9 / NSD Zone Files:\nStandard single-line record format: `@ IN HTTPS 1 . alpn="h2,h3" ipv4hint=203.0.113.1`. This generator provides copy-ready syntax for all target environments.',
      },
      {
        q: 'Why do some raw DNS responses look like hex or gibberish, while this tool displays them normally?',
        a: 'Difference between wire format encoding and RFC 9460 presentation parsing:\n\n① Wire Format vs Unknown RR Types:\nUnder RFC 9460, HTTPS records (Type 65) transmit binary Key-Value pairs. Older DNS resolvers or legacy command-line tools (such as un-updated `dig TYPE65`) lack native Type 65 parsers, falling back to RFC 3597 unknown record output (e.g. `\\# 22 00010000010005026832...`) which looks like garbled hexadecimal data.\n\n② Native RFC 9460 Presentation Decoder:\nThis tool features a built-in RFC 9460 parsing engine that decodes raw binary attributes into human-readable parameters (ALPNs, IP Hints, ECH keys) and formats them for major cloud providers.',
      },
    ],
  },
};

export default function HttpsDnsGeneratorClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  const [mode, setMode] = useState<'service' | 'alias'>('service');
  const [host, setHost] = useState<string>('@');
  const [ttl, setTtl] = useState<number>(300);
  const [priority, setPriority] = useState<number>(1);
  const [target, setTarget] = useState<string>('.');
  const [alpnH3, setAlpnH3] = useState<boolean>(true);
  const [alpnH2, setAlpnH2] = useState<boolean>(true);
  const [alpnH1, setAlpnH1] = useState<boolean>(false);
  const [ipv4hint, setIpv4hint] = useState<string>('');
  const [ipv6hint, setIpv6hint] = useState<string>('');
  const [port, setPort] = useState<string>('');
  const [noDefaultAlpn, setNoDefaultAlpn] = useState<boolean>(false);
  const [ech, setEch] = useState<string>('');
  const [activeProvider, setActiveProvider] = useState<'cf' | 'r53' | 'gcdns' | 'bind'>('cf');
  const [toast, setToast] = useState<string>('');

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(false);

  const hostInputId = useId();
  const ttlInputId = useId();
  const priorityInputId = useId();
  const targetInputId = useId();
  const ipv4InputId = useId();
  const ipv6InputId = useId();
  const portInputId = useId();
  const echInputId = useId();

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f0ff');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 240, 255, 0.6)');
  }, []);

  // 初次掛載讀取 URL 參數
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const qMode = params.get('mode') as 'service' | 'alias' | null;
    const qHost = params.get('host');
    const qPrio = params.get('priority');
    const qTarget = params.get('target');
    const qH3 = params.get('h3');
    const qH2 = params.get('h2');
    const qV4 = params.get('v4');
    const qV6 = params.get('v6');
    const qPort = params.get('port');

    if (qMode && ['service', 'alias'].includes(qMode)) setMode(qMode);
    if (qHost) setHost(qHost);
    if (qPrio && !isNaN(parseInt(qPrio, 10))) setPriority(parseInt(qPrio, 10));
    if (qTarget) setTarget(qTarget);
    if (qH3 !== null) setAlpnH3(qH3 === '1' || qH3 === 'true');
    if (qH2 !== null) setAlpnH2(qH2 === '1' || qH2 === 'true');
    if (qV4 !== null) setIpv4hint(qV4);
    if (qV6 !== null) setIpv6hint(qV6);
    if (qPort !== null) setPort(qPort);

    isMountedRef.current = true;
  }, []);

  // 狀態更新時 300ms 防抖同步網址
  useEffect(() => {
    if (!isMountedRef.current || typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('mode', mode);
      if (host) params.set('host', host);
      params.set('priority', priority.toString());
      if (target) params.set('target', target);
      if (alpnH3) params.set('h3', '1');
      if (alpnH2) params.set('h2', '1');
      if (ipv4hint) params.set('v4', ipv4hint);
      if (ipv6hint) params.set('v6', ipv6hint);
      if (port) params.set('port', port);

      window.history.replaceState(null, '', '?' + params.toString());
    }, 300);
    return () => clearTimeout(timer);
  }, [mode, host, priority, target, alpnH3, alpnH2, ipv4hint, ipv6hint, port]);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 2500);
  }, []);

  const applyPreset = (type: 'standard' | 'alias' | 'custom-port' | 'clear') => {
    if (type === 'standard') {
      setMode('service');
      setHost('@');
      setPriority(1);
      setTarget('.');
      setAlpnH3(true);
      setAlpnH2(true);
      setAlpnH1(false);
      setIpv4hint('');
      setIpv6hint('');
      setPort('');
      setNoDefaultAlpn(false);
      setEch('');
      showToast(t.presetLoadedStandard);
    } else if (type === 'alias') {
      setMode('alias');
      setHost('@');
      setPriority(0);
      setTarget('target.example.com');
      showToast(t.presetLoadedAlias);
    } else if (type === 'custom-port') {
      setMode('service');
      setHost('app');
      setPriority(1);
      setTarget('.');
      setAlpnH3(true);
      setAlpnH2(true);
      setIpv4hint('198.51.100.1');
      setPort('8443');
      showToast(t.presetLoadedPort);
    } else if (type === 'clear') {
      setMode('service');
      setHost('@');
      setTtl(300);
      setPriority(1);
      setTarget('.');
      setAlpnH3(false);
      setAlpnH2(false);
      setAlpnH1(false);
      setIpv4hint('');
      setIpv6hint('');
      setPort('');
      setNoDefaultAlpn(false);
      setEch('');
      showToast(t.presetCleared);
    }
  };

  const generateParams = useCallback(() => {
    if (mode === 'alias') return '';

    const params: string[] = [];
    const alpnList: string[] = [];

    if (alpnH3) alpnList.push('h3');
    if (alpnH2) alpnList.push('h2');
    if (alpnH1) alpnList.push('http/1.1');
    if (alpnList.length > 0) {
      params.push(`alpn="${alpnList.join(',')}"`);
    }

    if (noDefaultAlpn) {
      params.push('no-default-alpn');
    }

    if (port && !isNaN(parseInt(port))) {
      params.push(`port=${port}`);
    }

    if (ipv4hint.trim()) {
      params.push(`ipv4hint="${ipv4hint.trim()}"`);
    }

    if (ipv6hint.trim()) {
      params.push(`ipv6hint="${ipv6hint.trim()}"`);
    }

    if (ech.trim()) {
      params.push(`ech="${ech.trim()}"`);
    }

    return params.join(' ');
  }, [mode, alpnH3, alpnH2, alpnH1, noDefaultAlpn, port, ipv4hint, ipv6hint, ech]);

  const svcParamsValue = generateParams();

  const fullBindRecord = `${host || '@'}. ${ttl || 300} IN HTTPS ${mode === 'alias' ? 0 : priority} ${
    target.trim() || '.'
  } ${svcParamsValue}`.trim();

  const copyText = (textVal: string, label: string) => {
    navigator.clipboard.writeText(textVal).then(() => showToast(`${t.copiedText} ${label}`));
  };

  const copyShareUrl = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => showToast(t.copiedShare));
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
          href={lang === 'en' ? '/https-dns-generator/' : '/https-dns-generator/en/'}
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

      <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
        {/* 左欄：設定參數 (勾選與填空) */}
        <div className={styles.cardPanel}>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#00f0ff] dark:text-[#00f0ff] uppercase tracking-[1px]">
            <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
              <path d="M7 2v11h3v9l7-12h-4l4-8z" />
            </svg>
            <span className={styles.accentText}>{t.configTitle}</span>
          </div>

          {/* 常用預設情境 Chips */}
          <div className={styles.innerPanel}>
            <span className="text-xs text-text-sub font-semibold">{t.presetTitle}</span>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => applyPreset('standard')} className={styles.presetBtn}>
                {t.presetStandard}
              </button>
              <button type="button" onClick={() => applyPreset('alias')} className={styles.presetBtn}>
                {t.presetAlias}
              </button>
              <button type="button" onClick={() => applyPreset('custom-port')} className={styles.presetBtn}>
                {t.presetPort}
              </button>
              <button type="button" onClick={() => applyPreset('clear')} className={styles.presetBtn}>
                {t.presetReset}
              </button>
            </div>
          </div>

          {/* 模式切換 */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium text-text-sub uppercase tracking-[1px]">{t.modeLabel}</span>
            <div className="grid grid-cols-2 gap-2 bg-select-bg p-1.5 rounded-xl border border-border-glass">
              <button
                type="button"
                onClick={() => setMode('service')}
                className={`py-2 px-3 text-sm rounded-lg cursor-pointer transition-all ${
                  mode === 'service' ? styles.toggleBtnActive : styles.toggleBtnInactive
                }`}
              >
                {t.serviceMode}
              </button>
              <button
                type="button"
                onClick={() => setMode('alias')}
                className={`py-2 px-3 text-sm rounded-lg cursor-pointer transition-all ${
                  mode === 'alias' ? styles.toggleBtnActive : styles.toggleBtnInactive
                }`}
              >
                {t.aliasMode}
              </button>
            </div>
          </div>

          {/* 基礎欄位：Host, TTL */}
          <div className="grid grid-cols-2 gap-4 border-t border-border-glass pt-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={hostInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                {t.hostLabel}
              </label>
              <input
                id={hostInputId}
                type="text"
                value={host}
                onChange={e => setHost(e.target.value)}
                placeholder="@"
                className={styles.inputBox}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={ttlInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                {t.ttlLabel}
              </label>
              <input
                id={ttlInputId}
                type="number"
                value={ttl}
                onChange={e => setTtl(parseInt(e.target.value) || 300)}
                className={styles.inputBox}
              />
            </div>
          </div>

          {/* 基礎欄位：Priority, TargetName */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={priorityInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                {t.priorityLabel}
              </label>
              <input
                id={priorityInputId}
                type="number"
                disabled={mode === 'alias'}
                value={mode === 'alias' ? 0 : priority}
                onChange={e => setPriority(parseInt(e.target.value) || 1)}
                className={`${styles.inputBox} disabled:opacity-50`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={targetInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                {t.targetLabel}
              </label>
              <input
                id={targetInputId}
                type="text"
                value={target}
                onChange={e => setTarget(e.target.value)}
                placeholder="."
                className={styles.inputBox}
              />
            </div>
          </div>

          {/* SvcParams (Service Mode 專屬參數) */}
          {mode === 'service' && (
            <div className="flex flex-col gap-5 border-t border-border-glass pt-4">
              <span className={`text-sm font-semibold ${styles.accentText}`}>{t.paramsSection}</span>

              {/* ALPN 協定 */}
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-sub">{t.alpnLabel}</span>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-text-main cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alpnH3}
                      onChange={e => setAlpnH3(e.target.checked)}
                      className="accent-[#00f0ff]"
                    />
                    HTTP/3 (h3)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-text-main cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alpnH2}
                      onChange={e => setAlpnH2(e.target.checked)}
                      className="accent-[#00f0ff]"
                    />
                    HTTP/2 (h2)
                  </label>
                  <label className="flex items-center gap-2 text-xs text-text-main cursor-pointer">
                    <input
                      type="checkbox"
                      checked={alpnH1}
                      onChange={e => setAlpnH1(e.target.checked)}
                      className="accent-[#00f0ff]"
                    />
                    HTTP/1.1 (http/1.1)
                  </label>
                </div>
              </div>

              {/* IP Hints */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor={ipv4InputId} className="text-sm font-medium text-text-sub">
                    ipv4hint
                  </label>
                  <input
                    id={ipv4InputId}
                    type="text"
                    value={ipv4hint}
                    onChange={e => setIpv4hint(e.target.value)}
                    placeholder="198.51.100.1, 198.51.100.2"
                    className={styles.inputBox}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor={ipv6InputId} className="text-sm font-medium text-text-sub">
                    ipv6hint
                  </label>
                  <input
                    id={ipv6InputId}
                    type="text"
                    value={ipv6hint}
                    onChange={e => setIpv6hint(e.target.value)}
                    placeholder="2001:db8::1"
                    className={styles.inputBox}
                  />
                </div>
              </div>

              {/* Port & No default ALPN */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor={portInputId} className="text-sm font-medium text-text-sub">
                    {t.portLabel}
                  </label>
                  <input
                    id={portInputId}
                    type="number"
                    value={port}
                    onChange={e => setPort(e.target.value)}
                    placeholder="443"
                    className={styles.inputBox}
                  />
                </div>
                <div className="flex flex-col justify-end">
                  <label className="flex items-center gap-2 text-xs text-text-sub cursor-pointer py-2 font-medium">
                    <input
                      type="checkbox"
                      checked={noDefaultAlpn}
                      onChange={e => setNoDefaultAlpn(e.target.checked)}
                      className="accent-[#00f0ff]"
                    />
                    no-default-alpn
                  </label>
                </div>
              </div>

              {/* Encrypted Client Hello (ech) */}
              <div className="flex flex-col gap-2">
                <label htmlFor={echInputId} className="text-sm font-medium text-text-sub">
                  {t.echLabel}
                </label>
                <input
                  id={echInputId}
                  type="text"
                  value={ech}
                  onChange={e => setEch(e.target.value)}
                  placeholder="e.g. AEn+CiB..."
                  className={styles.inputBox}
                />
              </div>
            </div>
          )}

          {/* 分享連結按鈕 */}
          <button
            type="button"
            onClick={copyShareUrl}
            className="w-full py-2.5 bg-[#00f0ff]/10 border border-[#00f0ff]/30 text-[#00f0ff] font-semibold text-sm rounded-xl cursor-pointer hover:bg-[#00f0ff] hover:text-[#030305] transition-all flex items-center justify-center gap-2"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
            </svg>
            <span>{t.copyShareBtn}</span>
          </button>
        </div>

        {/* 右欄：產出紀錄與 DNS 代管商填寫對照表 */}
        <div className="flex flex-col gap-6">
          {/* 完整 BIND / RFC 9460 紀錄 */}
          <div className={styles.cardPanel}>
            <div className="flex justify-between items-center border-b border-border-glass pb-3">
              <span className={`text-sm ${styles.accentText} font-semibold uppercase tracking-[1px]`}>
                {t.fullRecordTitle}
              </span>
              <button
                type="button"
                onClick={() => copyText(fullBindRecord, t.fullRecordTitle)}
                className="px-3 py-1 text-sm bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] font-semibold rounded-lg hover:bg-[#00f0ff] hover:text-[#030305] transition-all cursor-pointer"
              >
                {t.copyRecordBtn}
              </button>
            </div>
            <div className={styles.outputCode}>{fullBindRecord}</div>
          </div>

          {/* 4 大核心欄位對照表 */}
          <div className={styles.cardPanel}>
            <h3 className={`text-sm ${styles.accentText} font-semibold uppercase tracking-[1px] border-b border-border-glass pb-3`}>
              {t.coreFieldsTitle}
            </h3>

            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              {/* 1. 名稱 */}
              <div className={styles.coreCard}>
                <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                  <span>{t.nameField}</span>
                  <button
                    type="button"
                    onClick={() => copyText(host || '@', t.nameField)}
                    className={`text-xs ${styles.accentText} hover:underline cursor-pointer flex items-center gap-1`}
                  >
                    <span>{t.copyBtn}</span>
                  </button>
                </div>
                <div className="text-sm font-bold text-text-main font-mono">{host || '@'}</div>
                <span className="text-xs text-text-sub">{t.nameDesc}</span>
              </div>

              {/* 2. 優先權 */}
              <div className={styles.coreCard}>
                <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                  <span>{t.prioField}</span>
                  <button
                    type="button"
                    onClick={() => copyText((mode === 'alias' ? 0 : priority).toString(), t.prioField)}
                    className={`text-xs ${styles.accentText} hover:underline cursor-pointer flex items-center gap-1`}
                  >
                    <span>{t.copyBtn}</span>
                  </button>
                </div>
                <div className={`text-sm font-bold ${styles.accentText} font-mono`}>{mode === 'alias' ? 0 : priority}</div>
                <span className="text-xs text-text-sub">{t.prioDesc}</span>
              </div>

              {/* 3. 目標 */}
              <div className={styles.coreCard}>
                <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                  <span>{t.targetField}</span>
                  <button
                    type="button"
                    onClick={() => copyText(target.trim() || '.', t.targetField)}
                    className={`text-xs ${styles.accentText} hover:underline cursor-pointer flex items-center gap-1`}
                  >
                    <span>{t.copyBtn}</span>
                  </button>
                </div>
                <div className="text-sm font-bold text-text-main font-mono">{target.trim() || '.'}</div>
                <span className="text-xs text-text-sub">{t.targetDesc}</span>
              </div>

              {/* 4. 內容/值 */}
              <div className={styles.coreCard}>
                <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                  <span>{t.valueField}</span>
                  <button
                    type="button"
                    onClick={() => copyText(svcParamsValue || t.emptyVal, t.valueField)}
                    className={`text-xs ${styles.accentText} hover:underline cursor-pointer flex items-center gap-1`}
                  >
                    <span>{t.copyBtn}</span>
                  </button>
                </div>
                <div className={`text-xs font-bold ${styles.accentText} font-mono break-all`}>
                  {svcParamsValue || t.emptyVal}
                </div>
                <span className="text-xs text-text-sub">{t.valueDesc}</span>
              </div>
            </div>
          </div>

          {/* 各大 DNS 代管商填寫指南 Tabs */}
          <div className={styles.cardPanel}>
            <h3 className={`text-sm ${styles.accentText} font-semibold uppercase tracking-[1px]`}>{t.guideTitle}</h3>

            {/* Provider Tabs */}
            <div className="grid grid-cols-4 gap-2 bg-select-bg p-1.5 rounded-xl border border-border-glass text-sm">
              {(
                [
                  { id: 'cf', name: 'Cloudflare' },
                  { id: 'r53', name: 'AWS Route53' },
                  { id: 'gcdns', name: 'Google Cloud' },
                  { id: 'bind', name: 'BIND 9' },
                ] as const
              ).map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveProvider(p.id)}
                  className={`py-1.5 rounded-lg cursor-pointer transition-all ${
                    activeProvider === p.id ? styles.toggleBtnActive : styles.toggleBtnInactive
                  }`}
                >
                  {p.name}
                </button>
              ))}
            </div>

            {/* Guide Content Panel */}
            <div className={styles.innerPanel}>
              {activeProvider === 'cf' && (
                <>
                  <strong className="text-text-main font-semibold">{t.cfTitle}</strong>
                  <ul className="list-disc pl-5 flex flex-col gap-1 text-xs">
                    <li>
                      <strong>Type</strong>：{t.select} <code className={styles.accentText}>HTTPS</code>
                    </li>
                    <li>
                      <strong>Name</strong>：{t.enter} <code className={styles.accentText}>{host || '@'}</code>
                    </li>
                    <li>
                      <strong>Priority</strong>：{t.enter}{' '}
                      <code className={styles.accentText}>{mode === 'alias' ? 0 : priority}</code>
                    </li>
                    <li>
                      <strong>Target</strong>：{t.enter} <code className={styles.accentText}>{target.trim() || '.'}</code>
                    </li>
                    <li>
                      <strong>Value</strong>：{t.enter} <code className={styles.accentText}>{svcParamsValue || t.leaveEmpty}</code>
                    </li>
                  </ul>
                </>
              )}

              {activeProvider === 'r53' && (
                <>
                  <strong className="text-text-main font-semibold">{t.r53Title}</strong>
                  <ul className="list-disc pl-5 flex flex-col gap-1 text-xs">
                    <li>
                      <strong>Record type</strong>：{t.select} <code className={styles.accentText}>HTTPS - Type 65</code>
                    </li>
                    <li>
                      <strong>Record name</strong>：{t.enter} <code className={styles.accentText}>{host === '@' ? '' : host}</code>
                    </li>
                    <li>
                      <strong>Value</strong>：{t.enterFullLine} <code className={styles.accentText}>{fullBindRecord}</code>
                    </li>
                  </ul>
                </>
              )}

              {activeProvider === 'gcdns' && (
                <>
                  <strong className="text-text-main font-semibold">{t.gcdnsTitle}</strong>
                  <ul className="list-disc pl-5 flex flex-col gap-1 text-xs">
                    <li>
                      <strong>Resource Record Type</strong>：{t.select} <code className={styles.accentText}>HTTPS</code>
                    </li>
                    <li>
                      <strong>DNS Name</strong>：{t.subdomainOrEmpty}
                    </li>
                    <li>
                      <strong>Canonical Data</strong>：{t.pasteFullValue} <code className={styles.accentText}>{fullBindRecord}</code>
                    </li>
                  </ul>
                </>
              )}

              {activeProvider === 'bind' && (
                <>
                  <strong className="text-text-main font-semibold">{t.bindTitle}</strong>
                  <ul className="list-disc pl-5 flex flex-col gap-1 text-xs">
                    <li>{t.bindDesc}</li>
                    <code className={`${styles.outputCode} block mt-1 font-mono`}>{fullBindRecord}</code>
                  </ul>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection
            title={t.faqTitle}
            subtitle={t.faqSubtitle}
            items={t.faqItems}
            accentColor="#00d2ff"
          />
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] backdrop-blur-md shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

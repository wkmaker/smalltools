'use client';

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import styles from './dns-dig.module.css';

interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

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

// RFC 9460 / RFC 3597 SVCB/HTTPS (Type 64/65) Hex decoder
function parseSvcbHttps(bytes: Uint8Array): string | null {
  if (bytes.length < 3) return null;
  let offset = 0;

  const priority = (bytes[offset] << 8) | bytes[offset + 1];
  offset += 2;

  const targetParts: string[] = [];
  while (offset < bytes.length) {
    const len = bytes[offset++];
    if (len === 0) break;
    if (offset + len > bytes.length) return null;
    const labelBytes = bytes.subarray(offset, offset + len);
    targetParts.push(new TextDecoder().decode(labelBytes));
    offset += len;
  }
  const targetName = targetParts.length === 0 ? '.' : targetParts.join('.') + '.';

  const params: string[] = [];
  const KEY_NAMES: Record<number, string> = {
    0: 'mandatory',
    1: 'alpn',
    2: 'no-default-alpn',
    3: 'port',
    4: 'ipv4hint',
    5: 'ech',
    6: 'ipv6hint',
    7: 'dohpath',
  };

  while (offset + 4 <= bytes.length) {
    const key = (bytes[offset] << 8) | bytes[offset + 1];
    const valLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
    offset += 4;

    if (offset + valLen > bytes.length) break;
    const valBytes = bytes.subarray(offset, offset + valLen);
    offset += valLen;

    const keyName = KEY_NAMES[key] || `key${key}`;
    let valStr = '';

    if (key === 1) {
      const alpnList: string[] = [];
      let aOffset = 0;
      while (aOffset < valBytes.length) {
        const aLen = valBytes[aOffset++];
        if (aOffset + aLen > valBytes.length) break;
        alpnList.push(new TextDecoder().decode(valBytes.subarray(aOffset, aOffset + aLen)));
        aOffset += aLen;
      }
      valStr = alpnList.join(',');
    } else if (key === 3) {
      if (valBytes.length === 2) {
        valStr = ((valBytes[0] << 8) | valBytes[1]).toString();
      }
    } else if (key === 4) {
      const ips: string[] = [];
      for (let i = 0; i + 4 <= valBytes.length; i += 4) {
        ips.push(`${valBytes[i]}.${valBytes[i + 1]}.${valBytes[i + 2]}.${valBytes[i + 3]}`);
      }
      valStr = ips.join(',');
    } else if (key === 6) {
      const ips: string[] = [];
      for (let i = 0; i + 16 <= valBytes.length; i += 16) {
        const groups: string[] = [];
        for (let j = 0; j < 16; j += 2) {
          groups.push(((valBytes[i + j] << 8) | valBytes[i + j + 1]).toString(16));
        }
        ips.push(groups.join(':'));
      }
      valStr = ips.join(',');
    } else if (key === 2) {
      valStr = '';
    } else {
      valStr = new TextDecoder().decode(valBytes);
    }

    if (key === 2 && !valStr) {
      params.push(keyName);
    } else {
      params.push(`${keyName}=${valStr}`);
    }
  }

  let result = `${priority} ${targetName}`;
  if (params.length > 0) {
    result += ` ${params.join(' ')}`;
  }
  return result;
}

function parseRfc3597(dataStr: string, recordType: number): string | null {
  try {
    const cleaned = dataStr.replace(/^\\?\#\s*/, '').trim();
    const tokens = cleaned.split(/\s+/);
    if (tokens.length < 2) return null;

    const hexBytes = tokens.slice(1);
    const bytes = new Uint8Array(hexBytes.map(h => parseInt(h, 16)));

    if (recordType === 65 || recordType === 64) {
      return parseSvcbHttps(bytes);
    }
  } catch {
    // Silent catch
  }
  return null;
}

function formatDnsData(ans: DnsAnswer): string {
  if (!ans || !ans.data) return '';
  const rawData = String(ans.data);

  if (/^\\?\#\s*/.test(rawData)) {
    const parsed = parseRfc3597(rawData, ans.type);
    if (parsed) return parsed;
  }
  return rawData;
}

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

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

      const res = await fetch(url, { headers });
      const duration = Math.round(performance.now() - startTime);
      setQueryDuration(duration);

      if (!res.ok) throw new Error(`HTTP Error! Status: ${res.status}`);

      const data: DnsResponse = await res.json();
      setResult(data);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || t.queryErrorMsg);
    } finally {
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
    >
      {/* 右上方語言切換開關 */}
      <div className="flex justify-end mb-4">
        <Link
          href={lang === 'en' ? '/dns-dig/' : '/dns-dig/en/'}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-all flex items-center gap-1.5"
        >
          <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
          </svg>
          {lang === 'en' ? '繁體中文' : 'English'}
        </Link>
      </div>

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
                  {t.answerTitle} {result.Answer ? `(${result.Answer.length})` : '(0)'}
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
              <details className="bg-select-bg border border-border-glass rounded-xl p-4 text-xs">
                <summary className="cursor-pointer text-text-sub font-medium hover:text-text-main flex justify-between items-center">
                  <span>{t.rawJsonTitle}</span>
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      navigator.clipboard
                        .writeText(JSON.stringify(result, null, 2))
                        .then(() => showToast(t.copyJsonToast));
                    }}
                    className="px-2.5 py-1 text-sm font-medium bg-white/[.05] border border-border-glass text-text-sub rounded hover:text-text-main cursor-pointer"
                  >
                    {t.copyJsonBtn}
                  </button>
                </summary>
                <pre className={`mt-3 p-3 bg-black/40 dark:bg-black/60 rounded-lg ${styles.rawJson}`}>
                  {JSON.stringify(result, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>

      {/* Toast 提示條 */}
      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm rounded-lg bg-[#8b5cf6]/20 border border-[#8b5cf6]/40 text-[#8b5cf6] backdrop-blur-md shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

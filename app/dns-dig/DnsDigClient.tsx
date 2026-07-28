'use client';

import { useState, useEffect, useCallback, useRef, useId } from 'react';
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

const RCODE_MAP: Record<number, string> = {
  0: 'NOERROR (成功)',
  1: 'FORMERR (格式錯誤)',
  2: 'SERVFAIL (伺服器失敗)',
  3: 'NXDOMAIN (網域不存在)',
  4: 'NOTIMP (未實作功能)',
  5: 'REFUSED (拒絕查詢)',
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

// RFC 9460 / RFC 3597 SVCB/HTTPS (Type 64/65) 二進位 Hex 自動轉譯為可讀文字
function parseSvcbHttps(bytes: Uint8Array): string | null {
  if (bytes.length < 3) return null;
  let offset = 0;

  // 1. SvcPriority (2 bytes)
  const priority = (bytes[offset] << 8) | bytes[offset + 1];
  offset += 2;

  // 2. TargetName
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

  // 3. SvcParams
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
      // alpn
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
      // port
      if (valBytes.length === 2) {
        valStr = ((valBytes[0] << 8) | valBytes[1]).toString();
      }
    } else if (key === 4) {
      // ipv4hint
      const ips: string[] = [];
      for (let i = 0; i + 4 <= valBytes.length; i += 4) {
        ips.push(`${valBytes[i]}.${valBytes[i + 1]}.${valBytes[i + 2]}.${valBytes[i + 3]}`);
      }
      valStr = ips.join(',');
    } else if (key === 6) {
      // ipv6hint
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

// 清理網域字串 (移除 http/https, 路徑, 埠號)
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

export default function DnsDigClient() {
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

  // 從網址列初始載入 (URL Parameters)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    if (!params.toString()) return;

    const d = params.get('d');
    const s = params.get('s') as 'cloudflare' | 'google' | 'alidns' | null;
    const t = params.get('t');

    if (d) setDomain(d);
    if (s && ['cloudflare', 'google', 'alidns'].includes(s)) setProvider(s);
    if (t && RECORD_TYPES.includes(t.toUpperCase())) setRecordType(t.toUpperCase());
  }, []);

  // 正向連動 URL (無感 replaceState)
  const syncToURL = useCallback((d: string, s: string, t: string) => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    if (d) params.set('d', d);
    params.set('s', s);
    params.set('t', t);
    window.history.replaceState(null, '', '?' + params.toString());
  }, []);

  // 執行 DoH DNS 查詢核心函式 (傳參避開 Closure 滯後)
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

      if (!res.ok) throw new Error(`HTTP 錯誤! 狀態碼: ${res.status}`);

      const data: DnsResponse = await res.json();
      setResult(data);
    } catch (err: unknown) {
      const error = err as Error;
      setErrorMsg(error.message || '查詢 DNS 發生連線錯誤，請檢查網域或 API 回應。');
    } finally {
      setLoading(false);
    }
  }, [syncToURL]);

  const handleQuery = () => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const cleaned = cleanDomainInput(domain);
    if (!cleaned) {
      showToast('請輸入欲查詢的網域名稱！');
      return;
    }
    setDomain(cleaned);
    executeQuery(cleaned, provider, recordType);
  };

  // 打字時 1 秒防抖自動查詢
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

  // 切換 DoH 伺服器時立即自動查詢
  const handleProviderChange = (newProvider: 'cloudflare' | 'google' | 'alidns') => {
    setProvider(newProvider);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const cleaned = cleanDomainInput(domain);
    if (cleaned) {
      executeQuery(cleaned, newProvider, recordType);
    }
  };

  // 切換紀錄類型時立即自動查詢
  const handleRecordTypeChange = (newType: string) => {
    setRecordType(newType);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    const cleaned = cleanDomainInput(domain);
    if (cleaned) {
      executeQuery(cleaned, provider, newType);
    } else {
      showToast(`已切換為 ${newType} 紀錄，請輸入網域進行查詢`);
    }
  };

  // 複製試算/查詢分享連結
  const copyShareLink = () => {
    const cleaned = cleanDomainInput(domain);
    syncToURL(cleaned, provider, recordType);
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => showToast('已複製 DNS 查詢分享連結'));
  };

  // 初次掛載自動觸發一次查詢
  useEffect(() => {
    const cleaned = cleanDomainInput(domain);
    if (cleaned) {
      executeQuery(cleaned, provider, recordType);
    }
    // eslint-disable-next-deps
  }, []);

  const copyCellText = (text: string) => {
    navigator.clipboard.writeText(text).then(() => showToast(`已複製: ${text}`));
  };

  return (
    <ToolLayout
      title="線上 DNS DIG 網路診斷工具"
      subtitle="ONLINE DNS LOOKUP & DIAGNOSTICS"
      description="專業免費的線上 DNS DIG 網路診斷工具！串接 Cloudflare, Google 與 阿里雲 DoH (DNS over HTTPS) API，支援 A, CNAME, MX, TXT, HTTPS 等全紀錄類型即時檢索與 RFC 9460 轉譯。"
      accentColor="#8b5cf6"
      accentGlow="rgba(139, 92, 246, 0.6)"
    >
      <div className="grid grid-cols-[0.8fr_1.2fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
        {/* 左欄：查詢參數設定區 */}
        <div className="bg-black/20 border border-white/[.08] rounded-2xl p-8 flex flex-col gap-6 shadow-lg min-w-0">
          <div className="flex justify-between items-center border-b border-white/[.06] pb-3">
            <h3 className="text-sm text-[#8b5cf6] uppercase tracking-[1px] font-semibold">
              DNS 查詢設定
            </h3>
            <button
              onClick={copyShareLink}
              className="px-3 py-1 text-sm font-medium bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#8b5cf6] rounded-lg hover:bg-[#8b5cf6] hover:text-[#030305] transition-all cursor-pointer"
            >
              複製查詢連結
            </button>
          </div>

          {/* 網域名稱 */}
          <div className="flex flex-col gap-2">
            <label htmlFor={domainInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
              查詢網域名稱 (Domain / URL)
            </label>
            <input
              id={domainInputId}
              type="text"
              value={domain}
              onChange={handleDomainInputChange}
              onBlur={() => setDomain(cleanDomainInput(domain))}
              onKeyDown={e => e.key === 'Enter' && handleQuery()}
              placeholder="例如：cjkuo.net 或貼上網址"
              className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#8b5cf6] focus:shadow-[0_0_15px_rgba(139,92,246,0.2)] font-mono"
            />
          </div>

          {/* DoH 伺服器 */}
          <div className="flex flex-col gap-2 border-t border-white/[.05] pt-4">
            <label htmlFor={providerSelectId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
              DNS 查詢伺服器 (DoH)
            </label>
            <select
              id={providerSelectId}
              value={provider}
              onChange={e => handleProviderChange(e.target.value as 'cloudflare' | 'google' | 'alidns')}
              className="w-full bg-select-bg border border-border-glass text-text-main px-4 py-3 rounded-xl text-sm outline-none cursor-pointer font-mono"
            >
              <option value="cloudflare">⚡ Cloudflare DNS (1.1.1.1)</option>
              <option value="google">🔍 Google DNS (8.8.8.8)</option>
              <option value="alidns">☁️ 阿里雲 DNS</option>
            </select>
          </div>

          {/* 紀錄類型選單 */}
          <div className="flex flex-col gap-2 border-t border-white/[.05] pt-4">
            <label className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
              查詢紀錄類型 (Type)
            </label>
            <div className="grid grid-cols-4 gap-1.5 max-sm:grid-cols-3">
              {RECORD_TYPES.map(type => (
                <button
                  key={type}
                  onClick={() => handleRecordTypeChange(type)}
                  className={`py-1.5 text-sm font-semibold font-mono rounded-lg cursor-pointer transition-all border ${
                    recordType === type
                      ? 'bg-[#8b5cf6]/20 border-[#8b5cf6]/40 text-[#8b5cf6] shadow-[0_0_10px_rgba(139,92,246,0.2)]'
                      : 'border-transparent text-text-sub hover:text-white hover:bg-white/[.02]'
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
            {loading ? '請求中...' : '進行 DIG 查詢'}
          </button>
        </div>

        {/* 右欄：解析結果展示區 */}
        <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-6 shadow-lg min-w-0">
          <h3 className="text-sm text-[#8b5cf6] uppercase tracking-[1px] font-semibold border-b border-white/[.06] pb-3">
            解析診斷成果看板
          </h3>

          {errorMsg && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-xl text-sm">
              ⚠️ 查詢失敗：{errorMsg}
            </div>
          )}

          {result && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              {/* 狀態與耗時 Summary */}
              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1 font-mono">
                <div className="bg-black/40 p-4 rounded-xl border border-white/[.04] flex flex-col gap-1">
                  <span className="text-xs font-semibold text-text-sub">響應狀態 (Status)</span>
                  <span
                    className={`text-base font-bold ${
                      result.Status === 0 ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {RCODE_MAP[result.Status] || `UNKNOWN (${result.Status})`}
                  </span>
                </div>

                <div className="bg-black/40 p-4 rounded-xl border border-white/[.04] flex flex-col gap-1">
                  <span className="text-xs font-semibold text-text-sub">查詢耗時 (Duration)</span>
                  <span className="text-base font-bold text-[#8b5cf6]">
                    {queryDuration !== null ? `${queryDuration} ms` : '-'}
                  </span>
                </div>
              </div>

              {/* 答覆紀錄 Answer Table */}
              <div className="flex flex-col gap-2">
                <label className="text-sm text-text-sub font-semibold uppercase tracking-[1px]">
                  答覆紀錄 (Answer) {result.Answer ? `(${result.Answer.length})` : '(0)'}
                </label>
                <div className={styles.tableContainer}>
                  <table className="w-full text-xs font-mono text-left">
                    <thead>
                      <tr className="border-b border-white/[.08] text-text-sub bg-white/[.02]">
                        <th className="p-3 w-[25%]">網域名稱</th>
                        <th className="p-3 w-[12%]">類型</th>
                        <th className="p-3 w-[12%]">TTL</th>
                        <th className="p-3 w-[51%]">記錄值 (Data)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.Answer && result.Answer.length > 0 ? (
                        result.Answer.map((ans, idx) => {
                          const dispData = formatDnsData(ans);
                          const typeText = TYPE_MAP[ans.type] || `TYPE-${ans.type}`;

                          return (
                            <tr key={idx} className="border-b border-white/[.03] hover:bg-white/[.02] transition-colors">
                              <td
                                onClick={() => copyCellText(ans.name)}
                                className={`p-3 text-white font-medium ${styles.copyableCell}`}
                                title="點擊複製名稱"
                              >
                                {ans.name}
                              </td>
                              <td className="p-3 text-[#8b5cf6] font-bold">{typeText}</td>
                              <td className="p-3 text-text-sub">{ans.TTL}s</td>
                              <td
                                onClick={() => copyCellText(dispData)}
                                className={`p-3 text-emerald-400 break-all ${styles.copyableCell}`}
                                title={dispData !== ans.data ? `原始 RFC 3597 數據：\n${ans.data}` : '點擊複製紀錄值'}
                              >
                                {dispData}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={4} className="p-8 text-center text-text-sub text-sm">
                            ⚠️ 查無對應的 {recordType} 紀錄或該網域未設定解析。
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Raw JSON 展示 */}
              <details className="bg-black/40 border border-white/[.06] rounded-xl p-4 text-xs">
                <summary className="cursor-pointer text-text-sub font-medium hover:text-white flex justify-between items-center">
                  <span>檢視完整 DoH JSON 數據</span>
                  <button
                    type="button"
                    onClick={e => {
                      e.preventDefault();
                      navigator.clipboard
                        .writeText(JSON.stringify(result, null, 2))
                        .then(() => showToast('已複製 JSON 數據'));
                    }}
                    className="px-2.5 py-1 text-sm font-medium bg-white/[.05] border border-white/[.1] text-text-sub rounded hover:text-white cursor-pointer"
                  >
                    複製 JSON
                  </button>
                </summary>
                <pre className={`mt-3 p-3 bg-black/60 rounded-lg ${styles.rawJson}`}>
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

'use client';

import { useState, useEffect, useCallback, useMemo, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import styles from './ip-calculator.module.css';

// === IPv4 核心位元運算與型別定義 ===

interface SubnetResult {
  inputIp: string;
  cidr: number;
  subnetMask: string;
  wildcardMask: string;
  networkAddress: string;
  networkInt: number;
  broadcastAddress: string;
  broadcastInt: number;
  totalIps: number;
  usableCount: number;
  firstUsableInt: number;
  lastUsableInt: number;
  firstUsableStr: string;
  lastUsableStr: string;
  scopeInfo: {
    classStr: string;
    scope: string;
    badgeClass: string;
  };
  binaryIp: string;
}

// IP 字串轉 32 位無符號整數
function ipToInt(ipStr: string): number | null {
  if (typeof ipStr !== 'string') return null;
  const parts = ipStr.trim().split('.');
  if (parts.length !== 4) return null;
  let num = 0;
  for (let i = 0; i < 4; i++) {
    const p = parts[i];
    if (!/^\d+$/.test(p)) return null;
    const n = parseInt(p, 10);
    if (n < 0 || n > 255 || (p.length > 1 && p.startsWith('0'))) return null;
    num = (num << 8) + n;
  }
  return num >>> 0;
}

// 32 位無符號整數轉 IP 字串
function intToIp(intVal: number): string {
  return [
    (intVal >>> 24) & 255,
    (intVal >>> 16) & 255,
    (intVal >>> 8) & 255,
    intVal & 255,
  ].join('.');
}

// 32 位無符號整數轉二進制點分格式
function intToBinary(intVal: number): string {
  return [
    (intVal >>> 24) & 255,
    (intVal >>> 16) & 255,
    (intVal >>> 8) & 255,
    intVal & 255,
  ]
    .map((b) => b.toString(2).padStart(8, '0'))
    .join('.');
}

// CIDR 前綴轉遮罩整數
function cidrToMaskInt(cidr: number): number {
  if (cidr === 0) return 0;
  return (~0 << (32 - cidr)) >>> 0;
}

// 判斷 IP 類別與屬性
function getIpScopeInfo(ipInt: number) {
  const firstOctet = (ipInt >>> 24) & 255;
  let ipClass = 'C';
  if (firstOctet <= 127) ipClass = 'A';
  else if (firstOctet <= 191) ipClass = 'B';
  else if (firstOctet <= 223) ipClass = 'C';
  else if (firstOctet <= 239) ipClass = 'D (Multicast)';
  else ipClass = 'E (Experimental)';

  // Private 10.0.0.0/8
  if ((ipInt >>> 24) === 10)
    return { classStr: `${ipClass} Class`, scope: 'Private', badgeClass: styles.badgePrivate };
  // Private 172.16.0.0/12
  if ((ipInt >>> 20) === ((ipToInt('172.16.0.0') ?? 0) >>> 20))
    return { classStr: `${ipClass} Class`, scope: 'Private', badgeClass: styles.badgePrivate };
  // Private 192.168.0.0/16
  if ((ipInt >>> 16) === ((ipToInt('192.168.0.0') ?? 0) >>> 16))
    return { classStr: `${ipClass} Class`, scope: 'Private', badgeClass: styles.badgePrivate };
  // Loopback 127.0.0.0/8
  if (firstOctet === 127)
    return { classStr: `${ipClass} Class`, scope: 'Loopback', badgeClass: styles.badgeSpecial };
  // CGNAT 100.64.0.0/10
  if ((ipInt >>> 22) === ((ipToInt('100.64.0.0') ?? 0) >>> 22))
    return { classStr: `${ipClass} Class`, scope: 'CGNAT', badgeClass: styles.badgeSpecial };
  // Link-Local 169.254.0.0/16
  if ((ipInt >>> 16) === ((ipToInt('169.254.0.0') ?? 0) >>> 16))
    return { classStr: `${ipClass} Class`, scope: 'Link-Local', badgeClass: styles.badgeSpecial };

  if (firstOctet >= 224)
    return { classStr: `${ipClass} Class`, scope: 'Reserved', badgeClass: styles.badgeSpecial };

  return { classStr: `${ipClass} Class`, scope: 'Public', badgeClass: styles.badgePublic };
}

export default function IpCalculatorClient() {
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [mode, setMode] = useState<'cidr' | 'std'>('cidr');

  // 輸入項目
  const [inputCidr, setInputCidr] = useState<string>('192.168.1.50/24');
  const [inputIp, setInputIp] = useState<string>('192.168.1.50');
  const [selectMask, setSelectMask] = useState<number>(24);
  const [errMessage, setErrMessage] = useState<string>('');

  // 計算結果
  const [calcResult, setCalcResult] = useState<SubnetResult | null>(null);

  // 列表過濾與分頁
  const [filterKeyword, setFilterKeyword] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 100;

  // Toast 提示
  const [toast, setToast] = useState<string>('');

  // 唯一 HTML ID
  const inputCidrId = useId();
  const inputIpId = useId();
  const selectMaskId = useId();
  const filterInputId = useId();

  // 初始化主題顏色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f0ff');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 240, 255, 0.6)');
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // 反向解析 URL 參數 (僅在掛載後執行一次)
  useEffect(() => {
    setIsMounted(true);
    const params = new URLSearchParams(window.location.search);
    const cidrParam = params.get('cidr');
    const ipParam = params.get('ip');
    const maskParam = params.get('mask');

    if (cidrParam) {
      setMode('cidr');
      setInputCidr(cidrParam);
    } else if (ipParam) {
      setMode('std');
      setInputIp(ipParam);
      if (maskParam) {
        const m = parseInt(maskParam, 10);
        if (!isNaN(m) && m >= 0 && m <= 32) {
          setSelectMask(m);
        }
      }
    }
  }, []);

  // 核心計算函數
  const calculateSubnet = useCallback((ipInt: number, rawIpStr: string, cidr: number): SubnetResult => {
    const maskInt = cidrToMaskInt(cidr);
    const maskStr = intToIp(maskInt);
    const wildcardInt = (~maskInt) >>> 0;
    const wildcardStr = intToIp(wildcardInt);

    const netInt = (ipInt & maskInt) >>> 0;
    const netStr = intToIp(netInt);

    const broadcastInt = (netInt | wildcardInt) >>> 0;
    const broadcastStr = intToIp(broadcastInt);

    const totalIps = Math.pow(2, 32 - cidr);

    let usableCount = 0;
    let firstUsableInt = 0;
    let lastUsableInt = 0;

    if (cidr === 31) {
      // RFC 3021 Point-to-Point
      usableCount = 2;
      firstUsableInt = netInt;
      lastUsableInt = broadcastInt;
    } else if (cidr === 32) {
      // Single Host
      usableCount = 1;
      firstUsableInt = netInt;
      lastUsableInt = netInt;
    } else {
      // Standard subnet (<= 30)
      usableCount = totalIps - 2;
      firstUsableInt = netInt + 1;
      lastUsableInt = broadcastInt - 1;
    }

    const firstUsableStr = intToIp(firstUsableInt);
    const lastUsableStr = intToIp(lastUsableInt);
    const scopeInfo = getIpScopeInfo(ipInt);
    const binaryIp = intToBinary(ipInt);

    return {
      inputIp: rawIpStr,
      cidr,
      subnetMask: maskStr,
      wildcardMask: wildcardStr,
      networkAddress: netStr,
      networkInt: netInt,
      broadcastAddress: broadcastStr,
      broadcastInt: broadcastInt,
      totalIps,
      usableCount,
      firstUsableInt,
      lastUsableInt,
      firstUsableStr,
      lastUsableStr,
      scopeInfo,
      binaryIp,
    };
  }, []);

  // 即時解析與計算
  useEffect(() => {
    setErrMessage('');

    if (mode === 'cidr') {
      const val = inputCidr.trim();
      if (!val) {
        setCalcResult(null);
        return;
      }
      const parts = val.split('/');
      const rawIp = parts[0].trim();

      if (parts.length > 2) {
        setErrMessage('CIDR 格式錯誤，僅能包含一個斜線 (例如 192.168.1.1/24)');
        setCalcResult(null);
        return;
      }

      let cidr = 32;
      if (parts.length === 2) {
        const cStr = parts[1].trim();
        if (cStr === '') return; // 輸入中
        const c = parseInt(cStr, 10);
        if (isNaN(c) || c < 0 || c > 32 || cStr !== c.toString()) {
          setErrMessage('CIDR 前綴長度必須在 0 到 32 之間的整數 (例如 /24)');
          setCalcResult(null);
          return;
        }
        cidr = c;
      }

      if (rawIp.endsWith('.')) return; // 輸入中
      const ipInt = ipToInt(rawIp);
      if (ipInt === null) {
        setErrMessage(`無效的 IP 位址: "${rawIp}"，各 Octet 需為 0~255`);
        setCalcResult(null);
        return;
      }

      setCalcResult(calculateSubnet(ipInt, rawIp, cidr));
    } else {
      // 標準模式 (std)
      const rawIp = inputIp.trim();
      if (!rawIp) {
        setCalcResult(null);
        return;
      }
      if (rawIp.endsWith('.')) return;
      const ipInt = ipToInt(rawIp);
      if (ipInt === null) {
        setErrMessage('請輸入有效的 IPv4 位址 (例如 192.168.1.50)');
        setCalcResult(null);
        return;
      }

      setCalcResult(calculateSubnet(ipInt, rawIp, selectMask));
    }

    setCurrentPage(1);
  }, [mode, inputCidr, inputIp, selectMask, calculateSubnet]);

  // 正向連動 300ms 防抖更新 URL
  useEffect(() => {
    if (!isMounted || !calcResult) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams();
      if (mode === 'cidr') {
        params.set('cidr', `${calcResult.inputIp}/${calcResult.cidr}`);
      } else {
        params.set('ip', calcResult.inputIp);
        params.set('mask', calcResult.cidr.toString());
      }
      window.history.replaceState(null, '', '?' + params.toString());
    }, 300);

    return () => clearTimeout(handler);
  }, [calcResult, mode, isMounted]);

  // 產生過濾後的可用 IP 數組 (極速動態 Memo)
  const filteredUsableIps = useMemo(() => {
    if (!calcResult) return [];

    const { firstUsableInt, usableCount } = calcResult;
    const kw = filterKeyword.trim().toLowerCase();
    const result: Array<{ index: number; ipStr: string }> = [];

    // 若超大網段且未輸入關鍵字，前端頁面僅 DOM 載入前 1,000 筆
    const limit = usableCount > 1000 && !kw ? 1000 : Math.min(usableCount, 100000);

    for (let i = 0; i < limit; i++) {
      const currentIpInt = firstUsableInt + i;
      const ipStr = intToIp(currentIpInt);

      if (!kw || ipStr.includes(kw)) {
        result.push({ index: i + 1, ipStr });
      }
    }

    return result;
  }, [calcResult, filterKeyword]);

  // 重置與範例
  const handleClear = () => {
    setInputCidr('');
    setInputIp('');
    setFilterKeyword('');
    setErrMessage('');
    setCalcResult(null);
    showToast('已清空輸入項目');
  };

  const loadExample = () => {
    setMode('cidr');
    setInputCidr('192.168.1.50/24');
    setFilterKeyword('');
    showToast('已載入預設範例 /24');
  };

  // 一鍵複製文字
  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt).then(() => showToast(`已複製: ${txt}`));
  };

  const copyAllUsableIps = () => {
    if (!calcResult) return;
    if (calcResult.usableCount > 50000) {
      showToast(`網段 IP 數量較大 (${calcResult.usableCount.toLocaleString()} 筆)，請點擊「匯出 TXT/CSV」`);
      return;
    }

    const list: string[] = [];
    for (let i = 0; i < calcResult.usableCount; i++) {
      list.push(intToIp(calcResult.firstUsableInt + i));
    }
    copyText(list.join('\n'));
  };

  // 全量檔案導出 (分塊 Chunk 處理，避免 UI 卡死)
  const exportFile = (type: 'txt' | 'csv') => {
    if (!calcResult) return;

    const { usableCount, firstUsableInt, inputIp: safeIp, cidr } = calcResult;
    showToast(`正在產生 ${usableCount.toLocaleString()} 筆可用 IP 匯出檔...`);

    const chunks: string[] = [];
    const chunkSize = 20000;
    if (type === 'csv') {
      chunks.push('\uFEFFIndex,IP Address\n'); // UTF-8 BOM
    }

    let renderedCount = 0;

    const processChunk = () => {
      const end = Math.min(renderedCount + chunkSize, usableCount);
      const lines: string[] = [];

      for (let i = renderedCount; i < end; i++) {
        const ipStr = intToIp(firstUsableInt + i);
        if (type === 'csv') {
          lines.push(`${i + 1},${ipStr}`);
        } else {
          lines.push(ipStr);
        }
      }

      chunks.push(lines.join('\n') + '\n');
      renderedCount = end;

      if (renderedCount < usableCount) {
        setTimeout(processChunk, 0); // 讓出主執行緒
      } else {
        const mimeType = type === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;';
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeFilename = safeIp.replace(/[^a-zA-Z0-9.]/g, '_');
        a.download = `ip_subnet_${safeFilename}_slash${cidr}.${type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(`全量 ${usableCount.toLocaleString()} 筆 IP 已成功匯出 .${type} 檔案！`);
      }
    };

    setTimeout(processChunk, 10);
  };

  // 分頁頁數計算
  const totalItems = filteredUsableIps.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (validCurrentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const pageData = filteredUsableIps.slice(startIdx, endIdx);

  return (
    <ToolLayout
      title="IP 子網段與可用 IP 計算器"
      subtitle="IPV4 & CIDR SUBNET CALCULATOR"
      description="專業免費的線上 IP 子網段與可用 IP 計算器！支援 CIDR 標記與標準點分十進制切換，精確計算網路位址、廣播位址、子網遮罩、可用 IP 範圍與百萬級 TXT/CSV 導出。"
      accentColor="#00f0ff"
      accentGlow="rgba(0, 240, 255, 0.6)"
    >
      <div className="flex flex-col gap-8 text-left w-full px-4 max-sm:px-0">
        {/* 控制卡片：輸入網段參數 */}
        <div className="bg-black/20 border border-white/[.08] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg backdrop-blur-md">
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-white/[.06] pb-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#00f0ff]">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              輸入網段參數
            </h3>

            {/* 模式分頁 Tabs */}
            <div className="flex bg-black/40 p-1 rounded-xl border border-white/[.08]">
              <button
                type="button"
                onClick={() => setMode('cidr')}
                className={`px-4 py-1.5 text-xs rounded-lg cursor-pointer transition-all font-medium ${
                  mode === 'cidr'
                    ? 'bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                CIDR 標記法
              </button>
              <button
                type="button"
                onClick={() => setMode('std')}
                className={`px-4 py-1.5 text-xs rounded-lg cursor-pointer transition-all font-medium ${
                  mode === 'std'
                    ? 'bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-[#00f0ff] shadow-[0_0_10px_rgba(0,240,255,0.2)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                標準 IP + 遮罩
              </button>
            </div>
          </div>

          {/* CIDR 模式輸入 */}
          {mode === 'cidr' ? (
            <div className="flex flex-col gap-2">
              <label htmlFor={inputCidrId} className="text-sm font-medium text-slate-300">
                IP 位址 / CIDR 前綴 (例如: 192.168.1.50/24)
              </label>
              <div className="bg-black/20 border border-white/15 rounded-xl px-4 py-3 flex items-center focus-within:border-[#00f0ff]/40 transition-colors">
                <input
                  id={inputCidrId}
                  type="text"
                  value={inputCidr}
                  onChange={(e) => setInputCidr(e.target.value)}
                  placeholder="192.168.1.50/24"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full bg-transparent border-none outline-none text-white text-base font-mono font-medium placeholder-white/30"
                />
              </div>
            </div>
          ) : (
            /* 標準模式輸入 */
            <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
              <div className="flex flex-col gap-2">
                <label htmlFor={inputIpId} className="text-sm font-medium text-slate-300">
                  IP 位址 (例如: 192.168.1.50)
                </label>
                <div className="bg-black/20 border border-white/15 rounded-xl px-4 py-3 flex items-center focus-within:border-[#00f0ff]/40 transition-colors">
                  <input
                    id={inputIpId}
                    type="text"
                    value={inputIp}
                    onChange={(e) => setInputIp(e.target.value)}
                    placeholder="192.168.1.50"
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full bg-transparent border-none outline-none text-white text-base font-mono font-medium placeholder-white/30"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={selectMaskId} className="text-sm font-medium text-slate-300">
                  子網遮罩 Subnet Mask
                </label>
                <select
                  id={selectMaskId}
                  value={selectMask}
                  onChange={(e) => setSelectMask(parseInt(e.target.value, 10))}
                  className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-4 py-3 outline-none focus:border-[#00f0ff]/40 text-sm font-mono font-medium cursor-pointer"
                >
                  {Array.from({ length: 33 }).map((_, idx) => {
                    const c = 32 - idx;
                    const maskInt = cidrToMaskInt(c);
                    const maskIp = intToIp(maskInt);
                    const total = Math.pow(2, 32 - c);
                    return (
                      <option key={c} value={c}>
                        /{c} ({maskIp}) — {total.toLocaleString()} IPs
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

          {/* 錯誤警告訊息 */}
          {errMessage && (
            <div className="text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 px-3.5 py-2 rounded-xl">
              {errMessage}
            </div>
          )}

          {/* 按鈕組 */}
          <div className="flex gap-3 flex-wrap pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-200 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-slate-400 transition-all cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
              清空重填
            </button>
            <button
              type="button"
              onClick={loadExample}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-[#00f0ff] bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-xl hover:bg-[#00f0ff]/20 hover:shadow-[0_0_10px_rgba(0,240,255,0.2)] transition-all cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
              </svg>
              載入範例 (/24)
            </button>
          </div>
        </div>

        {/* 網段摘要結果 Summary Section */}
        {calcResult && (
          <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-6 shadow-lg backdrop-blur-md">
            <h3 className="text-[#00f0ff] text-xs uppercase tracking-[1px] font-semibold border-b border-white/[.06] pb-3">
              計算摘要 Summary ({calcResult.inputIp}/{calcResult.cidr})
            </h3>

            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1 font-mono text-xs">
              <div className="bg-black/40 border border-white/[.05] p-4 rounded-xl flex flex-col gap-1">
                <span className="text-slate-400 text-xs">網路位址 (Network IP)</span>
                <span className="text-base text-[#00f0ff] font-bold">{calcResult.networkAddress}</span>
              </div>

              <div className="bg-black/40 border border-white/[.05] p-4 rounded-xl flex flex-col gap-1">
                <span className="text-slate-400 text-xs">廣播位址 (Broadcast IP)</span>
                <span className="text-base text-[#00f0ff] font-bold">{calcResult.broadcastAddress}</span>
              </div>

              <div className="bg-black/40 border border-white/[.05] p-4 rounded-xl flex flex-col gap-1">
                <span className="text-slate-400 text-xs">子網遮罩 (Subnet Mask)</span>
                <span className="text-base text-white font-bold">{calcResult.subnetMask}</span>
              </div>

              <div className="bg-black/40 border border-white/[.05] p-4 rounded-xl flex flex-col gap-1">
                <span className="text-slate-400 text-xs">通配符遮罩 (Wildcard Mask)</span>
                <span className="text-base text-slate-300 font-bold">{calcResult.wildcardMask}</span>
              </div>

              <div className="bg-black/40 border border-white/[.05] p-4 rounded-xl flex flex-col gap-1">
                <span className="text-slate-400 text-xs">CIDR 標記法</span>
                <span className="text-base text-white font-bold">/{calcResult.cidr}</span>
              </div>

              <div className="bg-black/40 border border-white/[.05] p-4 rounded-xl flex flex-col gap-1">
                <span className="text-slate-400 text-xs">IP 總數量 (Total IPs)</span>
                <span className="text-base text-white font-bold">{calcResult.totalIps.toLocaleString()}</span>
              </div>

              <div className="bg-black/40 border border-white/[.05] p-4 rounded-xl flex flex-col gap-1">
                <span className="text-slate-400 text-xs">可用 IP 總數 (Usable Hosts)</span>
                <span className="text-base text-[#00ff66] font-bold">{calcResult.usableCount.toLocaleString()} 個</span>
              </div>

              <div className="bg-black/40 border border-white/[.05] p-4 rounded-xl flex flex-col gap-1">
                <span className="text-slate-400 text-xs">IP 類別與屬性 (Class & Scope)</span>
                <div className="flex items-center gap-1 mt-1 text-sm font-bold text-white">
                  <span>{calcResult.scopeInfo.classStr}</span>
                  <span className={calcResult.scopeInfo.badgeClass}>{calcResult.scopeInfo.scope}</span>
                </div>
              </div>
            </div>

            {/* 可用 IP 範圍 */}
            <div className="bg-black/40 border border-white/[.05] p-4 rounded-xl flex justify-between items-center flex-wrap gap-2 font-mono text-xs">
              <span className="text-slate-400">可用 IP 範圍 (Usable IP Range)</span>
              <span className="text-white font-bold text-sm">
                {calcResult.cidr === 32
                  ? `${calcResult.firstUsableStr} (Single Host)`
                  : `${calcResult.firstUsableStr} ~ ${calcResult.lastUsableStr}`}
              </span>
            </div>

            {/* 二進制表示 */}
            <div className="bg-black/40 border border-white/[.05] p-4 rounded-xl flex flex-col gap-2">
              <span className="text-xs text-slate-400">IP 二進制 (Binary Representation)</span>
              <code className={styles.binaryCode}>{calcResult.binaryIp}</code>
            </div>
          </div>
        )}

        {/* 可用 IP 列表區段 */}
        {calcResult && (
          <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-5 shadow-lg backdrop-blur-md">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h3 className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-slate-400">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                </svg>
                可用 IP 位址列表
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={copyAllUsableIps}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                  複製全量
                </button>
                <button
                  type="button"
                  onClick={() => exportFile('txt')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  匯出 TXT
                </button>
                <button
                  type="button"
                  onClick={() => exportFile('csv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  匯出 CSV
                </button>
              </div>
            </div>

            {/* 搜尋與過濾 */}
            <div className="w-full">
              <div className="bg-black/40 border border-white/[.08] rounded-xl px-4 py-2.5 flex items-center gap-2 focus-within:border-[#00f0ff]/40 transition-colors">
                <label htmlFor={filterInputId}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-slate-400">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                </label>
                <input
                  id={filterInputId}
                  type="text"
                  value={filterKeyword}
                  onChange={(e) => {
                    setFilterKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder="過濾 IP 位址 (例如 .100)..."
                  className="w-full bg-transparent border-none outline-none text-white text-xs font-mono font-medium placeholder-white/30"
                />
              </div>
            </div>

            {/* 大網段優化提示 */}
            {calcResult.usableCount > 1000 && (
              <div className="flex gap-2.5 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-xl p-3.5 text-xs text-[#00f0ff] items-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                  <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
                <span>
                  目前網段包含 {calcResult.usableCount.toLocaleString()} 個可用 IP。畫面上預設呈現前 1,000 筆分頁；完整數據可點擊右上角「匯出 TXT / CSV」極速線上下載。
                </span>
              </div>
            )}

            {/* 表格容器 */}
            <div className={styles.tableContainer}>
              <table className={styles.ipTable}>
                <thead>
                  <tr>
                    <th className={styles.indexCol}>編號 #</th>
                    <th>IP 位址</th>
                    <th className={styles.actionCol}>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-slate-400 text-xs">
                        查無符合關鍵字 &quot;{filterKeyword}&quot; 的可用 IP
                      </td>
                    </tr>
                  ) : (
                    pageData.map((item) => (
                      <tr key={item.index}>
                        <td className={styles.indexCol}>#{item.index.toLocaleString()}</td>
                        <td className="font-medium text-white">{item.ipStr}</td>
                        <td className={styles.actionCol}>
                          <button
                            type="button"
                            onClick={() => copyText(item.ipStr)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[0.75rem] font-medium text-slate-300 bg-white/[0.03] border border-white/[0.08] rounded-lg hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all cursor-pointer"
                          >
                            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                            </svg>
                            複製
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分頁控制條 */}
            <div className="flex justify-between items-center flex-wrap gap-4 text-xs text-slate-400 border-t border-white/[.05] pt-3">
              <div>
                顯示第 {(startIdx + 1).toLocaleString()} - {endIdx.toLocaleString()} 筆 / 共 {totalItems.toLocaleString()} 筆
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/[0.03] border border-white/[0.08] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:not-disabled:border-[#00f0ff] hover:not-disabled:text-[#00f0ff] transition-all cursor-pointer"
                >
                  上一頁
                </button>
                <span className="font-mono text-slate-200">
                  {validCurrentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-white/[0.03] border border-white/[0.08] rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:not-disabled:border-[#00f0ff] hover:not-disabled:text-[#00f0ff] transition-all cursor-pointer"
                >
                  下一頁
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm font-medium rounded-xl bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] backdrop-blur-md shadow-lg z-50">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

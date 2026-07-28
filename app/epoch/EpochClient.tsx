'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import styles from './epoch.module.css';

// === 時區與時間運算 Engine ===

interface HistoryItem {
  id: number;
  recordTime: string;
  type: 'ts2date' | 'date2ts';
  typeLabel: string;
  inputRaw: string;
  taipeiTime: string;
  utcTime: string;
  laTime: string;
  loadData: {
    tsInput?: string;
    unit?: 'auto' | 's' | 'ms';
    dtInput?: string;
    dtMs?: string;
    dtTz?: string;
  };
}

// 格式化時間輔助函數 YYYY-MM-DD HH:mm:ss.SSS
function formatInTimezone(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const p: Record<string, string> = {};
    parts.forEach((part) => (p[part.type] = part.value));

    const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}.${ms}`;
  } catch {
    return '無效的時區';
  }
}

// 取得時區縮寫，如 PDT / PST
function getTimezoneAbbreviation(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch {
    return '';
  }
}

// 取得 GMT 偏移量字串，如 GMT-07:00
function getGmtOffsetString(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch {
    return '';
  }
}

// 根據指定 UTC 數值偏移格式化 YYYY-MM-DD HH:mm:ss.SSS
function formatInOffset(date: Date, offsetHours: number): string {
  try {
    const offsetMs = offsetHours * 60 * 60 * 1000;
    const targetDate = new Date(date.getTime() + offsetMs);

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Etc/UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(targetDate);
    const p: Record<string, string> = {};
    parts.forEach((part) => (p[part.type] = part.value));

    const ms = String(targetDate.getUTCMilliseconds()).padStart(3, '0');
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}.${ms}`;
  } catch {
    return '無效的偏移時間';
  }
}

// 日期轉時間戳記：根據 UTC 數值偏移反算
function convertDateTimeToTimestampByOffset(
  dateTimeStr: string,
  msVal: number | string,
  offsetHours: number
): number | null {
  if (!dateTimeStr) return null;

  const cleanStr = dateTimeStr.replace('T', ' ').replace('/', '-');
  const regex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/;
  const match = cleanStr.match(regex);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = match[6] ? parseInt(match[6], 10) : 0;
  const ms = typeof msVal === 'number' ? msVal : parseInt(msVal, 10) || 0;

  const baseUtcMs = Date.UTC(year, month, day, hour, minute, second, ms);
  const offsetMs = offsetHours * 60 * 60 * 1000;
  return baseUtcMs - offsetMs;
}

export default function EpochClient() {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // 當前即時看板
  const [liveNow, setLiveNow] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // 1. Timestamp ➜ 日期
  const [tsInput, setTsInput] = useState<string>('');
  const [unitMode, setUnitMode] = useState<'auto' | 's' | 'ms'>('auto');
  const [customTzOffset, setCustomTzOffset] = useState<number>(8);

  // 2. 日期 ➜ Timestamp
  const [dtInput, setDtInput] = useState<string>('');
  const [dtMsInput, setDtMsInput] = useState<string>('0');
  const [dtTzOffset, setDtTzOffset] = useState<number>(8);

  // 歷史紀錄 (LocalStorage 持久化)
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [toast, setToast] = useState<string>('');

  // 唯一 HTML ID
  const tsInputId = useId();
  const tsUnitId = useId();
  const selectCustomTzId = useId();
  const dtInputId = useId();
  const dtMsInputId = useId();
  const dtTzId = useId();

  // 初始化極客綠主題
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00ff99');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 255, 153, 0.6)');
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // 初始化與防呆
  useEffect(() => {
    setIsMounted(true);
    const now = new Date();
    setLiveNow(now);

    // 預設 Timestamp 輸入框
    setTsInput(Math.floor(now.getTime() / 1000).toString());

    // 預設 Date 輸入框
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    setDtInput(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`);
    setDtMsInput(now.getMilliseconds().toString());

    // 自動測算本地時區偏移量
    const localOffset = -now.getTimezoneOffset() / 60;
    setDtTzOffset(localOffset);

    // 讀取 LocalStorage 歷史紀錄
    try {
      const saved = localStorage.getItem('epoch_conv_history');
      if (saved) {
        setHistory(JSON.parse(saved));
      }
    } catch {
      // 忽略解析錯誤
    }
  }, []);

  // 即時動態看板計時器 (20fps)
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setLiveNow(new Date());
    }, 50);
    return () => clearInterval(timer);
  }, [isPaused]);

  // A. 時間戳記 ➜ 日期時間算結果 (Memo 化)
  const tsToDateResult = useCallback(() => {
    const raw = tsInput.trim();
    if (!raw) return null;

    const clean = raw.replace(/\D/g, '');
    if (!clean) return null;

    const tsNum = parseInt(clean, 10);
    let unit = unitMode;
    if (unit === 'auto') {
      unit = clean.length >= 12 ? 'ms' : 's';
    }

    const dateObj = new Date(unit === 's' ? tsNum * 1000 : tsNum);
    if (isNaN(dateObj.getTime())) return null;

    const taipeiStr = formatInTimezone(dateObj, 'Asia/Taipei');
    const utcStr = formatInTimezone(dateObj, 'Etc/UTC');
    const laStr = formatInTimezone(dateObj, 'America/Los_Angeles');
    const laAbbr = getTimezoneAbbreviation(dateObj, 'America/Los_Angeles');
    const laOffset = getGmtOffsetString(dateObj, 'America/Los_Angeles');
    const customStr = formatInOffset(dateObj, customTzOffset);

    // 元數據分析
    const weekDays = [
      '星期日 (Sunday)',
      '星期一 (Monday)',
      '星期二 (Tuesday)',
      '星期三 (Wednesday)',
      '星期四 (Thursday)',
      '星期五 (Friday)',
      '星期六 (Saturday)',
    ];
    const weekStr = weekDays[dateObj.getDay()];

    const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((dateObj.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const year = dateObj.getFullYear();
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

    return {
      cleanTs: clean,
      unit,
      dateObj,
      taipeiStr,
      utcStr,
      laStr,
      laBadge: `${laAbbr} (${laOffset})`,
      customStr,
      weekStr,
      dayOfYear,
      year,
      isLeap,
    };
  }, [tsInput, unitMode, customTzOffset]);

  const parsedTsResult = tsToDateResult();

  // B. 日期時間 ➜ 時間戳記計算結果 (Memo 化)
  const dateToTsResult = useCallback(() => {
    if (!dtInput) return null;
    const msEpoch = convertDateTimeToTimestampByOffset(dtInput, dtMsInput, dtTzOffset);
    if (msEpoch === null || isNaN(msEpoch)) return null;

    const secEpoch = Math.floor(msEpoch / 1000);
    const dateObj = new Date(msEpoch);

    return {
      secEpoch,
      msEpoch,
      dateObj,
      taipeiStr: formatInTimezone(dateObj, 'Asia/Taipei'),
      utcStr: formatInTimezone(dateObj, 'Etc/UTC'),
      laStr:
        formatInTimezone(dateObj, 'America/Los_Angeles') +
        ` (${getTimezoneAbbreviation(dateObj, 'America/Los_Angeles')})`,
    };
  }, [dtInput, dtMsInput, dtTzOffset]);

  const parsedDateResult = dateToTsResult();

  // 儲存至歷史紀錄
  const saveToHistory = (type: 'ts2date' | 'date2ts', valToCopy: string) => {
    const now = new Date();
    const recordTime =
      now.toLocaleTimeString('zh-TW', { hour12: false }) +
      `.${String(now.getMilliseconds()).padStart(3, '0')}`;

    let item: HistoryItem | null = null;

    if (type === 'ts2date' && parsedTsResult) {
      item = {
        id: Date.now(),
        recordTime,
        type: 'ts2date',
        typeLabel: '🔢 Epoch ➜ 日期',
        inputRaw: `${parsedTsResult.cleanTs} (${parsedTsResult.unit})`,
        taipeiTime: parsedTsResult.taipeiStr,
        utcTime: parsedTsResult.utcStr,
        laTime: `${parsedTsResult.laStr} (${parsedTsResult.laBadge})`,
        loadData: {
          tsInput: parsedTsResult.cleanTs,
          unit: unitMode,
        },
      };
    } else if (type === 'date2ts' && parsedDateResult) {
      const sign = dtTzOffset >= 0 ? '+' : '';
      item = {
        id: Date.now(),
        recordTime,
        type: 'date2ts',
        typeLabel: '📅 日期 ➜ Epoch',
        inputRaw: `${dtInput.replace('T', ' ')}.${dtMsInput} (UTC ${sign}${dtTzOffset})`,
        taipeiTime: parsedDateResult.taipeiStr,
        utcTime: parsedDateResult.utcStr,
        laTime: parsedDateResult.laStr,
        loadData: {
          dtInput,
          dtMs: dtMsInput,
          dtTz: dtTzOffset.toString(),
        },
      };
    }

    if (!item) return;

    setHistory((prev) => {
      // 防重複
      const filtered = prev.filter((h) => h.inputRaw !== item?.inputRaw);
      const updated = [item, ...filtered].slice(0, 15);
      try {
        localStorage.setItem('epoch_conv_history', JSON.stringify(updated));
      } catch {
        // 忽略寫入失敗
      }
      return updated;
    });

    showToast(`已複製: ${valToCopy}`);
  };

  // 複製並儲存歷史
  const copyAndRecord = (text: string, type: 'ts2date' | 'date2ts') => {
    if (!text || text === '-' || text.includes('無效')) return;
    navigator.clipboard.writeText(text).then(() => {
      saveToHistory(type, text);
    });
  };

  // 單純複製
  const copyText = (txt: string) => {
    if (!txt || txt === '-') return;
    navigator.clipboard.writeText(txt).then(() => showToast(`已複製: ${txt}`));
  };

  // 刪除與載入歷史
  const deleteHistoryItem = (id: number) => {
    setHistory((prev) => {
      const updated = prev.filter((h) => h.id !== id);
      try {
        localStorage.setItem('epoch_conv_history', JSON.stringify(updated));
      } catch {
        // 忽略
      }
      return updated;
    });
    showToast('已刪除歷史紀錄');
  };

  const clearHistory = () => {
    if (confirm('確定要清除所有歷史紀錄嗎？')) {
      setHistory([]);
      try {
        localStorage.removeItem('epoch_conv_history');
      } catch {
        // 忽略
      }
      showToast('已清除歷史紀錄');
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    if (item.type === 'ts2date' && item.loadData.tsInput) {
      setTsInput(item.loadData.tsInput);
      if (item.loadData.unit) setUnitMode(item.loadData.unit);
      showToast(`已載入時間戳記: ${item.loadData.tsInput}`);
    } else if (item.type === 'date2ts' && item.loadData.dtInput) {
      setDtInput(item.loadData.dtInput);
      if (item.loadData.dtMs) setDtMsInput(item.loadData.dtMs);
      if (item.loadData.dtTz) setDtTzOffset(parseFloat(item.loadData.dtTz));
      showToast(`已載入日期時間: ${item.loadData.dtInput}`);
    }
  };

  // 快捷按鈕：帶入現在時間
  const fillTsNow = () => {
    const now = new Date();
    const ts = unitMode === 'ms' ? now.getTime() : Math.floor(now.getTime() / 1000);
    setTsInput(ts.toString());
    showToast('已帶入現在時間戳記');
  };

  const fillDtNow = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    setDtInput(`${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`);
    setDtMsInput(now.getMilliseconds().toString());
    showToast('已帶入現在日期時間');
  };

  const liveSec = liveNow ? Math.floor(liveNow.getTime() / 1000) : 0;
  const liveMs = liveNow ? liveNow.getTime() : 0;
  const liveDateStr = isMounted && liveNow ? formatInTimezone(liveNow, 'Asia/Taipei') : 'YYYY-MM-DD HH:mm:ss.SSS';

  return (
    <ToolLayout
      title="EPOCH 時間戳記轉換器"
      subtitle="UNIX TIMESTAMP CONVERTER"
      description="專業免費的線上 Unix Epoch 時間戳記轉換工具！支援秒/毫秒自動判定、即時雙向轉換、台北時間/UTC/美西時間(PST)等多時區比較與歷史紀錄。"
      accentColor="#00ff99"
      accentGlow="rgba(0, 255, 153, 0.6)"
    >
      <div className="flex flex-col gap-8 text-left w-full px-4 max-sm:px-0">
        {/* 當前時間動態看板 */}
        <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg backdrop-blur-md">
          <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-1">
            <div className="flex flex-col gap-1.5 bg-black/40 border border-white/[.05] p-4 rounded-xl">
              <span className="text-xs font-semibold text-text-sub">當前 UNIX TIMESTAMP (秒)</span>
              <div className="flex items-center justify-between gap-2">
                <span className={`font-mono ${styles.liveClock}`}>{isMounted ? liveSec : '-'}</span>
                <button
                  type="button"
                  onClick={() => copyText(liveSec.toString())}
                  className="px-2.5 py-1 text-xs font-medium text-[#00ff99] bg-[#00ff99]/10 border border-[#00ff99]/30 rounded-lg hover:bg-[#00ff99]/20 transition-all cursor-pointer shrink-0"
                >
                  複製
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 bg-black/40 border border-white/[.05] p-4 rounded-xl">
              <span className="text-xs font-semibold text-text-sub">當前時間戳記 (毫秒)</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xl font-bold text-[#00ff99] tracking-tight">
                  {isMounted ? liveMs : '-'}
                </span>
                <button
                  type="button"
                  onClick={() => copyText(liveMs.toString())}
                  className="px-2.5 py-1 text-xs font-medium text-[#00ff99] bg-[#00ff99]/10 border border-[#00ff99]/30 rounded-lg hover:bg-[#00ff99]/20 transition-all cursor-pointer shrink-0"
                >
                  複製
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-1.5 bg-black/40 border border-white/[.05] p-4 rounded-xl">
              <span className="text-xs font-semibold text-text-sub">當前台北時間 (Asia/Taipei)</span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-sm font-bold text-white tracking-tight">{liveDateStr}</span>
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className={`px-3 py-1 text-sm font-medium border rounded-lg transition-all cursor-pointer shrink-0 ${
                    isPaused
                      ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/30'
                      : 'bg-white/[0.04] border-white/[0.08] text-text-sub hover:text-white'
                  }`}
                >
                  {isPaused ? '▶ 播放看板' : '⏸ 暫停看板'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 雙向轉換區 */}
        <div className="grid grid-cols-2 gap-8 max-lg:grid-cols-1">
          {/* 1. 時間戳 轉 日期 */}
          <div className="bg-black/20 border border-white/[.08] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg backdrop-blur-md">
            <h3 className="text-[#00ff99] text-xs uppercase tracking-[1px] font-semibold border-b border-white/[.06] pb-3 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
              </svg>
              時間戳記 ➜ 日期時間 (Timestamp ➜ Date)
            </h3>

            <div className="flex flex-col gap-2">
              <label htmlFor={tsInputId} className="text-sm font-medium text-text-sub">
                Unix 時間戳記 (Epoch)
              </label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <div className="bg-black/20 border border-white/15 rounded-xl px-4 py-3 flex items-center focus-within:border-[#00ff99]/40 transition-colors">
                  <input
                    id={tsInputId}
                    type="text"
                    value={tsInput}
                    onChange={(e) => setTsInput(e.target.value)}
                    placeholder="請輸入 10 位 (秒) 或 13 位 (毫秒) 數字"
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full bg-transparent border-none outline-none text-white text-base font-mono font-medium placeholder-white/30"
                  />
                </div>
                <select
                  id={tsUnitId}
                  value={unitMode}
                  onChange={(e) => setUnitMode(e.target.value as 'auto' | 's' | 'ms')}
                  className="bg-select-bg text-text-main border border-border-glass rounded-xl px-3 py-3 outline-none focus:border-[#00ff99]/40 text-xs font-mono font-medium cursor-pointer"
                >
                  <option value="auto">智能判定</option>
                  <option value="s">秒 (10位)</option>
                  <option value="ms">毫秒 (13位)</option>
                </select>
              </div>
            </div>

            {/* 按鈕組 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={fillTsNow}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#00ff99] bg-[#00ff99]/10 border border-[#00ff99]/30 rounded-xl hover:bg-[#00ff99]/20 transition-all cursor-pointer"
              >
                帶入現在時間
              </button>
              <button
                type="button"
                onClick={() => setTsInput('')}
                className="px-4 py-2.5 text-sm font-medium text-text-sub bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-slate-400 transition-all cursor-pointer"
              >
                清除
              </button>
            </div>

            {/* 轉換多時區結果 */}
            <div className="flex flex-col gap-3 font-mono text-xs border-t border-white/[.06] pt-5">
              <div className="flex justify-between items-center bg-black/40 p-3.5 rounded-xl border border-white/[.05]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-text-sub text-[0.75rem]">台北時間 (Asia/Taipei)</span>
                  <span className="text-white font-bold text-sm">
                    {parsedTsResult ? parsedTsResult.taipeiStr : '-'}
                  </span>
                </div>
                {parsedTsResult && (
                  <button
                    type="button"
                    onClick={() => copyAndRecord(parsedTsResult.taipeiStr, 'ts2date')}
                    className="px-2.5 py-1 text-[0.75rem] font-medium text-text-sub bg-white/[0.04] border border-white/[0.08] rounded-lg hover:border-[#00ff99] hover:text-[#00ff99] transition-all cursor-pointer"
                  >
                    複製
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center bg-black/40 p-3.5 rounded-xl border border-white/[.05]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-text-sub text-[0.75rem]">世界標準時間 (UTC)</span>
                  <span className="text-[#00ff99] font-bold text-sm">
                    {parsedTsResult ? parsedTsResult.utcStr : '-'}
                  </span>
                </div>
                {parsedTsResult && (
                  <button
                    type="button"
                    onClick={() => copyAndRecord(parsedTsResult.utcStr, 'ts2date')}
                    className="px-2.5 py-1 text-[0.75rem] font-medium text-text-sub bg-white/[0.04] border border-white/[0.08] rounded-lg hover:border-[#00ff99] hover:text-[#00ff99] transition-all cursor-pointer"
                  >
                    複製
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center bg-black/40 p-3.5 rounded-xl border border-white/[.05]">
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-text-sub text-[0.75rem]">美西時間 (Los Angeles)</span>
                    {parsedTsResult && (
                      <span className="text-[0.65rem] px-1.5 py-0.5 rounded bg-[#00ff99]/10 text-[#00ff99] border border-[#00ff99]/20 font-sans font-semibold">
                        {parsedTsResult.laBadge}
                      </span>
                    )}
                  </div>
                  <span className="text-slate-200 font-bold text-sm">
                    {parsedTsResult ? parsedTsResult.laStr : '-'}
                  </span>
                </div>
                {parsedTsResult && (
                  <button
                    type="button"
                    onClick={() => copyAndRecord(parsedTsResult.laStr, 'ts2date')}
                    className="px-2.5 py-1 text-[0.75rem] font-medium text-text-sub bg-white/[0.04] border border-white/[0.08] rounded-lg hover:border-[#00ff99] hover:text-[#00ff99] transition-all cursor-pointer"
                  >
                    複製
                  </button>
                )}
              </div>

              {/* 自訂選單時區 */}
              <div className="flex justify-between items-center bg-black/40 p-3.5 rounded-xl border border-white/[.05]">
                <div className="flex flex-col gap-1 w-full mr-2">
                  <label htmlFor={selectCustomTzId} className="sr-only">
                    選擇自訂時區
                  </label>
                  <select
                    id={selectCustomTzId}
                    value={customTzOffset}
                    onChange={(e) => setCustomTzOffset(parseFloat(e.target.value))}
                    className="bg-select-bg text-text-main border border-border-glass rounded-lg px-2 py-1 outline-none text-xs font-mono cursor-pointer max-w-[220px]"
                  >
                    <option value="-12">UTC -12:00</option>
                    <option value="-11">UTC -11:00</option>
                    <option value="-10">UTC -10:00</option>
                    <option value="-9">UTC -09:00</option>
                    <option value="-8">UTC -08:00 (PST)</option>
                    <option value="-7">UTC -07:00 (PDT)</option>
                    <option value="-6">UTC -06:00</option>
                    <option value="-5">UTC -05:00 (EST)</option>
                    <option value="-4">UTC -04:00 (EDT)</option>
                    <option value="-3">UTC -03:00</option>
                    <option value="-2">UTC -02:00</option>
                    <option value="-1">UTC -01:00</option>
                    <option value="0">UTC +00:00 (GMT/UTC)</option>
                    <option value="1">UTC +01:00 (CET)</option>
                    <option value="2">UTC +02:00 (EET)</option>
                    <option value="3">UTC +03:00</option>
                    <option value="3.5">UTC +03:30</option>
                    <option value="4">UTC +04:00</option>
                    <option value="4.5">UTC +04:30</option>
                    <option value="5">UTC +05:00</option>
                    <option value="5.5">UTC +05:30 (IST)</option>
                    <option value="5.75">UTC +05:45</option>
                    <option value="6">UTC +06:00</option>
                    <option value="6.5">UTC +06:30</option>
                    <option value="7">UTC +07:00</option>
                    <option value="8">UTC +08:00 (台北/北京)</option>
                    <option value="9">UTC +09:00 (東京/首爾)</option>
                    <option value="9.5">UTC +09:30</option>
                    <option value="10">UTC +10:00 (AEST)</option>
                    <option value="10.5">UTC +10:30</option>
                    <option value="11">UTC +11:00 (AEDT)</option>
                    <option value="11.5">UTC +11.5</option>
                    <option value="12">UTC +12:00</option>
                    <option value="13">UTC +13:00</option>
                    <option value="14">UTC +14:00</option>
                  </select>
                  <span className="text-white font-bold text-sm">
                    {parsedTsResult ? parsedTsResult.customStr : '-'}
                  </span>
                </div>
                {parsedTsResult && (
                  <button
                    type="button"
                    onClick={() => copyAndRecord(parsedTsResult.customStr, 'ts2date')}
                    className="px-2.5 py-1 text-[0.75rem] font-medium text-text-sub bg-white/[0.04] border border-white/[0.08] rounded-lg hover:border-[#00ff99] hover:text-[#00ff99] transition-all cursor-pointer shrink-0"
                  >
                    複製
                  </button>
                )}
              </div>
            </div>

            {/* 時間元數據 Panel */}
            {parsedTsResult && (
              <div className="bg-black/40 border border-white/[.05] p-4 rounded-xl flex flex-wrap justify-between gap-3 text-xs text-text-sub font-mono">
                <div>
                  星期: <strong className="text-[#00ff99] font-bold">{parsedTsResult.weekStr}</strong>
                </div>
                <div>
                  當年第: <strong className="text-[#00ff99] font-bold">{parsedTsResult.dayOfYear}</strong> 天
                </div>
                <div>
                  年份判定:{' '}
                  <strong className="text-[#00ff99] font-bold">
                    {parsedTsResult.year} 年為 {parsedTsResult.isLeap ? '閏年' : '平年'}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* 2. 日期 轉 時間戳 */}
          <div className="bg-black/20 border border-white/[.08] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg backdrop-blur-md">
            <h3 className="text-[#00ff99] text-xs uppercase tracking-[1px] font-semibold border-b border-white/[.06] pb-3 flex items-center gap-2">
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm1 16H11v-6h2v6zm0-8H11V8h2v2z" />
              </svg>
              日期時間 ➜ 時間戳記 (Date ➜ Timestamp)
            </h3>

            <div className="grid grid-cols-[1fr_auto] gap-3">
              <div className="flex flex-col gap-2">
                <label htmlFor={dtInputId} className="text-sm font-medium text-text-sub">
                  選擇日期與時間
                </label>
                <div className="bg-black/20 border border-white/15 rounded-xl px-4 py-3 flex items-center focus-within:border-[#00ff99]/40 transition-colors">
                  <input
                    id={dtInputId}
                    type="datetime-local"
                    step="1"
                    value={dtInput}
                    onChange={(e) => setDtInput(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-white text-base font-mono font-medium [color-scheme:dark]"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 w-[100px]">
                <label htmlFor={dtMsInputId} className="text-sm font-medium text-text-sub">
                  毫秒 (ms)
                </label>
                <div className="bg-black/20 border border-white/15 rounded-xl px-3 py-3 flex items-center focus-within:border-[#00ff99]/40 transition-colors">
                  <input
                    id={dtMsInputId}
                    type="number"
                    min={0}
                    max={999}
                    value={dtMsInput}
                    onChange={(e) => setDtMsInput(e.target.value)}
                    className="w-full bg-transparent border-none outline-none text-white text-base font-mono font-medium"
                  />
                </div>
              </div>
            </div>

            {/* 時區選擇器 */}
            <div className="flex flex-col gap-2">
              <label htmlFor={dtTzId} className="text-sm font-medium text-text-sub">
                此輸入時間所屬時區
              </label>
              <select
                id={dtTzId}
                value={dtTzOffset}
                onChange={(e) => setDtTzOffset(parseFloat(e.target.value))}
                className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-4 py-3 outline-none focus:border-[#00ff99]/40 text-sm font-mono font-medium cursor-pointer"
              >
                <option value="-12">🌐 UTC -12:00</option>
                <option value="-11">🌐 UTC -11:00</option>
                <option value="-10">🌐 UTC -10:00</option>
                <option value="-9">🌐 UTC -09:00</option>
                <option value="-8">🇺🇸 UTC -08:00 (PST)</option>
                <option value="-7">🇺🇸 UTC -07:00 (PDT)</option>
                <option value="-6">🌐 UTC -06:00</option>
                <option value="-5">🇺🇸 UTC -05:00 (EST)</option>
                <option value="-4">🇺🇸 UTC -04:00 (EDT)</option>
                <option value="-3">🌐 UTC -03:00</option>
                <option value="-2">🌐 UTC -02:00</option>
                <option value="-1">🌐 UTC -01:00</option>
                <option value="0">🌐 UTC +00:00 (GMT/UTC)</option>
                <option value="1">🇪🇺 UTC +01:00 (CET)</option>
                <option value="2">🇪🇺 UTC +02:00 (EET)</option>
                <option value="3">🌐 UTC +03:00</option>
                <option value="3.5">🌐 UTC +03:30</option>
                <option value="4">🌐 UTC +04:00</option>
                <option value="4.5">🌐 UTC +04:30</option>
                <option value="5">🌐 UTC +05:00</option>
                <option value="5.5">🇮🇳 UTC +05:30 (IST)</option>
                <option value="5.75">🇳🇵 UTC +05:45</option>
                <option value="6">🌐 UTC +06:00</option>
                <option value="6.5">🌐 UTC +06:30</option>
                <option value="7">🌐 UTC +07:00</option>
                <option value="8">🇹🇼 UTC +08:00 (台北/北京/新加坡)</option>
                <option value="9">🇯🇵 UTC +09:00 (東京/首爾)</option>
                <option value="9.5">🇦🇺 UTC +09:30</option>
                <option value="10">🇦🇺 UTC +10:00 (AEST)</option>
                <option value="10.5">🇦🇺 UTC +10:30</option>
                <option value="11">🇦🇺 UTC +11:00 (AEDT)</option>
                <option value="11.5">🌐 UTC +11.5</option>
                <option value="12">🌐 UTC +12:00</option>
                <option value="13">🌐 UTC +13:00</option>
                <option value="14">🌐 UTC +14:00</option>
              </select>
            </div>

            {/* 按鈕組 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={fillDtNow}
                className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium text-[#00ff99] bg-[#00ff99]/10 border border-[#00ff99]/30 rounded-xl hover:bg-[#00ff99]/20 transition-all cursor-pointer"
              >
                帶入現在時間
              </button>
              <button
                type="button"
                onClick={() => {
                  setDtInput('');
                  setDtMsInput('0');
                }}
                className="px-4 py-2.5 text-sm font-medium text-text-sub bg-white/[0.03] border border-white/[0.08] rounded-xl hover:border-slate-400 transition-all cursor-pointer"
              >
                清除
              </button>
            </div>

            {/* 轉換結果 */}
            <div className="flex flex-col gap-3 font-mono text-xs border-t border-white/[.06] pt-5">
              <div className="flex justify-between items-center bg-black/40 p-3.5 rounded-xl border border-white/[.05]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-text-sub text-[0.75rem]">Unix 時間戳記 (秒 - 10位)</span>
                  <span className="text-[#00ff99] font-bold text-base">
                    {parsedDateResult ? parsedDateResult.secEpoch : '-'}
                  </span>
                </div>
                {parsedDateResult && (
                  <button
                    type="button"
                    onClick={() => copyAndRecord(parsedDateResult.secEpoch.toString(), 'date2ts')}
                    className="px-2.5 py-1 text-[0.75rem] font-medium text-text-sub bg-white/[0.04] border border-white/[0.08] rounded-lg hover:border-[#00ff99] hover:text-[#00ff99] transition-all cursor-pointer"
                  >
                    複製
                  </button>
                )}
              </div>

              <div className="flex justify-between items-center bg-black/40 p-3.5 rounded-xl border border-white/[.05]">
                <div className="flex flex-col gap-0.5">
                  <span className="text-text-sub text-[0.75rem]">Unix 時間戳記 (毫秒 - 13位)</span>
                  <span className="text-white font-bold text-base">
                    {parsedDateResult ? parsedDateResult.msEpoch : '-'}
                  </span>
                </div>
                {parsedDateResult && (
                  <button
                    type="button"
                    onClick={() => copyAndRecord(parsedDateResult.msEpoch.toString(), 'date2ts')}
                    className="px-2.5 py-1 text-[0.75rem] font-medium text-text-sub bg-white/[0.04] border border-white/[0.08] rounded-lg hover:border-[#00ff99] hover:text-[#00ff99] transition-all cursor-pointer"
                  >
                    複製
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 歷史紀錄表格區 */}
        {history.length > 0 && (
          <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-5 shadow-lg backdrop-blur-md">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h3 className="text-sm font-semibold text-text-sub flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-text-sub">
                  <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                </svg>
                轉換歷史紀錄
              </h3>

              <button
                type="button"
                onClick={clearHistory}
                className="px-3 py-1 text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all cursor-pointer"
              >
                清除所有歷史
              </button>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th className={styles.stickyCol}>記錄時間</th>
                    <th>轉換類型</th>
                    <th>輸入原始值</th>
                    <th>台北時間 (GMT+8)</th>
                    <th>世界標準時間 (UTC)</th>
                    <th>美西時間 (LA)</th>
                    <th className="text-right">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.stickyCol}>{item.recordTime}</td>
                      <td className="text-text-sub font-sans">{item.typeLabel}</td>
                      <td className="font-mono text-text-main">{item.inputRaw}</td>
                      <td className="font-mono">{item.taipeiTime}</td>
                      <td className="font-mono text-[#00ff99]">{item.utcTime}</td>
                      <td className="font-mono text-text-sub">{item.laTime}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => loadHistoryItem(item)}
                            title="載入至輸入框"
                            className="px-2 py-1 text-[0.75rem] font-medium text-[#00ff99] bg-[#00ff99]/10 border border-[#00ff99]/30 rounded-lg hover:bg-[#00ff99]/20 transition-all cursor-pointer"
                          >
                            載入
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteHistoryItem(item.id)}
                            title="刪除紀錄"
                            className="px-2 py-1 text-[0.75rem] font-medium text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all cursor-pointer"
                          >
                            刪除
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm font-medium rounded-xl bg-[#00ff99]/20 border border-[#00ff99]/40 text-[#00ff99] backdrop-blur-md shadow-lg z-50">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

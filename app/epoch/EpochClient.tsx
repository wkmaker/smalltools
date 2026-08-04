'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import Link from 'next/link';
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

const TRANSLATIONS = {
  'zh-TW': {
    title: 'EPOCH 時間戳記轉換器',
    subtitle: 'UNIX TIMESTAMP CONVERTER',
    description: '專業免費的線上 Unix Epoch 時間戳記轉換工具！支援秒/毫秒自動判定、即時雙向轉換、當地時間/UTC/美西時間(PST)等多時區比較與歷史紀錄。',
    liveSecTitle: '當前 UNIX TIMESTAMP (秒)',
    liveMsTitle: '當前時間戳記 (毫秒)',
    liveLocalTitle: '當前當地時間',
    copy: '複製',
    resumeClock: '繼續',
    pauseClock: '暫停',
    sectionTsToDate: '時間戳記 ➜ 日期時間 (Timestamp ➜ Date)',
    labelTsInput: 'Unix 時間戳記 (Epoch)',
    placeholderTsInput: '請輸入 10 位 (秒) 或 13 位 (毫秒) 數字',
    unitAuto: '智能判定',
    unitSec: '秒 (10位)',
    unitMs: '毫秒 (13位)',
    btnFillNow: '帶入現在時間',
    btnClear: '清除',
    localTimeLabel: '當地時間',
    utcTimeLabel: '世界標準時間 (UTC)',
    laTimeLabel: '美西時間 (Los Angeles)',
    selectCustomTzLabel: '選擇自訂時區',
    dayOfWeekLabel: '星期',
    dayOfYearLabel: '當年第',
    dayUnit: '天',
    yearInfoLabel: '年份判定',
    leapYear: '閏年',
    commonYear: '平年',
    yearIs: '年為',
    sectionDateToTs: '日期時間 ➜ 時間戳記 (Date ➜ Timestamp)',
    labelDtInput: '選擇日期與時間',
    labelDtMsInput: '毫秒 (ms)',
    labelDtTz: '此輸入時間所屬時區',
    tsResultSec: 'Unix 時間戳記 (秒 - 10位)',
    tsResultMs: 'Unix 時間戳記 (毫秒 - 13位)',
    historyTitle: '轉換歷史紀錄',
    btnClearHistory: '清除所有歷史',
    thRecordTime: '記錄時間',
    thType: '轉換類型',
    thInputRaw: '輸入原始值',
    thLocal: '當地時間 (Local)',
    thUtc: '世界標準時間 (UTC)',
    thLa: '美西時間 (LA)',
    thAction: '操作',
    btnLoad: '載入',
    btnDelete: '刪除',
    toastCopied: '已複製:',
    toastDeletedHistory: '已刪除歷史紀錄',
    confirmClearHistory: '確定要清除所有歷史紀錄嗎？',
    toastClearedHistory: '已清除歷史紀錄',
    toastLoadedTs: '已載入時間戳記:',
    toastLoadedDt: '已載入日期時間:',
    toastFilledTsNow: '已帶入現在時間戳記',
    toastFilledDtNow: '已帶入現在日期時間',
    typeLabelTs2Date: 'Epoch ➜ 日期',
    typeLabelDate2Ts: '日期 ➜ Epoch',
    weekDays: [
      '星期日 (Sunday)',
      '星期一 (Monday)',
      '星期二 (Tuesday)',
      '星期三 (Wednesday)',
      '星期四 (Thursday)',
      '星期五 (Friday)',
      '星期六 (Saturday)',
    ],
    switchLangText: 'English',
    switchLangHref: '/epoch/en/',
  },
  en: {
    title: 'Epoch Timestamp Converter',
    subtitle: 'UNIX TIMESTAMP CONVERTER',
    description: 'Free online Unix Epoch timestamp converter tool! Auto second/millisecond detection, instant 2-way conversion, multi-timezone comparison (Local, UTC, PST), and conversion history.',
    liveSecTitle: 'Current Unix Timestamp (sec)',
    liveMsTitle: 'Current Timestamp (ms)',
    liveLocalTitle: 'Current Local Time',
    copy: 'Copy',
    resumeClock: 'Resume',
    pauseClock: 'Pause',
    sectionTsToDate: 'Timestamp ➜ Date',
    labelTsInput: 'Unix Timestamp (Epoch)',
    placeholderTsInput: 'Enter 10-digit (sec) or 13-digit (ms) number',
    unitAuto: 'Auto Detect',
    unitSec: 'Secs (10-digit)',
    unitMs: 'Mins (13-digit)',
    btnFillNow: 'Fill Current Time',
    btnClear: 'Clear',
    localTimeLabel: 'Local Time',
    utcTimeLabel: 'UTC Time (Etc/UTC)',
    laTimeLabel: 'LA Time (America/Los_Angeles)',
    selectCustomTzLabel: 'Select Custom Timezone',
    dayOfWeekLabel: 'Day of Week',
    dayOfYearLabel: 'Day of Year',
    dayUnit: '',
    yearInfoLabel: 'Year Type',
    leapYear: 'Leap Year',
    commonYear: 'Common Year',
    yearIs: 'is',
    sectionDateToTs: 'Date ➜ Timestamp',
    labelDtInput: 'Select Date & Time',
    labelDtMsInput: 'Milliseconds (ms)',
    labelDtTz: 'Input Timezone',
    tsResultSec: 'Unix Timestamp (sec - 10-digit)',
    tsResultMs: 'Unix Timestamp (ms - 13-digit)',
    historyTitle: 'Conversion History',
    btnClearHistory: 'Clear History',
    thRecordTime: 'Record Time',
    thType: 'Type',
    thInputRaw: 'Raw Input',
    thLocal: 'Local Time',
    thUtc: 'UTC Time',
    thLa: 'LA Time',
    thAction: 'Actions',
    btnLoad: 'Load',
    btnDelete: 'Delete',
    toastCopied: 'Copied:',
    toastDeletedHistory: 'History item deleted',
    confirmClearHistory: 'Are you sure you want to clear all conversion history?',
    toastClearedHistory: 'All history cleared',
    toastLoadedTs: 'Loaded timestamp:',
    toastLoadedDt: 'Loaded date:',
    toastFilledTsNow: 'Filled current timestamp',
    toastFilledDtNow: 'Filled current date & time',
    typeLabelTs2Date: 'Epoch ➜ Date',
    typeLabelDate2Ts: 'Date ➜ Epoch',
    weekDays: [
      'Sunday',
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
    ],
    switchLangText: '繁體中文',
    switchLangHref: '/epoch/',
  },
};

// 取得乾淨且人體工學的時區標籤（淨化 POSIX Etc/GMT-8 反向符號引發的混淆）
function getCleanTzLabel(date: Date = new Date()): { tzName: string; utcOffset: string; displayLabel: string } {
  try {
    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMin = Math.abs(offsetMinutes);
    const hours = Math.floor(absMin / 60);
    const mins = absMin % 60;
    const minsStr = mins > 0 ? `:${String(mins).padStart(2, '0')}` : '';
    const utcOffset = `UTC${sign}${hours}${minsStr}`;

    // 若 tzName 包含 Etc/ 或 GMT，屬 POSIX 符號會造成混淆 (如 Etc/GMT-8 = UTC+8)，淨化為只顯示 UTC 標籤
    if (!tzName || tzName.startsWith('Etc/') || tzName.includes('GMT')) {
      return { tzName: '', utcOffset, displayLabel: utcOffset };
    }

    return { tzName, utcOffset, displayLabel: `${tzName}, ${utcOffset}` };
  } catch {
    return { tzName: '', utcOffset: 'UTC+8', displayLabel: 'UTC+8' };
  }
}

// 格式化本機當地時間 (100% 精準對齊使用者裝置電腦時間)
function formatLocalTime(date: Date): string {
  try {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}.${ms}`;
  } catch {
    return 'Invalid Date';
  }
}

// 格式化時間輔助函數 YYYY-MM-DD HH:mm:ss.SSS (指定 IANA 時區)
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
    return 'Invalid Timezone';
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
    return 'Invalid Offset';
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

interface EpochClientProps {
  lang?: 'zh-TW' | 'en';
}

export default function EpochClient({ lang = 'zh-TW' }: EpochClientProps) {
  const t = TRANSLATIONS[lang];
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // 當前即時看板
  const [liveNow, setLiveNow] = useState<Date | null>(null);
  const [isPaused, setIsPaused] = useState<boolean>(false);

  // 本機時區 (自動偵測與淨化)
  const [userTz, setUserTz] = useState<string>('Asia/Taipei');
  const [displayTzLabel, setDisplayTzLabel] = useState<string>('UTC+8');

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

    // 自動測算本地時區偏移量與名稱
    const localOffset = -now.getTimezoneOffset() / 60;
    setDtTzOffset(localOffset);

    try {
      const tzInfo = getCleanTzLabel(now);
      setDisplayTzLabel(tzInfo.displayLabel);
      if (tzInfo.tzName) {
        setUserTz(tzInfo.tzName);
      }
    } catch {
      // 保留 fallback
    }

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

    const localStr = formatLocalTime(dateObj);
    const taipeiStr = formatInTimezone(dateObj, 'Asia/Taipei');
    const utcStr = formatInTimezone(dateObj, 'Etc/UTC');
    const laStr = formatInTimezone(dateObj, 'America/Los_Angeles');
    const laAbbr = getTimezoneAbbreviation(dateObj, 'America/Los_Angeles');
    const laOffset = getGmtOffsetString(dateObj, 'America/Los_Angeles');
    const customStr = formatInOffset(dateObj, customTzOffset);

    // 元數據分析
    const weekStr = t.weekDays[dateObj.getDay()];

    const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((dateObj.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    const year = dateObj.getFullYear();
    const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

    return {
      cleanTs: clean,
      unit,
      dateObj,
      localStr,
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
  }, [tsInput, unitMode, customTzOffset, t]);

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
      localStr: formatLocalTime(dateObj),
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
        typeLabel: t.typeLabelTs2Date,
        inputRaw: `${parsedTsResult.cleanTs} (${parsedTsResult.unit})`,
        taipeiTime: parsedTsResult.localStr,
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
        typeLabel: t.typeLabelDate2Ts,
        inputRaw: `${dtInput.replace('T', ' ')}.${dtMsInput} (UTC ${sign}${dtTzOffset})`,
        taipeiTime: parsedDateResult.localStr,
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
      const filtered = prev.filter((h) => h.inputRaw !== item?.inputRaw);
      const updated = [item, ...filtered].slice(0, 15);
      try {
        localStorage.setItem('epoch_conv_history', JSON.stringify(updated));
      } catch {
        // 忽略寫入失敗
      }
      return updated;
    });

    showToast(`${t.toastCopied} ${valToCopy}`);
  };

  // 複製並儲存歷史
  const copyAndRecord = (text: string, type: 'ts2date' | 'date2ts') => {
    if (!text || text === '-' || text.includes('Invalid')) return;
    navigator.clipboard.writeText(text).then(() => {
      saveToHistory(type, text);
    });
  };

  // 單純複製
  const copyText = (txt: string) => {
    if (!txt || txt === '-') return;
    navigator.clipboard.writeText(txt).then(() => showToast(`${t.toastCopied} ${txt}`));
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
    showToast(t.toastDeletedHistory);
  };

  const clearHistory = () => {
    if (confirm(t.confirmClearHistory)) {
      setHistory([]);
      try {
        localStorage.removeItem('epoch_conv_history');
      } catch {
        // 忽略
      }
      showToast(t.toastClearedHistory);
    }
  };

  const loadHistoryItem = (item: HistoryItem) => {
    if (item.type === 'ts2date' && item.loadData.tsInput) {
      setTsInput(item.loadData.tsInput);
      if (item.loadData.unit) setUnitMode(item.loadData.unit);
      showToast(`${t.toastLoadedTs} ${item.loadData.tsInput}`);
    } else if (item.type === 'date2ts' && item.loadData.dtInput) {
      setDtInput(item.loadData.dtInput);
      if (item.loadData.dtMs) setDtMsInput(item.loadData.dtMs);
      if (item.loadData.dtTz) setDtTzOffset(parseFloat(item.loadData.dtTz));
      showToast(`${t.toastLoadedDt} ${item.loadData.dtInput}`);
    }
  };

  // 快捷按鈕：帶入現在時間
  const fillTsNow = () => {
    const now = new Date();
    const ts = unitMode === 'ms' ? now.getTime() : Math.floor(now.getTime() / 1000);
    setTsInput(ts.toString());
    showToast(t.toastFilledTsNow);
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
    showToast(t.toastFilledDtNow);
  };

  const liveSec = liveNow ? Math.floor(liveNow.getTime() / 1000) : 0;
  const liveMs = liveNow ? liveNow.getTime() : 0;
  const liveDateStr = isMounted && liveNow ? formatLocalTime(liveNow) : 'YYYY-MM-DD HH:mm:ss.SSS';

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#00ff99"
      accentGlow="rgba(0, 255, 153, 0.6)"
    >
      <div className="flex flex-col gap-8 text-left w-full px-4 max-sm:px-0">
        {/* 當前時間動態看板 */}
        <div className={`${styles.cardContainer} flex flex-col gap-6`}>
          <div className="flex items-center justify-end">
            <Link
              href={t.switchLangHref}
              className="px-3 py-1.5 text-sm rounded-xl border bg-select-bg border-border-glass text-text-sub hover:text-text-main transition-colors font-medium"
            >
              {t.switchLangText}
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 max-lg:grid-cols-1">
            <div className={`flex flex-col gap-1.5 ${styles.innerBlock} min-w-0`}>
              <span className="text-sm font-semibold text-text-sub truncate">{t.liveSecTitle}</span>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className={`font-mono min-w-0 truncate ${styles.liveClock}`}>{isMounted ? liveSec : '-'}</span>
                <button
                  type="button"
                  onClick={() => copyText(liveSec.toString())}
                  className={styles.copyBtn}
                >
                  {t.copy}
                </button>
              </div>
            </div>

            <div className={`flex flex-col gap-1.5 ${styles.innerBlock} min-w-0`}>
              <span className="text-sm font-semibold text-text-sub truncate">{t.liveMsTitle}</span>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className={`font-mono min-w-0 truncate ${styles.liveClock}`}>
                  {isMounted ? liveMs : '-'}
                </span>
                <button
                  type="button"
                  onClick={() => copyText(liveMs.toString())}
                  className={styles.copyBtn}
                >
                  {t.copy}
                </button>
              </div>
            </div>

            <div className={`flex flex-col gap-1.5 ${styles.innerBlock} min-w-0`}>
              <span className="text-sm font-semibold text-text-sub truncate">
                {isMounted ? `${t.liveLocalTitle} (${displayTzLabel})` : `${t.liveLocalTitle} (UTC+8)`}
              </span>
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className={`font-mono min-w-0 truncate ${styles.liveClock}`}>{liveDateStr}</span>
                <button
                  type="button"
                  onClick={() => setIsPaused(!isPaused)}
                  className={`px-2 py-1 text-xs font-medium border rounded-lg transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    isPaused
                      ? 'bg-red-500/15 border-red-500/40 text-red-400 hover:bg-red-500/30'
                      : styles.secondaryBtn
                  }`}
                >
                  {isPaused ? t.resumeClock : t.pauseClock}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 雙向轉換區 */}
        <div className="grid grid-cols-2 gap-8 max-lg:grid-cols-1">
          {/* 1. 時間戳 轉 日期 */}
          <div className={`${styles.cardContainer} flex flex-col gap-6`}>
            <h3 className={`${styles.sectionTitle} text-xs uppercase tracking-[1px] font-semibold border-b border-border-glass pb-3 flex items-center gap-2`}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
              </svg>
              {t.sectionTsToDate}
            </h3>

            <div className="flex flex-col gap-2">
              <label htmlFor={tsInputId} className="text-sm font-medium text-text-sub">
                {t.labelTsInput}
              </label>
              <div className="grid grid-cols-[1fr_auto] gap-2">
                <div className={styles.inputWrapper}>
                  <input
                    id={tsInputId}
                    type="text"
                    value={tsInput}
                    onChange={(e) => setTsInput(e.target.value)}
                    placeholder={t.placeholderTsInput}
                    spellCheck={false}
                    autoComplete="off"
                    className={styles.textInput}
                  />
                </div>
                <select
                  id={tsUnitId}
                  value={unitMode}
                  onChange={(e) => setUnitMode(e.target.value as 'auto' | 's' | 'ms')}
                  className={styles.selectInput}
                >
                  <option value="auto">{t.unitAuto}</option>
                  <option value="s">{t.unitSec}</option>
                  <option value="ms">{t.unitMs}</option>
                </select>
              </div>
            </div>

            {/* 按鈕組 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={fillTsNow}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl cursor-pointer ${styles.accentBtn}`}
              >
                {t.btnFillNow}
              </button>
              <button
                type="button"
                onClick={() => setTsInput('')}
                className={styles.secondaryBtn}
              >
                {t.btnClear}
              </button>
            </div>

            {/* 轉換多時區結果 */}
            <div className="flex flex-col gap-3 font-mono text-xs border-t border-border-glass pt-5">
              <div className={`flex justify-between items-center ${styles.innerBlock} min-w-0`}>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-text-sub text-[0.75rem]">
                    {t.localTimeLabel} ({isMounted ? displayTzLabel : 'UTC+8'})
                  </span>
                  <span className="text-text-main font-bold text-sm truncate">
                    {parsedTsResult ? parsedTsResult.localStr : '-'}
                  </span>
                </div>
                {parsedTsResult && (
                  <button
                    type="button"
                    onClick={() => copyAndRecord(parsedTsResult.localStr, 'ts2date')}
                    className={styles.copyBtn}
                  >
                    {t.copy}
                  </button>
                )}
              </div>

              <div className={`flex justify-between items-center ${styles.innerBlock} min-w-0`}>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-text-sub text-[0.75rem]">{t.utcTimeLabel}</span>
                  <span className={`font-bold text-sm truncate ${styles.accentText}`}>
                    {parsedTsResult ? parsedTsResult.utcStr : '-'}
                  </span>
                </div>
                {parsedTsResult && (
                  <button
                    type="button"
                    onClick={() => copyAndRecord(parsedTsResult.utcStr, 'ts2date')}
                    className={styles.copyBtn}
                  >
                    {t.copy}
                  </button>
                )}
              </div>

              <div className={`flex justify-between items-center ${styles.innerBlock} min-w-0`}>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <div className="flex items-center gap-2 min-w-0 flex-wrap">
                    <span className="text-text-sub text-[0.75rem]">{t.laTimeLabel}</span>
                    {parsedTsResult && (
                      <span className={`text-[0.65rem] px-1.5 py-0.5 rounded font-sans font-semibold shrink-0 ${styles.badgeAccent}`}>
                        {parsedTsResult.laBadge}
                      </span>
                    )}
                  </div>
                  <span className="text-text-main font-bold text-sm truncate">
                    {parsedTsResult ? parsedTsResult.laStr : '-'}
                  </span>
                </div>
                {parsedTsResult && (
                  <button
                    type="button"
                    onClick={() => copyAndRecord(parsedTsResult.laStr, 'ts2date')}
                    className={styles.copyBtn}
                  >
                    {t.copy}
                  </button>
                )}
              </div>

              {/* 自訂選單時區 */}
              <div className={`flex flex-col gap-2.5 ${styles.innerBlock} min-w-0`}>
                <div className="flex items-center justify-between gap-2 min-w-0 flex-wrap">
                  <label htmlFor={selectCustomTzId} className="text-text-sub text-[0.75rem] font-medium min-w-0">
                    {t.selectCustomTzLabel}
                  </label>
                  <select
                    id={selectCustomTzId}
                    value={customTzOffset}
                    onChange={(e) => setCustomTzOffset(parseFloat(e.target.value))}
                    className={`${styles.selectInput} py-1 pl-2.5 pr-8 text-xs font-mono rounded-lg border bg-select-bg max-w-full sm:max-w-[260px]`}
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
                    <option value="8">UTC +08:00 (Taipei/Beijing)</option>
                    <option value="9">UTC +09:00 (Tokyo/Seoul)</option>
                    <option value="9.5">UTC +09:30</option>
                    <option value="10">UTC +10:00 (AEST)</option>
                    <option value="10.5">UTC +10:30</option>
                    <option value="11">UTC +11:00 (AEDT)</option>
                    <option value="11.5">UTC +11.5</option>
                    <option value="12">UTC +12:00</option>
                    <option value="13">UTC +13:00</option>
                    <option value="14">UTC +14:00</option>
                  </select>
                </div>

                <div className="flex items-center justify-between gap-2 min-w-0 pt-2 border-t border-border-glass/40">
                  <span className="text-text-main font-bold text-sm truncate font-mono">
                    {parsedTsResult ? parsedTsResult.customStr : '-'}
                  </span>
                  {parsedTsResult && (
                    <button
                      type="button"
                      onClick={() => copyAndRecord(parsedTsResult.customStr, 'ts2date')}
                      className={styles.copyBtn}
                    >
                      {t.copy}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 時間元數據 Panel */}
            {parsedTsResult && (
              <div className={`${styles.innerBlock} flex flex-wrap justify-between gap-3 text-xs text-text-sub font-mono`}>
                <div>
                  {t.dayOfWeekLabel}: <strong className={`${styles.accentText} font-bold`}>{parsedTsResult.weekStr}</strong>
                </div>
                <div>
                  {t.dayOfYearLabel}: <strong className={`${styles.accentText} font-bold`}>{parsedTsResult.dayOfYear}</strong> {t.dayUnit}
                </div>
                <div>
                  {t.yearInfoLabel}:{' '}
                  <strong className={`${styles.accentText} font-bold`}>
                    {parsedTsResult.year} {t.yearIs} {parsedTsResult.isLeap ? t.leapYear : t.commonYear}
                  </strong>
                </div>
              </div>
            )}
          </div>

          {/* 2. 日期 轉 時間戳 */}
          <div className={`${styles.cardContainer} flex flex-col gap-6`}>
            <h3 className={`${styles.sectionTitle} text-xs uppercase tracking-[1px] font-semibold border-b border-border-glass pb-3 flex items-center gap-2`}>
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm1 16H11v-6h2v6zm0-8H11V8h2v2z" />
              </svg>
              {t.sectionDateToTs}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-[1fr_135px] gap-3 items-end">
              <div className="flex flex-col gap-2 min-w-0">
                <label htmlFor={dtInputId} className="text-sm font-medium text-text-sub whitespace-nowrap truncate">
                  {t.labelDtInput}
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id={dtInputId}
                    type="datetime-local"
                    step="1"
                    value={dtInput}
                    onChange={(e) => setDtInput(e.target.value)}
                    className={styles.dateInput}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 w-full sm:w-[135px]">
                <label htmlFor={dtMsInputId} className="text-sm font-medium text-text-sub whitespace-nowrap truncate">
                  {t.labelDtMsInput}
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id={dtMsInputId}
                    type="number"
                    min={0}
                    max={999}
                    value={dtMsInput}
                    onChange={(e) => setDtMsInput(e.target.value)}
                    className={styles.textInput}
                  />
                </div>
              </div>
            </div>

            {/* 時區選擇器 */}
            <div className="flex flex-col gap-2">
              <label htmlFor={dtTzId} className="text-sm font-medium text-text-sub">
                {t.labelDtTz}
              </label>
              <select
                id={dtTzId}
                value={dtTzOffset}
                onChange={(e) => setDtTzOffset(parseFloat(e.target.value))}
                className={`${styles.selectInput} w-full`}
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
                <option value="8">UTC +08:00 (Taipei/Beijing)</option>
                <option value="9">UTC +09:00 (Tokyo/Seoul)</option>
                <option value="9.5">UTC +09:30</option>
                <option value="10">UTC +10:00 (AEST)</option>
                <option value="10.5">UTC +10:30</option>
                <option value="11">UTC +11:00 (AEDT)</option>
                <option value="11.5">UTC +11.5</option>
                <option value="12">UTC +12:00</option>
                <option value="13">UTC +13:00</option>
                <option value="14">UTC +14:00</option>
              </select>
            </div>

            {/* 按鈕組 */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={fillDtNow}
                className={`flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-xl cursor-pointer ${styles.accentBtn}`}
              >
                {t.btnFillNow}
              </button>
              <button
                type="button"
                onClick={() => {
                  setDtInput('');
                  setDtMsInput('0');
                }}
                className={styles.secondaryBtn}
              >
                {t.btnClear}
              </button>
            </div>

            {/* 轉換結果 */}
            <div className="flex flex-col gap-3 font-mono text-xs border-t border-border-glass pt-5">
              <div className={`flex justify-between items-center ${styles.innerBlock} min-w-0`}>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-text-sub text-[0.75rem]">{t.tsResultSec}</span>
                  <span className={`font-bold text-base truncate ${styles.accentText}`}>
                    {parsedDateResult ? parsedDateResult.secEpoch : '-'}
                  </span>
                </div>
                {parsedDateResult && (
                  <button
                    type="button"
                    onClick={() => copyAndRecord(parsedDateResult.secEpoch.toString(), 'date2ts')}
                    className={styles.copyBtn}
                  >
                    {t.copy}
                  </button>
                )}
              </div>

              <div className={`flex justify-between items-center ${styles.innerBlock} min-w-0`}>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-text-sub text-[0.75rem]">{t.tsResultMs}</span>
                  <span className="text-text-main font-bold text-base truncate">
                    {parsedDateResult ? parsedDateResult.msEpoch : '-'}
                  </span>
                </div>
                {parsedDateResult && (
                  <button
                    type="button"
                    onClick={() => copyAndRecord(parsedDateResult.msEpoch.toString(), 'date2ts')}
                    className={styles.copyBtn}
                  >
                    {t.copy}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* 歷史紀錄表格區 */}
        {history.length > 0 && (
          <div className={`${styles.cardContainer} flex flex-col gap-5`}>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h3 className="text-sm font-semibold text-text-sub flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current text-text-sub">
                  <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42C8.27 19.99 10.51 21 13 21c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z" />
                </svg>
                {t.historyTitle}
              </h3>

              <button
                type="button"
                onClick={clearHistory}
                className="px-3 py-1 text-xs font-medium text-red-500/90 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all cursor-pointer"
              >
                {t.btnClearHistory}
              </button>
            </div>

            <div className={styles.tableContainer}>
              <table className={styles.historyTable}>
                <thead>
                  <tr>
                    <th className={styles.stickyCol}>{t.thRecordTime}</th>
                    <th>{t.thType}</th>
                    <th>{t.thInputRaw}</th>
                    <th>{t.thLocal}</th>
                    <th>{t.thUtc}</th>
                    <th>{t.thLa}</th>
                    <th className="text-right">{t.thAction}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td className={styles.stickyCol}>{item.recordTime}</td>
                      <td className="text-text-sub font-sans">{item.typeLabel}</td>
                      <td className="font-mono text-text-main">{item.inputRaw}</td>
                      <td className="font-mono">{item.taipeiTime}</td>
                      <td className={`font-mono ${styles.accentText}`}>{item.utcTime}</td>
                      <td className="font-mono text-text-sub">{item.laTime}</td>
                      <td className="text-right">
                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => loadHistoryItem(item)}
                            title={t.btnLoad}
                            className={`px-2 py-1 text-[0.75rem] font-medium rounded-lg cursor-pointer ${styles.accentBtn}`}
                          >
                            {t.btnLoad}
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteHistoryItem(item.id)}
                            title={t.btnDelete}
                            className="px-2 py-1 text-[0.75rem] font-medium text-red-500/90 bg-red-500/10 border border-red-500/30 rounded-lg hover:bg-red-500/20 transition-all cursor-pointer"
                          >
                            {t.btnDelete}
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
        <div className={styles.toast}>
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

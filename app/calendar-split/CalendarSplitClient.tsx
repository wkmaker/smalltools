'use client';

import { useState, useCallback, useRef, useMemo, useTransition } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import {
  parseIcsFast,
  planIcsSplit,
  buildChunkBlob,
  buildChunkContent,
  createZipArchive,
  ParsedIcsData,
  SplitChunkMeta,
} from './icsSplitter';
import styles from './calendar-split.module.css';

interface CalendarSplitClientProps {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: '日曆切割助手',
    subtitle: 'GOOGLE CALENDAR ICS SPLITTER',
    description:
      '專業免費的線上 iCalendar (.ics) 日曆切割工具！解決 Google 行事曆匯入 1MB 大小限制問題，自動將龐大的日曆檔案智慧切割為多個小檔案，100% 瀏覽器本地運算，支援 ZIP 一鍵打包下載。',
    tag100Local: '100% 瀏覽器本機端運算・保障個人隱私',
    dropTitle: '點擊或將 Google 行事曆 .ics 檔案拖曳至此處',
    dropSub: '支援從 Google 日曆、Apple 行事曆或 Outlook 匯出的 .ics 檔案，純本地解析無伺服器上傳',
    parsingText: '正在快速解析日曆結構與活動索引...',
    zippingText: '正在背景打包 ZIP 壓縮檔...',
    originalFile: '原始日曆檔案',
    calendarName: '行事曆名稱',
    calendarTimezone: '時區設定',
    totalEvents: '總活動筆數',
    originalSize: '原始檔案大小',
    dateRange: '活動日期區間',
    splitSettings: '切割參數設定',
    splitMode: '切割模式',
    modeSize: '依檔案大小切割 (推薦)',
    modeCount: '依活動筆數切割',
    targetSizePreset: '目標單檔大小上限：',
    size900k: '900 KB (最穩妥)',
    size950k: '950 KB (推薦)',
    size1m: '1.0 MB (上限)',
    sizeCustom: '自訂大小',
    customSizeLabel: '自訂大小 (KB)',
    customCountLabel: '每檔活動上限筆數 (筆)',
    filenamePrefix: '匯出檔名前綴',
    autoSplitPreview: '分割預覽與下載清單',
    partsCount: (n: number) => `共切分為 ${n} 個檔案`,
    eventsPreserved: (n: number) => `已保留 ${n} 筆活動`,
    downloadAllZip: '一鍵打包下載全部 (ZIP)',
    downloadBatch: '逐一依序下載',
    reset: '重新上傳',
    downloadSingle: '下載',
    previewEvents: '預覽活動',
    modalPreviewTitle: '活動內容預覽',
    modalClose: '關閉',
    safeSizeTag: '低於 1MB 限制',
    emptyTitle: '尚未載入任何日曆檔案',
    invalidFileType: '請上傳正確的 iCalendar 檔案 (.ics)',
    noEventsFound: '該檔案中未解析到任何有效活動 (VEVENT)',
    importGuideTitle: '如何將切割後的檔案匯入 Google 日曆？',
    importStep1: '開啟 Google 日曆網頁版 (calendar.google.com)',
    importStep2: '點擊右上角齒輪圖示 ➔ 選擇「設定」',
    importStep3: '在左側選單點選「匯入與匯出」',
    importStep4: '依序選取切割後的 .ics 檔案並點擊「匯入」即可完整還原！',
    langSwitchLabel: 'English',
    langSwitchHref: '/calendar-split/en/',

    // FAQ
    faqTitle: '常見問題與使用指南 (FAQ)',
    faqSubtitle: '深入了解 Google 日曆匯入限制、.ics 檔案結構、切割演算法與隱私安全機制',
    faqItems: [
      {
        q: '為什麼 Google 行事曆匯出後無法直接匯入？匯入時跳出錯誤？',
        a: 'Google 日曆網頁版的「匯入」功能有嚴格的單一檔案大小上限（通常限制在 1MB 至 1.8MB 以內，過大時會直接跳出「檔案太大」或伺服器逾時錯誤）。\n\n然而當您從 Google 日曆「匯出」包含數年歷史紀錄的行事曆時，產生的 `.ics` 檔案往往高達 5MB ~ 20MB。透過本工具將檔案切割為多個小於 1MB 的獨立合法 `.ics` 檔，即可分批順暢匯入。',
      },
      {
        q: '切割後的 .ics 檔案是否會遺失時區資訊或重複活動 (Recurring Events)？',
        a: '完全不會！\n\n① 完整保留全域定義：\n本工具在切割時，會將原始檔案開頭的 `VCALENDAR` 全域屬性與所有的 `VTIMEZONE`（時區宣告）完整複製並嵌入到每一個分割檔案的檔頭中。\n\n② 保持活動完整性：\n每一個 `VEVENT`（包含重複規則 `RRULE`、鬧鐘提醒 `VALARM`、詳細說明與地點）皆以完整區塊保留，絕不破壞格式。',
      },
      {
        q: '上傳包含個人行程、公司會議等隱私資料是否安全？',
        a: '100% 絕對安全！\n\n① 零伺服器傳輸：\n本工具採用 100% 純前端（Client-Side）技術，透過瀏覽器內部的 JavaScript 引擎在您的本機記憶體中直接完成文字解析、分割與 ZIP 打包。\n\n② 支援離線運作：\n即便在開啟飛航模式或斷網狀態下，本工具依然能完全正常運作，任何行程與個人隱私資料絕不會離開您的電腦。',
      },
      {
        q: '我應該選擇 900 KB 還是 950 KB 作為切割上限？',
        a: '建議選擇預設的「950 KB」或更安全的「900 KB」：\n\n① 安全邊際考量：\nGoogle 日曆的 1MB 限制是以位元組計算，選擇 900KB ~ 950KB 能預留檔頭與封包餘裕，確保 100% 順利通過 Google 的驗證。\n\n② 筆數平衡：\n此大小通常可在每個檔案容納 500 至 1,200 筆活動，既減少總檔案個數，又能確保極速上傳。',
      },
      {
        q: '除了 Google 日曆外，本工具是否支援 Apple 行事曆或 Outlook？',
        a: '完美支援！\n\n本工具嚴格遵循國際 iCalendar RFC 5545 標準規格生成標準 `.ics` 檔案，切割後的檔案亦相容於 Apple Calendar（macOS / iOS）、Microsoft Outlook、Mozilla Thunderbird 等所有支援 iCalendar 格式的應用程式。',
      },
    ],
  },
  en: {
    title: 'Google Calendar ICS Splitter',
    subtitle: 'GOOGLE CALENDAR ICS SPLITTER',
    description:
      'Free online iCalendar (.ics) Splitter! Solve the Google Calendar 1MB file size import limit by automatically splitting large calendar files into smaller compliant chunks. 100% local in-browser processing with one-click ZIP download.',
    tag100Local: '100% Local In-Browser Processing・Privacy Protected',
    dropTitle: 'Click or drag & drop Google Calendar .ics file here',
    dropSub: 'Supports .ics files exported from Google Calendar, Apple Calendar, or Outlook. Pure client-side parsing.',
    parsingText: 'Parsing calendar structure and indexing events...',
    zippingText: 'Packaging ZIP archive in background...',
    originalFile: 'Original Calendar File',
    calendarName: 'Calendar Name',
    calendarTimezone: 'Timezone',
    totalEvents: 'Total Events',
    originalSize: 'File Size',
    dateRange: 'Event Date Range',
    splitSettings: 'Split Settings',
    splitMode: 'Split Mode',
    modeSize: 'By File Size (Recommended)',
    modeCount: 'By Event Count',
    targetSizePreset: 'Target Max Size Per File:',
    size900k: '900 KB (Safest)',
    size950k: '950 KB (Recommended)',
    size1m: '1.0 MB (Limit)',
    sizeCustom: 'Custom Size',
    customSizeLabel: 'Custom Size (KB)',
    customCountLabel: 'Max Events Per File',
    filenamePrefix: 'Output Filename Prefix',
    autoSplitPreview: 'Split Preview & Download List',
    partsCount: (n: number) => `Split into ${n} files`,
    eventsPreserved: (n: number) => `${n} events preserved`,
    downloadAllZip: 'Download All as ZIP',
    downloadBatch: 'Download Sequentially',
    reset: 'Upload Another File',
    downloadSingle: 'Download',
    previewEvents: 'Preview Events',
    modalPreviewTitle: 'Event Content Preview',
    modalClose: 'Close',
    safeSizeTag: 'Under 1MB Limit',
    emptyTitle: 'No Calendar File Loaded',
    invalidFileType: 'Please upload a valid iCalendar file (.ics)',
    noEventsFound: 'No valid events (VEVENT) found in this file',
    importGuideTitle: 'How to import split files into Google Calendar?',
    importStep1: 'Open Google Calendar web app (calendar.google.com)',
    importStep2: 'Click the Settings gear icon ➔ Select "Settings"',
    importStep3: 'Click "Import & export" in the left sidebar',
    importStep4: 'Select the split .ics files one by one and click "Import" to restore all events!',
    langSwitchLabel: '繁體中文',
    langSwitchHref: '/calendar-split/',

    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Learn about Google Calendar import limits, .ics structure, splitting logic, and offline privacy',
    faqItems: [
      {
        q: 'Why does Google Calendar fail to import my exported calendar?',
        a: 'Google Calendar has a strict file size limit (usually ~1MB to 1.8MB) for web uploads.\n\nWhen you export a calendar with years of history, the resulting `.ics` file is often 5MB to 20MB. Splitting the file into valid chunks under 1MB allows smooth batch importing without server timeouts.',
      },
      {
        q: 'Will recurring events or timezone settings be lost after splitting?',
        a: 'Not at all!\n\n① Full Global Headers Preserved:\nAll `VCALENDAR` properties and `VTIMEZONE` blocks from the original file are replicated in every single split chunk header.\n\n② Intact Event Blocks:\nEach `VEVENT` component (including recurrence rules `RRULE`, alarms `VALARM`, descriptions, and locations) is kept completely intact.',
      },
      {
        q: 'Is it safe to upload my personal or corporate calendar data?',
        a: '100% safe and private!\n\nAll text parsing, splitting, and ZIP packaging are performed locally in your web browser memory. No data is ever transmitted to any external server. It even functions seamlessly without an internet connection.',
      },
      {
        q: 'Should I choose 900 KB or 950 KB as the split threshold?',
        a: 'We recommend 950 KB or 900 KB. Setting a threshold slightly below the 1MB cap provides a safe margin for headers and ensures guaranteed acceptance by Google Calendar import filters.',
      },
      {
        q: 'Does this tool support Apple Calendar and Microsoft Outlook .ics files?',
        a: 'Yes! The generated `.ics` files adhere strictly to RFC 5545 standards and are fully compatible with Apple Calendar (macOS/iOS), Outlook, Thunderbird, and any iCalendar-supported application.',
      },
    ],
  },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default function CalendarSplitClient({ lang = 'zh-TW' }: CalendarSplitClientProps) {
  const t = TRANSLATIONS[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, startTransition] = useTransition();

  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedIcsData | null>(null);
  const [rawFilename, setRawFilename] = useState<string>('');
  const [rawFileSize, setRawFileSize] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // 切割設定
  const [splitMode, setSplitMode] = useState<'size' | 'count'>('size');
  const [sizePreset, setSizePreset] = useState<'900k' | '950k' | '1m' | 'custom'>('950k');
  const [customSizeKb, setCustomSizeKb] = useState<number>(950);
  const [maxEventCount, setMaxEventCount] = useState<number>(500);
  const [filenamePrefix, setFilenamePrefix] = useState<string>('');

  // 預覽彈窗
  const [previewModalChunk, setPreviewModalChunk] = useState<SplitChunkMeta | null>(null);

  // 處理檔案載入 (非同步解耦，保證 UI 60fps 流暢度)
  const handleProcessFile = useCallback(
    (file: File) => {
      setErrorMessage('');
      if (!file.name.toLowerCase().endsWith('.ics') && file.type !== 'text/calendar') {
        setErrorMessage(t.invalidFileType);
        return;
      }

      setRawFilename(file.name);
      setRawFileSize(file.size);
      setIsParsing(true);

      const defaultPrefix = file.name.replace(/\.ics$/i, '') || 'calendar';
      setFilenamePrefix(defaultPrefix);

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;

        // 利用 requestAnimationFrame / setTimeout 解耦耗時運算，讓 Loading 動畫立即可見
        setTimeout(() => {
          try {
            const parsed = parseIcsFast(text);

            if (parsed.events.length === 0) {
              setErrorMessage(t.noEventsFound);
              setParsedData(null);
            } else {
              startTransition(() => {
                setParsedData(parsed);
              });
            }
          } catch {
            setErrorMessage('解析檔案時發生錯誤，請確認檔案格式是否正確。');
            setParsedData(null);
          } finally {
            setIsParsing(false);
          }
        }, 16);
      };
      reader.onerror = () => {
        setErrorMessage('讀取檔案失敗');
        setIsParsing(false);
      };
      reader.readAsText(file, 'utf-8');
    },
    [t]
  );

  // 拖曳處理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleProcessFile(e.target.files[0]);
    }
  };

  // 毫秒級快速計算分割規劃 (純數字索引計算，零字串拷貝，0ms 延遲)
  const splitChunks: SplitChunkMeta[] = useMemo(() => {
    if (!parsedData || parsedData.events.length === 0) return [];

    let maxSizeBytes = 950 * 1024;
    if (splitMode === 'size') {
      if (sizePreset === '900k') maxSizeBytes = 900 * 1024;
      else if (sizePreset === '950k') maxSizeBytes = 950 * 1024;
      else if (sizePreset === '1m') maxSizeBytes = 1000 * 1024;
      else maxSizeBytes = Math.max(50, customSizeKb) * 1024;
    }

    return planIcsSplit(parsedData, {
      mode: splitMode,
      maxSizeBytes,
      maxEventCount: Math.max(10, maxEventCount),
      filenamePrefix: filenamePrefix.trim() || 'calendar',
    });
  }, [parsedData, splitMode, sizePreset, customSizeKb, maxEventCount, filenamePrefix]);

  // 單檔按需生成並下載 (Lazy Blob Construction)
  const handleDownloadSingle = useCallback(
    (chunk: SplitChunkMeta) => {
      if (!parsedData) return;
      const blob = buildChunkBlob(parsedData, chunk);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = chunk.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    },
    [parsedData]
  );

  // 全部打包 ZIP 下載 (背景分塊打包，不卡死主執行緒)
  const handleDownloadZip = useCallback(() => {
    if (!parsedData || splitChunks.length === 0) return;

    setIsZipping(true);

    setTimeout(() => {
      try {
        const encoder = new TextEncoder();
        const zipFiles = splitChunks.map((chunk) => {
          const content = buildChunkContent(parsedData, chunk);
          return {
            name: chunk.filename,
            content: encoder.encode(content),
          };
        });

        const zipBlob = createZipArchive(zipFiles);
        const zipUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = zipUrl;
        a.download = `${filenamePrefix || 'calendar'}_split_all.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(zipUrl), 1000);
      } finally {
        setIsZipping(false);
      }
    }, 20);
  }, [parsedData, splitChunks, filenamePrefix]);

  // 逐一依序下載
  const handleDownloadBatch = useCallback(() => {
    splitChunks.forEach((chunk, idx) => {
      setTimeout(() => {
        handleDownloadSingle(chunk);
      }, idx * 250);
    });
  }, [splitChunks, handleDownloadSingle]);

  // 重設
  const handleReset = () => {
    setParsedData(null);
    setRawFilename('');
    setRawFileSize(0);
    setErrorMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#06b6d4"
      accentGlow="rgba(6, 182, 212, 0.4)"
    >
      <div className={styles.container}>
        {/* 上傳區域 */}
        {!parsedData && (
          <div
            className={`${styles.dropZone} ${isDragging ? styles.dropZoneActive : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => !isParsing && fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".ics,text/calendar"
              className={styles.fileInputHidden}
              onChange={handleFileInputChange}
            />
            <div className={styles.dropIconWrap}>
              {isParsing ? (
                <svg className="animate-spin" viewBox="0 0 24 24" width={32} height={32} fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="currentColor" strokeWidth={2}>
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                  <line x1="16" y1="2" x2="16" y2="6" />
                  <line x1="8" y1="2" x2="8" y2="6" />
                  <line x1="3" y1="10" x2="21" y2="10" />
                  <path d="M12 14v4M10 16h4" />
                </svg>
              )}
            </div>
            <div className={styles.dropTitle}>{isParsing ? t.parsingText : t.dropTitle}</div>
            <div className={styles.dropSubtitle}>{t.dropSub}</div>
            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${styles.themeAccentBg} ${styles.themeAccentText} ${styles.themeAccentBorder}`}>
              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6z" />
              </svg>
              {t.tag100Local}
            </div>
            {errorMessage && (
              <div className="text-red-400 text-sm font-semibold mt-2">{errorMessage}</div>
            )}
          </div>
        )}

        {/* 檔案已載入面板 */}
        {parsedData && (
          <>
            {/* 檔案摘要卡片 */}
            <div className={styles.cardBox}>
              <div className={styles.fileSummaryHeader}>
                <div className={styles.fileSummaryTitle}>
                  <div className={styles.dropIconWrap} style={{ width: 42, height: 42 }}>
                    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 4h-2v-2h2v2zm4 0h-2v-2h2v2z" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-base text-text-main">{rawFilename}</div>
                    <div className="text-xs text-text-sub">{formatBytes(rawFileSize)}</div>
                  </div>
                </div>
                <button type="button" onClick={handleReset} className={styles.secondaryBtn}>
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 12a9 9 0 0115-6.7L21 8M21 3v5h-5M21 12a9 9 0 01-15 6.7L3 16M3 21v-5h5" />
                  </svg>
                  {t.reset}
                </button>
              </div>

              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>{t.calendarName}</span>
                  <span className={styles.statValue}>
                    {parsedData.calName || '預設行事曆 (Default)'}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>{t.calendarTimezone}</span>
                  <span className={styles.statValue}>
                    {parsedData.calTimezone || '未指定 (UTC/Local)'}
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>{t.totalEvents}</span>
                  <span className={styles.statValue}>
                    {parsedData.events.length.toLocaleString()} 筆
                  </span>
                </div>
                <div className={styles.statItem}>
                  <span className={styles.statLabel}>{t.originalSize}</span>
                  <span className={styles.statValue}>{formatBytes(parsedData.totalBytes)}</span>
                </div>
              </div>
            </div>

            {/* 切割控制設定 */}
            <div className={`${styles.cardBox} ${styles.settingsSection}`}>
              <div className={styles.sectionHeaderRow}>
                <div className={styles.sectionTitle}>
                  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} className={styles.themeAccentText}>
                    <circle cx="6" cy="6" r="3" />
                    <circle cx="6" cy="18" r="3" />
                    <line x1="20" y1="4" x2="8.12" y2="15.88" />
                    <line x1="14.47" y1="14.48" x2="20" y2="20" />
                    <line x1="8.12" y1="8.12" x2="12" y2="12" />
                  </svg>
                  {t.splitSettings}
                </div>

                {/* 模式切換 */}
                <div className={styles.pillGroup}>
                  <button
                    type="button"
                    className={`${styles.pillBtn} ${splitMode === 'size' ? styles.pillBtnActive : ''}`}
                    onClick={() => setSplitMode('size')}
                  >
                    {t.modeSize}
                  </button>
                  <button
                    type="button"
                    className={`${styles.pillBtn} ${splitMode === 'count' ? styles.pillBtnActive : ''}`}
                    onClick={() => setSplitMode('count')}
                  >
                    {t.modeCount}
                  </button>
                </div>
              </div>

              {/* 大小模式選項 */}
              {splitMode === 'size' && (
                <div className="flex flex-col gap-3">
                  <div className="text-xs text-text-sub font-medium">{t.targetSizePreset}</div>
                  <div className={styles.pillGroup}>
                    <button
                      type="button"
                      className={`${styles.pillBtn} ${sizePreset === '900k' ? styles.pillBtnActive : ''}`}
                      onClick={() => setSizePreset('900k')}
                    >
                      {t.size900k}
                    </button>
                    <button
                      type="button"
                      className={`${styles.pillBtn} ${sizePreset === '950k' ? styles.pillBtnActive : ''}`}
                      onClick={() => setSizePreset('950k')}
                    >
                      {t.size950k}
                    </button>
                    <button
                      type="button"
                      className={`${styles.pillBtn} ${sizePreset === '1m' ? styles.pillBtnActive : ''}`}
                      onClick={() => setSizePreset('1m')}
                    >
                      {t.size1m}
                    </button>
                    <button
                      type="button"
                      className={`${styles.pillBtn} ${sizePreset === 'custom' ? styles.pillBtnActive : ''}`}
                      onClick={() => setSizePreset('custom')}
                    >
                      {t.sizeCustom}
                    </button>
                  </div>

                  {sizePreset === 'custom' && (
                    <div className="flex items-center gap-3 mt-1">
                      <label className="text-xs text-text-sub">{t.customSizeLabel}:</label>
                      <input
                        type="number"
                        min="100"
                        max="5000"
                        step="50"
                        value={customSizeKb}
                        onChange={(e) => setCustomSizeKb(parseInt(e.target.value, 10) || 500)}
                        className={styles.inputField}
                        style={{ width: '120px' }}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 筆數模式選項 */}
              {splitMode === 'count' && (
                <div className="flex items-center gap-3">
                  <label className="text-xs text-text-sub font-medium">{t.customCountLabel}:</label>
                  <input
                    type="number"
                    min="50"
                    max="10000"
                    step="50"
                    value={maxEventCount}
                    onChange={(e) => setMaxEventCount(parseInt(e.target.value, 10) || 100)}
                    className={styles.inputField}
                    style={{ width: '140px' }}
                  />
                </div>
              )}

              {/* 檔名前綴設定 */}
              <div className="flex items-center gap-3 pt-2">
                <label className="text-xs text-text-sub font-medium">{t.filenamePrefix}:</label>
                <input
                  type="text"
                  value={filenamePrefix}
                  onChange={(e) => setFilenamePrefix(e.target.value)}
                  className={styles.inputField}
                  placeholder="calendar"
                  style={{ maxWidth: '240px' }}
                />
              </div>
            </div>

            {/* 切割結果卡片 */}
            <div className={styles.cardBox}>
              <div className={styles.fileSummaryHeader}>
                <div>
                  <div className="text-base font-semibold text-text-main flex items-center gap-2">
                    {t.autoSplitPreview}
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${styles.themeAccentBg} ${styles.themeAccentText} ${styles.themeAccentBorder}`}>
                      {t.partsCount(splitChunks.length)}
                    </span>
                  </div>
                  <div className="text-xs text-text-sub mt-0.5">
                    {t.eventsPreserved(parsedData.events.length)}
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleDownloadZip}
                    disabled={splitChunks.length === 0 || isZipping}
                    className={styles.primaryBtn}
                  >
                    {isZipping ? (
                      <svg className="animate-spin" viewBox="0 0 24 24" width={18} height={18} fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                        <path fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" className="opacity-75" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                        <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                      </svg>
                    )}
                    {isZipping ? t.zippingText : t.downloadAllZip}
                  </button>
                  {splitChunks.length > 1 && (
                    <button
                      type="button"
                      onClick={handleDownloadBatch}
                      disabled={isZipping}
                      className={styles.secondaryBtn}
                    >
                      {t.downloadBatch}
                    </button>
                  )}
                </div>
              </div>

              {/* 檔案清單 */}
              <div className={styles.splitList}>
                {splitChunks.map((chunk, idx) => (
                  <div key={chunk.filename} className={styles.splitItem}>
                    <div className={styles.splitItemInfo}>
                      <div className={styles.splitItemIndex}>#{idx + 1}</div>
                      <div className={styles.splitItemDetails}>
                        <div className={styles.splitItemName}>{chunk.filename}</div>
                        <div className={styles.splitItemMeta}>
                          <span className="font-semibold text-text-main">
                            {formatBytes(chunk.sizeBytes)}
                          </span>
                          <span>•</span>
                          <span>{chunk.eventCount} 筆活動</span>
                          {chunk.startDate && chunk.endDate && (
                            <>
                              <span>•</span>
                              <span className="text-xs">{chunk.startDate} ~ {chunk.endDate}</span>
                            </>
                          )}
                          {chunk.sizeBytes < 1024 * 1024 && (
                            <span className={styles.safeBadge}>
                              <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                              {t.safeSizeTag}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className={styles.splitItemActions}>
                      <button
                        type="button"
                        onClick={() => setPreviewModalChunk(chunk)}
                        className={styles.actionIconBtn}
                        title={t.previewEvents}
                      >
                        <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {t.previewEvents}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDownloadSingle(chunk)}
                        className={styles.actionIconBtn}
                        title={t.downloadSingle}
                      >
                        <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                        {t.downloadSingle}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Google 日曆匯入指南 */}
            <div className={styles.cardBox}>
              <div className={styles.sectionTitle}>
                <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className={styles.themeAccentText}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                </svg>
                {t.importGuideTitle}
              </div>
              <div className={styles.guideGrid}>
                <div className={styles.guideStep}>
                  <div className={styles.stepNumber}>1</div>
                  <div className={styles.stepText}>{t.importStep1}</div>
                </div>
                <div className={styles.guideStep}>
                  <div className={styles.stepNumber}>2</div>
                  <div className={styles.stepText}>{t.importStep2}</div>
                </div>
                <div className={styles.guideStep}>
                  <div className={styles.stepNumber}>3</div>
                  <div className={styles.stepText}>{t.importStep3}</div>
                </div>
                <div className={styles.guideStep}>
                  <div className={styles.stepNumber}>4</div>
                  <div className={styles.stepText}>{t.importStep4}</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 預覽 Modal */}
        {previewModalChunk && (
          <div className={styles.modalOverlay} onClick={() => setPreviewModalChunk(null)}>
            <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
              <div className={styles.modalHeader}>
                <div className={styles.modalTitle}>
                  {previewModalChunk.filename} ({previewModalChunk.eventCount} 筆活動)
                </div>
                <button
                  type="button"
                  onClick={() => setPreviewModalChunk(null)}
                  className={styles.closeBtn}
                  aria-label={t.modalClose}
                >
                  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}>
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
              <div className={styles.modalBody}>
                <div className="text-xs text-text-sub">
                  以下顯示此切割檔案包含的前 5 筆活動預覽：
                </div>
                <div className={styles.previewEventList}>
                  {previewModalChunk.previewEvents.map((ev, i) => (
                    <div key={i} className={styles.previewEventCard}>
                      <div className={styles.previewEventTitle}>{ev.summary}</div>
                      <div className={styles.previewEventDate}>
                        <span className="font-semibold text-text-sub">開始時間: </span>
                        {ev.dtStart || '無指定時間'}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      handleDownloadSingle(previewModalChunk);
                      setPreviewModalChunk(null);
                    }}
                    className={styles.primaryBtn}
                  >
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                    {t.downloadSingle}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ 區塊 */}
        <FaqSection
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          items={t.faqItems}
          accentColor="#06b6d4"
        />
      </div>
    </ToolLayout>
  );
}

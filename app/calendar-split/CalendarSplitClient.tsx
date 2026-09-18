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
import { formatBytes } from '../utils/formatBytes';
import { downloadBlob } from '../utils/downloadBlob';
import { TRANSLATIONS } from './translations';

interface CalendarSplitClientProps {
  lang?: 'zh-TW' | 'en';
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
      downloadBlob(blob, chunk.filename, 1000);
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
        downloadBlob(zipBlob, `${filenamePrefix || 'calendar'}_split_all.zip`, 1000);
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

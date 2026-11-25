'use client';

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import { inspectPdfStructure, compressPdfInPlace } from '../utils/pdfHelper';
import { formatBytes } from '../utils/formatBytes';
import { downloadBlob } from '../utils/downloadBlob';
import { createSimpleZip } from '../image-processor/utils/zipBuilder';
import { getLocalDateString } from '../utils/dateUtils';
import { randomToken } from '../utils/randomToken';
import IdbRestoreBanner from '../components/IdbRestoreBanner';
import { safeIdb } from '../utils/idb';
import styles from './pdf-compressor.module.css';
import { TRANSLATIONS } from './translations';
import PdfToolbar from './components/PdfToolbar';
import CompressionControlsPanel from './components/CompressionControlsPanel';
import PdfQueueCardList, { QueueItem } from './components/PdfQueueCardList';

const PDF_IDB_NAMESPACE = 'pdf-compressor';
const PDF_IDB_TTL_MS = 24 * 60 * 60 * 1000;
const PDF_IDB_MAX_ENTRIES = 5;
const PDF_IDB_MAX_SINGLE_BYTES = 50 * 1024 * 1024;

interface CachedCompressedPdf {
  id: string;
  name: string;
  originalSize: number;
  compressedSize: number;
  blob: Blob;
  savedAt: number;
}

interface PdfCompressorClientProps {
  lang?: 'zh-TW' | 'en';
}

export default function PdfCompressorClient({ lang = 'zh-TW' }: PdfCompressorClientProps) {
  const t = TRANSLATIONS[lang];
  const [fileQueue, setFileQueue] = useState<QueueItem[]>([]);

  // 壓縮模式與高級設定
  const [modePreset, setModePreset] = useState<'low' | 'medium' | 'high'>('medium');
  const [quality, setQuality] = useState<number>(0.65);
  const [maxDpi, setMaxDpi] = useState<number>(144);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  const [isCompressing, setIsCompressing] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [cachedPdfs, setCachedPdfs] = useState<CachedCompressedPdf[]>([]);
  const [toast, setToast] = useState<string>('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputId = useId();
  const isMountedRef = useRef<boolean>(false);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 3000);
  }, []);

  // 全域拖曳事件處理
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragging) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelect(e.dataTransfer.files);
    }
  };

  const syncToURL = useCallback(
    (currentMode: 'low' | 'medium' | 'high', qVal: number, dpiVal: number) => {
      if (typeof window === 'undefined' || !isMountedRef.current) return;
      const params = new URLSearchParams();
      params.set('mode', currentMode);
      params.set('quality', Math.round(qVal * 100).toString());
      params.set('dpi', dpiVal.toString());
      window.history.replaceState(null, '', '?' + params.toString());
    },
    []
  );

  const resetDoneItemsToReady = useCallback(() => {
    setFileQueue((prev) => {
      let hasChanges = false;
      const updated = prev.map((it) => {
        if (it.status === 'done' || it.status === 'error') {
          hasChanges = true;
          return {
            ...it,
            status: 'ready' as const,
            compressedBlob: null,
            compressedSize: 0,
            progressPct: 0,
            progressMsg: '',
            errorMsg: undefined,
          };
        }
        return it;
      });
      return hasChanges ? updated : prev;
    });
  }, []);

  const applyModePreset = useCallback(
    (m: 'low' | 'medium' | 'high') => {
      setModePreset(m);
      let q = 0.65;
      let dpi = 144;
      if (m === 'low') {
        q = 0.45;
        dpi = 96;
      } else if (m === 'medium') {
        q = 0.65;
        dpi = 144;
      } else if (m === 'high') {
        q = 0.85;
        dpi = 200;
      }
      setQuality(q);
      setMaxDpi(dpi);
      syncToURL(m, q, dpi);
      if (isMountedRef.current) resetDoneItemsToReady();
    },
    [syncToURL, resetDoneItemsToReady]
  );

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#eab308');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(234, 179, 8, 0.6)');

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const m = params.get('mode');
      if (m === 'low' || m === 'medium' || m === 'high') {
        applyModePreset(m);
      }
    }
    isMountedRef.current = true;
    void safeIdb.listNamespace<CachedCompressedPdf>(PDF_IDB_NAMESPACE).then((entries) => {
      const valid = entries
        .map((e) => e.value)
        .filter((v) => v && v.blob instanceof Blob && typeof v.name === 'string');
      setCachedPdfs(valid);
    });
  }, [applyModePreset]);

  // 上傳 PDF 檔案並自動非同步預檢
  const handleFilesSelect = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      showToast(t.toastValidPdfOnly);
      return;
    }

    const acceptedFiles: File[] = [];
    for (const f of pdfFiles) {
      if (f.size > 150 * 1024 * 1024) {
        showToast(t.toastFileTooLarge(f.name));
      } else {
        acceptedFiles.push(f);
      }
    }
    if (acceptedFiles.length === 0) return;

    const newItems: QueueItem[] = acceptedFiles.map((file, idx) => ({
      id: `q_${Date.now()}_${idx}_${randomToken(4)}`,
      file,
      name: file.name,
      size: file.size,
      buffer: null,
      inspectData: null,
      status: 'inspecting',
      compressedBlob: null,
      compressedSize: 0,
      showDetails: false,
    }));

    setFileQueue((prev) => [...prev, ...newItems]);
    showToast(t.toastAddedFiles(pdfFiles.length));

    // 非同步預檢各檔案結構
    for (let i = 0; i < newItems.length; i++) {
      const item = newItems[i];
      try {
        const buffer = await item.file.arrayBuffer();
        const inspectRes = await inspectPdfStructure(buffer);

        setFileQueue((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  buffer,
                  inspectData: inspectRes,
                  status: 'ready',
                }
              : it
          )
        );
      } catch (err: unknown) {
        const errMsg = err instanceof Error ? err.message : '';
        if (errMsg === 'PASSWORD_REQUIRED' || errMsg === 'PASSWORD_INCORRECT') {
          setFileQueue((prev) =>
            prev.map((it) =>
              it.id === item.id
                ? {
                    ...it,
                    buffer: null,
                    status: 'need_password',
                    passwordError: undefined,
                  }
                : it
            )
          );
        } else {
          console.error('預檢失敗:', err);
          setFileQueue((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, status: 'ready' } : it))
          );
        }
      }
    }
  };

  const unlockQueueItem = async (id: string, pwd?: string) => {
    setFileQueue((prev) =>
      prev.map((it) => (it.id === id ? { ...it, isUnlocking: true, passwordError: undefined } : it))
    );

    const item = fileQueue.find((f) => f.id === id);
    if (!item) return;

    try {
      let buffer = item.buffer;
      if (!buffer) {
        buffer = await item.file.arrayBuffer();
      }
      const inspectRes = await inspectPdfStructure(buffer, pwd || '');

      setFileQueue((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                buffer,
                password: pwd,
                inspectData: inspectRes,
                status: 'ready',
                isUnlocking: false,
                passwordError: undefined,
              }
            : it
        )
      );
    } catch (err: unknown) {
      console.error('[PdfCompressor] Unlock failed:', err);
      setFileQueue((prev) =>
        prev.map((it) =>
          it.id === id
            ? {
                ...it,
                isUnlocking: false,
                passwordError: t.invalidPasswordMsg,
              }
            : it
        )
      );
    }
  };

  const removeQueueItem = (id: string) => {
    setFileQueue((prev) => prev.filter((f) => f.id !== id));
    showToast(t.toastFileRemoved);
  };

  const toggleDetails = (id: string) => {
    setFileQueue((prev) =>
      prev.map((f) => (f.id === id ? { ...f, showDetails: !f.showDetails } : f))
    );
  };

  const handlePasswordChange = (id: string, value: string) => {
    setFileQueue((prev) =>
      prev.map((it) => (it.id === id ? { ...it, password: value } : it))
    );
  };

  const handleToggleShowPassword = (id: string) => {
    setFileQueue((prev) =>
      prev.map((it) => (it.id === id ? { ...it, showPassword: !it.showPassword } : it))
    );
  };

  // 執行批次壓縮處理
  const startBatchCompression = async () => {
    if (fileQueue.length === 0 || isCompressing) return;

    setIsCompressing(true);
    showToast(t.toastCompressing);

    for (let i = 0; i < fileQueue.length; i++) {
      const item = fileQueue[i];
      if (item.status === 'done' || item.status === 'need_password') continue;

      try {
        let buffer = item.buffer;
        if (!buffer) {
          buffer = await item.file.arrayBuffer();
        }

        setFileQueue((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'compressing', progressMsg: t.processing, progressPct: 15 }
              : it
          )
        );

        const compressedBlob = await compressPdfInPlace(
          buffer,
          { quality, maxDpi },
          (msg, pct) => {
            setFileQueue((prev) =>
              prev.map((it) =>
                it.id === item.id ? { ...it, progressMsg: msg, progressPct: pct } : it
              )
            );
          },
          item.password
        );

        setFileQueue((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? {
                  ...it,
                  status: 'done',
                  progressPct: 100,
                  compressedBlob,
                  compressedSize: compressedBlob.size,
                }
              : it
          )
        );

        // 僅在非加密 PDF 且大小合宜時寫入本地 IndexedDB 暫存，保護加密文件隱私
        if (!item.password && compressedBlob.size <= PDF_IDB_MAX_SINGLE_BYTES) {
          const cacheItem: CachedCompressedPdf = {
            id: item.id,
            name: item.name,
            originalSize: item.size,
            compressedSize: compressedBlob.size,
            blob: compressedBlob,
            savedAt: Date.now(),
          };
          void safeIdb
            .set(PDF_IDB_NAMESPACE, item.id, cacheItem, {
              ttlMs: PDF_IDB_TTL_MS,
              maxEntriesInNamespace: PDF_IDB_MAX_ENTRIES,
            })
            .then(() => safeIdb.listNamespace<CachedCompressedPdf>(PDF_IDB_NAMESPACE))
            .then((entries) => {
              setCachedPdfs(
                entries
                  .map((e) => e.value)
                  .filter((v) => v && v.blob instanceof Blob && typeof v.name === 'string')
              );
            });
        }
      } catch (err) {
        console.error('壓縮失敗:', err);
        setFileQueue((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'error', errorMsg: (err as Error).message || 'Compression error' }
              : it
          )
        );
      }
    }

    setIsCompressing(false);
    showToast(t.toastCompressDone);
  };

  // 一鍵 ZIP 打包下載
  const downloadAllAsZip = async () => {
    const completedItems = fileQueue.filter((f) => f.status === 'done' && f.compressedBlob);
    if (completedItems.length === 0) return;

    showToast(t.toastZipBuilding);
    const zipFiles: { name: string; data: Uint8Array }[] = [];

    for (let i = 0; i < completedItems.length; i++) {
      const item = completedItems[i];
      const buffer = await item.compressedBlob!.arrayBuffer();
      const baseName = item.name.replace(/\.pdf$/i, '');
      zipFiles.push({
        name: `${baseName}_compressed.pdf`,
        data: new Uint8Array(buffer),
      });
    }

    const zipBlob = createSimpleZip(zipFiles);
    downloadBlob(zipBlob, `PDF_Compressed_Batch_${getLocalDateString()}.zip`, 5000);
    showToast(t.toastZipDone);
  };

  const hasCompleted = fileQueue.some((f) => f.status === 'done');

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#eab308"
      accentGlow="rgba(234, 179, 8, 0.6)"
    >
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative flex flex-col gap-8 text-left w-full px-4 max-sm:px-0 min-h-[400px]"
      >
        {/* 全域拖曳浮層 Overlay */}
        {isDragging && (
          <div className="absolute inset-0 z-50 bg-[#eab308]/15 border-2 border-dashed border-[#eab308] rounded-3xl backdrop-blur-md flex flex-col items-center justify-center gap-3 text-text-main transition-all shadow-[0_0_50px_rgba(234,179,8,0.4)] pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-[#eab308] text-black flex items-center justify-center shadow-lg animate-bounce">
              <svg viewBox="0 0 24 24" width={32} height={32} fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-text-main tracking-wide">
              {t.dragOverlayText}
            </span>
          </div>
        )}

        {/* 頂部頂級功能列 */}
        <PdfToolbar
          fileInputId={fileInputId}
          fileCount={fileQueue.length}
          isCompressing={isCompressing}
          hasCompleted={hasCompleted}
          onFilesSelect={handleFilesSelect}
          onClearQueue={() => setFileQueue([])}
          onStartBatch={startBatchCompression}
          onDownloadZip={downloadAllAsZip}
          t={t}
        />

        {/* IndexedDB 暫存恢復橫幅 */}
        {fileQueue.length === 0 && cachedPdfs.length > 0 && (
          <IdbRestoreBanner
            title={t.cachedPdfsTitle}
            description={t.cachedPdfsDesc(cachedPdfs.length)}
            clearLabel={t.clearCachedPdfsBtn}
            onClear={() => {
              setCachedPdfs([]);
              void safeIdb.clearNamespace(PDF_IDB_NAMESPACE);
            }}
          >
            <div className="flex flex-col gap-2">
              {cachedPdfs.map((cp) => {
                const ratio =
                  cp.originalSize > 0
                    ? Math.max(0, ((cp.originalSize - cp.compressedSize) / cp.originalSize) * 100).toFixed(1)
                    : '0.0';
                return (
                  <div
                    key={cp.id}
                    className="flex items-center justify-between gap-3 bg-select-bg border border-border-glass rounded-xl px-3.5 py-2 min-w-0 flex-wrap"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-xs font-semibold text-text-main truncate">{cp.name}</span>
                      <span className="text-xs text-text-sub font-mono shrink-0">
                        {formatBytes(cp.originalSize)} → {formatBytes(cp.compressedSize)} {t.saved(ratio)}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const baseName = cp.name.replace(/\.pdf$/i, '');
                        downloadBlob(cp.blob, `${baseName}_compressed.pdf`, 5000);
                      }}
                      className={`px-3 py-1 text-xs font-semibold rounded-lg cursor-pointer shrink-0 ${styles.accentBtn}`}
                    >
                      {t.downloadPdf}
                    </button>
                  </div>
                );
              })}
            </div>
          </IdbRestoreBanner>
        )}

        {/* 壓縮模式控制面板 */}
        <CompressionControlsPanel
          modePreset={modePreset}
          onApplyModePreset={applyModePreset}
          showAdvanced={showAdvanced}
          onToggleAdvanced={() => setShowAdvanced(!showAdvanced)}
          quality={quality}
          onQualityChange={(q) => {
            setQuality(q);
            resetDoneItemsToReady();
            syncToURL(modePreset, q, maxDpi);
          }}
          maxDpi={maxDpi}
          onMaxDpiChange={(dpi) => {
            setMaxDpi(dpi);
            resetDoneItemsToReady();
            syncToURL(modePreset, quality, dpi);
          }}
          t={t}
        />

        {/* 上傳 Dropzone 或 檔案佇列清單 */}
        {fileQueue.length === 0 ? (
          <div
            onClick={() => document.getElementById(fileInputId)?.click()}
            className={`p-12 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer text-center ${styles.dropzone}`}
          >
            <div className={`w-18 h-18 rounded-3xl flex items-center justify-center ${styles.accentTag}`}>
              <svg viewBox="0 0 24 24" width={32} height={32} fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base font-bold text-text-main">
                {t.dropTitle}
              </span>
              <span className="text-xs text-text-sub">
                {t.dropSub}
              </span>
            </div>
          </div>
        ) : (
          <PdfQueueCardList
            fileQueue={fileQueue}
            isCompressing={isCompressing}
            fileInputId={fileInputId}
            onToggleDetails={toggleDetails}
            onRemoveItem={removeQueueItem}
            onPasswordChange={handlePasswordChange}
            onToggleShowPassword={handleToggleShowPassword}
            onUnlockItem={unlockQueueItem}
            t={t}
          />
        )}
      </div>

      {/* 通用 FAQ 常見問題區塊 */}
      <FaqSection
        items={t.faqItems}
        title={t.faqTitle}
        subtitle={t.faqSubtitle}
        accentColor="#eab308"
      />

      {toast && (
        <div className={styles.toast}>
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

'use client';

import { useState, useEffect, useCallback, useRef, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import {
  inspectPdfStructure,
  compressPdfInPlace,
  InspectResult,
} from '../utils/pdfHelper';
import styles from './pdf-compressor.module.css';

interface QueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  buffer: ArrayBuffer | null;
  inspectData: InspectResult | null;
  status: 'inspecting' | 'ready' | 'need_password' | 'compressing' | 'done' | 'error';
  password?: string;
  passwordError?: string;
  showPassword?: boolean;
  isUnlocking?: boolean;
  progressMsg?: string;
  progressPct?: number;
  compressedBlob: Blob | null;
  compressedSize: number;
  errorMsg?: string;
  showDetails?: boolean;
}

const TRANSLATIONS = {
  'zh-TW': {
    title: 'PDF 壓縮大師',
    subtitle: 'ONLINE PDF COMPRESSOR MASTER',
    description: '專業免費的線上 PDF 壓縮大師！專針對 PDF 內嵌點陣圖片進行深度降採樣與瘦身，維持文字與向量 100% 原生無損清晰可複製。支援多檔批次壓縮與 ZIP 一鍵打包。',
    tag100Local: '100% 瀏覽器本機端運算',
    noFilesLoaded: '請上傳 PDF 檔案開啟極速瘦身',
    filesLoaded: (n: number) => `已載入 ${n} 個 PDF 檔案`,
    addPdfFiles: '新增 PDF 檔案',
    clearQueue: '清空佇列',
    startBatch: '開始批次壓縮',
    compressing: '壓縮處理中...',
    downloadZip: '打包 ZIP 下載',
    compressionPreset: '壓縮強度預設：',
    modeHigh: '輕度 (微幅瘦身)',
    modeMedium: '平衡 (推薦 ~60%)',
    modeLow: '極致 (~80% 瘦身)',
    showAdvanced: '進階微調設定 ▼',
    hideAdvanced: '隱藏進階參數 ▲',
    qualityLabel: '點陣圖片壓縮品質 (Quality)',
    maxDpiLabel: '最大網點解析度 (Max DPI)',
    dpi96: '96 DPI (螢幕簡報/極輕巧)',
    dpi144: '144 DPI (推薦清晰標準)',
    dpi200: '200 DPI (高清列印等級)',
    dropTitle: '點擊或將一至多個 PDF 檔案拖曳至此處',
    dropSub: '支援多檔 PDF 批次處理，100% 瀏覽器本機端運算，零檔案上傳伺服器，隱私極致安全',
    dragOverlayText: '放開滑鼠以新增更多 PDF 檔案進行壓縮',
    inspectTag: (n: number, r: number) => `預檢: ${n} 張圖片 (估減 ~${r}%)`,
    details: '明細',
    removeFile: '移除檔案',
    processing: '處理中...',
    original: '原檔:',
    compressed: '壓縮檔:',
    saved: (ratio: string) => `(減小 ${ratio}%)`,
    downloadPdf: '下載壓縮檔 PDF',
    errorPrefix: '處理失敗：',
    tableHeaderIdx: '#',
    tableHeaderDim: '維度 (WxH)',
    tableHeaderFormat: '格式 / 色彩',
    tableHeaderDecision: '預檢決策與保護理由',
    addMoreBottom: '拖曳或點擊此處新增更多 PDF 檔案進行壓縮',
    toastValidPdfOnly: '請選擇正確的 PDF 格式檔案 (.pdf)',
    toastAddedFiles: (n: number) => `成功新增 ${n} 個 PDF 檔案，正在執行結構預檢...`,
    toastFileRemoved: '已移除指定檔案',
    toastCompressing: '正在執行 PDF 圖片深度壓縮與結構瘦身...',
    toastCompressDone: '所有 PDF 檔案壓縮瘦身完成！',
    toastZipBuilding: '正在打包 ZIP 壓縮檔...',
    toastZipDone: 'ZIP 打包下載完成！',
    needPasswordTitle: '檔案受密碼保護',
    needPasswordSub: '解析此 PDF 檔案需要開啟密碼，請輸入密碼以進行結構預檢與壓縮處理。',
    passwordPlaceholder: '請輸入 PDF 開啟密碼',
    unlockBtn: '解鎖驗證',
    unlocking: '驗證中...',
    passwordProtectedTag: '加密保護',
    invalidPasswordMsg: '密碼不正確，請確認後重新輸入。',
    showPassword: '顯示密碼',
    hidePassword: '隱藏密碼',
    switchLangText: 'English',
    switchLangHref: '/pdf-compressor/en/',
  },
  en: {
    title: 'PDF Compressor Master',
    subtitle: 'ONLINE PDF COMPRESSOR MASTER',
    description: 'Free online PDF Compressor Master! Deeply compresses & downsamples embedded bitmap images while preserving 100% original crisp text & vector graphics. Supports multi-file batch processing and ZIP export.',
    tag100Local: '100% In-Browser Execution',
    noFilesLoaded: 'Upload PDF files to start compression',
    filesLoaded: (n: number) => `${n} PDF file(s) loaded`,
    addPdfFiles: 'Add PDF Files',
    clearQueue: 'Clear Queue',
    startBatch: 'Start Compression',
    compressing: 'Compressing...',
    downloadZip: 'Download All ZIP',
    compressionPreset: 'Compression Mode:',
    modeHigh: 'Light (~30% saving)',
    modeMedium: 'Balanced (Rec. ~60%)',
    modeLow: 'Maximum (~80% saving)',
    showAdvanced: 'Advanced Settings ▼',
    hideAdvanced: 'Hide Advanced ▲',
    qualityLabel: 'Bitmap Compression Quality',
    maxDpiLabel: 'Max DPI Resolution',
    dpi96: '96 DPI (Screen Presentation)',
    dpi144: '144 DPI (Standard Rec.)',
    dpi200: '200 DPI (High Print Quality)',
    dropTitle: 'Click or drag PDF file(s) here',
    dropSub: 'Supports multi-file batch processing. 100% client-side execution, zero server upload.',
    dragOverlayText: 'Drop files to add more PDF files',
    inspectTag: (n: number, r: number) => `Inspected: ${n} image(s) (Est. -${r}%)`,
    details: 'Details',
    removeFile: 'Remove File',
    processing: 'Processing...',
    original: 'Original:',
    compressed: 'Compressed:',
    saved: (ratio: string) => `(Saved ${ratio}%)`,
    downloadPdf: 'Download Compressed PDF',
    errorPrefix: 'Compression Failed: ',
    tableHeaderIdx: '#',
    tableHeaderDim: 'Dimensions (WxH)',
    tableHeaderFormat: 'Format / ColorSpace',
    tableHeaderDecision: 'Inspection & Decision',
    addMoreBottom: 'Drag or click here to add more PDF files',
    toastValidPdfOnly: 'Please select valid PDF files (.pdf)',
    toastAddedFiles: (n: number) => `Added ${n} PDF file(s). Running structure inspection...`,
    toastFileRemoved: 'File removed from queue',
    toastCompressing: 'Compressing PDF images and optimizing structure...',
    toastCompressDone: 'All PDF files compressed successfully!',
    toastZipBuilding: 'Creating ZIP archive...',
    toastZipDone: 'ZIP download started!',
    needPasswordTitle: 'Password Protected File',
    needPasswordSub: 'This PDF requires an open password to inspect structure & compress.',
    passwordPlaceholder: 'Enter PDF password',
    unlockBtn: 'Unlock & Verify',
    unlocking: 'Unlocking...',
    passwordProtectedTag: 'Encrypted',
    invalidPasswordMsg: 'Incorrect password. Please try again.',
    showPassword: 'Show Password',
    hidePassword: 'Hide Password',
    switchLangText: '繁體中文',
    switchLangHref: '/pdf-compressor/',
  },
};

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 輕量化純前端 PKZip Builder
function createSimpleZip(files: { name: string; data: Uint8Array }[]): Blob {
  const parts: Uint8Array[] = [];
  const cdEntries: Uint8Array[] = [];
  let offset = 0;

  files.forEach((f) => {
    const nameBytes = new TextEncoder().encode(f.name);
    const date = new Date();
    const dosTime = (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
    const dosDate = ((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate();

    let crc = 0xffffffff;
    for (let i = 0; i < f.data.length; i++) {
      crc ^= f.data[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    crc = (crc ^ 0xffffffff) >>> 0;

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true);
    view.setUint16(4, 20, true);
    view.setUint16(6, 0, true);
    view.setUint16(8, 0, true);
    view.setUint16(10, dosTime, true);
    view.setUint16(12, dosDate, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, f.data.length, true);
    view.setUint32(22, f.data.length, true);
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true);
    localHeader.set(nameBytes, 30);

    parts.push(localHeader);
    parts.push(f.data);

    const cdEntry = new Uint8Array(46 + nameBytes.length);
    const cdView = new DataView(cdEntry.buffer);
    cdView.setUint32(0, 0x02014b50, true);
    cdView.setUint16(4, 20, true);
    cdView.setUint16(6, 20, true);
    cdView.setUint16(8, 0, true);
    cdView.setUint16(10, 0, true);
    cdView.setUint16(12, dosTime, true);
    cdView.setUint16(14, dosDate, true);
    cdView.setUint32(16, crc, true);
    cdView.setUint32(20, f.data.length, true);
    cdView.setUint32(24, f.data.length, true);
    cdView.setUint16(28, nameBytes.length, true);
    cdView.setUint16(30, 0, true);
    cdView.setUint16(34, 0, true);
    cdView.setUint16(36, 0, true);
    cdView.setUint32(38, 0, true);
    cdView.setUint32(42, offset, true);
    cdEntry.set(nameBytes, 46);

    cdEntries.push(cdEntry);
    offset += localHeader.length + f.data.length;
  });

  const cdOffset = offset;
  let cdSize = 0;
  cdEntries.forEach((e) => {
    parts.push(e);
    cdSize += e.length;
  });

  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);
  eocdView.setUint32(0, 0x06054b50, true);
  eocdView.setUint16(4, 0, true);
  eocdView.setUint16(6, 0, true);
  eocdView.setUint16(8, files.length, true);
  eocdView.setUint16(10, files.length, true);
  eocdView.setUint32(12, cdSize, true);
  eocdView.setUint32(16, cdOffset, true);
  eocdView.setUint16(20, 0, true);

  parts.push(eocd);

  return new Blob(parts as BlobPart[], { type: 'application/zip' });
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
  const [toast, setToast] = useState<string>('');

  const fileInputId = useId();
  const maxDpiId = useId();
  const isMountedRef = useRef<boolean>(false);

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
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

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

  const applyModePreset = (m: 'low' | 'medium' | 'high') => {
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
  };

  // 上傳 PDF 檔案並自動非同步預檢
  const handleFilesSelect = async (files: FileList | File[]) => {
    const pdfFiles = Array.from(files).filter(
      (f) => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf')
    );

    if (pdfFiles.length === 0) {
      showToast(t.toastValidPdfOnly);
      return;
    }

    const newItems: QueueItem[] = pdfFiles.map((file, idx) => ({
      id: `q_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
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
      } catch (err: any) {
        if (err.message === 'PASSWORD_REQUIRED' || err.message === 'PASSWORD_INCORRECT') {
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
    } catch (err: any) {
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
    const zipUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = zipUrl;
    a.download = `PDF_Compressed_Batch_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(zipUrl), 5000);
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
        <div className={`${styles.cardContainer} p-5 sm:p-6 flex justify-between items-center flex-wrap gap-4`}>
          <div className="flex items-center gap-3 flex-wrap">
            <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${styles.accentTag}`}>
              {t.tag100Local}
            </span>
            <span className="text-sm text-text-sub font-medium">
              {fileQueue.length === 0
                ? t.noFilesLoaded
                : t.filesLoaded(fileQueue.length)}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href={t.switchLangHref}
              className="px-3 py-1.5 text-sm rounded-xl border bg-select-bg border-border-glass text-text-sub hover:text-text-main transition-colors font-medium"
            >
              {t.switchLangText}
            </Link>

            <input
              id={fileInputId}
              type="file"
              accept="application/pdf"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFilesSelect(e.target.files)}
            />

            <button
              type="button"
              onClick={() => document.getElementById(fileInputId)?.click()}
              disabled={isCompressing}
              className={`px-4 py-2 text-sm font-semibold rounded-xl disabled:opacity-30 flex items-center gap-1.5 cursor-pointer ${styles.accentBtn}`}
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              {t.addPdfFiles}
            </button>

            {fileQueue.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setFileQueue([])}
                  disabled={isCompressing}
                  className={styles.secondaryBtn}
                >
                  {t.clearQueue}
                </button>
                <button
                  type="button"
                  onClick={startBatchCompression}
                  disabled={isCompressing}
                  className={`px-6 py-2 text-sm rounded-xl disabled:opacity-40 flex items-center gap-2 cursor-pointer ${styles.primaryBtn}`}
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  {isCompressing ? t.compressing : t.startBatch}
                </button>
              </>
            )}

            {hasCompleted && fileQueue.length > 1 && (
              <button
                type="button"
                onClick={downloadAllAsZip}
                className={`flex items-center gap-2 ${styles.zipBtn}`}
              >
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                  <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
                </svg>
                {t.downloadZip}
              </button>
            )}
          </div>
        </div>

        {/* 壓縮模式控制面板 */}
        <div className={`${styles.cardContainer} flex flex-col gap-4`}>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-text-main">{t.compressionPreset}</span>
              <div className={`${styles.innerBlock} p-1 flex gap-1 rounded-xl`}>
                <button
                  type="button"
                  onClick={() => applyModePreset('high')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
                    modePreset === 'high' ? styles.modeBtnActive : styles.modeBtnInactive
                  }`}
                >
                  {t.modeHigh}
                </button>
                <button
                  type="button"
                  onClick={() => applyModePreset('medium')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
                    modePreset === 'medium' ? styles.modeBtnActive : styles.modeBtnInactive
                  }`}
                >
                  {t.modeMedium}
                </button>
                <button
                  type="button"
                  onClick={() => applyModePreset('low')}
                  className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
                    modePreset === 'low' ? styles.modeBtnActive : styles.modeBtnInactive
                  }`}
                >
                  {t.modeLow}
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`text-sm font-semibold hover:underline cursor-pointer flex items-center gap-1 ${styles.accentText}`}
            >
              {showAdvanced ? t.hideAdvanced : t.showAdvanced}
            </button>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-6 pt-4 border-t border-border-glass">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-text-sub font-medium">{t.qualityLabel}</span>
                  <span className={`font-mono font-bold ${styles.accentText}`}>
                    {Math.round(quality * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min={0.15}
                  max={0.95}
                  step={0.05}
                  value={quality}
                  onChange={(e) => {
                    const q = parseFloat(e.target.value);
                    setQuality(q);
                    syncToURL(modePreset, q, maxDpi);
                  }}
                  className="accent-[#eab308] cursor-pointer"
                />
              </div>

              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <label htmlFor={maxDpiId} className="text-text-sub font-medium">
                    {t.maxDpiLabel}
                  </label>
                  <span className={`font-mono font-bold ${styles.accentText}`}>{maxDpi} DPI</span>
                </div>
                <select
                  id={maxDpiId}
                  value={maxDpi}
                  onChange={(e) => {
                    const dpi = parseInt(e.target.value, 10);
                    setMaxDpi(dpi);
                    syncToURL(modePreset, quality, dpi);
                  }}
                  className={styles.selectInput}
                >
                  <option value={96}>{t.dpi96}</option>
                  <option value={144}>{t.dpi144}</option>
                  <option value={200}>{t.dpi200}</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* 上傳 Dropzone */}
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
          <div className="flex flex-col gap-4">
            {fileQueue.map((item) => {
              const savedBytes = item.size - item.compressedSize;
              const ratio =
                item.size > 0 && item.compressedSize > 0
                  ? Math.max(0, (savedBytes / item.size) * 100).toFixed(1)
                  : 0;

              return (
                <div key={item.id} className={`${styles.cardContainer} p-5 flex flex-col gap-3`}>
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${styles.accentTag}`}>
                        <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
                          <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
                        </svg>
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-semibold text-text-main truncate" title={item.name}>
                          {item.name}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-mono text-text-sub">
                            {formatBytes(item.size)}
                          </span>
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${styles.encryptedTag} inline-flex items-center gap-1`}>
                              <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                              </svg>
                              {t.passwordProtectedTag}
                            </span>
                          {item.inspectData && (
                            <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${styles.accentTag}`}>
                              {t.inspectTag(item.inspectData.totalImages, item.inspectData.estRatio)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.inspectData && item.inspectData.images.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleDetails(item.id)}
                          className={styles.secondaryBtn}
                        >
                          <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                          </svg>
                          {t.details} {item.showDetails ? '▲' : '▼'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removeQueueItem(item.id)}
                        disabled={isCompressing}
                        className="p-1.5 text-xs text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-30"
                        title={t.removeFile}
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* 受密碼保護提示與解鎖 UI Block */}
                  {item.status === 'need_password' && (
                    <div className={`mt-1 ${styles.passwordBlock} flex flex-col gap-3`}>
                      <div className="flex items-start gap-2.5">
                        <div className="p-1.5 rounded-lg bg-red-500/20 text-red-500 shrink-0 mt-0.5">
                          <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                            <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                          </svg>
                        </div>
                        <div className="flex flex-col gap-0.5">
                          <span className="text-sm font-bold text-text-main">
                            {t.needPasswordTitle}
                          </span>
                          <span className="text-xs text-text-sub">
                            {t.needPasswordSub}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="relative flex-1 min-w-[200px]">
                          <input
                            type={item.showPassword ? 'text' : 'password'}
                            value={item.password || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setFileQueue((prev) =>
                                prev.map((it) => (it.id === item.id ? { ...it, password: val } : it))
                              );
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                unlockQueueItem(item.id, item.password);
                              }
                            }}
                            placeholder={t.passwordPlaceholder}
                            className={`w-full pr-10 ${styles.passwordInput}`}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setFileQueue((prev) =>
                                prev.map((it) =>
                                  it.id === item.id ? { ...it, showPassword: !it.showPassword } : it
                                )
                              );
                            }}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main p-1 cursor-pointer"
                            title={item.showPassword ? t.hidePassword : t.showPassword}
                          >
                            {item.showPassword ? (
                              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                                <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.44-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.17c0-1.66-1.34-3-3-3l-.17.02z" />
                              </svg>
                            ) : (
                              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                              </svg>
                            )}
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => unlockQueueItem(item.id, item.password)}
                          disabled={item.isUnlocking || !item.password}
                          className={`disabled:opacity-40 flex items-center gap-1.5 ${styles.unlockBtn}`}
                        >
                          {item.isUnlocking ? (
                            <>
                              <svg className="animate-spin" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor">
                                <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                                <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                              </svg>
                              {t.unlocking}
                            </>
                          ) : (
                            <>
                              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                                <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                              </svg>
                              {t.unlockBtn}
                            </>
                          )}
                        </button>
                      </div>

                      {item.passwordError && (
                        <span className="text-xs text-red-500 font-medium">
                          {item.passwordError}
                        </span>
                      )}
                    </div>
                  )}

                  {/* 進度條 */}
                  {item.status === 'compressing' && (
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-border-glass">
                      <div className="flex justify-between text-xs text-text-sub">
                        <span>{item.progressMsg || t.processing}</span>
                        <span className={`font-mono ${styles.accentText}`}>{item.progressPct || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-select-bg rounded-full overflow-hidden border border-border-glass">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                          style={{ width: `${item.progressPct || 0}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* 完成與下載列 */}
                  {item.status === 'done' && item.compressedBlob && (
                    <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs flex-wrap gap-2">
                      <div className={`flex items-center gap-2 font-medium ${styles.doneBadge}`}>
                        <span>{t.original} {formatBytes(item.size)}</span>
                        <span>➔</span>
                        <strong className="font-mono text-text-main font-bold">
                          {t.compressed} {formatBytes(item.compressedSize)}
                        </strong>
                        <span className={`font-bold px-2 py-0.5 rounded ${styles.savedTag}`}>
                          {t.saved(ratio.toString())}
                        </span>
                      </div>

                      <a
                        href={URL.createObjectURL(item.compressedBlob)}
                        download={`${item.name.replace(/\.pdf$/i, '')}_compressed.pdf`}
                        className="px-4 py-1.5 bg-emerald-500 text-black font-bold text-xs rounded-lg hover:bg-emerald-400 transition-all flex items-center gap-1.5"
                      >
                        <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                          <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                        </svg>
                        {t.downloadPdf}
                      </a>
                    </div>
                  )}

                  {/* 錯誤資訊 */}
                  {item.status === 'error' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-500">
                      {t.errorPrefix}{item.errorMsg || 'Error'}
                    </div>
                  )}

                  {/* 明細 Drawer */}
                  {item.showDetails && item.inspectData && item.inspectData.images.length > 0 && (
                    <div className={`mt-2 p-3 ${styles.innerBlock} overflow-x-auto`}>
                      <table className="w-full text-sm text-left">
                        <thead>
                          <tr className="border-b border-border-glass text-text-sub font-semibold">
                            <th className="p-2">{t.tableHeaderIdx}</th>
                            <th className="p-2">{t.tableHeaderDim}</th>
                            <th className="p-2">{t.tableHeaderFormat}</th>
                            <th className="p-2">{t.tableHeaderDecision}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.inspectData.images.map((img, idx) => (
                            <tr key={idx} className="border-b border-border-glass text-text-main">
                              <td className="p-2 font-mono">#{idx + 1}</td>
                              <td className="p-2 font-mono">{img.width} × {img.height}</td>
                              <td className="p-2">{img.filter || 'Raw'} ({img.colorSpace})</td>
                              <td className="p-2">
                                <span
                                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                    img.status === 'compressible'
                                      ? styles.statusCompressible
                                      : styles.statusProtected
                                  }`}
                                >
                                  {img.statusReason}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              );
            })}

            {/* 下方輕量新增卡片 Dropzone */}
            <div
              onClick={() => document.getElementById(fileInputId)?.click()}
              className={`p-6 rounded-2xl border border-dashed text-text-sub hover:text-text-main flex items-center justify-center gap-3 cursor-pointer ${styles.dropzone}`}
            >
              <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              <span className="text-sm font-semibold">{t.addMoreBottom}</span>
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

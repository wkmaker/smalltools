'use client';

import { useState, useEffect, useCallback, useId } from 'react';
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
  status: 'inspecting' | 'ready' | 'compressing' | 'done' | 'error';
  progressMsg?: string;
  progressPct?: number;
  compressedBlob: Blob | null;
  compressedSize: number;
  errorMsg?: string;
  showDetails?: boolean;
}

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

export default function PdfCompressorClient() {
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
      if (typeof window === 'undefined') return;
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
      showToast('請選擇正確的 PDF 格式檔案 (.pdf)');
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
    showToast(`成功新增 ${pdfFiles.length} 個 PDF 檔案，正在執行結構預檢...`);

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
      } catch (err) {
        console.error('預檢失敗:', err);
        setFileQueue((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'ready' } : it))
        );
      }
    }
  };

  const removeQueueItem = (id: string) => {
    setFileQueue((prev) => prev.filter((f) => f.id !== id));
    showToast('已移除指定檔案');
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
    showToast('正在執行 PDF 圖片深度壓縮與結構瘦身...');

    for (let i = 0; i < fileQueue.length; i++) {
      const item = fileQueue[i];
      if (item.status === 'done') continue;

      try {
        let buffer = item.buffer;
        if (!buffer) {
          buffer = await item.file.arrayBuffer();
        }

        setFileQueue((prev) =>
          prev.map((it) =>
            it.id === item.id
              ? { ...it, status: 'compressing', progressMsg: '開始解析結構...', progressPct: 15 }
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
          }
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
              ? { ...it, status: 'error', errorMsg: (err as Error).message || '壓縮處理失敗' }
              : it
          )
        );
      }
    }

    setIsCompressing(false);
    showToast('所有 PDF 檔案壓縮瘦身完成！');
  };

  // 一鍵 ZIP 打包下載
  const downloadAllAsZip = async () => {
    const completedItems = fileQueue.filter((f) => f.status === 'done' && f.compressedBlob);
    if (completedItems.length === 0) return;

    showToast('正在打包 ZIP 壓縮檔...');
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
    showToast('ZIP 打包下載完成！');
  };

  const hasCompleted = fileQueue.some((f) => f.status === 'done');

  return (
    <ToolLayout
      title="PDF 壓縮大師"
      subtitle="ONLINE PDF COMPRESSOR MASTER"
      description="專業免費的線上 PDF 壓縮大師！專針對 PDF 內嵌點陣圖片進行深度降採樣與瘦身，維持文字與向量 100% 原生無損清晰可複製。支援多檔批次壓縮與 ZIP 一鍵打包。"
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
          <div className="absolute inset-0 z-50 bg-[#eab308]/15 border-2 border-dashed border-[#eab308] rounded-3xl backdrop-blur-md flex flex-col items-center justify-center gap-3 text-white transition-all shadow-[0_0_50px_rgba(234,179,8,0.4)] pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-[#eab308] text-black flex items-center justify-center shadow-lg animate-bounce">
              <svg viewBox="0 0 24 24" width={32} height={32} fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">
              放開滑鼠以新增更多 PDF 檔案進行壓縮
            </span>
          </div>
        )}

        {/* 頂部頂級功能列 */}
        <div className="bg-black/20 border border-white/[.08] p-5 sm:p-6 rounded-2xl flex justify-between items-center flex-wrap gap-4 backdrop-blur-md shadow-lg">
          <div className="flex items-center gap-3">
            <span className="bg-[#eab308]/20 text-[#eab308] px-3 py-1 rounded-xl text-xs font-semibold border border-[#eab308]/30">
              100% 瀏覽器本機端運算
            </span>
            <span className="text-sm text-text-sub font-medium">
              {fileQueue.length === 0
                ? '請上傳 PDF 檔案開啟極速瘦身'
                : `已載入 ${fileQueue.length} 個 PDF 檔案`}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
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
              className="px-4 py-2 text-sm font-semibold text-[#eab308] bg-[#eab308]/10 border border-[#eab308]/30 rounded-xl hover:bg-[#eab308]/20 transition-all cursor-pointer disabled:opacity-30 flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              新增 PDF 檔案
            </button>

            {fileQueue.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={() => setFileQueue([])}
                  disabled={isCompressing}
                  className="px-4 py-2 text-sm font-semibold text-text-sub bg-white/5 border border-white/10 rounded-xl hover:bg-white/15 hover:text-white transition-all cursor-pointer disabled:opacity-30"
                >
                  清空佇列
                </button>
                <button
                  type="button"
                  onClick={startBatchCompression}
                  disabled={isCompressing}
                  className="px-6 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-black font-bold text-sm rounded-xl cursor-pointer hover:shadow-[0_0_25px_rgba(234,179,8,0.6)] transition-all disabled:opacity-40 flex items-center gap-2"
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  {isCompressing ? '壓縮處理中...' : '開始批次壓縮'}
                </button>
              </>
            )}

            {hasCompleted && fileQueue.length > 1 && (
              <button
                type="button"
                onClick={downloadAllAsZip}
                className="px-5 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold text-sm rounded-xl cursor-pointer hover:bg-emerald-500/30 transition-all flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                  <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
                </svg>
                打包 ZIP 下載
              </button>
            )}
          </div>
        </div>

        {/* 壓縮模式控制面板 */}
        <div className="bg-black/30 border border-white/[.08] p-6 rounded-2xl flex flex-col gap-4 backdrop-blur-md">
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-text-main">壓縮強度預設：</span>
              <div className="flex bg-black/40 p-1 rounded-xl border border-white/10 gap-1">
                <button
                  type="button"
                  onClick={() => applyModePreset('high')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    modePreset === 'high'
                      ? 'bg-[#eab308] text-black font-bold shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                      : 'text-text-sub hover:text-white'
                  }`}
                >
                  輕度 (微幅瘦身)
                </button>
                <button
                  type="button"
                  onClick={() => applyModePreset('medium')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    modePreset === 'medium'
                      ? 'bg-[#eab308] text-black font-bold shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                      : 'text-text-sub hover:text-white'
                  }`}
                >
                  平衡 (推薦 ~60%)
                </button>
                <button
                  type="button"
                  onClick={() => applyModePreset('low')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                    modePreset === 'low'
                      ? 'bg-[#eab308] text-black font-bold shadow-[0_0_10px_rgba(234,179,8,0.4)]'
                      : 'text-text-sub hover:text-white'
                  }`}
                >
                  極致 (~80% 瘦身)
                </button>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs font-semibold text-[#eab308] hover:underline cursor-pointer flex items-center gap-1"
            >
              {showAdvanced ? '隱藏進階參數 ▲' : '進階微調設定 ▼'}
            </button>
          </div>

          {showAdvanced && (
            <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-6 pt-4 border-t border-white/[.08]">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-sub">點陣圖片壓縮品質 (Quality)</span>
                  <span className="text-[#eab308] font-mono font-bold">
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
                <div className="flex justify-between text-xs">
                  <span className="text-text-sub font-medium">最大網點解析度 (Max DPI)</span>
                  <span className="text-[#eab308] font-mono font-bold">{maxDpi} DPI</span>
                </div>
                <select
                  value={maxDpi}
                  onChange={(e) => {
                    const dpi = parseInt(e.target.value, 10);
                    setMaxDpi(dpi);
                    syncToURL(modePreset, quality, dpi);
                  }}
                  className="bg-select-bg text-text-main text-xs font-medium rounded-xl p-2 border border-white/10 outline-none"
                >
                  <option value={96}>96 DPI (螢幕簡報/極輕巧)</option>
                  <option value={144}>144 DPI (推薦清晰標準)</option>
                  <option value={200}>200 DPI (高清列印等級)</option>
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
            <div className="w-18 h-18 rounded-3xl bg-[#eab308]/15 text-[#eab308] flex items-center justify-center border border-[#eab308]/30 shadow-[0_0_30px_rgba(234,179,8,0.2)]">
              <svg viewBox="0 0 24 24" width={32} height={32} fill="currentColor">
                <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-base font-bold text-text-main">
                點擊或將一至多個 PDF 檔案拖曳至此處
              </span>
              <span className="text-xs text-text-sub">
                支援多檔 PDF 批次處理，100% 瀏覽器本機端運算，零檔案上傳伺服器，隱私極致安全
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
                <div key={item.id} className="bg-black/30 border border-white/[.08] rounded-2xl p-5 backdrop-blur-md flex flex-col gap-3">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-xl bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/30 flex items-center justify-center shrink-0">
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
                          {item.inspectData && (
                            <span className="text-[11px] bg-[#eab308]/15 text-[#eab308] px-2 py-0.5 rounded-full border border-[#eab308]/30 font-medium">
                              預檢: {item.inspectData.totalImages} 張圖片 (估減 ~{item.inspectData.estRatio}%)
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
                          className="px-3 py-1.5 text-xs font-semibold text-text-sub bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all cursor-pointer flex items-center gap-1"
                        >
                          <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
                            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
                          </svg>
                          明細 {item.showDetails ? '▲' : '▼'}
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => removeQueueItem(item.id)}
                        disabled={isCompressing}
                        className="p-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-30"
                        title="移除檔案"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  {/* 進度條 */}
                  {item.status === 'compressing' && (
                    <div className="flex flex-col gap-1.5 pt-2 border-t border-white/[.06]">
                      <div className="flex justify-between text-xs text-text-sub">
                        <span>{item.progressMsg || '處理中...'}</span>
                        <span className="font-mono text-[#eab308]">{item.progressPct || 0}%</span>
                      </div>
                      <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden border border-white/10">
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
                      <div className="flex items-center gap-2 text-emerald-400 font-medium">
                        <span>原檔: {formatBytes(item.size)}</span>
                        <span>➔</span>
                        <strong className="font-mono text-white font-bold">
                          壓縮檔: {formatBytes(item.compressedSize)}
                        </strong>
                        <span className="text-emerald-300 font-bold bg-emerald-500/20 px-2 py-0.5 rounded">
                          (減小 {ratio}%)
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
                        下載壓縮檔 PDF
                      </a>
                    </div>
                  )}

                  {/* 錯誤資訊 */}
                  {item.status === 'error' && (
                    <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">
                      處理失敗：{item.errorMsg || '發生未知錯誤'}
                    </div>
                  )}

                  {/* 明細 Drawer */}
                  {item.showDetails && item.inspectData && item.inspectData.images.length > 0 && (
                    <div className="mt-2 p-3 bg-black/40 rounded-xl border border-white/10 overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="border-b border-white/10 text-text-sub">
                            <th className="p-1.5">#</th>
                            <th className="p-1.5">維度 (WxH)</th>
                            <th className="p-1.5">格式 / 色彩</th>
                            <th className="p-1.5">預檢決策與保護理由</th>
                          </tr>
                        </thead>
                        <tbody>
                          {item.inspectData.images.map((img, idx) => (
                            <tr key={idx} className="border-b border-white/[.04] text-text-main">
                              <td className="p-1.5 font-mono">#{idx + 1}</td>
                              <td className="p-1.5 font-mono">{img.width} × {img.height}</td>
                              <td className="p-1.5">{img.filter || 'Raw'} ({img.colorSpace})</td>
                              <td className="p-1.5">
                                <span
                                  className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                                    img.status === 'compressible'
                                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                                      : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
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
              className="p-6 rounded-2xl border border-dashed border-white/20 bg-black/20 hover:bg-[#eab308]/10 hover:border-[#eab308]/50 transition-all cursor-pointer flex items-center justify-center gap-3 text-text-sub hover:text-white"
            >
              <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className="text-[#eab308]">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              <span className="text-sm font-semibold">拖曳或點擊此處新增更多 PDF 檔案進行壓縮</span>
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm font-medium rounded-xl bg-[#eab308]/20 border border-[#eab308]/40 text-yellow-200 backdrop-blur-md shadow-lg z-50">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

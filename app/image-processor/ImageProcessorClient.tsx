'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import styles from './image-processor.module.css';

interface BatchItem {
  file: File;
  id: string;
  thumbUrl: string;
  estimatedSize: number | null;
  status: 'pending' | 'processing' | 'done' | 'error';
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 簡單輕量純前端 PKZip Builder (免外加 heavy dependencies)
function createSimpleZip(files: { name: string; data: Uint8Array }[]): Blob {
  const parts: Uint8Array[] = [];
  const cdEntries: Uint8Array[] = [];
  let offset = 0;

  files.forEach((f) => {
    const nameBytes = new TextEncoder().encode(f.name);
    const date = new Date();
    const dosTime =
      (date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1);
    const dosDate =
      ((date.getFullYear() - 1980) << 9) |
      ((date.getMonth() + 1) << 5) |
      date.getDate();

    // CRC32 計算
    let crc = 0xffffffff;
    for (let i = 0; i < f.data.length; i++) {
      crc ^= f.data[i];
      for (let j = 0; j < 8; j++) {
        crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
      }
    }
    crc = (crc ^ 0xffffffff) >>> 0;

    // Local Header
    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);
    view.setUint32(0, 0x04034b50, true); // Local header signature
    view.setUint16(4, 20, true); // Version needed
    view.setUint16(6, 0, true); // Flags
    view.setUint16(8, 0, true); // Compression (Store)
    view.setUint16(10, dosTime, true);
    view.setUint16(12, dosDate, true);
    view.setUint32(14, crc, true);
    view.setUint32(18, f.data.length, true); // Compressed size
    view.setUint32(22, f.data.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true);
    view.setUint16(28, 0, true); // Extra length
    localHeader.set(nameBytes, 30);

    parts.push(localHeader);
    parts.push(f.data);

    // Central Directory Entry
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
    cdView.setUint16(32, 0, true);
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

  // End of Central Directory
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

export default function ImageProcessorClient() {
  const [isMounted, setIsMounted] = useState<boolean>(false);

  // 檔案與模式狀態
  const [files, setFiles] = useState<File[]>([]);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);

  // 單圖狀態
  const [singleImgElement, setSingleImgElement] = useState<HTMLImageElement | null>(null);
  const [origWidth, setOrigWidth] = useState<number>(0);
  const [origHeight, setOrigHeight] = useState<number>(0);

  // 控制參數
  const [format, setFormat] = useState<'image/webp' | 'image/jpeg' | 'image/png'>('image/webp');
  const [quality, setQuality] = useState<number>(0.85);
  const [keepAspect, setKeepAspect] = useState<boolean>(true);
  const [scalePercent, setScalePercent] = useState<number>(100);

  const [targetWidth, setTargetWidth] = useState<number>(0);
  const [targetHeight, setTargetHeight] = useState<number>(0);

  // Transform 旋轉與翻轉
  const [rotation, setRotation] = useState<number>(0); // 0, 90, 180, 270
  const [flipH, setFlipH] = useState<boolean>(false);
  const [flipV, setFlipV] = useState<boolean>(false);
  const [aspectPreset, setAspectPreset] = useState<'free' | '1:1' | '4:3' | '16:9'>('free');

  // 雙圖比對與統計狀態
  const [compSliderPos, setCompSliderPos] = useState<number>(50);
  const [beforeDataUrl, setBeforeDataUrl] = useState<string>('');
  const [afterDataUrl, setAfterDataUrl] = useState<string>('');
  const [processedSize, setProcessedSize] = useState<number>(0);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  // Toast 提示
  const [toast, setToast] = useState<string>('');

  // HTML IDs
  const fileInputId = useId();
  const formatSelectId = useId();
  const widthInputId = useId();
  const heightInputId = useId();
  const keepAspectId = useId();

  // 初始化主題顏色與 URL 讀取
  useEffect(() => {
    setIsMounted(true);
    document.documentElement.style.setProperty('--theme-color', '#d946ef');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(217, 70, 239, 0.6)');

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const f = params.get('f');
      if (f === 'jpeg' || f === 'png' || f === 'webp') {
        setFormat(f === 'jpeg' ? 'image/jpeg' : f === 'png' ? 'image/png' : 'image/webp');
      }
      const q = params.get('q');
      if (q) {
        const parsedQ = parseFloat(q);
        if (!isNaN(parsedQ) && parsedQ >= 0.05 && parsedQ <= 1) setQuality(parsedQ);
      }
      const l = params.get('l');
      if (l !== null) setKeepAspect(l === '1');
      const s = params.get('s');
      if (s) {
        const parsedS = parseInt(s, 10);
        if (!isNaN(parsedS) && parsedS >= 10 && parsedS <= 100) setScalePercent(parsedS);
      }
    }
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // URL 參數寫入與複製
  const syncToURL = useCallback(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();
    params.set('f', format === 'image/jpeg' ? 'jpeg' : format === 'image/png' ? 'png' : 'webp');
    params.set('q', quality.toString());
    params.set('l', keepAspect ? '1' : '0');
    params.set('s', scalePercent.toString());
    window.history.replaceState(null, '', '?' + params.toString());
  }, [format, quality, keepAspect, scalePercent]);

  const copyConfigLink = () => {
    syncToURL();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('已成功複製配置連結！');
    }
  };

  // 載入多檔或單檔圖片
  const handleFilesLoad = (fileList: FileList | File[]) => {
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast('未偵測到有效的圖片檔案');
      return;
    }

    setFiles(validFiles);
    if (validFiles.length > 1) {
      setIsBatchMode(true);
      const items: BatchItem[] = validFiles.map((file, idx) => ({
        file,
        id: `b_${idx}_${Date.now()}`,
        thumbUrl: URL.createObjectURL(file),
        estimatedSize: null,
        status: 'pending',
      }));
      setBatchItems(items);
    } else {
      setIsBatchMode(false);
      const file = validFiles[0];
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setSingleImgElement(img);
          setOrigWidth(img.width);
          setOrigHeight(img.height);
          setTargetWidth(img.width);
          setTargetHeight(img.height);
          setRotation(0);
          setFlipH(false);
          setFlipV(false);
        };
        img.src = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  // 寬度手動變更
  const handleWidthChange = (val: number) => {
    setTargetWidth(val);
    if (keepAspect && origWidth > 0) {
      setTargetHeight(Math.round((val / origWidth) * origHeight));
    }
  };

  // 高度手動變更
  const handleHeightChange = (val: number) => {
    setTargetHeight(val);
    if (keepAspect && origHeight > 0) {
      setTargetWidth(Math.round((val / origHeight) * origWidth));
    }
  };

  // 百分比縮放 Slider 變更
  const handleScalePercentChange = (pct: number) => {
    setScalePercent(pct);
    if (origWidth > 0 && origHeight > 0) {
      setTargetWidth(Math.round((origWidth * pct) / 100));
      setTargetHeight(Math.round((origHeight * pct) / 100));
    }
  };

  // 比例 Preset 按鈕處理
  const applyAspectPreset = (preset: 'free' | '1:1' | '4:3' | '16:9') => {
    setAspectPreset(preset);
    if (preset === 'free' || origWidth === 0) return;

    let ratio = 1;
    if (preset === '1:1') ratio = 1;
    if (preset === '4:3') ratio = 4 / 3;
    if (preset === '16:9') ratio = 16 / 9;

    const newH = Math.round(targetWidth / ratio);
    setTargetHeight(newH);
  };

  // 核心圖片 Canvas 繪製處理 (含旋轉與翻轉)
  const renderProcessedCanvas = useCallback(
    (img: HTMLImageElement, w: number, h: number) => {
      const isRotated = rotation === 90 || rotation === 270;
      const canvasW = isRotated ? h : w;
      const canvasH = isRotated ? w : h;

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.save();
      ctx.translate(canvasW / 2, canvasH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      ctx.drawImage(img, -w / 2, -h / 2, w, h);
      ctx.restore();

      return canvas;
    },
    [rotation, flipH, flipV]
  );

  // 單圖即時渲染與對比更新
  const updateSinglePreview = useCallback(() => {
    if (!singleImgElement || targetWidth <= 0 || targetHeight <= 0) return;

    const canvas = renderProcessedCanvas(singleImgElement, targetWidth, targetHeight);
    const dataUrl = canvas.toDataURL(format, quality);
    setAfterDataUrl(dataUrl);

    // 計算 Base64 檔案大小
    const head = `data:${format};base64,`;
    const sizeInBytes = Math.round(((dataUrl.length - head.length) * 3) / 4);
    setProcessedSize(sizeInBytes);

    // 原圖預覽 DataURL
    const origCanvas = document.createElement('canvas');
    origCanvas.width = singleImgElement.width;
    origCanvas.height = singleImgElement.height;
    const oCtx = origCanvas.getContext('2d');
    if (oCtx) {
      oCtx.drawImage(singleImgElement, 0, 0);
      setBeforeDataUrl(origCanvas.toDataURL('image/png'));
    }
  }, [singleImgElement, targetWidth, targetHeight, format, quality, renderProcessedCanvas]);

  useEffect(() => {
    if (!isBatchMode) {
      updateSinglePreview();
    }
  }, [isBatchMode, updateSinglePreview]);

  // 單圖下載處理
  const downloadSingleImage = () => {
    if (!afterDataUrl || !files[0]) return;
    const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = files[0].name.substring(0, files[0].name.lastIndexOf('.')) || files[0].name;
    const link = document.createElement('a');
    link.href = afterDataUrl;
    link.download = `${baseName}_processed.${ext}`;
    link.click();
    showToast('已開始下載處理後的圖片！');
  };

  // 下載原始裁切大小 (強行放大警告專用)
  const downloadOriginalSizeImage = () => {
    if (!singleImgElement || !files[0]) return;
    const canvas = renderProcessedCanvas(singleImgElement, origWidth, origHeight);
    const dataUrl = canvas.toDataURL(format, quality);
    const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = files[0].name.substring(0, files[0].name.lastIndexOf('.')) || files[0].name;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${baseName}_original_${origWidth}x${origHeight}.${ext}`;
    link.click();
    showToast('已開始下載原始解析度圖片！');
  };

  // 多圖批次一鍵 ZIP 打包下載
  const downloadBatchZip = async () => {
    if (batchItems.length === 0) return;
    setIsProcessing(true);

    try {
      const processedFiles: { name: string; data: Uint8Array }[] = [];
      const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';

      for (let i = 0; i < batchItems.length; i++) {
        const item = batchItems[i];
        setBatchItems((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'processing' } : it))
        );

        const img = new Image();
        await new Promise<void>((resolve) => {
          img.onload = () => resolve();
          img.src = item.thumbUrl;
        });

        const w = targetWidth > 0 ? targetWidth : Math.round((img.width * scalePercent) / 100);
        const h = targetHeight > 0 ? targetHeight : Math.round((img.height * scalePercent) / 100);

        const canvas = renderProcessedCanvas(img, w, h);
        const dataUrl = canvas.toDataURL(format, quality);
        const base64Data = dataUrl.split(',')[1];
        const binaryStr = atob(base64Data);
        const bytes = new Uint8Array(binaryStr.length);
        for (let b = 0; b < binaryStr.length; b++) {
          bytes[b] = binaryStr.charCodeAt(b);
        }

        const baseName = item.file.name.substring(0, item.file.name.lastIndexOf('.')) || item.file.name;
        processedFiles.push({
          name: `${baseName}_processed.${ext}`,
          data: bytes,
        });

        setBatchItems((prev) =>
          prev.map((it, idx) => (idx === i ? { ...it, status: 'done' } : it))
        );
      }

      const zipBlob = createSimpleZip(processedFiles);
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `imagecraft_batch_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(zipUrl), 5000);

      showToast('批次打包 ZIP 下載完成！');
    } catch (err) {
      showToast('批次處理失敗：' + (err as Error).message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isUpscaled = targetWidth > origWidth || targetHeight > origHeight;
  const savingRate =
    files[0] && processedSize > 0
      ? Math.round(((files[0].size - processedSize) / files[0].size) * 100)
      : 0;

  return (
    <ToolLayout
      title="萬能圖片處理大師"
      subtitle="UNIVERSAL IMAGE PROCESSOR"
      description="專業免費的線上萬能圖片處理工具！支援圖片裁切、旋轉翻轉、尺寸等比例縮放、品質壓縮轉檔 (PNG/JPG/WebP)、左右滑動即時比對與多檔 ZIP 批次打包。"
      accentColor="#d946ef"
      accentGlow="rgba(217, 70, 239, 0.6)"
    >
      <div className="flex flex-col gap-8 text-left w-full px-4 max-sm:px-0">
        {/* 頂部控制與分享橫幅 */}
        <div className="bg-gradient-to-r from-purple-900 via-fuchsia-800 to-pink-800 rounded-2xl p-3.5 sm:px-6 sm:py-3 text-white flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 shadow-lg min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 max-w-full overflow-hidden">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide shrink-0">
              萬能圖片編輯
            </span>
            <span className="text-xs sm:text-sm font-medium min-w-0 truncate">
              {files.length === 0
                ? '請上傳圖片開啟處理大師'
                : isBatchMode
                ? `已選取 ${files.length} 張圖片 (多檔批次模式)`
                : `編輯中：${files[0].name} (${origWidth}×${origHeight} px)`}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 justify-end min-w-0">
            <button
              type="button"
              onClick={copyConfigLink}
              className="px-3 py-1.5 text-xs font-medium bg-white/20 border border-white/40 rounded-xl hover:bg-white/30 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
              </svg>
              複製配置連結
            </button>
            {files.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  setSingleImgElement(null);
                  setBatchItems([]);
                }}
                className="px-3 py-1.5 text-xs font-bold bg-white/10 text-pink-200 border border-pink-300/30 rounded-xl hover:bg-white/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                重新上傳
              </button>
            )}
          </div>
        </div>

        {/* 檔案上傳 Dropzone */}
        {files.length === 0 ? (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              if (e.dataTransfer.files.length > 0) handleFilesLoad(e.dataTransfer.files);
            }}
            onClick={() => document.getElementById(fileInputId)?.click()}
            className={`p-14 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer text-center ${styles.dropzone}`}
          >
            <input
              id={fileInputId}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFilesLoad(e.target.files)}
            />
            <div className="w-20 h-20 rounded-3xl bg-[#d946ef]/15 text-[#d946ef] flex items-center justify-center border border-[#d946ef]/30 shadow-[0_0_30px_rgba(217,70,239,0.2)]">
              <svg viewBox="0 0 24 24" width={36} height={36} fill="currentColor" className="text-[#d946ef]">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-lg font-bold text-white">拖曳單個或多個圖片至此，或點擊選擇檔案</span>
              <span className="text-xs text-text-sub">
                支援 PNG, JPG, WebP, GIF, SVG, AVIF 等格式 | 支援多檔批次打包 ZIP 導出
              </span>
            </div>
          </div>
        ) : (
          /* 主 Layout (兩欄式) */
          <div className="grid grid-cols-[1.1fr_1fr] gap-8 max-lg:grid-cols-1 items-start">
            {/* 左欄：設定與控制面板 */}
            <div className="bg-black/20 border border-white/[.08] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg backdrop-blur-md">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-white/[.06] pb-3">
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="text-[#d946ef] shrink-0">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
                圖片輸出與壓縮設定
              </h3>

              {/* 輸出格式 */}
              <div className="flex flex-col gap-2 text-left">
                <label htmlFor={formatSelectId} className="text-sm font-medium text-text-sub">
                  輸出圖片格式
                </label>
                <select
                  id={formatSelectId}
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'image/webp' | 'image/jpeg' | 'image/png')}
                  className="bg-select-bg text-text-main border border-border-glass rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer"
                >
                  <option value="image/webp">WebP (推薦：高壓縮率與高畫質)</option>
                  <option value="image/jpeg">JPEG (標準相片格式)</option>
                  <option value="image/png">PNG (無損 / 支援透明背景)</option>
                </select>
              </div>

              {/* 壓縮品質 */}
              {format !== 'image/png' && (
                <div className="flex flex-col gap-2 text-left">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-text-sub">壓縮品質 (Quality)</span>
                    <span className="text-[#d946ef] font-mono font-bold text-sm">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    className="accent-[#d946ef] cursor-pointer h-2 bg-black/40 rounded-lg"
                  />
                </div>
              )}

              {/* Transform 旋轉與翻轉 */}
              {!isBatchMode && (
                <div className="flex flex-col gap-3 border-t border-white/[.06] pt-4 text-left">
                  <span className="text-sm font-medium text-text-sub">旋轉與翻轉工具列</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setRotation((prev) => (prev + 270) % 360)}
                      className="px-3 py-1.5 text-sm font-medium bg-white/5 border border-white/15 text-text-sub rounded-lg hover:bg-[#d946ef]/20 hover:border-[#d946ef]/40 hover:text-[#d946ef] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                        <path d="M7.11 8.53L5.7 7.11C4.04 8.77 3 11.01 3 13.5 3 18.2 6.8 22 11.5 22S20 18.2 20 13.5C20 8.8 16.2 5 11.5 5c-2.49 0-4.73 1.04-6.39 2.71L3.7 6.3V11h4.7L7.11 8.53z" />
                      </svg>
                      左旋 90°
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="px-3 py-1.5 text-sm font-medium bg-white/5 border border-white/15 text-text-sub rounded-lg hover:bg-[#d946ef]/20 hover:border-[#d946ef]/40 hover:text-[#d946ef] transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                        <path d="M16.89 8.53L18.3 7.11C19.96 8.77 21 11.01 21 13.5 21 18.2 17.2 22 12.5 22S4 18.2 4 13.5C4 8.8 7.8 5 12.5 5c2.49 0 4.73 1.04 6.39 2.71L20.3 6.3V11h-4.7l1.29-2.47z" />
                      </svg>
                      右旋 90°
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipH(!flipH)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        flipH
                          ? 'bg-[#d946ef]/20 border-[#d946ef]/50 text-[#d946ef]'
                          : 'bg-white/5 border-white/15 text-text-sub hover:text-white'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                        <path d="M15 21h2v-2h-2v2zm4-12h2V7h-2v2zM3 5v14c0 1.1.9 2 2 2h4v-2H5V5h4V3H5c-1.1 0-2 .9-2 2zm16-2v2h2c0-1.1-.9-2-2-2zm-4 18h2v-2h-2v2zm4-4h2v-2h-2v2zm0-4h2v-2h-2v2zm-4-8h2V3h-2v2z" />
                      </svg>
                      水平翻轉
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipV(!flipV)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        flipV
                          ? 'bg-[#d946ef]/20 border-[#d946ef]/50 text-[#d946ef]'
                          : 'bg-white/5 border-white/15 text-text-sub hover:text-white'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                        <path d="M5 15v2h14v-2H5zM3 5v4h2V5h14v4h2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm16 14H5v-4H3v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4h-2v4z" />
                      </svg>
                      垂直翻轉
                    </button>
                  </div>
                </div>
              )}

              {/* 尺寸調整與比例 Preset */}
              <div className="flex flex-col gap-4 border-t border-white/[.06] pt-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-text-sub">目標解析度 (px)</span>
                  <label htmlFor={keepAspectId} className="flex items-center gap-2 text-xs font-medium text-text-sub cursor-pointer">
                    <input
                      id={keepAspectId}
                      type="checkbox"
                      checked={keepAspect}
                      onChange={(e) => setKeepAspect(e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer accent-[#d946ef]"
                    />
                    保持等比例
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={widthInputId} className="text-sm font-medium text-text-sub">
                      寬度 (W)
                    </label>
                    <input
                      id={widthInputId}
                      type="number"
                      value={targetWidth || ''}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-black/40 border border-white/[.12] text-white px-3.5 py-2 rounded-xl text-sm outline-none focus:border-[#d946ef] font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor={heightInputId} className="text-sm font-medium text-text-sub">
                      高度 (H)
                    </label>
                    <input
                      id={heightInputId}
                      type="number"
                      value={targetHeight || ''}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-black/40 border border-white/[.12] text-white px-3.5 py-2 rounded-xl text-sm outline-none focus:border-[#d946ef] font-mono"
                    />
                  </div>
                </div>

                {/* 比例 Preset 按鈕 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-sub">比例預設:</span>
                  {(['free', '1:1', '4:3', '16:9'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyAspectPreset(p)}
                      className={`px-2.5 py-1 text-sm rounded-lg border transition-all cursor-pointer font-medium ${
                        aspectPreset === p
                          ? 'bg-[#d946ef]/20 border-[#d946ef]/50 text-[#d946ef]'
                          : 'bg-white/5 border-white/10 text-text-sub hover:text-white'
                      }`}
                    >
                      {p === 'free' ? '自由' : p}
                    </button>
                  ))}
                </div>

                {/* 按百分比縮放 */}
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-text-sub font-semibold">依百分比縮放</span>
                    <span className="text-[#d946ef] font-mono font-bold text-xs">
                      {scalePercent}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={scalePercent}
                    onChange={(e) => handleScalePercentChange(parseInt(e.target.value, 10))}
                    className="accent-[#d946ef] cursor-pointer h-2 bg-black/40 rounded-lg"
                  />
                </div>
              </div>

              {/* 統計與節省率 */}
              {!isBatchMode && files[0] && (
                <div className="grid grid-cols-2 gap-3 bg-black/30 border border-white/10 rounded-xl p-4 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-text-sub">原始大小</span>
                    <span className="font-mono font-bold text-white">{formatBytes(files[0].size)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-text-sub">處理後預估</span>
                    <span className="font-mono font-bold text-[#d946ef]">{formatBytes(processedSize)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-text-sub">解析度</span>
                    <span className="font-mono font-bold text-white">
                      {targetWidth} × {targetHeight} px
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-text-sub">空間節省率</span>
                    <span className="font-mono font-bold text-emerald-400">
                      {savingRate > 0 ? `-${savingRate}%` : '0%'}
                    </span>
                  </div>
                </div>
              )}

              {/* 強行放大模糊警告 */}
              {!isBatchMode && isUpscaled && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-2 text-left">
                  <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="shrink-0">
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                    裁切/目標像素 ({targetWidth}×{targetHeight}) 大於原圖 ({origWidth}×{origHeight})，放大可能導致模糊。
                  </div>
                  <button
                    type="button"
                    onClick={downloadOriginalSizeImage}
                    className="w-full py-2 text-xs font-bold text-black bg-amber-400 rounded-lg hover:bg-amber-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                    下載原始解析度圖 ({origWidth} × {origHeight} px)
                  </button>
                </div>
              )}

              {/* 下載按鈕 */}
              {isBatchMode ? (
                <button
                  type="button"
                  onClick={downloadBatchZip}
                  disabled={isProcessing}
                  className="w-full h-[52px] bg-[#d946ef]/20 border border-[#d946ef]/50 text-[#d946ef] font-bold text-base rounded-xl cursor-pointer hover:bg-[#d946ef] hover:text-[#030305] hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  {isProcessing ? (
                    <>
                      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="animate-spin shrink-0">
                        <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8z" />
                      </svg>
                      批次打包中...
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="shrink-0">
                        <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
                      </svg>
                      批次壓縮並一鍵下載 ZIP
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={downloadSingleImage}
                  className="w-full h-[52px] bg-[#d946ef]/20 border border-[#d946ef]/50 text-[#d946ef] font-bold text-base rounded-xl cursor-pointer hover:bg-[#d946ef] hover:text-[#030305] hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all flex items-center justify-center gap-2"
                >
                  <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="shrink-0">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  下載處理後的圖片
                </button>
              )}
            </div>

            {/* 右欄：預覽區（單圖對比器 / 多圖批次清單） */}
            <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg backdrop-blur-md">
              {isBatchMode ? (
                /* 多圖批次清單 */
                <div className="flex flex-col gap-4 text-left">
                  <div className="flex justify-between items-center border-b border-white/[.06] pb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="text-[#d946ef] shrink-0">
                        <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
                      </svg>
                      批次處理圖檔列表
                    </h4>
                    <span className="text-xs text-slate-400">共 {batchItems.length} 張圖片</span>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                    {batchItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 bg-black/40 p-3 rounded-xl border border-white/5"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.thumbUrl}
                            alt={item.file.name}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-white/10 shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-white truncate">{item.file.name}</span>
                            <span className="text-[0.7rem] font-mono text-text-sub">
                              {formatBytes(item.file.size)}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                            item.status === 'done'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : item.status === 'processing'
                              ? 'bg-[#d946ef]/10 text-[#d946ef] border-[#d946ef]/30 animate-pulse'
                              : 'bg-white/5 text-text-sub border-white/10'
                          }`}
                        >
                          {item.status === 'done' ? (
                            <span className="flex items-center gap-1">
                              <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                              完成
                            </span>
                          ) : item.status === 'processing' ? (
                            <span className="flex items-center gap-1">
                              <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" className="animate-spin">
                                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8z" />
                              </svg>
                              處理中
                            </span>
                          ) : (
                            '排隊中'
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* 左右滑動雙圖即時比對器 */
                <div className="flex flex-col gap-4 text-left">
                  <div className="flex justify-between items-center border-b border-white/[.06] pb-3">
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="text-[#d946ef] shrink-0">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                      壓縮品質即時比對 (拖曳中間拉條)
                    </h4>
                  </div>

                  <div className={styles.comparisonContainer}>
                    {/* 原圖 */}
                    {beforeDataUrl && (
                      <img src={beforeDataUrl} alt="原圖" className={`${styles.compImg} ${styles.compImgBefore}`} />
                    )}
                    {/* 處理後圖 (帶 clip-path) */}
                    {afterDataUrl && (
                      <img
                        src={afterDataUrl}
                        alt="處理後"
                        className={`${styles.compImg} ${styles.compImgAfter}`}
                        style={{ clipPath: `inset(0 0 0 ${compSliderPos}%)` }}
                      />
                    )}

                    {/* 分割線與按鈕 */}
                    <div className={styles.compSeparator} style={{ left: `${compSliderPos}%` }} />
                    <div className={styles.compButton} style={{ left: `${compSliderPos}%` }}>
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                        <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />
                      </svg>
                    </div>

                    {/* 標籤 */}
                    <div className={`${styles.compLabel} ${styles.compLabelBefore}`}>原圖</div>
                    <div className={`${styles.compLabel} ${styles.compLabelAfter}`}>處理後 (壓縮)</div>

                    {/* 拖曳輸入條 */}
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={compSliderPos}
                      onChange={(e) => setCompSliderPos(parseFloat(e.target.value))}
                      className={styles.compSlider}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {toast && (
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-8 sm:bottom-8 px-6 py-3 text-sm font-medium rounded-xl bg-[#d946ef]/20 border border-[#d946ef]/40 text-[#d946ef] backdrop-blur-md shadow-lg z-50 flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}


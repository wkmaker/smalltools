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

      showToast('🎉 批次打包 ZIP 下載完成！');
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
        <div className="bg-gradient-to-r from-purple-900 via-fuchsia-800 to-pink-800 rounded-2xl px-6 py-3 text-white flex justify-between items-center flex-wrap gap-4 shadow-lg">
          <div className="flex items-center gap-3">
            <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide">
              萬能圖片編輯
            </span>
            <span className="text-sm font-medium">
              {files.length === 0
                ? '請上傳圖片開啟處理大師'
                : isBatchMode
                ? `已選取 ${files.length} 張圖片 (多檔批次模式)`
                : `編輯中：${files[0].name} (${origWidth}×${origHeight} px)`}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={copyConfigLink}
              className="px-3 py-1.5 text-xs font-medium bg-white/20 border border-white/40 rounded-xl hover:bg-white/30 transition-all cursor-pointer"
            >
              🔗 複製配置連結
            </button>
            {files.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  setSingleImgElement(null);
                  setBatchItems([]);
                }}
                className="px-3 py-1.5 text-xs font-bold bg-white/10 text-pink-200 border border-pink-300/30 rounded-xl hover:bg-white/20 transition-all cursor-pointer"
              >
                🗑️ 重新上傳
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
            <div className="w-20 h-20 rounded-3xl bg-[#d946ef]/15 text-[#d946ef] flex items-center justify-center text-3xl font-bold border border-[#d946ef]/30 shadow-[0_0_30px_rgba(217,70,239,0.2)]">
              📷
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
                ⚙️ 圖片輸出與壓縮設定
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
                      className="px-3 py-1.5 text-sm font-medium bg-white/5 border border-white/15 text-text-sub rounded-lg hover:bg-[#d946ef]/20 hover:border-[#d946ef]/40 hover:text-[#d946ef] transition-all cursor-pointer"
                    >
                      ↺ 左旋 90°
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="px-3 py-1.5 text-sm font-medium bg-white/5 border border-white/15 text-text-sub rounded-lg hover:bg-[#d946ef]/20 hover:border-[#d946ef]/40 hover:text-[#d946ef] transition-all cursor-pointer"
                    >
                      ↻ 右旋 90°
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipH(!flipH)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
                        flipH
                          ? 'bg-[#d946ef]/20 border-[#d946ef]/50 text-[#d946ef]'
                          : 'bg-white/5 border-white/15 text-text-sub hover:text-white'
                      }`}
                    >
                      ⇄ 水平翻轉
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipV(!flipV)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all cursor-pointer ${
                        flipV
                          ? 'bg-[#d946ef]/20 border-[#d946ef]/50 text-[#d946ef]'
                          : 'bg-white/5 border-white/15 text-text-sub hover:text-white'
                      }`}
                    >
                      ⇅ 垂直翻轉
                    </button>
                  </div>
                </div>
              )}

              {/* 尺寸調整與比例 Preset */}
              <div className="flex flex-col gap-4 border-t border-white/[.06] pt-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-text-sub">目標解析度 (px)</span>
                  <label className="flex items-center gap-2 text-xs font-medium text-text-sub cursor-pointer">
                    <input
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
                    <span className="text-text-sub font-semibold">原始大小</span>
                    <span className="font-mono font-bold text-white">{formatBytes(files[0].size)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-sub font-semibold">處理後預估</span>
                    <span className="font-mono font-bold text-[#d946ef]">{formatBytes(processedSize)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-sub font-semibold">解析度</span>
                    <span className="font-mono font-bold text-white">
                      {targetWidth} × {targetHeight} px
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-text-sub font-semibold">空間節省率</span>
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
                    ⚠️ 裁切/目標像素 ({targetWidth}×{targetHeight}) 大於原圖 ({origWidth}×{origHeight})，放大可能導致模糊。
                  </div>
                  <button
                    type="button"
                    onClick={downloadOriginalSizeImage}
                    className="w-full py-2 text-xs font-bold text-black bg-amber-400 rounded-lg hover:bg-amber-300 transition-all cursor-pointer"
                  >
                    ⬇️ 下載原始解析度圖 ({origWidth} × {origHeight} px)
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
                  {isProcessing ? '⚡ 批次打包中...' : '📦 批次壓縮並一鍵下載 ZIP'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={downloadSingleImage}
                  className="w-full h-[52px] bg-[#d946ef]/20 border border-[#d946ef]/50 text-[#d946ef] font-bold text-base rounded-xl cursor-pointer hover:bg-[#d946ef] hover:text-[#030305] hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all flex items-center justify-center gap-2"
                >
                  ⬇️ 下載處理後的圖片
                </button>
              )}
            </div>

            {/* 右欄：預覽區（單圖對比器 / 多圖批次清單） */}
            <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-lg backdrop-blur-md">
              {isBatchMode ? (
                /* 多圖批次清單 */
                <div className="flex flex-col gap-4 text-left">
                  <div className="flex justify-between items-center border-b border-white/[.06] pb-3">
                    <h4 className="text-sm font-bold text-white">📦 批次處理圖檔列表</h4>
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
                          {item.status === 'done'
                            ? '✅ 完成'
                            : item.status === 'processing'
                            ? '⏳ 處理中'
                            : '排隊中'}
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
                      👁️ 壓縮品質即時比對 (拖曳中間拉條)
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
                      ⟷
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
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm font-medium rounded-xl bg-[#d946ef]/20 border border-[#d946ef]/40 text-[#d946ef] backdrop-blur-md shadow-lg z-50">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

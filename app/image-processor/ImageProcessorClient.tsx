'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import IdbRestoreBanner from '../components/IdbRestoreBanner';
import styles from './image-processor.module.css';
import { createSimpleZip } from './utils/zipBuilder';
import { safeLoadImage, renderProcessedCanvas } from './utils/canvasProcessor';
import { formatBytes } from '../utils/formatBytes';
import { downloadBlob } from '../utils/downloadBlob';
import { safeIdb } from '../utils/idb';
import { calculateBatchDimensions } from './engine';
import { TRANSLATIONS } from './translations';
import ImageWorkspaceHeader from './components/ImageWorkspaceHeader';
import ImageDropzone from './components/ImageDropzone';
import ImageControlPanel from './components/ImageControlPanel';
import BatchImageList, { BatchItem } from './components/BatchImageList';
import SingleImagePreview from './components/SingleImagePreview';

interface ImageProcessorClientProps {
  lang?: 'zh-TW' | 'en';
}

const IMG_IDB_NAMESPACE = 'image-processor';
const IMG_IDB_KEY = 'last_workspace_v1';
const IMG_IDB_TTL_MS = 24 * 60 * 60 * 1000;
const IMG_IDB_MAX_BYTES = 50 * 1024 * 1024;
const IMG_IDB_MAX_COUNT = 15;

interface CachedImageItem {
  blob: Blob;
  name: string;
  type: string;
  lastModified: number;
}

export default function ImageProcessorClient({ lang = 'zh-TW' }: ImageProcessorClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  // 全域 Drag & Drop Overlay 狀態
  const [isDraggingGlobal, setIsDraggingGlobal] = useState<boolean>(false);
  const dragCounterRef = useRef<number>(0);

  // 檔案與模式狀態
  const [files, setFiles] = useState<File[]>([]);
  const [cachedWorkspace, setCachedWorkspace] = useState<CachedImageItem[]>([]);
  const [isBatchMode, setIsBatchMode] = useState<boolean>(false);
  const [batchItems, setBatchItems] = useState<BatchItem[]>([]);
  const batchItemsRef = useRef<BatchItem[]>([]);
  // Commit 後再同步 Ref，避免 Render 期間變異 Ref（違反 React 純函式渲染）
  useEffect(() => {
    batchItemsRef.current = batchItems;
  }, [batchItems]);

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
  const [rotation, setRotation] = useState<number>(0);
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

  // 初始化主題顏色與 URL 讀取
  useEffect(() => {
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

    let active = true;
    void safeIdb.get<CachedImageItem[]>(IMG_IDB_NAMESPACE, IMG_IDB_KEY).then((saved) => {
      if (!active || !Array.isArray(saved) || saved.length === 0) return;
      const valid = saved.filter(
        (it) => it && it.blob instanceof Blob && typeof it.name === 'string'
      );
      if (valid.length > 0) setCachedWorkspace(valid);
    });
    return () => {
      active = false;
    };
  }, []);

  const persistFilesToIdb = (nextFiles: File[]) => {
    const slice = nextFiles.slice(0, IMG_IDB_MAX_COUNT);
    const totalBytes = slice.reduce((acc, f) => acc + f.size, 0);
    if (slice.length === 0 || totalBytes > IMG_IDB_MAX_BYTES) return;
    const payload: CachedImageItem[] = slice.map((f) => ({
      blob: f,
      name: f.name,
      type: f.type || 'image/png',
      lastModified: f.lastModified || Date.now(),
    }));
    setCachedWorkspace(payload);
    void safeIdb.set(IMG_IDB_NAMESPACE, IMG_IDB_KEY, payload, { ttlMs: IMG_IDB_TTL_MS });
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  // 載入多檔或單檔圖片
  const handleFilesLoad = (fileList: FileList | File[], append: boolean = false) => {
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast(t.noValidImg);
      return;
    }

    const acceptedFiles: File[] = [];
    for (const f of validFiles) {
      if (f.size > 50 * 1024 * 1024) {
        showToast(t.fileTooLarge(f.name));
      } else {
        acceptedFiles.push(f);
      }
    }
    if (acceptedFiles.length === 0) return;

    if (append && files.length > 0) {
      const combined = [...files, ...acceptedFiles];
      setFiles(combined);
      persistFilesToIdb(combined);
      setIsBatchMode(true);

      const appendItems: BatchItem[] = acceptedFiles.map((file, idx) => ({
        file,
        id: `b_${files.length + idx}_${file.name}_${Date.now()}`,
        thumbUrl: URL.createObjectURL(file),
        estimatedSize: null,
        status: 'pending',
      }));
      setBatchItems((prev) => [...prev, ...appendItems]);
      showToast(lang === 'en' ? `Appended ${validFiles.length} new images` : `已追加 ${validFiles.length} 張新圖片`);
    } else {
      // 替換前先釋放既有的 thumbUrl，避免記憶體洩漏
      batchItemsRef.current.forEach((item) => {
        if (item.thumbUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.thumbUrl);
        }
      });
      setFiles(acceptedFiles);
      persistFilesToIdb(acceptedFiles);
      if (acceptedFiles.length > 1) {
        setIsBatchMode(true);
        const items: BatchItem[] = acceptedFiles.map((file, idx) => ({
          file,
          id: `b_${idx}_${Date.now()}`,
          thumbUrl: URL.createObjectURL(file),
          estimatedSize: null,
          status: 'pending',
        }));
        setBatchItems(items);
      } else {
        setIsBatchMode(false);
        const file = acceptedFiles[0];
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
            if (e.target?.result) {
              setBeforeDataUrl(e.target.result as string);
            }
          };
          img.onerror = () => {
            showToast(lang === 'en' ? 'Failed to decode image data' : '圖片解碼失敗，格式可能不受支援');
          };
          img.src = e.target?.result as string;
        };
        reader.onerror = () => {
          showToast(lang === 'en' ? 'Failed to read image file' : '圖片讀取失敗');
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // 全域 Drag & Drop 監聽
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current += 1;
      if (e.dataTransfer?.types?.includes('Files')) {
        setIsDraggingGlobal(true);
      }
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current -= 1;
      if (dragCounterRef.current === 0) {
        setIsDraggingGlobal(false);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDrop = (e: DragEvent) => {
      dragCounterRef.current = 0;
      setIsDraggingGlobal(false);
      // 落在頁內拖放區時，該區 onDrop 已載入檔案並 preventDefault；冒泡到 window 不可再載入一次
      if (e.defaultPrevented) return;
      e.preventDefault();
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        handleFilesLoad(e.dataTransfer.files, files.length > 0);
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [files]);

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
      showToast(t.copiedConfig);
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

  // 組件 Unmount 時釋放所有殘留的 Blob Object URLs
  useEffect(() => {
    return () => {
      batchItemsRef.current.forEach((item) => {
        if (item.thumbUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.thumbUrl);
        }
      });
    };
  }, []);

  const previewDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 單圖即時渲染與對比更新 (消除重複計算原圖 DataURL 與加入防抖)
  const updateSinglePreview = useCallback(() => {
    if (!singleImgElement || targetWidth <= 0 || targetHeight <= 0) return;

    const canvas = renderProcessedCanvas(singleImgElement, targetWidth, targetHeight, {
      rotation,
      flipH,
      flipV,
    });
    const dataUrl = canvas.toDataURL(format, quality);
    setAfterDataUrl(dataUrl);

    // 計算 Base64 檔案大小
    const head = `data:${format};base64,`;
    const sizeInBytes = Math.round(((dataUrl.length - head.length) * 3) / 4);
    setProcessedSize(sizeInBytes);
  }, [singleImgElement, targetWidth, targetHeight, format, quality, rotation, flipH, flipV]);

  useEffect(() => {
    if (isBatchMode || !singleImgElement || targetWidth <= 0 || targetHeight <= 0) return;

    if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    previewDebounceRef.current = setTimeout(() => {
      updateSinglePreview();
    }, 120);

    return () => {
      if (previewDebounceRef.current) clearTimeout(previewDebounceRef.current);
    };
  }, [isBatchMode, singleImgElement, targetWidth, targetHeight, format, quality, updateSinglePreview]);

  // 單圖下載處理
  const downloadSingleImage = () => {
    if (!afterDataUrl || !files[0]) return;
    const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = files[0].name.substring(0, files[0].name.lastIndexOf('.')) || files[0].name;
    const link = document.createElement('a');
    link.href = afterDataUrl;
    link.download = `${baseName}_processed.${ext}`;
    link.click();
    showToast(t.singleDownloaded);
  };

  // 下載原始解析度圖片
  const downloadOriginalSizeImage = () => {
    if (!singleImgElement || !files[0]) return;
    const canvas = renderProcessedCanvas(singleImgElement, origWidth, origHeight, {
      rotation,
      flipH,
      flipV,
    });
    const dataUrl = canvas.toDataURL(format, quality);
    const ext = format === 'image/webp' ? 'webp' : format === 'image/jpeg' ? 'jpg' : 'png';
    const baseName = files[0].name.substring(0, files[0].name.lastIndexOf('.')) || files[0].name;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${baseName}_original_${origWidth}x${origHeight}.${ext}`;
    link.click();
    showToast(t.origDownloaded);
  };

  // 多圖批次一鍵 ZIP 打包下載 (含 Yielding 時間片與防護機制)
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

        // 時間片釋放 (Yielding Chunk to Main Thread)
        await new Promise((r) => setTimeout(r, 0));

        let img: HTMLImageElement;
        try {
          img = await safeLoadImage(item.thumbUrl);
        } catch (err) {
          console.error('[ImageProcessor] Failed to load image item:', item.file.name, err);
          setBatchItems((prev) =>
            prev.map((it, idx) => (idx === i ? { ...it, status: 'error' } : it))
          );
          continue;
        }

        const { w, h } = calculateBatchDimensions(
          img.width,
          img.height,
          targetWidth,
          targetHeight,
          scalePercent,
          keepAspect
        );

        const canvas = renderProcessedCanvas(img, w, h, { rotation, flipH, flipV });
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

      if (processedFiles.length === 0) {
        showToast(t.zipFailed(t.noValidImgForZip));
        return;
      }

      const zipBlob = createSimpleZip(processedFiles);
      downloadBlob(zipBlob, `imagecraft_batch_${Date.now()}.zip`, 100);

      showToast(t.zipCompleted);
    } catch (err) {
      console.error('[ImageProcessor] Failed to create batch ZIP:', err);
      showToast(t.zipFailed((err as Error).message));
    } finally {
      setIsProcessing(false);
    }
  };

  const resetWorkspace = () => {
    batchItemsRef.current.forEach((item) => {
      if (item.thumbUrl.startsWith('blob:')) {
        URL.revokeObjectURL(item.thumbUrl);
      }
    });
    setFiles([]);
    setSingleImgElement(null);
    setBatchItems([]);
  };

  const isUpscaled = targetWidth > origWidth || targetHeight > origHeight;
  const savingRate =
    files[0] && processedSize > 0
      ? Math.round(((files[0].size - processedSize) / files[0].size) * 100)
      : 0;

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#d946ef"
      accentGlow="rgba(217, 70, 239, 0.6)"
    >
      {/* 全域拖曳浮層 Overlay */}
      {isDraggingGlobal && (
        <div className={styles.dragOverlay}>
          <div className="w-20 h-20 rounded-3xl bg-[#d946ef]/20 text-[#d946ef] flex items-center justify-center border border-[#d946ef]/40 shadow-2xl">
            <svg viewBox="0 0 24 24" width={40} height={40} fill="currentColor">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
            </svg>
          </div>
          <span className="text-xl font-bold text-text-main">{t.globalDragOverlay}</span>
        </div>
      )}

      <div className="flex flex-col gap-8 text-left w-full px-4 max-sm:px-0">
        {/* 頂部控制與語系切換橫幅 */}
        <ImageWorkspaceHeader
          filesCount={files.length}
          firstFileName={files[0]?.name || ''}
          isBatchMode={isBatchMode}
          origWidth={origWidth}
          origHeight={origHeight}
          onCopyConfigLink={copyConfigLink}
          onResetWorkspace={resetWorkspace}
          t={t}
        />

        {/* 初始檔案上傳 Dropzone */}
        {files.length === 0 && cachedWorkspace.length > 0 && (
          <IdbRestoreBanner
            title={t.cachedWorkspaceTitle}
            description={t.cachedWorkspaceDesc(
              cachedWorkspace.length,
              formatBytes(cachedWorkspace.reduce((acc, it) => acc + it.blob.size, 0))
            )}
            restoreLabel={t.restoreCachedBtn}
            onRestore={() => {
              const restoredFiles = cachedWorkspace.map(
                (it) => new File([it.blob], it.name, { type: it.type, lastModified: it.lastModified })
              );
              handleFilesLoad(restoredFiles, false);
            }}
            clearLabel={t.clearCachedBtn}
            onClear={() => {
              setCachedWorkspace([]);
              void safeIdb.remove(IMG_IDB_NAMESPACE, IMG_IDB_KEY);
            }}
          />
        )}

        {files.length === 0 ? (
          <ImageDropzone onFilesLoad={(fileList) => handleFilesLoad(fileList)} t={t} />
        ) : (
          /* 主 Layout (兩欄式) */
          <div className="grid grid-cols-[1.1fr_1fr] gap-8 max-lg:grid-cols-1 items-start">
            {/* 左欄：設定與控制面板 */}
            <ImageControlPanel
              format={format}
              onFormatChange={setFormat}
              quality={quality}
              onQualityChange={setQuality}
              isBatchMode={isBatchMode}
              onRotateLeft={() => setRotation((prev) => (prev + 270) % 360)}
              onRotateRight={() => setRotation((prev) => (prev + 90) % 360)}
              flipH={flipH}
              onToggleFlipH={() => setFlipH(!flipH)}
              flipV={flipV}
              onToggleFlipV={() => setFlipV(!flipV)}
              keepAspect={keepAspect}
              onKeepAspectChange={setKeepAspect}
              targetWidth={targetWidth}
              onWidthChange={handleWidthChange}
              targetHeight={targetHeight}
              onHeightChange={handleHeightChange}
              aspectPreset={aspectPreset}
              onApplyAspectPreset={applyAspectPreset}
              scalePercent={scalePercent}
              onScalePercentChange={handleScalePercentChange}
              firstFile={files[0]}
              origWidth={origWidth}
              origHeight={origHeight}
              processedSize={processedSize}
              savingRate={savingRate}
              isUpscaled={isUpscaled}
              onDownloadOriginalSize={downloadOriginalSizeImage}
              onAppendFiles={(fileList) => handleFilesLoad(fileList, true)}
              isProcessing={isProcessing}
              onDownloadBatchZip={downloadBatchZip}
              onDownloadSingle={downloadSingleImage}
              t={t}
            />

            {/* 右欄：預覽區（單圖對比器 / 多圖批次清單） */}
            <div className="bg-surface-glass border border-border-glass rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-[var(--glass-shadow)] backdrop-blur-[24px]">
              {isBatchMode ? (
                <BatchImageList batchItems={batchItems} t={t} />
              ) : (
                <SingleImagePreview
                  beforeDataUrl={beforeDataUrl}
                  afterDataUrl={afterDataUrl}
                  compSliderPos={compSliderPos}
                  onSliderPosChange={setCompSliderPos}
                  t={t}
                />
              )}
            </div>
          </div>
        )}

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection
            title={t.faqTitle}
            subtitle={t.faqSubtitle}
            items={t.faqItems}
            accentColor="#d946ef"
          />
        </div>
      </div>

      {toast && (
        <div className={styles.toastNotification}>
          <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

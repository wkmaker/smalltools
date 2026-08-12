'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import styles from './image-processor.module.css';

interface BatchItem {
  file: File;
  id: string;
  thumbUrl: string;
  estimatedSize: number | null;
  status: 'pending' | 'processing' | 'done' | 'error';
}

interface ImageProcessorClientProps {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: '萬能圖片處理大師',
    subtitle: 'UNIVERSAL IMAGE PROCESSOR',
    description:
      '專業免費的線上萬能圖片處理工具！支援圖片裁切、旋轉翻轉、尺寸等比例縮放、品質壓縮轉檔 (PNG/JPG/WebP)、左右滑動即時比對與多檔 ZIP 批次打包。',
    tagline: '萬能圖片編輯',
    uploadPrompt: '請上傳圖片開啟處理大師',
    selectedMulti: (count: number) => `已選取 ${count} 張圖片 (多檔批次模式)`,
    editingSingle: (name: string, w: number, h: number) => `編輯中：${name} (${w}×${h} px)`,
    copyConfig: '複製配置連結',
    copiedConfig: '已成功複製配置連結！',
    reupload: '重新上傳',
    dropzoneTitle: '拖曳單個或多個圖片至此，或點擊選擇檔案',
    dropzoneSub: '支援 PNG, JPG, WebP, GIF, SVG, AVIF 等格式 | 支援多檔批次打包 ZIP 導出',
    appendDropzone: '拖曳追加新圖片至此，或點擊開啟',
    globalDragOverlay: '釋放滑鼠以載入圖片...',
    outputSettings: '圖片輸出與壓縮設定',
    outputFormat: '輸出圖片格式',
    quality: '壓縮品質 (Quality)',
    transformTools: '旋轉與翻轉工具列',
    rotateLeft: '左旋 90°',
    rotateRight: '右旋 90°',
    flipH: '水平翻轉',
    flipV: '垂直翻轉',
    targetRes: '目標解析度 (px)',
    keepAspect: '保持等比例',
    widthLabel: '寬度 (W)',
    heightLabel: '高度 (H)',
    aspectPreset: '比例預設:',
    free: '自由',
    scalePct: '依百分比縮放',
    origSize: '原始大小',
    estSize: '處理後預估',
    res: '解析度',
    savingRate: '空間節省率',
    upscaleWarn: (tw: number, th: number, ow: number, oh: number) =>
      `裁切/目標像素 (${tw}×${th}) 大於原圖 (${ow}×${oh})，放大可能導致模糊。`,
    downloadOrig: (ow: number, oh: number) => `下載原始解析度圖 (${ow} × ${oh} px)`,
    downloadSingleBtn: '下載處理後的圖片',
    batchZipBtn: '批次壓縮並一鍵下載 ZIP',
    batchProcessing: '批次打包中...',
    batchListTitle: '批次處理圖檔列表',
    totalImages: (count: number) => `共 ${count} 張圖片`,
    statusDone: '完成',
    statusProcessing: '處理中',
    statusPending: '排隊中',
    compTitle: '壓縮品質即時比對 (拖曳中間拉條)',
    compBefore: '原圖',
    compAfter: '處理後 (壓縮)',
    noValidImg: '未偵測到有效的圖片檔案',
    singleDownloaded: '已開始下載處理後的圖片！',
    origDownloaded: '已開始下載原始解析度圖片！',
    zipCompleted: '批次打包 ZIP 下載完成！',
    zipFailed: (msg: string) => `批次處理失敗：${msg}`,
    langBtn: 'English',
    srQuality: '壓縮品質滑塊',
    srScale: '縮放百分比滑塊',
    srComp: '左右比對位置滑塊',
  },
  en: {
    title: 'Universal Image Processor',
    subtitle: 'UNIVERSAL IMAGE PROCESSOR',
    description:
      'Free online image processing tool! Supports cropping, flipping, resizing, quality compression (PNG/JPG/WebP), side-by-side comparison slider, and multi-file batch ZIP download.',
    tagline: 'Universal Image Editor',
    uploadPrompt: 'Upload images to start processing',
    selectedMulti: (count: number) => `${count} images selected (Batch Mode)`,
    editingSingle: (name: string, w: number, h: number) => `Editing: ${name} (${w}×${h} px)`,
    copyConfig: 'Copy Config Link',
    copiedConfig: 'Configuration link copied!',
    reupload: 'Re-upload',
    dropzoneTitle: 'Drag & drop single or multiple images here, or click to browse',
    dropzoneSub: 'Supports PNG, JPG, WebP, GIF, SVG, AVIF | Batch ZIP export supported',
    appendDropzone: 'Drag & drop to append more images, or click to browse',
    globalDragOverlay: 'Drop mouse to load images...',
    outputSettings: 'Output & Compression Settings',
    outputFormat: 'Output Format',
    quality: 'Compression Quality',
    transformTools: 'Rotation & Flip Controls',
    rotateLeft: 'Rotate Left 90°',
    rotateRight: 'Rotate Right 90°',
    flipH: 'Flip Horizontal',
    flipV: 'Flip Vertical',
    targetRes: 'Target Resolution (px)',
    keepAspect: 'Maintain Aspect Ratio',
    widthLabel: 'Width (W)',
    heightLabel: 'Height (H)',
    aspectPreset: 'Aspect Preset:',
    free: 'Free',
    scalePct: 'Scale by Percentage',
    origSize: 'Original Size',
    estSize: 'Estimated Processed Size',
    res: 'Resolution',
    savingRate: 'Space Saved',
    upscaleWarn: (tw: number, th: number, ow: number, oh: number) =>
      `Target resolution (${tw}×${th}) exceeds original (${ow}×${oh}); upscaling may cause blurriness.`,
    downloadOrig: (ow: number, oh: number) => `Download Original (${ow} × ${oh} px)`,
    downloadSingleBtn: 'Download Processed Image',
    batchZipBtn: 'Batch Compress & Download ZIP',
    batchProcessing: 'Packaging ZIP...',
    batchListTitle: 'Batch Files List',
    totalImages: (count: number) => `${count} images total`,
    statusDone: 'Done',
    statusProcessing: 'Processing',
    statusPending: 'Queued',
    compTitle: 'Quality Comparison (Drag slider)',
    compBefore: 'Original',
    compAfter: 'Processed',
    noValidImg: 'No valid image files detected',
    singleDownloaded: 'Processed image download started!',
    origDownloaded: 'Original image download started!',
    zipCompleted: 'Batch ZIP download completed!',
    zipFailed: (msg: string) => `Batch processing failed: ${msg}`,
    langBtn: '繁體中文',
    srQuality: 'Compression Quality Slider',
    srScale: 'Scale Percentage Slider',
    srComp: 'Comparison Slider Position',
  },
};

import { createSimpleZip } from './utils/zipBuilder';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

const safeLoadImage = (src: string, timeoutMs = 10000): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const timer = setTimeout(() => {
      img.src = '';
      reject(new Error('圖片載入逾時'));
    }, timeoutMs);

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };
    img.onerror = () => {
      clearTimeout(timer);
      reject(new Error('無法載入圖片或圖檔已毀損'));
    };
    img.src = src;
  });
};

const calculateBatchDimensions = (
  imgW: number,
  imgH: number,
  targetW: number,
  targetH: number,
  scalePct: number,
  keepAspectRatio: boolean
) => {
  if (targetW > 0 && targetH > 0) {
    return { w: targetW, h: targetH };
  }
  if (targetW > 0 && keepAspectRatio && imgW > 0) {
    return { w: targetW, h: Math.max(1, Math.round((targetW / imgW) * imgH)) };
  }
  if (targetH > 0 && keepAspectRatio && imgH > 0) {
    return { w: Math.max(1, Math.round((targetH / imgH) * imgW)), h: targetH };
  }
  return {
    w: Math.max(1, Math.round((imgW * scalePct) / 100)),
    h: Math.max(1, Math.round((imgH * scalePct) / 100)),
  };
};

export default function ImageProcessorClient({ lang = 'zh-TW' }: ImageProcessorClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  const [isMounted, setIsMounted] = useState<boolean>(false);

  // 全域 Drag & Drop Overlay 狀態
  const [isDraggingGlobal, setIsDraggingGlobal] = useState<boolean>(false);
  const dragCounterRef = useRef<number>(0);

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

  // HTML IDs for W3C Accessibility
  const fileInputId = useId();
  const appendFileInputId = useId();
  const formatSelectId = useId();
  const widthInputId = useId();
  const heightInputId = useId();
  const keepAspectId = useId();
  const qualityRangeId = useId();
  const scaleRangeId = useId();
  const compRangeId = useId();

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

  // 載入多檔或單檔圖片
  const handleFilesLoad = (fileList: FileList | File[], append: boolean = false) => {
    const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
    if (validFiles.length === 0) {
      showToast(t.noValidImg);
      return;
    }

    if (append && files.length > 0) {
      const combined = [...files, ...validFiles];
      setFiles(combined);
      setIsBatchMode(true);

      const newItems: BatchItem[] = combined.map((file, idx) => ({
        file,
        id: `b_${idx}_${file.name}_${Date.now()}`,
        thumbUrl: URL.createObjectURL(file),
        estimatedSize: null,
        status: 'pending',
      }));
      setBatchItems(newItems);
      showToast(lang === 'en' ? `Appended ${validFiles.length} new images` : `已追加 ${validFiles.length} 張新圖片`);
    } else {
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
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDraggingGlobal(false);
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

  // 釋放 Blob Object URLs
  useEffect(() => {
    return () => {
      batchItems.forEach((item) => {
        if (item.thumbUrl.startsWith('blob:')) {
          URL.revokeObjectURL(item.thumbUrl);
        }
      });
    };
  }, [batchItems]);

  // 核心圖片 Canvas 繪製處理 (含旋轉、翻轉與最大像素安全限制)
  const renderProcessedCanvas = useCallback(
    (img: HTMLImageElement, w: number, h: number) => {
      const MAX_PIXELS = 16777216; // 16MP 防爆框/溢出防護
      const currentPixels = w * h;
      let finalW = w;
      let finalH = h;
      if (currentPixels > MAX_PIXELS && currentPixels > 0) {
        const ratio = Math.sqrt(MAX_PIXELS / currentPixels);
        finalW = Math.floor(w * ratio);
        finalH = Math.floor(h * ratio);
      }

      const isRotated = rotation === 90 || rotation === 270;
      const canvasW = isRotated ? finalH : finalW;
      const canvasH = isRotated ? finalW : finalH;

      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, canvasW);
      canvas.height = Math.max(1, canvasH);
      const ctx = canvas.getContext('2d');
      if (!ctx) return canvas;

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      ctx.save();
      ctx.translate(canvasW / 2, canvasH / 2);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);

      ctx.drawImage(img, -finalW / 2, -finalH / 2, finalW, finalH);
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
    showToast(t.singleDownloaded);
  };

  // 下載原始解析度圖片
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
        } catch {
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

      if (processedFiles.length === 0) {
        showToast(t.zipFailed('無有效圖片可供打包'));
        return;
      }

      const zipBlob = createSimpleZip(processedFiles);
      const zipUrl = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `imagecraft_batch_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      requestAnimationFrame(() => URL.revokeObjectURL(zipUrl));

      showToast(t.zipCompleted);
    } catch (err) {
      showToast(t.zipFailed((err as Error).message));
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
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#d946ef"
      accentGlow="rgba(217, 70, 239, 0.6)"
      extraHeaderControls={
        <Link
          href={lang === 'en' ? '/image-processor/' : '/image-processor/en/'}
          className="text-sm font-medium px-3 py-1.5 rounded-xl bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
        >
          {t.langBtn}
        </Link>
      }
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
        <div className="bg-surface-glass border border-border-glass rounded-2xl p-3.5 sm:px-6 sm:py-3 text-text-main flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 shadow-[var(--glass-shadow)] min-w-0">
          <div className="flex items-center gap-2.5 min-w-0 max-w-full overflow-hidden">
            <span className="bg-[#d946ef]/15 text-[#d946ef] border border-[#d946ef]/30 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide shrink-0">
              {t.tagline}
            </span>
            <span className="text-xs sm:text-sm font-medium text-text-main min-w-0 truncate">
              {files.length === 0
                ? t.uploadPrompt
                : isBatchMode
                ? t.selectedMulti(files.length)
                : t.editingSingle(files[0].name, origWidth, origHeight)}
            </span>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 justify-end min-w-0">
            <button
              type="button"
              onClick={copyConfigLink}
              className="px-3 py-1.5 text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
              </svg>
              {t.copyConfig}
            </button>

            {files.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setFiles([]);
                  setSingleImgElement(null);
                  setBatchItems([]);
                }}
                className="px-3 py-1.5 text-xs font-bold bg-[#d946ef]/10 text-[#d946ef] border border-[#d946ef]/30 rounded-xl hover:bg-[#d946ef]/20 transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
              >
                <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                {t.reupload}
              </button>
            )}
          </div>
        </div>

        {/* 初始檔案上傳 Dropzone */}
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
              <span className="text-lg font-bold text-text-main">{t.dropzoneTitle}</span>
              <span className="text-xs text-text-sub">{t.dropzoneSub}</span>
            </div>
          </div>
        ) : (
          /* 主 Layout (兩欄式) */
          <div className="grid grid-cols-[1.1fr_1fr] gap-8 max-lg:grid-cols-1 items-start">
            {/* 左欄：設定與控制面板 */}
            <div className="bg-surface-glass border border-border-glass rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-[var(--glass-shadow)] backdrop-blur-[24px]">
              <h3 className="text-sm font-bold text-text-main flex items-center gap-2 border-b border-border-glass pb-3">
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="text-[#d946ef] shrink-0">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
                </svg>
                {t.outputSettings}
              </h3>

              {/* 輸出格式 */}
              <div className="flex flex-col gap-2 text-left">
                <label htmlFor={formatSelectId} className="text-sm font-medium text-text-sub">
                  {t.outputFormat}
                </label>
                <select
                  id={formatSelectId}
                  value={format}
                  onChange={(e) => setFormat(e.target.value as 'image/webp' | 'image/jpeg' | 'image/png')}
                  className="bg-select-bg text-text-main border border-border-glass rounded-xl px-4 py-2.5 text-sm outline-none cursor-pointer"
                >
                  <option value="image/webp">WebP (WebP)</option>
                  <option value="image/jpeg">JPEG (JPG)</option>
                  <option value="image/png">PNG (PNG)</option>
                </select>
              </div>

              {/* 壓縮品質 */}
              {format !== 'image/png' && (
                <div className="flex flex-col gap-2 text-left">
                  <div className="flex justify-between items-center">
                    <label htmlFor={qualityRangeId} className="text-sm font-medium text-text-sub">
                      {t.quality}
                    </label>
                    <span className="text-[#d946ef] font-mono font-bold text-sm">
                      {Math.round(quality * 100)}%
                    </span>
                  </div>
                  <input
                    id={qualityRangeId}
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={quality}
                    onChange={(e) => setQuality(parseFloat(e.target.value))}
                    aria-label={t.srQuality}
                    className="accent-[#d946ef] cursor-pointer h-2 bg-select-bg rounded-lg border border-border-glass"
                  />
                </div>
              )}

              {/* Transform 旋轉與翻轉 */}
              {!isBatchMode && (
                <div className="flex flex-col gap-3 border-t border-border-glass pt-4 text-left">
                  <span className="text-sm font-medium text-text-sub">{t.transformTools}</span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setRotation((prev) => (prev + 270) % 360)}
                      className="px-3 py-1.5 text-sm font-medium bg-select-bg border border-border-glass text-text-sub rounded-lg hover:bg-[#d946ef]/20 hover:border-[#d946ef]/40 hover:text-text-main transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                        <path d="M7.11 8.53L5.7 7.11C4.04 8.77 3 11.01 3 13.5 3 18.2 6.8 22 11.5 22S20 18.2 20 13.5C20 8.8 16.2 5 11.5 5c-2.49 0-4.73 1.04-6.39 2.71L3.7 6.3V11h4.7L7.11 8.53z" />
                      </svg>
                      {t.rotateLeft}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRotation((prev) => (prev + 90) % 360)}
                      className="px-3 py-1.5 text-sm font-medium bg-select-bg border border-border-glass text-text-sub rounded-lg hover:bg-[#d946ef]/20 hover:border-[#d946ef]/40 hover:text-text-main transition-all cursor-pointer flex items-center gap-1.5"
                    >
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                        <path d="M16.89 8.53L18.3 7.11C19.96 8.77 21 11.01 21 13.5 21 18.2 17.2 22 12.5 22S4 18.2 4 13.5C4 8.8 7.8 5 12.5 5c2.49 0 4.73 1.04 6.39 2.71L20.3 6.3V11h-4.7l1.29-2.47z" />
                      </svg>
                      {t.rotateRight}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipH(!flipH)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        flipH
                          ? 'bg-[#d946ef]/20 border-[#d946ef]/50 text-[#d946ef]'
                          : 'bg-select-bg border-border-glass text-text-sub hover:text-text-main'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                        <path d="M15 21h2v-2h-2v2zm4-12h2V7h-2v2zM3 5v14c0 1.1.9 2 2 2h4v-2H5V5h4V3H5c-1.1 0-2 .9-2 2zm16-2v2h2c0-1.1-.9-2-2-2zm-4 18h2v-2h-2v2zm4-4h2v-2h-2v2zm0-4h2v-2h-2v2zm-4-8h2V3h-2v2z" />
                      </svg>
                      {t.flipH}
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlipV(!flipV)}
                      className={`px-3 py-1.5 text-sm font-medium rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                        flipV
                          ? 'bg-[#d946ef]/20 border-[#d946ef]/50 text-[#d946ef]'
                          : 'bg-select-bg border-border-glass text-text-sub hover:text-text-main'
                      }`}
                    >
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                        <path d="M5 15v2h14v-2H5zM3 5v4h2V5h14v4h2V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2zm16 14H5v-4H3v4c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-4h-2v4z" />
                      </svg>
                      {t.flipV}
                    </button>
                  </div>
                </div>
              )}

              {/* 尺寸調整與比例 Preset */}
              <div className="flex flex-col gap-4 border-t border-border-glass pt-4 text-left">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-text-sub">{t.targetRes}</span>
                  <label htmlFor={keepAspectId} className="flex items-center gap-2 text-xs font-medium text-text-sub cursor-pointer">
                    <input
                      id={keepAspectId}
                      type="checkbox"
                      checked={keepAspect}
                      onChange={(e) => setKeepAspect(e.target.checked)}
                      className="w-4 h-4 rounded cursor-pointer accent-[#d946ef]"
                    />
                    {t.keepAspect}
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label htmlFor={widthInputId} className="text-sm font-medium text-text-sub">
                      {t.widthLabel}
                    </label>
                    <input
                      id={widthInputId}
                      type="number"
                      value={targetWidth || ''}
                      onChange={(e) => handleWidthChange(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-select-bg border border-border-glass text-text-main px-3.5 py-2 rounded-xl text-sm outline-none focus:border-[#d946ef] font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label htmlFor={heightInputId} className="text-sm font-medium text-text-sub">
                      {t.heightLabel}
                    </label>
                    <input
                      id={heightInputId}
                      type="number"
                      value={targetHeight || ''}
                      onChange={(e) => handleHeightChange(parseInt(e.target.value, 10) || 0)}
                      className="w-full bg-select-bg border border-border-glass text-text-main px-3.5 py-2 rounded-xl text-sm outline-none focus:border-[#d946ef] font-mono"
                    />
                  </div>
                </div>

                {/* 比例 Preset 按鈕 */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-text-sub">{t.aspectPreset}</span>
                  {(['free', '1:1', '4:3', '16:9'] as const).map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => applyAspectPreset(p)}
                      className={`px-2.5 py-1 text-sm rounded-lg border transition-all cursor-pointer font-medium ${
                        aspectPreset === p
                          ? 'bg-[#d946ef]/20 border-[#d946ef]/50 text-[#d946ef]'
                          : 'bg-select-bg border-border-glass text-text-sub hover:text-text-main'
                      }`}
                    >
                      {p === 'free' ? t.free : p}
                    </button>
                  ))}
                </div>

                {/* 按百分比縮放 */}
                <div className="flex flex-col gap-2 mt-1">
                  <div className="flex justify-between items-center">
                    <label htmlFor={scaleRangeId} className="text-xs text-text-sub font-semibold">
                      {t.scalePct}
                    </label>
                    <span className="text-[#d946ef] font-mono font-bold text-xs">
                      {scalePercent}%
                    </span>
                  </div>
                  <input
                    id={scaleRangeId}
                    type="range"
                    min="10"
                    max="100"
                    step="5"
                    value={scalePercent}
                    onChange={(e) => handleScalePercentChange(parseInt(e.target.value, 10))}
                    aria-label={t.srScale}
                    className="accent-[#d946ef] cursor-pointer h-2 bg-select-bg rounded-lg border border-border-glass"
                  />
                </div>
              </div>

              {/* 統計與節省率 */}
              {!isBatchMode && files[0] && (
                <div className="grid grid-cols-2 gap-3 bg-select-bg border border-border-glass rounded-xl p-4 text-xs">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-text-sub">{t.origSize}</span>
                    <span className="font-mono font-bold text-text-main">{formatBytes(files[0].size)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-text-sub">{t.estSize}</span>
                    <span className="font-mono font-bold text-[#d946ef]">{formatBytes(processedSize)}</span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-text-sub">{t.res}</span>
                    <span className="font-mono font-bold text-text-main">
                      {targetWidth} × {targetHeight} px
                    </span>
                  </div>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-semibold text-text-sub">{t.savingRate}</span>
                    <span className="font-mono font-bold text-emerald-500 dark:text-emerald-400">
                      {savingRate > 0 ? `-${savingRate}%` : '0%'}
                    </span>
                  </div>
                </div>
              )}

              {/* 強行放大模糊警告 */}
              {!isBatchMode && isUpscaled && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-2 text-left">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="shrink-0">
                      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                    {t.upscaleWarn(targetWidth, targetHeight, origWidth, origHeight)}
                  </div>
                  <button
                    type="button"
                    onClick={downloadOriginalSizeImage}
                    className="w-full py-2 text-xs font-bold text-slate-900 bg-amber-400 rounded-lg hover:bg-amber-300 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                      <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                    </svg>
                    {t.downloadOrig(origWidth, origHeight)}
                  </button>
                </div>
              )}

              {/* 追加圖片 Dropzone（持續性 Dropzone UX） */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  if (e.dataTransfer.files.length > 0) handleFilesLoad(e.dataTransfer.files, true);
                }}
                onClick={() => document.getElementById(appendFileInputId)?.click()}
                className={`p-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-center ${styles.miniDropzone}`}
              >
                <input
                  id={appendFileInputId}
                  type="file"
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={(e) => e.target.files && handleFilesLoad(e.target.files, true)}
                />
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="text-[#d946ef] shrink-0">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
                <span className="text-xs font-semibold text-text-sub hover:text-text-main">
                  {t.appendDropzone}
                </span>
              </div>

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
                      {t.batchProcessing}
                    </>
                  ) : (
                    <>
                      <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="shrink-0">
                        <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
                      </svg>
                      {t.batchZipBtn}
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
                  {t.downloadSingleBtn}
                </button>
              )}
            </div>

            {/* 右欄：預覽區（單圖對比器 / 多圖批次清單） */}
            <div className="bg-surface-glass border border-border-glass rounded-2xl p-6 sm:p-8 flex flex-col gap-6 shadow-[var(--glass-shadow)] backdrop-blur-[24px]">
              {isBatchMode ? (
                /* 多圖批次清單 */
                <div className="flex flex-col gap-4 text-left">
                  <div className="flex justify-between items-center border-b border-border-glass pb-3">
                    <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                      <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="text-[#d946ef] shrink-0">
                        <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
                      </svg>
                      {t.batchListTitle}
                    </h4>
                    <span className="text-xs text-text-sub">{t.totalImages(batchItems.length)}</span>
                  </div>

                  <div className="flex flex-col gap-3 max-h-[480px] overflow-y-auto pr-1">
                    {batchItems.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-3 bg-select-bg p-3 rounded-xl border border-border-glass"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <img
                            src={item.thumbUrl}
                            alt={item.file.name}
                            className="w-12 h-12 rounded-lg object-cover bg-slate-900 border border-border-glass shrink-0"
                          />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-semibold text-text-main truncate">{item.file.name}</span>
                            <span className="text-[0.7rem] font-mono text-text-sub">
                              {formatBytes(item.file.size)}
                            </span>
                          </div>
                        </div>

                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-lg border ${
                            item.status === 'done'
                              ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border-emerald-500/30'
                              : item.status === 'processing'
                              ? 'bg-[#d946ef]/10 text-[#d946ef] border-[#d946ef]/30 animate-pulse'
                              : 'bg-select-bg text-text-sub border-border-glass'
                          }`}
                        >
                          {item.status === 'done' ? (
                            <span className="flex items-center gap-1">
                              <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                              </svg>
                              {t.statusDone}
                            </span>
                          ) : item.status === 'processing' ? (
                            <span className="flex items-center gap-1">
                              <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" className="animate-spin">
                                <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8z" />
                              </svg>
                              {t.statusProcessing}
                            </span>
                          ) : (
                            t.statusPending
                          )}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                /* 左右滑動雙圖即時比對器 */
                <div className="flex flex-col gap-4 text-left">
                  <div className="flex justify-between items-center border-b border-border-glass pb-3">
                    <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
                      <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="text-[#d946ef] shrink-0">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                      {t.compTitle}
                    </h4>
                  </div>

                  <div className={styles.comparisonContainer}>
                    {/* 原圖 */}
                    {beforeDataUrl && (
                      <img src={beforeDataUrl} alt={t.compBefore} className={`${styles.compImg} ${styles.compImgBefore}`} />
                    )}
                    {/* 處理後圖 (帶 clip-path) */}
                    {afterDataUrl && (
                      <img
                        src={afterDataUrl}
                        alt={t.compAfter}
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
                    <div className={`${styles.compLabel} ${styles.compLabelBefore}`}>{t.compBefore}</div>
                    <div className={`${styles.compLabel} ${styles.compLabelAfter}`}>{t.compAfter}</div>

                    {/* 拖曳輸入條 */}
                    <input
                      id={compRangeId}
                      type="range"
                      min="0"
                      max="100"
                      value={compSliderPos}
                      onChange={(e) => setCompSliderPos(parseFloat(e.target.value))}
                      aria-label={t.srComp}
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
        <div className="fixed bottom-4 right-4 left-4 sm:left-auto sm:right-8 sm:bottom-8 px-6 py-3 text-sm font-medium rounded-xl bg-[#d946ef]/20 dark:bg-[#d946ef]/20 border border-[#d946ef]/40 text-[#c026d3] dark:text-[#d946ef] bg-white/95 dark:bg-slate-900/90 backdrop-blur-md shadow-xl z-50 flex items-center justify-center gap-2">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

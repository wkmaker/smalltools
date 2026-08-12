'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import {
  renderPdfPagesProgressive,
  renderSinglePdfPageHighRes,
  compilePagesToPdfBlob,
  PdfComposerItem,
} from '../utils/pdfHelper';
import styles from './pdf-processor.module.css';

export interface PdfPageItem extends PdfComposerItem {
  fileSize?: number;
}

const TRANSLATIONS = {
  'zh-TW': {
    title: 'PDF 頁面組合器',
    subtitle: 'ONLINE PDF PAGE COMPOSER',
    description: '專業免費的線上 PDF 頁面組合器！支援多檔 PDF 自動拆頁展開預覽、圖片混搭合併、點擊滿版超清大圖檢視、滑鼠拖曳頁面排序、單頁 90° 旋轉與刪除、高品質 PDF 匯出。100% 瀏覽器本機端安全運算。',
    addPdfImg: '新增 PDF / 圖片',
    parsingPages: '解析頁面中...',
    totalCount: (n: number) => `總計 ${n} 個頁面`,
    exportQualityLabel: '匯出品質：',
    qHigh: '高畫質原圖 (95%)',
    qBal: '推薦平衡 (85%)',
    qLow: '輕度瘦身 (65%)',
    rotateAll: '全部旋轉 90°',
    clearAll: '清空全部',
    exportPdf: '匯出 PDF 檔案',
    exporting: '合成導出中...',
    dropTitle: '拖曳一或多個 PDF / 圖片檔案至此，自動解析拆解所有頁面',
    dropSub: '支援滑鼠拖曳頁面任意排序、點擊展放大圖預覽、單頁旋轉刪除與真 PDF 合成導出',
    dragOverlayText: '放開滑鼠以新增多個 PDF / 圖片頁面',
    clickToZoom: '點擊放大檢視',
    pageImg: '圖片',
    rotate: '旋轉',
    delete: '刪除',
    addMoreBottom: '拖曳一或多個檔案至此處，即可繼續新增',
    pageInfo: (curr: number, total: number) => `#${curr} / ${total}`,
    zoom: '縮放',
    resetZoom: '重置',
    rotate90: '旋轉 90°',
    close: '關閉 (ESC)',
    renderingHighRes: '正在使用 PDF.js 即時渲染 300 DPI 超高清圖像...',
    prevPage: '上一頁',
    nextPage: '下一頁',
    shortcutsHint: '按鍵 Esc 關閉 ｜ ◄ ► 方向鍵切換頁面',
    toastValidOnly: '請選擇有效的 PDF 或 PNG/JPG/WebP 圖片檔案',
    toastParsedDone: '多檔解析與預覽處理完成！',
    toastMovedPage: (src: number, tgt: number) => `已將頁面 #${src} 移至 #${tgt}`,
    toastPageRemoved: '已刪除指定頁面',
    toastRotatedAll: '已將所有頁面順時針旋轉 90 度',
    confirmClearAll: '確定要清空所有已載入的 PDF 頁面與圖片嗎？',
    toastClearedAll: '已清空所有頁面',
    toastExporting: '正在本機合成高畫質 PDF 檔案...',
    toastExportSuccess: 'PDF 匯出下載成功！',
    toastExportFailed: (msg: string) => `PDF 匯出失敗：${msg}`,
    toastPdfError: (name: string) => `無法解析 PDF 檔案 [${name}]，可能檔案已加密或毀損`,
    unlockModalTitle: '檔案受密碼保護',
    unlockModalSub: (name: string) => `PDF 檔案 [${name}] 受到開啟密碼保護，請輸入密碼以拆解與預覽頁面。`,
    passwordPlaceholder: '請輸入 PDF 開啟密碼',
    unlockBtn: '解鎖並拆頁',
    unlocking: '驗證解鎖中...',
    cancelBtn: '取消',
    invalidPasswordMsg: '密碼不正確，請確認後重新輸入。',
    showPassword: '顯示密碼',
    hidePassword: '隱藏密碼',
    switchLangText: 'English',
    switchLangHref: '/pdf-processor/en/',
  },
  en: {
    title: 'PDF Page Composer',
    subtitle: 'ONLINE PDF PAGE COMPOSER',
    description: 'Free online PDF Page Composer! Auto split & preview multi-file PDFs, combine images, drag-and-drop reorder, 90° rotation, single-page deletion, and high-res PDF export. 100% client-side execution.',
    addPdfImg: 'Add PDF / Images',
    parsingPages: 'Parsing pages...',
    totalCount: (n: number) => `Total ${n} page(s)`,
    exportQualityLabel: 'Export Quality:',
    qHigh: 'High Quality (95%)',
    qBal: 'Balanced Rec. (85%)',
    qLow: 'Compact Size (65%)',
    rotateAll: 'Rotate All 90°',
    clearAll: 'Clear All',
    exportPdf: 'Export Combined PDF',
    exporting: 'Exporting PDF...',
    dropTitle: 'Drag & drop PDF / image files here to auto split & preview',
    dropSub: 'Supports drag & drop reordering, full-size preview, page rotation, and PDF export.',
    dragOverlayText: 'Drop files to add PDF or image pages',
    clickToZoom: 'Click to preview',
    pageImg: 'Image',
    rotate: 'Rotate',
    delete: 'Delete',
    addMoreBottom: 'Drag or click here to add more files',
    pageInfo: (curr: number, total: number) => `#${curr} / ${total}`,
    zoom: 'Zoom',
    resetZoom: 'Reset',
    rotate90: 'Rotate 90°',
    close: 'Close (ESC)',
    renderingHighRes: 'Rendering 300 DPI high-res page with PDF.js...',
    prevPage: 'Previous',
    nextPage: 'Next',
    shortcutsHint: 'ESC to close | ◄ ► Arrow keys to navigate',
    toastValidOnly: 'Please select valid PDF or PNG/JPG/WebP files',
    toastParsedDone: 'Files parsed and loaded successfully!',
    toastMovedPage: (src: number, tgt: number) => `Moved page #${src} to #${tgt}`,
    toastPageRemoved: 'Page removed',
    toastRotatedAll: 'Rotated all pages 90°',
    confirmClearAll: 'Are you sure you want to clear all loaded pages?',
    toastClearedAll: 'All pages cleared',
    toastExporting: 'Compiling high quality PDF file...',
    toastExportSuccess: 'PDF export downloaded successfully!',
    toastExportFailed: (msg: string) => `PDF export failed: ${msg}`,
    toastPdfError: (name: string) => `Failed to parse PDF [${name}]. File might be encrypted or corrupted.`,
    unlockModalTitle: 'Password Protected File',
    unlockModalSub: (name: string) => `PDF [${name}] is password protected. Enter password to split & preview pages.`,
    passwordPlaceholder: 'Enter PDF password',
    unlockBtn: 'Unlock & Split Pages',
    unlocking: 'Unlocking...',
    cancelBtn: 'Cancel',
    invalidPasswordMsg: 'Incorrect password. Please try again.',
    showPassword: 'Show Password',
    hidePassword: 'Hide Password',
    switchLangText: '繁體中文',
    switchLangHref: '/pdf-processor/',
  },
};

interface PdfProcessorClientProps {
  lang?: 'zh-TW' | 'en';
}

export default function PdfProcessorClient({ lang = 'zh-TW' }: PdfProcessorClientProps) {
  const t = TRANSLATIONS[lang];
  const [pages, setPages] = useState<PdfPageItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [processingMsg, setProcessingMsg] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportQuality, setExportQuality] = useState<number>(0.85);
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const [draggedCardIndex, setDraggedCardIndex] = useState<number | null>(null);
  const [dropTargetCardIndex, setDropTargetCardIndex] = useState<number | null>(null);
  const [previewPageIndex, setPreviewPageIndex] = useState<number | null>(null);
  const [highResUrl, setHighResUrl] = useState<string>('');
  const [zoomScale, setZoomScale] = useState<number>(1);
  const [isLoadingHighRes, setIsLoadingHighRes] = useState<boolean>(false);
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [toast, setToast] = useState<string>('');

  // 密碼解鎖對話框狀態
  const [pendingPasswordFile, setPendingPasswordFile] = useState<{
    file: File;
    buffer: ArrayBuffer;
  } | null>(null);
  const [passwordInput, setPasswordInput] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [isUnlocking, setIsUnlocking] = useState<boolean>(false);

  const fileInputId = useId();
  const exportQualityId = useId();
  const pwdInputId = useId();

  useEffect(() => {
    setIsMounted(true);
    document.documentElement.style.setProperty('--theme-color', '#ef4444');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(239, 68, 68, 0.6)');
  }, []);

  // 鍵盤 ESC 關閉大圖 Modal 與左右鍵切換頁面
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (previewPageIndex === null) return;
      if (e.key === 'Escape') setPreviewPageIndex(null);
      if (e.key === 'ArrowLeft' && previewPageIndex > 0) setPreviewPageIndex(previewPageIndex - 1);
      if (e.key === 'ArrowRight' && previewPageIndex < pages.length - 1)
        setPreviewPageIndex(previewPageIndex + 1);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [previewPageIndex, pages.length]);

  // 當開啟大圖 Modal 時，調用 PDF.js 即時非同步輸出 2400px (300DPI) 超高解析畫質
  useEffect(() => {
    if (previewPageIndex === null || !pages[previewPageIndex]) {
      setHighResUrl('');
      setZoomScale(1);
      return;
    }

    const currentItem = pages[previewPageIndex];
    setZoomScale(1);

    if (currentItem.sourceType === 'PDF' && currentItem.pdfArrayBuffer) {
      setIsLoadingHighRes(true);
      renderSinglePdfPageHighRes(
        currentItem.pdfArrayBuffer,
        currentItem.pageIndex,
        2400,
        currentItem.password
      )
        .then((url) => {
          if (url) setHighResUrl(url);
          else setHighResUrl(currentItem.thumbnailUrl);
        })
        .catch(() => setHighResUrl(currentItem.thumbnailUrl))
        .finally(() => setIsLoadingHighRes(false));
    } else {
      setHighResUrl(currentItem.imageDataUrl || currentItem.thumbnailUrl);
      setIsLoadingHighRes(false);
    }
  }, [previewPageIndex, pages]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  // 全域檔案拖曳事件處理
  const handleFileDragOver = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('text/page-card-index')) return;
    e.preventDefault();
    e.stopPropagation();
    if (!isDraggingFile) setIsDraggingFile(true);
  };

  const handleFileDragLeave = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('text/page-card-index')) return;
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  const handleFileDrop = (e: React.DragEvent) => {
    if (e.dataTransfer.types.includes('text/page-card-index')) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesLoad(e.dataTransfer.files);
    }
  };

  // 卡片拖曳排序 (Card Drag & Drop Reorder)
  const handleCardDragStart = (e: React.DragEvent, index: number) => {
    e.stopPropagation();
    setDraggedCardIndex(index);
    e.dataTransfer.setData('text/page-card-index', index.toString());
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCardDragOver = (e: React.DragEvent, index: number) => {
    if (!e.dataTransfer.types.includes('text/page-card-index')) return;
    e.preventDefault();
    e.stopPropagation();
    if (dropTargetCardIndex !== index) {
      setDropTargetCardIndex(index);
    }
  };

  const handleCardDrop = (e: React.DragEvent, targetIndex: number) => {
    if (!e.dataTransfer.types.includes('text/page-card-index')) return;
    e.preventDefault();
    e.stopPropagation();

    const sourceIndexStr = e.dataTransfer.getData('text/page-card-index');
    const sourceIndex = sourceIndexStr !== '' ? parseInt(sourceIndexStr, 10) : draggedCardIndex;

    setDraggedCardIndex(null);
    setDropTargetCardIndex(null);

    if (sourceIndex === null || isNaN(sourceIndex) || sourceIndex === targetIndex) return;

    setPages((prev) => {
      const newPages = [...prev];
      const [movedItem] = newPages.splice(sourceIndex, 1);
      newPages.splice(targetIndex, 0, movedItem);
      return newPages;
    });

    showToast(t.toastMovedPage(sourceIndex + 1, targetIndex + 1));
  };

  const handleCardDragEnd = () => {
    setDraggedCardIndex(null);
    setDropTargetCardIndex(null);
  };

  // 讀取多檔 PDF 與 PNG/JPG 圖片
  const handleFilesLoad = async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(
      (f) =>
        f.type === 'application/pdf' ||
        f.type.startsWith('image/') ||
        f.name.toLowerCase().endsWith('.pdf') ||
        f.name.toLowerCase().endsWith('.png') ||
        f.name.toLowerCase().endsWith('.jpg') ||
        f.name.toLowerCase().endsWith('.jpeg') ||
        f.name.toLowerCase().endsWith('.webp')
    );

    if (validFiles.length === 0) {
      showToast(t.toastValidOnly);
      return;
    }

    setIsProcessing(true);

    for (let fIdx = 0; fIdx < validFiles.length; fIdx++) {
      const file = validFiles[fIdx];
      setProcessingMsg(`Parsing (${fIdx + 1}/${validFiles.length}): ${file.name}`);

      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        try {
          const buffer = await file.arrayBuffer();

          await renderPdfPagesProgressive(
            buffer,
            (p) => {
              setPages((prev) => [
                ...prev,
                {
                  id: `pdf_${Date.now()}_${fIdx}_${p.pageIndex}_${Math.random().toString(36).substring(2, 6)}`,
                  sourceType: 'PDF',
                  fileName: file.name,
                  pageIndex: p.pageIndex,
                  rotation: 0,
                  thumbnailUrl: p.thumbnailUrl,
                  pdfArrayBuffer: buffer,
                  fileSize: file.size,
                },
              ]);
            },
            (curr, total) => {
              setProcessingMsg(
                `PDF (${fIdx + 1}/${validFiles.length}) [${file.name}]: ${curr} / ${total}`
              );
            },
            800
          );
        } catch (err: any) {
          if (err.message === 'PASSWORD_REQUIRED' || err.message === 'PASSWORD_INCORRECT') {
            const buffer = await file.arrayBuffer();
            setPendingPasswordFile({ file, buffer });
            setPasswordInput('');
            setPasswordError('');
            setShowPassword(false);
          } else {
            console.error('PDF 解析失敗:', err);
            showToast(t.toastPdfError(file.name));
          }
        }
      } else {
        // PNG / JPG / WebP 圖片檔案處理
        await new Promise<void>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const dataUrl = e.target?.result as string;
            setPages((prev) => [
              ...prev,
              {
                id: `img_${Date.now()}_${fIdx}_${Math.random().toString(36).substring(2, 6)}`,
                sourceType: 'IMAGE',
                fileName: file.name,
                pageIndex: 0,
                rotation: 0,
                thumbnailUrl: dataUrl,
                imageDataUrl: dataUrl,
                fileSize: file.size,
              },
            ]);
            resolve();
          };
          reader.readAsDataURL(file);
        });

        await new Promise((r) => setTimeout(r, 10));
      }
    }

    setIsProcessing(false);
    setProcessingMsg('');
    showToast(t.toastParsedDone);
  };

  const handleUnlockPendingFile = async () => {
    if (!pendingPasswordFile || !passwordInput) return;
    setIsUnlocking(true);
    setPasswordError('');

    try {
      const { file, buffer } = pendingPasswordFile;
      const pwd = passwordInput;

      await renderPdfPagesProgressive(
        buffer,
        (p) => {
          setPages((prev) => [
            ...prev,
            {
              id: `pdf_${Date.now()}_${p.pageIndex}_${Math.random().toString(36).substring(2, 6)}`,
              sourceType: 'PDF',
              fileName: file.name,
              pageIndex: p.pageIndex,
              rotation: 0,
              thumbnailUrl: p.thumbnailUrl,
              pdfArrayBuffer: buffer,
              fileSize: file.size,
              password: pwd,
            },
          ]);
        },
        (curr, total) => {
          setProcessingMsg(`PDF [${file.name}]: ${curr} / ${total}`);
        },
        800,
        pwd
      );

      setPendingPasswordFile(null);
      setPasswordInput('');
      showToast(t.toastParsedDone);
    } catch (err: any) {
      setPasswordError(t.invalidPasswordMsg);
    } finally {
      setIsUnlocking(false);
    }
  };

  // 單頁 90° 順時針旋轉
  const rotatePage = (id: string) => {
    setPages((prev) =>
      prev.map((p) => (p.id === id ? { ...p, rotation: (p.rotation + 90) % 360 } : p))
    );
  };

  // 單頁刪除
  const removePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
    if (previewPageIndex !== null) {
      if (pages.length <= 1) setPreviewPageIndex(null);
      else if (previewPageIndex >= pages.length - 1) setPreviewPageIndex(pages.length - 2);
    }
    showToast(t.toastPageRemoved);
  };

  // 全部順時針旋轉 90°
  const rotateAllPages = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })));
    showToast(t.toastRotatedAll);
  };

  // 按鈕移動排序
  const movePage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= pages.length) return;
    const newPages = [...pages];
    const temp = newPages[index];
    newPages[index] = newPages[targetIndex];
    newPages[targetIndex] = temp;
    setPages(newPages);

    if (previewPageIndex === index) setPreviewPageIndex(targetIndex);
  };

  // 清空全部
  const clearAllPages = () => {
    if (confirm(t.confirmClearAll)) {
      setPages([]);
      setPreviewPageIndex(null);
      showToast(t.toastClearedAll);
    }
  };

  // 真實高畫質 PDF 合成導出
  const exportPdf = useCallback(async () => {
    if (pages.length === 0) return;
    setIsExporting(true);
    showToast(t.toastExporting);

    try {
      const pdfBlob = await compilePagesToPdfBlob(pages, exportQuality, (curr, total) => {
        setProcessingMsg(`Compiling (${curr}/${total})...`);
      });
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Combined_PDF_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      showToast(t.toastExportSuccess);
    } catch (err) {
      console.error('PDF 匯出失敗:', err);
      showToast(t.toastExportFailed((err as Error).message));
    } finally {
      setIsExporting(false);
      setProcessingMsg('');
    }
  }, [pages, exportQuality, t]);

  const previewItem = previewPageIndex !== null ? pages[previewPageIndex] : null;

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#ef4444"
      accentGlow="rgba(239, 68, 68, 0.6)"
      extraHeaderControls={
        <Link
          href={t.switchLangHref}
          className="relative inline-flex items-center justify-center gap-1.5 h-[42px] px-3.5 text-xs font-semibold rounded-xl bg-white/[.06] border border-white/10 text-text-sub hover:text-text-main backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-[var(--theme-color,#ef4444)] hover:shadow-[0_0_12px_var(--theme-glow,rgba(239,68,68,0.4))] select-none"
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>{t.switchLangText}</span>
        </Link>
      }
    >
      <div
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
        className="relative flex flex-col gap-8 text-left w-full px-4 max-sm:px-0 min-h-[400px]"
      >
        {/* 全域檔案拖曳浮層 Overlay */}
        {isDraggingFile && (
          <div className="absolute inset-0 z-50 bg-[#ef4444]/20 border-2 border-dashed border-[#ef4444] rounded-3xl backdrop-blur-md flex flex-col items-center justify-center gap-3 text-text-main transition-all shadow-[0_0_50px_rgba(239,68,68,0.4)] pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-[#ef4444] text-white flex items-center justify-center shadow-lg animate-bounce">
              <svg viewBox="0 0 24 24" width={32} height={32} fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-text-main tracking-wide">
              {t.dragOverlayText}
            </span>
          </div>
        )}

        {/* 頂部頂級功能列與工具欄 */}
        <div className={`${styles.cardContainer} p-5 sm:p-6 flex justify-between items-center flex-wrap gap-4`}>
          <div className="flex items-center gap-4 flex-wrap">

            <input
              id={fileInputId}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.webp"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && handleFilesLoad(e.target.files)}
            />
            <button
              type="button"
              onClick={() => document.getElementById(fileInputId)?.click()}
              disabled={isProcessing}
              className="px-5 py-2.5 bg-[#ef4444] text-white font-semibold text-sm rounded-xl cursor-pointer hover:bg-red-600 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              {isProcessing ? t.parsingPages : t.addPdfImg}
            </button>
            <span className={`text-xs font-mono px-3 py-1.5 rounded-xl flex items-center gap-2 ${styles.innerBlock}`}>
              <span>{t.totalCount(pages.length)}</span>
              {isProcessing && processingMsg && (
                <span className="text-emerald-500 font-sans border-l border-border-glass pl-2 animate-pulse">
                  {processingMsg}
                </span>
              )}
            </span>
          </div>

          {pages.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* 匯出品質選擇 */}
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-sm ${styles.innerBlock}`}>
                <label htmlFor={exportQualityId} className="text-text-sub font-medium">
                  {t.exportQualityLabel}
                </label>
                <select
                  id={exportQualityId}
                  value={exportQuality}
                  onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                  className={styles.selectInput}
                >
                  <option value={0.95}>{t.qHigh}</option>
                  <option value={0.85}>{t.qBal}</option>
                  <option value={0.65}>{t.qLow}</option>
                </select>
              </div>

              <button
                type="button"
                onClick={rotateAllPages}
                className={styles.secondaryBtn}
              >
                <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
                  <path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12c0 4.42 3.58 8 8 8 4.42 0 8-3.58 8-8h-2c0 3.31-2.69 6-6 6s-6-2.69-6-6c0-3.04 2.26-5.56 5.23-5.93L11 9l4.55-3.45z" />
                </svg>
                {t.rotateAll}
              </button>
              <button
                type="button"
                onClick={clearAllPages}
                className="px-3.5 py-2 text-sm font-semibold text-red-500 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                {t.clearAll}
              </button>
              <button
                type="button"
                onClick={exportPdf}
                disabled={isExporting || isProcessing}
                className="px-5 py-2 bg-gradient-to-r from-red-600 to-rose-500 text-white font-bold text-sm rounded-xl cursor-pointer hover:shadow-[0_0_25px_rgba(239,68,68,0.6)] transition-all disabled:opacity-40 flex items-center gap-2"
              >
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                  <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                </svg>
                {isExporting ? t.exporting : t.exportPdf}
              </button>
            </div>
          )}
        </div>

        {/* 頁面圖卡 Grid 清單 */}
        {pages.length === 0 ? (
          <div
            onClick={() => document.getElementById(fileInputId)?.click()}
            className={`p-16 rounded-3xl flex flex-col items-center justify-center gap-4 cursor-pointer text-center ${styles.dropzone}`}
          >
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center ${styles.accentTag}`}>
              <svg viewBox="0 0 24 24" width={36} height={36} fill="currentColor">
                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-lg font-bold text-text-main">
                {t.dropTitle}
              </span>
              <span className="text-xs text-text-sub">
                {t.dropSub}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="grid grid-cols-5 gap-5 max-xl:grid-cols-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
              {pages.map((p, idx) => {
                const isDraggingThis = draggedCardIndex === idx;
                const isDropTarget = dropTargetCardIndex === idx;

                return (
                  <div
                    key={p.id}
                    draggable
                    onDragStart={(e) => handleCardDragStart(e, idx)}
                    onDragOver={(e) => handleCardDragOver(e, idx)}
                    onDrop={(e) => handleCardDrop(e, idx)}
                    onDragEnd={handleCardDragEnd}
                    className={`${styles.pageCard} cursor-grab active:cursor-grabbing ${
                      isDraggingThis ? 'opacity-40 scale-95 border-dashed border-[#ef4444]' : ''
                    } ${
                      isDropTarget ? 'border-2 border-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-105 z-10' : ''
                    }`}
                  >
                    {/* 頁面標頭與拖曳 Handles */}
                    <div className="w-full flex justify-between items-center text-xs border-b border-border-glass pb-2">
                      <span className="text-text-sub truncate max-w-[100px] flex items-center gap-1" title={p.fileName}>
                        <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" className="text-text-sub opacity-50">
                          <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                        {p.sourceType === 'PDF' ? `p.${p.pageIndex + 1}` : t.pageImg}
                      </span>
                      <span className={`font-mono font-bold px-2 py-0.5 rounded ${styles.accentTag}`}>
                        #{idx + 1}
                      </span>
                    </div>

                    {/* 縮圖預覽框 (點擊展開 Lightbox 大圖) */}
                    <div
                      onClick={() => setPreviewPageIndex(idx)}
                      className={`${styles.thumbWrapper} group cursor-pointer relative overflow-hidden`}
                      title="Click to preview"
                    >
                      <img
                        src={p.thumbnailUrl}
                        alt={`Page ${idx + 1}`}
                        className={styles.thumbImg}
                        style={{ transform: `rotate(${p.rotation}deg)` }}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex flex-col items-center justify-center gap-1.5 text-white backdrop-blur-[2px]">
                        <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                          <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                        </svg>
                        <span className="text-xs font-bold tracking-wide">{t.clickToZoom}</span>
                      </div>
                    </div>

                    {/* 檔名簡述 */}
                    <span className="text-xs text-text-sub truncate w-full px-1 text-center" title={p.fileName}>
                      {p.fileName}
                    </span>

                    {/* 頁面控制按鈕列 */}
                    <div className="flex items-center gap-1 w-full pt-1 border-t border-border-glass">
                      <button
                        type="button"
                        onClick={() => movePage(idx, 'left')}
                        disabled={idx === 0}
                        className="flex-1 py-1.5 text-xs font-bold text-text-sub hover:text-text-main disabled:opacity-20 cursor-pointer flex items-center justify-center"
                        title="Move Left"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => rotatePage(p.id)}
                        className={`flex-1 py-1.5 text-xs font-semibold rounded-xl cursor-pointer flex items-center justify-center gap-1 ${styles.accentBtn}`}
                        title="Rotate 90°"
                      >
                        <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
                          <path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12c0 4.42 3.58 8 8 8 4.42 0 8-3.58 8-8h-2c0 3.31-2.69 6-6 6s-6-2.69-6-6c0-3.04 2.26-5.56 5.23-5.93L11 9l4.55-3.45z" />
                        </svg>
                        {t.rotate}
                      </button>
                      <button
                        type="button"
                        onClick={() => removePage(p.id)}
                        className="flex-1 py-1.5 text-xs font-semibold text-red-500 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 cursor-pointer flex items-center justify-center gap-1"
                        title="Delete"
                      >
                        <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        {t.delete}
                      </button>
                      <button
                        type="button"
                        onClick={() => movePage(idx, 'right')}
                        disabled={idx === pages.length - 1}
                        className="flex-1 py-1.5 text-xs font-bold text-text-sub hover:text-text-main disabled:opacity-20 cursor-pointer flex items-center justify-center"
                        title="Move Right"
                      >
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 下方輕量新增卡片 Dropzone */}
            <div
              onClick={() => document.getElementById(fileInputId)?.click()}
              className={`p-6 rounded-2xl border border-dashed flex items-center justify-center gap-3 text-text-sub hover:text-text-main cursor-pointer ${styles.dropzone}`}
            >
              <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              <span className="text-sm font-semibold">{t.addMoreBottom}</span>
            </div>
          </div>
        )}
      </div>

      {/* 大圖展開 滿版超清動態縮放 Lightbox Modal */}
      {isMounted && previewItem && previewPageIndex !== null && createPortal(
        <div
          onClick={() => setPreviewPageIndex(null)}
          className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className={`relative w-[96vw] max-w-[1400px] h-[92vh] rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-2xl overflow-hidden ${styles.modalCard}`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-border-glass pb-3 shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-xl shadow-md ${styles.accentTag}`}>
                  {t.pageInfo(previewPageIndex + 1, pages.length)}
                </span>
                <span className="text-base font-bold text-text-main truncate" title={previewItem.fileName}>
                  {previewItem.fileName} {previewItem.sourceType === 'PDF' ? `(p.${previewItem.pageIndex + 1})` : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* 靜態佈局固定的縮放與重置控制列 */}
                <div className={`flex items-center rounded-xl p-1 text-xs gap-1 ${styles.innerBlock}`}>
                  <button
                    type="button"
                    onClick={() => setZoomScale(Math.max(0.5, zoomScale - 0.25))}
                    disabled={zoomScale <= 0.5}
                    className="w-7 h-7 flex items-center justify-center text-text-main font-bold cursor-pointer disabled:opacity-30"
                    title="Zoom Out"
                  >
                    -
                  </button>
                  <span className="font-mono text-text-main px-2 font-semibold min-w-[48px] text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale(Math.min(3.5, zoomScale + 0.25))}
                    disabled={zoomScale >= 3.5}
                    className="w-7 h-7 flex items-center justify-center text-text-main font-bold cursor-pointer disabled:opacity-30"
                    title="Zoom In"
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomScale(1)}
                    disabled={zoomScale === 1}
                    className="px-2.5 py-1 text-xs font-semibold text-red-500 hover:underline cursor-pointer border-l border-border-glass disabled:opacity-30 disabled:text-text-sub"
                    title="Reset 100%"
                  >
                    {t.resetZoom}
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => rotatePage(previewItem.id)}
                  className={`px-3.5 py-1.5 text-xs font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${styles.accentBtn}`}
                >
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                    <path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12c0 4.42 3.58 8 8 8 4.42 0 8-3.58 8-8h-2c0 3.31-2.69 6-6 6s-6-2.69-6-6c0-3.04 2.26-5.56 5.23-5.93L11 9l4.55-3.45z" />
                  </svg>
                  {t.rotate90}
                </button>
                <button
                  type="button"
                  onClick={() => removePage(previewItem.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-red-500/20 text-red-500 border border-red-500/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                  {t.delete}
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPageIndex(null)}
                  className="w-8 h-8 rounded-full text-text-main flex items-center justify-center transition-all cursor-pointer border border-border-glass font-bold ml-1"
                  title={t.close}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body - 滿版超高清動態渲染與縮放滾動區 */}
            <div className={`flex-1 relative min-h-0 flex items-center justify-center overflow-auto p-4 rounded-2xl select-none ${styles.modalViewer}`}>
              {isLoadingHighRes ? (
                <div className="flex flex-col items-center justify-center gap-3 text-text-sub">
                  <div className="w-10 h-10 border-4 border-[#ef4444] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">{t.renderingHighRes}</span>
                </div>
              ) : (
                <div
                  className="transition-transform duration-200 flex items-center justify-center max-h-full max-w-full"
                  style={{
                    transform: `scale(${zoomScale}) rotate(${previewItem.rotation}deg)`,
                    transformOrigin: 'center center',
                  }}
                >
                  <img
                    src={highResUrl || previewItem.thumbnailUrl}
                    alt="Page Ultra-High-Res Preview"
                    className="max-h-[75vh] max-w-full object-contain shadow-2xl rounded border border-border-glass bg-white"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer - 上下一頁切換導覽 */}
            <div className="flex items-center justify-between pt-2 border-t border-border-glass shrink-0">
              <button
                type="button"
                onClick={() => setPreviewPageIndex(previewPageIndex - 1)}
                disabled={previewPageIndex === 0}
                className={styles.secondaryBtn}
              >
                {t.prevPage}
              </button>
              <span className="text-xs text-text-sub font-mono hidden sm:inline-block">
                {t.shortcutsHint}
              </span>
              <button
                type="button"
                onClick={() => setPreviewPageIndex(previewPageIndex + 1)}
                disabled={previewPageIndex === pages.length - 1}
                className={styles.secondaryBtn}
              >
                {t.nextPage}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* 密碼解鎖 Modal */}
      {isMounted && pendingPasswordFile && createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className={`w-full max-w-md p-6 rounded-2xl flex flex-col gap-4 shadow-2xl ${styles.modalCard}`}>
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/20 text-red-500 shrink-0">
                <svg viewBox="0 0 24 24" width={24} height={24} fill="currentColor">
                  <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                </svg>
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="text-base font-bold text-text-main">
                  {t.unlockModalTitle}
                </h3>
                <p className="text-xs text-text-sub leading-relaxed">
                  {t.unlockModalSub(pendingPasswordFile.file.name)}
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={pwdInputId} className="sr-only">
                {t.passwordPlaceholder}
              </label>
              <div className="relative w-full">
                <input
                  id={pwdInputId}
                  type={showPassword ? 'text' : 'password'}
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleUnlockPendingFile();
                  }}
                  placeholder={t.passwordPlaceholder}
                  className={`w-full pr-10 ${styles.passwordInput}`}
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main p-1 cursor-pointer"
                  title={showPassword ? t.hidePassword : t.showPassword}
                >
                  {showPassword ? (
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
              {passwordError && (
                <span className="text-xs text-red-500 font-medium">{passwordError}</span>
              )}
            </div>

            <div className="flex justify-end items-center gap-2 pt-2 border-t border-border-glass">
              <button
                type="button"
                onClick={() => setPendingPasswordFile(null)}
                className={styles.secondaryBtn}
              >
                {t.cancelBtn}
              </button>
              <button
                type="button"
                onClick={handleUnlockPendingFile}
                disabled={isUnlocking || !passwordInput}
                className={`disabled:opacity-40 flex items-center gap-2 ${styles.unlockBtn}`}
              >
                {isUnlocking ? (
                  <>
                    <svg className="animate-spin" viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor">
                      <circle cx="12" cy="12" r="10" strokeWidth="4" className="opacity-25" />
                      <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" className="opacity-75" />
                    </svg>
                    {t.unlocking}
                  </>
                ) : (
                  <>
                    <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
                      <path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                    </svg>
                    {t.unlockBtn}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {toast && (
        <div className={styles.toast}>
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}


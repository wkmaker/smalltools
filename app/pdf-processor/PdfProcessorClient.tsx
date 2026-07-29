'use client';

import { useState, useEffect, useCallback, useId } from 'react';
import { createPortal } from 'react-dom';
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

export default function PdfProcessorClient() {
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

  const fileInputId = useId();

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
      renderSinglePdfPageHighRes(currentItem.pdfArrayBuffer, currentItem.pageIndex, 2400)
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

    showToast(`已將頁面 #${sourceIndex + 1} 移至 #${targetIndex + 1}`);
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
      showToast('請選擇有效的 PDF 或 PNG/JPG/WebP 圖片檔案');
      return;
    }

    setIsProcessing(true);

    for (let fIdx = 0; fIdx < validFiles.length; fIdx++) {
      const file = validFiles[fIdx];
      setProcessingMsg(`正在解析檔案 (${fIdx + 1}/${validFiles.length}): ${file.name}`);

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
                `解析 PDF 中 (${fIdx + 1}/${validFiles.length}) [${file.name}]: 第 ${curr} / ${total} 頁`
              );
            },
            800
          );
        } catch (err) {
          console.error('PDF 解析失敗:', err);
          showToast(`無法解析 PDF 檔案 [${file.name}]，可能檔案已加密或毀損`);
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
    showToast(`多檔解析與預覽處理完成！`);
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
    showToast('已刪除指定頁面');
  };

  // 全部順時針旋轉 90°
  const rotateAllPages = () => {
    setPages((prev) => prev.map((p) => ({ ...p, rotation: (p.rotation + 90) % 360 })));
    showToast('已將所有頁面順時針旋轉 90 度');
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
    if (confirm('確定要清空所有已載入的 PDF 頁面與圖片嗎？')) {
      setPages([]);
      setPreviewPageIndex(null);
      showToast('已清空所有頁面');
    }
  };

  // 真實高畫質 PDF 合成導出
  const exportPdf = useCallback(async () => {
    if (pages.length === 0) return;
    setIsExporting(true);
    showToast('正在本機合成高畫質 PDF 檔案...');

    try {
      const pdfBlob = await compilePagesToPdfBlob(pages, exportQuality, (curr, total) => {
        setProcessingMsg(`正在合成頁面 (${curr}/${total})...`);
      });
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Combined_PDF_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      showToast('PDF 匯出下載成功！');
    } catch (err) {
      console.error('PDF 匯出失敗:', err);
      showToast('PDF 匯出失敗：' + (err as Error).message);
    } finally {
      setIsExporting(false);
      setProcessingMsg('');
    }
  }, [pages, exportQuality]);

  const previewItem = previewPageIndex !== null ? pages[previewPageIndex] : null;

  return (
    <ToolLayout
      title="PDF 頁面組合器"
      subtitle="ONLINE PDF PAGE COMPOSER"
      description="專業免費的線上 PDF 頁面組合器！支援多檔 PDF 自動拆頁展開預覽、圖片混搭合併、點擊滿版超清大圖檢視、滑鼠拖曳頁面排序、單頁 90° 旋轉與刪除、高品質 PDF 匯出。100% 瀏覽器本機端安全運算。"
      accentColor="#ef4444"
      accentGlow="rgba(239, 68, 68, 0.6)"
    >
      <div
        onDragOver={handleFileDragOver}
        onDragLeave={handleFileDragLeave}
        onDrop={handleFileDrop}
        className="relative flex flex-col gap-8 text-left w-full px-4 max-sm:px-0 min-h-[400px]"
      >
        {/* 全域檔案拖曳浮層 Overlay */}
        {isDraggingFile && (
          <div className="absolute inset-0 z-50 bg-[#ef4444]/20 border-2 border-dashed border-[#ef4444] rounded-3xl backdrop-blur-md flex flex-col items-center justify-center gap-3 text-white transition-all shadow-[0_0_50px_rgba(239,68,68,0.4)] pointer-events-none">
            <div className="w-16 h-16 rounded-full bg-[#ef4444] text-white flex items-center justify-center shadow-lg animate-bounce">
              <svg viewBox="0 0 24 24" width={32} height={32} fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-white tracking-wide">
              放開滑鼠以新增多個 PDF / 圖片頁面
            </span>
          </div>
        )}

        {/* 頂部頂級功能列與工具欄 */}
        <div className="flex justify-between items-center bg-black/20 border border-white/[.08] p-5 sm:p-6 rounded-2xl flex-wrap gap-4 backdrop-blur-md shadow-lg">
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
              {isProcessing ? '解析頁面中...' : '新增 PDF / 圖片'}
            </button>
            <span className="text-xs font-mono text-text-sub bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 flex items-center gap-2">
              <span>總計 <strong className="text-[#ef4444] font-bold">{pages.length}</strong> 個頁面</span>
              {isProcessing && processingMsg && (
                <span className="text-emerald-400 font-sans border-l border-white/20 pl-2 animate-pulse">
                  {processingMsg}
                </span>
              )}
            </span>
          </div>

          {pages.length > 0 && (
            <div className="flex items-center gap-3 flex-wrap">
              {/* 匯出品質選擇 */}
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-3 py-1.5 rounded-xl text-xs text-text-sub">
                <span>匯出品質：</span>
                <select
                  value={exportQuality}
                  onChange={(e) => setExportQuality(parseFloat(e.target.value))}
                  className="bg-select-bg text-text-main font-medium rounded px-1.5 py-0.5 border border-white/10 outline-none"
                >
                  <option value={0.95}>高畫質原圖 (95%)</option>
                  <option value={0.85}>推薦平衡 (85%)</option>
                  <option value={0.65}>輕度瘦身 (65%)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={rotateAllPages}
                className="px-3.5 py-2 text-sm font-semibold text-text-sub bg-white/5 border border-white/10 rounded-xl hover:bg-white/15 hover:text-white transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
                  <path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12c0 4.42 3.58 8 8 8 4.42 0 8-3.58 8-8h-2c0 3.31-2.69 6-6 6s-6-2.69-6-6c0-3.04 2.26-5.56 5.23-5.93L11 9l4.55-3.45z" />
                </svg>
                全部旋轉 90°
              </button>
              <button
                type="button"
                onClick={clearAllPages}
                className="px-3.5 py-2 text-sm font-semibold text-red-400 bg-red-500/10 border border-red-500/30 rounded-xl hover:bg-red-500/20 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                清空全部
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
                {isExporting ? '合成導出中...' : '匯出 PDF 檔案'}
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
            <div className="w-20 h-20 rounded-3xl bg-[#ef4444]/15 text-[#ef4444] flex items-center justify-center border border-[#ef4444]/30 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
              <svg viewBox="0 0 24 24" width={36} height={36} fill="currentColor">
                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
              </svg>
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-lg font-bold text-text-main">
                拖曳一或多個 PDF / 圖片檔案至此，自動解析拆解所有頁面
              </span>
              <span className="text-xs text-text-sub">
                支援滑鼠拖曳頁面任意排序、點擊展放大圖預覽、單頁旋轉刪除與真 PDF 合成導出
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
                    className={`${styles.pageCard} cursor-grab active:cursor-grabbing transition-all duration-200 ${
                      isDraggingThis ? 'opacity-40 scale-95 border-dashed border-[#ef4444]' : ''
                    } ${
                      isDropTarget ? 'border-2 border-[#ef4444] shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-105 z-10' : ''
                    }`}
                  >
                    {/* 頁面標頭與拖曳 Handles */}
                    <div className="w-full flex justify-between items-center text-xs border-b border-white/[.08] pb-2">
                      <span className="text-text-sub truncate max-w-[100px] flex items-center gap-1" title={p.fileName}>
                        <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" className="text-text-sub opacity-50">
                          <path d="M11 18c0 1.1-.9 2-2 2s-2-.9-2-2 .9-2 2-2 2 .9 2 2zm-2-8c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0-6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm6 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                        </svg>
                        {p.sourceType === 'PDF' ? `p.${p.pageIndex + 1}` : `圖片`}
                      </span>
                      <span className="text-[#ef4444] font-mono font-bold bg-[#ef4444]/10 px-2 py-0.5 rounded border border-[#ef4444]/20">
                        #{idx + 1}
                      </span>
                    </div>

                    {/* 縮圖預覽框 (點擊展開 Lightbox 大圖) */}
                    <div
                      onClick={() => setPreviewPageIndex(idx)}
                      className={`${styles.thumbWrapper} group cursor-pointer relative overflow-hidden`}
                      title="點擊放大預覽頁面內容，拖曳可排序位置"
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
                        <span className="text-xs font-bold tracking-wide">點擊放大檢視</span>
                      </div>
                    </div>

                    {/* 檔名簡述 */}
                    <span className="text-xs text-text-sub truncate w-full px-1 text-center" title={p.fileName}>
                      {p.fileName}
                    </span>

                    {/* 頁面控制按鈕列 */}
                    <div className="flex items-center gap-1 w-full pt-1 border-t border-white/[.06]">
                      <button
                        type="button"
                        onClick={() => movePage(idx, 'left')}
                        disabled={idx === 0}
                        className="flex-1 py-1.5 text-xs font-bold bg-white/5 text-text-sub rounded-xl hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer flex items-center justify-center"
                        title="向左移"
                      >
                        ◀
                      </button>
                      <button
                        type="button"
                        onClick={() => rotatePage(p.id)}
                        className="flex-1 py-1.5 text-xs font-semibold bg-white/5 text-[#ef4444] rounded-xl hover:bg-[#ef4444]/20 cursor-pointer flex items-center justify-center gap-1"
                        title="順時針旋轉 90°"
                      >
                        <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
                          <path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12c0 4.42 3.58 8 8 8 4.42 0 8-3.58 8-8h-2c0 3.31-2.69 6-6 6s-6-2.69-6-6c0-3.04 2.26-5.56 5.23-5.93L11 9l4.55-3.45z" />
                        </svg>
                        旋轉
                      </button>
                      <button
                        type="button"
                        onClick={() => removePage(p.id)}
                        className="flex-1 py-1.5 text-xs font-semibold bg-white/5 text-red-400 rounded-xl hover:bg-red-500/20 cursor-pointer flex items-center justify-center gap-1"
                        title="刪除"
                      >
                        <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
                          <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                        </svg>
                        刪除
                      </button>
                      <button
                        type="button"
                        onClick={() => movePage(idx, 'right')}
                        disabled={idx === pages.length - 1}
                        className="flex-1 py-1.5 text-xs font-bold bg-white/5 text-text-sub rounded-xl hover:text-white hover:bg-white/10 disabled:opacity-20 cursor-pointer flex items-center justify-center"
                        title="向右移"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 下方輕量新增卡片 Dropzone */}
            <div
              onClick={() => document.getElementById(fileInputId)?.click()}
              className="p-6 rounded-2xl border border-dashed border-white/20 bg-black/20 hover:bg-[#ef4444]/10 hover:border-[#ef4444]/50 transition-all cursor-pointer flex items-center justify-center gap-3 text-text-sub hover:text-white"
            >
              <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className="text-[#ef4444]">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              <span className="text-sm font-semibold">拖曳一或多個檔案至此處，即可繼續新增</span>
            </div>
          </div>
        )}
      </div>

      {/* 大圖展開 滿版超清動態縮放 Lightbox Modal */}
      {isMounted && previewItem && previewPageIndex !== null && createPortal(
        <div
          onClick={() => setPreviewPageIndex(null)}
          className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-[96vw] max-w-[1400px] h-[92vh] bg-[#09090d] border border-white/20 rounded-3xl p-5 sm:p-6 flex flex-col gap-4 shadow-[0_30px_90px_rgba(0,0,0,0.98)] overflow-hidden"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/15 pb-3 shrink-0 flex-wrap gap-2">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-xs font-mono font-bold bg-[#ef4444] text-white px-3 py-1 rounded-xl shadow-md">
                  #{previewPageIndex + 1} / {pages.length}
                </span>
                <span className="text-base font-bold text-white truncate" title={previewItem.fileName}>
                  {previewItem.fileName} {previewItem.sourceType === 'PDF' ? `(第 ${previewItem.pageIndex + 1} 頁)` : ''}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {/* 靜態佈局固定的縮放與重置控制列 */}
                <div className="flex items-center bg-white/10 rounded-xl border border-white/15 p-1 text-xs gap-1">
                  <button
                    type="button"
                    onClick={() => setZoomScale(Math.max(0.5, zoomScale - 0.25))}
                    disabled={zoomScale <= 0.5}
                    className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded font-bold text-white cursor-pointer disabled:opacity-30"
                    title="縮小"
                  >
                    -
                  </button>
                  <span className="font-mono text-white px-2 font-semibold min-w-[48px] text-center">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={() => setZoomScale(Math.min(3.5, zoomScale + 0.25))}
                    disabled={zoomScale >= 3.5}
                    className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded font-bold text-white cursor-pointer disabled:opacity-30"
                    title="連續放大"
                  >
                    +
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomScale(1)}
                    disabled={zoomScale === 1}
                    className="px-2.5 py-1 text-[11px] font-semibold text-red-300 hover:text-white cursor-pointer border-l border-white/20 disabled:opacity-30 disabled:text-text-sub"
                    title="重置倍率為 100%"
                  >
                    重置
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => rotatePage(previewItem.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-white/10 hover:bg-[#ef4444]/30 text-[#ef4444] border border-[#ef4444]/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                    <path d="M15.55 5.55L11 1v3.07C7.06 4.56 4 7.92 4 12c0 4.42 3.58 8 8 8 4.42 0 8-3.58 8-8h-2c0 3.31-2.69 6-6 6s-6-2.69-6-6c0-3.04 2.26-5.56 5.23-5.93L11 9l4.55-3.45z" />
                  </svg>
                  旋轉 90°
                </button>
                <button
                  type="button"
                  onClick={() => removePage(previewItem.id)}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-500/40 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
                >
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                  </svg>
                  刪除
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewPageIndex(null)}
                  className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/30 text-white flex items-center justify-center transition-all cursor-pointer border border-white/20 font-bold ml-1"
                  title="關閉 (ESC)"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Body - 滿版超高清動態渲染與縮放滾動區 */}
            <div className="flex-1 relative min-h-0 flex items-center justify-center overflow-auto p-4 bg-black/70 rounded-2xl border border-white/10 select-none">
              {isLoadingHighRes ? (
                <div className="flex flex-col items-center justify-center gap-3 text-text-sub">
                  <div className="w-10 h-10 border-4 border-[#ef4444] border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">正在使用 PDF.js 即時渲染 300 DPI 超高清圖像...</span>
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
                    className="max-h-[75vh] max-w-full object-contain shadow-2xl rounded border border-white/20 bg-white"
                  />
                </div>
              )}
            </div>

            {/* Modal Footer - 上下一頁切換導覽 */}
            <div className="flex items-center justify-between pt-2 border-t border-white/15 shrink-0">
              <button
                type="button"
                onClick={() => setPreviewPageIndex(previewPageIndex - 1)}
                disabled={previewPageIndex === 0}
                className="px-5 py-2 text-xs font-bold bg-white/10 border border-white/15 text-white rounded-xl hover:bg-white/20 disabled:opacity-20 cursor-pointer flex items-center gap-2"
              >
                ◀ 上一頁
              </button>
              <span className="text-xs text-text-sub font-mono hidden sm:inline-block">
                按鍵 Esc 關閉 ｜ ◄ ► 方向鍵切換頁面
              </span>
              <button
                type="button"
                onClick={() => setPreviewPageIndex(previewPageIndex + 1)}
                disabled={previewPageIndex === pages.length - 1}
                className="px-5 py-2 text-xs font-bold bg-white/10 border border-white/15 text-white rounded-xl hover:bg-white/20 disabled:opacity-20 cursor-pointer flex items-center gap-2"
              >
                下一頁 ▶
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm font-medium rounded-xl bg-[#ef4444]/20 border border-[#ef4444]/40 text-white backdrop-blur-md shadow-lg z-50">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

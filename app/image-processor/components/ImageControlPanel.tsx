'use client';

import { useId } from 'react';
import { formatBytes } from '../../utils/formatBytes';
import styles from '../image-processor.module.css';
import { TRANSLATIONS } from '../translations';

type Translations = (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS];

interface ImageControlPanelProps {
  format: 'image/webp' | 'image/jpeg' | 'image/png';
  onFormatChange: (val: 'image/webp' | 'image/jpeg' | 'image/png') => void;
  quality: number;
  onQualityChange: (val: number) => void;
  isBatchMode: boolean;
  onRotateLeft: () => void;
  onRotateRight: () => void;
  flipH: boolean;
  onToggleFlipH: () => void;
  flipV: boolean;
  onToggleFlipV: () => void;
  keepAspect: boolean;
  onKeepAspectChange: (val: boolean) => void;
  targetWidth: number;
  onWidthChange: (val: number) => void;
  targetHeight: number;
  onHeightChange: (val: number) => void;
  aspectPreset: 'free' | '1:1' | '4:3' | '16:9';
  onApplyAspectPreset: (preset: 'free' | '1:1' | '4:3' | '16:9') => void;
  scalePercent: number;
  onScalePercentChange: (pct: number) => void;
  firstFile: File | undefined;
  origWidth: number;
  origHeight: number;
  processedSize: number;
  savingRate: number;
  isUpscaled: boolean;
  onDownloadOriginalSize: () => void;
  onAppendFiles: (fileList: FileList) => void;
  isProcessing: boolean;
  onDownloadBatchZip: () => void;
  onDownloadSingle: () => void;
  t: Translations;
}

export default function ImageControlPanel({
  format,
  onFormatChange,
  quality,
  onQualityChange,
  isBatchMode,
  onRotateLeft,
  onRotateRight,
  flipH,
  onToggleFlipH,
  flipV,
  onToggleFlipV,
  keepAspect,
  onKeepAspectChange,
  targetWidth,
  onWidthChange,
  targetHeight,
  onHeightChange,
  aspectPreset,
  onApplyAspectPreset,
  scalePercent,
  onScalePercentChange,
  firstFile,
  origWidth,
  origHeight,
  processedSize,
  savingRate,
  isUpscaled,
  onDownloadOriginalSize,
  onAppendFiles,
  isProcessing,
  onDownloadBatchZip,
  onDownloadSingle,
  t,
}: ImageControlPanelProps) {
  const appendFileInputId = useId();
  const formatSelectId = useId();
  const widthInputId = useId();
  const heightInputId = useId();
  const keepAspectId = useId();
  const qualityRangeId = useId();
  const scaleRangeId = useId();

  return (
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
          onChange={(e) => onFormatChange(e.target.value as 'image/webp' | 'image/jpeg' | 'image/png')}
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
            onChange={(e) => onQualityChange(parseFloat(e.target.value))}
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
              onClick={onRotateLeft}
              className="px-3 py-1.5 text-sm font-medium bg-select-bg border border-border-glass text-text-sub rounded-lg hover:bg-[#d946ef]/20 hover:border-[#d946ef]/40 hover:text-text-main transition-all cursor-pointer flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                <path d="M7.11 8.53L5.7 7.11C4.04 8.77 3 11.01 3 13.5 3 18.2 6.8 22 11.5 22S20 18.2 20 13.5C20 8.8 16.2 5 11.5 5c-2.49 0-4.73 1.04-6.39 2.71L3.7 6.3V11h4.7L7.11 8.53z" />
              </svg>
              {t.rotateLeft}
            </button>
            <button
              type="button"
              onClick={onRotateRight}
              className="px-3 py-1.5 text-sm font-medium bg-select-bg border border-border-glass text-text-sub rounded-lg hover:bg-[#d946ef]/20 hover:border-[#d946ef]/40 hover:text-text-main transition-all cursor-pointer flex items-center gap-1.5"
            >
              <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="shrink-0">
                <path d="M16.89 8.53L18.3 7.11C19.96 8.77 21 11.01 21 13.5 21 18.2 17.2 22 12.5 22S4 18.2 4 13.5C4 8.8 7.8 5 12.5 5c2.49 0 4.73 1.04 6.39 2.71L20.3 6.3V11h-4.7l1.29-2.47z" />
              </svg>
              {t.rotateRight}
            </button>
            <button
              type="button"
              onClick={onToggleFlipH}
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
              onClick={onToggleFlipV}
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
              onChange={(e) => onKeepAspectChange(e.target.checked)}
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
              onChange={(e) => onWidthChange(parseInt(e.target.value, 10) || 0)}
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
              onChange={(e) => onHeightChange(parseInt(e.target.value, 10) || 0)}
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
              onClick={() => onApplyAspectPreset(p)}
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
            onChange={(e) => onScalePercentChange(parseInt(e.target.value, 10))}
            aria-label={t.srScale}
            className="accent-[#d946ef] cursor-pointer h-2 bg-select-bg rounded-lg border border-border-glass"
          />
        </div>
      </div>

      {/* 統計與節省率 */}
      {!isBatchMode && firstFile && (
        <div className="grid grid-cols-2 gap-3 bg-select-bg border border-border-glass rounded-xl p-4 text-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold text-text-sub">{t.origSize}</span>
            <span className="font-mono font-bold text-text-main">{formatBytes(firstFile.size)}</span>
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
            <span className={`font-mono font-bold ${styles.savingRateText}`}>
              {savingRate > 0 ? `-${savingRate}%` : '0%'}
            </span>
          </div>
        </div>
      )}

      {/* 強行放大模糊警告 */}
      {!isBatchMode && isUpscaled && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col gap-2 text-left">
          <div className="flex items-center gap-2 text-amber-600 text-xs font-bold">
            <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="shrink-0">
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
            {t.upscaleWarn(targetWidth, targetHeight, origWidth, origHeight)}
          </div>
          <button
            type="button"
            onClick={onDownloadOriginalSize}
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
          if (e.dataTransfer.files.length > 0) onAppendFiles(e.dataTransfer.files);
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
          onChange={(e) => {
            if (e.target.files) onAppendFiles(e.target.files);
            e.target.value = '';
          }}
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
          onClick={onDownloadBatchZip}
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
          onClick={onDownloadSingle}
          className="w-full h-[52px] bg-[#d946ef]/20 border border-[#d946ef]/50 text-[#d946ef] font-bold text-base rounded-xl cursor-pointer hover:bg-[#d946ef] hover:text-[#030305] hover:shadow-[0_0_20px_rgba(217,70,239,0.5)] transition-all flex items-center justify-center gap-2"
        >
          <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="shrink-0">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          {t.downloadSingleBtn}
        </button>
      )}
    </div>
  );
}

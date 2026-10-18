'use client';

import React from 'react';
import type { AspectRatio, ExportFormat } from '../types';
import { RATIO_DIMENSIONS } from '../constants';
import styles from '../og-generator.module.css';

interface OgPreviewCardProps {
  t: any;
  aspectRatio: AspectRatio;
  setAspectRatio: (ratio: AspectRatio) => void;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  openLargePreview: () => void;
  retinaSupersample: boolean;
  setRetinaSupersample: (v: boolean) => void;
  retinaCheckboxId: string;
  isExporting: boolean;
  handleDownload: (format: ExportFormat) => void;
  handleCopyToClipboard: () => void;
}

export default function OgPreviewCard({
  t,
  aspectRatio,
  setAspectRatio,
  canvasRef,
  openLargePreview,
  retinaSupersample,
  setRetinaSupersample,
  retinaCheckboxId,
  isExporting,
  handleDownload,
  handleCopyToClipboard,
}: OgPreviewCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-surface-glass border border-border-glass space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-semibold text-text-main">{t.previewTitle}</div>
          <div className="text-xs text-text-sub">{t.previewDesc}</div>
        </div>
        <div className="text-xs font-mono px-2.5 py-1 rounded-md bg-select-bg border border-border-glass text-text-sub">
          {RATIO_DIMENSIONS[aspectRatio].desc}
        </div>
      </div>

      {/* 長寬比切換按鈕組 */}
      <div className="flex flex-wrap gap-2">
        {(['og', 'twitter', 'square', 'story', 'linkedin'] as const).map((rKey) => (
          <button
            key={rKey}
            type="button"
            onClick={() => setAspectRatio(rKey)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
              aspectRatio === rKey
                ? 'border-[#6366f1] bg-[#6366f1]/25 text-text-main font-bold'
                : 'border-border-glass bg-select-bg text-text-sub hover:text-text-main'
            }`}
          >
            {RATIO_DIMENSIONS[rKey].label.split(' ')[0]}
          </button>
        ))}
      </div>

      {/* Canvas 畫布容器 (支援點擊彈出高解析度大圖) */}
      <div
        onClick={openLargePreview}
        title={t.clickToEnlarge}
        className={`${styles.previewWrapper} ${styles.previewClickable}`}
      >
        <div className={styles.zoomBadge}>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
          </svg>
          <span>{t.clickToEnlarge}</span>
        </div>
        <canvas ref={canvasRef} className={styles.canvasElement} />
      </div>

      {/* 視網膜超採樣開關 */}
      <div className="flex items-center gap-2 pt-1">
        <input
          id={retinaCheckboxId}
          type="checkbox"
          checked={retinaSupersample}
          onChange={(e) => setRetinaSupersample(e.target.checked)}
          className="rounded border-border-glass accent-[#6366f1] cursor-pointer"
        />
        <label htmlFor={retinaCheckboxId} className="text-xs text-text-sub cursor-pointer">
          {t.retinaMode}
        </label>
      </div>

      {/* 下載與操作按鈕組 */}
      <div className="space-y-2.5 pt-2">
        <button
          type="button"
          disabled={isExporting}
          onClick={() => handleDownload('png')}
          className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          <span>{t.downloadPng}</span>
        </button>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownload('jpeg')}
            className="py-2 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors cursor-pointer disabled:opacity-50"
          >
            {t.downloadJpeg.split(' ')[1] || 'JPEG'}
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownload('webp')}
            className="py-2 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors cursor-pointer disabled:opacity-50"
          >
            WebP
          </button>
          <button
            type="button"
            disabled={isExporting}
            onClick={() => handleDownload('svg')}
            className="py-2 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors cursor-pointer disabled:opacity-50"
          >
            SVG
          </button>
        </div>

        <button
          type="button"
          onClick={handleCopyToClipboard}
          className="w-full py-2.5 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
          </svg>
          <span>{t.copyClipboard}</span>
        </button>
      </div>
    </div>
  );
}

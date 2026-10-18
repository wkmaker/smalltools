'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import type { AspectRatio } from '../types';
import { RATIO_DIMENSIONS } from '../constants';
import styles from '../og-generator.module.css';

interface ImagePreviewModalProps {
  t: any;
  isOpen: boolean;
  onClose: () => void;
  modalImageUrl: string;
  aspectRatio: AspectRatio;
  retinaSupersample: boolean;
  isExporting: boolean;
  handleDownload: (format: 'png') => void;
  handleCopyToClipboard: () => void;
}

export default function ImagePreviewModal({
  t,
  isOpen,
  onClose,
  modalImageUrl,
  aspectRatio,
  retinaSupersample,
  isExporting,
  handleDownload,
  handleCopyToClipboard,
}: ImagePreviewModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.modalBackdrop}
      onClick={onClose}
    >
      <div
        className={styles.modalCard}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal 頂部控制列 */}
        <div className="px-6 py-4 border-b border-border-glass flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1] shadow-[0_0_10px_#6366f1]" />
            <span className="text-sm font-bold text-text-main">{t.modalTitle}</span>
            <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-select-bg border border-border-glass text-text-sub">
              {retinaSupersample
                ? `${RATIO_DIMENSIONS[aspectRatio].width * 2} x ${RATIO_DIMENSIONS[aspectRatio].height * 2} px (2x Retina HD)`
                : `${RATIO_DIMENSIONS[aspectRatio].width} x ${RATIO_DIMENSIONS[aspectRatio].height} px (1x)`}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyToClipboard}
              className="px-3 py-1.5 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span>{t.copyClipboard}</span>
            </button>
            <button
              type="button"
              disabled={isExporting}
              onClick={() => handleDownload('png')}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#6366f1] text-white hover:bg-[#4f46e5] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>PNG</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-text-sub hover:text-text-main hover:bg-select-bg border border-transparent hover:border-border-glass transition-colors cursor-pointer"
              aria-label={t.closeModal}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Modal 圖片展示主體 */}
        <div className={styles.modalBody}>
          {modalImageUrl && (
            <img
              src={modalImageUrl}
              alt={t.modalTitle}
              className={styles.modalImage}
            />
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

'use client';

import React from 'react';
import styles from '../../har-cleaner.module.css';

interface PayloadViewerProps {
  title: string;
  mimeType?: string;
  cleanedFormatted: string;
  originalFormatted: string;
  viewMode: 'cleaned' | 'original' | 'split';
  setViewMode: (mode: 'cleaned' | 'original' | 'split') => void;
  redactionText: string;
  lang: 'zh-TW' | 'en';
  t: any;
  copyId: string;
  copiedField: string | null;
  copyText: (text: string, fieldId: string) => void;
  renderHighlightedCode: (text: string, customRedactText?: string) => React.ReactNode;
}

export default function PayloadViewer({
  title,
  mimeType,
  cleanedFormatted,
  originalFormatted,
  viewMode,
  setViewMode,
  redactionText,
  lang,
  t,
  copyId,
  copiedField,
  copyText,
  renderHighlightedCode,
}: PayloadViewerProps) {
  return (
    <div className="space-y-2 min-w-0 max-w-full">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="text-xs font-semibold text-text-main flex items-center gap-2">
          <span>{title}</span>
          {mimeType && (
            <span className="text-xs font-normal text-text-sub font-mono">({mimeType})</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* 檢視模式切換器 */}
          <div className="flex items-center gap-1 p-0.5 rounded-lg bg-select-bg border border-border-glass">
            <button
              type="button"
              onClick={() => setViewMode('cleaned')}
              className={`${styles.viewModeBtn} ${
                viewMode === 'cleaned' ? styles.viewModeBtnActive : ''
              }`}
            >
              {lang === 'en' ? 'Cleaned' : '脫敏後'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('original')}
              className={`${styles.viewModeBtn} ${
                viewMode === 'original' ? styles.viewModeBtnActive : ''
              }`}
            >
              {lang === 'en' ? 'Original' : '原始內容'}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('split')}
              className={`${styles.viewModeBtn} ${
                viewMode === 'split' ? styles.viewModeBtnActive : ''
              }`}
            >
              {lang === 'en' ? 'Split Diff' : '左右對照'}
            </button>
          </div>
          <button
            type="button"
            onClick={() =>
              copyText(
                viewMode === 'original' ? originalFormatted : cleanedFormatted,
                copyId
              )
            }
            className={styles.copyMiniBtn}
          >
            {copiedField === copyId ? t.copiedSingle : t.copyBtnText}
          </button>
        </div>
      </div>

      {/* Split Diff 左右對照模式 */}
      {viewMode === 'split' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-w-0 w-full">
          <div className="space-y-1 min-w-0">
            <div className="text-xs font-semibold text-text-sub flex items-center justify-between">
              <span className={styles.badgeOriginal}>{t.modalOriginalVersion}</span>
              <span className="text-xs font-mono font-normal">
                {originalFormatted.length} chars
              </span>
            </div>
            <pre
              className={`p-3 text-xs overflow-x-auto max-h-72 font-mono text-text-main leading-5 select-all ${styles.codeBox}`}
            >
              {originalFormatted || '(empty)'}
            </pre>
          </div>
          <div className="space-y-1 min-w-0">
            <div className="text-xs font-semibold text-text-sub flex items-center justify-between">
              <span className={styles.badgeCleaned}>{t.modalCleanedVersion}</span>
              <span className="text-xs font-mono font-normal">
                {cleanedFormatted.length} chars
              </span>
            </div>
            <pre
              className={`p-3 text-xs overflow-x-auto max-h-72 font-mono text-text-main leading-5 select-all ${styles.codeBox}`}
            >
              {renderHighlightedCode(cleanedFormatted, redactionText) || '(empty)'}
            </pre>
          </div>
        </div>
      ) : (
        /* 單面板模式 */
        <div className="space-y-1 min-w-0">
          <div className="flex items-center justify-between text-xs text-text-sub font-mono">
            <span>
              {viewMode === 'original' ? t.modalOriginalVersion : t.modalCleanedVersion}
            </span>
            <span>
              {(viewMode === 'original' ? originalFormatted : cleanedFormatted).length} chars
            </span>
          </div>
          <pre
            className={`p-3 text-xs overflow-x-auto max-h-80 font-mono text-text-main leading-5 select-all ${styles.codeBox}`}
          >
            {viewMode === 'original'
              ? originalFormatted || '(empty)'
              : renderHighlightedCode(cleanedFormatted, redactionText) || '(empty)'}
          </pre>
        </div>
      )}
    </div>
  );
}

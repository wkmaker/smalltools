'use client';

import React from 'react';
import { createPortal } from 'react-dom';
import styles from '../pac-generator.module.css';
import { TRANSLATIONS } from '../translations';

type PacTranslations = (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS];

interface PacImportModalProps {
  t: PacTranslations;
  isOpen: boolean;
  importContent: string;
  importMode: 'replace' | 'append';
  importError: string | null;
  onClose: () => void;
  onContentChange: (content: string) => void;
  onModeChange: (mode: 'replace' | 'append') => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDoImport: () => void;
}

export default function PacImportModal({
  t,
  isOpen,
  importContent,
  importMode,
  importError,
  onClose,
  onContentChange,
  onModeChange,
  onFileUpload,
  onDoImport,
}: PacImportModalProps) {
  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-modal-title"
    >
      <div className={styles.modalCard}>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className={styles.themeAccentText}>
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
            </svg>
            <h2 id="import-modal-title" className="text-base font-bold text-text-main">
              {t.importModalTitle}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-text-sub hover:text-text-main hover:bg-white/10 transition-colors"
            aria-label={t.cancelBtn}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>

        <p className="text-xs text-text-sub leading-relaxed">
          {t.importModalDesc}
        </p>

        {/* 檔案上傳列 */}
        <div className="flex items-center gap-3">
          <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 hover:bg-white/10 text-text-main cursor-pointer transition-colors">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z" />
            </svg>
            <span>{t.uploadFileBtn}</span>
            <input
              type="file"
              accept=".pac,.js,.txt,.json"
              onChange={onFileUpload}
              className="hidden"
            />
          </label>
        </div>

        {/* 代碼貼入文字框 */}
        <textarea
          value={importContent}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder={t.importPlaceholder}
          className={styles.modalTextarea}
        />

        {/* 錯誤提示 */}
        {importError && (
          <div className={styles.ruleWarningBar} role="alert">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className={styles.ruleWarningIcon}>
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
            <span className={styles.ruleWarningText}>{importError}</span>
          </div>
        )}

        {/* 匯入模式選擇與送出按鈕 */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-4 text-xs text-text-sub">
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="replace"
                checked={importMode === 'replace'}
                onChange={() => onModeChange('replace')}
                className="accent-[var(--theme-color)]"
              />
              <span>{t.importModeReplace}</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="radio"
                name="importMode"
                value="append"
                checked={importMode === 'append'}
                onChange={() => onModeChange('append')}
                className="accent-[var(--theme-color)]"
              />
              <span>{t.importModeAppend}</span>
            </label>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className={`${styles.actionButton} ${styles.secondaryButton}`}
            >
              {t.cancelBtn}
            </button>
            <button
              type="button"
              onClick={onDoImport}
              disabled={!importContent.trim()}
              className={`${styles.actionButton} ${styles.primaryButton} disabled:opacity-40 disabled:cursor-not-allowed`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z" />
              </svg>
              <span>{t.parseAndApplyBtn}</span>
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

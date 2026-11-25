'use client';

import styles from '../pdf-compressor.module.css';
import { TRANSLATIONS } from '../translations';

type Translations = (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS];

interface PdfToolbarProps {
  fileInputId: string;
  fileCount: number;
  isCompressing: boolean;
  hasCompleted: boolean;
  onFilesSelect: (files: FileList) => void;
  onClearQueue: () => void;
  onStartBatch: () => void;
  onDownloadZip: () => void;
  t: Translations;
}

export default function PdfToolbar({
  fileInputId,
  fileCount,
  isCompressing,
  hasCompleted,
  onFilesSelect,
  onClearQueue,
  onStartBatch,
  onDownloadZip,
  t,
}: PdfToolbarProps) {
  return (
    <div className={`${styles.cardContainer} p-5 sm:p-6 flex justify-between items-center flex-wrap gap-4`}>
      <div className="flex items-center gap-3 flex-wrap">
        <span className={`px-3 py-1 rounded-xl text-xs font-semibold ${styles.accentTag}`}>
          {t.tag100Local}
        </span>
        <span className="text-sm text-text-sub font-medium">
          {fileCount === 0 ? t.noFilesLoaded : t.filesLoaded(fileCount)}
        </span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <input
          id={fileInputId}
          type="file"
          accept="application/pdf"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) onFilesSelect(e.target.files);
            e.target.value = '';
          }}
        />

        <button
          type="button"
          onClick={() => document.getElementById(fileInputId)?.click()}
          disabled={isCompressing}
          className={`px-4 py-2 text-sm font-semibold rounded-xl disabled:opacity-30 flex items-center gap-1.5 cursor-pointer ${styles.accentBtn}`}
        >
          <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor">
            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
          </svg>
          {t.addPdfFiles}
        </button>

        {fileCount > 0 && (
          <>
            <button
              type="button"
              onClick={onClearQueue}
              disabled={isCompressing}
              className={styles.secondaryBtn}
            >
              {t.clearQueue}
            </button>
            <button
              type="button"
              onClick={onStartBatch}
              disabled={isCompressing}
              className={`px-6 py-2 text-sm rounded-xl disabled:opacity-40 flex items-center gap-2 cursor-pointer ${styles.primaryBtn}`}
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
              {isCompressing ? t.compressing : t.startBatch}
            </button>
          </>
        )}

        {hasCompleted && fileCount > 1 && (
          <button
            type="button"
            onClick={onDownloadZip}
            className={`flex items-center gap-2 ${styles.zipBtn}`}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
              <path d="M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z" />
            </svg>
            {t.downloadZip}
          </button>
        )}
      </div>
    </div>
  );
}

'use client';

import styles from '../pac-generator.module.css';
import { TRANSLATIONS } from '../translations';

type PacTranslations = (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS];

interface PacOutputPanelProps {
  t: PacTranslations;
  generatedScript: string;
  toastMessage: string | null;
  onCopyScript: () => void;
  onDownloadPac: () => void;
  onCopyDataUrl: () => void;
  onExportConfig: () => void;
  onGoToTester: () => void;
}

export default function PacOutputPanel({
  t,
  generatedScript,
  toastMessage,
  onCopyScript,
  onDownloadPac,
  onCopyDataUrl,
  onExportConfig,
  onGoToTester,
}: PacOutputPanelProps) {
  return (
    <div className={styles.panel}>
      <div className={styles.sectionHeader}>
        <div className={styles.sectionTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
          </svg>
          <span>{t.previewTitle}</span>
        </div>
      </div>

      {/* 代碼預覽區 */}
      <div className={styles.codeBox}>{generatedScript}</div>

      {/* 核心操作按鈕群 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <button
          type="button"
          onClick={onCopyScript}
          className={`${styles.actionButton} ${styles.primaryButton}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
          </svg>
          <span>{t.copyScript}</span>
        </button>

        <button
          type="button"
          onClick={onDownloadPac}
          className={`${styles.actionButton} ${styles.secondaryButton}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
          </svg>
          <span>{t.downloadPac}</span>
        </button>

        <button
          type="button"
          onClick={onCopyDataUrl}
          className={`${styles.actionButton} ${styles.secondaryButton}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
          </svg>
          <span>{t.copyDataUrl}</span>
        </button>

        <button
          type="button"
          onClick={onExportConfig}
          className={`${styles.actionButton} ${styles.secondaryButton}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z" />
          </svg>
          <span>{t.exportConfigBtn}</span>
        </button>

        <button
          type="button"
          onClick={onGoToTester}
          className={`${styles.actionButton} ${styles.secondaryButton} ${styles.testerLinkButton}`}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
          </svg>
          <span>{t.testInTester}</span>
        </button>
      </div>

      {/* 複製成功提示 */}
      {toastMessage && (
        <div className={`text-center text-xs font-semibold py-2 px-3 rounded-lg ${styles.toastSuccess} animate-fade-in`}>
          {toastMessage}
        </div>
      )}
    </div>
  );
}

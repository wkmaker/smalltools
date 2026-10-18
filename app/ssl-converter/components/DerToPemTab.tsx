'use client';

import React from 'react';
import styles from '../ssl-converter.module.css';

interface DerToPemTabProps {
  t: any;
  derFile: File | null;
  setDerFile: (file: File | null) => void;
  derFileId: string;
  onSubmit: () => void;
  onClear: () => void;
  showAlertMsg: (msg: string, type?: 'error' | 'warning' | 'success') => void;
  hideAlertMsg: () => void;
  resetAllResults: () => void;
}

export default function DerToPemTab({
  t,
  derFile,
  setDerFile,
  derFileId,
  onSubmit,
  onClear,
  showAlertMsg,
  hideAlertMsg,
  resetAllResults,
}: DerToPemTabProps) {
  return (
    <div className={styles.panelCard}>
      <div className="flex flex-col gap-2">
        <label htmlFor={derFileId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
          {t.derUploadLabel}
        </label>
        {!derFile ? (
          <div className={styles.uploadZone}>
            <input
              id={derFileId}
              type="file"
              accept=".der,.cer,.crt"
              className={styles.fileInput}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  const f = e.target.files[0];
                  if (f.size > 5 * 1024 * 1024) {
                    showAlertMsg(t.fileTooLarge, 'error');
                    e.target.value = '';
                    return;
                  }
                  setDerFile(f);
                  hideAlertMsg();
                }
              }}
            />
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-text-sub">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
            </svg>
            <p className="text-sm text-text-sub font-medium">{t.derUploadPrompt}</p>
            <span className="text-xs text-text-sub opacity-80">{t.derUploadSub}</span>
          </div>
        ) : (
          <div className={styles.fileBadgeSuccess}>
            <span className="font-medium">{derFile.name} ({(derFile.size / 1024).toFixed(1)} KB)</span>
            <button
              type="button"
              onClick={() => {
                setDerFile(null);
                resetAllResults();
              }}
              className="text-red-400 hover:underline cursor-pointer"
            >
              {t.removeFile}
            </button>
          </div>
        )}
      </div>

      <div className={styles.btnGroup}>
        <button type="button" onClick={onSubmit} className={styles.btnSubmit}>
          {t.derSubmitBtn}
        </button>
        <button type="button" onClick={onClear} className={styles.btnClear} title={t.clearBtn}>
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
          <span>{t.clearBtn}</span>
        </button>
      </div>
    </div>
  );
}

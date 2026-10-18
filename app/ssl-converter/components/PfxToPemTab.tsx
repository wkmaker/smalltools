'use client';

import React from 'react';
import styles from '../ssl-converter.module.css';

interface PfxToPemTabProps {
  t: any;
  pfxFile: File | null;
  setPfxFile: (file: File | null) => void;
  pfxPassword: string;
  setPfxPassword: (val: string) => void;
  showPassword: Record<string, boolean>;
  toggleShowPassword: (key: string) => void;
  pfxFileId: string;
  pfxPassId: string;
  onSubmit: () => void;
  onClear: () => void;
  showAlertMsg: (msg: string, type?: 'error' | 'warning' | 'success') => void;
  hideAlertMsg: () => void;
  resetAllResults: () => void;
}

export default function PfxToPemTab({
  t,
  pfxFile,
  setPfxFile,
  pfxPassword,
  setPfxPassword,
  showPassword,
  toggleShowPassword,
  pfxFileId,
  pfxPassId,
  onSubmit,
  onClear,
  showAlertMsg,
  hideAlertMsg,
  resetAllResults,
}: PfxToPemTabProps) {
  return (
    <div className={styles.panelCard}>
      <div className="flex flex-col gap-2">
        <label htmlFor={pfxFileId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
          {t.pfxUploadLabel}
        </label>
        {!pfxFile ? (
          <div className={styles.uploadZone}>
            <input
              id={pfxFileId}
              type="file"
              accept=".pfx,.p12"
              className={styles.fileInput}
              onChange={e => {
                if (e.target.files && e.target.files[0]) {
                  const f = e.target.files[0];
                  if (f.size > 5 * 1024 * 1024) {
                    showAlertMsg(t.fileTooLarge, 'error');
                    e.target.value = '';
                    return;
                  }
                  setPfxFile(f);
                  hideAlertMsg();
                }
              }}
            />
            <svg viewBox="0 0 24 24" className="w-12 h-12 fill-text-sub">
              <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" />
            </svg>
            <p className="text-sm text-text-sub font-medium">{t.pfxUploadPrompt}</p>
            <span className="text-xs text-text-sub opacity-80">{t.pfxUploadSub}</span>
          </div>
        ) : (
          <div className={styles.fileBadgeSuccess}>
            <span className="font-medium">{pfxFile.name} ({(pfxFile.size / 1024).toFixed(1)} KB)</span>
            <button
              type="button"
              onClick={() => {
                setPfxFile(null);
                resetAllResults();
              }}
              className="text-red-400 hover:underline cursor-pointer"
            >
              {t.removeFile}
            </button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2 border-t border-border-glass pt-4">
        <label htmlFor={pfxPassId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
          {t.pfxPassLabel}
        </label>
        <div className="relative">
          <input
            id={pfxPassId}
            type={showPassword['pfx'] ? 'text' : 'password'}
            placeholder={t.pfxPassPlaceholder}
            value={pfxPassword}
            onChange={e => setPfxPassword(e.target.value)}
            className={styles.customInput}
          />
          <button
            type="button"
            onClick={() => toggleShowPassword('pfx')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main cursor-pointer text-xs"
          >
            {showPassword['pfx'] ? t.hidePass : t.showPass}
          </button>
        </div>
      </div>

      <div className={styles.btnGroup}>
        <button type="button" onClick={onSubmit} className={styles.btnSubmit}>
          {t.pfxSubmitBtn}
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

'use client';

import React from 'react';
import styles from '../ssl-converter.module.css';

interface PemToDerTabProps {
  t: any;
  pemDerInput: string;
  setPemDerInput: (val: string) => void;
  pemDerInputId: string;
  onSubmit: () => void;
  onClear: () => void;
}

export default function PemToDerTab({
  t,
  pemDerInput,
  setPemDerInput,
  pemDerInputId,
  onSubmit,
  onClear,
}: PemToDerTabProps) {
  return (
    <div className={styles.panelCard}>
      <div className="flex flex-col gap-2">
        <label htmlFor={pemDerInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
          {t.pemDerInputLabel}
        </label>
        <textarea
          id={pemDerInputId}
          rows={8}
          placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
          value={pemDerInput}
          onChange={e => setPemDerInput(e.target.value)}
          className={styles.customTextarea}
        />
      </div>

      <div className={styles.btnGroup}>
        <button type="button" onClick={onSubmit} className={styles.btnSubmit}>
          {t.pemDerSubmitBtn}
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

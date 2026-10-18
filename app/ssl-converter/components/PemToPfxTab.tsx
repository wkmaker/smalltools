'use client';

import React from 'react';
import styles from '../ssl-converter.module.css';

interface PemToPfxTabProps {
  t: any;
  pemKey: string;
  setPemKey: (val: string) => void;
  pemCert: string;
  setPemCert: (val: string) => void;
  pemCaBundle: string;
  setPemCaBundle: (val: string) => void;
  pemPassword: string;
  setPemPassword: (val: string) => void;
  pemFriendlyName: string;
  setPemFriendlyName: (val: string) => void;
  showPassword: Record<string, boolean>;
  toggleShowPassword: (key: string) => void;
  pemKeyId: string;
  pemCertId: string;
  pemCaId: string;
  pemPassId: string;
  pemFriendlyId: string;
  onSubmit: () => void;
  onClear: () => void;
}

export default function PemToPfxTab({
  t,
  pemKey,
  setPemKey,
  pemCert,
  setPemCert,
  pemCaBundle,
  setPemCaBundle,
  pemPassword,
  setPemPassword,
  pemFriendlyName,
  setPemFriendlyName,
  showPassword,
  toggleShowPassword,
  pemKeyId,
  pemCertId,
  pemCaId,
  pemPassId,
  pemFriendlyId,
  onSubmit,
  onClear,
}: PemToPfxTabProps) {
  return (
    <div className={styles.panelCard}>
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div className="flex flex-col gap-2">
          <label htmlFor={pemKeyId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
            {t.pemKeyLabel} <span className="text-red-400">*</span>
          </label>
          <textarea
            id={pemKeyId}
            rows={6}
            placeholder="-----BEGIN PRIVATE KEY-----\n..."
            value={pemKey}
            onChange={e => setPemKey(e.target.value)}
            className={styles.customTextarea}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={pemCertId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
            {t.pemCertLabel} <span className="text-red-400">*</span>
          </label>
          <textarea
            id={pemCertId}
            rows={6}
            placeholder="-----BEGIN CERTIFICATE-----\n..."
            value={pemCert}
            onChange={e => setPemCert(e.target.value)}
            className={styles.customTextarea}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 border-t border-border-glass pt-4">
        <label htmlFor={pemCaId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
          {t.pemCaLabel}
        </label>
        <textarea
          id={pemCaId}
          rows={4}
          placeholder="-----BEGIN CERTIFICATE-----\n..."
          value={pemCaBundle}
          onChange={e => setPemCaBundle(e.target.value)}
          className={styles.customTextarea}
        />
      </div>

      <div className="grid grid-cols-2 gap-4 border-t border-border-glass pt-4 max-sm:grid-cols-1">
        <div className="flex flex-col gap-2">
          <label htmlFor={pemPassId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
            {t.pemPassLabel} <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <input
              id={pemPassId}
              type={showPassword['pemToPfx'] ? 'text' : 'password'}
              placeholder={t.pemPassPlaceholder}
              value={pemPassword}
              onChange={e => setPemPassword(e.target.value)}
              className={styles.customInput}
            />
            <button
              type="button"
              onClick={() => toggleShowPassword('pemToPfx')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-text-sub hover:text-text-main cursor-pointer text-xs"
            >
              {showPassword['pemToPfx'] ? t.hidePass : t.showPass}
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={pemFriendlyId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
            {t.pemFriendlyNameLabel}
          </label>
          <input
            id={pemFriendlyId}
            type="text"
            placeholder={t.pemFriendlyNamePlaceholder}
            value={pemFriendlyName}
            onChange={e => setPemFriendlyName(e.target.value)}
            className={styles.customInput}
          />
        </div>
      </div>

      <div className={styles.btnGroup}>
        <button type="button" onClick={onSubmit} className={styles.btnSubmit}>
          {t.pemSubmitBtn}
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

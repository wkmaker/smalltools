'use client';

import React from 'react';
import { CopyIcon, CheckIcon } from './Icons';
import styles from '../har-cleaner.module.css';

interface RawJsonTabProps {
  cleanedHar: any;
  copied: boolean;
  t: any;
  onCopyJson: () => void;
}

export default function RawJsonTab({
  cleanedHar,
  copied,
  t,
  onCopyJson,
}: RawJsonTabProps) {
  return (
    <div className="rounded-2xl p-6 bg-surface-glass border border-border-glass space-y-3">
      <div className="flex justify-between items-center">
        <div className="text-xs text-text-sub">HAR 1.2 JSON (Cleaned & Formatted)</div>
        <button
          type="button"
          onClick={onCopyJson}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${styles.secondaryBtn}`}
        >
          {copied ? <CheckIcon /> : <CopyIcon />}
          <span>{copied ? t.copiedToast : t.copyJsonBtn}</span>
        </button>
      </div>
      <pre
        className={`p-4 text-xs overflow-x-auto max-h-[500px] text-text-main leading-5 ${styles.codeBox}`}
      >
        {JSON.stringify(cleanedHar, null, 2)}
      </pre>
    </div>
  );
}

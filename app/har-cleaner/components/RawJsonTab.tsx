'use client';

import React, { useMemo } from 'react';
import { CopyIcon, CheckIcon } from './Icons';
import styles from '../har-cleaner.module.css';

// 預覽字元上限：超過即截斷，避免巨型 TextNode 拖垮主執行緒；完整內容請用複製 / 下載取得
const RAW_PREVIEW_MAX_CHARS = 1_000_000;

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
  const { preview, truncated } = useMemo(() => {
    const full = JSON.stringify(cleanedHar, null, 2) ?? '';
    return full.length > RAW_PREVIEW_MAX_CHARS
      ? { preview: full.slice(0, RAW_PREVIEW_MAX_CHARS), truncated: true }
      : { preview: full, truncated: false };
  }, [cleanedHar]);

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
      {truncated && (
        <p className="text-xs text-text-sub" role="status">
          {t.rawJsonTruncatedNotice}
        </p>
      )}
      <pre
        className={`p-4 text-xs overflow-x-auto max-h-[500px] text-text-main leading-5 ${styles.codeBox}`}
      >
        {preview}
      </pre>
    </div>
  );
}

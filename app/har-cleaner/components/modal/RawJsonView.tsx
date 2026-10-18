'use client';

import React from 'react';
import type { HarEntryAnalysis } from '../../types';
import { CheckIcon, CopyIcon } from '../Icons';
import styles from '../../har-cleaner.module.css';

interface RawJsonViewProps {
  selectedItem: HarEntryAnalysis;
  modalRawMode: 'cleaned' | 'original';
  setModalRawMode: (mode: 'cleaned' | 'original') => void;
  redactionText: string;
  t: any;
  copiedField: string | null;
  copyText: (text: string, fieldId: string) => void;
  renderHighlightedCode: (text: string, customRedactText?: string) => React.ReactNode;
}

export default function RawJsonView({
  selectedItem,
  modalRawMode,
  setModalRawMode,
  redactionText,
  t,
  copiedField,
  copyText,
  renderHighlightedCode,
}: RawJsonViewProps) {
  const currentJsonString = JSON.stringify(
    modalRawMode === 'cleaned' ? selectedItem.cleaned : selectedItem.original,
    null,
    2
  );

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-select-bg border border-border-glass">
          <button
            type="button"
            onClick={() => setModalRawMode('cleaned')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              modalRawMode === 'cleaned'
                ? 'bg-[var(--theme-color)] text-black font-bold'
                : 'text-text-sub hover:text-text-main'
            }`}
          >
            {t.modalCleanedVersion}
          </button>
          <button
            type="button"
            onClick={() => setModalRawMode('original')}
            className={`px-3 py-1 text-xs rounded-lg font-medium transition-all ${
              modalRawMode === 'original'
                ? 'bg-[var(--theme-color)] text-black font-bold'
                : 'text-text-sub hover:text-text-main'
            }`}
          >
            {t.modalOriginalVersion}
          </button>
        </div>
        <button
          type="button"
          onClick={() => copyText(currentJsonString, 'raw_json')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${styles.secondaryBtn}`}
        >
          {copiedField === 'raw_json' ? <CheckIcon /> : <CopyIcon />}
          <span>
            {copiedField === 'raw_json' ? t.copiedSingle : t.modalCopyEntryJson}
          </span>
        </button>
      </div>

      <pre
        className={`p-4 text-xs overflow-x-auto max-h-[420px] text-text-main leading-5 select-all ${styles.codeBox}`}
      >
        {modalRawMode === 'cleaned'
          ? renderHighlightedCode(
              JSON.stringify(selectedItem.cleaned, null, 2),
              redactionText
            )
          : JSON.stringify(selectedItem.original, null, 2)}
      </pre>
    </div>
  );
}

'use client';

import React from 'react';
import type { HarEntryAnalysis } from '../../types';
import { formatPayload } from '../../engine/sanitizer';
import KeyValueSection from './KeyValueSection';
import PayloadViewer from './PayloadViewer';

interface ResponseTabProps {
  selectedItem: HarEntryAnalysis;
  redactionText: string;
  lang: 'zh-TW' | 'en';
  t: any;
  showOriginalMap: Record<string, boolean>;
  toggleShowOriginal: (key: string) => void;
  copiedField: string | null;
  copyText: (text: string, fieldId: string) => void;
  resBodyMode: 'cleaned' | 'original' | 'split';
  setResBodyMode: (mode: 'cleaned' | 'original' | 'split') => void;
  renderHighlightedCode: (text: string, customRedactText?: string) => React.ReactNode;
}

export default function ResponseTab({
  selectedItem,
  redactionText,
  lang,
  t,
  showOriginalMap,
  toggleShowOriginal,
  copiedField,
  copyText,
  resBodyMode,
  setResBodyMode,
  renderHighlightedCode,
}: ResponseTabProps) {
  const res = selectedItem.cleaned.response;
  const origRes = selectedItem.original.response;

  const cleanedResFormatted = formatPayload(res?.content?.text || '');
  const origResFormatted = formatPayload(origRes?.content?.text || '');
  const mime = res?.content?.mimeType || 'unknown';

  return (
    <div className="space-y-5">
      {/* Response Headers */}
      <KeyValueSection
        title={t.modalResHeadersTitle}
        items={res?.headers}
        originalItems={origRes?.headers}
        redactionText={redactionText}
        lang={lang}
        t={t}
        emptyText={t.noHeaders}
        prefix="res_h"
        showOriginalMap={showOriginalMap}
        toggleShowOriginal={toggleShowOriginal}
        copiedField={copiedField}
        copyText={copyText}
      />

      {/* Response Body */}
      {res?.content && (
        <PayloadViewer
          title={t.modalResBodyTitle}
          mimeType={mime}
          cleanedFormatted={cleanedResFormatted}
          originalFormatted={origResFormatted}
          viewMode={resBodyMode}
          setViewMode={setResBodyMode}
          redactionText={redactionText}
          lang={lang}
          t={t}
          copyId="res_body"
          copiedField={copiedField}
          copyText={copyText}
          renderHighlightedCode={renderHighlightedCode}
        />
      )}
    </div>
  );
}

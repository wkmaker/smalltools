'use client';

import React from 'react';
import type { HarEntryAnalysis } from '../../types';
import { formatPayload } from '../../engine/sanitizer';
import KeyValueSection from './KeyValueSection';
import PayloadViewer from './PayloadViewer';

interface RequestTabProps {
  selectedItem: HarEntryAnalysis;
  redactionText: string;
  lang: 'zh-TW' | 'en';
  t: any;
  showOriginalMap: Record<string, boolean>;
  toggleShowOriginal: (key: string) => void;
  copiedField: string | null;
  copyText: (text: string, fieldId: string) => void;
  postBodyMode: 'cleaned' | 'original' | 'split';
  setPostBodyMode: (mode: 'cleaned' | 'original' | 'split') => void;
  renderHighlightedCode: (text: string, customRedactText?: string) => React.ReactNode;
}

export default function RequestTab({
  selectedItem,
  redactionText,
  lang,
  t,
  showOriginalMap,
  toggleShowOriginal,
  copiedField,
  copyText,
  postBodyMode,
  setPostBodyMode,
  renderHighlightedCode,
}: RequestTabProps) {
  const req = selectedItem.cleaned.request;
  const origReq = selectedItem.original.request;

  const cleanedPostFormatted = formatPayload(req?.postData?.text || req?.postData);
  const origPostFormatted = formatPayload(origReq?.postData?.text || origReq?.postData);

  return (
    <div className="space-y-5">
      {/* Request Query Parameters */}
      <KeyValueSection
        title={t.modalQueryParamsTitle}
        items={req?.queryString}
        originalItems={origReq?.queryString}
        redactionText={redactionText}
        lang={lang}
        t={t}
        prefix="query"
        showOriginalMap={showOriginalMap}
        toggleShowOriginal={toggleShowOriginal}
        copiedField={copiedField}
        copyText={copyText}
      />

      {/* Request Headers */}
      <KeyValueSection
        title={t.modalReqHeadersTitle}
        items={req?.headers}
        originalItems={origReq?.headers}
        redactionText={redactionText}
        lang={lang}
        t={t}
        emptyText={t.noHeaders}
        prefix="req_h"
        showOriginalMap={showOriginalMap}
        toggleShowOriginal={toggleShowOriginal}
        copiedField={copiedField}
        copyText={copyText}
      />

      {/* Request POST Payload */}
      {req?.postData && (
        <div className="space-y-3 min-w-0 max-w-full">
          {/* Form Data Parameters */}
          {req.postData.params && req.postData.params.length > 0 && (
            <KeyValueSection
              title="POST Form Data Parameters"
              items={req.postData.params}
              originalItems={origReq?.postData?.params}
              redactionText={redactionText}
              lang={lang}
              t={t}
              prefix="post_param"
              showOriginalMap={showOriginalMap}
              toggleShowOriginal={toggleShowOriginal}
              copiedField={copiedField}
              copyText={copyText}
            />
          )}

          {/* Raw or JSON Text */}
          {(req.postData.text || !req.postData.params?.length) && (
            <PayloadViewer
              title={t.modalPostDataTitle}
              mimeType={req.postData.mimeType}
              cleanedFormatted={cleanedPostFormatted}
              originalFormatted={origPostFormatted}
              viewMode={postBodyMode}
              setViewMode={setPostBodyMode}
              redactionText={redactionText}
              lang={lang}
              t={t}
              copyId="post_body"
              copiedField={copiedField}
              copyText={copyText}
              renderHighlightedCode={renderHighlightedCode}
            />
          )}
        </div>
      )}
    </div>
  );
}

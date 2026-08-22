'use client';

import React, { useState, useEffect } from 'react';
import { HarEntryAnalysis } from '../types';
import {
  ShieldIcon,
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  CopyIcon,
} from './Icons';
import {
  formatPayload,
  parseStructuredRedactions,
  getEntryRuleCategoriesCount,
} from '../engine/sanitizer';
import styles from '../har-cleaner.module.css';

interface EntryDetailModalProps {
  selectedItem: HarEntryAnalysis | null;
  redactionText: string;
  lang: 'zh-TW' | 'en';
  t: any;
  onClose: () => void;
}

// 輔助函式：根據 HTTP Method 提供對應的高奢彩色膠囊樣式
function getMethodBadgeClass(method: string | undefined): string {
  const m = (method || '').toUpperCase();
  switch (m) {
    case 'GET':
      return styles.methodBadgeGet;
    case 'POST':
      return styles.methodBadgePost;
    case 'PUT':
      return styles.methodBadgePut;
    case 'DELETE':
      return styles.methodBadgeDelete;
    case 'PATCH':
      return styles.methodBadgePatch;
    default:
      return styles.methodBadgeOther;
  }
}

export default function EntryDetailModal({
  selectedItem,
  redactionText,
  lang,
  t,
  onClose,
}: EntryDetailModalProps) {
  const [modalTab, setModalTab] = useState<'overview' | 'request' | 'response' | 'raw'>('overview');
  const [modalRawMode, setModalRawMode] = useState<'cleaned' | 'original'>('cleaned');
  const [postBodyMode, setPostBodyMode] = useState<'cleaned' | 'original' | 'split'>('cleaned');
  const [resBodyMode, setResBodyMode] = useState<'cleaned' | 'original' | 'split'>('cleaned');
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 監聽鍵盤 ESC 鍵關閉 Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!selectedItem) return null;

  const toggleShowOriginal = (key: string) => {
    setShowOriginalMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const copyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1800);
  };

  // 脫敏/命中字串黃字高亮渲染器
  const renderHighlightedCode = (text: string, customRedactText: string = '[REDACTED]') => {
    if (!text) return null;
    const tokens = [customRedactText, '[MEDIA_BINARY_STRIPPED]', '[REDACTED]'];
    const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
    const escaped = uniqueTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${escaped})`, 'g');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) => {
          if (uniqueTokens.includes(part)) {
            return (
              <mark key={i} className={styles.redactedYellowHighlight}>
                {part}
              </mark>
            );
          }
          return part;
        })}
      </>
    );
  };

  const ruleCount = getEntryRuleCategoriesCount(selectedItem.reasons);

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
        {/* Modal 頂部 Header */}
        <div className={styles.modalHeader}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
            <div className="flex items-start gap-2.5 min-w-0 flex-1">
              <div className="p-2 rounded-xl bg-select-bg border border-border-glass text-text-main flex-shrink-0 mt-0.5">
                <ShieldIcon />
              </div>
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-bold text-text-main truncate">{t.modalTitle}</span>
                  <button
                    type="button"
                    onClick={onClose}
                    className="sm:hidden text-text-sub hover:text-text-main w-7 h-7 rounded-lg bg-select-bg border border-border-glass flex items-center justify-center transition-colors text-xs font-bold flex-shrink-0"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>

                {/* 膠囊徽章列 */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  {selectedItem.isSanitized ? (
                    <>
                      <span
                        className={styles.ruleHitBadge}
                        title={
                          lang === 'en'
                            ? `${ruleCount} rule categories triggered`
                            : `觸發 ${ruleCount} 類全域規則`
                        }
                      >
                        <ShieldIcon />
                        <span>
                          {lang === 'en'
                            ? `${ruleCount} ${ruleCount === 1 ? 'Rule' : 'Rules'}`
                            : `${ruleCount} 條規則`}
                        </span>
                      </span>
                      <span
                        className={styles.redactionCountBadge}
                        title={
                          lang === 'en'
                            ? `${selectedItem.reasons.length} sensitive fields/items redacted`
                            : `共脫敏 ${selectedItem.reasons.length} 個敏感欄位/項目`
                        }
                      >
                        <span>
                          {lang === 'en'
                            ? `${selectedItem.reasons.length} ${
                                selectedItem.reasons.length === 1 ? 'Redaction' : 'Redactions'
                              }`
                            : `${selectedItem.reasons.length} 項脫敏`}
                        </span>
                      </span>
                    </>
                  ) : (
                    <span className="text-xs px-2 py-0.5 rounded-md bg-select-bg border border-border-glass text-text-sub font-mono">
                      Clean
                    </span>
                  )}
                </div>

                {/* 網址卡牌展示條 */}
                <div
                  className={`flex items-start sm:items-center gap-2 p-2 sm:p-0 min-w-0 ${
                    styles.urlDisplayCard
                  } sm:bg-transparent sm:border-transparent sm:shadow-none`}
                >
                  <span
                    className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider flex-shrink-0 mt-0.5 sm:mt-0 ${getMethodBadgeClass(
                      selectedItem.cleaned.request?.method
                    )}`}
                  >
                    {selectedItem.cleaned.request?.method || 'REQ'}
                  </span>
                  <span
                    className="text-xs text-text-sub font-mono break-all sm:truncate select-all flex-1 leading-4 sm:leading-normal"
                    title={selectedItem.cleaned.request?.url}
                  >
                    {selectedItem.cleaned.request?.url}
                  </span>
                </div>
              </div>
            </div>

            {/* 電腦版關閉按鈕 */}
            <button
              type="button"
              onClick={onClose}
              className="hidden sm:flex text-text-sub hover:text-text-main w-8 h-8 rounded-xl bg-select-bg border border-border-glass items-center justify-center transition-colors text-sm font-bold flex-shrink-0 self-start mt-0.5"
              aria-label="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Sub-Tabs 導航條 */}
        <div className={styles.modalTabs}>
          <button
            type="button"
            onClick={(e) => {
              setModalTab('overview');
              e.currentTarget.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
              });
            }}
            className={`${styles.modalTabBtn} ${
              modalTab === 'overview' ? styles.modalTabBtnActive : ''
            }`}
          >
            {t.modalTabOverview}
          </button>
          <button
            type="button"
            onClick={(e) => {
              setModalTab('request');
              e.currentTarget.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
              });
            }}
            className={`${styles.modalTabBtn} ${
              modalTab === 'request' ? styles.modalTabBtnActive : ''
            }`}
          >
            {t.modalTabRequest} ({selectedItem.cleaned.request?.headers?.length || 0})
          </button>
          <button
            type="button"
            onClick={(e) => {
              setModalTab('response');
              e.currentTarget.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
              });
            }}
            className={`${styles.modalTabBtn} ${
              modalTab === 'response' ? styles.modalTabBtnActive : ''
            }`}
          >
            {t.modalTabResponse} ({selectedItem.cleaned.response?.headers?.length || 0})
          </button>
          <button
            type="button"
            onClick={(e) => {
              setModalTab('raw');
              e.currentTarget.scrollIntoView({
                behavior: 'smooth',
                inline: 'center',
                block: 'nearest',
              });
            }}
            className={`${styles.modalTabBtn} ${modalTab === 'raw' ? styles.modalTabBtnActive : ''}`}
          >
            {t.modalTabRaw}
          </button>
        </div>

        {/* Modal 內容區 */}
        <div className={styles.modalBody}>
          {/* 1. 概覽 TAB */}
          {modalTab === 'overview' && (
            <div className="space-y-4">
              {/* 基本資訊卡片 */}
              <div className="p-4 rounded-xl bg-select-bg border border-border-glass space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider ${getMethodBadgeClass(
                        selectedItem.cleaned.request?.method
                      )}`}
                    >
                      {selectedItem.cleaned.request?.method || 'REQ'}
                    </span>
                    <span className="text-xs text-text-sub font-medium">Request URL:</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(selectedItem.cleaned.request?.url || '', 'url')}
                    className={styles.copyMiniBtn}
                  >
                    {copiedField === 'url' ? t.copiedSingle : t.modalCopyUrl}
                  </button>
                </div>

                <div
                  className={`p-3 font-mono text-xs text-text-main break-all leading-relaxed select-all ${styles.urlDisplayCard}`}
                >
                  {selectedItem.cleaned.request?.url}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border-glass text-xs">
                  <div>
                    <div className="text-text-sub mb-0.5">Method:</div>
                    <div className="font-mono font-bold text-text-main">
                      {selectedItem.cleaned.request?.method}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-sub mb-0.5">Status:</div>
                    <div className="font-mono font-bold text-text-main">
                      {selectedItem.cleaned.response?.status}{' '}
                      {selectedItem.cleaned.response?.statusText}
                    </div>
                  </div>
                  <div>
                    <div className="text-text-sub mb-0.5">{t.modalTiming}:</div>
                    <div className="font-mono font-bold text-text-main">
                      {Math.round(selectedItem.cleaned.time || 0)} ms
                    </div>
                  </div>
                  <div>
                    <div className="text-text-sub mb-0.5">{t.modalMimeType}:</div>
                    <div className="font-mono text-text-main truncate">
                      {selectedItem.cleaned.response?.content?.mimeType || '-'}
                    </div>
                  </div>
                </div>
              </div>

              {/* 脫敏觸發詳細審核表 */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-text-main flex items-center gap-1.5">
                    <ShieldIcon />
                    <span>{t.modalTriggersTitle}</span>
                  </div>
                  <span className="text-xs text-text-sub font-mono">
                    {selectedItem.reasons.length}{' '}
                    {selectedItem.reasons.length === 1 ? 'total hit' : 'total hits'}
                  </span>
                </div>

                {selectedItem.reasons.length > 0 ? (
                  <>
                    {/* 手機版：直式脫敏審核卡片清單 */}
                    <div className="block sm:hidden space-y-2.5">
                      {parseStructuredRedactions(selectedItem.reasons, lang).map((item, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-select-bg border border-border-glass space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span
                              className={`whitespace-nowrap inline-block ${
                                item.scopeType === 'post_json'
                                  ? styles.scopeBadgePost
                                  : item.scopeType === 'response_json'
                                  ? styles.scopeBadgeRes
                                  : item.scopeType === 'header'
                                  ? styles.scopeBadgeReq
                                  : item.scopeType === 'cookie'
                                  ? styles.scopeBadgeBoth
                                  : styles.scopeBadgeReq
                              }`}
                            >
                              {item.scope}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${styles.badgeOriginal}`}
                            >
                              {item.hitCount}{' '}
                              {lang === 'en'
                                ? item.hitCount === 1
                                  ? 'hit'
                                  : 'hits'
                                : '處命中'}
                            </span>
                          </div>
                          <div>
                            <div className="font-mono font-bold text-text-main text-xs break-all">
                              {item.fieldPath}
                            </div>
                            {item.samplePath && (
                              <div className="text-xs text-text-sub font-mono truncate mt-0.5 opacity-80">
                                {lang === 'en' ? 'Sample: ' : '範例：'}
                                {item.samplePath}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center justify-between pt-2 border-t border-border-glass text-xs">
                            <span className="text-text-sub">{item.ruleCategory}</span>
                            <span
                              className={`inline-flex items-center gap-1 font-medium ${styles.badgeCleaned}`}
                            >
                              <CheckIcon />
                              <span>{item.action}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 平板與電腦版：標準 5 欄完整審核表格 */}
                    <div className="hidden sm:block rounded-xl border border-border-glass bg-select-bg overflow-hidden">
                      <div className="overflow-x-auto w-full">
                        <table className={`${styles.kvTable} w-full min-w-[560px]`}>
                          <thead>
                            <tr>
                              <th className="w-32 min-w-[100px] whitespace-nowrap">
                                {lang === 'en' ? 'Scope / Location' : '來源位置'}
                              </th>
                              <th className="w-auto min-w-[180px]">
                                {lang === 'en' ? 'Field / Path' : '目標欄位與路徑'}
                              </th>
                              <th className="w-44 min-w-[130px] whitespace-nowrap">
                                {lang === 'en' ? 'Matched Rule' : '命中規則'}
                              </th>
                              <th className="w-20 min-w-[70px] text-center whitespace-nowrap">
                                {lang === 'en' ? 'Hits' : '命中次數'}
                              </th>
                              <th className="w-40 min-w-[130px] text-right whitespace-nowrap">
                                {lang === 'en' ? 'Action' : '處理動作'}
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {parseStructuredRedactions(selectedItem.reasons, lang).map((item, idx) => (
                              <tr key={idx} className="hover:bg-white/[0.02]">
                                <td>
                                  <span
                                    className={`whitespace-nowrap inline-block ${
                                      item.scopeType === 'post_json'
                                        ? styles.scopeBadgePost
                                        : item.scopeType === 'response_json'
                                        ? styles.scopeBadgeRes
                                        : item.scopeType === 'header'
                                        ? styles.scopeBadgeReq
                                        : item.scopeType === 'cookie'
                                        ? styles.scopeBadgeBoth
                                        : styles.scopeBadgeReq
                                    }`}
                                  >
                                    {item.scope}
                                  </span>
                                </td>
                                <td>
                                  <div className="font-mono font-semibold text-text-main text-xs break-all">
                                    {item.fieldPath}
                                  </div>
                                  {item.samplePath && (
                                    <div className="text-xs text-text-sub font-mono truncate max-w-xs mt-0.5 opacity-80">
                                      {lang === 'en' ? 'Array sample: ' : '陣列範例：'}
                                      {item.samplePath}
                                    </div>
                                  )}
                                </td>
                                <td>
                                  <span className="text-xs text-text-sub font-medium">
                                    {item.ruleCategory}
                                  </span>
                                </td>
                                <td className="text-center font-mono">
                                  <span
                                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${styles.badgeOriginal}`}
                                  >
                                    {item.hitCount}
                                  </span>
                                </td>
                                <td className="text-right">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${styles.badgeCleaned}`}
                                  >
                                    <CheckIcon />
                                    <span>{item.action}</span>
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-select-bg border border-border-glass text-xs text-text-sub">
                    {t.modalNoRedactions}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 2. 請求 (Request) TAB */}
          {modalTab === 'request' && (
            <div className="space-y-5">
              {/* Request Query Parameters */}
              {selectedItem.cleaned.request?.queryString?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-text-main">
                    {t.modalQueryParamsTitle}
                  </div>

                  {/* 手機版：直式卡片清單 */}
                  <div className="block sm:hidden space-y-2">
                    {selectedItem.cleaned.request.queryString.map((q: any, idx: number) => {
                      const isRedacted = q.value === redactionText;
                      const origQuery = selectedItem.original.request?.queryString?.[idx];
                      const origVal = origQuery?.value ?? q.value;
                      const rowKey = `query_${idx}`;
                      const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-select-bg border border-border-glass space-y-1.5"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono font-bold text-xs text-text-main break-all">
                              {q.name}
                            </span>
                            <div className="flex items-center gap-1.5 flex-shrink-0">
                              {isRedacted && (
                                <button
                                  type="button"
                                  onClick={() => toggleShowOriginal(rowKey)}
                                  className={`${styles.copyMiniBtn} ${
                                    isShowingOriginal ? styles.modalTabBtnActive : ''
                                  }`}
                                  title={
                                    isShowingOriginal
                                      ? lang === 'en'
                                        ? 'Hide original value'
                                        : '隱藏原值'
                                      : lang === 'en'
                                      ? 'Show original value'
                                      : '查看原值'
                                  }
                                >
                                  {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  copyText(isShowingOriginal ? origVal : q.value, rowKey)
                                }
                                className={styles.copyMiniBtn}
                              >
                                {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                              </button>
                            </div>
                          </div>
                          <div className="font-mono text-xs">
                            {isShowingOriginal ? (
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className={`${styles.badgeOriginal} select-all break-all`}>
                                  {origVal || '(empty)'}
                                </span>
                                <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                  {lang === 'en' ? 'Original' : '原值'}
                                </span>
                              </div>
                            ) : (
                              <span
                                className={isRedacted ? styles.redactedValue : 'text-text-main break-all'}
                              >
                                {q.value}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* 平板與電腦版：表格 */}
                  <div className="hidden sm:block rounded-xl border border-border-glass bg-select-bg overflow-hidden">
                    <div className="overflow-x-auto w-full">
                      <table className={`${styles.kvTable} min-w-[500px]`}>
                        <thead>
                          <tr>
                            <th className="w-1/4 min-w-[120px]">{t.modalNameCol}</th>
                            <th className="w-auto">{t.modalValueCol}</th>
                            <th className="w-28 min-w-[90px] text-right whitespace-nowrap">
                              {t.modalActionCol}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedItem.cleaned.request.queryString.map((q: any, idx: number) => {
                            const isRedacted = q.value === redactionText;
                            const origQuery = selectedItem.original.request?.queryString?.[idx];
                            const origVal = origQuery?.value ?? q.value;
                            const rowKey = `query_${idx}`;
                            const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                            return (
                              <tr
                                key={idx}
                                className="border-b border-border-glass/40 hover:bg-white/[0.02]"
                              >
                                <td className="font-mono font-medium text-text-main align-middle">
                                  {q.name}
                                </td>
                                <td className="font-mono align-middle">
                                  {isShowingOriginal ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`${styles.badgeOriginal} select-all break-all`}>
                                        {origVal || '(empty)'}
                                      </span>
                                      <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                        {lang === 'en' ? 'Original' : '原值'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span
                                      className={
                                        isRedacted ? styles.redactedValue : 'text-text-main break-all'
                                      }
                                    >
                                      {q.value}
                                    </span>
                                  )}
                                </td>
                                <td className="w-28 min-w-[90px] text-right whitespace-nowrap align-middle">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {isRedacted && (
                                      <button
                                        type="button"
                                        onClick={() => toggleShowOriginal(rowKey)}
                                        className={`${styles.copyMiniBtn} ${
                                          isShowingOriginal ? styles.modalTabBtnActive : ''
                                        }`}
                                        title={
                                          isShowingOriginal
                                            ? lang === 'en'
                                              ? 'Hide original value'
                                              : '隱藏原值'
                                            : lang === 'en'
                                            ? 'Show original value'
                                            : '查看原值'
                                        }
                                      >
                                        {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        copyText(isShowingOriginal ? origVal : q.value, rowKey)
                                      }
                                      className={styles.copyMiniBtn}
                                    >
                                      {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Request Headers */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-text-main">
                  {t.modalReqHeadersTitle}
                </div>

                {/* 手機版：直式卡片清單 */}
                <div className="block sm:hidden space-y-2">
                  {selectedItem.cleaned.request?.headers?.map((h: any, idx: number) => {
                    const isRedacted = h.value === redactionText;
                    const origHeader =
                      selectedItem.original.request?.headers?.find(
                        (orig: any) => (orig.name || '').toLowerCase() === (h.name || '').toLowerCase()
                      ) || selectedItem.original.request?.headers?.[idx];
                    const origVal = origHeader?.value ?? h.value;
                    const rowKey = `req_h_${idx}`;
                    const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-select-bg border border-border-glass space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs text-text-main break-all">
                            {h.name}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isRedacted && (
                              <button
                                type="button"
                                onClick={() => toggleShowOriginal(rowKey)}
                                className={`${styles.copyMiniBtn} ${
                                  isShowingOriginal ? styles.modalTabBtnActive : ''
                                }`}
                                title={
                                  isShowingOriginal
                                    ? lang === 'en'
                                      ? 'Hide original value'
                                      : '隱藏原值'
                                    : lang === 'en'
                                    ? 'Show original value'
                                    : '查看原值'
                                }
                              >
                                {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                copyText(isShowingOriginal ? origVal : h.value, rowKey)
                              }
                              className={styles.copyMiniBtn}
                            >
                              {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                            </button>
                          </div>
                        </div>
                        <div className="font-mono text-xs">
                          {isShowingOriginal ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`${styles.badgeOriginal} select-all break-all`}>
                                {origVal || '(empty)'}
                              </span>
                              <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                {lang === 'en' ? 'Original' : '原值'}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={isRedacted ? styles.redactedValue : 'text-text-main break-all'}
                            >
                              {h.value}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }) || (
                    <div className="p-3 rounded-xl bg-select-bg border border-border-glass text-xs text-text-sub text-center">
                      {t.noHeaders}
                    </div>
                  )}
                </div>

                {/* 平板與電腦版：表格 */}
                <div className="hidden sm:block rounded-xl border border-border-glass bg-select-bg overflow-hidden">
                  <div className="overflow-x-auto w-full">
                    <table className={`${styles.kvTable} min-w-[500px]`}>
                      <thead>
                        <tr>
                          <th className="w-1/4 min-w-[120px]">{t.modalNameCol}</th>
                          <th className="w-auto">{t.modalValueCol}</th>
                          <th className="w-28 min-w-[90px] text-right whitespace-nowrap">
                            {t.modalActionCol}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem.cleaned.request?.headers?.map((h: any, idx: number) => {
                          const isRedacted = h.value === redactionText;
                          const origHeader =
                            selectedItem.original.request?.headers?.find(
                              (orig: any) =>
                                (orig.name || '').toLowerCase() === (h.name || '').toLowerCase()
                            ) || selectedItem.original.request?.headers?.[idx];
                          const origVal = origHeader?.value ?? h.value;
                          const rowKey = `req_h_${idx}`;
                          const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                          return (
                            <tr
                              key={idx}
                              className="border-b border-border-glass/40 hover:bg-white/[0.02]"
                            >
                              <td className="font-mono font-medium text-text-main align-middle">
                                {h.name}
                              </td>
                              <td className="font-mono align-middle">
                                {isShowingOriginal ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`${styles.badgeOriginal} select-all break-all`}>
                                      {origVal || '(empty)'}
                                    </span>
                                    <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                      {lang === 'en' ? 'Original' : '原值'}
                                    </span>
                                  </div>
                                ) : (
                                  <span
                                    className={
                                      isRedacted ? styles.redactedValue : 'text-text-main break-all'
                                    }
                                  >
                                    {h.value}
                                  </span>
                                )}
                              </td>
                              <td className="w-28 min-w-[90px] text-right whitespace-nowrap align-middle">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isRedacted && (
                                    <button
                                      type="button"
                                      onClick={() => toggleShowOriginal(rowKey)}
                                      className={`${styles.copyMiniBtn} ${
                                        isShowingOriginal ? styles.modalTabBtnActive : ''
                                      }`}
                                      title={
                                        isShowingOriginal
                                          ? lang === 'en'
                                            ? 'Hide original value'
                                            : '隱藏原值'
                                          : lang === 'en'
                                          ? 'Show original value'
                                          : '查看原值'
                                      }
                                    >
                                      {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyText(isShowingOriginal ? origVal : h.value, rowKey)
                                    }
                                    className={styles.copyMiniBtn}
                                  >
                                    {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }) || (
                          <tr>
                            <td colSpan={3} className="text-center text-text-sub">
                              {t.noHeaders}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Request POST Payload */}
              {selectedItem.cleaned.request?.postData && (() => {
                const cleanedPostFormatted = formatPayload(
                  selectedItem.cleaned.request?.postData?.text || selectedItem.cleaned.request?.postData
                );
                const origPostFormatted = formatPayload(
                  selectedItem.original.request?.postData?.text || selectedItem.original.request?.postData
                );

                return (
                  <div className="space-y-3 min-w-0 max-w-full">
                    {/* If Post Params exist (Form Data) */}
                    {selectedItem.cleaned.request.postData.params?.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-text-main">
                          POST Form Data Parameters
                        </div>

                        {/* 手機版：直式卡片清單 */}
                        <div className="block sm:hidden space-y-2">
                          {selectedItem.cleaned.request.postData.params.map((p: any, idx: number) => {
                            const isRedacted = p.value === redactionText;
                            const origParam = selectedItem.original.request?.postData?.params?.[idx];
                            const origVal = origParam?.value ?? p.value;
                            const rowKey = `post_param_${idx}`;
                            const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                            return (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-select-bg border border-border-glass space-y-1.5"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono font-bold text-xs text-text-main break-all">
                                    {p.name}
                                  </span>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {isRedacted && (
                                      <button
                                        type="button"
                                        onClick={() => toggleShowOriginal(rowKey)}
                                        className={`${styles.copyMiniBtn} ${
                                          isShowingOriginal ? styles.modalTabBtnActive : ''
                                        }`}
                                        title={
                                          isShowingOriginal
                                            ? lang === 'en'
                                              ? 'Hide original value'
                                              : '隱藏原值'
                                            : lang === 'en'
                                            ? 'Show original value'
                                            : '查看原值'
                                        }
                                      >
                                        {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        copyText(isShowingOriginal ? origVal : p.value, rowKey)
                                      }
                                      className={styles.copyMiniBtn}
                                    >
                                      {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                                    </button>
                                  </div>
                                </div>
                                <div className="font-mono text-xs">
                                  {isShowingOriginal ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`${styles.badgeOriginal} select-all break-all`}>
                                        {origVal || '(empty)'}
                                      </span>
                                      <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                        {lang === 'en' ? 'Original' : '原值'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span
                                      className={
                                        isRedacted ? styles.redactedValue : 'text-text-main break-all'
                                      }
                                    >
                                      {p.value}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* 平板與電腦版：表格 */}
                        <div className="hidden sm:block rounded-xl border border-border-glass bg-select-bg overflow-hidden">
                          <div className="overflow-x-auto w-full">
                            <table className={`${styles.kvTable} min-w-[500px]`}>
                              <thead>
                                <tr>
                                  <th className="w-1/4 min-w-[120px]">{t.modalNameCol}</th>
                                  <th className="w-auto">{t.modalValueCol}</th>
                                  <th className="w-28 min-w-[90px] text-right whitespace-nowrap">
                                    {t.modalActionCol}
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedItem.cleaned.request.postData.params.map(
                                  (p: any, idx: number) => {
                                    const isRedacted = p.value === redactionText;
                                    const origParam =
                                      selectedItem.original.request?.postData?.params?.[idx];
                                    const origVal = origParam?.value ?? p.value;
                                    const rowKey = `post_param_${idx}`;
                                    const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                                    return (
                                      <tr
                                        key={idx}
                                        className="border-b border-border-glass/40 hover:bg-white/[0.02]"
                                      >
                                        <td className="font-mono font-medium text-text-main align-middle">
                                          {p.name}
                                        </td>
                                        <td className="font-mono align-middle">
                                          {isShowingOriginal ? (
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <span
                                                className={`${styles.badgeOriginal} select-all break-all`}
                                              >
                                                {origVal || '(empty)'}
                                              </span>
                                              <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                                {lang === 'en' ? 'Original' : '原值'}
                                              </span>
                                            </div>
                                          ) : (
                                            <span
                                              className={
                                                isRedacted
                                                  ? styles.redactedValue
                                                  : 'text-text-main break-all'
                                              }
                                            >
                                              {p.value}
                                            </span>
                                          )}
                                        </td>
                                        <td className="w-28 min-w-[90px] text-right whitespace-nowrap align-middle">
                                          <div className="flex items-center justify-end gap-1.5">
                                            {isRedacted && (
                                              <button
                                                type="button"
                                                onClick={() => toggleShowOriginal(rowKey)}
                                                className={`${styles.copyMiniBtn} ${
                                                  isShowingOriginal ? styles.modalTabBtnActive : ''
                                                }`}
                                                title={
                                                  isShowingOriginal
                                                    ? lang === 'en'
                                                      ? 'Hide original value'
                                                      : '隱藏原值'
                                                    : lang === 'en'
                                                    ? 'Show original value'
                                                    : '查看原值'
                                                }
                                              >
                                                {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                              </button>
                                            )}
                                            <button
                                              type="button"
                                              onClick={() =>
                                                copyText(
                                                  isShowingOriginal ? origVal : p.value,
                                                  rowKey
                                                )
                                              }
                                              className={styles.copyMiniBtn}
                                            >
                                              {copiedField === rowKey
                                                ? t.copiedSingle
                                                : t.copyBtnText}
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  }
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Raw or JSON Text */}
                    {(selectedItem.cleaned.request.postData.text ||
                      !selectedItem.cleaned.request.postData.params?.length) && (
                      <div className="space-y-2 min-w-0 max-w-full">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="text-xs font-semibold text-text-main flex items-center gap-2">
                            <span>{t.modalPostDataTitle}</span>
                            {selectedItem.cleaned.request.postData.mimeType && (
                              <span className="text-xs font-normal text-text-sub font-mono">
                                ({selectedItem.cleaned.request.postData.mimeType})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* 檢視模式切換器 */}
                            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-select-bg border border-border-glass">
                              <button
                                type="button"
                                onClick={() => setPostBodyMode('cleaned')}
                                className={`${styles.viewModeBtn} ${
                                  postBodyMode === 'cleaned' ? styles.viewModeBtnActive : ''
                                }`}
                              >
                                {lang === 'en' ? 'Cleaned' : '脫敏後'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setPostBodyMode('original')}
                                className={`${styles.viewModeBtn} ${
                                  postBodyMode === 'original' ? styles.viewModeBtnActive : ''
                                }`}
                              >
                                {lang === 'en' ? 'Original' : '原始內容'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setPostBodyMode('split')}
                                className={`${styles.viewModeBtn} ${
                                  postBodyMode === 'split' ? styles.viewModeBtnActive : ''
                                }`}
                              >
                                {lang === 'en' ? 'Split Diff' : '左右對照'}
                              </button>
                            </div>
                            <button
                              type="button"
                              onClick={() =>
                                copyText(
                                  postBodyMode === 'original'
                                    ? origPostFormatted
                                    : cleanedPostFormatted,
                                  'post_body'
                                )
                              }
                              className={styles.copyMiniBtn}
                            >
                              {copiedField === 'post_body' ? t.copiedSingle : t.copyBtnText}
                            </button>
                          </div>
                        </div>

                        {/* Split Diff 左右對照模式 */}
                        {postBodyMode === 'split' ? (
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-w-0 w-full">
                            <div className="space-y-1 min-w-0">
                              <div className="text-xs font-semibold text-text-sub flex items-center justify-between">
                                <span className={styles.badgeOriginal}>
                                  {t.modalOriginalVersion}
                                </span>
                                <span className="text-xs font-mono font-normal">
                                  {origPostFormatted.length} chars
                                </span>
                              </div>
                              <pre
                                className={`p-3 text-xs overflow-x-auto max-h-72 font-mono text-text-main leading-5 select-all ${styles.codeBox}`}
                              >
                                {origPostFormatted || '(empty)'}
                              </pre>
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="text-xs font-semibold text-text-sub flex items-center justify-between">
                                <span className={styles.badgeCleaned}>
                                  {t.modalCleanedVersion}
                                </span>
                                <span className="text-xs font-mono font-normal">
                                  {cleanedPostFormatted.length} chars
                                </span>
                              </div>
                              <pre
                                className={`p-3 text-xs overflow-x-auto max-h-72 font-mono text-text-main leading-5 select-all ${styles.codeBox}`}
                              >
                                {renderHighlightedCode(cleanedPostFormatted, redactionText) ||
                                  '(empty)'}
                              </pre>
                            </div>
                          </div>
                        ) : (
                          /* 單面板模式 */
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center justify-between text-xs text-text-sub font-mono">
                              <span>
                                {postBodyMode === 'original'
                                  ? t.modalOriginalVersion
                                  : t.modalCleanedVersion}
                              </span>
                              <span>
                                {(postBodyMode === 'original'
                                  ? origPostFormatted
                                  : cleanedPostFormatted
                                ).length}{' '}
                                chars
                              </span>
                            </div>
                            <pre
                              className={`p-3 text-xs overflow-x-auto max-h-80 font-mono text-text-main leading-5 select-all ${styles.codeBox}`}
                            >
                              {postBodyMode === 'original'
                                ? origPostFormatted || '(empty)'
                                : renderHighlightedCode(cleanedPostFormatted, redactionText) ||
                                  '(empty)'}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 3. 回應 (Response) TAB */}
          {modalTab === 'response' && (
            <div className="space-y-5">
              {/* Response Headers */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-text-main">
                  {t.modalResHeadersTitle}
                </div>

                {/* 手機版：直式卡片清單 */}
                <div className="block sm:hidden space-y-2">
                  {selectedItem.cleaned.response?.headers?.map((h: any, idx: number) => {
                    const isRedacted = h.value === redactionText;
                    const origHeader =
                      selectedItem.original.response?.headers?.find(
                        (orig: any) => (orig.name || '').toLowerCase() === (h.name || '').toLowerCase()
                      ) || selectedItem.original.response?.headers?.[idx];
                    const origVal = origHeader?.value ?? h.value;
                    const rowKey = `res_h_${idx}`;
                    const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-select-bg border border-border-glass space-y-1.5"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-bold text-xs text-text-main break-all">
                            {h.name}
                          </span>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            {isRedacted && (
                              <button
                                type="button"
                                onClick={() => toggleShowOriginal(rowKey)}
                                className={`${styles.copyMiniBtn} ${
                                  isShowingOriginal ? styles.modalTabBtnActive : ''
                                }`}
                                title={
                                  isShowingOriginal
                                    ? lang === 'en'
                                      ? 'Hide original value'
                                      : '隱藏原值'
                                    : lang === 'en'
                                    ? 'Show original value'
                                    : '查看原值'
                                }
                              >
                                {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                copyText(isShowingOriginal ? origVal : h.value, rowKey)
                              }
                              className={styles.copyMiniBtn}
                            >
                              {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                            </button>
                          </div>
                        </div>
                        <div className="font-mono text-xs">
                          {isShowingOriginal ? (
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`${styles.badgeOriginal} select-all break-all`}>
                                {origVal || '(empty)'}
                              </span>
                              <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                {lang === 'en' ? 'Original' : '原值'}
                              </span>
                            </div>
                          ) : (
                            <span
                              className={isRedacted ? styles.redactedValue : 'text-text-main break-all'}
                            >
                              {h.value}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  }) || (
                    <div className="p-3 rounded-xl bg-select-bg border border-border-glass text-xs text-text-sub text-center">
                      {t.noHeaders}
                    </div>
                  )}
                </div>

                {/* 平板與電腦版：表格 */}
                <div className="hidden sm:block rounded-xl border border-border-glass bg-select-bg overflow-hidden">
                  <div className="overflow-x-auto w-full">
                    <table className={`${styles.kvTable} min-w-[500px]`}>
                      <thead>
                        <tr>
                          <th className="w-1/4 min-w-[120px]">{t.modalNameCol}</th>
                          <th className="w-auto">{t.modalValueCol}</th>
                          <th className="w-28 min-w-[90px] text-right whitespace-nowrap">
                            {t.modalActionCol}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedItem.cleaned.response?.headers?.map((h: any, idx: number) => {
                          const isRedacted = h.value === redactionText;
                          const origHeader =
                            selectedItem.original.response?.headers?.find(
                              (orig: any) =>
                                (orig.name || '').toLowerCase() === (h.name || '').toLowerCase()
                            ) || selectedItem.original.response?.headers?.[idx];
                          const origVal = origHeader?.value ?? h.value;
                          const rowKey = `res_h_${idx}`;
                          const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                          return (
                            <tr
                              key={idx}
                              className="border-b border-border-glass/40 hover:bg-white/[0.02]"
                            >
                              <td className="font-mono font-medium text-text-main align-middle">
                                {h.name}
                              </td>
                              <td className="font-mono align-middle">
                                {isShowingOriginal ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`${styles.badgeOriginal} select-all break-all`}>
                                      {origVal || '(empty)'}
                                    </span>
                                    <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                      {lang === 'en' ? 'Original' : '原值'}
                                    </span>
                                  </div>
                                ) : (
                                  <span
                                    className={
                                      isRedacted ? styles.redactedValue : 'text-text-main break-all'
                                    }
                                  >
                                    {h.value}
                                  </span>
                                )}
                              </td>
                              <td className="w-28 min-w-[90px] text-right whitespace-nowrap align-middle">
                                <div className="flex items-center justify-end gap-1.5">
                                  {isRedacted && (
                                    <button
                                      type="button"
                                      onClick={() => toggleShowOriginal(rowKey)}
                                      className={`${styles.copyMiniBtn} ${
                                        isShowingOriginal ? styles.modalTabBtnActive : ''
                                      }`}
                                      title={
                                        isShowingOriginal
                                          ? lang === 'en'
                                            ? 'Hide original value'
                                            : '隱藏原值'
                                          : lang === 'en'
                                          ? 'Show original value'
                                          : '查看原值'
                                      }
                                    >
                                      {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyText(isShowingOriginal ? origVal : h.value, rowKey)
                                    }
                                    className={styles.copyMiniBtn}
                                  >
                                    {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        }) || (
                          <tr>
                            <td colSpan={3} className="text-center text-text-sub">
                              {t.noHeaders}
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Response Body */}
              {selectedItem.cleaned.response?.content && (() => {
                const cleanedResFormatted = formatPayload(
                  selectedItem.cleaned.response?.content?.text || ''
                );
                const origResFormatted = formatPayload(
                  selectedItem.original.response?.content?.text || ''
                );
                const mime = selectedItem.cleaned.response.content.mimeType || 'unknown';

                return (
                  <div className="space-y-3 min-w-0 max-w-full">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div className="text-xs font-semibold text-text-main flex items-center gap-2">
                        <span>{t.modalResBodyTitle}</span>
                        <span className="text-xs font-normal text-text-sub font-mono">({mime})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* 檢視模式切換器 */}
                        <div className="flex items-center gap-1 p-0.5 rounded-lg bg-select-bg border border-border-glass">
                          <button
                            type="button"
                            onClick={() => setResBodyMode('cleaned')}
                            className={`${styles.viewModeBtn} ${
                              resBodyMode === 'cleaned' ? styles.viewModeBtnActive : ''
                            }`}
                          >
                            {lang === 'en' ? 'Cleaned' : '脫敏後'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setResBodyMode('original')}
                            className={`${styles.viewModeBtn} ${
                              resBodyMode === 'original' ? styles.viewModeBtnActive : ''
                            }`}
                          >
                            {lang === 'en' ? 'Original' : '原始內容'}
                          </button>
                          <button
                            type="button"
                            onClick={() => setResBodyMode('split')}
                            className={`${styles.viewModeBtn} ${
                              resBodyMode === 'split' ? styles.viewModeBtnActive : ''
                            }`}
                          >
                            {lang === 'en' ? 'Split Diff' : '左右對照'}
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            copyText(
                              resBodyMode === 'original' ? origResFormatted : cleanedResFormatted,
                              'res_body'
                            )
                          }
                          className={styles.copyMiniBtn}
                        >
                          {copiedField === 'res_body' ? t.copiedSingle : t.copyBtnText}
                        </button>
                      </div>
                    </div>

                    {/* Split Diff 左右對照模式 */}
                    {resBodyMode === 'split' ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 min-w-0 w-full">
                        <div className="space-y-1 min-w-0">
                          <div className="text-xs font-semibold text-text-sub flex items-center justify-between">
                            <span className={styles.badgeOriginal}>
                              {t.modalOriginalVersion}
                            </span>
                            <span className="text-xs font-mono font-normal">
                              {origResFormatted.length} chars
                            </span>
                          </div>
                          <pre
                            className={`p-3 text-xs overflow-x-auto max-h-72 font-mono text-text-main leading-5 select-all ${styles.codeBox}`}
                          >
                            {origResFormatted || '(empty body)'}
                          </pre>
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="text-xs font-semibold text-text-sub flex items-center justify-between">
                            <span className={styles.badgeCleaned}>
                              {t.modalCleanedVersion}
                            </span>
                            <span className="text-xs font-mono font-normal">
                              {cleanedResFormatted.length} chars
                            </span>
                          </div>
                          <pre
                            className={`p-3 text-xs overflow-x-auto max-h-72 font-mono text-text-main leading-5 select-all ${styles.codeBox}`}
                          >
                            {renderHighlightedCode(cleanedResFormatted, redactionText) ||
                              '(empty body)'}
                          </pre>
                        </div>
                      </div>
                    ) : (
                      /* 單面板模式 */
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center justify-between text-xs text-text-sub font-mono">
                          <span>
                            {resBodyMode === 'original'
                              ? t.modalOriginalVersion
                              : t.modalCleanedVersion}
                          </span>
                          <span>
                            {(resBodyMode === 'original'
                              ? origResFormatted
                              : cleanedResFormatted
                            ).length}{' '}
                            chars
                          </span>
                        </div>
                        <pre
                          className={`p-3 text-xs overflow-x-auto max-h-80 font-mono text-text-main leading-5 select-all ${styles.codeBox}`}
                        >
                          {resBodyMode === 'original'
                            ? origResFormatted || '(empty body)'
                            : renderHighlightedCode(cleanedResFormatted, redactionText) ||
                              '(empty body)'}
                        </pre>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          {/* 4. 原始 JSON 對照 (Raw Diff) TAB */}
          {modalTab === 'raw' && (
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
                  onClick={() =>
                    copyText(
                      JSON.stringify(
                        modalRawMode === 'cleaned' ? selectedItem.cleaned : selectedItem.original,
                        null,
                        2
                      ),
                      'raw_json'
                    )
                  }
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
          )}
        </div>
      </div>
    </div>
  );
}

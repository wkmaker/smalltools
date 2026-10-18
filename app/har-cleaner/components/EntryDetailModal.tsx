'use client';

import React, { useState, useEffect } from 'react';
import type { HarEntryAnalysis } from '../types';
import { ShieldIcon } from './Icons';
import { getEntryRuleCategoriesCount } from '../engine/sanitizer';
import styles from '../har-cleaner.module.css';

import OverviewTab from './modal/OverviewTab';
import RequestTab from './modal/RequestTab';
import ResponseTab from './modal/ResponseTab';
import RawJsonView from './modal/RawJsonView';

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
    const escaped = uniqueTokens.map((tok) => tok.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
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
          {modalTab === 'overview' && (
            <OverviewTab
              selectedItem={selectedItem}
              lang={lang}
              t={t}
              copiedField={copiedField}
              copyText={copyText}
              getMethodBadgeClass={getMethodBadgeClass}
            />
          )}

          {modalTab === 'request' && (
            <RequestTab
              selectedItem={selectedItem}
              redactionText={redactionText}
              lang={lang}
              t={t}
              showOriginalMap={showOriginalMap}
              toggleShowOriginal={toggleShowOriginal}
              copiedField={copiedField}
              copyText={copyText}
              postBodyMode={postBodyMode}
              setPostBodyMode={setPostBodyMode}
              renderHighlightedCode={renderHighlightedCode}
            />
          )}

          {modalTab === 'response' && (
            <ResponseTab
              selectedItem={selectedItem}
              redactionText={redactionText}
              lang={lang}
              t={t}
              showOriginalMap={showOriginalMap}
              toggleShowOriginal={toggleShowOriginal}
              copiedField={copiedField}
              copyText={copyText}
              resBodyMode={resBodyMode}
              setResBodyMode={setResBodyMode}
              renderHighlightedCode={renderHighlightedCode}
            />
          )}

          {modalTab === 'raw' && (
            <RawJsonView
              selectedItem={selectedItem}
              modalRawMode={modalRawMode}
              setModalRawMode={setModalRawMode}
              redactionText={redactionText}
              t={t}
              copiedField={copiedField}
              copyText={copyText}
              renderHighlightedCode={renderHighlightedCode}
            />
          )}
        </div>
      </div>
    </div>
  );
}

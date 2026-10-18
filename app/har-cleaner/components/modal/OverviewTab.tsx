'use client';

import React from 'react';
import type { HarEntryAnalysis } from '../../types';
import { ShieldIcon, CheckIcon } from '../Icons';
import { parseStructuredRedactions } from '../../engine/sanitizer';
import styles from '../../har-cleaner.module.css';

interface OverviewTabProps {
  selectedItem: HarEntryAnalysis;
  lang: 'zh-TW' | 'en';
  t: any;
  copiedField: string | null;
  copyText: (text: string, fieldId: string) => void;
  getMethodBadgeClass: (method: string | undefined) => string;
}

export default function OverviewTab({
  selectedItem,
  lang,
  t,
  copiedField,
  copyText,
  getMethodBadgeClass,
}: OverviewTabProps) {
  return (
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
  );
}

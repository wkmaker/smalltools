'use client';

import React from 'react';
import { DetectedHeaderItem } from '../types';
import { ListCheckIcon } from './Icons';
import styles from '../har-cleaner.module.css';

interface HeaderAuditSectionProps {
  detectedHeadersList: DetectedHeaderItem[];
  excludedHeaders: Record<string, boolean>;
  lang: 'zh-TW' | 'en';
  t: any;
  onToggleHeaderRedaction: (normalizedName: string) => void;
  onSelectAllHeaders: () => void;
  onDeselectAllHeaders: () => void;
}

export default function HeaderAuditSection({
  detectedHeadersList,
  excludedHeaders,
  lang,
  t,
  onToggleHeaderRedaction,
  onSelectAllHeaders,
  onDeselectAllHeaders,
}: HeaderAuditSectionProps) {
  const totalHits = detectedHeadersList.reduce((acc, h) => acc + h.count, 0);

  return (
    <div className="w-full rounded-2xl p-6 bg-surface-glass border border-border-glass space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-glass pb-3">
        <div>
          <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
            <ListCheckIcon />
            <span>{t.headersSectionTitle}</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-select-bg border border-border-glass text-text-sub font-mono font-medium">
              {detectedHeadersList.length} Unique Headers ({totalHits} Total Hits)
            </span>
          </h2>
          <p className="text-xs text-text-sub mt-1 max-w-3xl">
            {t.headersSectionSubtitle}
          </p>
        </div>

        {/* 批次操作快捷按鈕 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAllHeaders}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium ${styles.secondaryBtn}`}
          >
            {t.headersSelectAll}
          </button>
          <button
            type="button"
            onClick={onDeselectAllHeaders}
            className="text-xs px-3 py-1.5 rounded-lg font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
          >
            {t.headersDeselectAll}
          </button>
        </div>
      </div>

      {detectedHeadersList.length === 0 ? (
        <div className="py-8 text-center text-xs text-text-sub">
          {t.headersNoSensitiveFound}
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {detectedHeadersList.map((header) => {
            const isRedacted = !excludedHeaders[header.normalizedName];

            let scopeBadgeClass = styles.scopeBadgeReq;
            let scopeLabel = t.scopeReq;
            if (header.scope === 'response') {
              scopeBadgeClass = styles.scopeBadgeRes;
              scopeLabel = t.scopeRes;
            } else if (header.scope === 'both') {
              scopeBadgeClass = styles.scopeBadgeBoth;
              scopeLabel = t.scopeBoth;
            }

            return (
              <div
                key={header.normalizedName}
                onClick={() => onToggleHeaderRedaction(header.normalizedName)}
                className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                  isRedacted
                    ? 'bg-select-bg/80 border-border-glass hover:border-[var(--theme-color)]'
                    : 'bg-black/10 border-border-glass opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={isRedacted}
                    onChange={() => {}} // Controlled via row click
                    className="rounded accent-[var(--theme-color)] cursor-pointer"
                  />
                  {/* Header Name & Scope */}
                  <div className="min-w-0 flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold font-mono text-text-main">
                      {header.name}
                    </span>
                    <span className={scopeBadgeClass}>{scopeLabel}</span>
                    <span className={styles.ruleBadge}>{header.matchedRule}</span>
                  </div>
                </div>

                {/* Count & Sample Value Preview */}
                <div className="flex items-center gap-2.5 flex-shrink-0 text-xs">
                  <span className={styles.hitsBadge}>
                    {header.count} hits
                  </span>
                  {header.sampleValue && (
                    <div
                      className={styles.sampleValueBadge}
                      title={`${lang === 'en' ? 'Sample Header Value:' : '標頭原始值預覽：'} ${header.sampleValue}`}
                    >
                      <span className="text-xs text-text-sub uppercase font-sans font-semibold">
                        {lang === 'en' ? 'Value:' : '預覽:'}
                      </span>
                      <span className="truncate font-semibold text-text-main">
                        {header.sampleValue}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

'use client';

import React from 'react';
import { SanitizedStats } from '../types';
import styles from '../har-cleaner.module.css';

interface SummaryTabProps {
  stats: SanitizedStats;
  savingsPercent: number;
  t: any;
  formatBytes: (bytes: number) => string;
}

export default function SummaryTab({
  stats,
  savingsPercent,
  t,
  formatBytes,
}: SummaryTabProps) {
  return (
    <div className="rounded-2xl p-6 bg-surface-glass border border-border-glass space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 脫敏類別細部統計 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-main">{t.summaryBreakdownTitle}</h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
              <span className="text-text-sub">{t.summaryBreakdownHeaders}:</span>
              <span className="font-mono font-bold text-text-main">{stats.redactedHeaders}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
              <span className="text-text-sub">{t.summaryBreakdownCookies}:</span>
              <span className="font-mono font-bold text-text-main">{stats.redactedCookies}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
              <span className="text-text-sub">{t.summaryBreakdownQuery}:</span>
              <span className="font-mono font-bold text-text-main">{stats.redactedQueryParams}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
              <span className="text-text-sub">{t.summaryBreakdownBody}:</span>
              <span className="font-mono font-bold text-text-main">{stats.redactedBodies}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
              <span className="text-text-sub">{t.breakdownCreditCards}:</span>
              <span className="font-mono font-bold text-text-main">{stats.redactedCreditCards}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
              <span className="text-text-sub">{t.breakdownCustomKeys}:</span>
              <span className="font-mono font-bold text-text-main">{stats.redactedCustomKeywords}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
              <span className="text-text-sub">{t.summaryBreakdownRegex}:</span>
              <span className="font-mono font-bold text-text-main">{stats.redactedRegexItems}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
              <span className="text-text-sub">{t.summaryBreakdownMedia}:</span>
              <span className="font-mono font-bold text-text-main">{stats.strippedMediaItems}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
              <span className="text-text-sub">{t.summaryBreakdownTrackers}:</span>
              <span className="font-mono font-bold text-text-main">{stats.strippedTrackers}</span>
            </div>
          </div>
        </div>

        {/* 體積瘦身對比 */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-text-main">{t.summaryCompressionTitle}</h3>
          <div className="p-4 rounded-xl bg-select-bg border border-border-glass space-y-4">
            <div>
              <div className="flex justify-between text-xs text-text-sub mb-1">
                <span>{t.summaryOriginalSize}:</span>
                <span className="font-mono font-bold text-text-main">{formatBytes(stats.originalSizeBytes)}</span>
              </div>
              <div className="flex justify-between text-xs text-text-sub mb-1">
                <span>{t.summaryCleanedSize}:</span>
                <span className={`font-mono font-bold ${styles.themeAccentText}`}>{formatBytes(stats.cleanedSizeBytes)}</span>
              </div>
              <div className="flex justify-between text-xs text-text-sub">
                <span>{t.summarySavingsRatio}:</span>
                <span className={`font-mono font-bold ${styles.savingsText}`}>-{savingsPercent}%</span>
              </div>
            </div>
            {/* 進度條 */}
            <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
              <div
                className={`h-full ${styles.themeAccentBg} transition-all duration-500`}
                style={{
                  width: `${Math.min(
                    100,
                    (stats.cleanedSizeBytes / (stats.originalSizeBytes || 1)) * 100
                  )}%`,
                }}
              />
            </div>
            <p className="text-xs text-text-sub leading-relaxed">
              {t.summaryStandardNote}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

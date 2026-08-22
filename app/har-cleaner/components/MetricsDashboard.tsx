'use client';

import React from 'react';
import { SanitizedStats } from '../types';
import styles from '../har-cleaner.module.css';

interface MetricsDashboardProps {
  stats: SanitizedStats;
  savingsPercent: number;
  t: any;
  formatBytes: (bytes: number) => string;
}

export default function MetricsDashboard({
  stats,
  savingsPercent,
  t,
  formatBytes,
}: MetricsDashboardProps) {
  const totalRedactedItems =
    stats.redactedHeaders +
    stats.redactedCookies +
    stats.redactedQueryParams +
    stats.redactedBodies +
    stats.redactedRegexItems +
    stats.redactedCustomKeywords +
    stats.redactedCreditCards +
    stats.strippedMediaItems +
    stats.strippedTrackers;

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <div className={styles.statCard}>
        <div className="text-xs text-text-sub font-medium mb-1">{t.statsTotalRequests}</div>
        <div className={styles.statValue}>{stats.totalRequests}</div>
      </div>
      <div className={styles.statCard}>
        <div className="text-xs text-text-sub font-medium mb-1">{t.statsSanitizedRequests}</div>
        <div className={styles.statValue}>{stats.sanitizedRequests}</div>
      </div>
      <div className={styles.statCard}>
        <div className="text-xs text-text-sub font-medium mb-1">{t.statsRedactedItems}</div>
        <div className={styles.statValue}>{totalRedactedItems}</div>
      </div>
      <div className={styles.statCard}>
        <div className="text-xs text-text-sub font-medium mb-1">{t.statsSizeChange}</div>
        <div className="text-sm font-bold text-text-main mt-1 font-mono">
          {formatBytes(stats.originalSizeBytes)} ➔ {formatBytes(stats.cleanedSizeBytes)}
        </div>
      </div>
      <div className={styles.statCard}>
        <div className="text-xs text-text-sub font-medium mb-1">{t.statsSavings}</div>
        <div className={styles.statValue}>-{savingsPercent}%</div>
      </div>
    </div>
  );
}

'use client';

import React from 'react';
import { formatDate } from '../engine';
import type { BabySizeInfo } from '../constants';
import styles from '../pregnancy-calculator.module.css';

interface MetricsOverviewCardProps {
  t: any;
  lang: 'zh-TW' | 'en';
  estimatedDueDate: Date;
  daysRemaining: number;
  currentWeeks: number;
  currentDays: number;
  conceptionDate: Date;
  trimester: string;
  currentGestationalDays: number;
  progressPercent: number;
  babyGrowth: BabySizeInfo;
}

export default function MetricsOverviewCard({
  t,
  lang,
  estimatedDueDate,
  daysRemaining,
  currentWeeks,
  currentDays,
  conceptionDate,
  trimester,
  currentGestationalDays,
  progressPercent,
  babyGrowth,
}: MetricsOverviewCardProps) {
  return (
    <>
      {/* 四大指標卡片 */}
      <div className={styles.glassCard}>
        <h2 className={styles.cardTitle}>
          <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {t.metricsTitle}
        </h2>

        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>{t.metricEdd}</span>
            <span className={`${styles.metricValue} ${styles.accentText}`}>{formatDate(estimatedDueDate)}</span>
            <span className={styles.metricSubtext}>
              {t.metricDaysRemaining}: <strong className="text-text-main">{daysRemaining} {t.daysUnit}</strong>
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>{t.metricCurrentWeek}</span>
            <span className={styles.metricValue}>
              {currentWeeks} <span className="text-sm font-semibold">{t.weeksUnit}</span> + {currentDays} <span className="text-sm font-semibold">{t.daysUnit}</span>
            </span>
            <span className={styles.metricSubtext}>
              {t.metricConception}: {formatDate(conceptionDate)}
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>{t.metricTrimester}</span>
            <span className="text-base font-bold text-text-main">{trimester}</span>
            <span className={styles.metricSubtext}>
              {currentGestationalDays} / 280 {t.daysUnit}
            </span>
          </div>

          <div className={styles.metricCard}>
            <span className={styles.metricLabel}>{t.progressLabel}</span>
            <span className={`${styles.metricValue} ${styles.accentText}`}>{progressPercent}%</span>
            <div className={styles.progressBarContainer}>
              <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 胎兒成長卡片 */}
      <div className={styles.babyGrowthCard}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl bg-surface-glass border border-border-glass flex items-center justify-center ${styles.accentText}`}>
              <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
                <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.31 19.57 10.59 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
              </svg>
            </div>
            <div>
              <h3 className="font-bold text-text-main text-base">
                {t.babySizeTitle}：<span className={styles.accentText}>{lang === 'zh-TW' ? babyGrowth.fruit : babyGrowth.fruitEn}</span>
              </h3>
              <p className="text-xs text-text-sub mt-0.5">
                {lang === 'zh-TW' ? babyGrowth.descZh : babyGrowth.descEn}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-text-sub bg-surface-glass px-3 py-1.5 rounded-xl border border-border-glass">
            <div>{t.babyLengthLabel}: <strong className="text-text-main text-sm">{babyGrowth.lengthCm} cm</strong></div>
            <div>{t.babyWeightLabel}: <strong className="text-text-main text-sm">{babyGrowth.weightG} g</strong></div>
          </div>
        </div>
      </div>
    </>
  );
}

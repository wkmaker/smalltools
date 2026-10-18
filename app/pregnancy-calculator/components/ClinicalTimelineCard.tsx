'use client';

import React from 'react';
import { formatDate } from '../engine';
import type { ClinicalMilestone, ClinicalStageStatus } from '../engine';
import styles from '../pregnancy-calculator.module.css';

interface ClinicalTimelineCardProps {
  t: any;
  lang: 'zh-TW' | 'en';
  stageStatus: ClinicalStageStatus;
  milestones: ClinicalMilestone[];
  currentWeeks: number;
  currentDays: number;
  countdownText: string;
  gapInfo: { title: string; desc: string } | null;
}

export default function ClinicalTimelineCard({
  t,
  lang,
  stageStatus,
  milestones,
  currentWeeks,
  currentDays,
  countdownText,
  gapInfo,
}: ClinicalTimelineCardProps) {
  return (
    <div className={styles.glassCard}>
      <div className="flex flex-col gap-1 mb-4">
        <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
          <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
            <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
          </svg>
          {t.timelineTitle}
        </h2>
        <p className="text-xs text-text-sub">{t.timelineSubtitle}</p>
      </div>

      {/* 衛教說明小註解 */}
      <div className={styles.timelineNoteBox}>
        <svg className={`w-4 h-4 ${styles.accentText} shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-text-sub leading-relaxed">
          {t.timelineNote}
        </p>
      </div>

      {/* 即時產檢階段導引卡片 (空檔過渡期 / 重大檢查期) */}
      <div
        className={`${styles.stageBanner} ${
          stageStatus.statusType === 'active_milestone'
            ? styles.stageBannerActive
            : stageStatus.statusType === 'stable_gap'
            ? styles.stageBannerGap
            : styles.stageBannerPre
        }`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`${styles.badge} ${
                stageStatus.statusType === 'active_milestone'
                  ? styles.badge
                  : stageStatus.statusType === 'stable_gap'
                  ? styles.badgeGap
                  : styles.badgeSuccess
              }`}
            >
              {stageStatus.statusType === 'active_milestone'
                ? t.stageStatusActiveBadge
                : stageStatus.statusType === 'stable_gap'
                ? t.stageStatusGapBadge
                : stageStatus.statusType === 'pre_checkup'
                ? t.stageStatusPreBadge
                : t.stageStatusPostBadge}
            </span>
            <span className="text-xs font-semibold text-text-sub font-mono">
              {currentWeeks} {t.weeksUnit} + {currentDays} {t.daysUnit}
            </span>
          </div>
          {countdownText && (
            <span className={`text-xs font-medium ${styles.accentText}`}>
              {countdownText}
            </span>
          )}
        </div>

        {/* 標題與說明 */}
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-bold text-text-main">
            {stageStatus.statusType === 'active_milestone' && stageStatus.activeMilestoneIndex !== null
              ? `${lang === 'zh-TW' ? '進行中：' : 'Active: '}${
                  lang === 'zh-TW'
                    ? milestones[stageStatus.activeMilestoneIndex]?.titleZh
                    : milestones[stageStatus.activeMilestoneIndex]?.titleEn
                }`
              : gapInfo?.title || ''}
          </h3>
          <p className="text-xs text-text-sub leading-relaxed">
            {stageStatus.statusType === 'active_milestone' && stageStatus.activeMilestoneIndex !== null
              ? lang === 'zh-TW'
                ? milestones[stageStatus.activeMilestoneIndex]?.descZh
                : milestones[stageStatus.activeMilestoneIndex]?.descEn
              : gapInfo?.desc || ''}
          </p>
        </div>
      </div>

      <div className={styles.timeline}>
        {milestones.map((m, idx) => (
          <div key={idx} className={styles.timelineItem}>
            <div
              className={`${styles.timelineDot} ${
                m.isCurrent
                  ? styles.timelineDotActive
                  : m.isPast
                  ? styles.timelineDotCompleted
                  : m.isNextUpcoming
                  ? styles.timelineDotUpcoming
                  : ''
              }`}
            >
              {m.isPast && (
                <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" className={styles.dotCheckIcon}>
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                </svg>
              )}
            </div>

            <div
              className={`${styles.timelineContent} ${
                m.isCurrent
                  ? styles.timelineContentActive
                  : m.isPast
                  ? styles.timelineContentPast
                  : m.isNextUpcoming
                  ? styles.timelineContentUpcoming
                  : ''
              }`}
            >
              {/* 第一層 (Tier 1)：週數膠囊 + 預估日期區間 + 狀態徽章 */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 min-w-0">
                  <span className={`${styles.weekPill} ${m.isCurrent ? styles.weekPillActive : ''}`}>
                    <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor" className="shrink-0">
                      <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                    </svg>
                    {lang === 'zh-TW' ? m.weekRange : m.weekRangeEn}
                  </span>
                  <span className="text-xs text-text-sub font-mono inline-flex items-center gap-1">
                    <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor" className="opacity-70 shrink-0">
                      <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" />
                    </svg>
                    {formatDate(m.startDate)} ~ {formatDate(m.endDate)}
                  </span>
                </div>

                <div className="flex items-center shrink-0">
                  {m.isPast ? (
                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>{t.tagPast}</span>
                  ) : m.isCurrent ? (
                    <span className={styles.badge}>{t.tagCurrent}</span>
                  ) : m.isNextUpcoming ? (
                    <span className={`${styles.badge} ${styles.badgeUpcoming}`}>{t.tagNextUpcoming}</span>
                  ) : (
                    <span className="text-xs text-text-sub px-2.5 py-0.5 rounded-full bg-surface-glass border border-border-glass">
                      {t.tagFuture}
                    </span>
                  )}
                </div>
              </div>

              {/* 第二層 (Tier 2)：階段主標題 + 簡要衛教說明 */}
              <div className="flex flex-col gap-1 min-w-0">
                <h3 className="text-base font-bold text-text-main leading-snug">
                  {lang === 'zh-TW' ? m.titleZh : m.titleEn}
                </h3>
                <p className="text-xs text-text-sub leading-relaxed">
                  {lang === 'zh-TW' ? m.descZh : m.descEn}
                </p>
              </div>

              {/* 第三層 (Tier 3)：雙欄結構化檢查細項清單 + 公費/自費小標籤 */}
              {m.items && m.items.length > 0 && (
                <div className={styles.checkpointGrid}>
                  {m.items.map((item, itemIdx) => (
                    <div key={itemIdx} className={styles.checkpointItem}>
                      <div className="flex items-center gap-2 min-w-0">
                        <svg
                          viewBox="0 0 24 24"
                          width={14}
                          height={14}
                          fill="currentColor"
                          className={`shrink-0 ${m.isPast ? styles.pastCheckIcon : styles.accentText}`}
                        >
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                        </svg>
                        <span className="text-xs font-medium text-text-main leading-snug min-w-0 break-words">
                          {lang === 'zh-TW' ? item.labelZh : item.labelEn}
                        </span>
                      </div>
                      {item.tag === 'public' && (
                        <span className={styles.tagPublicPill}>{t.tagPublic}</span>
                      )}
                      {item.tag === 'self' && (
                        <span className={styles.tagSelfPill}>{t.tagSelfPaid}</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

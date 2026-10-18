import React from 'react';
import styles from '../resignation-calculator.module.css';
import { formatDateStr } from '../engine';

interface ResignationNoticeBannerProps {
  t: any;
  isNoticeOverdueFromToday: boolean;
  isPeriodSufficient: boolean;
  isNoticeInPast: boolean;
  noticeDiffDays: number;
  requiredNoticeDays: number;
  daysRemainingFromToday: number;
  missingDaysStandard: number;
  missingDaysFromToday: number;
  calculatedNoticeD: Date;
  postponeLastWorkingFromToday: Date;
  onApplyPostpone: (dateStr: string) => void;
  onExportIcs: () => void;
}

export default function ResignationNoticeBanner({
  t,
  isNoticeOverdueFromToday,
  isPeriodSufficient,
  isNoticeInPast,
  noticeDiffDays,
  requiredNoticeDays,
  daysRemainingFromToday,
  missingDaysStandard,
  missingDaysFromToday,
  calculatedNoticeD,
  postponeLastWorkingFromToday,
  onApplyPostpone,
  onExportIcs,
}: ResignationNoticeBannerProps) {
  if (isNoticeOverdueFromToday) {
    return (
      <div className={styles.warningBanner}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-bold flex items-center gap-2 text-base">
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{t.pastNoticeOverdueTitle}</span>
          </div>
          <button type="button" onClick={onExportIcs} className={styles.secondaryBtn}>
            {t.exportIcsBtn}
          </button>
        </div>
        <div className="text-sm leading-relaxed flex flex-col gap-1 mt-0.5">
          <div>
            {t.pastNoticeOverdueDesc1} <strong>{formatDateStr(calculatedNoticeD)}</strong> {t.pastNoticeOverdueDesc2}{' '}
            <strong>{Math.max(0, daysRemainingFromToday)}</strong> {t.pastNoticeOverdueDesc3}{' '}
            <strong>{requiredNoticeDays}</strong> {t.pastNoticeOverdueDesc4}{' '}
            <strong>{missingDaysFromToday}</strong> {t.pastNoticeOverdueDesc5}
          </div>
        </div>
        <div className="text-xs opacity-95 leading-relaxed font-mono mt-1.5 flex flex-wrap items-center gap-2">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>{t.recommendPostponeDate} <strong>{formatDateStr(postponeLastWorkingFromToday)}</strong></span>
          <button
            type="button"
            onClick={() => onApplyPostpone(formatDateStr(postponeLastWorkingFromToday))}
            className="px-2.5 py-0.5 rounded-lg bg-select-bg border border-border-glass text-text-main hover:border-[var(--theme-color)] transition-colors cursor-pointer text-xs font-sans font-semibold"
          >
            {t.applyPostponeBtn}
          </button>
        </div>
        <div className="text-xs opacity-80 mt-0.5 flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t.lawAgreementNote}</span>
        </div>
      </div>
    );
  }

  if (!isPeriodSufficient) {
    return (
      <div className={styles.warningBanner}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="font-bold flex items-center gap-2 text-base">
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span>{t.insufficientNoticeWarningTitle}</span>
          </div>
          <button type="button" onClick={onExportIcs} className={styles.secondaryBtn}>
            {t.exportIcsBtn}
          </button>
        </div>
        <div className="text-sm leading-relaxed">
          {t.insufficientNoticeDesc1} <strong>{noticeDiffDays}</strong> {t.insufficientNoticeDesc2} <strong>{requiredNoticeDays}</strong> {t.insufficientNoticeDesc3} <strong>{missingDaysStandard}</strong> {t.insufficientNoticeDesc4}
        </div>
        <div className="text-xs opacity-95 leading-relaxed font-mono mt-1.5 flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
          <span>{t.recommendPostponeDate} <strong>{formatDateStr(postponeLastWorkingFromToday)}</strong></span>
        </div>
        <div className="text-xs opacity-80 mt-0.5 flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>{t.lawAgreementNote}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.successBanner}>
      <div className="flex items-center gap-2.5">
        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div className="font-medium text-sm">
          {t.sufficientNoticeSuccess} ({noticeDiffDays} / {requiredNoticeDays} {t.daysUnit})
          {isNoticeInPast && <span className="opacity-80 block text-xs mt-0.5">{t.pastNoticeSuccessNote}</span>}
        </div>
      </div>
      <button
        type="button"
        onClick={onExportIcs}
        className={`${styles.accentBtn} shrink-0`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        <span>{t.exportIcsBtn}</span>
      </button>
    </div>
  );
}

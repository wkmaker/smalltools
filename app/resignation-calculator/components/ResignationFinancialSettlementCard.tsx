import React from 'react';
import styles from '../resignation-calculator.module.css';

interface ResignationFinancialSettlementCardProps {
  t: any;
  resignationType: 'voluntary' | 'involuntary';
  totalEstimatedPayout: number;
  estimatedLeavePayout: number;
  dailyAvgSalary: number;
  payoutDaysTotal: number;
  monthlySalary: number | '';
  monthEndInsight: {
    proratedFinalMonthSalary: number;
    isLastDayOfMonth: boolean;
    workedDaysInLastMonth: number;
    daysInLastMonth: number;
    canExtendToSunday: boolean;
    sundayDateStr: string;
    extraWeekendDays: number;
    extraWeekendSalary: number;
  };
  severanceMonths: number;
  estimatedSeverancePay: number;
  estimatedNoticePay: number;
  employerShortNoticeDays: number | '';
  maxJobSeekingLeaveDays: number;
  noticeWeeks: number;
  leaveDaysTotal: number;
  intendedTakeDays: number;
  onExtendToSunday: (sundayDateStr: string) => void;
  onStrategicSeverance: () => void;
}

export default function ResignationFinancialSettlementCard({
  t,
  resignationType,
  totalEstimatedPayout,
  estimatedLeavePayout,
  dailyAvgSalary,
  payoutDaysTotal,
  monthlySalary,
  monthEndInsight,
  severanceMonths,
  estimatedSeverancePay,
  estimatedNoticePay,
  employerShortNoticeDays,
  maxJobSeekingLeaveDays,
  noticeWeeks,
  leaveDaysTotal,
  intendedTakeDays,
  onExtendToSunday,
  onStrategicSeverance,
}: ResignationFinancialSettlementCardProps) {
  return (
    <div className={styles.glassCard}>
      <h3 className={styles.cardTitle}>
        <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <span>{t.leaveAnalysisTitle}</span>
      </h3>

      {/* 離職結算預估領取總額高亮看板 (非自願離職) */}
      {resignationType === 'involuntary' && (
        <div className={`${styles.payoutHighlightBox} mb-4`}>
          <div className="text-sm font-semibold text-text-main">
            {t.totalEstimatedPayoutTitle}
          </div>
          <div className={`text-2xl sm:text-3xl font-extrabold font-mono mt-1 ${styles.accentText}`}>
            ${totalEstimatedPayout.toLocaleString('zh-TW')} TWD
          </div>
          <div className="text-xs text-text-sub mt-1">
            {t.totalEstimatedPayoutSub}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* 1. 特休不休假代金 */}
        <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
          <div className="text-sm font-semibold text-text-sub">{t.leavePayoutEstimate}</div>
          <div className={`text-xl font-bold font-mono mt-1 ${styles.accentText}`}>
            ${estimatedLeavePayout.toLocaleString('zh-TW')} TWD
          </div>
          <div className="text-xs text-text-sub mt-2">
            {t.dailyAvgSalary}: ${dailyAvgSalary.toLocaleString('zh-TW')} × {payoutDaysTotal} {t.payoutDaysSuffix}
          </div>
        </div>

        {/* 2. 當月預估破月薪資 */}
        <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
          <div className="text-sm font-semibold text-text-sub">
            {t.proratedSalaryLabel}
          </div>
          <div className={`text-xl font-bold font-mono mt-1 ${styles.accentText}`}>
            ${monthEndInsight.proratedFinalMonthSalary.toLocaleString('zh-TW')} TWD
          </div>
          <div className="text-xs text-text-sub mt-2">
            {monthEndInsight.isLastDayOfMonth && (monthlySalary === '' ? 0 : monthlySalary) > 0
              ? t.proratedSalaryFullMonth
              : `${t.proratedSalaryDescPrefix} ${monthEndInsight.workedDaysInLastMonth} / ${monthEndInsight.daysInLastMonth} ${t.daysUnit}`}
          </div>
        </div>

        {/* 3. 全民健保當月扣費歸屬 */}
        <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
          <div className="text-sm font-semibold text-text-main">
            {t.nhiBillingRuleTitle}
          </div>
          <div className="text-xs text-text-sub mt-2 leading-relaxed">
            {monthEndInsight.isLastDayOfMonth
              ? t.nhiBillingFullMonthDesc
              : t.nhiBillingMidMonthDesc}
          </div>
        </div>

        {/* 4. 勞退新制資遣費試算 (非自願離職) */}
        {resignationType === 'involuntary' && (
          <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
            <div className="text-sm font-semibold text-text-sub">{t.severancePayTitle}</div>
            <div className={`text-xl font-bold font-mono mt-1 ${styles.accentText}`}>
              ${estimatedSeverancePay.toLocaleString('zh-TW')} TWD
            </div>
            <div className="text-xs text-text-sub mt-2 font-mono">
              {t.severancePayBasisPrefix}
              <strong>{severanceMonths}</strong>
              {t.severancePayBasisSuffix}
            </div>
            <div className="text-xs text-text-sub mt-1">{t.severancePayLawNote}</div>
          </div>
        )}

        {/* 5. 雇主未足額預告工資 */}
        {resignationType === 'involuntary' && estimatedNoticePay > 0 && (
          <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
            <div className="text-sm font-semibold text-text-sub">{t.noticePayTitle}</div>
            <div className={`text-xl font-bold font-mono mt-1 ${styles.accentText}`}>
              ${estimatedNoticePay.toLocaleString('zh-TW')} TWD
            </div>
            <div className="text-xs text-text-sub mt-2">
              {t.noticePayDescPrefix} {employerShortNoticeDays} {t.noticePayDescSuffix}
            </div>
          </div>
        )}

        {/* 6. 資遣謀職假權益 */}
        {resignationType === 'involuntary' && (
          <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
            <div className="text-sm font-semibold text-text-sub">{t.jobSeekingLeaveTitle}</div>
            <div className="text-xl font-bold font-mono mt-1 text-text-main">
              {maxJobSeekingLeaveDays}{' '}
              <span className="text-sm font-normal text-text-sub">{t.paidDaysUnit}</span>
            </div>
            <div className="text-xs text-text-sub mt-2">
              {t.jobSeekingLeaveDesc} {noticeWeeks} {t.jobSeekingLeaveWeeksSuffix}
            </div>
            <div className={`text-xs mt-1 font-medium ${styles.accentText}`}>
              {t.jobSeekingLeaveUseFirstNote}
            </div>
          </div>
        )}
      </div>

      {/* 週末順延多領例假日薪資提示 */}
      {monthEndInsight.canExtendToSunday && (
        <div className="p-4 rounded-xl bg-select-bg border border-border-glass mt-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="space-y-1">
            <div className={`text-sm font-bold flex items-center gap-2 ${styles.accentText}`}>
              <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span>{t.weekendExtendTitle}</span>
            </div>
            <div className="text-sm text-text-sub leading-relaxed">
              {t.weekendExtendDesc1}
              <strong className="text-text-main font-mono">{monthEndInsight.sundayDateStr}</strong>
              {t.weekendExtendDesc2}{' '}
              <strong className="text-text-main">{monthEndInsight.extraWeekendDays}</strong>{' '}
              {t.weekendExtendDesc3}{' '}
              <strong className={styles.accentText}>
                ${monthEndInsight.extraWeekendSalary.toLocaleString('zh-TW')} TWD
              </strong>
              ！
            </div>
          </div>
          <button
            type="button"
            onClick={() => onExtendToSunday(monthEndInsight.sundayDateStr)}
            className={`${styles.accentBtn} shrink-0`}
          >
            <span>
              {t.applySundayExtendBtn} ({monthEndInsight.sundayDateStr})
            </span>
          </button>
        </div>
      )}

      {/* 被資遣最佳換錢策略提示卡片 */}
      {resignationType === 'involuntary' && leaveDaysTotal > 0 && intendedTakeDays > 0 && (
        <div className="p-4 rounded-xl bg-select-bg border border-border-glass leading-relaxed space-y-2 mt-3.5">
          <div className={`text-sm font-bold flex items-center gap-2 ${styles.accentText}`}>
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{t.severanceStrategyTitle}</span>
          </div>
          <div className="text-sm text-text-sub leading-normal">
            {t.severanceStrategyDesc1}
          </div>
          <div className="text-sm font-medium text-text-main flex flex-wrap items-center gap-2.5 pt-1">
            <span>
              {t.severanceStrategyDesc2}{' '}
              <strong className={styles.accentText}>
                ${Math.round(dailyAvgSalary * Math.min(leaveDaysTotal, intendedTakeDays)).toLocaleString('zh-TW')} TWD
              </strong>
              ！
            </span>
            <button
              type="button"
              onClick={onStrategicSeverance}
              className={styles.accentBtn}
            >
              <span>{t.btnStrategicSeverance}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

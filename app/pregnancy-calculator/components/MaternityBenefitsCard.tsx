'use client';

import React from 'react';
import { formatDate } from '../engine';
import styles from '../pregnancy-calculator.module.css';

interface MaternityBenefitsCardProps {
  t: any;
  benefits: {
    leaveStart: Date;
    leaveEnd: Date;
    returnDate: Date;
    laborBenefit: number;
    parentalAllowanceMonthly: number;
    parentalAllowanceTotal: number;
  };
  monthlySalary: number | '';
  isBenefitsExpanded: boolean;
  setIsBenefitsExpanded: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MaternityBenefitsCard({
  t,
  benefits,
  monthlySalary,
  isBenefitsExpanded,
  setIsBenefitsExpanded,
}: MaternityBenefitsCardProps) {
  return (
    <div className={styles.glassCard}>
      <div
        className="flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none"
        onClick={() => setIsBenefitsExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsBenefitsExpanded((prev) => !prev);
          }
        }}
      >
        <div className="flex flex-col">
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
              <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
            </svg>
            {t.benefitsTitle}
          </h2>
          {!isBenefitsExpanded && (
            <span className="text-xs text-text-sub mt-1">
              {t.benefitsToggleDesc}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-sub">
            {isBenefitsExpanded ? t.btnCollapse : t.btnExpand}
          </span>
          <div
            className={`w-7 h-7 rounded-lg bg-surface-glass border border-border-glass flex items-center justify-center text-text-sub transition-transform duration-200 ${
              isBenefitsExpanded ? 'rotate-180' : ''
            }`}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          </div>
        </div>
      </div>

      {isBenefitsExpanded && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border-glass">
          <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-main text-sm">{t.checkupLeaveLabel}</span>
              <span className={styles.badge}>8 {t.daysUnit}</span>
            </div>
            <p className="text-xs text-text-sub">{t.checkupLeaveDesc}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-main text-sm">{t.paternityLeaveLabel}</span>
              <span className={styles.badge}>7 {t.daysUnit}</span>
            </div>
            <p className="text-xs text-text-sub">{t.paternityLeaveDesc}</p>
          </div>

          <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col gap-2 md:col-span-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-text-main text-sm">{t.maternityLeaveLabel}</span>
              <span className={styles.badge}>56 {t.daysUnit} (8 {t.weeksUnit})</span>
            </div>
            <p className="text-xs text-text-sub">{t.maternityLeaveDesc}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs border-t border-border-glass">
              <span className="text-text-sub">{t.maternityLeavePeriod}:</span>
              <strong className="text-text-main">{formatDate(benefits.leaveStart)} ~ {formatDate(benefits.leaveEnd)}</strong>
              <span className="text-text-sub ml-auto">{t.expectedReturnDate}: <strong className={styles.accentText}>{formatDate(benefits.returnDate)}</strong></span>
            </div>
          </div>

          {typeof monthlySalary === 'number' && monthlySalary > 0 && (
            <>
              <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col gap-1">
                <span className="font-semibold text-text-main text-sm">{t.laborInsuranceTitle}</span>
                <span className={`text-lg font-bold ${styles.accentText}`}>
                  {t.approxUnit} {benefits.laborBenefit.toLocaleString('zh-TW')}
                </span>
                <p className="text-xs text-text-sub">{t.laborInsuranceDesc}</p>
              </div>

              <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col gap-1">
                <span className="font-semibold text-text-main text-sm">{t.parentalLeaveTitle}</span>
                <span className={`text-lg font-bold ${styles.accentText}`}>
                  {t.approxUnit} {benefits.parentalAllowanceTotal.toLocaleString('zh-TW')}
                </span>
                <p className="text-xs text-text-sub">
                  {t.parentalLeaveDesc} (約 {benefits.parentalAllowanceMonthly.toLocaleString('zh-TW')} / 月)
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

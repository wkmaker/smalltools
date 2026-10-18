'use client';

import React from 'react';
import styles from '../mortgage-loan.module.css';

interface MortgageStatCardsProps {
  t: any;
  firstPayment: number;
  aprRate: number | null;
  totalInterest: number;
  totalRepay: number;
}

export default function MortgageStatCards({
  t,
  firstPayment,
  aprRate,
  totalInterest,
  totalRepay,
}: MortgageStatCardsProps) {
  return (
    <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
      <div className={styles.statCard}>
        <span className="text-sm font-semibold text-text-sub">{t.firstMonthPayment}</span>
        <span className={`text-lg font-bold font-mono ${styles.accentText}`}>
          ${Math.round(firstPayment).toLocaleString('zh-TW')}
        </span>
      </div>

      <div className={styles.statCard}>
        <span className="text-sm font-semibold text-text-sub">{t.aprTotalFeeRate}</span>
        <span className={`text-lg font-bold font-mono ${styles.aprText}`}>
          {aprRate === null ? t.aprUnavailable : `${aprRate}%`}
        </span>
      </div>

      <div className={styles.statCard}>
        <span className="text-sm font-semibold text-text-sub">{t.totalInterestExpense}</span>
        <span className={`text-lg font-bold font-mono ${styles.interestText}`}>
          ${Math.round(totalInterest).toLocaleString('zh-TW')}
        </span>
      </div>

      <div className={styles.statCard}>
        <span className="text-sm font-semibold text-text-sub">{t.totalRepaymentAmount}</span>
        <span className="text-lg font-bold text-text-main font-mono">
          ${Math.round(totalRepay).toLocaleString('zh-TW')}
        </span>
      </div>
    </div>
  );
}

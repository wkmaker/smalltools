'use client';

import React from 'react';
import type { CombinedDetailRow } from '../engine';
import styles from '../mortgage-loan.module.css';

interface MortgageScheduleTableProps {
  t: any;
  schedule: CombinedDetailRow[];
  showAllRows: boolean;
  setShowAllRows: React.Dispatch<React.SetStateAction<boolean>>;
}

export default function MortgageScheduleTable({
  t,
  schedule,
  showAllRows,
  setShowAllRows,
}: MortgageScheduleTableProps) {
  const visibleSchedule = showAllRows ? schedule : schedule.slice(0, 121);

  return (
    <div className={`${styles.glassCard} p-6 flex flex-col gap-4 shadow-lg`}>
      <div className="flex justify-between items-center">
        <h3 className={`text-sm ${styles.accentText} uppercase tracking-[1px] font-semibold`}>
          {t.scheduleTableTitle} ({showAllRows ? t.totalPeriodsText(schedule.length - 1) : t.preview120Periods})
        </h3>
        {schedule.length > 121 && (
          <button
            type="button"
            onClick={() => setShowAllRows(!showAllRows)}
            className={`text-sm font-medium ${styles.activeScheme} px-3.5 py-1.5 rounded-xl transition-all cursor-pointer`}
          >
            {showAllRows ? t.collapseTo120 : t.expandAllPeriodsText(schedule.length - 1)}
          </button>
        )}
      </div>

      <div className={styles.tableWrapper}>
        <table className="w-full text-right text-sm font-mono">
          <thead>
            <tr className="border-b border-border-glass text-text-sub text-sm font-semibold">
              <th className={`text-left p-3 ${styles.stickyPeriod}`}>{t.colPeriod}</th>
              <th className="p-3">{t.colStartBalance}</th>
              <th className="p-3">{t.colPrincipal}</th>
              <th className="p-3">{t.colInterest}</th>
              <th className="p-3">{t.colTotalPayment}</th>
              <th className="p-3">{t.colEndBalance}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-glass">
            {visibleSchedule.map((row) => (
              <tr key={row.period} className="hover:bg-white/[.04] text-text-main transition-colors">
                <td className={`text-left p-3 font-mono ${styles.stickyPeriod}`}>
                  {row.period === 0 ? t.initialPeriod : t.periodText(row.period)}
                </td>
                <td className="p-3 font-mono">
                  {row.period === 0 ? '-' : `$${Math.round(row.startBalance).toLocaleString('zh-TW')}`}
                </td>
                <td className="p-3 font-mono text-text-main">
                  {row.period === 0 ? '-' : `$${Math.round(row.principalPaid).toLocaleString('zh-TW')}`}
                </td>
                <td className={`p-3 font-mono ${styles.interestText}`}>
                  {row.period === 0 ? '-' : `$${Math.round(row.interestPaid).toLocaleString('zh-TW')}`}
                </td>
                <td className={`p-3 font-mono font-semibold ${styles.accentText}`}>
                  {row.period === 0 ? '-' : `$${Math.round(row.totalPayment).toLocaleString('zh-TW')}`}
                </td>
                <td className="p-3 font-mono text-text-sub">
                  ${Math.round(row.endBalance).toLocaleString('zh-TW')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

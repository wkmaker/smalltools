'use client';

import React from 'react';
import TrendChart from '../../components/TrendChart';
import styles from '../mortgage-loan.module.css';

interface MortgageTrendCardProps {
  t: any;
  trendXLabels: string[];
  trendSeries: Array<{
    name: string;
    data: number[];
    colorDark: string;
    colorLight: string;
    areaColorDark: string;
    areaColorLight: string;
  }>;
}

export default function MortgageTrendCard({
  t,
  trendXLabels,
  trendSeries,
}: MortgageTrendCardProps) {
  return (
    <div className={`${styles.glassCard} p-5 flex flex-col gap-3 shadow-lg`}>
      <div className="flex justify-between items-center text-sm text-text-sub font-semibold uppercase tracking-[1px]">
        <span>{t.trendChartTitle}</span>
        <div className="flex gap-4">
          <span className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${styles.dotBg}`} />
            {t.remainingPrincipalLegend}
          </span>
        </div>
      </div>
      <div className="relative w-full h-[220px]">
        <TrendChart xLabels={trendXLabels} series={trendSeries} />
      </div>
    </div>
  );
}

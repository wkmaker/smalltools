'use client';

import React from 'react';
import styles from '../hourly-rate-calculator.module.css';
import type { TRANSLATIONS } from '../translations';

type HourlyRateTranslations = (typeof TRANSLATIONS)['zh-TW'];

export interface HourlyRateDataSourcesProps {
  t: HourlyRateTranslations;
  isEn: boolean;
}

export default function HourlyRateDataSources({ t, isEn }: HourlyRateDataSourcesProps) {
  return (
    <div className="border-t border-border-glass pt-6 mt-4">
      <h3 className="font-semibold text-text-main mb-3 text-base flex items-center gap-2">
        <svg className={`w-5 h-5 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        {t.referenceDataSourcesTitle}
      </h3>
      <ul className="space-y-2 text-xs text-text-sub list-disc list-inside leading-relaxed">
        <li>
          <strong className="text-text-main inline-flex items-center gap-1">
            <svg className={`w-4 h-4 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            {t.taiwanSalaryDataLabel}
          </strong>：
          {isEn ? (
            <>
              <a
                href="https://www.dgbas.gov.tw/"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline ${styles.themeAccentText} transition-colors ml-1`}
              >
                DGBAS Executive Yuan
              </a>
              {' "Employee Annual Earnings Distribution & Percentile Statistics" & Ministry of Labor Minimum Wage Announcements.'}
            </>
          ) : (
            <>
              <a
                href="https://www.dgbas.gov.tw/"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline ${styles.themeAccentText} transition-colors ml-1`}
              >
                行政院主計總處
              </a>
              《受僱員工全年總薪資中位數及分位數統計表》與勞動部《法定最低工資發布公告》。
            </>
          )}
        </li>
        <li>
          <strong className="text-text-main inline-flex items-center gap-1">
            <svg className="w-4 h-4 text-text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 012 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2v1.5a2.5 2.5 0 002.5 2.5h.5a2 2 0 012 2v.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {t.globalIncomeDataLabel}
          </strong>：
          {isEn ? (
            <>
              <a
                href="https://wid.world/"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline ${styles.themeAccentText} transition-colors ml-1`}
              >
                World Inequality Database (WID)
              </a>
              & World Bank Global Income Distribution Reports.
            </>
          ) : (
            <>
              <a
                href="https://wid.world/"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline ${styles.themeAccentText} transition-colors ml-1`}
              >
                World Inequality Database (WID 全球不平等資料庫)
              </a>
              與 World Bank (世界銀行全球個人所得分佈報告)。
            </>
          )}
        </li>
        <li>
          <strong className="text-text-main inline-flex items-center gap-1">
            <svg className="w-4 h-4 text-text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m0 0l-3 9m3-9l3 2m0 0l-3 9m3-9l3 9m-6-9l6 2m0 0l-3 9m3-9l3 9" />
            </svg>
            {t.pppIndexLabel}
          </strong>：
          {isEn ? (
            <>
              <a
                href="https://www.oecd.org/en/data/datasets/purchasing-power-parities.html"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline ${styles.themeAccentText} transition-colors ml-1`}
              >
                OECD Purchasing Power Parities
              </a>
              &
              <a
                href="https://www.numbeo.com/cost-of-living/"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline ${styles.themeAccentText} transition-colors ml-1`}
              >
                Numbeo Global Cost of Living Index
              </a>
              .
            </>
          ) : (
            <>
              <a
                href="https://www.oecd.org/en/data/datasets/purchasing-power-parities.html"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline ${styles.themeAccentText} transition-colors ml-1`}
              >
                OECD Purchasing Power Parities
              </a>
              與
              <a
                href="https://www.numbeo.com/cost-of-living/"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline ${styles.themeAccentText} transition-colors ml-1`}
              >
                Numbeo Global Cost of Living Index
              </a>
              。
            </>
          )}
        </li>
      </ul>
    </div>
  );
}

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import styles from '../hourly-rate-calculator.module.css';
import { Milestone, CountryMatch, formatPrCode } from '../utils';
import type { TRANSLATIONS } from '../translations';

type HourlyRateTranslations = (typeof TRANSLATIONS)['zh-TW'];

export interface HourlyRateResultPanelProps {
  t: HourlyRateTranslations;
  isEn: boolean;
  realHourlyRate: number;
  totalHours: number;
  netIncome: number;
  isLegal: boolean;
  diffPercent: number;
  taiwanPR: number;
  globalPR: number;
  matchedCountry?: CountryMatch;
  matchedMilestone?: Milestone;
  queryParamsString: string;
  onShare: () => void;
}

export default function HourlyRateResultPanel({
  t,
  isEn,
  realHourlyRate,
  totalHours,
  netIncome,
  isLegal,
  diffPercent,
  taiwanPR,
  globalPR,
  matchedCountry,
  matchedMilestone,
  queryParamsString,
  onShare,
}: HourlyRateResultPanelProps) {
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  return (
    <div className="lg:col-span-6 space-y-6">
      {/* Real Hourly Rate Highlight */}
      <div className={`p-6 ${styles.calcCard} relative overflow-hidden`}>
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-semibold text-text-sub">{t.realHourlyRateLabel}</span>
          {/* Legality Badge & Tooltip Container */}
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5 ${
                isLegal ? styles.passBadge : styles.failBadge
              }`}
            >
              {isLegal ? (
                <>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  {t.rateAboveBase(diffPercent.toFixed(1))}
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  {t.rateBelowBase(diffPercent.toFixed(1))}
                </>
              )}
            </span>

            {/* Info Tooltip Button */}
            <div className="relative inline-block">
              <button
                type="button"
                onClick={() => setShowInfoTooltip((prev) => !prev)}
                onMouseEnter={() => setShowInfoTooltip(true)}
                onMouseLeave={() => setShowInfoTooltip(false)}
                aria-label={t.calcLogicInfoAria}
                className="p-1 rounded-full text-text-sub hover:text-text-main hover:bg-white/10 transition-colors focus:outline-none flex items-center justify-center"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>

              {showInfoTooltip && (
                <div className={`absolute right-0 top-full mt-2 w-72 sm:w-80 p-3.5 z-20 text-xs rounded-xl shadow-xl ${styles.tooltipContainer}`}>
                  <p className="font-bold mb-1.5 text-text-main flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-themeAccentText" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {t.calcComplianceTitle}
                  </p>
                  <p className="text-text-sub leading-relaxed">
                    {isEn ? (
                      <>
                        This tool deducts <strong>commute time, unpaid overtime, and work expenses</strong>.
                        <br />
                        Under Taiwan Labor Law, monthly salary compliance is determined by <code className="bg-white/10 px-1 py-0.5 rounded">Monthly Salary ÷ 240 hrs</code>. A lower real hourly rate reflects net time earnings rather than an employer violation.
                      </>
                    ) : (
                      <>
                        本工具「真實時薪」已扣除<strong>通勤時間、無酬加班與工作自費開銷</strong>。
                        <br />
                        依勞基法規定，月薪制勞工合規判定以「<code className="bg-white/10 px-1 py-0.5 rounded">月薪 ÷ 240小時</code>」為準，因此真實時薪低於法定時薪<strong>不代表僱主違法</strong>，而是反映扣除隱形成本後的個人時間淨收益。
                      </>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-baseline gap-2 mb-6">
          <span className="text-4xl sm:text-5xl font-black text-text-main font-mono tracking-tight">
            ${Math.round(realHourlyRate).toLocaleString(t.numberLocale)}
          </span>
          <span className="text-base font-semibold text-text-sub">/ hr</span>
        </div>

        {/* Work Breakdown Stats */}
        <div className="grid grid-cols-2 gap-4 border-t border-border-glass pt-4">
          <div>
            <span className="text-xs text-text-sub block mb-1">{t.totalHoursInvestedLabel}</span>
            <span className="text-sm font-semibold text-text-main font-mono">{totalHours} {t.hrsUnit}</span>
          </div>
          <div>
            <span className="text-xs text-text-sub block mb-1">{t.netIncomeLabel}</span>
            <span className="text-sm font-semibold text-text-main font-mono">
              ${Math.max(0, netIncome).toLocaleString(t.numberLocale)} {t.currencyUnit}
            </span>
          </div>
        </div>
      </div>

      {/* Dual PR Ranking Cards (Taiwan & Worldwide) */}
      <div className={`p-6 ${styles.calcCard} space-y-6`}>
        <div className="flex items-center justify-between border-b border-border-glass pb-3">
          <h3 className="text-base font-bold text-text-main flex items-center gap-2">
            <svg className={`w-5 h-5 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            {t.leaderboardTitle}
          </h3>
        </div>

        {/* Taiwan PR Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#f0f0f0" d="M44 36c0 4.418-3.582 8-8 8H12c-4.418 0-8-3.582-8-8V12c0-4.418 3.582-8 8-8h24c4.418 0 8 3.582 8 8v24z"/><path fill="#d52b1e" d="M4 12v24c0 4.418 3.582 8 8 8h24c4.418 0 8-3.582-8-8V12c0-4.418-3.582-8-8-8H12c-4.418 0-8 3.582-8 8z"/><path fill="#fff" d="M24 8l-4 8h8l-4 8 4 8h-8l4 8M12 4l12 12 12-12M12 44l12-12 12 12"/></svg>
              {t.taiwanWorkerPrLabel}
            </span>
            <span className={`text-base font-extrabold font-mono ${styles.themeAccentText}`}>
              PR {taiwanPR.toFixed(1)}
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.progressBarFill}
              style={{ width: `${Math.max(3, Math.min(100, taiwanPR))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-sub mt-1 font-mono">
            <span>PR 10 {t.pr10Label}</span>
            <span>PR 50 {t.pr50Label}</span>
            <span>PR 90 {t.pr90Label}</span>
          </div>
        </div>

        {/* Worldwide PR Section */}
        <div className="pt-3 border-t border-border-glass">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-text-main flex items-center gap-1.5">
              <svg className="w-4 h-4 text-text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 012 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2v1.5a2.5 2.5 0 002.5 2.5h.5a2 2 0 012 2v.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.globalPopulationPrLabel}
            </span>
            <span className={`text-base font-extrabold font-mono ${styles.globalPrText}`}>
              PR {globalPR.toFixed(1)}
            </span>
          </div>
          <div className={styles.progressBarTrack}>
            <div
              className={styles.globalProgressBarFill}
              style={{ width: `${Math.max(3, Math.min(100, globalPR))}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-text-sub mt-1 font-mono">
            <span>P50 {t.globalP50Label}</span>
            <span>P90 ($26,500 USD)</span>
            <span>P99 Top 1% ($109,000 USD)</span>
          </div>
          <p className="text-xs text-text-sub mt-2 flex items-center gap-1">
            <svg className={`w-3.5 h-3.5 ${styles.themeAccentText} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
            </svg>
            {isEn ? (
              <>Your income outperforms <span className="font-bold text-text-main">{globalPR.toFixed(1)}%</span> of the global population! (Source: WID Global Income Distribution)</>
            ) : (
              <>您的收入擊敗了全球 <span className="font-bold text-text-main">{globalPR.toFixed(1)}%</span> 的人口！ (資料源：WID 全球所得分佈)</>
            )}
          </p>
        </div>

        {/* Country Lifestyle Compatibility Card */}
        {matchedCountry && (
          <div className="pt-3 border-t border-border-glass">
            <div className="p-4 rounded-xl bg-surface-glass border border-border-glass relative space-y-2">
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${styles.countryBadge} flex items-center gap-1`}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 012 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2v1.5a2.5 2.5 0 002.5 2.5h.5a2 2 0 012 2v.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t.bestMigrationMatchLabel}
                </span>
                <span className="text-sm font-bold text-text-main">
                  {isEn && matchedCountry.name_en ? matchedCountry.name_en : matchedCountry.name}
                </span>
              </div>
              <div className={`text-sm font-extrabold ${styles.themeAccentText}`}>
                【{isEn && matchedCountry.tag_en ? matchedCountry.tag_en : matchedCountry.tag}】
              </div>
              <p className="text-sm text-text-sub leading-relaxed">
                {isEn && matchedCountry.description_en ? matchedCountry.description_en : matchedCountry.description}
              </p>
            </div>
          </div>
        )}

        {/* Exclusive Milestone Card */}
        {matchedMilestone && (
          <div className={`${styles.exclusiveMilestoneCard} space-y-3`}>
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${styles.milestoneBadge} flex items-center gap-1`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                {t.workerPersonaUnlockedLabel}
              </span>
              <span className="text-xs font-mono text-text-sub font-bold">
                {t.taiwanPrShortLabel} {taiwanPR.toFixed(1)}
              </span>
            </div>

            <div>
              <h4 className="text-xl font-black text-text-main flex items-center gap-2 mb-1">
                【{isEn && matchedMilestone.label_en ? matchedMilestone.label_en : matchedMilestone.label}】
              </h4>
              <p className="text-sm text-text-sub leading-relaxed">
                {isEn && matchedMilestone.desc_en ? matchedMilestone.desc_en : matchedMilestone.desc}
              </p>
            </div>

            {/* Shiny CTA Button to open the dedicated PRXX page */}
            <div className="pt-2">
              <Link
                href={`/hourly-rate-calculator/${t.urlLangPrefix}rank/${formatPrCode(matchedMilestone.pr)}/?${queryParamsString}`}
                prefetch={false}
                className={styles.milestoneCardCTA}
              >
                <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
                {t.viewExclusiveCard(formatPrCode(matchedMilestone.pr).toUpperCase())}
              </Link>
            </div>
          </div>
        )}

        {/* Share Action */}
        <div className="mt-6 flex justify-end">
          <button
            type="button"
            onClick={onShare}
            className={styles.shareBtn}
          >
            <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {t.shareCardBtn}
          </button>
        </div>
      </div>
    </div>
  );
}

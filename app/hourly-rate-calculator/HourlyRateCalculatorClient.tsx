'use client';

import React, { useState, useEffect, useRef, useId, useMemo } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import ToolLayout from '@/app/components/ToolLayout';
import taiwanStatsData from './config/taiwan_statistics.json';
import globalStatsData from './config/global_statistics.json';
import milestoneData from './config/percentile_milestones.json';
import countrySuitabilityData from './config/country_suitability.json';
import styles from './hourly-rate-calculator.module.css';
import RankHeroBanner from './RankHeroBanner';
import {
  Milestone,
  CountryMatch,
  SUPPORTED_YEARS,
  calculatePiecewisePR,
  getSalaryForPR,
  formatPrCode,
} from './utils';

interface HourlyRateCalculatorClientProps {
  initialSlug?: string;
  initialPr?: number;
  lang?: 'zh-TW' | 'en';
}

export default function HourlyRateCalculatorClient({ initialSlug, initialPr, lang = 'zh-TW' }: HourlyRateCalculatorClientProps) {
  const isEn = lang === 'en';
  // ─── 主題色初始化 ─────────────────────────────────────────────────────────
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);

  // Fix #3: 統一使用 isMountedRef 作為 URL sync 防護，移除重複的 isHydrated state
  const isMountedRef = useRef(false);

  // Fix #6: 用 ref 追蹤 toast timer ID，在 unmount 時清除防止記憶體洩漏
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── 無障礙 Form IDs ──────────────────────────────────────────────────────
  const yearSelectId = useId();
  const calcModeSelectId = useId();
  const monthlySalaryId = useId();
  const monthlyHoursId = useId();
  const overtimeHoursId = useId();
  const commuteHoursId = useId();
  const monthlyExpensesId = useId();
  const projectFeeId = useId();
  const projectHoursId = useId();
  const extraHoursId = useId();
  const projectExpensesId = useId();

  // ─── States ───────────────────────────────────────────────────────────────
  // showCalculator 從 state 改為 const（setter 從未被呼叫，避免不必要的 state）
  const showCalculator = !initialSlug && initialPr === undefined;

  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [calcMode, setCalcMode] = useState<'monthly' | 'project'>('monthly');

  // Monthly State
  const [monthlySalary, setMonthlySalary] = useState<number | ''>(50000);
  const [monthlyHours, setMonthlyHours] = useState<number | ''>(176);
  const [overtimeHours, setOvertimeHours] = useState<number | ''>(0);
  const [commuteHours, setCommuteHours] = useState<number | ''>(11);
  const [monthlyExpenses, setMonthlyExpenses] = useState<number | ''>(1200);

  // Project State
  const [projectFee, setProjectFee] = useState<number | ''>(60000);
  const [projectHours, setProjectHours] = useState<number | ''>(100);
  const [extraHours, setExtraHours] = useState<number | ''>(20);
  const [projectExpenses, setProjectExpenses] = useState<number | ''>(3000);

  // Toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  // Tooltip
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  // Fix #6: Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToastMessage(msg);
    toastTimerRef.current = setTimeout(() => {
      setToastMessage(null);
      toastTimerRef.current = null;
    }, 3000);
  };

  // Fix #3 & URL Parsing Bug: 記錄是否完成 URL Hydration 讀取
  const isHydratedRef = useRef(false);
  const [hasCustomParams, setHasCustomParams] = useState(false);

  // ─── Hydrate from URL query parameters ───────────────────────────────────
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const qYear = searchParams.get('year');
    const qMode = searchParams.get('mode');
    const qSalary = searchParams.get('salary');
    const qWorkHours = searchParams.get('workHours');
    const qOvertime = searchParams.get('overtime');
    const qCommute = searchParams.get('commute');
    const qExpenses = searchParams.get('expenses');
    const qPr = searchParams.get('pr');
    const qRate = searchParams.get('rate');

    if (qSalary !== null || qWorkHours !== null || qPr !== null || qRate !== null) {
      setHasCustomParams(true);
    }

    if (qYear && (SUPPORTED_YEARS as readonly number[]).includes(Number(qYear))) {
      setSelectedYear(parseInt(qYear, 10));
    }
    if (qMode === 'monthly' || qMode === 'project') {
      setCalcMode(qMode as 'monthly' | 'project');
    }

    const currentMode = qMode === 'project' ? 'project' : 'monthly';

    if (qSalary !== null && !isNaN(Number(qSalary))) {
      if (currentMode === 'project') {
        setProjectFee(Number(qSalary));
      } else {
        setMonthlySalary(Number(qSalary));
      }
    } else if (initialSlug || initialPr !== undefined) {
      const matchedInit = milestoneData.find(
        (m) => m.id === initialSlug || m.slug === initialSlug || m.pr === initialPr
      );
      if (matchedInit) {
        const currentYearStat = taiwanStatsData.statistics['2026'];
        const estAnnual = getSalaryForPR(matchedInit.pr, currentYearStat.official_percentiles);
        setMonthlySalary(Math.round(estAnnual / 12));
      }
    }
    if (qWorkHours !== null && !isNaN(Number(qWorkHours))) {
      if (currentMode === 'project') {
        setProjectHours(Number(qWorkHours));
      } else {
        setMonthlyHours(Number(qWorkHours));
      }
    }
    if (qOvertime !== null && !isNaN(Number(qOvertime))) {
      setOvertimeHours(Number(qOvertime));
    }
    if (qCommute !== null && !isNaN(Number(qCommute))) {
      setCommuteHours(Number(qCommute));
    }
    if (qExpenses !== null && !isNaN(Number(qExpenses))) {
      if (currentMode === 'project') {
        setProjectExpenses(Number(qExpenses));
      } else {
        setMonthlyExpenses(Number(qExpenses));
      }
    }

    // 延遲一微微秒設定 hydration 標記，確保 React 完成首次 state 更新渲染後才允許 replaceState
    setTimeout(() => {
      isHydratedRef.current = true;
    }, 50);
  }, [initialSlug, initialPr]);


  // ─── 靜態資料衍生值 ───────────────────────────────────────────────────────
  const yearKey = String(selectedYear) as keyof typeof taiwanStatsData.statistics;
  const currentTaiwanStat = taiwanStatsData.statistics[yearKey] || taiwanStatsData.statistics['2026'];
  const minHourlyWage = currentTaiwanStat.minimum_wage.hourly;
  const milestones: Milestone[] = milestoneData;
  const taiwanAnchors = currentTaiwanStat.official_percentiles;
  const globalAnchors = globalStatsData.official_percentiles;
  const countryMatches: CountryMatch[] = countrySuitabilityData.tiers;

  // Fix #2 + Low Priority: 計算結果整體 useMemo，避免每次 render 重跑
  const { totalHours, netIncome, realHourlyRate, annualIncome, taiwanPR, globalPR } = useMemo(() => {
    let totalHours = 0;
    let netIncome = 0;

    if (calcMode === 'monthly') {
      const numSalary = monthlySalary === '' ? 0 : monthlySalary;
      const numHours = monthlyHours === '' ? 0 : monthlyHours;
      const numOvertime = overtimeHours === '' ? 0 : overtimeHours;
      const numCommute = commuteHours === '' ? 0 : commuteHours;
      const numExpenses = monthlyExpenses === '' ? 0 : monthlyExpenses;
      totalHours = numHours + numOvertime + numCommute;
      netIncome = numSalary - numExpenses;
    } else {
      const numFee = projectFee === '' ? 0 : projectFee;
      const numHours = projectHours === '' ? 0 : projectHours;
      const numExtra = extraHours === '' ? 0 : extraHours;
      const numExpenses = projectExpenses === '' ? 0 : projectExpenses;
      totalHours = numHours + numExtra;
      netIncome = numFee - numExpenses;
    }

    const realHourlyRate = totalHours > 0 ? Math.max(0, netIncome / totalHours) : 0;
    const annualIncome = realHourlyRate * currentTaiwanStat.default_working_hours.hours_per_year;
    const taiwanPR = realHourlyRate <= 0 ? 0.0 : Math.min(Math.max(calculatePiecewisePR(annualIncome, taiwanAnchors, false), 1.0), 99.9);
    const globalPR = realHourlyRate <= 0 ? 0.0 : Math.min(Math.max(calculatePiecewisePR(annualIncome, globalAnchors, true), 1.0), 99.9);

    return { totalHours, netIncome, realHourlyRate, annualIncome, taiwanPR, globalPR };
  }, [
    calcMode, monthlySalary, monthlyHours, overtimeHours, commuteHours, monthlyExpenses,
    projectFee, projectHours, extraHours, projectExpenses,
    currentTaiwanStat, taiwanAnchors, globalAnchors,
  ]);

  // ─── 合法性判斷 ───────────────────────────────────────────────────────────
  const isLegal = realHourlyRate >= minHourlyWage;
  const diffPercent = minHourlyWage > 0
    ? Math.abs(((realHourlyRate - minHourlyWage) / minHourlyWage) * 100)
    : 0;

  // ─── 已達成的最高 PR 里程碑 ───────────────────────────────────────────────
  let matchedMilestone = milestones[0];
  if (realHourlyRate <= 0) {
    matchedMilestone = milestones.find((m) => m.pr === 0) || milestones[0];
  } else {
    for (const m of milestones) {
      if (m.pr <= taiwanPR && m.pr > 0) {
        matchedMilestone = m;
      } else if (m.pr > taiwanPR) {
        break;
      }
    }
  }

  // ─── Hero Milestone（Rank 靜態頁面）────────────────────────────────────
  const heroMilestone = (initialSlug || initialPr !== undefined)
    ? milestones.find((m) => m.id === initialSlug || m.slug === initialSlug || m.pr === initialPr)
    : null;

  // ─── 最適移居國家 ─────────────────────────────────────────────────────────
  let matchedCountry = countryMatches.find(
    (c) => realHourlyRate >= c.min_hourly_twd && realHourlyRate < c.max_hourly_twd
  );
  if (!matchedCountry) {
    matchedCountry = countryMatches[countryMatches.length - 1];
  }

  // Fix #4: queryParamsString 改為 useMemo，消除 5+ 次重複呼叫 getQueryParamsString()
  const queryParamsString = useMemo(() => {
    const params = new URLSearchParams();
    params.set('year', String(selectedYear));
    params.set('mode', calcMode);
    params.set('pr', taiwanPR.toFixed(1));
    params.set('gpr', globalPR.toFixed(1));
    params.set('rate', Math.round(realHourlyRate).toString());

    if (calcMode === 'monthly') {
      if (monthlySalary !== '') params.set('salary', String(monthlySalary));
      if (monthlyHours !== '') params.set('workHours', String(monthlyHours));
      if (overtimeHours !== '') params.set('overtime', String(overtimeHours));
      if (commuteHours !== '') params.set('commute', String(commuteHours));
      if (monthlyExpenses !== '') params.set('expenses', String(monthlyExpenses));
    } else {
      if (projectFee !== '') params.set('salary', String(projectFee));
      if (projectHours !== '') params.set('workHours', String(projectHours));
      if (extraHours !== '') params.set('extra', String(extraHours));
      if (projectExpenses !== '') params.set('expenses', String(projectExpenses));
    }

    return params.toString();
  }, [
    selectedYear, calcMode,
    monthlySalary, monthlyHours, overtimeHours, commuteHours, monthlyExpenses,
    projectFee, projectHours, extraHours, projectExpenses,
    taiwanPR, globalPR, realHourlyRate,
  ]);

  // Fix #3: URL sync 改用 isHydratedRef.current，防止初始載入時誤蓋 URL
  useEffect(() => {
    if (!isHydratedRef.current) return;
    window.history.replaceState(null, '', `${window.location.pathname}?${queryParamsString}`);
  }, [queryParamsString]);

  // 計算器表單僅在非 Rank 頁面展示（Rank 卡片頁保持乾淨純淨，點擊下方「試算我的時薪與 PR」即可跳轉試算）
  const shouldShowCalculator = !heroMilestone;


  // ─── 分享處理器 ───────────────────────────────────────────────────────────
  const handleShare = async (overrideText?: string) => {
    const prCode = formatPrCode(matchedMilestone.pr);
    const targetPath = `/hourly-rate-calculator/${isEn ? 'en/' : ''}rank/${prCode}/`;
    const shareUrl = `${window.location.origin}${targetPath}?${queryParamsString}`;

    const defaultText = `【全台打工人 PR 評定卡片 💳】\n評定等級：PR ${taiwanPR.toFixed(1)}【${matchedMilestone.label}】\n💬 特質語錄：「${matchedMilestone.desc}」\n⚡ 實質生命時薪：$${Math.round(realHourlyRate)}/hr (每分鐘價值 $${(realHourlyRate / 60).toFixed(2)} 元)\n🥤 珍奶自由度：工作 1 小時可換 ${(realHourlyRate / 65).toFixed(1)} 杯珍奶\n🏆 全台名次：840 萬打工人中約第 ${Math.round((1 - taiwanPR / 100) * 8400000).toLocaleString('zh-TW')} 名！\n🌍 最適移居生活圈：${matchedCountry ? matchedCountry.flag + ' ' + matchedCountry.name : ''}\n\n測測你是在賺薪水，還是在幫老闆付法拉利車貸 ➔ ${shareUrl}`;

    const textToShare = overrideText || defaultText;
    const funnyShareTitle = `【打工人靈魂審判 ⚖️】我的真實時薪 $${Math.round(realHourlyRate)}/hr (全台 PR ${taiwanPR.toFixed(1)})`;

    // 行動裝置使用原生 Share Sheet，桌機直接複製剪貼簿
    const isMobile = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      try {
        await navigator.share({ title: funnyShareTitle, text: textToShare, url: shareUrl });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(textToShare);
      showToast('已成功複製專屬卡片梗文與連結！');
    } catch {
      showToast('複製失敗，請手動複製網址');
    }
  };

  // ─── 數字輸入 Helper ──────────────────────────────────────────────────────
  const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number | '') => void
  ) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setter(raw === '' ? '' : parseInt(raw, 10));
  };

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <ToolLayout
      title={isEn ? "Real Hourly Rate Calculator" : "真實時薪計算器"}
      subtitle="REAL HOURLY RATE CALCULATOR"
      description={isEn ? "Deduct commute time, unpaid overtime, and work expenses to accurately calculate your true net hourly earnings." : "扣除通勤時間、隱形加班與額外開銷支出，計算每小時生命的真實收益與全球生活圈適配度分析。"}
      accentColor="#00f5a0"
      accentGlow="rgba(0, 245, 160, 0.6)"
      backHref={heroMilestone ? `/hourly-rate-calculator/${isEn ? 'en/' : ''}?${queryParamsString}` : undefined}
      backText={heroMilestone ? (isEn ? 'Back to Calculator' : '返回時薪計算器') : undefined}
      backTitle={heroMilestone ? (isEn ? 'Back to Calculator Home' : '返回時薪計算器首頁') : undefined}
      extraHeaderControls={
        <Link
          href={
            initialSlug
              ? `${isEn ? `/hourly-rate-calculator/rank/${initialSlug}/` : `/hourly-rate-calculator/en/rank/${initialSlug}/`}${queryParamsString ? `?${queryParamsString}` : ''}`
              : `${isEn ? '/hourly-rate-calculator/' : '/hourly-rate-calculator/en/'}${queryParamsString ? `?${queryParamsString}` : ''}`
          }
          className="text-sm font-medium px-3 py-1.5 rounded-xl bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
        >
          {isEn ? '繁體中文' : 'English'}
        </Link>
      }
    >

      <div className={styles.container}>
        {/* Fix #1: IIFE 完全移除，改用獨立元件 <RankHeroBanner /> */}
        {heroMilestone && (
          <RankHeroBanner
            heroMilestone={heroMilestone}
            mounted={mounted}
            taiwanAnchors={taiwanAnchors}
            globalAnchors={globalAnchors}
            realHourlyRate={realHourlyRate}
            annualIncome={annualIncome}
            taiwanPR={taiwanPR}
            globalPR={globalPR}
            hoursPerYear={currentTaiwanStat.default_working_hours.hours_per_year}
            milestones={milestones}
            minHourlyWage={minHourlyWage}
            queryParamsString={queryParamsString}
            handleShare={handleShare}
            hasCustomParams={hasCustomParams}
            lang={lang}
          />
        )}

        {/* Header Intro Banner (僅在主計算器頁面顯示) */}
        {!heroMilestone && (
          <div className="text-center mb-8">
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text-main mb-3 tracking-tight">
              {isEn ? (
                <>Unveil Your Real Hourly Rate & Unlock <span className={styles.themeAccentText}>Global Spheres & PR Ranking</span></>
              ) : (
                <>揭開實質時薪的面紗，解鎖 <span className={styles.themeAccentText}>全球生活圈與 PR 排行</span></>
              )}
            </h1>
            <p className="text-base text-text-sub max-w-2xl mx-auto">
              {isEn
                ? 'Deduct unpaid overtime, commute hours, and work expenses to accurately calculate your true hourly earnings and ideal migration matches.'
                : '扣除加班耗損、通勤工時與隱性費用支出，精準計算您的生命時薪並分析最適移居國家。'}
            </p>
          </div>
        )}

        {/* Main Grid: Left Controls, Right Results */}
        {shouldShowCalculator && (

          <div id="calculator-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          {/* Controls Card */}
          <div className={`lg:col-span-6 p-6 ${styles.calcCard}`}>
            <div className="flex items-center justify-between border-b border-border-glass pb-4 mb-6">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <svg className={`w-5 h-5 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                {isEn ? 'Calculation Settings' : '試算條件設定'}
              </h2>

              {/* Fix #5: 年份選單動態由 SUPPORTED_YEARS 渲染，與 URL 驗證邏輯共用同一來源 */}
              <div className="flex items-center gap-2">
                <label htmlFor={yearSelectId} className="text-xs font-semibold text-text-sub">
                  {isEn ? 'Applicable Year' : '適用年份'}
                </label>
                <select
                  id={yearSelectId}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-select-bg border border-border-glass rounded-lg px-2.5 py-1 text-sm text-text-main font-medium outline-none focus:border-[var(--theme-color)]"
                >
                  {SUPPORTED_YEARS.map((year) => {
                    const stat = taiwanStatsData.statistics[String(year) as keyof typeof taiwanStatsData.statistics];
                    return (
                      <option key={year} value={year}>
                        {year} {isEn ? `(Min Wage $${stat.minimum_wage.hourly})` : `年 (最低時薪 $${stat.minimum_wage.hourly})`}
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="mb-6">
              <legend id={calcModeSelectId} className="text-sm font-medium text-text-sub mb-2 block">
                {isEn ? 'Calculation Mode' : '計算模式'}
              </legend>
              <div className="grid grid-cols-2 gap-2 bg-surface-glass p-1.5 rounded-xl border border-border-glass">
                <button
                  type="button"
                  onClick={() => setCalcMode('monthly')}
                  className={`${styles.tabBtn} ${calcMode === 'monthly' ? styles.tabBtnActive : ''}`}
                >
                  {isEn ? 'Full-Time / Monthly' : '全職 / 月薪模式'}
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode('project')}
                  className={`${styles.tabBtn} ${calcMode === 'project' ? styles.tabBtnActive : ''}`}
                >
                  {isEn ? 'Freelance / Project' : '專案 / 接案模式'}
                </button>
              </div>
            </div>

            {/* Inputs based on Mode */}
            {calcMode === 'monthly' ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor={monthlySalaryId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                    {isEn ? 'Nominal Monthly Salary (TWD)' : '名目月薪 (NTD)'}
                  </label>
                  <input
                    id={monthlySalaryId}
                    type="text"
                    inputMode="numeric"
                    value={monthlySalary === '' ? '' : monthlySalary.toLocaleString(isEn ? 'en-US' : 'zh-TW')}
                    onChange={(e) => handleNumberInput(e, setMonthlySalary)}
                    className={styles.inputField}
                    placeholder={isEn ? 'e.g. 50,000' : '例如：50,000'}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={monthlyHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                      {isEn ? 'Contract Monthly Hours' : '合約常態月工時 (小時)'}
                    </label>
                    <input
                      id={monthlyHoursId}
                      type="text"
                      inputMode="numeric"
                      value={monthlyHours === '' ? '' : monthlyHours}
                      onChange={(e) => handleNumberInput(e, setMonthlyHours)}
                      className={styles.inputField}
                      placeholder={isEn ? 'Default 174 hrs' : '預設 174 小時'}
                    />
                  </div>
                  <div>
                    <label htmlFor={overtimeHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                      {isEn ? 'Unpaid Overtime (hrs/mo)' : '隱形加班 / 待命 (小時/月)'}
                    </label>
                    <input
                      id={overtimeHoursId}
                      type="text"
                      inputMode="numeric"
                      value={overtimeHours === '' ? '' : overtimeHours}
                      onChange={(e) => handleNumberInput(e, setOvertimeHours)}
                      className={styles.inputField}
                      placeholder={isEn ? 'e.g. 10' : '如：10'}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={commuteHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                      {isEn ? 'Total Commute (hrs/mo)' : '總通勤時間 (小時/月)'}
                    </label>
                    <input
                      id={commuteHoursId}
                      type="text"
                      inputMode="numeric"
                      value={commuteHours === '' ? '' : commuteHours}
                      onChange={(e) => handleNumberInput(e, setCommuteHours)}
                      className={styles.inputField}
                      placeholder={isEn ? 'e.g. 20' : '如：20'}
                    />
                  </div>
                  <div>
                    <label htmlFor={monthlyExpensesId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                      {isEn ? 'Work Expenses (TWD/mo)' : '額外通勤/工具耗損 (元/月)'}
                    </label>
                    <input
                      id={monthlyExpensesId}
                      type="text"
                      inputMode="numeric"
                      value={monthlyExpenses === '' ? '' : monthlyExpenses.toLocaleString(isEn ? 'en-US' : 'zh-TW')}
                      onChange={(e) => handleNumberInput(e, setMonthlyExpenses)}
                      className={styles.inputField}
                      placeholder={isEn ? 'e.g. 2,000' : '如：2,000'}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor={projectFeeId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                    {isEn ? 'Project Fee (TWD)' : '專案總報酬 (NTD)'}
                  </label>
                  <input
                    id={projectFeeId}
                    type="text"
                    inputMode="numeric"
                    value={projectFee === '' ? '' : projectFee.toLocaleString(isEn ? 'en-US' : 'zh-TW')}
                    onChange={(e) => handleNumberInput(e, setProjectFee)}
                    className={styles.inputField}
                    placeholder={isEn ? 'e.g. 60,000' : '例如：60,000'}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={projectHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                      {isEn ? 'Estimated Hours' : '預計總執行工時 (小時)'}
                    </label>
                    <input
                      id={projectHoursId}
                      type="text"
                      inputMode="numeric"
                      value={projectHours === '' ? '' : projectHours}
                      onChange={(e) => handleNumberInput(e, setProjectHours)}
                      className={styles.inputField}
                      placeholder={isEn ? 'e.g. 100' : '如：100'}
                    />
                  </div>
                  <div>
                    <label htmlFor={extraHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                      {isEn ? 'Revision/Meeting Hours' : '隱性修改/開會溝通 (小時)'}
                    </label>
                    <input
                      id={extraHoursId}
                      type="text"
                      inputMode="numeric"
                      value={extraHours === '' ? '' : extraHours}
                      onChange={(e) => handleNumberInput(e, setExtraHours)}
                      className={styles.inputField}
                      placeholder={isEn ? 'e.g. 20' : '如：20'}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={projectExpensesId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                    {isEn ? 'Direct Costs/Resource Fee (TWD)' : '專案直接成本/工具採購 (元)'}
                  </label>
                  <input
                    id={projectExpensesId}
                    type="text"
                    inputMode="numeric"
                    value={projectExpenses === '' ? '' : projectExpenses.toLocaleString(isEn ? 'en-US' : 'zh-TW')}
                    onChange={(e) => handleNumberInput(e, setProjectExpenses)}
                    className={styles.inputField}
                    placeholder={isEn ? 'e.g. 3,000' : '如：3,000'}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Result Card */}
          <div className="lg:col-span-6 space-y-6">
            {/* Real Hourly Rate Highlight */}
            <div className={`p-6 ${styles.calcCard} relative overflow-hidden`}>
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-semibold text-text-sub">{isEn ? 'Real Hourly Rate' : '真實時薪 (Real Hourly Rate)'}</span>
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
                        {isEn ? `Rate Target Met (+${diffPercent.toFixed(1)}% above base)` : `實質時薪達標 (高於時薪基準 ${diffPercent.toFixed(1)}%)`}
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {isEn ? `Below Rate Base (-${diffPercent.toFixed(1)}% below base)` : `實質體感時薪偏低 (低於時薪基準 ${diffPercent.toFixed(1)}%)`}
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
                      aria-label={isEn ? 'Calculation Logic Info' : '時薪計算機制說明'}
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
                          {isEn ? 'Calculation & Compliance Explanation' : '計算機制與合規說明'}
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
                  ${Math.round(realHourlyRate).toLocaleString(isEn ? 'en-US' : 'zh-TW')}
                </span>
                <span className="text-base font-semibold text-text-sub">/ hr</span>
              </div>

              {/* Work Breakdown Stats */}
              <div className="grid grid-cols-2 gap-4 border-t border-border-glass pt-4">
                <div>
                  <span className="text-xs text-text-sub block mb-1">{isEn ? 'Total Monthly Hours Invested' : '實際月總投入時間'}</span>
                  <span className="text-sm font-semibold text-text-main font-mono">{totalHours} {isEn ? 'hrs' : '小時'}</span>
                </div>
                <div>
                  <span className="text-xs text-text-sub block mb-1">{isEn ? 'Net Income After Costs' : '扣除成本實領淨額'}</span>
                  <span className="text-sm font-semibold text-text-main font-mono">
                    ${Math.max(0, netIncome).toLocaleString(isEn ? 'en-US' : 'zh-TW')} {isEn ? 'TWD' : '元'}
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
                  {isEn ? 'Salary Percentile Leaderboard' : '薪資 Percentile 排行榜'}
                </h3>
              </div>

              {/* Taiwan PR Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#f0f0f0" d="M44 36c0 4.418-3.582 8-8 8H12c-4.418 0-8-3.582-8-8V12c0-4.418 3.582-8 8-8h24c4.418 0 8 3.582 8 8v24z"/><path fill="#d52b1e" d="M4 12v24c0 4.418 3.582 8 8 8h24c4.418 0 8-3.582-8-8V12c0-4.418-3.582-8-8-8H12c-4.418 0-8 3.582-8 8z"/><path fill="#fff" d="M24 8l-4 8h8l-4 8 4 8h-8l4 8M12 4l12 12 12-12M12 44l12-12 12 12"/></svg>
                    {isEn ? 'Taiwan Worker PR' : '全台打工人 PR'}
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
                  <span>PR 10 {isEn ? '(365k)' : '(36.5萬)'}</span>
                  <span>PR 50 {isEn ? 'Median (568k)' : '中位數 (56.8萬)'}</span>
                  <span>PR 90 {isEn ? '(1.29M)' : '(129萬)'}</span>
                </div>
              </div>

              {/* Worldwide PR Section */}
              <div className="pt-3 border-t border-border-glass">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 012 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2v1.5a2.5 2.5 0 002.5 2.5h.5a2 2 0 012 2v.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {isEn ? 'Global Population PR' : '全世界人口 PR'}
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
                  <span>P50 {isEn ? 'Median ($3,430)' : '中位數 ($3,430 USD)'}</span>
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
                        {isEn ? 'Best Migration Match' : '最適生活圈評估'}
                      </span>
                      <span className="text-sm font-bold text-text-main">
                        {matchedCountry.flag} {isEn && matchedCountry.name_en ? matchedCountry.name_en : matchedCountry.name}
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
                      {isEn ? 'Worker Persona Unlocked' : '專屬打工人評定解鎖'}
                    </span>
                    <span className="text-xs font-mono text-text-sub font-bold">
                      {isEn ? 'Taiwan PR' : '全台 PR'} {taiwanPR.toFixed(1)}
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
                      href={`/hourly-rate-calculator/${isEn ? 'en/' : ''}rank/${formatPrCode(matchedMilestone.pr)}/?${queryParamsString}`}
                      className={styles.milestoneCardCTA}
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      {isEn ? `View Exclusive Card (${formatPrCode(matchedMilestone.pr).toUpperCase()}) ➔` : `查看你的專屬卡片 (${formatPrCode(matchedMilestone.pr).toUpperCase()}) ➔`}
                    </Link>
                  </div>
                </div>
              )}

              {/* Share Action */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => handleShare()}
                  className={styles.shareBtn}
                >
                  <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  {isEn ? 'Share Card' : '分享專屬卡片'}
                </button>
              </div>
            </div>
          </div>
        </div>
        )}
          <div className="border-t border-border-glass pt-6 mt-4">
            <h3 className="font-semibold text-text-main mb-3 text-base flex items-center gap-2">
              <svg className={`w-5 h-5 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              {isEn ? 'Reference Data Sources' : '權威資料來源與依據說明 (Reference Data Sources)'}
            </h3>
            <ul className="space-y-2 text-xs text-text-sub list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-text-main inline-flex items-center gap-1">
                  <svg className={`w-4 h-4 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  {isEn ? 'Taiwan Salary & Hours Data' : '台灣薪資與工時數據'}
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
                    "Employee Annual Earnings Distribution & Percentile Statistics" & Ministry of Labor Minimum Wage Announcements.
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
                  {isEn ? 'Global Population Income Data' : '全球人口所得數據'}
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
                  {isEn ? 'Global Living Purchasing Power (PPP) Index' : '全球生活圈購買力 (PPP) 物價指標'}
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
                      href="http://numbeo.com/cost-of-living/"
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
                      href="http://numbeo.com/cost-of-living/"
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
        </div>

      {/* Toast Notification */}
      {mounted && toastMessage && createPortal(
        <div className={styles.toast}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor" className="flex-shrink-0">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
          </svg>
          <span>{toastMessage}</span>
        </div>,
        document.body
      )}
    </ToolLayout>
  );
}

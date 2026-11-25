'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import ToolLayout from '@/app/components/ToolLayout';
import FaqSection from '@/app/components/FaqSection';
import { useIsMounted } from '@/app/utils/useIsMounted';
import taiwanStatsData from './config/taiwan_statistics.json';
import globalStatsData from './config/global_statistics.json';
import milestoneData from './config/percentile_milestones.json';
import countrySuitabilityData from './config/country_suitability.json';
import styles from './hourly-rate-calculator.module.css';
import RankHeroBanner from './RankHeroBanner';
import HourlyRateInputPanel from './components/HourlyRateInputPanel';
import HourlyRateResultPanel from './components/HourlyRateResultPanel';
import HourlyRateDataSources from './components/HourlyRateDataSources';
import {
  Milestone,
  CountryMatch,
  SUPPORTED_YEARS,
  calculateRealHourlyRate,
  getSalaryForPR,
  formatPrCode,
} from './utils';
import { TRANSLATIONS, FAQ_DATA } from './translations';

interface HourlyRateCalculatorClientProps {
  initialSlug?: string;
  initialPr?: number;
  lang?: 'zh-TW' | 'en';
}

export default function HourlyRateCalculatorClient({ initialSlug, initialPr, lang = 'zh-TW' }: HourlyRateCalculatorClientProps) {
  const isEn = lang === 'en';
  const t = TRANSLATIONS[lang];
  // ─── 主題色初始化 ─────────────────────────────────────────────────────────
  const mounted = useIsMounted();

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);

  // 用 ref 追蹤 toast timer ID，在 unmount 時清除防止記憶體洩漏
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ─── States ───────────────────────────────────────────────────────────────
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

  // Cleanup timer on unmount
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

  // 記錄是否完成 URL Hydration 讀取
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

  // 真實時薪主計算（純函數引擎，見 ./utils.ts）；useMemo 僅為避免每次 render 重跑
  const { totalHours, netIncome, realHourlyRate, annualIncome, taiwanPR, globalPR } = useMemo(
    () =>
      calculateRealHourlyRate({
        calcMode,
        monthlySalary: monthlySalary === '' ? 0 : monthlySalary,
        monthlyHours: monthlyHours === '' ? 0 : monthlyHours,
        overtimeHours: overtimeHours === '' ? 0 : overtimeHours,
        commuteHours: commuteHours === '' ? 0 : commuteHours,
        monthlyExpenses: monthlyExpenses === '' ? 0 : monthlyExpenses,
        projectFee: projectFee === '' ? 0 : projectFee,
        projectHours: projectHours === '' ? 0 : projectHours,
        extraHours: extraHours === '' ? 0 : extraHours,
        projectExpenses: projectExpenses === '' ? 0 : projectExpenses,
        hoursPerYear: currentTaiwanStat.default_working_hours.hours_per_year,
        taiwanAnchors,
        globalAnchors,
      }),
    [
      calcMode, monthlySalary, monthlyHours, overtimeHours, commuteHours, monthlyExpenses,
      projectFee, projectHours, extraHours, projectExpenses,
      currentTaiwanStat, taiwanAnchors, globalAnchors,
    ],
  );

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

  // queryParamsString 改為 useMemo，消除重複計算
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

  // URL sync 使用 isHydratedRef.current，防止初始載入時誤蓋 URL
  useEffect(() => {
    if (!isHydratedRef.current) return;
    window.history.replaceState(null, '', `${window.location.pathname}?${queryParamsString}`);
  }, [queryParamsString]);

  // 計算器表單僅在非 Rank 頁面展示（Rank 卡片頁保持乾淨純淨，點擊下方「試算我的時薪與 PR」即可跳轉試算）
  const shouldShowCalculator = !heroMilestone;

  // ─── 分享處理器 ───────────────────────────────────────────────────────────
  const handleShare = async (overrideText?: string) => {
    const prCode = formatPrCode(matchedMilestone.pr);
    const targetPath = `/hourly-rate-calculator/${t.urlLangPrefix}rank/${prCode}/`;
    const shareUrl = `${window.location.origin}${targetPath}?${queryParamsString}`;

    const defaultText = `【全台打工人 PR 評定卡片】\n評定等級：PR ${taiwanPR.toFixed(1)}【${matchedMilestone.label}】\n特質語錄：「${matchedMilestone.desc}」\n實質生命時薪：$${Math.round(realHourlyRate)}/hr (每分鐘價值 $${(realHourlyRate / 60).toFixed(2)} 元)\n珍奶自由度：工作 1 小時可換 ${(realHourlyRate / 65).toFixed(1)} 杯珍奶\n全台名次：840 萬打工人中約第 ${Math.round((1 - taiwanPR / 100) * 8400000).toLocaleString('zh-TW')} 名！\n最適移居生活圈：${matchedCountry ? matchedCountry.name : ''}\n\n測測你是在賺薪水，還是在幫老闆付法拉利車貸 ➔ ${shareUrl}`;

    const textToShare = overrideText || defaultText;
    const funnyShareTitle = `【打工人靈魂審判】我的真實時薪 $${Math.round(realHourlyRate)}/hr (全台 PR ${taiwanPR.toFixed(1)})`;

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

  // ─── JSX ──────────────────────────────────────────────────────────────────
  return (
    <ToolLayout
      title={t.pageTitle}
      subtitle="REAL HOURLY RATE CALCULATOR"
      description={t.pageDescription}
      accentColor="#00f5a0"
      accentGlow="rgba(0, 245, 160, 0.6)"
      backHref={heroMilestone ? `/hourly-rate-calculator/${t.urlLangPrefix}?${queryParamsString}` : undefined}
      backText={heroMilestone ? t.backToCalculator : undefined}
      backTitle={heroMilestone ? t.backToCalculatorHome : undefined}
    >
      <div className={styles.container}>
        {/* Rank 專屬頁 Hero Banner */}
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
              {t.heroSubtitle}
            </p>
          </div>
        )}

        {/* Main Grid: Left Controls, Right Results */}
        {shouldShowCalculator && (
          <div id="calculator-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            <HourlyRateInputPanel
              t={t}
              selectedYear={selectedYear}
              onSelectedYearChange={setSelectedYear}
              calcMode={calcMode}
              onCalcModeChange={setCalcMode}
              monthlySalary={monthlySalary}
              onMonthlySalaryChange={setMonthlySalary}
              monthlyHours={monthlyHours}
              onMonthlyHoursChange={setMonthlyHours}
              overtimeHours={overtimeHours}
              onOvertimeHoursChange={setOvertimeHours}
              commuteHours={commuteHours}
              onCommuteHoursChange={setCommuteHours}
              monthlyExpenses={monthlyExpenses}
              onMonthlyExpensesChange={setMonthlyExpenses}
              projectFee={projectFee}
              onProjectFeeChange={setProjectFee}
              projectHours={projectHours}
              onProjectHoursChange={setProjectHours}
              extraHours={extraHours}
              onExtraHoursChange={setExtraHours}
              projectExpenses={projectExpenses}
              onProjectExpensesChange={setProjectExpenses}
            />

            <HourlyRateResultPanel
              t={t}
              isEn={isEn}
              realHourlyRate={realHourlyRate}
              totalHours={totalHours}
              netIncome={netIncome}
              isLegal={isLegal}
              diffPercent={diffPercent}
              taiwanPR={taiwanPR}
              globalPR={globalPR}
              matchedCountry={matchedCountry}
              matchedMilestone={matchedMilestone}
              queryParamsString={queryParamsString}
              onShare={() => handleShare()}
            />
          </div>
        )}

        {/* 參考數據來源 */}
        <HourlyRateDataSources t={t} isEn={isEn} />
      </div>

      {/* 常見問題 FAQ 區塊 */}
      <div className="mt-8">
        <FaqSection
          title={FAQ_DATA[lang].title}
          subtitle={FAQ_DATA[lang].subtitle}
          items={FAQ_DATA[lang].items}
          accentColor="#00f5a0"
        />
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

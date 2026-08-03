'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '@/app/components/ToolLayout';
import taiwanStatsData from './config/taiwan_statistics.json';
import globalStatsData from './config/global_statistics.json';
import milestoneData from './config/percentile_milestones.json';
import countrySuitabilityData from './config/country_suitability.json';
import styles from './hourly-rate-calculator.module.css';

interface Milestone {
  pr: number;
  id: string;
  slug: string;
  label: string;
  desc: string;
}

interface PercentileAnchor {
  pr: number;
  annual_salary?: number;
  annual_salary_twd?: number;
  label?: string;
}

interface CountryMatch {
  id: string;
  name: string;
  flag: string;
  countries: string[];
  min_hourly_twd: number;
  max_hourly_twd: number;
  tag: string;
  description: string;
}

interface HourlyRateCalculatorClientProps {
  initialSlug?: string;
  initialPr?: number;
}

// Helper: Piecewise linear interpolation for percentiles
function calculatePiecewisePR(annualSalary: number, anchors: PercentileAnchor[], isGlobal = false): number {
  if (!anchors || anchors.length === 0) return 1.0;

  const sorted = [...anchors].sort((a, b) => {
    const valA = isGlobal ? (a.annual_salary_twd || 0) : (a.annual_salary || 0);
    const valB = isGlobal ? (b.annual_salary_twd || 0) : (b.annual_salary || 0);
    return valA - valB;
  });

  const getSalary = (item: PercentileAnchor) => (isGlobal ? item.annual_salary_twd || 0 : item.annual_salary || 0);

  const minAnchor = sorted[0];
  const maxAnchor = sorted[sorted.length - 1];

  const minSal = getSalary(minAnchor);
  const maxSal = getSalary(maxAnchor);

  if (annualSalary <= minSal) {
    const ratio = minSal > 0 ? annualSalary / minSal : 0;
    return Math.max(1.0, ratio * minAnchor.pr);
  }

  if (annualSalary >= maxSal) {
    const excess = annualSalary - maxSal;
    const extraPR = Math.min(0.9, (excess / 1000000) * 0.3);
    return Math.min(99.9, maxAnchor.pr + extraPR);
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    const s1 = getSalary(p1);
    const s2 = getSalary(p2);

    if (annualSalary >= s1 && annualSalary <= s2) {
      const fraction = (annualSalary - s1) / (s2 - s1);
      return p1.pr + fraction * (p2.pr - p1.pr);
    }
  }

  return 50.0;
}

// Helper: Estimate annual salary for a target PR
function getSalaryForPR(targetPR: number, anchors: PercentileAnchor[]): number {
  if (!anchors || anchors.length === 0) return 568000;
  const sorted = [...anchors].sort((a, b) => (a.annual_salary || 0) - (b.annual_salary || 0));
  if (targetPR <= sorted[0].pr) return sorted[0].annual_salary || 320000;
  if (targetPR >= sorted[sorted.length - 1].pr) return sorted[sorted.length - 1].annual_salary || 2850000;

  for (let i = 0; i < sorted.length - 1; i++) {
    const p1 = sorted[i];
    const p2 = sorted[i + 1];
    const s1 = p1.annual_salary || 0;
    const s2 = p2.annual_salary || 0;
    if (targetPR >= p1.pr && targetPR <= p2.pr) {
      const frac = (targetPR - p1.pr) / (p2.pr - p1.pr);
      return Math.round(s1 + frac * (s2 - s1));
    }
  }
  return 568000;
}

export default function HourlyRateCalculatorClient({ initialSlug, initialPr }: HourlyRateCalculatorClientProps) {
  // Theme color initialization
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);

  const isMountedRef = useRef(false);

  // Form IDs for accessibility
  const yearSelectId = useId();
  const calcModeSelectId = useId();
  
  // Monthly mode IDs
  const monthlySalaryId = useId();
  const monthlyHoursId = useId();
  const overtimeHoursId = useId();
  const commuteHoursId = useId();
  const monthlyExpensesId = useId();

  // Project mode IDs
  const projectFeeId = useId();
  const projectHoursId = useId();
  const extraHoursId = useId();
  const projectExpensesId = useId();

  // States
  const [showCalculator, setShowCalculator] = useState<boolean>(!initialSlug && initialPr === undefined);
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Hydrate from URL query parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const qYear = searchParams.get('year');
      const qMode = searchParams.get('mode');
      const qSalary = searchParams.get('salary');
      const qWorkHours = searchParams.get('workHours');
      const qOvertime = searchParams.get('overtime');
      const qCommute = searchParams.get('commute');
      const qExpenses = searchParams.get('expenses');

      if (qYear && (qYear === '2026' || qYear === '2025')) {
        setSelectedYear(parseInt(qYear, 10));
      }
      if (qMode === 'monthly' || qMode === 'project') {
        setCalcMode(qMode as 'monthly' | 'project');
      }
      if (qSalary !== null && !isNaN(Number(qSalary))) {
        if (qMode === 'project') {
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
        if (qMode === 'project') {
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
        if (qMode === 'project') {
          setProjectExpenses(Number(qExpenses));
        } else {
          setMonthlyExpenses(Number(qExpenses));
        }
      }

      isMountedRef.current = true;
    }
  }, []);

  // Benchmarks for current year
  const yearKey = String(selectedYear) as '2026' | '2025';
  const currentTaiwanStat = taiwanStatsData.statistics[yearKey] || taiwanStatsData.statistics['2026'];
  const minHourlyWage = currentTaiwanStat.minimum_wage.hourly;
  const milestones: Milestone[] = milestoneData;
  const taiwanAnchors = currentTaiwanStat.official_percentiles;
  const globalAnchors = globalStatsData.official_percentiles;
  const countryMatches: CountryMatch[] = countrySuitabilityData;

  // Calculation Logic
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

  // Legality Check
  const isLegal = realHourlyRate >= minHourlyWage;
  const diffPercent = minHourlyWage > 0 
    ? Math.abs(((realHourlyRate - minHourlyWage) / minHourlyWage) * 100)
    : 0;

  // Annual Income 推估
  const annualIncome = realHourlyRate * currentTaiwanStat.default_working_hours.hours_per_year;

  // Calculate Taiwan PR
  const taiwanPR = Math.min(Math.max(calculatePiecewisePR(annualIncome, taiwanAnchors, false), 1.0), 99.9);

  // Calculate Worldwide PR
  const globalPR = Math.min(Math.max(calculatePiecewisePR(annualIncome, globalAnchors, true), 1.0), 99.9);

  // Match Milestone (已達成的最高 PR 里程碑)
  let matchedMilestone = milestones[0];
  for (const m of milestones) {
    if (m.pr <= taiwanPR) {
      matchedMilestone = m;
    } else {
      break;
    }
  }

  // Hero Milestone when accessed via /rank/[slug]
  const heroMilestone = (initialSlug || initialPr !== undefined)
    ? milestones.find((m) => m.id === initialSlug || m.slug === initialSlug || m.pr === initialPr)
    : null;

  // Match Country Suitability
  let matchedCountry = countryMatches.find(
    (c) => realHourlyRate >= c.min_hourly_twd && realHourlyRate < c.max_hourly_twd
  );
  if (!matchedCountry) {
    matchedCountry = countryMatches[countryMatches.length - 1];
  }

  // Update URL Query parameters seamlessly
  useEffect(() => {
    if (isMountedRef.current && typeof window !== 'undefined') {
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

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [selectedYear, calcMode, monthlySalary, monthlyHours, overtimeHours, commuteHours, monthlyExpenses, projectFee, projectHours, extraHours, projectExpenses, taiwanPR, globalPR, realHourlyRate]);

  // Handle Share Link
  const handleShare = async () => {
    if (typeof window === 'undefined') return;

    const prCode = `pr${matchedMilestone.pr < 10 ? '0' + matchedMilestone.pr : matchedMilestone.pr}`;
    const targetPath = `/hourly-rate-calculator/rank/${prCode}/`;
    const shareUrl = `${window.location.origin}${targetPath}?pr=${taiwanPR.toFixed(1)}&gpr=${globalPR.toFixed(1)}&rate=${Math.round(realHourlyRate)}&year=${selectedYear}`;

    const funnyShareTitle = `【打工人靈魂審判 ⚖️】我的真實時薪 $${Math.round(realHourlyRate)}/hr (全台 PR ${taiwanPR.toFixed(1)})`;
    const funnyShareText = `扣除通勤與無酬加班，我的生命真實時薪只有 $${Math.round(realHourlyRate)}/hr 😭【${matchedMilestone.label}】！最適移居生活圈：【${matchedCountry.flag} ${matchedCountry.name}】。快來算算你的真實時薪，看你是在賺錢還是在渡化老闆 ➔ ${shareUrl}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: funnyShareTitle,
          text: funnyShareText,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(funnyShareText);
      showToast('已複製扎心又好笑的專屬連結與梗文！😂');
    } catch {
      showToast('複製失敗，請手動複製網址');
    }
  };

  // Helper for numeric inputs
  const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number | '') => void
  ) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    if (raw === '') {
      setter('');
    } else {
      setter(parseInt(raw, 10));
    }
  };

  return (
    <ToolLayout
      title="真實時薪計算器"
      subtitle="REAL HOURLY RATE CALCULATOR"
      description="扣除通勤時間、隱形加班與額外開銷支出，計算每小時生命的真實收益與全球生活圈適配度分析。"
      accentColor="#00f5a0"
      accentGlow="rgba(0, 245, 160, 0.6)"
    >
      <div className={styles.container}>
        {/* Dedicated Rank Showcase Card if landing on specific rank page */}
        {heroMilestone && (() => {
          const searchObj = (mounted && typeof window !== 'undefined') ? new URLSearchParams(window.location.search) : null;
          const qPr = searchObj ? searchObj.get('pr') : null;
          const qRate = searchObj ? searchObj.get('rate') : null;
          const qGpr = searchObj ? searchObj.get('gpr') : null;

          const hasCustomParams = Boolean(qPr || qRate || qGpr);

          // 實質年收益與實質月收益（基於實質時薪 * 2086 年工時，與 PR 精準對齊）
          const defaultAnnualIncome = getSalaryForPR(heroMilestone.pr, taiwanAnchors);
          const defaultMonthlyIncome = Math.round(defaultAnnualIncome / 12);
          const defaultHourlyRate = Math.max(1, Math.round(defaultMonthlyIncome / 176));

          const displayPR = (qPr && !isNaN(Number(qPr))) ? Number(qPr) : heroMilestone.pr;
          const displayHourlyRate = (qRate && !isNaN(Number(qRate))) ? Math.round(Number(qRate)) : (hasCustomParams && realHourlyRate > 0 ? Math.round(realHourlyRate) : defaultHourlyRate);

          // 實質收益 (Real Income) 算式對齊
          const displayAnnualIncome = (hasCustomParams && realHourlyRate > 0)
            ? Math.round(displayHourlyRate * currentTaiwanStat.default_working_hours.hours_per_year)
            : defaultAnnualIncome;
          const displayMonthlyIncome = Math.round(displayAnnualIncome / 12);

          const displayMinuteValue = (displayHourlyRate / 60).toFixed(2);
          const displayWageMultiplier = (displayHourlyRate / minHourlyWage).toFixed(2);

          const defaultGlobalPR = Math.min(Math.max(calculatePiecewisePR(defaultAnnualIncome, globalAnchors, true), 1.0), 99.9).toFixed(1);
          const displayGlobalPR = (qGpr && !isNaN(Number(qGpr))) ? Number(qGpr).toFixed(1) : (hasCustomParams ? globalPR.toFixed(1) : defaultGlobalPR);
          const displayGlobalBeatenPeople = (((Number(displayGlobalPR)) / 100) * 80).toFixed(1);
          const displayTaiwanRank = Math.round((1 - displayPR / 100) * 8400000).toLocaleString('zh-TW');

          // Stars rating
          const starCount = displayPR < 20 ? 1 : displayPR < 40 ? 2 : displayPR < 65 ? 3 : displayPR < 85 ? 4 : 5;
          const stars = '⭐️'.repeat(starCount);

          // Purchasing Power
          const bobaCount = (displayHourlyRate / 65).toFixed(1);
          const bentoCount = (displayHourlyRate / 100).toFixed(1);
          const latteCount = (displayHourlyRate / 150).toFixed(1);
          const movieHours = (330 / displayHourlyRate).toFixed(1);
          const iphoneHours = Math.round(46900 / displayHourlyRate);

          // Next Milestone Target (依據 displayPR 順序尋找第一個大於當前 PR 的里程碑，如 PR 44.5 ➔ 下一個即為 PR 45)
          const nextMilestone = milestones.find((m) => m.pr > displayPR) || null;
          const nextSalary = nextMilestone ? getSalaryForPR(nextMilestone.pr, taiwanAnchors) : displayAnnualIncome;
          const nextMonthlyIncome = Math.round(nextSalary / 12);
          const nextHourlyRate = Math.max(1, Math.round(nextMonthlyIncome / 176));

          // 比對「目標實質月收益」與「當前實質月收益」之真實差距
          const monthlyGap = Math.max(0, nextMonthlyIncome - displayMonthlyIncome);
          const rawHourlyGap = monthlyGap / 176;
          const hourlyGapDisplay = rawHourlyGap <= 0
            ? '0'
            : rawHourlyGap < 1
              ? rawHourlyGap.toFixed(2).replace(/\.?0+$/, '')
              : Math.round(rawHourlyGap).toString();

          // Country Match
          const heroCountry = countryMatches.find((c) => displayHourlyRate >= c.min_hourly_twd && displayHourlyRate < c.max_hourly_twd) || matchedCountry;

          const handleCopySocialText = async () => {
            const shareUrl = `${window.location.origin}/hourly-rate-calculator/rank/pr${heroMilestone.pr < 10 ? '0' + heroMilestone.pr : heroMilestone.pr}/?pr=${displayPR}&rate=${displayHourlyRate}&gpr=${displayGlobalPR}`;
            const text = `【全台打工人 PR 評定卡片 💳】\n評定等級：PR ${displayPR}【${heroMilestone.label}】 ${stars}\n💬 特質語錄：「${heroMilestone.desc}」\n⚡ 實質生命時薪：$${displayHourlyRate}/hr (每分鐘價值 $${displayMinuteValue} 元)\n🥤 珍奶自由度：工作 1 小時可換 ${bobaCount} 杯珍奶\n🏆 全台名次：840 萬打工人中約第 ${displayTaiwanRank} 名！\n🌍 最適移居生活圈：${heroCountry.flag} ${heroCountry.name}\n\n測測你是在賺薪水，還是在幫老闆付法拉利車貸 ➔ ${shareUrl}`;
            try {
              await navigator.clipboard.writeText(text);
              showToast('已成功複製 IG / Threads 幽默梗文！發去社群討拍吧 😂');
            } catch {
              showToast('複製失敗');
            }
          };

          return (
            <div className={`${styles.rankHeroBanner} mb-12 space-y-6`}>
              {/* 壹、 階級頭部與身份象徵 (Rank Identity & Header) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-glass pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${styles.milestoneBadge}`}>
                    全台薪資評定 PR {displayPR}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-surface-glass border border-border-glass text-text-sub">
                    {stars}
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                    【{heroMilestone.label}】
                  </h1>
                </div>
                <Link
                  href="/hourly-rate-calculator/"
                  className="text-xs font-semibold text-text-sub hover:text-[var(--theme-color)] transition-colors flex items-center gap-1 bg-surface-glass border border-border-glass px-3 py-1.5 rounded-lg"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  前往時薪計算器首頁
                </Link>
              </div>

              {/* 階級性格金句 */}
              <div className="p-4 rounded-xl bg-surface-glass border border-border-glass">
                <span className="text-xs font-bold text-[var(--theme-color)] block mb-1">💬 階級特質語錄</span>
                <p className="text-base text-text-main font-medium leading-relaxed italic">
                  「{heroMilestone.desc}」
                </p>
              </div>

              {/* 貳、 核心財務與時薪數據看板 (Core Financial Metrics) */}
              <div>
                <h3 className="text-xs font-bold text-text-sub mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  ⚡ 核心財務與生命時間價值 (Financial & Minute Value)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass">
                    <span className="text-xs text-text-sub block mb-0.5">推估實質年收益</span>
                    <span className="text-sm font-extrabold text-text-main font-mono">${displayAnnualIncome.toLocaleString('zh-TW')}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass">
                    <span className="text-xs text-text-sub block mb-0.5">折算實質月收益</span>
                    <span className="text-sm font-extrabold text-text-main font-mono">${displayMonthlyIncome.toLocaleString('zh-TW')}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass">
                    <span className="text-xs text-text-sub block mb-0.5">預估實質時薪</span>
                    <span className={`text-sm font-black font-mono ${styles.themeAccentText}`}>${displayHourlyRate} / hr</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass">
                    <span className="text-xs text-text-sub block mb-0.5">每分鐘生命價值</span>
                    <span className="text-sm font-extrabold text-text-main font-mono">${displayMinuteValue} / 分</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass">
                    <span className="text-xs text-text-sub block mb-0.5">法定最低工薪倍數</span>
                    <span className="text-sm font-extrabold text-text-main font-mono">{displayWageMultiplier}x 倍</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass">
                    <span className="text-xs text-text-sub block mb-0.5">常態月工時</span>
                    <span className="text-sm font-extrabold text-text-main font-mono">176 小時</span>
                  </div>
                </div>
              </div>

              {/* 參、 排名與人口比較 Counter (Ranking & Demographics) */}
              <div>
                <h3 className="text-xs font-bold text-text-sub mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  📊 全台 840 萬打工人與全球人口落點 (Ranking & Population)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-sub">🇹🇼 全台打工人勝出率</span>
                      <span className={`text-xs font-bold font-mono ${styles.themeAccentText}`}>PR {displayPR}</span>
                    </div>
                    <span className="text-sm font-bold text-text-main">
                      全台 840 萬打工人約第 <span className={`text-base font-black font-mono ${styles.themeAccentText}`}>{displayTaiwanRank}</span> 名
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-sub">🌏 全球人口勝出率</span>
                      <span className={`text-xs font-bold font-mono ${styles.globalPrText}`}>PR {displayGlobalPR}</span>
                    </div>
                    <span className="text-sm font-bold text-text-main">
                      超越全球約 <span className={`text-base font-black font-mono ${styles.globalPrText}`}>{displayGlobalBeatenPeople} 億</span> 人口
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-sub">🏛 主計總處分位落點</span>
                      <span className="text-xs font-bold font-mono text-text-sub">D1~D9</span>
                    </div>
                    <span className="text-sm font-bold text-text-main">
                      官方薪資層級：【PR {heroMilestone.pr} 分位階層】
                    </span>
                  </div>
                </div>
              </div>

              {/* 肆、 趣味生活購買力自由度指標 (Fun Purchasing Power Index) */}
              <div>
                <h3 className="text-xs font-bold text-text-sub mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  🍔 趣味時薪購買力自由度指數 (Hourly Purchasing Power)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass text-center">
                    <span className="text-xl block mb-1">🥤</span>
                    <span className="text-[11px] text-text-sub block mb-0.5">珍珠奶茶自由</span>
                    <span className="text-xs font-bold text-text-main font-mono">1小時 = {bobaCount} 杯</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass text-center">
                    <span className="text-xl block mb-1">🍱</span>
                    <span className="text-[11px] text-text-sub block mb-0.5">排骨便當自由</span>
                    <span className="text-xs font-bold text-text-main font-mono">1小時 = {bentoCount} 個</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass text-center">
                    <span className="text-xl block mb-1">☕</span>
                    <span className="text-[11px] text-text-sub block mb-0.5">星巴克拿鐵自由</span>
                    <span className="text-xs font-bold text-text-main font-mono">1小時 = {latteCount} 杯</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass text-center">
                    <span className="text-xl block mb-1">🍿</span>
                    <span className="text-[11px] text-text-sub block mb-0.5">威秀電影票自由</span>
                    <span className="text-xs font-bold text-text-main font-mono">幹活 {movieHours} 小時換1張</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass text-center">
                    <span className="text-xl block mb-1">📱</span>
                    <span className="text-[11px] text-text-sub block mb-0.5">iPhone 17 Pro 256G</span>
                    <span className="text-xs font-bold text-text-main font-mono">需幹活 {iphoneHours} 小時</span>
                  </div>
                </div>
              </div>

              {/* 伍、 全球生活圈與移居生活品質評估 (Global Lifestyle Suitability) */}
              <div>
                <h3 className="text-xs font-bold text-text-sub mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  🌍 全球生活圈與移居品質適配 (Global Lifestyle Compatibility)
                </h3>
                <div className="p-4 rounded-xl bg-surface-glass border border-border-glass space-y-2">
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${styles.countryBadge}`}>
                      🌍 最適移居生活圈評估
                    </span>
                    <span className="text-sm font-bold text-text-main">
                      {heroCountry.flag} {heroCountry.name}
                    </span>
                  </div>
                  <div className={`text-sm font-extrabold ${styles.themeAccentText}`}>
                    【{heroCountry.tag}】
                  </div>
                  <p className="text-sm text-text-sub leading-relaxed">
                    {heroCountry.description}
                  </p>
                </div>
              </div>

              {/* 陸、 遊戲化天梯升級攻略 (Next Rank Climbing Target) */}
              {nextMilestone && (
                <div>
                  <h3 className="text-xs font-bold text-text-sub mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                    🚀 階級晉升天梯攻略 (Next Rank Target)
                  </h3>
                  <div className="p-4 rounded-xl bg-gradient-to-r from-[var(--theme-color)]/10 via-surface-glass to-surface-glass border border-[var(--theme-color)]/30 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-bold text-text-sub">下一個目標階級：</span>
                        <span className="text-sm font-extrabold text-text-main">
                          【{nextMilestone.label}】(PR {nextMilestone.pr})
                        </span>
                      </div>
                      <p className="text-xs text-text-sub">
                        距晉升還需：實質月收益提升 <span className="font-bold text-text-main font-mono">+${monthlyGap.toLocaleString('zh-TW')} 元</span>（或實質時薪加 <span className={`font-bold font-mono ${styles.themeAccentText}`}>+${hourlyGapDisplay}/hr</span>）
                      </p>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1.5 rounded-lg ${styles.targetBadge} font-mono`}>
                      晉升目標實質月收益 ~${Math.round(nextMonthlyIncome / 1000)}k
                    </span>
                  </div>
                </div>
              )}

              {/* 柒、 互動行動呼籲與社群傳播 (Action & Social Sharing) */}
              <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border-glass">
                <Link
                  href="/hourly-rate-calculator/"
                  className={`${styles.actionBtn} text-sm flex items-center gap-2`}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2h6v2H7V4zm6 4H7v2h6V8zm-6 4h6v2H7v-2z" clipRule="evenodd" />
                  </svg>
                  🧮 算算我的真實時薪與 PR ➔
                </Link>
                <button
                  type="button"
                  onClick={handleShare}
                  className={styles.shareBtn}
                >
                  <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  🔗 複製專屬卡片連結
                </button>
                <button
                  type="button"
                  onClick={handleCopySocialText}
                  className="px-4 py-2.5 rounded-xl bg-surface-glass border border-border-glass text-text-main font-semibold text-sm hover:border-[var(--theme-color)] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  📱 複製 IG / Threads 梗文
                </button>
              </div>
            </div>
          );
        })()}

        {/* Header Intro Banner */}
        <div className="text-center mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-text-main mb-3 tracking-tight">
            揭開實質時薪的面紗，解鎖 <span className={styles.themeAccentText}>全球生活圈與 PR 排行</span>
          </h1>
          <p className="text-base text-text-sub max-w-2xl mx-auto">
            扣除加班耗損、通勤工時與隱性費用支出，精準計算您的生命時薪並分析最適移居國家。
          </p>
        </div>

        {/* Main Grid: Left Controls, Right Results */}
        {showCalculator && (
          <div id="calculator-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
          {/* Controls Card */}
          <div className={`lg:col-span-6 p-6 ${styles.calcCard}`}>
            <div className="flex items-center justify-between border-b border-border-glass pb-4 mb-6">
              <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
                <svg className="w-5 h-5 text-[var(--theme-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                試算條件設定
              </h2>

              {/* Year Select */}
              <div className="flex items-center gap-2">
                <label htmlFor={yearSelectId} className="text-xs font-semibold text-text-sub">
                  適用年份
                </label>
                <select
                  id={yearSelectId}
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="bg-select-bg border border-border-glass rounded-lg px-2.5 py-1 text-sm text-text-main font-medium outline-none focus:border-[var(--theme-color)]"
                >
                  <option value={2026}>2026 年 (最低時薪 $196)</option>
                  <option value={2025}>2025 年 (最低時薪 $190)</option>
                </select>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="mb-6">
              <legend id={calcModeSelectId} className="text-sm font-medium text-text-sub mb-2 block">
                計算模式
              </legend>
              <div className="grid grid-cols-2 gap-2 bg-surface-glass p-1.5 rounded-xl border border-border-glass">
                <button
                  type="button"
                  onClick={() => setCalcMode('monthly')}
                  className={`${styles.tabBtn} ${calcMode === 'monthly' ? styles.tabBtnActive : ''}`}
                >
                  全職 / 月薪模式
                </button>
                <button
                  type="button"
                  onClick={() => setCalcMode('project')}
                  className={`${styles.tabBtn} ${calcMode === 'project' ? styles.tabBtnActive : ''}`}
                >
                  專案 / 接案模式
                </button>
              </div>
            </div>

            {/* Inputs based on Mode */}
            {calcMode === 'monthly' ? (
              <div className="space-y-4">
                <div>
                  <label htmlFor={monthlySalaryId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                    名目月薪 (NTD)
                  </label>
                  <input
                    id={monthlySalaryId}
                    type="text"
                    inputMode="numeric"
                    value={monthlySalary === '' ? '' : monthlySalary.toLocaleString('zh-TW')}
                    onChange={(e) => handleNumberInput(e, setMonthlySalary)}
                    className={styles.inputField}
                    placeholder="例如：50,000"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={monthlyHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                      合約常態月工時 (小時)
                    </label>
                    <input
                      id={monthlyHoursId}
                      type="text"
                      inputMode="numeric"
                      value={monthlyHours === '' ? '' : monthlyHours}
                      onChange={(e) => handleNumberInput(e, setMonthlyHours)}
                      className={styles.inputField}
                      placeholder="預設 174 小時"
                    />
                  </div>
                  <div>
                    <label htmlFor={overtimeHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                      隱形加班 / 待命 (小時/月)
                    </label>
                    <input
                      id={overtimeHoursId}
                      type="text"
                      inputMode="numeric"
                      value={overtimeHours === '' ? '' : overtimeHours}
                      onChange={(e) => handleNumberInput(e, setOvertimeHours)}
                      className={styles.inputField}
                      placeholder="如：10"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={commuteHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                      總通勤時間 (小時/月)
                    </label>
                    <input
                      id={commuteHoursId}
                      type="text"
                      inputMode="numeric"
                      value={commuteHours === '' ? '' : commuteHours}
                      onChange={(e) => handleNumberInput(e, setCommuteHours)}
                      className={styles.inputField}
                      placeholder="如：20"
                    />
                  </div>
                  <div>
                    <label htmlFor={monthlyExpensesId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                      額外通勤/工具耗損 (元/月)
                    </label>
                    <input
                      id={monthlyExpensesId}
                      type="text"
                      inputMode="numeric"
                      value={monthlyExpenses === '' ? '' : monthlyExpenses.toLocaleString('zh-TW')}
                      onChange={(e) => handleNumberInput(e, setMonthlyExpenses)}
                      className={styles.inputField}
                      placeholder="如：2,000"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label htmlFor={projectFeeId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                    專案總報酬 (NTD)
                  </label>
                  <input
                    id={projectFeeId}
                    type="text"
                    inputMode="numeric"
                    value={projectFee === '' ? '' : projectFee.toLocaleString('zh-TW')}
                    onChange={(e) => handleNumberInput(e, setProjectFee)}
                    className={styles.inputField}
                    placeholder="例如：60,000"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor={projectHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                      預計總執行工時 (小時)
                    </label>
                    <input
                      id={projectHoursId}
                      type="text"
                      inputMode="numeric"
                      value={projectHours === '' ? '' : projectHours}
                      onChange={(e) => handleNumberInput(e, setProjectHours)}
                      className={styles.inputField}
                      placeholder="如：100"
                    />
                  </div>
                  <div>
                    <label htmlFor={extraHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                      隱性修改/開會溝通 (小時)
                    </label>
                    <input
                      id={extraHoursId}
                      type="text"
                      inputMode="numeric"
                      value={extraHours === '' ? '' : extraHours}
                      onChange={(e) => handleNumberInput(e, setExtraHours)}
                      className={styles.inputField}
                      placeholder="如：20"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={projectExpensesId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                    專案直接成本/工具採購 (元)
                  </label>
                  <input
                    id={projectExpensesId}
                    type="text"
                    inputMode="numeric"
                    value={projectExpenses === '' ? '' : projectExpenses.toLocaleString('zh-TW')}
                    onChange={(e) => handleNumberInput(e, setProjectExpenses)}
                    className={styles.inputField}
                    placeholder="如：3,000"
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
                <span className="text-sm font-semibold text-text-sub">真實時薪 (Real Hourly Rate)</span>
                {/* Legality Badge */}
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
                      Pass (高於法定最低時薪 {diffPercent.toFixed(1)}%)
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      Fail (低於法定最低時薪 {diffPercent.toFixed(1)}%)
                    </>
                  )}
                </span>
              </div>

              <div className="flex items-baseline gap-2 mb-6">
                <span className="text-4xl sm:text-5xl font-black text-text-main font-mono tracking-tight">
                  ${Math.round(realHourlyRate).toLocaleString('zh-TW')}
                </span>
                <span className="text-base font-semibold text-text-sub">/ hr</span>
              </div>

              {/* Work Breakdown Stats */}
              <div className="grid grid-cols-2 gap-4 border-t border-border-glass pt-4">
                <div>
                  <span className="text-xs text-text-sub block mb-1">實際月總投入時間</span>
                  <span className="text-sm font-semibold text-text-main font-mono">{totalHours} 小時</span>
                </div>
                <div>
                  <span className="text-xs text-text-sub block mb-1">扣除成本實領淨額</span>
                  <span className="text-sm font-semibold text-text-main font-mono">
                    ${Math.max(0, netIncome).toLocaleString('zh-TW')} 元
                  </span>
                </div>
              </div>
            </div>

            {/* Dual PR Ranking Cards (Taiwan & Worldwide) */}
            <div className={`p-6 ${styles.calcCard} space-y-6`}>
              <div className="flex items-center justify-between border-b border-border-glass pb-3">
                <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--theme-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  薪資 Percentile 排行榜
                </h3>
              </div>

              {/* Taiwan PR Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                    🇹🇼 全台打工人 PR
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
                <div className="flex justify-between text-[11px] text-text-sub mt-1 font-mono">
                  <span>PR 10 (36.5萬)</span>
                  <span>PR 50 中位數 (56.8萬)</span>
                  <span>PR 90 (129萬)</span>
                </div>
              </div>

              {/* Worldwide PR Section */}
              <div className="pt-3 border-t border-border-glass">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                    🌏 全世界人口 PR
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
                <div className="flex justify-between text-[11px] text-text-sub mt-1 font-mono">
                  <span>P50 中位數 ($3,430 USD)</span>
                  <span>P90 ($26,500 USD)</span>
                  <span>P99 Top 1% ($109,000 USD)</span>
                </div>
                <p className="text-xs text-text-sub mt-2">
                  🎉 您的收入擊敗了全球 <span className="font-bold text-text-main">{globalPR.toFixed(1)}%</span> 的人口！ (資料源：WID 全球所得分佈)
                </p>
              </div>

              {/* Country Lifestyle Compatibility Card */}
              {matchedCountry && (
                <div className="pt-3 border-t border-border-glass">
                  <div className="p-4 rounded-xl bg-surface-glass border border-border-glass relative space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${styles.countryBadge}`}>
                        🌍 最適生活圈評估
                      </span>
                      <span className="text-sm font-bold text-text-main">
                        {matchedCountry.flag} {matchedCountry.name}
                      </span>
                    </div>
                    <div className={`text-sm font-extrabold ${styles.themeAccentText}`}>
                      【{matchedCountry.tag}】
                    </div>
                    <p className="text-sm text-text-sub leading-relaxed">
                      {matchedCountry.description}
                    </p>
                  </div>
                </div>
              )}

              {/* Exclusive Milestone Card: 快看你的專屬卡片 */}
              {matchedMilestone && (
                <div className={`${styles.exclusiveMilestoneCard} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded-md ${styles.milestoneBadge} flex items-center gap-1`}>
                      ✨ 專屬打工人評定解鎖
                    </span>
                    <span className="text-xs font-mono text-text-sub font-bold">
                      全台 PR {taiwanPR.toFixed(1)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xl font-black text-text-main flex items-center gap-2 mb-1">
                      【{matchedMilestone.label}】
                    </h4>
                    <p className="text-sm text-text-sub leading-relaxed">
                      {matchedMilestone.desc}
                    </p>
                  </div>

                  {/* Shiny CTA Button to open the dedicated PRXX page */}
                  <div className="pt-2">
                    <Link
                      href={`/hourly-rate-calculator/rank/pr${matchedMilestone.pr < 10 ? '0' + matchedMilestone.pr : matchedMilestone.pr}/?pr=${taiwanPR.toFixed(1)}&rate=${Math.round(realHourlyRate)}`}
                      className={styles.milestoneCardCTA}
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      🔮 快看你的專屬卡片 (PR{matchedMilestone.pr < 10 ? '0' + matchedMilestone.pr : matchedMilestone.pr}) ➔
                    </Link>
                  </div>
                </div>
              )}

              {/* Share Action */}
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={handleShare}
                  className={styles.shareBtn}
                >
                  <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  分享我的全台/全球/生活圈試算成果
                </button>
              </div>
            </div>
          </div>
        </div>
        )}

        {/* Informational Section for SEO, Formula & Reference Sources */}
        <div className={`mt-12 p-8 ${styles.calcCard} space-y-6`}>
          <h2 className="text-xl font-bold text-text-main border-b border-border-glass pb-3">
            真實時薪、全台/全球 PR 與權威資料來源說明
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-text-sub">
            <div>
              <h3 className="font-semibold text-text-main mb-2 text-base">1. 真實時薪 (Real Hourly Rate)</h3>
              <p className="mb-2">
                許多人僅以名目月薪除以標準工時，忽略了每日通勤時間、無酬加班及開銷支出。公式為：
              </p>
              <div className="p-3 rounded-lg bg-surface-glass border border-border-glass font-mono text-xs text-text-main mb-2">
                總工時 = 常態工作時間 + 隱形加班時間 + 通勤時間
                <br />
                淨收入 = 名目薪資/報酬 - 額外交通與工具支出
                <br />
                真實時薪 = 淨收入 / 總工時
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-text-main mb-2 text-base">2. 全台與全球 PR 分段線性插值</h3>
              <p className="mb-2">
                對照行政院主計總處 D1~D9 分位數統計，以及 WID 全球個人所得分佈數據，於相鄰分位數 [Pᵢ, Pᵢ₊₁] 進行精確分段線性插值。
              </p>
              <div className="p-3 rounded-lg bg-surface-glass border border-border-glass font-mono text-xs text-text-main mb-2">
                推估年薪 A = 真實時薪 × 2086 小時
                <br />
                PR = PRᵢ + [(A - Sᵢ) / (Sᵢ₊₁ - Sᵢ)] × (PRᵢ₊₁ - PRᵢ)
              </div>
            </div>
          </div>

          {/* Reference Data Sources Disclosure */}
          <div className="border-t border-border-glass pt-6 mt-4">
            <h3 className="font-semibold text-text-main mb-3 text-base flex items-center gap-2">
              <svg className="w-5 h-5 text-[var(--theme-color)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              權威資料來源與依據說明 (Reference Data Sources)
            </h3>
            <ul className="space-y-2 text-xs text-text-sub list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-text-main">🇹🇼 台灣薪資與工時數據</strong>：
                <a
                  href="https://www.dgbas.gov.tw/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[var(--theme-color)] transition-colors ml-1"
                >
                  行政院主計總處
                </a>
                《受僱員工全年總薪資中位數及分位數統計表》與勞動部《法定最低工資發布公告》。
              </li>
              <li>
                <strong className="text-text-main">🌏 全球人口所得數據</strong>：
                <a
                  href="https://wid.world/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[var(--theme-color)] transition-colors ml-1"
                >
                  World Inequality Database (WID 全球不平等資料庫)
                </a>
                與 World Bank (世界銀行全球個人所得分佈報告)。
              </li>
              <li>
                <strong className="text-text-main">🌍 全球生活圈購買力 (PPP) 物價指標</strong>：
                <a
                  href="https://www.oecd.org/en/data/datasets/purchasing-power-parities.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[var(--theme-color)] transition-colors ml-1"
                >
                  OECD Purchasing Power Parities
                </a>
                與
                <a
                  href="http://numbeo.com/cost-of-living/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-[var(--theme-color)] transition-colors ml-1"
                >
                  Numbeo Global Cost of Living Index
                </a>
                。
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && <div className={styles.toast}>{toastMessage}</div>}
    </ToolLayout>
  );
}

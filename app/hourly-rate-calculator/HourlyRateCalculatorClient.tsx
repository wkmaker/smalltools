'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '@/app/components/ToolLayout';
import taiwanStatsData from './config/taiwan_statistics.json';
import globalStatsData from './config/global_statistics.json';
import milestoneData from './config/percentile_milestones.json';
import countrySuitabilityData from './config/country_suitability.json';
import numbeoCostOfLivingData from './config/global_cost_of_living.json';
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
  const [isHydrated, setIsHydrated] = useState(false);

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
  const exploreCountryId = useId();

  // States
  const [showCalculator, setShowCalculator] = useState<boolean>(!initialSlug && initialPr === undefined);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [calcMode, setCalcMode] = useState<'monthly' | 'project'>('monthly');
  const [selectedExploreCountry, setSelectedExploreCountry] = useState<string>('Japan');

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

      if (qYear && ['2026', '2025', '2024', '2023', '2022', '2021', '2020'].includes(qYear)) {
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

      setIsHydrated(true);
      isMountedRef.current = true;
    }
  }, [initialSlug, initialPr]);

  // Benchmarks for current year
  const yearKey = String(selectedYear) as keyof typeof taiwanStatsData.statistics;
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

  // Helper to build full query params string preserving state
  const getQueryParamsString = () => {
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
  };

  // Update URL Query parameters seamlessly
  useEffect(() => {
    if (isHydrated && typeof window !== 'undefined') {
      const newUrl = `${window.location.pathname}?${getQueryParamsString()}`;
      window.history.replaceState(null, '', newUrl);
    }
  }, [isHydrated, selectedYear, calcMode, monthlySalary, monthlyHours, overtimeHours, commuteHours, monthlyExpenses, projectFee, projectHours, extraHours, projectExpenses, taiwanPR, globalPR, realHourlyRate]);

  // Handle Share Link & Social Text
  const handleShare = async (overrideText?: string) => {
    if (typeof window === 'undefined') return;

    const prCode = `pr${matchedMilestone.pr < 10 ? '0' + matchedMilestone.pr : matchedMilestone.pr}`;
    const targetPath = `/hourly-rate-calculator/rank/${prCode}/`;
    const shareUrl = `${window.location.origin}${targetPath}?${getQueryParamsString()}`;

    const defaultText = `【全台打工人 PR 評定卡片 💳】\n評定等級：PR ${taiwanPR.toFixed(1)}【${matchedMilestone.label}】\n💬 特質語錄：「${matchedMilestone.desc}」\n⚡ 實質生命時薪：$${Math.round(realHourlyRate)}/hr (每分鐘價值 $${(realHourlyRate / 60).toFixed(2)} 元)\n🥤 珍奶自由度：工作 1 小時可換 ${(realHourlyRate / 65).toFixed(1)} 杯珍奶\n🏆 全台名次：840 萬打工人中約第 ${Math.round((1 - taiwanPR / 100) * 8400000).toLocaleString('zh-TW')} 名！\n🌍 最適移居生活圈：${matchedCountry ? matchedCountry.flag + ' ' + matchedCountry.name : ''}\n\n測測你是在賺薪水，還是在幫老闆付法拉利車貸 ➔ ${shareUrl}`;

    const textToShare = overrideText || defaultText;
    const funnyShareTitle = `【打工人靈魂審判 ⚖️】我的真實時薪 $${Math.round(realHourlyRate)}/hr (全台 PR ${taiwanPR.toFixed(1)})`;

    // Detect mobile device for native Share Sheet, otherwise direct copy to clipboard for desktop
    const isMobile = typeof navigator !== 'undefined' && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile && navigator.share) {
      try {
        await navigator.share({
          title: funnyShareTitle,
          text: textToShare,
          url: shareUrl,
        });
        return;
      } catch {
        // Fallback to clipboard if share sheet was closed or unsupported
      }
    }

    try {
      await navigator.clipboard.writeText(textToShare);
      showToast('已成功複製專屬卡片梗文與連結！');
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
      backHref={heroMilestone ? `/hourly-rate-calculator/?${getQueryParamsString()}` : undefined}
      backText={heroMilestone ? '返回時薪計算器' : undefined}
      backTitle={heroMilestone ? '返回時薪計算器首頁' : undefined}
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
          const stars = '★'.repeat(starCount);

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

          // Numbeo 152-country Purchasing Power Insights
          const getNumbeoInsights = (rate: number) => {
            const twBase = numbeoCostOfLivingData.base_indexes;
            const twCostPlusRent = twBase.cost_of_living_plus_rent_index;
            const twRest = twBase.restaurant_price_index;
            const twRent = twBase.rent_index;

            const countries = numbeoCostOfLivingData.countries;

            const evaluated = countries.map((c) => {
              const multiplier = twCostPlusRent / c.cost_of_living_plus_rent_index;
              const restSavings = Math.round((1 - c.restaurant_price_index / twRest) * 100);
              const rentSavings = Math.round((1 - c.rent_index / twRent) * 100);
              const costDiffPercent = Math.round((1 - c.cost_of_living_plus_rent_index / twCostPlusRent) * 100);
              const costDiffText = costDiffPercent > 0
                ? `開銷比台灣便宜 ${costDiffPercent}%`
                : costDiffPercent < 0
                  ? `開銷比台灣高 ${Math.abs(costDiffPercent)}%`
                  : '開銷與台灣相當';
              const localEffectiveRate = Math.round(rate * multiplier);

              // 匹配 country_suitability.json 的專屬生活圈資料
              const matchedSuitability = countryMatches.find((cm) =>
                cm.countries.some((name) => name.includes(c.name_zh) || name.includes(c.country))
              ) || countryMatches.find((cm) => localEffectiveRate >= cm.min_hourly_twd && localEffectiveRate < cm.max_hourly_twd)
                || countryMatches[0];

              // 生活體感實例 (Tangible Lifestyle Perk)
              let lifestylePerk = '';
              if (costDiffPercent >= 40) {
                lifestylePerk = '泳池景觀公寓住到爽 + 外食SPA按摩自由';
              } else if (costDiffPercent >= 20) {
                lifestylePerk = '質感電梯大樓套房 + 外食手搖加蛋無負擔';
              } else if (costDiffPercent >= -10) {
                lifestylePerk = '居酒屋燒肉自由 + 暢享高品質都會人文體驗';
              } else if (costDiffPercent >= -40) {
                lifestylePerk = '異國歐式風情體驗，外食租金開銷需稍微精算';
              } else {
                lifestylePerk = '全球頂尖高薪富豪圈，適合強大資產配置與精英身價';
              }

              return {
                ...c,
                multiplier,
                multiplierStr: multiplier.toFixed(2),
                restSavings,
                rentSavings,
                costDiffPercent,
                costDiffText,
                localEffectiveRate,
                suitabilityTag: matchedSuitability.tag,
                suitabilityName: matchedSuitability.name,
                suitabilityDesc: matchedSuitability.description,
                lifestylePerk,
              };
            });

            // Dynamic Tier-based Selection from countryMatches (country_suitability.json) as single source of truth
            const currentTier = countryMatches.find((cm) => rate >= cm.min_hourly_twd && rate < cm.max_hourly_twd) || countryMatches[0];

            const tierTitle = `【${currentTier.tag}】適合時薪 $${rate}/hr 的${currentTier.name}`;
            const tierDesc = currentTier.description;

            // 優先匹配當前適配圈中的國家
            let candidateList = evaluated.filter((c) =>
              currentTier.countries.some((name) => name.includes(c.name_zh) || name.includes(c.country))
            );

            if (candidateList.length < 3) {
              const extraCandidates = evaluated
                .filter((c) => c.country !== 'Taiwan' && !candidateList.some((item) => item.country === c.country))
                .sort((a, b) => b.multiplier - a.multiplier);
              candidateList = [...candidateList, ...extraCandidates];
            }

            const arbitrageTop3 = candidateList
              .sort((a, b) => b.multiplier - a.multiplier)
              .slice(0, 3);

            // 幸福感與生活品質高熱門國家 (High Happiness & Desirable Destinations)
            const highHappinessList = ['Japan', 'South Korea', 'Spain', 'Portugal', 'Czech Republic', 'Croatia', 'Estonia', 'Italy', 'Greece'];
            const equivalentPicks = evaluated
              .filter((c) => highHappinessList.includes(c.country) && !arbitrageTop3.some((a) => a.country === c.country))
              .sort((a, b) => Math.abs(a.multiplier - 1.0) - Math.abs(b.multiplier - 1.0))
              .slice(0, 4);

            return { tierTitle, tierDesc, arbitrageTop3, equivalentPicks, evaluated };
          };

          const numbeoInsights = getNumbeoInsights(displayHourlyRate);

          const handleCopySocialText = async () => {
            const shareUrl = `${window.location.origin}/hourly-rate-calculator/rank/pr${heroMilestone.pr < 10 ? '0' + heroMilestone.pr : heroMilestone.pr}/?${getQueryParamsString()}`;
            const text = `【全台打工人 PR 評定卡片 💳】\n評定等級：PR ${displayPR}【${heroMilestone.label}】 ${stars}\n💬 特質語錄：「${heroMilestone.desc}」\n⚡ 實質生命時薪：$${displayHourlyRate}/hr (每分鐘價值 $${displayMinuteValue} 元)\n🥤 珍奶自由度：工作 1 小時可換 ${bobaCount} 杯珍奶\n🏆 全台名次：840 萬打工人中約第 ${displayTaiwanRank} 名！\n🌍 最適移居生活圈：${heroCountry.flag} ${heroCountry.name}\n\n測測你是在賺薪水，還是在幫老闆付法拉利車貸 ➔ ${shareUrl}`;
            await handleShare(text);
          };

          return (
            <div className={`${styles.rankHeroBanner} mb-12 space-y-6`}>
              {/* 壹、 階級頭部與身份象徵 (Rank Identity & Header) */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-glass pb-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-3 py-1 text-xs font-bold rounded-full ${styles.milestoneBadge}`}>
                    全台薪資評定 PR {displayPR}
                  </span>
                  <div className="flex items-center gap-0.5 px-2.5 py-1 rounded-md bg-surface-glass border border-border-glass">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg
                        key={i}
                        className={`w-3.5 h-3.5 ${i < starCount ? 'text-amber-400 fill-amber-400' : 'text-slate-600 fill-slate-700/40'}`}
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-text-main tracking-tight">
                    【{heroMilestone.label}】
                  </h1>
                </div>
              </div>

              {/* 階級性格金句 */}
              <div className="p-4 rounded-xl bg-surface-glass border border-border-glass">
                <span className={`text-xs font-bold ${styles.themeAccentText} flex items-center gap-1 mb-1`}>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  階級特質語錄
                </span>
                <p className="text-base text-text-main font-medium leading-relaxed italic">
                  「{heroMilestone.desc}」
                </p>
              </div>

              {/* 貳、 核心財務與時薪數據看板 (Core Financial Metrics) */}
              <div>
                <h3 className="text-xs font-bold text-text-sub mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <svg className={`w-4 h-4 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  核心財務與生命時間價值 (Financial & Minute Value)
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
                  <svg className={`w-4 h-4 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  全台 840 萬打工人與全球人口落點 (Ranking & Population)
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-sub inline-flex items-center gap-1">
                        <svg className={`w-3.5 h-3.5 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        全台打工人勝出率
                      </span>
                      <span className={`text-xs font-bold font-mono ${styles.themeAccentText}`}>PR {displayPR}</span>
                    </div>
                    <span className="text-sm font-bold text-text-main">
                      全台 840 萬打工人約第 <span className={`text-base font-black font-mono ${styles.themeAccentText}`}>{displayTaiwanRank}</span> 名
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-sub inline-flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 012 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2v1.5a2.5 2.5 0 002.5 2.5h.5a2 2 0 012 2v.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        全球人口勝出率
                      </span>
                      <span className={`text-xs font-bold font-mono ${styles.globalPrText}`}>PR {displayGlobalPR}</span>
                    </div>
                    <span className="text-sm font-bold text-text-main">
                      超越全球約 <span className={`text-base font-black font-mono ${styles.globalPrText}`}>{displayGlobalBeatenPeople} 億</span> 人口
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-text-sub inline-flex items-center gap-1">
                        <svg className="w-3.5 h-3.5 text-text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5m0 0h6m-6 0V11m0 0h6m-6 0v-4m6 4v10" />
                        </svg>
                        主計總處分位落點
                      </span>
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
                  <svg className={`w-4 h-4 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  趣味時薪購買力自由度指數 (Hourly Purchasing Power)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass text-center">
                    <svg className={`w-5 h-5 mb-1 mx-auto ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L5.605 15.13a2 2 0 00-1.806.547M8 4h8l-1 5H9L8 4z" />
                    </svg>
                    <span className="text-xs text-text-sub block mb-0.5">珍珠奶茶自由</span>
                    <span className="text-xs font-bold text-text-main font-mono">1小時 = {bobaCount} 杯</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass text-center">
                    <svg className={`w-5 h-5 mb-1 mx-auto ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V3m0 0l-4 4m4-4l4 4M4 11h16M4 15h16M4 19h16" />
                    </svg>
                    <span className="text-xs text-text-sub block mb-0.5">排骨便當自由</span>
                    <span className="text-xs font-bold text-text-main font-mono">1小時 = {bentoCount} 個</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass text-center">
                    <svg className={`w-5 h-5 mb-1 mx-auto ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" />
                    </svg>
                    <span className="text-xs text-text-sub block mb-0.5">星巴克拿鐵自由</span>
                    <span className="text-xs font-bold text-text-main font-mono">1小時 = {latteCount} 杯</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass text-center">
                    <svg className={`w-5 h-5 mb-1 mx-auto ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                    </svg>
                    <span className="text-xs text-text-sub block mb-0.5">威秀電影票自由</span>
                    <span className="text-xs font-bold text-text-main font-mono">幹活 {movieHours} 小時換1張</span>
                  </div>
                  <div className="p-3 rounded-xl bg-surface-glass border border-border-glass text-center">
                    <svg className={`w-5 h-5 mb-1 mx-auto ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                    </svg>
                    <span className="text-xs text-text-sub block mb-0.5">iPhone 17 Pro 256G</span>
                    <span className="text-xs font-bold text-text-main font-mono">需幹活 {iphoneHours} 小時</span>
                  </div>
                </div>
              </div>

              {/* 伍、 全球生活圈與移居生活品質評估 (Global Lifestyle Suitability) */}
              <div>
                <h3 className="text-xs font-bold text-text-sub mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                  <svg className={`w-4 h-4 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 012 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2v1.5a2.5 2.5 0 002.5 2.5h.5a2 2 0 012 2v.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  全球生活圈與移居品質適配 (Global Lifestyle Compatibility)
                </h3>
                <div className="p-4 rounded-xl bg-surface-glass border border-border-glass space-y-4">
                  {/* 最適移居圈標題與當前實質時薪 */}
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-glass pb-3">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-md ${styles.countryBadge} flex items-center gap-1`}>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 012 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2v1.5a2.5 2.5 0 002.5 2.5h.5a2 2 0 012 2v.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      基本適配圈：{heroCountry.flag} {heroCountry.name}
                    </span>
                    <span className="text-xs text-text-sub font-mono">
                      折算時薪：<span className={`font-bold ${styles.themeAccentText}`}>${displayHourlyRate} NTD/hr</span>
                    </span>
                  </div>

                  {/* 地理套利降維打擊 與 時薪階層動態推薦 Top 3 */}
                  {numbeoInsights && numbeoInsights.arbitrageTop3.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-glass/40 pb-2">
                        <div>
                          <div className="text-xs font-bold text-text-main flex items-center gap-1.5">
                            <svg className={`w-4 h-4 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            <span>{numbeoInsights.tierTitle}</span>
                          </div>
                          <p className="text-xs text-text-sub mt-0.5">
                            {numbeoInsights.tierDesc}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-text-sub border border-border-glass bg-surface-glass px-2.5 py-0.5 rounded-full shrink-0">
                          時薪階層動態精算
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {numbeoInsights.arbitrageTop3.map((item) => (
                          <div key={item.country} className="p-3.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col justify-between space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-bold text-text-main">
                                {item.flag} {item.name_zh}
                              </span>
                              <span className={`text-sm font-black font-mono ${styles.themeAccentText} flex items-center gap-0.5`}>
                                {item.multiplierStr}x
                                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.57l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.57l7-10a1 1 0 011.12-.384z" clipRule="evenodd" />
                                </svg>
                              </span>
                            </div>
                            <div className={`text-xs font-bold ${styles.themeAccentText}`}>
                              【{item.suitabilityTag}】
                            </div>
                            <div className="text-xs text-text-sub font-mono">
                              體感：<span className="font-semibold text-text-main">{item.lifestylePerk}</span>
                            </div>
                            <div className="text-xs text-text-sub flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-border-glass/40 font-mono">
                              <span>外食 {item.restSavings > 0 ? `省 ${item.restSavings}%` : item.restSavings < 0 ? `高 ${Math.abs(item.restSavings)}%` : '物價相近'}</span>
                              <span>•</span>
                              <span>{item.costDiffText}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 購買力相當的對等國家 */}
                  {numbeoInsights && numbeoInsights.equivalentPicks.length > 0 && (
                    <div className="pt-2 border-t border-border-glass/50 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <span className="text-text-sub font-medium flex items-center gap-1.5">
                        <svg className="w-4 h-4 text-text-sub inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                        </svg>
                        <span>同等時薪幸福感與質感升級圈：</span>
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {numbeoInsights.equivalentPicks.map((item) => (
                          <span key={item.country} className="px-2.5 py-1 rounded-lg bg-surface-glass border border-border-glass text-xs font-semibold text-text-main">
                            {item.flag} {item.name_zh}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 全球 152 國互動購買力試算與探索選單 */}
                  {numbeoInsights && numbeoInsights.evaluated.length > 0 && (() => {
                    const exploreTarget = numbeoInsights.evaluated.find(
                      (c) => c.country === selectedExploreCountry || c.name_zh === selectedExploreCountry
                    ) || numbeoInsights.evaluated.find((c) => c.country === 'Japan') || numbeoInsights.evaluated[0];

                    const mult = exploreTarget.multiplier;
                    const costDiff = exploreTarget.costDiffPercent;
                    const targetName = exploreTarget.name_zh;
                    const localRate = exploreTarget.localEffectiveRate;

                    let statusBadge = '';
                    let statusBadgeStyle = '';
                    let feelComment = '';
                    let comparisonVerdict = '';

                    if (mult >= 1.25) {
                      statusBadge = '降維打擊！生活品質爽度倍增';
                      statusBadgeStyle = 'bg-surface-glass border border-border-glass font-bold text-text-main';
                      feelComment = `以你目前 $${displayHourlyRate}/hr 的時薪移居${targetName}，購買力直接放大至 ${exploreTarget.multiplierStr}x 倍！相當於在當地享有 $${localRate.toLocaleString('zh-TW')} NTD/hr 的高可支配薪資。入住無邊際泳池公寓、外食美饌與 SPA 按摩完全不傷錢包！`;
                      comparisonVerdict = `【降維打擊】生活體驗評估：比在台灣生活輕鬆 ${costDiff}%，可用更低的生活負擔快速累積資產兼享度假生活！`;
                    } else if (mult >= 0.85) {
                      statusBadge = '無縫切換！與台灣生活品質對等';
                      statusBadgeStyle = 'bg-surface-glass border border-border-glass font-bold text-text-main';
                      feelComment = `以你目前 $${displayHourlyRate}/hr 的時薪移居${targetName}，購買力與台灣維持 1:1 高度相當！日常外食與居住開銷平穩，能用同樣的努力輕鬆體驗異國文化與高品質都會生活步調。`;
                      comparisonVerdict = `【無痛切換】生活體驗評估：開銷與台灣極為接近，能無痛切換生活圈，暢享當地文化與頂級環境品質！`;
                    } else if (mult >= 0.60) {
                      statusBadge = '環境極佳，外食租金需精算';
                      statusBadgeStyle = 'bg-surface-glass border border-border-glass font-bold text-text-main';
                      const targetComfortableRate = Math.round(displayHourlyRate / mult);
                      feelComment = `以你目前 $${displayHourlyRate}/hr 的時薪移居${targetName}，能享受極高的治安與人文環境，但外食與租金比台灣高出 ${Math.abs(costDiff)}%，日常需適度分配預算。`;
                      comparisonVerdict = `【建議試算】爽過建議：在${targetName}要過得十分寬裕，建議目標時薪拉升至 $${targetComfortableRate.toLocaleString('zh-TW')} NTD/hr！`;
                    } else {
                      statusBadge = '高物價大都市，考驗預算能力';
                      statusBadgeStyle = 'bg-surface-glass border border-border-glass font-bold text-text-main';
                      const targetComfortableRate = Math.round(displayHourlyRate / mult);
                      feelComment = `以你目前 $${displayHourlyRate}/hr 的時薪移居${targetName}，外食與房租開銷比台灣高出 ${Math.abs(costDiff)}%！外食大餐與精華區房租壓力較大，需精打細算。`;
                      comparisonVerdict = `【目標指引】爽過建議：當地開銷高昂，若要在${targetName}無憂無慮爽過，目標時薪建議拉升至 $${targetComfortableRate.toLocaleString('zh-TW')} NTD/hr (約當前的 ${(1 / mult).toFixed(1)} 倍)！`;
                    }

                    return (
                      <div className="pt-3 border-t border-border-glass/50 space-y-3">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <label htmlFor={exploreCountryId} className="text-xs font-bold text-text-main flex items-center gap-1.5 shrink-0">
                            <svg className={`w-4 h-4 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            <span>探索全球 152 國時薪購買力與體感：</span>
                          </label>
                          <select
                            id={exploreCountryId}
                            value={exploreTarget.country}
                            onChange={(e) => setSelectedExploreCountry(e.target.value)}
                            className="w-full sm:w-auto max-w-full bg-select-bg border border-border-glass rounded-lg px-3 py-1.5 text-xs font-semibold text-text-main outline-none focus:border-[var(--theme-color)] transition-colors cursor-pointer truncate"
                          >
                            {numbeoInsights.evaluated
                              .slice()
                              .sort((a, b) => a.name_zh.localeCompare(b.name_zh, 'zh-TW'))
                              .map((c) => (
                                <option key={c.country} value={c.country}>
                                  {c.flag} {c.name_zh} ({c.country}) - 購買力 {c.multiplierStr}x
                                </option>
                              ))}
                          </select>
                        </div>

                        {/* 探索目標國家詳細卡片 */}
                        <div className="p-4 rounded-xl bg-surface-glass-btn border border-border-glass space-y-3">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border-glass/40 pb-3">
                            <div className="flex items-center gap-3">
                              <span className="text-3xl">{exploreTarget.flag}</span>
                              <div>
                                <div className="flex flex-wrap items-center gap-2">
                                  <span className="text-base font-bold text-text-main">{exploreTarget.name_zh}</span>
                                  <span className="text-xs text-text-sub font-mono">({exploreTarget.country})</span>
                                  <span className={`text-xs font-extrabold px-2.5 py-0.5 rounded-full border ${statusBadgeStyle}`}>
                                    {statusBadge}
                                  </span>
                                </div>
                                <div className="text-xs text-text-sub font-mono mt-1">
                                  對應適配圈：<span className="font-bold text-text-main">{exploreTarget.suitabilityName}</span> 【{exploreTarget.suitabilityTag}】
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 text-xs font-mono shrink-0 max-sm:w-full max-sm:pt-2">
                              <span className="px-2.5 py-1 rounded-lg bg-surface-glass border border-border-glass text-text-main">
                                折算當地購買力：${exploreTarget.localEffectiveRate.toLocaleString('zh-TW')} NTD/hr
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-surface-glass border border-border-glass text-text-main">
                                外食：{exploreTarget.restSavings > 0 ? `省 ${exploreTarget.restSavings}%` : exploreTarget.restSavings < 0 ? `高 ${Math.abs(exploreTarget.restSavings)}%` : '與台灣相近'}
                              </span>
                              <span className="px-2.5 py-1 rounded-lg bg-surface-glass border border-border-glass text-text-main">
                                租金：{exploreTarget.rentSavings > 0 ? `省 ${exploreTarget.rentSavings}%` : exploreTarget.rentSavings < 0 ? `高 ${Math.abs(exploreTarget.rentSavings)}%` : '與台灣相近'}
                              </span>
                            </div>
                          </div>

                          <div className="p-3.5 rounded-lg bg-surface-glass border border-border-glass/50 text-xs text-text-sub space-y-2">
                            <div className="font-bold text-text-main text-sm flex items-center gap-1.5">
                              <svg className={`w-4 h-4 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>以你目前時薪 ${displayHourlyRate}/hr 在{targetName}的生活體感評估：</span>
                            </div>
                            <p className="text-text-main font-medium leading-relaxed">
                              {feelComment}
                            </p>
                            <div className={`p-2.5 rounded-md border border-border-glass bg-surface-glass text-xs font-semibold ${styles.themeAccentText}`}>
                              {comparisonVerdict}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                </div>
              </div>

              {/* 陸、 遊戲化天梯升級攻略 (Next Rank Climbing Target) */}
              {nextMilestone && (
                <div>
                  <h3 className="text-xs font-bold text-text-sub mb-3 flex items-center gap-1.5 uppercase tracking-wider">
                    <svg className={`w-4 h-4 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    階級晉升天梯攻略 (Next Rank Target)
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
                  href={`/hourly-rate-calculator/?${getQueryParamsString()}`}
                  className={`${styles.actionBtn} text-sm flex items-center gap-2`}
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2h6v2H7V4zm6 4H7v2h6V8zm-6 4h6v2H7v-2z" clipRule="evenodd" />
                  </svg>
                  試算我的時薪與 PR ➔
                </Link>
                <button
                  type="button"
                  onClick={handleCopySocialText}
                  className={styles.shareBtn}
                >
                  <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  分享專屬卡片
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
                <svg className={`w-5 h-5 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                  <option value={2024}>2024 年 (最低時薪 $183)</option>
                  <option value={2023}>2023 年 (最低時薪 $176)</option>
                  <option value={2022}>2022 年 (最低時薪 $168)</option>
                  <option value={2021}>2021 年 (最低時薪 $160)</option>
                  <option value={2020}>2020 年 (最低時薪 $158)</option>
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
                  <svg className={`w-5 h-5 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                  薪資 Percentile 排行榜
                </h3>
              </div>

              {/* Taiwan PR Section */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                    <svg className="w-4 h-4" viewBox="0 0 48 48"><path fill="#f0f0f0" d="M44 36c0 4.418-3.582 8-8 8H12c-4.418 0-8-3.582-8-8V12c0-4.418 3.582-8 8-8h24c4.418 0 8 3.582 8 8v24z"/><path fill="#d52b1e" d="M4 12v24c0 4.418 3.582 8 8 8h24c4.418 0 8-3.582 8-8V12c0-4.418-3.582-8-8-8H12c-4.418 0-8 3.582-8 8z"/><path fill="#fff" d="M24 8l-4 8h8l-4 8 4 8h-8l4 8M12 4l12 12 12-12M12 44l12-12 12 12"/></svg>
                    全台打工人 PR
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
                  <span>PR 10 (36.5萬)</span>
                  <span>PR 50 中位數 (56.8萬)</span>
                  <span>PR 90 (129萬)</span>
                </div>
              </div>

              {/* Worldwide PR Section */}
              <div className="pt-3 border-t border-border-glass">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-text-main flex items-center gap-1.5">
                    <svg className="w-4 h-4 text-text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 012 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2v1.5a2.5 2.5 0 002.5 2.5h.5a2 2 0 012 2v.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    全世界人口 PR
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
                  <span>P50 中位數 ($3,430 USD)</span>
                  <span>P90 ($26,500 USD)</span>
                  <span>P99 Top 1% ($109,000 USD)</span>
                </div>
                <p className="text-xs text-text-sub mt-2 flex items-center gap-1">
                  <svg className={`w-3.5 h-3.5 ${styles.themeAccentText} flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                  您的收入擊敗了全球 <span className="font-bold text-text-main">{globalPR.toFixed(1)}%</span> 的人口！ (資料源：WID 全球所得分佈)
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
                        最適生活圈評估
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
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                      </svg>
                      專屬打工人評定解鎖
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
                      href={`/hourly-rate-calculator/rank/pr${matchedMilestone.pr < 10 ? '0' + matchedMilestone.pr : matchedMilestone.pr}/?${getQueryParamsString()}`}
                      className={styles.milestoneCardCTA}
                    >
                      <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                      查看你的專屬卡片 (PR{matchedMilestone.pr < 10 ? '0' + matchedMilestone.pr : matchedMilestone.pr}) ➔
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
                  分享專屬卡片
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
              <svg className={`w-5 h-5 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              權威資料來源與依據說明 (Reference Data Sources)
            </h3>
            <ul className="space-y-2 text-xs text-text-sub list-disc list-inside leading-relaxed">
              <li>
                <strong className="text-text-main inline-flex items-center gap-1">
                  <svg className={`w-4 h-4 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  台灣薪資與工時數據
                </strong>：
                <a
                  href="https://www.dgbas.gov.tw/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`underline ${styles.themeAccentText} transition-colors ml-1`}
                >
                  行政院主計總處
                </a>
                《受僱員工全年總薪資中位數及分位數統計表》與勞動部《法定最低工資發布公告》。
              </li>
              <li>
                <strong className="text-text-main inline-flex items-center gap-1">
                  <svg className="w-4 h-4 text-text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3.055 11H5a2 2 0 012 2v1a2 2 0 012 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2v1.5a2.5 2.5 0 002.5 2.5h.5a2 2 0 012 2v.5h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  全球人口所得數據
                </strong>：
                <a
                  href="https://wid.world/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`underline ${styles.themeAccentText} transition-colors ml-1`}
                >
                  World Inequality Database (WID 全球不平等資料庫)
                </a>
                與 World Bank (世界銀行全球個人所得分佈報告)。
              </li>
              <li>
                <strong className="text-text-main inline-flex items-center gap-1">
                  <svg className="w-4 h-4 text-text-sub" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m0 0l-3 9m3-9l3 2m0 0l-3 9m3-9l3 9m-6-9l6 2m0 0l-3 9m3-9l3 9" />
                  </svg>
                  全球生活圈購買力 (PPP) 物價指標
                </strong>：
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

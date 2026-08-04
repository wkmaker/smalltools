'use client';

import React, { useState, useMemo, useId } from 'react';
import Link from 'next/link';
import countrySuitabilityData from './config/country_suitability.json';
import numbeoCostOfLivingData from './config/global_cost_of_living.json';
import styles from './hourly-rate-calculator.module.css';
import {
  Milestone,
  PercentileAnchor,
  CountryMatch,
  getSalaryForPR,
  calculatePiecewisePR,
  formatPrCode,
} from './utils';

// ─── 型別 ─────────────────────────────────────────────────────────────────────

type NumbeoCountry = (typeof numbeoCostOfLivingData.countries)[number];

interface EvaluatedCountry extends NumbeoCountry {
  multiplier: number;
  multiplierStr: string;
  restSavings: number;
  rentSavings: number;
  costDiffPercent: number;
  costDiffText: string;
  localEffectiveRate: number;
  suitabilityTag: string;
  suitabilityName: string;
  suitabilityDesc: string;
  lifestylePerk: string;
}

interface NumbeoInsights {
  tierTitle: string;
  tierDesc: string;
  arbitrageTop3: EvaluatedCountry[];
  equivalentPicks: EvaluatedCountry[];
  evaluated: EvaluatedCountry[];
}

// ─── Module-Level Pure Function ───────────────────────────────────────────────
// 從 render scope 移出，防止每次 re-render 重新建立函式引用。
// 搭配 useMemo([displayHourlyRate]) 確保 152 國計算只在時薪變動時才重跑。

const HIGH_HAPPINESS_COUNTRIES = [
  'Japan', 'South Korea', 'Spain', 'Portugal',
  'Czech Republic', 'Croatia', 'Estonia', 'Italy', 'Greece',
];

function getNumbeoInsights(rate: number, countryMatches: CountryMatch[]): NumbeoInsights {
  const twBase = numbeoCostOfLivingData.base_indexes;
  const twCostPlusRent = twBase.cost_of_living_plus_rent_index;
  const twRest = twBase.restaurant_price_index;
  const twRent = twBase.rent_index;

  const evaluated: EvaluatedCountry[] = numbeoCostOfLivingData.countries.map((c) => {
    const multiplier = twCostPlusRent / c.cost_of_living_plus_rent_index;
    const restSavings = Math.round((1 - c.restaurant_price_index / twRest) * 100);
    const rentSavings = Math.round((1 - c.rent_index / twRent) * 100);
    const costDiffPercent = Math.round(
      (1 - c.cost_of_living_plus_rent_index / twCostPlusRent) * 100
    );
    const costDiffText =
      costDiffPercent > 0
        ? `開銷比台灣便宜 ${costDiffPercent}%`
        : costDiffPercent < 0
          ? `開銷比台灣高 ${Math.abs(costDiffPercent)}%`
          : '開銷與台灣相當';
    const localEffectiveRate = Math.round(rate * multiplier);

    const matchedSuitability =
      countryMatches.find((cm) =>
        cm.countries.some((name) => name.includes(c.name_zh) || name.includes(c.country))
      ) ||
      countryMatches.find(
        (cm) => localEffectiveRate >= cm.min_hourly_twd && localEffectiveRate < cm.max_hourly_twd
      ) ||
      countryMatches[0];

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

  const currentTier =
    countryMatches.find((cm) => rate >= cm.min_hourly_twd && rate < cm.max_hourly_twd) ||
    countryMatches[0];

  const tierTitle = `【${currentTier.tag}】適合時薪 $${rate}/hr 的${currentTier.name}`;
  const tierDesc = currentTier.description;

  let candidateList = evaluated.filter((c) =>
    currentTier.countries.some((name) => name.includes(c.name_zh) || name.includes(c.country))
  );

  if (candidateList.length < 3) {
    const extraCandidates = evaluated
      .filter(
        (c) => c.country !== 'Taiwan' && !candidateList.some((item) => item.country === c.country)
      )
      .sort((a, b) => b.multiplier - a.multiplier);
    candidateList = [...candidateList, ...extraCandidates];
  }

  const arbitrageTop3 = candidateList
    .sort((a, b) => b.multiplier - a.multiplier)
    .slice(0, 3);

  const equivalentPicks = evaluated
    .filter(
      (c) =>
        HIGH_HAPPINESS_COUNTRIES.includes(c.country) &&
        !arbitrageTop3.some((a) => a.country === c.country)
    )
    .sort((a, b) => Math.abs(a.multiplier - 1.0) - Math.abs(b.multiplier - 1.0))
    .slice(0, 4);

  return { tierTitle, tierDesc, arbitrageTop3, equivalentPicks, evaluated };
}

// ─── Props ────────────────────────────────────────────────────────────────────

export interface RankHeroBannerProps {
  heroMilestone: Milestone;
  mounted: boolean;
  taiwanAnchors: PercentileAnchor[];
  globalAnchors: PercentileAnchor[];
  realHourlyRate: number;
  annualIncome: number;
  taiwanPR: number;
  globalPR: number;
  hoursPerYear: number;
  milestones: Milestone[];
  minHourlyWage: number;
  queryParamsString: string;
  handleShare: (overrideText?: string) => Promise<void>;
  hasCustomParams?: boolean;
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function RankHeroBanner({
  heroMilestone,
  mounted,
  taiwanAnchors,
  globalAnchors,
  realHourlyRate,
  annualIncome,
  taiwanPR,
  globalPR,
  hoursPerYear,
  milestones,
  minHourlyWage,
  queryParamsString,
  handleShare,
  hasCustomParams = false,
}: RankHeroBannerProps) {
  // selectedExploreCountry 從 parent 移入此元件，避免 parent 因探索互動而整頁 re-render
  const [selectedExploreCountry, setSelectedExploreCountry] = useState<string>('Japan');
  const exploreCountryId = useId();

  // ─── 預設顯示值（基於里程碑 PR）────────────────────────────────────────
  const defaultAnnualIncome = getSalaryForPR(heroMilestone.pr, taiwanAnchors);
  const defaultMonthlyIncome = Math.round(defaultAnnualIncome / 12);
  const defaultHourlyRate = Math.max(1, Math.round(defaultMonthlyIncome / 176));

  const isCustomMode = Boolean(hasCustomParams && realHourlyRate > 0);

  const displayPR = isCustomMode ? Number(taiwanPR.toFixed(1)) : heroMilestone.pr;
  const displayHourlyRate = isCustomMode ? Math.round(realHourlyRate) : defaultHourlyRate;
  const displayAnnualIncome = isCustomMode ? Math.round(annualIncome) : defaultAnnualIncome;
  const displayMonthlyIncome = Math.round(displayAnnualIncome / 12);
  const displayMinuteValue = (displayHourlyRate / 60).toFixed(2);
  const displayWageMultiplier = (displayHourlyRate / minHourlyWage).toFixed(2);

  // ─── 全球 PR 顯示值 ───────────────────────────────────────────────────────
  const defaultGlobalPR = Math.min(
    Math.max(calculatePiecewisePR(defaultAnnualIncome, globalAnchors, true), 1.0),
    99.9
  ).toFixed(1);
  const displayGlobalPR = isCustomMode ? globalPR.toFixed(1) : defaultGlobalPR;
  const displayGlobalBeatenPeople = ((Number(displayGlobalPR) / 100) * 80).toFixed(1);
  const displayTaiwanRank = Math.round((1 - displayPR / 100) * 8_400_000).toLocaleString('zh-TW');


  // ─── 星等評級 ─────────────────────────────────────────────────────────────
  const starCount =
    displayPR < 20 ? 1 : displayPR < 40 ? 2 : displayPR < 65 ? 3 : displayPR < 85 ? 4 : 5;
  const stars = '★'.repeat(starCount); // 用於分享文字

  // ─── 購買力指標 ───────────────────────────────────────────────────────────
  const bobaCount = (displayHourlyRate / 65).toFixed(1);
  const bentoCount = (displayHourlyRate / 100).toFixed(1);
  const latteCount = (displayHourlyRate / 150).toFixed(1);
  const movieHours = (330 / displayHourlyRate).toFixed(1);
  const iphoneHours = Math.round(46900 / displayHourlyRate);

  // ─── 下一個里程碑 ─────────────────────────────────────────────────────────
  const nextMilestone = milestones.find((m) => m.pr > displayPR) || null;
  const nextSalary = nextMilestone
    ? getSalaryForPR(nextMilestone.pr, taiwanAnchors)
    : displayAnnualIncome;
  const nextMonthlyIncome = Math.round(nextSalary / 12);
  const monthlyGap = Math.max(0, nextMonthlyIncome - displayMonthlyIncome);
  const rawHourlyGap = monthlyGap / 176;
  const hourlyGapDisplay =
    rawHourlyGap <= 0
      ? '0'
      : rawHourlyGap < 1
        ? rawHourlyGap.toFixed(2).replace(/\.?0+$/, '')
        : Math.round(rawHourlyGap).toString();

  // ─── 國家適配 ─────────────────────────────────────────────────────────────
  const heroCountry =
    countrySuitabilityData.find(
      (c) => displayHourlyRate >= c.min_hourly_twd && displayHourlyRate < c.max_hourly_twd
    ) || countrySuitabilityData[countrySuitabilityData.length - 1];

  // ─── Numbeo 洞察（memoized：只在 displayHourlyRate 變動時重算 152 國）────
  // countrySuitabilityData 為 module-level import，引用穩定，無需加入 deps
  const numbeoInsights = useMemo(
    () => getNumbeoInsights(displayHourlyRate, countrySuitabilityData),
    [displayHourlyRate]
  );

  // ─── 探索選單衍生值（原 inner IIFE，移至 component body）───────────────
  const exploreTarget =
    numbeoInsights.evaluated.find(
      (c) => c.country === selectedExploreCountry || c.name_zh === selectedExploreCountry
    ) ||
    numbeoInsights.evaluated.find((c) => c.country === 'Japan') ||
    numbeoInsights.evaluated[0];

  const mult = exploreTarget.multiplier;
  const costDiff = exploreTarget.costDiffPercent;
  const targetName = exploreTarget.name_zh;
  const localRate = exploreTarget.localEffectiveRate;

  let statusBadge: string;
  let statusBadgeStyle: string;
  let feelComment: string;
  let comparisonVerdict: string;

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

  // ─── 分享處理器 ───────────────────────────────────────────────────────────
  const handleCopySocialText = async () => {
    const prCode = formatPrCode(heroMilestone.pr);
    const shareUrl = `${window.location.origin}/hourly-rate-calculator/rank/${prCode}/?${queryParamsString}`;
    const text = `\u3010\u5168\u53f0\u6253\u5de5\u4eba PR \u8a55\u5b9a\u5361\u7247 \ud83d\udcb3\u3011\n\u8a55\u5b9a\u7b49\u7d1a\uff1aPR ${displayPR}\u3010${heroMilestone.label}\u3011 ${stars}\n\ud83d\udcac \u7279\u8cea\u8a9e\u9304\uff1a\u300c${heroMilestone.desc}\u300d\n\u26a1 \u5be6\u8cea\u751f\u547d\u6642\u85aa\uff1a$${displayHourlyRate}/hr (\u6bcf\u5206\u9418\u50f9\u503c $${displayMinuteValue} \u5143)\n\ud83e\udd64 \u73cd\u5976\u81ea\u7531\u5ea6\uff1a\u5de5\u4f5c 1 \u5c0f\u6642\u53ef\u63db ${bobaCount} \u676f\u73cd\u5976\n\ud83c\udfc6 \u5168\u53f0\u540d\u6b21\uff1a840 \u842c\u6253\u5de5\u4eba\u4e2d\u7d04\u7b2c ${displayTaiwanRank} \u540d\uff01\n\ud83c\udf0d \u6700\u9069\u79fb\u5c45\u751f\u6d3b\u5708\uff1a${heroCountry.flag} ${heroCountry.name}\n\n\u6e2c\u6e2c\u4f60\u662f\u5728\u8cfa\u85aa\u6c34\uff0c\u9084\u662f\u5728\u5e6b\u8001\u95c6\u4ed8\u6cd5\u62c9\u5229\u8eca\u8cb8 \u2794 ${shareUrl}`;
    await handleShare(text);

  };

  // ─── JSX ──────────────────────────────────────────────────────────────────
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
          核心財務與生命時間價值 (Financial &amp; Minute Value)
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
          全台 840 萬打工人與全球人口落點 (Ranking &amp; Population)
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
          {numbeoInsights.arbitrageTop3.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-glass/40 pb-2">
                <div>
                  <div className="text-xs font-bold text-text-main flex items-center gap-1.5">
                    <svg className={`w-4 h-4 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span>{numbeoInsights.tierTitle}</span>
                  </div>
                  <p className="text-xs text-text-sub mt-0.5">{numbeoInsights.tierDesc}</p>
                </div>
                <span className="text-xs font-medium text-text-sub border border-border-glass bg-surface-glass px-2.5 py-0.5 rounded-full shrink-0">
                  時薪階層動態精算
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {numbeoInsights.arbitrageTop3.map((item) => (
                  <div key={item.country} className="p-3.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-text-main">{item.flag} {item.name_zh}</span>
                      <span className={`text-sm font-black font-mono ${styles.themeAccentText} flex items-center gap-0.5`}>
                        {item.multiplierStr}x
                        <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.57l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.57l7-10a1 1 0 011.12-.384z" clipRule="evenodd" />
                        </svg>
                      </span>
                    </div>
                    <div className={`text-xs font-bold ${styles.themeAccentText}`}>【{item.suitabilityTag}】</div>
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
          {numbeoInsights.equivalentPicks.length > 0 && (
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
          {numbeoInsights.evaluated.length > 0 && (
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
                  <p className="text-text-main font-medium leading-relaxed">{feelComment}</p>
                  <div className={`p-2.5 rounded-md border border-border-glass bg-surface-glass text-xs font-semibold ${styles.themeAccentText}`}>
                    {comparisonVerdict}
                  </div>
                </div>
              </div>
            </div>
          )}
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
          href={`/hourly-rate-calculator/?${queryParamsString}`}
          className={`${styles.actionBtn} text-sm flex items-center gap-2`}
        >
          <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V4a2 2 0 00-2-2H6zm1 2h6v2H7V4zm6 4H7v2h6V8zm-6 4h6v2H7v-2z" clipRule="evenodd" />
          </svg>
          試算我的時薪與 PR ➔
        </Link>
        <button type="button" onClick={handleCopySocialText} className={styles.shareBtn}>
          <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          分享專屬卡片
        </button>
      </div>
    </div>
  );
}

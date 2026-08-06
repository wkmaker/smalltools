// app/hourly-rate-calculator/utils.ts
// 共用型別定義、純函式與常數 — 供 HourlyRateCalculatorClient 與 RankHeroBanner 共同引用

/** 全台/全球 PR 排行的分位點錨定資料結構 */
export interface PercentileAnchor {
  pr: number;
  annual_salary?: number;
  annual_salary_twd?: number;
  label?: string;
}

/** 打工人 PR 里程碑資料結構 */
export interface Milestone {
  pr: number;
  id: string;
  slug: string;
  label: string;
  desc: string;
}

/** 國家生活圈適配資料結構 */
export interface CountryMatch {
  id: string;
  name: string;
  flag: string;
  countries: string[];
  min_hourly_twd: number;
  max_hourly_twd: number;
  tag: string;
  description: string;
  travel_difficulty?: string;
  local_avg_hourly_twd?: number;
  travel_badge?: string;
}

/**
 * 支援的統計年份清單（降冪排列，與 taiwan_statistics.json 鍵值對應）
 * 年份驗證與 <select> 選單共用此單一資料源，防止兩處各自 hardcoded 導致不同步。
 */
export const SUPPORTED_YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020] as const;
export type SupportedYear = (typeof SUPPORTED_YEARS)[number];

/**
 * 格式化 PR 值為 URL 安全的路徑代碼
 * @example formatPrCode(5)  → 'pr05'
 * @example formatPrCode(50) → 'pr50'
 */
export function formatPrCode(pr: number): string {
  return `pr${String(pr).padStart(2, '0')}`;
}

/**
 * 分段線性插值 — 計算年薪對應的百分位 PR 值
 * @param annualSalary 年薪（台幣或 USD）
 * @param anchors      分位點錨定陣列
 * @param isGlobal     若為全球模式，使用 annual_salary_twd 欄位
 */
export function calculatePiecewisePR(
  annualSalary: number,
  anchors: PercentileAnchor[],
  isGlobal = false
): number {
  if (!anchors || anchors.length === 0) return 1.0;

  const sorted = [...anchors].sort((a, b) => {
    const valA = isGlobal ? (a.annual_salary_twd || 0) : (a.annual_salary || 0);
    const valB = isGlobal ? (b.annual_salary_twd || 0) : (b.annual_salary || 0);
    return valA - valB;
  });

  const getSalary = (item: PercentileAnchor) =>
    isGlobal ? item.annual_salary_twd || 0 : item.annual_salary || 0;

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
    const extraPR = Math.min(0.9, (excess / 1_000_000) * 0.3);
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

/**
 * 根據目標 PR 反推估算年薪（台灣分位點錨定）
 * @param targetPR 目標百分位
 * @param anchors  分位點錨定陣列（台灣）
 */
export function getSalaryForPR(targetPR: number, anchors: PercentileAnchor[]): number {
  if (!anchors || anchors.length === 0) return 568_000;

  const sorted = [...anchors].sort((a, b) => (a.annual_salary || 0) - (b.annual_salary || 0));

  if (targetPR <= sorted[0].pr) return sorted[0].annual_salary || 320_000;
  if (targetPR >= sorted[sorted.length - 1].pr) {
    return sorted[sorted.length - 1].annual_salary || 2_850_000;
  }

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

  return 568_000;
}

/**
 * 根據使用者輸入的時薪與國家適配資料，計算旅遊難易度與當地薪資位階洞察
 */
export function getTravelAndLocalRankInsights(
  displayHourlyRate: number,
  match: CountryMatch
) {
  const travelDifficulty = match.travel_difficulty || '一般';
  const localAvgHourly = match.local_avg_hourly_twd || 100;

  // 計算使用者時薪相當於該區域/國家平均薪資的倍數
  const wageRatio = Number((displayHourlyRate / localAvgHourly).toFixed(1));

  // 估算當地位階 (Estimated Local Percentile / PR)
  let estimatedLocalPR: number;
  if (wageRatio <= 0.5) {
    estimatedLocalPR = Math.max(5, Math.round(wageRatio * 40));
  } else if (wageRatio <= 1.0) {
    estimatedLocalPR = Math.round(20 + (wageRatio - 0.5) * 60);
  } else if (wageRatio <= 2.0) {
    estimatedLocalPR = Math.min(92, Math.round(50 + (wageRatio - 1.0) * 35));
  } else if (wageRatio <= 4.0) {
    estimatedLocalPR = Math.min(98, Math.round(85 + (wageRatio - 2.0) * 6.5));
  } else {
    estimatedLocalPR = 99;
  }

  return {
    travelDifficulty,
    localAvgHourly,
    wageRatio,
    estimatedLocalPR,
  };
}

export interface TravelTier {
  difficulty: '簡單' | '一般' | '困難';
  title: string;
  badgeStyle: string;
  destinations: string[];
  description: string;
}

import countrySuitabilityData from './config/country_suitability.json';

/**
 * 根據使用者時薪，動態劃分旅遊「簡單」、「一般」、「困難」三個地點與體驗說明
 * 數據直接讀取自 config/country_suitability.json 中的 travel_tier_rules 欄位
 */
export function getTravelTiers(displayHourlyRate: number): {
  easy: TravelTier;
  medium: TravelTier;
  hard: TravelTier;
} {
  const rules = countrySuitabilityData.travel_tier_rules;
  let selectedRule = rules.standard;

  if (displayHourlyRate <= 0) {
    selectedRule = rules.zero_rate;
  } else if (displayHourlyRate >= 1000) {
    selectedRule = rules.top_tier;
  } else if (displayHourlyRate >= 450) {
    selectedRule = rules.mid_tier;
  }

  return {
    easy: {
      difficulty: '簡單',
      title: '簡單 (輕鬆無壓力)',
      badgeStyle: 'text-text-main bg-surface-glass border border-border-glass font-bold',
      destinations: selectedRule.easy.destinations,
      description: selectedRule.easy.description,
    },
    medium: {
      difficulty: '一般',
      title: '一般 (小資愜意行)',
      badgeStyle: 'text-text-main bg-surface-glass border border-border-glass font-bold',
      destinations: selectedRule.medium.destinations,
      description: selectedRule.medium.description,
    },
    hard: {
      difficulty: '困難',
      title: '困難 (預算精算行)',
      badgeStyle: 'text-text-main bg-surface-glass border border-border-glass font-bold',
      destinations: selectedRule.hard.destinations,
      description: selectedRule.hard.description,
    },
  };
}



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

// app/my-salary-calculator/salaryConfig.ts
// 直接載入 2024, 2025, 2026 官方原始 JSON 設定檔 (包含完整投保級距表與扣繳稅額表)

import raw2026 from './config/2026.json';
import raw2025 from './config/2025.json';
import raw2024 from './config/2024.json';

export interface Bracket {
  min: number;
  max: number;
  insured: number;
}

export interface InsuranceConfig {
  rate: number;
  employee_ratio: number;
  employer_ratio: number;
  employer_average_dependents?: number;
  brackets: Bracket[];
}

export interface PensionConfig {
  employer_rate: number;
  brackets: Bracket[];
}

export interface YearConfigJSON {
  year: number;
  labor_insurance: InsuranceConfig;
  health_insurance: InsuranceConfig;
  labor_pension: PensionConfig;
  withholding_tax_table?: Array<number[]>;
}

export const YEAR_CONFIGS_JSON: Record<number, YearConfigJSON> = {
  2026: raw2026 as YearConfigJSON,
  2025: raw2025 as YearConfigJSON,
  2024: raw2024 as YearConfigJSON,
};

export const SUPPORTED_YEARS: number[] = Object.keys(YEAR_CONFIGS_JSON)
  .map(Number)
  .sort((a, b) => b - a);

// 查投保級距金額 (完全依照舊版 script.js 邏輯)
export function findInsuredAmount(salary: number, brackets: Bracket[]): number {
  if (!brackets || brackets.length === 0) return 0;
  const val = Math.max(0, salary || 0);
  const match = brackets.find(b => val >= b.min && val <= b.max);
  if (match) return match.insured;
  return brackets[brackets.length - 1].insured;
}

// 薪資所得稅矩陣查表估算函數 (對照財政部薪資所得扣繳稅額表)
export function lookupMatrixTax(salary: number, dependents: number, year: number): number {
  let base = 90501;
  if (year === 2024) base = 86001;
  else if (year === 2025) base = 88501;

  // 扣除扶養親屬免稅額，每人每月約 8,400 元
  const shift = dependents * 8400;
  const S = salary - shift;

  if (S < base) return 0;

  const diff = S - base;

  if (diff <= 10500) {
    const k = Math.floor(diff / 500);
    return 2020 + Math.floor(k / 2) * 50 + (k % 2 === 1 ? 30 : 0);
  } else if (diff <= 75000) {
    const k = Math.floor((diff - 10500) / 500);
    let startTax = 2560;
    if (year === 2024) startTax = 2460;
    else if (year === 2025) startTax = 2510;
    return startTax + k * 60;
  } else if (diff <= 190000) {
    const k = Math.floor((diff - 75000) / 500);
    let startTax = 10340;
    if (year === 2024) startTax = 10140;
    else if (year === 2025) startTax = 10240;
    return startTax + k * 100;
  } else {
    const k = Math.floor((diff - 190000) / 500);
    let startTax = 33340;
    if (year === 2024) startTax = 32840;
    else if (year === 2025) startTax = 33090;
    return startTax + k * 150;
  }
}

// 根據 JSON 設定檔計算所得稅
export function calculateTaxFromConfig(
  taxSalary: number,
  taxDependents: number,
  config: YearConfigJSON,
  year: number
): number {
  if (config.withholding_tax_table) {
    const match = config.withholding_tax_table.find(row => taxSalary >= row[0] && taxSalary <= row[1]);
    if (match) {
      const depIndex = Math.min(11, taxDependents);
      return match[2 + depIndex];
    } else if (taxSalary < 80001) {
      return 0;
    } else {
      return lookupMatrixTax(taxSalary, taxDependents, year);
    }
  }
  return lookupMatrixTax(taxSalary, taxDependents, year);
}

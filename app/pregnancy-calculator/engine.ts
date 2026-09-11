/**
 * 孕期試算純函數引擎（無副作用、可毫秒級單元測試）。
 *
 * 從 `PregnancyCalculatorClient.tsx` 抽離：4 種推算模式的預產期 (EDD) 與受孕日、
 * 當前懷孕週數與進度、CRL（頭臀長）換算週數，以及台灣法定產假區間與
 * 勞保生育給付 / 育嬰留停津貼試算。
 *
 * 純日期字串（YYYY-MM-DD）一律以「本地零時」建構，不做時區轉換（鐵則 7、8）。
 * 津貼金額計算走 BigNumber.js 定點數（鐵則 5、6）。
 */

import { D, toMoney } from '../utils/decimal.ts';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** 將 YYYY-MM-DD 以本地零時建構 Date；無效輸入回傳 null */
export function parseYmd(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

export type CalcMode = 'lmp' | 'edd' | 'ultrasound' | 'ivf';
export type ScanInputType = 'weeks' | 'crl';
export type IvfType = 'd5' | 'd3' | 'egg';

export interface CrlAge {
  totalDays: number;
  weeks: number;
  days: number;
}

/**
 * 依 CRL (mm) 以 Hadlock 公式換算胎兒日齡：
 * Days = 52.37 + 1.315·CRL − 0.0022·CRL²，夾在 35 ~ 110 天（約 5 ~ 15 週）。
 */
export function crlToGestationalAge(crl: number | ''): CrlAge {
  if (typeof crl !== 'number' || crl <= 0) return { totalDays: 84, weeks: 12, days: 0 };
  const raw = Math.round(52.37 + 1.315 * crl - 0.0022 * crl * crl);
  const totalDays = Math.max(35, Math.min(110, raw));
  return { totalDays, weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}

export interface DueDateInput {
  calcMode: CalcMode;
  lmpDate: string;
  cycleDays: number;
  eddDateInput: string;
  /** eddDateInput 為空時的回退日期字串 */
  fallbackDate: string;
  scanDate: string;
  scanInputType: ScanInputType;
  scanWeeks: number;
  scanDays: number;
  crlValue: number | '';
  ivfDate: string;
  ivfType: IvfType;
}

export interface DueDateResult {
  estimatedDueDate: Date;
  conceptionDate: Date;
}

/** 依所選模式推算預產期 (EDD) 與受孕日 */
export function calculateDueDate(input: DueDateInput): DueDateResult {
  let edd = new Date();
  let conception = new Date();

  if (input.calcMode === 'lmp') {
    const lmp = parseYmd(input.lmpDate);
    if (lmp) {
      // 奈格爾法則：280 天 + (週期天數 − 28)
      const cycleAdjustment = (input.cycleDays || 28) - 28;
      edd = addDays(lmp, 280 + cycleAdjustment);
      conception = addDays(lmp, 14 + cycleAdjustment);
    }
  } else if (input.calcMode === 'edd') {
    const parsedEdd = parseYmd(input.eddDateInput) ?? parseYmd(input.fallbackDate);
    if (parsedEdd) {
      edd = parsedEdd;
      conception = addDays(parsedEdd, -266);
    }
  } else if (input.calcMode === 'ultrasound') {
    const scanD = parseYmd(input.scanDate);
    if (scanD) {
      const totalScanDays =
        input.scanInputType === 'crl'
          ? crlToGestationalAge(input.crlValue).totalDays
          : (input.scanWeeks || 0) * 7 + (input.scanDays || 0);
      edd = addDays(scanD, 280 - totalScanDays);
      conception = addDays(edd, -266);
    }
  } else if (input.calcMode === 'ivf') {
    const ivfD = parseYmd(input.ivfDate);
    if (ivfD) {
      if (input.ivfType === 'd5') {
        edd = addDays(ivfD, 280 - 19); // 261 天
        conception = addDays(ivfD, -5);
      } else if (input.ivfType === 'd3') {
        edd = addDays(ivfD, 280 - 17); // 263 天
        conception = addDays(ivfD, -3);
      } else {
        edd = addDays(ivfD, 280 - 14); // 266 天（取卵 / IUI）
        conception = ivfD;
      }
    }
  }

  return { estimatedDueDate: edd, conceptionDate: conception };
}

export interface GestationalAge {
  currentGestationalDays: number;
  currentWeeks: number;
  currentDays: number;
  daysRemaining: number;
  progressPercent: number;
  /** 1 / 2 / 3 孕期（由 UI 對應本地化字串） */
  trimesterIndex: 1 | 2 | 3;
}

/** 依 EDD 與「今天」計算當前懷孕週數、倒數與進度 */
export function calculateGestationalAge(estimatedDueDate: Date, today: Date = new Date()): GestationalAge {
  const daysLeft = Math.ceil((estimatedDueDate.getTime() - today.getTime()) / MS_PER_DAY);
  const totalDays = Math.max(0, Math.min(300, 280 - daysLeft));
  const weeks = Math.floor(totalDays / 7);
  const progress = Math.min(100, Math.max(0, Math.round((totalDays / 280) * 100)));

  const trimesterIndex: 1 | 2 | 3 = weeks >= 28 ? 3 : weeks >= 13 ? 2 : 1;

  return {
    currentGestationalDays: totalDays,
    currentWeeks: weeks,
    currentDays: totalDays % 7,
    daysRemaining: daysLeft,
    progressPercent: progress,
    trimesterIndex,
  };
}

export interface MaternityBenefits {
  leaveStart: Date;
  leaveEnd: Date;
  returnDate: Date;
  /** 勞保生育給付：2 個月平均月投保薪資 */
  laborBenefit: number;
  /** 育嬰留停津貼每月（8 成薪） */
  parentalAllowanceMonthly: number;
  /** 育嬰留停津貼 6 個月合計 */
  parentalAllowanceTotal: number;
}

/**
 * 台灣法定產假區間（8 週 = 56 天，含例假日）與津貼試算。
 * @param leaveStartWeeksOption 產前幾週開始請產假（0 = 預產期當日）
 */
export function calculateMaternityBenefits(
  estimatedDueDate: Date,
  leaveStartWeeksOption: number,
  monthlySalary: number | '',
): MaternityBenefits {
  const leaveStart = addDays(estimatedDueDate, -(leaveStartWeeksOption * 7));
  const leaveEnd = addDays(leaveStart, 55);
  const returnDate = addDays(leaveEnd, 1);

  const salary = typeof monthlySalary === 'number' && Number.isFinite(monthlySalary) ? monthlySalary : 0;
  const parentalMonthly = toMoney(D(salary).times('0.8'));

  return {
    leaveStart,
    leaveEnd,
    returnDate,
    laborBenefit: toMoney(D(salary).times(2)),
    parentalAllowanceMonthly: parentalMonthly,
    parentalAllowanceTotal: toMoney(D(parentalMonthly).times(6)),
  };
}

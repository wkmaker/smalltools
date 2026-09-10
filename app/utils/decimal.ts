import BigNumber from 'bignumber.js';

/**
 * 全站金融計算統一定點數入口。
 *
 * 依全域規範（鐵則 5、6）：金額的加減乘除一律走 BigNumber.js 鏈式運算，
 * 嚴禁對金額使用原生浮點運算子。UI 顯示前才透過 `toNumber` / `toMoney` 落地。
 *
 * BigNumber 全域組態：
 * - DECIMAL_PLACES 40：中間過程保留足夠精度（利率月化、APR 折現冪次）。
 * - ROUNDING_MODE ROUND_HALF_UP：與台灣金融慣例「四捨五入」一致，
 *   等同原本散落各處的 `Math.round`。
 */
BigNumber.config({
  DECIMAL_PLACES: 40,
  ROUNDING_MODE: BigNumber.ROUND_HALF_UP,
  EXPONENTIAL_AT: [-40, 40],
});

export type DecimalInput = BigNumber.Value;

/** 建立 BigNumber（統一入口，避免各檔各自 import） */
export function D(value: DecimalInput = 0): BigNumber {
  return new BigNumber(value);
}

export { BigNumber };

/** 四捨五入到整數元，回傳原生 number 供 UI 顯示 */
export function toMoney(value: DecimalInput): number {
  return D(value).integerValue(BigNumber.ROUND_HALF_UP).toNumber();
}

/** 四捨五入到指定小數位，回傳原生 number */
export function toRounded(value: DecimalInput, decimalPlaces: number): number {
  return D(value)
    .decimalPlaces(decimalPlaces, BigNumber.ROUND_HALF_UP)
    .toNumber();
}

/** 直接落地為原生 number（不額外進位，僅結束鏈式運算） */
export function toNumber(value: DecimalInput): number {
  return D(value).toNumber();
}

/**
 * 年利率（百分比）換算為每月利率（小數），全程定點數。
 * 例：3.25(%) → 0.0325 / 12
 */
export function monthlyRateFromAnnualPercent(annualPercent: DecimalInput): BigNumber {
  return D(annualPercent).div(100).div(12);
}

/** 期利率（百分比）換算為每期利率（小數）：percent / 100 */
export function rateFromPercent(percent: DecimalInput): BigNumber {
  return D(percent).div(100);
}

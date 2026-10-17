/**
 * 股票質押維持率試算純函數引擎（無副作用、可毫秒級單元測試）。
 *
 * 從 `PledgeCalculatorClient.tsx` 抽離：總市值、可貸額度、追繳 / 安全臨界股價與
 * 容許跌幅、壓力測試後市值、維持率、補繳（償還本金 / 補繳現金）金額。
 * 所有金額與比率計算一律走 BigNumber.js 定點數（鐵則 5、6）。
 */

import { D, BigNumber, toNumber } from '../utils/decimal.ts';

export interface PledgeInput {
  /** 個股單價（元） */
  stockPrice: number;
  /** 持股數量（依 qtyUnit 而定，張或股） */
  stockQty: number;
  /** 數量單位：1000 = 張，1 = 股 */
  qtyUnit: number;
  /** 質押借款金額（元） */
  loanAmount: number;
  /** 質押年利率（%），預設 2.5 */
  loanAnnualRate?: number;
  /** 追繳維持率門檻（%），預設 130 */
  thresholdWarnPercent: number;
  /** 目標安全維持率（%），預設 160 */
  thresholdSafePercent: number;
  /** 壓力測試下跌幅度（%） */
  stressDropPercent: number;
  /** 補救方案 C 擔保品現股單價（元，預設與 stockPrice 相同） */
  collateralPrice?: number;
}

export interface PledgeResult {
  totalShares: number;
  marketValue: number;
  maxLoan60: number;
  maxLoan50: number;
  /** 觸發追繳的臨界股價 */
  warnPrice: number;
  /** 到追繳臨界價的容許跌幅（%） */
  warnDrop: number;
  /** 追繳容許跌幅相當於幾根跌停板（以台股 10% 複利計算） */
  warnLimitDownDays: number;
  /** 回到安全維持率的臨界股價 */
  safePrice: number;
  safeDrop: number;
  /** 安全容許跌幅相當於幾根跌停板（以台股 10% 複利計算） */
  safeLimitDownDays: number;
  /** 壓力測試後股價 */
  simPrice: number;
  /** 壓力測試後總市值 */
  simMarketValue: number;
  /** 壓力測試後維持率（%） */
  ratio: number;
  /** 每月利息支出（元） */
  monthlyInterest: number;
  /** 半年利息支出（元） */
  semiAnnualInterest: number;
  /** 補救方案 A：需償還本金 */
  repayAmount: number;
  /** 補救方案 B：需補繳現金 */
  cashAmount: number;
  /** 補救方案 C：需追加現股股數（股） */
  addSharesRequired: number;
  /** 補救方案 C：需追加現股張數（張，無條件進位） */
  addLotsRequired: number;
  isBelowSafe: boolean;
}

/**
 * 以台股單日 10% 跌停板複利計算容許跌幅相當於幾根跌停。
 * 公式：(1 - 0.1)^n = 1 - drop / 100  =>  n = ln(1 - drop / 100) / ln(0.9)
 */
export function calculateLimitDownDays(dropPercent: number): number {
  if (dropPercent <= 0) return 0;
  if (dropPercent >= 99.9) return 99;
  const ratioLeft = 1 - dropPercent / 100;
  if (ratioLeft <= 0) return 99;
  const days = Math.log(ratioLeft) / Math.log(0.9);
  return Math.max(0, Number(days.toFixed(1)));
}

export function calculatePledge(input: PledgeInput): PledgeResult {
  const numPrice = D(Math.max(0, Number(input.stockPrice) || 0));
  const numQty = D(Math.max(0, Number(input.stockQty) || 0));
  const unit = D(Number(input.qtyUnit) || 0);
  const numLoan = D(Math.max(0, Number(input.loanAmount) || 0));
  const numAnnualRate = D(Math.max(0, Number(input.loanAnnualRate ?? 2.5) || 0));
  const numWarnRate = D(Number.isFinite(input.thresholdWarnPercent) ? input.thresholdWarnPercent : 130);
  const numSafeRate = D(Number.isFinite(input.thresholdSafePercent) ? input.thresholdSafePercent : 160);
  const drop = D(Number(input.stressDropPercent) || 0);

  const totalShares = numQty.times(unit);
  const marketValue = numPrice.times(totalShares);

  let warnPrice = D(0);
  let warnDrop = D(0);
  let safePrice = D(0);
  let safeDrop = D(0);

  if (numLoan.gt(0) && totalShares.gt(0) && numPrice.gt(0)) {
    warnPrice = numWarnRate.div(100).times(numLoan).div(totalShares);
    warnDrop = BigNumber.max(0, numPrice.minus(warnPrice).div(numPrice).times(100));
    safePrice = numSafeRate.div(100).times(numLoan).div(totalShares);
    safeDrop = BigNumber.max(0, numPrice.minus(safePrice).div(numPrice).times(100));
  }

  const dropFactor = D(1).minus(drop.div(100));
  const simPrice = numPrice.times(dropFactor);
  const simMarketValue = marketValue.times(dropFactor);

  const ratio = numLoan.gt(0) ? simMarketValue.div(numLoan).times(100) : D(0);

  // 利息試算（定點數）
  const annualInterest = numLoan.times(numAnnualRate).div(100);
  const monthlyInterest = annualInterest.div(12);
  const semiAnnualInterest = annualInterest.div(2);

  let repayAmount = D(0);
  let cashAmount = D(0);
  let addSharesRequired = D(0);
  let addLotsRequired = D(0);

  const isBelowSafe = numLoan.gt(0) && ratio.lt(numSafeRate);
  if (isBelowSafe) {
    const targetSec = numSafeRate.div(100);
    repayAmount = BigNumber.max(0, numLoan.minus(simMarketValue.div(targetSec)));
    cashAmount = BigNumber.max(0, numLoan.times(targetSec).minus(simMarketValue));

    // 方案 C：追加現股
    const cPrice = input.collateralPrice && input.collateralPrice > 0
      ? D(input.collateralPrice)
      : numPrice;
    if (cPrice.gt(0) && cashAmount.gt(0)) {
      addSharesRequired = cashAmount.div(cPrice).integerValue(BigNumber.ROUND_CEIL);
      addLotsRequired = cashAmount.div(cPrice.times(1000)).integerValue(BigNumber.ROUND_CEIL);
    }
  }

  const warnDropNum = toNumber(warnDrop);
  const safeDropNum = toNumber(safeDrop);

  return {
    totalShares: toNumber(totalShares),
    marketValue: toNumber(marketValue),
    maxLoan60: toNumber(marketValue.times('0.6')),
    maxLoan50: toNumber(marketValue.times('0.5')),
    warnPrice: toNumber(warnPrice),
    warnDrop: warnDropNum,
    warnLimitDownDays: calculateLimitDownDays(warnDropNum),
    safePrice: toNumber(safePrice),
    safeDrop: safeDropNum,
    safeLimitDownDays: calculateLimitDownDays(safeDropNum),
    simPrice: toNumber(simPrice),
    simMarketValue: toNumber(simMarketValue),
    ratio: toNumber(ratio),
    monthlyInterest: toNumber(monthlyInterest),
    semiAnnualInterest: toNumber(semiAnnualInterest),
    repayAmount: toNumber(repayAmount),
    cashAmount: toNumber(cashAmount),
    addSharesRequired: toNumber(addSharesRequired),
    addLotsRequired: toNumber(addLotsRequired),
    isBelowSafe,
  };
}

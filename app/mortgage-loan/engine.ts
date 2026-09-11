/**
 * 房屋貸款試算純函數引擎（無副作用、可毫秒級單元測試）。
 *
 * 從 `MortgageLoanClient.tsx` 抽離：單一 / 組合（雙筆）貸款、寬限期、
 * 多段式階梯利率、本息或本金平均攤還，逐期歷程、首期月付、總利息、
 * 總支出與 APR。所有金額計算一律走 BigNumber.js 定點數（鐵則 5、6）。
 */

import { D, BigNumber, toNumber, rateFromPercent } from '../utils/decimal.ts';
import { solveApr } from '../utils/finance.ts';

export interface Stage {
  durationValue: number | '' | null;
  durationUnit: 'year' | 'month' | null;
  rate: number | '';
}

export interface SingleLoanDetailRow {
  period: number;
  startBalance: number;
  principalPaid: number;
  interestPaid: number;
  totalPayment: number;
  endBalance: number;
}

export interface CombinedDetailRow extends SingleLoanDetailRow {
  detail1?: SingleLoanDetailRow;
  detail2?: SingleLoanDetailRow;
}

export type RepayType = 'equal-total' | 'equal-principal';
export type RateType = 'single' | 'multi';

export interface SingleLoanDetailResult {
  totalMonths: number;
  graceMonths: number;
  totalInterest: number;
  paymentArray: number[];
  resultData: SingleLoanDetailRow[];
}

function months(value: number, unit: 'year' | 'month' | null): number {
  return unit === 'year' ? Math.round(value * 12) : Math.round(value);
}

/** 依單一利率或多段階梯利率，展開每個月適用的年利率（%） */
function buildStageRates(
  totalMonths: number,
  rateType: RateType,
  singleRate: number,
  stageList: Stage[],
): number[] {
  const stageRates: number[] = [];
  if (rateType === 'single') {
    for (let k = 0; k < totalMonths; k++) stageRates.push(singleRate);
    return stageRates;
  }
  let consumed = 0;
  for (let si = 0; si < stageList.length - 1; si++) {
    const s = stageList[si];
    const durationVal = s.durationValue === '' || s.durationValue === null ? 0 : s.durationValue;
    const sMonths = months(durationVal, s.durationUnit);
    const sRate = s.rate === '' ? 0 : s.rate;
    for (let k = 0; k < sMonths; k++) stageRates.push(sRate);
    consumed += sMonths;
  }
  const lastStage = stageList[stageList.length - 1];
  const lastRate = lastStage && lastStage.rate !== '' ? lastStage.rate : 0;
  for (let k = consumed; k < totalMonths; k++) stageRates.push(lastRate);
  return stageRates;
}

export function calculateSingleLoanDetail(
  loanAmount: number,
  periodVal: number,
  periodUnit: 'year' | 'month',
  graceVal: number,
  graceUnit: 'year' | 'month',
  rateType: RateType,
  singleRate: number,
  stageList: Stage[],
  repayType: RepayType,
): SingleLoanDetailResult {
  const totalMonths = Math.max(0, months(periodVal, periodUnit));
  let graceMonths = Math.max(0, months(graceVal, graceUnit));
  if (graceMonths > totalMonths) graceMonths = totalMonths;

  const stageRates = buildStageRates(totalMonths, rateType, singleRate, stageList);

  const resultData: SingleLoanDetailRow[] = [
    { period: 0, startBalance: 0, principalPaid: 0, interestPaid: 0, totalPayment: 0, endBalance: loanAmount },
  ];
  const paymentArray: number[] = [];
  let totalInterest = D(0);

  if (totalMonths > 0 && loanAmount > 0) {
    let remainingBalance = D(loanAmount);
    const repayMonths = totalMonths - graceMonths;
    const principalPerMonth = repayMonths > 0 ? D(loanAmount).div(repayMonths) : D(0);

    // 本息平均攤還每期重算 (1 + r)^剩餘期數；剩餘期數每月遞減 1，利率不變時
    // 可用 pow / (1 + r) 遞推，僅在利率換段時重新以 .pow() 計算（大幅省時）。
    let prevRateKey: number | null = null;
    let powLeft = D(0);

    for (let m = 1; m <= totalMonths; m++) {
      const startBal = remainingBalance;
      const currentAnnualRate = stageRates[m - 1] !== undefined ? stageRates[m - 1] : 0;
      const r_m = rateFromPercent(currentAnnualRate).div(12);

      let principalPaid = D(0);
      let interestPaid = D(0);
      let totalPayment = D(0);

      if (m <= graceMonths) {
        interestPaid = startBal.times(r_m);
        principalPaid = D(0);
        totalPayment = interestPaid;
        remainingBalance = startBal;
      } else {
        const activeRepayMonthsLeft = totalMonths - m + 1;
        if (repayType === 'equal-total') {
          if (r_m.isZero()) {
            totalPayment = startBal.div(activeRepayMonthsLeft);
            prevRateKey = null;
          } else {
            const onePlusR = r_m.plus(1);
            if (currentAnnualRate === prevRateKey) {
              powLeft = powLeft.div(onePlusR);
            } else {
              powLeft = onePlusR.pow(activeRepayMonthsLeft);
              prevRateKey = currentAnnualRate;
            }
            totalPayment = startBal.times(r_m).times(powLeft).div(powLeft.minus(1));
          }
          interestPaid = startBal.times(r_m);
          principalPaid = totalPayment.minus(interestPaid);
          remainingBalance = startBal.minus(principalPaid);
        } else {
          principalPaid = principalPerMonth;
          interestPaid = startBal.times(r_m);
          totalPayment = principalPaid.plus(interestPaid);
          remainingBalance = startBal.minus(principalPaid);
        }
      }

      if (m === totalMonths) {
        remainingBalance = D(0);
        principalPaid = startBal;
        totalPayment = principalPaid.plus(interestPaid);
      }

      totalInterest = totalInterest.plus(interestPaid);
      paymentArray.push(totalPayment.toNumber());

      resultData.push({
        period: m,
        startBalance: toNumber(startBal),
        principalPaid: toNumber(principalPaid),
        interestPaid: toNumber(interestPaid),
        totalPayment: toNumber(totalPayment),
        endBalance: toNumber(BigNumber.max(0, remainingBalance)),
      });
    }
  }

  return { totalMonths, graceMonths, totalInterest: toNumber(totalInterest), paymentArray, resultData };
}

// ─── 上層編排：單一 / 組合貸款 ──────────────────────────────────────────

export interface MortgageSingleLoanConfig {
  periodVal: number;
  periodUnit: 'year' | 'month';
  graceVal: number;
  graceUnit: 'year' | 'month';
  rateType: RateType;
  singleRate: number;
  stages: Stage[];
  repayType: RepayType;
  fee: number;
}

export interface MortgageCombinedLoanConfig extends Omit<MortgageSingleLoanConfig, never> {
  /** 貸款金額（元） */
  loanAmount: number;
}

export interface MortgageInput {
  /** 房屋總價（萬元） */
  housePriceInTenThousands: number;
  /** 自備款（萬元） */
  downPaymentInTenThousands: number;
  loanMode: 'single' | 'combined';
  single: MortgageSingleLoanConfig;
  combinedA: MortgageCombinedLoanConfig;
  combinedB: MortgageCombinedLoanConfig;
}

export interface MortgageResult {
  schedule: (SingleLoanDetailRow | CombinedDetailRow)[];
  firstPayment: number;
  totalInterest: number;
  totalRepay: number;
  aprPercent: number;
}

const EMPTY_ROW = (m: number): SingleLoanDetailRow => ({
  period: m, startBalance: 0, principalPaid: 0, interestPaid: 0, totalPayment: 0, endBalance: 0,
});

export function calculateMortgage(input: MortgageInput): MortgageResult {
  const hp = Number(input.housePriceInTenThousands) || 0;
  const dpAmt = Number(input.downPaymentInTenThousands) || 0;
  const totalLoanAmt = BigNumber.max(0, D(hp).minus(dpAmt).times(10000));

  if (totalLoanAmt.lte(0)) {
    return { schedule: [], firstPayment: 0, totalInterest: 0, totalRepay: 0, aprPercent: 0 };
  }

  if (input.loanMode === 'single') {
    const s = input.single;
    const calc = calculateSingleLoanDetail(
      totalLoanAmt.toNumber(), s.periodVal, s.periodUnit, s.graceVal, s.graceUnit,
      s.rateType, s.singleRate, s.stages, s.repayType,
    );
    const fee = Number(s.fee) || 0;
    return {
      schedule: calc.resultData,
      firstPayment: calc.resultData[1]?.totalPayment ?? 0,
      totalInterest: calc.totalInterest,
      totalRepay: toNumber(totalLoanAmt.plus(calc.totalInterest).plus(fee)),
      aprPercent: solveApr(totalLoanAmt.minus(fee), calc.paymentArray, { decimalPlaces: 2 }),
    };
  }

  const a = input.combinedA;
  const b = input.combinedB;
  const calc1 = calculateSingleLoanDetail(
    (Number(a.loanAmount) || 0), a.periodVal, a.periodUnit, a.graceVal, a.graceUnit,
    a.rateType, a.singleRate, a.stages, a.repayType,
  );
  const calc2 = calculateSingleLoanDetail(
    (Number(b.loanAmount) || 0), b.periodVal, b.periodUnit, b.graceVal, b.graceUnit,
    b.rateType, b.singleRate, b.stages, b.repayType,
  );

  const maxMonths = Math.max(calc1.totalMonths, calc2.totalMonths);
  const combinedRows: CombinedDetailRow[] = [];
  const combinedPayments: number[] = [];

  for (let m = 0; m <= maxMonths; m++) {
    const d1 = calc1.resultData[m] || EMPTY_ROW(m);
    const d2 = calc2.resultData[m] || EMPTY_ROW(m);
    const totalPmt = D(d1.totalPayment).plus(d2.totalPayment);
    if (m > 0) combinedPayments.push(totalPmt.toNumber());

    combinedRows.push({
      period: m,
      startBalance: toNumber(D(d1.startBalance).plus(d2.startBalance)),
      principalPaid: toNumber(D(d1.principalPaid).plus(d2.principalPaid)),
      interestPaid: toNumber(D(d1.interestPaid).plus(d2.interestPaid)),
      totalPayment: toNumber(totalPmt),
      endBalance: toNumber(D(d1.endBalance).plus(d2.endBalance)),
      detail1: d1,
      detail2: d2,
    });
  }

  const combinedTotalInterest = D(calc1.totalInterest).plus(calc2.totalInterest);
  const combinedFee = D(Number(a.fee) || 0).plus(Number(b.fee) || 0);

  return {
    schedule: combinedRows,
    firstPayment: combinedRows[1]?.totalPayment ?? 0,
    totalInterest: toNumber(combinedTotalInterest),
    totalRepay: toNumber(totalLoanAmt.plus(combinedTotalInterest).plus(combinedFee)),
    aprPercent: solveApr(totalLoanAmt.minus(combinedFee), combinedPayments, { decimalPlaces: 2 }),
  };
}

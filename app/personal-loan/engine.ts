/**
 * 個人信貸試算純函數引擎（無副作用、可毫秒級單元測試）。
 *
 * 從 `PersonalLoanClient.tsx` 抽離的領域邏輯：本息/本金平均攤還歷期表、
 * 總利息、首期月付金，以及以二分搜尋法求解的 APR 實質總費用年率。
 *
 * 所有金額計算一律走 BigNumber.js 定點數（鐵則 5、6），不使用原生浮點運算子。
 */

import { D, BigNumber, toMoney, monthlyRateFromAnnualPercent } from '../utils/decimal.ts';
import { solveApr } from '../utils/finance.ts';

export type RepayMethod = 'equal-payment' | 'equal-principal';

export interface LoanScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remaining: number;
}

export interface PersonalLoanInput {
  /** 貸款金額（萬元） */
  amountInTenThousands: number;
  /** 貸款期限（年） */
  years: number;
  /** 年利率（%） */
  annualRatePercent: number;
  /** 開辦手續費（元） */
  fee: number;
  method: RepayMethod;
}

export interface PersonalLoanResult {
  schedule: LoanScheduleRow[];
  monthlyPayment: number;
  totalInterest: number;
  /** 實質年利率（%）；手續費 ≥ 貸款金額等無效輸入時為 `null`，見 `solveApr` */
  aprPercent: number | null;
}

export function calculatePersonalLoan(input: PersonalLoanInput): PersonalLoanResult {
  const numAmount = Number.isFinite(input.amountInTenThousands) ? input.amountInTenThousands : 0;
  const numYears = Number.isFinite(input.years) ? input.years : 0;
  const numRate = Number.isFinite(input.annualRatePercent) ? input.annualRatePercent : 0;
  const numFee = Number.isFinite(input.fee) ? input.fee : 0;

  const loanAmt = D(numAmount).times(10000);
  const totalMonths = numYears * 12;
  const monthlyRate = monthlyRateFromAnnualPercent(numRate);

  let remaining = loanAmt;
  let sumInterest = D(0);
  const rows: LoanScheduleRow[] = [];

  if (totalMonths > 0 && loanAmt.gt(0)) {
    // 本息平均攤還每期固定月付金：loanAmt * r * (1+r)^n / ((1+r)^n - 1)
    let equalPmt = D(0);
    if (monthlyRate.gt(0)) {
      const pow = monthlyRate.plus(1).pow(totalMonths);
      equalPmt = loanAmt.times(monthlyRate).times(pow).div(pow.minus(1));
    }
    const flatPrincipal = loanAmt.div(totalMonths);

    for (let m = 1; m <= totalMonths; m++) {
      const interestBn = remaining.times(monthlyRate).integerValue(BigNumber.ROUND_HALF_UP);
      let principalBn: BigNumber;

      if (input.method === 'equal-payment') {
        principalBn = monthlyRate.isZero()
          ? flatPrincipal.integerValue(BigNumber.ROUND_HALF_UP)
          : equalPmt.minus(interestBn).integerValue(BigNumber.ROUND_HALF_UP);
      } else {
        principalBn = flatPrincipal.integerValue(BigNumber.ROUND_HALF_UP);
      }

      // 最後一期清算剩餘本金
      if (m === totalMonths) {
        principalBn = remaining;
      }

      const paymentBn = principalBn.plus(interestBn);
      remaining = BigNumber.max(0, remaining.minus(principalBn));
      if (m === totalMonths) {
        remaining = D(0);
      }
      sumInterest = sumInterest.plus(interestBn);

      rows.push({
        month: m,
        payment: paymentBn.toNumber(),
        principal: principalBn.toNumber(),
        interest: interestBn.toNumber(),
        remaining: remaining.toNumber(),
      });
    }
  }

  const paymentsList = rows.map(r => r.payment);

  return {
    schedule: rows,
    monthlyPayment: rows[0]?.payment ?? 0,
    totalInterest: toMoney(sumInterest),
    aprPercent: solveApr(loanAmt.minus(numFee), paymentsList, { decimalPlaces: 2 }),
  };
}

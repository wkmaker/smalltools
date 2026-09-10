/**
 * 個人信貸試算純函數引擎（無副作用、可毫秒級單元測試）。
 *
 * 從 `PersonalLoanClient.tsx` 抽離的領域邏輯：本息/本金平均攤還歷期表、
 * 總利息、首期月付金，以及以二分搜尋法求解的 APR 實質總費用年率。
 *
 * 所有金額計算一律走 BigNumber.js 定點數（鐵則 5、6），不使用原生浮點運算子。
 */

import { D, BigNumber, toMoney, monthlyRateFromAnnualPercent } from '../utils/decimal.ts';

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
  aprPercent: number;
}

/**
 * 採用二分搜尋法 (Bisection Method) 求解折現淨現值 (NPV = 0) 之 APR 實質年利率。
 * 折現冪次 `(1 + r)^(t+1)` 的指數為整數，BigNumber `.pow` 可精確運算。
 * @returns 年化百分比，四捨五入至小數 2 位；無法求解時回傳 0
 */
export function calculateAPR(loanAmount: BigNumber.Value, fee: BigNumber.Value, payments: BigNumber.Value[]): number {
  const netAmount = D(loanAmount).minus(fee);
  if (netAmount.lte(0) || payments.length === 0) return 0;

  const pv = payments.map(p => D(p));
  let low = D(0);
  let high = D(2); // 月折現率上限 200%
  let mid = D(0);

  for (let iter = 0; iter < 80; iter++) {
    mid = low.plus(high).div(2);
    // 收斂到遠超過輸出解析度（2 位小數的年化 %）即可提前結束
    if (iter >= 40 && high.minus(low).lt('1e-12')) break;
    const onePlusMid = mid.plus(1);
    // 折現因子逐期遞乘（df_{t+1} = df_t * (1+mid)），避免每期重算 pow
    let df = onePlusMid;
    let npv = netAmount.negated();
    for (let t = 0; t < pv.length; t++) {
      npv = npv.plus(pv[t].div(df));
      df = df.times(onePlusMid);
    }
    if (npv.gt(0)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return mid.times(12).times(100).decimalPlaces(2, BigNumber.ROUND_HALF_UP).toNumber();
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
  const calculatedApr = calculateAPR(loanAmt, numFee, paymentsList);

  return {
    schedule: rows,
    monthlyPayment: rows[0]?.payment ?? 0,
    totalInterest: toMoney(sumInterest),
    aprPercent: calculatedApr > 0 ? calculatedApr : numRate,
  };
}

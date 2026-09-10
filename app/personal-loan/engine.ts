/**
 * 個人信貸試算純函數引擎（無副作用、可毫秒級單元測試）。
 *
 * 從 `PersonalLoanClient.tsx` 抽離的領域邏輯：本息/本金平均攤還歷期表、
 * 總利息、首期月付金，以及以二分搜尋法求解的 APR 實質總費用年率。
 */

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
 * @returns 年化百分比，四捨五入至小數 2 位；無法求解時回傳 0
 */
export function calculateAPR(loanAmount: number, fee: number, payments: number[]): number {
  const netAmount = loanAmount - fee;
  if (netAmount <= 0 || payments.length === 0) return 0;

  let low = 0;
  let high = 2; // 月折現率上限 200%
  let mid = 0;

  for (let iter = 0; iter < 80; iter++) {
    mid = (low + high) / 2;
    let npv = -netAmount;
    for (let t = 0; t < payments.length; t++) {
      npv += payments[t] / Math.pow(1 + mid, t + 1);
    }
    if (npv > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return parseFloat((mid * 12 * 100).toFixed(2));
}

export function calculatePersonalLoan(input: PersonalLoanInput): PersonalLoanResult {
  const numAmount = Number.isFinite(input.amountInTenThousands) ? input.amountInTenThousands : 0;
  const numYears = Number.isFinite(input.years) ? input.years : 0;
  const numRate = Number.isFinite(input.annualRatePercent) ? input.annualRatePercent : 0;
  const numFee = Number.isFinite(input.fee) ? input.fee : 0;

  const loanAmt = numAmount * 10000;
  const totalMonths = numYears * 12;
  const monthlyRate = numRate / 100 / 12;

  let remaining = loanAmt;
  let sumInterest = 0;
  const rows: LoanScheduleRow[] = [];

  if (totalMonths > 0 && loanAmt > 0) {
    for (let m = 1; m <= totalMonths; m++) {
      const interest = Math.round(remaining * monthlyRate);
      let principal = 0;

      if (input.method === 'equal-payment') {
        if (monthlyRate === 0) {
          principal = Math.round(loanAmt / totalMonths);
        } else {
          const pow = Math.pow(1 + monthlyRate, totalMonths);
          const pmt = (loanAmt * monthlyRate * pow) / (pow - 1);
          principal = Math.round(pmt - interest);
        }
      } else {
        principal = Math.round(loanAmt / totalMonths);
      }

      // 最後一期清算剩餘本金
      if (m === totalMonths) {
        principal = remaining;
      }

      const payment = principal + interest;
      remaining = Math.max(0, remaining - principal);
      if (m === totalMonths) {
        remaining = 0;
      }
      sumInterest += interest;

      rows.push({ month: m, payment, principal, interest, remaining });
    }
  }

  const paymentsList = rows.map(r => r.payment);
  const calculatedApr = calculateAPR(loanAmt, numFee, paymentsList);

  return {
    schedule: rows,
    monthlyPayment: rows[0]?.payment ?? 0,
    totalInterest: sumInterest,
    aprPercent: calculatedApr > 0 ? calculatedApr : numRate,
  };
}

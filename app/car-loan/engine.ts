/**
 * 汽車貸款試算純函數引擎（無副作用、可毫秒級單元測試）。
 *
 * 從 `CarLoanClient.tsx` 抽離：4 種方案（標準攤還 / 寬限期 / 階梯式 / 氣球貸尾款）
 * × 本息平均攤還 / 本金平均攤還，逐期歷程表、首期與寬限後月付、總利息、
 * 總支出與 APR。所有金額計算一律走 BigNumber.js 定點數（鐵則 5、6）。
 */

import { D, BigNumber, toNumber, monthlyRateFromAnnualPercent } from '../utils/decimal.ts';
import { solveApr } from '../utils/finance.ts';

export type RepayType = 'equal-total' | 'equal-principal';
export type LoanScheme = 'standard' | 'grace' | 'stepped' | 'balloon';

export interface LoanRow {
  period: number;
  startBalance: number;
  principalPaid: number;
  interestPaid: number;
  totalPayment: number;
  endBalance: number;
  statusTag: string;
}

export interface CarLoanLabels {
  grace: string;
  amort: string;
  step: string;
  normal: string;
  balloon: string;
}

export interface CarLoanInput {
  /** 貸款金額（元） */
  loanAmount: number;
  /** 期數值 */
  periodVal: number;
  periodUnit: 'year' | 'month';
  /** 年利率（%） */
  interestRatePercent: number;
  repayType: RepayType;
  loanScheme: LoanScheme;
  /** 開辦 / 手續費（元） */
  fee: number;
  /** 寬限期月數 */
  gracePeriod: number;
  /** 階梯式前段月付（元） */
  stepPayment: number;
  /** 階梯式前段月數 */
  stepPeriods: number;
  /** 氣球貸尾款（元） */
  balloonAmount: number;
  labels: CarLoanLabels;
}

export interface CarLoanResult {
  schedule: LoanRow[];
  /** 首期月付金 */
  monthlyPayment: number;
  /** 寬限期 / 階梯期結束後的月付金 */
  afterSpecialPayment: number;
  totalInterest: number;
  totalPayment: number;
  apr: number | null;
  /** 階梯式前段月付低於當期利息 → 本金不減反增 */
  isNegAmort: boolean;
}

const ZERO_RESULT = (labels: CarLoanLabels): CarLoanResult => ({
  schedule: [],
  monthlyPayment: 0,
  afterSpecialPayment: 0,
  totalInterest: 0,
  totalPayment: 0,
  apr: 0,
  isNegAmort: false,
});

/** 本息平均攤還每期固定月付金：P·r·(1+r)^n / ((1+r)^n − 1)；r = 0 時為 P / n */
function annuityPayment(principal: BigNumber, monthlyRate: BigNumber, months: number): BigNumber {
  if (months <= 0) return D(0);
  if (monthlyRate.isZero()) return principal.div(months);
  const pow = monthlyRate.plus(1).pow(months);
  return principal.times(monthlyRate).times(pow).div(pow.minus(1));
}

export function calculateCarLoan(input: CarLoanInput): CarLoanResult {
  const numLoanAmount = Math.max(0, Number(input.loanAmount) || 0);
  const numPeriodVal = Math.max(0, Number(input.periodVal) || 0);
  const numGracePeriod = Math.max(0, Number(input.gracePeriod) || 0);
  const numStepPayment = Math.max(0, Number(input.stepPayment) || 0);
  const numStepPeriods = Math.max(0, Number(input.stepPeriods) || 0);
  const numBalloonAmount = Math.max(0, Number(input.balloonAmount) || 0);
  const numFee = Math.max(0, Number(input.fee) || 0);

  const totalMonths = Math.max(0, input.periodUnit === 'year' ? numPeriodVal * 12 : numPeriodVal);
  if (totalMonths <= 0 || numLoanAmount <= 0) return ZERO_RESULT(input.labels);

  const monthlyRate = monthlyRateFromAnnualPercent(input.interestRatePercent);
  const loanBn = D(numLoanAmount);

  const paymentArray: BigNumber[] = [];
  const rows: LoanRow[] = [
    { period: 0, startBalance: 0, principalPaid: 0, interestPaid: 0, totalPayment: 0, endBalance: numLoanAmount, statusTag: '' },
  ];

  let remBalance = loanBn;
  let interestSum = D(0);
  let firstPay = D(0);
  let afterPay = D(0);
  let negAmortFlag = false;

  const pushRow = (period: number, start: BigNumber, principal: BigNumber, interest: BigNumber, payment: BigNumber, statusTag: string) => {
    rows.push({
      period,
      startBalance: toNumber(start),
      principalPaid: toNumber(principal),
      interestPaid: toNumber(interest),
      totalPayment: toNumber(payment),
      endBalance: toNumber(BigNumber.max(0, remBalance)),
      statusTag,
    });
  };

  if (input.loanScheme === 'standard') {
    if (input.repayType === 'equal-total') {
      const pmt = annuityPayment(loanBn, monthlyRate, totalMonths);
      firstPay = pmt;
      for (let m = 1; m <= totalMonths; m++) {
        const start = remBalance;
        const interest = start.times(monthlyRate);
        const principal = pmt.minus(interest);
        remBalance = remBalance.minus(principal);
        if (m === totalMonths) remBalance = D(0);
        interestSum = interestSum.plus(interest);
        paymentArray.push(pmt);
        pushRow(m, start, principal, interest, pmt, '');
      }
    } else {
      const principalPerMonth = loanBn.div(totalMonths);
      for (let m = 1; m <= totalMonths; m++) {
        const start = remBalance;
        const interest = start.times(monthlyRate);
        const pmt = principalPerMonth.plus(interest);
        remBalance = remBalance.minus(principalPerMonth);
        if (m === totalMonths) remBalance = D(0);
        if (m === 1) firstPay = pmt;
        interestSum = interestSum.plus(interest);
        paymentArray.push(pmt);
        pushRow(m, start, principalPerMonth, interest, pmt, '');
      }
    }
  } else if (input.loanScheme === 'grace') {
    const validGrace = Math.max(0, Math.min(numGracePeriod, totalMonths - 1));
    const remMonths = totalMonths - validGrace;

    for (let m = 1; m <= validGrace; m++) {
      const start = remBalance;
      const interest = start.times(monthlyRate);
      interestSum = interestSum.plus(interest);
      paymentArray.push(interest);
      pushRow(m, start, D(0), interest, interest, input.labels.grace);
    }

    firstPay = validGrace > 0 ? remBalance.times(monthlyRate) : D(0);

    const postPmt =
      remMonths > 0 && input.repayType === 'equal-total'
        ? annuityPayment(remBalance, monthlyRate, remMonths)
        : D(0);
    afterPay = postPmt;

    const postPrincipalPerMonth =
      input.repayType === 'equal-principal' && remMonths > 0 ? remBalance.div(remMonths) : D(0);

    for (let m = validGrace + 1; m <= totalMonths; m++) {
      const start = remBalance;
      const interest = start.times(monthlyRate);
      let pmt: BigNumber;
      let principal: BigNumber;
      if (input.repayType === 'equal-total') {
        pmt = postPmt;
        principal = pmt.minus(interest);
      } else {
        principal = postPrincipalPerMonth;
        pmt = principal.plus(interest);
      }
      remBalance = remBalance.minus(principal);
      if (m === totalMonths) remBalance = D(0);
      interestSum = interestSum.plus(interest);
      paymentArray.push(pmt);
      pushRow(m, start, principal, interest, pmt, input.labels.amort);
    }
  } else if (input.loanScheme === 'stepped') {
    const validStepMonths = Math.max(0, Math.min(numStepPeriods, totalMonths - 1));
    const remMonths = totalMonths - validStepMonths;

    const firstMonthInterest = loanBn.times(monthlyRate);
    if (D(numStepPayment).lt(firstMonthInterest) && validStepMonths > 0) {
      negAmortFlag = true;
    }

    const stepPmt = D(numStepPayment);
    for (let m = 1; m <= validStepMonths; m++) {
      const start = remBalance;
      const interest = start.times(monthlyRate);
      const principal = stepPmt.minus(interest);
      remBalance = remBalance.minus(principal);
      interestSum = interestSum.plus(interest);
      paymentArray.push(stepPmt);
      pushRow(m, start, principal, interest, stepPmt, input.labels.step);
    }

    firstPay = validStepMonths > 0 ? stepPmt : D(0);

    const postPmt =
      remMonths > 0 && input.repayType === 'equal-total'
        ? annuityPayment(remBalance, monthlyRate, remMonths)
        : D(0);
    afterPay = postPmt;

    const postPrincipalPerMonth =
      input.repayType === 'equal-principal' && remMonths > 0 ? remBalance.div(remMonths) : D(0);

    for (let m = validStepMonths + 1; m <= totalMonths; m++) {
      const start = remBalance;
      const interest = start.times(monthlyRate);
      let pmt: BigNumber;
      let principal: BigNumber;
      if (input.repayType === 'equal-total') {
        pmt = postPmt;
        principal = pmt.minus(interest);
      } else {
        principal = postPrincipalPerMonth;
        pmt = principal.plus(interest);
      }
      remBalance = remBalance.minus(principal);
      if (m === totalMonths) remBalance = D(0);
      interestSum = interestSum.plus(interest);
      paymentArray.push(pmt);
      pushRow(m, start, principal, interest, pmt, input.labels.normal);
    }
  } else if (input.loanScheme === 'balloon') {
    const validBalloon = Math.min(numBalloonAmount, numLoanAmount);
    const amortizePrincipal = loanBn.minus(validBalloon);
    const balloonBn = D(validBalloon);

    const pmt =
      input.repayType === 'equal-total'
        ? annuityPayment(amortizePrincipal, monthlyRate, totalMonths)
        : D(0);
    const principalPerMonth =
      input.repayType === 'equal-principal' ? amortizePrincipal.div(totalMonths) : D(0);

    for (let m = 1; m <= totalMonths; m++) {
      const start = remBalance;
      const interest = start.times(monthlyRate);
      let curPmt: BigNumber;
      let principal: BigNumber;
      if (input.repayType === 'equal-total') {
        principal = pmt.minus(amortizePrincipal.times(monthlyRate));
        curPmt = pmt.plus(balloonBn.times(monthlyRate));
      } else {
        principal = principalPerMonth;
        curPmt = principal.plus(interest);
      }

      if (m === totalMonths) {
        principal = principal.plus(balloonBn);
        curPmt = curPmt.plus(balloonBn);
      }

      remBalance = remBalance.minus(principal);
      if (m === totalMonths) remBalance = D(0);
      if (m === 1) firstPay = curPmt;
      interestSum = interestSum.plus(interest);
      paymentArray.push(curPmt);
      pushRow(m, start, principal, interest, curPmt, m === totalMonths ? input.labels.balloon : '');
    }
  }

  return {
    schedule: rows,
    monthlyPayment: toNumber(firstPay),
    afterSpecialPayment: toNumber(afterPay),
    totalInterest: toNumber(interestSum),
    totalPayment: toNumber(loanBn.plus(interestSum).plus(numFee)),
    apr: solveApr(loanBn.minus(numFee), paymentArray),
    isNegAmort: negAmortFlag,
  };
}

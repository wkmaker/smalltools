/**
 * 複利試算純函數引擎（無副作用、可毫秒級單元測試）。
 *
 * 從 `CompoundInterestClient.tsx` 抽離：逐月本利滾存、依複利頻率結息、
 * 年度/月度彙總表，以及最終總資產 / 本金 / 累積利息。
 *
 * 所有金額計算一律走 BigNumber.js 定點數（鐵則 5、6）。
 */

import { D, BigNumber, toNumber, rateFromPercent } from '../utils/decimal.ts';

export interface InterestRow {
  label: string;
  startBalance: number;
  contribution: number;
  interest: number;
  cumulativeInterest: number;
  totalPrincipal: number;
  total: number;
}

export interface CompoundInterestLabels {
  initial: string;
  year: (n: number) => string;
  month: (n: number) => string;
}

export interface CompoundInterestInput {
  /** 期初本金（元） */
  principal: number;
  /** 每期投入（元） */
  contribution: number;
  contribUnit: 'month' | 'year';
  /** 利率（%） */
  ratePercent: number;
  rateUnit: 'year' | 'month';
  /** 期數值 */
  periodVal: number;
  periodUnit: 'year' | 'month';
  /** 結息頻率：12 每月 / 4 每季 / 1 每年 / 0 單利 */
  compoundFreq: number;
  labels: CompoundInterestLabels;
}

export interface CompoundInterestResult {
  schedule: InterestRow[];
  totalAsset: number;
  totalPrincipal: number;
  totalInterest: number;
}

export function calculateCompoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  const numPrincipal = input.principal === '' as unknown ? 0 : Math.max(0, Number(input.principal) || 0);
  const numContrib = Math.max(0, Number(input.contribution) || 0);
  const numRate = Math.min(1000, Math.max(0, Number(input.ratePercent) || 0));
  const numPeriod = Math.min(100, Math.max(0, Number(input.periodVal) || 0));

  const totalMonths = Math.max(0, input.periodUnit === 'year' ? numPeriod * 12 : numPeriod);
  const monthlyRate =
    input.rateUnit === 'year'
      ? rateFromPercent(numRate).div(12)
      : rateFromPercent(numRate);

  const principalBn = D(numPrincipal);
  const contribBn = D(numContrib);

  let currentBal = principalBn;
  let currentPrin = principalBn;
  let currentAccruedInterest = D(0);
  let totalInterestEarned = D(0);

  const monthlyData: { month: number; totalPrincipal: BigNumber; totalInterest: BigNumber; balance: BigNumber }[] = [];

  for (let month = 1; month <= totalMonths; month++) {
    let addedContrib = D(0);
    if (input.contribUnit === 'month') {
      addedContrib = contribBn;
    } else if (input.contribUnit === 'year' && (month - 1) % 12 === 0) {
      addedContrib = contribBn;
    }

    currentBal = currentBal.plus(addedContrib);
    currentPrin = currentPrin.plus(addedContrib);

    if (input.compoundFreq === 0) {
      const interestThisMonth = currentPrin.times(monthlyRate);
      totalInterestEarned = totalInterestEarned.plus(interestThisMonth);
      currentBal = currentBal.plus(interestThisMonth);
    } else {
      const interestThisMonth = currentBal.times(monthlyRate);
      currentAccruedInterest = currentAccruedInterest.plus(interestThisMonth);
      totalInterestEarned = totalInterestEarned.plus(interestThisMonth);

      const isCompoundingTerm =
        input.compoundFreq === 12 ||
        (input.compoundFreq === 4 && month % 3 === 0) ||
        (input.compoundFreq === 1 && month % 12 === 0) ||
        month === totalMonths;

      if (isCompoundingTerm) {
        currentBal = currentBal.plus(currentAccruedInterest);
        currentAccruedInterest = D(0);
      }
    }

    monthlyData.push({
      month,
      totalPrincipal: currentPrin,
      totalInterest: totalInterestEarned,
      balance: currentBal.plus(currentAccruedInterest),
    });
  }

  const rows: InterestRow[] = [
    {
      label: input.labels.initial,
      startBalance: 0,
      contribution: 0,
      interest: 0,
      cumulativeInterest: 0,
      totalPrincipal: numPrincipal,
      total: numPrincipal,
    },
  ];

  if (input.periodUnit === 'year') {
    let prevTotal = principalBn;
    let prevInterest = D(0);
    for (let year = 1; year <= numPeriod; year++) {
      const idx = Math.min(year * 12 - 1, monthlyData.length - 1);
      if (idx < 0) break;
      const currentTotal = monthlyData[idx].balance;
      const currentP = monthlyData[idx].totalPrincipal;
      const currentI = monthlyData[idx].totalInterest;

      const prevP = year === 1 ? principalBn : monthlyData[(year - 1) * 12 - 1].totalPrincipal;

      rows.push({
        label: input.labels.year(year),
        startBalance: toNumber(prevTotal),
        contribution: toNumber(currentP.minus(prevP)),
        interest: toNumber(currentI.minus(prevInterest)),
        cumulativeInterest: toNumber(currentI),
        totalPrincipal: toNumber(currentP),
        total: toNumber(currentTotal),
      });

      prevTotal = currentTotal;
      prevInterest = currentI;
    }
  } else {
    let prevTotal = principalBn;
    let prevInterest = D(0);
    monthlyData.forEach(item => {
      const prevP = item.month === 1 ? principalBn : monthlyData[item.month - 2].totalPrincipal;

      rows.push({
        label: input.labels.month(item.month),
        startBalance: toNumber(prevTotal),
        contribution: toNumber(item.totalPrincipal.minus(prevP)),
        interest: toNumber(item.totalInterest.minus(prevInterest)),
        cumulativeInterest: toNumber(item.totalInterest),
        totalPrincipal: toNumber(item.totalPrincipal),
        total: toNumber(item.balance),
      });

      prevTotal = item.balance;
      prevInterest = item.totalInterest;
    });
  }

  const finalState = rows[rows.length - 1];
  return {
    schedule: rows,
    totalAsset: finalState ? finalState.total : numPrincipal,
    totalPrincipal: finalState ? finalState.totalPrincipal : numPrincipal,
    totalInterest: finalState ? finalState.cumulativeInterest : 0,
  };
}

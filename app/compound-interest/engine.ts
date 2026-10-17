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
  /** 預期年通貨膨脹率（%，選填，預設 0） */
  inflationPercent?: number;
  labels: CompoundInterestLabels;
}

export interface CompoundInterestResult {
  schedule: InterestRow[];
  /** 與 schedule 一一對應的通膨折現後實質資產（元） */
  realSchedule: number[];
  totalAsset: number;
  realTotalAsset: number;
  totalPrincipal: number;
  totalInterest: number;
  /** 總投資報酬率 (%) = 總利息 / 總本金 × 100 */
  roiPercent: number;
  /** 複利利息佔最終總資產比例 (%) = 總利息 / 總資產 × 100 */
  interestSharePercent: number;
  /** 72 法則預估資產翻倍年數（若年化報酬率 <= 0 則為 null） */
  ruleOf72Years: number | null;
}

export function calculateCompoundInterest(input: CompoundInterestInput): CompoundInterestResult {
  const numPrincipal = input.principal === ('' as unknown) ? 0 : Math.max(0, Number(input.principal) || 0);
  const numContrib = Math.max(0, Number(input.contribution) || 0);
  const numRate = Math.min(1000, Math.max(0, Number(input.ratePercent) || 0));
  const maxPeriod = input.periodUnit === 'year' ? 100 : 1200;
  const numPeriod = Math.min(maxPeriod, Math.max(0, Number(input.periodVal) || 0));
  const numInflation = Math.min(100, Math.max(0, Number(input.inflationPercent) || 0));

  const totalMonths = Math.max(
    0,
    Math.round(input.periodUnit === 'year' ? numPeriod * 12 : numPeriod),
  );
  const monthlyRate =
    input.rateUnit === 'year'
      ? rateFromPercent(numRate).div(12)
      : rateFromPercent(numRate);
  const onePlusMonthlyInflation = D(1).plus(rateFromPercent(numInflation).div(12));

  const principalBn = D(numPrincipal);
  const contribBn = D(numContrib);

  let currentBal = principalBn;
  let currentPrin = principalBn;
  let currentAccruedInterest = D(0);
  let totalInterestEarned = D(0);
  let inflationFactor = D(1);

  const monthlyData: {
    month: number;
    totalPrincipal: BigNumber;
    totalInterest: BigNumber;
    balance: BigNumber;
    realBalance: BigNumber;
  }[] = [];

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

    inflationFactor = inflationFactor.times(onePlusMonthlyInflation);
    const endBalance = currentBal.plus(currentAccruedInterest);
    const realBalance = numInflation > 0 ? endBalance.div(inflationFactor) : endBalance;

    monthlyData.push({
      month,
      totalPrincipal: currentPrin,
      totalInterest: totalInterestEarned,
      balance: endBalance,
      realBalance,
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
  const realSchedule: number[] = [numPrincipal];

  if (input.periodUnit === 'year') {
    let prevTotal = principalBn;
    let prevInterest = D(0);
    const fullYears = Math.floor(totalMonths / 12);
    const remMonths = totalMonths % 12;

    for (let year = 1; year <= fullYears; year++) {
      const idx = year * 12 - 1;
      const item = monthlyData[idx];
      if (!item) break;
      const currentTotal = item.balance;
      const currentP = item.totalPrincipal;
      const currentI = item.totalInterest;

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
      realSchedule.push(toNumber(item.realBalance));

      prevTotal = currentTotal;
      prevInterest = currentI;
    }

    if (remMonths > 0 && monthlyData.length > 0) {
      const lastItem = monthlyData[monthlyData.length - 1];
      const prevP = fullYears === 0 ? principalBn : monthlyData[fullYears * 12 - 1].totalPrincipal;
      const fractionalYear = Number((totalMonths / 12).toFixed(2));

      rows.push({
        label: input.labels.year(fractionalYear),
        startBalance: toNumber(prevTotal),
        contribution: toNumber(lastItem.totalPrincipal.minus(prevP)),
        interest: toNumber(lastItem.totalInterest.minus(prevInterest)),
        cumulativeInterest: toNumber(lastItem.totalInterest),
        totalPrincipal: toNumber(lastItem.totalPrincipal),
        total: toNumber(lastItem.balance),
      });
      realSchedule.push(toNumber(lastItem.realBalance));
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
      realSchedule.push(toNumber(item.realBalance));

      prevTotal = item.balance;
      prevInterest = item.totalInterest;
    });
  }

  const finalState = rows[rows.length - 1];
  const finalReal = realSchedule[realSchedule.length - 1] ?? numPrincipal;
  const totalAsset = finalState ? finalState.total : numPrincipal;
  const totalPrincipal = finalState ? finalState.totalPrincipal : numPrincipal;
  const totalInterest = finalState ? finalState.cumulativeInterest : 0;

  const roiPercent =
    totalPrincipal > 0 ? toNumber(D(totalInterest).div(totalPrincipal).times(100)) : 0;
  const interestSharePercent =
    totalAsset > 0 ? toNumber(D(totalInterest).div(totalAsset).times(100)) : 0;

  const annualizedRatePercent = input.rateUnit === 'year' ? numRate : numRate * 12;
  const ruleOf72Years =
    annualizedRatePercent > 0 ? toNumber(D(72).div(annualizedRatePercent)) : null;

  return {
    schedule: rows,
    realSchedule,
    totalAsset,
    realTotalAsset: finalReal,
    totalPrincipal,
    totalInterest,
    roiPercent,
    interestSharePercent,
    ruleOf72Years,
  };
}

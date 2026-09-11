import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSingleLoanDetail, calculateMortgage } from '../../app/mortgage-loan/engine.ts';

/**
 * 房貸引擎特徵測試。`floatReference` 為重構前 calculateSingleLoanDetail 浮點演算法的
 * 凍結副本；批次交叉驗證確保 BigNumber 版在「整數元」層級一致。
 */

const r0 = n => Math.round(n);
const SINGLE_STAGE = [{ durationValue: null, durationUnit: null, rate: 0 }];

function floatReference(loanAmount, periodVal, periodUnit, graceVal, graceUnit, rateType, singleRate, stageList, repayType) {
  const M = (v, u) => (u === 'year' ? Math.round(v * 12) : Math.round(v));
  const totalMonths = Math.max(0, M(periodVal, periodUnit));
  let graceMonths = Math.max(0, M(graceVal, graceUnit));
  if (graceMonths > totalMonths) graceMonths = totalMonths;

  const stageRates = [];
  if (rateType === 'single') {
    for (let k = 0; k < totalMonths; k++) stageRates.push(singleRate);
  } else {
    let consumed = 0;
    for (let si = 0; si < stageList.length - 1; si++) {
      const s = stageList[si];
      const dv = s.durationValue === '' || s.durationValue === null ? 0 : s.durationValue;
      const sm = M(dv, s.durationUnit);
      const sr = s.rate === '' ? 0 : s.rate;
      for (let k = 0; k < sm; k++) stageRates.push(sr);
      consumed += sm;
    }
    const ls = stageList[stageList.length - 1];
    const lr = ls && ls.rate !== '' ? ls.rate : 0;
    for (let k = consumed; k < totalMonths; k++) stageRates.push(lr);
  }

  const resultData = [{ period: 0, startBalance: 0, principalPaid: 0, interestPaid: 0, totalPayment: 0, endBalance: loanAmount }];
  const paymentArray = [];
  let totalInterest = 0;

  if (totalMonths > 0 && loanAmount > 0) {
    let rem = loanAmount;
    const repayMonths = totalMonths - graceMonths;
    const ppm = repayMonths > 0 ? loanAmount / repayMonths : 0;
    for (let m = 1; m <= totalMonths; m++) {
      const startBal = rem;
      const ar = stageRates[m - 1] !== undefined ? stageRates[m - 1] : 0;
      const rM = ar / 100 / 12;
      let principalPaid = 0, interestPaid = 0, totalPayment = 0;
      if (m <= graceMonths) {
        interestPaid = startBal * rM; totalPayment = interestPaid; rem = startBal;
      } else {
        const left = totalMonths - m + 1;
        if (repayType === 'equal-total') {
          totalPayment = rM === 0 ? startBal / left : (startBal * (rM * Math.pow(1 + rM, left))) / (Math.pow(1 + rM, left) - 1);
          interestPaid = startBal * rM;
          principalPaid = totalPayment - interestPaid;
          rem = startBal - principalPaid;
        } else {
          principalPaid = ppm; interestPaid = startBal * rM;
          totalPayment = principalPaid + interestPaid; rem = startBal - principalPaid;
        }
      }
      if (m === totalMonths) { rem = 0; principalPaid = startBal; totalPayment = principalPaid + interestPaid; }
      totalInterest += interestPaid;
      paymentArray.push(totalPayment);
      resultData.push({ period: m, startBalance: startBal, principalPaid, interestPaid, totalPayment, endBalance: Math.max(0, rem) });
    }
  }
  return { totalMonths, graceMonths, totalInterest, paymentArray, resultData };
}

test('批次交叉驗證：單筆貸款引擎 vs 凍結浮點基準（整數元層級）', () => {
  const multiStages = [
    { durationValue: 2, durationUnit: 'year', rate: 2.0 },
    { durationValue: 1, durationUnit: 'year', rate: 2.1 },
    { durationValue: null, durationUnit: null, rate: 2.25 },
  ];
  const scenarios = [];
  for (const loanAmount of [8000000, 20000000])
    for (const periodVal of [20, 40])
      for (const graceVal of [0, 5])
        for (const repayType of ['equal-total', 'equal-principal'])
          for (const rt of ['single', 'multi'])
            scenarios.push([loanAmount, periodVal, graceVal, repayType, rt]);

  for (const [loanAmount, periodVal, graceVal, repayType, rt] of scenarios) {
    const args = [loanAmount, periodVal, 'year', graceVal, 'year', rt, 2.185, rt === 'multi' ? multiStages : SINGLE_STAGE, repayType];
    const ref = floatReference(...args);
    const got = calculateSingleLoanDetail(...args);
    const tag = `amt=${loanAmount} ${periodVal}y grace=${graceVal} ${repayType}/${rt}`;
    assert.equal(got.resultData.length, ref.resultData.length, `len ${tag}`);
    assert.ok(Math.abs(got.totalInterest - ref.totalInterest) <= 2, `totalInterest ${tag}: ${got.totalInterest} vs ${ref.totalInterest}`);
    assert.equal(r0(got.resultData[1].totalPayment), r0(ref.resultData[1].totalPayment), `firstPay ${tag}`);
    for (let i = 1; i < ref.resultData.length; i++) {
      assert.ok(Math.abs(got.resultData[i].endBalance - ref.resultData[i].endBalance) <= 2, `endBalance[${i}] ${tag}`);
      assert.ok(Math.abs(got.resultData[i].interestPaid - ref.resultData[i].interestPaid) <= 1, `interest[${i}] ${tag}`);
    }
  }
});

test('寬限期：前 N 期本金為 0、餘額不變；末期餘額歸零', () => {
  const r = calculateSingleLoanDetail(12000000, 30, 'year', 3, 'year', 'single', 2.185, SINGLE_STAGE, 'equal-total');
  for (let m = 1; m <= 36; m++) {
    assert.equal(r.resultData[m].principalPaid, 0);
    assert.ok(Math.abs(r.resultData[m].endBalance - 12000000) < 1e-4);
  }
  assert.equal(r.resultData[r.resultData.length - 1].endBalance, 0);
});

test('本金平均攤還：寬限期後每期本金固定 = 餘額 / 剩餘期數', () => {
  const r = calculateSingleLoanDetail(12000000, 30, 'year', 0, 'year', 'single', 2, SINGLE_STAGE, 'equal-principal');
  const ppm = 12000000 / 360;
  for (let m = 1; m < 360; m++) {
    assert.ok(Math.abs(r.resultData[m].principalPaid - ppm) < 1e-4, `第 ${m} 期`);
  }
});

test('多段式階梯利率：第 25 個月起套用最後一段利率', () => {
  const stages = [
    { durationValue: 2, durationUnit: 'year', rate: 1.5 },
    { durationValue: null, durationUnit: null, rate: 3.0 },
  ];
  const r = calculateSingleLoanDetail(10000000, 30, 'year', 0, 'year', 'multi', 0, stages, 'equal-principal');
  // 第 1 個月利息 ≈ 本金 × 1.5%/12
  assert.ok(Math.abs(r.resultData[1].interestPaid - 10000000 * 0.015 / 12) < 1);
  // 第 25 個月利息以 3.0% 計，且餘額已下降 → 介於「餘額 × 3%/12」附近
  const bal25 = r.resultData[24].endBalance;
  assert.ok(Math.abs(r.resultData[25].interestPaid - bal25 * 0.03 / 12) < 1);
});

test('組合貸款：合併列 = 貸款 A + 貸款 B 對應期數逐欄相加', () => {
  const mkCfg = (loanAmount, rate) => ({
    loanAmount, periodVal: 30, periodUnit: 'year', graceVal: 0, graceUnit: 'year',
    rateType: 'single', singleRate: rate, stages: SINGLE_STAGE, repayType: 'equal-total', fee: 5000,
  });
  const res = calculateMortgage({
    housePriceInTenThousands: 1500,
    downPaymentInTenThousands: 300,
    loanMode: 'combined',
    single: mkCfg(0, 0),
    combinedA: mkCfg(10000000, 1.775),
    combinedB: mkCfg(2000000, 2.5),
  });
  const row = res.schedule[1];
  assert.ok('detail1' in row && 'detail2' in row);
  assert.ok(Math.abs(row.totalPayment - (row.detail1.totalPayment + row.detail2.totalPayment)) < 1e-6);
  assert.ok(Math.abs(row.interestPaid - (row.detail1.interestPaid + row.detail2.interestPaid)) < 1e-6);
  assert.ok(res.aprPercent > 1.775 && res.aprPercent < 2.6);
});

test('邊界：貸款金額 <= 0 回傳空結果', () => {
  const res = calculateMortgage({
    housePriceInTenThousands: 300,
    downPaymentInTenThousands: 300,
    loanMode: 'single',
    single: {
      periodVal: 30, periodUnit: 'year', graceVal: 0, graceUnit: 'year',
      rateType: 'single', singleRate: 2, stages: SINGLE_STAGE, repayType: 'equal-total', fee: 0,
    },
    combinedA: {}, combinedB: {},
  });
  assert.equal(res.schedule.length, 0);
  assert.equal(res.firstPayment, 0);
  assert.equal(res.aprPercent, 0);
});

test('手續費 ≥ 貸款金額時 aprPercent 為 null（無法求解，不得靜默回傳 0）', () => {
  const res = calculateMortgage({
    housePriceInTenThousands: 1000,
    downPaymentInTenThousands: 500,
    loanMode: 'single',
    single: {
      periodVal: 20, periodUnit: 'year', graceVal: 0, graceUnit: 'year',
      rateType: 'single', singleRate: 2, stages: SINGLE_STAGE, repayType: 'equal-total', fee: 99999999,
    },
    combinedA: {}, combinedB: {},
  });
  assert.equal(res.aprPercent, null);
});

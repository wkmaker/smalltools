import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCompoundInterest } from '../../app/compound-interest/engine.ts';

/**
 * 複利引擎特徵測試。期望值鎖定重構前浮點版的「顯示解析度（整數元）」行為，
 * BigNumber 版在四捨五入到元的層級須完全一致；次分位以下的浮點誤差則被修正。
 */

const L = {
  initial: '初始',
  year: n => `第 ${n} 年`,
  month: n => `第 ${n} 個月`,
};

const round = n => Math.round(n);

test('每月定額 5000 / 期初 10 萬 / 年化 6% / 每年結息 / 10 年', () => {
  const r = calculateCompoundInterest({
    principal: 100000, contribution: 5000, contribUnit: 'month',
    ratePercent: 6, rateUnit: 'year', periodVal: 10, periodUnit: 'year',
    compoundFreq: 1, labels: L,
  });
  assert.equal(r.schedule.length, 11);
  assert.equal(round(r.totalAsset), 995635);
  assert.equal(r.totalPrincipal, 700000);
  assert.equal(round(r.totalInterest), 295635);
  assert.deepEqual(
    { ...r.schedule[1], startBalance: round(r.schedule[1].startBalance), total: round(r.schedule[1].total) },
    { label: '第 1 年', startBalance: 100000, contribution: 60000, interest: 7950, cumulativeInterest: 7950, totalPrincipal: 160000, total: 167950 },
  );
});

test('單利模式 (compoundFreq = 0)：利息 = 本金 × 月利率 × 月數', () => {
  const r = calculateCompoundInterest({
    principal: 100000, contribution: 0, contribUnit: 'month',
    ratePercent: 6, rateUnit: 'year', periodVal: 10, periodUnit: 'year',
    compoundFreq: 0, labels: L,
  });
  assert.equal(r.totalAsset, 160000);
  assert.equal(r.totalPrincipal, 100000);
  assert.equal(r.totalInterest, 60000);
});

test('純定期定額 / 月為期間單位 / 每月結息 / 24 個月', () => {
  const r = calculateCompoundInterest({
    principal: 0, contribution: 10000, contribUnit: 'month',
    ratePercent: 8, rateUnit: 'year', periodVal: 24, periodUnit: 'month',
    compoundFreq: 12, labels: L,
  });
  assert.equal(r.schedule.length, 25);
  assert.equal(r.totalPrincipal, 240000);
  assert.equal(round(r.totalAsset), 261061);
  assert.equal(round(r.totalInterest), 21061);
});

test('零利率：總資產 = 總投入，無利息', () => {
  const r = calculateCompoundInterest({
    principal: 1000000, contribution: 0, contribUnit: 'month',
    ratePercent: 0, rateUnit: 'year', periodVal: 5, periodUnit: 'year',
    compoundFreq: 1, labels: L,
  });
  assert.equal(r.totalAsset, 1000000);
  assert.equal(r.totalInterest, 0);
});

test('不變式：累積利息逐列單調不減、總資產 = 總本金 + 累積利息', () => {
  const r = calculateCompoundInterest({
    principal: 250000, contribution: 8000, contribUnit: 'month',
    ratePercent: 5.5, rateUnit: 'year', periodVal: 20, periodUnit: 'year',
    compoundFreq: 12, labels: L,
  });
  let prev = -1;
  for (const row of r.schedule) {
    assert.ok(row.cumulativeInterest >= prev - 1e-6, '累積利息不應減少');
    prev = row.cumulativeInterest;
    assert.ok(Math.abs(row.total - (row.totalPrincipal + row.cumulativeInterest)) < 1e-6, '總資產恆等式');
  }
});

test('邊界：期數為 0 只回傳初始列', () => {
  const r = calculateCompoundInterest({
    principal: 100000, contribution: 5000, contribUnit: 'month',
    ratePercent: 6, rateUnit: 'year', periodVal: 0, periodUnit: 'year',
    compoundFreq: 1, labels: L,
  });
  assert.equal(r.schedule.length, 1);
  assert.equal(r.totalAsset, 100000);
});

test('與重構前浮點演算法在「整數元」層級完全一致（批次交叉驗證）', () => {
  const scenarios = [];
  for (const principal of [0, 100000, 1234567])
    for (const contribution of [0, 5000, 12000])
      for (const contribUnit of ['month', 'year'])
        for (const ratePercent of [0, 1.5, 6, 8.88])
          for (const [periodVal, periodUnit] of [[10, 'year'], [3, 'year'], [24, 'month']])
            for (const compoundFreq of [0, 1, 4, 12])
              scenarios.push({ principal, contribution, contribUnit, ratePercent, rateUnit: 'year', periodVal, periodUnit, compoundFreq });

  for (const s of scenarios) {
    const ref = floatReference(s);
    const got = calculateCompoundInterest({ ...s, labels: L });
    assert.equal(Math.round(got.totalAsset), Math.round(ref.totalAsset), `asset ${JSON.stringify(s)}`);
    assert.equal(Math.round(got.totalPrincipal), Math.round(ref.totalPrincipal), `prin ${JSON.stringify(s)}`);
    assert.equal(Math.round(got.totalInterest), Math.round(ref.totalInterest), `int ${JSON.stringify(s)}`);
  }
});

/** 重構前 CompoundInterestClient.runCalculation 的浮點演算法（凍結為對照基準） */
function floatReference(inp) {
  const numPrincipal = Math.max(0, inp.principal);
  const numContrib = Math.max(0, inp.contribution);
  const numRate = Math.min(1000, Math.max(0, inp.ratePercent));
  const numPeriod = Math.min(100, Math.max(0, inp.periodVal));
  const totalMonths = Math.max(0, inp.periodUnit === 'year' ? numPeriod * 12 : numPeriod);
  const monthlyRate = inp.rateUnit === 'year' ? numRate / 100 / 12 : numRate / 100;
  let currentBal = numPrincipal, currentPrin = numPrincipal, accrued = 0, totalInt = 0;
  const md = [];
  for (let month = 1; month <= totalMonths; month++) {
    let add = 0;
    if (inp.contribUnit === 'month') add = numContrib;
    else if (inp.contribUnit === 'year' && (month - 1) % 12 === 0) add = numContrib;
    currentBal += add; currentPrin += add;
    if (inp.compoundFreq === 0) {
      const i = currentPrin * monthlyRate; totalInt += i; currentBal += i;
    } else {
      const i = currentBal * monthlyRate; accrued += i; totalInt += i;
      const term = inp.compoundFreq === 12 || (inp.compoundFreq === 4 && month % 3 === 0) ||
        (inp.compoundFreq === 1 && month % 12 === 0) || month === totalMonths;
      if (term) { currentBal += accrued; accrued = 0; }
    }
    md.push({ month, totalPrincipal: currentPrin, totalInterest: totalInt, balance: currentBal + accrued });
  }
  const last = md[md.length - 1];
  return last
    ? { totalAsset: last.balance, totalPrincipal: last.totalPrincipal, totalInterest: last.totalInterest }
    : { totalAsset: numPrincipal, totalPrincipal: numPrincipal, totalInterest: 0 };
}

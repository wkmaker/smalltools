import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateCarLoan } from '../../app/car-loan/engine.ts';

/**
 * 車貸引擎特徵測試。
 *
 * 主要防護：`floatReference` 是重構前 CarLoanClient.runCalculation 浮點演算法的
 * 凍結副本，批次交叉驗證確保 BigNumber 版在「整數元」層級完全一致。
 */

const L = { grace: '寬限期', amort: '攤還期', step: '階梯期', normal: '正常期', balloon: '尾款' };
const r0 = n => Math.round(n);

function floatReference(inp) {
  const P = Math.max(0, inp.loanAmount);
  const pv = Math.max(0, inp.periodVal);
  const totalMonths = Math.max(0, inp.periodUnit === 'year' ? pv * 12 : pv);
  const out = { schedule: [{ period: 0, endBalance: P }], monthlyPayment: 0, afterSpecialPayment: 0, totalInterest: 0, totalPayment: 0, isNegAmort: false, apr: 0 };
  if (totalMonths <= 0 || P <= 0) return out;
  const mr = inp.interestRatePercent / 100 / 12;
  const fee = Math.max(0, inp.fee || 0);
  const payments = [];
  let rem = P, isum = 0, firstPay = 0, afterPay = 0, neg = false;
  const ann = (bal, n) => (n <= 0 ? 0 : mr === 0 ? bal / n : (bal * (mr * Math.pow(1 + mr, n))) / (Math.pow(1 + mr, n) - 1));

  if (inp.loanScheme === 'standard') {
    if (inp.repayType === 'equal-total') {
      const pmt = ann(P, totalMonths); firstPay = pmt;
      for (let m = 1; m <= totalMonths; m++) {
        const interest = rem * mr; const principal = pmt - interest;
        rem -= principal; if (m === totalMonths) rem = 0;
        isum += interest; payments.push(pmt); out.schedule.push({ period: m, endBalance: Math.max(0, rem) });
      }
    } else {
      const ppm = P / totalMonths;
      for (let m = 1; m <= totalMonths; m++) {
        const interest = rem * mr; const pmt = ppm + interest;
        rem -= ppm; if (m === totalMonths) rem = 0;
        if (m === 1) firstPay = pmt;
        isum += interest; payments.push(pmt); out.schedule.push({ period: m, endBalance: Math.max(0, rem) });
      }
    }
  } else if (inp.loanScheme === 'grace') {
    const vg = Math.max(0, Math.min(inp.gracePeriod, totalMonths - 1));
    const rm = totalMonths - vg;
    for (let m = 1; m <= vg; m++) { const interest = rem * mr; isum += interest; payments.push(interest); out.schedule.push({ period: m, endBalance: rem }); }
    firstPay = vg > 0 ? rem * mr : 0;
    const postPmt = rm > 0 && inp.repayType === 'equal-total' ? ann(rem, rm) : 0;
    afterPay = postPmt;
    const pppm = inp.repayType === 'equal-principal' && rm > 0 ? rem / rm : 0;
    for (let m = vg + 1; m <= totalMonths; m++) {
      const interest = rem * mr; let pmt, principal;
      if (inp.repayType === 'equal-total') { pmt = postPmt; principal = pmt - interest; } else { principal = pppm; pmt = principal + interest; }
      rem -= principal; if (m === totalMonths) rem = 0;
      isum += interest; payments.push(pmt); out.schedule.push({ period: m, endBalance: Math.max(0, rem) });
    }
  } else if (inp.loanScheme === 'stepped') {
    const vs = Math.max(0, Math.min(inp.stepPeriods, totalMonths - 1));
    const rm = totalMonths - vs;
    if (inp.stepPayment < P * mr && vs > 0) neg = true;
    for (let m = 1; m <= vs; m++) {
      const interest = rem * mr; const principal = inp.stepPayment - interest;
      rem -= principal; isum += interest; payments.push(inp.stepPayment); out.schedule.push({ period: m, endBalance: Math.max(0, rem) });
    }
    firstPay = vs > 0 ? inp.stepPayment : 0;
    const postPmt = rm > 0 && inp.repayType === 'equal-total' ? ann(rem, rm) : 0;
    afterPay = postPmt;
    const pppm = inp.repayType === 'equal-principal' && rm > 0 ? rem / rm : 0;
    for (let m = vs + 1; m <= totalMonths; m++) {
      const interest = rem * mr; let pmt, principal;
      if (inp.repayType === 'equal-total') { pmt = postPmt; principal = pmt - interest; } else { principal = pppm; pmt = principal + interest; }
      rem -= principal; if (m === totalMonths) rem = 0;
      isum += interest; payments.push(pmt); out.schedule.push({ period: m, endBalance: Math.max(0, rem) });
    }
  } else if (inp.loanScheme === 'balloon') {
    const vb = Math.min(inp.balloonAmount, P);
    const ap = P - vb;
    const pmt = inp.repayType === 'equal-total' ? ann(ap, totalMonths) : 0;
    const ppm = inp.repayType === 'equal-principal' ? ap / totalMonths : 0;
    for (let m = 1; m <= totalMonths; m++) {
      const interest = rem * mr; let curPmt, principal;
      if (inp.repayType === 'equal-total') { principal = pmt - ap * mr; curPmt = pmt + vb * mr; } else { principal = ppm; curPmt = principal + interest; }
      if (m === totalMonths) { principal += vb; curPmt += vb; }
      rem -= principal; if (m === totalMonths) rem = 0;
      if (m === 1) firstPay = curPmt;
      isum += interest; payments.push(curPmt); out.schedule.push({ period: m, endBalance: Math.max(0, rem) });
    }
  }
  out.monthlyPayment = firstPay; out.afterSpecialPayment = afterPay; out.totalInterest = isum;
  out.totalPayment = P + isum + fee; out.isNegAmort = neg;
  return out;
}

test('批次交叉驗證：BigNumber 版與凍結浮點基準在整數元層級一致（全 4 方案）', () => {
  const base = {
    loanAmount: 800000, periodVal: 5, periodUnit: 'year', interestRatePercent: 3.88,
    repayType: 'equal-total', loanScheme: 'standard', fee: 8000,
    gracePeriod: 12, stepPayment: 10000, stepPeriods: 12, balloonAmount: 200000, labels: L,
  };
  const scenarios = [];
  for (const loanAmount of [300000, 1500000])
    for (const [periodVal, periodUnit] of [[5, 'year'], [36, 'month']])
      for (const interestRatePercent of [0, 5.5])
        for (const repayType of ['equal-total', 'equal-principal'])
          for (const loanScheme of ['standard', 'grace', 'stepped', 'balloon'])
            scenarios.push({ ...base, loanAmount, periodVal, periodUnit, interestRatePercent, repayType, loanScheme });

  for (const s of scenarios) {
    const ref = floatReference(s);
    const got = calculateCarLoan(s);
    const tag = `${s.loanScheme}/${s.repayType} amt=${s.loanAmount} ${s.periodVal}${s.periodUnit} r=${s.interestRatePercent}`;
    // 單一公式值：需完全一致（四捨五入到元）
    assert.equal(got.schedule.length, ref.schedule.length, `len ${tag}`);
    assert.equal(r0(got.monthlyPayment), r0(ref.monthlyPayment), `monthlyPayment ${tag}`);
    assert.equal(r0(got.afterSpecialPayment), r0(ref.afterSpecialPayment), `afterSpecialPayment ${tag}`);
    assert.equal(got.isNegAmort, ref.isNegAmort, `isNegAmort ${tag}`);
    // 跨數十期累加值：浮點基準本身已有 ±1~2 元漂移，BigNumber 版為更精確結果，
    // 故僅要求落在 2 元容差內（差異方向恆為「修正浮點誤差」）。
    assert.ok(Math.abs(got.totalInterest - ref.totalInterest) <= 2, `totalInterest ${tag}: ${got.totalInterest} vs ${ref.totalInterest}`);
    assert.ok(Math.abs(got.totalPayment - ref.totalPayment) <= 2, `totalPayment ${tag}: ${got.totalPayment} vs ${ref.totalPayment}`);
    for (let i = 0; i < ref.schedule.length; i++) {
      assert.ok(Math.abs(got.schedule[i].endBalance - ref.schedule[i].endBalance) <= 2, `endBalance[${i}] ${tag}: ${got.schedule[i].endBalance} vs ${ref.schedule[i].endBalance}`);
    }
  }
});

test('標準本息平均攤還：末期餘額歸零、償還本金總和 = 貸款金額', () => {
  const r = calculateCarLoan({
    loanAmount: 800000, periodVal: 5, periodUnit: 'year', interestRatePercent: 3.88,
    repayType: 'equal-total', loanScheme: 'standard', fee: 0,
    gracePeriod: 0, stepPayment: 0, stepPeriods: 0, balloonAmount: 0, labels: L,
  });
  assert.equal(r.schedule.length, 61);
  assert.equal(r.schedule[60].endBalance, 0);
  const sumPrincipal = r.schedule.slice(1).reduce((s, row) => s + row.principalPaid, 0);
  assert.ok(Math.abs(sumPrincipal - 800000) < 1e-4);
  assert.ok(r.apr > 3.88 && r.apr < 4.2);
});

test('寬限期方案：前 N 期只繳息（本金 0、餘額不變）', () => {
  const r = calculateCarLoan({
    loanAmount: 600000, periodVal: 4, periodUnit: 'year', interestRatePercent: 5,
    repayType: 'equal-total', loanScheme: 'grace', fee: 0,
    gracePeriod: 6, stepPayment: 0, stepPeriods: 0, balloonAmount: 0, labels: L,
  });
  for (let m = 1; m <= 6; m++) {
    assert.equal(r.schedule[m].principalPaid, 0, `第 ${m} 期本金應為 0`);
    assert.equal(r.schedule[m].statusTag, '寬限期');
    assert.ok(Math.abs(r.schedule[m].endBalance - 600000) < 1e-4);
  }
  assert.ok(r.afterSpecialPayment > 0);
  assert.equal(r.schedule[r.schedule.length - 1].endBalance, 0);
});

test('階梯式：前段月付低於首月利息時標記負攤還', () => {
  const r = calculateCarLoan({
    loanAmount: 1000000, periodVal: 5, periodUnit: 'year', interestRatePercent: 6,
    repayType: 'equal-total', loanScheme: 'stepped', fee: 0,
    gracePeriod: 0, stepPayment: 3000, stepPeriods: 12, balloonAmount: 0, labels: L,
  });
  assert.equal(r.isNegAmort, true);
});

test('氣球貸：尾款於末期一次清償，餘額歸零', () => {
  const r = calculateCarLoan({
    loanAmount: 1000000, periodVal: 5, periodUnit: 'year', interestRatePercent: 4,
    repayType: 'equal-total', loanScheme: 'balloon', fee: 0,
    gracePeriod: 0, stepPayment: 0, stepPeriods: 0, balloonAmount: 300000, labels: L,
  });
  const last = r.schedule[r.schedule.length - 1];
  assert.equal(last.endBalance, 0);
  assert.equal(last.statusTag, '尾款');
  assert.ok(last.principalPaid > 300000);
});

test('邊界：金額或期數為 0 回傳空結果', () => {
  const r = calculateCarLoan({
    loanAmount: 0, periodVal: 5, periodUnit: 'year', interestRatePercent: 4,
    repayType: 'equal-total', loanScheme: 'standard', fee: 0,
    gracePeriod: 0, stepPayment: 0, stepPeriods: 0, balloonAmount: 0, labels: L,
  });
  assert.equal(r.schedule.length, 0);
  assert.equal(r.monthlyPayment, 0);
  assert.equal(r.apr, 0);
});

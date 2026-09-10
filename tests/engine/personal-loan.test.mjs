import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePersonalLoan, calculateAPR } from '../../app/personal-loan/engine.ts';

/**
 * 個人信貸引擎特徵測試 (characterization tests)。
 *
 * 期望值為浮點數版本重構前的既有輸出，用來鎖定「本息/本金平均攤還」歷期表、
 * 首期月付金、總利息與 APR 求解的行為契約。改寫為 BigNumber 定點數後，
 * 業務層級數值（元）不得偏移。
 */

test('本息平均攤還：50 萬 / 7 年 / 3.25% / 開辦費 6000', () => {
  const r = calculatePersonalLoan({
    amountInTenThousands: 50,
    years: 7,
    annualRatePercent: 3.25,
    fee: 6000,
    method: 'equal-payment',
  });
  assert.equal(r.schedule.length, 84);
  assert.equal(r.monthlyPayment, 6663);
  assert.equal(r.totalInterest, 59704);
  assert.equal(r.aprPercent, 3.61);
  assert.deepEqual(r.schedule[0], { month: 1, payment: 6663, principal: 5309, interest: 1354, remaining: 494691 });
  assert.deepEqual(r.schedule[1], { month: 2, payment: 6663, principal: 5323, interest: 1340, remaining: 489368 });
  assert.deepEqual(r.schedule[83], { month: 84, payment: 6675, principal: 6657, interest: 18, remaining: 0 });
});

test('本息平均攤還：30 萬 / 5 年 / 3.5% / 無手續費（APR = 名目利率）', () => {
  const r = calculatePersonalLoan({
    amountInTenThousands: 30,
    years: 5,
    annualRatePercent: 3.5,
    fee: 0,
    method: 'equal-payment',
  });
  assert.equal(r.schedule.length, 60);
  assert.equal(r.monthlyPayment, 5458);
  assert.equal(r.totalInterest, 27449);
  assert.equal(r.aprPercent, 3.5);
  assert.deepEqual(r.schedule[0], { month: 1, payment: 5458, principal: 4583, interest: 875, remaining: 295417 });
  assert.deepEqual(r.schedule[59], { month: 60, payment: 5427, principal: 5411, interest: 16, remaining: 0 });
});

test('零利率：本息平均攤還退化為本金均分', () => {
  const r = calculatePersonalLoan({
    amountInTenThousands: 100,
    years: 7,
    annualRatePercent: 0,
    fee: 0,
    method: 'equal-payment',
  });
  assert.equal(r.monthlyPayment, 11905);
  assert.equal(r.totalInterest, 0);
  assert.equal(r.aprPercent, 0);
  assert.deepEqual(r.schedule[83], { month: 84, payment: 11885, principal: 11885, interest: 0, remaining: 0 });
});

test('本金平均攤還：80 萬 / 3 年 / 6.1% / 開辦費 9000', () => {
  const r = calculatePersonalLoan({
    amountInTenThousands: 80,
    years: 3,
    annualRatePercent: 6.1,
    fee: 9000,
    method: 'equal-principal',
  });
  assert.equal(r.schedule.length, 36);
  assert.equal(r.monthlyPayment, 26289);
  assert.equal(r.totalInterest, 75236);
  assert.equal(r.aprPercent, 6.88);
  assert.deepEqual(r.schedule[0], { month: 1, payment: 26289, principal: 22222, interest: 4067, remaining: 777778 });
  assert.deepEqual(r.schedule[1], { month: 2, payment: 26176, principal: 22222, interest: 3954, remaining: 755556 });
  assert.deepEqual(r.schedule[35], { month: 36, payment: 22343, principal: 22230, interest: 113, remaining: 0 });
});

test('最後一期一定結清剩餘本金為 0', () => {
  for (const method of ['equal-payment', 'equal-principal']) {
    for (const rate of [0, 1.5, 3.25, 8, 15]) {
      const r = calculatePersonalLoan({
        amountInTenThousands: 37,
        years: 6,
        annualRatePercent: rate,
        fee: 3500,
        method,
      });
      assert.equal(r.schedule[r.schedule.length - 1].remaining, 0, `method=${method} rate=${rate}`);
    }
  }
});

test('邊界：金額或期限為 0 時回傳空表', () => {
  const r = calculatePersonalLoan({
    amountInTenThousands: 0,
    years: 7,
    annualRatePercent: 3,
    fee: 0,
    method: 'equal-payment',
  });
  assert.equal(r.schedule.length, 0);
  assert.equal(r.monthlyPayment, 0);
  assert.equal(r.totalInterest, 0);
});

test('calculateAPR：淨額 <= 0 或無現金流時回傳 0', () => {
  assert.equal(calculateAPR(10000, 10000, [100, 100]), 0);
  assert.equal(calculateAPR(10000, 0, []), 0);
});

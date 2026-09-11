import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePledge } from '../../app/pledge-calculator/engine.ts';

const base = {
  stockPrice: 200,
  stockQty: 100,
  qtyUnit: 1000,
  loanAmount: 6_000_000,
  thresholdWarnPercent: 130,
  thresholdSafePercent: 160,
  stressDropPercent: 0,
};

test('基本市值與可貸額度', () => {
  const r = calculatePledge(base);
  assert.equal(r.totalShares, 100_000);
  assert.equal(r.marketValue, 20_000_000);
  assert.equal(r.maxLoan60, 12_000_000);
  assert.equal(r.maxLoan50, 10_000_000);
});

test('追繳臨界股價 = 借款 × 門檻% ÷ 總股數（FAQ 範例）', () => {
  const r = calculatePledge({
    ...base, stockPrice: 1000, stockQty: 1000, qtyUnit: 1, loanAmount: 600_000,
  });
  // (600000 × 1.3) ÷ 1000 = 780
  assert.equal(r.warnPrice, 780);
  // (600000 × 1.6) ÷ 1000 = 960
  assert.equal(r.safePrice, 960);
});

test('容許跌幅 = (現價 − 臨界價) / 現價 × 100', () => {
  const r = calculatePledge(base);
  // warnPrice = 1.3 × 6,000,000 / 100,000 = 78
  assert.equal(r.warnPrice, 78);
  // (200 − 78) / 200 × 100 = 61
  assert.equal(r.warnDrop, 61);
  // safePrice = 96 → (200 − 96)/200×100 = 52
  assert.equal(r.safePrice, 96);
  assert.equal(r.safeDrop, 52);
});

test('壓力測試：股價與市值等比下修，維持率隨之下降', () => {
  const r = calculatePledge({ ...base, stressDropPercent: 30 });
  assert.equal(r.simPrice, 140);
  assert.equal(r.simMarketValue, 14_000_000);
  // 14,000,000 / 6,000,000 × 100 = 233.333...
  assert.ok(Math.abs(r.ratio - (14_000_000 / 6_000_000) * 100) < 1e-9);
  assert.equal(r.isBelowSafe, false);
});

test('低於安全維持率時給出償還本金 / 補繳現金金額', () => {
  const r = calculatePledge({ ...base, stressDropPercent: 60 });
  // simMarketValue = 8,000,000 → ratio = 133.33% < 160% → isBelowSafe
  assert.equal(r.isBelowSafe, true);
  assert.equal(r.simMarketValue, 8_000_000);
  // 方案 A：loan − simMV / 1.6 = 6,000,000 − 5,000,000 = 1,000,000
  assert.equal(r.repayAmount, 1_000_000);
  // 方案 B：loan × 1.6 − simMV = 9,600,000 − 8,000,000 = 1,600,000
  assert.equal(r.cashAmount, 1_600_000);
});

test('借款為 0：維持率與補繳金額皆為 0，不觸發補繳', () => {
  const r = calculatePledge({ ...base, loanAmount: 0 });
  assert.equal(r.ratio, 0);
  assert.equal(r.isBelowSafe, false);
  assert.equal(r.repayAmount, 0);
  assert.equal(r.cashAmount, 0);
  assert.equal(r.warnPrice, 0);
});

test('與浮點基準交叉驗證（整數元 / 小數 4 位比率）', () => {
  const ref = (i) => {
    const numPrice = Math.max(0, i.stockPrice);
    const totalShares = Math.max(0, i.stockQty) * i.qtyUnit;
    const marketValue = numPrice * totalShares;
    const numLoan = Math.max(0, i.loanAmount);
    const w = i.thresholdWarnPercent, s = i.thresholdSafePercent;
    let warnPrice = 0, warnDrop = 0, safePrice = 0, safeDrop = 0;
    if (numLoan > 0 && totalShares > 0 && numPrice > 0) {
      warnPrice = ((w / 100) * numLoan) / totalShares;
      warnDrop = Math.max(0, ((numPrice - warnPrice) / numPrice) * 100);
      safePrice = ((s / 100) * numLoan) / totalShares;
      safeDrop = Math.max(0, ((numPrice - safePrice) / numPrice) * 100);
    }
    const simMarketVal = marketValue * (1 - i.stressDropPercent / 100);
    const ratio = numLoan > 0 ? (simMarketVal / numLoan) * 100 : 0;
    let repayAmt = 0, cashAmt = 0;
    if (numLoan > 0 && ratio < s) {
      const targetSec = s / 100;
      repayAmt = Math.max(0, numLoan - simMarketVal / targetSec);
      cashAmt = Math.max(0, numLoan * targetSec - simMarketVal);
    }
    return { marketValue, warnPrice, warnDrop, safePrice, safeDrop, simMarketVal, ratio, repayAmt, cashAmt };
  };

  for (const stockPrice of [37.5, 123.4, 512])
    for (const stockQty of [3, 27, 150])
      for (const qtyUnit of [1, 1000])
        for (const loanAmount of [0, 850_000, 12_345_678])
          for (const [w, s] of [[130, 160], [140, 166.7]])
            for (const stressDropPercent of [0, 15, 42.5]) {
              const i = { stockPrice, stockQty, qtyUnit, loanAmount, thresholdWarnPercent: w, thresholdSafePercent: s, stressDropPercent };
              const a = ref(i), b = calculatePledge(i);
              assert.ok(Math.abs(a.warnPrice - b.warnPrice) < 1e-6, `warnPrice ${JSON.stringify(i)}`);
              assert.ok(Math.abs(a.warnDrop - b.warnDrop) < 1e-6, `warnDrop ${JSON.stringify(i)}`);
              assert.ok(Math.abs(a.safePrice - b.safePrice) < 1e-6, `safePrice ${JSON.stringify(i)}`);
              assert.ok(Math.abs(a.ratio - b.ratio) < 1e-6, `ratio ${JSON.stringify(i)}`);
              assert.ok(Math.abs(a.repayAmt - b.repayAmount) < 1e-3, `repayAmt ${JSON.stringify(i)}`);
              assert.ok(Math.abs(a.cashAmt - b.cashAmount) < 1e-3, `cashAmt ${JSON.stringify(i)}`);
            }
});

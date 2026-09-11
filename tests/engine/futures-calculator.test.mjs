import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateFutures } from '../../app/futures-calculator/engine.ts';

const base = {
  indexPrice: 22000,
  quantity: 1,
  capital: 242000,
  multiplier: 200,
  initialMargin: 242000,
  maintMargin: 186000,
  position: 'long',
  stressDropPercent: 0,
};

test('契約名目價值與實質槓桿（FAQ 範例：22000 點大台）', () => {
  const r = calculateFutures(base);
  assert.equal(r.contractValue, 22000 * 200); // 4,400,000
  assert.equal(r.totalInitMargin, 242000);
  assert.equal(r.totalMaintMargin, 186000);
  // 4,400,000 / 242,000 ≈ 18.18x
  assert.ok(Math.abs(r.actualLeverage - 4_400_000 / 242_000) < 1e-9);
});

test('多單追繳逆風點數 = (權益 − 維持保證金) ÷ 每點價值', () => {
  const r = calculateFutures({ ...base, capital: 300000 });
  // (300000 − 186000) / 200 = 570
  assert.equal(r.marginCallPoints, 570);
  assert.equal(r.marginCallPrice, 22000 - 570);
  // 斷頭：(300000 − 242000×0.25) / 200 = (300000 − 60500)/200 = 1197.5
  assert.equal(r.liquidationPoints, 1197.5);
  assert.equal(r.liquidationPrice, 22000 - 1197.5);
});

test('空單方向：臨界價位於指數上方', () => {
  const r = calculateFutures({ ...base, capital: 300000, position: 'short' });
  assert.equal(r.marginCallPrice, 22000 + 570);
  assert.equal(r.liquidationPrice, 22000 + 1197.5);
});

test('逆風壓力測試：多單指數下修、權益扣除逐點虧損', () => {
  const r = calculateFutures({ ...base, quantity: 2, capital: 600000, stressDropPercent: 5 });
  // dropPoints = 22000 × 5% = 1100
  assert.equal(r.dropPoints, 1100);
  assert.equal(r.simIndex, 22000 - 1100);
  // simLoss = 1100 × 2 × 200 = 440,000
  assert.equal(r.simLoss, 440000);
  assert.equal(r.simCapital, 600000 - 440000);
  // riskRatio = 160000 / (242000×2) × 100
  assert.ok(Math.abs(r.riskRatio - (160000 / 484000) * 100) < 1e-9);
});

test('壓力測試後低於原始保證金 → 補繳現金補足至 100%', () => {
  const r = calculateFutures({ ...base, quantity: 2, capital: 600000, stressDropPercent: 5 });
  assert.equal(r.isBelowInit, true);
  // 484000 − 160000 = 324000
  assert.equal(r.topupCash, 324000);
});

test('本金為 0：槓桿與臨界點皆為 0', () => {
  const r = calculateFutures({ ...base, capital: 0 });
  assert.equal(r.actualLeverage, 0);
  assert.equal(r.marginCallPoints, 0);
  assert.equal(r.liquidationPoints, 0);
});

test('與浮點基準交叉驗證', () => {
  const ref = (i) => {
    const contractValue = i.indexPrice * i.quantity * i.multiplier;
    const totalInitMargin = i.initialMargin * i.quantity;
    const totalMaintMargin = i.maintMargin * i.quantity;
    const actualLeverage = i.capital > 0 ? contractValue / i.capital : 0;
    let marginCallPts = 0, marginCallPrice = 0, liqPts = 0, liqPrice = 0;
    if (i.capital > 0 && i.quantity > 0 && i.multiplier > 0) {
      marginCallPts = (i.capital - totalMaintMargin) / (i.quantity * i.multiplier);
      marginCallPrice = i.position === 'long' ? i.indexPrice - marginCallPts : i.indexPrice + marginCallPts;
      liqPts = (i.capital - totalInitMargin * 0.25) / (i.quantity * i.multiplier);
      liqPrice = i.position === 'long' ? i.indexPrice - liqPts : i.indexPrice + liqPts;
    }
    const dropPoints = i.indexPrice * (i.stressDropPercent / 100);
    const simIndex = i.position === 'long' ? i.indexPrice - dropPoints : i.indexPrice + dropPoints;
    const simLoss = dropPoints * i.quantity * i.multiplier;
    const simCapital = i.capital - simLoss;
    const riskRatio = totalInitMargin > 0 ? (simCapital / totalInitMargin) * 100 : 0;
    const isBelowInit = totalInitMargin > 0 && simCapital < totalInitMargin;
    const topupCash = isBelowInit ? Math.max(0, totalInitMargin - simCapital) : 0;
    return { contractValue, actualLeverage, marginCallPts, marginCallPrice, liqPts, liqPrice, dropPoints, simIndex, simLoss, simCapital, riskRatio, topupCash };
  };

  for (const indexPrice of [17250, 22333, 9876])
    for (const quantity of [1, 3, 10])
      for (const capital of [0, 250_000, 1_234_567])
        for (const [multiplier, initialMargin, maintMargin] of [[200, 242000, 186000], [50, 60500, 46500], [10, 12100, 9300]])
          for (const position of ['long', 'short'])
            for (const stressDropPercent of [0, 12.5, 55]) {
              const i = { indexPrice, quantity, capital, multiplier, initialMargin, maintMargin, position, stressDropPercent };
              const a = ref(i), b = calculateFutures(i);
              assert.ok(Math.abs(a.contractValue - b.contractValue) < 1e-3, `contractValue ${JSON.stringify(i)}`);
              assert.ok(Math.abs(a.actualLeverage - b.actualLeverage) < 1e-9, `leverage ${JSON.stringify(i)}`);
              assert.ok(Math.abs(a.marginCallPts - b.marginCallPoints) < 1e-6, `marginCallPts ${JSON.stringify(i)}`);
              assert.ok(Math.abs(a.liqPts - b.liquidationPoints) < 1e-6, `liqPts ${JSON.stringify(i)}`);
              assert.ok(Math.abs(a.simCapital - b.simCapital) < 1e-3, `simCapital ${JSON.stringify(i)}`);
              assert.ok(Math.abs(a.riskRatio - b.riskRatio) < 1e-9, `riskRatio ${JSON.stringify(i)}`);
              assert.ok(Math.abs(a.topupCash - b.topupCash) < 1e-3, `topupCash ${JSON.stringify(i)}`);
            }
});

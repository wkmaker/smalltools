import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSectors,
  pickWeightedIndex,
  getContrastYIQ,
} from '../../app/lucky-wheel/engine.ts';

test('calculateSectors：依權重比例分配扇區角度，總和為 360 度', () => {
  const { sectors, totalWeight } = calculateSectors([
    { weight: 1 },
    { weight: 1 },
    { weight: 2 },
  ]);
  assert.equal(totalWeight, 4);
  assert.equal(sectors.length, 3);
  assert.equal(sectors[0].angleSpan, 90);
  assert.equal(sectors[1].angleSpan, 90);
  assert.equal(sectors[2].angleSpan, 180);
  assert.equal(sectors[0].startAngle, 0);
  assert.equal(sectors[2].endAngle, 360);
});

test('calculateSectors：無有效獎項（總權重為 0）時回傳空扇區', () => {
  const { sectors, totalWeight } = calculateSectors([]);
  assert.deepEqual(sectors, []);
  assert.equal(totalWeight, 0);
});

test('pickWeightedIndex：命中對應累加權重區間的索引', () => {
  const weights = [10, 20, 70]; // 累加區間: [0,10) [10,30) [30,100)
  assert.equal(pickWeightedIndex(weights, 5), 0);
  assert.equal(pickWeightedIndex(weights, 10), 0); // 邊界值歸屬前一區間 (randVal <= accum)
  assert.equal(pickWeightedIndex(weights, 10.001), 1);
  assert.equal(pickWeightedIndex(weights, 29.999), 1);
  assert.equal(pickWeightedIndex(weights, 30), 1);
  assert.equal(pickWeightedIndex(weights, 99.999), 2);
});

test('pickWeightedIndex：權重為 0 的獎項只有 randVal 精準落在 0 這個機率為零的邊界值才可能命中，其餘一律落到下一個有效區間', () => {
  const weights = [0, 100];
  assert.equal(pickWeightedIndex(weights, 0), 0); // 邊界值 0 <= accum(0)，屬於既有 <= 語意，機率為零的特例
  for (let randVal = 1; randVal <= 100; randVal += 10) {
    assert.equal(pickWeightedIndex(weights, randVal), 1);
  }
});

test('pickWeightedIndex：公平性統計檢驗——大量抽樣後各獎項命中比例應趨近權重比例', () => {
  const weights = [10, 20, 70];
  const totalWeight = 100;
  const counts = [0, 0, 0];
  const N = 20000;
  for (let i = 0; i < N; i++) {
    const idx = pickWeightedIndex(weights, Math.random() * totalWeight);
    counts[idx]++;
  }
  // 容許 3 個百分點誤差
  assert.ok(Math.abs(counts[0] / N - 0.1) < 0.03);
  assert.ok(Math.abs(counts[1] / N - 0.2) < 0.03);
  assert.ok(Math.abs(counts[2] / N - 0.7) < 0.03);
});

test('getContrastYIQ：淺色背景配深色文字，深色背景配白色文字', () => {
  assert.equal(getContrastYIQ('#ffffff'), '#0f172a');
  assert.equal(getContrastYIQ('#000000'), '#ffffff');
  assert.equal(getContrastYIQ('#f59e0b'), '#0f172a'); // 亮橘色
});

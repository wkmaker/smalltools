import test from 'node:test';
import assert from 'node:assert/strict';
import {
  combinations,
  binomialProbability,
  cumulativeBinomialProbability,
  calculateDiceCounts,
  generateDiceValues,
  formatElapsedTime,
} from '../../app/liars-dice/engine.ts';

test('Liars Dice Engine', async (t) => {
  await t.test('組合數 C(n, k)', () => {
    assert.equal(combinations(5, 0), 1);
    assert.equal(combinations(5, 1), 5);
    assert.equal(combinations(5, 2), 10);
    assert.equal(combinations(5, 5), 1);
    assert.equal(combinations(10, 3), 120);
    assert.equal(combinations(5, 6), 0);
  });

  await t.test('二項分佈單點與累積機率', () => {
    // 5 顆骰子，點數為特定點數的機率 p = 1/6
    const p1 = binomialProbability(5, 0, 1 / 6);
    const expectedP0 = Math.pow(5 / 6, 5);
    assert.ok(Math.abs(p1 - expectedP0) < 1e-6);

    // 累積機率：至少 0 個為 1
    assert.equal(cumulativeBinomialProbability(5, 0, 1 / 6), 1);
    // 累積機率：至少 6 個為 0
    assert.equal(cumulativeBinomialProbability(5, 6, 1 / 6), 0);

    // 累積機率之和檢驗
    let totalP = 0;
    for (let k = 0; k <= 5; k++) {
      totalP += binomialProbability(5, k, 1 / 3); // 包含 1 點時特定點數機率約 1/3
    }
    assert.ok(Math.abs(totalP - 1.0) < 1e-6);
  });

  await t.test('點數統計與計時器格式化', () => {
    const counts = calculateDiceCounts([1, 2, 2, 4, 6]);
    assert.deepEqual(counts, { 1: 1, 2: 2, 3: 0, 4: 1, 5: 0, 6: 1 });

    assert.equal(formatElapsedTime(0), '00m 00s');
    assert.equal(formatElapsedTime(65), '01m 05s');
    assert.equal(formatElapsedTime(3600), '60m 00s');
  });

  await t.test('隨機骰子點數生成', () => {
    const dice = generateDiceValues(5);
    assert.equal(dice.length, 5);
    dice.forEach((val) => {
      assert.ok(val >= 1 && val <= 6);
    });
    // 驗證是否有排序
    for (let i = 0; i < dice.length - 1; i++) {
      assert.ok(dice[i] <= dice[i + 1]);
    }
  });
});

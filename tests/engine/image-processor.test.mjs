import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateBatchDimensions } from '../../app/image-processor/engine.ts';

test('calculateBatchDimensions：同時指定寬高時直接採用（不鎖定比例）', () => {
  const r = calculateBatchDimensions(1000, 500, 300, 300, 100, false);
  assert.deepEqual(r, { w: 300, h: 300 });
});

test('calculateBatchDimensions：只指定寬度且鎖定長寬比時，依原圖比例換算高度', () => {
  const r = calculateBatchDimensions(1000, 500, 400, 0, 100, true);
  assert.deepEqual(r, { w: 400, h: 200 });
});

test('calculateBatchDimensions：只指定高度且鎖定長寬比時，依原圖比例換算寬度', () => {
  const r = calculateBatchDimensions(1000, 500, 0, 100, 100, true);
  assert.deepEqual(r, { w: 200, h: 100 });
});

test('calculateBatchDimensions：未指定任何目標尺寸時，改用百分比縮放', () => {
  const r = calculateBatchDimensions(1000, 500, 0, 0, 50, true);
  assert.deepEqual(r, { w: 500, h: 250 });
});

test('calculateBatchDimensions：換算結果至少為 1px，避免縮成 0', () => {
  const r = calculateBatchDimensions(1000, 500, 0, 0, 0, true);
  assert.deepEqual(r, { w: 1, h: 1 });
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { computeTextStatistics } from '../../app/text-utility/engine.ts';

test('文字工具單次巡訪統計：空白輸入防護', () => {
  const stats = computeTextStatistics('');
  assert.deepEqual(stats, {
    totalChars: 0,
    totalCharsNoSpace: 0,
    totalLines: 0,
    chineseChars: 0,
    englishWords: 0,
  });
});

test('文字工具單次巡訪統計：混合中英文與多行', () => {
  const input = 'Hello World!\n你好世界 123\n\nFinal Line.';
  const stats = computeTextStatistics(input);

  assert.equal(stats.totalChars, input.length);
  assert.equal(stats.totalLines, 4);
  assert.equal(stats.chineseChars, 4); // 你好世界
  assert.equal(stats.englishWords, 4); // Hello, World, Final, Line
  assert.equal(stats.totalCharsNoSpace, input.replace(/\s/g, '').length);
});

test('文字工具單次巡訪統計：大文字運算健全性與零崩潰驗證', () => {
  const largeChunk = '測試文章內容 Test 123 \n'.repeat(5000);
  const start = performance.now();
  const stats = computeTextStatistics(largeChunk);
  const duration = performance.now() - start;

  assert.equal(stats.totalLines, 5001);
  assert.equal(stats.chineseChars, 6 * 5000);
  assert.equal(stats.englishWords, 1 * 5000);
  assert.ok(duration < 50, `10 萬字大文字統計運算應在 50ms 內完成，實際耗時: ${duration}ms`);
});

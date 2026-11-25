import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeNewlines,
  getDiffLines,
  computeDiffAnalysis,
  buildMergedText,
} from '../../app/diff-checker/engine.ts';

test('normalizeNewlines / getDiffLines：正規化 CRLF 與尾部換行', () => {
  assert.equal(normalizeNewlines('a\r\nb\r\n\r\n'), 'a\nb\n');
  assert.equal(normalizeNewlines(''), '');
  assert.deepEqual(getDiffLines('a\nb\n'), ['a', 'b']);
});

test('computeDiffAnalysis：正確計算新增、刪除與配對 Split 列', () => {
  const res = computeDiffAnalysis('line1\noldLine\nline3', 'line1\nnewLine\nextraLine\nline3');
  assert.equal(res.removedCount, 1);
  assert.equal(res.addedCount, 2);
  assert.equal(res.splitRows.length, 4);
  assert.equal(res.splitRows[1].leftType, 'removed');
  assert.equal(res.splitRows[1].rightType, 'added');
  assert.equal(res.splitRows[2].leftType, 'empty');
  assert.equal(res.splitRows[2].rightType, 'added');
  assert.equal(res.mergedText, 'line1\nnewLine\nextraLine\nline3');
});

test('computeDiffAnalysis：ignoreCase 模式忽略大小寫差異', () => {
  const sensitive = computeDiffAnalysis('Hello World', 'hello world', { ignoreCase: false });
  assert.equal(sensitive.addedCount, 1);
  assert.equal(sensitive.removedCount, 1);

  const insensitive = computeDiffAnalysis('Hello World', 'hello world', { ignoreCase: true });
  assert.equal(insensitive.addedCount, 0);
  assert.equal(insensitive.removedCount, 0);
});

test('buildMergedText：切換 Unified 決策狀態後正確重建合併文本', () => {
  const res = computeDiffAnalysis('a\nb', 'a\nc');
  const toggled = res.unifiedDecisions.map((d) =>
    d.type === 'removed' ? { ...d, state: 'active' } : d.type === 'added' ? { ...d, state: 'skipped' } : d
  );
  assert.equal(buildMergedText(toggled), 'a\nb');
});

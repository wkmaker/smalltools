import test from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes } from '../../app/utils/formatBytes.ts';

test('formatBytes：0 顯示為 0 B，並依 1024 進位切換單位', () => {
  assert.equal(formatBytes(0), '0 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(1024 * 1024), '1 MB');
  assert.equal(formatBytes(1024 * 1024 * 1024), '1 GB');
});

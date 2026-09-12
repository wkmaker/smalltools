import test from 'node:test';
import assert from 'node:assert/strict';
import { randomToken } from '../../app/utils/randomToken.ts';

test('randomToken：輸出不超過指定長度的英數字元字串（Math.random() 極少數情況下 base36 表示較短，屬既有行為)', () => {
  for (let i = 0; i < 200; i++) {
    const token = randomToken(6);
    assert.ok(token.length <= 6);
    assert.match(token, /^[0-9a-z]*$/);
  }
});

test('randomToken：預設長度為 6', () => {
  assert.ok(randomToken().length <= 6);
});

test('randomToken：多次呼叫幾乎不會重複（碰撞率極低的健全性檢查）', () => {
  const tokens = new Set();
  for (let i = 0; i < 1000; i++) {
    tokens.add(randomToken(8));
  }
  assert.ok(tokens.size > 990);
});

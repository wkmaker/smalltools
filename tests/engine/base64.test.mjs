import test from 'node:test';
import assert from 'node:assert/strict';
import {
  utf8ToB64,
  b64ToUtf8,
  encodeBase64Text,
  decodeBase64Text,
  extractRawBase64FromDataUrl,
} from '../../app/base64/engine.ts';

test('utf8ToB64 / b64ToUtf8：繁體中文與多字節 Unicode 往返無亂碼', () => {
  const text = 'Smalltools 線上工具庫 — 測試中文與符號 ★☆';
  const encoded = utf8ToB64(text);
  assert.equal(b64ToUtf8(encoded), text);
});

test('encodeBase64Text / decodeBase64Text：URL-Safe 與 RFC 2045 76 字元換行正確往返', () => {
  const sample = 'subjects?_d=1&data=' + 'A'.repeat(120) + '中文測試';
  const urlSafeEncoded = encodeBase64Text(sample, { encoding: 'UTF-8', urlSafe: true });
  assert.ok(!urlSafeEncoded.includes('+'));
  assert.ok(!urlSafeEncoded.includes('/'));
  assert.ok(!urlSafeEncoded.includes('='));
  assert.equal(decodeBase64Text(urlSafeEncoded, 'UTF-8'), sample);

  const wrapped = encodeBase64Text(sample, { encoding: 'UTF-8', rfc2045: true });
  const lines = wrapped.split('\n');
  assert.ok(lines.length > 1);
  assert.ok(lines.slice(0, -1).every((line) => line.length === 76));
  assert.equal(decodeBase64Text(wrapped, 'UTF-8'), sample);
});

test('decodeBase64Text：無效 Base64 字串應拋出錯誤', () => {
  assert.throws(() => decodeBase64Text('!!!invalid-base64!!!', 'UTF-8'));
});

test('extractRawBase64FromDataUrl：正確擷取逗號後酬載，異常格式安全回傳空字串', () => {
  assert.equal(extractRawBase64FromDataUrl('data:text/plain;base64,SGVsbG8='), 'SGVsbG8=');
  assert.equal(extractRawBase64FromDataUrl('invalid-no-comma'), '');
  assert.equal(extractRawBase64FromDataUrl(''), '');
});

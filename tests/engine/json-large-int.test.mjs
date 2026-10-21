import test from 'node:test';
import assert from 'node:assert/strict';
import { detectUnsafeLargeIntegers } from '../../app/json/engine.ts';

test('JSON 大整數偵測：未超過安全整數範圍時回傳 false', () => {
  const json1 = JSON.stringify({ id: 123456789, name: 'test', count: 9007199254740991 });
  assert.equal(detectUnsafeLargeIntegers(json1), false);

  const json2 = '{"id": 42, "items": [1, 2, 3]}';
  assert.equal(detectUnsafeLargeIntegers(json2), false);
});

test('JSON 大整數偵測：字串內的 64 位元 ID 不應被誤判', () => {
  const json = JSON.stringify({ id: "1848529572918501376", orderNo: "9223372036854775807" });
  assert.equal(detectUnsafeLargeIntegers(json), false);
});

test('JSON 大整數偵測：未加引號之 64-bit Snowflake ID (超過 2^53 - 1) 應準確命中', () => {
  const jsonWithSnowflake = '{"id": 1848529572918501376, "name": "alice"}';
  assert.equal(detectUnsafeLargeIntegers(jsonWithSnowflake), true);

  const jsonInArray = '{"list": [100, 1848529572918501376]}';
  assert.equal(detectUnsafeLargeIntegers(jsonInArray), true);

  const jsonNegative = '{"id": -1848529572918501376}';
  assert.equal(detectUnsafeLargeIntegers(jsonNegative), true);
});

test('JSON 大整數偵測：空字串或非法輸入安全回傳 false', () => {
  assert.equal(detectUnsafeLargeIntegers(''), false);
  assert.equal(detectUnsafeLargeIntegers(null), false);
  assert.equal(detectUnsafeLargeIntegers(undefined), false);
});

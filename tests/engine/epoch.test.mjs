import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatInTimezone,
  getTimezoneAbbreviation,
  getGmtOffsetString,
  formatInOffset,
  convertDateTimeToTimestampByOffset,
  parseTimestampToDate,
  convertDateToTimestamp,
} from '../../app/epoch/engine.ts';

const WEEK_DAYS = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'];

test('formatInTimezone：同一時間點在不同時區呈現不同在地時間', () => {
  // 2026-01-01 00:00:00 UTC
  const d = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
  assert.equal(formatInTimezone(d, 'Etc/UTC'), '2026-01-01 00:00:00.000');
  assert.equal(formatInTimezone(d, 'Asia/Taipei'), '2026-01-01 08:00:00.000');
});

test('getTimezoneAbbreviation / getGmtOffsetString：America/Los_Angeles 冬令與夏令時間縮寫不同', () => {
  const winter = new Date(Date.UTC(2026, 0, 15)); // 1 月：PST
  const summer = new Date(Date.UTC(2026, 6, 15)); // 7 月：PDT
  assert.equal(getTimezoneAbbreviation(winter, 'America/Los_Angeles'), 'PST');
  assert.equal(getTimezoneAbbreviation(summer, 'America/Los_Angeles'), 'PDT');
  assert.equal(getGmtOffsetString(winter, 'America/Los_Angeles'), 'GMT-08:00');
  assert.equal(getGmtOffsetString(summer, 'America/Los_Angeles'), 'GMT-07:00');
});

test('formatInOffset：以數值 UTC 偏移量格式化，不依賴 IANA 時區規則', () => {
  const d = new Date(Date.UTC(2026, 0, 1, 0, 0, 0));
  assert.equal(formatInOffset(d, 8), '2026-01-01 08:00:00.000');
  assert.equal(formatInOffset(d, -5), '2025-12-31 19:00:00.000');
});

test('convertDateTimeToTimestampByOffset：UTC+8 的日期時間反推回正確的 UTC 毫秒數', () => {
  const ms = convertDateTimeToTimestampByOffset('2026-01-01 08:00:00', 0, 8);
  assert.equal(ms, Date.UTC(2026, 0, 1, 0, 0, 0));
  assert.equal(convertDateTimeToTimestampByOffset('', 0, 8), null);
  assert.equal(convertDateTimeToTimestampByOffset('not-a-date', 0, 8), null);
});

test('parseTimestampToDate：10 位數自動判定為秒、13 位數判定為毫秒', () => {
  const secResult = parseTimestampToDate('1735689600', 'auto', 8, WEEK_DAYS);
  assert.equal(secResult.unit, 's');
  assert.equal(secResult.utcStr, '2025-01-01 00:00:00.000');

  const msResult = parseTimestampToDate('1735689600000', 'auto', 8, WEEK_DAYS);
  assert.equal(msResult.unit, 'ms');
  assert.equal(msResult.utcStr, '2025-01-01 00:00:00.000');
});

test('parseTimestampToDate：閏年與年度第幾天計算正確（2024 為閏年）', () => {
  // 2024-03-01 00:00:00 UTC -> 第 61 天 (1月31 + 2月29 + 1)
  const ts = Math.floor(Date.UTC(2024, 2, 1) / 1000).toString();
  const r = parseTimestampToDate(ts, 's', 0, WEEK_DAYS);
  assert.equal(r.year, 2024);
  assert.equal(r.isLeap, true);
});

test('parseTimestampToDate：空字串或非數字輸入回傳 null', () => {
  assert.equal(parseTimestampToDate('', 'auto', 8, WEEK_DAYS), null);
  assert.equal(parseTimestampToDate('abc', 'auto', 8, WEEK_DAYS), null);
});

test('convertDateToTimestamp：日期時間換算回秒與毫秒時間戳，並與 parseTimestampToDate 互為反函數', () => {
  const r = convertDateToTimestamp('2026-01-01 08:00:00', 0, 8);
  assert.equal(r.msEpoch, Date.UTC(2026, 0, 1, 0, 0, 0));
  assert.equal(r.secEpoch, r.msEpoch / 1000);

  const roundTrip = parseTimestampToDate(String(r.secEpoch), 's', 8, WEEK_DAYS);
  assert.equal(roundTrip.utcStr, '2026-01-01 00:00:00.000');
});

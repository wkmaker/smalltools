import test from 'node:test';
import assert from 'node:assert/strict';
import {
  markKick,
  getLastEpisodeStartTime,
  countEpisodes,
  evaluateVitality,
  sanitizeKickSessions,
  formatTimeMs,
  formatMinutesNumber,
  fillTemplate,
  calculateSevenDayAverage,
  COMBO_THRESHOLD_MS,
} from '../../app/kick-counter/engine.ts';

const MIN = 60 * 1000;
const SEC = 1000;

test('markKick correctly classifies continuous combo within 2 minutes', () => {
  const t0 = 100000;
  // 第一動：一定是有效首波
  const r1 = markKick(t0, null, '1');
  assert.equal(r1.isCombo, false);
  assert.equal(r1.gapFromPrevMs, null);

  // 45 秒後點第二動：連環踢
  const r2 = markKick(t0 + 45 * SEC, t0, '2');
  assert.equal(r2.isCombo, true);
  assert.equal(r2.gapFromPrevMs, 45 * SEC);

  // 1 分 59 秒後點第三動：依然在 2 分鐘門檻內，算連環踢
  const r3 = markKick(t0 + 119 * SEC, t0, '3');
  assert.equal(r3.isCombo, true);

  // 2 分 05 秒後點第四動：超過 2 分鐘，算新的一波獨立胎動
  const r4 = markKick(t0 + 125 * SEC, t0, '4');
  assert.equal(r4.isCombo, false);
});

test('countEpisodes accurately counts valid episodes vs combo kicks', () => {
  const records = [
    { id: '1', timestamp: 0, isCombo: false, gapFromPrevMs: null },
    { id: '2', timestamp: 30 * SEC, isCombo: true, gapFromPrevMs: 30 * SEC },
    { id: '3', timestamp: 50 * SEC, isCombo: true, gapFromPrevMs: 20 * SEC },
    { id: '4', timestamp: 3 * MIN, isCombo: false, gapFromPrevMs: 130 * SEC },
    { id: '5', timestamp: 6 * MIN, isCombo: false, gapFromPrevMs: 180 * SEC },
  ];
  const { validEpisodes, comboCount } = countEpisodes(records);
  assert.equal(validEpisodes, 3);
  assert.equal(comboCount, 2);
});

test('evaluateVitality compares against past median duration', () => {
  const pastSessions = [
    {
      id: 's1',
      mode: 'count10',
      startTime: 0,
      endTime: 25 * MIN,
      durationMs: 25 * MIN,
      records: [],
      validEpisodes: 10,
      totalKicks: 12,
      targetReached: true,
    },
    {
      id: 's2',
      mode: 'count10',
      startTime: 0,
      endTime: 30 * MIN,
      durationMs: 30 * MIN,
      records: [],
      validEpisodes: 10,
      totalKicks: 11,
      targetReached: true,
    },
    {
      id: 's3',
      mode: 'count10',
      startTime: 0,
      endTime: 20 * MIN,
      durationMs: 20 * MIN,
      records: [],
      validEpisodes: 10,
      totalKicks: 10,
      targetReached: true,
    },
  ];
  // 過去中位數為 25 分鐘

  // 今日 24 分鐘達標：持平穩定
  const resSteady = evaluateVitality(24 * MIN, true, pastSessions);
  assert.equal(resSteady.medianDurationMs, 25 * MIN);
  assert.equal(resSteady.status, 'steady');

  // 今日 15 分鐘達標：活潑敏捷 (ratio = 0.6 <= 0.75)
  const resActive = evaluateVitality(15 * MIN, true, pastSessions);
  assert.equal(resActive.status, 'active');

  // 今日花費 45 分鐘達標：明顯偏慢 (ratio = 1.8 >= 1.5)
  const resSlower = evaluateVitality(45 * MIN, true, pastSessions);
  assert.equal(resSlower.status, 'slower');

  // 測量超過 90 分鐘仍未達標：警訊提示
  const resWarn = evaluateVitality(95 * MIN, false, pastSessions);
  assert.equal(resWarn.status, 'warning');
});

test('sanitizeKickSessions filters corrupted inputs and preserves order', () => {
  const dirty = [
    { id: 'good', mode: 'count10', startTime: 100, endTime: 200, validEpisodes: 1, totalKicks: 1 },
    { id: 'bad-mode', mode: 'random', startTime: 100, endTime: 200 },
    null,
    123,
    { id: 'good2', mode: 'timed1h', startTime: 500, endTime: 600, validEpisodes: 2, totalKicks: 3 },
  ];
  const cleaned = sanitizeKickSessions(dirty);
  assert.equal(cleaned.length, 2);
  assert.equal(cleaned[0].id, 'good2'); // sorted desc by startTime
  assert.equal(cleaned[1].id, 'good');
});

test('formatters and seven-day average', () => {
  assert.equal(formatTimeMs(65 * SEC), '01:05');
  assert.equal(formatTimeMs(125 * SEC), '02:05');
  assert.equal(formatMinutesNumber(150 * SEC), 2.5);
  assert.equal(fillTemplate('Hello {name}', { name: 'Baby' }), 'Hello Baby');
});

test('calculateSevenDayAverage accurately computes average of past 7 days', () => {
  const now = 1000000000;
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const history = [
    // 昨天 (20 分鐘)
    { id: '1', mode: 'count10', targetReached: true, startTime: now - 1 * ONE_DAY, durationMs: 20 * MIN },
    // 3 天前 (30 分鐘)
    { id: '2', mode: 'count10', targetReached: true, startTime: now - 3 * ONE_DAY, durationMs: 30 * MIN },
    // 9 天前 (超過 7 天，不應計入)
    { id: '3', mode: 'count10', targetReached: true, startTime: now - 9 * ONE_DAY, durationMs: 50 * MIN },
  ];
  // 過去 7 天內平均 = (20 + 30) / 2 = 25 分鐘，涵蓋 2 天紀錄
  const res = calculateSevenDayAverage(history, now);
  assert.equal(res?.averageMinutes, 25);
  assert.equal(res?.daysCount, 2);
  assert.equal(res?.sessionCount, 2);
});

test('getLastEpisodeStartTime finds the start timestamp of current episode', () => {
  assert.equal(getLastEpisodeStartTime([]), null);
  const records = [
    { id: '1', timestamp: 1000, isCombo: false, gapFromPrevMs: null },
    { id: '2', timestamp: 2000, isCombo: true, gapFromPrevMs: 1000 },
    { id: '3', timestamp: 3000, isCombo: true, gapFromPrevMs: 1000 },
  ];
  assert.equal(getLastEpisodeStartTime(records), 1000);

  records.push({ id: '4', timestamp: 130000, isCombo: false, gapFromPrevMs: 127000 });
  records.push({ id: '5', timestamp: 140000, isCombo: true, gapFromPrevMs: 10000 });
  assert.equal(getLastEpisodeStartTime(records), 130000);
});

test('markKick with lastEpisodeStartTime prevents infinite rolling combo chain (寶寶每 90 秒來一拳)', () => {
  const records = [];
  const t0 = 0;
  const GAP_90S = 90 * SEC;

  // 模擬每 90 秒點一次，連續點擊 19 次（總耗時 27 分鐘）
  for (let i = 0; i < 19; i++) {
    const current = t0 + i * GAP_90S;
    const lastRecord = records[records.length - 1];
    const lastTime = lastRecord ? lastRecord.timestamp : null;
    const lastEpisodeStartTime = getLastEpisodeStartTime(records);
    const kick = markKick(current, lastTime, `k-${i}`, lastEpisodeStartTime);
    records.push(kick);
  }

  // 驗證第 1 拳 (0s): 獨立有效首動 (Episode 1)
  assert.equal(records[0].isCombo, false);
  // 第 2 拳 (90s): 距離首動 90s < 120s，為連環踢 (Combo)
  assert.equal(records[1].isCombo, true);
  // 第 3 拳 (180s = 3m): 距離首動 180s >= 120s，單波上限觸發，自動結算為新一波 (Episode 2)
  assert.equal(records[2].isCombo, false);
  // 第 4 拳 (270s = 4.5m): 距離 Episode 2 起點 90s < 120s，為連環踢
  assert.equal(records[3].isCombo, true);
  // 第 5 拳 (360s = 6m): 距離 Episode 2 起點 180s >= 120s，自動開啟新一波 (Episode 3)
  assert.equal(records[4].isCombo, false);

  const { validEpisodes, comboCount } = countEpisodes(records);
  // 19 拳中應順利累計 10 波有效胎動與 9 次連環踢，成功於 27 分鐘達標，絕不超時卡死
  assert.equal(validEpisodes, 10);
  assert.equal(comboCount, 9);
});

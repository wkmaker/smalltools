import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeContractions,
  buildChartPoints,
  classifyContraction,
  classifyRegularity,
  coefficientOfVariation,
  currentSegment,
  fillTemplate,
  findPatternStartIndex,
  formatClock,
  formatHours,
  formatMinutes,
  isIntervalWithinTolerance,
  isDurationWithinTolerance,
  median,
  pruneOld,
  sanitizeContractions,
  RETENTION_MS,
} from '../../app/contraction-timer/engine.ts';

const MIN = 60 * 1000;
const SEC = 1000;
const T0 = Date.UTC(2026, 9, 18, 4, 0, 0);

/** 依「間隔（分鐘）」與「持續（秒）」序列產生紀錄 */
function build(intervalsMin, durationsSec, startAt = T0) {
  const list = [];
  let t = startAt;
  durationsSec.forEach((d, i) => {
    if (i > 0) t += intervalsMin[i - 1] * MIN;
    list.push({ id: `c${i}`, start: t, end: t + d * SEC });
  });
  return list;
}

test('median handles odd, even and empty arrays', () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([]), 0);
});

test('coefficientOfVariation is 0 for identical intervals', () => {
  assert.equal(coefficientOfVariation([5, 5, 5]), 0);
  assert.ok(coefficientOfVariation([2, 8]) > 0.5);
});

test('classifyRegularity thresholds', () => {
  assert.equal(classifyRegularity(0.1), 'regular');
  assert.equal(classifyRegularity(0.2), 'regular');
  assert.equal(classifyRegularity(0.3), 'fair');
  assert.equal(classifyRegularity(0.5), 'irregular');
});

test('classifyContraction flags mis-press and forgotten stop', () => {
  assert.equal(classifyContraction({ id: 'a', start: 0, end: 5 * SEC }), 'tooShort');
  assert.equal(classifyContraction({ id: 'a', start: 0, end: 60 * SEC }), 'ok');
  assert.equal(classifyContraction({ id: 'a', start: 0, end: 4 * MIN }), 'tooLong');
});

test('tolerance uses the wider of ratio and absolute minimum', () => {
  // 4 分鐘：25% = 1 分鐘，最低 1.5 分鐘 → 允許 5.5 分鐘
  assert.ok(isIntervalWithinTolerance(5.5 * MIN, 4 * MIN));
  assert.ok(!isIntervalWithinTolerance(5.6 * MIN, 4 * MIN));
  // 20 分鐘：25% = 5 分鐘
  assert.ok(isIntervalWithinTolerance(25 * MIN, 20 * MIN));
  // 持續 40 秒：30% = 12 秒，最低 15 秒 → 允許 55 秒
  assert.ok(isDurationWithinTolerance(55 * SEC, 40 * SEC));
  assert.ok(!isDurationWithinTolerance(56 * SEC, 40 * SEC));
});

test('pruneOld removes records older than 6 hours and sorts', () => {
  const now = T0 + RETENTION_MS + 10 * MIN;
  const list = [
    { id: 'b', start: T0 + 20 * MIN, end: T0 + 21 * MIN },
    { id: 'a', start: T0, end: T0 + MIN },
  ];
  const result = pruneOld(list, now);
  assert.deepEqual(result.map((c) => c.id), ['b']);
});

test('sanitizeContractions drops malformed entries', () => {
  const result = sanitizeContractions([
    { id: 'ok', start: 1, end: 2 },
    { id: 'bad', start: 5, end: 1 },
    { id: 3, start: 1, end: 2 },
    null,
    'x',
  ]);
  assert.deepEqual(result.map((c) => c.id), ['ok']);
  assert.deepEqual(sanitizeContractions('nope'), []);
});

test('currentSegment splits on gaps longer than 30 minutes', () => {
  const list = build([5, 40, 5, 5], [60, 60, 60, 60, 60]);
  assert.deepEqual(currentSegment(list).map((c) => c.id), ['c2', 'c3', 'c4']);
});

test('fewer than 3 contractions is not ready', () => {
  const list = build([5], [60, 60]);
  const stats = analyzeContractions(list, list[1].end);
  assert.equal(stats.ready, false);
  assert.equal(stats.windowCount, 2);
});

test('steady 5-minute / 60-second pattern over one hour', () => {
  const intervals = Array(12).fill(5);
  const durations = Array(13).fill(60);
  const list = build(intervals, durations);
  const now = list.at(-1).end;
  const stats = analyzeContractions(list, now);
  assert.equal(stats.ready, true);
  assert.equal(stats.windowFull, true);
  assert.equal(stats.medianIntervalMs, 5 * MIN);
  assert.equal(stats.medianDurationMs, 60 * SEC);
  assert.equal(stats.regularity, 'regular');
  assert.equal(stats.patternDurationMs, 60 * MIN);
  assert.equal(stats.intervalTrend, 'steady');
  assert.equal(stats.durationTrend, 'steady');
});

test('median resists a single missed press', () => {
  // 第 3 個間隔因漏按變成 10 分鐘
  const list = build([5, 5, 10, 5], [60, 60, 60, 60, 60]);
  const stats = analyzeContractions(list, list.at(-1).end);
  assert.equal(stats.medianIntervalMs, 5 * MIN);
});

test('pattern start tolerates one outlier but stops at two', () => {
  // 早期 15 分鐘一次 → 中間一次離群 → 之後穩定 5 分鐘
  const list = build([15, 15, 15, 5, 12, 5, 5, 5], Array(9).fill(60));
  const segment = currentSegment(list);
  const idx = findPatternStartIndex(segment, 5 * MIN, 60 * SEC);
  // 從 c8 往回：c8,c7,c6 符合；c5（12 分鐘）離群容許；c4（5 分鐘）符合 → 起點 c3
  assert.equal(segment[idx].id, 'c3');
});

test('pattern duration is null when irregular', () => {
  const list = build([2, 12, 3, 15], [60, 60, 60, 60, 60]);
  const stats = analyzeContractions(list, list.at(-1).end);
  assert.equal(stats.regularity, 'irregular');
  assert.equal(stats.patternDurationMs, null);
});

test('trend detects contractions getting closer and longer', () => {
  const intervals = [10, 10, 10, 10, 10, 5, 5, 5, 5];
  const durations = [40, 40, 40, 40, 40, 70, 70, 70, 70, 70];
  const list = build(intervals, durations);
  const stats = analyzeContractions(list, list.at(-1).end);
  assert.equal(stats.intervalTrend, 'closer');
  assert.equal(stats.durationTrend, 'longer');
});

test('mis-pressed records are excluded from statistics', () => {
  const list = build([5, 5, 5, 5], [60, 60, 60, 60, 60]);
  list.push({ id: 'miss', start: list.at(-1).start + 2 * MIN, end: list.at(-1).start + 2 * MIN + 3 * SEC });
  const stats = analyzeContractions(list, list.at(-1).end);
  assert.equal(stats.medianIntervalMs, 5 * MIN);
});

test('counts in last hour and last 10 minutes', () => {
  const list = build(Array(14).fill(5), Array(15).fill(60));
  const now = list.at(-1).end;
  const stats = analyzeContractions(list, now);
  // now = 最後一次開始 + 60 秒；往回 60 分鐘涵蓋 12 次、往回 10 分鐘涵蓋 2 次
  assert.equal(stats.countLastHour, 12);
  assert.equal(stats.countLast10Min, 2);
});

test('buildChartPoints resets interval after a break', () => {
  const list = build([5, 40, 5], [60, 60, 60, 60]);
  const points = buildChartPoints(list, list.at(-1).end);
  assert.deepEqual(points.map((p) => p.intervalMin), [null, 5, null, 5]);
});

test('formatters', () => {
  assert.equal(formatMinutes(5 * MIN), '5');
  assert.equal(formatMinutes(5.25 * MIN), '5.3');
  assert.equal(formatHours(72 * MIN), '1.2');
  assert.equal(formatClock(75 * SEC), '01:15');
  assert.equal(fillTemplate('{a} 分 {b}', { a: 5, b: 'x' }), '5 分 x');
  assert.equal(fillTemplate('{missing}', {}), '{missing}');
});

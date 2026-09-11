import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDueDate,
  calculateGestationalAge,
  calculateMaternityBenefits,
  crlToGestationalAge,
  parseYmd,
  formatDate,
  addDays,
} from '../../app/pregnancy-calculator/engine.ts';

const baseDue = {
  calcMode: 'lmp',
  lmpDate: '2026-01-01',
  cycleDays: 28,
  eddDateInput: '',
  fallbackDate: '2026-01-01',
  scanDate: '2026-03-01',
  scanInputType: 'weeks',
  scanWeeks: 12,
  scanDays: 0,
  crlValue: 45,
  ivfDate: '2026-02-01',
  ivfType: 'd5',
};

test('LMP 模式：奈格爾法則 280 天，週期非 28 天時等量位移', () => {
  const r = calculateDueDate(baseDue);
  assert.equal(formatDate(r.estimatedDueDate), formatDate(addDays(parseYmd('2026-01-01'), 280)));
  assert.equal(formatDate(r.conceptionDate), formatDate(addDays(parseYmd('2026-01-01'), 14)));

  const r35 = calculateDueDate({ ...baseDue, cycleDays: 35 });
  assert.equal(formatDate(r35.estimatedDueDate), formatDate(addDays(parseYmd('2026-01-01'), 280 + 7)));
  assert.equal(formatDate(r35.conceptionDate), formatDate(addDays(parseYmd('2026-01-01'), 14 + 7)));
});

test('EDD 模式：直接採用輸入預產期，受孕日回推 266 天', () => {
  const r = calculateDueDate({ ...baseDue, calcMode: 'edd', eddDateInput: '2026-10-08' });
  assert.equal(formatDate(r.estimatedDueDate), '2026-10-08');
  assert.equal(formatDate(r.conceptionDate), formatDate(addDays(parseYmd('2026-10-08'), -266)));
});

test('超音波模式：EDD = 檢查日 + (280 − 已懷孕天數)', () => {
  const r = calculateDueDate({ ...baseDue, calcMode: 'ultrasound', scanDate: '2026-04-01', scanWeeks: 10, scanDays: 3 });
  const scanDays = 10 * 7 + 3;
  assert.equal(formatDate(r.estimatedDueDate), formatDate(addDays(parseYmd('2026-04-01'), 280 - scanDays)));
});

test('超音波模式（CRL）：以 Hadlock 公式換算天數', () => {
  const crl = crlToGestationalAge(45);
  const r = calculateDueDate({ ...baseDue, calcMode: 'ultrasound', scanDate: '2026-04-01', scanInputType: 'crl', crlValue: 45 });
  assert.equal(formatDate(r.estimatedDueDate), formatDate(addDays(parseYmd('2026-04-01'), 280 - crl.totalDays)));
});

test('IVF 模式：D5 / D3 / 取卵 各自對應 261 / 263 / 266 天', () => {
  const d5 = calculateDueDate({ ...baseDue, calcMode: 'ivf', ivfDate: '2026-02-10', ivfType: 'd5' });
  const d3 = calculateDueDate({ ...baseDue, calcMode: 'ivf', ivfDate: '2026-02-10', ivfType: 'd3' });
  const egg = calculateDueDate({ ...baseDue, calcMode: 'ivf', ivfDate: '2026-02-10', ivfType: 'egg' });
  assert.equal(formatDate(d5.estimatedDueDate), formatDate(addDays(parseYmd('2026-02-10'), 261)));
  assert.equal(formatDate(d3.estimatedDueDate), formatDate(addDays(parseYmd('2026-02-10'), 263)));
  assert.equal(formatDate(egg.estimatedDueDate), formatDate(addDays(parseYmd('2026-02-10'), 266)));
});

test('CRL 換算：Hadlock 公式，結果夾在 35 ~ 110 天之間', () => {
  const hadlock = crl => Math.round(52.37 + 1.315 * crl - 0.0022 * crl * crl);
  assert.deepEqual(crlToGestationalAge(''), { totalDays: 84, weeks: 12, days: 0 });
  assert.deepEqual(crlToGestationalAge(0), { totalDays: 84, weeks: 12, days: 0 });
  for (const crl of [10, 25, 40, 45]) {
    const r = crlToGestationalAge(crl);
    assert.equal(r.totalDays, hadlock(crl), `CRL=${crl}`);
    assert.equal(r.weeks, Math.floor(r.totalDays / 7));
    assert.equal(r.days, r.totalDays % 7);
    assert.ok(r.totalDays >= 35 && r.totalDays <= 110);
  }
  assert.equal(crlToGestationalAge(50).totalDays, 110); // hadlock(50)=113 → 夾至上限 110
  assert.equal(crlToGestationalAge(200).totalDays, 110);
});

test('當前週數：以注入的今天回推，孕期分段正確', () => {
  const edd = parseYmd('2026-10-08');
  // 距 EDD 剛好 140 天（懷孕 20 週 0 天）
  const today = addDays(edd, -140);
  const g = calculateGestationalAge(edd, today);
  assert.equal(g.currentGestationalDays, 140);
  assert.equal(g.currentWeeks, 20);
  assert.equal(g.currentDays, 0);
  assert.equal(g.daysRemaining, 140);
  assert.equal(g.progressPercent, 50);
  assert.equal(g.trimesterIndex, 2);

  assert.equal(calculateGestationalAge(edd, addDays(edd, -200)).trimesterIndex, 1); // 約 11 週
  assert.equal(calculateGestationalAge(edd, addDays(edd, -30)).trimesterIndex, 3); // 約 35 週
});

test('當前週數：EDD 已過或尚早時夾在 0 ~ 300 天', () => {
  const edd = parseYmd('2026-10-08');
  assert.equal(calculateGestationalAge(edd, addDays(edd, -400)).currentGestationalDays, 0);
  assert.equal(calculateGestationalAge(edd, addDays(edd, 60)).currentGestationalDays, 300);
});

test('產假：8 週 56 天連續曆天，復職日為結束隔日', () => {
  const edd = parseYmd('2026-10-08');
  const b = calculateMaternityBenefits(edd, 2, 45800);
  assert.equal(formatDate(b.leaveStart), formatDate(addDays(edd, -14)));
  assert.equal(formatDate(b.leaveEnd), formatDate(addDays(b.leaveStart, 55)));
  assert.equal(formatDate(b.returnDate), formatDate(addDays(b.leaveEnd, 1)));
  // 產假區間含頭尾為 56 天
  assert.equal(Math.round((b.leaveEnd.getTime() - b.leaveStart.getTime()) / 86400000) + 1, 56);
});

test('津貼：勞保生育給付 = 2 個月投保薪資；育嬰留停 8 成薪 × 6 個月', () => {
  const edd = parseYmd('2026-10-08');
  const b = calculateMaternityBenefits(edd, 4, 45800);
  assert.equal(b.laborBenefit, 45800 * 2);
  assert.equal(b.parentalAllowanceMonthly, Math.round(45800 * 0.8)); // 36640
  assert.equal(b.parentalAllowanceTotal, Math.round(45800 * 0.8) * 6);
});

test('津貼：未填月薪視為 0', () => {
  const b = calculateMaternityBenefits(parseYmd('2026-10-08'), 2, '');
  assert.equal(b.laborBenefit, 0);
  assert.equal(b.parentalAllowanceMonthly, 0);
  assert.equal(b.parentalAllowanceTotal, 0);
});

test('時區安全：YYYY-MM-DD 以本地零時解析', () => {
  const d = parseYmd('2026-08-15');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 7);
  assert.equal(d.getDate(), 15);
  assert.equal(d.getHours(), 0);
});

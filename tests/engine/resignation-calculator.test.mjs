import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateResignation,
  getLegalNoticeDays,
  getStatutoryAnnualLeave,
  formatDateStr,
  parseYmd,
} from '../../app/resignation-calculator/engine.ts';

const baseInput = {
  calcDirection: 'noticeToLast',
  onboardingDate: '2024-01-01',
  noticeDate: '2026-06-01',
  targetLastWorkingDate: '2026-07-01',
  noticeMode: 'auto',
  customDays: 20,
  annualLeaveDays: 0,
  leaveDaysToTake: 0,
  officeDayMode: 'autoLeaveEnd',
  customOfficeDate: '',
  monthlySalary: 60000,
  today: '2026-05-01',
};

test('勞基法第 16 條法定預告天數級距', () => {
  assert.equal(getLegalNoticeDays(0), 0);
  assert.equal(getLegalNoticeDays(89), 0);
  assert.equal(getLegalNoticeDays(90), 10);
  assert.equal(getLegalNoticeDays(364), 10);
  assert.equal(getLegalNoticeDays(365), 20);
  assert.equal(getLegalNoticeDays(365 * 3 - 1), 20);
  assert.equal(getLegalNoticeDays(365 * 3), 30);
});

test('勞基法第 38 條法定特休天數級距', () => {
  assert.equal(getStatutoryAnnualLeave(181, 0), 0);
  assert.equal(getStatutoryAnnualLeave(182, 0), 3);
  assert.equal(getStatutoryAnnualLeave(365, 1), 7);
  assert.equal(getStatutoryAnnualLeave(365 * 2, 2), 10);
  assert.equal(getStatutoryAnnualLeave(365 * 3, 3), 14);
  assert.equal(getStatutoryAnnualLeave(365 * 5, 5), 15);
  assert.equal(getStatutoryAnnualLeave(365 * 11, 11), 17);
  assert.equal(getStatutoryAnnualLeave(365 * 40, 40), 30);
});

test('正向推算：提出日 + 法定預告天數 = 最後在職日；生效日 = 最後在職日 + 1', () => {
  const r = calculateResignation(baseInput);
  assert.equal(r.requiredNoticeDays, 20); // 年資 2 年多 → 20 天
  assert.equal(formatDateStr(r.calculatedNoticeDate), '2026-06-01');
  assert.equal(formatDateStr(r.noticeStartDate), '2026-06-02'); // 告知之次日
  assert.equal(formatDateStr(r.calculatedLastWorkingDate), '2026-06-21');
  assert.equal(formatDateStr(r.effectiveDate), '2026-06-22');
  assert.equal(r.noticeDiffDays, 20);
  assert.equal(r.isPeriodSufficient, true);
});

test('反向推算：目標最後在職日 − 法定預告天數 = 最晚提出日', () => {
  const r = calculateResignation({
    ...baseInput,
    calcDirection: 'lastToNotice',
    targetLastWorkingDate: '2026-06-21',
  });
  assert.equal(r.requiredNoticeDays, 20);
  assert.equal(formatDateStr(r.calculatedNoticeDate), '2026-06-01');
  assert.equal(formatDateStr(r.calculatedLastWorkingDate), '2026-06-21');
  assert.equal(formatDateStr(r.effectiveDate), '2026-06-22');
});

test('自訂預告天數覆蓋法定值', () => {
  const r = calculateResignation({ ...baseInput, noticeMode: 'custom', customDays: 45 });
  assert.equal(r.requiredNoticeDays, 45);
  assert.equal(formatDateStr(r.calculatedLastWorkingDate), '2026-07-16'); // 2026-06-01 + 45
});

test('試用期（未滿 3 個月）：法定預告 0 天，最後在職日 = 提出日', () => {
  const r = calculateResignation({
    ...baseInput,
    onboardingDate: '2026-04-15',
    noticeDate: '2026-06-01',
  });
  assert.equal(r.requiredNoticeDays, 0);
  assert.equal(formatDateStr(r.calculatedLastWorkingDate), '2026-06-01');
  assert.equal(formatDateStr(r.effectiveDate), '2026-06-02');
});

test('提出日在過去且距最後在職日不足法定天數 → 標記逾期', () => {
  const r = calculateResignation({
    ...baseInput,
    noticeDate: '2026-04-20', // 早於 today 2026-05-01
    today: '2026-05-01',
  });
  assert.equal(r.isNoticeInPast, true);
  // last working = 2026-04-20 + 20 = 2026-05-10 → 距今僅 9 天 < 20
  assert.equal(formatDateStr(r.calculatedLastWorkingDate), '2026-05-10');
  assert.equal(r.daysRemainingFromToday, 9);
  assert.equal(r.isNoticeOverdueFromToday, true);
  assert.equal(r.missingDaysFromToday, 11);
});

test('特休折現：預告期排不完的特休全數折算，代金 = 日均薪 × 折現天數', () => {
  const r = calculateResignation({
    ...baseInput,
    annualLeaveDays: 14,
    leaveDaysToTake: 14,
    monthlySalary: 60000,
  });
  // 預告期 2026-06-01 → 06-21，工作天數上限有限，排不完者折現
  assert.ok(r.actualTakeLeaveDays <= r.maxTakeableLeaveDays);
  assert.equal(r.payoutDaysTotal, 14 - r.actualTakeLeaveDays);
  assert.equal(r.dailyAvgSalary, 2000); // round(60000 / 30)
  assert.equal(r.estimatedLeavePayout, 2000 * r.payoutDaysTotal);
});

test('謀職假：每滿一週 2 天（無條件進位）', () => {
  assert.equal(calculateResignation({ ...baseInput, noticeMode: 'custom', customDays: 10 }).maxJobSeekingLeaveDays, 4);
  assert.equal(calculateResignation({ ...baseInput, noticeMode: 'custom', customDays: 20 }).maxJobSeekingLeaveDays, 6);
  assert.equal(calculateResignation({ ...baseInput, noticeMode: 'custom', customDays: 30 }).maxJobSeekingLeaveDays, 10);
});

test('時區安全：YYYY-MM-DD 以本地零時解析，不因 UTC 退一天', () => {
  const d = parseYmd('2026-08-15');
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 7);
  assert.equal(d.getDate(), 15);
  assert.equal(d.getHours(), 0);
});

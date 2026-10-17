import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateResignation,
  getLegalNoticeDays,
  getStatutoryAnnualLeave,
  formatDateStr,
  parseYmd,
  isNonWorkingDay,
} from '../../app/resignation-calculator/engine.ts';
import {
  generateResignationEmail,
  buildResignationIcsContent,
} from '../../app/resignation-calculator/icsExport.ts';
import { TRANSLATIONS } from '../../app/resignation-calculator/translations.ts';

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

test('台灣國定假日與補班日整合：2026-06-19 端午節跳過不扣特休，實際最後出勤日提前 1 天', () => {
  // 2026-06-01 ~ 2026-06-21 期間內，2026-06-19 (五) 為端午節國定假日
  const withHolidays = calculateResignation({
    ...baseInput,
    annualLeaveDays: 2,
    leaveDaysToTake: 2,
    useTaiwanHolidays: true,
  });
  const withoutHolidays = calculateResignation({
    ...baseInput,
    annualLeaveDays: 2,
    leaveDaysToTake: 2,
    useTaiwanHolidays: false,
  });

  assert.equal(withHolidays.holidaysInPeriod.length, 1);
  assert.equal(withHolidays.holidaysInPeriod[0].date, '2026-06-19');
  // 扣除端午節後，預告期可排休工作天減少 1 天
  assert.equal(withHolidays.maxTakeableLeaveDays, withoutHolidays.maxTakeableLeaveDays - 1);
  // 排休 2 天：不含國定假日時請 6/18、6/19，最後出勤為 6/17；含國定假日時 6/19 本就放假，請 6/17、6/18，最後出勤提前至 6/16！
  assert.equal(formatDateStr(withoutHolidays.actualOfficeDate), '2026-06-17');
  assert.equal(formatDateStr(withHolidays.actualOfficeDate), '2026-06-16');

  // 補班日（2025-02-08 週六）應視為工作日
  assert.equal(isNonWorkingDay(parseYmd('2025-02-08'), true), false);
});

test('非自願離職（資遣）：勞退新制第 12 條資遣費、上限 6 個月與預告工資試算', () => {
  // 年資正好滿 2 年（2024-06-22 到職，2026-06-21 最後在職日 → 2026-06-22 生效）→ 基數 1.0 個月
  const r2yr = calculateResignation({
    ...baseInput,
    onboardingDate: '2024-06-22',
    noticeDate: '2026-06-01',
    resignationType: 'involuntary',
    annualLeaveDays: 5,
    leaveDaysToTake: 0,
    monthlySalary: 60000,
    employerShortNoticeDays: 10,
  });
  assert.equal(r2yr.severanceMonths, 1);
  assert.equal(r2yr.estimatedSeverancePay, 60000);
  assert.equal(r2yr.estimatedNoticePay, 20000); // 10 天 × 2000
  assert.equal(r2yr.estimatedLeavePayout, 10000); // 5 天 × 2000
  assert.equal(r2yr.totalEstimatedPayout, 90000);

  // 年資 20 年 → 資遣費基數上限夾緊為 6 個月
  const r20yr = calculateResignation({
    ...baseInput,
    onboardingDate: '2004-01-01',
    resignationType: 'involuntary',
    monthlySalary: 50000,
  });
  assert.equal(r20yr.severanceMonths, 6);
  assert.equal(r20yr.estimatedSeverancePay, 300000);
});

test('互動式排休月曆自訂點選與週末順延洞察', () => {
  // 最後在職日落在週五 (2026-06-19)，應提示可順延至週日 (2026-06-21) 多領 2 天例假薪資
  const rFri = calculateResignation({
    ...baseInput,
    calcDirection: 'lastToNotice',
    targetLastWorkingDate: '2026-06-19',
    annualLeaveDays: 5,
    leaveDaysToTake: 2,
    customLeaveDates: ['2026-06-10', '2026-06-11'],
  });
  assert.equal(rFri.actualTakeLeaveDays, 2);
  assert.equal(rFri.payoutDaysTotal, 3);
  assert.equal(rFri.monthEndInsight.canExtendToSunday, true);
  assert.equal(rFri.monthEndInsight.sundayDateStr, '2026-06-21');
  assert.equal(rFri.monthEndInsight.extraWeekendDays, 2);
  assert.equal(rFri.monthEndInsight.extraWeekendSalary, 4000);
});

test('ICS 行事曆與多情境離職信產生器', () => {
  const r = calculateResignation(baseInput);
  const ics = buildResignationIcsContent({
    lang: 'zh-TW',
    calculatedNoticeDate: r.calculatedNoticeDate,
    actualOfficeDate: r.actualOfficeDate,
    calculatedLastWorkingDate: r.calculatedLastWorkingDate,
    effectiveDate: r.effectiveDate,
    requiredNoticeDays: r.requiredNoticeDays,
    actualTakeLeaveDays: r.actualTakeLeaveDays,
  });
  assert.ok(ics.includes('BEGIN:VCALENDAR'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20260601'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20260622'));

  const warmMail = generateResignationEmail({
    lang: 'zh-TW',
    variant: 'warm',
    senderName: '王小明',
    handoverPerson: '陳大華',
    tenureYears: r.tenureYears,
    tenureMonths: r.tenureMonths,
    requiredNoticeDays: r.requiredNoticeDays,
    calculatedNoticeDate: r.calculatedNoticeDate,
    noticeStartDate: r.noticeStartDate,
    calculatedLastWorkingDate: r.calculatedLastWorkingDate,
    actualOfficeDate: r.actualOfficeDate,
    effectiveDate: r.effectiveDate,
    actualTakeLeaveDays: r.actualTakeLeaveDays,
    payoutDaysTotal: r.payoutDaysTotal,
    estimatedLeavePayout: r.estimatedLeavePayout,
    estimatedSeverancePay: r.estimatedSeverancePay,
    maxJobSeekingLeaveDays: r.maxJobSeekingLeaveDays,
  });
  assert.ok(warmMail.includes('王小明'));
  assert.ok(warmMail.includes('陳大華'));
});

test('TRANSLATIONS 繁中與英文雙語鍵值 100% 對稱', () => {
  const zhKeys = Object.keys(TRANSLATIONS['zh-TW']).sort();
  const enKeys = Object.keys(TRANSLATIONS.en).sort();
  assert.deepEqual(zhKeys, enKeys);
  assert.equal(TRANSLATIONS['zh-TW'].faqItems.length, TRANSLATIONS.en.faqItems.length);
});

test('officeDayMode 為 lastWorkingDay 與 custom 時，月曆應正確標記特休且特休區間不反轉', () => {
  // 選擇最後在職日當天出勤（2026-06-18 週四為最後在職日，排休 2 天應排在 06-16、06-17，保留 06-18 出勤）
  const rLastDay = calculateResignation({
    ...baseInput,
    calcDirection: 'lastToNotice',
    targetLastWorkingDate: '2026-06-18',
    annualLeaveDays: 5,
    leaveDaysToTake: 2,
    officeDayMode: 'lastWorkingDay',
    useTaiwanHolidays: true,
  });

  assert.equal(formatDateStr(rLastDay.calculatedLastWorkingDate), '2026-06-18');
  assert.equal(formatDateStr(rLastDay.actualOfficeDate), '2026-06-18');
  const leaveCells = rLastDay.calendarDays.filter((c) => c.status === 'annualLeave');
  assert.equal(leaveCells.length, 2);
  assert.deepEqual(
    leaveCells.map((c) => c.dateStr),
    ['2026-06-16', '2026-06-17']
  );
  assert.ok(rLastDay.leaveStartDate && rLastDay.leaveEndDate);
  assert.equal(formatDateStr(rLastDay.leaveStartDate), '2026-06-16');
  assert.equal(formatDateStr(rLastDay.leaveEndDate), '2026-06-17');

  // 最後在職日（06-18）本身不可被標記為特休，且同時具備 isLastWorkingDate 與 isActualOfficeDate
  const lastDayCell = rLastDay.calendarDays.find((c) => c.dateStr === '2026-06-18');
  assert.ok(lastDayCell);
  assert.equal(lastDayCell.status, 'work');
  assert.equal(lastDayCell.isLastWorkingDate, true);
  assert.equal(lastDayCell.isActualOfficeDate, true);

  // 自訂最後出勤日若超過契約最後在職日（例如設定 2026-12-31），應自動夾緊為契約最後在職日（2026-06-21）
  const rCustomTooLate = calculateResignation({
    ...baseInput,
    officeDayMode: 'custom',
    customOfficeDate: '2026-12-31',
  });
  assert.equal(formatDateStr(rCustomTooLate.actualOfficeDate), '2026-06-21');

  // 自訂最後出勤日若早於提出預告日（例如設定 2026-01-01），應自動夾緊為提出預告日（2026-06-01）
  const rCustomTooEarly = calculateResignation({
    ...baseInput,
    officeDayMode: 'custom',
    customOfficeDate: '2026-01-01',
  });
  assert.equal(formatDateStr(rCustomTooEarly.actualOfficeDate), '2026-06-01');
});


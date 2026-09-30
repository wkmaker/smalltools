import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDueDate,
  calculateGestationalAge,
  calculateMaternityBenefits,
  crlToGestationalAge,
  getClinicalStageStatus,
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

test('臨床產檢階段與空檔期推算：覆蓋所有重大檢查期、空檔過渡期與極值', () => {
  // 1. 未滿 6 週 (如 4 週 2 天 = 30 天)
  const s4w = getClinicalStageStatus(30);
  assert.equal(s4w.statusType, 'pre_checkup');
  assert.equal(s4w.gapKey, 'pre_6');
  assert.equal(s4w.activeMilestoneIndex, null);
  assert.equal(s4w.nextMilestoneIndex, 0);
  assert.equal(s4w.daysToNextMilestone, 12); // 42 - 30

  // 2. 6~8 週 (如 7 週 0 天 = 49 天) -> 第一次產檢
  const s7w = getClinicalStageStatus(49);
  assert.equal(s7w.statusType, 'active_milestone');
  assert.equal(s7w.activeMilestoneIndex, 0);
  assert.equal(s7w.nextMilestoneIndex, 1);
  assert.equal(s7w.daysToNextMilestone, 28); // 77 - 49

  // 3. 空檔期 9~10 週 (如 9 週 3 天 = 66 天)
  const s9w = getClinicalStageStatus(66);
  assert.equal(s9w.statusType, 'stable_gap');
  assert.equal(s9w.gapKey, 'gap_9_10');
  assert.equal(s9w.activeMilestoneIndex, null);
  assert.equal(s9w.nextMilestoneIndex, 1);
  assert.equal(s9w.daysToNextMilestone, 11); // 77 - 66
  assert.equal(s9w.weeksToNextMilestone, 1);

  // 4. 11~13 週 (如 12 週 0 天 = 84 天) -> 初唐 / 頸部透明帶
  const s12w = getClinicalStageStatus(84);
  assert.equal(s12w.statusType, 'active_milestone');
  assert.equal(s12w.activeMilestoneIndex, 1);
  assert.equal(s12w.nextMilestoneIndex, 2);

  // 5. 空檔期 14~15 週 (如 14 週 5 天 = 103 天)
  const s14w = getClinicalStageStatus(103);
  assert.equal(s14w.statusType, 'stable_gap');
  assert.equal(s14w.gapKey, 'gap_14_15');
  assert.equal(s14w.activeMilestoneIndex, null);
  assert.equal(s14w.nextMilestoneIndex, 2);
  assert.equal(s14w.daysToNextMilestone, 9); // 112 - 103

  // 6. 16~19 週 (如 18 週 = 126 天) -> 羊膜穿刺
  const s18w = getClinicalStageStatus(126);
  assert.equal(s18w.statusType, 'active_milestone');
  assert.equal(s18w.activeMilestoneIndex, 2);
  assert.equal(s18w.nextMilestoneIndex, 3);

  // 7. 20~23 週 (如 22 週 = 154 天) -> 高層次超音波
  const s22w = getClinicalStageStatus(154);
  assert.equal(s22w.statusType, 'active_milestone');
  assert.equal(s22w.activeMilestoneIndex, 3);
  assert.equal(s22w.nextMilestoneIndex, 4);

  // 8. 24~27 週 (如 25 週 = 175 天) -> 喝糖水耐糖試驗
  const s25w = getClinicalStageStatus(175);
  assert.equal(s25w.statusType, 'active_milestone');
  assert.equal(s25w.activeMilestoneIndex, 4);
  assert.equal(s25w.nextMilestoneIndex, 5);

  // 9. 28~32 週 (如 30 週 = 210 天) -> 第三孕期例行產檢
  const s30w = getClinicalStageStatus(210);
  assert.equal(s30w.statusType, 'active_milestone');
  assert.equal(s30w.activeMilestoneIndex, 5);
  assert.equal(s30w.nextMilestoneIndex, 6);

  // 10. 空檔期 33~34 週 (如 33 週 4 天 = 235 天)
  const s33w = getClinicalStageStatus(235);
  assert.equal(s33w.statusType, 'stable_gap');
  assert.equal(s33w.gapKey, 'gap_33_34');
  assert.equal(s33w.activeMilestoneIndex, null);
  assert.equal(s33w.nextMilestoneIndex, 6);
  assert.equal(s33w.daysToNextMilestone, 10); // 245 - 235

  // 11. 35~36 週 (如 36 週 = 252 天) -> 乙型鏈球菌 GBS
  const s36w = getClinicalStageStatus(252);
  assert.equal(s36w.statusType, 'active_milestone');
  assert.equal(s36w.activeMilestoneIndex, 6);
  assert.equal(s36w.nextMilestoneIndex, 7);

  // 12. 37~40 週 (如 38 週 = 266 天) -> 足月生產
  const s38w = getClinicalStageStatus(266);
  assert.equal(s38w.statusType, 'active_milestone');
  assert.equal(s38w.activeMilestoneIndex, 7);
  assert.equal(s38w.nextMilestoneIndex, null);
  assert.equal(s38w.daysToNextMilestone, null);

  // 13. 超過 40 週 (如 41 週 = 287 天) -> 過期妊娠待產
  const s41w = getClinicalStageStatus(287);
  assert.equal(s41w.statusType, 'post_term');
  assert.equal(s41w.gapKey, 'post_40');
  assert.equal(s41w.activeMilestoneIndex, null);
  assert.equal(s41w.nextMilestoneIndex, null);
});


import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateDueDate,
  calculateGestationalAge,
  calculateMaternityBenefits,
  crlToGestationalAge,
  getClinicalStageStatus,
  CLINICAL_MILESTONE_DEFS,
  buildClinicalMilestones,
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

test('臨床產檢階段與空檔期推算：覆蓋 9 大產檢階段（5~8週至38~40週）、第 15 週過渡期與極值', () => {
  // 1. 未滿 5 週 (如 4 週 2 天 = 30 天)
  const s4w = getClinicalStageStatus(30);
  assert.equal(s4w.statusType, 'pre_checkup');
  assert.equal(s4w.gapKey, 'pre_5');
  assert.equal(s4w.activeMilestoneIndex, null);
  assert.equal(s4w.nextMilestoneIndex, 0);
  assert.equal(s4w.daysToNextMilestone, 5); // 35 - 30

  // 2. 5~7 週 (如 6 週 0 天 = 42 天) -> 階段 0：第一次產檢（確認著床與心跳 5~8週）
  const s6w = getClinicalStageStatus(42);
  assert.equal(s6w.statusType, 'active_milestone');
  assert.equal(s6w.activeMilestoneIndex, 0);
  assert.equal(s6w.nextMilestoneIndex, 1);
  assert.equal(s6w.daysToNextMilestone, 14); // 56 - 42

  // 3. 8~10 週 (如 9 週 3 天 = 66 天) -> 階段 1：第一次完整產檢（8~12週抽血與第一次公費超音波）
  const s9w = getClinicalStageStatus(66);
  assert.equal(s9w.statusType, 'active_milestone');
  assert.equal(s9w.activeMilestoneIndex, 1);
  assert.equal(s9w.nextMilestoneIndex, 2);
  assert.equal(s9w.daysToNextMilestone, 11); // 77 - 66
  assert.equal(s9w.weeksToNextMilestone, 1);

  // 4. 11~14 週 (如 12 週 0 天 = 84 天) -> 階段 2：初唐 / 頸部透明帶 / NIPT
  const s12w = getClinicalStageStatus(84);
  assert.equal(s12w.statusType, 'active_milestone');
  assert.equal(s12w.activeMilestoneIndex, 2);
  assert.equal(s12w.nextMilestoneIndex, 3);

  // 5. 空檔期第 15 週 (如 15 週 2 天 = 107 天)
  const s15w = getClinicalStageStatus(107);
  assert.equal(s15w.statusType, 'stable_gap');
  assert.equal(s15w.gapKey, 'gap_15');
  assert.equal(s15w.activeMilestoneIndex, null);
  assert.equal(s15w.nextMilestoneIndex, 3);
  assert.equal(s15w.daysToNextMilestone, 5); // 112 - 107

  // 6. 16~19 週 (如 18 週 = 126 天) -> 階段 3：第二孕期唐氏症篩檢與例行產檢
  const s18w = getClinicalStageStatus(126);
  assert.equal(s18w.statusType, 'active_milestone');
  assert.equal(s18w.activeMilestoneIndex, 3);
  assert.equal(s18w.nextMilestoneIndex, 4);

  // 7. 20~23 週 (如 22 週 = 154 天) -> 階段 4：高層次超音波 & 第二次公費超音波
  const s22w = getClinicalStageStatus(154);
  assert.equal(s22w.statusType, 'active_milestone');
  assert.equal(s22w.activeMilestoneIndex, 4);
  assert.equal(s22w.nextMilestoneIndex, 5);

  // 8. 24~27 週 (如 25 週 = 175 天) -> 階段 5：喝糖水耐糖試驗 & 貧血檢驗
  const s25w = getClinicalStageStatus(175);
  assert.equal(s25w.statusType, 'active_milestone');
  assert.equal(s25w.activeMilestoneIndex, 5);
  assert.equal(s25w.nextMilestoneIndex, 6);

  // 9. 28~32 週 (如 30 週 = 210 天) -> 階段 6：第三次公費超音波 & 胎位評估
  const s30w = getClinicalStageStatus(210);
  assert.equal(s30w.statusType, 'active_milestone');
  assert.equal(s30w.activeMilestoneIndex, 6);
  assert.equal(s30w.nextMilestoneIndex, 7);
  assert.equal(s30w.daysToNextMilestone, 21); // 231 - 210

  // 10. 33~37 週 (如 35 週 = 245 天) -> 階段 7：乙型鏈球菌 GBS 篩檢 & 生產方式確認
  const s35w = getClinicalStageStatus(245);
  assert.equal(s35w.statusType, 'active_milestone');
  assert.equal(s35w.activeMilestoneIndex, 7);
  assert.equal(s35w.nextMilestoneIndex, 8);
  assert.equal(s35w.daysToNextMilestone, 21); // 266 - 245

  // 11. 38~40 週 (如 39 週 = 273 天) -> 階段 8：足月每週產檢、胎音監測與內診
  const s39w = getClinicalStageStatus(273);
  assert.equal(s39w.statusType, 'active_milestone');
  assert.equal(s39w.activeMilestoneIndex, 8);
  assert.equal(s39w.nextMilestoneIndex, null);
  assert.equal(s39w.daysToNextMilestone, null);

  // 12. 超過 40 週 (如 41 週 = 287 天) -> 過期妊娠待產
  const s41w = getClinicalStageStatus(287);
  assert.equal(s41w.statusType, 'post_term');
  assert.equal(s41w.gapKey, 'post_40');
  assert.equal(s41w.activeMilestoneIndex, null);
  assert.equal(s41w.nextMilestoneIndex, null);
});

test('buildClinicalMilestones：完整產出 9 大階段結構化檢查項目與公費/自費標記', () => {
  assert.equal(CLINICAL_MILESTONE_DEFS.length, 9);
  const edd = parseYmd('2026-10-08');
  const stageStatus = getClinicalStageStatus(154); // 22 週 -> index 4 (20~24週)
  const list = buildClinicalMilestones(edd, stageStatus);

  assert.equal(list.length, 9);
  assert.equal(list[0].weekRange, '5 ~ 8 週');
  assert.equal(list[1].weekRange, '8 ~ 12 週');
  assert.equal(list[2].weekRange, '11 ~ 14 週');
  assert.equal(list[3].weekRange, '16 ~ 20 週');
  assert.equal(list[4].weekRange, '20 ~ 24 週');
  assert.equal(list[5].weekRange, '24 ~ 28 週');
  assert.equal(list[6].weekRange, '28 ~ 32 週');
  assert.equal(list[7].weekRange, '33 ~ 37 週');
  assert.equal(list[8].weekRange, '38 ~ 40 週');

  // 驗證狀態旗標：0~3 為已完成，4 為當前，5 為即將到來
  assert.equal(list[3].isPast, true);
  assert.equal(list[4].isCurrent, true);
  assert.equal(list[5].isNextUpcoming, true);
  assert.equal(list[6].isPast, false);

  // 每個階段皆具備非空的結構化 items 且中英文完整
  for (const m of list) {
    assert.ok(Array.isArray(m.items) && m.items.length >= 3);
    for (const item of m.items) {
      assert.ok(item.labelZh.length > 0 && item.labelEn.length > 0);
    }
  }
});



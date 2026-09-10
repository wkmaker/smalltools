import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRealHourlyRate, calculatePiecewisePR } from '../../app/hourly-rate-calculator/utils.ts';

const anchors = [
  { pr: 1, annual_salary: 300000, annual_salary_twd: 300000 },
  { pr: 25, annual_salary: 500000, annual_salary_twd: 500000 },
  { pr: 50, annual_salary: 720000, annual_salary_twd: 720000 },
  { pr: 75, annual_salary: 1_000_000, annual_salary_twd: 1_000_000 },
  { pr: 99, annual_salary: 3_000_000, annual_salary_twd: 3_000_000 },
];

const monthlyBase = {
  calcMode: 'monthly',
  monthlySalary: 40000,
  monthlyHours: 176,
  overtimeHours: 20,
  commuteHours: 22,
  monthlyExpenses: 3000,
  projectFee: 0, projectHours: 0, extraHours: 0, projectExpenses: 0,
  hoursPerYear: 2000,
  taiwanAnchors: anchors,
  globalAnchors: anchors,
};

test('月薪制：真實時薪 = (月薪 − 開銷) ÷ (工時 + 加班 + 通勤)', () => {
  const r = calculateRealHourlyRate(monthlyBase);
  assert.equal(r.totalHours, 176 + 20 + 22); // 218
  assert.equal(r.netIncome, 37000);
  assert.ok(Math.abs(r.realHourlyRate - 37000 / 218) < 1e-9);
  assert.ok(Math.abs(r.annualIncome - (37000 / 218) * 2000) < 1e-6);
});

test('專案制：真實時薪 = (報酬 − 開銷) ÷ (投入工時 + 額外工時)', () => {
  const r = calculateRealHourlyRate({
    ...monthlyBase, calcMode: 'project',
    projectFee: 120000, projectHours: 80, extraHours: 20, projectExpenses: 5000,
  });
  assert.equal(r.totalHours, 100);
  assert.equal(r.netIncome, 115000);
  assert.equal(r.realHourlyRate, 1150);
});

test('工時為 0 或淨收入為負：時薪不為負、PR 歸零', () => {
  const zero = calculateRealHourlyRate({ ...monthlyBase, monthlyHours: 0, overtimeHours: 0, commuteHours: 0 });
  assert.equal(zero.realHourlyRate, 0);
  assert.equal(zero.taiwanPR, 0);

  const neg = calculateRealHourlyRate({ ...monthlyBase, monthlySalary: 1000, monthlyExpenses: 9000 });
  assert.equal(neg.realHourlyRate, 0);
  assert.equal(neg.globalPR, 0);
});

test('PR 介於 1.0 ~ 99.9 之間並隨年薪單調不減', () => {
  let prev = -1;
  for (const monthlySalary of [22000, 30000, 45000, 70000, 120000, 400000]) {
    const r = calculateRealHourlyRate({ ...monthlyBase, monthlySalary });
    assert.ok(r.taiwanPR >= 1.0 && r.taiwanPR <= 99.9);
    assert.ok(r.taiwanPR >= prev, `PR 應隨薪資單調不減：${monthlySalary}`);
    prev = r.taiwanPR;
  }
});

test('與浮點基準交叉驗證（時薪 / 年薪 / PR）', () => {
  const ref = (i) => {
    let totalHours, netIncome;
    if (i.calcMode === 'monthly') {
      totalHours = i.monthlyHours + i.overtimeHours + i.commuteHours;
      netIncome = i.monthlySalary - i.monthlyExpenses;
    } else {
      totalHours = i.projectHours + i.extraHours;
      netIncome = i.projectFee - i.projectExpenses;
    }
    const realHourlyRate = totalHours > 0 ? Math.max(0, netIncome / totalHours) : 0;
    const annualIncome = realHourlyRate * i.hoursPerYear;
    const clamp = v => Math.min(Math.max(v, 1.0), 99.9);
    const taiwanPR = realHourlyRate <= 0 ? 0 : clamp(calculatePiecewisePR(annualIncome, i.taiwanAnchors, false));
    const globalPR = realHourlyRate <= 0 ? 0 : clamp(calculatePiecewisePR(annualIncome, i.globalAnchors, true));
    return { totalHours, netIncome, realHourlyRate, annualIncome, taiwanPR, globalPR };
  };

  for (const monthlySalary of [21009, 33333, 47850, 91234])
    for (const monthlyHours of [150, 176, 184])
      for (const overtimeHours of [0, 13, 45])
        for (const commuteHours of [0, 11.5, 30])
          for (const monthlyExpenses of [0, 2500, 12000]) {
            const i = { ...monthlyBase, monthlySalary, monthlyHours, overtimeHours, commuteHours, monthlyExpenses };
            const a = ref(i), b = calculateRealHourlyRate(i);
            assert.ok(Math.abs(a.totalHours - b.totalHours) < 1e-9, `totalHours ${JSON.stringify(i)}`);
            assert.ok(Math.abs(a.netIncome - b.netIncome) < 1e-9, `netIncome ${JSON.stringify(i)}`);
            assert.ok(Math.abs(a.realHourlyRate - b.realHourlyRate) < 1e-6, `rate ${JSON.stringify(i)}`);
            assert.ok(Math.abs(a.annualIncome - b.annualIncome) < 1e-3, `annual ${JSON.stringify(i)}`);
            assert.ok(Math.abs(a.taiwanPR - b.taiwanPR) < 1e-9, `twPR ${JSON.stringify(i)}`);
          }
});

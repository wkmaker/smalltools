import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateSalary } from '../../app/my-salary-calculator/engine.ts';
import {
  YEAR_CONFIGS_JSON,
  findInsuredAmount,
  calculateTaxFromConfig,
} from '../../app/my-salary-calculator/salaryConfig.ts';

/**
 * 薪資引擎特徵測試。`floatReference` 為重構前 MySalaryCalculatorClient 內嵌
 * 費率乘算（含 `+ 1e-9` 修正）的凍結副本，批次交叉驗證確保 BigNumber 版
 * 在整數元層級完全一致。
 */

function floatReference(input, config) {
  const numSalary = Math.max(0, input.salary);
  const numBase = Number.isFinite(input.insuranceBase) ? input.insuranceBase : numSalary;
  const dependents = Math.max(0, input.dependents);

  const insuredLabor = findInsuredAmount(numBase, config.labor_insurance.brackets);
  const insuredHealth = findInsuredAmount(numBase, config.health_insurance.brackets);
  const insuredPension = findInsuredAmount(numBase, config.labor_pension.brackets);

  const empLabor = Math.round(insuredLabor * config.labor_insurance.rate * config.labor_insurance.employee_ratio + 1e-9);
  const singleHealth = Math.round(insuredHealth * config.health_insurance.rate * config.health_insurance.employee_ratio + 1e-9);
  const empHealth = singleHealth * (1 + dependents);
  const empPension = Math.round(insuredPension * (input.selfPensionRatio / 100) + 1e-9);

  let empTax = 0;
  if (input.taxMethod === 'rate_5') {
    const calcTax = numSalary * 0.05;
    if (calcTax >= 2000) empTax = Math.round(calcTax + 1e-9);
  } else if (input.taxMethod === 'matrix') {
    empTax = calculateTaxFromConfig(numSalary, Math.max(0, input.taxDependents), config, input.year);
  }

  const takeHomePay = Math.max(0, Math.round(numSalary - empLabor - empHealth - empPension - empTax));

  const emprLabor = Math.round(insuredLabor * config.labor_insurance.rate * config.labor_insurance.employer_ratio + 1e-9);
  const emprHealth = Math.round(
    insuredHealth * config.health_insurance.rate * config.health_insurance.employer_ratio *
      (1 + (config.health_insurance.employer_average_dependents ?? 0.56)) + 1e-9,
  );
  const emprPension = Math.round(insuredPension * config.labor_pension.employer_rate + 1e-9);
  const emprTotalCost = Math.round(numSalary + emprLabor + emprHealth + emprPension);

  return { insuredLabor, insuredHealth, insuredPension, empLabor, singleHealth, empHealth, empPension, empTax, takeHomePay, emprLabor, emprHealth, emprPension, emprTotalCost };
}

test('批次交叉驗證：所有年度 × 薪資 × 眷屬 × 自提 × 稅法（整數元一致）', () => {
  const years = Object.keys(YEAR_CONFIGS_JSON).map(Number);
  let checked = 0;
  for (const year of years) {
    const config = YEAR_CONFIGS_JSON[year];
    for (const salary of [26000, 29500, 35000, 45800, 60000, 88000, 120000, 250000, 500000])
      for (const dependents of [0, 1, 3])
        for (const selfPensionRatio of [0, 6])
          for (const taxMethod of ['none', 'rate_5', 'matrix'])
            for (const taxDependents of [0, 2]) {
              const input = { year, salary, insuranceBase: NaN, dependents, selfPensionRatio, taxMethod, taxDependents };
              const ref = floatReference(input, config);
              const got = calculateSalary(input, config);
              for (const k of Object.keys(ref)) {
                assert.equal(got[k], ref[k], `${k} year=${year} salary=${salary} dep=${dependents} pen=${selfPensionRatio} tax=${taxMethod}/${taxDependents}`);
              }
              checked++;
            }
  }
  assert.ok(checked > 400, `檢查情境數 ${checked}`);
});

test('勞保員工自負額 = 投保級距 × 費率 × 員工分擔比（2026）', () => {
  const config = YEAR_CONFIGS_JSON[2026];
  const r = calculateSalary(
    { year: 2026, salary: 45800, insuranceBase: NaN, dependents: 0, selfPensionRatio: 0, taxMethod: 'none', taxDependents: 0 },
    config,
  );
  // insured 依級距表，勞保 0.125 × 0.2 = 0.025
  assert.equal(r.empLabor, Math.round(r.insuredLabor * 0.125 * 0.2));
  assert.equal(r.empHealth, r.singleHealth); // 無眷屬
  assert.equal(r.empPension, 0); // 未自提
});

test('健保眷屬：每位眷屬多收一份，員工端合計 = 單口 ×(1 + 眷屬數)', () => {
  const config = YEAR_CONFIGS_JSON[2026];
  const r = calculateSalary(
    { year: 2026, salary: 60000, insuranceBase: NaN, dependents: 3, selfPensionRatio: 0, taxMethod: 'none', taxDependents: 0 },
    config,
  );
  assert.equal(r.empHealth, r.singleHealth * 4);
});

test('勞退自提 6%：empPension = 投保級距 × 6%（四捨五入到元，無 1e-9 依賴）', () => {
  const config = YEAR_CONFIGS_JSON[2026];
  const r = calculateSalary(
    { year: 2026, salary: 50000, insuranceBase: NaN, dependents: 0, selfPensionRatio: 6, taxMethod: 'none', taxDependents: 0 },
    config,
  );
  assert.equal(r.empPension, Math.round(r.insuredPension * 0.06));
  assert.ok(r.empPension > 0);
});

test('實領 = 薪資 − 勞保 − 健保 − 勞退自提 − 稅；雇主總成本 > 薪資', () => {
  const config = YEAR_CONFIGS_JSON[2026];
  const r = calculateSalary(
    { year: 2026, salary: 80000, insuranceBase: NaN, dependents: 1, selfPensionRatio: 6, taxMethod: 'rate_5', taxDependents: 0 },
    config,
  );
  assert.equal(r.takeHomePay, 80000 - r.empLabor - r.empHealth - r.empPension - r.empTax);
  assert.ok(r.emprTotalCost > 80000);
  assert.equal(r.emprTotalCost, 80000 + r.emprLabor + r.emprHealth + r.emprPension);
});

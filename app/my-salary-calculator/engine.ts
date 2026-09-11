/**
 * 台灣薪資勞健保 / 勞退 / 預扣稅試算純函數引擎（無副作用、可毫秒級單元測試）。
 *
 * 從 `MySalaryCalculatorClient.tsx` 抽離：投保級距查表、員工自負額
 * （勞保 / 健保含眷屬 / 勞退自提 / 預扣稅）、實領薪資，以及雇主負擔與總成本。
 * 費率乘算一律走 BigNumber.js 定點數（鐵則 5、6），移除原本 `+ 1e-9` 的浮點修正 hack。
 */

import { D, BigNumber } from '../utils/decimal.ts';
import {
  findInsuredAmount,
  calculateTaxFromConfig,
  type YearConfigJSON,
} from './salaryConfig.ts';

export type TaxMethod = 'none' | 'rate_5' | 'matrix';

export interface SalaryInput {
  year: number;
  /** 月薪資總額（元） */
  salary: number;
  /** 投保薪資基準（元）；未自訂時等於 salary */
  insuranceBase: number;
  /** 健保眷屬人數 */
  dependents: number;
  /** 勞退個人自提比率（%），0 或 1~6 */
  selfPensionRatio: number;
  taxMethod: TaxMethod;
  /** 預扣稅查表法的扶養人數 */
  taxDependents: number;
}

export interface SalaryResult {
  insuredLabor: number;
  insuredHealth: number;
  insuredPension: number;
  empLabor: number;
  singleHealth: number;
  empHealth: number;
  empPension: number;
  empTax: number;
  takeHomePay: number;
  emprLabor: number;
  emprHealth: number;
  emprPension: number;
  emprTotalCost: number;
  minSalary: number;
}

const roundMoney = (v: BigNumber): number => v.integerValue(BigNumber.ROUND_HALF_UP).toNumber();

export function calculateSalary(input: SalaryInput, config: YearConfigJSON): SalaryResult {
  const numSalary = Math.max(0, Number(input.salary) || 0);
  const numBase = Number.isFinite(input.insuranceBase) ? input.insuranceBase : numSalary;
  const dependents = Math.max(0, Number(input.dependents) || 0);
  const selfPensionRatio = Number(input.selfPensionRatio) || 0;

  const labor = config.labor_insurance;
  const health = config.health_insurance;
  const pension = config.labor_pension;

  // 1. 投保級距查表
  const insuredLabor = findInsuredAmount(numBase, labor.brackets);
  const insuredHealth = findInsuredAmount(numBase, health.brackets);
  const insuredPension = findInsuredAmount(numBase, pension.brackets);

  // 2. 員工自負額
  const empLabor = roundMoney(D(insuredLabor).times(labor.rate).times(labor.employee_ratio));
  const singleHealth = roundMoney(D(insuredHealth).times(health.rate).times(health.employee_ratio));
  const empHealth = singleHealth * (1 + dependents);
  const empPension = roundMoney(D(insuredPension).times(D(selfPensionRatio).div(100)));

  let empTax = 0;
  if (input.taxMethod === 'rate_5') {
    const calcTax = D(numSalary).times('0.05');
    if (calcTax.gte(2000)) empTax = roundMoney(calcTax);
  } else if (input.taxMethod === 'matrix') {
    empTax = calculateTaxFromConfig(numSalary, Math.max(0, Number(input.taxDependents) || 0), config, input.year);
  }

  const takeHomePay = Math.max(
    0,
    roundMoney(D(numSalary).minus(empLabor).minus(empHealth).minus(empPension).minus(empTax)),
  );

  // 3. 雇主負擔
  const emprLabor = roundMoney(D(insuredLabor).times(labor.rate).times(labor.employer_ratio));
  const emprHealth = roundMoney(
    D(insuredHealth)
      .times(health.rate)
      .times(health.employer_ratio)
      .times(D(1).plus(health.employer_average_dependents ?? 0.56)),
  );
  const emprPension = roundMoney(D(insuredPension).times(pension.employer_rate));
  const emprTotalCost = roundMoney(D(numSalary).plus(emprLabor).plus(emprHealth).plus(emprPension));

  const minSalary = labor.brackets[0]?.insured || 29500;

  return {
    insuredLabor,
    insuredHealth,
    insuredPension,
    empLabor,
    singleHealth,
    empHealth,
    empPension,
    empTax,
    takeHomePay,
    emprLabor,
    emprHealth,
    emprPension,
    emprTotalCost,
    minSalary,
  };
}

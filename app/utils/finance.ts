/**
 * 共用金融計算輔助：APR 實質年利率求解（二分搜尋法）。
 *
 * 多個貸款試算工具（信貸、車貸、房貸…）都需要以現金流折現求 NPV = 0 的
 * 月折現率，再年化為 APR。此處統一實作，全程 BigNumber.js 定點數（鐵則 6）。
 */

import { D, BigNumber } from './decimal.ts';

export interface SolveAprOptions {
  /** 二分搜尋最大迭代次數（預設 80，與各工具重構前一致） */
  maxIterations?: number;
  /** 年化後四捨五入的小數位；未指定則回傳全精度 */
  decimalPlaces?: number;
}

/**
 * 求解月折現率使 NPV = 0，並年化為百分比。
 *
 * @param netAmount  期初實拿金額（貸款金額 - 手續費）
 * @param payments   逐期現金流（月）
 * @returns 年化 APR 百分比（number）；淨撥款 ≤ 0（手續費 ≥ 貸款金額）或無現金流等
 *   無效輸入時回傳 `null`，代表「無法求解」——不可與正常收斂到 0% 的合法結果混淆。
 */
export function solveApr(
  netAmount: BigNumber.Value,
  payments: BigNumber.Value[],
  options: SolveAprOptions = {},
): number | null {
  const { maxIterations = 80, decimalPlaces } = options;
  const net = D(netAmount);
  if (net.lte(0) || payments.length === 0) return null;

  const pv = payments.map(p => D(p));
  let low = D(0);
  let high = D(2); // 月折現率上限 200%
  let mid = D(0);

  for (let iter = 0; iter < maxIterations; iter++) {
    mid = low.plus(high).div(2);
    if (iter >= 40 && high.minus(low).lt('1e-12')) break;
    const onePlusMid = mid.plus(1);
    let df = onePlusMid;
    let npv = net.negated();
    for (let t = 0; t < pv.length; t++) {
      npv = npv.plus(pv[t].div(df));
      df = df.times(onePlusMid);
    }
    if (npv.gt(0)) {
      low = mid;
    } else {
      high = mid;
    }
  }

  const annualPercent = mid.times(12).times(100);
  return decimalPlaces === undefined
    ? annualPercent.toNumber()
    : annualPercent.decimalPlaces(decimalPlaces, BigNumber.ROUND_HALF_UP).toNumber();
}

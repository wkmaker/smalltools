/**
 * 台指期槓桿與逆風點數試算純函數引擎（無副作用、可毫秒級單元測試）。
 *
 * 從 `FuturesCalculatorClient.tsx` 抽離：契約名目價值、實質槓桿、追繳 / 斷頭
 * 臨界點位與價格、逆風壓力測試後權益、風險指標、補繳現金。
 * 所有金額與點數計算一律走 BigNumber.js 定點數（鐵則 5、6）。
 */

import { D, BigNumber, toNumber } from '../utils/decimal.ts';

export type FuturesPosition = 'long' | 'short';

export interface FuturesInput {
  /** 成交指數（點） */
  indexPrice: number;
  /** 口數 */
  quantity: number;
  /** 帳戶權益數 / 本金（元） */
  capital: number;
  /** 每點價值（大台 200 / 小台 50 / 微台 10） */
  multiplier: number;
  /** 每口原始保證金（元） */
  initialMargin: number;
  /** 每口維持保證金（元） */
  maintMargin: number;
  position: FuturesPosition;
  /** 逆風壓力測試幅度（%） */
  stressDropPercent: number;
}

export interface FuturesResult {
  contractValue: number;
  totalInitMargin: number;
  totalMaintMargin: number;
  /** 維持保證金佔原始保證金比例（%，如 76.86%） */
  maintMarginRatioPct: number;
  actualLeverage: number;
  /** 觸發追繳的逆風點數 */
  marginCallPoints: number;
  marginCallPrice: number;
  /** 觸發追繳的容許逆風幅度（%） */
  marginCallDropPct: number;
  /** 追繳容許逆風相當於幾根漲跌停板（以台股 10% 複利計算） */
  marginCallLimitDays: number;
  /** 觸發斷頭（風險指標 25%）的逆風點數 */
  liquidationPoints: number;
  liquidationPrice: number;
  /** 觸發斷頭的容許逆風幅度（%） */
  liquidationDropPct: number;
  /** 斷頭容許逆風相當於幾根漲跌停板（以台股 10% 複利計算） */
  liquidationLimitDays: number;
  /** 壓力測試逆風點數 */
  dropPoints: number;
  simIndex: number;
  simLoss: number;
  simCapital: number;
  /** 壓力測試後超額可用保證金（simCapital - totalInitMargin） */
  excessMargin: number;
  /** 壓力測試後距離追繳線尚餘點數 */
  simMarginCallPoints: number;
  /** 壓力測試後距離砍倉線（25%）尚餘點數 */
  simLiquidationPoints: number;
  /** 壓力測試後風險指標（simCapital / 原始保證金，%） */
  riskRatio: number;
  isBelowInit: boolean;
  isBelowMaint: boolean;
  /** 方案 A：補足至 100% 原始保證金所需現金 */
  topupCash: number;
  /** 距離維持保證金警戒線之差額 */
  maintGapCash: number;
  /** 方案 B：不入金時，模擬權益可維持 100% 原始保證金之最大口數 */
  maxAffordableLots: number;
  /** 方案 B：不入金時，需平倉減碼之口數 */
  reduceLotsRequired: number;
}

/**
 * 以台指期單日 10% 漲跌停板複利計算容許逆風幅度相當於幾根停板。
 * - 多單逆風為下跌：(1 - 0.1)^n = 1 - pct / 100 => n = ln(1 - pct / 100) / ln(0.9)
 * - 空單逆風為上漲：(1 + 0.1)^n = 1 + pct / 100 => n = ln(1 + pct / 100) / ln(1.1)
 */
export function calculateLimitMoveDays(
  adversePercent: number,
  position: FuturesPosition = 'long'
): number {
  if (!Number.isFinite(adversePercent) || adversePercent <= 0) return 0;
  if (position === 'long') {
    if (adversePercent >= 99.9) return 99;
    const ratioLeft = 1 - adversePercent / 100;
    if (ratioLeft <= 0) return 99;
    const days = Math.log(ratioLeft) / Math.log(0.9);
    return Math.max(0, Number(days.toFixed(1)));
  } else {
    const ratioUp = 1 + adversePercent / 100;
    const days = Math.log(ratioUp) / Math.log(1.1);
    return Math.max(0, Number(days.toFixed(1)));
  }
}

export function calculateFutures(input: FuturesInput): FuturesResult {
  const numIndex = D(Math.max(0, Number(input.indexPrice) || 0));
  const numQty = D(Math.max(0, Number(input.quantity) || 0));
  const numCapital = D(Math.max(0, Number(input.capital) || 0));
  const numPtVal = D(Math.max(0, Number(input.multiplier) || 0));
  const numInit = D(Math.max(0, Number(input.initialMargin) || 0));
  const numMaint = D(Math.max(0, Number(input.maintMargin) || 0));
  const drop = D(Math.min(60, Math.max(0, Number(input.stressDropPercent) || 0)));
  const isLong = input.position === 'long';

  const contractValue = numIndex.times(numQty).times(numPtVal);
  const totalInitMargin = numInit.times(numQty);
  const totalMaintMargin = numMaint.times(numQty);
  const maintMarginRatioPct = totalInitMargin.gt(0)
    ? totalMaintMargin.div(totalInitMargin).times(100)
    : D(76.86);
  const actualLeverage = numCapital.gt(0) ? contractValue.div(numCapital) : D(0);

  const pointValuePerLot = numQty.times(numPtVal); // 一次波動 1 點對總權益的影響

  let marginCallPoints = D(0);
  let marginCallPrice = D(0);
  let marginCallDropPct = D(0);
  let liquidationPoints = D(0);
  let liquidationPrice = D(0);
  let liquidationDropPct = D(0);

  if (numCapital.gt(0) && numQty.gt(0) && numPtVal.gt(0)) {
    const warnLoss = numCapital.minus(totalMaintMargin);
    marginCallPoints = warnLoss.div(pointValuePerLot);
    marginCallPrice = isLong ? numIndex.minus(marginCallPoints) : numIndex.plus(marginCallPoints);

    if (numIndex.gt(0) && marginCallPoints.gt(0)) {
      const rawWarnPct = marginCallPoints.div(numIndex).times(100);
      marginCallDropPct = isLong ? BigNumber.min(100, rawWarnPct) : rawWarnPct;
    }

    const liqLoss = numCapital.minus(totalInitMargin.times('0.25'));
    liquidationPoints = liqLoss.div(pointValuePerLot);
    liquidationPrice = isLong ? numIndex.minus(liquidationPoints) : numIndex.plus(liquidationPoints);

    if (numIndex.gt(0) && liquidationPoints.gt(0)) {
      const rawLiqPct = liquidationPoints.div(numIndex).times(100);
      liquidationDropPct = isLong ? BigNumber.min(100, rawLiqPct) : rawLiqPct;
    }
  }

  const dropPoints = numIndex.times(drop.div(100));
  const simIndex = isLong ? numIndex.minus(dropPoints) : numIndex.plus(dropPoints);
  const simLoss = dropPoints.times(numQty).times(numPtVal);
  const simCapital = numCapital.minus(simLoss);

  const excessMargin = simCapital.minus(totalInitMargin);
  const simMarginCallPoints = pointValuePerLot.gt(0)
    ? simCapital.minus(totalMaintMargin).div(pointValuePerLot)
    : D(0);
  const simLiquidationPoints = pointValuePerLot.gt(0)
    ? simCapital.minus(totalInitMargin.times('0.25')).div(pointValuePerLot)
    : D(0);

  const riskRatio = totalInitMargin.gt(0) ? simCapital.div(totalInitMargin).times(100) : D(0);

  const isBelowInit = totalInitMargin.gt(0) && simCapital.lt(totalInitMargin);
  const isBelowMaint = totalMaintMargin.gt(0) && simCapital.lt(totalMaintMargin);
  const topupCash = isBelowInit ? BigNumber.max(0, totalInitMargin.minus(simCapital)) : D(0);
  const maintGapCash = isBelowMaint ? BigNumber.max(0, totalMaintMargin.minus(simCapital)) : D(0);

  const maxAffordableLots = numInit.gt(0) && simCapital.gt(0)
    ? BigNumber.min(numQty, simCapital.div(numInit).integerValue(BigNumber.ROUND_FLOOR))
    : D(0);
  const reduceLotsRequired = isBelowInit && numQty.gt(0)
    ? BigNumber.max(0, numQty.minus(maxAffordableLots))
    : D(0);

  const marginCallDropNum = toNumber(marginCallDropPct);
  const liquidationDropNum = toNumber(liquidationDropPct);

  return {
    contractValue: toNumber(contractValue),
    totalInitMargin: toNumber(totalInitMargin),
    totalMaintMargin: toNumber(totalMaintMargin),
    maintMarginRatioPct: toNumber(maintMarginRatioPct),
    actualLeverage: toNumber(actualLeverage),
    marginCallPoints: toNumber(marginCallPoints),
    marginCallPrice: toNumber(marginCallPrice),
    marginCallDropPct: marginCallDropNum,
    marginCallLimitDays: calculateLimitMoveDays(marginCallDropNum, input.position),
    liquidationPoints: toNumber(liquidationPoints),
    liquidationPrice: toNumber(liquidationPrice),
    liquidationDropPct: liquidationDropNum,
    liquidationLimitDays: calculateLimitMoveDays(liquidationDropNum, input.position),
    dropPoints: toNumber(dropPoints),
    simIndex: toNumber(simIndex),
    simLoss: toNumber(simLoss),
    simCapital: toNumber(simCapital),
    excessMargin: toNumber(excessMargin),
    simMarginCallPoints: toNumber(simMarginCallPoints),
    simLiquidationPoints: toNumber(simLiquidationPoints),
    riskRatio: toNumber(riskRatio),
    isBelowInit,
    isBelowMaint,
    topupCash: toNumber(topupCash),
    maintGapCash: toNumber(maintGapCash),
    maxAffordableLots: toNumber(maxAffordableLots),
    reduceLotsRequired: toNumber(reduceLotsRequired),
  };
}

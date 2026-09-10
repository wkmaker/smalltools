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
  actualLeverage: number;
  /** 觸發追繳的逆風點數 */
  marginCallPoints: number;
  marginCallPrice: number;
  /** 觸發斷頭（風險指標 25%）的逆風點數 */
  liquidationPoints: number;
  liquidationPrice: number;
  /** 壓力測試逆風點數 */
  dropPoints: number;
  simIndex: number;
  simLoss: number;
  simCapital: number;
  /** 壓力測試後風險指標（simCapital / 原始保證金，%） */
  riskRatio: number;
  isBelowInit: boolean;
  topupCash: number;
}

export function calculateFutures(input: FuturesInput): FuturesResult {
  const numIndex = D(Number(input.indexPrice) || 0);
  const numQty = D(Number(input.quantity) || 0);
  const numCapital = D(Number(input.capital) || 0);
  const numPtVal = D(Number(input.multiplier) || 0);
  const numInit = D(Number(input.initialMargin) || 0);
  const numMaint = D(Number(input.maintMargin) || 0);
  const drop = D(Number(input.stressDropPercent) || 0);
  const isLong = input.position === 'long';

  const contractValue = numIndex.times(numQty).times(numPtVal);
  const totalInitMargin = numInit.times(numQty);
  const totalMaintMargin = numMaint.times(numQty);
  const actualLeverage = numCapital.gt(0) ? contractValue.div(numCapital) : D(0);

  const pointValuePerLot = numQty.times(numPtVal); // 一次波動 1 點對總權益的影響

  let marginCallPoints = D(0);
  let marginCallPrice = D(0);
  let liquidationPoints = D(0);
  let liquidationPrice = D(0);

  if (numCapital.gt(0) && numQty.gt(0) && numPtVal.gt(0)) {
    const warnLoss = numCapital.minus(totalMaintMargin);
    marginCallPoints = warnLoss.div(pointValuePerLot);
    marginCallPrice = isLong ? numIndex.minus(marginCallPoints) : numIndex.plus(marginCallPoints);

    const liqLoss = numCapital.minus(totalInitMargin.times('0.25'));
    liquidationPoints = liqLoss.div(pointValuePerLot);
    liquidationPrice = isLong ? numIndex.minus(liquidationPoints) : numIndex.plus(liquidationPoints);
  }

  const dropPoints = numIndex.times(drop.div(100));
  const simIndex = isLong ? numIndex.minus(dropPoints) : numIndex.plus(dropPoints);
  const simLoss = dropPoints.times(numQty).times(numPtVal);
  const simCapital = numCapital.minus(simLoss);

  const riskRatio = totalInitMargin.gt(0) ? simCapital.div(totalInitMargin).times(100) : D(0);

  const isBelowInit = totalInitMargin.gt(0) && simCapital.lt(totalInitMargin);
  const topupCash = isBelowInit ? BigNumber.max(0, totalInitMargin.minus(simCapital)) : D(0);

  return {
    contractValue: toNumber(contractValue),
    totalInitMargin: toNumber(totalInitMargin),
    totalMaintMargin: toNumber(totalMaintMargin),
    actualLeverage: toNumber(actualLeverage),
    marginCallPoints: toNumber(marginCallPoints),
    marginCallPrice: toNumber(marginCallPrice),
    liquidationPoints: toNumber(liquidationPoints),
    liquidationPrice: toNumber(liquidationPrice),
    dropPoints: toNumber(dropPoints),
    simIndex: toNumber(simIndex),
    simLoss: toNumber(simLoss),
    simCapital: toNumber(simCapital),
    riskRatio: toNumber(riskRatio),
    isBelowInit,
    topupCash: toNumber(topupCash),
  };
}

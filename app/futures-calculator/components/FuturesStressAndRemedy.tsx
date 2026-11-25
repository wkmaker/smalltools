'use client';

import styles from '../futures-calculator.module.css';
import { formatFuturesNumber, FuturesPosition, FuturesTranslations } from './shared';

interface FuturesStressAndRemedyProps {
  t: FuturesTranslations;
  position: FuturesPosition;
  numCapital: number;
  numQty: number;
  stressDropPct: number;
  onStressDropPctChange: (pct: number) => void;
  dropPoints: number;
  simIndex: number;
  simCapital: number;
  simLoss: number;
  marginCallPrice: number;
  marginCallPts: number;
  marginCallDropPct: number;
  marginCallLimitDays: number;
  liqPrice: number;
  liqPts: number;
  liquidationDropPct: number;
  liquidationLimitDays: number;
  isBelowInit: boolean;
  isBelowMaint: boolean;
  topupCash: number;
  maintGapCash: number;
  maxAffordableLots: number;
  reduceLotsRequired: number;
}

export default function FuturesStressAndRemedy({
  t,
  position,
  numCapital,
  numQty,
  stressDropPct,
  onStressDropPctChange,
  dropPoints,
  simIndex,
  simCapital,
  simLoss,
  marginCallPrice,
  marginCallPts,
  marginCallDropPct,
  marginCallLimitDays,
  liqPrice,
  liqPts,
  liquidationDropPct,
  liquidationLimitDays,
  isBelowInit,
  isBelowMaint,
  topupCash,
  maintGapCash,
  maxAffordableLots,
  reduceLotsRequired,
}: FuturesStressAndRemedyProps) {
  return (
    <>
      {/* 2. 0%-60% 逆風波段壓力測試 */}
      <div className={`${styles.glassCard} p-6 flex flex-col gap-4 shadow-lg`}>
        <div className="flex justify-between items-center text-xs font-semibold">
          <span className="text-text-sub uppercase tracking-[1px]">
            {position === 'long' ? t.stressTitleLong : t.stressTitleShort}
          </span>
          <span className={`font-mono text-sm ${styles.accentText} font-bold`}>
            {stressDropPct.toFixed(1)}% <span className="text-xs text-text-sub font-normal">({t.stressPoints} {formatFuturesNumber(dropPoints)} {t.stressPointsUnit})</span>
          </span>
        </div>

        {/* 壓力測試快捷按鈕 */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => onStressDropPctChange(0)}
            className={`${styles.chipBtn} ${stressDropPct === 0 ? styles.chipBtnActive : ''}`}
          >
            {t.stressReset}
          </button>
          <button
            type="button"
            onClick={() => onStressDropPctChange(5)}
            className={`${styles.chipBtn} ${stressDropPct === 5 ? styles.chipBtnActive : ''}`}
          >
            {t.stressShortcut5}
          </button>
          <button
            type="button"
            onClick={() => onStressDropPctChange(10)}
            className={`${styles.chipBtn} ${stressDropPct === 10 ? styles.chipBtnActive : ''}`}
          >
            {t.stressShortcut10}
          </button>
          <button
            type="button"
            onClick={() => onStressDropPctChange(20)}
            className={`${styles.chipBtn} ${stressDropPct === 20 ? styles.chipBtnActive : ''}`}
          >
            {t.stressShortcut20}
          </button>
        </div>

        <input
          type="range"
          min="0"
          max="60"
          step="0.1"
          aria-label={position === 'long' ? t.stressTitleLong : t.stressTitleShort}
          value={stressDropPct}
          onChange={e => onStressDropPctChange(parseFloat(e.target.value) || 0)}
          className={styles.rangeSlider}
        />

        <div className="grid grid-cols-2 gap-4 font-mono text-xs max-sm:grid-cols-1">
          <div className="bg-surface-glass border border-border-glass p-3 rounded-xl flex flex-col gap-1">
            <span className="text-text-sub">{t.simIndexLabel}</span>
            <span className="text-base text-text-main font-bold">{formatFuturesNumber(simIndex)} {t.pointsUnit}</span>
          </div>
          <div className="bg-surface-glass border border-border-glass p-3 rounded-xl flex flex-col gap-1">
            <span className="text-text-sub">{t.simCapitalLabel}</span>
            <span className="text-base text-text-main font-bold">${formatFuturesNumber(simCapital)} {t.currencyUnit}</span>
            <span className={`text-xs ${styles.accentText}`}>{t.simLossLabel}-${formatFuturesNumber(simLoss)} {t.currencyUnit}</span>
          </div>
        </div>
      </div>

      {/* 3. 臨界點資訊卡片（含容許逆風百分比與漲跌停板天數換算） */}
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div className={`${styles.statCard} font-mono`}>
          <span className="text-sm font-semibold text-text-sub font-sans">{t.marginCallTitle}</span>
          <span className="text-xl font-bold text-[#f59e0b]">
            {position === 'long' && marginCallPrice <= 0 && numCapital > 0
              ? t.noTriggerFloor
              : `${formatFuturesNumber(Math.max(0, marginCallPrice))} ${t.pointsUnit}`}
          </span>
          <div className="flex flex-col text-xs text-text-sub gap-0.5 mt-0.5">
            <span>
              {t.allowWind}
              <strong className="text-[#f59e0b]">
                {marginCallPts < 0 && numCapital > 0
                  ? t.alreadyBelowThreshold
                  : `${formatFuturesNumber(Math.max(0, marginCallPts))} ${t.pointsUnit} (${marginCallDropPct.toFixed(2)}%)`}
              </strong>
            </span>
            <span className="text-xs text-text-sub/80">
              {position === 'long'
                ? t.limitMoveDaysLong(marginCallLimitDays)
                : t.limitMoveDaysShort(marginCallLimitDays)}
            </span>
          </div>
        </div>

        <div className={`${styles.statCard} font-mono`}>
          <span className="text-sm font-semibold text-text-sub font-sans">{t.liqTitle}</span>
          <span className={`text-xl font-bold ${styles.accentText}`}>
            {position === 'long' && liqPrice <= 0 && numCapital > 0
              ? t.noTriggerFloor
              : `${formatFuturesNumber(Math.max(0, liqPrice))} ${t.pointsUnit}`}
          </span>
          <div className="flex flex-col text-xs text-text-sub gap-0.5 mt-0.5">
            <span>
              {t.allowWind}
              <strong className={styles.accentText}>
                {liqPts < 0 && numCapital > 0
                  ? t.alreadyBelowThreshold
                  : `${formatFuturesNumber(Math.max(0, liqPts))} ${t.pointsUnit} (${liquidationDropPct.toFixed(2)}%)`}
              </strong>
            </span>
            <span className="text-xs text-text-sub/80">
              {position === 'long'
                ? t.limitMoveDaysLong(liquidationLimitDays)
                : t.limitMoveDaysShort(liquidationLimitDays)}
            </span>
          </div>
        </div>
      </div>

      {/* 4. 保證金回補與減倉雙方案試算 */}
      <div className={`border rounded-2xl p-6 flex flex-col gap-4 shadow-lg transition-all ${
        isBelowInit
          ? 'bg-[#ef4444]/10 border-[#ef4444]/40'
          : styles.glassCard
      }`}>
        <h3 className="text-xs uppercase tracking-[1px] font-semibold flex items-center gap-2">
          {isBelowInit ? (
            <span className={`${styles.accentText} inline-flex items-center gap-1.5`}>
              <svg className="w-4 h-4 fill-none stroke-current shrink-0" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {isBelowMaint ? t.topupAlertMarginCall : t.topupWarning}
            </span>
          ) : (
            <span className={`${styles.aprText} inline-flex items-center gap-1.5`}>
              <svg className="w-4 h-4 fill-none stroke-current shrink-0" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.topupSafe}
            </span>
          )}
        </h3>

        <div className="grid grid-cols-2 gap-4 font-mono text-xs max-sm:grid-cols-1">
          {/* 方案 A：入金回補現金 */}
          <div className="bg-surface-glass border border-border-glass p-4 rounded-xl flex flex-col gap-1">
            <span className="text-text-sub font-semibold font-sans text-xs">{t.topupCashLabel}</span>
            <span className={`text-base font-bold ${isBelowInit ? styles.accentText : 'text-text-main'}`}>
              ${formatFuturesNumber(topupCash)} {t.currencyUnit}
            </span>
            <span className="text-xs text-text-sub font-sans">
              {isBelowMaint ? t.maintGapDesc(Math.round(maintGapCash)) : t.maintAboveDesc}
            </span>
          </div>

          {/* 方案 B：平倉減碼降部位 */}
          <div className="bg-surface-glass border border-border-glass p-4 rounded-xl flex flex-col gap-1 justify-center">
            <span className="text-text-sub font-semibold font-sans text-xs">{t.planBLabel}</span>
            <span className={`text-sm font-bold font-sans ${isBelowInit ? styles.accentText : 'text-text-main'}`}>
              {isBelowInit
                ? t.planBDesc(reduceLotsRequired, maxAffordableLots)
                : t.planBSafeDesc(numQty)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

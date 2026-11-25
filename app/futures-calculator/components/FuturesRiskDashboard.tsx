'use client';

import styles from '../futures-calculator.module.css';
import { formatFuturesNumber, FuturesTranslations } from './shared';

interface FuturesRiskDashboardProps {
  t: FuturesTranslations;
  totalInitMargin: number;
  totalMaintMargin: number;
  maintMarginRatioPct: number;
  riskRatio: number;
  simCapital: number;
  excessMargin: number;
  simMarginCallPoints: number;
  simLiquidationPoints: number;
  contractValue: number;
  actualLeverage: number;
}

export default function FuturesRiskDashboard({
  t,
  totalInitMargin,
  totalMaintMargin,
  maintMarginRatioPct,
  riskRatio,
  simCapital,
  excessMargin,
  simMarginCallPoints,
  simLiquidationPoints,
  contractValue,
  actualLeverage,
}: FuturesRiskDashboardProps) {
  // 儀表板極座標幾何計算（0% ~ 200%+，圓心 120,105，半徑 80）
  const gaugeMin = 0;
  const gaugeMax = 200;
  const gaugeSpan = gaugeMax - gaugeMin;

  let needleDeg = -90;
  if (totalInitMargin === 0 && simCapital > 0) {
    needleDeg = 90;
  } else if (riskRatio >= gaugeMax) {
    needleDeg = 90;
  } else if (riskRatio <= gaugeMin) {
    needleDeg = -90;
  } else {
    needleDeg = -90 + ((riskRatio - gaugeMin) / gaugeSpan) * 180;
  }

  const getGaugePoint = (pct: number, r = 80) => {
    const clamped = Math.min(gaugeMax, Math.max(gaugeMin, pct));
    const angleDeg = 180 - ((clamped - gaugeMin) / gaugeSpan) * 180;
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: Number((120 + r * Math.cos(rad)).toFixed(2)),
      y: Number((105 - r * Math.sin(rad)).toFixed(2)),
    };
  };

  const clampMaintPct = Math.min(92, Math.max(35, Math.round(maintMarginRatioPct)));
  const pLiq = getGaugePoint(25, 80);
  const pMaint = getGaugePoint(clampMaintPct, 80);
  const pInit = getGaugePoint(100, 80);
  const lblLiq = getGaugePoint(25, 97);
  const lblMaint = getGaugePoint(clampMaintPct, 97);
  const lblInit = getGaugePoint(100, 97);

  const gaugeTicks = Array.from({ length: 11 }, (_, idx) => {
    const m = gaugeMin + (gaugeSpan * idx) / 10;
    return {
      idx,
      inner: getGaugePoint(m, 66),
      outer: getGaugePoint(m, 71),
    };
  });

  return (
    <>
      {/* 1. 座艙雙欄式風險指標儀表板 */}
      <div className={`${styles.glassCard} p-6 flex flex-col gap-5 shadow-lg relative`}>
        {/* 頂欄：標題 + 即時狀態膠囊 */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-glass pb-3">
          <h3 className="text-sm text-text-main uppercase tracking-[1px] font-semibold">
            {t.dashboardTitle}
          </h3>
          <div className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-[1px] ${
            totalInitMargin === 0 || riskRatio >= 100
              ? styles.statusSafeBadge
              : simCapital >= totalMaintMargin
              ? styles.statusWarningBadge
              : `${styles.statusDangerBadge} animate-pulse`
          }`}>
            {totalInitMargin === 0 && simCapital > 0
              ? t.statusSafeFull
              : riskRatio >= 100
              ? t.statusSafe
              : simCapital >= totalMaintMargin
              ? t.statusWarning
              : riskRatio >= 25
              ? t.statusMarginCall
              : t.statusLiquidation}
          </div>
        </div>

        {/* 中段主體：左側精密半圓儀表 + 右側核心風險指標與緩衝數據 */}
        <div className="grid grid-cols-[1.15fr_1fr] gap-6 items-center max-sm:grid-cols-1">
          {/* 左側：SVG 刻度儀表與區間圖例 */}
          <div
            className="flex flex-col items-center justify-center w-full"
            role="meter"
            aria-valuenow={Math.max(0, Math.round(riskRatio))}
            aria-valuemin={gaugeMin}
            aria-valuemax={gaugeMax}
            aria-label={t.gaugeAriaLabel}
          >
            <svg className="w-full max-w-[300px] drop-shadow-[0_6px_16px_rgba(0,0,0,0.28)]" viewBox="0 0 240 125">
              {/* 底層軌道弧線 (半徑 80，圓心 120,105) */}
              <path
                d="M 40,105 A 80,80 0 0,1 200,105"
                fill="none"
                stroke="rgba(148,163,184,0.18)"
                strokeWidth="14"
                strokeLinecap="round"
              />
              {/* 強制砍倉區 (紅色 0% -> 25%) */}
              <path
                d={`M 40,105 A 80,80 0 0,1 ${pLiq.x},${pLiq.y}`}
                fill="none"
                stroke="#ef4444"
                strokeWidth="14"
                strokeLinecap="butt"
              />
              {/* 盤後追繳區 (橘紅 25% -> 維持率%) */}
              <path
                d={`M ${pLiq.x},${pLiq.y} A 80,80 0 0,1 ${pMaint.x},${pMaint.y}`}
                fill="none"
                stroke="#f97316"
                strokeWidth="14"
                strokeLinecap="butt"
              />
              {/* 低於原始保證金警戒區 (琥珀黃 維持率% -> 100%) */}
              <path
                d={`M ${pMaint.x},${pMaint.y} A 80,80 0 0,1 ${pInit.x},${pInit.y}`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="14"
                strokeLinecap="butt"
              />
              {/* 高於原始保證金區 (翠綠 100% -> 200%) */}
              <path
                d={`M ${pInit.x},${pInit.y} A 80,80 0 0,1 200,105`}
                fill="none"
                stroke="#10b981"
                strokeWidth="14"
                strokeLinecap="butt"
              />

              {/* 內圈 10 等分精密刻度線 */}
              {gaugeTicks.map(tk => (
                <line
                  key={tk.idx}
                  x1={tk.inner.x}
                  y1={tk.inner.y}
                  x2={tk.outer.x}
                  y2={tk.outer.y}
                  stroke="rgba(148,163,184,0.45)"
                  strokeWidth={tk.idx === 0 || tk.idx === 5 || tk.idx === 10 ? '2' : '1'}
                />
              ))}

              {/* 動態門檻與端點文字標示 */}
              <text x="22" y="109" fontSize="9" fill="var(--text-sub, #94a3b8)" textAnchor="middle" fontFamily="monospace">0%</text>
              <text x={lblLiq.x} y={lblLiq.y} fontSize="9" fill="#ef4444" textAnchor="middle" fontFamily="monospace" fontWeight="bold">25%</text>
              <text x={lblMaint.x} y={lblMaint.y} fontSize="9" fill="#f97316" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{clampMaintPct}%</text>
              <text x={lblInit.x} y={lblInit.y} fontSize="9" fill="#10b981" textAnchor="middle" fontFamily="monospace" fontWeight="bold">100%</text>
              <text x="218" y="109" fontSize="9" fill="var(--text-sub, #94a3b8)" textAnchor="middle" fontFamily="monospace">200%+</text>

              {/* 動態旋轉指針 (圓心 120, 105) */}
              <line
                x1="120"
                y1="105"
                x2="120"
                y2="38"
                stroke="currentColor"
                strokeWidth="4"
                strokeLinecap="round"
                className={`${styles.gaugeNeedle} ${styles.accentText}`}
                style={{ transform: `rotate(${needleDeg}deg)` }}
              />
              {/* 指針軸心雙環 */}
              <circle cx="120" cy="105" r="8" fill="var(--card-bg-solid, #0b0b0e)" stroke="currentColor" strokeWidth="2.5" className={styles.accentText} />
              <circle cx="120" cy="105" r="3" fill="currentColor" className={styles.accentText} />
            </svg>

            {/* 底部區間圖例 */}
            <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 mt-1 text-xs font-mono text-text-sub">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block" />
                {t.legendLiq}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f97316] inline-block" />
                {t.legendCall(clampMaintPct)}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block" />
                {t.legendWarn(clampMaintPct)}
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block" />
                {t.legendSafe}
              </span>
            </div>
          </div>

          {/* 右側：核心風險指標大數字 + 3 項即時風控距離指標 */}
          <div className="flex flex-col gap-3 w-full">
            <div className="bg-surface-glass border border-border-glass rounded-xl p-4 flex flex-col gap-1">
              <span className="text-xs text-text-sub font-medium">{t.currentRiskRatioLabel}</span>
              <div className={`font-mono text-3xl font-bold tracking-tight ${
                totalInitMargin === 0 || riskRatio >= 100
                  ? styles.aprText
                  : simCapital >= totalMaintMargin
                  ? 'text-[#f59e0b]'
                  : styles.accentText
              }`}>
                {totalInitMargin === 0 && simCapital > 0 ? '∞' : totalInitMargin > 0 ? `${(riskRatio > 0 ? riskRatio : 0).toFixed(2)}%` : '- %'}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2 font-mono text-xs">
              <div className="bg-surface-glass border border-border-glass px-3.5 py-2.5 rounded-xl flex justify-between items-center">
                <span className="text-text-sub font-sans">{t.excessMarginLabel}</span>
                <span className={`font-bold ${excessMargin < 0 ? 'text-[#f59e0b]' : styles.aprText}`}>
                  {totalInitMargin > 0 ? `${excessMargin >= 0 ? '+' : '-'}$${formatFuturesNumber(Math.abs(excessMargin))} ${t.currencyUnit}` : '-'}
                </span>
              </div>
              <div className="bg-surface-glass border border-border-glass px-3.5 py-2.5 rounded-xl flex justify-between items-center">
                <span className="text-text-sub font-sans">{t.bufferToMarginCallLabel}</span>
                <span className={`font-bold ${simMarginCallPoints < 0 ? styles.accentText : 'text-text-main'}`}>
                  {totalInitMargin > 0 ? `${simMarginCallPoints >= 0 ? '+' : ''}${formatFuturesNumber(simMarginCallPoints)} ${t.pointsUnit}` : '-'}
                </span>
              </div>
              <div className="bg-surface-glass border border-border-glass px-3.5 py-2.5 rounded-xl flex justify-between items-center">
                <span className="text-text-sub font-sans">{t.bufferToLiqLabel}</span>
                <span className={`font-bold ${simLiquidationPoints < 0 ? styles.accentText : 'text-text-main'}`}>
                  {totalInitMargin > 0 ? `${simLiquidationPoints >= 0 ? '+' : ''}${formatFuturesNumber(simLiquidationPoints)} ${t.pointsUnit}` : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 實質槓桿與合約規模 */}
      <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
        <div className={styles.statCard}>
          <span className="text-sm text-text-sub font-semibold uppercase tracking-[1px] mb-1">{t.contractValTitle}</span>
          <span className="font-mono text-xl font-bold text-text-main">${formatFuturesNumber(contractValue)} {t.currencyUnit}</span>
        </div>

        <div className={styles.statCard}>
          <span className="text-sm text-text-sub font-semibold uppercase tracking-[1px] mb-1">{t.leverageTitle}</span>
          <span className={`font-mono text-2xl font-bold ${styles.accentText}`}>
            {actualLeverage.toFixed(2)} x
          </span>
          <span className="text-xs text-text-sub mt-1">
            {actualLeverage <= 2.5 ? t.leverageLow : actualLeverage <= 5 ? t.leverageMid : t.leverageHigh}
          </span>
        </div>
      </div>
    </>
  );
}

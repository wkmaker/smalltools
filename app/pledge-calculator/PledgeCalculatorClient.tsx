'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './pledge-calculator.module.css';
import { calculatePledge } from './engine';
import { D, toNumber } from '../utils/decimal';
import { TRANSLATIONS } from './translations';

function formatNumber(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  return Math.round(val).toLocaleString('zh-TW');
}

interface Props {
  lang?: 'zh-TW' | 'en';
}

export default function PledgeCalculatorClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  // 輸入欄位狀態 (單位：元 / 張 / %)
  const [stockPrice, setStockPrice] = useState<number | ''>(200);
  const [stockQty, setStockQty] = useState<number | ''>(50);
  const [qtyUnit, setQtyUnit] = useState<number>(1000); // 1000 = 張, 1 = 股
  const [loanAmount, setLoanAmount] = useState<number | ''>(6000000); // 借款本金 (元)
  const [loanAnnualRate, setLoanAnnualRate] = useState<number | ''>(2.5); // 年利率 %
  const [collateralPrice, setCollateralPrice] = useState<number | ''>(200); // 方案 C 追加股票單價
  const [thresholdWarn, setThresholdWarn] = useState<number | ''>(130); // 追繳門檻 %
  const [thresholdSafe, setThresholdSafe] = useState<number | ''>(160); // 安全門檻 %

  // 大跌壓力測試滑桿 (0% - 60%)
  const [stressDropPct, setStressDropPct] = useState<number>(0);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(false);

  const priceInputId = useId();
  const qtyInputId = useId();
  const loanInputId = useId();
  const rateInputId = useId();
  const collateralInputId = useId();
  const warnInputId = useId();
  const safeInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(st => ({ ...st, show: false })), 2500);
  }, []);

  // 設定全頁背景主題色 (金黃色)
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ffb800');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 184, 0, 0.6)');
  }, []);

  // 初次掛載：讀取 URL Query 參數進行狀態同步
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pP = params.get('p');
    const pQ = params.get('q');
    const pU = params.get('u');
    const pL = params.get('l');
    const pR = params.get('r');
    const pW = params.get('w');
    const pS = params.get('s');
    const pD = params.get('d');

    if (pP && !isNaN(Number(pP))) {
      const pNum = Math.max(0, Number(pP));
      setStockPrice(pNum);
      setCollateralPrice(pNum);
    }
    if (pQ && !isNaN(Number(pQ))) setStockQty(Math.max(0, Number(pQ)));
    if (pU && (Number(pU) === 1000 || Number(pU) === 1)) setQtyUnit(Number(pU));
    if (pL && !isNaN(Number(pL))) setLoanAmount(Math.max(0, Number(pL)));
    if (pR && !isNaN(Number(pR))) setLoanAnnualRate(Math.max(0, Number(pR)));
    if (pW && !isNaN(Number(pW))) setThresholdWarn(Math.max(0, Number(pW)));
    if (pS && !isNaN(Number(pS))) setThresholdSafe(Math.max(0, Number(pS)));
    if (pD && !isNaN(Number(pD))) setStressDropPct(Math.min(60, Math.max(0, Number(pD))));

    isMountedRef.current = true;
  }, []);

  // 狀態變更時更新網址 (URL replaceState)
  useEffect(() => {
    if (!isMountedRef.current) return;
    const params = new URLSearchParams({
      p: stockPrice.toString(),
      q: stockQty.toString(),
      u: qtyUnit.toString(),
      l: loanAmount.toString(),
      r: loanAnnualRate.toString(),
      w: thresholdWarn.toString(),
      s: thresholdSafe.toString(),
      d: stressDropPct.toString(),
    });
    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [stockPrice, stockQty, qtyUnit, loanAmount, loanAnnualRate, thresholdWarn, thresholdSafe, stressDropPct]);

  // 質押維持率主試算邏輯（純函數引擎，見 ./engine.ts）
  const numPrice = stockPrice === '' ? 0 : stockPrice;
  const numQty = stockQty === '' ? 0 : stockQty;
  const numLoan = loanAmount === '' ? 0 : loanAmount;
  const numAnnualRate = loanAnnualRate === '' ? 2.5 : loanAnnualRate;
  const numCollateralPrice = collateralPrice === '' ? numPrice : collateralPrice;
  const numWarnRate = thresholdWarn === '' ? 130 : thresholdWarn;
  const numSafeRate = thresholdSafe === '' ? 160 : thresholdSafe;

  const {
    totalShares,
    marketValue,
    maxLoan60,
    maxLoan50,
    warnPrice,
    warnDrop,
    warnLimitDownDays,
    safePrice,
    safeDrop,
    safeLimitDownDays,
    simPrice,
    simMarketValue: simMarketVal,
    ratio,
    monthlyInterest,
    semiAnnualInterest,
    repayAmount: repayAmt,
    cashAmount: cashAmt,
    addSharesRequired,
    addLotsRequired,
    isBelowSafe,
  } = calculatePledge({
    stockPrice: numPrice,
    stockQty: numQty,
    qtyUnit,
    loanAmount: numLoan,
    loanAnnualRate: numAnnualRate,
    thresholdWarnPercent: numWarnRate,
    thresholdSafePercent: numSafeRate,
    stressDropPercent: stressDropPct,
    collateralPrice: numCollateralPrice,
  });

  // 儀表板滿刻度上限：以用戶設定之目標緩衝維持率的 1.3 倍作為指標右端底線
  const gaugeMin = 100;
  const gaugeMax = Math.max(
    toNumber(D(numSafeRate).times('1.3').dp(0)),
    toNumber(D(numWarnRate).times('1.3').dp(0)) + 10,
    130
  );
  const gaugeSpan = gaugeMax - gaugeMin;

  // 儀表板指針角度（-90deg ~ +90deg，對應 gaugeMin ~ gaugeMax）
  let needleDeg = -90;
  if (numLoan === 0 && simMarketVal > 0) {
    needleDeg = 90;
  } else if (ratio >= gaugeMax) {
    needleDeg = 90;
  } else if (ratio <= gaugeMin) {
    needleDeg = -90;
  } else {
    needleDeg = -90 + ((ratio - gaugeMin) / gaugeSpan) * 180;
  }

  const getGaugePoint = (marginPct: number, r = 80) => {
    const clamped = Math.min(gaugeMax, Math.max(gaugeMin, marginPct));
    const angleDeg = 180 - ((clamped - gaugeMin) / gaugeSpan) * 180;
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: Number((120 + r * Math.cos(rad)).toFixed(2)),
      y: Number((105 - r * Math.sin(rad)).toFixed(2)),
    };
  };

  const clampWarn = Math.min(gaugeMax - 10, Math.max(gaugeMin + 5, numWarnRate));
  const clampSafe = Math.min(gaugeMax - 5, Math.max(clampWarn + 5, numSafeRate));
  const pWarn = getGaugePoint(clampWarn, 80);
  const pSafe = getGaugePoint(clampSafe, 80);
  const lblWarn = getGaugePoint(clampWarn, 97);
  const lblSafe = getGaugePoint(clampSafe, 97);
  const gaugeTicks = Array.from({ length: 11 }, (_, idx) => {
    const m = gaugeMin + (gaugeSpan * idx) / 10;
    return {
      idx,
      inner: getGaugePoint(m, 66),
      outer: getGaugePoint(m, 71),
    };
  });

  // 快捷帶入本金金額
  const setLoanPercent = (pct: number) => {
    const targetLoan = Math.round(marketValue * pct);
    setLoanAmount(targetLoan);
  };

  // 快捷套用試算情境 (Presets)
  const applyPreset = (preset: 'tsmc' | 'etf' | 'alert') => {
    if (preset === 'tsmc') {
      setStockPrice(1000);
      setStockQty(20);
      setQtyUnit(1000);
      setLoanAmount(12000000);
      setLoanAnnualRate(2.3);
      setCollateralPrice(1000);
      setThresholdWarn(130);
      setThresholdSafe(160);
      setStressDropPct(0);
    } else if (preset === 'etf') {
      setStockPrice(25);
      setStockQty(200);
      setQtyUnit(1000);
      setLoanAmount(2000000);
      setLoanAnnualRate(2.5);
      setCollateralPrice(25);
      setThresholdWarn(130);
      setThresholdSafe(160);
      setStressDropPct(0);
    } else if (preset === 'alert') {
      setStockPrice(200);
      setStockQty(50);
      setQtyUnit(1000);
      setLoanAmount(6000000);
      setLoanAnnualRate(2.5);
      setCollateralPrice(200);
      setThresholdWarn(130);
      setThresholdSafe(160);
      setStressDropPct(20);
    }
  };

  // 複製試算分享連結
  const copyShareLink = () => {
    const params = new URLSearchParams({
      p: numPrice.toString(),
      q: numQty.toString(),
      u: qtyUnit.toString(),
      l: numLoan.toString(),
      r: numAnnualRate.toString(),
      w: numWarnRate.toString(),
      s: numSafeRate.toString(),
      d: stressDropPct.toString(),
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => showToast(t.toastCopied));
  };

  // 複製分析摘要報告文字
  const copySummaryText = () => {
    const unitText = qtyUnit === 1000 ? t.unitLots : t.unitShares;
    const shareUrl = `${window.location.origin}${window.location.pathname}?${new URLSearchParams({
      p: numPrice.toString(),
      q: numQty.toString(),
      u: qtyUnit.toString(),
      l: numLoan.toString(),
      r: numAnnualRate.toString(),
      w: numWarnRate.toString(),
      s: numSafeRate.toString(),
      d: stressDropPct.toString(),
    }).toString()}`;

    const summary = lang === 'zh-TW'
      ? `【股票質押維持率試算報告】
• 標的現況：每股 $${numPrice} 元 / ${numQty} ${unitText} / 市值 $${formatNumber(marketValue)} 元
• 質押借款：$${formatNumber(numLoan)} 元 (成數 ${(marketValue > 0 ? (numLoan / marketValue * 100).toFixed(1) : '0')}%)
• 借款利率：年利率 ${numAnnualRate}% (每月利息約 $${formatNumber(monthlyInterest)} 元)
• 目前維持率：${numLoan === 0 ? '∞' : `${ratio.toFixed(2)}%`}
• 追繳臨界價 (${numWarnRate}%)：$${warnPrice.toFixed(2)} 元 (容許跌幅 ${warnDrop.toFixed(1)}%，相當於 ${warnLimitDownDays} 根跌停)
• 目標緩衝價 (${numSafeRate}%)：$${safePrice.toFixed(2)} 元 (容許跌幅 ${safeDrop.toFixed(1)}%，相當於 ${safeLimitDownDays} 根跌停)
${stressDropPct > 0 ? `• 大跌壓力測試 (-${stressDropPct}%)：模擬股價 $${simPrice.toFixed(2)} 元，維持率變為 ${ratio.toFixed(2)}%\n` : ''}${isBelowSafe ? `• 回補至目標維持率 (${numSafeRate}%)：需償還本金 $${formatNumber(repayAmt)} 元 或 補繳現金 $${formatNumber(cashAmt)} 元 或 追加現股 ${addLotsRequired} 張\n` : ''}• 線上試算連結：${shareUrl}
（※ 試算僅供參考，請留意市場劇烈波動與流動性風險）`
      : `[Stock Pledge & Margin Ratio Report]
• Pledged Asset: $${numPrice} / ${numQty} ${unitText} / Market Value $${formatNumber(marketValue)}
• Loan Principal: $${formatNumber(numLoan)} (LTV ${(marketValue > 0 ? (numLoan / marketValue * 100).toFixed(1) : '0')}%)
• Interest Rate: ${numAnnualRate}% p.a. (Monthly interest approx. $${formatNumber(monthlyInterest)})
• Current Margin Ratio: ${numLoan === 0 ? '∞' : `${ratio.toFixed(2)}%`}
• Margin Call Price (${numWarnRate}%): $${warnPrice.toFixed(2)} (Allowed drop ${warnDrop.toFixed(1)}%, approx. ${warnLimitDownDays} limit-downs)
• Target Buffer Price (${numSafeRate}%): $${safePrice.toFixed(2)} (Allowed drop ${safeDrop.toFixed(1)}%, approx. ${safeLimitDownDays} limit-downs)
${stressDropPct > 0 ? `• Stress Test (-${stressDropPct}%): Simulated price $${simPrice.toFixed(2)}, ratio drops to ${ratio.toFixed(2)}%\n` : ''}${isBelowSafe ? `• Restoring Target Margin (${numSafeRate}%): Repay $${formatNumber(repayAmt)} or deposit $${formatNumber(cashAmt)} cash\n` : ''}• Calculator URL: ${shareUrl}
(* For reference only. Always monitor market volatility and liquidity risks.)`;

    navigator.clipboard.writeText(summary).then(() => showToast(t.toastSummaryCopied));
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#ffb800"
        accentGlow="rgba(255, 184, 0, 0.6)"
      >

        <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
          {/* 左欄：質押資產設定面板 */}
          <div className={`${styles.glassCard} p-8 flex flex-col gap-6 shadow-lg`}>
            <div className="flex flex-col gap-3 border-b border-border-glass pb-4">
              <h3 className={`text-sm ${styles.accentText} uppercase tracking-[1px] font-semibold`}>
                {t.assetSettingTitle}
              </h3>
              {/* 快捷情境範本 Presets */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-text-sub font-medium">{t.presetsTitle}</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyPreset('tsmc')}
                    className={`${styles.chipBtn} ${
                      numPrice === 1000 && numQty === 20 && qtyUnit === 1000 && numLoan === 12000000
                        ? styles.chipBtnActive
                        : ''
                    }`}
                  >
                    {t.presetTsmc}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('etf')}
                    className={`${styles.chipBtn} ${
                      numPrice === 25 && numQty === 200 && qtyUnit === 1000 && numLoan === 2000000
                        ? styles.chipBtnActive
                        : ''
                    }`}
                  >
                    {t.presetEtf}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyPreset('alert')}
                    className={`${styles.chipBtn} ${
                      numPrice === 200 && numQty === 50 && qtyUnit === 1000 && numLoan === 6000000 && stressDropPct === 20
                        ? styles.chipBtnActive
                        : ''
                    }`}
                  >
                    {t.presetAlert}
                  </button>
                </div>
              </div>
            </div>

            {/* 個股單價與持股數量 */}
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="flex flex-col gap-2">
                <label htmlFor={priceInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.stockPriceLabel}</label>
                <input
                  id={priceInputId}
                  type="number"
                  step="0.1"
                  placeholder="200"
                  value={stockPrice}
                  onChange={e => {
                    const val = e.target.value;
                    const parsed = val === '' ? '' : parseFloat(val);
                    setStockPrice(parsed);
                    if (collateralPrice === stockPrice) {
                      setCollateralPrice(parsed);
                    }
                  }}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={qtyInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.stockQtyLabel}</label>
                <div className="relative flex items-center">
                  <input
                    id={qtyInputId}
                    type="text"
                    inputMode="numeric"
                    placeholder="50"
                    value={stockQty === '' ? '' : stockQty.toLocaleString('zh-TW')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setStockQty(raw === '' ? '' : parseInt(raw, 10));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-16 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                  <select
                    value={qtyUnit}
                    onChange={e => setQtyUnit(parseInt(e.target.value))}
                    className={`absolute right-1 top-1 bottom-1 bg-select-bg border border-border-glass ${styles.accentText} text-xs px-2 rounded-xl outline-none cursor-pointer font-mono font-medium`}
                  >
                    <option value={1000}>{t.unitLots}</option>
                    <option value={1}>{t.unitShares}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 股票總市值 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.marketValueLabel}</span>
              <div className={`bg-surface-glass border border-border-glass ${styles.accentText} px-4 py-3 rounded-xl text-lg font-bold font-mono`}>
                ${formatNumber(marketValue)} {t.currencyUnit}
              </div>
            </div>

            {/* 借款本金與快捷帶入按鈕 */}
            <div className={`flex flex-col gap-3 ${styles.divider} pt-5`}>
              <div className="flex justify-between items-center text-xs">
                <label htmlFor={loanInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.loanAmountLabel}</label>
                <span className={`${styles.accentText} font-mono text-[0.75rem]`}>
                  {t.maxLoan60}：${formatNumber(maxLoan60)}
                </span>
              </div>
              <input
                id={loanInputId}
                type="text"
                inputMode="numeric"
                placeholder="6,000,000"
                value={loanAmount === '' ? '' : loanAmount.toLocaleString('zh-TW')}
                onChange={e => {
                  const raw = e.target.value.replace(/[^\d]/g, '');
                  setLoanAmount(raw === '' ? '' : parseInt(raw, 10));
                }}
                className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
              />

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setLoanPercent(0.6)}
                  className={`${styles.chipBtn} py-2 px-2 text-xs font-mono ${
                    marketValue > 0 && numLoan === Math.round(marketValue * 0.6) ? styles.chipBtnActive : ''
                  }`}
                >
                  {t.loanBtn60}
                </button>
                <button
                  type="button"
                  onClick={() => setLoanPercent(0.5)}
                  className={`${styles.chipBtn} py-2 px-2 text-xs font-mono ${
                    marketValue > 0 && numLoan === Math.round(marketValue * 0.5) ? styles.chipBtnActive : ''
                  }`}
                >
                  {t.loanBtn50}
                </button>
              </div>

              {/* 質押年利率與利息試算 */}
              <div className="flex flex-col gap-2 mt-2 bg-surface-glass border border-border-glass p-3 rounded-xl">
                <div className="flex justify-between items-center">
                  <label htmlFor={rateInputId} className="text-xs text-text-sub font-medium">{t.loanAnnualRateLabel}</label>
                  <div className="flex items-center gap-1.5">
                    {[2.2, 2.5, 3.0].map(r => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setLoanAnnualRate(r)}
                        className={`text-xs px-2 py-0.5 rounded-lg border transition-all cursor-pointer font-mono ${
                          loanAnnualRate === r
                            ? `${styles.activeScheme}`
                            : 'bg-surface-glass border-border-glass text-text-sub'
                        }`}
                      >
                        {r}%
                      </button>
                    ))}
                  </div>
                </div>
                <input
                  id={rateInputId}
                  type="number"
                  step="0.05"
                  placeholder="2.5"
                  value={loanAnnualRate}
                  onChange={e => {
                    const val = e.target.value;
                    setLoanAnnualRate(val === '' ? '' : parseFloat(val));
                  }}
                  className={`w-full ${styles.inputField} px-3 py-1.5 rounded-lg text-sm outline-none transition-all font-mono`}
                />
                {numLoan > 0 && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-border-glass text-xs font-mono">
                    <div className="flex flex-col">
                      <span className="text-text-sub">{t.monthlyInterestLabel}</span>
                      <span className="text-text-main font-semibold">${formatNumber(monthlyInterest)} {t.currencyUnit}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-text-sub">{t.semiAnnualInterestLabel}</span>
                      <span className="text-text-main font-semibold">${formatNumber(semiAnnualInterest)} {t.currencyUnit}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* 追繳與安全門檻設定 */}
            <div className={`grid grid-cols-2 gap-4 ${styles.divider} pt-5`}>
              <div className="flex flex-col gap-2">
                <label htmlFor={warnInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.warnRateLabel}</label>
                <input
                  id={warnInputId}
                  type="number"
                  value={thresholdWarn}
                  onChange={e => {
                    const val = e.target.value;
                    setThresholdWarn(val === '' ? '' : parseFloat(val));
                  }}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={safeInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.safeRateLabel}</label>
                <input
                  id={safeInputId}
                  type="number"
                  value={thresholdSafe}
                  onChange={e => {
                    const val = e.target.value;
                    setThresholdSafe(val === '' ? '' : parseFloat(val));
                  }}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>
            </div>

            {/* 分享功能雙按鈕：複製網址 + 複製文字摘要 */}
            <div className="flex flex-col gap-2.5 mt-2">
              <button
                type="button"
                onClick={copyShareLink}
                className={`w-full h-[42px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
                  ${styles.activeScheme} rounded-xl transition-all duration-300 cursor-pointer`}
              >
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                  <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                </svg>
                {t.copyShareBtn}
              </button>
              <button
                type="button"
                onClick={copySummaryText}
                className="w-full h-[42px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
                  bg-surface-glass border border-border-glass text-text-sub hover:text-text-main rounded-xl transition-all duration-300 cursor-pointer"
              >
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                </svg>
                {t.copySummaryBtn}
              </button>
            </div>
          </div>

          {/* 右欄：儀表板與壓力模擬分析 */}
          <div className="flex flex-col gap-6">
            {/* 1. 質押維持率風險儀表板（座艙雙欄式） */}
            <div className={`${styles.glassCard} p-6 flex flex-col gap-5 shadow-lg relative`}>
              {/* 頂欄：標題 + 即時狀態膠囊 */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-glass pb-3">
                <h3 className="text-sm text-text-main uppercase tracking-[1px] font-semibold">
                  {t.dashboardTitle}
                </h3>
                <div className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-[1px] ${
                  numLoan === 0 || ratio >= numSafeRate
                    ? styles.statusSafeBadge
                    : ratio >= numWarnRate
                    ? styles.statusWarningBadge
                    : `${styles.statusDangerBadge} animate-pulse`
                }`}>
                  {numLoan === 0 && simMarketVal > 0
                    ? t.statusNoLoan
                    : ratio >= numSafeRate
                    ? t.statusSafe
                    : ratio >= numWarnRate
                    ? t.statusWarning
                    : t.statusDanger}
                </div>
              </div>

              {/* 中段主體：左側精密半圓儀表 + 右側核心維持率與風控緩衝數據 */}
              <div className="grid grid-cols-[1.15fr_1fr] gap-6 items-center max-sm:grid-cols-1">
                {/* 左側：SVG 刻度儀表與區間圖例 */}
                <div
                  className="flex flex-col items-center justify-center w-full"
                  role="meter"
                  aria-valuenow={Math.round(ratio)}
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
                    {/* 追繳處分區 (紅色 100% -> warnRate) */}
                    <path
                      d={`M 40,105 A 80,80 0 0,1 ${pWarn.x},${pWarn.y}`}
                      fill="none"
                      stroke="#ef4444"
                      strokeWidth="14"
                      strokeLinecap="butt"
                    />
                    {/* 警戒緩衝區 (琥珀黃 warnRate -> safeRate) */}
                    <path
                      d={`M ${pWarn.x},${pWarn.y} A 80,80 0 0,1 ${pSafe.x},${pSafe.y}`}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="14"
                      strokeLinecap="butt"
                    />
                    {/* 目標維持區 (翠綠 safeRate -> gaugeMax) */}
                    <path
                      d={`M ${pSafe.x},${pSafe.y} A 80,80 0 0,1 200,105`}
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
                    <text x="22" y="109" fontSize="9" fill="var(--text-sub, #94a3b8)" textAnchor="middle" fontFamily="monospace">{gaugeMin}%</text>
                    <text x={lblWarn.x} y={lblWarn.y} fontSize="9" fill="#ef4444" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{clampWarn}%</text>
                    <text x={lblSafe.x} y={lblSafe.y} fontSize="9" fill="#10b981" textAnchor="middle" fontFamily="monospace" fontWeight="bold">{clampSafe}%</text>
                    <text x="218" y="109" fontSize="9" fill="var(--text-sub, #94a3b8)" textAnchor="middle" fontFamily="monospace">{gaugeMax}%+</text>

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

                  {/* 底部三色區間圖例 */}
                  <div className="flex flex-wrap items-center justify-center gap-3 mt-1 text-xs font-mono text-text-sub">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#ef4444] inline-block" />
                      {t.legendDanger(numWarnRate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block" />
                      {t.legendWarn(numWarnRate, numSafeRate)}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#10b981] inline-block" />
                      {t.legendSafe(numSafeRate)}
                    </span>
                  </div>
                </div>

                {/* 右側：核心維持率大數字 + 3 項即時風控距離指標 */}
                <div className="flex flex-col gap-3 w-full">
                  <div className="bg-surface-glass border border-border-glass rounded-xl p-4 flex flex-col gap-1">
                    <span className="text-xs text-text-sub font-medium">{t.currentRatioLabel}</span>
                    <div className={`font-mono text-3xl font-bold tracking-tight ${
                      numLoan === 0 || ratio >= numSafeRate
                        ? styles.aprText
                        : ratio >= numWarnRate
                        ? styles.accentText
                        : 'text-[#ef4444]'
                    }`}>
                      {numLoan === 0 && simMarketVal > 0 ? '∞' : numLoan > 0 ? `${ratio.toFixed(2)}%` : '- %'}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 font-mono text-xs">
                    <div className="bg-surface-glass border border-border-glass px-3.5 py-2.5 rounded-xl flex justify-between items-center">
                      <span className="text-text-sub font-sans">{t.ltvRatioLabel}</span>
                      <span className="font-bold text-text-main">
                        {simMarketVal > 0 ? `${((numLoan / simMarketVal) * 100).toFixed(1)}%` : '0.0%'}
                      </span>
                    </div>
                    <div className="bg-surface-glass border border-border-glass px-3.5 py-2.5 rounded-xl flex justify-between items-center">
                      <span className="text-text-sub font-sans">{t.bufferToSafeLabel} ({numSafeRate}%)</span>
                      <span className={`font-bold ${numLoan > 0 && ratio < numSafeRate ? 'text-[#f59e0b]' : styles.aprText}`}>
                        {numLoan > 0 ? `${ratio >= numSafeRate ? '+' : ''}${(ratio - numSafeRate).toFixed(1)}%` : '-'}
                      </span>
                    </div>
                    <div className="bg-surface-glass border border-border-glass px-3.5 py-2.5 rounded-xl flex justify-between items-center">
                      <span className="text-text-sub font-sans">{t.bufferToWarnLabel} ({numWarnRate}%)</span>
                      <span className={`font-bold ${numLoan > 0 && ratio < numWarnRate ? 'text-[#ef4444]' : 'text-text-main'}`}>
                        {numLoan > 0 ? `${ratio >= numWarnRate ? '+' : ''}${(ratio - numWarnRate).toFixed(1)}%` : '-'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. 大跌壓力測試滑桿 */}
            <div className={`${styles.glassCard} p-6 flex flex-col gap-4 shadow-lg`}>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-text-sub uppercase tracking-[1px]">{t.stressTestTitle}</span>
                <span className={`font-mono text-base ${styles.accentText} font-bold`}>{stressDropPct}%</span>
              </div>

              {/* 壓力測試快捷按鈕 */}
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setStressDropPct(0)}
                  className={`${styles.chipBtn} ${stressDropPct === 0 ? styles.chipBtnActive : ''}`}
                >
                  {t.stressReset}
                </button>
                <button
                  type="button"
                  onClick={() => setStressDropPct(10)}
                  className={`${styles.chipBtn} ${stressDropPct === 10 ? styles.chipBtnActive : ''}`}
                >
                  {t.stressShortcut10}
                </button>
                <button
                  type="button"
                  onClick={() => setStressDropPct(20)}
                  className={`${styles.chipBtn} ${stressDropPct === 20 ? styles.chipBtnActive : ''}`}
                >
                  {t.stressShortcut20}
                </button>
                <button
                  type="button"
                  onClick={() => setStressDropPct(30)}
                  className={`${styles.chipBtn} ${stressDropPct === 30 ? styles.chipBtnActive : ''}`}
                >
                  {t.stressShortcut30}
                </button>
              </div>

              <input
                type="range"
                min="0"
                max="60"
                step="1"
                aria-label={t.stressTestTitle}
                value={stressDropPct}
                onChange={e => setStressDropPct(parseInt(e.target.value, 10) || 0)}
                className={styles.rangeSlider}
              />

              <div className="grid grid-cols-2 gap-4 font-mono text-xs max-sm:grid-cols-1">
                <div className="bg-surface-glass border border-border-glass p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-text-sub font-medium">{t.simPriceLabel}</span>
                  <span className="text-base text-text-main font-bold">${simPrice.toFixed(2)} {t.currencyUnit}</span>
                </div>
                <div className="bg-surface-glass border border-border-glass p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-text-sub font-medium">{t.simValueLabel}</span>
                  <span className="text-base text-text-main font-bold">${formatNumber(simMarketVal)} {t.currencyUnit}</span>
                </div>
              </div>
            </div>

            {/* 3. 臨界點資訊卡片（含跌停板天數預警） */}
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">{t.warnPriceTitle(numWarnRate)}</span>
                <span className="text-xl font-bold text-[#ef4444] font-mono">${warnPrice.toFixed(2)} {t.currencyUnit}</span>
                <div className="flex flex-col text-xs text-text-sub font-mono gap-0.5">
                  <span>
                    {t.allowDrop}：<strong className="text-[#ef4444]">{warnDrop.toFixed(2)}%</strong>
                  </span>
                  <span className="text-xs text-text-sub/80">
                    {t.limitDownDaysDesc(warnLimitDownDays)}
                  </span>
                </div>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">{t.safePriceTitle(numSafeRate)}</span>
                <span className={`text-xl font-bold font-mono ${styles.aprText}`}>${safePrice.toFixed(2)} {t.currencyUnit}</span>
                <div className="flex flex-col text-xs text-text-sub font-mono gap-0.5">
                  <span>
                    {t.allowDrop}：<strong className={styles.aprText}>{safeDrop.toFixed(2)}%</strong>
                  </span>
                  <span className="text-xs text-text-sub/80">
                    {t.limitDownDaysDesc(safeLimitDownDays)}
                  </span>
                </div>
              </div>
            </div>

            {/* 4. 保證金安全回補金額試算（三合一方案：A 還本、B 補現金、C 追加現股） */}
            <div className={`border rounded-2xl p-6 flex flex-col gap-4 shadow-lg transition-all ${
              isBelowSafe
                ? 'bg-[#ef4444]/10 border-[#ef4444]/40'
                : styles.glassCard
            }`}>
              <h3 className="text-sm uppercase tracking-[1px] font-semibold flex items-center gap-2">
                {isBelowSafe ? (
                  <span className="text-[#ef4444] flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                      <path d="M12 2L1 21h22L12 2zm1 14h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                    </svg>
                    {t.replenishAlertBelow(numSafeRate)}
                  </span>
                ) : (
                  <span className={`flex items-center gap-1.5 ${styles.aprText}`}>
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    {t.replenishAlertSafe}
                  </span>
                )}
              </h3>

              <div className="grid grid-cols-2 gap-4 font-mono text-xs max-sm:grid-cols-1">
                <div className="bg-surface-glass border border-border-glass p-4 rounded-xl flex flex-col gap-1">
                  <span className="text-text-sub font-medium">{t.planA}</span>
                  <span className={`text-base font-bold ${isBelowSafe ? 'text-[#ef4444]' : 'text-text-main'}`}>
                    ${formatNumber(repayAmt)} {t.currencyUnit}
                  </span>
                </div>
                <div className="bg-surface-glass border border-border-glass p-4 rounded-xl flex flex-col gap-1">
                  <span className="text-text-sub font-medium">{t.planB}</span>
                  <span className={`text-base font-bold ${isBelowSafe ? 'text-[#ef4444]' : 'text-text-main'}`}>
                    ${formatNumber(cashAmt)} {t.currencyUnit}
                  </span>
                </div>
              </div>

              {/* 方案 C：追加現股擔保品 */}
              {isBelowSafe && (
                <div className="bg-surface-glass border border-border-glass p-4 rounded-xl flex flex-col gap-2 font-mono text-xs">
                  <div className="flex justify-between items-center">
                    <span className="text-text-sub font-medium">{t.planC}</span>
                    <div className="flex items-center gap-1.5">
                      <label htmlFor={collateralInputId} className="text-xs text-text-sub font-sans">{t.collateralPriceLabel}:</label>
                      <input
                        id={collateralInputId}
                        type="number"
                        step="0.1"
                        value={collateralPrice}
                        onChange={e => {
                          const val = e.target.value;
                          setCollateralPrice(val === '' ? '' : parseFloat(val));
                        }}
                        className={`w-20 ${styles.inputField} px-2 py-0.5 rounded text-xs text-right`}
                      />
                    </div>
                  </div>
                  <div className="text-sm font-bold text-text-main">
                    {t.planCDesc(addSharesRequired, addLotsRequired)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 通用 FAQ 常見問題區塊 */}
        <FaqSection
          items={t.faqItems}
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          accentColor="#eab308"
        />
      </ToolLayout>

      {/* Toast 提示條 */}
      <div className={`fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 text-sm rounded-xl z-[100] pointer-events-none
        ${styles.activeScheme} backdrop-blur-[10px] shadow-2xl transition-all duration-400 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[100px]'}`}>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}

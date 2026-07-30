'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import styles from './pledge-calculator.module.css';

function formatNumber(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  return Math.round(val).toLocaleString('zh-TW');
}

export default function PledgeCalculatorClient() {
  // 輸入欄位狀態 (單位：元 / 張 / %)
  const [stockPrice, setStockPrice] = useState<number | ''>(200);
  const [stockQty, setStockQty] = useState<number | ''>(50);
  const [qtyUnit, setQtyUnit] = useState<number>(1000); // 1000 = 張, 1 = 股
  const [loanAmount, setLoanAmount] = useState<number | ''>(6000000); // 借款本金 (元)
  const [thresholdWarn, setThresholdWarn] = useState<number | ''>(130); // 追繳門檻 %
  const [thresholdSafe, setThresholdSafe] = useState<number | ''>(160); // 安全門檻 %

  // 大跌壓力測試滑桿 (0% - 60%)
  const [stressDropPct, setStressDropPct] = useState<number>(0);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const priceInputId = useId();
  const qtyInputId = useId();
  const loanInputId = useId();
  const warnInputId = useId();
  const safeInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  // 設定全頁背景主題色 (金黃色)
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ffb800');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 184, 0, 0.6)');
  }, []);

  // 計算股數與總市值
  const numPrice = stockPrice === '' ? 0 : stockPrice;
  const numQty = stockQty === '' ? 0 : stockQty;
  const totalShares = numQty * qtyUnit;
  const marketValue = numPrice * totalShares;

  const maxLoan60 = marketValue * 0.6;
  const maxLoan50 = marketValue * 0.5;

  const numLoan = loanAmount === '' ? 0 : loanAmount;
  const numWarnRate = thresholdWarn === '' ? 130 : thresholdWarn;
  const numSafeRate = thresholdSafe === '' ? 160 : thresholdSafe;

  // A. 臨界點計算
  let warnPrice = 0;
  let warnDrop = 0;
  let safePrice = 0;
  let safeDrop = 0;

  if (numLoan > 0 && totalShares > 0 && numPrice > 0) {
    warnPrice = ((numWarnRate / 100) * numLoan) / totalShares;
    warnDrop = Math.max(0, ((numPrice - warnPrice) / numPrice) * 100);

    safePrice = ((numSafeRate / 100) * numLoan) / totalShares;
    safeDrop = Math.max(0, ((numPrice - safePrice) / numPrice) * 100);
  }

  // B. 大跌壓力測試模擬
  const simPrice = numPrice * (1 - stressDropPct / 100);
  const simMarketVal = marketValue * (1 - stressDropPct / 100);

  // C. 維持率與儀表板動態旋轉角度 (-90deg ~ +90deg)
  let ratio = 0;
  if (numLoan > 0) {
    ratio = (simMarketVal / numLoan) * 100;
  }

  let needleDeg = -90;
  if (numLoan === 0 && simMarketVal > 0) {
    needleDeg = 90;
  } else if (ratio >= 200) {
    needleDeg = 90;
  } else if (ratio <= 100) {
    needleDeg = -90;
  } else {
    needleDeg = -90 + (ratio - 100) * 1.8;
  }

  // D. 保證金安全回補金額試算 (方案 A 償還本金 / 方案 B 補繳現金)
  let repayAmt = 0;
  let cashAmt = 0;
  const isBelowSafe = numLoan > 0 && ratio < numSafeRate;

  if (isBelowSafe) {
    const targetSec = numSafeRate / 100;
    repayAmt = Math.max(0, numLoan - simMarketVal / targetSec);
    cashAmt = Math.max(0, numLoan * targetSec - simMarketVal);
  }

  // 快捷帶入本金金額
  const setLoanPercent = (pct: number) => {
    const targetLoan = Math.round(marketValue * pct);
    setLoanAmount(targetLoan);
  };

  // 複製試算分享連結
  const copyShareLink = () => {
    const params = new URLSearchParams({
      p: numPrice.toString(),
      q: numQty.toString(),
      u: qtyUnit.toString(),
      l: numLoan.toString(),
      w: numWarnRate.toString(),
      s: numSafeRate.toString(),
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => showToast('已複製質押維持率試算分享連結'));
  };

  return (
    <>
      <ToolLayout
        title="股票質押維持率計算機"
        subtitle="STOCK PLEDGE & MARGIN CALCULATOR"
        description="專業免費的線上股票質押與維持率壓力測試計算機！支援張/股單位切換、自訂 130%/160% 門檻、動態 SVG 儀表板、0%-60% 大跌模擬與保證金回補金額試算。"
        accentColor="#ffb800"
        accentGlow="rgba(255, 184, 0, 0.6)"
      >
        <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
          {/* 左欄：質押資產設定面板 */}
          <div className={`${styles.glassCard} p-8 flex flex-col gap-6 shadow-lg`}>
            <h3 className={`text-sm ${styles.accentText} uppercase tracking-[1px] font-semibold border-b border-border-glass pb-3`}>
              質押資產設定
            </h3>

            {/* 個股單價與持股數量 */}
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className="flex flex-col gap-2">
                <label htmlFor={priceInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">目前個股單價 (元)</label>
                <input
                  id={priceInputId}
                  type="number"
                  step="0.1"
                  placeholder="例如：200"
                  value={stockPrice}
                  onChange={e => setStockPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={qtyInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">持股數量</label>
                <div className="relative flex items-center">
                  <input
                    id={qtyInputId}
                    type="text"
                    inputMode="numeric"
                    placeholder="例如：50"
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
                    <option value={1000}>張</option>
                    <option value={1}>股</option>
                  </select>
                </div>
              </div>
            </div>

            {/* 股票總市值 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">目前股票總市值</span>
              <div className={`bg-surface-glass border border-border-glass ${styles.accentText} px-4 py-3 rounded-xl text-lg font-bold font-mono`}>
                ${formatNumber(marketValue)} 元
              </div>
            </div>

            {/* 借款本金與快捷帶入按鈕 */}
            <div className={`flex flex-col gap-3 ${styles.divider} pt-5`}>
              <div className="flex justify-between items-center text-xs">
                <label htmlFor={loanInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">借款本金 (元)</label>
                <span className={`${styles.accentText} font-mono text-[0.75rem]`}>
                  60% 上限：${formatNumber(maxLoan60)}
                </span>
              </div>
              <input
                id={loanInputId}
                type="text"
                inputMode="numeric"
                placeholder="例如：6,000,000"
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
                  className={`py-2 px-2 text-xs ${styles.activeScheme} rounded-xl transition-all cursor-pointer font-mono font-medium`}
                >
                  帶入 60% 借款 (成數上限)
                </button>
                <button
                  type="button"
                  onClick={() => setLoanPercent(0.5)}
                  className="py-2 px-2 text-xs bg-surface-glass border border-border-glass text-text-sub rounded-xl hover:text-text-main transition-all cursor-pointer font-mono font-medium"
                >
                  帶入 50% 借款 (安全防線)
                </button>
              </div>
            </div>

            {/* 追繳與安全門檻設定 */}
            <div className={`grid grid-cols-2 gap-4 ${styles.divider} pt-5`}>
              <div className="flex flex-col gap-2">
                <label htmlFor={warnInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">追繳維持率門檻 (%)</label>
                <input
                  id={warnInputId}
                  type="number"
                  value={thresholdWarn}
                  onChange={e => setThresholdWarn(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={safeInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">目標安全維持率 (%)</label>
                <input
                  id={safeInputId}
                  type="number"
                  value={thresholdSafe}
                  onChange={e => setThresholdSafe(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>
            </div>

            {/* 複製分享連結 */}
            <button
              type="button"
              onClick={copyShareLink}
              className={`mt-2 w-full h-[44px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
                ${styles.activeScheme} rounded-xl transition-all duration-300 cursor-pointer`}
            >
              複製質押試算分享連結
            </button>
          </div>

          {/* 右欄：儀表板與壓力模擬分析 */}
          <div className="flex flex-col gap-6">
            {/* 1. SVG 儀表板 */}
            <div className={`${styles.glassCard} p-6 flex flex-col items-center justify-center shadow-lg relative`}>
              <h3 className="text-sm text-text-main uppercase tracking-[1px] font-semibold mb-4 self-start">
                質押維持率風險儀表板
              </h3>

              <div className="relative w-full max-w-[320px] flex flex-col items-center">
                <svg className="w-full drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]" viewBox="0 0 200 110">
                  {/* 背景弧線 */}
                  <path d="M 30,90 A 70,70 0 0,1 170,90" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="12" strokeLinecap="round" />
                  {/* 危險區 (紅色 100%-130%) */}
                  <path d="M 30,90 A 70,70 0 0,1 71.2,40.5" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="butt" />
                  {/* 警示區 (黃色 130%-160%) */}
                  <path d="M 71.2,40.5 A 70,70 0 0,1 128.8,40.5" fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="butt" />
                  {/* 安全區 (綠色 160%-200%) */}
                  <path d="M 128.8,40.5 A 70,70 0 0,1 170,90" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" />

                  {/* 動態旋轉指針 */}
                  <line
                    x1="100"
                    y1="90"
                    x2="100"
                    y2="35"
                    stroke="currentColor"
                    strokeWidth="4"
                    strokeLinecap="round"
                    className={`${styles.gaugeNeedle} ${styles.accentText}`}
                    style={{ transform: `rotate(${needleDeg}deg)` }}
                  />
                  {/* 中心點 */}
                  <circle cx="100" cy="90" r="7" fill="var(--card-bg-solid, #ffffff)" stroke="currentColor" strokeWidth="2" className={styles.accentText} />
                </svg>

                <div className="font-mono text-3xl font-bold text-text-main mt-[-1rem]">
                  {numLoan === 0 && simMarketVal > 0 ? '∞' : numLoan > 0 ? `${ratio.toFixed(2)}%` : '- %'}
                </div>

                <div className={`mt-2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-[1px] border ${
                  numLoan === 0 || ratio >= numSafeRate
                    ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]'
                    : ratio >= numWarnRate
                    ? 'bg-[#f59e0b]/15 border-[#f59e0b]/40 text-[#f59e0b]'
                    : 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444] animate-pulse'
                }`}>
                  {numLoan === 0 && simMarketVal > 0
                    ? '無借款安全區'
                    : ratio >= numSafeRate
                    ? '安全健康'
                    : ratio >= numWarnRate
                    ? '低於安全線 (警示)'
                    : '低於門檻 (追繳被斷頭)'}
                </div>
              </div>
            </div>

            {/* 2. 大跌壓力測試滑桿 */}
            <div className={`${styles.glassCard} p-6 flex flex-col gap-4 shadow-lg`}>
              <div className="flex justify-between items-center text-sm font-semibold">
                <span className="text-text-sub uppercase tracking-[1px]">模擬大盤 / 股價大跌壓力測試</span>
                <span className={`font-mono text-base ${styles.accentText} font-bold`}>{stressDropPct}%</span>
              </div>

              <input
                type="range"
                min="0"
                max="60"
                step="1"
                value={stressDropPct}
                onChange={e => setStressDropPct(parseInt(e.target.value) || 0)}
                className={styles.rangeSlider}
              />

              <div className="grid grid-cols-2 gap-4 font-mono text-xs max-sm:grid-cols-1">
                <div className="bg-surface-glass border border-border-glass p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-text-sub font-medium">模擬股價</span>
                  <span className="text-base text-text-main font-bold">${simPrice.toFixed(2)} 元</span>
                </div>
                <div className="bg-surface-glass border border-border-glass p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-text-sub font-medium">模擬總市值</span>
                  <span className="text-base text-text-main font-bold">${formatNumber(simMarketVal)} 元</span>
                </div>
              </div>
            </div>

            {/* 3. 臨界點資訊卡片 */}
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">觸發追繳臨界價 ({numWarnRate}%)</span>
                <span className="text-xl font-bold text-[#ef4444] font-mono">${warnPrice.toFixed(2)} 元</span>
                <span className="text-xs text-text-sub font-mono">
                  容許跌幅：<strong className="text-[#ef4444]">{warnDrop.toFixed(2)}%</strong>
                </span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">維持安全線臨界價 ({numSafeRate}%)</span>
                <span className={`text-xl font-bold font-mono ${styles.aprText}`}>${safePrice.toFixed(2)} 元</span>
                <span className="text-xs text-text-sub font-mono">
                  容許跌幅：<strong className={styles.aprText}>{safeDrop.toFixed(2)}%</strong>
                </span>
              </div>
            </div>

            {/* 4. 保證金安全回補金額試算 */}
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
                    已低於目標安全維持率 {numSafeRate}%，補繳方案試算：
                  </span>
                ) : (
                  <span className={`flex items-center gap-1.5 ${styles.aprText}`}>
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                    </svg>
                    模擬維持率處於安全區，無須補繳
                  </span>
                )}
              </h3>

              <div className="grid grid-cols-2 gap-4 font-mono text-xs max-sm:grid-cols-1">
                <div className="bg-surface-glass border border-border-glass p-4 rounded-xl flex flex-col gap-1">
                  <span className="text-text-sub font-medium">方案 A：償還借款本金</span>
                  <span className={`text-base font-bold ${isBelowSafe ? 'text-[#ef4444]' : 'text-text-main'}`}>
                    ${formatNumber(repayAmt)} 元
                  </span>
                </div>
                <div className="bg-surface-glass border border-border-glass p-4 rounded-xl flex flex-col gap-1">
                  <span className="text-text-sub font-medium">方案 B：補繳現金擔保</span>
                  <span className={`text-base font-bold ${isBelowSafe ? 'text-[#ef4444]' : 'text-text-main'}`}>
                    ${formatNumber(cashAmt)} 元
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
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

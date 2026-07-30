'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import styles from './futures-calculator.module.css';

interface Preset {
  id: 'tx' | 'mtx' | 'tmf' | 'custom';
  name: string;
  multiplier: number;
  initialMargin: number;
  maintMargin: number;
}

const PRESETS: Preset[] = [
  { id: 'tx', name: '大台 (TX)', multiplier: 200, initialMargin: 242000, maintMargin: 186000 },
  { id: 'mtx', name: '小台 (MTX)', multiplier: 50, initialMargin: 60500, maintMargin: 46500 },
  { id: 'tmf', name: '微台 (TMF)', multiplier: 10, initialMargin: 12100, maintMargin: 9300 },
  { id: 'custom', name: '自訂商品', multiplier: 200, initialMargin: 242000, maintMargin: 186000 },
];

function formatNumber(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  return Math.round(val).toLocaleString('zh-TW');
}

export default function FuturesCalculatorClient() {
  const [selectedPreset, setSelectedPreset] = useState<'tx' | 'mtx' | 'tmf' | 'custom'>('tx');
  const [position, setPosition] = useState<'long' | 'short'>('long');

  const [indexPrice, setIndexPrice] = useState<number | ''>(22000);
  const [quantity, setQuantity] = useState<number | ''>(1);
  const [capital, setCapital] = useState<number | ''>(300000);

  const [multiplier, setMultiplier] = useState<number | ''>(200);
  const [initialMargin, setInitialMargin] = useState<number | ''>(242000);
  const [maintMargin, setMaintMargin] = useState<number | ''>(186000);

  // 壓力測試滑桿 (0% - 60%)
  const [stressDropPct, setStressDropPct] = useState<number>(0);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const indexInputId = useId();
  const quantityInputId = useId();
  const capitalInputId = useId();
  const multInputId = useId();
  const initMarginInputId = useId();
  const maintMarginInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  // 設定全頁背景主題色 (赤紅/火力紅)
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff3b30');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 59, 48, 0.6)');
  }, []);

  const handlePresetSelect = (presetId: 'tx' | 'mtx' | 'tmf' | 'custom') => {
    setSelectedPreset(presetId);
    const item = PRESETS.find(p => p.id === presetId);
    if (item && presetId !== 'custom') {
      setMultiplier(item.multiplier);
      setInitialMargin(item.initialMargin);
      setMaintMargin(item.maintMargin);
    }
  };

  // 數值防呆解析
  const numIndex = indexPrice === '' ? 0 : indexPrice;
  const numQty = quantity === '' ? 0 : quantity;
  const numCapital = capital === '' ? 0 : capital;
  const numPtVal = multiplier === '' ? 0 : multiplier;
  const numInit = initialMargin === '' ? 0 : initialMargin;
  const numMaint = maintMargin === '' ? 0 : maintMargin;

  const contractValue = numIndex * numQty * numPtVal;
  const totalInitMargin = numInit * numQty;
  const totalMaintMargin = numMaint * numQty;
  const actualLeverage = numCapital > 0 ? contractValue / numCapital : 0;

  // A. 追繳與斷頭臨界點估算
  let marginCallPts = 0;
  let marginCallPrice = 0;
  let liqPts = 0;
  let liqPrice = 0;

  if (numCapital > 0 && numQty > 0 && numPtVal > 0) {
    const warnLoss = numCapital - totalMaintMargin;
    marginCallPts = warnLoss / (numQty * numPtVal);
    marginCallPrice = position === 'long' ? numIndex - marginCallPts : numIndex + marginCallPts;

    const liqLoss = numCapital - totalInitMargin * 0.25;
    liqPts = liqLoss / (numQty * numPtVal);
    liqPrice = position === 'long' ? numIndex - liqPts : numIndex + liqPts;
  }

  // B. 大跌壓力測試
  const dropPoints = numIndex * (stressDropPct / 100);
  const simIndex = position === 'long' ? numIndex - dropPoints : numIndex + dropPoints;
  const simLoss = dropPoints * numQty * numPtVal;
  const simCapital = numCapital - simLoss;

  // C. SVG 風險指標儀表板 (-90deg ~ +90deg)
  let riskRatio = 0;
  if (totalInitMargin > 0) {
    riskRatio = (simCapital / totalInitMargin) * 100;
  }

  let needleDeg = -90;
  if (totalInitMargin === 0 && simCapital > 0) {
    needleDeg = 90;
  } else if (riskRatio >= 200) {
    needleDeg = 90;
  } else if (riskRatio <= 0) {
    needleDeg = -90;
  } else {
    needleDeg = -90 + riskRatio * 0.9;
  }

  // D. 保證金安全回補金額試算 (補足至 100% 原始保證金)
  const isBelowInit = totalInitMargin > 0 && simCapital < totalInitMargin;
  const topupCash = isBelowInit ? Math.max(0, totalInitMargin - simCapital) : 0;

  // 快捷本金設定
  const setCapitalPreset = (multiplierRatio: number) => {
    const targetCap = Math.round(totalInitMargin * multiplierRatio);
    setCapital(targetCap);
  };

  // 複製試算分享連結
  const copyShareLink = () => {
    const params = new URLSearchParams({
      p: selectedPreset,
      dir: position,
      idx: numIndex.toString(),
      q: numQty.toString(),
      cap: numCapital.toString(),
      m: numPtVal.toString(),
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => showToast('已複製期貨槓桿試算分享連結'));
  };

  return (
    <>
      <ToolLayout
        title="台股期貨槓桿計算機"
        subtitle="TAIWAN FUTURES RISK & MARGIN CALCULATOR"
        description="專業免費的線上台指期 (大台/小台/微台/自訂) 槓桿與維持率計算器！支援多空雙向部位切換、實質槓桿試算、0%-60%逆風壓力測試與保證金回補金額估算。"
        accentColor="#ff3b30"
        accentGlow="rgba(255, 59, 48, 0.6)"
      >
        <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
          {/* 左欄：設定區 */}
          <div className={`${styles.glassCard} p-8 flex flex-col gap-6 shadow-lg`}>
            <h3 className={`text-sm ${styles.accentText} uppercase tracking-[1px] font-semibold border-b border-border-glass pb-3`}>
              期貨部位與保證金設定
            </h3>

            {/* 商品規格選擇 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">商品規格</span>
              <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
                {PRESETS.map(p => (
                  <button
                    key={p.id}
                    onClick={() => handlePresetSelect(p.id)}
                    className={`py-2 px-3 text-sm rounded-lg cursor-pointer transition-all border ${
                      selectedPreset === p.id
                        ? styles.activeScheme
                        : 'border-transparent text-text-sub hover:text-text-main'
                    }`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 自訂每點點值 */}
            {selectedPreset === 'custom' && (
              <div className="flex flex-col gap-2 bg-surface-glass p-4 rounded-xl border border-border-glass">
                <label htmlFor={multInputId} className={`text-sm ${styles.accentText} font-medium uppercase tracking-[1px]`}>自訂每點點值 (元/點)</label>
                <input
                  id={multInputId}
                  type="number"
                  value={multiplier}
                  onChange={e => setMultiplier(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-base outline-none font-mono`}
                />
              </div>
            )}

            {/* 多空部位切換 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">交易方向 (部位)</span>
              <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1 rounded-xl`}>
                <button
                  onClick={() => setPosition('long')}
                  className={`py-2 text-sm rounded-lg cursor-pointer transition-all border ${
                    position === 'long'
                      ? 'bg-red-500/20 border-red-500/40 text-red-500 font-semibold'
                      : 'border-transparent text-text-sub hover:text-text-main'
                  }`}
                >
                  多頭 (看漲 做多)
                </button>
                <button
                  onClick={() => setPosition('short')}
                  className={`py-2 text-sm rounded-lg cursor-pointer transition-all border ${
                    position === 'short'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-600 font-semibold'
                      : 'border-transparent text-text-sub hover:text-text-main'
                  }`}
                >
                  空頭 (看跌 做空)
                </button>
              </div>
            </div>

            {/* 成交點位、口數與準備本金 */}
            <div className={`flex flex-col gap-4 ${styles.divider} pt-4`}>
              <div className="flex flex-col gap-2">
                <label htmlFor={indexInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">成交指數點位 (點)</label>
                <input
                  id={indexInputId}
                  type="text"
                  inputMode="numeric"
                  placeholder="例如：22,000"
                  value={indexPrice === '' ? '' : indexPrice.toLocaleString('zh-TW')}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setIndexPrice(raw === '' ? '' : parseInt(raw, 10));
                  }}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor={quantityInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">下單口數 (口)</label>
                  <input
                    id={quantityInputId}
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                    className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={capitalInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">準備本金 (元)</label>
                  <input
                    id={capitalInputId}
                    type="text"
                    inputMode="numeric"
                    value={capital === '' ? '' : capital.toLocaleString('zh-TW')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setCapital(raw === '' ? '' : parseInt(raw, 10));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                </div>
              </div>

              {/* 本金快捷帶入按鈕 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCapitalPreset(1.5)}
                  className={`py-2 px-1 text-sm ${styles.activeScheme} rounded-lg transition-all cursor-pointer font-mono font-medium`}
                >
                  投入 1.5 倍原始保證金
                </button>
                <button
                  onClick={() => setCapitalPreset(2.0)}
                  className="py-2 px-1 text-sm bg-surface-glass border border-border-glass text-text-sub rounded-lg hover:text-text-main transition-all cursor-pointer font-mono font-medium"
                >
                  投入 2.0 倍原始保證金
                </button>
              </div>
            </div>

            {/* 單口保證金標準 (自由編輯) */}
            <div className={`grid grid-cols-2 gap-4 ${styles.divider} pt-4`}>
              <div className="flex flex-col gap-2">
                <label htmlFor={initMarginInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">單口原始保證金 (元)</label>
                <input
                  id={initMarginInputId}
                  type="text"
                  inputMode="numeric"
                  value={initialMargin === '' ? '' : initialMargin.toLocaleString('zh-TW')}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setInitialMargin(raw === '' ? '' : parseInt(raw, 10));
                  }}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={maintMarginInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">單口維持保證金 (元)</label>
                <input
                  id={maintMarginInputId}
                  type="text"
                  inputMode="numeric"
                  value={maintMargin === '' ? '' : maintMargin.toLocaleString('zh-TW')}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setMaintMargin(raw === '' ? '' : parseInt(raw, 10));
                  }}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>
            </div>

            {/* 複製試算分享按鈕 */}
            <button
              onClick={copyShareLink}
              className={`mt-2 w-full h-[44px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
                ${styles.activeScheme} rounded-xl transition-all duration-300 cursor-pointer`}
            >
              複製期貨槓桿試算分享連結
            </button>
          </div>

          {/* 右欄：風險計算與指標 */}
          <div className="flex flex-col gap-6">
            {/* 1. SVG 風險指標儀表板 */}
            <div className={`${styles.glassCard} p-6 flex flex-col items-center justify-center shadow-lg relative`}>
              <h3 className="text-sm text-text-sub uppercase tracking-[1px] font-semibold mb-4 self-start">
                風控指標與實質槓桿儀表板
              </h3>

              <div className="relative w-full max-w-[320px] flex flex-col items-center">
                <svg className="w-full drop-shadow-[0_5px_15px_rgba(0,0,0,0.3)]" viewBox="0 0 200 110">
                  {/* 背景弧線 */}
                  <path d="M 30,90 A 70,70 0 0,1 170,90" fill="none" stroke="rgba(148,163,184,0.2)" strokeWidth="12" strokeLinecap="round" />
                  {/* 斷頭區 (紅色 0%-25%) */}
                  <path d="M 30,90 A 70,70 0 0,1 35.33,63.21" fill="none" stroke="#ef4444" strokeWidth="12" strokeLinecap="butt" />
                  {/* 追繳警示區 (黃色 25%-100%) */}
                  <path d="M 35.33,63.21 A 70,70 0 0,1 100,20" fill="none" stroke="#f59e0b" strokeWidth="12" strokeLinecap="butt" />
                  {/* 安全區 (綠色 100%-200%) */}
                  <path d="M 100,20 A 70,70 0 0,1 170,90" fill="none" stroke="#10b981" strokeWidth="12" strokeLinecap="round" />

                  {/* 指針 */}
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
                  {totalInitMargin === 0 && simCapital > 0 ? '∞' : totalInitMargin > 0 ? `${(riskRatio > 0 ? riskRatio : 0).toFixed(2)}%` : '- %'}
                </div>

                <div className={`mt-2 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-[1px] border ${
                  totalInitMargin === 0 || riskRatio >= 100
                    ? 'bg-[#10b981]/15 border-[#10b981]/40 text-[#10b981]'
                    : simCapital >= totalMaintMargin
                    ? 'bg-[#f59e0b]/15 border-[#f59e0b]/40 text-[#f59e0b]'
                    : 'bg-[#ef4444]/15 border-[#ef4444]/40 text-[#ef4444] animate-pulse'
                }`}>
                  {totalInitMargin === 0 && simCapital > 0
                    ? '部位完全安全'
                    : riskRatio >= 100
                    ? '安全 (高於原始保證金)'
                    : simCapital >= totalMaintMargin
                    ? '警示 (低於原始保證金)'
                    : riskRatio >= 25
                    ? '追繳 (低於維持保證金)'
                    : '即將強制平倉 (風險 < 25%)'}
                </div>
              </div>
            </div>

            {/* 實質槓桿與合約規模 */}
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className={styles.statCard}>
                <span className="text-sm text-text-sub font-semibold uppercase tracking-[1px] mb-1">合約總價值 (規模)</span>
                <span className="font-mono text-xl font-bold text-text-main">${formatNumber(contractValue)} 元</span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm text-text-sub font-semibold uppercase tracking-[1px] mb-1">當前實質資金槓桿</span>
                <span className={`font-mono text-2xl font-bold ${styles.accentText}`}>
                  {actualLeverage.toFixed(2)} 倍
                </span>
                <span className="text-xs text-text-sub mt-1">
                  {actualLeverage <= 2.5 ? '安全風控等級' : actualLeverage <= 5 ? '適中風險等級' : '高槓桿高風險'}
                </span>
              </div>
            </div>

            {/* 2. 0%-60% 逆風波段壓力測試 */}
            <div className={`${styles.glassCard} p-6 flex flex-col gap-4 shadow-lg`}>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-text-sub uppercase tracking-[1px]">
                  模擬逆風波段 ({position === 'long' ? '指數下跌' : '指數上漲'})
                </span>
                <span className={`font-mono text-sm ${styles.accentText} font-bold`}>
                  {stressDropPct.toFixed(1)}% <span className="text-xs text-text-sub font-normal">(折合 {formatNumber(dropPoints)} 點)</span>
                </span>
              </div>

              <input
                type="range"
                min="0"
                max="60"
                step="0.1"
                value={stressDropPct}
                onChange={e => setStressDropPct(parseFloat(e.target.value) || 0)}
                className={styles.rangeSlider}
              />

              <div className="grid grid-cols-2 gap-4 font-mono text-xs max-sm:grid-cols-1">
                <div className="bg-surface-glass border border-border-glass p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-text-sub">模擬成交指數</span>
                  <span className="text-base text-text-main font-bold">{formatNumber(simIndex)} 點</span>
                </div>
                <div className="bg-surface-glass border border-border-glass p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-text-sub">預估模擬權益數</span>
                  <span className="text-base text-text-main font-bold">${formatNumber(simCapital)} 元</span>
                  <span className="text-[0.7rem] text-[#ef4444]">損益：-${formatNumber(simLoss)} 元</span>
                </div>
              </div>
            </div>

            {/* 3. 臨界點資訊卡片 */}
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className={`${styles.statCard} font-mono`}>
                <span className="text-sm font-semibold text-text-sub">追繳警示點位 (維持保證金)</span>
                <span className="text-xl font-bold text-[#f59e0b]">{formatNumber(marginCallPrice)} 點</span>
                <span className="text-xs text-text-sub">
                  容許逆風：<strong className="text-[#f59e0b]">{formatNumber(marginCallPts)} 點</strong>
                </span>
              </div>

              <div className={`${styles.statCard} font-mono`}>
                <span className="text-sm font-semibold text-text-sub">強制平倉點位 (風險指標 25%)</span>
                <span className={`text-xl font-bold ${styles.accentText}`}>{formatNumber(liqPrice)} 點</span>
                <span className="text-xs text-text-sub">
                  容許逆風：<strong className={styles.accentText}>{formatNumber(liqPts)} 點</strong>
                </span>
              </div>
            </div>

            {/* 4. 保證金安全回補金額試算 */}
            <div className={`border rounded-2xl p-6 flex flex-col gap-4 shadow-lg transition-all ${
              isBelowInit
                ? 'bg-[#ef4444]/10 border-[#ef4444]/40'
                : styles.glassCard
            }`}>
              <h3 className="text-xs uppercase tracking-[1px] font-semibold flex items-center gap-2">
                {isBelowInit ? (
                  <span className="text-[#ef4444]">⚠️ 模擬權益數已低於總原始保證金，回補至 100% 原始保證金水位：</span>
                ) : (
                  <span className="text-[#10b981]">🟢 權益數高於原始保證金，無須補繳</span>
                )}
              </h3>

              <div className="font-mono text-xs bg-surface-glass border border-border-glass p-4 rounded-xl flex flex-col gap-1">
                <span className="text-text-sub font-semibold text-xs">需補足至 100% 原始保證金之現金</span>
                <span className={`text-base font-bold ${isBelowInit ? 'text-[#ef4444]' : 'text-text-main'}`}>
                  ${formatNumber(topupCash)} 元
                </span>
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

'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './futures-calculator.module.css';
import { calculateFutures } from './engine';
import { D, toNumber } from '../utils/decimal';
import { TRANSLATIONS } from './translations';
import { ContextualSponsorCard } from '../components/ContextualSponsorCard';

interface Preset {
  id: 'tx' | 'mtx' | 'tmf' | 'custom';
  name: string;
  multiplier: number;
  initialMargin: number;
  maintMargin: number;
}

interface FuturesCalculatorClientProps {
  lang?: 'zh-TW' | 'en';
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

export default function FuturesCalculatorClient({ lang = 'zh-TW' }: FuturesCalculatorClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

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
  const isMountedRef = useRef<boolean>(false);

  const indexInputId = useId();
  const quantityInputId = useId();
  const capitalInputId = useId();
  const multInputId = useId();
  const initMarginInputId = useId();
  const maintMarginInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast((st: { msg: string; show: boolean }) => ({ ...st, show: false })), 2500);
  }, []);

  // 設定全頁背景主題色 (赤紅/火力紅)
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff3b30');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 59, 48, 0.6)');
  }, []);

  // 初次掛載解析 URL Query 參數（含保證金與壓力幅度同步與邊界清洗）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const p = params.get('p') as 'tx' | 'mtx' | 'tmf' | 'custom' | null;
    const dir = params.get('dir') as 'long' | 'short' | null;
    const idx = params.get('idx');
    const q = params.get('q');
    const cap = params.get('cap');
    const m = params.get('m');
    const im = params.get('im');
    const mm = params.get('mm');
    const d = params.get('d');

    if (p && ['tx', 'mtx', 'tmf', 'custom'].includes(p)) {
      setSelectedPreset(p);
      const presetItem = PRESETS.find(pr => pr.id === p);
      if (presetItem && p !== 'custom') {
        setMultiplier(presetItem.multiplier);
        setInitialMargin(presetItem.initialMargin);
        setMaintMargin(presetItem.maintMargin);
      }
    }
    if (dir && ['long', 'short'].includes(dir)) setPosition(dir);
    if (idx && !isNaN(parseFloat(idx))) setIndexPrice(Math.max(0, parseFloat(idx)));
    if (q && !isNaN(parseInt(q, 10))) setQuantity(Math.max(1, parseInt(q, 10)));
    if (cap && !isNaN(parseInt(cap, 10))) setCapital(Math.max(0, parseInt(cap, 10)));
    if (m && !isNaN(parseFloat(m))) setMultiplier(Math.max(0, parseFloat(m)));
    if (im && !isNaN(parseInt(im, 10))) setInitialMargin(Math.max(0, parseInt(im, 10)));
    if (mm && !isNaN(parseInt(mm, 10))) setMaintMargin(Math.max(0, parseInt(mm, 10)));
    if (d && !isNaN(parseFloat(d))) setStressDropPct(Math.min(60, Math.max(0, parseFloat(d))));

    isMountedRef.current = true;
  }, []);

  // 狀態變更時自動 replaceState 同步 URL
  useEffect(() => {
    if (!isMountedRef.current || typeof window === 'undefined') return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('p', selectedPreset);
      params.set('dir', position);
      if (indexPrice !== '') params.set('idx', indexPrice.toString());
      if (quantity !== '') params.set('q', quantity.toString());
      if (capital !== '') params.set('cap', capital.toString());
      if (multiplier !== '') params.set('m', multiplier.toString());
      if (initialMargin !== '') params.set('im', initialMargin.toString());
      if (maintMargin !== '') params.set('mm', maintMargin.toString());
      params.set('d', stressDropPct.toString());

      window.history.replaceState(null, '', '?' + params.toString());
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedPreset, position, indexPrice, quantity, capital, multiplier, initialMargin, maintMargin, stressDropPct]);

  const handlePresetSelect = (presetId: 'tx' | 'mtx' | 'tmf' | 'custom') => {
    setSelectedPreset(presetId);
    const item = PRESETS.find(pr => pr.id === presetId);
    if (item && presetId !== 'custom') {
      setMultiplier(item.multiplier);
      setInitialMargin(item.initialMargin);
      setMaintMargin(item.maintMargin);
    }
  };

  // 快速套用實戰試算情境
  const applyScenario = (scenario: 'conservative' | 'standard' | 'alert') => {
    if (scenario === 'conservative') {
      setSelectedPreset('tmf');
      setMultiplier(10);
      setInitialMargin(12100);
      setMaintMargin(9300);
      setQuantity(2);
      setCapital(72600); // 3x 原始保證金
      setStressDropPct(0);
    } else if (scenario === 'standard') {
      setSelectedPreset('mtx');
      setMultiplier(50);
      setInitialMargin(60500);
      setMaintMargin(46500);
      setQuantity(1);
      setCapital(121000); // 2x 原始保證金
      setStressDropPct(0);
    } else if (scenario === 'alert') {
      setSelectedPreset('tx');
      setMultiplier(200);
      setInitialMargin(242000);
      setMaintMargin(186000);
      setQuantity(1);
      setCapital(290400); // 1.2x 原始保證金
      setStressDropPct(5);
    }
  };

  // 數值防呆解析
  const numIndex = indexPrice === '' ? 0 : indexPrice;
  const numQty = quantity === '' ? 0 : quantity;
  const numCapital = capital === '' ? 0 : capital;
  const numPtVal = multiplier === '' ? 0 : multiplier;
  const numInit = initialMargin === '' ? 0 : initialMargin;
  const numMaint = maintMargin === '' ? 0 : maintMargin;

  // 期貨槓桿與逆風主試算邏輯（純函數引擎，見 ./engine.ts）
  const {
    contractValue,
    totalInitMargin,
    totalMaintMargin,
    maintMarginRatioPct,
    actualLeverage,
    marginCallPoints: marginCallPts,
    marginCallPrice,
    marginCallDropPct,
    marginCallLimitDays,
    liquidationPoints: liqPts,
    liquidationPrice: liqPrice,
    liquidationDropPct,
    liquidationLimitDays,
    dropPoints,
    simIndex,
    simLoss,
    simCapital,
    excessMargin,
    simMarginCallPoints,
    simLiquidationPoints,
    riskRatio,
    isBelowInit,
    isBelowMaint,
    topupCash,
    maintGapCash,
    maxAffordableLots,
    reduceLotsRequired,
  } = calculateFutures({
    indexPrice: numIndex,
    quantity: numQty,
    capital: numCapital,
    multiplier: numPtVal,
    initialMargin: numInit,
    maintMargin: numMaint,
    position,
    stressDropPercent: stressDropPct,
  });

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

  // 快捷本金設定（確保口數或保證金為空時仍能正常計算並帶入）
  const setCapitalPreset = (multiplierRatio: number) => {
    const presetItem = PRESETS.find(pr => pr.id === selectedPreset) || PRESETS[0];
    const safeQty = numQty > 0 ? numQty : 1;
    const safeInit = numInit > 0 ? numInit : presetItem.initialMargin;
    if (numQty <= 0) setQuantity(1);
    if (numInit <= 0) setInitialMargin(safeInit);
    const targetCap = toNumber(D(safeInit).times(safeQty).times(multiplierRatio).dp(0));
    setCapital(targetCap);
  };

  const buildShareUrl = () => {
    if (typeof window === 'undefined') return '';
    const params = new URLSearchParams({
      p: selectedPreset,
      dir: position,
      idx: numIndex.toString(),
      q: numQty.toString(),
      cap: numCapital.toString(),
      m: numPtVal.toString(),
      im: numInit.toString(),
      mm: numMaint.toString(),
      d: stressDropPct.toString(),
    });
    return `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  };

  // 複製試算分享連結
  const copyShareLink = () => {
    const url = buildShareUrl();
    if (!url) return;
    navigator.clipboard.writeText(url).then(() => showToast(t.toastCopied));
  };

  // 複製分析摘要報告文字
  const copySummaryText = () => {
    const shareUrl = buildShareUrl();
    const presetTitle =
      selectedPreset === 'tx'
        ? t.presetTx
        : selectedPreset === 'mtx'
        ? t.presetMtx
        : selectedPreset === 'tmf'
        ? t.presetTmf
        : `${t.presetCustom} ($${numPtVal}/pt)`;
    const dirText = position === 'long' ? t.positionLong : t.positionShort;
    const mcPriceDisplay = position === 'long' && marginCallPrice <= 0 ? '0' : formatNumber(marginCallPrice);
    const liqPriceDisplay = position === 'long' && liqPrice <= 0 ? '0' : formatNumber(liqPrice);

    const summary = lang === 'zh-TW'
      ? `【台股期貨槓桿與風控試算報告】
• 商品與部位：${presetTitle} / ${dirText} / ${numQty} ${t.lotsUnit}
• 成交指數與本金：${formatNumber(numIndex)} 點 / 準備本金 $${formatNumber(numCapital)} 元
• 合約規模與實質槓桿：總規模 $${formatNumber(contractValue)} 元 (${actualLeverage.toFixed(2)}x 槓桿)
• 目前風險指標：${totalInitMargin === 0 ? '∞' : `${Math.max(0, riskRatio).toFixed(2)}%`} (超額保證金 ${excessMargin >= 0 ? '+' : '-'}$${formatNumber(Math.abs(excessMargin))} 元)
• 追繳警示點位：${mcPriceDisplay} 點 (容許逆風 ${formatNumber(Math.max(0, marginCallPts))} 點 / ${marginCallDropPct.toFixed(2)}%，約 ${marginCallLimitDays} 根停板)
• 強制平倉點位 (25%)：${liqPriceDisplay} 點 (容許逆風 ${formatNumber(Math.max(0, liqPts))} 點 / ${liquidationDropPct.toFixed(2)}%，約 ${liquidationLimitDays} 根停板)
${stressDropPct > 0 ? `• 逆風壓力測試 (${stressDropPct.toFixed(1)}%)：模擬指數 ${formatNumber(simIndex)} 點，模擬權益 $${formatNumber(simCapital)} 元\n` : ''}${isBelowInit ? `• 保證金回補試算：需入金 $${formatNumber(topupCash)} 元補足 100% 原始保證金，或平倉減少 ${reduceLotsRequired} 口\n` : ''}• 線上試算連結：${shareUrl}
（※ 試算僅供參考，請留意隔夜跳空與極端行情穿價風險）`
      : `[Taiwan Futures Leverage & Risk Report]
• Contract & Direction: ${presetTitle} / ${dirText} / ${numQty} ${t.lotsUnit}
• Entry Index & Capital: ${formatNumber(numIndex)} pts / Capital $${formatNumber(numCapital)}
• Contract Value & Leverage: $${formatNumber(contractValue)} (${actualLeverage.toFixed(2)}x Leverage)
• Current Risk Ratio: ${totalInitMargin === 0 ? '∞' : `${Math.max(0, riskRatio).toFixed(2)}%`} (Excess Margin ${excessMargin >= 0 ? '+' : '-'}$${formatNumber(Math.abs(excessMargin))})
• Margin Call Price: ${mcPriceDisplay} pts (Tolerance ${formatNumber(Math.max(0, marginCallPts))} pts / ${marginCallDropPct.toFixed(2)}%, ~${marginCallLimitDays} limit days)
• Liquidation Price (25%): ${liqPriceDisplay} pts (Tolerance ${formatNumber(Math.max(0, liqPts))} pts / ${liquidationDropPct.toFixed(2)}%, ~${liquidationLimitDays} limit days)
${stressDropPct > 0 ? `• Adverse Stress Test (${stressDropPct.toFixed(1)}%): Sim. Index ${formatNumber(simIndex)} pts, Sim. Equity $${formatNumber(simCapital)}\n` : ''}${isBelowInit ? `• Margin Remedy: Deposit $${formatNumber(topupCash)} to restore 100% initial margin, or close ${reduceLotsRequired} lot(s)\n` : ''}• Calculator URL: ${shareUrl}
(* For reference only. Always monitor overnight gap and slippage risks.)`;

    navigator.clipboard.writeText(summary).then(() => showToast(t.toastSummaryCopied));
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#ff3b30"
        accentGlow="rgba(255, 59, 48, 0.6)"
      >

        <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
          {/* 左欄：設定區 */}
          <div className={`${styles.glassCard} p-8 flex flex-col gap-6 shadow-lg`}>
            <div className="flex flex-col gap-3 border-b border-border-glass pb-4">
              <h3 className={`text-sm ${styles.accentText} uppercase tracking-[1px] font-semibold`}>
                {t.sectionSettings}
              </h3>
              {/* 快速套用試算情境 Presets */}
              <div className="flex flex-col gap-1.5">
                <span className="text-xs text-text-sub font-medium">{t.scenariosTitle}</span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => applyScenario('conservative')}
                    className={`${styles.chipBtn} ${
                      selectedPreset === 'tmf' && numQty === 2 && numCapital === 72600 && stressDropPct === 0
                        ? styles.chipBtnActive
                        : ''
                    }`}
                  >
                    {t.scenarioConservative}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyScenario('standard')}
                    className={`${styles.chipBtn} ${
                      selectedPreset === 'mtx' && numQty === 1 && numCapital === 121000 && stressDropPct === 0
                        ? styles.chipBtnActive
                        : ''
                    }`}
                  >
                    {t.scenarioStandard}
                  </button>
                  <button
                    type="button"
                    onClick={() => applyScenario('alert')}
                    className={`${styles.chipBtn} ${
                      selectedPreset === 'tx' && numQty === 1 && numCapital === 290400 && stressDropPct === 5
                        ? styles.chipBtnActive
                        : ''
                    }`}
                  >
                    {t.scenarioAlert}
                  </button>
                </div>
              </div>
            </div>

            {/* 商品規格選擇 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.presetLabel}</span>
              <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
                {PRESETS.map(p => {
                  let presetName = p.name;
                  if (p.id === 'tx') presetName = t.presetTx;
                  if (p.id === 'mtx') presetName = t.presetMtx;
                  if (p.id === 'tmf') presetName = t.presetTmf;
                  if (p.id === 'custom') presetName = t.presetCustom;

                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => handlePresetSelect(p.id)}
                      className={`py-2 px-3 text-sm rounded-lg cursor-pointer transition-all border ${
                        selectedPreset === p.id
                          ? styles.activeScheme
                          : 'border-transparent text-text-sub hover:text-text-main'
                      }`}
                    >
                      {presetName}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 自訂每點點值 */}
            {selectedPreset === 'custom' && (
              <div className="flex flex-col gap-2 bg-surface-glass p-4 rounded-xl border border-border-glass">
                <label htmlFor={multInputId} className={`text-sm ${styles.accentText} font-medium uppercase tracking-[1px]`}>
                  {t.customPtValLabel}
                </label>
                <input
                  id={multInputId}
                  type="number"
                  min="0"
                  value={multiplier}
                  onChange={e => setMultiplier(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
                  className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-base outline-none font-mono`}
                />
              </div>
            )}

            {/* 多空部位切換 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.directionLabel}</span>
              <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1 rounded-xl`}>
                <button
                  type="button"
                  onClick={() => setPosition('long')}
                  className={`py-2 text-sm rounded-lg cursor-pointer transition-all border ${
                    position === 'long'
                      ? styles.longBtnActive
                      : 'border-transparent text-text-sub hover:text-text-main'
                  }`}
                >
                  {t.positionLong}
                </button>
                <button
                  type="button"
                  onClick={() => setPosition('short')}
                  className={`py-2 text-sm rounded-lg cursor-pointer transition-all border ${
                    position === 'short'
                      ? styles.shortBtnActive
                      : 'border-transparent text-text-sub hover:text-text-main'
                  }`}
                >
                  {t.positionShort}
                </button>
              </div>
            </div>

            {/* 成交點位、口數與準備本金 */}
            <div className={`flex flex-col gap-4 ${styles.divider} pt-4`}>
              <div className="flex flex-col gap-2">
                <label htmlFor={indexInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.indexLabel}</label>
                <input
                  id={indexInputId}
                  type="text"
                  inputMode="numeric"
                  placeholder={t.indexPlaceholder}
                  value={indexPrice === '' ? '' : indexPrice.toLocaleString('zh-TW')}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setIndexPrice(raw === '' ? '' : parseInt(raw, 10));
                  }}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
                <div className="flex flex-col gap-2">
                  <label htmlFor={quantityInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.qtyLabel}</label>
                  <input
                    id={quantityInputId}
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label htmlFor={capitalInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.capitalLabel}</label>
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

              {/* 本金快捷帶入按鈕 (4 檔，依當前總原始保證金倍數動態高亮) */}
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { ratio: 1.0, label: t.capPreset10 },
                    { ratio: 1.5, label: t.capPreset15 },
                    { ratio: 2.0, label: t.capPreset20 },
                    { ratio: 3.0, label: t.capPreset30 },
                  ] as const
                ).map(item => {
                  const targetCap = toNumber(D(totalInitMargin).times(item.ratio).dp(0));
                  const isPresetActive = totalInitMargin > 0 && numCapital === targetCap;
                  return (
                    <button
                      key={item.ratio}
                      type="button"
                      onClick={() => setCapitalPreset(item.ratio)}
                      className={`${styles.chipBtn} py-2 px-2 text-xs font-mono ${
                        isPresetActive ? styles.chipBtnActive : ''
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 單口保證金標準 (自由編輯) */}
            <div className={`grid grid-cols-2 gap-4 max-sm:grid-cols-1 ${styles.divider} pt-4`}>
              <div className="flex flex-col gap-2">
                <label htmlFor={initMarginInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.initMarginLabel}</label>
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
                <label htmlFor={maintMarginInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.maintMarginLabel}</label>
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
                {t.shareBtn}
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

          {/* 右欄：風險計算與指標 */}
          <div className="flex flex-col gap-6">
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
                        {totalInitMargin > 0 ? `${excessMargin >= 0 ? '+' : '-'}$${formatNumber(Math.abs(excessMargin))} ${t.currencyUnit}` : '-'}
                      </span>
                    </div>
                    <div className="bg-surface-glass border border-border-glass px-3.5 py-2.5 rounded-xl flex justify-between items-center">
                      <span className="text-text-sub font-sans">{t.bufferToMarginCallLabel}</span>
                      <span className={`font-bold ${simMarginCallPoints < 0 ? styles.accentText : 'text-text-main'}`}>
                        {totalInitMargin > 0 ? `${simMarginCallPoints >= 0 ? '+' : ''}${formatNumber(simMarginCallPoints)} ${t.pointsUnit}` : '-'}
                      </span>
                    </div>
                    <div className="bg-surface-glass border border-border-glass px-3.5 py-2.5 rounded-xl flex justify-between items-center">
                      <span className="text-text-sub font-sans">{t.bufferToLiqLabel}</span>
                      <span className={`font-bold ${simLiquidationPoints < 0 ? styles.accentText : 'text-text-main'}`}>
                        {totalInitMargin > 0 ? `${simLiquidationPoints >= 0 ? '+' : ''}${formatNumber(simLiquidationPoints)} ${t.pointsUnit}` : '-'}
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
                <span className="font-mono text-xl font-bold text-text-main">${formatNumber(contractValue)} {t.currencyUnit}</span>
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

            {/* 2. 0%-60% 逆風波段壓力測試 */}
            <div className={`${styles.glassCard} p-6 flex flex-col gap-4 shadow-lg`}>
              <div className="flex justify-between items-center text-xs font-semibold">
                <span className="text-text-sub uppercase tracking-[1px]">
                  {position === 'long' ? t.stressTitleLong : t.stressTitleShort}
                </span>
                <span className={`font-mono text-sm ${styles.accentText} font-bold`}>
                  {stressDropPct.toFixed(1)}% <span className="text-xs text-text-sub font-normal">({t.stressPoints} {formatNumber(dropPoints)} {t.stressPointsUnit})</span>
                </span>
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
                  onClick={() => setStressDropPct(5)}
                  className={`${styles.chipBtn} ${stressDropPct === 5 ? styles.chipBtnActive : ''}`}
                >
                  {t.stressShortcut5}
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
              </div>

              <input
                type="range"
                min="0"
                max="60"
                step="0.1"
                aria-label={position === 'long' ? t.stressTitleLong : t.stressTitleShort}
                value={stressDropPct}
                onChange={e => setStressDropPct(parseFloat(e.target.value) || 0)}
                className={styles.rangeSlider}
              />

              <div className="grid grid-cols-2 gap-4 font-mono text-xs max-sm:grid-cols-1">
                <div className="bg-surface-glass border border-border-glass p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-text-sub">{t.simIndexLabel}</span>
                  <span className="text-base text-text-main font-bold">{formatNumber(simIndex)} {t.pointsUnit}</span>
                </div>
                <div className="bg-surface-glass border border-border-glass p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-text-sub">{t.simCapitalLabel}</span>
                  <span className="text-base text-text-main font-bold">${formatNumber(simCapital)} {t.currencyUnit}</span>
                  <span className={`text-xs ${styles.accentText}`}>{t.simLossLabel}-${formatNumber(simLoss)} {t.currencyUnit}</span>
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
                    : `${formatNumber(Math.max(0, marginCallPrice))} ${t.pointsUnit}`}
                </span>
                <div className="flex flex-col text-xs text-text-sub gap-0.5 mt-0.5">
                  <span>
                    {t.allowWind}
                    <strong className="text-[#f59e0b]">
                      {marginCallPts < 0 && numCapital > 0
                        ? t.alreadyBelowThreshold
                        : `${formatNumber(Math.max(0, marginCallPts))} ${t.pointsUnit} (${marginCallDropPct.toFixed(2)}%)`}
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
                    : `${formatNumber(Math.max(0, liqPrice))} ${t.pointsUnit}`}
                </span>
                <div className="flex flex-col text-xs text-text-sub gap-0.5 mt-0.5">
                  <span>
                    {t.allowWind}
                    <strong className={styles.accentText}>
                      {liqPts < 0 && numCapital > 0
                        ? t.alreadyBelowThreshold
                        : `${formatNumber(Math.max(0, liqPts))} ${t.pointsUnit} (${liquidationDropPct.toFixed(2)}%)`}
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
                    ${formatNumber(topupCash)} {t.currencyUnit}
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

            {/* 場景化贊助呼籲小卡 */}
            <ContextualSponsorCard
              title={t.sponsorCardTitle}
              description={t.sponsorCardDesc}
              buttonText={t.sponsorCardBtn}
              lang={lang}
              accentColor="#f97316"
            />
          </div>
        </div>

        {/* 通用 FAQ 常見問題區塊 */}
        <FaqSection
          items={t.faqItems}
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          accentColor="#f97316"
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

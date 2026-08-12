'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import styles from './futures-calculator.module.css';

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

const TRANSLATIONS = {
  'zh-TW': {
    title: '台股期貨槓桿計算機',
    subtitle: 'TAIWAN FUTURES RISK & MARGIN CALCULATOR',
    description:
      '專業免費的線上台指期 (大台/小台/微台/自訂) 槓桿與維持率計算器！支援多空雙向部位切換、實質槓桿試算、0%-60%逆風壓力測試與保證金回補金額估算。',
    sectionSettings: '期貨部位與保證金設定',
    presetLabel: '商品規格',
    presetTx: '大台 (TX)',
    presetMtx: '小台 (MTX)',
    presetTmf: '微台 (TMF)',
    presetCustom: '自訂商品',
    customPtValLabel: '自訂每點點值 (元/點)',
    directionLabel: '交易方向 (部位)',
    positionLong: '多頭 (看漲 做多)',
    positionShort: '空頭 (看跌 做空)',
    indexLabel: '成交指數點位 (點)',
    indexPlaceholder: '例如：22,000',
    qtyLabel: '下單口數 (口)',
    capitalLabel: '準備本金 (元)',
    capPreset15: '投入 1.5 倍原始保證金',
    capPreset20: '投入 2.0 倍原始保證金',
    initMarginLabel: '單口原始保證金 (元)',
    maintMarginLabel: '單口維持保證金 (元)',
    shareBtn: '複製期貨槓桿試算分享連結',
    dashboardTitle: '風控指標與實質槓桿儀表板',
    statusSafeFull: '部位完全安全',
    statusSafe: '安全 (高於原始保證金)',
    statusWarning: '警示 (低於原始保證金)',
    statusMarginCall: '追繳 (低於維持保證金)',
    statusLiquidation: '即將強制平倉 (風險 < 25%)',
    contractValTitle: '合約總價值 (規模)',
    leverageTitle: '當前實質資金槓桿',
    leverageLow: '安全風控等級',
    leverageMid: '適中風險等級',
    leverageHigh: '高槓桿高風險',
    stressTitleLong: '模擬逆風波段 (指數下跌)',
    stressTitleShort: '模擬逆風波段 (指數上漲)',
    stressPoints: '折合',
    stressPointsUnit: '點',
    simIndexLabel: '模擬成交指數',
    simCapitalLabel: '預估模擬權益數',
    simLossLabel: '損益：',
    marginCallTitle: '追繳警示點位 (維持保證金)',
    liqTitle: '強制平倉點位 (風險指標 25%)',
    allowWind: '容許逆風：',
    pointsUnit: '點',
    topupWarning: '模擬權益數已低於總原始保證金，回補至 100% 原始保證金水位：',
    topupSafe: '權益數高於原始保證金，無須補繳',
    topupCashLabel: '需補足至 100% 原始保證金之現金',
    currencyUnit: '元',
    toastCopied: '已複製期貨槓桿試算分享連結',
    langToggleLabel: 'English',
    langToggleUrl: '/futures-calculator/en/',
  },
  en: {
    title: 'Futures Risk & Margin Calculator',
    subtitle: 'TAIWAN FUTURES RISK & MARGIN CALCULATOR',
    description:
      'Free online Taiwan Index Futures (TX, MTX, TMF) risk & margin calculator! Supports Long/Short positions, actual leverage, 0-60% adverse stress testing, and margin call threshold estimation.',
    sectionSettings: 'Position & Margin Settings',
    presetLabel: 'Contract Type',
    presetTx: 'Large TX',
    presetMtx: 'Mini MTX',
    presetTmf: 'Micro TMF',
    presetCustom: 'Custom',
    customPtValLabel: 'Custom Point Value ($/pt)',
    directionLabel: 'Position Direction',
    positionLong: 'Long (Bullish)',
    positionShort: 'Short (Bearish)',
    indexLabel: 'Entry Index Price (pts)',
    indexPlaceholder: 'e.g. 22,000',
    qtyLabel: 'Order Quantity (lots)',
    capitalLabel: 'Total Capital ($)',
    capPreset15: 'Use 1.5x Initial Margin',
    capPreset20: 'Use 2.0x Initial Margin',
    initMarginLabel: 'Initial Margin / Lot ($)',
    maintMarginLabel: 'Maintenance Margin / Lot ($)',
    shareBtn: 'Copy Futures Share Link',
    dashboardTitle: 'Risk Indicator & Real Leverage Dashboard',
    statusSafeFull: 'Fully Safe',
    statusSafe: 'Safe (Above Initial Margin)',
    statusWarning: 'Warning (Below Initial Margin)',
    statusMarginCall: 'Margin Call (Below Maintenance)',
    statusLiquidation: 'Liquidation Risk (Risk < 25%)',
    contractValTitle: 'Total Contract Value',
    leverageTitle: 'Actual Capital Leverage',
    leverageLow: 'Safe Risk Level',
    leverageMid: 'Moderate Risk Level',
    leverageHigh: 'High Leverage Risk',
    stressTitleLong: 'Adverse Stress Test (Index Drop)',
    stressTitleShort: 'Adverse Stress Test (Index Rise)',
    stressPoints: 'Equivalent to',
    stressPointsUnit: 'pts',
    simIndexLabel: 'Simulated Index Price',
    simCapitalLabel: 'Simulated Equity',
    simLossLabel: 'P&L: ',
    marginCallTitle: 'Margin Call Threshold (Maint. Margin)',
    liqTitle: 'Liquidation Threshold (Risk 25%)',
    allowWind: 'Adverse Tolerance: ',
    pointsUnit: 'pts',
    topupWarning: 'Simulated Equity below Initial Margin! Deposit required for 100% level:',
    topupSafe: 'Equity above Initial Margin. No deposit required.',
    topupCashLabel: 'Deposit Cash Needed for 100% Initial Margin',
    currencyUnit: '$',
    toastCopied: 'Futures share link copied to clipboard',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/futures-calculator/',
  },
};

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

  // 初次掛載解析 URL Query 參數
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const p = params.get('p') as 'tx' | 'mtx' | 'tmf' | 'custom' | null;
    const dir = params.get('dir') as 'long' | 'short' | null;
    const idx = params.get('idx');
    const q = params.get('q');
    const cap = params.get('cap');
    const m = params.get('m');

    if (p && ['tx', 'mtx', 'tmf', 'custom'].includes(p)) setSelectedPreset(p);
    if (dir && ['long', 'short'].includes(dir)) setPosition(dir);
    if (idx && !isNaN(parseFloat(idx))) setIndexPrice(parseFloat(idx));
    if (q && !isNaN(parseInt(q, 10))) setQuantity(parseInt(q, 10));
    if (cap && !isNaN(parseInt(cap, 10))) setCapital(parseInt(cap, 10));
    if (m && !isNaN(parseFloat(m))) setMultiplier(parseFloat(m));

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

      window.history.replaceState(null, '', '?' + params.toString());
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedPreset, position, indexPrice, quantity, capital, multiplier]);

  const handlePresetSelect = (presetId: 'tx' | 'mtx' | 'tmf' | 'custom') => {
    setSelectedPreset(presetId);
    const item = PRESETS.find(pr => pr.id === presetId);
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
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => showToast(t.toastCopied));
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#ff3b30"
        accentGlow="rgba(255, 59, 48, 0.6)"
        extraHeaderControls={
          <Link
            href={t.langToggleUrl}
            className="relative inline-flex items-center justify-center gap-1.5 h-[42px] px-3.5 text-xs font-semibold rounded-xl bg-white/[.06] border border-white/10 text-text-sub hover:text-text-main backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-[var(--theme-color,#ff3b30)] hover:shadow-[0_0_12px_var(--theme-glow,rgba(255,59,48,0.4))] select-none"
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{t.langToggleLabel}</span>
          </Link>
        }
      >

        <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
          {/* 左欄：設定區 */}
          <div className={`${styles.glassCard} p-8 flex flex-col gap-6 shadow-lg`}>
            <h3 className={`text-sm ${styles.accentText} uppercase tracking-[1px] font-semibold border-b border-border-glass pb-3`}>
              {t.sectionSettings}
            </h3>

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
                  value={multiplier}
                  onChange={e => setMultiplier(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-base outline-none font-mono`}
                />
              </div>
            )}

            {/* 多空部位切換 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.directionLabel}</span>
              <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1 rounded-xl`}>
                <button
                  onClick={() => setPosition('long')}
                  className={`py-2 text-sm rounded-lg cursor-pointer transition-all border ${
                    position === 'long'
                      ? 'bg-red-500/20 border-red-500/40 text-red-500 font-semibold'
                      : 'border-transparent text-text-sub hover:text-text-main'
                  }`}
                >
                  {t.positionLong}
                </button>
                <button
                  onClick={() => setPosition('short')}
                  className={`py-2 text-sm rounded-lg cursor-pointer transition-all border ${
                    position === 'short'
                      ? `${styles.tabBtnActive}`
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

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor={quantityInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.qtyLabel}</label>
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

              {/* 本金快捷帶入按鈕 */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCapitalPreset(1.5)}
                  className={`py-2 px-1 text-sm ${styles.activeScheme} rounded-lg transition-all cursor-pointer font-mono font-medium`}
                >
                  {t.capPreset15}
                </button>
                <button
                  onClick={() => setCapitalPreset(2.0)}
                  className="py-2 px-1 text-sm bg-surface-glass border border-border-glass text-text-sub rounded-lg hover:text-text-main transition-all cursor-pointer font-mono font-medium"
                >
                  {t.capPreset20}
                </button>
              </div>
            </div>

            {/* 單口保證金標準 (自由編輯) */}
            <div className={`grid grid-cols-2 gap-4 ${styles.divider} pt-4`}>
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

            {/* 複製試算分享按鈕 */}
            <button
              onClick={copyShareLink}
              className={`mt-2 w-full h-[44px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
                ${styles.activeScheme} rounded-xl transition-all duration-300 cursor-pointer`}
            >
              {t.shareBtn}
            </button>
          </div>

          {/* 右欄：風險計算與指標 */}
          <div className="flex flex-col gap-6">
            {/* 1. SVG 風險指標儀表板 */}
            <div className={`${styles.glassCard} p-6 flex flex-col items-center justify-center shadow-lg relative`}>
              <h3 className="text-sm text-text-sub uppercase tracking-[1px] font-semibold mb-4 self-start">
                {t.dashboardTitle}
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
                  <span className="text-text-sub">{t.simIndexLabel}</span>
                  <span className="text-base text-text-main font-bold">{formatNumber(simIndex)} {t.pointsUnit}</span>
                </div>
                <div className="bg-surface-glass border border-border-glass p-3 rounded-xl flex flex-col gap-1">
                  <span className="text-text-sub">{t.simCapitalLabel}</span>
                  <span className="text-base text-text-main font-bold">${formatNumber(simCapital)} {t.currencyUnit}</span>
                  <span className="text-[0.7rem] text-[#ef4444]">{t.simLossLabel}-${formatNumber(simLoss)} {t.currencyUnit}</span>
                </div>
              </div>
            </div>

            {/* 3. 臨界點資訊卡片 */}
            <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
              <div className={`${styles.statCard} font-mono`}>
                <span className="text-sm font-semibold text-text-sub">{t.marginCallTitle}</span>
                <span className="text-xl font-bold text-[#f59e0b]">{formatNumber(marginCallPrice)} {t.pointsUnit}</span>
                <span className="text-xs text-text-sub">
                  {t.allowWind}<strong className="text-[#f59e0b]">{formatNumber(marginCallPts)} {t.pointsUnit}</strong>
                </span>
              </div>

              <div className={`${styles.statCard} font-mono`}>
                <span className="text-sm font-semibold text-text-sub">{t.liqTitle}</span>
                <span className={`text-xl font-bold ${styles.accentText}`}>{formatNumber(liqPrice)} {t.pointsUnit}</span>
                <span className="text-xs text-text-sub">
                  {t.allowWind}<strong className={styles.accentText}>{formatNumber(liqPts)} {t.pointsUnit}</strong>
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
                  <span className="text-[#ef4444] inline-flex items-center gap-1">
                    <svg className="w-4 h-4 text-[#ef4444] fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    {t.topupWarning}
                  </span>
                ) : (
                  <span className="text-[#10b981] inline-flex items-center gap-1">
                    <svg className="w-4 h-4 text-[#10b981] fill-none stroke-current" viewBox="0 0 24 24" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {t.topupSafe}
                  </span>
                )}
              </h3>

              <div className="font-mono text-xs bg-surface-glass border border-border-glass p-4 rounded-xl flex flex-col gap-1">
                <span className="text-text-sub font-semibold text-xs">{t.topupCashLabel}</span>
                <span className={`text-base font-bold ${isBelowInit ? 'text-[#ef4444]' : 'text-text-main'}`}>
                  ${formatNumber(topupCash)} {t.currencyUnit}
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

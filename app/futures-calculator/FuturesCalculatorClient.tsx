'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './futures-calculator.module.css';
import { calculateFutures } from './engine';
import { D, toNumber } from '../utils/decimal';
import { TRANSLATIONS } from './translations';
import { ContextualSponsorCard } from '../components/ContextualSponsorCard';
import {
  FUTURES_PRESETS,
  FuturesPosition,
  FuturesPresetId,
  formatFuturesNumber,
} from './components/shared';
import FuturesInputPanel from './components/FuturesInputPanel';
import FuturesRiskDashboard from './components/FuturesRiskDashboard';
import FuturesStressAndRemedy from './components/FuturesStressAndRemedy';

interface FuturesCalculatorClientProps {
  lang?: 'zh-TW' | 'en';
}

export default function FuturesCalculatorClient({ lang = 'zh-TW' }: FuturesCalculatorClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  const [selectedPreset, setSelectedPreset] = useState<FuturesPresetId>('tx');
  const [position, setPosition] = useState<FuturesPosition>('long');

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

    const p = params.get('p') as FuturesPresetId | null;
    const dir = params.get('dir') as FuturesPosition | null;
    const idx = params.get('idx');
    const q = params.get('q');
    const cap = params.get('cap');
    const m = params.get('m');
    const im = params.get('im');
    const mm = params.get('mm');
    const d = params.get('d');

    if (p && ['tx', 'mtx', 'tmf', 'custom'].includes(p)) {
      setSelectedPreset(p);
      const presetItem = FUTURES_PRESETS.find(pr => pr.id === p);
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

  const handlePresetSelect = (presetId: FuturesPresetId) => {
    setSelectedPreset(presetId);
    const item = FUTURES_PRESETS.find(pr => pr.id === presetId);
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

  // 快捷本金設定（確保口數或保證金為空時仍能正常計算並帶入）
  const setCapitalPreset = (multiplierRatio: number) => {
    const presetItem = FUTURES_PRESETS.find(pr => pr.id === selectedPreset) || FUTURES_PRESETS[0];
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
    const mcPriceDisplay = position === 'long' && marginCallPrice <= 0 ? '0' : formatFuturesNumber(marginCallPrice);
    const liqPriceDisplay = position === 'long' && liqPrice <= 0 ? '0' : formatFuturesNumber(liqPrice);

    const summary = lang === 'zh-TW'
      ? `【台股期貨槓桿與風控試算報告】
• 商品與部位：${presetTitle} / ${dirText} / ${numQty} ${t.lotsUnit}
• 成交指數與本金：${formatFuturesNumber(numIndex)} 點 / 準備本金 $${formatFuturesNumber(numCapital)} 元
• 合約規模與實質槓桿：總規模 $${formatFuturesNumber(contractValue)} 元 (${actualLeverage.toFixed(2)}x 槓桿)
• 目前風險指標：${totalInitMargin === 0 ? '∞' : `${Math.max(0, riskRatio).toFixed(2)}%`} (超額保證金 ${excessMargin >= 0 ? '+' : '-'}$${formatFuturesNumber(Math.abs(excessMargin))} 元)
• 追繳警示點位：${mcPriceDisplay} 點 (容許逆風 ${formatFuturesNumber(Math.max(0, marginCallPts))} 點 / ${marginCallDropPct.toFixed(2)}%，約 ${marginCallLimitDays} 根停板)
• 強制平倉點位 (25%)：${liqPriceDisplay} 點 (容許逆風 ${formatFuturesNumber(Math.max(0, liqPts))} 點 / ${liquidationDropPct.toFixed(2)}%，約 ${liquidationLimitDays} 根停板)
${stressDropPct > 0 ? `• 逆風壓力測試 (${stressDropPct.toFixed(1)}%)：模擬指數 ${formatFuturesNumber(simIndex)} 點，模擬權益 $${formatFuturesNumber(simCapital)} 元\n` : ''}${isBelowInit ? `• 保證金回補試算：需入金 $${formatFuturesNumber(topupCash)} 元補足 100% 原始保證金，或平倉減少 ${reduceLotsRequired} 口\n` : ''}• 線上試算連結：${shareUrl}
（※ 試算僅供參考，請留意隔夜跳空與極端行情穿價風險）`
      : `[Taiwan Futures Leverage & Risk Report]
• Contract & Direction: ${presetTitle} / ${dirText} / ${numQty} ${t.lotsUnit}
• Entry Index & Capital: ${formatFuturesNumber(numIndex)} pts / Capital $${formatFuturesNumber(numCapital)}
• Contract Value & Leverage: $${formatFuturesNumber(contractValue)} (${actualLeverage.toFixed(2)}x Leverage)
• Current Risk Ratio: ${totalInitMargin === 0 ? '∞' : `${Math.max(0, riskRatio).toFixed(2)}%`} (Excess Margin ${excessMargin >= 0 ? '+' : '-'}$${formatFuturesNumber(Math.abs(excessMargin))})
• Margin Call Price: ${mcPriceDisplay} pts (Tolerance ${formatFuturesNumber(Math.max(0, marginCallPts))} pts / ${marginCallDropPct.toFixed(2)}%, ~${marginCallLimitDays} limit days)
• Liquidation Price (25%): ${liqPriceDisplay} pts (Tolerance ${formatFuturesNumber(Math.max(0, liqPts))} pts / ${liquidationDropPct.toFixed(2)}%, ~${liquidationLimitDays} limit days)
${stressDropPct > 0 ? `• Adverse Stress Test (${stressDropPct.toFixed(1)}%): Sim. Index ${formatFuturesNumber(simIndex)} pts, Sim. Equity $${formatFuturesNumber(simCapital)}\n` : ''}${isBelowInit ? `• Margin Remedy: Deposit $${formatFuturesNumber(topupCash)} to restore 100% initial margin, or close ${reduceLotsRequired} lot(s)\n` : ''}• Calculator URL: ${shareUrl}
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
          <FuturesInputPanel
            t={t}
            selectedPreset={selectedPreset}
            position={position}
            indexPrice={indexPrice}
            quantity={quantity}
            capital={capital}
            multiplier={multiplier}
            initialMargin={initialMargin}
            maintMargin={maintMargin}
            numQty={numQty}
            numCapital={numCapital}
            stressDropPct={stressDropPct}
            totalInitMargin={totalInitMargin}
            onApplyScenario={applyScenario}
            onPresetSelect={handlePresetSelect}
            onPositionChange={setPosition}
            onIndexPriceChange={setIndexPrice}
            onQuantityChange={setQuantity}
            onCapitalChange={setCapital}
            onMultiplierChange={setMultiplier}
            onInitialMarginChange={setInitialMargin}
            onMaintMarginChange={setMaintMargin}
            onSetCapitalPreset={setCapitalPreset}
            onCopyShareLink={copyShareLink}
            onCopySummaryText={copySummaryText}
          />

          {/* 右欄：風險計算與指標 */}
          <div className="flex flex-col gap-6">
            <FuturesRiskDashboard
              t={t}
              totalInitMargin={totalInitMargin}
              totalMaintMargin={totalMaintMargin}
              maintMarginRatioPct={maintMarginRatioPct}
              riskRatio={riskRatio}
              simCapital={simCapital}
              excessMargin={excessMargin}
              simMarginCallPoints={simMarginCallPoints}
              simLiquidationPoints={simLiquidationPoints}
              contractValue={contractValue}
              actualLeverage={actualLeverage}
            />

            <FuturesStressAndRemedy
              t={t}
              position={position}
              numCapital={numCapital}
              numQty={numQty}
              stressDropPct={stressDropPct}
              onStressDropPctChange={setStressDropPct}
              dropPoints={dropPoints}
              simIndex={simIndex}
              simCapital={simCapital}
              simLoss={simLoss}
              marginCallPrice={marginCallPrice}
              marginCallPts={marginCallPts}
              marginCallDropPct={marginCallDropPct}
              marginCallLimitDays={marginCallLimitDays}
              liqPrice={liqPrice}
              liqPts={liqPts}
              liquidationDropPct={liquidationDropPct}
              liquidationLimitDays={liquidationLimitDays}
              isBelowInit={isBelowInit}
              isBelowMaint={isBelowMaint}
              topupCash={topupCash}
              maintGapCash={maintGapCash}
              maxAffordableLots={maxAffordableLots}
              reduceLotsRequired={reduceLotsRequired}
            />

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

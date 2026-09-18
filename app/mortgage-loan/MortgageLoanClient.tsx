'use client';

import { useState, useEffect, useMemo, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import TrendChart from '../components/TrendChart';
import styles from './mortgage-loan.module.css';
import {
  calculateMortgage,
  type Stage,
  type SingleLoanDetailRow,
  type CombinedDetailRow,
  type RepayType,
  type RateType,
} from './engine';
import { TRANSLATIONS } from './translations';

interface Props {
  lang?: 'zh-TW' | 'en';
}

export default function MortgageLoanClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];
  // 基礎連動參數 (單位：萬元)
  const [housePrice, setHousePrice] = useState<number | ''>(1500);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number | ''>(20);
  const [downPaymentAmount, setDownPaymentAmount] = useState<number | ''>(300);

  // 貸款模式
  const [loanMode, setLoanMode] = useState<'single' | 'combined'>('single');

  // 單一貸款設定
  const [singlePeriodVal, setSinglePeriodVal] = useState<number | ''>(30);
  const [singlePeriodUnit, setSinglePeriodUnit] = useState<'year' | 'month'>('year');
  const [singleGraceVal, setSingleGraceVal] = useState<number | ''>(3);
  const [singleGraceUnit, setSingleGraceUnit] = useState<'year' | 'month'>('year');
  const [singleRateType, setSingleRateType] = useState<RateType>('single');
  const [singleRate, setSingleRate] = useState<number | ''>(2.185);
  const [singleStages, setSingleStages] = useState<Stage[]>([
    { durationValue: 2, durationUnit: 'year', rate: 2.0 },
    { durationValue: 1, durationUnit: 'year', rate: 2.1 },
    { durationValue: null, durationUnit: null, rate: 2.25 },
  ]);
  const [singleRepayType, setSingleRepayType] = useState<RepayType>('equal-total');
  const [singleFee, setSingleFee] = useState<number | ''>(5000);

  // 組合貸款設定 (貸款 A + 貸款 B)
  const [loanName1, setLoanName1] = useState<string>(t.defaultLoanName1);
  const [loanAmount1, setLoanAmount1] = useState<number | ''>(1000); // 萬元
  const [periodVal1, setPeriodVal1] = useState<number | ''>(40);
  const [periodUnit1, setPeriodUnit1] = useState<'year' | 'month'>('year');
  const [graceVal1, setGraceVal1] = useState<number | ''>(5);
  const [graceUnit1, setGraceUnit1] = useState<'year' | 'month'>('year');
  const [repayType1, setRepayType1] = useState<RepayType>('equal-total');
  const [rateType1, setRateType1] = useState<RateType>('single');
  const [singleRate1, setSingleRate1] = useState<number | ''>(1.775);
  const [stages1, setStages1] = useState<Stage[]>([
    { durationValue: 3, durationUnit: 'year', rate: 1.775 },
    { durationValue: 2, durationUnit: 'year', rate: 2.15 },
    { durationValue: null, durationUnit: null, rate: 2.15 },
  ]);
  const [fee1, setFee1] = useState<number | ''>(3000);

  const [loanName2, setLoanName2] = useState<string>(t.defaultLoanName2);
  const [loanAmount2, setLoanAmount2] = useState<number | ''>(200); // 萬元
  const [periodVal2, setPeriodVal2] = useState<number | ''>(30);
  const [periodUnit2, setPeriodUnit2] = useState<'year' | 'month'>('year');
  const [graceVal2, setGraceVal2] = useState<number | ''>(3);
  const [graceUnit2, setGraceUnit2] = useState<'year' | 'month'>('year');
  const [repayType2, setRepayType2] = useState<RepayType>('equal-total');
  const [rateType2, setRateType2] = useState<RateType>('single');
  const [singleRate2, setSingleRate2] = useState<number | ''>(2.185);
  const [stages2, setStages2] = useState<Stage[]>([
    { durationValue: 2, durationUnit: 'year', rate: 2.185 },
    { durationValue: 1, durationUnit: 'year', rate: 2.25 },
    { durationValue: null, durationUnit: null, rate: 2.25 },
  ]);
  const [fee2, setFee2] = useState<number | ''>(3000);

  // 運算結果狀態
  const [totalLoan, setTotalLoan] = useState<number>(1200); // 萬元
  const [firstPayment, setFirstPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalRepay, setTotalRepay] = useState<number>(0);
  const [aprRate, setAprRate] = useState<number | null>(0);
  const [schedule, setSchedule] = useState<CombinedDetailRow[]>([]);
  const [showAllRows, setShowAllRows] = useState<boolean>(false);

  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const priceInputId = useId();
  const percentInputId = useId();
  const downInputId = useId();
  const singlePeriodInputId = useId();
  const singleGraceInputId = useId();
  const singleRateInputId = useId();
  const singleFeeInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  const isMountedRef = useRef<boolean>(false);

  // 全頁背景 Theme 設定
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);

  // 初次掛載：讀取 URL Query 參數進行狀態同步
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pHp = params.get('hp') || params.get('p');
    const pDp = params.get('dp');
    const pDa = params.get('da');
    const pM = params.get('m');
    const pSp = params.get('sp');
    const pSg = params.get('sg');
    const pSr = params.get('sr');
    const pSf = params.get('sf');

    if (pHp !== null && !isNaN(Number(pHp))) setHousePrice(Math.max(0, Number(pHp)));
    if (pDp !== null && !isNaN(Number(pDp))) setDownPaymentPercent(Math.max(0, Number(pDp)));
    if (pDa !== null && !isNaN(Number(pDa))) setDownPaymentAmount(Math.max(0, Number(pDa)));
    if (pM === 'single' || pM === 'combined') setLoanMode(pM);
    if (pSp !== null && !isNaN(Number(pSp))) setSinglePeriodVal(Math.max(1, Number(pSp)));
    if (pSg !== null && !isNaN(Number(pSg))) setSingleGraceVal(Math.max(0, Number(pSg)));
    if (pSr !== null && !isNaN(Number(pSr))) setSingleRate(Math.max(0, Number(pSr)));
    if (pSf !== null && !isNaN(Number(pSf))) setSingleFee(Math.max(0, Number(pSf)));

    isMountedRef.current = true;
  }, []);

  // 狀態變更時更新網址 (URL replaceState)
  useEffect(() => {
    if (!isMountedRef.current) return;
    const timer = setTimeout(() => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams();
      if (housePrice !== '') params.set('hp', housePrice.toString());
      if (downPaymentPercent !== '') params.set('dp', downPaymentPercent.toString());
      if (downPaymentAmount !== '') params.set('da', downPaymentAmount.toString());
      params.set('m', loanMode);
      if (singlePeriodVal !== '') params.set('sp', singlePeriodVal.toString());
      if (singleGraceVal !== '') params.set('sg', singleGraceVal.toString());
      if (singleRate !== '') params.set('sr', singleRate.toString());
      if (singleFee !== '') params.set('sf', singleFee.toString());

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }, 300);

    return () => clearTimeout(timer);
  }, [housePrice, downPaymentPercent, downPaymentAmount, loanMode, singlePeriodVal, singleGraceVal, singleRate, singleFee]);

  // 房屋總價變更處理
  const handlePriceChange = (valStr: string) => {
    if (valStr === '') {
      setHousePrice('');
      return;
    }
    const hp = parseFloat(valStr) || 0;
    setHousePrice(hp);

    const pct = downPaymentPercent === '' ? 0 : downPaymentPercent;
    const newDownAmt = Math.round((hp * pct) / 100);
    setDownPaymentAmount(newDownAmt);

    const newLoan = Math.max(0, hp - newDownAmt);
    setTotalLoan(newLoan);

    if (loanMode === 'combined') {
      const loanA = Math.min(newLoan, 1000);
      setLoanAmount1(loanA);
      setLoanAmount2(Math.max(0, newLoan - loanA));
    }
  };

  // 自備款成數變更處理
  const handlePercentChange = (valStr: string) => {
    if (valStr === '') {
      setDownPaymentPercent('');
      return;
    }
    const pct = parseFloat(valStr) || 0;
    setDownPaymentPercent(pct);

    const hp = housePrice === '' ? 0 : housePrice;
    const newDownAmt = Math.round((hp * pct) / 100);
    setDownPaymentAmount(newDownAmt);

    const newLoan = Math.max(0, hp - newDownAmt);
    setTotalLoan(newLoan);

    if (loanMode === 'combined') {
      const loanA = Math.min(newLoan, 1000);
      setLoanAmount1(loanA);
      setLoanAmount2(Math.max(0, newLoan - loanA));
    }
  };

  // 自備款金額變更處理
  const handleDownAmountChange = (valStr: string) => {
    if (valStr === '') {
      setDownPaymentAmount('');
      return;
    }
    const downAmt = parseFloat(valStr) || 0;
    setDownPaymentAmount(downAmt);

    const hp = housePrice === '' ? 0 : housePrice;
    const newPct = hp > 0 ? parseFloat(((downAmt / hp) * 100).toFixed(2)) : 0;
    setDownPaymentPercent(newPct);

    const newLoan = Math.max(0, hp - downAmt);
    setTotalLoan(newLoan);

    if (loanMode === 'combined') {
      const loanA = Math.min(newLoan, 1000);
      setLoanAmount1(loanA);
      setLoanAmount2(Math.max(0, newLoan - loanA));
    }
  };

  // 快捷設置貸款 A 金額
  const setLoanAQuickValue = (val: number | null) => {
    if (val === null) {
      setLoanAmount1(totalLoan);
      setLoanAmount2(0);
    } else {
      const amtA = Math.min(val, totalLoan);
      setLoanAmount1(amtA);
      setLoanAmount2(Math.max(0, totalLoan - amtA));
    }
  };

  // 階梯利率新增與刪除
  const addStageSingle = () => {
    if (singleStages.length >= 6) return;
    const next = [...singleStages];
    next.splice(next.length - 1, 0, { durationValue: 1, durationUnit: 'year', rate: 2.1 });
    setSingleStages(next);
  };

  const removeStageSingle = (idx: number) => {
    if (singleStages.length <= 2) return;
    const next = singleStages.filter((_, i) => i !== idx);
    setSingleStages(next);
  };

  const addStage1 = () => {
    if (stages1.length >= 6) return;
    const next =
      stages1.length < 2
        ? [
            { durationValue: 3, durationUnit: 'year' as const, rate: 1.775 },
            { durationValue: null, durationUnit: null, rate: 2.15 },
          ]
        : [...stages1];
    next.splice(next.length - 1, 0, { durationValue: 1, durationUnit: 'year', rate: 1.775 });
    setStages1(next);
  };

  const removeStage1 = (idx: number) => {
    if (stages1.length <= 2) return;
    const next = stages1.filter((_, i) => i !== idx);
    setStages1(next);
  };

  const handleRateType1Change = (type: 'single' | 'multi') => {
    setRateType1(type);
    if (type === 'multi' && stages1.length < 2) {
      setStages1([
        { durationValue: 3, durationUnit: 'year', rate: typeof singleRate1 === 'number' ? singleRate1 : 1.775 },
        { durationValue: 2, durationUnit: 'year', rate: 2.15 },
        { durationValue: null, durationUnit: null, rate: 2.15 },
      ]);
    }
  };

  const addStage2 = () => {
    if (stages2.length >= 6) return;
    const next =
      stages2.length < 2
        ? [
            { durationValue: 2, durationUnit: 'year' as const, rate: 2.185 },
            { durationValue: null, durationUnit: null, rate: 2.25 },
          ]
        : [...stages2];
    next.splice(next.length - 1, 0, { durationValue: 1, durationUnit: 'year', rate: 2.185 });
    setStages2(next);
  };

  const removeStage2 = (idx: number) => {
    if (stages2.length <= 2) return;
    const next = stages2.filter((_, i) => i !== idx);
    setStages2(next);
  };

  const handleRateType2Change = (type: 'single' | 'multi') => {
    setRateType2(type);
    if (type === 'multi' && stages2.length < 2) {
      setStages2([
        { durationValue: 2, durationUnit: 'year', rate: typeof singleRate2 === 'number' ? singleRate2 : 2.185 },
        { durationValue: 1, durationUnit: 'year', rate: 2.25 },
        { durationValue: null, durationUnit: null, rate: 2.25 },
      ]);
    }
  };

  // 房貸核心試算邏輯
  const calculateLoan = useCallback(() => {
    const result = calculateMortgage({
      housePriceInTenThousands: housePrice === '' ? 0 : housePrice,
      downPaymentInTenThousands: downPaymentAmount === '' ? 0 : downPaymentAmount,
      loanMode,
      single: {
        periodVal: singlePeriodVal === '' ? 0 : singlePeriodVal,
        periodUnit: singlePeriodUnit,
        graceVal: singleGraceVal === '' ? 0 : singleGraceVal,
        graceUnit: singleGraceUnit,
        rateType: singleRateType,
        singleRate: singleRate === '' ? 0 : singleRate,
        stages: singleStages,
        repayType: singleRepayType,
        fee: singleFee === '' ? 0 : singleFee,
      },
      combinedA: {
        loanAmount: (loanAmount1 === '' ? 0 : loanAmount1) * 10000,
        periodVal: periodVal1 === '' ? 0 : periodVal1,
        periodUnit: periodUnit1,
        graceVal: graceVal1 === '' ? 0 : graceVal1,
        graceUnit: graceUnit1,
        rateType: rateType1,
        singleRate: singleRate1 === '' ? 0 : singleRate1,
        stages: stages1,
        repayType: repayType1,
        fee: fee1 === '' ? 0 : fee1,
      },
      combinedB: {
        loanAmount: (loanAmount2 === '' ? 0 : loanAmount2) * 10000,
        periodVal: periodVal2 === '' ? 0 : periodVal2,
        periodUnit: periodUnit2,
        graceVal: graceVal2 === '' ? 0 : graceVal2,
        graceUnit: graceUnit2,
        rateType: rateType2,
        singleRate: singleRate2 === '' ? 0 : singleRate2,
        stages: stages2,
        repayType: repayType2,
        fee: fee2 === '' ? 0 : fee2,
      },
    });

    setFirstPayment(result.firstPayment);
    setTotalInterest(result.totalInterest);
    setTotalRepay(result.totalRepay);
    setAprRate(result.aprPercent);
    setSchedule(result.schedule);
  }, [
    housePrice,
    downPaymentAmount,
    loanMode,
    singlePeriodVal,
    singlePeriodUnit,
    singleGraceVal,
    singleGraceUnit,
    singleRateType,
    singleRate,
    singleStages,
    singleRepayType,
    singleFee,
    loanAmount1,
    periodVal1,
    periodUnit1,
    graceVal1,
    graceUnit1,
    repayType1,
    rateType1,
    singleRate1,
    stages1,
    fee1,
    loanAmount2,
    periodVal2,
    periodUnit2,
    graceVal2,
    graceUnit2,
    repayType2,
    rateType2,
    singleRate2,
    stages2,
    fee2,
  ]);

  useEffect(() => {
    calculateLoan();
  }, [calculateLoan]);

  // 房貸餘額遞減趨勢圖資料（TrendChart 為主題感知 ECharts 元件）
  const trendXLabels = useMemo(
    () => schedule.map((row) => (row.period === 0 ? t.initialPeriod : t.periodText(row.period))),
    [schedule, t],
  );
  const trendSeries = useMemo(
    () => [
      {
        name: t.remainingPrincipalLegend,
        data: schedule.map((row) => row.endBalance),
        colorDark: '#00f5a0',
        colorLight: '#059669',
        areaColorDark: 'rgba(0, 245, 160, 0.3)',
        areaColorLight: 'rgba(5, 150, 105, 0.18)',
      },
    ],
    [schedule, t],
  );

  // 複製試算分享連結
  const copyShareLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => showToast(t.toastCopied));
  };

  const visibleSchedule = showAllRows ? schedule : schedule.slice(0, 121);

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#00f5a0"
        accentGlow="rgba(0, 245, 160, 0.6)"
      >

        {/* 手續費 ≥ 貸款金額：APR 無法求解警示 */}
        {aprRate === null && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm font-medium flex items-center gap-2">
            <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span>{t.aprUnavailableWarning}</span>
          </div>
        )}

        <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
          {/* 左欄：表單設定區 */}
          <div className={`${styles.glassCard} p-8 flex flex-col gap-6 shadow-lg`}>
            {/* 房屋總價 */}
            <div className="flex flex-col gap-2">
              <label htmlFor={priceInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.housePriceLabel}</label>
              <input
                id={priceInputId}
                type="number"
                value={housePrice}
                onChange={e => handlePriceChange(e.target.value)}
                className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
              />
            </div>

            {/* 自備款成數 & 金額 雙向連動 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={percentInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.downPaymentPercentLabel}</label>
                <input
                  id={percentInputId}
                  type="number"
                  step="0.5"
                  value={downPaymentPercent}
                  onChange={e => handlePercentChange(e.target.value)}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={downInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.downPaymentAmountLabel}</label>
                <input
                  id={downInputId}
                  type="number"
                  value={downPaymentAmount}
                  onChange={e => handleDownAmountChange(e.target.value)}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>
            </div>

            {/* 貸款模式切換 */}
            <div className={`flex flex-col gap-2 ${styles.divider} pt-4`}>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.loanModeLabel}</span>
                <span className={`text-sm font-semibold font-mono ${styles.accentText}`}>
                  {t.totalLoanAmountLabel}{totalLoan.toLocaleString('zh-TW')} {t.unitWan}
                </span>
              </div>
              <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
                <button
                  type="button"
                  onClick={() => setLoanMode('single')}
                  className={`py-2 text-sm rounded-xl cursor-pointer transition-all border ${
                    loanMode === 'single'
                      ? styles.activeScheme
                      : 'border-transparent text-text-sub hover:text-text-main'
                  }`}
                >
                  {t.singleLoanMode}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoanMode('combined');
                    const loanA = Math.min(totalLoan, 1000);
                    setLoanAmount1(loanA);
                    setLoanAmount2(Math.max(0, totalLoan - loanA));
                  }}
                  className={`py-2 text-sm rounded-xl cursor-pointer transition-all border ${
                    loanMode === 'combined'
                      ? styles.activeScheme
                      : 'border-transparent text-text-sub hover:text-text-main'
                  }`}
                >
                  {t.combinedLoanMode}
                </button>
              </div>
            </div>

            {/* ====== 單一貸款模式設定 ====== */}
            {loanMode === 'single' && (
              <div className={`flex flex-col gap-5 ${styles.divider} pt-5`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor={singlePeriodInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.loanTermLabel}</label>
                    <input
                      id={singlePeriodInputId}
                      type="number"
                      value={singlePeriodVal}
                      onChange={e => setSinglePeriodVal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                      className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor={singleGraceInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.gracePeriodLabel}</label>
                    <input
                      id={singleGraceInputId}
                      type="number"
                      value={singleGraceVal}
                      onChange={e => setSingleGraceVal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                      className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                    />
                  </div>
                </div>

                {/* 利率類型 */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.rateTypeLabel}</span>
                  <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
                    <button
                      type="button"
                      onClick={() => setSingleRateType('single')}
                      className={`py-2 text-sm font-semibold rounded-xl cursor-pointer border ${
                        singleRateType === 'single'
                          ? styles.activeScheme
                          : 'border-transparent text-text-sub hover:text-text-main'
                      }`}
                    >
                      {t.singleRateMode}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleRateType('multi')}
                      className={`py-2 text-sm font-semibold rounded-xl cursor-pointer border ${
                        singleRateType === 'multi'
                          ? styles.activeScheme
                          : 'border-transparent text-text-sub hover:text-text-main'
                      }`}
                    >
                      {t.multiRateMode}
                    </button>
                  </div>
                </div>

                {singleRateType === 'single' ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor={singleRateInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">{t.annualRateLabel}</label>
                    <input
                      id={singleRateInputId}
                      type="number"
                      step="0.01"
                      value={singleRate}
                      onChange={e => setSingleRate(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                    />
                  </div>
                ) : (
                  <div className={`flex flex-col gap-3 ${styles.subCard} p-4 rounded-xl`}>
                    <span className={`text-xs ${styles.accentText} font-medium`}>{t.multiRateSettings}</span>
                    {singleStages.map((stg, sIdx) => {
                      const isLast = sIdx === singleStages.length - 1;
                      return (
                        <div key={sIdx} className={`flex flex-col gap-2 ${styles.divider} pb-3`}>
                          <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                            <span>{isLast ? `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}${t.remainingPeriods}` : `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}`}</span>
                            {!isLast && singleStages.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeStageSingle(sIdx)}
                                className="text-[0.75rem] text-[#ef4444] hover:underline cursor-pointer"
                              >
                                {t.remove}
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {!isLast ? (
                              <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                                <input
                                  type="number"
                                  placeholder={t.placeholderPeriod}
                                  value={stg.durationValue ?? ''}
                                  onChange={e => {
                                    const next = [...singleStages];
                                    next[sIdx].durationValue = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                    setSingleStages(next);
                                  }}
                                  className="w-full bg-transparent text-text-main text-xs py-2 outline-none font-mono"
                                />
                                <span className="text-sm text-text-sub ml-1">{t.unitYear}</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-sm text-text-sub px-2">{t.untilExpiry}</div>
                            )}
                            <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                              <input
                                type="number"
                                step="0.01"
                                placeholder={t.placeholderRate}
                                value={stg.rate}
                                onChange={e => {
                                  const next = [...singleStages];
                                  next[sIdx].rate = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                  setSingleStages(next);
                                }}
                                className="w-full bg-transparent text-text-main text-xs py-2 outline-none font-mono"
                              />
                              <span className="text-sm text-text-sub ml-1">%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {singleStages.length < 6 && (
                      <button
                        type="button"
                        onClick={addStageSingle}
                        className={`text-xs ${styles.accentText} ${styles.activeScheme} py-2 rounded-lg transition-all cursor-pointer`}
                      >
                        {t.addRateStage}
                      </button>
                    )}
                  </div>
                )}

                {/* 還款方式 */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.repayTypeLabel}</span>
                  <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
                    <button
                      type="button"
                      onClick={() => setSingleRepayType('equal-total')}
                      className={`py-2 text-sm font-semibold rounded-xl cursor-pointer border ${
                        singleRepayType === 'equal-total'
                          ? styles.activeScheme
                          : 'border-transparent text-text-sub hover:text-text-main'
                      }`}
                    >
                      {t.equalTotal}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleRepayType('equal-principal')}
                      className={`py-2 text-sm font-semibold rounded-xl cursor-pointer border ${
                        singleRepayType === 'equal-principal'
                          ? styles.activeScheme
                          : 'border-transparent text-text-sub hover:text-text-main'
                      }`}
                    >
                      {t.equalPrincipal}
                    </button>
                  </div>
                </div>

                {/* 開辦費 */}
                <div className="flex flex-col gap-2">
                  <label htmlFor={singleFeeInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">{t.originationFeeLabel}</label>
                  <input
                    id={singleFeeInputId}
                    type="number"
                    value={singleFee}
                    onChange={e => setSingleFee(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                </div>
              </div>
            )}

            {/* ====== 組合貸款模式設定 (貸款 A + 貸款 B) ====== */}
            {loanMode === 'combined' && (
              <div className={`flex flex-col gap-6 ${styles.divider} pt-5`}>
                {/* 貸款 A 卡片 */}
                <div className={styles.subCard}>
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={loanName1}
                      onChange={e => setLoanName1(e.target.value)}
                      className={`bg-transparent border-b border-dashed border-[var(--theme-color)] ${styles.accentText} text-sm font-semibold outline-none px-1 py-0.5`}
                    />
                    <span className={`text-[0.7rem] ${styles.activeScheme} px-2 py-0.5 rounded-md font-mono`}>
                      {t.firstLoan}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-sub">{t.loanAmountLabel}</span>
                    <input
                      type="number"
                      value={loanAmount1}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                        const amtA = typeof val === 'number' ? Math.min(val, totalLoan) : 0;
                        setLoanAmount1(val);
                        setLoanAmount2(Math.max(0, totalLoan - amtA));
                      }}
                      className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono`}
                    />
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setLoanAQuickValue(1000)}
                        className={`flex-1 py-1 text-[0.7rem] ${styles.activeScheme} rounded-md cursor-pointer`}
                      >
                        {t.quick1000m}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoanAQuickValue(null)}
                        className="flex-1 py-1 text-[0.7rem] bg-surface-glass border border-border-glass text-text-sub rounded-md cursor-pointer hover:text-text-main"
                      >
                        {t.allToA}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-text-sub">{t.loanTermLabel}</span>
                      <input
                        type="number"
                        value={periodVal1}
                        onChange={e => setPeriodVal1(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-text-sub">{t.gracePeriodLabel}</span>
                      <input
                        type="number"
                        value={graceVal1}
                        onChange={e => setGraceVal1(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                      />
                    </div>
                  </div>

                  {/* 利率類型切換 */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">{t.rateTypeLabel}</span>
                    <div className={`grid grid-cols-2 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl`}>
                      <button
                        type="button"
                        onClick={() => handleRateType1Change('single')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          rateType1 === 'single'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        {t.singleRateMode}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRateType1Change('multi')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          rateType1 === 'multi'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        {t.multiRateMode}
                      </button>
                    </div>
                  </div>

                  {rateType1 === 'single' ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-text-sub">{t.annualRateLabel}</span>
                      <input
                        type="number"
                        step="0.001"
                        value={singleRate1}
                        onChange={e => setSingleRate1(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                        className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                      />
                    </div>
                  ) : (
                    <div className={`flex flex-col gap-2.5 ${styles.subCard} p-3 rounded-xl border border-border-glass`}>
                      <span className={`text-xs ${styles.accentText} font-medium`}>{t.multiRateSettings}</span>
                      {stages1.map((stg, sIdx) => {
                        const isLast = sIdx === stages1.length - 1;
                        return (
                          <div key={sIdx} className={`flex flex-col gap-1.5 ${styles.divider} pb-2`}>
                            <div className="flex justify-between items-center text-xs font-medium text-text-sub">
                              <span>{isLast ? `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}${t.remainingPeriods}` : `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}`}</span>
                              {!isLast && stages1.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeStage1(sIdx)}
                                  className="text-[0.7rem] text-[#ef4444] hover:underline cursor-pointer"
                                >
                                  移除
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {!isLast ? (
                                <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                                  <input
                                    type="number"
                                    placeholder="期間"
                                    value={stg.durationValue ?? ''}
                                    onChange={e => {
                                      const next = [...stages1];
                                      next[sIdx].durationValue = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                      setStages1(next);
                                    }}
                                    className="w-full bg-transparent text-text-main text-xs py-1.5 outline-none font-mono"
                                  />
                                  <span className="text-xs text-text-sub ml-1">年</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-xs text-text-sub px-2">直至期滿</div>
                              )}
                              <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="利率"
                                  value={stg.rate}
                                  onChange={e => {
                                    const next = [...stages1];
                                    next[sIdx].rate = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                    setStages1(next);
                                  }}
                                  className="w-full bg-transparent text-text-main text-xs py-1.5 outline-none font-mono"
                                />
                                <span className="text-xs text-text-sub ml-1">%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {stages1.length < 6 && (
                        <button
                          type="button"
                          onClick={addStage1}
                          className={`text-xs ${styles.accentText} ${styles.activeScheme} py-1.5 rounded-lg transition-all cursor-pointer`}
                        >
                          ＋ 新增利率段落
                        </button>
                      )}
                    </div>
                  )}

                  {/* 還款方式 */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">還款方式</span>
                    <div className={`grid grid-cols-2 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl`}>
                      <button
                        type="button"
                        onClick={() => setRepayType1('equal-total')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          repayType1 === 'equal-total'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        本息平均攤還
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepayType1('equal-principal')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          repayType1 === 'equal-principal'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        本金平均攤還
                      </button>
                    </div>
                  </div>

                  {/* 開辦手續費 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">開辦手續費 (元)</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={fee1 === '' ? '' : fee1.toLocaleString('zh-TW')}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        setFee1(raw === '' ? '' : parseInt(raw, 10));
                      }}
                      className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                    />
                  </div>
                </div>

                {/* 貸款 B 卡片 */}
                <div className={styles.subCard}>
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={loanName2}
                      onChange={e => setLoanName2(e.target.value)}
                      className={`bg-transparent border-b border-dashed border-amber-500/40 ${styles.interestText} text-sm font-semibold outline-none px-1 py-0.5`}
                    />
                    <span className={`text-[0.7rem] bg-amber-500/15 border border-amber-500/30 ${styles.interestText} px-2 py-0.5 rounded-md font-mono`}>
                      {t.secondLoan}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-sub">{t.loanAmountLabel}</span>
                    <input
                      type="number"
                      value={loanAmount2}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                        const amtB = typeof val === 'number' ? Math.min(val, totalLoan) : 0;
                        setLoanAmount2(val);
                        setLoanAmount1(Math.max(0, totalLoan - amtB));
                      }}
                      className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-text-sub">{t.loanTermLabel}</span>
                      <input
                        type="number"
                        value={periodVal2}
                        onChange={e => setPeriodVal2(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-text-sub">{t.gracePeriodLabel}</span>
                      <input
                        type="number"
                        value={graceVal2}
                        onChange={e => setGraceVal2(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                      />
                    </div>
                  </div>

                  {/* 利率類型切換 */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">{t.rateTypeLabel}</span>
                    <div className={`grid grid-cols-2 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl`}>
                      <button
                        type="button"
                        onClick={() => handleRateType2Change('single')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          rateType2 === 'single'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        {t.singleRateMode}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRateType2Change('multi')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          rateType2 === 'multi'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        {t.multiRateMode}
                      </button>
                    </div>
                  </div>

                  {rateType2 === 'single' ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-text-sub">{t.annualRateLabel}</span>
                      <input
                        type="number"
                        step="0.001"
                        value={singleRate2}
                        onChange={e => setSingleRate2(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                        className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                      />
                    </div>
                  ) : (
                    <div className={`flex flex-col gap-2.5 ${styles.subCard} p-3 rounded-xl border border-border-glass`}>
                      <span className={`text-xs ${styles.accentText} font-medium`}>{t.multiRateSettings}</span>
                      {stages2.map((stg, sIdx) => {
                        const isLast = sIdx === stages2.length - 1;
                        return (
                          <div key={sIdx} className={`flex flex-col gap-1.5 ${styles.divider} pb-2`}>
                            <div className="flex justify-between items-center text-xs font-medium text-text-sub">
                              <span>{isLast ? `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}${t.remainingPeriods}` : `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}`}</span>
                              {!isLast && stages2.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeStage2(sIdx)}
                                  className="text-[0.7rem] text-[#ef4444] hover:underline cursor-pointer"
                                >
                                  {t.remove}
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {!isLast ? (
                                <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                                  <input
                                    type="number"
                                    placeholder={t.placeholderPeriod}
                                    value={stg.durationValue ?? ''}
                                    onChange={e => {
                                      const next = [...stages2];
                                      next[sIdx].durationValue = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                      setStages2(next);
                                    }}
                                    className="w-full bg-transparent text-text-main text-xs py-1.5 outline-none font-mono"
                                  />
                                  <span className="text-xs text-text-sub ml-1">{t.unitYear}</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-xs text-text-sub px-2">{t.untilExpiry}</div>
                              )}
                              <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder={t.placeholderRate}
                                  value={stg.rate}
                                  onChange={e => {
                                    const next = [...stages2];
                                    next[sIdx].rate = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                    setStages2(next);
                                  }}
                                  className="w-full bg-transparent text-text-main text-xs py-1.5 outline-none font-mono"
                                />
                                <span className="text-xs text-text-sub ml-1">%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {stages2.length < 6 && (
                        <button
                          type="button"
                          onClick={addStage2}
                          className={`text-xs ${styles.accentText} ${styles.activeScheme} py-1.5 rounded-lg transition-all cursor-pointer`}
                        >
                          {t.addRateStage}
                        </button>
                      )}
                    </div>
                  )}

                  {/* 還款方式 */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">{t.repayTypeLabel}</span>
                    <div className={`grid grid-cols-2 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl`}>
                      <button
                        type="button"
                        onClick={() => setRepayType2('equal-total')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          repayType2 === 'equal-total'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        {t.equalTotal}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepayType2('equal-principal')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          repayType2 === 'equal-principal'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        {t.equalPrincipal}
                      </button>
                    </div>
                  </div>

                  {/* 開辦手續費 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">{t.originationFeeLabel}</span>
                    <input
                      type="number"
                      value={fee2}
                      onChange={e => setFee2(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 複製分享按鈕 */}
            <button
              type="button"
              onClick={copyShareLink}
              className={`mt-2 w-full h-[44px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
                ${styles.activeScheme} rounded-xl transition-all duration-300 cursor-pointer`}
            >
              {t.copyShareLink}
            </button>
          </div>

          {/* 右欄：看板、圖表與攤銷明細 */}
          <div className="flex flex-col gap-6">
            {/* 看板 */}
            <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">{t.firstMonthPayment}</span>
                <span className={`text-lg font-bold font-mono ${styles.accentText}`}>
                  ${Math.round(firstPayment).toLocaleString('zh-TW')}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">{t.aprTotalFeeRate}</span>
                <span className={`text-lg font-bold font-mono ${styles.aprText}`}>
                  {aprRate === null ? t.aprUnavailable : `${aprRate}%`}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">{t.totalInterestExpense}</span>
                <span className={`text-lg font-bold font-mono ${styles.interestText}`}>
                  ${Math.round(totalInterest).toLocaleString('zh-TW')}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">{t.totalRepaymentAmount}</span>
                <span className="text-lg font-bold text-text-main font-mono">
                  ${Math.round(totalRepay).toLocaleString('zh-TW')}
                </span>
              </div>
            </div>

            {/* Canvas 房貸餘額遞減趨勢圖 */}
            <div className={`${styles.glassCard} p-5 flex flex-col gap-3 shadow-lg`}>
              <div className="flex justify-between items-center text-sm text-text-sub font-semibold uppercase tracking-[1px]">
                <span>{t.trendChartTitle}</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${styles.dotBg}`} />
                    {t.remainingPrincipalLegend}
                  </span>
                </div>
              </div>
              <div className="relative w-full h-[220px]">
                <TrendChart xLabels={trendXLabels} series={trendSeries} />
              </div>
            </div>

            {/* 還款明細表 (支援展開全期與 Mobile Sticky Column) */}
            <div className={`${styles.glassCard} p-6 flex flex-col gap-4 shadow-lg`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-sm ${styles.accentText} uppercase tracking-[1px] font-semibold`}>
                  {t.scheduleTableTitle} ({showAllRows ? t.totalPeriodsText(schedule.length - 1) : t.preview120Periods})
                </h3>
                {schedule.length > 121 && (
                  <button
                    type="button"
                    onClick={() => setShowAllRows(!showAllRows)}
                    className={`text-sm font-medium ${styles.activeScheme} px-3.5 py-1.5 rounded-xl transition-all cursor-pointer`}
                  >
                    {showAllRows ? t.collapseTo120 : t.expandAllPeriodsText(schedule.length - 1)}
                  </button>
                )}
              </div>

              <div className={styles.tableWrapper}>
                <table className="w-full text-right text-sm font-mono">
                  <thead>
                    <tr className="border-b border-border-glass text-text-sub text-sm font-semibold">
                      <th className={`text-left p-3 ${styles.stickyPeriod}`}>{t.colPeriod}</th>
                      <th className="p-3">{t.colStartBalance}</th>
                      <th className="p-3">{t.colPrincipal}</th>
                      <th className="p-3">{t.colInterest}</th>
                      <th className="p-3">{t.colTotalPayment}</th>
                      <th className="p-3">{t.colEndBalance}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-glass">
                    {visibleSchedule.map(row => (
                      <tr key={row.period} className="hover:bg-white/[.04] text-text-main transition-colors">
                        <td className={`text-left p-3 font-mono ${styles.stickyPeriod}`}>
                          {row.period === 0 ? t.initialPeriod : t.periodText(row.period)}
                        </td>
                        <td className="p-3 font-mono">{row.period === 0 ? '-' : `$${Math.round(row.startBalance).toLocaleString('zh-TW')}`}</td>
                        <td className="p-3 font-mono text-text-main">{row.period === 0 ? '-' : `$${Math.round(row.principalPaid).toLocaleString('zh-TW')}`}</td>
                        <td className={`p-3 font-mono ${styles.interestText}`}>{row.period === 0 ? '-' : `$${Math.round(row.interestPaid).toLocaleString('zh-TW')}`}</td>
                        <td className={`p-3 font-mono font-semibold ${styles.accentText}`}>{row.period === 0 ? '-' : `$${Math.round(row.totalPayment).toLocaleString('zh-TW')}`}</td>
                        <td className="p-3 font-mono text-text-sub">${Math.round(row.endBalance).toLocaleString('zh-TW')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection
            title={t.faqTitle}
            subtitle={t.faqSubtitle}
            items={t.faqItems}
            accentColor="#00ffaa"
          />
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

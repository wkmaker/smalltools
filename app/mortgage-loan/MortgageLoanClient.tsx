'use client';

import { useState, useEffect, useMemo, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './mortgage-loan.module.css';
import {
  calculateMortgage,
  type Stage,
  type CombinedDetailRow,
  type RepayType,
  type RateType,
} from './engine';
import { D, toNumber } from '../utils/decimal';
import { TRANSLATIONS } from './translations';
import MortgageStatCards from './components/MortgageStatCards';
import MortgageTrendCard from './components/MortgageTrendCard';
import MortgageScheduleTable from './components/MortgageScheduleTable';
import SingleLoanSettings from './components/SingleLoanSettings';
import CombinedLoanSettings from './components/CombinedLoanSettings';

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
  const [singlePeriodUnit] = useState<'year' | 'month'>('year');
  const [singleGraceVal, setSingleGraceVal] = useState<number | ''>(3);
  const [singleGraceUnit] = useState<'year' | 'month'>('year');
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
  const [periodUnit1] = useState<'year' | 'month'>('year');
  const [graceVal1, setGraceVal1] = useState<number | ''>(5);
  const [graceUnit1] = useState<'year' | 'month'>('year');
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
  const [periodUnit2] = useState<'year' | 'month'>('year');
  const [graceVal2, setGraceVal2] = useState<number | ''>(3);
  const [graceUnit2] = useState<'year' | 'month'>('year');
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
    const newDownAmt = toNumber(D(hp).times(pct).div(100).dp(0));
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
    const newDownAmt = toNumber(D(hp).times(pct).div(100).dp(0));
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
    const newPct = hp > 0 ? toNumber(D(downAmt).div(hp).times(100).dp(2)) : 0;
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
        loanAmount: toNumber(D(loanAmount1 === '' ? 0 : loanAmount1).times(10000)),
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
        loanAmount: toNumber(D(loanAmount2 === '' ? 0 : loanAmount2).times(10000)),
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
              <SingleLoanSettings
                t={t}
                singlePeriodVal={singlePeriodVal}
                setSinglePeriodVal={setSinglePeriodVal}
                singleGraceVal={singleGraceVal}
                setSingleGraceVal={setSingleGraceVal}
                singleRateType={singleRateType}
                setSingleRateType={setSingleRateType}
                singleRate={singleRate}
                setSingleRate={setSingleRate}
                singleStages={singleStages}
                setSingleStages={setSingleStages}
                singleRepayType={singleRepayType}
                setSingleRepayType={setSingleRepayType}
                singleFee={singleFee}
                setSingleFee={setSingleFee}
                addStageSingle={addStageSingle}
                removeStageSingle={removeStageSingle}
                singlePeriodInputId={singlePeriodInputId}
                singleGraceInputId={singleGraceInputId}
                singleRateInputId={singleRateInputId}
                singleFeeInputId={singleFeeInputId}
              />
            )}

            {/* ====== 組合貸款模式設定 (貸款 A + 貸款 B) ====== */}
            {loanMode === 'combined' && (
              <CombinedLoanSettings
                t={t}
                totalLoan={totalLoan}
                loanName1={loanName1}
                setLoanName1={setLoanName1}
                loanAmount1={loanAmount1}
                setLoanAmount1={setLoanAmount1}
                setLoanAmount2={setLoanAmount2}
                periodVal1={periodVal1}
                setPeriodVal1={setPeriodVal1}
                graceVal1={graceVal1}
                setGraceVal1={setGraceVal1}
                rateType1={rateType1}
                handleRateType1Change={handleRateType1Change}
                singleRate1={singleRate1}
                setSingleRate1={setSingleRate1}
                stages1={stages1}
                setStages1={setStages1}
                addStage1={addStage1}
                removeStage1={removeStage1}
                repayType1={repayType1}
                setRepayType1={setRepayType1}
                fee1={fee1}
                setFee1={setFee1}
                setLoanAQuickValue={setLoanAQuickValue}
                loanName2={loanName2}
                setLoanName2={setLoanName2}
                loanAmount2={loanAmount2}
                periodVal2={periodVal2}
                setPeriodVal2={setPeriodVal2}
                graceVal2={graceVal2}
                setGraceVal2={setGraceVal2}
                rateType2={rateType2}
                handleRateType2Change={handleRateType2Change}
                singleRate2={singleRate2}
                setSingleRate2={setSingleRate2}
                stages2={stages2}
                setStages2={setStages2}
                addStage2={addStage2}
                removeStage2={removeStage2}
                repayType2={repayType2}
                setRepayType2={setRepayType2}
                fee2={fee2}
                setFee2={setFee2}
              />
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
            <MortgageStatCards
              t={t}
              firstPayment={firstPayment}
              aprRate={aprRate}
              totalInterest={totalInterest}
              totalRepay={totalRepay}
            />

            <MortgageTrendCard
              t={t}
              trendXLabels={trendXLabels}
              trendSeries={trendSeries}
            />

            <MortgageScheduleTable
              t={t}
              schedule={schedule}
              showAllRows={showAllRows}
              setShowAllRows={setShowAllRows}
            />
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

'use client';

import { useState, useEffect, useMemo, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import TrendChart from '../components/TrendChart';
import styles from './car-loan.module.css';
import { calculateCarLoan, type LoanRow, type RepayType, type LoanScheme } from './engine';
import { TRANSLATIONS } from './translations';

function formatNumber(val: number): string {
  if (isNaN(val) || val === 0) return '0';
  return Math.round(val).toLocaleString('zh-TW');
}

interface Props {
  lang?: 'zh-TW' | 'en';
}

export default function CarLoanClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  const [carPrice, setCarPrice] = useState<number | ''>(1000000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number | ''>(20);
  const [downPaymentAmount, setDownPaymentAmount] = useState<number | ''>(200000);
  const [loanAmount, setLoanAmount] = useState<number | ''>(800000);
  const [interestRate, setInterestRate] = useState<number | ''>(2.5);
  const [periodVal, setPeriodVal] = useState<number | ''>(5);
  const [periodUnit, setPeriodUnit] = useState<'year' | 'month'>('year');
  const [repayType, setRepayType] = useState<RepayType>('equal-total');
  const [loanScheme, setLoanScheme] = useState<LoanScheme>('standard');
  const [fee, setFee] = useState<number | ''>(3500);

  // 條件方案欄位
  const [gracePeriod, setGracePeriod] = useState<number | ''>(12);
  const [stepPayment, setStepPayment] = useState<number | ''>(5000);
  const [stepPeriods, setStepPeriods] = useState<number | ''>(12);
  const [balloonAmount, setBalloonAmount] = useState<number | ''>(200000);

  // 運算結果
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [afterSpecialPayment, setAfterSpecialPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [apr, setApr] = useState<number | null>(0);
  const [isNegAmort, setIsNegAmort] = useState<boolean>(false);
  const [schedule, setSchedule] = useState<LoanRow[]>([]);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(false);

  const carPriceInputId = useId();
  const downPaymentPercentInputId = useId();
  const downPaymentAmountInputId = useId();
  const loanAmountInputId = useId();
  const interestRateInputId = useId();
  const periodValInputId = useId();
  const feeInputId = useId();
  const gracePeriodInputId = useId();
  const stepPaymentInputId = useId();
  const stepPeriodsInputId = useId();
  const balloonAmountInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(st => ({ ...st, show: false })), 2500);
  }, []);

  // 設定全頁背景主題色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff0055');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 0, 85, 0.6)');
  }, []);

  // 初次掛載：讀取 URL Query 參數進行狀態同步
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const pPrice = searchParams.get('price');
    const pDpPct = searchParams.get('dpPct');
    const pDpAmt = searchParams.get('dpAmt');
    const pLoan = searchParams.get('loan');
    const pRate = searchParams.get('rate');
    const pPeriod = searchParams.get('period');
    const pUnit = searchParams.get('unit');
    const pScheme = searchParams.get('scheme');
    const pRepay = searchParams.get('repay');
    const pFee = searchParams.get('fee');
    const pGrace = searchParams.get('grace');
    const pStepPmt = searchParams.get('stepPmt');
    const pStepPer = searchParams.get('stepPer');
    const pBalloon = searchParams.get('balloon');

    if (pPrice && !isNaN(Number(pPrice))) {
      const priceVal = Number(pPrice);
      setCarPrice(priceVal);
      if (pDpAmt && !isNaN(Number(pDpAmt))) {
        setDownPaymentAmount(Number(pDpAmt));
      } else if (pDpPct && !isNaN(Number(pDpPct))) {
        const pct = Number(pDpPct);
        setDownPaymentPercent(pct);
        setDownPaymentAmount(Math.round(priceVal * (pct / 100)));
      }
      if (pLoan && !isNaN(Number(pLoan))) {
        setLoanAmount(Number(pLoan));
      }
    }
    if (pRate && !isNaN(Number(pRate))) setInterestRate(Number(pRate));
    if (pPeriod && !isNaN(Number(pPeriod))) setPeriodVal(Number(pPeriod));
    if (pUnit && (pUnit === 'year' || pUnit === 'month')) setPeriodUnit(pUnit);
    if (pScheme && ['standard', 'grace', 'stepped', 'balloon'].includes(pScheme)) setLoanScheme(pScheme as LoanScheme);
    if (pRepay && (pRepay === 'equal-total' || pRepay === 'equal-principal')) setRepayType(pRepay as RepayType);
    if (pFee && !isNaN(Number(pFee))) setFee(Number(pFee));
    if (pGrace && !isNaN(Number(pGrace))) setGracePeriod(Number(pGrace));
    if (pStepPmt && !isNaN(Number(pStepPmt))) setStepPayment(Number(pStepPmt));
    if (pStepPer && !isNaN(Number(pStepPer))) setStepPeriods(Number(pStepPer));
    if (pBalloon && !isNaN(Number(pBalloon))) setBalloonAmount(Number(pBalloon));

    isMountedRef.current = true;
  }, []);

  // 狀態變更時更新網址 (URL replaceState)
  useEffect(() => {
    if (!isMountedRef.current) return;
    const params = new URLSearchParams({
      price: carPrice.toString(),
      dpPct: downPaymentPercent.toString(),
      dpAmt: downPaymentAmount.toString(),
      loan: loanAmount.toString(),
      rate: interestRate.toString(),
      period: periodVal.toString(),
      unit: periodUnit,
      scheme: loanScheme,
      repay: repayType,
      fee: fee.toString(),
    });
    if (loanScheme === 'grace') params.set('grace', gracePeriod.toString());
    if (loanScheme === 'stepped') {
      params.set('stepPmt', stepPayment.toString());
      params.set('stepPer', stepPeriods.toString());
    }
    if (loanScheme === 'balloon') params.set('balloon', balloonAmount.toString());

    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [
    carPrice,
    downPaymentPercent,
    downPaymentAmount,
    loanAmount,
    interestRate,
    periodVal,
    periodUnit,
    loanScheme,
    repayType,
    fee,
    gracePeriod,
    stepPayment,
    stepPeriods,
    balloonAmount,
  ]);

  // 車價與自備款連動處理
  const handleCarPriceChange = (val: number | '') => {
    setCarPrice(val);
    if (val === '') {
      setDownPaymentAmount('');
      setLoanAmount('');
      return;
    }
    const numPct = downPaymentPercent === '' ? 0 : downPaymentPercent;
    const newDpAmount = Math.round(val * (numPct / 100));
    setDownPaymentAmount(newDpAmount);
    setLoanAmount(Math.max(0, val - newDpAmount));
  };

  const handleDownPercentChange = (pct: number | '') => {
    if (pct === '') {
      setDownPaymentPercent('');
      return;
    }
    const validPct = Math.min(100, Math.max(0, pct));
    setDownPaymentPercent(validPct);
    const numCar = carPrice === '' ? 0 : carPrice;
    const newDpAmount = Math.round(numCar * (validPct / 100));
    setDownPaymentAmount(newDpAmount);
    setLoanAmount(Math.max(0, numCar - newDpAmount));
  };

  const handleDownAmountChange = (amt: number | '') => {
    setDownPaymentAmount(amt);
    if (amt === '') {
      setDownPaymentPercent('');
      return;
    }
    const numCar = carPrice === '' ? 0 : carPrice;
    const newPct = numCar > 0 ? (amt / numCar) * 100 : 0;
    setDownPaymentPercent(parseFloat(newPct.toFixed(1)));
    setLoanAmount(Math.max(0, numCar - amt));
  };

  const handleLoanAmountChange = (amt: number | '') => {
    setLoanAmount(amt);
    if (amt === '') {
      setDownPaymentAmount('');
      return;
    }
    const numCar = carPrice === '' ? 0 : carPrice;
    const newDpAmount = Math.max(0, numCar - amt);
    setDownPaymentAmount(newDpAmount);
    const newPct = numCar > 0 ? (newDpAmount / numCar) * 100 : 0;
    setDownPaymentPercent(parseFloat(newPct.toFixed(1)));
  };

  // 主計算邏輯
  const runCalculation = useCallback(() => {
    const result = calculateCarLoan({
      loanAmount: loanAmount === '' ? 0 : loanAmount,
      periodVal: periodVal === '' ? 0 : periodVal,
      periodUnit,
      interestRatePercent: interestRate === '' ? 0 : interestRate,
      repayType,
      loanScheme,
      fee: fee === '' ? 0 : fee,
      gracePeriod: gracePeriod === '' ? 0 : gracePeriod,
      stepPayment: stepPayment === '' ? 0 : stepPayment,
      stepPeriods: stepPeriods === '' ? 0 : stepPeriods,
      balloonAmount: balloonAmount === '' ? 0 : balloonAmount,
      labels: {
        grace: t.tagGrace,
        amort: t.tagAmort,
        step: t.tagStep,
        normal: t.tagNormal,
        balloon: t.tagBalloon,
      },
    });

    setMonthlyPayment(result.monthlyPayment);
    setAfterSpecialPayment(result.afterSpecialPayment);
    setTotalInterest(result.totalInterest);
    setTotalPayment(result.totalPayment);
    setIsNegAmort(result.isNegAmort);
    setSchedule(result.schedule);
    setApr(result.apr);
  }, [loanAmount, interestRate, periodVal, periodUnit, repayType, loanScheme, fee, gracePeriod, stepPayment, stepPeriods, balloonAmount, t]);

  useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  // 本金剩餘趨勢圖資料（TrendChart 為主題感知 ECharts 元件）
  const trendXLabels = useMemo(
    () => schedule.map((row) => (row.period === 0 ? t.initialPeriod : t.periodText(row.period))),
    [schedule, t],
  );
  const trendSeries = useMemo(
    () => [
      {
        name: t.balanceTrendTitle,
        data: schedule.map((row) => row.endBalance),
        colorDark: '#ff0055',
        colorLight: '#dc2626',
        areaColorDark: 'rgba(255, 0, 85, 0.35)',
        areaColorLight: 'rgba(220, 38, 38, 0.18)',
      },
    ],
    [schedule, t],
  );

  const copyShareLink = () => {
    const params = new URLSearchParams({
      price: carPrice.toString(),
      dpPct: downPaymentPercent.toString(),
      dpAmt: downPaymentAmount.toString(),
      loan: loanAmount.toString(),
      rate: interestRate.toString(),
      period: periodVal.toString(),
      unit: periodUnit,
      scheme: loanScheme,
      repay: repayType,
      fee: fee.toString(),
    });
    if (loanScheme === 'grace') params.set('grace', gracePeriod.toString());
    if (loanScheme === 'stepped') {
      params.set('stepPmt', stepPayment.toString());
      params.set('stepPer', stepPeriods.toString());
    }
    if (loanScheme === 'balloon') params.set('balloon', balloonAmount.toString());

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => showToast(t.toastCopied));
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#ff0055"
        accentGlow="rgba(255,0,85,0.6)"
      >

        {/* 負攤還警示 Banner */}
        {isNegAmort && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm font-medium flex items-center gap-2">
            <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span>{t.negAmortWarning}</span>
          </div>
        )}

        {/* 手續費 ≥ 貸款金額：APR 無法求解警示 */}
        {apr === null && (
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
            {/* 還款方案切換 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text-sub uppercase tracking-[1px]">{t.schemeModeLabel}</span>
              <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
                {([
                  { id: 'standard', label: t.schemeStandard },
                  { id: 'grace', label: t.schemeGrace },
                  { id: 'stepped', label: t.schemeStepped },
                  { id: 'balloon', label: t.schemeBalloon },
                ] as const).map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setLoanScheme(s.id)}
                    className={`py-2.5 px-3 text-sm font-medium rounded-lg transition-all cursor-pointer border ${
                      loanScheme === s.id
                        ? styles.activeScheme
                        : 'bg-transparent border-transparent text-text-sub hover:text-text-main'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 車價與自備款 */}
            <div className={`flex flex-col gap-5 ${styles.divider} pt-5`}>
              <div className="flex flex-col gap-2">
                <label htmlFor={carPriceInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                  {t.carPriceLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={carPriceInputId}
                    type="text"
                    inputMode="numeric"
                    value={carPrice === '' ? '' : carPrice.toLocaleString('zh-TW')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      handleCarPriceChange(raw === '' ? '' : parseInt(raw, 10));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-12 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                  <span className="absolute right-4 text-xs text-text-sub">{t.unitCurrency}</span>
                </div>
              </div>

              {/* 自備款 (成數 + 金額) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor={downPaymentPercentInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                    {t.downPaymentPctLabel}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id={downPaymentPercentInputId}
                      type="number"
                      value={downPaymentPercent}
                      onChange={e => {
                        const val = e.target.value;
                        handleDownPercentChange(val === '' ? '' : parseFloat(val));
                      }}
                      className={`w-full ${styles.inputField} px-4 py-3 pr-10 rounded-xl text-base outline-none transition-all font-mono`}
                    />
                    <span className="absolute right-4 text-xs text-text-sub">%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor={downPaymentAmountInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                    {t.downPaymentAmtLabel}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id={downPaymentAmountInputId}
                      type="text"
                      inputMode="numeric"
                      value={downPaymentAmount === '' ? '' : downPaymentAmount.toLocaleString('zh-TW')}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        handleDownAmountChange(raw === '' ? '' : parseInt(raw, 10));
                      }}
                      className={`w-full ${styles.inputField} px-4 py-3 pr-10 rounded-xl text-base outline-none transition-all font-mono`}
                    />
                    <span className="absolute right-4 text-xs text-text-sub">{t.unitCurrency}</span>
                  </div>
                </div>
              </div>

              {/* 實際貸款金額 */}
              <div className="flex flex-col gap-2">
                <label htmlFor={loanAmountInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                  {t.loanAmountLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={loanAmountInputId}
                    type="text"
                    inputMode="numeric"
                    value={loanAmount === '' ? '' : loanAmount.toLocaleString('zh-TW')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      handleLoanAmountChange(raw === '' ? '' : parseInt(raw, 10));
                    }}
                    className={`w-full ${styles.inputField} ${styles.accentText} font-bold px-4 py-3 pr-12 rounded-xl text-lg outline-none transition-all font-mono`}
                  />
                  <span className={`absolute right-4 text-xs ${styles.accentText}`}>{t.unitCurrency}</span>
                </div>
              </div>
            </div>

            {/* 利率與年期 */}
            <div className={`grid grid-cols-2 gap-4 ${styles.divider} pt-5`}>
              <div className="flex flex-col gap-2">
                <label htmlFor={interestRateInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                  {t.interestRateLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={interestRateInputId}
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={e => {
                      const val = e.target.value;
                      setInterestRate(val === '' ? '' : parseFloat(val));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-10 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                  <span className="absolute right-4 text-xs text-text-sub">%</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={periodValInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                  {t.loanPeriodLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={periodValInputId}
                    type="number"
                    value={periodVal}
                    onChange={e => {
                      const val = e.target.value;
                      setPeriodVal(val === '' ? '' : parseFloat(val));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-16 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                  <div className="absolute right-1 top-1 bottom-1 flex rounded-lg overflow-hidden border border-border-glass bg-surface-glass">
                    <button
                      type="button"
                      onClick={() => setPeriodUnit('year')}
                      className={`px-2 text-xs border-none cursor-pointer transition-colors ${periodUnit === 'year' ? styles.accentText + ' font-semibold' : 'text-text-sub'}`}
                    >
                      {t.unitY}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPeriodUnit('month')}
                      className={`px-2 text-xs border-none cursor-pointer transition-colors ${periodUnit === 'month' ? styles.accentText + ' font-semibold' : 'text-text-sub'}`}
                    >
                      {t.unitM}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 本息/本金攤還模式與開辦費 */}
            <div className={`grid grid-cols-2 gap-4 ${styles.divider} pt-5`}>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-sub uppercase tracking-[1px]">{t.repayMethodLabel}</span>
                <div className={`grid grid-cols-2 gap-1 ${styles.segmentGroup} p-1 rounded-xl`}>
                  <button
                    type="button"
                    onClick={() => setRepayType('equal-total')}
                    className={`py-2 text-sm font-medium rounded-lg cursor-pointer border ${
                      repayType === 'equal-total' ? styles.activeScheme : 'border-transparent text-text-sub hover:text-text-main'
                    }`}
                  >
                    {t.repayEqualTotal}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayType('equal-principal')}
                    className={`py-2 text-sm font-medium rounded-lg cursor-pointer border ${
                      repayType === 'equal-principal' ? styles.activeScheme : 'border-transparent text-text-sub hover:text-text-main'
                    }`}
                  >
                    {t.repayEqualPrincipal}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={feeInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                  {t.feeLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={feeInputId}
                    type="text"
                    inputMode="numeric"
                    value={fee === '' ? '' : fee.toLocaleString('zh-TW')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setFee(raw === '' ? '' : parseInt(raw, 10));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-12 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                  <span className="absolute right-4 text-xs text-text-sub">{t.unitCurrency}</span>
                </div>
              </div>
            </div>

            {/* 條件式方案延伸欄位 */}
            {loanScheme === 'grace' && (
              <div className="border-l-2 border-[var(--theme-color)] pl-4 flex flex-col gap-2 py-1">
                <label htmlFor={gracePeriodInputId} className={`text-sm font-medium ${styles.accentText} uppercase tracking-[1px]`}>
                  {t.gracePeriodLabel}
                </label>
                <input
                  id={gracePeriodInputId}
                  type="number"
                  value={gracePeriod}
                  onChange={e => {
                    const val = e.target.value;
                    setGracePeriod(val === '' ? '' : parseInt(val, 10));
                  }}
                  className={`w-full ${styles.inputField} px-4 py-2.5 rounded-xl text-base outline-none`}
                />
              </div>
            )}

            {loanScheme === 'stepped' && (
              <div className="border-l-2 border-[var(--theme-color)] pl-4 flex flex-col gap-3 py-1">
                <div className="flex flex-col gap-1">
                  <label htmlFor={stepPaymentInputId} className={`text-sm font-medium ${styles.accentText} uppercase tracking-[1px]`}>
                    {t.stepPaymentLabel}
                  </label>
                  <input
                    id={stepPaymentInputId}
                    type="text"
                    inputMode="numeric"
                    value={stepPayment === '' ? '' : stepPayment.toLocaleString('zh-TW')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setStepPayment(raw === '' ? '' : parseInt(raw, 10));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-2.5 rounded-xl text-base outline-none`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={stepPeriodsInputId} className={`text-sm font-medium ${styles.accentText} uppercase tracking-[1px]`}>
                    {t.stepPeriodsLabel}
                  </label>
                  <input
                    id={stepPeriodsInputId}
                    type="number"
                    value={stepPeriods}
                    onChange={e => {
                      const val = e.target.value;
                      setStepPeriods(val === '' ? '' : parseInt(val, 10));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-2.5 rounded-xl text-base outline-none`}
                  />
                </div>
              </div>
            )}

            {loanScheme === 'balloon' && (
              <div className="border-l-2 border-[var(--theme-color)] pl-4 flex flex-col gap-2 py-1">
                <label htmlFor={balloonAmountInputId} className={`text-sm font-medium ${styles.accentText} uppercase tracking-[1px]`}>
                  {t.balloonAmountLabel} <span className="text-[0.75rem] text-text-sub">({((((balloonAmount === '' ? 0 : balloonAmount) / ((loanAmount === '' ? 0 : loanAmount) || 1))) * 100).toFixed(1)}%)</span>
                </label>
                <input
                  id={balloonAmountInputId}
                  type="text"
                  inputMode="numeric"
                  value={balloonAmount === '' ? '' : balloonAmount.toLocaleString('zh-TW')}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setBalloonAmount(raw === '' ? '' : parseInt(raw, 10));
                  }}
                  className={`w-full ${styles.inputField} px-4 py-2.5 rounded-xl text-base outline-none`}
                />
              </div>
            )}

            <button
              type="button"
              onClick={copyShareLink}
              className={`mt-2 w-full h-[44px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
                ${styles.activeScheme} rounded-xl transition-all duration-300 cursor-pointer`}
            >
              {t.copyShareBtn}
            </button>
          </div>

          {/* 右欄：試算結果面板 */}
          <div className="flex flex-col gap-6">
            {/* 四大指標看板 */}
            <div className="grid grid-cols-2 gap-4">
              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">{t.firstMonthPayment}</span>
                <span className={`font-mono text-2xl font-bold ${styles.accentText}`}>
                  ${formatNumber(monthlyPayment)}
                </span>
                {loanScheme === 'grace' && (
                  <span className="text-xs text-text-sub mt-1">{t.afterGracePayment(formatNumber(afterSpecialPayment))}</span>
                )}
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">{t.aprLabel}</span>
                <span className={`font-mono text-2xl font-bold ${styles.accentText}`}>
                  {apr === null ? t.aprUnavailable : `${apr.toFixed(2)} %`}
                </span>
                <span className="text-xs text-text-sub mt-1">{t.aprSub}</span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">{t.totalInterestLabel}</span>
                <span className={`font-mono text-xl font-bold ${styles.interestText}`}>
                  ${formatNumber(totalInterest)}
                </span>
                <span className="text-xs text-text-sub mt-1">{t.totalInterestSub}</span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">{t.totalPaymentLabel}</span>
                <span className="font-mono text-xl font-bold text-text-main">
                  ${formatNumber(totalPayment)}
                </span>
                <span className="text-xs text-text-sub mt-1">{t.totalPaymentSub}</span>
              </div>
            </div>

            {/* 本金剩餘趨勢圖表 (Canvas) */}
            <div className={`${styles.glassCard} p-5 flex flex-col gap-3`}>
              <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px]">{t.balanceTrendTitle}</span>
              <div className="relative w-full h-[220px]">
                <TrendChart xLabels={trendXLabels} series={trendSeries} />
              </div>
            </div>

            {/* 攤還明細表格 (Sticky Column) */}
            <div className={styles.tableContainer}>
              <h3 className="text-sm font-semibold text-text-main uppercase tracking-[1px] mb-4">{t.scheduleTitle}</h3>
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-border-glass text-text-sub text-sm font-semibold">
                    <th className={`text-left p-2.5 ${styles.stickyPeriod}`}>{t.colPeriod}</th>
                    <th className="p-2.5">{t.colStartBal}</th>
                    <th className="p-2.5">{t.colPrincipal}</th>
                    <th className="p-2.5">{t.colInterest}</th>
                    <th className="p-2.5">{t.colTotal}</th>
                    <th className="p-2.5">{t.colEndBal}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-glass">
                  {schedule.slice(0, 120).map(row => (
                    <tr key={row.period} className="hover:bg-white/[.03] text-text-main transition-colors">
                      <td className={`text-left p-2.5 font-mono ${styles.stickyPeriod}`}>
                        {row.period === 0 ? t.initialPeriod : t.periodText(row.period)}
                        {row.statusTag && (
                          <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded ${styles.activeScheme} font-sans font-medium`}>
                            {row.statusTag}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-mono">${formatNumber(row.startBalance)}</td>
                      <td className="p-2.5 font-mono">${formatNumber(row.principalPaid)}</td>
                      <td className={`p-2.5 font-mono ${styles.interestText}`}>${formatNumber(row.interestPaid)}</td>
                      <td className={`p-2.5 font-mono font-semibold ${styles.accentText}`}>${formatNumber(row.totalPayment)}</td>
                      <td className="p-2.5 font-mono text-text-sub">${formatNumber(row.endBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {schedule.length > 120 && (
                <div className="text-center text-xs text-text-sub mt-3">{t.showingLimit}</div>
              )}
            </div>
          </div>
        </div>

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection
            title={t.faqTitle}
            subtitle={t.faqSubtitle}
            items={t.faqItems}
            accentColor="#ff3b30"
          />
        </div>
      </ToolLayout>

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

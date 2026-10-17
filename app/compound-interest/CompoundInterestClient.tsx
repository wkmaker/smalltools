'use client';

import { useState, useEffect, useMemo, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import TrendChart from '../components/TrendChart';
import styles from './compound-interest.module.css';
import { calculateCompoundInterest } from './engine';
import { TRANSLATIONS } from './translations';

function formatNumber(val: number): string {
  if (isNaN(val) || !isFinite(val) || val === 0) return '0';
  return Math.round(val).toLocaleString('zh-TW');
}

interface Props {
  lang?: 'zh-TW' | 'en';
}

const VALID_FREQS = [0, 1, 4, 12];

export default function CompoundInterestClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  const [principal, setPrincipal] = useState<number | ''>(100000);
  const [contribution, setContribution] = useState<number | ''>(5000);
  const [contribUnit, setContribUnit] = useState<'month' | 'year'>('month');
  const [ratePercent, setRatePercent] = useState<number | ''>(6);
  const [rateUnit, setRateUnit] = useState<'year' | 'month'>('year');
  const [periodVal, setPeriodVal] = useState<number | ''>(10);
  const [periodUnit, setPeriodUnit] = useState<'year' | 'month'>('year');
  const [compoundFreq, setCompoundFreq] = useState<number>(1); // 12, 4, 1, 0
  const [inflationRate, setInflationRate] = useState<number | ''>(0);

  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(false);

  const principalInputId = useId();
  const contributionInputId = useId();
  const rateInputId = useId();
  const periodInputId = useId();
  const compoundFreqSelectId = useId();
  const inflationInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(st => ({ ...st, show: false })), 2500);
  }, []);

  // 設定全頁背景主題色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ffb800');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 184, 0, 0.6)');
  }, []);

  // 初次掛載：讀取 URL Query 參數並執行清洗與邊界夾緊
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const pP = searchParams.get('p');
    const pC = searchParams.get('c');
    const pCUnit = searchParams.get('cUnit');
    const pR = searchParams.get('r');
    const pRUnit = searchParams.get('rUnit');
    const pT = searchParams.get('t');
    const pTUnit = searchParams.get('tUnit');
    const pF = searchParams.get('f');
    const pInf = searchParams.get('inf');

    const resolvedTUnit: 'year' | 'month' = pTUnit === 'month' || pTUnit === 'year' ? pTUnit : 'year';

    if (pP !== null && pP.trim() !== '' && !isNaN(Number(pP))) {
      setPrincipal(Math.max(0, Math.round(Number(pP))));
    }
    if (pC !== null && pC.trim() !== '' && !isNaN(Number(pC))) {
      setContribution(Math.max(0, Math.round(Number(pC))));
    }
    if (pCUnit === 'month' || pCUnit === 'year') {
      setContribUnit(pCUnit);
    }
    if (pR !== null && pR.trim() !== '' && !isNaN(Number(pR))) {
      setRatePercent(Math.min(1000, Math.max(0, Number(pR))));
    }
    if (pRUnit === 'year' || pRUnit === 'month') {
      setRateUnit(pRUnit);
    }
    if (pTUnit === 'year' || pTUnit === 'month') {
      setPeriodUnit(pTUnit);
    }
    if (pT !== null && pT.trim() !== '' && !isNaN(Number(pT))) {
      const maxP = resolvedTUnit === 'year' ? 100 : 1200;
      setPeriodVal(Math.min(maxP, Math.max(0, Math.round(Number(pT)))));
    }
    if (pF !== null && pF.trim() !== '' && VALID_FREQS.includes(Number(pF))) {
      setCompoundFreq(Number(pF));
    }
    if (pInf !== null && pInf.trim() !== '' && !isNaN(Number(pInf))) {
      setInflationRate(Math.min(100, Math.max(0, Number(pInf))));
    }

    isMountedRef.current = true;
  }, []);

  // 狀態變更時更新網址 (300ms 防抖同步)
  useEffect(() => {
    if (!isMountedRef.current) return;
    const timer = setTimeout(() => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams({
        p: principal.toString(),
        c: contribution.toString(),
        cUnit: contribUnit,
        r: ratePercent.toString(),
        rUnit: rateUnit,
        t: periodVal.toString(),
        tUnit: periodUnit,
        f: compoundFreq.toString(),
      });
      const numInf = inflationRate === '' ? 0 : inflationRate;
      if (numInf > 0) {
        params.set('inf', numInf.toString());
      }
      window.history.replaceState(null, '', `?${params.toString()}`);
    }, 300);

    return () => clearTimeout(timer);
  }, [principal, contribution, contribUnit, ratePercent, rateUnit, periodVal, periodUnit, compoundFreq, inflationRate]);

  // 主計算邏輯（純函數引擎同步衍生，支援 SSR 首屏直接輸出試算結果）
  const calcResult = useMemo(
    () =>
      calculateCompoundInterest({
        principal: principal === '' ? 0 : principal,
        contribution: contribution === '' ? 0 : contribution,
        contribUnit,
        ratePercent: ratePercent === '' ? 0 : ratePercent,
        rateUnit,
        periodVal: periodVal === '' ? 0 : periodVal,
        periodUnit,
        compoundFreq,
        inflationPercent: inflationRate === '' ? 0 : inflationRate,
        labels: {
          initial: t.initialLabel,
          year: t.yearLabel,
          month: t.monthLabel,
        },
      }),
    [principal, contribution, contribUnit, ratePercent, rateUnit, periodVal, periodUnit, compoundFreq, inflationRate, t],
  );

  const {
    schedule,
    realSchedule,
    totalAsset,
    realTotalAsset,
    totalPrincipal,
    totalInterest,
    roiPercent,
    interestSharePercent,
    ruleOf72Years,
  } = calcResult;

  const hasInflation = (inflationRate === '' ? 0 : inflationRate) > 0;

  // 資產成長堆疊區域圖資料（TrendChart 為主題感知 ECharts 元件）
  const trendXLabels = useMemo(() => schedule.map((row) => row.label), [schedule]);
  const trendSeries = useMemo(
    () => [
      {
        name: t.legendPrincipal,
        data: schedule.map((row) => row.totalPrincipal),
        colorDark: '#94a3b8',
        colorLight: '#0284c7',
        areaColorDark: 'rgba(148, 163, 184, 0.35)',
        areaColorLight: 'rgba(2, 132, 199, 0.18)',
        dashed: true,
        lineWidth: 2,
        stackOnPrevious: true,
      },
      {
        // 疊在本金之上：傳「利息增量」而非總資產，疊加後的頂線視覺上才等於總資產
        name: t.legendInterest,
        data: schedule.map((row) => row.total - row.totalPrincipal),
        colorDark: '#ffb800',
        colorLight: '#d97706',
        areaColorDark: 'rgba(255, 184, 0, 0.4)',
        areaColorLight: 'rgba(245, 158, 11, 0.45)',
        stackOnPrevious: true,
      },
    ],
    [schedule, t],
  );

  const applyPreset = (type: 'etf' | 'sp500' | 'deposit') => {
    const isEn = lang === 'en';
    if (type === 'etf') {
      setPrincipal(isEn ? 10000 : 100000);
      setContribution(isEn ? 500 : 10000);
      setContribUnit('month');
      setRatePercent(6);
      setRateUnit('year');
      setPeriodVal(20);
      setPeriodUnit('year');
      setCompoundFreq(12);
    } else if (type === 'sp500') {
      setPrincipal(isEn ? 20000 : 200000);
      setContribution(isEn ? 1000 : 15000);
      setContribUnit('month');
      setRatePercent(10);
      setRateUnit('year');
      setPeriodVal(20);
      setPeriodUnit('year');
      setCompoundFreq(12);
    } else {
      setPrincipal(isEn ? 50000 : 500000);
      setContribution(isEn ? 300 : 5000);
      setContribUnit('month');
      setRatePercent(2);
      setRateUnit('year');
      setPeriodVal(10);
      setPeriodUnit('year');
      setCompoundFreq(12);
    }
  };

  const handlePeriodUnitChange = (nextUnit: 'year' | 'month') => {
    setPeriodUnit(nextUnit);
    if (periodVal !== '') {
      const maxP = nextUnit === 'year' ? 100 : 1200;
      if (periodVal > maxP) {
        setPeriodVal(maxP);
      }
    }
  };

  const copyShareLink = () => {
    const params = new URLSearchParams({
      p: principal.toString(),
      c: contribution.toString(),
      cUnit: contribUnit,
      r: ratePercent.toString(),
      rUnit: rateUnit,
      t: periodVal.toString(),
      tUnit: periodUnit,
      f: compoundFreq.toString(),
    });
    const numInf = inflationRate === '' ? 0 : inflationRate;
    if (numInf > 0) {
      params.set('inf', numInf.toString());
    }
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => showToast(t.toastCopied));
  };

  const exportScheduleCsv = () => {
    const headers = [
      t.colYearMonth(periodUnit === 'year'),
      t.colStartBal,
      t.colContrib,
      t.colInterest,
      t.colCumulPrincipal,
      t.colTotal,
      ...(hasInflation ? [t.colRealTotal] : []),
    ];

    const csvRows = [
      headers.join(','),
      ...schedule.map((row, idx) => {
        const cols = [
          `"${row.label}"`,
          Math.round(row.startBalance),
          Math.round(row.contribution),
          Math.round(row.interest),
          Math.round(row.totalPrincipal),
          Math.round(row.total),
          ...(hasInflation ? [Math.round(realSchedule[idx] ?? row.total)] : []),
        ];
        return cols.join(',');
      }),
    ];

    const blob = new Blob([`\uFEFF${csvRows.join('\n')}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `compound-interest-${periodVal || 0}${periodUnit}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast(t.toastCsvExported);
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#ffb800"
        accentGlow="rgba(255,184,0,0.6)"
      >
        <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
          {/* 左欄：表單設定區 */}
          <div className={`${styles.glassCard} p-8 max-sm:p-5 flex flex-col gap-5 shadow-lg min-w-0`}>
            {/* 快速預設情境 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.presetLabel}</span>
              <div className={`grid grid-cols-3 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl max-sm:grid-cols-1`}>
                {[
                  { key: 'etf' as const, label: t.presetEtf, rate: 6 },
                  { key: 'sp500' as const, label: t.presetSp500, rate: 10 },
                  { key: 'deposit' as const, label: t.presetDeposit, rate: 2 },
                ].map(item => {
                  const isMatched = rateUnit === 'year' && ratePercent === item.rate && compoundFreq === 12;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => applyPreset(item.key)}
                      className={`py-2 px-2.5 rounded-lg text-xs cursor-pointer border transition-all text-center truncate ${
                        isMatched
                          ? `${styles.activeSegment} shadow-sm`
                          : 'border-transparent text-text-sub hover:text-text-main'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 初始本金 */}
            <div className={`flex flex-col gap-2 ${styles.divider} pt-4`}>
              <label htmlFor={principalInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                {t.principalLabel}
              </label>
              <div className="relative flex items-center">
                <input
                  id={principalInputId}
                  type="text"
                  inputMode="numeric"
                  value={principal === '' ? '' : principal.toLocaleString('zh-TW')}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setPrincipal(raw === '' ? '' : parseInt(raw, 10));
                  }}
                  className={`w-full ${styles.inputField} px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all font-mono`}
                />
                <span className="absolute right-4 text-sm text-text-sub font-medium">{t.unitCurrency}</span>
              </div>
            </div>

            {/* 定期定額金額與頻率 */}
            <div className={`flex flex-col gap-4 ${styles.divider} pt-4`}>
              <div className="flex flex-col gap-2">
                <label htmlFor={contributionInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.contributionLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={contributionInputId}
                    type="text"
                    inputMode="numeric"
                    value={contribution === '' ? '' : contribution.toLocaleString('zh-TW')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setContribution(raw === '' ? '' : parseInt(raw, 10));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all font-mono`}
                  />
                  <span className="absolute right-4 text-sm text-text-sub font-medium">{t.unitCurrency}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.contribFreqLabel}</span>
                <div className={`grid grid-cols-2 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl`}>
                  <button
                    type="button"
                    onClick={() => setContribUnit('month')}
                    className={`py-2 text-sm rounded-lg cursor-pointer border transition-all ${
                      contribUnit === 'month'
                        ? `${styles.activeSegment} shadow-sm`
                        : 'border-transparent text-text-sub hover:text-text-main'
                    }`}
                  >
                    {t.contribMonth}
                  </button>
                  <button
                    type="button"
                    onClick={() => setContribUnit('year')}
                    className={`py-2 text-sm rounded-lg cursor-pointer border transition-all ${
                      contribUnit === 'year'
                        ? `${styles.activeSegment} shadow-sm`
                        : 'border-transparent text-text-sub hover:text-text-main'
                    }`}
                  >
                    {t.contribYear}
                  </button>
                </div>
              </div>
            </div>

            {/* 年/月利率與期限 */}
            <div className={`grid grid-cols-2 max-sm:grid-cols-1 gap-4 ${styles.divider} pt-4`}>
              <div className="flex flex-col gap-2 min-w-0">
                <label htmlFor={rateInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.rateLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={rateInputId}
                    type="number"
                    min={0}
                    max={1000}
                    step="0.1"
                    value={ratePercent}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        setRatePercent('');
                        return;
                      }
                      const parsed = parseFloat(val);
                      if (!isNaN(parsed)) {
                        setRatePercent(Math.min(1000, Math.max(0, parsed)));
                      }
                    }}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-20 rounded-xl text-sm outline-none transition-all font-mono`}
                  />
                  <div className={`absolute right-1.5 top-1.5 bottom-1.5 flex ${styles.segmentGroup} rounded-lg overflow-hidden`}>
                    <button
                      type="button"
                      onClick={() => setRateUnit('year')}
                      className={`px-2.5 text-xs border-none cursor-pointer transition-colors ${
                        rateUnit === 'year' ? styles.activeInlineUnit : 'text-text-sub hover:text-text-main'
                      }`}
                    >
                      {t.rateYear}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRateUnit('month')}
                      className={`px-2.5 text-xs border-none cursor-pointer transition-colors ${
                        rateUnit === 'month' ? styles.activeInlineUnit : 'text-text-sub hover:text-text-main'
                      }`}
                    >
                      {t.rateMonth}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-w-0">
                <label htmlFor={periodInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.periodLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={periodInputId}
                    type="number"
                    min={1}
                    max={periodUnit === 'year' ? 100 : 1200}
                    step="1"
                    value={periodVal}
                    onChange={e => {
                      const val = e.target.value;
                      if (val === '') {
                        setPeriodVal('');
                        return;
                      }
                      const parsed = parseInt(val, 10);
                      if (!isNaN(parsed)) {
                        const maxP = periodUnit === 'year' ? 100 : 1200;
                        setPeriodVal(Math.min(maxP, Math.max(0, parsed)));
                      }
                    }}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-20 rounded-xl text-sm outline-none transition-all font-mono`}
                  />
                  <div className={`absolute right-1.5 top-1.5 bottom-1.5 flex ${styles.segmentGroup} rounded-lg overflow-hidden`}>
                    <button
                      type="button"
                      onClick={() => handlePeriodUnitChange('year')}
                      className={`px-2.5 text-xs border-none cursor-pointer transition-colors ${
                        periodUnit === 'year' ? styles.activeInlineUnit : 'text-text-sub hover:text-text-main'
                      }`}
                    >
                      {t.periodYear}
                    </button>
                    <button
                      type="button"
                      onClick={() => handlePeriodUnitChange('month')}
                      className={`px-2.5 text-xs border-none cursor-pointer transition-colors ${
                        periodUnit === 'month' ? styles.activeInlineUnit : 'text-text-sub hover:text-text-main'
                      }`}
                    >
                      {t.periodMonth}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 複利計息頻率（獨立全寬列） */}
            <div className={`flex flex-col gap-2 ${styles.divider} pt-4`}>
              <label htmlFor={compoundFreqSelectId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                {t.freqLabel}
              </label>
              <select
                id={compoundFreqSelectId}
                value={compoundFreq}
                onChange={e => setCompoundFreq(parseInt(e.target.value, 10))}
                className={`w-full ${styles.selectControl} px-4 py-3 rounded-xl text-sm outline-none cursor-pointer transition-all`}
              >
                <option value={12}>{t.freqMonthly}</option>
                <option value={4}>{t.freqQuarterly}</option>
                <option value={1}>{t.freqYearly}</option>
                <option value={0}>{t.freqSimple}</option>
              </select>
            </div>

            {/* 預期年通膨率（獨立全寬列，標籤列右側整合精緻數值切換器） */}
            <div className={`flex flex-col gap-2 ${styles.divider} pt-4`}>
              <div className="flex justify-between items-center gap-2 flex-wrap">
                <label htmlFor={inflationInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.inflationLabel}
                </label>
                <div className={`flex items-center gap-1 ${styles.segmentGroup} p-1 rounded-lg`}>
                  {[0, 1.5, 2, 3].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setInflationRate(val)}
                      className={`px-2.5 py-0.5 rounded-md text-xs font-mono cursor-pointer border transition-all ${
                        (inflationRate === '' ? 0 : inflationRate) === val
                          ? `${styles.activeSegment} shadow-xs`
                          : 'border-transparent text-text-sub hover:text-text-main'
                      }`}
                    >
                      {val}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative flex items-center">
                <input
                  id={inflationInputId}
                  type="number"
                  min={0}
                  max={100}
                  step="0.1"
                  value={inflationRate}
                  onChange={e => {
                    const val = e.target.value;
                    if (val === '') {
                      setInflationRate('');
                      return;
                    }
                    const parsed = parseFloat(val);
                    if (!isNaN(parsed)) {
                      setInflationRate(Math.min(100, Math.max(0, parsed)));
                    }
                  }}
                  className={`w-full ${styles.inputField} px-4 py-3 pr-12 rounded-xl text-sm outline-none transition-all font-mono`}
                />
                <span className="absolute right-4 text-sm text-text-sub font-medium">%</span>
              </div>
            </div>

            <button
              type="button"
              onClick={copyShareLink}
              className={`mt-2 w-full h-[44px] flex items-center justify-center gap-2 text-sm font-semibold tracking-[1px] rounded-xl shadow-sm cursor-pointer ${styles.shareBtn}`}
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92s2.92-1.31 2.92-2.92-1.31-2.92-2.92-2.92z" />
              </svg>
              <span>{t.copyShareBtn}</span>
            </button>
          </div>

          {/* 右欄：結果與圖表區 */}
          <div className="flex flex-col gap-6 min-w-0">
            {/* 三大指標看板 */}
            <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
              <div className={`${styles.glassCard} p-5 flex flex-col items-center justify-center text-center transition-all hover:translate-y-[-2px] min-w-0`}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">{t.totalAssetLabel}</span>
                <span
                  className={`font-mono text-2xl font-bold ${styles.totalText} drop-shadow-[0_2px_10px_rgba(255,184,0,0.25)] max-w-full truncate`}
                  title={`$${formatNumber(totalAsset)}`}
                >
                  ${formatNumber(totalAsset)}
                </span>
                {hasInflation && (
                  <span className={`mt-1 text-xs font-mono font-medium ${styles.realText} max-w-full truncate`}>
                    {t.realValueSub(formatNumber(realTotalAsset))}
                  </span>
                )}
              </div>

              <div className={`${styles.glassCard} p-5 flex flex-col items-center justify-center text-center transition-all hover:translate-y-[-2px] min-w-0`}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">{t.totalPrincipalLabel}</span>
                <span
                  className="font-mono text-xl font-bold text-text-main max-w-full truncate"
                  title={`$${formatNumber(totalPrincipal)}`}
                >
                  ${formatNumber(totalPrincipal)}
                </span>
              </div>

              <div className={`${styles.glassCard} p-5 flex flex-col items-center justify-center text-center transition-all hover:translate-y-[-2px] min-w-0`}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">{t.totalInterestLabel}</span>
                <span
                  className={`font-mono text-xl font-bold ${styles.interestText} max-w-full truncate`}
                  title={`$${formatNumber(totalInterest)}`}
                >
                  ${formatNumber(totalInterest)}
                </span>
              </div>
            </div>

            {/* 次要財務指標摘要列 (ROI / 利息佔比 / 72 法則翻倍時間) */}
            <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
              <div className={`${styles.subStatCard} px-4 py-3 flex items-center justify-between gap-2 min-w-0`}>
                <span className="text-xs font-medium text-text-sub">{t.roiLabel}</span>
                <span className={`font-mono text-sm font-bold ${styles.interestText} truncate`}>
                  +{roiPercent.toFixed(1)}%
                </span>
              </div>

              <div className={`${styles.subStatCard} px-4 py-3 flex items-center justify-between gap-2 min-w-0`}>
                <span className="text-xs font-medium text-text-sub">{t.interestShareLabel}</span>
                <span className={`font-mono text-sm font-bold ${styles.totalText} truncate`}>
                  {interestSharePercent.toFixed(1)}%
                </span>
              </div>

              <div className={`${styles.subStatCard} px-4 py-3 flex items-center justify-between gap-2 min-w-0`}>
                <span className="text-xs font-medium text-text-sub">{t.rule72Label}</span>
                <span className="font-mono text-sm font-bold text-text-main truncate">
                  {ruleOf72Years !== null ? t.rule72Value(ruleOf72Years.toFixed(1)) : t.rule72Na}
                </span>
              </div>
            </div>

            {/* 資產成長趨勢圖 (Canvas 堆疊區域圖) */}
            <div className={`${styles.glassCard} p-5 flex flex-col gap-3 min-w-0`}>
              <div className="flex flex-wrap justify-between items-center gap-2 text-sm font-semibold text-text-sub uppercase tracking-[1px]">
                <span>{t.chartTitle}</span>
                <div className="flex gap-4 text-xs">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${styles.totalText} bg-current`} />
                    {t.legendInterest}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${styles.principalDot}`} />
                    {t.legendPrincipal}
                  </span>
                </div>
              </div>
              <div className="relative w-full h-[230px]">
                <TrendChart xLabels={trendXLabels} series={trendSeries} />
              </div>
            </div>

            {/* 本利和明細表格 (外框固定標題與匯出按鈕，內層獨立橫向捲動) */}
            <div className={`${styles.glassCard} p-6 max-sm:p-4 flex flex-col gap-4 min-w-0`}>
              <div className="flex justify-between items-center gap-3">
                <h3 className="text-sm font-semibold text-text-main uppercase tracking-[1px]">
                  {periodUnit === 'year' ? t.scheduleYearTitle : t.scheduleMonthTitle}
                </h3>
                <button
                  type="button"
                  onClick={exportScheduleCsv}
                  className={`${styles.presetChip} flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer`}
                >
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  <span>{t.exportCsvBtn}</span>
                </button>
              </div>

              <div className={styles.tableWrapper}>
                <table className="w-full text-right text-sm">
                  <thead>
                    <tr className={`${styles.tableHeaderRow} text-text-sub text-sm font-semibold`}>
                      <th className={`text-left p-2.5 whitespace-nowrap ${styles.stickyPeriod}`}>{t.colYearMonth(periodUnit === 'year')}</th>
                      <th className="p-2.5 whitespace-nowrap">{t.colStartBal}</th>
                      <th className="p-2.5 whitespace-nowrap">{t.colContrib}</th>
                      <th className="p-2.5 whitespace-nowrap">{t.colInterest}</th>
                      <th className="p-2.5 whitespace-nowrap">{t.colCumulPrincipal}</th>
                      <th className="p-2.5 whitespace-nowrap">{t.colTotal}</th>
                      {hasInflation && <th className="p-2.5 whitespace-nowrap">{t.colRealTotal}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((row, idx) => (
                      <tr key={idx} className={`${styles.tableDataRow} text-text-main transition-colors`}>
                        <td className={`text-left p-2.5 font-mono text-text-main whitespace-nowrap ${styles.stickyPeriod}`}>{row.label}</td>
                        <td className="p-2.5 font-mono whitespace-nowrap">{row.label === t.initialLabel ? '-' : `$${formatNumber(row.startBalance)}`}</td>
                        <td className="p-2.5 font-mono whitespace-nowrap">{row.label === t.initialLabel ? '-' : `+$${formatNumber(row.contribution)}`}</td>
                        <td className={`p-2.5 font-mono whitespace-nowrap ${styles.interestText}`}>{row.label === t.initialLabel ? '-' : `+$${formatNumber(row.interest)}`}</td>
                        <td className="p-2.5 font-mono whitespace-nowrap">${formatNumber(row.totalPrincipal)}</td>
                        <td className={`p-2.5 font-mono whitespace-nowrap ${styles.totalText} font-semibold`}>${formatNumber(row.total)}</td>
                        {hasInflation && (
                          <td className={`p-2.5 font-mono whitespace-nowrap ${styles.realText} font-medium`}>
                            ${formatNumber(realSchedule[idx] ?? row.total)}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <FaqSection
          items={t.faqItems}
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          accentColor="#ffb800"
          className="mt-8"
        />
      </ToolLayout>

      <div
        className={`fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 text-sm rounded-lg z-[100] pointer-events-none backdrop-blur-[10px] transition-all duration-300 ${styles.toastBanner} ${
          toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[100px]'
        }`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        <span>{toast.msg}</span>
      </div>
    </>
  );
}


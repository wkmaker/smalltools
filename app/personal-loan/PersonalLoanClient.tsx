'use client';

import { useState, useEffect, useMemo, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import TrendChart from '../components/TrendChart';
import styles from './personal-loan.module.css';
import { calculatePersonalLoan, type LoanScheduleRow, type RepayMethod } from './engine';
import { TRANSLATIONS } from './translations';

interface Props {
  lang?: 'zh-TW' | 'en';
}


export default function PersonalLoanClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  const [loanAmount, setLoanAmount] = useState<number | ''>(50); // 萬
  const [loanYears, setLoanYears] = useState<number | ''>(7);
  const [annualRate, setAnnualRate] = useState<number | ''>(3.25); // %
  const [fee, setFee] = useState<number | ''>(6000); // 元手續費
  const [method, setMethod] = useState<RepayMethod>('equal-payment');

  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [aprRate, setAprRate] = useState<number | null>(0);
  const [schedule, setSchedule] = useState<LoanScheduleRow[]>([]);

  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef<boolean>(false);

  const amountInputId = useId();
  const yearsInputId = useId();
  const rateInputId = useId();
  const feeInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(st => ({ ...st, show: false })), 2500);
  }, []);

  // 設定全頁背景主題發光色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);

  // 初始載入網址 Query 參數與防呆解析
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const a = params.get('a') || params.get('amount');
    const y = params.get('y') || params.get('years');
    const r = params.get('r') || params.get('rate');
    const f = params.get('f') || params.get('fee');
    const m = params.get('m') || params.get('method');

    if (a !== null && !isNaN(Number(a))) setLoanAmount(Math.max(0, Number(a)));
    if (y !== null && !isNaN(Number(y))) setLoanYears(Math.max(1, Number(y)));
    if (r !== null && !isNaN(Number(r))) setAnnualRate(Math.max(0, Number(r)));
    if (f !== null && !isNaN(Number(f))) setFee(Math.max(0, Number(f)));
    if (m === 'equal-principal' || m === 'equal-payment') setMethod(m);

    isMountedRef.current = true;
  }, []);

  // 網址參數雙向連動 (isMountedRef 鎖定防護)
  useEffect(() => {
    if (!isMountedRef.current) return;
    const timer = setTimeout(() => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams();
      if (loanAmount !== '') params.set('a', loanAmount.toString());
      if (loanYears !== '') params.set('y', loanYears.toString());
      if (annualRate !== '') params.set('r', annualRate.toString());
      if (fee !== '') params.set('f', fee.toString());
      params.set('m', method);

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }, 300);

    return () => clearTimeout(timer);
  }, [loanAmount, loanYears, annualRate, fee, method]);

  // 個人信貸主試算邏輯（純函數引擎，見 ./engine.ts）
  const runCalculation = useCallback(() => {
    const result = calculatePersonalLoan({
      amountInTenThousands: loanAmount === '' ? 0 : loanAmount,
      years: loanYears === '' ? 0 : loanYears,
      annualRatePercent: annualRate === '' ? 0 : annualRate,
      fee: fee === '' ? 0 : fee,
      method,
    });

    setMonthlyPayment(result.monthlyPayment);
    setTotalInterest(result.totalInterest);
    setSchedule(result.schedule);
    setAprRate(result.aprPercent);
  }, [loanAmount, loanYears, annualRate, fee, method]);

  useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  // 賸餘本金遞減趨勢圖資料（TrendChart 為主題感知 ECharts 元件）
  const trendChartData = useMemo(() => {
    const numAmt = (loanAmount === '' ? 0 : loanAmount) * 10000;
    return [{ month: 0, remaining: numAmt }, ...schedule];
  }, [schedule, loanAmount]);
  const trendXLabels = useMemo(
    () => trendChartData.map((row) => (row.month === 0 ? t.initialPeriod : t.periodText(row.month))),
    [trendChartData, t],
  );
  const trendSeries = useMemo(
    () => [
      {
        name: t.legendRemaining,
        data: trendChartData.map((row) => row.remaining),
        colorDark: '#00f5a0',
        colorLight: '#059669',
        areaColorDark: 'rgba(0, 245, 160, 0.3)',
        areaColorLight: 'rgba(5, 150, 105, 0.18)',
      },
    ],
    [trendChartData, t],
  );

  const copyShareLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast(t.toastCopied);
    });
  };

  return (
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
        {/* 左欄：輸入選項區塊 */}
        <div className={`${styles.glassCard} p-8 flex flex-col gap-6 shadow-lg`}>
          <div className="flex justify-between items-center pb-2 border-b border-border-glass">
            <h2 className="text-base font-semibold text-text-main">{t.settingTitle}</h2>
            <button
              type="button"
              onClick={copyShareLink}
              className="flex items-center gap-1.5 text-xs text-text-sub hover:text-text-main transition-colors cursor-pointer px-2.5 py-1 rounded-lg border border-border-glass bg-surface-glass"
              title="複製分享連結"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
              <span>{t.shareBtn}</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={amountInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
              {t.amountLabel}
            </label>
            <input
              id={amountInputId}
              type="number"
              value={loanAmount}
              onChange={e => {
                const val = e.target.value;
                setLoanAmount(val === '' ? '' : parseFloat(val));
              }}
              className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={yearsInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                {t.yearsLabel}
              </label>
              <input
                id={yearsInputId}
                type="number"
                value={loanYears}
                onChange={e => {
                  const val = e.target.value;
                  setLoanYears(val === '' ? '' : parseInt(val, 10));
                }}
                className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={rateInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                {t.rateLabel}
              </label>
              <input
                id={rateInputId}
                type="number"
                step="0.01"
                value={annualRate}
                onChange={e => {
                  const val = e.target.value;
                  setAnnualRate(val === '' ? '' : parseFloat(val));
                }}
                className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
              />
            </div>
          </div>

          <div className={`flex flex-col gap-2 ${styles.divider} pt-4`}>
            <label htmlFor={feeInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
              {t.feeLabel}
            </label>
            <input
              id={feeInputId}
              type="text"
              inputMode="numeric"
              value={fee === '' ? '' : fee.toLocaleString('zh-TW')}
              onChange={e => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                setFee(raw === '' ? '' : parseInt(raw, 10));
              }}
              className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
            />
          </div>

          {/* 還款方式 */}
          <div className={`flex flex-col gap-2 ${styles.divider} pt-4`}>
            <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.repayMethodLabel}</span>
            <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
              <button
                type="button"
                onClick={() => setMethod('equal-payment')}
                className={`py-2 text-sm rounded-xl cursor-pointer transition-all border ${
                  method === 'equal-payment'
                    ? styles.activeMethod
                    : 'border-transparent text-text-sub hover:text-text-main'
                }`}
              >
                {t.repayEqualPayment}
              </button>
              <button
                type="button"
                onClick={() => setMethod('equal-principal')}
                className={`py-2 text-sm rounded-xl cursor-pointer transition-all border ${
                  method === 'equal-principal'
                    ? styles.activeMethod
                    : 'border-transparent text-text-sub hover:text-text-main'
                }`}
              >
                {t.repayEqualPrincipal}
              </button>
            </div>
          </div>
        </div>

        {/* 右欄：看板與歷期明細 */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
            <div className={styles.statCard}>
              <span className="text-sm font-semibold text-text-sub">{t.firstMonthPayment}</span>
              <span className={`text-xl font-bold font-mono ${styles.accentText}`}>
                ${monthlyPayment.toLocaleString('zh-TW')}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className="text-sm font-semibold text-text-sub">{t.aprRateLabel}</span>
              <span className={`text-xl font-bold font-mono ${styles.aprText}`}>
                {aprRate === null ? t.aprUnavailable : `${aprRate}%`}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className="text-sm font-semibold text-text-sub">{t.totalInterestLabel}</span>
              <span className={`text-xl font-bold font-mono ${styles.interestText}`}>
                ${totalInterest.toLocaleString('zh-TW')}
              </span>
            </div>
          </div>

          {/* 賸餘本金遞減趨勢圖 */}
          <div className={`${styles.glassCard} p-5 flex flex-col gap-3 shadow-lg`}>
            <div className="flex justify-between items-center text-sm text-text-sub font-semibold uppercase tracking-[1px]">
              <span>{t.trendTitle}</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${styles.dotBg}`} />
                  {t.legendRemaining}
                </span>
              </div>
            </div>
            <div className="relative w-full h-[220px]">
              <TrendChart xLabels={trendXLabels} series={trendSeries} />
            </div>
          </div>

          {/* 還款明細表 */}
          <div className={`${styles.glassCard} p-6 flex flex-col gap-4 shadow-lg`}>
            <h3 className="text-sm font-semibold text-text-main uppercase tracking-[1px]">{t.scheduleTitle}</h3>
            <div className={styles.tableWrapper}>
              <table className="w-full text-right text-sm font-mono">
                <thead>
                  <tr className="border-b border-border-glass text-text-sub text-sm font-semibold">
                    <th className={`text-left p-3 ${styles.stickyPeriod}`}>{t.colPeriod}</th>
                    <th className="p-3">{t.colPayment}</th>
                    <th className="p-3">{t.colPrincipal}</th>
                    <th className="p-3">{t.colInterest}</th>
                    <th className="p-3">{t.colRemaining}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-glass">
                  {schedule.map(row => (
                    <tr key={row.month} className="hover:bg-white/[.04] text-text-main transition-colors">
                      <td className={`text-left p-3 font-mono ${styles.stickyPeriod}`}>{t.periodText(row.month)}</td>
                      <td className={`p-3 font-semibold ${styles.accentText}`}>${row.payment.toLocaleString('zh-TW')}</td>
                      <td className="p-3 text-text-main">${row.principal.toLocaleString('zh-TW')}</td>
                      <td className={`p-3 ${styles.interestText}`}>${row.interest.toLocaleString('zh-TW')}</td>
                      <td className="p-3 text-text-sub">${row.remaining.toLocaleString('zh-TW')}</td>
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
          accentColor="#00f5a0"
        />
      </div>

      {/* Toast 提示框 */}
      {toast.show && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white border border-white/20 px-6 py-3 rounded-full text-sm shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${styles.dotBg}`} />
          {toast.msg}
        </div>
      )}
    </ToolLayout>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import styles from './personal-loan.module.css';

interface LoanScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remaining: number;
}

/**
 * 採用二分搜尋法 (Bisection Method) 精確求解折現淨現值 (NPV = 0) 之 APR 實質年利率
 */
function calculateAPR(loanAmount: number, fee: number, payments: number[]): number {
  const netAmount = loanAmount - fee;
  if (netAmount <= 0 || payments.length === 0) return 0;

  let low = 0;
  let high = 2; // 月折現率上限 200%
  let mid = 0;

  for (let iter = 0; iter < 80; iter++) {
    mid = (low + high) / 2;
    let npv = -netAmount;
    for (let t = 0; t < payments.length; t++) {
      npv += payments[t] / Math.pow(1 + mid, t + 1);
    }
    if (npv > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return parseFloat((mid * 12 * 100).toFixed(2));
}

export default function PersonalLoanClient() {
  const [loanAmount, setLoanAmount] = useState<number | ''>(50); // 萬
  const [loanYears, setLoanYears] = useState<number | ''>(7);
  const [annualRate, setAnnualRate] = useState<number | ''>(3.25); // %
  const [fee, setFee] = useState<number | ''>(6000); // 元手續費
  const [method, setMethod] = useState<'equal-payment' | 'equal-principal'>('equal-payment');

  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [aprRate, setAprRate] = useState<number>(0);
  const [schedule, setSchedule] = useState<LoanScheduleRow[]>([]);

  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const amountInputId = useId();
  const yearsInputId = useId();
  const rateInputId = useId();
  const feeInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
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
  }, []);

  // 網址參數雙向連動 (300ms 防抖無感更新)
  useEffect(() => {
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

  // 個人信貸主試算邏輯
  const calculatePersonalLoan = useCallback(() => {
    const numAmount = loanAmount === '' ? 0 : loanAmount;
    const numYears = loanYears === '' ? 0 : loanYears;
    const numRate = annualRate === '' ? 0 : annualRate;
    const numFee = fee === '' ? 0 : fee;

    const loanAmt = numAmount * 10000;
    const totalMonths = numYears * 12;
    const monthlyRate = numRate / 100 / 12;

    let remaining = loanAmt;
    let sumInterest = 0;
    const rows: LoanScheduleRow[] = [];

    if (totalMonths > 0 && loanAmt > 0) {
      for (let m = 1; m <= totalMonths; m++) {
        let interest = Math.round(remaining * monthlyRate);
        let principal = 0;

        if (method === 'equal-payment') {
          if (monthlyRate === 0) {
            principal = Math.round(loanAmt / totalMonths);
          } else {
            const pow = Math.pow(1 + monthlyRate, totalMonths);
            const pmt = (loanAmt * monthlyRate * pow) / (pow - 1);
            principal = Math.round(pmt - interest);
          }
        } else {
          principal = Math.round(loanAmt / totalMonths);
        }

        // 最後一期清算剩餘本金，避免 JS 浮點數誤差殘留
        if (m === totalMonths) {
          principal = remaining;
        }

        const payment = principal + interest;
        remaining = Math.max(0, remaining - principal);
        if (m === totalMonths) {
          remaining = 0;
        }
        sumInterest += interest;

        rows.push({
          month: m,
          payment,
          principal,
          interest,
          remaining,
        });
      }
    }

    setMonthlyPayment(rows[0]?.payment || 0);
    setTotalInterest(sumInterest);
    setSchedule(rows);

    // 金融級二分搜尋法求解 APR (實質總費用年率)
    const paymentsList = rows.map(r => r.payment);
    const calculatedApr = calculateAPR(loanAmt, numFee, paymentsList);
    setAprRate(calculatedApr > 0 ? calculatedApr : numRate);
  }, [loanAmount, loanYears, annualRate, fee, method]);

  useEffect(() => {
    calculatePersonalLoan();
  }, [calculatePersonalLoan]);

  // 繪製 賸餘本金遞減趨勢圖 (Theme-Aware Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || schedule.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    const numAmt = (loanAmount === '' ? 0 : loanAmount) * 10000;
    const maxVal = numAmt > 0 ? numAmt : 1;

    const chartData = [
      { month: 0, remaining: numAmt },
      ...schedule,
    ];

    const points = chartData.map((row, idx) => ({
      x: (idx / (chartData.length - 1)) * (width - 60) + 40,
      y: height - 30 - (row.remaining / maxVal) * (height - 60),
    }));

    // 漸層背景 (亮暗雙模式色調調和)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (isLight) {
      grad.addColorStop(0, 'rgba(5, 150, 105, 0.18)');
      grad.addColorStop(1, 'rgba(5, 150, 105, 0.02)');
    } else {
      grad.addColorStop(0, 'rgba(0, 245, 160, 0.3)');
      grad.addColorStop(1, 'rgba(0, 245, 160, 0.02)');
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, height - 30);
    ctx.lineTo(points[0].x, height - 30);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 折線主軌跡
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = isLight ? '#059669' : '#00f5a0';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // X / Y 軸刻度線與文字
    ctx.strokeStyle = isLight ? 'rgba(203, 213, 225, 0.6)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();

    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('初始', 35, height - 12);
    ctx.fillText(`第 ${schedule.length} 期`, width - 45, height - 12);
    ctx.fillText(`$${Math.round(maxVal).toLocaleString('zh-TW')}`, 5, 20);
  }, [schedule, loanAmount]);

  const copyShareLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('已複製試算分享連結');
    });
  };

  return (
    <ToolLayout
      title="個人信貸試算器"
      subtitle="PERSONAL LOAN CALCULATOR"
      description="專業免費的線上個人信貸計算機！支援本息均攤、本金均攤、開辦費/手續費攤提與 APR 實質總費用年率試算，即時提供月還款額與歷期攤還明細表。"
      accentColor="#00f5a0"
      accentGlow="rgba(0, 245, 160, 0.6)"
    >
      <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
        {/* 左欄：輸入選項區塊 */}
        <div className={`${styles.glassCard} p-8 flex flex-col gap-6 shadow-lg`}>
          <div className="flex justify-between items-center pb-2 border-b border-border-glass">
            <h2 className="text-base font-semibold text-text-main">貸款條件設定</h2>
            <button
              type="button"
              onClick={copyShareLink}
              className="flex items-center gap-1.5 text-xs text-text-sub hover:text-text-main transition-colors cursor-pointer px-2.5 py-1 rounded-lg border border-border-glass bg-surface-glass"
              title="複製分享連結"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
              <span>分享連結</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={amountInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
              貸款金額 (萬元)
            </label>
            <input
              id={amountInputId}
              type="number"
              value={loanAmount}
              onChange={e => setLoanAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
              className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={yearsInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                貸款期限 (年)
              </label>
              <input
                id={yearsInputId}
                type="number"
                value={loanYears}
                onChange={e => setLoanYears(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={rateInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                申貸利率 (%)
              </label>
              <input
                id={rateInputId}
                type="number"
                step="0.01"
                value={annualRate}
                onChange={e => setAnnualRate(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
              />
            </div>
          </div>

          <div className={`flex flex-col gap-2 ${styles.divider} pt-4`}>
            <label htmlFor={feeInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
              開辦手續費 (元)
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
            <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">還款方式</span>
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
                本息平均攤還
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
                本金平均攤還
              </button>
            </div>
          </div>
        </div>

        {/* 右欄：看板與歷期明細 */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
            <div className={styles.statCard}>
              <span className="text-sm font-semibold text-text-sub">首期月付金額</span>
              <span className={`text-xl font-bold font-mono ${styles.accentText}`}>
                ${monthlyPayment.toLocaleString('zh-TW')}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className="text-sm font-semibold text-text-sub">APR 總費用年率</span>
              <span className={`text-xl font-bold font-mono ${styles.aprText}`}>
                {aprRate}%
              </span>
            </div>

            <div className={styles.statCard}>
              <span className="text-sm font-semibold text-text-sub">總利息支出</span>
              <span className={`text-xl font-bold font-mono ${styles.interestText}`}>
                ${totalInterest.toLocaleString('zh-TW')}
              </span>
            </div>
          </div>

          {/* 賸餘本金遞減趨勢圖 */}
          <div className={`${styles.glassCard} p-5 flex flex-col gap-3 shadow-lg`}>
            <div className="flex justify-between items-center text-sm text-text-sub font-semibold uppercase tracking-[1px]">
              <span>賸餘本金遞減趨勢圖</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${styles.dotBg}`} />
                  賸餘本金餘額
                </span>
              </div>
            </div>
            <div className="relative w-full h-[220px]">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
          </div>

          {/* 還款明細表 */}
          <div className={`${styles.glassCard} p-6 flex flex-col gap-4 shadow-lg`}>
            <h3 className="text-sm font-semibold text-text-main uppercase tracking-[1px]">信貸還款明細表</h3>
            <div className={styles.tableWrapper}>
              <table className="w-full text-right text-sm font-mono">
                <thead>
                  <tr className="border-b border-border-glass text-text-sub text-sm font-semibold">
                    <th className={`text-left p-3 ${styles.stickyPeriod}`}>期數</th>
                    <th className="p-3">月付金額</th>
                    <th className="p-3">償還本金</th>
                    <th className="p-3">償還利息</th>
                    <th className="p-3">剩餘本金</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-glass">
                  {schedule.map(row => (
                    <tr key={row.month} className="hover:bg-white/[.04] text-text-main transition-colors">
                      <td className={`text-left p-3 font-mono ${styles.stickyPeriod}`}>第 {row.month} 期</td>
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

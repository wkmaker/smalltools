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

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const amountInputId = useId();
  const yearsInputId = useId();
  const rateInputId = useId();
  const feeInputId = useId();

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);

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

        if (m === totalMonths) {
          principal = remaining;
        }

        const payment = principal + interest;
        remaining = Math.max(0, remaining - principal);
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

    // 估算 APR (實質總費用年率)
    const netReceived = loanAmt - numFee;
    if (netReceived > 0 && numYears > 0 && loanAmt > 0) {
      const approxApr = numRate + (numFee / loanAmt / numYears) * 100;
      setAprRate(parseFloat(approxApr.toFixed(2)));
    } else {
      setAprRate(numRate);
    }
  }, [loanAmount, loanYears, annualRate, fee, method]);

  useEffect(() => {
    calculatePersonalLoan();
  }, [calculatePersonalLoan]);

  // 繪製 賸餘本金遞減趨勢圖 (Canvas)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || schedule.length === 0) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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
      ...schedule
    ];

    const points = chartData.map((row, idx) => ({
      x: (idx / (chartData.length - 1)) * (width - 60) + 40,
      y: height - 30 - (row.remaining / maxVal) * (height - 60),
    }));

    // 薄荷綠漸層背景
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(0, 245, 160, 0.3)');
    grad.addColorStop(1, 'rgba(0, 245, 160, 0.02)');

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

    // 賸餘本金折線 (薄荷綠主線)
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#00f5a0';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // X / Y 軸線
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('初始', 35, height - 12);
    ctx.fillText(`第 ${schedule.length} 期`, width - 45, height - 12);
    ctx.fillText(`$${Math.round(maxVal).toLocaleString('zh-TW')}`, 5, 20);
  }, [schedule, loanAmount]);

  return (
    <ToolLayout
      title="個人信貸試算器"
      subtitle="PERSONAL LOAN CALCULATOR"
      description="專業免費的線上個人信貸計算機！支援本息均攤、本金均攤、開辦費/手續費攤提與 APR 實質總費用年率試算，即時提供月還款額與歷期攤還明細表。"
      accentColor="#00f5a0"
      accentGlow="rgba(0, 245, 160, 0.6)"
    >
      <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
        {/* 左欄：輸入選項 */}
        <div className="bg-black/20 border border-white/[.08] rounded-2xl p-8 flex flex-col gap-6 shadow-lg">
          <div className="flex flex-col gap-2">
            <label htmlFor={amountInputId} className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">貸款金額 (萬元)</label>
            <input
              id={amountInputId}
              type="number"
              value={loanAmount}
              onChange={e => setLoanAmount(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
              className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00f5a0] font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={yearsInputId} className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">貸款期限 (年)</label>
              <input
                id={yearsInputId}
                type="number"
                value={loanYears}
                onChange={e => setLoanYears(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00f5a0] font-mono"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={rateInputId} className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">申貸利率 (%)</label>
              <input
                id={rateInputId}
                type="number"
                step="0.01"
                value={annualRate}
                onChange={e => setAnnualRate(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00f5a0] font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 border-t border-white/[.05] pt-4">
            <label htmlFor={feeInputId} className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">開辦手續費 (元)</label>
            <input
              id={feeInputId}
              type="number"
              value={fee}
              onChange={e => setFee(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
              className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00f5a0] font-mono"
            />
          </div>

          {/* 還款方式 */}
          <div className="flex flex-col gap-2 border-t border-white/[.05] pt-4">
            <label className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">還款方式</label>
            <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-xl border border-white/[.08]">
              <button
                onClick={() => setMethod('equal-payment')}
                className={`py-2 text-sm rounded-lg cursor-pointer transition-all border ${
                  method === 'equal-payment'
                    ? 'bg-[#00f5a0]/15 border-[#00f5a0]/40 text-[#00f5a0] font-semibold'
                    : 'border-transparent text-slate-300'
                }`}
              >
                本息平均攤還
              </button>
              <button
                onClick={() => setMethod('equal-principal')}
                className={`py-2 text-sm rounded-lg cursor-pointer transition-all border ${
                  method === 'equal-principal'
                    ? 'bg-[#00f5a0]/15 border-[#00f5a0]/40 text-[#00f5a0] font-semibold'
                    : 'border-transparent text-slate-300'
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
              <span className="text-sm font-semibold text-text-sub">每月還款金額</span>
              <span className="text-xl font-bold text-[#00f5a0] font-mono">
                ${monthlyPayment.toLocaleString('zh-TW')}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className="text-sm font-semibold text-text-sub">APR 總費用年率</span>
              <span className="text-xl font-bold text-[#4ade80] font-mono">
                {aprRate}%
              </span>
            </div>

            <div className={styles.statCard}>
              <span className="text-sm font-semibold text-text-sub">總利息支出</span>
              <span className="text-xl font-bold text-[#fbbf24] font-mono">
                ${totalInterest.toLocaleString('zh-TW')}
              </span>
            </div>
          </div>

          {/* 賸餘本金遞減趨勢圖 */}
          <div className="bg-black/30 border border-white/[.08] rounded-2xl p-5 flex flex-col gap-3 shadow-lg">
            <div className="flex justify-between items-center text-sm text-text-sub font-semibold uppercase tracking-[1px]">
              <span>賸餘本金遞減趨勢圖</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#00f5a0]" />賸餘本金餘額</span>
              </div>
            </div>
            <div className="relative w-full h-[220px]">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
          </div>

          {/* 還款明細表 */}
          <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-4 shadow-lg">
            <h3 className="text-sm font-semibold text-text-main uppercase tracking-[1px]">信貸還款明細表</h3>
            <div className={styles.tableWrapper}>
              <table className="w-full text-right text-sm font-mono">
                <thead>
                  <tr className="border-b border-white/[.1] text-text-sub text-sm font-semibold">
                    <th className={`text-left p-3 ${styles.stickyPeriod}`}>期數</th>
                    <th className="p-3">月付金額</th>
                    <th className="p-3">償還本金</th>
                    <th className="p-3">償還利息</th>
                    <th className="p-3">剩餘本金</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[.04]">
                  {schedule.map(row => (
                    <tr key={row.month} className="hover:bg-white/[.02] text-white/80 transition-colors">
                      <td className={`text-left p-3 font-mono text-white ${styles.stickyPeriod}`}>第 {row.month} 期</td>
                      <td className="p-3 text-[#00f5a0] font-semibold">${row.payment.toLocaleString('zh-TW')}</td>
                      <td className="p-3 text-white">${row.principal.toLocaleString('zh-TW')}</td>
                      <td className="p-3 text-[#fbbf24]">${row.interest.toLocaleString('zh-TW')}</td>
                      <td className="p-3 text-slate-300">${row.remaining.toLocaleString('zh-TW')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

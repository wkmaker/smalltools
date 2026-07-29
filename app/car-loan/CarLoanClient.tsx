'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import styles from './car-loan.module.css';

interface LoanRow {
  period: number;
  startBalance: number;
  principalPaid: number;
  interestPaid: number;
  totalPayment: number;
  endBalance: number;
  statusTag: string;
}

function formatNumber(val: number): string {
  if (isNaN(val) || val === 0) return '0';
  return Math.round(val).toLocaleString('zh-TW');
}

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

  return mid * 12 * 100;
}

export default function CarLoanClient() {
  const [carPrice, setCarPrice] = useState<number>(1000000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [downPaymentAmount, setDownPaymentAmount] = useState<number>(200000);
  const [loanAmount, setLoanAmount] = useState<number>(800000);
  const [interestRate, setInterestRate] = useState<number>(2.5);
  const [periodVal, setPeriodVal] = useState<number>(5);
  const [periodUnit, setPeriodUnit] = useState<'year' | 'month'>('year');
  const [repayType, setRepayType] = useState<'equal-total' | 'equal-principal'>('equal-total');
  const [loanScheme, setLoanScheme] = useState<'standard' | 'grace' | 'stepped' | 'balloon'>('standard');
  const [fee, setFee] = useState<number>(3500);

  // 條件方案欄位
  const [gracePeriod, setGracePeriod] = useState<number>(12);
  const [stepPayment, setStepPayment] = useState<number>(5000);
  const [stepPeriods, setStepPeriods] = useState<number>(12);
  const [balloonAmount, setBalloonAmount] = useState<number>(200000);

  // 運算結果
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [afterSpecialPayment, setAfterSpecialPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [apr, setApr] = useState<number>(0);
  const [schedule, setSchedule] = useState<LoanRow[]>([]);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  // 設定全頁背景粒子色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff0055');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 0, 85, 0.6)');
  }, []);

  // 車價與自備款連動
  const handleCarPriceChange = (val: number) => {
    setCarPrice(val);
    const newDpAmount = Math.round(val * (downPaymentPercent / 100));
    setDownPaymentAmount(newDpAmount);
    setLoanAmount(Math.max(0, val - newDpAmount));
  };

  const handleDownPercentChange = (pct: number) => {
    const validPct = Math.min(100, Math.max(0, pct));
    setDownPaymentPercent(validPct);
    const newDpAmount = Math.round(carPrice * (validPct / 100));
    setDownPaymentAmount(newDpAmount);
    setLoanAmount(Math.max(0, carPrice - newDpAmount));
  };

  const handleDownAmountChange = (amt: number) => {
    setDownPaymentAmount(amt);
    const newPct = carPrice > 0 ? (amt / carPrice) * 100 : 0;
    setDownPaymentPercent(parseFloat(newPct.toFixed(1)));
    setLoanAmount(Math.max(0, carPrice - amt));
  };

  const handleLoanAmountChange = (amt: number) => {
    setLoanAmount(amt);
    const newDpAmount = Math.max(0, carPrice - amt);
    setDownPaymentAmount(newDpAmount);
    const newPct = carPrice > 0 ? (newDpAmount / carPrice) * 100 : 0;
    setDownPaymentPercent(parseFloat(newPct.toFixed(1)));
  };

  // 主計算邏輯
  const runCalculation = useCallback(() => {
    const totalMonths = Math.max(0, periodUnit === 'year' ? periodVal * 12 : periodVal);
    if (totalMonths <= 0 || loanAmount <= 0) {
      setMonthlyPayment(0);
      setAfterSpecialPayment(0);
      setTotalInterest(0);
      setTotalPayment(0);
      setApr(0);
      setSchedule([]);
      return;
    }

    const monthlyRate = interestRate / 100 / 12;
    const paymentArray: number[] = [];
    const rows: LoanRow[] = [];
    let remBalance = loanAmount;
    let interestSum = 0;
    let firstPay = 0;
    let afterPay = 0;

    rows.push({
      period: 0,
      startBalance: 0,
      principalPaid: 0,
      interestPaid: 0,
      totalPayment: 0,
      endBalance: loanAmount,
      statusTag: '',
    });

    if (loanScheme === 'standard') {
      if (repayType === 'equal-total') {
        let pmt = 0;
        if (monthlyRate === 0) {
          pmt = loanAmount / totalMonths;
        } else {
          pmt = (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        }
        firstPay = pmt;

        for (let m = 1; m <= totalMonths; m++) {
          const start = remBalance;
          const interest = start * monthlyRate;
          const principal = pmt - interest;
          remBalance -= principal;
          if (m === totalMonths) remBalance = 0;

          interestSum += interest;
          paymentArray.push(pmt);
          rows.push({
            period: m,
            startBalance: start,
            principalPaid: principal,
            interestPaid: interest,
            totalPayment: pmt,
            endBalance: Math.max(0, remBalance),
            statusTag: '',
          });
        }
      } else {
        const principalPerMonth = loanAmount / totalMonths;
        for (let m = 1; m <= totalMonths; m++) {
          const start = remBalance;
          const interest = start * monthlyRate;
          const pmt = principalPerMonth + interest;
          remBalance -= principalPerMonth;
          if (m === totalMonths) remBalance = 0;

          if (m === 1) firstPay = pmt;
          interestSum += interest;
          paymentArray.push(pmt);
          rows.push({
            period: m,
            startBalance: start,
            principalPaid: principalPerMonth,
            interestPaid: interest,
            totalPayment: pmt,
            endBalance: Math.max(0, remBalance),
            statusTag: '',
          });
        }
      }
    } else if (loanScheme === 'grace') {
      const validGrace = Math.min(gracePeriod, totalMonths - 1);
      const amortizeMonths = totalMonths - validGrace;
      const interestOnly = loanAmount * monthlyRate;

      let amortPmt = 0;
      if (amortizeMonths > 0) {
        if (repayType === 'equal-total') {
          if (monthlyRate === 0) {
            amortPmt = loanAmount / amortizeMonths;
          } else {
            amortPmt = (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, amortizeMonths))) / (Math.pow(1 + monthlyRate, amortizeMonths) - 1);
          }
        }
      }

      firstPay = validGrace > 0 ? interestOnly : amortPmt;
      afterPay = amortPmt;

      const principalPerMonth = repayType === 'equal-principal' && amortizeMonths > 0 ? loanAmount / amortizeMonths : 0;

      for (let m = 1; m <= totalMonths; m++) {
        const start = remBalance;
        const interest = start * monthlyRate;
        let pmt = 0;
        let principal = 0;
        let tag = '';

        if (m <= validGrace) {
          pmt = interestOnly;
          principal = 0;
          tag = '寬限期';
        } else {
          if (repayType === 'equal-total') {
            pmt = amortPmt;
            principal = pmt - interest;
          } else {
            principal = principalPerMonth;
            pmt = principal + interest;
          }
          remBalance -= principal;
          tag = '攤還期';
        }
        if (m === totalMonths) remBalance = 0;

        interestSum += interest;
        paymentArray.push(pmt);
        rows.push({
          period: m,
          startBalance: start,
          principalPaid: principal,
          interestPaid: interest,
          totalPayment: pmt,
          endBalance: Math.max(0, remBalance),
          statusTag: tag,
        });
      }
    } else if (loanScheme === 'stepped') {
      const validStepMonths = Math.min(stepPeriods, totalMonths - 1);
      const remMonths = totalMonths - validStepMonths;

      let stepPaidPrincipalSum = 0;
      for (let m = 1; m <= validStepMonths; m++) {
        const start = remBalance;
        const interest = start * monthlyRate;
        const pmt = stepPayment;
        const principal = pmt - interest; // 若低於利息會產生負攤還
        remBalance -= principal;
        stepPaidPrincipalSum += principal;
        interestSum += interest;
        paymentArray.push(pmt);
        rows.push({
          period: m,
          startBalance: start,
          principalPaid: principal,
          interestPaid: interest,
          totalPayment: pmt,
          endBalance: Math.max(0, remBalance),
          statusTag: '低月付期',
        });
      }

      firstPay = validStepMonths > 0 ? stepPayment : 0;
      const startRemBalance = remBalance;

      let postPmt = 0;
      if (remMonths > 0) {
        if (repayType === 'equal-total') {
          if (monthlyRate === 0) {
            postPmt = startRemBalance / remMonths;
          } else {
            postPmt = (startRemBalance * (monthlyRate * Math.pow(1 + monthlyRate, remMonths))) / (Math.pow(1 + monthlyRate, remMonths) - 1);
          }
        }
      }
      afterPay = postPmt;

      const postPrincipalPerMonth = repayType === 'equal-principal' && remMonths > 0 ? startRemBalance / remMonths : 0;

      for (let m = validStepMonths + 1; m <= totalMonths; m++) {
        const start = remBalance;
        const interest = start * monthlyRate;
        let pmt = 0;
        let principal = 0;

        if (repayType === 'equal-total') {
          pmt = postPmt;
          principal = pmt - interest;
        } else {
          principal = postPrincipalPerMonth;
          pmt = principal + interest;
        }
        remBalance -= principal;
        if (m === totalMonths) remBalance = 0;

        interestSum += interest;
        paymentArray.push(pmt);
        rows.push({
          period: m,
          startBalance: start,
          principalPaid: principal,
          interestPaid: interest,
          totalPayment: pmt,
          endBalance: Math.max(0, remBalance),
          statusTag: '正常攤還',
        });
      }
    } else if (loanScheme === 'balloon') {
      const validBalloon = Math.min(balloonAmount, loanAmount);
      const amortizePrincipal = loanAmount - validBalloon;

      let pmt = 0;
      if (repayType === 'equal-total') {
        if (monthlyRate === 0) {
          pmt = amortizePrincipal / totalMonths;
        } else {
          pmt = (amortizePrincipal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        }
      }
      firstPay = pmt;

      const principalPerMonth = amortizePrincipal / totalMonths;

      for (let m = 1; m <= totalMonths; m++) {
        const start = remBalance;
        const interest = start * monthlyRate;
        let currentPmt = 0;
        let principal = 0;
        let tag = '';

        if (repayType === 'equal-total') {
          principal = pmt - (amortizePrincipal * monthlyRate); // 簡單月付攤還
          currentPmt = pmt + (validBalloon * monthlyRate); // 尾款利息
        } else {
          principal = principalPerMonth;
          currentPmt = principal + interest;
        }

        if (m === totalMonths) {
          currentPmt += validBalloon;
          principal += validBalloon;
          remBalance = 0;
          tag = '含尾款付清';
        } else {
          remBalance -= principal;
        }

        interestSum += interest;
        paymentArray.push(currentPmt);
        rows.push({
          period: m,
          startBalance: start,
          principalPaid: principal,
          interestPaid: interest,
          totalPayment: currentPmt,
          endBalance: Math.max(0, remBalance),
          statusTag: tag,
        });
      }
    }

    setMonthlyPayment(firstPay);
    setAfterSpecialPayment(afterPay);
    setTotalInterest(interestSum);
    setTotalPayment(loanAmount + interestSum + fee);
    setApr(calculateAPR(loanAmount, fee, paymentArray));
    setSchedule(rows);
  }, [carPrice, loanAmount, interestRate, periodVal, periodUnit, repayType, loanScheme, fee, gracePeriod, stepPayment, stepPeriods, balloonAmount]);

  useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  // 繪製 Canvas 趨勢圖表
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || schedule.length <= 1) return;
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

    const maxBal = schedule[0]?.endBalance || 1;
    const points = schedule.map((row, idx) => ({
      x: (idx / (schedule.length - 1)) * (width - 60) + 40,
      y: height - 30 - (row.endBalance / maxBal) * (height - 60),
    }));

    // 漸層背景
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    grad.addColorStop(0, 'rgba(255, 0, 85, 0.35)');
    grad.addColorStop(1, 'rgba(255, 0, 85, 0.0)');

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

    // 趨勢主線
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#ff0055';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 網格座標
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('0期', 35, height - 12);
    ctx.fillText(`${schedule.length - 1}期`, width - 45, height - 12);
    ctx.fillText(`$${formatNumber(maxBal)}`, 5, 20);
  }, [schedule]);

  const copyShareLink = () => {
    const params = new URLSearchParams({
      price: carPrice.toString(),
      rate: interestRate.toString(),
      period: periodVal.toString(),
      unit: periodUnit,
      scheme: loanScheme,
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => showToast('已複製試算分享連結'));
  };

  return (
    <>
      <ToolLayout
        title="汽車貸款試算器"
        subtitle="CAR LOAN CALCULATOR"
        description="專業免費的線上汽車貸款計算機！支援車價與自備款成數連動、新車/中古車貸款、寬限期、階梯式低月付、氣球貸尾款與 APR 實質年利率評估。"
        accentColor="#ff0055"
        accentGlow="rgba(255,0,85,0.6)"
      >
        <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
          {/* 左欄：表單設定區 */}
          <div className="bg-black/20 border border-white/[.08] rounded-2xl p-8 flex flex-col gap-6 shadow-lg">
            {/* 還款方案切換 */}
            <div className="flex flex-col gap-2">
              <label htmlFor="loan-scheme-select" className="text-sm font-medium text-text-sub uppercase tracking-[1px]">還款方案模式</label>
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-xl border border-white/[.08]">
                {([
                  { id: 'standard', label: '一般攤還' },
                  { id: 'grace',    label: '寬限期方案' },
                  { id: 'stepped',  label: '階梯低月付' },
                  { id: 'balloon',  label: '氣球貸尾款' },
                ] as const).map(s => (
                  <button
                    key={s.id}
                    onClick={() => setLoanScheme(s.id)}
                    className={`py-2.5 px-3 text-sm font-medium rounded-lg transition-all cursor-pointer border ${
                      loanScheme === s.id
                        ? 'bg-[rgba(255,0,85,0.15)] border-[rgba(255,0,85,0.4)] text-[#ff0055] shadow-[0_0_10px_rgba(255,0,85,0.2)]'
                        : 'bg-transparent border-transparent text-text-sub hover:text-white'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 車價與自備款 */}
            <div className="flex flex-col gap-5 border-t border-white/[.05] pt-5">
              <div className="flex flex-col gap-2">
                <label htmlFor={carPriceInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">新車/中古車 車價 (元)</label>
                <div className="relative flex items-center">
                  <input
                    id={carPriceInputId}
                    type="number"
                    value={carPrice}
                    onChange={e => handleCarPriceChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 pr-12 rounded-xl text-base outline-none focus:border-[#ff0055] focus:shadow-[0_0_15px_rgba(255,0,85,0.2)] transition-all font-mono"
                  />
                  <span className="absolute right-4 text-xs text-[#94a3b8]">元</span>
                </div>
              </div>

              {/* 自備款 (成數 + 金額) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor={downPaymentPercentInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">頭期自備 (%)</label>
                  <div className="relative flex items-center">
                    <input
                      id={downPaymentPercentInputId}
                      type="number"
                      value={downPaymentPercent}
                      onChange={e => handleDownPercentChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 pr-10 rounded-xl text-base outline-none focus:border-[#ff0055] transition-all font-mono"
                    />
                    <span className="absolute right-4 text-xs text-[#94a3b8]">%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor={downPaymentAmountInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">自備金額 (元)</label>
                  <div className="relative flex items-center">
                    <input
                      id={downPaymentAmountInputId}
                      type="number"
                      value={downPaymentAmount}
                      onChange={e => handleDownAmountChange(parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 pr-10 rounded-xl text-base outline-none focus:border-[#ff0055] transition-all font-mono"
                    />
                    <span className="absolute right-4 text-xs text-[#94a3b8]">元</span>
                  </div>
                </div>
              </div>

              {/* 實際貸款金額 */}
              <div className="flex flex-col gap-2">
                <label htmlFor={loanAmountInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">申貸總額 (元)</label>
                <div className="relative flex items-center">
                  <input
                    id={loanAmountInputId}
                    type="number"
                    value={loanAmount}
                    onChange={e => handleLoanAmountChange(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-[#ff0055]/40 text-[#ff0055] font-bold px-4 py-3 pr-12 rounded-xl text-lg outline-none focus:border-[#ff0055] transition-all font-mono"
                  />
                  <span className="absolute right-4 text-xs text-[#ff0055]">元</span>
                </div>
              </div>
            </div>

            {/* 利率與年期 */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/[.05] pt-5">
              <div className="flex flex-col gap-2">
                <label htmlFor={interestRateInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">年利率 (%)</label>
                <div className="relative flex items-center">
                  <input
                    id={interestRateInputId}
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={e => setInterestRate(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 pr-10 rounded-xl text-base outline-none focus:border-[#ff0055] transition-all font-mono"
                  />
                  <span className="absolute right-4 text-xs text-[#94a3b8]">%</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={periodValInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">貸款期限</label>
                <div className="relative flex items-center">
                  <input
                    id={periodValInputId}
                    type="number"
                    value={periodVal}
                    onChange={e => setPeriodVal(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 pr-16 rounded-xl text-base outline-none focus:border-[#ff0055] transition-all font-mono"
                  />
                  <div className="absolute right-1 top-1 bottom-1 flex bg-white/[.05] rounded-lg overflow-hidden border border-white/[.05]">
                    <button
                      onClick={() => setPeriodUnit('year')}
                      className={`px-2 text-xs border-none cursor-pointer transition-colors ${periodUnit === 'year' ? 'bg-[#ff0055]/20 text-[#ff0055]' : 'text-[#94a3b8]'}`}
                    >
                      年
                    </button>
                    <button
                      onClick={() => setPeriodUnit('month')}
                      className={`px-2 text-xs border-none cursor-pointer transition-colors ${periodUnit === 'month' ? 'bg-[#ff0055]/20 text-[#ff0055]' : 'text-[#94a3b8]'}`}
                    >
                      月
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 本息/本金攤還模式與開辦費 */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/[.05] pt-5">
              <div className="flex flex-col gap-2">
                <label htmlFor="repay-type-select" className="text-sm font-medium text-text-sub uppercase tracking-[1px]">攤還方式</label>
                <div className="grid grid-cols-2 gap-1 bg-black/40 p-1 rounded-xl border border-white/[.08]">
                  <button
                    onClick={() => setRepayType('equal-total')}
                    className={`py-2 text-sm font-medium rounded-lg cursor-pointer border ${
                      repayType === 'equal-total' ? 'bg-[#ff0055]/15 border-[#ff0055]/40 text-[#ff0055]' : 'border-transparent text-text-sub hover:text-white'
                    }`}
                  >
                    本息均攤
                  </button>
                  <button
                    onClick={() => setRepayType('equal-principal')}
                    className={`py-2 text-sm font-medium rounded-lg cursor-pointer border ${
                      repayType === 'equal-principal' ? 'bg-[#ff0055]/15 border-[#ff0055]/40 text-[#ff0055]' : 'border-transparent text-text-sub hover:text-white'
                    }`}
                  >
                    本金均攤
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={feeInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">設定規費/手續費</label>
                <div className="relative flex items-center">
                  <input
                    id={feeInputId}
                    type="number"
                    value={fee}
                    onChange={e => setFee(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 pr-12 rounded-xl text-base outline-none focus:border-[#ff0055] transition-all font-mono"
                  />
                  <span className="absolute right-4 text-xs text-[#94a3b8]">元</span>
                </div>
              </div>
            </div>

            {/* 條件式方案延伸欄位 */}
            {loanScheme === 'grace' && (
              <div className="border-l-2 border-[#ff0055] pl-4 flex flex-col gap-2 py-1">
                <label htmlFor={gracePeriodInputId} className="text-sm font-medium text-[#ff0055] uppercase tracking-[1px]">寬限期月數 (前息後本)</label>
                <input
                  id={gracePeriodInputId}
                  type="number"
                  value={gracePeriod}
                  onChange={e => setGracePeriod(parseInt(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-2.5 rounded-xl text-base outline-none focus:border-[#ff0055]"
                />
              </div>
            )}

            {loanScheme === 'stepped' && (
              <div className="border-l-2 border-[#ff0055] pl-4 flex flex-col gap-3 py-1">
                <div className="flex flex-col gap-1">
                  <label htmlFor={stepPaymentInputId} className="text-sm font-medium text-[#ff0055] uppercase tracking-[1px]">前期超低月付金額 (元)</label>
                  <input
                    id={stepPaymentInputId}
                    type="number"
                    value={stepPayment}
                    onChange={e => setStepPayment(parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-2.5 rounded-xl text-base outline-none focus:border-[#ff0055]"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={stepPeriodsInputId} className="text-sm font-medium text-[#ff0055] uppercase tracking-[1px]">低月付期數 (月)</label>
                  <input
                    id={stepPeriodsInputId}
                    type="number"
                    value={stepPeriods}
                    onChange={e => setStepPeriods(parseInt(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-2.5 rounded-xl text-base outline-none focus:border-[#ff0055]"
                  />
                </div>
              </div>
            )}

            {loanScheme === 'balloon' && (
              <div className="border-l-2 border-[#ff0055] pl-4 flex flex-col gap-2 py-1">
                <label htmlFor={balloonAmountInputId} className="text-sm font-medium text-[#ff0055] uppercase tracking-[1px]">
                  氣球貸尾款保留金額 (元) <span className="text-[0.75rem] text-[#94a3b8]">({((balloonAmount / (loanAmount || 1)) * 100).toFixed(1)}%)</span>
                </label>
                <input
                  id={balloonAmountInputId}
                  type="number"
                  value={balloonAmount}
                  onChange={e => setBalloonAmount(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-2.5 rounded-xl text-base outline-none focus:border-[#ff0055]"
                />
              </div>
            )}

            <button
              onClick={copyShareLink}
              className="mt-2 w-full h-[44px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
                bg-[#ff0055]/15 border border-[#ff0055]/40 text-[#ff0055] rounded-xl
                transition-all duration-300 hover:bg-[#ff0055] hover:text-[#030305] hover:shadow-[0_0_15px_rgba(255,0,85,0.4)]
                cursor-pointer"
            >
              複製試算分享連結
            </button>
          </div>

          {/* 右欄：試算結果面板 */}
          <div className="flex flex-col gap-6">
            {/* 四大指標看板 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-black/30 border border-white/[.08] rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">首期月付額</span>
                <span className="font-mono text-2xl font-bold text-[#ff0055] drop-shadow-[0_0_10px_rgba(255,0,85,0.3)]">
                  ${formatNumber(monthlyPayment)}
                </span>
                {loanScheme === 'grace' && (
                  <span className="text-xs text-text-sub mt-1">期滿後約 ${formatNumber(afterSpecialPayment)}</span>
                )}
              </div>

              <div className="bg-black/30 border border-white/[.08] rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">實質年利率 (APR)</span>
                <span className="font-mono text-2xl font-bold text-[#ff0055] drop-shadow-[0_0_10px_rgba(255,0,85,0.3)]">
                  {apr.toFixed(2)} %
                </span>
                <span className="text-xs text-text-sub mt-1">含手續費攤提真實年利率</span>
              </div>

              <div className="bg-black/30 border border-white/[.08] rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">總利息支出</span>
                <span className="font-mono text-xl font-bold text-text-main">
                  ${formatNumber(totalInterest)}
                </span>
                <span className="text-xs text-text-sub mt-1">車貸期間利息總和</span>
              </div>

              <div className="bg-black/30 border border-white/[.08] rounded-2xl p-5 flex flex-col items-center justify-center text-center">
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">總還款金額</span>
                <span className="font-mono text-xl font-bold text-text-main">
                  ${formatNumber(totalPayment)}
                </span>
                <span className="text-xs text-text-sub mt-1">含本金、利息與規費</span>
              </div>
            </div>

            {/* 本金剩餘趨勢圖表 (Canvas) */}
            <div className="bg-black/30 border border-white/[.08] rounded-2xl p-5 flex flex-col gap-3">
              <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px]">車貸本金剩餘趨勢</span>
              <div className="relative w-full h-[220px]">
                <canvas ref={canvasRef} className="w-full h-full block" />
              </div>
            </div>

            {/* 攤還明細表格 (Sticky Column) */}
            <div className={styles.tableContainer}>
              <h3 className="text-sm font-semibold text-text-main uppercase tracking-[1px] mb-4">車貸還款明細表</h3>
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-white/[.08] text-text-sub text-sm font-semibold">
                    <th className={`text-left p-2.5 ${styles.stickyPeriod}`}>期數</th>
                    <th className="p-2.5">期初餘額</th>
                    <th className="p-2.5">當期本金</th>
                    <th className="p-2.5">當期利息</th>
                    <th className="p-2.5">當期本息</th>
                    <th className="p-2.5">期末餘額</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.slice(0, 120).map(row => (
                    <tr key={row.period} className="border-b border-white/[.03] hover:bg-white/[.02] text-text-main transition-colors">
                      <td className={`text-left p-2.5 font-mono text-text-main ${styles.stickyPeriod}`}>
                        {row.period === 0 ? '初始' : `第 ${row.period} 期`}
                        {row.statusTag && (
                          <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded bg-[#ff0055]/20 text-[#ff0055] font-sans font-medium">
                            {row.statusTag}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-mono">${formatNumber(row.startBalance)}</td>
                      <td className="p-2.5 font-mono">${formatNumber(row.principalPaid)}</td>
                      <td className="p-2.5 font-mono">${formatNumber(row.interestPaid)}</td>
                      <td className="p-2.5 font-mono text-[#ff0055] font-semibold">${formatNumber(row.totalPayment)}</td>
                      <td className="p-2.5 font-mono">${formatNumber(row.endBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {schedule.length > 120 && (
                <div className="text-center text-xs text-text-sub mt-3">僅展示前 120 期資料</div>
              )}
            </div>
          </div>
        </div>
      </ToolLayout>

      <div className={`fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 text-sm rounded-lg z-[100] pointer-events-none
        bg-[rgba(255,0,85,0.15)] border border-[rgba(255,0,85,0.3)] backdrop-blur-[10px] text-[#ff0055]
        transition-all duration-400 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[100px]'}`}>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}

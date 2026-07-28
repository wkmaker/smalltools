'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import styles from './mortgage-loan.module.css';

interface Stage {
  durationValue: number | '' | null;
  durationUnit: 'year' | 'month' | null;
  rate: number | '';
}

interface SingleLoanDetailRow {
  period: number;
  startBalance: number;
  principalPaid: number;
  interestPaid: number;
  totalPayment: number;
  endBalance: number;
}

interface CombinedDetailRow extends SingleLoanDetailRow {
  detail1?: SingleLoanDetailRow;
  detail2?: SingleLoanDetailRow;
}

function calculateAPR(loanAmount: number, fee: number, payments: number[]): number {
  const netAmount = loanAmount - fee;
  if (netAmount <= 0 || payments.length === 0) return 0;

  let low = 0;
  let high = 2; // 月折現率上限設為 200%
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

function calculateSingleLoanDetail(
  loanAmount: number,
  periodVal: number,
  periodUnit: 'year' | 'month',
  graceVal: number,
  graceUnit: 'year' | 'month',
  rateType: 'single' | 'multi',
  singleRate: number,
  stageList: Stage[],
  repayType: 'equal-total' | 'equal-principal'
) {
  const totalMonths = Math.max(0, periodUnit === 'year' ? Math.round(periodVal * 12) : Math.round(periodVal));
  let graceMonths = Math.max(0, graceUnit === 'year' ? Math.round(graceVal * 12) : Math.round(graceVal));
  if (graceMonths > totalMonths) graceMonths = totalMonths;

  const stageRates: number[] = [];
  if (rateType === 'single') {
    for (let k = 0; k < totalMonths; k++) stageRates.push(singleRate);
  } else {
    let consumed = 0;
    for (let si = 0; si < stageList.length - 1; si++) {
      const s = stageList[si];
      const durationVal = s.durationValue === '' || s.durationValue === null ? 0 : s.durationValue;
      const sMonths = s.durationUnit === 'year' ? Math.round(durationVal * 12) : Math.round(durationVal);
      const sRate = s.rate === '' ? 0 : s.rate;
      for (let k = 0; k < sMonths; k++) {
        stageRates.push(sRate);
      }
      consumed += sMonths;
    }
    const lastStage = stageList[stageList.length - 1];
    const lastRate = lastStage && lastStage.rate !== '' ? lastStage.rate : 0;
    for (let k = consumed; k < totalMonths; k++) {
      stageRates.push(lastRate);
    }
  }

  const resultData: SingleLoanDetailRow[] = [];
  const paymentArray: number[] = [];
  let totalInterest = 0;

  resultData.push({
    period: 0,
    startBalance: 0,
    principalPaid: 0,
    interestPaid: 0,
    totalPayment: 0,
    endBalance: loanAmount,
  });

  if (totalMonths > 0 && loanAmount > 0) {
    let remainingBalance = loanAmount;
    const graceBal = loanAmount;
    const repayMonths = totalMonths - graceMonths;
    const principalPerMonth = repayMonths > 0 ? graceBal / repayMonths : 0;

    for (let m = 1; m <= totalMonths; m++) {
      const startBal = remainingBalance;
      const currentAnnualRate = stageRates[m - 1] !== undefined ? stageRates[m - 1] : 0;
      const r_m = currentAnnualRate / 100 / 12;

      let principalPaid = 0;
      let interestPaid = 0;
      let totalPayment = 0;

      if (m <= graceMonths) {
        interestPaid = startBal * r_m;
        principalPaid = 0;
        totalPayment = interestPaid;
        remainingBalance = startBal;
      } else {
        const activeRepayMonthsLeft = totalMonths - m + 1;
        if (repayType === 'equal-total') {
          if (r_m === 0) {
            totalPayment = startBal / activeRepayMonthsLeft;
          } else {
            totalPayment =
              (startBal * (r_m * Math.pow(1 + r_m, activeRepayMonthsLeft))) /
              (Math.pow(1 + r_m, activeRepayMonthsLeft) - 1);
          }
          interestPaid = startBal * r_m;
          principalPaid = totalPayment - interestPaid;
          remainingBalance = startBal - principalPaid;
        } else {
          principalPaid = principalPerMonth;
          interestPaid = startBal * r_m;
          totalPayment = principalPaid + interestPaid;
          remainingBalance = startBal - principalPaid;
        }
      }

      if (m === totalMonths) {
        remainingBalance = 0;
        principalPaid = startBal;
        totalPayment = principalPaid + interestPaid;
      }

      totalInterest += interestPaid;
      paymentArray.push(totalPayment);

      resultData.push({
        period: m,
        startBalance: startBal,
        principalPaid,
        interestPaid,
        totalPayment,
        endBalance: Math.max(0, remainingBalance),
      });
    }
  }

  return {
    totalMonths,
    graceMonths,
    totalInterest,
    paymentArray,
    resultData,
  };
}

export default function MortgageLoanClient() {
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
  const [singleRateType, setSingleRateType] = useState<'single' | 'multi'>('single');
  const [singleRate, setSingleRate] = useState<number | ''>(2.185);
  const [singleStages, setSingleStages] = useState<Stage[]>([
    { durationValue: 2, durationUnit: 'year', rate: 2.0 },
    { durationValue: 1, durationUnit: 'year', rate: 2.1 },
    { durationValue: null, durationUnit: null, rate: 2.25 },
  ]);
  const [singleRepayType, setSingleRepayType] = useState<'equal-total' | 'equal-principal'>('equal-total');
  const [singleFee, setSingleFee] = useState<number | ''>(5000);

  // 組合貸款設定 (貸款 A + 貸款 B)
  const [loanName1, setLoanName1] = useState<string>('新青安房貸');
  const [loanAmount1, setLoanAmount1] = useState<number | ''>(1000); // 萬元
  const [periodVal1, setPeriodVal1] = useState<number | ''>(40);
  const [periodUnit1, setPeriodUnit1] = useState<'year' | 'month'>('year');
  const [graceVal1, setGraceVal1] = useState<number | ''>(5);
  const [graceUnit1, setGraceUnit1] = useState<'year' | 'month'>('year');
  const [repayType1, setRepayType1] = useState<'equal-total' | 'equal-principal'>('equal-total');
  const [rateType1, setRateType1] = useState<'single' | 'multi'>('single');
  const [singleRate1, setSingleRate1] = useState<number | ''>(1.775);
  const [stages1, setStages1] = useState<Stage[]>([
    { durationValue: 3, durationUnit: 'year', rate: 1.775 },
    { durationValue: null, durationUnit: null, rate: 2.275 },
  ]);
  const [fee1, setFee1] = useState<number | ''>(3000);

  const [loanName2, setLoanName2] = useState<string>('一般房貸');
  const [loanAmount2, setLoanAmount2] = useState<number | ''>(200); // 萬元
  const [periodVal2, setPeriodVal2] = useState<number | ''>(30);
  const [periodUnit2, setPeriodUnit2] = useState<'year' | 'month'>('year');
  const [graceVal2, setGraceVal2] = useState<number | ''>(3);
  const [graceUnit2, setGraceUnit2] = useState<'year' | 'month'>('year');
  const [repayType2, setRepayType2] = useState<'equal-total' | 'equal-principal'>('equal-total');
  const [rateType2, setRateType2] = useState<'single' | 'multi'>('single');
  const [singleRate2, setSingleRate2] = useState<number | ''>(2.185);
  const [stages2, setStages2] = useState<Stage[]>([
    { durationValue: 3, durationUnit: 'year', rate: 2.185 },
    { durationValue: null, durationUnit: null, rate: 2.275 },
  ]);
  const [fee2, setFee2] = useState<number | ''>(3000);

  // 試算結果狀態
  const [totalLoan, setTotalLoan] = useState<number>(1200); // 萬元
  const [firstPayment, setFirstPayment] = useState<number>(0);
  const [aprRate, setAprRate] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalRepay, setTotalRepay] = useState<number>(0);
  const [schedule, setSchedule] = useState<CombinedDetailRow[]>([]);
  const [showAllRows, setShowAllRows] = useState<boolean>(false);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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

  // 設定全頁背景粒子色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);

  // 雙向連動：房屋總價 / 自備款成數 / 自備款金額
  const handlePriceChange = (valStr: string) => {
    if (valStr === '') {
      setHousePrice('');
      setDownPaymentAmount('');
      setTotalLoan(0);
      return;
    }
    const hp = parseFloat(valStr) || 0;
    setHousePrice(hp);
    const pct = downPaymentPercent === '' ? 0 : downPaymentPercent;
    const dp = Math.round((hp * pct) / 100);
    setDownPaymentAmount(dp);
    const loan = Math.max(0, hp - dp);
    setTotalLoan(loan);

    // 同步分拆組合貸款金額
    if (loanMode === 'combined') {
      const loanA = Math.min(loan, 1000);
      setLoanAmount1(loanA);
      setLoanAmount2(Math.max(0, loan - loanA));
    }
  };

  const handlePercentChange = (valStr: string) => {
    if (valStr === '') {
      setDownPaymentPercent('');
      return;
    }
    const pct = parseFloat(valStr) || 0;
    setDownPaymentPercent(pct);
    const hp = housePrice === '' ? 0 : housePrice;
    const dp = Math.round((hp * pct) / 100);
    setDownPaymentAmount(dp);
    const loan = Math.max(0, hp - dp);
    setTotalLoan(loan);

    if (loanMode === 'combined') {
      const loanA = Math.min(loan, 1000);
      setLoanAmount1(loanA);
      setLoanAmount2(Math.max(0, loan - loanA));
    }
  };

  const handleDownAmountChange = (valStr: string) => {
    if (valStr === '') {
      setDownPaymentAmount('');
      return;
    }
    const dp = parseFloat(valStr) || 0;
    setDownPaymentAmount(dp);
    const hp = housePrice === '' ? 0 : housePrice;
    const pct = hp > 0 ? parseFloat(((dp / hp) * 100).toFixed(2)) : 0;
    setDownPaymentPercent(pct);
    const loan = Math.max(0, hp - dp);
    setTotalLoan(loan);

    if (loanMode === 'combined') {
      const loanA = Math.min(loan, 1000);
      setLoanAmount1(loanA);
      setLoanAmount2(Math.max(0, loan - loanA));
    }
  };

  // 分配貸款 A 的快速按鈕
  const setLoanAQuickValue = (presetWan: number | null) => {
    const currentLoanWan = totalLoan;
    const targetA = presetWan !== null ? Math.min(presetWan, currentLoanWan) : currentLoanWan;
    const targetB = Math.max(0, currentLoanWan - targetA);
    setLoanAmount1(targetA);
    setLoanAmount2(targetB);
  };

  // 動態多段利率新增/移除邏輯
  const addStageSingle = () => {
    if (singleStages.length >= 6) return;
    const lastStage = singleStages[singleStages.length - 1];
    const newStage: Stage = { durationValue: 1, durationUnit: 'year', rate: lastStage.rate };
    const nextStages = [...singleStages];
    nextStages.splice(nextStages.length - 1, 0, newStage);
    setSingleStages(nextStages);
  };

  const removeStageSingle = (idx: number) => {
    if (singleStages.length <= 2) return;
    const nextStages = singleStages.filter((_, i) => i !== idx);
    setSingleStages(nextStages);
  };

  const addStageCombo = (loanIndex: 1 | 2) => {
    const stageList = loanIndex === 1 ? stages1 : stages2;
    if (stageList.length >= 6) return;
    const lastStage = stageList[stageList.length - 1];
    const newStage: Stage = { durationValue: 1, durationUnit: 'year', rate: lastStage.rate };
    const nextStages = [...stageList];
    nextStages.splice(nextStages.length - 1, 0, newStage);
    if (loanIndex === 1) setStages1(nextStages);
    else setStages2(nextStages);
  };

  const removeStageCombo = (loanIndex: 1 | 2, idx: number) => {
    const stageList = loanIndex === 1 ? stages1 : stages2;
    if (stageList.length <= 2) return;
    const nextStages = stageList.filter((_, i) => i !== idx);
    if (loanIndex === 1) setStages1(nextStages);
    else setStages2(nextStages);
  };

  // 房貸計算核心
  const calculateLoan = useCallback(() => {
    const numTotalLoanWan = totalLoan;
    const numTotalLoanYuan = numTotalLoanWan * 10000;

    if (loanMode === 'single') {
      const pVal = singlePeriodVal === '' ? 0 : singlePeriodVal;
      const gVal = singleGraceVal === '' ? 0 : singleGraceVal;
      const sRate = singleRate === '' ? 0 : singleRate;
      const numFee = singleFee === '' ? 0 : singleFee;

      const detail = calculateSingleLoanDetail(
        numTotalLoanYuan,
        pVal,
        singlePeriodUnit,
        gVal,
        singleGraceUnit,
        singleRateType,
        sRate,
        singleStages,
        singleRepayType
      );

      const firstPmt = detail.paymentArray[0] || 0;
      const apr = numTotalLoanYuan > 0 ? calculateAPR(numTotalLoanYuan, numFee, detail.paymentArray) : 0;

      setFirstPayment(firstPmt);
      setAprRate(parseFloat(apr.toFixed(2)));
      setTotalInterest(detail.totalInterest);
      setTotalRepay(numTotalLoanYuan + detail.totalInterest);
      setSchedule(detail.resultData);
    } else {
      const numAmt1 = (loanAmount1 === '' ? 0 : loanAmount1) * 10000;
      const pVal1 = periodVal1 === '' ? 0 : periodVal1;
      const gVal1 = graceVal1 === '' ? 0 : graceVal1;
      const sRate1 = singleRate1 === '' ? 0 : singleRate1;
      const numFee1 = fee1 === '' ? 0 : fee1;

      const numAmt2 = (loanAmount2 === '' ? 0 : loanAmount2) * 10000;
      const pVal2 = periodVal2 === '' ? 0 : periodVal2;
      const gVal2 = graceVal2 === '' ? 0 : graceVal2;
      const sRate2 = singleRate2 === '' ? 0 : singleRate2;
      const numFee2 = fee2 === '' ? 0 : fee2;

      const detail1 = calculateSingleLoanDetail(
        numAmt1,
        pVal1,
        periodUnit1,
        gVal1,
        graceUnit1,
        rateType1,
        sRate1,
        stages1,
        repayType1
      );

      const detail2 = calculateSingleLoanDetail(
        numAmt2,
        pVal2,
        periodUnit2,
        gVal2,
        graceUnit2,
        rateType2,
        sRate2,
        stages2,
        repayType2
      );

      const maxMonths = Math.max(detail1.totalMonths, detail2.totalMonths);
      const combinedResultData: CombinedDetailRow[] = [];
      const combinedPaymentArray: number[] = [];
      let combinedTotalInterest = 0;

      combinedResultData.push({
        period: 0,
        startBalance: 0,
        principalPaid: 0,
        interestPaid: 0,
        totalPayment: 0,
        endBalance: numAmt1 + numAmt2,
        detail1: detail1.resultData[0],
        detail2: detail2.resultData[0],
      });

      for (let m = 1; m <= maxMonths; m++) {
        const item1 = detail1.resultData[m] || {
          period: m,
          startBalance: 0,
          principalPaid: 0,
          interestPaid: 0,
          totalPayment: 0,
          endBalance: 0,
        };
        const item2 = detail2.resultData[m] || {
          period: m,
          startBalance: 0,
          principalPaid: 0,
          interestPaid: 0,
          totalPayment: 0,
          endBalance: 0,
        };

        const totalPmt = item1.totalPayment + item2.totalPayment;
        const interestP = item1.interestPaid + item2.interestPaid;

        combinedTotalInterest += interestP;
        combinedPaymentArray.push(totalPmt);

        combinedResultData.push({
          period: m,
          startBalance: item1.startBalance + item2.startBalance,
          principalPaid: item1.principalPaid + item2.principalPaid,
          interestPaid: interestP,
          totalPayment: totalPmt,
          endBalance: item1.endBalance + item2.endBalance,
          detail1: item1,
          detail2: item2,
        });
      }

      const firstPmt = combinedPaymentArray[0] || 0;
      const combinedLoanYuan = numAmt1 + numAmt2;
      const combinedFee = numFee1 + numFee2;
      const apr = combinedLoanYuan > 0 ? calculateAPR(combinedLoanYuan, combinedFee, combinedPaymentArray) : 0;

      setFirstPayment(firstPmt);
      setAprRate(parseFloat(apr.toFixed(2)));
      setTotalInterest(combinedTotalInterest);
      setTotalRepay(combinedLoanYuan + combinedTotalInterest);
      setSchedule(combinedResultData);
    }
  }, [
    totalLoan,
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

  // 繪製 HTML5 Canvas 房貸餘額遞減趨勢圖
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

    const maxVal = schedule[0]?.endBalance || 1;
    const points = schedule.map((row, idx) => ({
      x: (idx / (schedule.length - 1)) * (width - 60) + 40,
      y: height - 30 - (row.endBalance / maxVal) * (height - 60),
    }));

    // 薄荷綠背景漸層
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

    // 賸餘本金折線
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#00f5a0';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // X/Y 軸刻度
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('初始', 35, height - 12);
    ctx.fillText(`第 ${schedule.length - 1} 期`, width - 50, height - 12);
    ctx.fillText(`$${Math.round(maxVal).toLocaleString('zh-TW')}元`, 5, 20);
  }, [schedule]);

  // 複製試算分享連結
  const copyShareLink = () => {
    const params = new URLSearchParams({
      p: housePrice.toString(),
      dp: downPaymentPercent.toString(),
      m: loanMode,
      sp: singlePeriodVal.toString(),
      sr: singleRate.toString(),
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => showToast('已複製房貸試算分享連結'));
  };

  const visibleSchedule = showAllRows ? schedule : schedule.slice(0, 121);

  return (
    <>
      <ToolLayout
        title="房屋貸款試算器"
        subtitle="MORTGAGE LOAN CALCULATOR"
        description="專業免費的線上房貸計算機！支援自備款與貸款成數雙向連動、單一與雙貸款組合模式 (如新青安+一般房貸)、多段式階梯利率、開辦費與 APR 實質年率試算。"
        accentColor="#00f5a0"
        accentGlow="rgba(0, 245, 160, 0.6)"
      >
        <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
          {/* 左欄：表單設定區 */}
          <div className="bg-black/20 border border-white/[.08] rounded-2xl p-8 flex flex-col gap-6 shadow-lg">
            {/* 房屋總價 */}
            <div className="flex flex-col gap-2">
              <label htmlFor={priceInputId} className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">房屋總價 (萬元)</label>
              <input
                id={priceInputId}
                type="number"
                value={housePrice}
                onChange={e => handlePriceChange(e.target.value)}
                className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00f5a0] font-mono"
              />
            </div>

            {/* 自備款成數 & 金額 雙向連動 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={percentInputId} className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">自備款成數 (%)</label>
                <input
                  id={percentInputId}
                  type="number"
                  step="0.5"
                  value={downPaymentPercent}
                  onChange={e => handlePercentChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00f5a0] font-mono"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={downInputId} className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">自備款金額 (萬元)</label>
                <input
                  id={downInputId}
                  type="number"
                  value={downPaymentAmount}
                  onChange={e => handleDownAmountChange(e.target.value)}
                  className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00f5a0] font-mono"
                />
              </div>
            </div>

            {/* 貸款模式切換 */}
            <div className="flex flex-col gap-2 border-t border-white/[.05] pt-4">
              <div className="flex justify-between items-center">
                <label className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">貸款模式</label>
                <span className="text-sm text-[#00f5a0] font-semibold font-mono">
                  貸款總金額：{totalLoan.toLocaleString('zh-TW')} 萬元
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-xl border border-white/[.08]">
                <button
                  onClick={() => setLoanMode('single')}
                  className={`py-2 text-sm rounded-lg cursor-pointer transition-all border ${
                    loanMode === 'single'
                      ? 'bg-[#00f5a0]/15 border-[#00f5a0]/40 text-[#00f5a0] font-semibold'
                      : 'border-transparent text-slate-300'
                  }`}
                >
                  單一貸款
                </button>
                <button
                  onClick={() => {
                    setLoanMode('combined');
                    const loanA = Math.min(totalLoan, 1000);
                    setLoanAmount1(loanA);
                    setLoanAmount2(Math.max(0, totalLoan - loanA));
                  }}
                  className={`py-2 text-sm rounded-lg cursor-pointer transition-all border ${
                    loanMode === 'combined'
                      ? 'bg-[#00f5a0]/15 border-[#00f5a0]/40 text-[#00f5a0] font-semibold'
                      : 'border-transparent text-slate-300'
                  }`}
                >
                  組合貸款 (雙貸款 A+B)
                </button>
              </div>
            </div>

            {/* ====== 單一貸款模式設定 ====== */}
            {loanMode === 'single' && (
              <div className="flex flex-col gap-5 border-t border-white/[.05] pt-5">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor={singlePeriodInputId} className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">貸款期間 (年)</label>
                    <input
                      id={singlePeriodInputId}
                      type="number"
                      value={singlePeriodVal}
                      onChange={e => setSinglePeriodVal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00f5a0] font-mono"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor={singleGraceInputId} className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">寬限期 (年)</label>
                    <input
                      id={singleGraceInputId}
                      type="number"
                      value={singleGraceVal}
                      onChange={e => setSingleGraceVal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00f5a0] font-mono"
                    />
                  </div>
                </div>

                {/* 利率類型 */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">利率類型</label>
                  <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-xl border border-white/[.08]">
                    <button
                      onClick={() => setSingleRateType('single')}
                      className={`py-2 text-sm font-medium rounded-lg cursor-pointer border ${
                        singleRateType === 'single'
                          ? 'bg-[#00f5a0]/15 border-[#00f5a0]/40 text-[#00f5a0]'
                          : 'border-transparent text-text-sub hover:text-white'
                      }`}
                    >
                      單一利率
                    </button>
                    <button
                      onClick={() => setSingleRateType('multi')}
                      className={`py-2 text-sm font-medium rounded-lg cursor-pointer border ${
                        singleRateType === 'multi'
                          ? 'bg-[#00f5a0]/15 border-[#00f5a0]/40 text-[#00f5a0]'
                          : 'border-transparent text-text-sub hover:text-white'
                      }`}
                    >
                      多段式階梯利率
                    </button>
                  </div>
                </div>

                {singleRateType === 'single' ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor={singleRateInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">年利率 (%)</label>
                    <input
                      id={singleRateInputId}
                      type="number"
                      step="0.01"
                      value={singleRate}
                      onChange={e => setSingleRate(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00f5a0] font-mono"
                    />
                  </div>
                ) : (
                  <div className="flex flex-col gap-3 bg-black/30 p-4 rounded-xl border border-white/[.08]">
                    <span className="text-xs text-[#00f5a0] font-medium">多段式階梯利率設定</span>
                    {singleStages.map((stg, sIdx) => {
                      const isLast = sIdx === singleStages.length - 1;
                      return (
                        <div key={sIdx} className="flex flex-col gap-2 border-b border-white/[.04] pb-3">
                          <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                            <span>{isLast ? `第 ${sIdx + 1} 段 (剩餘期數)` : `第 ${sIdx + 1} 段`}</span>
                            {!isLast && singleStages.length > 2 && (
                              <button
                                onClick={() => removeStageSingle(sIdx)}
                                className="text-[0.75rem] text-[#ef4444] hover:underline cursor-pointer"
                              >
                                移除
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {!isLast ? (
                              <div className="flex items-center bg-black/40 border border-white/[.08] rounded-lg px-2">
                                <input
                                  type="number"
                                  placeholder="期間"
                                  value={stg.durationValue ?? ''}
                                  onChange={e => {
                                    const next = [...singleStages];
                                    next[sIdx].durationValue = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                    setSingleStages(next);
                                  }}
                                  className="w-full bg-transparent text-white text-xs py-2 outline-none font-mono"
                                />
                                <span className="text-sm text-text-sub ml-1">年</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-sm text-text-sub px-2">直至期滿</div>
                            )}
                            <div className="flex items-center bg-black/40 border border-white/[.08] rounded-lg px-2">
                              <input
                                type="number"
                                step="0.01"
                                placeholder="利率"
                                value={stg.rate}
                                onChange={e => {
                                  const next = [...singleStages];
                                  next[sIdx].rate = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                  setSingleStages(next);
                                }}
                                className="w-full bg-transparent text-white text-xs py-2 outline-none font-mono"
                              />
                              <span className="text-sm text-text-sub ml-1">%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {singleStages.length < 6 && (
                      <button
                        onClick={addStageSingle}
                        className="text-xs text-[#00f5a0] bg-[#00f5a0]/10 border border-[#00f5a0]/30 py-2 rounded-lg hover:bg-[#00f5a0]/20 transition-all cursor-pointer"
                      >
                        ＋ 新增利率段落
                      </button>
                    )}
                  </div>
                )}

                {/* 還款方式 */}
                <div className="flex flex-col gap-2">
                  <label className="text-sm text-text-sub font-medium uppercase tracking-[1px]">還款方式</label>
                  <div className="grid grid-cols-2 gap-2 bg-black/40 p-1.5 rounded-xl border border-white/[.08]">
                    <button
                      onClick={() => setSingleRepayType('equal-total')}
                      className={`py-2 text-sm font-medium rounded-lg cursor-pointer border ${
                        singleRepayType === 'equal-total'
                          ? 'bg-[#00f5a0]/15 border-[#00f5a0]/40 text-[#00f5a0]'
                          : 'border-transparent text-text-sub hover:text-white'
                      }`}
                    >
                      本息平均攤還
                    </button>
                    <button
                      onClick={() => setSingleRepayType('equal-principal')}
                      className={`py-2 text-sm font-medium rounded-lg cursor-pointer border ${
                        singleRepayType === 'equal-principal'
                          ? 'bg-[#00f5a0]/15 border-[#00f5a0]/40 text-[#00f5a0]'
                          : 'border-transparent text-text-sub hover:text-white'
                      }`}
                    >
                      本金平均攤還
                    </button>
                  </div>
                </div>

                {/* 開辦費 */}
                <div className="flex flex-col gap-2">
                  <label htmlFor={singleFeeInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">開辦手續費 (元)</label>
                  <input
                    id={singleFeeInputId}
                    type="number"
                    value={singleFee}
                    onChange={e => setSingleFee(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00f5a0] font-mono"
                  />
                </div>
              </div>
            )}

            {/* ====== 組合貸款模式設定 (貸款 A + 貸款 B) ====== */}
            {loanMode === 'combined' && (
              <div className="flex flex-col gap-6 border-t border-white/[.05] pt-5">
                {/* 貸款 A 卡片 */}
                <div className={styles.subCard}>
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={loanName1}
                      onChange={e => setLoanName1(e.target.value)}
                      className="bg-transparent border-b border-dashed border-[#00f5a0]/40 text-[#00f5a0] text-sm font-semibold outline-none px-1 py-0.5"
                    />
                    <span className="text-[0.7rem] bg-[#00f5a0]/15 border border-[#00f5a0]/30 text-[#00f5a0] px-2 py-0.5 rounded-md font-mono">
                      第一筆貸款
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-sub">貸款金額 (萬元)</label>
                    <input
                      type="number"
                      value={loanAmount1}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                        const amtA = typeof val === 'number' ? Math.min(val, totalLoan) : 0;
                        setLoanAmount1(val);
                        setLoanAmount2(Math.max(0, totalLoan - amtA));
                      }}
                      className="w-full bg-black/40 border border-white/[.08] text-white px-3 py-2 rounded-lg text-sm outline-none font-mono"
                    />
                    <div className="flex gap-2 mt-1">
                      <button
                        onClick={() => setLoanAQuickValue(1000)}
                        className="flex-1 py-1 text-[0.7rem] bg-[#00f5a0]/10 border border-[#00f5a0]/30 text-[#00f5a0] rounded-md cursor-pointer hover:bg-[#00f5a0]/20"
                      >
                        1,000 萬 (如新青安)
                      </button>
                      <button
                        onClick={() => setLoanAQuickValue(null)}
                        className="flex-1 py-1 text-[0.7rem] bg-white/[.05] border border-white/[.1] text-text-sub rounded-md cursor-pointer hover:bg-white/[.1]"
                      >
                        全部給 A
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-text-sub">期間 (年)</label>
                      <input
                        type="number"
                        value={periodVal1}
                        onChange={e => setPeriodVal1(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/[.08] text-white px-3 py-2 rounded-lg text-xs outline-none font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-text-sub">寬限期 (年)</label>
                      <input
                        type="number"
                        value={graceVal1}
                        onChange={e => setGraceVal1(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/[.08] text-white px-3 py-2 rounded-lg text-xs outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text-sub">年利率 (%)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={singleRate1}
                      onChange={e => setSingleRate1(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/[.08] text-white px-3 py-2 rounded-lg text-xs outline-none font-mono"
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
                      className="bg-transparent border-b border-dashed border-[#ffb800]/40 text-[#ffb800] text-sm font-semibold outline-none px-1 py-0.5"
                    />
                    <span className="text-[0.7rem] bg-[#ffb800]/15 border border-[#ffb800]/30 text-[#ffb800] px-2 py-0.5 rounded-md font-mono">
                      第二筆貸款
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-sm font-medium text-text-sub">貸款金額 (萬元)</label>
                    <input
                      type="number"
                      value={loanAmount2}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                        const amtB = typeof val === 'number' ? Math.min(val, totalLoan) : 0;
                        setLoanAmount2(val);
                        setLoanAmount1(Math.max(0, totalLoan - amtB));
                      }}
                      className="w-full bg-black/40 border border-white/[.08] text-white px-3 py-2 rounded-lg text-sm outline-none font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-text-sub">期間 (年)</label>
                      <input
                        type="number"
                        value={periodVal2}
                        onChange={e => setPeriodVal2(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/[.08] text-white px-3 py-2 rounded-lg text-xs outline-none font-mono"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-sm font-medium text-text-sub">寬限期 (年)</label>
                      <input
                        type="number"
                        value={graceVal2}
                        onChange={e => setGraceVal2(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className="w-full bg-black/40 border border-white/[.08] text-white px-3 py-2 rounded-lg text-xs outline-none font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-text-sub">年利率 (%)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={singleRate2}
                      onChange={e => setSingleRate2(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className="w-full bg-black/40 border border-white/[.08] text-white px-3 py-2 rounded-lg text-xs outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 複製分享按鈕 */}
            <button
              onClick={copyShareLink}
              className="mt-2 w-full h-[44px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
                bg-[#00f5a0]/15 border border-[#00f5a0]/40 text-[#00f5a0] rounded-xl
                transition-all duration-300 hover:bg-[#00f5a0] hover:text-[#030305] hover:shadow-[0_0_15px_rgba(0,245,160,0.4)]
                cursor-pointer"
            >
              複製試算分享連結
            </button>
          </div>

          {/* 右欄：看板、圖表與攤銷明細 */}
          <div className="flex flex-col gap-6">
            {/* 看板 */}
            <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">首期每月還款額</span>
                <span className="text-lg font-bold text-[#00f5a0] font-mono">
                  ${Math.round(firstPayment).toLocaleString('zh-TW')}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">APR 總費用年率</span>
                <span className="text-lg font-bold text-[#4ade80] font-mono">
                  {aprRate}%
                </span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">總利息支出</span>
                <span className="text-lg font-bold text-[#fbbf24] font-mono">
                  ${Math.round(totalInterest).toLocaleString('zh-TW')}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">總還款金額</span>
                <span className="text-lg font-bold text-white font-mono">
                  ${Math.round(totalRepay).toLocaleString('zh-TW')}
                </span>
              </div>
            </div>

            {/* Canvas 房貸餘額遞減趨勢圖 */}
            <div className="bg-black/30 border border-white/[.08] rounded-2xl p-5 flex flex-col gap-3 shadow-lg">
              <div className="flex justify-between items-center text-sm text-text-sub font-semibold uppercase tracking-[1px]">
                <span>房貸賸餘本金遞減趨勢圖</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#00f5a0]" />賸餘本金餘額</span>
                </div>
              </div>
              <div className="relative w-full h-[220px]">
                <canvas ref={canvasRef} className="w-full h-full block" />
              </div>
            </div>

            {/* 還款明細表 (支援展開全期與 Mobile Sticky Column) */}
            <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-4 shadow-lg">
              <div className="flex justify-between items-center">
                <h3 className="text-xs text-[#00f5a0] uppercase tracking-[1px] font-semibold">
                  房貸還款期數明細表 ({showAllRows ? `共 ${schedule.length - 1} 期` : '前 120 期預覽'})
                </h3>
                {schedule.length > 121 && (
                  <button
                    onClick={() => setShowAllRows(!showAllRows)}
                    className="text-xs bg-white/[.05] border border-white/[.1] text-[#00f5a0] px-3 py-1.5 rounded-lg hover:bg-[#00f5a0]/15 transition-all cursor-pointer"
                  >
                    {showAllRows ? '收合為前 120 期' : `展開全期明細 (${schedule.length - 1} 期)`}
                  </button>
                )}
              </div>

              <div className={styles.tableWrapper}>
                <table className="w-full text-right text-sm font-mono">
                  <thead>
                    <tr className="border-b border-white/[.1] text-text-sub text-sm font-semibold">
                      <th className={`text-left p-3 ${styles.stickyPeriod}`}>期數</th>
                      <th className="p-3">期初本金</th>
                      <th className="p-3">當期本金</th>
                      <th className="p-3">當期利息</th>
                      <th className="p-3">當期本息</th>
                      <th className="p-3">期末本金</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[.04]">
                    {visibleSchedule.map(row => (
                      <tr key={row.period} className="hover:bg-white/[.02] text-white/80 transition-colors">
                        <td className={`text-left p-3 font-mono text-white ${styles.stickyPeriod}`}>
                          {row.period === 0 ? '初始' : `第 ${row.period} 期`}
                        </td>
                        <td className="p-3 font-mono">{row.period === 0 ? '-' : `$${Math.round(row.startBalance).toLocaleString('zh-TW')}`}</td>
                        <td className="p-3 font-mono text-white">{row.period === 0 ? '-' : `$${Math.round(row.principalPaid).toLocaleString('zh-TW')}`}</td>
                        <td className="p-3 font-mono text-[#fbbf24]">{row.period === 0 ? '-' : `$${Math.round(row.interestPaid).toLocaleString('zh-TW')}`}</td>
                        <td className="p-3 font-mono text-[#00f5a0] font-semibold">{row.period === 0 ? '-' : `$${Math.round(row.totalPayment).toLocaleString('zh-TW')}`}</td>
                        <td className="p-3 font-mono text-slate-300">${Math.round(row.endBalance).toLocaleString('zh-TW')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </ToolLayout>

      {/* Toast 提示條 */}
      <div className={`fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 text-sm rounded-lg z-[100] pointer-events-none
        bg-[rgba(0,245,160,0.15)] border border-[rgba(0,245,160,0.3)] backdrop-blur-[10px] text-[#00f5a0]
        transition-all duration-400 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[100px]'}`}>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import styles from './compound-interest.module.css';

interface InterestRow {
  label: string;
  startBalance: number;
  contribution: number;
  interest: number;
  cumulativeInterest: number;
  totalPrincipal: number;
  total: number;
}

function formatNumber(val: number): string {
  if (isNaN(val) || val === 0) return '0';
  return Math.round(val).toLocaleString('zh-TW');
}

export default function CompoundInterestClient() {
  const [principal, setPrincipal] = useState<number | ''>(100000);
  const [contribution, setContribution] = useState<number | ''>(5000);
  const [contribUnit, setContribUnit] = useState<'month' | 'year'>('month');
  const [ratePercent, setRatePercent] = useState<number | ''>(6);
  const [rateUnit, setRateUnit] = useState<'year' | 'month'>('year');
  const [periodVal, setPeriodVal] = useState<number | ''>(10);
  const [periodUnit, setPeriodUnit] = useState<'year' | 'month'>('year');
  const [compoundFreq, setCompoundFreq] = useState<number>(1); // 12, 4, 1, 0

  const [totalAsset, setTotalAsset] = useState<number>(0);
  const [totalPrincipal, setTotalPrincipal] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [schedule, setSchedule] = useState<InterestRow[]>([]);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const principalInputId = useId();
  const contributionInputId = useId();
  const rateInputId = useId();
  const periodInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  // 設定全頁背景粒子色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ffb800');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 184, 0, 0.6)');
  }, []);

  const runCalculation = useCallback(() => {
    const numPrincipal = principal === '' ? 0 : principal;
    const numContrib = contribution === '' ? 0 : contribution;
    const numRate = ratePercent === '' ? 0 : ratePercent;
    const numPeriod = periodVal === '' ? 0 : periodVal;

    const totalMonths = Math.max(0, periodUnit === 'year' ? numPeriod * 12 : numPeriod);
    const monthlyRate = rateUnit === 'year' ? numRate / 100 / 12 : numRate / 100;

    let currentBal = numPrincipal;
    let currentPrin = numPrincipal;
    let currentAccruedInterest = 0;
    let totalInterestEarned = 0;

    const monthlyData: { month: number; totalPrincipal: number; totalInterest: number; balance: number }[] = [];

    for (let month = 1; month <= totalMonths; month++) {
      let addedContrib = 0;
      if (contribUnit === 'month') {
        addedContrib = numContrib;
      } else if (contribUnit === 'year') {
        if ((month - 1) % 12 === 0) {
          addedContrib = numContrib;
        }
      }

      currentBal += addedContrib;
      currentPrin += addedContrib;

      let interestThisMonth = 0;
      if (compoundFreq === 0) {
        interestThisMonth = currentPrin * monthlyRate;
        totalInterestEarned += interestThisMonth;
        currentBal += interestThisMonth;
      } else {
        interestThisMonth = currentBal * monthlyRate;
        currentAccruedInterest += interestThisMonth;
        totalInterestEarned += interestThisMonth;

        const isCompoundingTerm =
          compoundFreq === 12 ||
          (compoundFreq === 4 && month % 3 === 0) ||
          (compoundFreq === 1 && month % 12 === 0) ||
          month === totalMonths;

        if (isCompoundingTerm) {
          currentBal += currentAccruedInterest;
          currentAccruedInterest = 0;
        }
      }

      monthlyData.push({
        month,
        totalPrincipal: currentPrin,
        totalInterest: totalInterestEarned,
        balance: currentBal + currentAccruedInterest,
      });
    }

    const rows: InterestRow[] = [];
    rows.push({
      label: '初始',
      startBalance: 0,
      contribution: 0,
      interest: 0,
      cumulativeInterest: 0,
      totalPrincipal: numPrincipal,
      total: numPrincipal,
    });

    if (periodUnit === 'year') {
      let prevTotal = numPrincipal;
      let prevInterest = 0;
      for (let year = 1; year <= numPeriod; year++) {
        const idx = Math.min(year * 12 - 1, monthlyData.length - 1);
        if (idx < 0) break;
        const currentTotal = monthlyData[idx].balance;
        const currentP = monthlyData[idx].totalPrincipal;
        const currentI = monthlyData[idx].totalInterest;

        const prevP = year === 1 ? numPrincipal : monthlyData[(year - 1) * 12 - 1].totalPrincipal;
        const contribThisYear = currentP - prevP;
        const interestThisYear = currentI - prevInterest;

        rows.push({
          label: `第 ${year} 年`,
          startBalance: prevTotal,
          contribution: contribThisYear,
          interest: interestThisYear,
          cumulativeInterest: currentI,
          totalPrincipal: currentP,
          total: currentTotal,
        });

        prevTotal = currentTotal;
        prevInterest = currentI;
      }
    } else {
      let prevTotal = numPrincipal;
      let prevInterest = 0;
      monthlyData.forEach(item => {
        const currentTotal = item.balance;
        const currentP = item.totalPrincipal;
        const currentI = item.totalInterest;

        const prevP = item.month === 1 ? numPrincipal : monthlyData[item.month - 2].totalPrincipal;
        const contribThisMonth = currentP - prevP;
        const interestThisMonth = currentI - prevInterest;

        rows.push({
          label: `第 ${item.month} 月`,
          startBalance: prevTotal,
          contribution: contribThisMonth,
          interest: interestThisMonth,
          cumulativeInterest: currentI,
          totalPrincipal: currentP,
          total: currentTotal,
        });

        prevTotal = currentTotal;
        prevInterest = currentI;
      });
    }

    const finalState = rows[rows.length - 1];
    setTotalAsset(finalState ? finalState.total : numPrincipal);
    setTotalPrincipal(finalState ? finalState.totalPrincipal : numPrincipal);
    setTotalInterest(finalState ? finalState.cumulativeInterest : 0);
    setSchedule(rows);
  }, [principal, contribution, contribUnit, ratePercent, rateUnit, periodVal, periodUnit, compoundFreq]);

  useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  // 繪製 Canvas 資產成長堆疊圖
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || schedule.length <= 1) return;
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

    const maxVal = schedule[schedule.length - 1]?.total || 1;
    const points = schedule.map((row, idx) => ({
      x: (idx / (schedule.length - 1)) * (width - 60) + 40,
      yPrincipal: height - 30 - (row.totalPrincipal / maxVal) * (height - 60),
      yTotal: height - 30 - (row.total / maxVal) * (height - 60),
    }));

    // 1. 本金層
    const gradPrincipal = ctx.createLinearGradient(0, 0, 0, height);
    if (isLight) {
      gradPrincipal.addColorStop(0, 'rgba(2, 132, 199, 0.18)');
      gradPrincipal.addColorStop(1, 'rgba(2, 132, 199, 0.02)');
    } else {
      gradPrincipal.addColorStop(0, 'rgba(148, 163, 184, 0.35)');
      gradPrincipal.addColorStop(1, 'rgba(148, 163, 184, 0.05)');
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].yPrincipal);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].yPrincipal);
    }
    ctx.lineTo(points[points.length - 1].x, height - 30);
    ctx.lineTo(points[0].x, height - 30);
    ctx.closePath();
    ctx.fillStyle = gradPrincipal;
    ctx.fill();

    // 2. 利息層
    const gradInterest = ctx.createLinearGradient(0, 0, 0, height);
    if (isLight) {
      gradInterest.addColorStop(0, 'rgba(245, 158, 11, 0.45)');
      gradInterest.addColorStop(1, 'rgba(245, 158, 11, 0.08)');
    } else {
      gradInterest.addColorStop(0, 'rgba(255, 184, 0, 0.4)');
      gradInterest.addColorStop(1, 'rgba(255, 184, 0, 0.05)');
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].yTotal);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].yTotal);
    }
    for (let i = points.length - 1; i >= 0; i--) {
      ctx.lineTo(points[i].x, points[i].yPrincipal);
    }
    ctx.closePath();
    ctx.fillStyle = gradInterest;
    ctx.fill();

    // 3. 投入本金邊界線
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].yPrincipal);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].yPrincipal);
    }
    ctx.strokeStyle = isLight ? '#0284c7' : '#94a3b8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4. 總資產頂線
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].yTotal);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].yTotal);
    }
    ctx.strokeStyle = isLight ? '#d97706' : '#ffb800';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // X / Y 軸刻度
    ctx.strokeStyle = isLight ? 'rgba(203, 213, 225, 0.8)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();

    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('初始', 35, height - 12);
    ctx.fillText(`${schedule.length - 1}${periodUnit === 'year' ? '年' : '月'}`, width - 45, height - 12);
    ctx.fillText(`$${formatNumber(maxVal)}`, 5, 20);
  }, [schedule, periodUnit]);

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
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => showToast('已複製試算分享連結'));
  };

  return (
    <>
      <ToolLayout
        title="線上複利試算器"
        subtitle="COMPOUND INTEREST CALCULATOR"
        description="專業免費的線上複利計算機，支援單筆本金與定期定額（月/年）投資試算，提供動態資產成長圖表與本息增長明細，助您精準規劃長期理財目標。"
        accentColor="#ffb800"
        accentGlow="rgba(255,184,0,0.6)"
      >
        <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
          {/* 左欄：表單設定區 */}
          <div className={`${styles.glassCard} p-8 flex flex-col gap-6 shadow-lg`}>
            {/* 初始本金 */}
            <div className="flex flex-col gap-2">
              <label htmlFor={principalInputId} className="text-sm text-text-sub font-semibold uppercase tracking-[1px]">初始本金 (元)</label>
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
                  className={`w-full ${styles.inputField} px-4 py-3 pr-12 rounded-xl text-base outline-none focus:border-[#ffb800] transition-all font-mono`}
                />
                <span className="absolute right-4 text-sm text-text-sub font-medium">元</span>
              </div>
            </div>

            {/* 定期定額金額與頻率 */}
            <div className={`flex flex-col gap-5 ${styles.divider} pt-5`}>
              <div className="flex flex-col gap-2">
                <label htmlFor={contributionInputId} className="text-sm text-text-sub font-semibold uppercase tracking-[1px]">定期定額投入金額 (元)</label>
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
                    className={`w-full ${styles.inputField} px-4 py-3 pr-12 rounded-xl text-base outline-none focus:border-[#ffb800] transition-all font-mono`}
                  />
                  <span className="absolute right-4 text-sm text-text-sub font-medium">元</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor="contrib-freq-select" className="text-sm text-text-sub font-semibold uppercase tracking-[1px]">定期定額頻率</label>
                <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1 rounded-xl`}>
                  <button
                    onClick={() => setContribUnit('month')}
                    className={`py-2 text-sm rounded-lg cursor-pointer border transition-all ${
                      contribUnit === 'month' ? 'bg-[#ffb800]/20 border-[#ffb800]/50 text-[#ffb800] font-semibold shadow-sm' : 'border-transparent text-text-sub hover:text-text-main'
                    }`}
                  >
                    按月投入
                  </button>
                  <button
                    onClick={() => setContribUnit('year')}
                    className={`py-2 text-sm rounded-lg cursor-pointer border transition-all ${
                      contribUnit === 'year' ? 'bg-[#ffb800]/20 border-[#ffb800]/50 text-[#ffb800] font-semibold shadow-sm' : 'border-transparent text-text-sub hover:text-text-main'
                    }`}
                  >
                    按年投入
                  </button>
                </div>
              </div>
            </div>

            {/* 年/月利率與期限 */}
            <div className={`grid grid-cols-2 gap-4 ${styles.divider} pt-5`}>
              <div className="flex flex-col gap-2">
                <label htmlFor={rateInputId} className="text-xs text-text-sub font-semibold uppercase tracking-[1px]">預期報酬率 (%)</label>
                <div className="relative flex items-center">
                  <input
                    id={rateInputId}
                    type="number"
                    step="0.1"
                    value={ratePercent}
                    onChange={e => setRatePercent(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-16 rounded-xl text-base outline-none focus:border-[#ffb800] transition-all font-mono`}
                  />
                  <div className={`absolute right-1 top-1 bottom-1 flex ${styles.segmentGroup} rounded-lg overflow-hidden`}>
                    <button
                      onClick={() => setRateUnit('year')}
                      className={`px-2 text-xs border-none cursor-pointer transition-colors ${rateUnit === 'year' ? 'bg-[#ffb800]/25 text-[#ffb800] font-semibold' : 'text-text-sub'}`}
                    >
                      年
                    </button>
                    <button
                      onClick={() => setRateUnit('month')}
                      className={`px-2 text-xs border-none cursor-pointer transition-colors ${rateUnit === 'month' ? 'bg-[#ffb800]/25 text-[#ffb800] font-semibold' : 'text-text-sub'}`}
                    >
                      月
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={periodInputId} className="text-xs text-text-sub font-semibold uppercase tracking-[1px]">投資期間</label>
                <div className="relative flex items-center">
                  <input
                    id={periodInputId}
                    type="number"
                    value={periodVal}
                    onChange={e => setPeriodVal(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-16 rounded-xl text-base outline-none focus:border-[#ffb800] transition-all font-mono`}
                  />
                  <div className={`absolute right-1 top-1 bottom-1 flex ${styles.segmentGroup} rounded-lg overflow-hidden`}>
                    <button
                      onClick={() => setPeriodUnit('year')}
                      className={`px-2 text-xs border-none cursor-pointer transition-colors ${periodUnit === 'year' ? 'bg-[#ffb800]/25 text-[#ffb800] font-semibold' : 'text-text-sub'}`}
                    >
                      年
                    </button>
                    <button
                      onClick={() => setPeriodUnit('month')}
                      className={`px-2 text-xs border-none cursor-pointer transition-colors ${periodUnit === 'month' ? 'bg-[#ffb800]/25 text-[#ffb800] font-semibold' : 'text-text-sub'}`}
                    >
                      月
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 複利計息頻率 */}
            <div className={`flex flex-col gap-2 ${styles.divider} pt-5`}>
              <label htmlFor="compound-freq-select" className="text-xs text-text-sub font-semibold uppercase tracking-[1px]">複利計息頻率</label>
              <select
                id="compound-freq-select"
                value={compoundFreq}
                onChange={e => setCompoundFreq(parseInt(e.target.value))}
                className={`w-full ${styles.selectControl} px-4 py-3 rounded-xl text-sm outline-none cursor-pointer transition-all`}
              >
                <option value={12}>按月複利 (每月滾利)</option>
                <option value={4}>按季複利 (每三月滾利)</option>
                <option value={1}>按年複利 (每年滾利)</option>
                <option value={0}>單利計息 (不滾利)</option>
              </select>
            </div>

            <button
              onClick={copyShareLink}
              className="mt-2 w-full h-[44px] flex items-center justify-center gap-2 text-sm font-semibold tracking-[1px]
                bg-[#ffb800]/15 border border-[#ffb800]/40 text-[#ffb800] rounded-xl
                transition-all duration-300 hover:bg-[#ffb800] hover:text-[#030305] shadow-sm hover:shadow-[0_4px_16px_rgba(255,184,0,0.3)]
                cursor-pointer"
            >
              複製試算分享連結
            </button>
          </div>

          {/* 右欄：結果與圖表區 */}
          <div className="flex flex-col gap-6">
            {/* 三大指標看板 */}
            <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
              <div className={`${styles.glassCard} p-5 flex flex-col items-center justify-center text-center transition-all hover:translate-y-[-2px]`}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">累積總金額</span>
                <span className={`font-mono text-2xl font-bold ${styles.totalText} drop-shadow-[0_2px_10px_rgba(255,184,0,0.25)]`}>
                  ${formatNumber(totalAsset)}
                </span>
              </div>

              <div className={`${styles.glassCard} p-5 flex flex-col items-center justify-center text-center transition-all hover:translate-y-[-2px]`}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">總投入本金</span>
                <span className="font-mono text-xl font-bold text-text-main">
                  ${formatNumber(totalPrincipal)}
                </span>
              </div>

              <div className={`${styles.glassCard} p-5 flex flex-col items-center justify-center text-center transition-all hover:translate-y-[-2px]`}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">累積利息收益</span>
                <span className={`font-mono text-xl font-bold ${styles.interestText}`}>
                  ${formatNumber(totalInterest)}
                </span>
              </div>
            </div>

            {/* 資產成長趨勢圖 (Canvas 堆疊區域圖) */}
            <div className={`${styles.glassCard} p-5 flex flex-col gap-3`}>
              <div className="flex justify-between items-center text-sm font-semibold text-text-sub uppercase tracking-[1px]">
                <span>複利資產累積趨勢圖</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${styles.totalText} bg-current`} />複利利息</span>
                  <span className="flex items-center gap-1.5"><span className={`w-2.5 h-2.5 rounded-full ${styles.principalDot}`} />投入本金</span>
                </div>
              </div>
              <div className="relative w-full h-[230px]">
                <canvas ref={canvasRef} className="w-full h-full block" />
              </div>
            </div>

            {/* 本利和明細表格 (Sticky Column) */}
            <div className={styles.tableContainer}>
              <h3 className="text-sm font-semibold text-text-main uppercase tracking-[1px] mb-4">
                {periodUnit === 'year' ? '歷年本利和明細表' : '歷月本利和明細表'}
              </h3>
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className={`${styles.tableHeaderRow} text-text-sub text-sm font-semibold`}>
                    <th className={`text-left p-2.5 ${styles.stickyPeriod}`}>{periodUnit === 'year' ? '年度' : '月份'}</th>
                    <th className="p-2.5">期初金額</th>
                    <th className="p-2.5">當期投入</th>
                    <th className="p-2.5">當期利息</th>
                    <th className="p-2.5">累計本金</th>
                    <th className="p-2.5">本利和累計</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((row, idx) => (
                    <tr key={idx} className={`${styles.tableDataRow} text-text-main transition-colors`}>
                      <td className={`text-left p-2.5 font-mono text-text-main ${styles.stickyPeriod}`}>{row.label}</td>
                      <td className="p-2.5 font-mono">{row.label === '初始' ? '-' : `$${formatNumber(row.startBalance)}`}</td>
                      <td className="p-2.5 font-mono">{row.label === '初始' ? '-' : `+$${formatNumber(row.contribution)}`}</td>
                      <td className={`p-2.5 font-mono ${styles.interestText}`}>{row.label === '初始' ? '-' : `+$${formatNumber(row.interest)}`}</td>
                      <td className="p-2.5 font-mono">${formatNumber(row.totalPrincipal)}</td>
                      <td className={`p-2.5 font-mono ${styles.totalText} font-semibold`}>${formatNumber(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </ToolLayout>

      <div className={`fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 text-sm rounded-lg z-[100] pointer-events-none
        bg-[rgba(255,184,0,0.15)] border border-[rgba(255,184,0,0.3)] backdrop-blur-[10px] text-[#ffb800]
        transition-all duration-400 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[100px]'}`}>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}

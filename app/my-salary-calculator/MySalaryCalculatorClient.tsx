'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import {
  YEAR_CONFIGS_JSON,
  SUPPORTED_YEARS,
  findInsuredAmount,
  calculateTaxFromConfig,
} from './salaryConfig';
import styles from './my-salary-calculator.module.css';

function formatNumber(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  return Math.round(val).toLocaleString('zh-TW');
}

export default function MySalaryCalculatorClient() {
  const [selectedYear, setSelectedYear] = useState<number>(SUPPORTED_YEARS[0] || 2026);
  const [monthlySalary, setMonthlySalary] = useState<number | ''>(50000);
  const [customInsuranceBase, setCustomInsuranceBase] = useState<number | ''>('');
  const [dependents, setDependents] = useState<number>(0);
  const [selfPensionRatio, setSelfPensionRatio] = useState<number>(0);

  // 所得稅預扣方式: 'none' | 'rate_5' | 'matrix'
  const [taxMethod, setTaxMethod] = useState<'none' | 'rate_5' | 'matrix'>('none');
  const [taxDependents, setTaxDependents] = useState<number>(0);

  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const yearSelectId = useId();
  const salaryInputId = useId();
  const baseInputId = useId();
  const dependentsInputId = useId();
  const pensionInputId = useId();
  const taxMethodInputId = useId();
  const taxDependentsInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  // 設定全頁背景粒子色 (薄荷綠)
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);

  const config = YEAR_CONFIGS_JSON[selectedYear] || YEAR_CONFIGS_JSON[2026];
  const numSalary = monthlySalary === '' ? 0 : monthlySalary;
  const numBase = customInsuranceBase === '' ? numSalary : customInsuranceBase;

  // 1. 查投保級距金額 (直接對照 JSON brackets)
  const insuredLabor = findInsuredAmount(numBase, config.labor_insurance.brackets);
  const insuredHealth = findInsuredAmount(numBase, config.health_insurance.brackets);
  const insuredPension = findInsuredAmount(numBase, config.labor_pension.brackets);

  // 2. 員工自負額計算 (完全依據舊版 script.js 算式與四捨五入)
  const empLabor = Math.round(
    insuredLabor * config.labor_insurance.rate * config.labor_insurance.employee_ratio + 1e-9
  );
  const singleHealth = Math.round(
    insuredHealth * config.health_insurance.rate * config.health_insurance.employee_ratio + 1e-9
  );
  const empHealth = singleHealth * (1 + dependents);
  const empPension = Math.round(insuredPension * (selfPensionRatio / 100) + 1e-9);

  let empTax = 0;
  if (taxMethod === 'rate_5') {
    const calcTax = numSalary * 0.05;
    if (calcTax >= 2000) {
      empTax = Math.round(calcTax + 1e-9);
    }
  } else if (taxMethod === 'matrix') {
    empTax = calculateTaxFromConfig(numSalary, taxDependents, config, selectedYear);
  }

  const takeHomePay = Math.max(0, Math.round(numSalary - empLabor - empHealth - empPension - empTax));

  // 3. 雇主負擔計算
  const emprLabor = Math.round(
    insuredLabor * config.labor_insurance.rate * config.labor_insurance.employer_ratio + 1e-9
  );
  const emprHealth = Math.round(
    insuredHealth *
      config.health_insurance.rate *
      config.health_insurance.employer_ratio *
      (1 + (config.health_insurance.employer_average_dependents ?? 0.56)) +
      1e-9
  );
  const emprPension = Math.round(
    insuredPension * config.labor_pension.employer_rate + 1e-9
  );
  const emprTotalCost = Math.round(numSalary + emprLabor + emprHealth + emprPension);

  // 最小基本工資級距 (取第一個級距的金額)
  const minSalary = config.labor_insurance.brackets[0]?.insured || 29500;

  // 複製試算分享連結
  const copyShareLink = () => {
    const params = new URLSearchParams({
      y: selectedYear.toString(),
      s: numSalary.toString(),
      ib: customInsuranceBase.toString(),
      d: dependents.toString(),
      p: selfPensionRatio.toString(),
      t: taxMethod,
      td: taxDependents.toString(),
    });
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => showToast('已複製薪資勞健保試算分享連結'));
  };

  return (
    <>
      <ToolLayout
        title="薪資勞健保計算機"
        subtitle="TAIWAN SALARY & TAX CALCULATOR"
        description="專業免費的線上台灣薪資勞保健保計算機！支援 2024~2026 最新法規級距、實領薪資試算、勞退自提%、財政部扣繳稅額表與雇主負擔成本明細。"
        accentColor="#00f5a0"
        accentGlow="rgba(0, 245, 160, 0.6)"
      >
        <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
          {/* 左欄：表單設定區 */}
          <div className="bg-black/20 border border-white/[.08] rounded-2xl p-8 flex flex-col gap-6 shadow-lg">
            <h3 className="text-sm text-[#00f5a0] uppercase tracking-[1px] font-semibold border-b border-white/[.06] pb-3">
              薪資與投保設定
            </h3>

            {/* 法規年份切換 (下拉選單) */}
            <div className="flex flex-col gap-2">
              <label htmlFor={yearSelectId} className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">
                適用法規年份
              </label>
              <select
                id={yearSelectId}
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="w-full bg-select-bg border border-border-glass text-text-main px-4 py-3 rounded-xl text-sm outline-none cursor-pointer font-mono"
              >
                {SUPPORTED_YEARS.map((y, idx) => (
                  <option key={y} value={y}>
                    {y} 年 {idx === 0 ? '(最新)' : ''}
                  </option>
                ))}
              </select>
              <span className="text-xs text-slate-300">
                {selectedYear} 年基本工資為 ${formatNumber(minSalary)} 元
              </span>
            </div>

            {/* 約定月薪與投保基底 */}
            <div className="flex flex-col gap-4 border-t border-white/[.05] pt-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={salaryInputId} className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">
                  約定月薪總額 (元)
                </label>
                <input
                  id={salaryInputId}
                  type="number"
                  placeholder="例如：50000"
                  value={monthlySalary}
                  onChange={e => setMonthlySalary(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00f5a0] font-mono"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={baseInputId} className="text-sm text-slate-300 font-medium uppercase tracking-[1px]">
                  申報投保薪資基底 (元)
                </label>
                <input
                  id={baseInputId}
                  type="number"
                  placeholder={`預設同月薪 ($${formatNumber(numSalary)})`}
                  value={customInsuranceBase}
                  onChange={e => setCustomInsuranceBase(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/40 border border-white/[.08] text-white px-4 py-3 rounded-xl text-base outline-none focus:border-[#00f5a0] font-mono"
                />
                <span className="text-xs text-slate-300">
                  可自訂投保薪資，預設自動採用約定月薪
                </span>
              </div>
            </div>

            {/* 健保眷屬與勞退自提 */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/[.05] pt-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={dependentsInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  健保扶養眷屬 (人)
                </label>
                <select
                  id={dependentsInputId}
                  value={dependents}
                  onChange={e => setDependents(parseInt(e.target.value))}
                  className="w-full bg-select-bg border border-border-glass text-text-main px-3 py-3 rounded-xl text-sm outline-none cursor-pointer font-mono"
                >
                  <option value={0}>0 人 (本人)</option>
                  <option value={1}>1 人 (本人 + 1眷)</option>
                  <option value={2}>2 人 (本人 + 2眷)</option>
                  <option value={3}>3 人以上 (上限扣3眷)</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={pensionInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  勞退個人自提 (%)
                </label>
                <select
                  id={pensionInputId}
                  value={selfPensionRatio}
                  onChange={e => setSelfPensionRatio(parseFloat(e.target.value))}
                  className="w-full bg-select-bg border border-border-glass text-text-main px-3 py-3 rounded-xl text-sm outline-none cursor-pointer font-mono"
                >
                  <option value={0}>0% (不自提)</option>
                  <option value={1}>1%</option>
                  <option value={2}>2%</option>
                  <option value={3}>3%</option>
                  <option value={4}>4%</option>
                  <option value={5}>5%</option>
                  <option value={6}>6% (提繳上限)</option>
                </select>
              </div>
            </div>

            {/* 所得稅預扣設定 */}
            <div className="flex flex-col gap-4 border-t border-white/[.05] pt-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={taxMethodInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  所得稅預扣方式
                </label>
                <select
                  id={taxMethodInputId}
                  value={taxMethod}
                  onChange={e => setTaxMethod(e.target.value as 'none' | 'rate_5' | 'matrix')}
                  className="w-full bg-select-bg border border-border-glass text-text-main px-4 py-3 rounded-xl text-sm outline-none cursor-pointer"
                >
                  <option value="none">不預扣所得稅 (0%)</option>
                  <option value="rate_5">固定按 5% 預扣 (滿 $2,000 才起扣)</option>
                  <option value="matrix">依財政部薪資所得扣繳稅額表 (查表速算)</option>
                </select>
              </div>

              {taxMethod === 'matrix' && (
                <div className="flex flex-col gap-2 bg-black/30 p-4 rounded-xl border border-border-glass">
                  <label htmlFor={taxDependentsInputId} className="text-sm text-[#00f5a0] font-medium uppercase tracking-[1px]">
                    所得稅扶養親屬人數 (人)
                  </label>
                  <select
                    id={taxDependentsInputId}
                    value={taxDependents}
                    onChange={e => setTaxDependents(parseInt(e.target.value))}
                    className="w-full bg-select-bg border border-border-glass text-text-main px-3 py-2 rounded-lg text-sm outline-none font-mono"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => (
                      <option key={n} value={n}>{n} 人</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 複製分享按鈕 */}
            <button
              onClick={copyShareLink}
              className="mt-2 w-full h-[44px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
                bg-[#00f5a0]/15 border border-[#00f5a0]/40 text-[#00f5a0] rounded-xl
                transition-all duration-300 hover:bg-[#00f5a0] hover:text-[#030305] hover:shadow-[0_0_15px_rgba(0,245,160,0.4)]
                cursor-pointer"
            >
              複製薪資勞健保試算分享連結
            </button>
          </div>

          {/* 右欄：雙面板試算 (員工實領薪資 vs 雇主總成本) */}
          <div className="flex flex-col gap-6">
            {/* 板塊 1：員工每月薪資結算表 */}
            <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-5 shadow-lg">
              <div className="flex justify-between items-center border-b border-white/[.06] pb-3">
                <h3 className="text-sm text-[#00f5a0] uppercase tracking-[1px] font-semibold">
                  員工每月薪資結算表 ({selectedYear} 年法規)
                </h3>
                <span className="text-sm text-slate-300 font-medium">每月實領金額</span>
              </div>

              <div className="flex justify-between items-center bg-[#00f5a0]/15 border border-[#00f5a0]/40 p-4 rounded-xl">
                <span className="text-sm font-semibold text-white">實領薪資 (Take-Home Pay)</span>
                <span className="text-3xl font-bold text-[#00f5a0] font-mono drop-shadow-[0_0_10px_rgba(0,245,160,0.3)]">
                  ${formatNumber(takeHomePay)} 元
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm font-mono max-sm:grid-cols-1">
                <div className="bg-black/40 p-3.5 rounded-xl border border-white/[.04] flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">勞保自負額 (20%):</span>
                    <span className="text-white font-bold">${formatNumber(empLabor)} 元</span>
                  </div>
                  <span className="text-xs text-slate-300">
                    對應勞保投保級距：${formatNumber(insuredLabor)} 元
                  </span>
                </div>

                <div className="bg-black/40 p-3.5 rounded-xl border border-white/[.04] flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">健保自負額 ({1 + Math.min(3, dependents)}口):</span>
                    <span className="text-white font-bold">${formatNumber(empHealth)} 元</span>
                  </div>
                  <span className="text-xs text-slate-300">
                    對應健保投保級距：${formatNumber(insuredHealth)} 元
                  </span>
                </div>

                <div className="bg-black/40 p-3.5 rounded-xl border border-white/[.04] flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">勞退個人自提 ({selfPensionRatio}%):</span>
                    <span className="text-white font-bold">${formatNumber(empPension)} 元</span>
                  </div>
                  <span className="text-xs text-slate-300">
                    對應勞退提繳級距：${formatNumber(insuredPension)} 元
                  </span>
                </div>

                <div className="bg-black/40 p-3.5 rounded-xl border border-white/[.04] flex flex-col gap-1">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-300 font-medium">預扣所得稅:</span>
                    <span className="text-white font-bold">${formatNumber(empTax)} 元</span>
                  </div>
                  <span className="text-xs text-slate-300">
                    {taxMethod === 'none' ? '未預扣' : taxMethod === 'rate_5' ? '固定 5% 預扣' : `財政部扣繳稅額表 (扶養 ${taxDependents} 人)`}
                  </span>
                </div>
              </div>
            </div>

            {/* 板塊 2：雇主人力負擔成本 */}
            <div className="bg-black/20 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-4 shadow-lg">
              <div className="flex justify-between items-center border-b border-white/[.06] pb-3">
                <h3 className="text-sm text-slate-300 uppercase tracking-[1px] font-semibold">
                  雇主營運總勞務成本 (Employer Total Cost)
                </h3>
                <span className="text-base font-bold text-white font-mono">
                  ${formatNumber(emprTotalCost)} 元 / 月
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm font-mono max-sm:grid-cols-1">
                <div className="bg-black/40 p-3 rounded-xl border border-white/[.04] flex flex-col gap-1">
                  <span className="text-slate-300 font-medium">雇主勞保 (70%)</span>
                  <span className="text-white font-bold">${formatNumber(emprLabor)} 元</span>
                  <span className="text-xs text-slate-300">級距 ${formatNumber(insuredLabor)}</span>
                </div>

                <div className="bg-black/40 p-3 rounded-xl border border-white/[.04] flex flex-col gap-1">
                  <span className="text-slate-300 font-medium">雇主健保 (60% * 眷口)</span>
                  <span className="text-white font-bold">${formatNumber(emprHealth)} 元</span>
                  <span className="text-xs text-slate-300">級距 ${formatNumber(insuredHealth)}</span>
                </div>

                <div className="bg-black/40 p-3 rounded-xl border border-white/[.04] flex flex-col gap-1">
                  <span className="text-slate-300 font-medium">雇主強制提繳 (6%)</span>
                  <span className="text-white font-bold">${formatNumber(emprPension)} 元</span>
                  <span className="text-xs text-slate-300">級距 ${formatNumber(insuredPension)}</span>
                </div>
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

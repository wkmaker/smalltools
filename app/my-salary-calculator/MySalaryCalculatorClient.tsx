'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import {
  YEAR_CONFIGS_JSON,
  SUPPORTED_YEARS,
  findInsuredAmount,
  calculateTaxFromConfig,
} from './salaryConfig';
import styles from './my-salary-calculator.module.css';

interface Props {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: '薪資勞健保計算機',
    subtitle: 'TAIWAN SALARY & TAX CALCULATOR',
    description:
      '專業免費的線上台灣薪資勞保健保計算機！支援 2024~2026 最新法規級距、實領薪資試算、勞退自提%、財政部扣繳稅額表與雇主負擔成本明細。',
    langToggleLabel: 'English',
    langToggleUrl: '/my-salary-calculator/en/',
    salarySettings: '薪資與投保設定',
    yearLabel: '適用法規年份',
    latestBadge: '(最新)',
    minSalaryText: (year: number, amount: string) => `${year} 年基本工資為 $${amount} 元`,
    monthlySalaryLabel: '約定月薪總額 (元)',
    monthlySalaryPlaceholder: '例如：50000',
    insuranceBaseLabel: '申報投保薪資基底 (元)',
    insuranceBasePlaceholder: (amount: string) => `預設同月薪 ($${amount})`,
    insuranceBaseDesc: '可自訂投保薪資，預設自動採用約定月薪',
    healthDependentsLabel: '健保扶養眷屬 (人)',
    depSelfOnly: '0 人 (本人)',
    dep1: '1 人 (本人 + 1眷)',
    dep2: '2 人 (本人 + 2眷)',
    dep3Max: '3 人以上 (上限扣3眷)',
    pensionSelfLabel: '勞退個人自提 (%)',
    pensionNo: '0% (不自提)',
    pensionMax: '6% (提繳上限)',
    taxMethodLabel: '所得稅預扣方式',
    taxNone: '不預扣所得稅 (0%)',
    taxFixed5: '固定按 5% 預扣 (滿 $2,000 才起扣)',
    taxMatrix: '依財政部薪資所得扣繳稅額表 (查表速算)',
    taxDependentsLabel: '所得稅扶養親屬人數 (人)',
    copyLinkBtn: '複製薪資勞健保試算分享連結',
    employeeStatementTitle: (year: number) => `員工每月薪資結算表 (${year} 年法規)`,
    takeHomeHeader: '每月實領金額',
    takeHomePayLabel: '實領薪資 (Take-Home Pay)',
    empLaborLabel: '勞保自負額 (20%):',
    empLaborBracket: (amount: string) => `對應勞保投保級距：$${amount} 元`,
    empHealthLabel: (deps: number) => `健保自負額 (${deps}口):`,
    empHealthBracket: (amount: string) => `對應健保投保級距：$${amount} 元`,
    empPensionLabel: (ratio: number) => `勞退個人自提 (${ratio}%):`,
    empPensionBracket: (amount: string) => `對應勞退提繳級距：$${amount} 元`,
    empTaxLabel: '預扣所得稅:',
    empTaxDescNone: '未預扣',
    empTaxDesc5: '固定 5% 預扣',
    empTaxDescMatrix: (deps: number) => `財政部扣繳稅額表 (扶養 ${deps} 人)`,
    employerTotalCostTitle: '雇主營運總勞務成本 (Employer Total Cost)',
    emprLaborLabel: '雇主勞保 (70%)',
    emprHealthLabel: '雇主健保 (60% * 眷口)',
    emprPensionLabel: '雇主強制提繳 (6%)',
    bracketLabel: (amount: string) => `級距 $${amount}`,
    toastCopied: '已複製薪資勞健保試算分享連結',
  },
  en: {
    title: 'Taiwan Salary & Tax Calculator',
    subtitle: 'TAIWAN SALARY & TAX CALCULATOR',
    description:
      'Professional free online Taiwan salary & labor/health insurance calculator. Supports 2024-2026 regulations, net take-home pay, labor pension self-contribution, withholding tax, and employer total cost breakdowns.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/my-salary-calculator/',
    salarySettings: 'Salary & Insurance Settings',
    yearLabel: 'Regulatory Year',
    latestBadge: '(Latest)',
    minSalaryText: (year: number, amount: string) => `Min. Wage for ${year}: $${amount} TWD`,
    monthlySalaryLabel: 'Monthly Gross Salary (TWD)',
    monthlySalaryPlaceholder: 'e.g., 50000',
    insuranceBaseLabel: 'Declared Insurance Base (TWD)',
    insuranceBasePlaceholder: (amount: string) => `Default same as salary ($${amount})`,
    insuranceBaseDesc: 'Custom insurance base, defaults to gross monthly salary',
    healthDependentsLabel: 'Health Ins. Dependents',
    depSelfOnly: '0 (Employee only)',
    dep1: '1 (Employee + 1)',
    dep2: '2 (Employee + 2)',
    dep3Max: '3+ (Capped at 3)',
    pensionSelfLabel: 'Voluntary Pension Self-Contribution (%)',
    pensionNo: '0% (No Contribution)',
    pensionMax: '6% (Max Limit)',
    taxMethodLabel: 'Withholding Tax Method',
    taxNone: 'No Withholding (0%)',
    taxFixed5: 'Fixed 5% (Threshold $2,000)',
    taxMatrix: 'MOF Tax Withholding Table (Matrix Lookup)',
    taxDependentsLabel: 'Tax Dependents Count',
    copyLinkBtn: 'Copy Share Link for Calculation',
    employeeStatementTitle: (year: number) => `Employee Monthly Breakdown (${year})`,
    takeHomeHeader: 'Net Take-Home Pay',
    takeHomePayLabel: 'Take-Home Pay',
    empLaborLabel: 'Labor Ins. Employee (20%):',
    empLaborBracket: (amount: string) => `Labor Bracket: $${amount} TWD`,
    empHealthLabel: (deps: number) => `Health Ins. Employee (${deps} ind.):`,
    empHealthBracket: (amount: string) => `Health Bracket: $${amount} TWD`,
    empPensionLabel: (ratio: number) => `Voluntary Pension (${ratio}%):`,
    empPensionBracket: (amount: string) => `Pension Bracket: $${amount} TWD`,
    empTaxLabel: 'Withholding Tax:',
    empTaxDescNone: 'None',
    empTaxDesc5: 'Fixed 5%',
    empTaxDescMatrix: (deps: number) => `MOF Matrix (${deps} dependents)`,
    employerTotalCostTitle: 'Employer Total Labor Cost',
    emprLaborLabel: 'Employer Labor Ins. (70%)',
    emprHealthLabel: 'Employer Health Ins. (60% * Dep.)',
    emprPensionLabel: 'Mandatory Pension (6%)',
    bracketLabel: (amount: string) => `Bracket $${amount}`,
    toastCopied: 'Shareable link copied to clipboard',
  },
};

function formatNumber(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  return Math.round(val).toLocaleString('en-US');
}

export default function MySalaryCalculatorClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

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
  const isMountedRef = useRef(false);

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

  // 設定全頁背景粒子主題色 (薄荷綠)
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);

  // 1. 初次掛載從 URL Query Parameters 反向解析狀態
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const yearParam = params.get('y');
    if (yearParam) {
      const parsedY = parseInt(yearParam, 10);
      if (SUPPORTED_YEARS.includes(parsedY)) setSelectedYear(parsedY);
    }

    const salaryParam = params.get('s');
    if (salaryParam !== null) {
      const parsedS = parseFloat(salaryParam);
      if (!isNaN(parsedS) && parsedS >= 0) setMonthlySalary(parsedS);
    }

    const baseParam = params.get('ib');
    if (baseParam !== null && baseParam !== '') {
      const parsedIb = parseFloat(baseParam);
      if (!isNaN(parsedIb) && parsedIb >= 0) setCustomInsuranceBase(parsedIb);
    }

    const depParam = params.get('d');
    if (depParam !== null) {
      const parsedD = parseInt(depParam, 10);
      if ([0, 1, 2, 3].includes(parsedD)) setDependents(parsedD);
    }

    const pensionParam = params.get('p');
    if (pensionParam !== null) {
      const parsedP = parseFloat(pensionParam);
      if (!isNaN(parsedP) && parsedP >= 0 && parsedP <= 6) setSelfPensionRatio(parsedP);
    }

    const taxParam = params.get('t');
    if (taxParam && ['none', 'rate_5', 'matrix'].includes(taxParam)) {
      setTaxMethod(taxParam as 'none' | 'rate_5' | 'matrix');
    }

    const taxDepParam = params.get('td');
    if (taxDepParam !== null) {
      const parsedTd = parseInt(taxDepParam, 10);
      if (!isNaN(parsedTd) && parsedTd >= 0 && parsedTd <= 11) setTaxDependents(parsedTd);
    }

    isMountedRef.current = true;
  }, []);

  // 2. 正向連動 URL 網址參數 (防抖 300ms replaceState)
  useEffect(() => {
    if (!isMountedRef.current || typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('y', selectedYear.toString());
      if (monthlySalary !== '') params.set('s', monthlySalary.toString());
      if (customInsuranceBase !== '') params.set('ib', customInsuranceBase.toString());
      if (dependents > 0) params.set('d', dependents.toString());
      if (selfPensionRatio > 0) params.set('p', selfPensionRatio.toString());
      if (taxMethod !== 'none') params.set('t', taxMethod);
      if (taxMethod === 'matrix' && taxDependents > 0) params.set('td', taxDependents.toString());

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedYear, monthlySalary, customInsuranceBase, dependents, selfPensionRatio, taxMethod, taxDependents]);

  const config = YEAR_CONFIGS_JSON[selectedYear] || YEAR_CONFIGS_JSON[2026];
  const numSalary = monthlySalary === '' ? 0 : monthlySalary;
  const numBase = customInsuranceBase === '' ? numSalary : customInsuranceBase;

  // 1. 查投保級距金額 (直接對照 JSON brackets)
  const insuredLabor = findInsuredAmount(numBase, config.labor_insurance.brackets);
  const insuredHealth = findInsuredAmount(numBase, config.health_insurance.brackets);
  const insuredPension = findInsuredAmount(numBase, config.labor_pension.brackets);

  // 2. 員工自負額計算
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

  // 最小基本工資級距
  const minSalary = config.labor_insurance.brackets[0]?.insured || 29500;

  // 複製試算分享連結
  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => showToast(t.toastCopied));
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
        {/* 雙語切換按鈕 */}
        <div className="flex justify-end mb-4">
          <Link
            href={t.langToggleUrl}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-all duration-200 flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
            </svg>
            {t.langToggleLabel}
          </Link>
        </div>

        <div className="grid grid-cols-[1.1fr_1.9fr] gap-8 items-start text-left max-[1024px]:grid-cols-1">
          {/* 左欄：表單設定區 */}
          <div className={styles.panelCard}>
            <h3 className={styles.sectionTitle}>{t.salarySettings}</h3>

            {/* 法規年份切換 */}
            <div className="flex flex-col gap-2">
              <label htmlFor={yearSelectId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                {t.yearLabel}
              </label>
              <select
                id={yearSelectId}
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="w-full bg-select-bg border border-border-glass text-text-main px-4 py-3 rounded-xl text-sm outline-none cursor-pointer font-mono font-medium"
              >
                {SUPPORTED_YEARS.map((y, idx) => (
                  <option key={y} value={y}>
                    {y} {idx === 0 ? t.latestBadge : ''}
                  </option>
                ))}
              </select>
              <span className="text-xs text-text-sub">
                {t.minSalaryText(selectedYear, formatNumber(minSalary))}
              </span>
            </div>

            {/* 約定月薪與投保基底 */}
            <div className="flex flex-col gap-4 border-t border-border-glass pt-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={salaryInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.monthlySalaryLabel}
                </label>
                <input
                  id={salaryInputId}
                  type="text"
                  inputMode="numeric"
                  placeholder={t.monthlySalaryPlaceholder}
                  value={monthlySalary === '' ? '' : monthlySalary.toLocaleString('zh-TW')}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setMonthlySalary(raw === '' ? '' : parseInt(raw, 10));
                  }}
                  className={styles.inputField}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={baseInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.insuranceBaseLabel}
                </label>
                <input
                  id={baseInputId}
                  type="text"
                  inputMode="numeric"
                  placeholder={t.insuranceBasePlaceholder(formatNumber(numSalary))}
                  value={customInsuranceBase === '' ? '' : customInsuranceBase.toLocaleString('zh-TW')}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setCustomInsuranceBase(raw === '' ? '' : parseInt(raw, 10));
                  }}
                  className={styles.inputField}
                />
                <span className="text-xs text-text-sub">{t.insuranceBaseDesc}</span>
              </div>
            </div>

            {/* 健保眷屬與勞退自提 */}
            <div className="grid grid-cols-2 gap-4 border-t border-border-glass pt-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={dependentsInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.healthDependentsLabel}
                </label>
                <select
                  id={dependentsInputId}
                  value={dependents}
                  onChange={e => setDependents(parseInt(e.target.value))}
                  className="w-full bg-select-bg border border-border-glass text-text-main px-3 py-3 rounded-xl text-sm outline-none cursor-pointer font-mono font-medium"
                >
                  <option value={0}>{t.depSelfOnly}</option>
                  <option value={1}>{t.dep1}</option>
                  <option value={2}>{t.dep2}</option>
                  <option value={3}>{t.dep3Max}</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={pensionInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.pensionSelfLabel}
                </label>
                <select
                  id={pensionInputId}
                  value={selfPensionRatio}
                  onChange={e => setSelfPensionRatio(parseFloat(e.target.value))}
                  className="w-full bg-select-bg border border-border-glass text-text-main px-3 py-3 rounded-xl text-sm outline-none cursor-pointer font-mono font-medium"
                >
                  <option value={0}>{t.pensionNo}</option>
                  <option value={1}>1%</option>
                  <option value={2}>2%</option>
                  <option value={3}>3%</option>
                  <option value={4}>4%</option>
                  <option value={5}>5%</option>
                  <option value={6}>{t.pensionMax}</option>
                </select>
              </div>
            </div>

            {/* 所得稅預扣設定 */}
            <div className="flex flex-col gap-4 border-t border-border-glass pt-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={taxMethodInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.taxMethodLabel}
                </label>
                <select
                  id={taxMethodInputId}
                  value={taxMethod}
                  onChange={e => setTaxMethod(e.target.value as 'none' | 'rate_5' | 'matrix')}
                  className="w-full bg-select-bg border border-border-glass text-text-main px-4 py-3 rounded-xl text-sm outline-none cursor-pointer font-medium"
                >
                  <option value="none">{t.taxNone}</option>
                  <option value="rate_5">{t.taxFixed5}</option>
                  <option value="matrix">{t.taxMatrix}</option>
                </select>
              </div>

              {taxMethod === 'matrix' && (
                <div className="flex flex-col gap-2 bg-select-bg p-4 rounded-xl border border-border-glass">
                  <label htmlFor={taxDependentsInputId} className={`text-sm font-medium uppercase tracking-[1px] ${styles.accentText}`}>
                    {t.taxDependentsLabel}
                  </label>
                  <select
                    id={taxDependentsInputId}
                    value={taxDependents}
                    onChange={e => setTaxDependents(parseInt(e.target.value))}
                    className="w-full bg-select-bg border border-border-glass text-text-main px-3 py-2 rounded-lg text-sm outline-none font-mono font-medium"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 複製分享按鈕 */}
            <button
              type="button"
              onClick={copyShareLink}
              className={styles.shareBtn}
            >
              {t.copyLinkBtn}
            </button>
          </div>

          {/* 右欄：雙面板試算 */}
          <div className="flex flex-col gap-6">
            {/* 板塊 1：員工每月薪資結算表 */}
            <div className={styles.panelCard}>
              <div className="flex justify-between items-center border-b border-border-glass pb-3">
                <h3 className={styles.sectionTitle}>
                  {t.employeeStatementTitle(selectedYear)}
                </h3>
                <span className="text-sm text-text-sub font-semibold">{t.takeHomeHeader}</span>
              </div>

              <div className={styles.takeHomeCard}>
                <span className="text-sm font-semibold text-text-main">{t.takeHomePayLabel}</span>
                <span className={`text-3xl font-bold font-mono ${styles.accentText}`}>
                  ${formatNumber(takeHomePay)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm font-mono max-sm:grid-cols-1">
                <div className={styles.subStatCard}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-text-sub">{t.empLaborLabel}</span>
                    <span className="text-text-main font-bold">${formatNumber(empLabor)}</span>
                  </div>
                  <span className="text-xs text-text-sub">
                    {t.empLaborBracket(formatNumber(insuredLabor))}
                  </span>
                </div>

                <div className={styles.subStatCard}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-text-sub">{t.empHealthLabel(1 + Math.min(3, dependents))}</span>
                    <span className="text-text-main font-bold">${formatNumber(empHealth)}</span>
                  </div>
                  <span className="text-xs text-text-sub">
                    {t.empHealthBracket(formatNumber(insuredHealth))}
                  </span>
                </div>

                <div className={styles.subStatCard}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-text-sub">{t.empPensionLabel(selfPensionRatio)}</span>
                    <span className="text-text-main font-bold">${formatNumber(empPension)}</span>
                  </div>
                  <span className="text-xs text-text-sub">
                    {t.empPensionBracket(formatNumber(insuredPension))}
                  </span>
                </div>

                <div className={styles.subStatCard}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-text-sub">{t.empTaxLabel}</span>
                    <span className="text-text-main font-bold">${formatNumber(empTax)}</span>
                  </div>
                  <span className="text-xs text-text-sub">
                    {taxMethod === 'none'
                      ? t.empTaxDescNone
                      : taxMethod === 'rate_5'
                      ? t.empTaxDesc5
                      : t.empTaxDescMatrix(taxDependents)}
                  </span>
                </div>
              </div>
            </div>

            {/* 板塊 2：雇主人力負擔成本 */}
            <div className={styles.panelCard}>
              <div className="flex justify-between items-center border-b border-border-glass pb-3">
                <h3 className="text-sm text-text-sub uppercase tracking-[1px] font-semibold">
                  {t.employerTotalCostTitle}
                </h3>
                <span className="text-base font-bold text-text-main font-mono">
                  ${formatNumber(emprTotalCost)} / Mo
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm font-mono max-sm:grid-cols-1">
                <div className={styles.subStatCard}>
                  <span className="text-sm font-semibold text-text-sub">{t.emprLaborLabel}</span>
                  <span className="text-text-main font-bold">${formatNumber(emprLabor)}</span>
                  <span className="text-xs text-text-sub">{t.bracketLabel(formatNumber(insuredLabor))}</span>
                </div>

                <div className={styles.subStatCard}>
                  <span className="text-sm font-semibold text-text-sub">{t.emprHealthLabel}</span>
                  <span className="text-text-main font-bold">${formatNumber(emprHealth)}</span>
                  <span className="text-xs text-text-sub">{t.bracketLabel(formatNumber(insuredHealth))}</span>
                </div>

                <div className={styles.subStatCard}>
                  <span className="text-sm font-semibold text-text-sub">{t.emprPensionLabel}</span>
                  <span className="text-text-main font-bold">${formatNumber(emprPension)}</span>
                  <span className="text-xs text-text-sub">{t.bracketLabel(formatNumber(insuredPension))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </ToolLayout>

      {/* Toast 提示條 */}
      <div
        className={`${styles.toastBar} ${toast.show ? styles.toastShow : styles.toastHide}`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}

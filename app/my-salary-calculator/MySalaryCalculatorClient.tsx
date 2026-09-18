'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import { YEAR_CONFIGS_JSON, SUPPORTED_YEARS } from './salaryConfig';
import { calculateSalary } from './engine';
import styles from './my-salary-calculator.module.css';
import { TRANSLATIONS } from './translations';

interface Props {
  lang?: 'zh-TW' | 'en';
}


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

  // 設定全頁背景粒子主題色 (活力火焰橘)
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff7300');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 115, 0, 0.6)');
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

  // 薪資勞健保 / 勞退 / 預扣稅主試算邏輯（純函數引擎，見 ./engine.ts）
  const {
    insuredLabor,
    insuredHealth,
    insuredPension,
    empLabor,
    singleHealth,
    empHealth,
    empPension,
    empTax,
    takeHomePay,
    emprLabor,
    emprHealth,
    emprPension,
    emprTotalCost,
    minSalary,
  } = calculateSalary(
    {
      year: selectedYear,
      salary: numSalary,
      insuranceBase: customInsuranceBase === '' ? numSalary : customInsuranceBase,
      dependents,
      selfPensionRatio,
      taxMethod,
      taxDependents,
    },
    config,
  );

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

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection
            title={t.faqTitle}
            subtitle={t.faqSubtitle}
            items={t.faqItems}
            accentColor="#ff7300"
          />
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

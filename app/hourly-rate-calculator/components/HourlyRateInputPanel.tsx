'use client';

import React, { useId } from 'react';
import taiwanStatsData from '../config/taiwan_statistics.json';
import styles from '../hourly-rate-calculator.module.css';
import { SUPPORTED_YEARS } from '../utils';
import type { TRANSLATIONS } from '../translations';

type HourlyRateTranslations = (typeof TRANSLATIONS)['zh-TW'];

export interface HourlyRateInputPanelProps {
  t: HourlyRateTranslations;
  selectedYear: number;
  onSelectedYearChange: (year: number) => void;
  calcMode: 'monthly' | 'project';
  onCalcModeChange: (mode: 'monthly' | 'project') => void;
  monthlySalary: number | '';
  onMonthlySalaryChange: (val: number | '') => void;
  monthlyHours: number | '';
  onMonthlyHoursChange: (val: number | '') => void;
  overtimeHours: number | '';
  onOvertimeHoursChange: (val: number | '') => void;
  commuteHours: number | '';
  onCommuteHoursChange: (val: number | '') => void;
  monthlyExpenses: number | '';
  onMonthlyExpensesChange: (val: number | '') => void;
  projectFee: number | '';
  onProjectFeeChange: (val: number | '') => void;
  projectHours: number | '';
  onProjectHoursChange: (val: number | '') => void;
  extraHours: number | '';
  onExtraHoursChange: (val: number | '') => void;
  projectExpenses: number | '';
  onProjectExpensesChange: (val: number | '') => void;
}

export default function HourlyRateInputPanel({
  t,
  selectedYear,
  onSelectedYearChange,
  calcMode,
  onCalcModeChange,
  monthlySalary,
  onMonthlySalaryChange,
  monthlyHours,
  onMonthlyHoursChange,
  overtimeHours,
  onOvertimeHoursChange,
  commuteHours,
  onCommuteHoursChange,
  monthlyExpenses,
  onMonthlyExpensesChange,
  projectFee,
  onProjectFeeChange,
  projectHours,
  onProjectHoursChange,
  extraHours,
  onExtraHoursChange,
  projectExpenses,
  onProjectExpensesChange,
}: HourlyRateInputPanelProps) {
  // 無障礙 Form IDs
  const yearSelectId = useId();
  const calcModeSelectId = useId();
  const monthlySalaryId = useId();
  const monthlyHoursId = useId();
  const overtimeHoursId = useId();
  const commuteHoursId = useId();
  const monthlyExpensesId = useId();
  const projectFeeId = useId();
  const projectHoursId = useId();
  const extraHoursId = useId();
  const projectExpensesId = useId();

  // 數字輸入 Helper
  const handleNumberInput = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: (val: number | '') => void
  ) => {
    const raw = e.target.value.replace(/[^\d]/g, '');
    setter(raw === '' ? '' : parseInt(raw, 10));
  };

  return (
    <div className={`lg:col-span-6 p-6 ${styles.calcCard}`}>
      <div className="flex items-center justify-between border-b border-border-glass pb-4 mb-6">
        <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
          <svg className={`w-5 h-5 ${styles.themeAccentText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          {t.calcSettingsTitle}
        </h2>

        {/* 年份選單動態由 SUPPORTED_YEARS 渲染，與 URL 驗證邏輯共用同一來源 */}
        <div className="flex items-center gap-2">
          <label htmlFor={yearSelectId} className="text-xs font-semibold text-text-sub">
            {t.applicableYearLabel}
          </label>
          <select
            id={yearSelectId}
            value={selectedYear}
            onChange={(e) => onSelectedYearChange(Number(e.target.value))}
            className="bg-select-bg border border-border-glass rounded-lg px-2.5 py-1 text-sm text-text-main font-medium outline-none focus:border-[var(--theme-color)]"
          >
            {SUPPORTED_YEARS.map((year) => {
              const stat = taiwanStatsData.statistics[String(year) as keyof typeof taiwanStatsData.statistics];
              return (
                <option key={year} value={year}>
                  {t.yearOption(year, stat.minimum_wage.hourly)}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Mode Switcher */}
      <div className="mb-6">
        <legend id={calcModeSelectId} className="text-sm font-medium text-text-sub mb-2 block">
          {t.calcModeLabel}
        </legend>
        <div className="grid grid-cols-2 gap-2 bg-surface-glass p-1.5 rounded-xl border border-border-glass">
          <button
            type="button"
            onClick={() => onCalcModeChange('monthly')}
            className={`${styles.tabBtn} ${calcMode === 'monthly' ? styles.tabBtnActive : ''}`}
          >
            {t.modeMonthly}
          </button>
          <button
            type="button"
            onClick={() => onCalcModeChange('project')}
            className={`${styles.tabBtn} ${calcMode === 'project' ? styles.tabBtnActive : ''}`}
          >
            {t.modeProject}
          </button>
        </div>
      </div>

      {/* Inputs based on Mode */}
      {calcMode === 'monthly' ? (
        <div className="space-y-4">
          <div>
            <label htmlFor={monthlySalaryId} className="text-sm font-semibold text-text-sub mb-1.5 block">
              {t.monthlySalaryLabel}
            </label>
            <input
              id={monthlySalaryId}
              type="text"
              inputMode="numeric"
              value={monthlySalary === '' ? '' : monthlySalary.toLocaleString(t.numberLocale)}
              onChange={(e) => handleNumberInput(e, onMonthlySalaryChange)}
              className={styles.inputField}
              placeholder={t.monthlySalaryPlaceholder}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={monthlyHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                {t.monthlyHoursLabel}
              </label>
              <input
                id={monthlyHoursId}
                type="text"
                inputMode="numeric"
                value={monthlyHours === '' ? '' : monthlyHours}
                onChange={(e) => handleNumberInput(e, onMonthlyHoursChange)}
                className={styles.inputField}
                placeholder={t.monthlyHoursPlaceholder}
              />
            </div>
            <div>
              <label htmlFor={overtimeHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                {t.overtimeHoursLabel}
              </label>
              <input
                id={overtimeHoursId}
                type="text"
                inputMode="numeric"
                value={overtimeHours === '' ? '' : overtimeHours}
                onChange={(e) => handleNumberInput(e, onOvertimeHoursChange)}
                className={styles.inputField}
                placeholder={t.overtimeHoursPlaceholder}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={commuteHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                {t.commuteHoursLabel}
              </label>
              <input
                id={commuteHoursId}
                type="text"
                inputMode="numeric"
                value={commuteHours === '' ? '' : commuteHours}
                onChange={(e) => handleNumberInput(e, onCommuteHoursChange)}
                className={styles.inputField}
                placeholder={t.commuteHoursPlaceholder}
              />
            </div>
            <div>
              <label htmlFor={monthlyExpensesId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                {t.monthlyExpensesLabel}
              </label>
              <input
                id={monthlyExpensesId}
                type="text"
                inputMode="numeric"
                value={monthlyExpenses === '' ? '' : monthlyExpenses.toLocaleString(t.numberLocale)}
                onChange={(e) => handleNumberInput(e, onMonthlyExpensesChange)}
                className={styles.inputField}
                placeholder={t.monthlyExpensesPlaceholder}
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <label htmlFor={projectFeeId} className="text-sm font-semibold text-text-sub mb-1.5 block">
              {t.projectFeeLabel}
            </label>
            <input
              id={projectFeeId}
              type="text"
              inputMode="numeric"
              value={projectFee === '' ? '' : projectFee.toLocaleString(t.numberLocale)}
              onChange={(e) => handleNumberInput(e, onProjectFeeChange)}
              className={styles.inputField}
              placeholder={t.projectFeePlaceholder}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor={projectHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                {t.projectHoursLabel}
              </label>
              <input
                id={projectHoursId}
                type="text"
                inputMode="numeric"
                value={projectHours === '' ? '' : projectHours}
                onChange={(e) => handleNumberInput(e, onProjectHoursChange)}
                className={styles.inputField}
                placeholder={t.projectHoursPlaceholder}
              />
            </div>
            <div>
              <label htmlFor={extraHoursId} className="text-sm font-semibold text-text-sub mb-1.5 block">
                {t.extraHoursLabel}
              </label>
              <input
                id={extraHoursId}
                type="text"
                inputMode="numeric"
                value={extraHours === '' ? '' : extraHours}
                onChange={(e) => handleNumberInput(e, onExtraHoursChange)}
                className={styles.inputField}
                placeholder={t.extraHoursPlaceholder}
              />
            </div>
          </div>

          <div>
            <label htmlFor={projectExpensesId} className="text-sm font-semibold text-text-sub mb-1.5 block">
              {t.projectExpensesLabel}
            </label>
            <input
              id={projectExpensesId}
              type="text"
              inputMode="numeric"
              value={projectExpenses === '' ? '' : projectExpenses.toLocaleString(t.numberLocale)}
              onChange={(e) => handleNumberInput(e, onProjectExpensesChange)}
              className={styles.inputField}
              placeholder={t.projectExpensesPlaceholder}
            />
          </div>
        </div>
      )}
    </div>
  );
}

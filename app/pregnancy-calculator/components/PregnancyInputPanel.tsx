'use client';

import React from 'react';
import type { CalcMode, ScanInputType, IvfType } from '../engine';
import styles from '../pregnancy-calculator.module.css';

interface PregnancyInputPanelProps {
  t: any;
  calcMode: CalcMode;
  setCalcMode: (mode: CalcMode) => void;
  lmpDate: string;
  setLmpDate: (val: string) => void;
  cycleDays: number;
  setCycleDays: (val: number) => void;
  eddDateInput: string;
  setEddDateInput: (val: string) => void;
  defaultLmp: string;
  scanDate: string;
  setScanDate: (val: string) => void;
  scanInputType: ScanInputType;
  setScanInputType: (val: ScanInputType) => void;
  scanWeeks: number;
  setScanWeeks: (val: number) => void;
  scanDays: number;
  setScanDays: (val: number) => void;
  crlValue: number | '';
  setCrlValue: (val: number | '') => void;
  crlConvertedAge: { weeks: number; days: number };
  ivfDate: string;
  setIvfDate: (val: string) => void;
  ivfType: IvfType;
  setIvfType: (val: IvfType) => void;
  monthlySalary: number | '';
  setMonthlySalary: (val: number | '') => void;
  leaveStartWeeksOption: number;
  setLeaveStartWeeksOption: (val: number) => void;
  showSalaryTooltip: boolean;
  setShowSalaryTooltip: React.Dispatch<React.SetStateAction<boolean>>;
  shareLinkToast: boolean;
  onCopyShareLink: () => void;
  // A11y IDs
  modeSelectId: string;
  lmpInputId: string;
  cycleInputId: string;
  eddInputId: string;
  scanDateId: string;
  scanTypeSelectId: string;
  scanWeeksId: string;
  scanDaysId: string;
  crlInputId: string;
  ivfDateId: string;
  ivfTypeId: string;
  salaryInputId: string;
  leaveStartId: string;
}

export default function PregnancyInputPanel(props: PregnancyInputPanelProps) {
  const { t } = props;

  return (
    <div className="flex flex-col gap-6">
      <div className={styles.glassCard}>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
              <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
            </svg>
            {t.calcModeLabel}
          </h2>
          <button
            type="button"
            onClick={props.onCopyShareLink}
            className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-surface-glass border border-border-glass text-text-sub hover:text-text-main transition-colors flex items-center gap-1.5 cursor-pointer"
            title={t.shareLinkBtn}
          >
            <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
              <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
            </svg>
            {t.shareLinkBtn}
          </button>
        </div>

        {props.shareLinkToast && (
          <div className={`mb-3 ${styles.copiedToastBanner}`}>
            <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
            {t.shareLinkCopied}
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* 模式選擇 */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor={props.modeSelectId} className="text-xs font-semibold text-text-sub">
              {t.calcModeLabel}
            </label>
            <select
              id={props.modeSelectId}
              value={props.calcMode}
              onChange={(e) => props.setCalcMode(e.target.value as CalcMode)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors cursor-pointer"
            >
              <option value="lmp">{t.modeLmp}</option>
              <option value="edd">{t.modeEdd}</option>
              <option value="ultrasound">{t.modeUltrasound}</option>
              <option value="ivf">{t.modeIvf}</option>
            </select>
          </div>

          {/* 模式一：LMP */}
          {props.calcMode === 'lmp' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={props.lmpInputId} className="text-xs font-semibold text-text-sub">
                  {t.lmpDateLabel}
                </label>
                <input
                  id={props.lmpInputId}
                  type="date"
                  value={props.lmpDate}
                  onChange={(e) => props.setLmpDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors [color-scheme:dark]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={props.cycleInputId} className="text-xs font-semibold text-text-sub">
                  {t.cycleDaysLabel}
                </label>
                <input
                  id={props.cycleInputId}
                  type="number"
                  min="20"
                  max="45"
                  value={props.cycleDays}
                  onChange={(e) => props.setCycleDays(parseInt(e.target.value) || 28)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                />
              </div>
            </>
          )}

          {/* 模式二：EDD */}
          {props.calcMode === 'edd' && (
            <div className="flex flex-col gap-1.5">
              <label htmlFor={props.eddInputId} className="text-xs font-semibold text-text-sub">
                {t.eddDateLabel}
              </label>
              <input
                id={props.eddInputId}
                type="date"
                value={props.eddDateInput || props.defaultLmp}
                onChange={(e) => props.setEddDateInput(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors [color-scheme:dark]"
              />
            </div>
          )}

          {/* 模式三：超音波 */}
          {props.calcMode === 'ultrasound' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={props.scanDateId} className="text-xs font-semibold text-text-sub">
                  {t.scanDateLabel}
                </label>
                <input
                  id={props.scanDateId}
                  type="date"
                  value={props.scanDate}
                  onChange={(e) => props.setScanDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors [color-scheme:dark]"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor={props.scanTypeSelectId} className="text-xs font-semibold text-text-sub">
                  {t.scanInputTypeLabel}
                </label>
                <select
                  id={props.scanTypeSelectId}
                  value={props.scanInputType}
                  onChange={(e) => props.setScanInputType(e.target.value as ScanInputType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors cursor-pointer"
                >
                  <option value="weeks">{t.scanInputWeeks}</option>
                  <option value="crl">{t.scanInputCrl}</option>
                </select>
              </div>

              {props.scanInputType === 'weeks' ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={props.scanWeeksId} className="text-xs font-semibold text-text-sub">
                      {t.scanWeeksLabel}
                    </label>
                    <input
                      id={props.scanWeeksId}
                      type="number"
                      min="4"
                      max="40"
                      value={props.scanWeeks}
                      onChange={(e) => props.setScanWeeks(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={props.scanDaysId} className="text-xs font-semibold text-text-sub">
                      {t.scanDaysLabel}
                    </label>
                    <input
                      id={props.scanDaysId}
                      type="number"
                      min="0"
                      max="6"
                      value={props.scanDays}
                      onChange={(e) => props.setScanDays(parseInt(e.target.value) || 0)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                    />
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={props.crlInputId} className="text-xs font-semibold text-text-sub">
                      {t.crlInputLabel}
                    </label>
                    <input
                      id={props.crlInputId}
                      type="number"
                      step="0.1"
                      min="5"
                      max="84"
                      placeholder={t.crlPlaceholder}
                      value={props.crlValue}
                      onChange={(e) => {
                        const raw = e.target.value;
                        props.setCrlValue(raw === '' ? '' : parseFloat(raw));
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                    />
                  </div>
                  <div className="p-2.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col gap-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-text-sub">{t.crlCalculatedAge}</span>
                      <strong className={`${styles.accentText} font-bold text-sm`}>
                        {props.crlConvertedAge.weeks} {t.weeksUnit} + {props.crlConvertedAge.days} {t.daysUnit}
                      </strong>
                    </div>
                    <p className="text-xs text-text-sub leading-tight">
                      {t.crlFormulaHint}
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* 模式四：IVF */}
          {props.calcMode === 'ivf' && (
            <>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={props.ivfTypeId} className="text-xs font-semibold text-text-sub">
                  {t.ivfTypeLabel}
                </label>
                <select
                  id={props.ivfTypeId}
                  value={props.ivfType}
                  onChange={(e) => props.setIvfType(e.target.value as IvfType)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors cursor-pointer"
                >
                  <option value="d5">{t.ivfTypeD5}</option>
                  <option value="d3">{t.ivfTypeD3}</option>
                  <option value="egg">{t.ivfTypeEgg}</option>
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label htmlFor={props.ivfDateId} className="text-xs font-semibold text-text-sub">
                  {t.ivfDateLabel}
                </label>
                <input
                  id={props.ivfDateId}
                  type="date"
                  value={props.ivfDate}
                  onChange={(e) => props.setIvfDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors [color-scheme:dark]"
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* 產假與薪資津貼設定 */}
      <div className={styles.glassCard}>
        <h2 className={styles.cardTitle}>
          <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm0-15.86v2.06c-1.1 0-2 .9-2 2v1H9v-3c0-.55-.45-1-1-1H7.1c.91-1.31 2.36-2.28 4.05-2.62z" />
          </svg>
          {t.leaveSettingsTitle}
        </h2>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor={props.salaryInputId} className="text-xs font-semibold text-text-sub">
                {t.monthlySalaryLabel}
              </label>
              <div className="relative inline-block">
                <button
                  type="button"
                  onClick={() => props.setShowSalaryTooltip((prev) => !prev)}
                  onMouseEnter={() => props.setShowSalaryTooltip(true)}
                  onMouseLeave={() => props.setShowSalaryTooltip(false)}
                  aria-label={t.salaryTooltipBtnAria}
                  className="p-1 rounded-full text-text-sub hover:text-text-main hover:bg-white/10 transition-colors focus:outline-none flex items-center justify-center cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>

                {props.showSalaryTooltip && (
                  <div className={`absolute right-0 top-full mt-1.5 w-72 sm:w-80 p-3.5 z-30 text-xs rounded-xl shadow-xl ${styles.tooltipContainer}`}>
                    <p className="font-bold mb-1.5 text-text-main flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-[#ff4081]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {t.salaryTooltipTitle}
                    </p>
                    <div className="flex flex-col gap-1.5 text-text-sub leading-relaxed text-xs">
                      <p>・{t.salaryTooltipLabor}</p>
                      <p>・{t.salaryTooltipParental}</p>
                      <p className="opacity-85">・{t.salaryTooltipCap}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <input
              id={props.salaryInputId}
              type="text"
              inputMode="numeric"
              placeholder={t.monthlySalaryPlaceholder}
              value={props.monthlySalary === '' ? '' : Number(props.monthlySalary).toLocaleString('zh-TW')}
              onChange={(e) => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                props.setMonthlySalary(raw === '' ? '' : parseInt(raw, 10));
              }}
              className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
            />
            <span className="text-xs text-text-sub flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-[#ff4081] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              {t.monthlySalaryHelper}
            </span>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor={props.leaveStartId} className="text-xs font-semibold text-text-sub">
              {t.leaveStartWeeksLabel}
            </label>
            <select
              id={props.leaveStartId}
              value={props.leaveStartWeeksOption}
              onChange={(e) => props.setLeaveStartWeeksOption(parseInt(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors cursor-pointer"
            >
              <option value={2}>{t.leaveStartOpt2Weeks}</option>
              <option value={3}>{t.leaveStartOpt3Weeks}</option>
              <option value={4}>{t.leaveStartOpt4Weeks}</option>
              <option value={0}>{t.leaveStartOptDue}</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
}

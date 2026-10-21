'use client';

import React, { useId } from 'react';
import type { RateType, RepayType, Stage } from '../engine';
import styles from '../mortgage-loan.module.css';

interface CombinedLoanSettingsProps {
  t: any;
  totalLoan: number;
  loanName1: string;
  setLoanName1: (v: string) => void;
  loanAmount1: number | '';
  setLoanAmount1: (v: number | '') => void;
  setLoanAmount2: (v: number | '') => void;
  periodVal1: number | '';
  setPeriodVal1: (v: number | '') => void;
  graceVal1: number | '';
  setGraceVal1: (v: number | '') => void;
  rateType1: RateType;
  handleRateType1Change: (t: 'single' | 'multi') => void;
  singleRate1: number | '';
  setSingleRate1: (v: number | '') => void;
  stages1: Stage[];
  setStages1: React.Dispatch<React.SetStateAction<Stage[]>>;
  addStage1: () => void;
  removeStage1: (idx: number) => void;
  repayType1: RepayType;
  setRepayType1: (v: RepayType) => void;
  fee1: number | '';
  setFee1: (v: number | '') => void;
  setLoanAQuickValue: (val: number | null) => void;

  loanName2: string;
  setLoanName2: (v: string) => void;
  loanAmount2: number | '';
  periodVal2: number | '';
  setPeriodVal2: (v: number | '') => void;
  graceVal2: number | '';
  setGraceVal2: (v: number | '') => void;
  rateType2: RateType;
  handleRateType2Change: (t: 'single' | 'multi') => void;
  singleRate2: number | '';
  setSingleRate2: (v: number | '') => void;
  stages2: Stage[];
  setStages2: React.Dispatch<React.SetStateAction<Stage[]>>;
  addStage2: () => void;
  removeStage2: (idx: number) => void;
  repayType2: RepayType;
  setRepayType2: (v: RepayType) => void;
  fee2: number | '';
  setFee2: (v: number | '') => void;
}

export default function CombinedLoanSettings({
  t,
  totalLoan,
  loanName1,
  setLoanName1,
  loanAmount1,
  setLoanAmount1,
  setLoanAmount2,
  periodVal1,
  setPeriodVal1,
  graceVal1,
  setGraceVal1,
  rateType1,
  handleRateType1Change,
  singleRate1,
  setSingleRate1,
  stages1,
  setStages1,
  addStage1,
  removeStage1,
  repayType1,
  setRepayType1,
  fee1,
  setFee1,
  setLoanAQuickValue,

  loanName2,
  setLoanName2,
  loanAmount2,
  periodVal2,
  setPeriodVal2,
  graceVal2,
  setGraceVal2,
  rateType2,
  handleRateType2Change,
  singleRate2,
  setSingleRate2,
  stages2,
  setStages2,
  addStage2,
  removeStage2,
  repayType2,
  setRepayType2,
  fee2,
  setFee2,
}: CombinedLoanSettingsProps) {
  const baseId = useId();
  const idLoanName1 = `${baseId}-loan-name-1`;
  const idLoanAmount1 = `${baseId}-loan-amount-1`;
  const idPeriodVal1 = `${baseId}-period-val-1`;
  const idGraceVal1 = `${baseId}-grace-val-1`;
  const idSingleRate1 = `${baseId}-single-rate-1`;
  const idFee1 = `${baseId}-fee-1`;

  const idLoanName2 = `${baseId}-loan-name-2`;
  const idLoanAmount2 = `${baseId}-loan-amount-2`;
  const idPeriodVal2 = `${baseId}-period-val-2`;
  const idGraceVal2 = `${baseId}-grace-val-2`;
  const idSingleRate2 = `${baseId}-single-rate-2`;
  const idFee2 = `${baseId}-fee-2`;

  return (
    <div className={`flex flex-col gap-6 ${styles.divider} pt-5`}>
      {/* 貸款 A 卡片 */}
      <div className={styles.subCard}>
        <div className="flex justify-between items-center">
          <input
            id={idLoanName1}
            aria-label={`${t.firstLoan} ${t.loanNameLabel || '名稱'}`}
            type="text"
            value={loanName1}
            onChange={e => setLoanName1(e.target.value)}
            className={`bg-transparent border-b border-dashed border-[var(--theme-color)] ${styles.accentText} text-sm font-semibold outline-none px-1 py-0.5 focus-visible:ring-1 focus-visible:ring-[var(--theme-color)] rounded`}
          />
          <span className={`text-xs ${styles.activeScheme} px-2 py-0.5 rounded-md font-mono`}>
            {t.firstLoan}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={idLoanAmount1} className="text-sm font-medium text-text-sub">
            {t.loanAmountLabel}
          </label>
          <input
            id={idLoanAmount1}
            aria-label={`${t.firstLoan} ${t.loanAmountLabel}`}
            type="number"
            value={loanAmount1}
            onChange={e => {
              const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
              const amtA = typeof val === 'number' ? Math.min(val, totalLoan) : 0;
              setLoanAmount1(val);
              setLoanAmount2(Math.max(0, totalLoan - amtA));
            }}
            className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
          />
          <div className="flex gap-2 mt-1">
            <button
              type="button"
              onClick={() => setLoanAQuickValue(1000)}
              className={`flex-1 py-1 text-xs ${styles.activeScheme} rounded-md cursor-pointer`}
            >
              {t.quick1000m}
            </button>
            <button
              type="button"
              onClick={() => setLoanAQuickValue(null)}
              className="flex-1 py-1 text-xs bg-surface-glass border border-border-glass text-text-sub rounded-md cursor-pointer hover:text-text-main"
            >
              {t.allToA}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={idPeriodVal1} className="text-sm font-medium text-text-sub">
              {t.loanTermLabel}
            </label>
            <input
              id={idPeriodVal1}
              aria-label={`${t.firstLoan} ${t.loanTermLabel}`}
              type="number"
              value={periodVal1}
              onChange={e => setPeriodVal1(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={idGraceVal1} className="text-sm font-medium text-text-sub">
              {t.gracePeriodLabel}
            </label>
            <input
              id={idGraceVal1}
              aria-label={`${t.firstLoan} ${t.gracePeriodLabel}`}
              type="number"
              value={graceVal1}
              onChange={e => setGraceVal1(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
            />
          </div>
        </div>

        {/* 利率類型切換 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">{t.rateTypeLabel}</span>
          <div className={`grid grid-cols-2 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl`}>
            <button
              type="button"
              onClick={() => handleRateType1Change('single')}
              className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                rateType1 === 'single'
                  ? styles.activeScheme
                  : 'border-transparent text-text-sub hover:text-text-main'
              }`}
            >
              {t.singleRateMode}
            </button>
            <button
              type="button"
              onClick={() => handleRateType1Change('multi')}
              className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                rateType1 === 'multi'
                  ? styles.activeScheme
                  : 'border-transparent text-text-sub hover:text-text-main'
              }`}
            >
              {t.multiRateMode}
            </button>
          </div>
        </div>

        {rateType1 === 'single' ? (
          <div className="flex flex-col gap-1">
            <label htmlFor={idSingleRate1} className="text-sm font-medium text-text-sub">
              {t.annualRateLabel}
            </label>
            <input
              id={idSingleRate1}
              aria-label={`${t.firstLoan} ${t.annualRateLabel}`}
              type="number"
              step="0.001"
              value={singleRate1}
              onChange={e => setSingleRate1(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
              className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
            />
          </div>
        ) : (
          <div className={`flex flex-col gap-2.5 ${styles.subCard} p-3 rounded-xl border border-border-glass`}>
            <span className={`text-xs ${styles.accentText} font-medium`}>{t.multiRateSettings}</span>
            {stages1.map((stg, sIdx) => {
              const isLast = sIdx === stages1.length - 1;
              const stageDurationId = `${baseId}-stage1-${sIdx}-duration`;
              const stageRateId = `${baseId}-stage1-${sIdx}-rate`;
              const stageTitle = `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}`;
              return (
                <div key={sIdx} className={`flex flex-col gap-1.5 ${styles.divider} pb-2`}>
                  <div className="flex justify-between items-center text-xs font-medium text-text-sub">
                    <span>{isLast ? `${stageTitle}${t.remainingPeriods}` : stageTitle}</span>
                    {!isLast && stages1.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeStage1(sIdx)}
                        className="text-xs text-[#ef4444] hover:underline cursor-pointer"
                      >
                        {t.remove}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {!isLast ? (
                      <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                        <input
                          id={stageDurationId}
                          aria-label={`${t.firstLoan} ${stageTitle} ${t.placeholderPeriod}`}
                          type="number"
                          placeholder={t.placeholderPeriod}
                          value={stg.durationValue ?? ''}
                          onChange={e => {
                            const next = [...stages1];
                            next[sIdx].durationValue = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                            setStages1(next);
                          }}
                          className="w-full bg-transparent text-text-main text-sm py-1.5 outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]"
                        />
                        <label htmlFor={stageDurationId} className="text-xs text-text-sub ml-1 cursor-pointer">
                          {t.unitYear}
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-text-sub px-2">{t.untilExpiry}</div>
                    )}
                    <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                      <input
                        id={stageRateId}
                        aria-label={`${t.firstLoan} ${stageTitle} ${t.placeholderRate}`}
                        type="number"
                        step="0.01"
                        placeholder={t.placeholderRate}
                        value={stg.rate}
                        onChange={e => {
                          const next = [...stages1];
                          next[sIdx].rate = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                          setStages1(next);
                        }}
                        className="w-full bg-transparent text-text-main text-sm py-1.5 outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]"
                      />
                      <label htmlFor={stageRateId} className="text-xs text-text-sub ml-1 cursor-pointer">%</label>
                    </div>
                  </div>
                </div>
              );
            })}
            {stages1.length < 6 && (
              <button
                type="button"
                onClick={addStage1}
                className={`text-xs ${styles.accentText} ${styles.activeScheme} py-1.5 rounded-lg transition-all cursor-pointer`}
              >
                {t.addRateStage}
              </button>
            )}
          </div>
        )}

        {/* 還款方式 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">{t.repayTypeLabel}</span>
          <div className={`grid grid-cols-2 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl`}>
            <button
              type="button"
              onClick={() => setRepayType1('equal-total')}
              className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                repayType1 === 'equal-total'
                  ? styles.activeScheme
                  : 'border-transparent text-text-sub hover:text-text-main'
              }`}
            >
              {t.equalTotal}
            </button>
            <button
              type="button"
              onClick={() => setRepayType1('equal-principal')}
              className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                repayType1 === 'equal-principal'
                  ? styles.activeScheme
                  : 'border-transparent text-text-sub hover:text-text-main'
              }`}
            >
              {t.equalPrincipal}
            </button>
          </div>
        </div>

        {/* 開辦手續費 */}
        <div className="flex flex-col gap-1">
          <label htmlFor={idFee1} className="text-xs font-medium text-text-sub uppercase tracking-[1px]">
            {t.originationFeeLabel}
          </label>
          <input
            id={idFee1}
            aria-label={`${t.firstLoan} ${t.originationFeeLabel}`}
            type="text"
            inputMode="numeric"
            value={fee1 === '' ? '' : fee1.toLocaleString('zh-TW')}
            onChange={e => {
              const raw = e.target.value.replace(/[^\d]/g, '');
              setFee1(raw === '' ? '' : parseInt(raw, 10));
            }}
            className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
          />
        </div>
      </div>

      {/* 貸款 B 卡片 */}
      <div className={styles.subCard}>
        <div className="flex justify-between items-center">
          <input
            id={idLoanName2}
            aria-label={`${t.secondLoan} ${t.loanNameLabel || '名稱'}`}
            type="text"
            value={loanName2}
            onChange={e => setLoanName2(e.target.value)}
            className={`bg-transparent border-b border-dashed border-amber-500/40 ${styles.interestText} text-sm font-semibold outline-none px-1 py-0.5 focus-visible:ring-1 focus-visible:ring-amber-500/50 rounded`}
          />
          <span className={`text-xs bg-amber-500/15 border border-amber-500/30 ${styles.interestText} px-2 py-0.5 rounded-md font-mono`}>
            {t.secondLoan}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={idLoanAmount2} className="text-sm font-medium text-text-sub">
            {t.loanAmountLabel}
          </label>
          <input
            id={idLoanAmount2}
            aria-label={`${t.secondLoan} ${t.loanAmountLabel}`}
            type="number"
            value={loanAmount2}
            onChange={e => {
              const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
              const amtB = typeof val === 'number' ? Math.min(val, totalLoan) : 0;
              setLoanAmount2(val);
              setLoanAmount1(Math.max(0, totalLoan - amtB));
            }}
            className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={idPeriodVal2} className="text-sm font-medium text-text-sub">
              {t.loanTermLabel}
            </label>
            <input
              id={idPeriodVal2}
              aria-label={`${t.secondLoan} ${t.loanTermLabel}`}
              type="number"
              value={periodVal2}
              onChange={e => setPeriodVal2(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={idGraceVal2} className="text-sm font-medium text-text-sub">
              {t.gracePeriodLabel}
            </label>
            <input
              id={idGraceVal2}
              aria-label={`${t.secondLoan} ${t.gracePeriodLabel}`}
              type="number"
              value={graceVal2}
              onChange={e => setGraceVal2(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
              className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
            />
          </div>
        </div>

        {/* 利率類型切換 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">{t.rateTypeLabel}</span>
          <div className={`grid grid-cols-2 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl`}>
            <button
              type="button"
              onClick={() => handleRateType2Change('single')}
              className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                rateType2 === 'single'
                  ? styles.activeScheme
                  : 'border-transparent text-text-sub hover:text-text-main'
              }`}
            >
              {t.singleRateMode}
            </button>
            <button
              type="button"
              onClick={() => handleRateType2Change('multi')}
              className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                rateType2 === 'multi'
                  ? styles.activeScheme
                  : 'border-transparent text-text-sub hover:text-text-main'
              }`}
            >
              {t.multiRateMode}
            </button>
          </div>
        </div>

        {rateType2 === 'single' ? (
          <div className="flex flex-col gap-1">
            <label htmlFor={idSingleRate2} className="text-sm font-medium text-text-sub">
              {t.annualRateLabel}
            </label>
            <input
              id={idSingleRate2}
              aria-label={`${t.secondLoan} ${t.annualRateLabel}`}
              type="number"
              step="0.001"
              value={singleRate2}
              onChange={e => setSingleRate2(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
              className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
            />
          </div>
        ) : (
          <div className={`flex flex-col gap-2.5 ${styles.subCard} p-3 rounded-xl border border-border-glass`}>
            <span className={`text-xs ${styles.accentText} font-medium`}>{t.multiRateSettings}</span>
            {stages2.map((stg, sIdx) => {
              const isLast = sIdx === stages2.length - 1;
              const stageDurationId2 = `${baseId}-stage2-${sIdx}-duration`;
              const stageRateId2 = `${baseId}-stage2-${sIdx}-rate`;
              const stageTitle2 = `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}`;
              return (
                <div key={sIdx} className={`flex flex-col gap-1.5 ${styles.divider} pb-2`}>
                  <div className="flex justify-between items-center text-xs font-medium text-text-sub">
                    <span>{isLast ? `${stageTitle2}${t.remainingPeriods}` : stageTitle2}</span>
                    {!isLast && stages2.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeStage2(sIdx)}
                        className="text-xs text-[#ef4444] hover:underline cursor-pointer"
                      >
                        {t.remove}
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {!isLast ? (
                      <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                        <input
                          id={stageDurationId2}
                          aria-label={`${t.secondLoan} ${stageTitle2} ${t.placeholderPeriod}`}
                          type="number"
                          placeholder={t.placeholderPeriod}
                          value={stg.durationValue ?? ''}
                          onChange={e => {
                            const next = [...stages2];
                            next[sIdx].durationValue = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                            setStages2(next);
                          }}
                          className="w-full bg-transparent text-text-main text-sm py-1.5 outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]"
                        />
                        <label htmlFor={stageDurationId2} className="text-xs text-text-sub ml-1 cursor-pointer">
                          {t.unitYear}
                        </label>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-text-sub px-2">{t.untilExpiry}</div>
                    )}
                    <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                      <input
                        id={stageRateId2}
                        aria-label={`${t.secondLoan} ${stageTitle2} ${t.placeholderRate}`}
                        type="number"
                        step="0.01"
                        placeholder={t.placeholderRate}
                        value={stg.rate}
                        onChange={e => {
                          const next = [...stages2];
                          next[sIdx].rate = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                          setStages2(next);
                        }}
                        className="w-full bg-transparent text-text-main text-sm py-1.5 outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]"
                      />
                      <label htmlFor={stageRateId2} className="text-xs text-text-sub ml-1 cursor-pointer">%</label>
                    </div>
                  </div>
                </div>
              );
            })}
            {stages2.length < 6 && (
              <button
                type="button"
                onClick={addStage2}
                className={`text-xs ${styles.accentText} ${styles.activeScheme} py-1.5 rounded-lg transition-all cursor-pointer`}
              >
                {t.addRateStage}
              </button>
            )}
          </div>
        )}

        {/* 還款方式 */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">{t.repayTypeLabel}</span>
          <div className={`grid grid-cols-2 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl`}>
            <button
              type="button"
              onClick={() => setRepayType2('equal-total')}
              className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                repayType2 === 'equal-total'
                  ? styles.activeScheme
                  : 'border-transparent text-text-sub hover:text-text-main'
              }`}
            >
              {t.equalTotal}
            </button>
            <button
              type="button"
              onClick={() => setRepayType2('equal-principal')}
              className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                repayType2 === 'equal-principal'
                  ? styles.activeScheme
                  : 'border-transparent text-text-sub hover:text-text-main'
              }`}
            >
              {t.equalPrincipal}
            </button>
          </div>
        </div>

        {/* 開辦手續費 */}
        <div className="flex flex-col gap-1">
          <label htmlFor={idFee2} className="text-xs font-medium text-text-sub uppercase tracking-[1px]">
            {t.originationFeeLabel}
          </label>
          <input
            id={idFee2}
            aria-label={`${t.secondLoan} ${t.originationFeeLabel}`}
            type="number"
            value={fee2}
            onChange={e => setFee2(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
            className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
          />
        </div>
      </div>
    </div>
  );
}

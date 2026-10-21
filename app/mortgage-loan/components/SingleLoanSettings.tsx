'use client';

import React from 'react';
import type { RateType, RepayType, Stage } from '../engine';
import styles from '../mortgage-loan.module.css';

interface SingleLoanSettingsProps {
  t: any;
  singlePeriodVal: number | '';
  setSinglePeriodVal: (v: number | '') => void;
  singleGraceVal: number | '';
  setSingleGraceVal: (v: number | '') => void;
  singleRateType: RateType;
  setSingleRateType: (v: RateType) => void;
  singleRate: number | '';
  setSingleRate: (v: number | '') => void;
  singleStages: Stage[];
  setSingleStages: React.Dispatch<React.SetStateAction<Stage[]>>;
  singleRepayType: RepayType;
  setSingleRepayType: (v: RepayType) => void;
  singleFee: number | '';
  setSingleFee: (v: number | '') => void;
  addStageSingle: () => void;
  removeStageSingle: (idx: number) => void;
  singlePeriodInputId: string;
  singleGraceInputId: string;
  singleRateInputId: string;
  singleFeeInputId: string;
}

export default function SingleLoanSettings({
  t,
  singlePeriodVal,
  setSinglePeriodVal,
  singleGraceVal,
  setSingleGraceVal,
  singleRateType,
  setSingleRateType,
  singleRate,
  setSingleRate,
  singleStages,
  setSingleStages,
  singleRepayType,
  setSingleRepayType,
  singleFee,
  setSingleFee,
  addStageSingle,
  removeStageSingle,
  singlePeriodInputId,
  singleGraceInputId,
  singleRateInputId,
  singleFeeInputId,
}: SingleLoanSettingsProps) {
  return (
    <div className={`flex flex-col gap-5 ${styles.divider} pt-5`}>
      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor={singlePeriodInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.loanTermLabel}</label>
          <input
            id={singlePeriodInputId}
            aria-label={t.loanTermLabel}
            type="number"
            value={singlePeriodVal}
            onChange={e => setSinglePeriodVal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
            className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={singleGraceInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.gracePeriodLabel}</label>
          <input
            id={singleGraceInputId}
            aria-label={t.gracePeriodLabel}
            type="number"
            value={singleGraceVal}
            onChange={e => setSingleGraceVal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
            className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
          />
        </div>
      </div>

      {/* 利率類型 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.rateTypeLabel}</span>
        <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
          <button
            type="button"
            onClick={() => setSingleRateType('single')}
            className={`py-2 text-sm font-semibold rounded-xl cursor-pointer border ${
              singleRateType === 'single'
                ? styles.activeScheme
                : 'border-transparent text-text-sub hover:text-text-main'
            }`}
          >
            {t.singleRateMode}
          </button>
          <button
            type="button"
            onClick={() => setSingleRateType('multi')}
            className={`py-2 text-sm font-semibold rounded-xl cursor-pointer border ${
              singleRateType === 'multi'
                ? styles.activeScheme
                : 'border-transparent text-text-sub hover:text-text-main'
            }`}
          >
            {t.multiRateMode}
          </button>
        </div>
      </div>

      {singleRateType === 'single' ? (
        <div className="flex flex-col gap-2">
          <label htmlFor={singleRateInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">{t.annualRateLabel}</label>
          <input
            id={singleRateInputId}
            aria-label={t.annualRateLabel}
            type="number"
            step="0.01"
            value={singleRate}
            onChange={e => setSingleRate(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
            className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
          />
        </div>
      ) : (
        <div className={`flex flex-col gap-3 ${styles.subCard} p-4 rounded-xl`}>
          <span className={`text-xs ${styles.accentText} font-medium`}>{t.multiRateSettings}</span>
          {singleStages.map((stg, sIdx) => {
            const isLast = sIdx === singleStages.length - 1;
            const stageDurationId = `single-stage-${sIdx}-duration`;
            const stageRateId = `single-stage-${sIdx}-rate`;
            const stageTitle = `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}`;
            return (
              <div key={sIdx} className={`flex flex-col gap-2 ${styles.divider} pb-3`}>
                <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                  <span>{isLast ? `${stageTitle}${t.remainingPeriods}` : stageTitle}</span>
                  {!isLast && singleStages.length > 2 && (
                    <button
                      type="button"
                      onClick={() => removeStageSingle(sIdx)}
                      className="text-[0.75rem] text-[#ef4444] hover:underline cursor-pointer"
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
                        aria-label={`${stageTitle} ${t.placeholderPeriod}`}
                        type="number"
                        placeholder={t.placeholderPeriod}
                        value={stg.durationValue ?? ''}
                        onChange={e => {
                          const next = [...singleStages];
                          next[sIdx].durationValue = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                          setSingleStages(next);
                        }}
                        className="w-full bg-transparent text-text-main text-sm py-2 outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]"
                      />
                      <label htmlFor={stageDurationId} className="text-sm text-text-sub ml-1 cursor-pointer">
                        {t.unitYear}
                      </label>
                    </div>
                  ) : (
                    <div className="flex items-center text-sm text-text-sub px-2">{t.untilExpiry}</div>
                  )}
                  <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                    <input
                      id={stageRateId}
                      aria-label={`${stageTitle} ${t.placeholderRate}`}
                      type="number"
                      step="0.01"
                      placeholder={t.placeholderRate}
                      value={stg.rate}
                      onChange={e => {
                        const next = [...singleStages];
                        next[sIdx].rate = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                        setSingleStages(next);
                      }}
                      className="w-full bg-transparent text-text-main text-sm py-2 outline-none font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]"
                    />
                    <label htmlFor={stageRateId} className="text-sm text-text-sub ml-1 cursor-pointer">%</label>
                  </div>
                </div>
              </div>
            );
          })}
          {singleStages.length < 6 && (
            <button
              type="button"
              onClick={addStageSingle}
              className={`text-xs ${styles.accentText} ${styles.activeScheme} py-2 rounded-lg transition-all cursor-pointer`}
            >
              {t.addRateStage}
            </button>
          )}
        </div>
      )}

      {/* 還款方式 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.repayTypeLabel}</span>
        <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
          <button
            type="button"
            onClick={() => setSingleRepayType('equal-total')}
            className={`py-2 text-sm font-semibold rounded-xl cursor-pointer border ${
              singleRepayType === 'equal-total'
                ? styles.activeScheme
                : 'border-transparent text-text-sub hover:text-text-main'
            }`}
          >
            {t.equalTotal}
          </button>
          <button
            type="button"
            onClick={() => setSingleRepayType('equal-principal')}
            className={`py-2 text-sm font-semibold rounded-xl cursor-pointer border ${
              singleRepayType === 'equal-principal'
                ? styles.activeScheme
                : 'border-transparent text-text-sub hover:text-text-main'
            }`}
          >
            {t.equalPrincipal}
          </button>
        </div>
      </div>

      {/* 開辦費 */}
      <div className="flex flex-col gap-2">
        <label htmlFor={singleFeeInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">{t.originationFeeLabel}</label>
        <input
          id={singleFeeInputId}
          aria-label={t.originationFeeLabel}
          type="number"
          value={singleFee}
          onChange={e => setSingleFee(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
          className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono focus-visible:ring-1 focus-visible:ring-[var(--theme-color)]`}
        />
      </div>
    </div>
  );
}

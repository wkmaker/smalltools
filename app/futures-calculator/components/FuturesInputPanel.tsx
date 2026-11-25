'use client';

import { useId } from 'react';
import styles from '../futures-calculator.module.css';
import { D, toNumber } from '../../utils/decimal';
import {
  FUTURES_PRESETS,
  FuturesPosition,
  FuturesPresetId,
  FuturesTranslations,
} from './shared';

interface FuturesInputPanelProps {
  t: FuturesTranslations;
  selectedPreset: FuturesPresetId;
  position: FuturesPosition;
  indexPrice: number | '';
  quantity: number | '';
  capital: number | '';
  multiplier: number | '';
  initialMargin: number | '';
  maintMargin: number | '';
  numQty: number;
  numCapital: number;
  stressDropPct: number;
  totalInitMargin: number;
  onApplyScenario: (scenario: 'conservative' | 'standard' | 'alert') => void;
  onPresetSelect: (presetId: FuturesPresetId) => void;
  onPositionChange: (position: FuturesPosition) => void;
  onIndexPriceChange: (val: number | '') => void;
  onQuantityChange: (val: number | '') => void;
  onCapitalChange: (val: number | '') => void;
  onMultiplierChange: (val: number | '') => void;
  onInitialMarginChange: (val: number | '') => void;
  onMaintMarginChange: (val: number | '') => void;
  onSetCapitalPreset: (multiplierRatio: number) => void;
  onCopyShareLink: () => void;
  onCopySummaryText: () => void;
}

export default function FuturesInputPanel({
  t,
  selectedPreset,
  position,
  indexPrice,
  quantity,
  capital,
  multiplier,
  initialMargin,
  maintMargin,
  numQty,
  numCapital,
  stressDropPct,
  totalInitMargin,
  onApplyScenario,
  onPresetSelect,
  onPositionChange,
  onIndexPriceChange,
  onQuantityChange,
  onCapitalChange,
  onMultiplierChange,
  onInitialMarginChange,
  onMaintMarginChange,
  onSetCapitalPreset,
  onCopyShareLink,
  onCopySummaryText,
}: FuturesInputPanelProps) {
  const indexInputId = useId();
  const quantityInputId = useId();
  const capitalInputId = useId();
  const multInputId = useId();
  const initMarginInputId = useId();
  const maintMarginInputId = useId();

  return (
    <div className={`${styles.glassCard} p-8 flex flex-col gap-6 shadow-lg`}>
      <div className="flex flex-col gap-3 border-b border-border-glass pb-4">
        <h3 className={`text-sm ${styles.accentText} uppercase tracking-[1px] font-semibold`}>
          {t.sectionSettings}
        </h3>
        {/* 快速套用試算情境 Presets */}
        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-text-sub font-medium">{t.scenariosTitle}</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => onApplyScenario('conservative')}
              className={`${styles.chipBtn} ${
                selectedPreset === 'tmf' && numQty === 2 && numCapital === 72600 && stressDropPct === 0
                  ? styles.chipBtnActive
                  : ''
              }`}
            >
              {t.scenarioConservative}
            </button>
            <button
              type="button"
              onClick={() => onApplyScenario('standard')}
              className={`${styles.chipBtn} ${
                selectedPreset === 'mtx' && numQty === 1 && numCapital === 121000 && stressDropPct === 0
                  ? styles.chipBtnActive
                  : ''
              }`}
            >
              {t.scenarioStandard}
            </button>
            <button
              type="button"
              onClick={() => onApplyScenario('alert')}
              className={`${styles.chipBtn} ${
                selectedPreset === 'tx' && numQty === 1 && numCapital === 290400 && stressDropPct === 5
                  ? styles.chipBtnActive
                  : ''
              }`}
            >
              {t.scenarioAlert}
            </button>
          </div>
        </div>
      </div>

      {/* 商品規格選擇 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.presetLabel}</span>
        <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
          {FUTURES_PRESETS.map(p => {
            let presetName = p.name;
            if (p.id === 'tx') presetName = t.presetTx;
            if (p.id === 'mtx') presetName = t.presetMtx;
            if (p.id === 'tmf') presetName = t.presetTmf;
            if (p.id === 'custom') presetName = t.presetCustom;

            return (
              <button
                key={p.id}
                type="button"
                onClick={() => onPresetSelect(p.id)}
                className={`py-2 px-3 text-sm rounded-lg cursor-pointer transition-all border ${
                  selectedPreset === p.id
                    ? styles.activeScheme
                    : 'border-transparent text-text-sub hover:text-text-main'
                }`}
              >
                {presetName}
              </button>
            );
          })}
        </div>
      </div>

      {/* 自訂每點點值 */}
      {selectedPreset === 'custom' && (
        <div className="flex flex-col gap-2 bg-surface-glass p-4 rounded-xl border border-border-glass">
          <label htmlFor={multInputId} className={`text-sm ${styles.accentText} font-medium uppercase tracking-[1px]`}>
            {t.customPtValLabel}
          </label>
          <input
            id={multInputId}
            type="number"
            min="0"
            value={multiplier}
            onChange={e => onMultiplierChange(e.target.value === '' ? '' : Math.max(0, parseFloat(e.target.value) || 0))}
            className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-base outline-none font-mono`}
          />
        </div>
      )}

      {/* 多空部位切換 */}
      <div className="flex flex-col gap-2">
        <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.directionLabel}</span>
        <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1 rounded-xl`}>
          <button
            type="button"
            onClick={() => onPositionChange('long')}
            className={`py-2 text-sm rounded-lg cursor-pointer transition-all border ${
              position === 'long'
                ? styles.longBtnActive
                : 'border-transparent text-text-sub hover:text-text-main'
            }`}
          >
            {t.positionLong}
          </button>
          <button
            type="button"
            onClick={() => onPositionChange('short')}
            className={`py-2 text-sm rounded-lg cursor-pointer transition-all border ${
              position === 'short'
                ? styles.shortBtnActive
                : 'border-transparent text-text-sub hover:text-text-main'
            }`}
          >
            {t.positionShort}
          </button>
        </div>
      </div>

      {/* 成交點位、口數與準備本金 */}
      <div className={`flex flex-col gap-4 ${styles.divider} pt-4`}>
        <div className="flex flex-col gap-2">
          <label htmlFor={indexInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.indexLabel}</label>
          <input
            id={indexInputId}
            type="text"
            inputMode="numeric"
            placeholder={t.indexPlaceholder}
            value={indexPrice === '' ? '' : indexPrice.toLocaleString('zh-TW')}
            onChange={e => {
              const raw = e.target.value.replace(/[^\d]/g, '');
              onIndexPriceChange(raw === '' ? '' : parseInt(raw, 10));
            }}
            className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 max-sm:grid-cols-1">
          <div className="flex flex-col gap-2">
            <label htmlFor={quantityInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.qtyLabel}</label>
            <input
              id={quantityInputId}
              type="number"
              min="1"
              value={quantity}
              onChange={e => onQuantityChange(e.target.value === '' ? '' : Math.max(0, parseInt(e.target.value, 10) || 0))}
              className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
            />
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={capitalInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.capitalLabel}</label>
            <input
              id={capitalInputId}
              type="text"
              inputMode="numeric"
              value={capital === '' ? '' : capital.toLocaleString('zh-TW')}
              onChange={e => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                onCapitalChange(raw === '' ? '' : parseInt(raw, 10));
              }}
              className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
            />
          </div>
        </div>

        {/* 本金快捷帶入按鈕 (4 檔，依當前總原始保證金倍數動態高亮) */}
        <div className="grid grid-cols-2 gap-2">
          {(
            [
              { ratio: 1.0, label: t.capPreset10 },
              { ratio: 1.5, label: t.capPreset15 },
              { ratio: 2.0, label: t.capPreset20 },
              { ratio: 3.0, label: t.capPreset30 },
            ] as const
          ).map(item => {
            const targetCap = toNumber(D(totalInitMargin).times(item.ratio).dp(0));
            const isPresetActive = totalInitMargin > 0 && numCapital === targetCap;
            return (
              <button
                key={item.ratio}
                type="button"
                onClick={() => onSetCapitalPreset(item.ratio)}
                className={`${styles.chipBtn} py-2 px-2 text-xs font-mono ${
                  isPresetActive ? styles.chipBtnActive : ''
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* 單口保證金標準 (自由編輯) */}
      <div className={`grid grid-cols-2 gap-4 max-sm:grid-cols-1 ${styles.divider} pt-4`}>
        <div className="flex flex-col gap-2">
          <label htmlFor={initMarginInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.initMarginLabel}</label>
          <input
            id={initMarginInputId}
            type="text"
            inputMode="numeric"
            value={initialMargin === '' ? '' : initialMargin.toLocaleString('zh-TW')}
            onChange={e => {
              const raw = e.target.value.replace(/[^\d]/g, '');
              onInitialMarginChange(raw === '' ? '' : parseInt(raw, 10));
            }}
            className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor={maintMarginInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.maintMarginLabel}</label>
          <input
            id={maintMarginInputId}
            type="text"
            inputMode="numeric"
            value={maintMargin === '' ? '' : maintMargin.toLocaleString('zh-TW')}
            onChange={e => {
              const raw = e.target.value.replace(/[^\d]/g, '');
              onMaintMarginChange(raw === '' ? '' : parseInt(raw, 10));
            }}
            className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
          />
        </div>
      </div>

      {/* 分享功能雙按鈕：複製網址 + 複製文字摘要 */}
      <div className="flex flex-col gap-2.5 mt-2">
        <button
          type="button"
          onClick={onCopyShareLink}
          className={`w-full h-[42px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
            ${styles.activeScheme} rounded-xl transition-all duration-300 cursor-pointer`}
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
            <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
          </svg>
          {t.shareBtn}
        </button>
        <button
          type="button"
          onClick={onCopySummaryText}
          className="w-full h-[42px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
            bg-surface-glass border border-border-glass text-text-sub hover:text-text-main rounded-xl transition-all duration-300 cursor-pointer"
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
            <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
          </svg>
          {t.copySummaryBtn}
        </button>
      </div>
    </div>
  );
}

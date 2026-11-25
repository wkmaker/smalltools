'use client';

import { useId } from 'react';
import styles from '../pdf-compressor.module.css';
import { TRANSLATIONS } from '../translations';

type Translations = (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS];

interface CompressionControlsPanelProps {
  modePreset: 'low' | 'medium' | 'high';
  onApplyModePreset: (m: 'low' | 'medium' | 'high') => void;
  showAdvanced: boolean;
  onToggleAdvanced: () => void;
  quality: number;
  onQualityChange: (q: number) => void;
  maxDpi: number;
  onMaxDpiChange: (dpi: number) => void;
  t: Translations;
}

export default function CompressionControlsPanel({
  modePreset,
  onApplyModePreset,
  showAdvanced,
  onToggleAdvanced,
  quality,
  onQualityChange,
  maxDpi,
  onMaxDpiChange,
  t,
}: CompressionControlsPanelProps) {
  const maxDpiId = useId();
  const qualityRangeId = useId();

  return (
    <div className={`${styles.cardContainer} flex flex-col gap-4`}>
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-semibold text-text-main">{t.compressionPreset}</span>
          <div className={`${styles.innerBlock} p-1 flex gap-1 rounded-xl`}>
            <button
              type="button"
              onClick={() => onApplyModePreset('high')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
                modePreset === 'high' ? styles.modeBtnActive : styles.modeBtnInactive
              }`}
            >
              {t.modeHigh}
            </button>
            <button
              type="button"
              onClick={() => onApplyModePreset('medium')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
                modePreset === 'medium' ? styles.modeBtnActive : styles.modeBtnInactive
              }`}
            >
              {t.modeMedium}
            </button>
            <button
              type="button"
              onClick={() => onApplyModePreset('low')}
              className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold cursor-pointer transition-all ${
                modePreset === 'low' ? styles.modeBtnActive : styles.modeBtnInactive
              }`}
            >
              {t.modeLow}
            </button>
          </div>
        </div>

        <button
          type="button"
          onClick={onToggleAdvanced}
          className={`text-sm font-semibold hover:underline cursor-pointer flex items-center gap-1 ${styles.accentText}`}
        >
          {showAdvanced ? t.hideAdvanced : t.showAdvanced}
        </button>
      </div>

      {showAdvanced && (
        <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-6 pt-4 border-t border-border-glass">
          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <label htmlFor={qualityRangeId} className="text-text-sub font-medium">
                {t.qualityLabel}
              </label>
              <span className={`font-mono font-bold ${styles.accentText}`}>
                {Math.round(quality * 100)}%
              </span>
            </div>
            <input
              id={qualityRangeId}
              type="range"
              min={0.15}
              max={0.95}
              step={0.05}
              value={quality}
              onChange={(e) => onQualityChange(parseFloat(e.target.value))}
              className="accent-[#eab308] cursor-pointer"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between text-sm">
              <label htmlFor={maxDpiId} className="text-text-sub font-medium">
                {t.maxDpiLabel}
              </label>
              <span className={`font-mono font-bold ${styles.accentText}`}>{maxDpi} DPI</span>
            </div>
            <select
              id={maxDpiId}
              value={maxDpi}
              onChange={(e) => onMaxDpiChange(parseInt(e.target.value, 10))}
              className={styles.selectInput}
            >
              <option value={96}>{t.dpi96}</option>
              <option value={144}>{t.dpi144}</option>
              <option value={200}>{t.dpi200}</option>
            </select>
          </div>
        </div>
      )}
    </div>
  );
}

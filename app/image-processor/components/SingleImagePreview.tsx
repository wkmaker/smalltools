'use client';

import { useId } from 'react';
import styles from '../image-processor.module.css';
import { TRANSLATIONS } from '../translations';

type Translations = (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS];

interface SingleImagePreviewProps {
  beforeDataUrl: string;
  afterDataUrl: string;
  compSliderPos: number;
  onSliderPosChange: (pos: number) => void;
  t: Translations;
}

export default function SingleImagePreview({
  beforeDataUrl,
  afterDataUrl,
  compSliderPos,
  onSliderPosChange,
  t,
}: SingleImagePreviewProps) {
  const compRangeId = useId();

  return (
    <div className="flex flex-col gap-4 text-left">
      <div className="flex justify-between items-center border-b border-border-glass pb-3">
        <h4 className="text-sm font-bold text-text-main flex items-center gap-2">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className="text-[#d946ef] shrink-0">
            <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
          </svg>
          {t.compTitle}
        </h4>
      </div>

      <div className={styles.comparisonContainer}>
        {/* 原圖 */}
        {beforeDataUrl && (
          <img src={beforeDataUrl} alt={t.compBefore} className={`${styles.compImg} ${styles.compImgBefore}`} />
        )}
        {/* 處理後圖 (帶 clip-path) */}
        {afterDataUrl && (
          <img
            src={afterDataUrl}
            alt={t.compAfter}
            className={`${styles.compImg} ${styles.compImgAfter}`}
            style={{ clipPath: `inset(0 0 0 ${compSliderPos}%)` }}
          />
        )}

        {/* 分割線與按鈕 */}
        <div className={styles.compSeparator} style={{ left: `${compSliderPos}%` }} />
        <div className={styles.compButton} style={{ left: `${compSliderPos}%` }}>
          <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
            <path d="M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z" />
          </svg>
        </div>

        {/* 標籤 */}
        <div className={`${styles.compLabel} ${styles.compLabelBefore}`}>{t.compBefore}</div>
        <div className={`${styles.compLabel} ${styles.compLabelAfter}`}>{t.compAfter}</div>

        {/* 拖曳輸入條 */}
        <label htmlFor={compRangeId} className="sr-only">{t.srComp}</label>
        <input
          id={compRangeId}
          type="range"
          min="0"
          max="100"
          value={compSliderPos}
          onChange={(e) => onSliderPosChange(parseFloat(e.target.value))}
          aria-label={t.srComp}
          className={styles.compSlider}
        />
      </div>
    </div>
  );
}

'use client';

import React, { type RefObject } from 'react';
import type { PrizeItem, AwardTier, HistoryRecord } from '../types';
import styles from '../lucky-wheel.module.css';

interface StageViewProps {
  t: any;
  displayMode: 'wheel' | 'slot';
  enableAwardMode: boolean;
  awardTiers: AwardTier[];
  selectedAwardId: string;
  onSelectAwardId: (id: string) => void;
  onCloseAwardMode: () => void;
  activeAwardSelectId: string;
  previewCanvasRef: RefObject<HTMLCanvasElement | null>;
  slotStripItems: PrizeItem[];
  slotTranslateY: number;
  isSpinning: boolean;
  unfinishedPrizes: PrizeItem[];
  isAwardExhausted: boolean | undefined;
  drawCount: number;
  multiSpinProgress: {
    current: number;
    total: number;
    revealed: PrizeItem[];
  } | null;
  latestBatchRecords: HistoryRecord[];
  onStartSpin: () => void;
}

export default function StageView({
  t,
  displayMode,
  enableAwardMode,
  awardTiers,
  selectedAwardId,
  onSelectAwardId,
  onCloseAwardMode,
  activeAwardSelectId,
  previewCanvasRef,
  slotStripItems,
  slotTranslateY,
  isSpinning,
  unfinishedPrizes,
  isAwardExhausted,
  drawCount,
  multiSpinProgress,
  latestBatchRecords,
  onStartSpin,
}: StageViewProps) {
  const selectedAward = awardTiers.find((a) => a.id === selectedAwardId);
  const selectedAwardRemain = selectedAward ? Math.max(0, selectedAward.quantity - selectedAward.drawnCount) : 0;

  return (
    <div className="bg-surface-glass border border-border-glass rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-5 shadow-lg backdrop-blur-md min-w-0">
      {/* 若開啟尾牙雙抽模式，於轉盤正上方顯示「目前抽取獎項」切換列 */}
      {enableAwardMode && awardTiers.length > 0 && (
        <div className="w-full bg-select-bg border border-border-glass rounded-xl p-3 flex flex-wrap items-center justify-between gap-2">
          <label htmlFor={activeAwardSelectId} className={`text-xs sm:text-sm font-bold ${styles.accentText}`}>
            {t.currentAwardLabel}
          </label>
          <div className="flex items-center gap-2 flex-1 min-w-[180px] justify-end">
            <select
              id={activeAwardSelectId}
              value={selectedAwardId}
              onChange={(e) => onSelectAwardId(e.target.value)}
              className={`rounded-xl px-3 py-1.5 text-sm font-bold outline-none cursor-pointer flex-1 max-w-[240px] ${styles.selectInput}`}
            >
              {awardTiers.map((tier) => (
                <option key={tier.id} value={tier.id}>
                  {tier.name}
                </option>
              ))}
            </select>
            {selectedAward && (
              <span
                className={`text-xs font-mono font-bold px-2.5 py-1 rounded-lg shrink-0 ${
                  selectedAwardRemain === 0 ? styles.redTag : styles.emeraldTag
                }`}
              >
                {t.awardRemainFmt
                  .replace('{remain}', String(selectedAwardRemain))
                  .replace('{total}', String(selectedAward.quantity))}
              </span>
            )}
            <button
              type="button"
              aria-label={t.closeAwardModeBtn}
              onClick={onCloseAwardMode}
              className={`px-2 py-1 text-xs font-bold rounded-lg cursor-pointer shrink-0 ${styles.redTag}`}
              title={t.closeAwardModeBtn}
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {displayMode === 'wheel' ? (
        <div className={styles.wheelContainer}>
          <canvas ref={previewCanvasRef} width={800} height={800} className={styles.wheelCanvas} />
        </div>
      ) : (
        <div className={styles.slotWrapper}>
          <div className={styles.slotFrame}>
            <div className={styles.slotLights}>
              <span />
              <span />
              <span />
              <span />
            </div>
            <div className={styles.slotWindow}>
              <div className={styles.slotPayline} />
              <div className={styles.slotStrip} style={{ transform: `translateY(${slotTranslateY}px)` }}>
                {slotStripItems.length === 0 ? (
                  <div className={styles.slotCard}>
                    <span>{t.spinReadySlot}</span>
                  </div>
                ) : (
                  slotStripItems.map((item, idx) => (
                    <div key={idx} className={styles.slotCard}>
                      <div className={styles.slotCardDot} style={{ background: item.color }} />
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 抽獎啟動按鈕 */}
      <button
        type="button"
        onClick={onStartSpin}
        disabled={isSpinning || unfinishedPrizes.length === 0 || Boolean(isAwardExhausted)}
        className={`w-full max-w-[380px] h-[54px] font-bold text-base sm:text-lg rounded-xl cursor-pointer transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed ${styles.spinBtn}`}
      >
        <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" aria-hidden="true">
          <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46A7.93 7.93 0 0020 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74A7.93 7.93 0 004 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z" />
        </svg>
        {isSpinning
          ? multiSpinProgress
            ? t.multiSpinningFmt
                .replace('{current}', String(multiSpinProgress.current))
                .replace('{total}', String(multiSpinProgress.total))
            : t.spinning
          : unfinishedPrizes.length === 0
          ? t.allDrawn
          : isAwardExhausted
          ? t.awardExhausted
          : `${displayMode === 'wheel' ? t.spinWheelBtn : t.spinSlotBtn}${
              drawCount > 1 ? t.spinCountSuffix.replace('{n}', String(drawCount)) : ''
            }`}
      </button>

      {/* 連抽進行中：逐輪即時揭曉卡 */}
      {multiSpinProgress && (
        <div
          className="w-full bg-select-bg border border-border-glass rounded-xl p-3 flex flex-col gap-2"
          aria-live="polite"
        >
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-bold ${styles.accentText}`}>
              {t.multiRevealTitle
                .replace('{current}', String(multiSpinProgress.revealed.length))
                .replace('{total}', String(multiSpinProgress.total))}
            </span>
          </div>
          <div className="w-full h-1.5 rounded-full bg-surface-glass border border-border-glass overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                background: 'var(--theme-color)',
                width: `${(multiSpinProgress.revealed.length / multiSpinProgress.total) * 100}%`,
              }}
            />
          </div>
          <div className="flex flex-wrap gap-1.5 min-h-[30px]">
            {multiSpinProgress.revealed.map((w, idx) => (
              <span
                key={`${w.id}_${idx}`}
                className="px-2.5 py-1 rounded-lg bg-surface-glass border border-border-glass text-xs sm:text-sm font-bold text-text-main flex items-center gap-1.5"
              >
                <span className="text-xs font-mono text-text-sub">#{idx + 1}</span>
                {w.title}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 最新一批連抽得獎名單即時展示卡 */}
      {!multiSpinProgress && latestBatchRecords.length > 0 && (
        <div className="w-full bg-select-bg border border-border-glass rounded-xl p-3 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${styles.accentText}`}>
              {t.latestBatchLabel} ({latestBatchRecords.length})
            </span>
            {latestBatchRecords[0]?.awardName && (
              <span className={`text-xs px-2 py-0.5 rounded font-semibold ${styles.emeraldTag}`}>
                {latestBatchRecords[0].awardName}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {latestBatchRecords.map((rec, idx) => (
              <span
                key={rec.id}
                className="px-2.5 py-1 rounded-lg bg-surface-glass border border-border-glass text-xs sm:text-sm font-bold text-text-main flex items-center gap-1.5"
              >
                <span className="text-xs font-mono text-text-sub">#{idx + 1}</span>
                {rec.prizeTitle}
              </span>
            ))}
          </div>
        </div>
      )}

      <span className="text-xs text-text-sub text-center">{t.spacebarHint}</span>
    </div>
  );
}

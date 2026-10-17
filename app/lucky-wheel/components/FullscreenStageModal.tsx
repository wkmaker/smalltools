'use client';

import { useId } from 'react';
import { createPortal } from 'react-dom';
import type { PrizeItem, AwardTier, HistoryRecord, SpinSpeed } from '../types';
import type { LuckyWheelTranslations } from '../translations';
import styles from '../lucky-wheel.module.css';

interface FullscreenStageModalProps {
  t: LuckyWheelTranslations;
  displayMode: 'wheel' | 'slot';
  isSpinning: boolean;
  unfinishedPrizes: PrizeItem[];
  enableQuantityLimit: boolean;
  enableAwardMode: boolean;
  awardTiers: AwardTier[];
  selectedAwardId: string;
  spinSpeed: SpinSpeed;
  drawCount: number;
  multiSpinProgress: { current: number; total: number; revealed: PrizeItem[] } | null;
  history: HistoryRecord[];
  slotStripItems: PrizeItem[];
  slotTranslateY: number;
  fullscreenCanvasRef: React.RefObject<HTMLCanvasElement | null>;
  onSelectAwardId: (id: string) => void;
  onChangeSpinSpeed: (speed: SpinSpeed) => void;
  onChangeDrawCount: (count: number) => void;
  onStartSpin: () => void;
  onToggleBrowserFullscreen: () => void;
  onExitStage: () => void;
}

export default function FullscreenStageModal({
  t,
  displayMode,
  isSpinning,
  unfinishedPrizes,
  enableQuantityLimit,
  enableAwardMode,
  awardTiers,
  selectedAwardId,
  spinSpeed,
  drawCount,
  multiSpinProgress,
  history,
  slotStripItems,
  slotTranslateY,
  fullscreenCanvasRef,
  onSelectAwardId,
  onChangeSpinSpeed,
  onChangeDrawCount,
  onStartSpin,
  onToggleBrowserFullscreen,
  onExitStage,
}: FullscreenStageModalProps) {
  const stageAwardSelectId = useId();
  const stageSpeedSelectId = useId();
  const stageCountSelectId = useId();

  if (typeof document === 'undefined') return null;

  const selectedAward = awardTiers.find((a) => a.id === selectedAwardId);
  const selectedAwardRemain = selectedAward ? Math.max(0, selectedAward.quantity - selectedAward.drawnCount) : 0;
  const isAwardExhausted = enableAwardMode && selectedAward && selectedAwardRemain === 0;

  const latestBatchId = history[0]?.batchId;
  const latestBatchRecords = latestBatchId
    ? history.filter((r) => r.batchId === latestBatchId)
    : history.slice(0, 1);
  const latestBatchTitles = latestBatchRecords.map((r) => r.prizeTitle).join('、');
  const latestAwardSuffix = history[0]?.awardName ? ` (${history[0].awardName})` : '';

  return createPortal(
    <div className={styles.fullscreenStage}>
      {/* 獨立頂部列 */}
      <div className={styles.fullscreenHeader}>
        <div className="flex items-center gap-3 flex-wrap min-w-0">
          <div className="flex items-center gap-2 font-bold text-xs sm:text-sm tracking-wider uppercase">
            <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${styles.stageLiveDot}`} />
            <span>{displayMode === 'wheel' ? t.stageTitleWheel : t.stageTitleSlot}</span>
          </div>

          {/* 舞台內直接切換尾牙獎項 */}
          {enableAwardMode && awardTiers.length > 0 && (
            <div className="flex items-center gap-1.5">
              <label htmlFor={stageAwardSelectId} className="sr-only">
                {t.currentAwardLabel}
              </label>
              <select
                id={stageAwardSelectId}
                value={selectedAwardId}
                onChange={(e) => onSelectAwardId(e.target.value)}
                className={`rounded-xl px-2.5 py-1 text-xs sm:text-sm font-bold outline-none cursor-pointer ${styles.selectInput}`}
              >
                {awardTiers.map((tier) => {
                  const r = Math.max(0, tier.quantity - tier.drawnCount);
                  return (
                    <option key={tier.id} value={tier.id}>
                      {tier.name} ({t.remainLabel} {r})
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* 舞台內切換連抽人數與轉速 */}
          <div className="hidden sm:flex items-center gap-2">
            <label htmlFor={stageCountSelectId} className="sr-only">
              {t.drawCountLabel}
            </label>
            <select
              id={stageCountSelectId}
              value={drawCount}
              onChange={(e) => onChangeDrawCount(Number(e.target.value))}
              className={`rounded-xl px-2.5 py-1 text-xs sm:text-sm font-semibold outline-none cursor-pointer ${styles.selectInput}`}
            >
              <option value={1}>{t.drawSingle}</option>
              <option value={3}>{t.drawThree}</option>
              <option value={5}>{t.drawFive}</option>
              <option value={10}>{t.drawTen}</option>
            </select>

            <label htmlFor={stageSpeedSelectId} className="sr-only">
              {t.spinSpeedLabel}
            </label>
            <select
              id={stageSpeedSelectId}
              value={spinSpeed}
              onChange={(e) => onChangeSpinSpeed(e.target.value as SpinSpeed)}
              className={`rounded-xl px-2.5 py-1 text-xs sm:text-sm font-semibold outline-none cursor-pointer ${styles.selectInput}`}
            >
              <option value="fast">{t.speedFast}</option>
              <option value="normal">{t.speedNormal}</option>
              <option value="suspense">{t.speedSuspense}</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onToggleBrowserFullscreen}
            className={`px-3 py-1.5 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer hidden sm:flex items-center gap-1.5 ${styles.skyTag}`}
          >
            <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" aria-hidden="true">
              <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
            </svg>
            {t.browserFullscreenBtn}
          </button>
          <button
            type="button"
            onClick={onExitStage}
            className={`px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-bold rounded-xl transition-all cursor-pointer shadow-md shrink-0 ${styles.exitStageBtn}`}
          >
            {t.exitFullscreen}
          </button>
        </div>
      </div>

      {/* 舞台主要區域 */}
      <div className="flex-1 flex items-center justify-start md:justify-center gap-5 sm:gap-8 lg:gap-14 p-3 sm:p-6 w-full max-w-full overflow-y-auto max-md:flex-col box-border">
        {displayMode === 'wheel' ? (
          <div className={`${styles.fullscreenWheelWrapper} md:my-auto`}>
            <canvas ref={fullscreenCanvasRef} width={1600} height={1600} className="w-full h-full" />
            <button
              type="button"
              onClick={onStartSpin}
              disabled={isSpinning || unfinishedPrizes.length === 0 || Boolean(isAwardExhausted)}
              className={`absolute w-[min(18vh,165px)] h-[min(18vh,165px)] rounded-full font-extrabold text-[min(4.2vh,34px)] border-4 border-white hover:scale-105 transition-all cursor-pointer disabled:opacity-40 disabled:scale-100 min-w-[70px] min-h-[70px] ${styles.stageHeroSpinBtn}`}
            >
              {multiSpinProgress ? `${multiSpinProgress.current}/${multiSpinProgress.total}` : t.stageSpin}
            </button>
          </div>
        ) : (
          <div className={`${styles.slotWrapper} ${styles.fullscreenSlotWrapper} md:my-auto`}>
            <div className={styles.slotFrame} style={{ padding: '1.25rem', width: '100%' }}>
              <div className={styles.slotLights}>
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className={`${styles.slotWindow} ${styles.fullscreenSlotWindow}`}>
                <div className={styles.slotPayline} />
                <div className={styles.slotStrip} style={{ transform: `translateY(${slotTranslateY}px)` }}>
                  {slotStripItems.map((item, idx) => (
                    <div key={idx} className={styles.slotCard}>
                      <div className={styles.slotCardDot} style={{ background: item.color }} />
                      <span className="truncate">{item.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={onStartSpin}
              disabled={isSpinning || unfinishedPrizes.length === 0 || Boolean(isAwardExhausted)}
              className={`mt-4 sm:mt-6 px-12 sm:px-16 py-3.5 sm:py-4 text-[min(3.6vh,26px)] font-extrabold border-4 border-white rounded-full hover:scale-105 transition-all cursor-pointer disabled:opacity-40 flex items-center justify-center gap-2 ${styles.stageHeroSpinBtn}`}
            >
              <svg viewBox="0 0 24 24" width={26} height={26} fill="currentColor" aria-hidden="true">
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c2.2-.4 3.9-2.18 4.39-4.5A5.01 5.01 0 0021 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
              </svg>
              {multiSpinProgress ? `${multiSpinProgress.current}/${multiSpinProgress.total}` : t.stageSpin}
            </button>
          </div>
        )}

        {/* 全螢幕資訊側板 */}
        <div className={`${styles.fullscreenSidePanel} md:my-auto`}>
          <div className="flex items-center justify-between border-b border-border-glass pb-3 shrink-0">
            <span className={`text-base sm:text-lg uppercase tracking-widest font-bold ${styles.accentText}`}>
              {t.availableItems} ({unfinishedPrizes.length})
            </span>
            <span className="text-xs font-mono font-normal opacity-70">{t.liveList}</span>
          </div>

          <div className="flex flex-col gap-2 w-full max-h-[42vh] overflow-y-auto pr-1">
            {unfinishedPrizes.length === 0 ? (
              <span className="opacity-70 italic flex items-center justify-center gap-2 py-8 text-base font-medium">
                <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.emeraldTag}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                {t.allFinishedMsg}
              </span>
            ) : (
              unfinishedPrizes.map((p) => (
                <div key={p.id} className={styles.fullscreenSideItem}>
                  <div
                    className="w-3.5 h-3.5 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                    style={{ background: p.color, color: p.color }}
                  />
                  <span className="font-semibold text-sm sm:text-base truncate flex-1">{p.title}</span>
                  {enableQuantityLimit && (
                    <span className={`text-xs sm:text-sm font-mono font-bold px-2 py-0.5 rounded-lg shrink-0 ${styles.spinBtn}`}>
                      {t.remainLabel} {Math.max(0, p.quantity - p.drawnCount)}
                    </span>
                  )}
                </div>
              ))
            )}
          </div>

          {/* 上一位得獎者小卡（連抽進行中即時顯示已開出名單） */}
          <div className={styles.fullscreenWinnerCard}>
            <span className="text-xs sm:text-sm uppercase tracking-wider font-bold flex items-center gap-1.5 opacity-80">
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className={styles.accentText}>
                <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c2.2-.4 3.9-2.18 4.39-4.5A5.01 5.01 0 0021 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
              </svg>
              {multiSpinProgress
                ? t.multiRevealTitle
                    .replace('{current}', String(multiSpinProgress.current))
                    .replace('{total}', String(multiSpinProgress.total))
                : t.lastWinner}
            </span>
            <span className={`text-lg sm:text-xl font-extrabold font-mono tracking-wide break-words ${styles.accentText}`}>
              {multiSpinProgress
                ? multiSpinProgress.revealed.length > 0
                  ? multiSpinProgress.revealed.map((w, i) => `#${i + 1} ${w.title}`).join('、')
                  : t.spinning
                : history.length > 0
                ? `${latestBatchTitles}${latestAwardSuffix}`
                : t.noRecord}
            </span>
            <span className="text-xs text-text-sub">{t.spacebarHint}</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

'use client';

import React from 'react';
import type { SpinSpeed } from '../types';
import styles from '../lucky-wheel.module.css';

interface WheelControlsBarProps {
  t: any;
  displayMode: 'wheel' | 'slot';
  setDisplayMode: (mode: 'wheel' | 'slot') => void;
  drawCount: number;
  setDrawCount: (cnt: number) => void;
  spinSpeed: SpinSpeed;
  setSpinSpeed: (spd: SpinSpeed) => void;
  enableAwardMode: boolean;
  onToggleAwardMode: (enabled: boolean) => void;
  enableQuantityLimit: boolean;
  onToggleQuantityLimit: (enabled: boolean) => void;
  drawCountSelectId: string;
  speedSelectId: string;
  awardModeToggleId: string;
  qtyLimitToggleId: string;
}

export default function WheelControlsBar({
  t,
  displayMode,
  setDisplayMode,
  drawCount,
  setDrawCount,
  spinSpeed,
  setSpinSpeed,
  enableAwardMode,
  onToggleAwardMode,
  enableQuantityLimit,
  onToggleQuantityLimit,
  drawCountSelectId,
  speedSelectId,
  awardModeToggleId,
  qtyLimitToggleId,
}: WheelControlsBarProps) {
  return (
    <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3.5 bg-surface-glass border border-border-glass rounded-2xl p-3.5 sm:p-4 shadow-sm">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex bg-select-bg p-1 rounded-xl border border-border-glass">
          <button
            type="button"
            onClick={() => setDisplayMode('wheel')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm rounded-lg cursor-pointer transition-all font-semibold flex items-center justify-center gap-1.5 ${
              displayMode === 'wheel' ? styles.activeSegmentBtn : 'text-text-sub hover:text-text-main'
            }`}
          >
            {t.wheelMode}
          </button>
          <button
            type="button"
            onClick={() => setDisplayMode('slot')}
            className={`px-3.5 py-1.5 text-xs sm:text-sm rounded-lg cursor-pointer transition-all font-semibold flex items-center justify-center gap-1.5 ${
              displayMode === 'slot' ? styles.activeSegmentBtn : 'text-text-sub hover:text-text-main'
            }`}
          >
            {t.slotMode}
          </button>
        </div>

        {/* 連抽人數與轉速選擇 */}
        <div className="flex items-center gap-2 flex-wrap">
          <label htmlFor={drawCountSelectId} className="text-xs sm:text-sm font-medium text-text-sub">
            {t.drawCountLabel}
          </label>
          <select
            id={drawCountSelectId}
            value={drawCount}
            onChange={(e) => setDrawCount(Number(e.target.value))}
            className={`rounded-xl px-2.5 py-1.5 text-sm font-semibold outline-none cursor-pointer ${styles.selectInput}`}
          >
            <option value={1}>{t.drawSingle}</option>
            <option value={3}>{t.drawThree}</option>
            <option value={5}>{t.drawFive}</option>
            <option value={10}>{t.drawTen}</option>
          </select>

          <label htmlFor={speedSelectId} className="text-xs sm:text-sm font-medium text-text-sub ml-1">
            {t.spinSpeedLabel}
          </label>
          <select
            id={speedSelectId}
            value={spinSpeed}
            onChange={(e) => setSpinSpeed(e.target.value as SpinSpeed)}
            className={`rounded-xl px-2.5 py-1.5 text-sm font-semibold outline-none cursor-pointer ${styles.selectInput}`}
          >
            <option value="fast">{t.speedFast}</option>
            <option value="normal">{t.speedNormal}</option>
            <option value="suspense">{t.speedSuspense}</option>
          </select>
        </div>
      </div>

      {/* 數量限制與尾牙雙抽開關 */}
      <div className="flex flex-wrap items-center gap-4">
        <label htmlFor={awardModeToggleId} className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-text-main cursor-pointer">
          <input
            id={awardModeToggleId}
            type="checkbox"
            checked={enableAwardMode}
            onChange={(e) => onToggleAwardMode(e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer accent-amber-500 shrink-0"
          />
          {t.enableAwardMode}
        </label>

        <label htmlFor={qtyLimitToggleId} className="flex items-center gap-2 text-xs sm:text-sm font-medium text-text-sub cursor-pointer">
          <input
            id={qtyLimitToggleId}
            type="checkbox"
            checked={enableQuantityLimit}
            onChange={(e) => onToggleQuantityLimit(e.target.checked)}
            className="w-4 h-4 rounded cursor-pointer accent-amber-500 shrink-0"
          />
          {t.enableQtyLimit}
        </label>
      </div>
    </div>
  );
}

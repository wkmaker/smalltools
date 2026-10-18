'use client';

import React from 'react';
import type { HistoryRecord } from '../types';
import styles from '../lucky-wheel.module.css';

interface TopBannerControlsProps {
  t: any;
  history: HistoryRecord[];
  soundEnabled: boolean;
  onToggleSound: () => void;
  onOpenHistory: () => void;
  onShareUrl: () => void;
  onOpenFullscreen: () => void;
}

export default function TopBannerControls({
  t,
  history,
  soundEnabled,
  onToggleSound,
  onOpenHistory,
  onShareUrl,
  onOpenFullscreen,
}: TopBannerControlsProps) {
  const latestBatchId = history[0]?.batchId;
  const latestBatchRecords = latestBatchId
    ? history.filter((r) => r.batchId === latestBatchId)
    : history.slice(0, 1);
  const latestBatchTitles = latestBatchRecords.map((r) => r.prizeTitle).join('、');

  return (
    <div
      className={`rounded-2xl p-3.5 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4 shadow-lg min-w-0 ${styles.bannerGradient}`}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 max-w-full overflow-hidden">
        <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide shrink-0">
          {t.latestWinnerTag}
        </span>
        <span className="text-xs sm:text-sm font-medium flex items-center gap-1.5 min-w-0 truncate">
          <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" className={`shrink-0 ${styles.bannerTrophyIcon}`}>
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c2.2-.4 3.9-2.18 4.39-4.5A5.01 5.01 0 0021 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
          </svg>
          <span className="truncate">
            {history.length > 0
              ? `${t.justWon}${latestBatchTitles}${history[0].awardName ? ` (${history[0].awardName})` : ''}`
              : t.welcomeMsg}
          </span>
        </span>
      </div>

      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-2.5 w-full sm:w-auto min-w-0">
        <button
          type="button"
          onClick={onOpenHistory}
          className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-white/20 border border-white/40 rounded-xl hover:bg-white/30 transition-all cursor-pointer text-white flex items-center justify-center gap-1.5 whitespace-nowrap min-w-0"
        >
          <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
            <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
          </svg>
          <span className="truncate">
            {t.historyBtn} ({history.length})
          </span>
        </button>
        <button
          type="button"
          onClick={onShareUrl}
          className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-white/20 border border-white/40 rounded-xl hover:bg-white/30 transition-all cursor-pointer text-white flex items-center justify-center gap-1.5 whitespace-nowrap min-w-0"
        >
          <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
            <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3s1.34 3 3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z" />
          </svg>
          <span className="truncate">{t.shareLinkBtn}</span>
        </button>
        <button
          type="button"
          onClick={onToggleSound}
          className="px-3 py-1.5 text-xs sm:text-sm font-medium bg-white/20 border border-white/40 rounded-xl hover:bg-white/30 transition-all cursor-pointer text-white flex items-center justify-center gap-1.5 whitespace-nowrap min-w-0"
        >
          <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
            <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
          </svg>
          <span className="truncate">{soundEnabled ? t.soundOn : t.soundOff}</span>
        </button>
        <button
          type="button"
          onClick={onOpenFullscreen}
          className="px-3.5 py-1.5 text-xs sm:text-sm font-bold bg-white text-slate-950 rounded-xl hover:bg-slate-100 shadow-md transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap min-w-0"
        >
          <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" className="shrink-0">
            <path d="M7 14H5v5h5v-2H7v-3zm-2-4h2V7h3V5H5v5zm12 7h-3v2h5v-5h-2v3zM14 5v2h3v3h2V5h-5z" />
          </svg>
          <span className="truncate">{t.fullscreenBtn}</span>
        </button>
      </div>
    </div>
  );
}

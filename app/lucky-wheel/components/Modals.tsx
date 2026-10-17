'use client';

import type { PrizeItem, HistoryRecord } from '../types';
import type { LuckyWheelTranslations } from '../translations';
import styles from '../lucky-wheel.module.css';

interface WinnerModalProps {
  t: LuckyWheelTranslations;
  lang: 'zh-TW' | 'en';
  winners: PrizeItem[];
  awardName?: string;
  timestamp: number;
  onConfirm: () => void;
  onAbandonRedraw: () => void;
}

export function WinnerModal({
  t,
  lang,
  winners,
  awardName,
  timestamp,
  onConfirm,
  onAbandonRedraw,
}: WinnerModalProps) {
  if (winners.length === 0) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.congrats}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-[25000] flex items-center justify-center p-4 animate-fade-in"
    >
      <div className="bg-select-bg border-2 border-[var(--theme-color)] rounded-3xl w-full max-w-xl p-6 sm:p-8 flex flex-col items-center gap-5 text-center shadow-[0_0_80px_rgba(245,158,11,0.45)] max-h-[90vh] overflow-y-auto">
        <div
          className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center shrink-0 shadow-[0_0_30px_rgba(245,158,11,0.4)] ${styles.spinBtn}`}
        >
          <svg viewBox="0 0 24 24" width={38} height={38} fill="currentColor" aria-hidden="true">
            <path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0011 15.9V19H7v2h10v-2h-4v-3.1c2.2-.4 3.9-2.18 4.39-4.5A5.01 5.01 0 0021 8V7c0-1.1-.9-2-2-2zM5 8V7h2v3.82C5.84 10.4 5 9.3 5 8zm14 0c0 1.3-.84 2.4-2 2.82V7h2v1z" />
          </svg>
        </div>

        <div className="flex flex-col items-center gap-2 w-full min-w-0">
          <span className={`text-xs uppercase tracking-widest font-bold ${styles.accentText}`}>{t.congrats}</span>

          {awardName && (
            <span className={`px-3 py-1 rounded-full text-xs sm:text-sm font-bold ${styles.emeraldTag}`}>
              {awardName}
            </span>
          )}

          {winners.length === 1 ? (
            <h2 className="text-2xl sm:text-3xl font-extrabold text-text-main break-words max-w-full">
              {winners[0].title}
            </h2>
          ) : (
            <div className="w-full flex flex-col gap-2.5 mt-1">
              <p className="text-xs sm:text-sm text-text-sub font-medium">
                {t.batchResultSubtitle.replace('{n}', String(winners.length))}
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[240px] overflow-y-auto p-1">
                {winners.map((w, idx) => (
                  <div
                    key={`${w.id}_${idx}`}
                    className="flex items-center gap-2.5 bg-surface-glass border border-border-glass rounded-xl px-3.5 py-2.5 text-left min-w-0"
                  >
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: w.color }}
                    />
                    <span className="text-sm sm:text-base font-bold text-text-main truncate flex-1">
                      {w.title}
                    </span>
                    <span className="text-xs font-mono text-text-sub shrink-0">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <span className="text-xs text-text-sub font-mono mt-1">
            {new Date(timestamp).toLocaleString(lang === 'en' ? 'en-US' : 'zh-TW', { hour12: false })}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full pt-1">
          <button
            type="button"
            onClick={onAbandonRedraw}
            className={`flex-1 py-3 px-4 font-bold text-sm rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${styles.redTag}`}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
              <path d="M12.5 8c-2.65 0-5.05.99-6.9 2.6L2 7v9h9l-3.62-3.62c1.39-1.16 3.16-1.88 5.12-1.88 3.54 0 6.55 2.31 7.6 5.5l2.37-.78C21.08 11.03 17.15 8 12.5 8z" />
            </svg>
            {t.abandonRedrawBtn}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 font-extrabold text-sm sm:text-base rounded-xl transition-all cursor-pointer shadow-lg ${styles.primaryConfirmBtn}`}
          >
            {t.continueSpin}
          </button>
        </div>
      </div>
    </div>
  );
}

interface HistoryModalProps {
  t: LuckyWheelTranslations;
  lang: 'zh-TW' | 'en';
  history: HistoryRecord[];
  onClose: () => void;
  onClearAll: () => void;
  onRevertRecord: (recordId: string) => void;
  onExportCsv: () => void;
  onCopyWinners: () => void;
}

export function HistoryModal({
  t,
  lang,
  history,
  onClose,
  onClearAll,
  onRevertRecord,
  onExportCsv,
  onCopyWinners,
}: HistoryModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t.historyModalTitle}
      className="fixed inset-0 bg-black/70 backdrop-blur-md z-[20000] flex items-center justify-center p-4"
    >
      <div className="bg-select-bg border border-border-glass rounded-2xl w-full max-w-xl p-5 sm:p-6 flex flex-col gap-4 text-left shadow-2xl">
        <div className="flex justify-between items-center border-b border-border-glass pb-3">
          <h3 className="text-base font-bold text-text-main flex items-center gap-2">
            <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className={styles.accentText}>
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
            </svg>
            {t.historyModalTitle} ({history.length})
          </h3>
          <button
            type="button"
            aria-label={t.close}
            onClick={onClose}
            className="text-text-sub text-lg hover:text-text-main transition-colors cursor-pointer px-1"
          >
            ✕
          </button>
        </div>

        {history.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={onExportCsv}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${styles.emeraldTag}`}
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" aria-hidden="true">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
              {t.exportCsvBtn}
            </button>
            <button
              type="button"
              onClick={onCopyWinners}
              className={`px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${styles.skyTag}`}
            >
              <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" aria-hidden="true">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
              {t.copyWinnersBtn}
            </button>
          </div>
        )}

        <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto font-mono text-xs">
          {history.length === 0 ? (
            <span className="text-text-sub text-center py-8 text-sm">{t.noHistory}</span>
          ) : (
            history.map((rec, idx) => (
              <div
                key={rec.id}
                className="flex flex-wrap justify-between items-center gap-2 bg-surface-glass px-3.5 py-2.5 rounded-xl border border-border-glass min-w-0"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="text-xs text-text-sub shrink-0">#{history.length - idx}</span>
                  <span className="font-sans text-sm text-text-main font-bold truncate">{rec.prizeTitle}</span>
                  {rec.awardName && (
                    <span className={`font-sans text-xs px-2 py-0.5 rounded-md font-semibold shrink-0 ${styles.emeraldTag}`}>
                      {rec.awardName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-auto">
                  <span className="text-text-sub text-xs">
                    {new Date(rec.timestamp).toLocaleTimeString(lang === 'en' ? 'en-US' : 'zh-TW', {
                      hour12: false,
                    })}
                  </span>
                  <button
                    type="button"
                    onClick={() => onRevertRecord(rec.id)}
                    className={`font-sans text-xs px-2 py-1 rounded-lg font-medium cursor-pointer transition-all ${styles.redTag}`}
                  >
                    {t.revertSingleBtn}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-between gap-3 pt-2 border-t border-border-glass">
          <button
            type="button"
            disabled={history.length === 0}
            onClick={onClearAll}
            className={`px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-xl transition-all cursor-pointer disabled:opacity-40 ${styles.redTag}`}
          >
            {t.clearHistory}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs sm:text-sm font-medium text-text-main bg-select-bg border border-border-glass rounded-xl hover:bg-surface-glass transition-all cursor-pointer shadow-sm"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}

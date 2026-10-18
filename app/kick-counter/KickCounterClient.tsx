'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import KickChart, { type KickChartPoint } from './KickChart';
import styles from './kick-counter.module.css';
import { FAQ_ITEMS, TRANSLATIONS, type Lang } from './translations';
import {
  markKick,
  countEpisodes,
  calculateSevenDayAverage,
  sanitizeKickSessions,
  formatTimeMs,
  formatMinutesNumber,
  fillTemplate,
  getRemainingMs,
  COMBO_THRESHOLD_MS,
  TARGET_COUNT_10,
  COUNT_10_LIMIT_MS,
  TIMED_1H_LIMIT_MS,
  type KickMode,
  type KickRecord,
  type KickSession,
} from './engine';

const STORAGE_KEY = 'smalltools_kick_counter_v1';
const ACCENT = '#fb7185';
const ACCENT_GLOW = 'rgba(251, 113, 133, 0.6)';

function formatCountdown(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) {
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function newId(prefix = 'k'): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

interface StoredKickData {
  history: KickSession[];
  activeSession: KickSession | null;
}

function loadState(): StoredKickData {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { history: [], activeSession: null };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const history = sanitizeKickSessions(parsed.history);
    let activeSession: KickSession | null = null;
    if (parsed.activeSession && typeof parsed.activeSession === 'object') {
      const sanitized = sanitizeKickSessions([parsed.activeSession]);
      if (sanitized.length > 0) activeSession = sanitized[0];
    }
    return { history, activeSession };
  } catch {
    return { history: [], activeSession: null };
  }
}

function saveState(data: StoredKickData) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // 儲存異常時靜默防崩潰
  }
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // fallback
  }
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

const IconCopy = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);
const IconHeart = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

export default function KickCounterClient({ lang = 'zh-TW' }: { lang?: Lang }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];
  const locale = lang === 'en' ? 'en-US' : 'zh-TW';

  const [mode, setMode] = useState<KickMode>('count10');
  const [history, setHistory] = useState<KickSession[]>([]);
  const [activeSession, setActiveSession] = useState<KickSession | null>(null);
  const [now, setNow] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', ACCENT);
    document.documentElement.style.setProperty('--accent-glow', ACCENT_GLOW);
  }, []);

  // 初次載入與跨分頁同步
  useEffect(() => {
    const current = Date.now();
    const stored = loadState();
    setHistory(stored.history);
    setActiveSession(stored.activeSession);
    if (stored.activeSession) setMode(stored.activeSession.mode);
    setNow(current);
    setHydrated(true);

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = loadState();
      setHistory(next.history);
      setActiveSession(next.activeSession);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (hydrated) saveState({ history, activeSession });
  }, [history, activeSession, hydrated]);

  // 測量進行中計時器
  useEffect(() => {
    if (!hydrated || !activeSession) return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [activeSession, hydrated]);

  // 1 小時定時模式滿 60 分鐘自動結算
  useEffect(() => {
    if (!activeSession || activeSession.mode !== 'timed1h') return;
    const elapsed = (now || Date.now()) - activeSession.startTime;
    if (elapsed >= TIMED_1H_LIMIT_MS) {
      const finalSession: KickSession = {
        ...activeSession,
        endTime: activeSession.startTime + TIMED_1H_LIMIT_MS,
        durationMs: TIMED_1H_LIMIT_MS,
        targetReached: activeSession.validEpisodes >= 3,
      };
      setHistory((prev) => [finalSession, ...prev]);
      setActiveSession(null);
    }
  }, [activeSession, now]);

  // 操作控制
  const startSession = () => {
    const start = Date.now();
    const newSession: KickSession = {
      id: newId('sess'),
      mode,
      startTime: start,
      endTime: start,
      records: [],
      validEpisodes: 0,
      totalKicks: 0,
      durationMs: 0,
      targetReached: false,
    };
    setActiveSession(newSession);
    setNow(start);
  };

  const recordKick = () => {
    if (!activeSession) return;
    const current = Date.now();
    const lastRecord = activeSession.records[activeSession.records.length - 1];
    const lastTime = lastRecord ? lastRecord.timestamp : null;
    const newRecord = markKick(current, lastTime, newId('kick'));

    const updatedRecords = [...activeSession.records, newRecord];
    const { validEpisodes, comboCount } = countEpisodes(updatedRecords);
    const durationMs = current - activeSession.startTime;

    const reached = activeSession.mode === 'count10' ? validEpisodes >= TARGET_COUNT_10 : false;

    const updatedSession: KickSession = {
      ...activeSession,
      endTime: current,
      records: updatedRecords,
      validEpisodes,
      totalKicks: updatedRecords.length,
      durationMs,
      targetReached: reached,
    };

    if (reached) {
      // 數滿 10 次達標自動完成
      setHistory((prev) => [updatedSession, ...prev]);
      setActiveSession(null);
    } else {
      setActiveSession(updatedSession);
    }
    setNow(current);
  };

  const cancelSession = () => {
    setActiveSession(null);
  };

  // 衍生運算數據
  const isTiming = activeSession !== null;
  const currentElapsed = isTiming && now ? Math.max(0, now - activeSession.startTime) : 0;
  const remainingMs = isTiming && activeSession ? getRemainingMs(currentElapsed, activeSession.mode) : 0;
  const currentEpisodes = activeSession ? activeSession.validEpisodes : 0;
  const currentTotal = activeSession ? activeSession.totalKicks : 0;
  const currentCombos = activeSession ? currentTotal - currentEpisodes : 0;

  const lastKick = activeSession?.records[activeSession.records.length - 1];
  const isRecentCombo = Boolean(
    lastKick && lastKick.isCombo && now - lastKick.timestamp < COMBO_THRESHOLD_MS,
  );

  // 倒數歸零自動結算
  useEffect(() => {
    if (!activeSession) return;
    const elapsed = Math.max(0, now - activeSession.startTime);
    const limit = activeSession.mode === 'count10' ? COUNT_10_LIMIT_MS : TIMED_1H_LIMIT_MS;
    if (elapsed >= limit) {
      const finalSession: KickSession = {
        ...activeSession,
        endTime: activeSession.startTime + limit,
        durationMs: limit,
        targetReached:
          activeSession.mode === 'count10'
            ? activeSession.validEpisodes >= TARGET_COUNT_10
            : activeSession.validEpisodes >= 3,
      };
      setHistory((prev) => [finalSession, ...prev]);
      setActiveSession(null);
    }
  }, [now, activeSession]);

  const latestCompleted = history[0];

  const sevenDayAvg = useMemo(() => {
    return calculateSevenDayAverage(history, now || Date.now());
  }, [history, now]);

  // 圖表點位（過去 8 天數滿 10 次的耗時曲線）
  const chartPoints = useMemo<KickChartPoint[]>(() => {
    const list = [...history]
      .filter((s) => s.mode === 'count10' && s.targetReached)
      .slice(0, 8)
      .reverse();
    return list.map((s) => {
      const d = new Date(s.startTime);
      const m = d.getMonth() + 1;
      const day = d.getDate();
      const hh = String(d.getHours()).padStart(2, '0');
      const mm = String(d.getMinutes()).padStart(2, '0');
      return {
        dateLabel: `${m}/${day} ${hh}:${mm}`,
        minutes: Math.round((s.durationMs / 60000) * 10) / 10,
      };
    });
  }, [history, locale]);

  // 防慌口述小抄
  const stampFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
    [locale],
  );

  const cheatSentence = useMemo(() => {
    const targetSession = activeSession || latestCompleted;
    if (!targetSession || targetSession.records.length === 0) return '';
    const min = formatMinutesNumber(targetSession.durationMs);
    const { validEpisodes, comboCount } = countEpisodes(targetSession.records);
    if (targetSession.mode === 'count10') {
      if (sevenDayAvg !== null) {
        const daysLabel = sevenDayAvg.daysCount >= 7 ? (lang === 'en' ? '7' : '七') : String(sevenDayAvg.daysCount);
        return fillTemplate(t.summarySpokenCount10WithAvg, {
          min,
          total: targetSession.records.length,
          combo: comboCount,
          days: daysLabel,
          avg: sevenDayAvg.averageMinutes,
        });
      }
      return fillTemplate(t.summarySpokenCount10NoAvg, {
        min,
        total: targetSession.records.length,
        combo: comboCount,
      });
    }
    return fillTemplate(t.summarySpokenTimed1h, {
      episodes: validEpisodes,
      total: targetSession.records.length,
      combo: comboCount,
    });
  }, [activeSession, latestCompleted, sevenDayAvg, t, locale]);

  const handleCopy = async () => {
    if (!cheatSentence) return;
    const lines = [
      fillTemplate(t.copyHeader, { time: stampFmt.format(now || Date.now()) }),
      '',
      cheatSentence,
      '',
      `• 測量模式：${mode === 'count10' ? t.modeCount10 : t.modeTimed1h}`,
      sevenDayAvg !== null ? `• 前 ${sevenDayAvg.daysCount} 天平均耗時：${sevenDayAvg.averageMinutes} 分鐘` : null,
      '• 提醒：本紀錄為自主觀察輔助，不構成醫療診斷；若胎動明顯減少請立即就醫。',
    ].filter(Boolean);
    const ok = await copyText(lines.join('\n'));
    setCopyState(ok ? 'copied' : 'failed');
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopyState('idle'), 1800);
  };

  return (
    <ToolLayout title={t.title} subtitle={t.subtitle} description={t.description} accentColor={ACCENT} accentGlow={ACCENT_GLOW}>
      <div className={styles.container}>
        {/* ── 模式切換 ── */}
        <div className={styles.modeToggleBar}>
          <div className={styles.modeSegmented} role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'count10'}
              disabled={isTiming}
              onClick={() => setMode('count10')}
              className={`${styles.modeBtn} ${mode === 'count10' ? styles.modeBtnActive : ''}`}
            >
              {t.modeCount10}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'timed1h'}
              disabled={isTiming}
              onClick={() => setMode('timed1h')}
              className={`${styles.modeBtn} ${mode === 'timed1h' ? styles.modeBtnActive : ''}`}
            >
              {t.modeTimed1h}
            </button>
          </div>
        </div>

        <div className={styles.mainGrid}>
          {/* ── 左：大圓形計數按鈕 ── */}
          <section className={`${styles.glassCard} ${styles.kickCard}`}>
            {isTiming ? (
              <button
                type="button"
                onClick={recordKick}
                className={styles.bigKickBtn}
                aria-label={t.btnRecordKick}
              >
                <IconHeart />
                <span className={styles.btnPrimaryLabel}>{t.btnRecordKick}</span>
                <span className={styles.btnClock}>{formatCountdown(remainingMs)}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={startSession}
                className={styles.bigKickBtn}
                aria-label={t.btnStart}
              >
                <IconHeart />
                <span className={styles.btnPrimaryLabel}>{t.btnStart}</span>
              </button>
            )}

            {/* 圓圈下方的說明與連環踢提示 */}
            <div className={styles.underButtonHintArea}>
              {isRecentCombo ? (
                <div className={styles.comboNotice}>
                  <span className={styles.comboNoticeBadge}>COMBO</span>
                  <span>{t.tapHintCombo}</span>
                </div>
              ) : (
                <p className={styles.underButtonHint}>
                  {isTiming
                    ? t.tapHintActive
                    : mode === 'count10'
                    ? t.modeCount10Desc
                    : t.modeTimed1hDesc}
                </p>
              )}
            </div>

            {isTiming && (
              <div className={styles.actionRow}>
                <button type="button" onClick={cancelSession} className={styles.cancelTextBtn}>
                  {t.btnCancel}
                </button>
              </div>
            )}
          </section>

          {/* ── 右：狀態小卡與報備小抄 ── */}
          <div className={styles.rightCol}>
            <section className={styles.glassCard}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{t.statusTitle}</h2>
                <span className={styles.statusBadge}>
                  {isTiming ? t.inProgressBadge : latestCompleted?.targetReached ? t.targetReachedBadge : '待命'}
                </span>
              </div>

              <div className={styles.metricsGrid}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>{t.validEpisodes}</span>
                  <span className={styles.metricValue}>
                    <span className={styles.accentNum}>{currentEpisodes}</span>
                    <span className={styles.metricUnit}>{mode === 'count10' ? '/ 10 波' : '波'}</span>
                  </span>
                  <span className={styles.metricSub}>
                    {mode === 'count10' ? t.targetTextCount10 : t.targetTextTimed1h}
                  </span>
                </div>

                <div className={styles.metric}>
                  <span className={styles.metricLabel}>{t.totalTaps}</span>
                  <span className={styles.metricValue}>
                    <span>{currentTotal}</span>
                    <span className={styles.metricUnit}>下</span>
                  </span>
                  <span className={styles.metricSub}>{fillTemplate(t.comboTag, { n: currentCombos })}</span>
                </div>

                <div className={styles.metric}>
                  <span className={styles.metricLabel}>{t.sevenDayAvgLabel}</span>
                  <span className={styles.metricValue}>
                    {sevenDayAvg !== null ? (
                      <>
                        <span className={styles.accentNum}>{sevenDayAvg.averageMinutes}</span>
                        <span className={styles.metricUnit}>分</span>
                      </>
                    ) : (
                      <span className={styles.accentNum}>{t.sevenDayAvgCalculating}</span>
                    )}
                  </span>
                  <span className={styles.metricSub}>
                    {sevenDayAvg !== null
                      ? sevenDayAvg.daysCount >= 7
                        ? t.sevenDayAvgSubFull
                        : fillTemplate(t.sevenDayAvgSubPartial, { days: sevenDayAvg.daysCount })
                      : '記錄後自動計算'}
                  </span>
                </div>
              </div>
            </section>

            <section className={`${styles.glassCard} ${styles.cheatCard}`}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>{t.summaryTitle}</h2>
                  {cheatSentence && <p className={styles.cheatSub}>{t.summarySubtitle}</p>}
                </div>
                <button type="button" onClick={handleCopy} disabled={!cheatSentence} className={styles.copyBtn}>
                  {copyState === 'copied' ? <IconCheck /> : <IconCopy />}
                  {copyState === 'copied' ? t.copied : copyState === 'failed' ? t.copyFailed : t.copyBtn}
                </button>
              </div>

              {cheatSentence ? (
                <div className={styles.cheatBody}>
                  <div className={styles.cheatQuoteBox}>
                    <p className={styles.cheatSentence}>{cheatSentence}</p>
                  </div>
                </div>
              ) : (
                <p className={styles.emptyText}>{t.summaryEmpty}</p>
              )}
            </section>
          </div>
        </div>

        {/* ── 趨勢圖 ── */}
        <section className={styles.glassCard}>
          <h2 className={styles.cardTitle}>{t.chartTitle}</h2>
          {hydrated && chartPoints.length >= 2 ? (
            <div className={styles.chartBox}>
              <KickChart points={chartPoints} yAxisLabel={t.chartYAxis} />
            </div>
          ) : (
            <p className={styles.emptyText}>{t.chartEmpty}</p>
          )}
        </section>

        {/* ── 本次點擊紀錄 ── */}
        {activeSession && activeSession.records.length > 0 && (
          <section className={styles.glassCard}>
            <div className={styles.cardHeader}>
              <h2 className={styles.cardTitle}>{t.listTitle}</h2>
              <span className={styles.metricSub}>{activeSession.records.length} 筆點擊</span>
            </div>
            <div className={`${styles.listRow} ${styles.listHeader}`} aria-hidden="true">
              <span>{t.listHeaderTime}</span>
              <span>{t.listHeaderType}</span>
              <span>{t.listHeaderGap}</span>
            </div>
            <ul className={styles.list}>
              {[...activeSession.records].reverse().map((r) => {
                const timeFmt = new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
                return (
                  <li key={r.id} className={styles.listRow}>
                    <span className={styles.mono}>{timeFmt.format(r.timestamp)}</span>
                    <span>
                      <span className={r.isCombo ? styles.badgeCombo : styles.badgeEpisode}>
                        {r.isCombo ? t.listTypeCombo : t.listTypeEpisode}
                      </span>
                    </span>
                    <span className={styles.mono}>
                      {r.gapFromPrevMs !== null ? `${Math.round(r.gapFromPrevMs / 1000)} 秒` : t.listFirstKick}
                    </span>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <FaqSection items={FAQ_ITEMS[lang]} title={t.faqTitle} subtitle={t.faqSubtitle} accentColor={ACCENT} />
      </div>
    </ToolLayout>
  );
}

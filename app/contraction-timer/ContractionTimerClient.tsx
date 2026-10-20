'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import ContractionChart, { type ContractionChartLabels } from './ContractionChart';
import styles from './contraction-timer.module.css';
import { FAQ_ITEMS, TRANSLATIONS, type Lang, type Translation } from './translations';
import {
  analyzeContractions,
  buildChartPoints,
  classifyContraction,
  durationOf,
  fillTemplate,
  formatClock,
  formatHours,
  formatMinutes,
  formatSeconds,
  isValidContraction,
  pruneOld,
  sanitizeContractions,
  type Contraction,
  type ContractionStats,
} from './engine';

const STORAGE_KEY = 'smalltools_contraction_timer_v1';
const ACCENT = '#8b5cf6';
const ACCENT_GLOW = 'rgba(139, 92, 246, 0.6)';

interface StoredState {
  records: Contraction[];
  activeStart: number | null;
}

function loadState(now: number): StoredState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return { records: [], activeStart: null };
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const records = pruneOld(sanitizeContractions(parsed.records), now);
    const a = parsed.activeStart;
    // 進行中的計時超過 6 小時視為失效
    const activeStart = typeof a === 'number' && Number.isFinite(a) && now - a < 6 * 3600 * 1000 && a <= now ? a : null;
    return { records, activeStart };
  } catch {
    return { records: [], activeStart: null };
  }
}

function saveState(state: StoredState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // 無痕模式或儲存空間已滿時靜默略過，計時仍可在本次頁面中使用
  }
}

function newId(start: number): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  return `${start}-${Math.random().toString(36).slice(2, 10)}`;
}

function formatPatternDuration(ms: number, t: Translation): string {
  if (ms < 60 * 60 * 1000) return fillTemplate(t.durationMinutes, { m: Math.round(ms / 60000) });
  return fillTemplate(t.durationHours, { h: formatHours(ms) });
}

function regularityLabel(stats: ContractionStats, t: Translation): string {
  return stats.regularity === 'regular' ? t.regular : stats.regularity === 'fair' ? t.fair : t.irregular;
}

function buildCheatSentence(stats: ContractionStats, t: Translation): string {
  const vars = {
    min: formatMinutes(stats.medianIntervalMs),
    sec: formatSeconds(stats.medianDurationMs),
    duration: stats.patternDurationMs !== null ? formatPatternDuration(stats.patternDurationMs, t) : '',
  };
  return fillTemplate(stats.patternDurationMs !== null ? t.cheatSentence : t.cheatSentenceIrregular, vars);
}

function intervalTrendLabel(stats: ContractionStats, t: Translation): string | null {
  if (!stats.intervalTrend) return null;
  return stats.intervalTrend === 'closer' ? t.trendCloser : stats.intervalTrend === 'apart' ? t.trendApart : t.trendSteadyInterval;
}

function durationTrendLabel(stats: ContractionStats, t: Translation): string | null {
  if (!stats.durationTrend) return null;
  return stats.durationTrend === 'longer' ? t.trendLonger : stats.durationTrend === 'shorter' ? t.trendShorter : t.trendSteadyDuration;
}

async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // 退回 execCommand
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

// ── 向量圖示 ──────────────────────────────────────────────
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
const IconTrash = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);
const IconArrow = ({ dir }: { dir: 'up' | 'down' | 'flat' }) => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" aria-hidden="true">
    {dir === 'up' && <path d="M4 12l1.41 1.41L11 7.83V20h2V7.83l5.58 5.59L20 12l-8-8-8 8z" />}
    {dir === 'down' && <path d="M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z" />}
    {dir === 'flat' && <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />}
  </svg>
);
const IconSun = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
    <path d="M6.76 4.84l-1.8-1.79-1.41 1.41 1.79 1.79 1.42-1.41zM4 10.5H1v2h3v-2zm9-9.95h-2V3.5h2V.55zm7.45 3.91l-1.41-1.41-1.79 1.79 1.41 1.41 1.79-1.79zm-3.21 13.7l1.79 1.8 1.41-1.41-1.8-1.79-1.4 1.4zM20 10.5v2h3v-2h-3zm-8-5c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6zm-1 16.95h2V19.5h-2v2.95zm-7.45-3.91l1.41 1.41 1.79-1.8-1.41-1.41-1.79 1.8z" />
  </svg>
);
const IconMoon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
    <path d="M12.3 2a10 10 0 0 0-.19 20 10 10 0 0 0 8.7-5.07 1 1 0 0 0-1.02-1.43A7.5 7.5 0 0 1 10.5 6.2a7.5 7.5 0 0 1 4.3-6.63 1 1 0 0 0-.4-1.92 10.15 10.15 0 0 0-2.1-.2z" />
  </svg>
);

type WakeState = 'on' | 'off' | 'unsupported';

export default function ContractionTimerClient({ lang = 'zh-TW' }: { lang?: Lang }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];
  const locale = lang === 'en' ? 'en-US' : 'zh-TW';

  const [records, setRecords] = useState<Contraction[]>([]);
  const [activeStart, setActiveStart] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [hydrated, setHydrated] = useState(false);
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'failed'>('idle');
  const [confirmClear, setConfirmClear] = useState(false);
  const [wakeState, setWakeState] = useState<WakeState>('off');
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const wakeWantedRef = useRef(false);
  const copyTimerRef = useRef<number | null>(null);
  const clearTimerRef = useRef<number | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', ACCENT);
    document.documentElement.style.setProperty('--accent-glow', ACCENT_GLOW);
  }, []);

  // 初次掛載：從 localStorage 還原，並同步其他分頁的變更
  useEffect(() => {
    const current = Date.now();
    const state = loadState(current);
    setRecords(state.records);
    setActiveStart(state.activeStart);
    setNow(current);
    setHydrated(true);
    if (!('wakeLock' in navigator)) setWakeState('unsupported');

    const onStorage = (e: StorageEvent) => {
      if (e.key !== STORAGE_KEY) return;
      const next = loadState(Date.now());
      setRecords(next.records);
      setActiveStart(next.activeStart);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (hydrated) saveState({ records, activeStart });
  }, [records, activeStart, hydrated]);

  // 計時中每秒更新，閒置時每 15 秒更新（同時清理超過 6 小時的紀錄）
  useEffect(() => {
    if (!hydrated) return;
    const id = window.setInterval(() => setNow(Date.now()), activeStart !== null ? 1000 : 15000);
    return () => window.clearInterval(id);
  }, [activeStart, hydrated]);

  useEffect(() => {
    if (!hydrated || now === 0) return;
    setRecords((prev) => {
      const pruned = pruneOld(prev, now);
      return pruned.length === prev.length ? prev : pruned;
    });
  }, [now, hydrated]);

  // ── 螢幕常亮 ──
  const acquireWakeLock = useCallback(async () => {
    if (!('wakeLock' in navigator)) return;
    try {
      const sentinel = await navigator.wakeLock.request('screen');
      wakeLockRef.current = sentinel;
      setWakeState('on');
      sentinel.addEventListener('release', () => {
        wakeLockRef.current = null;
        setWakeState((s) => (s === 'unsupported' ? s : 'off'));
      });
    } catch {
      setWakeState('off');
    }
  }, []);

  const toggleWakeLock = useCallback(() => {
    if (wakeState === 'unsupported') return;
    if (wakeLockRef.current) {
      wakeWantedRef.current = false;
      void wakeLockRef.current.release();
    } else {
      wakeWantedRef.current = true;
      void acquireWakeLock();
    }
  }, [wakeState, acquireWakeLock]);

  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === 'visible' && wakeWantedRef.current && !wakeLockRef.current) {
        void acquireWakeLock();
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      void wakeLockRef.current?.release();
    };
  }, [acquireWakeLock]);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
    };
  }, []);

  // ── 操作 ──
  const handleMainButton = () => {
    const current = Date.now();
    setNow(current);
    if (activeStart === null) {
      setActiveStart(current);
      // 第一次開始計時就自動嘗試保持螢幕常亮（需在使用者手勢內請求）
      if (!wakeWantedRef.current && wakeState === 'off') {
        wakeWantedRef.current = true;
        void acquireWakeLock();
      }
    } else {
      const start = activeStart;
      setRecords((prev) => [...prev, { id: newId(start), start, end: current }]);
      setActiveStart(null);
    }
  };

  const handleCancel = () => setActiveStart(null);

  const handleDelete = (id: string) => setRecords((prev) => prev.filter((c) => c.id !== id));

  const handleClear = () => {
    if (!confirmClear) {
      setConfirmClear(true);
      if (clearTimerRef.current) window.clearTimeout(clearTimerRef.current);
      clearTimerRef.current = window.setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setRecords([]);
    setActiveStart(null);
    setConfirmClear(false);
  };

  // ── 衍生資料 ──
  const stats = useMemo(() => analyzeContractions(records, now), [records, now]);

  // 圖表以分鐘為單位刷新，避免計時中每秒重繪
  const chartNow = Math.floor(now / 60000) * 60000 + 60000;
  const chartPoints = useMemo(() => buildChartPoints(records, chartNow), [records, chartNow]);
  const chartLabels = useMemo<ContractionChartLabels>(
    () => ({
      interval: t.chartInterval,
      duration: t.chartDuration,
      rolling: t.chartRolling,
      minUnit: fillTemplate(t.minUnit, { n: '' }).trim(),
      secUnit: fillTemplate(t.secUnit, { n: '' }).trim(),
    }),
    [t],
  );

  const timeFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: '2-digit', minute: '2-digit', hour12: false }),
    [locale],
  );
  const stampFmt = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }),
    [locale],
  );

  const sortedDesc = useMemo(() => [...records].sort((a, b) => b.start - a.start), [records]);
  const intervalById = useMemo(() => {
    const map = new Map<string, number>();
    const valid = records.filter(isValidContraction).sort((a, b) => a.start - b.start);
    for (let i = 1; i < valid.length; i++) map.set(valid[i].id, valid[i].start - valid[i - 1].start);
    return map;
  }, [records]);

  const cheatSentence = stats.ready ? buildCheatSentence(stats, t) : '';
  const rangeText = stats.ready
    ? fillTemplate(t.rangeText, { min: formatMinutes(stats.minIntervalMs), max: formatMinutes(stats.maxIntervalMs) })
    : '';
  const iTrend = intervalTrendLabel(stats, t);
  const dTrend = durationTrendLabel(stats, t);

  const handleCopy = async () => {
    if (!stats.ready) return;
    const cleanSentence = cheatSentence.replace(/^[「"“]/, '').replace(/[」"”]$/, '');
    const lines = [
      fillTemplate(t.copyHeader, { time: stampFmt.format(now || Date.now()) }),
      '',
      fillTemplate(t.copySpoken, { sentence: cleanSentence }),
      '',
      `• ${fillTemplate(t.cheatPointFreq, { min: formatMinutes(stats.medianIntervalMs) })}`,
      `• ${fillTemplate(t.cheatPointDur, { sec: formatSeconds(stats.medianDurationMs) })}`,
      `• ${fillTemplate(t.cheatPointPattern, {
        duration: stats.patternDurationMs !== null ? formatPatternDuration(stats.patternDurationMs, t) : '—',
        reg: regularityLabel(stats, t),
      })}`,
    ];
    if (iTrend && dTrend) lines.push(`• ${fillTemplate(t.copyTrend, { interval: iTrend, duration: dTrend })}`);
    lines.push(`• ${fillTemplate(t.copyCounts, { n: stats.countLastHour })}`);
    lines.push(`• ${fillTemplate(t.copyRegularity, { label: regularityLabel(stats, t), range: rangeText })}`);

    const ok = await copyText(lines.join('\n'));
    setCopyState(ok ? 'copied' : 'failed');
    if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current);
    copyTimerRef.current = window.setTimeout(() => setCopyState('idle'), 1800);
  };

  const isActive = activeStart !== null;
  const elapsed = isActive && now ? now - activeStart : 0;
  const lastStart = stats.lastStartAt;
  const regClass =
    stats.regularity === 'regular' ? styles.regRegular : stats.regularity === 'fair' ? styles.regFair : styles.regIrregular;
  const trendDir = (v: string | null, upKey: string, downKey: string): 'up' | 'down' | 'flat' =>
    v === upKey ? 'up' : v === downKey ? 'down' : 'flat';

  return (
    <ToolLayout title={t.title} subtitle={t.subtitle} description={t.description} accentColor={ACCENT} accentGlow={ACCENT_GLOW}>
      <div className={styles.container}>
        <div className={styles.mainGrid}>
          {/* ── 左：計時按鈕 ── */}
          <section className={`${styles.glassCard} ${styles.timerCard}`}>
            <button
              type="button"
              onClick={handleMainButton}
              className={`${styles.bigBtn} ${isActive ? styles.bigBtnActive : ''}`}
              aria-pressed={isActive}
            >
              <span className={styles.bigBtnLabel}>{isActive ? t.btnStop : t.btnStart}</span>
              <span className={styles.bigBtnClock}>{formatClock(elapsed)}</span>
              <span className={styles.bigBtnHint}>{isActive ? t.btnStopHint : t.btnStartHint}</span>
            </button>

            <div className={styles.timerMeta}>
              {isActive ? (
                <button type="button" onClick={handleCancel} className={styles.ghostBtn}>
                  {t.btnCancel}
                </button>
              ) : hydrated && lastStart !== null ? (
                <p className={styles.sinceLast}>{fillTemplate(t.sinceLast, { min: formatMinutes(now - lastStart) })}</p>
              ) : (
                <p className={styles.sinceLast}>{t.noRecordYet}</p>
              )}
            </div>

            <button
              type="button"
              onClick={toggleWakeLock}
              disabled={wakeState === 'unsupported'}
              className={`${styles.wakeBtn} ${wakeState === 'on' ? styles.wakeOn : styles.wakeOff}`}
              aria-pressed={wakeState === 'on'}
            >
              {wakeState === 'on' ? (
                <IconSun />
              ) : (
                <IconMoon />
              )}
              <span>
                {wakeState === 'unsupported' ? t.wakeLockUnsupported : wakeState === 'on' ? t.wakeLockOn : t.wakeLockOff}
              </span>
              {wakeState !== 'unsupported' && (
                <span className={`${styles.statusDot} ${wakeState === 'on' ? styles.statusDotActive : ''}`} />
              )}
            </button>
          </section>

          {/* ── 右：狀態小卡 + 小抄 ── */}
          <div className={styles.rightCol}>
            <section className={styles.glassCard} aria-live="polite">
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>{t.statusTitle}</h2>
                {stats.ready && !stats.windowFull && (
                  <span className={styles.chip}>{fillTemplate(t.collecting, { n: stats.windowCount })}</span>
                )}
              </div>

              {stats.ready ? (
                <>
                  <p className={styles.statusHeadline}>
                    <span className={styles.accentText}>{fillTemplate(t.headlineFreq, { min: formatMinutes(stats.medianIntervalMs) })}</span>
                    <span className={styles.headlineSep} aria-hidden="true">·</span>
                    <span>{fillTemplate(t.headlineDur, { sec: formatSeconds(stats.medianDurationMs) })}</span>
                    <span className={styles.headlineSep} aria-hidden="true">·</span>
                    <span>
                      {stats.patternDurationMs !== null
                        ? fillTemplate(t.headlinePattern, { duration: formatPatternDuration(stats.patternDurationMs, t) })
                        : t.headlinePatternNone}
                    </span>
                  </p>

                  <div className={styles.metricsGrid}>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>{t.metricFreq}</span>
                      <span className={styles.metricValue}>
                        <span className={styles.accentText}>{formatMinutes(stats.medianIntervalMs)}</span>
                        <span className={styles.metricUnit}>{t.metricFreqUnit}</span>
                      </span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>{t.metricDur}</span>
                      <span className={styles.metricValue}>
                        {formatSeconds(stats.medianDurationMs)}
                        <span className={styles.metricUnit}>{t.metricDurUnit}</span>
                      </span>
                    </div>
                    <div className={styles.metric}>
                      <span className={styles.metricLabel}>{t.metricReg}</span>
                      <span className={`${styles.metricValue} ${regClass}`}>{regularityLabel(stats, t)}</span>
                      <span className={styles.metricSub}>{rangeText}</span>
                    </div>
                  </div>

                  <div className={styles.chipRow}>
                    <span className={styles.chipLabel}>{t.trendTitle}</span>
                    {iTrend && dTrend ? (
                      <>
                        <span className={styles.chip}>
                          <IconArrow dir={trendDir(stats.intervalTrend, 'closer', 'apart')} />
                          {iTrend}
                        </span>
                        <span className={styles.chip}>
                          <IconArrow dir={trendDir(stats.durationTrend, 'longer', 'shorter')} />
                          {dTrend}
                        </span>
                      </>
                    ) : (
                      <span className={styles.metricSub}>{t.trendPending}</span>
                    )}
                  </div>

                  <div className={styles.countsRow}>
                    <span>
                      {t.countLast10Min}　<strong>{fillTemplate(t.countUnit, { n: stats.countLast10Min })}</strong>
                    </span>
                    <span>
                      {t.countLastHour}　<strong>{fillTemplate(t.countUnit, { n: stats.countLastHour })}</strong>
                    </span>
                  </div>
                </>
              ) : (
                <p className={styles.emptyText}>
                  {fillTemplate(t.needMore, { n: Math.max(1, 3 - stats.windowCount) })}
                </p>
              )}
            </section>

            <section className={`${styles.glassCard} ${styles.cheatCard}`}>
              <div className={styles.cardHeader}>
                <div>
                  <h2 className={styles.cardTitle}>{t.cheatTitle}</h2>
                  {stats.ready && <p className={styles.cheatSub}>{t.cheatSubtitle}</p>}
                </div>
                <button type="button" onClick={handleCopy} disabled={!stats.ready} className={styles.copyBtn}>
                  {copyState === 'copied' ? <IconCheck /> : <IconCopy />}
                  {copyState === 'copied' ? t.copied : copyState === 'failed' ? t.copyFailed : t.copyBtn}
                </button>
              </div>

              {stats.ready ? (
                <div className={styles.cheatBody}>
                  <div className={styles.cheatQuoteBox}>
                    <p className={styles.cheatSentence}>{cheatSentence}</p>
                  </div>

                  <div className={styles.cheatKeyPoints}>
                    <p className={styles.keyPointsTitle}>{t.cheatPointsTitle}</p>
                    <ul className={styles.keyPointsList}>
                      <li>
                        <span className={styles.pointDot} />
                        <span>{fillTemplate(t.cheatPointFreq, { min: formatMinutes(stats.medianIntervalMs) })}</span>
                      </li>
                      <li>
                        <span className={styles.pointDot} />
                        <span>{fillTemplate(t.cheatPointDur, { sec: formatSeconds(stats.medianDurationMs) })}</span>
                      </li>
                      <li>
                        <span className={styles.pointDot} />
                        <span>
                          {fillTemplate(t.cheatPointPattern, {
                            duration: stats.patternDurationMs !== null ? formatPatternDuration(stats.patternDurationMs, t) : '—',
                            reg: regularityLabel(stats, t),
                          })}
                        </span>
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <p className={styles.emptyText}>{t.cheatEmpty}</p>
              )}
            </section>
          </div>
        </div>

        {/* ── 趨勢圖 ── */}
        <section className={styles.glassCard}>
          <h2 className={styles.cardTitle}>{t.chartTitle}</h2>
          {hydrated && chartPoints.length >= 2 ? (
            <div className={styles.chartBox}>
              <ContractionChart points={chartPoints} now={chartNow} labels={chartLabels} locale={locale} />
            </div>
          ) : (
            <p className={styles.emptyText}>{t.chartEmpty}</p>
          )}
        </section>

        {/* ── 紀錄清單 ── */}
        <section className={styles.glassCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>{t.listTitle}</h2>
            <span className={styles.metricSub}>{fillTemplate(t.listCount, { n: records.length })}</span>
          </div>

          {sortedDesc.length > 0 ? (
            <>
              <div className={`${styles.listRow} ${styles.listHeader}`} aria-hidden="true">
                <span>{t.colTime}</span>
                <span>{t.colDuration}</span>
                <span>{t.colInterval}</span>
                <span className={styles.srOnlyMobile}>{t.colAction}</span>
              </div>
              <ul className={styles.list}>
                {sortedDesc.map((c) => {
                  const flag = classifyContraction(c);
                  const interval = intervalById.get(c.id);
                  return (
                    <li key={c.id} className={`${styles.listRow} ${flag !== 'ok' ? styles.listRowMuted : ''}`}>
                      <span className={styles.mono}>{timeFmt.format(c.start)}</span>
                      <span className={styles.mono}>
                        {fillTemplate(t.secUnit, { n: formatSeconds(durationOf(c)) })}
                        {flag !== 'ok' && (
                          <span className={styles.flag}>{flag === 'tooShort' ? t.flagTooShort : t.flagTooLong}</span>
                        )}
                      </span>
                      <span className={styles.mono}>
                        {interval !== undefined ? fillTemplate(t.minUnit, { n: formatMinutes(interval) }) : '—'}
                      </span>
                      <span className={styles.rowAction}>
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className={styles.iconBtn}
                          aria-label={t.deleteRecord}
                          title={t.deleteRecord}
                        >
                          <IconTrash />
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>
              <div className={styles.listFooter}>
                <button type="button" onClick={handleClear} className={styles.clearBtn}>
                  <IconTrash />
                  {confirmClear ? t.clearConfirm : t.clearAll}
                </button>
              </div>
            </>
          ) : (
            <p className={styles.emptyText}>{t.noRecordYet}</p>
          )}
        </section>

        <FaqSection items={FAQ_ITEMS[lang]} title={t.faqTitle} subtitle={t.faqSubtitle} accentColor={ACCENT} />
      </div>
    </ToolLayout>
  );
}

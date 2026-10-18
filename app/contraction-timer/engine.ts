/**
 * 宮縮計時器運算引擎（純函數，無 DOM / React 依賴）
 * ──────────────────────────────────────────────────────────────
 * 名詞定義（依產科衛教慣例）：
 * - 持續（痛多久）：單次宮縮 end − start。
 * - 間隔（多久痛一次）：本次 start − 上次 start（開始到開始，不是結束到開始）。
 *
 * 計算流程：
 * 1. 只保留 6 小時內、且持續時間合理（10 秒 ~ 3 分鐘）的紀錄。
 * 2. 兩次宮縮間隔超過 30 分鐘視為中斷，只分析「最後一段連續紀錄」。
 * 3. 滑動視窗取最近 5 次宮縮（4 個間隔），以中位數抗漏按／手滑離群值。
 * 4. 規律度以間隔的變異係數 CV = 標準差 ÷ 平均 判斷。
 * 5. 規律已維持多久：由最新一筆往回掃，容許 1 筆離群，連續 2 筆不符即停止。
 * 6. 趨勢：目前視窗與前一個視窗的中位數比較，變化 ≥ 15% 才算有變化。
 */

export interface Contraction {
  id: string;
  /** 開始時間（epoch ms） */
  start: number;
  /** 結束時間（epoch ms） */
  end: number;
}

export type Regularity = 'regular' | 'fair' | 'irregular';
export type IntervalTrend = 'closer' | 'apart' | 'steady';
export type DurationTrend = 'longer' | 'shorter' | 'steady';
export type ContractionFlag = 'ok' | 'tooShort' | 'tooLong';

export const RETENTION_MS = 6 * 60 * 60 * 1000;
export const WINDOW_SIZE = 5;
export const MIN_FOR_STATS = 3;
export const MIN_VALID_DURATION_MS = 10 * 1000;
export const MAX_VALID_DURATION_MS = 3 * 60 * 1000;
export const BREAK_GAP_MS = 30 * 60 * 1000;

export const INTERVAL_TOLERANCE_RATIO = 0.25;
export const INTERVAL_TOLERANCE_MIN_MS = 90 * 1000;
export const DURATION_TOLERANCE_RATIO = 0.3;
export const DURATION_TOLERANCE_MIN_MS = 15 * 1000;

export const CV_REGULAR = 0.2;
export const CV_FAIR = 0.35;
export const TREND_THRESHOLD = 0.15;

// ── 基礎統計 ──────────────────────────────────────────────

export function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

export function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/** 母體標準差 */
export function stdDev(values: number[]): number {
  if (values.length === 0) return 0;
  const m = mean(values);
  return Math.sqrt(mean(values.map((v) => (v - m) ** 2)));
}

export function coefficientOfVariation(values: number[]): number {
  const m = mean(values);
  if (m <= 0) return 0;
  return stdDev(values) / m;
}

// ── 紀錄清理與分類 ────────────────────────────────────────

export function durationOf(c: Contraction): number {
  return c.end - c.start;
}

export function classifyContraction(c: Contraction): ContractionFlag {
  const d = durationOf(c);
  if (d < MIN_VALID_DURATION_MS) return 'tooShort';
  if (d > MAX_VALID_DURATION_MS) return 'tooLong';
  return 'ok';
}

export function isValidContraction(c: Contraction): boolean {
  return classifyContraction(c) === 'ok';
}

/** 移除超過 6 小時的紀錄並依開始時間排序 */
export function pruneOld(list: Contraction[], now: number): Contraction[] {
  const cutoff = now - RETENTION_MS;
  return list.filter((c) => c.start >= cutoff).sort((a, b) => a.start - b.start);
}

/** 防禦性解析 localStorage 內容，任何不合法的項目一律丟棄 */
export function sanitizeContractions(raw: unknown): Contraction[] {
  if (!Array.isArray(raw)) return [];
  const result: Contraction[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const { id, start, end } = item as Record<string, unknown>;
    if (typeof id !== 'string' || typeof start !== 'number' || typeof end !== 'number') continue;
    if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) continue;
    result.push({ id, start, end });
  }
  return result.sort((a, b) => a.start - b.start);
}

/** 取「最後一段連續紀錄」：遇到間隔超過 30 分鐘即視為中斷 */
export function currentSegment(valid: Contraction[]): Contraction[] {
  if (valid.length === 0) return [];
  let startIdx = valid.length - 1;
  while (startIdx > 0 && valid[startIdx].start - valid[startIdx - 1].start <= BREAK_GAP_MS) {
    startIdx--;
  }
  return valid.slice(startIdx);
}

function intervalsOf(list: Contraction[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < list.length; i++) out.push(list[i].start - list[i - 1].start);
  return out;
}

// ── 容許範圍 ──────────────────────────────────────────────

export function isIntervalWithinTolerance(value: number, reference: number): boolean {
  const tolerance = Math.max(reference * INTERVAL_TOLERANCE_RATIO, INTERVAL_TOLERANCE_MIN_MS);
  return Math.abs(value - reference) <= tolerance;
}

export function isDurationWithinTolerance(value: number, reference: number): boolean {
  const tolerance = Math.max(reference * DURATION_TOLERANCE_RATIO, DURATION_TOLERANCE_MIN_MS);
  return Math.abs(value - reference) <= tolerance;
}

export function classifyRegularity(cv: number): Regularity {
  if (cv <= CV_REGULAR) return 'regular';
  if (cv <= CV_FAIR) return 'fair';
  return 'irregular';
}

/**
 * 由最新一筆往回掃，找出符合目前規律的最早一筆，回傳其在 segment 中的索引。
 * 容許中間 1 筆離群（例如漏按），連續 2 筆不符即停止。
 */
export function findPatternStartIndex(
  segment: Contraction[],
  medianInterval: number,
  medianDuration: number,
): number {
  let startIdx = segment.length - 1;
  let misses = 0;
  for (let i = segment.length - 1; i >= 1; i--) {
    const interval = segment[i].start - segment[i - 1].start;
    const ok =
      isIntervalWithinTolerance(interval, medianInterval) &&
      isDurationWithinTolerance(durationOf(segment[i]), medianDuration);
    if (ok) {
      startIdx = i - 1;
      misses = 0;
    } else {
      misses++;
      if (misses >= 2) break;
    }
  }
  return startIdx;
}

function compareTrend(current: number, previous: number): 'up' | 'down' | 'steady' {
  if (previous <= 0) return 'steady';
  const ratio = current / previous;
  if (ratio >= 1 + TREND_THRESHOLD) return 'up';
  if (ratio <= 1 - TREND_THRESHOLD) return 'down';
  return 'steady';
}

// ── 主分析 ────────────────────────────────────────────────

export interface ContractionStats {
  /** 視窗內有效宮縮數量 */
  windowCount: number;
  /** 是否已達最低計算門檻（3 次） */
  ready: boolean;
  /** 是否已累積滿 5 次 */
  windowFull: boolean;
  medianIntervalMs: number;
  medianDurationMs: number;
  minIntervalMs: number;
  maxIntervalMs: number;
  cv: number;
  regularity: Regularity;
  /** 規律已維持毫秒數；不規律時為 null */
  patternDurationMs: number | null;
  /** 規律起點（epoch ms）；不規律時為 null */
  patternStartAt: number | null;
  intervalTrend: IntervalTrend | null;
  durationTrend: DurationTrend | null;
  /** 最近 60 分鐘有效宮縮次數 */
  countLastHour: number;
  /** 最近 10 分鐘有效宮縮次數 */
  countLast10Min: number;
  /** 最新一次宮縮開始時間 */
  lastStartAt: number | null;
}

export function analyzeContractions(list: Contraction[], now: number): ContractionStats {
  const valid = pruneOld(list, now).filter(isValidContraction);
  const segment = currentSegment(valid);
  const window = segment.slice(-WINDOW_SIZE);
  const windowIntervals = intervalsOf(window);
  const windowDurations = window.map(durationOf);

  const countLastHour = valid.filter((c) => c.start >= now - 60 * 60 * 1000).length;
  const countLast10Min = valid.filter((c) => c.start >= now - 10 * 60 * 1000).length;
  const lastStartAt = valid.length > 0 ? valid[valid.length - 1].start : null;

  const base: ContractionStats = {
    windowCount: window.length,
    ready: false,
    windowFull: window.length >= WINDOW_SIZE,
    medianIntervalMs: 0,
    medianDurationMs: 0,
    minIntervalMs: 0,
    maxIntervalMs: 0,
    cv: 0,
    regularity: 'irregular',
    patternDurationMs: null,
    patternStartAt: null,
    intervalTrend: null,
    durationTrend: null,
    countLastHour,
    countLast10Min,
    lastStartAt,
  };

  if (window.length < MIN_FOR_STATS) return base;

  const medianIntervalMs = median(windowIntervals);
  const medianDurationMs = median(windowDurations);
  const cv = coefficientOfVariation(windowIntervals);
  const regularity = classifyRegularity(cv);

  let patternDurationMs: number | null = null;
  let patternStartAt: number | null = null;
  if (regularity !== 'irregular') {
    const startIdx = findPatternStartIndex(segment, medianIntervalMs, medianDurationMs);
    patternStartAt = segment[startIdx].start;
    patternDurationMs = segment[segment.length - 1].start - patternStartAt;
  }

  // 趨勢：與「目前視窗之前」的同等長度資料比較
  // 間隔：目前 4 個 vs 前面 4 個（前面至少要 2 個）；持續：目前 5 次 vs 前面 5 次（前面至少要 3 次）
  let intervalTrend: IntervalTrend | null = null;
  let durationTrend: DurationTrend | null = null;
  if (window.length >= WINDOW_SIZE) {
    const segIntervals = intervalsOf(segment);
    const segDurations = segment.map(durationOf);
    const prevIntervals = segIntervals.slice(-(WINDOW_SIZE - 1) * 2, -(WINDOW_SIZE - 1));
    const prevDurations = segDurations.slice(-WINDOW_SIZE * 2, -WINDOW_SIZE);
    if (prevIntervals.length >= 2) {
      const iDir = compareTrend(medianIntervalMs, median(prevIntervals));
      intervalTrend = iDir === 'down' ? 'closer' : iDir === 'up' ? 'apart' : 'steady';
    }
    if (prevDurations.length >= MIN_FOR_STATS) {
      const dDir = compareTrend(medianDurationMs, median(prevDurations));
      durationTrend = dDir === 'up' ? 'longer' : dDir === 'down' ? 'shorter' : 'steady';
    }
  }

  return {
    ...base,
    ready: true,
    medianIntervalMs,
    medianDurationMs,
    minIntervalMs: Math.min(...windowIntervals),
    maxIntervalMs: Math.max(...windowIntervals),
    cv,
    regularity,
    patternDurationMs,
    patternStartAt,
    intervalTrend,
    durationTrend,
  };
}

// ── 圖表資料 ──────────────────────────────────────────────

export interface ChartPoint {
  at: number;
  /** 與上一次的間隔（分鐘）；第一筆或中斷後為 null */
  intervalMin: number | null;
  durationSec: number;
  /** 最近 4 個間隔的滾動中位數（分鐘） */
  rollingIntervalMin: number | null;
}

export function buildChartPoints(list: Contraction[], now: number): ChartPoint[] {
  const valid = pruneOld(list, now).filter(isValidContraction);
  const points: ChartPoint[] = [];
  let segmentIntervals: number[] = [];
  for (let i = 0; i < valid.length; i++) {
    const gap = i > 0 ? valid[i].start - valid[i - 1].start : null;
    const interval = gap !== null && gap <= BREAK_GAP_MS ? gap : null;
    if (interval === null) segmentIntervals = [];
    else segmentIntervals.push(interval);
    const recent = segmentIntervals.slice(-(WINDOW_SIZE - 1));
    points.push({
      at: valid[i].start,
      intervalMin: interval === null ? null : round1(interval / 60000),
      durationSec: Math.round(durationOf(valid[i]) / 1000),
      rollingIntervalMin: recent.length >= 2 ? round1(median(recent) / 60000) : null,
    });
  }
  return points;
}

// ── 格式化 ────────────────────────────────────────────────

export function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

/** 分鐘數，保留一位小數並去除多餘的 .0 */
export function formatMinutes(ms: number): string {
  return String(round1(ms / 60000));
}

export function formatSeconds(ms: number): string {
  return String(Math.round(ms / 1000));
}

/** 小時數，保留一位小數並去除多餘的 .0 */
export function formatHours(ms: number): string {
  return String(round1(ms / 3600000));
}

/** 計時器顯示 mm:ss */
export function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** {key} 具名插值 */
export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

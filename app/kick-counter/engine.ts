/**
 * 胎動計數器運算引擎（純函數，無 DOM / React 依賴）
 * ──────────────────────────────────────────────────────────────
 * 醫學核心原則（依 ACOG 與台灣國健署衛教指引）：
 * - 連環踢判定：寶寶連續的一陣翻滾、連續踢擊算同一波。
 *   兩次點擊間隔 < 2 分鐘（120 秒）自動標註為「連環踢 (Combo)」，計入總踢擊下數但不增加獨立有效波數。
 *   兩次點擊間隔 >= 2 分鐘，視為「新的一波有效胎動 (Episode)」。
 *
 * 兩種模式：
 * 1. 數到 10 次法 (Cardiff / Count to 10)：記錄有效胎動累積達 10 次所需的總耗時（分鐘）。一般建議 2 小時內達標。
 * 2. 1 小時定時法 (Sadovsky)：固定觀察 60 分鐘，記錄該小時內的有效胎動次數與總踢擊數。
 */

export interface KickRecord {
  id: string;
  /** 點擊時間點（epoch ms） */
  timestamp: number;
  /** 是否為連環踢（距離上一動 < 2 分鐘） */
  isCombo: boolean;
  /** 距離上一動的毫秒數，第一筆為 null */
  gapFromPrevMs: number | null;
}

export type KickMode = 'count10' | 'timed1h';

export interface KickSession {
  id: string;
  mode: KickMode;
  startTime: number;
  endTime: number;
  /** 期間所有點擊記錄 */
  records: KickRecord[];
  /** 有效波數（不含連環踢） */
  validEpisodes: number;
  /** 總點擊下數（含連環踢） */
  totalKicks: number;
  /** 耗時毫秒數 */
  durationMs: number;
  /** 是否達標（count10: validEpisodes >= 10; timed1h: durationMs >= 60m 且 validEpisodes >= 3） */
  targetReached: boolean;
}

export const COMBO_THRESHOLD_MS = 2 * 60 * 1000; // 2 分鐘 (120 秒)
export const TARGET_COUNT_10 = 10;
export const COUNT_10_LIMIT_MS = 2 * 60 * 60 * 1000; // 數滿 10 次法上限 2 小時 (120 分鐘)
export const TIMED_1H_LIMIT_MS = 60 * 60 * 1000; // 1 小時定時法上限 60 分鐘
export const TIMED_1H_MS = TIMED_1H_LIMIT_MS;
export const RETENTION_DAYS = 8; // 歷史紀錄保留 8 天（方便對比前 7 天平均）

/** 計算模式剩餘毫秒數（倒數） */
export function getRemainingMs(elapsedMs: number, mode: KickMode): number {
  const limit = mode === 'count10' ? COUNT_10_LIMIT_MS : TIMED_1H_LIMIT_MS;
  return Math.max(0, limit - elapsedMs);
}

export interface SevenDayAverageResult {
  averageMinutes: number;
  daysCount: number;
  sessionCount: number;
}

/** 計算前 7 天（或目前已累積天數）數滿 10 次的平均耗時（分鐘） */
export function calculateSevenDayAverage(
  history: KickSession[],
  baseTime = Date.now(),
): SevenDayAverageResult | null {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const sevenDaysAgo = baseTime - 7 * ONE_DAY_MS;
  const valid = history.filter(
    (s) => s.mode === 'count10' && s.targetReached && s.durationMs > 0 && s.startTime >= sevenDaysAgo
  );
  if (valid.length === 0) return null;
  const totalMs = valid.reduce((sum, s) => sum + s.durationMs, 0);
  const averageMinutes = Math.round((totalMs / valid.length / 60000) * 10) / 10;
  const uniqueDays = new Set(
    valid.map((s) => new Date(s.startTime).toLocaleDateString('en-US'))
  ).size;

  return {
    averageMinutes,
    daysCount: uniqueDays || valid.length,
    sessionCount: valid.length,
  };
}

// ── 連環踢與點擊標記 ──────────────────────────────────────

export function markKick(timestamp: number, lastKickTime: number | null, id: string): KickRecord {
  if (lastKickTime === null) {
    return { id, timestamp, isCombo: false, gapFromPrevMs: null };
  }
  const gap = timestamp - lastKickTime;
  const isCombo = gap > 0 && gap < COMBO_THRESHOLD_MS;
  return { id, timestamp, isCombo, gapFromPrevMs: gap >= 0 ? gap : null };
}

/** 統計一組點擊紀錄中的「有效波數」與「連環踢次數」 */
export function countEpisodes(records: KickRecord[]): { validEpisodes: number; comboCount: number } {
  let validEpisodes = 0;
  let comboCount = 0;
  for (const r of records) {
    if (r.isCombo) {
      comboCount++;
    } else {
      validEpisodes++;
    }
  }
  return { validEpisodes, comboCount };
}

// ── 統計與趨勢分析 ────────────────────────────────────────

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

export type VitalityStatus = 'active' | 'steady' | 'slower' | 'warning';

export interface VitalityAnalysis {
  /** 過去有效 Session 數量 */
  historyCount: number;
  /** 過去達標中位數時間（毫秒） */
  medianDurationMs: number | null;
  /** 本次狀態評估 */
  status: VitalityStatus;
  /** 相比於過去平均是偏快、持平還是偏慢 */
  ratioToMedian: number | null;
}

/**
 * 分析近期的胎動活力走勢（以 count10 模式的達標時間為主要評估）
 */
export function evaluateVitality(
  currentDurationMs: number,
  isTargetReached: boolean,
  history: KickSession[],
): VitalityAnalysis {
  // 只比對過去 14 天內達標的 count10 session
  const validHistory = history.filter((s) => s.mode === 'count10' && s.targetReached && s.durationMs > 0);
  
  if (validHistory.length < 2) {
    let status: VitalityStatus = 'steady';
    if (!isTargetReached && currentDurationMs > 90 * 60 * 1000) status = 'warning';
    else if (currentDurationMs <= 30 * 60 * 1000) status = 'active';
    return {
      historyCount: validHistory.length,
      medianDurationMs: null,
      status,
      ratioToMedian: null,
    };
  }

  const pastMed = median(validHistory.map((s) => s.durationMs));
  const ratio = pastMed > 0 ? currentDurationMs / pastMed : 1;

  let status: VitalityStatus = 'steady';
  if (!isTargetReached && currentDurationMs > 90 * 60 * 1000) {
    status = 'warning';
  } else if (ratio <= 0.75) {
    status = 'active'; // 明顯活潑迅速
  } else if (ratio >= 1.5) {
    status = 'slower'; // 偏慢，花比平常多 1.5 倍時間
  } else {
    status = 'steady'; // 與平日持平穩定
  }

  return {
    historyCount: validHistory.length,
    medianDurationMs: pastMed,
    status,
    ratioToMedian: Math.round(ratio * 100) / 100,
  };
}

// ── 防呆清洗與持久化 ──────────────────────────────────────

export function sanitizeKickSessions(raw: unknown): KickSession[] {
  if (!Array.isArray(raw)) return [];
  const list: KickSession[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const { id, mode, startTime, endTime, records, validEpisodes, totalKicks, durationMs, targetReached } =
      item as Record<string, unknown>;
    if (typeof id !== 'string' || typeof startTime !== 'number' || typeof endTime !== 'number') continue;
    if (mode !== 'count10' && mode !== 'timed1h') continue;
    const cleanRecords: KickRecord[] = [];
    if (Array.isArray(records)) {
      for (const r of records) {
        if (!r || typeof r !== 'object') continue;
        const rec = r as Record<string, unknown>;
        if (typeof rec.id === 'string' && typeof rec.timestamp === 'number') {
          cleanRecords.push({
            id: rec.id,
            timestamp: rec.timestamp,
            isCombo: Boolean(rec.isCombo),
            gapFromPrevMs: typeof rec.gapFromPrevMs === 'number' ? rec.gapFromPrevMs : null,
          });
        }
      }
    }
    list.push({
      id,
      mode,
      startTime,
      endTime,
      records: cleanRecords,
      validEpisodes: typeof validEpisodes === 'number' ? validEpisodes : cleanRecords.filter((r) => !r.isCombo).length,
      totalKicks: typeof totalKicks === 'number' ? totalKicks : cleanRecords.length,
      durationMs: typeof durationMs === 'number' ? durationMs : Math.max(0, endTime - startTime),
      targetReached: Boolean(targetReached),
    });
  }
  return list.sort((a, b) => b.startTime - a.startTime); // 最新在最前
}

// ── 格式化工具函式 ────────────────────────────────────────

export function formatTimeMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatMinutesNumber(ms: number): number {
  return Math.round((ms / 60000) * 10) / 10;
}

export function fillTemplate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

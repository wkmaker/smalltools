/**
 * 幸運轉盤加權抽獎、密碼學安全亂數、扇區計算、連抽扣減、批次解析與分享編碼引擎
 * （無 UI 依賴、可獨立單元測試）。
 */

import { randomToken } from '../utils/randomToken.ts';
import type { PrizeItem, AwardTier, HistoryRecord } from './types.ts';
import { PRESET_COLORS } from './constants.ts';

export interface PrizeLike {
  weight: number;
}

export interface WheelSector<T extends PrizeLike> {
  prize: T;
  startAngle: number;
  endAngle: number;
  angleSpan: number;
}

/**
 * 密碼學級安全浮點亂數產生器，回傳 [0, 1) 區間的均勻分布亂數。
 * 優先採用 Web Cryptography API (crypto.getRandomValues)，確保高熵值且無規律可循。
 */
export function secureRandomFloat(): number {
  if (typeof globalThis !== 'undefined' && globalThis.crypto?.getRandomValues) {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] / 0x100000000;
  }
  return Math.random();
}

// 依權重比例將獎項均分至 0~360 度扇區
export function calculateSectors<T extends PrizeLike>(
  validPrizes: T[]
): { sectors: WheelSector<T>[]; totalWeight: number } {
  const totalWeight = validPrizes.reduce((sum, p) => sum + p.weight, 0);
  if (totalWeight === 0) return { sectors: [], totalWeight: 0 };

  let currentAngle = 0;
  const sectors = validPrizes.map((prize) => {
    const angleSpan = (prize.weight / totalWeight) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angleSpan;
    currentAngle = endAngle;
    return { prize, startAngle, endAngle, angleSpan };
  });

  return { sectors, totalWeight };
}

// 依累加權重區間命中 randVal（[0, totalWeight) 之間的隨機值）所落在的索引；
// 若因浮點數誤差導致落在所有區間之外（理論上不會發生），沿用原邏輯回退至索引 0。
export function pickWeightedIndex(weights: number[], randVal: number): number {
  let accum = 0;
  for (let i = 0; i < weights.length; i++) {
    accum += weights[i];
    if (randVal <= accum) return i;
  }
  return 0;
}

/**
 * 計算轉盤目標旋轉角度（含扇區內安全隨機偏移角，營造真實擦邊或自然落點視覺）。
 * @param currentAngle 目前累積角度
 * @param sector 命中的目標扇區
 * @param extraRounds 額外完整旋轉圈數 (例如 5~8 圈)
 * @param jitterUnit [0, 1) 隨機值，將映射至扇區寬度的 [-0.36, +0.36] 倍偏移
 */
export function computeTargetSpinAngle<T extends PrizeLike>(
  currentAngle: number,
  sector: WheelSector<T>,
  extraRounds: number,
  jitterUnit = 0.5
): number {
  const midAngle = (sector.startAngle + sector.endAngle) / 2;
  const clampedUnit = Math.max(0, Math.min(1, jitterUnit));
  // 限制在扇區寬度的 ±36% 內偏移，避免壓線造成視覺爭議
  const jitterOffset = (clampedUnit - 0.5) * 0.72 * sector.angleSpan;
  const landingAngleOnWheel = midAngle + jitterOffset;
  // 頂部指針位於 12 點鐘方向 (270度)
  const targetRotation = (270 - landingAngleOnWheel + 360) % 360;
  const deltaAngle = (targetRotation - (currentAngle % 360) + 360) % 360;
  return currentAngle + Math.max(1, extraRounds) * 360 + deltaAngle;
}

/**
 * 獲取目前尚未抽完、可參與抽獎之有效項目
 */
export function getAvailablePrizes(prizes: PrizeItem[], enableQuantityLimit: boolean): PrizeItem[] {
  return prizes.filter((p) => {
    if (p.weight <= 0) return false;
    if (p.isFinished) return false;
    if (enableQuantityLimit && p.drawnCount >= p.quantity) return false;
    return true;
  });
}

/**
 * 批次連抽引擎（支援單抽與 N 連抽，每次抽出即時扣減庫存並動態重算剩餘權重；
 * 同一次連抽內優先抽取不重複項目，若連抽數超過不同項目數則繼續依剩餘庫存抽取）
 */
export function drawBatchWinners(
  prizes: PrizeItem[],
  drawCount: number,
  enableQuantityLimit: boolean,
  rng: () => number = secureRandomFloat
): { winners: PrizeItem[]; updatedPrizes: PrizeItem[] } {
  const safeCount = Math.max(1, Math.min(50, Math.floor(drawCount) || 1));
  const workingPrizes = prizes.map((p) => ({ ...p }));
  const winners: PrizeItem[] = [];
  const pickedIdsInBatch = new Set<string>();

  for (let step = 0; step < safeCount; step++) {
    const allAvailable = getAvailablePrizes(workingPrizes, enableQuantityLimit);
    if (allAvailable.length === 0) break;

    // 同一次連抽中優先從尚未在本批抽出的項目中挑選，確保連抽 N 名時盡可能抽出 N 個不同項目
    const unpickedAvailable = allAvailable.filter((p) => !pickedIdsInBatch.has(p.id));
    const pool = unpickedAvailable.length > 0 ? unpickedAvailable : allAvailable;

    const totalWeight = pool.reduce((sum, p) => sum + p.weight, 0);
    if (totalWeight <= 0) break;

    const randVal = rng() * totalWeight;
    const pickedIdx = pickWeightedIndex(
      pool.map((p) => p.weight),
      randVal
    );
    const chosen = pool[pickedIdx];

    winners.push({ ...chosen });
    pickedIdsInBatch.add(chosen.id);

    const targetInWorking = workingPrizes.find((p) => p.id === chosen.id);
    if (targetInWorking) {
      targetInWorking.drawnCount += 1;
      if (enableQuantityLimit && targetInWorking.drawnCount >= targetInWorking.quantity) {
        targetInWorking.isFinished = true;
      }
    }
  }

  return { winners, updatedPrizes: workingPrizes };
}

/**
 * 放棄得獎並回補庫存（支援「不在場重抽」或從歷史紀錄撤銷單筆/整批得獎紀錄）
 */
export function revertWinnerRecords(
  prizes: PrizeItem[],
  awardTiers: AwardTier[],
  history: HistoryRecord[],
  recordIdsToRevert: string[],
  enableQuantityLimit: boolean
): {
  updatedPrizes: PrizeItem[];
  updatedAwardTiers: AwardTier[];
  updatedHistory: HistoryRecord[];
} {
  const revertSet = new Set(recordIdsToRevert);
  const targetRecords = history.filter((r) => revertSet.has(r.id));
  if (targetRecords.length === 0) {
    return {
      updatedPrizes: prizes,
      updatedAwardTiers: awardTiers,
      updatedHistory: history,
    };
  }

  const prizeRevertCounts = new Map<string, number>();
  const prizeTitleFallbackCounts = new Map<string, number>();
  const awardRevertCounts = new Map<string, number>();

  for (const rec of targetRecords) {
    if (rec.prizeId) {
      prizeRevertCounts.set(rec.prizeId, (prizeRevertCounts.get(rec.prizeId) || 0) + 1);
    } else {
      prizeTitleFallbackCounts.set(rec.prizeTitle, (prizeTitleFallbackCounts.get(rec.prizeTitle) || 0) + 1);
    }
    if (rec.awardId) {
      awardRevertCounts.set(rec.awardId, (awardRevertCounts.get(rec.awardId) || 0) + 1);
    }
  }

  const updatedPrizes = prizes.map((p) => {
    const byId = prizeRevertCounts.get(p.id) || 0;
    const byTitle = prizeTitleFallbackCounts.get(p.title) || 0;
    const deduct = byId + byTitle;
    if (deduct <= 0) return p;

    if (byTitle > 0) prizeTitleFallbackCounts.delete(p.title);
    const newDrawn = Math.max(0, p.drawnCount - deduct);
    const isFin = enableQuantityLimit ? newDrawn >= p.quantity : false;
    return {
      ...p,
      drawnCount: newDrawn,
      isFinished: isFin,
    };
  });

  const updatedAwardTiers = awardTiers.map((tier) => {
    const deduct = awardRevertCounts.get(tier.id) || 0;
    if (deduct <= 0) return tier;
    return {
      ...tier,
      drawnCount: Math.max(0, tier.drawnCount - deduct),
    };
  });

  const updatedHistory = history.filter((r) => !revertSet.has(r.id));

  return {
    updatedPrizes,
    updatedAwardTiers,
    updatedHistory,
  };
}

/**
 * 解析多行文字（支援「純姓名名單」或「名稱, 權重, 數量, 色碼」）
 */
export function parseBatchText(
  text: string,
  presetColors: string[] = PRESET_COLORS
): { items: PrizeItem[]; isParticipantList: boolean } {
  const lines = text.split(/\r?\n/);
  const items: PrizeItem[] = [];
  let singleColumnLines = 0;

  for (const line of lines) {
    const clean = line.trim();
    if (!clean || clean.startsWith('#') || clean.startsWith('//')) continue;

    const parts = clean
      .split(/[,;\t]/)
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length > 0) {
      const title = parts[0].slice(0, 120);
      const weight = parts.length > 1 && parts[1] ? Math.max(0, Math.min(100000, parseInt(parts[1], 10) || 1)) : 1;
      const quantity = parts.length > 2 && parts[2] ? Math.max(1, Math.min(100000, parseInt(parts[2], 10) || 1)) : 1;
      const color =
        parts.length > 3 && /^#[0-9A-Fa-f]{6}$/.test(parts[3])
          ? parts[3]
          : presetColors[items.length % presetColors.length];

      if (parts.length === 1) singleColumnLines++;

      items.push({
        id: generateId(),
        title,
        weight,
        quantity,
        drawnCount: 0,
        color,
        isFinished: false,
      });
    }
  }

  const isParticipantList = items.length > 0 && singleColumnLines / items.length >= 0.7;
  return { items, isParticipantList };
}

/**
 * 將目前獎項陣列序列化為可供快速批次編輯的多行文字
 */
export function serializePrizesToText(prizes: PrizeItem[]): string {
  const allSimple = prizes.every((p) => p.weight === 1 && p.quantity === 1);
  if (allSimple) {
    return prizes.map((p) => p.title).join('\n');
  }
  return prizes.map((p) => `${p.title}, ${p.weight}, ${p.quantity}`).join('\n');
}

export interface ShareableWheelConfig {
  prizes: Pick<PrizeItem, 'title' | 'weight' | 'quantity' | 'color'>[];
  enableQuantityLimit: boolean;
  enableAwardMode?: boolean;
  awardTiers?: Pick<AwardTier, 'name' | 'quantity'>[];
}

/**
 * 將轉盤設定編碼為 URL 安全之緊湊字串（支援中文 UTF-8）
 */
export function encodeWheelShareState(config: ShareableWheelConfig): string {
  const compact = {
    l: config.enableQuantityLimit ? 1 : 0,
    m: config.enableAwardMode ? 1 : 0,
    p: config.prizes.slice(0, 200).map((item) => [
      item.title.slice(0, 80),
      Math.max(0, Math.min(10000, Math.round(item.weight))),
      Math.max(1, Math.min(10000, Math.round(item.quantity))),
      item.color,
    ]),
    a: config.awardTiers?.slice(0, 50).map((t) => [t.name.slice(0, 80), Math.max(1, Math.min(10000, Math.round(t.quantity)))]),
  };
  const json = JSON.stringify(compact);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = typeof btoa === 'function' ? btoa(binary) : Buffer.from(json, 'utf-8').toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * 解碼並清洗 URL 分享字串，還原為安全的轉盤設定
 */
export function decodeWheelShareState(encoded: string): {
  prizes: PrizeItem[];
  enableQuantityLimit: boolean;
  enableAwardMode: boolean;
  awardTiers: AwardTier[];
} | null {
  try {
    const clean = encoded.trim().replace(/-/g, '+').replace(/_/g, '/');
    if (!clean || clean.length > 32000) return null;
    const padded = clean + '='.repeat((4 - (clean.length % 4)) % 4);
    let json = '';
    if (typeof atob === 'function') {
      const binary = atob(padded);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      json = new TextDecoder().decode(bytes);
    } else {
      json = Buffer.from(padded, 'base64').toString('utf-8');
    }

    const parsed = JSON.parse(json);
    if (!parsed || !Array.isArray(parsed.p) || parsed.p.length === 0) return null;

    const prizes: PrizeItem[] = parsed.p.slice(0, 200).map((row: unknown, idx: number) => {
      const arr = Array.isArray(row) ? row : [];
      const title = String(arr[0] ?? `Item ${idx + 1}`).trim().slice(0, 80) || `Item ${idx + 1}`;
      const weight = Math.max(0, Math.min(10000, Number(arr[1]) || 1));
      const quantity = Math.max(1, Math.min(10000, Number(arr[2]) || 1));
      const rawColor = String(arr[3] ?? '');
      const color = /^#[0-9A-Fa-f]{6}$/.test(rawColor) ? rawColor : PRESET_COLORS[idx % PRESET_COLORS.length];
      return {
        id: generateId(),
        title,
        weight,
        quantity,
        drawnCount: 0,
        color,
        isFinished: false,
      };
    });

    const awardTiers: AwardTier[] = Array.isArray(parsed.a)
      ? parsed.a.slice(0, 50).map((row: unknown, idx: number) => {
          const arr = Array.isArray(row) ? row : [];
          const name = String(arr[0] ?? `Award ${idx + 1}`).trim().slice(0, 80) || `Award ${idx + 1}`;
          const quantity = Math.max(1, Math.min(10000, Number(arr[1]) || 1));
          return {
            id: generateId(),
            name,
            quantity,
            drawnCount: 0,
          };
        })
      : [];

    return {
      prizes,
      enableQuantityLimit: parsed.l !== 0,
      enableAwardMode: parsed.m === 1,
      awardTiers,
    };
  } catch {
    return null;
  }
}

/**
 * 防範 CSV 公式注入 (CSV Injection Defense)
 */
function escapeCsvCell(val: string): string {
  const safe = /^[=+\-@\t\r]/.test(val) ? `'${val}` : val;
  return `"${safe.replace(/"/g, '""')}"`;
}

/**
 * 將歷史中獎紀錄匯出為帶 UTF-8 BOM 之 CSV 字串（Excel 直接開啟不亂碼）
 */
export function formatHistoryCsv(history: HistoryRecord[], lang: 'zh-TW' | 'en' = 'zh-TW'): string {
  const headers =
    lang === 'en'
      ? ['Order', 'Winner / Item', 'Award Tier', 'Timestamp']
      : ['序號', '中獎項目 / 得獎人', '所屬獎項', '中獎時間'];

  const rows = history.map((rec, idx) => {
    const order = String(history.length - idx);
    const title = escapeCsvCell(rec.prizeTitle);
    const award = escapeCsvCell(rec.awardName || (lang === 'en' ? 'Direct Draw' : '一般抽獎'));
    const timeStr = escapeCsvCell(
      new Date(rec.timestamp).toLocaleString(lang === 'en' ? 'en-US' : 'zh-TW', { hour12: false })
    );
    return `${order},${title},${award},${timeStr}`;
  });

  return '\uFEFF' + [headers.join(','), ...rows].join('\n');
}

export function generateId(): string {
  return 'p_' + Date.now() + '_' + randomToken(5);
}

// YIQ 對比公式：依背景色亮度自動決定文字應顯示深色或淺色，確保轉盤/拉霸文字可讀性
export function getContrastYIQ(hexcolor: string): string {
  const hex = hexcolor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) || 0;
  const g = parseInt(hex.substring(2, 4), 16) || 0;
  const b = parseInt(hex.substring(4, 6), 16) || 0;
  const yiq = (r * 299 + g * 587 + b * 114) / 1000;
  return yiq >= 138 ? '#0f172a' : '#ffffff';
}

/**
 * 幸運轉盤加權抽獎與扇區角度計算引擎（無 UI 依賴、可獨立單元測試）。
 *
 * 從 `LuckyWheelClient.tsx` 抽離：轉盤模式與拉霸機模式原本各自重複實作一份
 * 「依權重加總、按累加區間命中隨機值」的抽獎演算法，統一為 pickWeightedIndex，
 * 隨機值改由呼叫端注入，讓公平性判斷可以脫離 Math.random() 直接測試。
 */

import { randomToken } from '../utils/randomToken.ts';

export interface PrizeLike {
  weight: number;
}

export interface WheelSector<T extends PrizeLike> {
  prize: T;
  startAngle: number;
  endAngle: number;
  angleSpan: number;
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

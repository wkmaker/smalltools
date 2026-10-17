/**
 * 幸運轉盤與拉霸機核心資料型別定義
 */

export interface PrizeItem {
  id: string;
  title: string;
  weight: number;
  quantity: number;
  drawnCount: number;
  color: string;
  isFinished?: boolean;
}

export interface AwardTier {
  id: string;
  name: string;
  quantity: number;
  drawnCount: number;
}

export interface HistoryRecord {
  id: string;
  prizeId: string;
  prizeTitle: string;
  awardId?: string;
  awardName?: string;
  batchId?: string;
  timestamp: number;
}

export type SpinSpeed = 'fast' | 'normal' | 'suspense';

export interface SaveSlot {
  id: string;
  name: string;
  updatedAt: number;
  prizes: PrizeItem[];
  enableQuantityLimit: boolean;
  enableAwardMode?: boolean;
  awardTiers?: AwardTier[];
}

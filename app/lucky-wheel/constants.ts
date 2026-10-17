/**
 * 幸運轉盤與拉霸機預設色彩、快速範例模板與動畫常數
 */

import type { PrizeItem, AwardTier, SpinSpeed } from './types.ts';

// 預設轉盤色彩盤
export const PRESET_COLORS = [
  '#ff0055',
  '#ff7700',
  '#ffb800',
  '#00f0ff',
  '#00f5a0',
  '#7000ff',
  '#ff00b7',
  '#0099ff',
  '#eab308',
  '#ec4899',
  '#10b981',
  '#6366f1',
];

export const SPIN_SPEED_MS: Record<SpinSpeed, { wheel: number; slot: number }> = {
  fast: { wheel: 1800, slot: 1600 },
  normal: { wheel: 4800, slot: 4200 },
  suspense: { wheel: 7800, slot: 6800 },
};

// 預設尾牙雙抽模式「獎項池」範例
export const DEFAULT_AWARD_TIERS: Record<'zh-TW' | 'en', Omit<AwardTier, 'id'>[]> = {
  'zh-TW': [
    { name: '特等獎 — MacBook Pro', quantity: 1, drawnCount: 0 },
    { name: '頭獎 — iPhone 16 Pro', quantity: 2, drawnCount: 0 },
    { name: '二獎 — iPad Air', quantity: 3, drawnCount: 0 },
    { name: '三獎 — AirPods Pro', quantity: 5, drawnCount: 0 },
    { name: '普獎 — 禮券 2,000 元', quantity: 10, drawnCount: 0 },
  ],
  en: [
    { name: 'Grand Prize — MacBook Pro', quantity: 1, drawnCount: 0 },
    { name: '1st Prize — iPhone 16 Pro', quantity: 2, drawnCount: 0 },
    { name: '2nd Prize — iPad Air', quantity: 3, drawnCount: 0 },
    { name: '3rd Prize — AirPods Pro', quantity: 5, drawnCount: 0 },
    { name: 'Consolation — $100 Gift Card', quantity: 10, drawnCount: 0 },
  ],
};

// 快速模板預設資料 (雙語)
export const PRIZE_TEMPLATES: Record<string, { 'zh-TW': Omit<PrizeItem, 'id'>[]; en: Omit<PrizeItem, 'id'>[] }> = {
  annual: {
    'zh-TW': [
      { title: '特等獎 - Mac Mini', weight: 1, quantity: 1, drawnCount: 0, color: '#ff0055' },
      { title: '頭獎 - iPhone 16', weight: 2, quantity: 2, drawnCount: 0, color: '#ff7700' },
      { title: '二獎 - iPad Air', weight: 3, quantity: 3, drawnCount: 0, color: '#ffb800' },
      { title: '三獎 - AirPods Pro', weight: 5, quantity: 5, drawnCount: 0, color: '#00f0ff' },
      { title: '普獎 - 禮券 500元', weight: 10, quantity: 10, drawnCount: 0, color: '#00f5a0' },
      { title: '銘謝惠顧', weight: 15, quantity: 99, drawnCount: 0, color: '#7000ff' },
    ],
    en: [
      { title: 'Grand Prize - Mac Mini', weight: 1, quantity: 1, drawnCount: 0, color: '#ff0055' },
      { title: '1st Prize - iPhone 16', weight: 2, quantity: 2, drawnCount: 0, color: '#ff7700' },
      { title: '2nd Prize - iPad Air', weight: 3, quantity: 3, drawnCount: 0, color: '#ffb800' },
      { title: '3rd Prize - AirPods Pro', weight: 5, quantity: 5, drawnCount: 0, color: '#00f0ff' },
      { title: 'Consolation - $20 Gift Card', weight: 10, quantity: 10, drawnCount: 0, color: '#00f5a0' },
      { title: 'Better Luck Next Time', weight: 15, quantity: 99, drawnCount: 0, color: '#7000ff' },
    ],
  },
  staff: {
    'zh-TW': [
      { title: '陳冠宇', weight: 1, quantity: 1, drawnCount: 0, color: '#ff0055' },
      { title: '林怡君', weight: 1, quantity: 1, drawnCount: 0, color: '#ff7700' },
      { title: '張家豪', weight: 1, quantity: 1, drawnCount: 0, color: '#ffb800' },
      { title: '王詩涵', weight: 1, quantity: 1, drawnCount: 0, color: '#00f0ff' },
      { title: '李宗翰', weight: 1, quantity: 1, drawnCount: 0, color: '#00f5a0' },
      { title: '黃雅婷', weight: 1, quantity: 1, drawnCount: 0, color: '#7000ff' },
      { title: '吳承恩', weight: 1, quantity: 1, drawnCount: 0, color: '#ff00b7' },
      { title: '劉品妤', weight: 1, quantity: 1, drawnCount: 0, color: '#0099ff' },
      { title: '蔡明哲', weight: 1, quantity: 1, drawnCount: 0, color: '#eab308' },
      { title: '楊詠晴', weight: 1, quantity: 1, drawnCount: 0, color: '#10b981' },
    ],
    en: [
      { title: 'Alex Chen', weight: 1, quantity: 1, drawnCount: 0, color: '#ff0055' },
      { title: 'Emily Lin', weight: 1, quantity: 1, drawnCount: 0, color: '#ff7700' },
      { title: 'Kevin Chang', weight: 1, quantity: 1, drawnCount: 0, color: '#ffb800' },
      { title: 'Sophia Wang', weight: 1, quantity: 1, drawnCount: 0, color: '#00f0ff' },
      { title: 'Brian Lee', weight: 1, quantity: 1, drawnCount: 0, color: '#00f5a0' },
      { title: 'grace Huang', weight: 1, quantity: 1, drawnCount: 0, color: '#7000ff' },
      { title: 'Ethan Wu', weight: 1, quantity: 1, drawnCount: 0, color: '#ff00b7' },
      { title: 'Chloe Liu', weight: 1, quantity: 1, drawnCount: 0, color: '#0099ff' },
      { title: 'Marcus Tsai', weight: 1, quantity: 1, drawnCount: 0, color: '#eab308' },
      { title: 'Olivia Yang', weight: 1, quantity: 1, drawnCount: 0, color: '#10b981' },
    ],
  },
  lucky: {
    'zh-TW': [
      { title: '幸運數字 1', weight: 10, quantity: 1, drawnCount: 0, color: '#ff0055' },
      { title: '幸運數字 2', weight: 10, quantity: 1, drawnCount: 0, color: '#ff7700' },
      { title: '幸運數字 3', weight: 10, quantity: 1, drawnCount: 0, color: '#ffb800' },
      { title: '幸運數字 4', weight: 10, quantity: 1, drawnCount: 0, color: '#00f0ff' },
      { title: '幸運數字 5', weight: 10, quantity: 1, drawnCount: 0, color: '#00f5a0' },
      { title: '幸運數字 6', weight: 10, quantity: 1, drawnCount: 0, color: '#7000ff' },
    ],
    en: [
      { title: 'Lucky Number 1', weight: 10, quantity: 1, drawnCount: 0, color: '#ff0055' },
      { title: 'Lucky Number 2', weight: 10, quantity: 1, drawnCount: 0, color: '#ff7700' },
      { title: 'Lucky Number 3', weight: 10, quantity: 1, drawnCount: 0, color: '#ffb800' },
      { title: 'Lucky Number 4', weight: 10, quantity: 1, drawnCount: 0, color: '#00f0ff' },
      { title: 'Lucky Number 5', weight: 10, quantity: 1, drawnCount: 0, color: '#00f5a0' },
      { title: 'Lucky Number 6', weight: 10, quantity: 1, drawnCount: 0, color: '#7000ff' },
    ],
  },
  punish: {
    'zh-TW': [
      { title: '鬼臉三連拍', weight: 1, quantity: 99, drawnCount: 0, color: '#ff0055' },
      { title: '喝苦瓜汁一杯', weight: 1, quantity: 99, drawnCount: 0, color: '#ff7700' },
      { title: '現場大唱一首歌', weight: 1, quantity: 99, drawnCount: 0, color: '#ffb800' },
      { title: '伏地挺身 10 下', weight: 1, quantity: 99, drawnCount: 0, color: '#00f0ff' },
      { title: '對隔壁深情告白', weight: 1, quantity: 99, drawnCount: 0, color: '#00f5a0' },
      { title: '安全過關 免受懲罰', weight: 2, quantity: 99, drawnCount: 0, color: '#7000ff' },
    ],
    en: [
      { title: 'Take 3 Funny Photos', weight: 1, quantity: 99, drawnCount: 0, color: '#ff0055' },
      { title: 'Drink a Sour Shot', weight: 1, quantity: 99, drawnCount: 0, color: '#ff7700' },
      { title: 'Sing a Song Solo', weight: 1, quantity: 99, drawnCount: 0, color: '#ffb800' },
      { title: 'Do 10 Push-ups', weight: 1, quantity: 99, drawnCount: 0, color: '#00f0ff' },
      { title: 'Tell a Funny Joke', weight: 1, quantity: 99, drawnCount: 0, color: '#00f5a0' },
      { title: 'Safe! No Penalty', weight: 2, quantity: 99, drawnCount: 0, color: '#7000ff' },
    ],
  },
  dinner: {
    'zh-TW': [
      { title: '日式拉麵', weight: 1, quantity: 99, drawnCount: 0, color: '#ff0055' },
      { title: '韓式燒肉', weight: 1, quantity: 99, drawnCount: 0, color: '#ff7700' },
      { title: '義大利麵', weight: 1, quantity: 99, drawnCount: 0, color: '#ffb800' },
      { title: '台式便當', weight: 1, quantity: 99, drawnCount: 0, color: '#00f0ff' },
      { title: '美式漢堡速食', weight: 1, quantity: 99, drawnCount: 0, color: '#00f5a0' },
      { title: '健康輕食沙拉', weight: 1, quantity: 99, drawnCount: 0, color: '#7000ff' },
    ],
    en: [
      { title: 'Japanese Ramen', weight: 1, quantity: 99, drawnCount: 0, color: '#ff0055' },
      { title: 'Korean BBQ', weight: 1, quantity: 99, drawnCount: 0, color: '#ff7700' },
      { title: 'Italian Pasta', weight: 1, quantity: 99, drawnCount: 0, color: '#ffb800' },
      { title: 'Local Bento', weight: 1, quantity: 99, drawnCount: 0, color: '#00f0ff' },
      { title: 'Burger Fast Food', weight: 1, quantity: 99, drawnCount: 0, color: '#00f5a0' },
      { title: 'Fresh Healthy Salad', weight: 1, quantity: 99, drawnCount: 0, color: '#7000ff' },
    ],
  },
};

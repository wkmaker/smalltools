import { TRANSLATIONS } from '../translations';

export type FuturesPresetId = 'tx' | 'mtx' | 'tmf' | 'custom';
export type FuturesPosition = 'long' | 'short';
export type FuturesTranslations = (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS];

export interface FuturesPreset {
  id: FuturesPresetId;
  name: string;
  multiplier: number;
  initialMargin: number;
  maintMargin: number;
}

export const FUTURES_PRESETS: FuturesPreset[] = [
  { id: 'tx', name: '大台 (TX)', multiplier: 200, initialMargin: 242000, maintMargin: 186000 },
  { id: 'mtx', name: '小台 (MTX)', multiplier: 50, initialMargin: 60500, maintMargin: 46500 },
  { id: 'tmf', name: '微台 (TMF)', multiplier: 10, initialMargin: 12100, maintMargin: 9300 },
  { id: 'custom', name: '自訂商品', multiplier: 200, initialMargin: 242000, maintMargin: 186000 },
];

export function formatFuturesNumber(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  return Math.round(val).toLocaleString('zh-TW');
}

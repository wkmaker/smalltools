/**
 * 台灣國定假日與補班日資料表（2025–2027）
 * 依據行政院人事行政總處行事曆與《紀念日及節日實施條例》暨《勞動基準法》第 37 條整理。
 *
 * 用途：
 * 預告期間雖然以「日曆天」計算，但排休特別休假、資遣謀職假與推算「實際最後到辦公室出勤日」時，
 * 僅需扣除「應出勤之工作日」。遇到國定假日（放假且有薪）時無須消耗特休，實際最後出勤日可再往前推。
 */

export interface HolidayEntry {
  date: string; // YYYY-MM-DD
  nameZh: string;
  nameEn: string;
}

export const TAIWAN_HOLIDAYS: Record<string, { zh: string; en: string }> = {
  // === 2025 年 ===
  '2025-01-01': { zh: '元旦', en: "New Year's Day" },
  '2025-01-27': { zh: '小年夜彈性放假', en: 'Lunar New Year Holiday' },
  '2025-01-28': { zh: '除夕', en: "Lunar New Year's Eve" },
  '2025-01-29': { zh: '春節初一', en: 'Lunar New Year' },
  '2025-01-30': { zh: '春節初二', en: 'Lunar New Year' },
  '2025-01-31': { zh: '春節初三', en: 'Lunar New Year' },
  '2025-02-28': { zh: '和平紀念日', en: 'Peace Memorial Day' },
  '2025-04-03': { zh: '兒童節補假', en: "Children's Day (Observed)" },
  '2025-04-04': { zh: '清明節 / 兒童節', en: 'Tomb Sweeping Day' },
  '2025-05-01': { zh: '五一勞動節', en: 'Labor Day' },
  '2025-05-30': { zh: '端午節補假', en: 'Dragon Boat Festival (Observed)' },
  '2025-05-31': { zh: '端午節', en: 'Dragon Boat Festival' },
  '2025-09-28': { zh: '教師節', en: "Teachers' Day" },
  '2025-09-29': { zh: '教師節補假', en: "Teachers' Day (Observed)" },
  '2025-10-06': { zh: '中秋節', en: 'Mid-Autumn Festival' },
  '2025-10-10': { zh: '國慶日', en: 'National Day' },
  '2025-10-24': { zh: '臺灣光復節補假', en: 'Retrocession Day (Observed)' },
  '2025-10-25': { zh: '臺灣光復節', en: 'Retrocession Day' },
  '2025-12-25': { zh: '行憲紀念日', en: 'Constitution Day' },

  // === 2026 年 ===
  '2026-01-01': { zh: '元旦', en: "New Year's Day" },
  '2026-02-15': { zh: '小年夜', en: 'Little New Year' },
  '2026-02-16': { zh: '除夕', en: "Lunar New Year's Eve" },
  '2026-02-17': { zh: '春節初一', en: 'Lunar New Year' },
  '2026-02-18': { zh: '春節初二', en: 'Lunar New Year' },
  '2026-02-19': { zh: '春節初三', en: 'Lunar New Year' },
  '2026-02-20': { zh: '春節補假', en: 'Lunar New Year (Observed)' },
  '2026-02-27': { zh: '和平紀念日補假', en: 'Peace Memorial Day (Observed)' },
  '2026-02-28': { zh: '和平紀念日', en: 'Peace Memorial Day' },
  '2026-04-03': { zh: '兒童節補假', en: "Children's Day (Observed)" },
  '2026-04-04': { zh: '兒童節', en: "Children's Day" },
  '2026-04-05': { zh: '清明節', en: 'Tomb Sweeping Day' },
  '2026-04-06': { zh: '清明節補假', en: 'Tomb Sweeping Day (Observed)' },
  '2026-05-01': { zh: '五一勞動節', en: 'Labor Day' },
  '2026-06-19': { zh: '端午節', en: 'Dragon Boat Festival' },
  '2026-09-25': { zh: '中秋節', en: 'Mid-Autumn Festival' },
  '2026-09-28': { zh: '教師節', en: "Teachers' Day" },
  '2026-10-09': { zh: '國慶日補假', en: 'National Day (Observed)' },
  '2026-10-10': { zh: '國慶日', en: 'National Day' },
  '2026-10-25': { zh: '臺灣光復節', en: 'Retrocession Day' },
  '2026-10-26': { zh: '臺灣光復節補假', en: 'Retrocession Day (Observed)' },
  '2026-12-25': { zh: '行憲紀念日', en: 'Constitution Day' },

  // === 2027 年 ===
  '2027-01-01': { zh: '元旦', en: "New Year's Day" },
  '2027-02-04': { zh: '小年夜', en: 'Little New Year' },
  '2027-02-05': { zh: '除夕', en: "Lunar New Year's Eve" },
  '2027-02-06': { zh: '春節初一', en: 'Lunar New Year' },
  '2027-02-07': { zh: '春節初二', en: 'Lunar New Year' },
  '2027-02-08': { zh: '春節初三', en: 'Lunar New Year' },
  '2027-02-09': { zh: '春節補假', en: 'Lunar New Year (Observed)' },
  '2027-02-10': { zh: '春節補假', en: 'Lunar New Year (Observed)' },
  '2027-02-28': { zh: '和平紀念日', en: 'Peace Memorial Day' },
  '2027-03-01': { zh: '和平紀念日補假', en: 'Peace Memorial Day (Observed)' },
  '2027-04-04': { zh: '兒童節', en: "Children's Day" },
  '2027-04-05': { zh: '清明節', en: 'Tomb Sweeping Day' },
  '2027-04-06': { zh: '兒童節補假', en: "Children's Day (Observed)" },
  '2027-04-30': { zh: '五一勞動節補假', en: 'Labor Day (Observed)' },
  '2027-05-01': { zh: '五一勞動節', en: 'Labor Day' },
  '2027-06-09': { zh: '端午節', en: 'Dragon Boat Festival' },
  '2027-09-15': { zh: '中秋節', en: 'Mid-Autumn Festival' },
  '2027-09-28': { zh: '教師節', en: "Teachers' Day" },
  '2027-10-10': { zh: '國慶日', en: 'National Day' },
  '2027-10-11': { zh: '國慶日補假', en: 'National Day (Observed)' },
  '2027-10-25': { zh: '臺灣光復節', en: 'Retrocession Day' },
  '2027-12-24': { zh: '行憲紀念日補假', en: 'Constitution Day (Observed)' },
  '2027-12-25': { zh: '行憲紀念日', en: 'Constitution Day' },
};

/** 補班日（雖為週六但需出勤上班） */
export const TAIWAN_MAKEUP_WORKDAYS: Record<string, { zh: string; en: string }> = {
  '2025-02-08': { zh: '春節連假補班日', en: 'Makeup Workday' },
};

export function getTaiwanHolidayName(dateStr: string, lang: 'zh-TW' | 'en' = 'zh-TW'): string | null {
  const entry = TAIWAN_HOLIDAYS[dateStr];
  if (!entry) return null;
  return lang === 'zh-TW' ? entry.zh : entry.en;
}

export function isTaiwanHolidayDate(dateStr: string): boolean {
  return Boolean(TAIWAN_HOLIDAYS[dateStr]);
}

export function isTaiwanMakeupWorkday(dateStr: string): boolean {
  return Boolean(TAIWAN_MAKEUP_WORKDAYS[dateStr]);
}

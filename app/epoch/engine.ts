/**
 * Epoch 時間戳與日期互轉引擎（無 UI 依賴、可獨立單元測試）。
 *
 * 從 `EpochClient.tsx` 抽離：時區標籤淨化、多時區格式化、時間戳記 <->
 * 日期時間雙向轉換等純函數。所有時區運算一律透過 `Intl.DateTimeFormat`，
 * 不手動計算 DST（日光節約時間）偏移，避免自行實作時區規則的常見地雷。
 */

// 取得乾淨且人體工學的時區標籤（淨化 POSIX Etc/GMT-8 反向符號引發的混淆）
export function getCleanTzLabel(date: Date = new Date()): { tzName: string; utcOffset: string; displayLabel: string } {
  try {
    const tzName = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    const offsetMinutes = -date.getTimezoneOffset();
    const sign = offsetMinutes >= 0 ? '+' : '-';
    const absMin = Math.abs(offsetMinutes);
    const hours = Math.floor(absMin / 60);
    const mins = absMin % 60;
    const minsStr = mins > 0 ? `:${String(mins).padStart(2, '0')}` : '';
    const utcOffset = `UTC${sign}${hours}${minsStr}`;

    // 若 tzName 包含 Etc/ 或 GMT，屬 POSIX 符號會造成混淆 (如 Etc/GMT-8 = UTC+8)，淨化為只顯示 UTC 標籤
    if (!tzName || tzName.startsWith('Etc/') || tzName.includes('GMT')) {
      return { tzName: '', utcOffset, displayLabel: utcOffset };
    }

    return { tzName, utcOffset, displayLabel: `${tzName}, ${utcOffset}` };
  } catch {
    return { tzName: '', utcOffset: 'UTC+8', displayLabel: 'UTC+8' };
  }
}

// 格式化本機當地時間 (100% 精準對齊使用者裝置電腦時間)
export function formatLocalTime(date: Date): string {
  try {
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    const ms = String(date.getMilliseconds()).padStart(3, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}.${ms}`;
  } catch {
    return 'Invalid Date';
  }
}

// 格式化時間輔助函數 YYYY-MM-DD HH:mm:ss.SSS (指定 IANA 時區)
export function formatInTimezone(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const p: Record<string, string> = {};
    parts.forEach((part) => (p[part.type] = part.value));

    const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}.${ms}`;
  } catch {
    return 'Invalid Timezone';
  }
}

// 取得時區縮寫，如 PDT / PST
export function getTimezoneAbbreviation(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch {
    return '';
  }
}

// 取得 GMT 偏移量字串，如 GMT-07:00
export function getGmtOffsetString(date: Date, timeZone: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      timeZoneName: 'longOffset',
    });
    const parts = formatter.formatToParts(date);
    const tzPart = parts.find((p) => p.type === 'timeZoneName');
    return tzPart ? tzPart.value : '';
  } catch {
    return '';
  }
}

// 根據指定 UTC 數值偏移格式化 YYYY-MM-DD HH:mm:ss.SSS
export function formatInOffset(date: Date, offsetHours: number): string {
  try {
    const offsetMs = offsetHours * 60 * 60 * 1000;
    const targetDate = new Date(date.getTime() + offsetMs);

    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Etc/UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(targetDate);
    const p: Record<string, string> = {};
    parts.forEach((part) => (p[part.type] = part.value));

    const ms = String(targetDate.getUTCMilliseconds()).padStart(3, '0');
    return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}:${p.second}.${ms}`;
  } catch {
    return 'Invalid Offset';
  }
}

// 日期轉時間戳記：根據 UTC 數值偏移反算
export function convertDateTimeToTimestampByOffset(
  dateTimeStr: string,
  msVal: number | string,
  offsetHours: number
): number | null {
  if (!dateTimeStr) return null;

  const cleanStr = dateTimeStr.replace('T', ' ').replace('/', '-');
  const regex = /^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2})(?::(\d{2}))?$/;
  const match = cleanStr.match(regex);
  if (!match) return null;

  const year = parseInt(match[1], 10);
  const month = parseInt(match[2], 10) - 1;
  const day = parseInt(match[3], 10);
  const hour = parseInt(match[4], 10);
  const minute = parseInt(match[5], 10);
  const second = match[6] ? parseInt(match[6], 10) : 0;
  const ms = typeof msVal === 'number' ? msVal : parseInt(msVal, 10) || 0;

  const baseUtcMs = Date.UTC(year, month, day, hour, minute, second, ms);
  const offsetMs = offsetHours * 60 * 60 * 1000;
  return baseUtcMs - offsetMs;
}

export type EpochUnitMode = 'auto' | 's' | 'ms';

export interface TimestampToDateResult {
  cleanTs: string;
  unit: 's' | 'ms';
  dateObj: Date;
  localStr: string;
  taipeiStr: string;
  utcStr: string;
  laStr: string;
  laBadge: string;
  customStr: string;
  weekStr: string;
  dayOfYear: number;
  year: number;
  isLeap: boolean;
}

// 時間戳記 ➜ 日期時間（含多時區換算與年度元數據）。weekDays 需傳入 7 個語系化的星期文案（週日起算）。
export function parseTimestampToDate(
  rawInput: string,
  unitMode: EpochUnitMode,
  customTzOffset: number,
  weekDays: string[]
): TimestampToDateResult | null {
  const raw = rawInput.trim();
  if (!raw) return null;

  const clean = raw.replace(/\D/g, '');
  if (!clean) return null;

  const tsNum = parseInt(clean, 10);
  let unit: 's' | 'ms' = unitMode === 'auto' ? (clean.length >= 12 ? 'ms' : 's') : unitMode;

  const dateObj = new Date(unit === 's' ? tsNum * 1000 : tsNum);
  if (isNaN(dateObj.getTime())) return null;

  const localStr = formatLocalTime(dateObj);
  const taipeiStr = formatInTimezone(dateObj, 'Asia/Taipei');
  const utcStr = formatInTimezone(dateObj, 'Etc/UTC');
  const laStr = formatInTimezone(dateObj, 'America/Los_Angeles');
  const laAbbr = getTimezoneAbbreviation(dateObj, 'America/Los_Angeles');
  const laOffset = getGmtOffsetString(dateObj, 'America/Los_Angeles');
  const customStr = formatInOffset(dateObj, customTzOffset);

  const weekStr = weekDays[dateObj.getDay()];

  const startOfYear = new Date(dateObj.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((dateObj.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24)) + 1;

  const year = dateObj.getFullYear();
  const isLeap = (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;

  return {
    cleanTs: clean,
    unit,
    dateObj,
    localStr,
    taipeiStr,
    utcStr,
    laStr,
    laBadge: `${laAbbr} (${laOffset})`,
    customStr,
    weekStr,
    dayOfYear,
    year,
    isLeap,
  };
}

export interface DateToTimestampResult {
  secEpoch: number;
  msEpoch: number;
  dateObj: Date;
  localStr: string;
  taipeiStr: string;
  utcStr: string;
  laStr: string;
}

// 日期時間 ➜ 時間戳記（含多時區換算）
export function convertDateToTimestamp(
  dtInput: string,
  dtMsInput: number | string,
  dtTzOffset: number
): DateToTimestampResult | null {
  if (!dtInput) return null;
  const msEpoch = convertDateTimeToTimestampByOffset(dtInput, dtMsInput, dtTzOffset);
  if (msEpoch === null || isNaN(msEpoch)) return null;

  const secEpoch = Math.floor(msEpoch / 1000);
  const dateObj = new Date(msEpoch);

  return {
    secEpoch,
    msEpoch,
    dateObj,
    localStr: formatLocalTime(dateObj),
    taipeiStr: formatInTimezone(dateObj, 'Asia/Taipei'),
    utcStr: formatInTimezone(dateObj, 'Etc/UTC'),
    laStr:
      formatInTimezone(dateObj, 'America/Los_Angeles') +
      ` (${getTimezoneAbbreviation(dateObj, 'America/Los_Angeles')})`,
  };
}

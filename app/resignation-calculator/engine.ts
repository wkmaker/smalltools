/**
 * 離職預告期試算純函數引擎（無副作用、可毫秒級單元測試）。
 *
 * 從 `ResignationCalculatorClient.tsx` 抽離：依勞基法第 16 條計算法定預告天數、
 * 正向 / 反向推算提出日與最後在職日、起算日、離職生效日（退保日）、
 * 台灣國定假日與補班日跳過、特休排休 / 折現、勞退新制資遣費、預告工資、
 * 破月薪資與月底健保結算建議、互動式排休月曆模型、合規檢核與過期判定。
 *
 * 純日期字串（YYYY-MM-DD）一律以「本地零時」建構，不做時區轉換（鐵則 7、8）。
 * 金額加減乘除一律走 BigNumber.js 定點數運算（鐵則 5、6）。
 */

import { D, toMoney, toRounded } from '../utils/decimal.ts';
import {
  TAIWAN_HOLIDAYS,
  isTaiwanHolidayDate,
  isTaiwanMakeupWorkday,
} from './holidays.ts';

/** 將 YYYY-MM-DD 以本地零時建構 Date；無效輸入回傳 null */
export function parseYmd(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  return new Date(y, mo - 1, d);
}

/** 格式化 Date 為 YYYY-MM-DD（本地） */
export function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** 格式化 Date 為 2026/08/15 (六) 樣式 */
export function formatDateFriendly(date: Date, lang: 'zh-TW' | 'en'): string {
  const daysZh = ['日', '一', '二', '三', '四', '五', '六'];
  const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dayName = lang === 'zh-TW' ? `(${daysZh[date.getDay()]})` : `(${daysEn[date.getDay()]})`;
  return `${y}/${m}/${d} ${dayName}`;
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

/**
 * 判斷某日是否為免出勤之放假日（週末例休或台灣國定假日，並排除補班日）
 */
export function isNonWorkingDay(date: Date, useTaiwanHolidays = true): boolean {
  const dateStr = formatDateStr(date);
  if (useTaiwanHolidays && isTaiwanMakeupWorkday(dateStr)) {
    return false;
  }
  if (isWeekend(date)) {
    return true;
  }
  if (useTaiwanHolidays && isTaiwanHolidayDate(dateStr)) {
    return true;
  }
  return false;
}

const MS_PER_DAY = 1000 * 60 * 60 * 24;

function addDays(date: Date, days: number): Date {
  const next = new Date(date.getTime());
  next.setDate(next.getDate() + days);
  return next;
}

function dayFloor(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function diffCalendarDays(from: Date, to: Date): number {
  return Math.round((dayFloor(to).getTime() - dayFloor(from).getTime()) / MS_PER_DAY);
}

/** 往前推算 N 個工作天（跳過週末與國定假日） */
export function subtractWorkingDays(
  startDate: Date,
  daysToSubtract: number,
  useTaiwanHolidays = true,
): Date {
  const current = new Date(startDate.getTime());
  while (isNonWorkingDay(current, useTaiwanHolidays)) {
    current.setDate(current.getDate() - 1);
  }
  let count = 0;
  while (count < daysToSubtract) {
    current.setDate(current.getDate() - 1);
    if (!isNonWorkingDay(current, useTaiwanHolidays)) {
      count++;
    }
  }
  return current;
}

/** 計算「告知之次日」起算至 endDate 的實際工作天數（跳過週末與國定假日） */
export function countWorkingDaysBetween(
  startDate: Date,
  endDate: Date,
  useTaiwanHolidays = true,
): number {
  const current = new Date(startDate.getTime());
  current.setDate(current.getDate() + 1);
  let count = 0;
  while (current.getTime() <= endDate.getTime()) {
    if (!isNonWorkingDay(current, useTaiwanHolidays)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

/** 勞基法第 38 條第 1 項法定特別休假天數 */
export function getStatutoryAnnualLeave(totalDaysTenure: number, tenureYears: number): number {
  if (totalDaysTenure < 182) return 0;
  if (totalDaysTenure < 365) return 3;
  if (tenureYears < 2) return 7;
  if (tenureYears < 3) return 10;
  if (tenureYears < 5) return 14;
  if (tenureYears < 10) return 15;
  return Math.min(30, 15 + (tenureYears - 9));
}

/** 勞基法第 16 條法定要求預告天數（曆天） */
export function getLegalNoticeDays(totalDaysTenure: number): number {
  if (totalDaysTenure < 90) return 0;
  if (totalDaysTenure < 365) return 10;
  if (totalDaysTenure < 365 * 3) return 20;
  return 30;
}

/**
 * 計算兩日期之間的精確年、月、日（用於勞退新制第 12 條資遣費比例換算）
 */
export function computeExactTenureYMD(
  onboardingDate: Date,
  effectiveEndDate: Date,
): { years: number; months: number; days: number } {
  const start = dayFloor(onboardingDate);
  const end = dayFloor(effectiveEndDate);
  if (end.getTime() <= start.getTime()) {
    return { years: 0, months: 0, days: 0 };
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months--;
    const prevMonthLastDay = new Date(end.getFullYear(), end.getMonth(), 0).getDate();
    days += prevMonthLastDay;
  }
  if (months < 0) {
    years--;
    months += 12;
  }
  return {
    years: Math.max(0, years),
    months: Math.max(0, months),
    days: Math.max(0, days),
  };
}

export type CalcDirection = 'noticeToLast' | 'lastToNotice';
export type NoticeMode = 'auto' | 'custom';
export type OfficeDayMode = 'autoLeaveEnd' | 'lastWorkingDay' | 'custom';
export type ResignationType = 'voluntary' | 'involuntary';

export type CalendarDayStatus =
  | 'notice'
  | 'work'
  | 'annualLeave'
  | 'holiday'
  | 'weekend'
  | 'effective';

export interface NoticeCalendarDay {
  dateStr: string;
  date: Date;
  dayOfWeek: number;
  status: CalendarDayStatus;
  isNoticeDate: boolean;
  isNoticeStartDate: boolean;
  isActualOfficeDate: boolean;
  isLastWorkingDate: boolean;
  isEffectiveDate: boolean;
  isWeekend: boolean;
  isMakeupWorkday: boolean;
  holidayNameZh: string | null;
  holidayNameEn: string | null;
  canToggleLeave: boolean;
}

export interface HolidayInPeriod {
  date: string;
  nameZh: string;
  nameEn: string;
}

export interface MonthEndInsight {
  isLastDayOfMonth: boolean;
  daysInLastMonth: number;
  workedDaysInLastMonth: number;
  proratedFinalMonthSalary: number;
  canExtendToSunday: boolean;
  sundayDateStr: string;
  extraWeekendDays: number;
  extraWeekendSalary: number;
}

export interface ResignationInput {
  calcDirection: CalcDirection;
  /** 到職日 YYYY-MM-DD */
  onboardingDate: string;
  /** 預計提出離職預告日 YYYY-MM-DD */
  noticeDate: string;
  /** 目標最後在職日 YYYY-MM-DD */
  targetLastWorkingDate: string;
  noticeMode: NoticeMode;
  /** 自訂預告天數 */
  customDays: number;
  /** 離職類型：自願離職 vs 非自願資遣 */
  resignationType?: ResignationType;
  annualLeaveDays: number;
  leaveDaysToTake: number;
  officeDayMode: OfficeDayMode;
  /** 自訂最後出勤日 YYYY-MM-DD */
  customOfficeDate: string;
  /** 月薪（試算特休代金、資遣費、破月薪資） */
  monthlySalary: number;
  /** 是否自動扣除台灣國定假日（預設 true） */
  useTaiwanHolidays?: boolean;
  /** 使用者於互動月曆手動指定的特休排休日期 YYYY-MM-DD 清單 */
  customLeaveDates?: string[];
  /** 非自願離職時，雇主提前終止契約未足額預告之天數（計算預告工資） */
  employerShortNoticeDays?: number;
  /** 今天 YYYY-MM-DD（注入以利測試；預設取執行當下本地日期） */
  today?: string;
}

export interface ResignationResult {
  totalDaysTenure: number;
  tenureYears: number;
  tenureMonths: number;
  statutoryAnnualLeave: number;
  legalNoticeDaysRequired: number;
  requiredNoticeDays: number;
  /** 提出離職預告日 */
  calculatedNoticeDate: Date;
  /** 預告期起算日（告知之次日） */
  noticeStartDate: Date;
  /** 契約最後在職日 */
  calculatedLastWorkingDate: Date;
  /** 離職生效日（退保日）= 最後在職日 + 1 */
  effectiveDate: Date;
  /** 實際最後到辦公室出勤日 */
  actualOfficeDate: Date;
  /** 特休排休起始日（無排休時為 null） */
  leaveStartDate: Date | null;
  /** 特休排休結束日（無排休時為 null） */
  leaveEndDate: Date | null;
  /** 預告期內實際排休的特休工作天數 */
  actualTakeLeaveDays: number;
  /** 預告期內可排休的工作天數上限 */
  maxTakeableLeaveDays: number;
  /** 折現（不休假工資）天數 */
  payoutDaysTotal: number;
  /** 提出日→最後在職日 給予的曆天預告天數 */
  noticeDiffDays: number;
  isPeriodSufficient: boolean;
  isNoticeInPast: boolean;
  daysRemainingFromToday: number;
  isNoticeOverdueFromToday: boolean;
  missingDaysStandard: number;
  missingDaysFromToday: number;
  /** 若今天才提出預告，順延後的最後在職日 */
  postponeLastWorkingFromToday: Date;
  dailyAvgSalary: number;
  estimatedLeavePayout: number;
  maxJobSeekingLeaveDays: number;
  /** 預告期間內涵蓋的台灣國定假日清單 */
  holidaysInPeriod: HolidayInPeriod[];
  /** 勞退新制資遣費基數（月數，最高 6 個月） */
  severanceMonths: number;
  /** 預估勞退新制資遣費（元） */
  estimatedSeverancePay: number;
  /** 雇主未足額預告應發給之預告工資（元） */
  estimatedNoticePay: number;
  /** 離職結算預估總領金額（特休折現 + 資遣費 + 預告工資） */
  totalEstimatedPayout: number;
  /** 預告期互動月曆逐日資料 */
  calendarDays: NoticeCalendarDay[];
  /** 破月薪資與月底健保結算洞察 */
  monthEndInsight: MonthEndInsight;
}

export function calculateResignation(input: ResignationInput): ResignationResult {
  const today = parseYmd(input.today) ?? dayFloor(new Date());
  const today0 = dayFloor(today);
  const useTaiwanHolidays = input.useTaiwanHolidays ?? true;
  const resignationType: ResignationType = input.resignationType ?? 'voluntary';

  const onboardingD = parseYmd(input.onboardingDate) ?? today0;

  // 1. 年資估算（依提出的離職日或目標最後在職日）
  let refNoticeDate = parseYmd(input.noticeDate) ?? new Date(today0.getTime());
  if (input.calcDirection === 'lastToNotice') {
    refNoticeDate = parseYmd(input.targetLastWorkingDate) ?? refNoticeDate;
  }

  const totalDaysTenure = Math.floor(
    Math.max(0, refNoticeDate.getTime() - onboardingD.getTime()) / MS_PER_DAY,
  );

  let tenureYears = refNoticeDate.getFullYear() - onboardingD.getFullYear();
  let tenureMonths = refNoticeDate.getMonth() - onboardingD.getMonth();
  if (tenureMonths < 0) {
    tenureYears--;
    tenureMonths += 12;
  }

  const statutoryAnnualLeave = getStatutoryAnnualLeave(totalDaysTenure, tenureYears);
  const legalNoticeDaysRequired = getLegalNoticeDays(totalDaysTenure);
  const requiredNoticeDays =
    input.noticeMode === 'auto'
      ? legalNoticeDaysRequired
      : Math.max(0, Number(input.customDays) || 0);

  // 2. 依方向推算提出日與最後在職日
  let calculatedNoticeD: Date;
  let calculatedLastWorkingD: Date;

  if (input.calcDirection === 'noticeToLast') {
    calculatedNoticeD = parseYmd(input.noticeDate) ?? new Date(today0.getTime());
    if (requiredNoticeDays > 0) {
      calculatedLastWorkingD = addDays(calculatedNoticeD, requiredNoticeDays);
    } else {
      calculatedLastWorkingD = new Date(calculatedNoticeD.getTime());
    }
  } else {
    calculatedLastWorkingD =
      parseYmd(input.targetLastWorkingDate) ?? new Date(today0.getTime());
    calculatedNoticeD =
      requiredNoticeDays > 0
        ? addDays(calculatedLastWorkingD, -requiredNoticeDays)
        : new Date(calculatedLastWorkingD.getTime());
  }

  const noticeStartDate = addDays(calculatedNoticeD, 1);
  const effectiveDate = addDays(calculatedLastWorkingD, 1);

  // 2.5 收集預告期間內的台灣國定假日
  const holidaysInPeriod: HolidayInPeriod[] = [];
  if (useTaiwanHolidays) {
    const cursor = new Date(noticeStartDate.getTime());
    while (cursor.getTime() <= calculatedLastWorkingD.getTime()) {
      const ds = formatDateStr(cursor);
      const h = TAIWAN_HOLIDAYS[ds];
      if (h) {
        holidaysInPeriod.push({ date: ds, nameZh: h.zh, nameEn: h.en });
      }
      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // 3. 特休排休 / 折現與實際最後出勤日
  const leaveDaysTotal = Math.max(0, Number(input.annualLeaveDays) || 0);
  const maxTakeableLeaveDays = countWorkingDaysBetween(
    calculatedNoticeD,
    calculatedLastWorkingD,
    useTaiwanHolidays,
  );

  const customLeaveSet = new Set(
    (input.customLeaveDates ?? []).filter((d) => Boolean(parseYmd(d))),
  );
  const hasCustomSelection = customLeaveSet.size > 0;

  // 先解析並夾緊自訂最後出勤日於 [提出離職通知日, 契約最後在職日] 之間（退保生效日已終止契約不可出勤）
  const rawCustomOfficeD =
    parseYmd(input.customOfficeDate) ?? new Date(calculatedLastWorkingD.getTime());
  const clampedCustomOfficeD = new Date(
    Math.min(
      calculatedLastWorkingD.getTime(),
      Math.max(calculatedNoticeD.getTime(), rawCustomOfficeD.getTime()),
    ),
  );

  let actualTakeLeaveDays: number;
  if (hasCustomSelection) {
    // 僅統計在預告期內且為工作日的點選日期，並以總特休天數為上限
    let validCustomCount = 0;
    const cursor = new Date(noticeStartDate.getTime());
    while (cursor.getTime() <= calculatedLastWorkingD.getTime()) {
      const ds = formatDateStr(cursor);
      if (customLeaveSet.has(ds) && !isNonWorkingDay(cursor, useTaiwanHolidays)) {
        validCustomCount++;
      } else {
        customLeaveSet.delete(ds);
      }
      cursor.setDate(cursor.getDate() + 1);
    }
    actualTakeLeaveDays = Math.min(leaveDaysTotal, validCustomCount);
  } else {
    const leaveToTakeInput = Math.max(0, Number(input.leaveDaysToTake) || 0);
    const intendedTakeDays = Math.min(leaveDaysTotal, leaveToTakeInput);
    // 若選擇「最後在職日當天出勤」或「自訂最後出勤日」，且該出勤日為預告期內之工作日，至少保留該天出勤不排休
    const reservedOfficeTarget =
      input.officeDayMode === 'lastWorkingDay'
        ? calculatedLastWorkingD
        : input.officeDayMode === 'custom'
        ? clampedCustomOfficeD
        : null;
    const reserveOfficeWorkday =
      reservedOfficeTarget &&
      reservedOfficeTarget.getTime() > calculatedNoticeD.getTime() &&
      !isNonWorkingDay(reservedOfficeTarget, useTaiwanHolidays) &&
      maxTakeableLeaveDays > 0
        ? 1
        : 0;
    actualTakeLeaveDays = Math.min(
      intendedTakeDays,
      Math.max(0, maxTakeableLeaveDays - reserveOfficeWorkday),
    );
  }

  const payoutDaysTotal = toRounded(
    D(leaveDaysTotal).minus(actualTakeLeaveDays).isNegative()
      ? 0
      : D(leaveDaysTotal).minus(actualTakeLeaveDays),
    2,
  );

  // 4. 決定實際最後出勤日與排休日期集合
  let actualOfficeDate = new Date(calculatedLastWorkingD.getTime());
  if (!hasCustomSelection) {
    if (input.officeDayMode === 'autoLeaveEnd') {
      if (actualTakeLeaveDays > 0) {
        actualOfficeDate = subtractWorkingDays(
          calculatedLastWorkingD,
          Math.floor(actualTakeLeaveDays),
          useTaiwanHolidays,
        );
        if (actualOfficeDate.getTime() < calculatedNoticeD.getTime()) {
          actualOfficeDate = new Date(calculatedNoticeD.getTime());
        }
      }
    } else if (input.officeDayMode === 'custom') {
      actualOfficeDate = clampedCustomOfficeD;
    }
  }

  const scheduledLeaveDateSet = new Set<string>();
  if (hasCustomSelection) {
    for (const ds of customLeaveSet) {
      scheduledLeaveDateSet.add(ds);
    }
    // 手動點選月曆排休時，實際最後出勤日為預告期內最後一個未排休之工作日
    const cursor = new Date(calculatedLastWorkingD.getTime());
    while (cursor.getTime() > calculatedNoticeD.getTime()) {
      const ds = formatDateStr(cursor);
      if (!isNonWorkingDay(cursor, useTaiwanHolidays) && !scheduledLeaveDateSet.has(ds)) {
        break;
      }
      cursor.setDate(cursor.getDate() - 1);
    }
    actualOfficeDate = cursor;
  } else if (actualTakeLeaveDays > 0) {
    const wholeLeaveDays = Math.ceil(actualTakeLeaveDays);
    if (input.officeDayMode === 'autoLeaveEnd') {
      // 離職前集中排休：從最後在職日往前標記整數工作天為特休排休日
      const cursor = new Date(calculatedLastWorkingD.getTime());
      let marked = 0;
      while (cursor.getTime() > calculatedNoticeD.getTime() && marked < wholeLeaveDays) {
        if (!isNonWorkingDay(cursor, useTaiwanHolidays)) {
          scheduledLeaveDateSet.add(formatDateStr(cursor));
          marked++;
        }
        cursor.setDate(cursor.getDate() - 1);
      }
    } else {
      // 最後在職日當天出勤 或 自訂最後出勤日：避開實際最後出勤日當天，從最後在職日往前排休（使用者亦可於月曆自由點選調整）
      const reservedOfficeStr = formatDateStr(actualOfficeDate);
      const cursor = new Date(calculatedLastWorkingD.getTime());
      let marked = 0;
      while (cursor.getTime() > calculatedNoticeD.getTime() && marked < wholeLeaveDays) {
        const ds = formatDateStr(cursor);
        if (!isNonWorkingDay(cursor, useTaiwanHolidays) && ds !== reservedOfficeStr) {
          scheduledLeaveDateSet.add(ds);
          marked++;
        }
        cursor.setDate(cursor.getDate() - 1);
      }
    }
  }

  const sortedLeaveDates = Array.from(scheduledLeaveDateSet).sort();
  const leaveStartDate =
    sortedLeaveDates.length > 0 ? parseYmd(sortedLeaveDates[0]) : null;
  const leaveEndDate =
    sortedLeaveDates.length > 0
      ? parseYmd(sortedLeaveDates[sortedLeaveDates.length - 1])
      : null;

  // 5. 合規與過期檢核
  const noticeDiffDays = diffCalendarDays(calculatedNoticeD, calculatedLastWorkingD);
  const isPeriodSufficient = noticeDiffDays >= requiredNoticeDays;
  const isNoticeInPast = dayFloor(calculatedNoticeD).getTime() < today0.getTime();
  const daysRemainingFromToday = diffCalendarDays(today0, calculatedLastWorkingD);
  const isNoticeOverdueFromToday = isNoticeInPast && daysRemainingFromToday < requiredNoticeDays;
  const missingDaysStandard = Math.max(0, requiredNoticeDays - noticeDiffDays);
  const missingDaysFromToday = Math.max(0, requiredNoticeDays - daysRemainingFromToday);
  const postponeLastWorkingFromToday = addDays(
    today0,
    requiredNoticeDays > 0 ? requiredNoticeDays : 0,
  );

  // 6. 特休折現、勞退新制資遣費與預告工資（全程 BigNumber.js 定點數）
  const salaryNum = Math.max(0, Number(input.monthlySalary) || 0);
  const dailyAvgSalary = toMoney(D(salaryNum).div(30));
  const estimatedLeavePayout = toMoney(D(dailyAvgSalary).times(payoutDaysTotal));
  const maxJobSeekingLeaveDays = Math.ceil(requiredNoticeDays / 7) * 2;

  // 勞退新制第 12 條資遣費：以到職日至離職生效日（即最後在職日含當日）計算年資
  const exactTenure = computeExactTenureYMD(onboardingD, effectiveDate);
  const rawSeveranceMonths = D(exactTenure.years)
    .plus(D(exactTenure.months).plus(D(exactTenure.days).div(30)).div(12))
    .times(0.5);
  const cappedSeveranceMonths = BigNumberMin(rawSeveranceMonths, 6);
  const severanceMonths = toRounded(cappedSeveranceMonths, 4);
  const estimatedSeverancePay =
    resignationType === 'involuntary' ? toMoney(D(salaryNum).times(cappedSeveranceMonths)) : 0;

  const shortNoticeDays = Math.max(0, Number(input.employerShortNoticeDays) || 0);
  const estimatedNoticePay =
    resignationType === 'involuntary' && shortNoticeDays > 0
      ? toMoney(D(dailyAvgSalary).times(shortNoticeDays))
      : 0;

  const totalEstimatedPayout = toMoney(
    D(estimatedLeavePayout).plus(estimatedSeverancePay).plus(estimatedNoticePay),
  );

  // 7. 建構預告期逐日互動月曆模型
  const calendarDays: NoticeCalendarDay[] = [];
  const noticeDateStr = formatDateStr(calculatedNoticeD);
  const noticeStartStr = formatDateStr(noticeStartDate);
  const actualOfficeStr = formatDateStr(actualOfficeDate);
  const lastWorkingStr = formatDateStr(calculatedLastWorkingD);
  const effectiveStr = formatDateStr(effectiveDate);

  const totalSpan = diffCalendarDays(calculatedNoticeD, effectiveDate);
  if (totalSpan >= 0 && totalSpan <= 120) {
    const cursor = new Date(calculatedNoticeD.getTime());
    while (cursor.getTime() <= effectiveDate.getTime()) {
      const ds = formatDateStr(cursor);
      const dClone = new Date(cursor.getTime());
      const weekend = isWeekend(dClone);
      const makeup = useTaiwanHolidays && isTaiwanMakeupWorkday(ds);
      const holidayEntry = useTaiwanHolidays ? TAIWAN_HOLIDAYS[ds] : undefined;
      const isNonWork = isNonWorkingDay(dClone, useTaiwanHolidays);
      const isInNoticePeriod =
        dClone.getTime() > calculatedNoticeD.getTime() &&
        dClone.getTime() <= calculatedLastWorkingD.getTime();

      let status: CalendarDayStatus = 'work';
      if (ds === effectiveStr) {
        status = 'effective';
      } else if (ds === noticeDateStr && requiredNoticeDays > 0) {
        status = 'notice';
      } else if (scheduledLeaveDateSet.has(ds)) {
        status = 'annualLeave';
      } else if (holidayEntry) {
        status = 'holiday';
      } else if (weekend && !makeup) {
        status = 'weekend';
      }

      calendarDays.push({
        dateStr: ds,
        date: dClone,
        dayOfWeek: dClone.getDay(),
        status,
        isNoticeDate: ds === noticeDateStr,
        isNoticeStartDate: ds === noticeStartStr,
        isActualOfficeDate: ds === actualOfficeStr,
        isLastWorkingDate: ds === lastWorkingStr,
        isEffectiveDate: ds === effectiveStr,
        isWeekend: weekend,
        isMakeupWorkday: makeup,
        holidayNameZh: holidayEntry?.zh ?? null,
        holidayNameEn: holidayEntry?.en ?? null,
        canToggleLeave: isInNoticePeriod && !isNonWork && leaveDaysTotal > 0,
      });

      cursor.setDate(cursor.getDate() + 1);
    }
  }

  // 8. 破月薪資與月底健保結算洞察
  const lastYear = calculatedLastWorkingD.getFullYear();
  const lastMonth = calculatedLastWorkingD.getMonth();
  const daysInLastMonth = new Date(lastYear, lastMonth + 1, 0).getDate();
  const lastDayDate = calculatedLastWorkingD.getDate();
  const isLastDayOfMonth = lastDayDate === daysInLastMonth;

  const monthFirstDay = new Date(lastYear, lastMonth, 1);
  const activeStartInLastMonth =
    onboardingD.getTime() > monthFirstDay.getTime() ? onboardingD : monthFirstDay;
  const workedDaysInLastMonth = Math.max(
    0,
    diffCalendarDays(activeStartInLastMonth, calculatedLastWorkingD) + 1,
  );

  const proratedFinalMonthSalary =
    isLastDayOfMonth && activeStartInLastMonth.getTime() === monthFirstDay.getTime()
      ? salaryNum
      : toMoney(D(dailyAvgSalary).times(Math.min(30, workedDaysInLastMonth)));

  const lastDow = calculatedLastWorkingD.getDay();
  const canExtendToSunday = lastDow === 5 || lastDow === 6;
  const extraWeekendDays = lastDow === 5 ? 2 : lastDow === 6 ? 1 : 0;
  const sundayDate = canExtendToSunday
    ? addDays(calculatedLastWorkingD, extraWeekendDays)
    : calculatedLastWorkingD;
  const extraWeekendSalary = toMoney(D(dailyAvgSalary).times(extraWeekendDays));

  return {
    totalDaysTenure,
    tenureYears,
    tenureMonths,
    statutoryAnnualLeave,
    legalNoticeDaysRequired,
    requiredNoticeDays,
    calculatedNoticeDate: calculatedNoticeD,
    noticeStartDate,
    calculatedLastWorkingDate: calculatedLastWorkingD,
    effectiveDate,
    actualOfficeDate,
    leaveStartDate,
    leaveEndDate,
    actualTakeLeaveDays,
    maxTakeableLeaveDays,
    payoutDaysTotal,
    noticeDiffDays,
    isPeriodSufficient,
    isNoticeInPast,
    daysRemainingFromToday,
    isNoticeOverdueFromToday,
    missingDaysStandard,
    missingDaysFromToday,
    postponeLastWorkingFromToday,
    dailyAvgSalary,
    estimatedLeavePayout,
    maxJobSeekingLeaveDays,
    holidaysInPeriod,
    severanceMonths,
    estimatedSeverancePay,
    estimatedNoticePay,
    totalEstimatedPayout,
    calendarDays,
    monthEndInsight: {
      isLastDayOfMonth,
      daysInLastMonth,
      workedDaysInLastMonth,
      proratedFinalMonthSalary,
      canExtendToSunday,
      sundayDateStr: formatDateStr(sundayDate),
      extraWeekendDays,
      extraWeekendSalary,
    },
  };
}

function BigNumberMin(a: ReturnType<typeof D>, maxVal: number) {
  return a.gt(maxVal) ? D(maxVal) : a;
}

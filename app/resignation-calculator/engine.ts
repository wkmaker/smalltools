/**
 * 離職預告期試算純函數引擎（無副作用、可毫秒級單元測試）。
 *
 * 從 `ResignationCalculatorClient.tsx` 抽離：依勞基法第 16 條計算法定預告天數、
 * 正向 / 反向推算提出日與最後在職日、起算日、離職生效日（退保日）、
 * 特休排休 / 折現、謀職假、合規檢核與過期判定。
 *
 * 純日期字串（YYYY-MM-DD）一律以「本地零時」建構，不做時區轉換（鐵則 7、8），
 * 修正原本 `new Date('YYYY-MM-DD')`（UTC 解析）在 UTC+8 以外時區會退一天的問題。
 */

/** 將 YYYY-MM-DD 以本地零時建構 Date；無效輸入回傳 null */
export function parseYmd(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
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

/** 往前推算 N 個工作天（跳過週末） */
export function subtractWorkingDays(startDate: Date, daysToSubtract: number): Date {
  const current = new Date(startDate.getTime());
  while (isWeekend(current)) current.setDate(current.getDate() - 1);
  let count = 0;
  while (count < daysToSubtract) {
    current.setDate(current.getDate() - 1);
    if (!isWeekend(current)) count++;
  }
  return current;
}

/** 計算「告知之次日」起算至 endDate 的實際工作天數（跳過週末） */
export function countWorkingDaysBetween(startDate: Date, endDate: Date): number {
  const current = new Date(startDate.getTime());
  current.setDate(current.getDate() + 1);
  let count = 0;
  while (current.getTime() <= endDate.getTime()) {
    if (!isWeekend(current)) count++;
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

export type CalcDirection = 'noticeToLast' | 'lastToNotice';
export type NoticeMode = 'auto' | 'custom';
export type OfficeDayMode = 'autoLeaveEnd' | 'lastWorkingDay' | 'custom';

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
  annualLeaveDays: number;
  leaveDaysToTake: number;
  officeDayMode: OfficeDayMode;
  /** 自訂最後出勤日 YYYY-MM-DD */
  customOfficeDate: string;
  /** 月薪（試算特休代金） */
  monthlySalary: number;
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
}

export function calculateResignation(input: ResignationInput): ResignationResult {
  const today = parseYmd(input.today) ?? dayFloor(new Date());
  const today0 = dayFloor(today);

  const onboardingD = parseYmd(input.onboardingDate) ?? today0;

  // 1. 年資估算（依提出的離職日或目標最後在職日）
  let refNoticeDate = parseYmd(input.noticeDate) ?? new Date(today0.getTime());
  if (input.calcDirection === 'lastToNotice') {
    refNoticeDate = parseYmd(input.targetLastWorkingDate) ?? refNoticeDate;
  }

  const totalDaysTenure = Math.floor(Math.max(0, refNoticeDate.getTime() - onboardingD.getTime()) / MS_PER_DAY);

  let tenureYears = refNoticeDate.getFullYear() - onboardingD.getFullYear();
  let tenureMonths = refNoticeDate.getMonth() - onboardingD.getMonth();
  if (tenureMonths < 0) {
    tenureYears--;
    tenureMonths += 12;
  }

  const statutoryAnnualLeave = getStatutoryAnnualLeave(totalDaysTenure, tenureYears);
  const legalNoticeDaysRequired = getLegalNoticeDays(totalDaysTenure);
  const requiredNoticeDays =
    input.noticeMode === 'auto' ? legalNoticeDaysRequired : Math.max(0, Number(input.customDays) || 0);

  // 2. 依方向推算提出日與最後在職日
  let calculatedNoticeD: Date;
  let calculatedLastWorkingD: Date;

  if (input.calcDirection === 'noticeToLast') {
    calculatedNoticeD = parseYmd(input.noticeDate) ?? new Date(today0.getTime());
    if (requiredNoticeDays > 0) {
      // 起算日為告知之次日，滿 N 天當天即為最後在職日
      calculatedLastWorkingD = addDays(calculatedNoticeD, requiredNoticeDays);
    } else {
      calculatedLastWorkingD = new Date(calculatedNoticeD.getTime());
    }
  } else {
    calculatedLastWorkingD = parseYmd(input.targetLastWorkingDate) ?? new Date(today0.getTime());
    calculatedNoticeD =
      requiredNoticeDays > 0 ? addDays(calculatedLastWorkingD, -requiredNoticeDays) : new Date(calculatedLastWorkingD.getTime());
  }

  const noticeStartDate = addDays(calculatedNoticeD, 1);
  const effectiveDate = addDays(calculatedLastWorkingD, 1);

  // 3. 特休排休 / 折現
  const leaveDaysTotal = Math.max(0, Number(input.annualLeaveDays) || 0);
  const leaveToTakeInput = Math.max(0, Number(input.leaveDaysToTake) || 0);
  const intendedTakeDays = Math.min(leaveDaysTotal, leaveToTakeInput);
  const maxTakeableLeaveDays = countWorkingDaysBetween(calculatedNoticeD, calculatedLastWorkingD);
  const actualTakeLeaveDays = Math.min(intendedTakeDays, maxTakeableLeaveDays);
  const payoutDaysTotal = Math.max(0, leaveDaysTotal - actualTakeLeaveDays);

  // 4. 實際最後出勤日
  let actualOfficeDate = new Date(calculatedLastWorkingD.getTime());
  if (input.officeDayMode === 'autoLeaveEnd') {
    if (actualTakeLeaveDays > 0) {
      actualOfficeDate = subtractWorkingDays(calculatedLastWorkingD, actualTakeLeaveDays);
      if (actualOfficeDate.getTime() < calculatedNoticeD.getTime()) {
        actualOfficeDate = new Date(calculatedNoticeD.getTime());
      }
    }
  } else if (input.officeDayMode === 'custom') {
    actualOfficeDate = parseYmd(input.customOfficeDate) ?? new Date(calculatedLastWorkingD.getTime());
  }

  // 5. 合規與過期檢核
  const noticeDiffDays = diffCalendarDays(calculatedNoticeD, calculatedLastWorkingD);
  const isPeriodSufficient = noticeDiffDays >= requiredNoticeDays;
  const isNoticeInPast = dayFloor(calculatedNoticeD).getTime() < today0.getTime();
  const daysRemainingFromToday = diffCalendarDays(today0, calculatedLastWorkingD);
  const isNoticeOverdueFromToday = isNoticeInPast && daysRemainingFromToday < requiredNoticeDays;
  const missingDaysStandard = Math.max(0, requiredNoticeDays - noticeDiffDays);
  const missingDaysFromToday = Math.max(0, requiredNoticeDays - daysRemainingFromToday);
  const postponeLastWorkingFromToday = addDays(today0, requiredNoticeDays > 0 ? requiredNoticeDays : 0);

  // 6. 特休折現金額
  const salaryNum = Math.max(0, Number(input.monthlySalary) || 0);
  const dailyAvgSalary = Math.round(salaryNum / 30);
  const estimatedLeavePayout = Math.round(dailyAvgSalary * payoutDaysTotal);
  const maxJobSeekingLeaveDays = Math.ceil(requiredNoticeDays / 7) * 2;

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
  };
}

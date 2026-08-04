'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import styles from './resignation-calculator.module.css';

// 語意化雙語字典
const TRANSLATIONS = {
  'zh-TW': {
    backToHome: '返回首頁',
    langToggle: 'English',
    title: '離職時間與預告期計算機',
    subtitle: 'RESIGNATION & NOTICE PERIOD CALCULATOR',
    description: '依台灣勞基法第 16 條精準計算法定預告天數、離職生效日、最後在職日與特休排休/折現試算。支援「正向提出日推算」與「目標離職日反向推算」，並附帶過期與預告期天數充足度檢核。',
    
    // 計算方向模式 (簡潔專業無 Emoji / 無 redundant 贅字)
    calcDirectionLabel: '試算目標',
    dirNoticeToLast: '「哪一天能離職」（由提出離職日算起）',
    dirLastToNotice: '「哪一天最晚要提出」（由目標離職日倒推）',

    // 表單標籤
    onboardingDateLabel: '到職日期',
    noticeDateLabel: '預計提出離職日',
    targetLastWorkingDateLabel: '目標最後在職日',
    noticeOptionLabel: '預告天數計算方式',
    autoLaborLaw: '依勞基法第 16 條自動計算',
    customNotice: '自訂預告天數',
    customDaysLabel: '自訂預告天數 (天)',
    resignationTypeLabel: '離職類型',
    typeVoluntary: '自願離職 (一般離職)',
    typeInvoluntary: '非自願離職 (被資遣 - 享有謀職假)',
    
    annualLeaveLabel: '剩餘未休特休假 (天)',
    leaveHandlingLabel: '特休假處理方式',
    leaveTakeAll: '離職前全部排休完畢 (推算最後出勤日)',
    leavePayout: '不排休，全數折算現金 (不休假工資)',
    
    officeDayModeLabel: '最後到辦公室出勤日推算',
    officeDayAutoLeaveEnd: '離職前集中排休 (預設：由最後在職日倒推)',
    officeDayLastWorking: '最後在職日當天出勤 (特休分散排休/不集中離職前)',
    officeDayCustom: '自訂最後到辦公室日期',
    customOfficeDateLabel: '自訂最後到辦公室日期',
    
    monthlySalaryLabel: '月薪 (TWD) [選填: 試算特休代金]',
    monthlySalaryPlaceholder: '請輸入月薪，如 50000',

    // 合規檢查告警
    insufficientNoticeWarningTitle: '預告天數不足告警！',
    pastNoticeOverdueTitle: '最晚提出預告日已過期！(天數不足)',
    insufficientNoticeDesc1: '您目前設定的預告期間僅給予',
    insufficientNoticeDesc2: '天，不足法定/要求之',
    insufficientNoticeDesc3: '天預告期（尚缺',
    insufficientNoticeDesc4: '天）。',
    
    pastNoticeOverdueDesc1: '依目標最後在職日推算，最晚應於',
    pastNoticeOverdueDesc2: '提出預告（已為過去日期）。若您【今天】才要提出離職，距離目標離職日僅剩',
    pastNoticeOverdueDesc3: '天，不足要求的',
    pastNoticeOverdueDesc4: '天預告期（尚缺',
    pastNoticeOverdueDesc5: '天）。',

    earliestNoticeRecommend: '最晚建議提出預告日：',
    recommendPostponeDate: '若今天才提出離職，建議最後在職日順延至：',
    lawAgreementNote: '注意：預告期不足若未經雇主同意，可能產生勞動契約違約或爭議問題。',
    sufficientNoticeSuccess: '預告天數充足，完全符合勞基法定/要求之預告期規範！',
    pastNoticeSuccessNote: '（提示：設定之提出日為過去日期，代表您已於該日正式向雇主遞交預告）',

    // 數據卡片
    legalNoticeDays: '要求預告期',
    noticeStart: '預告期起算日',
    lastWorkingDay: '最後在職日',
    actualOfficeDay: '實際最後出勤日',
    effectiveDate: '離職生效日 (退保日)',
    tenure: '服務總年資',
    
    // 時間軸與明細
    timelineTitle: '關鍵離職時程時間軸',
    noticeGivenNode: '提出離職通知',
    noticeStartNode: '預告期開始起算',
    jobSeekingLeavePeriodNode: '資遣謀職假得請假期間',
    jobSeekingLeaveTimelineDesc: '勞基法第 16 條第 2 項規定：預告期間每星期得請假最多 2 日外出謀職，請假期間工資照給',
    leavePeriodNode: '特休排休期間',
    actualOfficeNode: '最後一天到辦公室出勤',
    lastWorkingNode: '契約最後在職日',
    effectiveNode: '離職正式生效 (退保日)',
    nodePastTag: '(已為過去時間點)',
    
    // 特休與謀職假分析
    leaveAnalysisTitle: '特休假與權益估算',
    leaveDaysCount: '特休排休天數',
    leaveDaysCountUnit: '個工作天',
    leavePayoutEstimate: '特休不休假代金估算',
    dailyAvgSalary: '預估一日平均工資',
    jobSeekingLeaveTitle: '資遣謀職假權益',
    jobSeekingLeaveDesc: '每星期得請假 2 日外出謀職，請假期間工資照給（共約可請',
    
    // 預告範本
    emailTemplateTitle: '一鍵生成離職預告範本 (Email / Line)',
    copyTemplateBtn: '複製離職預告範本',
    copiedSuccess: '已成功複製離職預告範本至剪貼簿！',
    
    // Checklist
    checklistTitle: '離職手續與權益 Check List',
    item1: '索取【服務證明書 / 離職證明書】（非自願離職需註明明細與勞基法條文）',
    item2: '索取【全民健康保險轉出申報表】影本（以利順利銜接下一家公司健保或公所投保）',
    item3: '確認【勞工退休金自提%數】調整（若有自提，離職後新公司將預設不扣自提）',
    item4: '完成公物與權限交接（公司電腦、公務卡、門禁卡、雲端帳號及實體文件移交）',
    item5: '確認最後一個月薪資與特休不休假代金匯款日期',

    // 勞基法條文說明
    laborLawRefTitle: '台灣勞基法第 16 條預告期規範',
    lawRule1: '工作 3 個月以上未滿 1 年者：於 10 日前預告之。',
    lawRule2: '工作 1 年以上未滿 3 年者：於 20 日前預告之。',
    lawRule3: '工作 3 年以上者：於 30 日前預告之。',
    lawNote: '註：未滿 3 個月試用期法令無強制預告期；預告天數包含例假日與國定假日（曆天），非僅工作天。依法院判例，起算日為「告知之次日」。',
    
    statutoryLeaveHint: '依年資法定特休：',
    fillStatutoryBtn: '一鍵帶入',
    leaveToTakeLabel: '離職前預計排休天數 (天)',
    btnTakeZero: '0 天 (全數換錢)',
    btnTakeMax: '全數排休',
    btnStrategicSeverance: '優先請謀職假，特休設 0 天換錢',
    severanceStrategyTitle: '被資遣最佳換錢策略建議',
    severanceStrategyDesc1: '依勞基法規定，資遣謀職假（每週 2 天有薪假）未請「無法折算現金」；而特別休假未休完依法必須「100% 發給工資代金」。',
    severanceStrategyDesc2: '極力建議：優先請滿資遣謀職假外出面試，並將特休假全數保留至離職退保日換錢！預估可額外多領約',
    laborLawArt38Title: '台灣勞基法第 38 條特別休假天數規範',
    art38Rule1: '工作 6 個月以上未滿 1 年者：3 日。',
    art38Rule2: '工作 1 年以上未滿 2 年者：7 日；2 年以上未滿 3 年者：10 日。',
    art38Rule3: '工作 3 年以上未滿 5 年者：每年 14 日；5 年以上未滿 10 年者：每年 15 日。',
    art38Rule4: '工作 10 年以上者：每 1 年加給 1 日，加至 30 日為止。',
  },
  en: {
    backToHome: 'Back to Home',
    langToggle: '繁體中文',
    title: 'Resignation & Notice Period Calculator',
    subtitle: 'RESIGNATION & NOTICE PERIOD CALCULATOR',
    description: 'Calculate official notice periods, last working days, effective dates, and annual leave payouts according to Taiwan Labor Standards Act with intuitive bidirectional calculation & visual timeline highlights.',
    
    // Calc Direction
    calcDirectionLabel: 'Calculation Goal',
    dirNoticeToLast: 'Calculate departure date (from notice date)',
    dirLastToNotice: 'Calculate latest notice date (from target departure)',

    // Labels
    onboardingDateLabel: 'Onboarding Date',
    noticeDateLabel: 'Notice Submission Date',
    targetLastWorkingDateLabel: 'Target Departure Date',
    noticeOptionLabel: 'Notice Calculation Mode',
    autoLaborLaw: 'Auto (Taiwan Labor Standards Act Art. 16)',
    customNotice: 'Custom Notice Days',
    customDaysLabel: 'Custom Notice Days',
    resignationTypeLabel: 'Resignation Type',
    typeVoluntary: 'Voluntary Resignation',
    typeInvoluntary: 'Involuntary (Severance - Job Seeking Leave)',
    
    annualLeaveLabel: 'Remaining Annual Leave (Days)',
    leaveHandlingLabel: 'Annual Leave Handling',
    leaveTakeAll: 'Take all leave before departure (Calculate last office day)',
    leavePayout: 'Payout cash for unused leave',
    
    officeDayModeLabel: 'Last Office Attendance Calculation',
    officeDayAutoLeaveEnd: 'Consecutive leave before departure (Default)',
    officeDayLastWorking: 'On last working day (Leave spread out / Not consecutive)',
    officeDayCustom: 'Custom last office date',
    customOfficeDateLabel: 'Custom Last Office Date',
    
    monthlySalaryLabel: 'Monthly Salary (TWD) [Optional for Leave Payout]',
    monthlySalaryPlaceholder: 'e.g. 50000',

    // Warnings
    insufficientNoticeWarningTitle: 'Insufficient Notice Period Warning!',
    pastNoticeOverdueTitle: 'Latest Notice Date Has Passed! (Insufficient Notice)',
    insufficientNoticeDesc1: 'Your given notice period is only ',
    insufficientNoticeDesc2: ' days, which is less than required ',
    insufficientNoticeDesc3: ' days (Short by ',
    insufficientNoticeDesc4: ' days).',
    
    pastNoticeOverdueDesc1: 'Based on target departure date, notice should have been submitted by ',
    pastNoticeOverdueDesc2: ' (past date). Submitting TODAY leaves only ',
    pastNoticeOverdueDesc3: ' days, short of required ',
    pastNoticeOverdueDesc4: ' days (Short by ',
    pastNoticeOverdueDesc5: ' days).',

    earliestNoticeRecommend: 'Latest recommended notice date: ',
    recommendPostponeDate: 'If submitting today, suggested last working day: ',
    lawAgreementNote: 'Note: Submitting insufficient notice without employer consent may lead to contractual disputes.',
    sufficientNoticeSuccess: 'Notice period is sufficient and fully complies with legal requirements!',
    pastNoticeSuccessNote: '(Note: Notice date is in the past, assuming notice was submitted on that day)',

    // Stat Cards
    legalNoticeDays: 'Notice Days Required',
    noticeStart: 'Notice Period Start',
    lastWorkingDay: 'Last Working Day',
    actualOfficeDay: 'Actual Last Office Day',
    effectiveDate: 'Effective Resignation Date',
    tenure: 'Total Tenure',
    
    // Timeline
    timelineTitle: 'Key Resignation Timeline',
    noticeGivenNode: 'Submit Resignation Notice',
    noticeStartNode: 'Notice Period Begins',
    jobSeekingLeavePeriodNode: 'Job-Seeking Leave Period',
    jobSeekingLeaveTimelineDesc: 'Labor Standards Act Art. 16: Entitled to up to 2 paid days off per week during notice period for job hunting',
    leavePeriodNode: 'Annual Leave Period',
    actualOfficeNode: 'Last Day at Office',
    lastWorkingNode: 'Last Contractual Working Day',
    effectiveNode: 'Resignation Effective Date',
    nodePastTag: '(Past Date)',
    
    // Breakdown
    leaveAnalysisTitle: 'Leave & Benefits Breakdown',
    leaveDaysCount: 'Leave Taken Days',
    leaveDaysCountUnit: ' working days',
    leavePayoutEstimate: 'Estimated Leave Payout',
    dailyAvgSalary: 'Estimated Daily Salary',
    jobSeekingLeaveTitle: 'Job-Seeking Leave Benefit',
    jobSeekingLeaveDesc: 'Entitled to 2 paid days off per week during notice period for job hunting (Approx.',
    
    // Email Template
    emailTemplateTitle: 'Resignation Notice Email Generator',
    copyTemplateBtn: 'Copy Resignation Email',
    copiedSuccess: 'Copied resignation notice email to clipboard!',
    
    // Checklist
    checklistTitle: 'Offboarding Checklist',
    item1: 'Request Certificate of Service / Employment Certificate',
    item2: 'Request Health Insurance Cancellation / Transfer Form',
    item3: 'Check Voluntary Pension Contribution status',
    item4: 'Complete handovers of assets, access cards, and credentials',
    item5: 'Confirm final salary and leave payout transfer date',

    // Labor Law Reference
    laborLawRefTitle: 'Taiwan Labor Standards Act (Article 16)',
    lawRule1: 'Tenure 3 months to < 1 year: 10 days notice required.',
    lawRule2: 'Tenure 1 year to < 3 years: 20 days notice required.',
    lawRule3: 'Tenure 3+ years: 30 days notice required.',
    lawNote: 'Note: Notice period begins the day after notice is submitted and includes calendar weekends/holidays.',

    statutoryLeaveHint: 'Statutory quota by tenure: ',
    fillStatutoryBtn: 'Fill',
    leaveToTakeLabel: 'Intended Leave Days to Take Off (Days)',
    btnTakeZero: '0 days (All Cash)',
    btnTakeMax: 'Take All',
    btnStrategicSeverance: 'Use Job-Seeking Leave & Preserve Leave for Cash',
    severanceStrategyTitle: 'Optimal Severance Strategy Advice',
    severanceStrategyDesc1: 'Job-seeking leave cannot be cashed out if unused, whereas unused annual leave MUST be paid out 100% in cash by law.',
    severanceStrategyDesc2: 'Recommendation: Maximize paid job-seeking leave for interviews, and preserve all annual leave for cash payout! Est. extra cash:',
    laborLawArt38Title: 'Taiwan Labor Standards Act Art. 38 (Annual Leave)',
    art38Rule1: 'Tenure 6 mos to < 1 yr: 3 days.',
    art38Rule2: 'Tenure 1 yr to < 2 yrs: 7 days; 2 yrs to < 3 yrs: 10 days.',
    art38Rule3: 'Tenure 3 yrs to < 5 yrs: 14 days/yr; 5 yrs to < 10 yrs: 15 days/yr.',
    art38Rule4: 'Tenure 10+ yrs: +1 day per year up to 30 days max.',
  },
};

// 格式化 Date 為 YYYY-MM-DD
function formatDateStr(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// 格式化 Date 為中文顯示 (如 2026/08/15 (六))
function formatDateFriendly(date: Date, lang: 'zh-TW' | 'en'): string {
  const daysZh = ['日', '一', '二', '三', '四', '五', '六'];
  const daysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const dayName = lang === 'zh-TW' ? `(${daysZh[date.getDay()]})` : `(${daysEn[date.getDay()]})`;
  return `${y}/${m}/${d} ${dayName}`;
}

// 判斷是否為週末
function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

// 往前推算 N 個工作天（扣除週末）
function subtractWorkingDays(startDate: Date, daysToSubtract: number): Date {
  const current = new Date(startDate.getTime());
  let count = 0;
  
  while (isWeekend(current)) {
    current.setDate(current.getDate() - 1);
  }
  
  while (count < daysToSubtract) {
    current.setDate(current.getDate() - 1);
    if (!isWeekend(current)) {
      count++;
    }
  }
  return current;
}

// 計算兩日期的實際工作天數（扣除週末）
function countWorkingDaysBetween(startDate: Date, endDate: Date): number {
  const current = new Date(startDate.getTime());
  current.setDate(current.getDate() + 1); // 告知之次日起算
  let count = 0;
  while (current.getTime() <= endDate.getTime()) {
    if (!isWeekend(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

// 依據勞動基準法第 38 條第 1 項計算法定特別休假天數
function getStatutoryAnnualLeave(totalDaysTenure: number, tenureYears: number): number {
  if (totalDaysTenure < 182) return 0; // 未滿 6 個月：0 日
  if (totalDaysTenure < 365) return 3; // 6 個月以上未滿 1 年：3 日
  if (tenureYears < 2) return 7;      // 1 年以上未滿 2 年：7 日
  if (tenureYears < 3) return 10;     // 2 年以上未滿 3 年：10 日
  if (tenureYears < 5) return 14;     // 3 年以上未滿 5 年：每年 14 日
  if (tenureYears < 10) return 15;    // 5 年以上未滿 10 年：每年 15 日
  return Math.min(30, 15 + (tenureYears - 9)); // 10 年以上：每 1 年加給 1 日，加至 30 日為止
}

interface Props {
  lang?: 'zh-TW' | 'en';
}

export default function ResignationCalculatorClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  // IDs
  const calcDirSelectId = useId();
  const onboardingInputId = useId();
  const noticeInputId = useId();
  const targetLastWorkingInputId = useId();
  const noticeModeSelectId = useId();
  const customDaysInputId = useId();
  const typeSelectId = useId();
  const leaveDaysInputId = useId();
  const leaveHandlingSelectId = useId();
  const officeDayModeSelectId = useId();
  const customOfficeInputId = useId();
  const salaryInputId = useId();

  // 預設日期設定
  const today = new Date();
  const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const defaultNoticeDateStr = formatDateStr(today);
  
  // 預設到職日：1 年前的今天
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(today.getFullYear() - 1);
  const defaultOnboardingStr = formatDateStr(oneYearAgo);

  // 預設目標最後在職日：20 天後
  const defaultTargetLastDate = new Date();
  defaultTargetLastDate.setDate(today.getDate() + 20);
  const defaultTargetLastDateStr = formatDateStr(defaultTargetLastDate);

  // States
  const [calcDirection, setCalcDirection] = useState<'noticeToLast' | 'lastToNotice'>('noticeToLast');
  const [onboardingDate, setOnboardingDate] = useState<string>(defaultOnboardingStr);
  const [noticeDate, setNoticeDate] = useState<string>(defaultNoticeDateStr);
  const [targetLastWorkingDate, setTargetLastWorkingDate] = useState<string>(defaultTargetLastDateStr);
  
  const [noticeMode, setNoticeMode] = useState<'auto' | 'custom'>('auto');
  const [customDays, setCustomDays] = useState<number | ''>(20);
  const [resignationType, setResignationType] = useState<'voluntary' | 'involuntary'>('voluntary');
  const [annualLeaveDays, setAnnualLeaveDays] = useState<number | ''>(5);
  const [leaveDaysToTake, setLeaveDaysToTake] = useState<number | ''>(5);
  const [officeDayMode, setOfficeDayMode] = useState<'autoLeaveEnd' | 'lastWorkingDay' | 'custom'>('autoLeaveEnd');
  const [customOfficeDate, setCustomOfficeDate] = useState<string>('');
  const [monthlySalary, setMonthlySalary] = useState<number | ''>(60000);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(false);

  // 掛載時設置主題色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);

  // URL 雙向狀態連動
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    
    if (params.has('dir') && (params.get('dir') === 'noticeToLast' || params.get('dir') === 'lastToNotice')) {
      setCalcDirection(params.get('dir') as 'noticeToLast' | 'lastToNotice');
    }
    if (params.has('onboarding')) setOnboardingDate(params.get('onboarding') || defaultOnboardingStr);
    if (params.has('notice')) setNoticeDate(params.get('notice') || defaultNoticeDateStr);
    if (params.has('targetLast')) setTargetLastWorkingDate(params.get('targetLast') || defaultTargetLastDateStr);
    if (params.has('mode') && (params.get('mode') === 'auto' || params.get('mode') === 'custom')) {
      setNoticeMode(params.get('mode') as 'auto' | 'custom');
    }
    if (params.has('customDays')) {
      const parsed = parseInt(params.get('customDays') || '20', 10);
      if (!isNaN(parsed)) setCustomDays(parsed);
    }
    if (params.has('type') && (params.get('type') === 'voluntary' || params.get('type') === 'involuntary')) {
      setResignationType(params.get('type') as 'voluntary' | 'involuntary');
    }
    if (params.has('leave')) {
      const parsed = parseFloat(params.get('leave') || '5');
      if (!isNaN(parsed)) setAnnualLeaveDays(parsed);
    }
    if (params.has('leaveToTake')) {
      const parsed = parseFloat(params.get('leaveToTake') || '5');
      if (!isNaN(parsed)) setLeaveDaysToTake(parsed);
    } else if (params.has('leaveMode') && params.get('leaveMode') === 'payout') {
      setLeaveDaysToTake(0);
    }
    if (params.has('officeMode') && (params.get('officeMode') === 'autoLeaveEnd' || params.get('officeMode') === 'lastWorkingDay' || params.get('officeMode') === 'custom')) {
      setOfficeDayMode(params.get('officeMode') as 'autoLeaveEnd' | 'lastWorkingDay' | 'custom');
    }
    if (params.has('customOffice')) setCustomOfficeDate(params.get('customOffice') || '');
    if (params.has('salary')) {
      const parsed = parseInt(params.get('salary') || '60000', 10);
      if (!isNaN(parsed)) setMonthlySalary(parsed);
    }

    isMountedRef.current = true;
  }, [defaultOnboardingStr, defaultNoticeDateStr, defaultTargetLastDateStr]);

  // 更新 URL 參數
  useEffect(() => {
    if (!isMountedRef.current) return;
    const params = new URLSearchParams();
    params.set('dir', calcDirection);
    if (onboardingDate) params.set('onboarding', onboardingDate);
    if (noticeDate) params.set('notice', noticeDate);
    if (targetLastWorkingDate) params.set('targetLast', targetLastWorkingDate);
    params.set('mode', noticeMode);
    if (noticeMode === 'custom' && customDays !== '') params.set('customDays', customDays.toString());
    params.set('type', resignationType);
    if (annualLeaveDays !== '') params.set('leave', annualLeaveDays.toString());
    if (leaveDaysToTake !== '') params.set('leaveToTake', leaveDaysToTake.toString());
    if (monthlySalary !== '') params.set('salary', monthlySalary.toString());

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [calcDirection, onboardingDate, noticeDate, targetLastWorkingDate, noticeMode, customDays, resignationType, annualLeaveDays, leaveDaysToTake, monthlySalary]);

  // 顯示 Toast
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // --- 計算核心邏輯 ---
  const onboardingD = onboardingDate ? new Date(onboardingDate) : new Date();

  // 1. 先估算年資 (依據提出的離職日或目標最後在職日)
  let refNoticeDate = noticeDate ? new Date(noticeDate) : new Date();
  if (calcDirection === 'lastToNotice' && targetLastWorkingDate) {
    refNoticeDate = new Date(targetLastWorkingDate);
  }

  const diffTime = Math.max(0, refNoticeDate.getTime() - onboardingD.getTime());
  const totalDaysTenure = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  let tenureYears = refNoticeDate.getFullYear() - onboardingD.getFullYear();
  let tenureMonths = refNoticeDate.getMonth() - onboardingD.getMonth();
  if (tenureMonths < 0) {
    tenureYears--;
    tenureMonths += 12;
  }
  const tenureText = lang === 'zh-TW'
    ? `${tenureYears} 年 ${tenureMonths} 個月 (約 ${totalDaysTenure} 天)`
    : `${tenureYears} yrs ${tenureMonths} mos (${totalDaysTenure} days)`;

  // 依據勞基法第 38 條計算法定特休天數
  const statutoryAnnualLeave = getStatutoryAnnualLeave(totalDaysTenure, tenureYears);

  // 自動依勞基法第 16 條計算法定要求預告天數
  let legalNoticeDaysRequired = 0;
  if (totalDaysTenure < 90) {
    legalNoticeDaysRequired = 0; // 未滿 3 個月
  } else if (totalDaysTenure < 365) {
    legalNoticeDaysRequired = 10; // 滿 3 個月未滿 1 年
  } else if (totalDaysTenure < 365 * 3) {
    legalNoticeDaysRequired = 20; // 滿 1 年未滿 3 年
  } else {
    legalNoticeDaysRequired = 30; // 滿 3 年以上
  }

  const requiredNoticeDays = noticeMode === 'auto'
    ? legalNoticeDaysRequired
    : (customDays === '' ? 0 : customDays);

  // 根據方向進行推算：
  let calculatedNoticeD: Date;
  let calculatedLastWorkingD: Date;

  if (calcDirection === 'noticeToLast') {
    // 模式一：已知預計提出日 ➜ 正向計算最後在職日
    calculatedNoticeD = noticeDate ? new Date(noticeDate) : new Date();
    
    // 起算日為告知之次日
    const noticeStartDate = new Date(calculatedNoticeD.getTime());
    noticeStartDate.setDate(noticeStartDate.getDate() + 1);

    calculatedLastWorkingD = new Date(noticeStartDate.getTime());
    if (requiredNoticeDays > 0) {
      calculatedLastWorkingD.setDate(calculatedLastWorkingD.getDate() + (requiredNoticeDays - 1));
    } else {
      calculatedLastWorkingD.setTime(calculatedNoticeD.getTime());
    }
  } else {
    // 模式二：已知目標最後在職日 ➜ 反向推算最晚必須提出離職日
    calculatedLastWorkingD = targetLastWorkingDate ? new Date(targetLastWorkingDate) : new Date();
    
    // 起算日為最後在職日前推 N - 1 天
    // 提出日為起算日前一天（即最後在職日前推 N 天）
    calculatedNoticeD = new Date(calculatedLastWorkingD.getTime());
    if (requiredNoticeDays > 0) {
      calculatedNoticeD.setDate(calculatedNoticeD.getDate() - requiredNoticeDays);
    }
  }

  // 起算日
  const noticeStartDate = new Date(calculatedNoticeD.getTime());
  noticeStartDate.setDate(noticeStartDate.getDate() + 1);

  // 離職生效日 (退保日)
  const effectiveDate = new Date(calculatedLastWorkingD.getTime());
  effectiveDate.setDate(effectiveDate.getDate() + 1);

  // 實際最後出勤日與特休排休/折現邏輯
  const leaveDaysTotal = annualLeaveDays === '' ? 0 : annualLeaveDays;
  const leaveToTakeInput = leaveDaysToTake === '' ? 0 : leaveDaysToTake;
  
  // 實際預計要請的特休天數（不超過總特休天數）
  const intendedTakeDays = Math.min(leaveDaysTotal, leaveToTakeInput);
  
  // 預告期間內最多能排休的工作天數
  const maxTakeableLeaveDays = countWorkingDaysBetween(calculatedNoticeD, calculatedLastWorkingD);

  // 實際在預告期內排掉的工作天數（受限於預告期工作天數與預計排休天數）
  const actualTakeLeaveDays = Math.min(intendedTakeDays, maxTakeableLeaveDays);

  // 剩餘未排休、或是無法在預告期排完的特休天數（全數自動轉換為不休假工資折算現金）
  const payoutDaysTotal = Math.max(0, leaveDaysTotal - actualTakeLeaveDays);
  const excessPayoutLeaveDays = payoutDaysTotal;

  // 實際最後到辦公室出勤日推算
  let actualOfficeDate = new Date(calculatedLastWorkingD.getTime());
  if (officeDayMode === 'autoLeaveEnd') {
    if (actualTakeLeaveDays > 0) {
      actualOfficeDate = subtractWorkingDays(calculatedLastWorkingD, actualTakeLeaveDays);
      if (actualOfficeDate.getTime() < calculatedNoticeD.getTime()) {
        actualOfficeDate = new Date(calculatedNoticeD.getTime());
      }
    }
  } else if (officeDayMode === 'lastWorkingDay') {
    actualOfficeDate = new Date(calculatedLastWorkingD.getTime());
  } else if (officeDayMode === 'custom') {
    actualOfficeDate = customOfficeDate ? new Date(customOfficeDate) : new Date(calculatedLastWorkingD.getTime());
  }

  // --- 合規與天數檢查 (含過去日期過期判定) ---
  // 1. 提出日與最後在職日之間的給予預告天數 (曆天)
  const noticeDiffDays = Math.round((calculatedLastWorkingD.getTime() - calculatedNoticeD.getTime()) / (1000 * 60 * 60 * 24));
  const isPeriodSufficient = noticeDiffDays >= requiredNoticeDays;

  // 2. 提出日是否在過去 (早於今天 00:00:00)
  const calcNoticeD0 = new Date(calculatedNoticeD.getFullYear(), calculatedNoticeD.getMonth(), calculatedNoticeD.getDate());
  const isNoticeInPast = calcNoticeD0.getTime() < today0.getTime();

  // 3. 判斷節點是否早於今天（用於時間軸紅色高亮）
  const isDateInPast = (d: Date) => {
    const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return d0.getTime() < today0.getTime();
  };

  // 4. 若提出日在過去，但從「今天」開始算至「最後在職日」的剩餘天數：
  const daysRemainingFromToday = Math.round((calculatedLastWorkingD.getTime() - today0.getTime()) / (1000 * 60 * 60 * 24));
  const isNoticeOverdueFromToday = isNoticeInPast && (daysRemainingFromToday < requiredNoticeDays);

  // 缺少的預告天數
  const missingDaysStandard = Math.max(0, requiredNoticeDays - noticeDiffDays);
  const missingDaysFromToday = Math.max(0, requiredNoticeDays - daysRemainingFromToday);

  // 建議今天提出預告時順延之最後在職日
  const postponeLastWorkingFromToday = new Date(today0.getTime());
  postponeLastWorkingFromToday.setDate(postponeLastWorkingFromToday.getDate() + (requiredNoticeDays > 0 ? requiredNoticeDays : 0));

  // 特休折現與日薪計算（計算全數折現天數 + 排休後超出預告期無法排完之剩餘天數）
  const salaryNum = monthlySalary === '' ? 0 : monthlySalary;
  const dailyAvgSalary = Math.round(salaryNum / 30);
  const estimatedLeavePayout = Math.round(dailyAvgSalary * payoutDaysTotal);

  // 資遣謀職假每週 2 天
  const noticeWeeks = Math.ceil(requiredNoticeDays / 7);
  const maxJobSeekingLeaveDays = noticeWeeks * 2;

  // 離職預告範本內文
  const emailTemplateText = lang === 'zh-TW'
    ? `主旨：【離職預告通知】離職預告與交接通知

主管 / HR 您好：

本人謹以此信於 ${formatDateStr(calculatedNoticeD)} 正式向公司提出離職預告。
依據勞動基準法規範（年資約 ${tenureYears} 年 ${tenureMonths} 個月，法定預告期 ${requiredNoticeDays} 天）：

- 預告通知提出日：${formatDateFriendly(calculatedNoticeD, 'zh-TW')}
- 預告期起算日：${formatDateFriendly(noticeStartDate, 'zh-TW')}
- 契約最後在職日：${formatDateFriendly(calculatedLastWorkingD, 'zh-TW')}${actualTakeLeaveDays > 0 ? `\n- 特休排休天數：${actualTakeLeaveDays} 天 (實際最後到辦公室出勤日為 ${formatDateFriendly(actualOfficeDate, 'zh-TW')})` : ''}
- 離職正式生效日 (退保日)：${formatDateFriendly(effectiveDate, 'zh-TW')}

在離職生效日前，本人將全力協助完成各項工作職務與專案文件之移交交接。
感謝公司與主管這段時間的照顧與指導！

祝 順心

同仁 敬上`
    : `Subject: Resignation Notice - [Your Name]

Dear Manager / HR Team,

I am writing to formally submit my resignation notice on ${formatDateStr(calculatedNoticeD)}.
Based on the Taiwan Labor Standards Act (Total tenure: ${tenureYears} yrs ${tenureMonths} mos, Notice period required: ${requiredNoticeDays} days):

- Notice Submission Date: ${formatDateFriendly(calculatedNoticeD, 'en')}
- Notice Period Start Date: ${formatDateFriendly(noticeStartDate, 'en')}
- Last Working Day: ${formatDateFriendly(calculatedLastWorkingD, 'en')}${actualTakeLeaveDays > 0 ? `\n- Annual Leave Taken: ${actualTakeLeaveDays} working days (Actual Last Office Day: ${formatDateFriendly(actualOfficeDate, 'en')})` : ''}
- Resignation Effective Date: ${formatDateFriendly(effectiveDate, 'en')}

I will ensure a smooth handover of all my duties and projects prior to my departure date.
Thank you for the support and guidance during my time at the company.

Sincerely,
[Your Name]`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(emailTemplateText);
    showToast(t.copiedSuccess);
  };

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#00f5a0"
      accentGlow="rgba(0, 245, 160, 0.6)"
      extraHeaderControls={
        <Link
          href={lang === 'zh-TW' ? '/resignation-calculator/en/' : '/resignation-calculator/'}
          className="text-sm font-medium px-3 py-1.5 rounded-xl bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
        >
          {t.langToggle}
        </Link>
      }
    >
      <div className={styles.container}>

        {/* 頂部：合規天數檢查 Banner */}
        {isNoticeOverdueFromToday ? (
          /* 狀況 A: 最晚提出預告日已早於今天（過期告警） */
          <div className={styles.warningBanner}>
            <div className="font-bold flex items-center gap-2 text-base">
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {t.pastNoticeOverdueTitle}
            </div>
            <div className="text-sm leading-relaxed flex flex-col gap-1 mt-0.5">
              <div>
                {t.pastNoticeOverdueDesc1} <strong>{formatDateStr(calculatedNoticeD)}</strong> {t.pastNoticeOverdueDesc2}
              </div>
              <div>
                {lang === 'zh-TW' ? '若您【今天】才要提出離職，距離目標離職日僅剩 ' : 'Submitting TODAY leaves only '}
                <strong>{Math.max(0, daysRemainingFromToday)}</strong>
                {lang === 'zh-TW' ? ' 天，不足要求的 ' : ' days, short of required '}
                <strong>{requiredNoticeDays}</strong>
                {lang === 'zh-TW' ? ' 天預告期（尚缺 ' : ' days notice (Short by '}
                <strong>{missingDaysFromToday}</strong>
                {lang === 'zh-TW' ? ' 天）。' : ' days).'}
              </div>
            </div>
            <div className="text-xs opacity-95 leading-relaxed font-mono mt-1.5 flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>{t.recommendPostponeDate} <strong>{formatDateStr(postponeLastWorkingFromToday)}</strong></span>
            </div>
            <div className="text-xs opacity-80 mt-0.5 flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t.lawAgreementNote}</span>
            </div>
          </div>
        ) : !isPeriodSufficient ? (
          /* 狀況 B: 提出日與離職日天數間隔不足 */
          <div className={styles.warningBanner}>
            <div className="font-bold flex items-center gap-2 text-base">
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {t.insufficientNoticeWarningTitle}
            </div>
            <div className="text-sm leading-relaxed">
              {t.insufficientNoticeDesc1} <strong>{noticeDiffDays}</strong> {t.insufficientNoticeDesc2} <strong>{requiredNoticeDays}</strong> {t.insufficientNoticeDesc3} <strong>{missingDaysStandard}</strong> {t.insufficientNoticeDesc4}
            </div>
            <div className="text-xs opacity-95 leading-relaxed font-mono mt-1.5 flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>{t.recommendPostponeDate} <strong>{formatDateStr(postponeLastWorkingFromToday)}</strong></span>
            </div>
            <div className="text-xs opacity-80 mt-0.5 flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t.lawAgreementNote}</span>
            </div>
          </div>
        ) : (
          /* 狀況 C: 天數充足合規 */
          <div className={styles.successBanner}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="font-medium text-sm">
              {t.sufficientNoticeSuccess} ({lang === 'zh-TW' ? `預告期間 ${noticeDiffDays} 天 ≥ 要求 ${requiredNoticeDays} 天` : `Given ${noticeDiffDays} days ≥ Required ${requiredNoticeDays} days`})
              {isNoticeInPast && <span className="opacity-80 block text-xs mt-0.5">{t.pastNoticeSuccessNote}</span>}
            </div>
          </div>
        )}

        <div className={styles.gridSection}>
          
          {/* 左側：控制輸入面板 */}
          <div className={styles.glassCard}>
            <h2 className={styles.cardTitle}>
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              {lang === 'zh-TW' ? '離職參數設定' : 'Parameters'}
            </h2>

            <div className="flex flex-col gap-4">

              {/* 試算方向選擇 */}
              <div>
                <label htmlFor={calcDirSelectId} className="block text-sm font-semibold text-text-main mb-1">
                  {t.calcDirectionLabel}
                </label>
                <select
                  id={calcDirSelectId}
                  value={calcDirection}
                  onChange={(e) => setCalcDirection(e.target.value as 'noticeToLast' | 'lastToNotice')}
                  className="w-full px-3 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main font-semibold focus:border-[var(--theme-color)] outline-none text-sm leading-snug"
                >
                  <option value="noticeToLast">{t.dirNoticeToLast}</option>
                  <option value="lastToNotice">{t.dirLastToNotice}</option>
                </select>
              </div>

              <hr className="border-border-glass my-0.5" />

              {/* 到職日 */}
              <div>
                <label htmlFor={onboardingInputId} className="block text-sm font-medium text-text-sub mb-1">
                  {t.onboardingDateLabel}
                </label>
                <input
                  id={onboardingInputId}
                  type="date"
                  value={onboardingDate}
                  onChange={(e) => setOnboardingDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm [color-scheme:dark]"
                />
              </div>

              {/* 模式一：提出離職日 */}
              {calcDirection === 'noticeToLast' ? (
                <div>
                  <label htmlFor={noticeInputId} className="block text-sm font-medium text-text-sub mb-1">
                    {t.noticeDateLabel}
                  </label>
                  <input
                    id={noticeInputId}
                    type="date"
                    value={noticeDate}
                    onChange={(e) => setNoticeDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm [color-scheme:dark]"
                  />
                </div>
              ) : (
                /* 模式二：目標最後在職日 */
                <div>
                  <label htmlFor={targetLastWorkingInputId} className="block text-sm font-medium text-text-sub mb-1">
                    {t.targetLastWorkingDateLabel}
                  </label>
                  <input
                    id={targetLastWorkingInputId}
                    type="date"
                    value={targetLastWorkingDate}
                    onChange={(e) => setTargetLastWorkingDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm [color-scheme:dark]"
                  />
                </div>
              )}

              {/* 預告天數計算模式 */}
              <div>
                <label htmlFor={noticeModeSelectId} className="block text-sm font-medium text-text-sub mb-1">
                  {t.noticeOptionLabel}
                </label>
                <select
                  id={noticeModeSelectId}
                  value={noticeMode}
                  onChange={(e) => setNoticeMode(e.target.value as 'auto' | 'custom')}
                  className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
                >
                  <option value="auto">{t.autoLaborLaw}</option>
                  <option value="custom">{t.customNotice}</option>
                </select>
              </div>

              {/* 自訂天數輸入 */}
              {noticeMode === 'custom' && (
                <div>
                  <label htmlFor={customDaysInputId} className="block text-sm font-medium text-text-sub mb-1">
                    {t.customDaysLabel}
                  </label>
                  <input
                    id={customDaysInputId}
                    type="number"
                    min={0}
                    max={365}
                    value={customDays}
                    onChange={(e) => setCustomDays(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
                  />
                </div>
              )}

              {/* 離職類型 */}
              <div>
                <label htmlFor={typeSelectId} className="block text-sm font-medium text-text-sub mb-1">
                  {t.resignationTypeLabel}
                </label>
                <select
                  id={typeSelectId}
                  value={resignationType}
                  onChange={(e) => setResignationType(e.target.value as 'voluntary' | 'involuntary')}
                  className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
                >
                  <option value="voluntary">{t.typeVoluntary}</option>
                  <option value="involuntary">{t.typeInvoluntary}</option>
                </select>
              </div>

              <hr className="border-border-glass my-0.5" />

              {/* 剩餘特休假 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor={leaveDaysInputId} className="block text-sm font-medium text-text-sub">
                    {t.annualLeaveLabel}
                  </label>
                  <button
                    type="button"
                    onClick={() => setAnnualLeaveDays(statutoryAnnualLeave)}
                    className={`text-xs ${styles.accentText} hover:underline flex items-center gap-1 font-medium cursor-pointer`}
                    title={lang === 'zh-TW' ? `一鍵帶入依年資計算之法定特休額度 ${statutoryAnnualLeave} 天` : `Fill statutory ${statutoryAnnualLeave} days`}
                  >
                    <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>{t.statutoryLeaveHint}<strong>{statutoryAnnualLeave} {lang === 'zh-TW' ? '天' : 'days'}</strong> ({t.fillStatutoryBtn})</span>
                  </button>
                </div>
                <input
                  id={leaveDaysInputId}
                  type="number"
                  step="0.5"
                  min={0}
                  max={99}
                  value={annualLeaveDays}
                  onChange={(e) => setAnnualLeaveDays(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
                />
              </div>

              {/* 離職前預計排休天數 */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor={leaveHandlingSelectId} className="block text-sm font-medium text-text-sub">
                    {t.leaveToTakeLabel}
                  </label>
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setLeaveDaysToTake(0)}
                      className="px-2 py-0.5 rounded bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors cursor-pointer"
                      title={lang === 'zh-TW' ? '設定 0 天，將特休全數保留至離職發放不休假工資' : 'Set 0 days for full cash payout'}
                    >
                      {t.btnTakeZero}
                    </button>
                    <button
                      type="button"
                      onClick={() => setLeaveDaysToTake(annualLeaveDays === '' ? 0 : annualLeaveDays)}
                      className="px-2 py-0.5 rounded bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors cursor-pointer"
                      title={lang === 'zh-TW' ? '帶入全額特休排休' : 'Take all remaining annual leave'}
                    >
                      {t.btnTakeMax}
                    </button>
                  </div>
                </div>
                <input
                  id={leaveHandlingSelectId}
                  type="number"
                  step="0.5"
                  min={0}
                  max={annualLeaveDays === '' ? 99 : annualLeaveDays}
                  value={leaveDaysToTake}
                  onChange={(e) => setLeaveDaysToTake(e.target.value === '' ? '' : parseFloat(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
                />
              </div>

              {/* 最後到辦公室出勤日推算模式 */}
              <div>
                <label htmlFor={officeDayModeSelectId} className="block text-sm font-medium text-text-sub mb-1">
                  {t.officeDayModeLabel}
                </label>
                <select
                  id={officeDayModeSelectId}
                  value={officeDayMode}
                  onChange={(e) => setOfficeDayMode(e.target.value as 'autoLeaveEnd' | 'lastWorkingDay' | 'custom')}
                  className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
                >
                  <option value="autoLeaveEnd">{t.officeDayAutoLeaveEnd}</option>
                  <option value="lastWorkingDay">{t.officeDayLastWorking}</option>
                  <option value="custom">{t.officeDayCustom}</option>
                </select>
              </div>

              {/* 自訂最後到辦公室日期 */}
              {officeDayMode === 'custom' && (
                <div>
                  <label htmlFor={customOfficeInputId} className="block text-sm font-medium text-text-sub mb-1">
                    {t.customOfficeDateLabel}
                  </label>
                  <input
                    id={customOfficeInputId}
                    type="date"
                    value={customOfficeDate}
                    onChange={(e) => setCustomOfficeDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm [color-scheme:dark]"
                  />
                </div>
              )}

              {/* 月薪輸入 (選填) */}
              <div>
                <label htmlFor={salaryInputId} className="block text-sm font-medium text-text-sub mb-1">
                  {t.monthlySalaryLabel}
                </label>
                <input
                  id={salaryInputId}
                  type="text"
                  inputMode="numeric"
                  placeholder={t.monthlySalaryPlaceholder}
                  value={monthlySalary === '' ? '' : monthlySalary.toLocaleString('zh-TW')}
                  onChange={(e) => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setMonthlySalary(raw === '' ? '' : parseInt(raw, 10));
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
                />
              </div>
            </div>
          </div>

          {/* 右側：核心數據與分析 */}
          <div className="flex flex-col gap-6">
            
            {/* 指標看板 */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              
              {/* 法定預告期 */}
              <div className={styles.glassCard}>
                <div className="text-sm font-semibold text-text-sub mb-1">{t.legalNoticeDays}</div>
                <div className={`text-2xl sm:text-3xl font-extrabold ${styles.accentText}`}>
                  {requiredNoticeDays} <span className="text-sm font-normal text-text-sub">{lang === 'zh-TW' ? '天' : 'days'}</span>
                </div>
                <div className="text-xs text-text-sub mt-1 truncate">
                  {noticeMode === 'auto'
                    ? (legalNoticeDaysRequired === 0 ? (lang === 'zh-TW' ? '年資未滿 3 個月' : '< 3 months') : (lang === 'zh-TW' ? '依勞基法第 16 條' : 'Labor Standard Act'))
                    : (lang === 'zh-TW' ? '使用者自訂' : 'Custom')}
                </div>
              </div>

              {/* 最後在職日 */}
              <div className={styles.glassCard}>
                <div className="text-sm font-semibold text-text-sub mb-1">{t.lastWorkingDay}</div>
                <div className={`text-base sm:text-lg font-bold truncate font-mono ${isDateInPast(calculatedLastWorkingD) ? 'text-red-500' : 'text-text-main'}`}>
                  {formatDateFriendly(calculatedLastWorkingD, lang)}
                </div>
                <div className="text-xs text-text-sub mt-1">
                  {calcDirection === 'noticeToLast'
                    ? (lang === 'zh-TW' ? '正向推算契約最後一日' : 'Calculated last working day')
                    : (lang === 'zh-TW' ? '使用者設定目標離職日' : 'Target last working day')}
                </div>
              </div>

              {/* 離職生效日 */}
              <div className={styles.glassCard}>
                <div className="text-sm font-semibold text-text-sub mb-1">{t.effectiveDate}</div>
                <div className={`text-base sm:text-lg font-bold truncate font-mono ${isDateInPast(effectiveDate) ? 'text-red-500' : 'text-text-main'}`}>
                  {formatDateFriendly(effectiveDate, lang)}
                </div>
                <div className="text-xs text-text-sub mt-1">{lang === 'zh-TW' ? '退保與免出勤第一天' : 'Labor insurance end date'}</div>
              </div>

              {/* 實際最後出勤日 */}
              <div className={styles.glassCard}>
                <div className="text-sm font-semibold text-text-sub mb-1">{t.actualOfficeDay}</div>
                <div className={`text-base sm:text-lg font-bold font-mono ${isDateInPast(actualOfficeDate) ? 'text-red-500' : actualTakeLeaveDays > 0 ? styles.accentText : 'text-text-main'}`}>
                  {formatDateFriendly(actualOfficeDate, lang)}
                </div>
                <div className="text-xs text-text-sub mt-1">
                  {officeDayMode === 'autoLeaveEnd'
                    ? (actualTakeLeaveDays > 0
                      ? (lang === 'zh-TW' ? `離職前集中排休 ${actualTakeLeaveDays} 個工作天` : `Consecutive ${actualTakeLeaveDays} leave days`)
                      : (lang === 'zh-TW' ? '無排休，與最後在職日相同' : 'Same as last working day'))
                    : officeDayMode === 'lastWorkingDay'
                    ? (lang === 'zh-TW' ? '最後在職日當天到辦 (特休分散請)' : 'On last working day (Leave spread out)')
                    : (lang === 'zh-TW' ? '使用者自訂最後出勤日' : 'User custom office date')}
                  {isWeekend(actualOfficeDate) && (
                    <span className="text-amber-500 block font-medium mt-0.5 inline-flex items-center gap-1">
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.99L20.53 19H3.47L12 5.99zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
                      {lang === 'zh-TW' ? '此日期為週末例假日' : 'Falling on weekend'}
                    </span>
                  )}
                </div>
              </div>

              {/* 年資統計 */}
              <div className="col-span-2 sm:col-span-2">
                <div className={styles.glassCard}>
                  <div className="text-sm font-semibold text-text-sub mb-1">{t.tenure}</div>
                  <div className="text-base font-bold text-text-main truncate">{tenureText}</div>
                  <div className="text-xs text-text-sub mt-1">
                    {lang === 'zh-TW' ? `自 ${onboardingDate} 至 ${formatDateStr(refNoticeDate)}` : `From ${onboardingDate} to ${formatDateStr(refNoticeDate)}`}
                  </div>
                </div>
              </div>

            </div>

            {/* 時間軸卡片 (早於今天的過去節點紅色高亮) */}
            <div className={styles.glassCard}>
              <h3 className={styles.cardTitle}>
                <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.timelineTitle}
              </h3>

              <div className={styles.timeline}>
                {/* 1. 提出離職 */}
                {(() => {
                  const isPast = isDateInPast(calculatedNoticeD);
                  return (
                    <div className={styles.timelineItem}>
                      <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : styles.timelineNodeActive}`}>
                        {isPast ? '!' : '✓'}
                      </div>
                      <div className={styles.timelineLabel}>{t.noticeGivenNode}</div>
                      <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : styles.accentText}`}>
                        {formatDateFriendly(calculatedNoticeD, lang)} {isPast ? t.nodePastTag : ''}
                      </div>
                      <div className={styles.timelineDesc}>
                        {calcDirection === 'noticeToLast'
                          ? (lang === 'zh-TW' ? '正式向主管/HR 遞交離職預告' : 'Submit formal notice')
                          : (lang === 'zh-TW' ? '最晚必須於此日期提出離職預告' : 'Latest required notice date')}
                      </div>
                    </div>
                  );
                })()}

                {/* 2. 預告期開始 */}
                {(() => {
                  const isPast = isDateInPast(noticeStartDate);
                  return (
                    <div className={styles.timelineItem}>
                      <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : ''}`}>
                        {isPast ? '!' : '1'}
                      </div>
                      <div className={styles.timelineLabel}>{t.noticeStartNode}</div>
                      <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : ''}`}>
                        {formatDateFriendly(noticeStartDate, lang)} {isPast ? t.nodePastTag : ''}
                      </div>
                      <div className={styles.timelineDesc}>{lang === 'zh-TW' ? '依法令起算日為告知之次日' : 'Notice period starts day after notice'}</div>
                    </div>
                  );
                })()}

                {/* 2.5 資遣謀職假得請假期間 (非自願離職) */}
                {resignationType === 'involuntary' && requiredNoticeDays > 0 && (() => {
                  const isPast = isDateInPast(calculatedLastWorkingD);
                  const isFullLeaveTaken = actualTakeLeaveDays >= maxTakeableLeaveDays && maxTakeableLeaveDays > 0;
                  return (
                    <div className={styles.timelineItem}>
                      <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : styles.timelineNodeActive}`}>
                        {isPast ? '!' : '✓'}
                      </div>
                      <div className={styles.timelineLabel}>
                        {t.jobSeekingLeavePeriodNode} ({maxJobSeekingLeaveDays} {lang === 'zh-TW' ? '天有薪假' : 'paid days'})
                      </div>
                      <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : styles.accentText}`}>
                        {formatDateFriendly(noticeStartDate, lang)} ~ {formatDateFriendly(calculatedLastWorkingD, lang)} {isPast ? t.nodePastTag : ''}
                      </div>
                      <div className={styles.timelineDesc}>
                        <div>{t.jobSeekingLeaveTimelineDesc}</div>
                        {isFullLeaveTaken && (
                          <div className={`mt-1 text-xs ${styles.accentText} font-medium flex items-center gap-1.5`}>
                            <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>
                              {lang === 'zh-TW'
                                ? '提示：因您已選擇排滿預告期特休假，預告期間已全數免到辦公室出勤，故無需額外申請謀職假，預告期間薪資均全額照給。'
                                : 'Note: Annual leave covers all working days during notice period; no separate job-seeking leave needed, full salary paid.'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 3. 特休排休 (若有排休) */}
                {annualLeaveDays !== '' && actualTakeLeaveDays > 0 && (() => {
                  const leaveStartD = new Date(actualOfficeDate.getTime());
                  leaveStartD.setDate(leaveStartD.getDate() + 1);
                  while (isWeekend(leaveStartD) && leaveStartD.getTime() < calculatedLastWorkingD.getTime()) {
                    leaveStartD.setDate(leaveStartD.getDate() + 1);
                  }
                  const isPast = isDateInPast(calculatedLastWorkingD);
                  const isCappedByNoticePeriod = intendedTakeDays > maxTakeableLeaveDays;

                  return (
                    <div className={styles.timelineItem}>
                      <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : styles.timelineNodeActive}`}>
                        {isPast ? '!' : '✓'}
                      </div>
                      <div className={styles.timelineLabel}>
                        {t.leavePeriodNode} ({actualTakeLeaveDays} {t.leaveDaysCountUnit})
                        {excessPayoutLeaveDays > 0 && (
                          <span className={`text-xs ${styles.accentText} ml-1.5 font-normal`}>
                            ({isCappedByNoticePeriod
                              ? (lang === 'zh-TW' ? `預告期工作天已排滿，剩餘 ${excessPayoutLeaveDays} 天自動折算現金` : `Max working days reached, ${excessPayoutLeaveDays} days paid out`)
                              : (lang === 'zh-TW' ? `剩餘 ${excessPayoutLeaveDays} 天自動折算現金` : `${excessPayoutLeaveDays} days paid out`)})
                          </span>
                        )}
                      </div>
                      <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : ''}`}>
                        {formatDateFriendly(leaveStartD, lang)} ~ {formatDateFriendly(calculatedLastWorkingD, lang)} {isPast ? t.nodePastTag : ''}
                      </div>
                      <div className={styles.timelineDesc}>
                        {isCappedByNoticePeriod
                          ? (lang === 'zh-TW'
                            ? `受限於預告期間最多僅有 ${maxTakeableLeaveDays} 個工作天（已全數排滿，無法排入更多天數）；剩餘 ${excessPayoutLeaveDays} 天特休將依法 100% 自動折算不休假工資發放現金`
                            : `Capped at ${maxTakeableLeaveDays} available working days in notice period (fully scheduled). The remaining ${excessPayoutLeaveDays} leave days will be 100% paid out in cash.`)
                          : excessPayoutLeaveDays > 0
                          ? (lang === 'zh-TW' ? `特休排休 ${actualTakeLeaveDays} 個工作天，未排休之剩餘 ${excessPayoutLeaveDays} 天將自動折算不休假工資` : `Took ${actualTakeLeaveDays} days leave; remaining ${excessPayoutLeaveDays} days paid out in cash`)
                          : (lang === 'zh-TW' ? '離職前將特休假全數排完，不用到辦公室' : 'Take remaining annual leave days')}
                      </div>
                    </div>
                  );
                })()}

                {/* 4. 最後到辦公室 */}
                {(() => {
                  const isPast = isDateInPast(actualOfficeDate);
                  const isWeekendOffice = isWeekend(actualOfficeDate);
                  return (
                    <div className={styles.timelineItem}>
                      <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : styles.timelineNodeActive}`}>
                        {isPast ? '!' : '✓'}
                      </div>
                      <div className={styles.timelineLabel}>
                        {t.actualOfficeNode}
                        {isWeekendOffice && (
                          <span className="text-xs text-amber-500 ml-1.5 font-normal inline-flex items-center gap-0.5">
                            <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24"><path d="M12 2L1 21h22L12 2zm0 3.99L20.53 19H3.47L12 5.99zM11 10v4h2v-4h-2zm0 6v2h2v-2h-2z"/></svg>
                            ({lang === 'zh-TW' ? '週末例假日' : 'Weekend'})
                          </span>
                        )}
                      </div>
                      <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : styles.accentText}`}>
                        {formatDateFriendly(actualOfficeDate, lang)} {isPast ? t.nodePastTag : ''}
                      </div>
                      <div className={styles.timelineDesc}>
                        {officeDayMode === 'autoLeaveEnd'
                          ? (lang === 'zh-TW' ? '最後一天進辦公室 / 辦理實體交接與退還公物 (由離職前集中排休倒推)' : 'Final day in office for physical handover (Calculated from consecutive leave)')
                          : officeDayMode === 'lastWorkingDay'
                          ? (lang === 'zh-TW' ? '最後在職日當天進辦公室辦理實體交接 (特休分散排休/非集中離職前)' : 'Final day in office on last working day (Leave spread out)')
                          : (lang === 'zh-TW' ? '使用者自訂最後到辦公室出勤日期 / 辦理實體交接與退還公物' : 'User custom last office date for physical handover')}
                      </div>
                    </div>
                  );
                })()}

                {/* 5. 契約最後在職日 */}
                {(() => {
                  const isPast = isDateInPast(calculatedLastWorkingD);
                  return (
                    <div className={styles.timelineItem}>
                      <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : ''}`}>
                        {isPast ? '!' : '2'}
                      </div>
                      <div className={styles.timelineLabel}>{t.lastWorkingNode}</div>
                      <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : ''}`}>
                        {formatDateFriendly(calculatedLastWorkingD, lang)} {isPast ? t.nodePastTag : ''}
                      </div>
                      <div className={styles.timelineDesc}>{lang === 'zh-TW' ? '勞動契約終止最後一天，薪資計至今日' : 'Final contractual employment date'}</div>
                    </div>
                  );
                })()}

                {/* 6. 離職生效 */}
                {(() => {
                  const isPast = isDateInPast(effectiveDate);
                  return (
                    <div className={styles.timelineItem}>
                      <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : ''}`}>
                        {isPast ? '!' : '3'}
                      </div>
                      <div className={styles.timelineLabel}>{t.effectiveNode}</div>
                      <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : ''}`}>
                        {formatDateFriendly(effectiveDate, lang)} {isPast ? t.nodePastTag : ''}
                      </div>
                      <div className={styles.timelineDesc}>{lang === 'zh-TW' ? '勞健保正式退保，新公司得於今日投保' : 'Labor insurance cancellation date'}</div>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* 特休與謀職假分析 */}
            <div className={styles.glassCard}>
              <h3 className={styles.cardTitle}>
                <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.leaveAnalysisTitle}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
                  <div className="text-sm font-semibold text-text-sub">{t.leavePayoutEstimate}</div>
                  <div className={`text-xl font-bold font-mono mt-1 ${styles.accentText}`}>
                    ${estimatedLeavePayout.toLocaleString('zh-TW')} TWD
                  </div>
                  <div className="text-xs text-text-sub mt-2">
                    {t.dailyAvgSalary}: ${dailyAvgSalary.toLocaleString('zh-TW')} × {payoutDaysTotal} {lang === 'zh-TW' ? '天折現' : 'payout days'}
                  </div>
                  <div className="text-xs text-text-sub mt-1">
                    {actualTakeLeaveDays === 0
                      ? (lang === 'zh-TW' ? '特休全數不排休，100% 於最後一期薪資結算發放不休假工資' : 'All leave preserved for cash payout with final salary')
                      : intendedTakeDays > maxTakeableLeaveDays
                      ? (lang === 'zh-TW' ? `預告期最多僅能排入 ${actualTakeLeaveDays} 天特休（已全數排滿，無法排入更多天數），剩餘 ${payoutDaysTotal} 天依法 100% 自動發放不休假工資` : `Notice period capped at ${actualTakeLeaveDays} leave days (fully scheduled); remaining ${payoutDaysTotal} days automatically paid out in cash`)
                      : excessPayoutLeaveDays > 0
                      ? (lang === 'zh-TW' ? `排休 ${actualTakeLeaveDays} 天，剩餘 ${payoutDaysTotal} 天於最後一期薪資發放不休假工資` : `Took ${actualTakeLeaveDays} days leave; remaining ${payoutDaysTotal} days paid out in cash`)
                      : (lang === 'zh-TW' ? '預計排休天數已全數休完，無剩餘折現代金' : 'Taking leave instead of cash payout')}
                  </div>
                </div>

                {resignationType === 'involuntary' && (
                  <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
                    <div className="text-sm font-semibold text-text-sub">{t.jobSeekingLeaveTitle}</div>
                    <div className="text-xl font-bold font-mono mt-1 text-text-main">
                      {maxJobSeekingLeaveDays} <span className="text-sm font-normal text-text-sub">{lang === 'zh-TW' ? '天有薪假' : 'paid days'}</span>
                    </div>
                    <div className="text-xs text-text-sub mt-2">
                      {t.jobSeekingLeaveDesc} {noticeWeeks} {lang === 'zh-TW' ? '週預告期）' : 'weeks notice)'}
                    </div>
                    <div className={`text-xs mt-1 font-medium ${styles.accentText} flex items-center gap-1.5`}>
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>
                        {lang === 'zh-TW' ? '注意：謀職假沒請無法換錢，建議優先請謀職假面試！' : 'Note: Job-seeking leave cannot be cashed out; use it first!'}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* 被資遣最佳換錢策略提示卡片 (已升級為 14px / text-sm 與 Inline SVG 圖示) */}
              {resignationType === 'involuntary' && leaveDaysTotal > 0 && intendedTakeDays > 0 && (
                <div className="p-4 rounded-xl bg-select-bg border border-border-glass leading-relaxed space-y-2 mt-4">
                  <div className={`text-sm font-bold flex items-center gap-2 ${styles.accentText}`}>
                    <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>{t.severanceStrategyTitle}</span>
                  </div>
                  <div className="text-sm text-text-sub leading-normal">
                    {t.severanceStrategyDesc1}
                  </div>
                  <div className="text-sm font-medium text-text-main flex flex-wrap items-center gap-2.5 pt-1">
                    <span>
                      {t.severanceStrategyDesc2} <strong className={styles.accentText}>${Math.round(dailyAvgSalary * Math.min(leaveDaysTotal, intendedTakeDays)).toLocaleString('zh-TW')} TWD</strong>！
                    </span>
                    <button
                      type="button"
                      onClick={() => setLeaveDaysToTake(0)}
                      className={`px-3 py-1.5 text-sm font-semibold rounded-lg bg-select-bg border border-border-glass hover:border-[var(--theme-color)] transition-colors cursor-pointer inline-flex items-center gap-1.5 ${styles.accentText}`}
                    >
                      <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <span>{t.btnStrategicSeverance}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 離職預告信一鍵範本 */}
            <div className={styles.glassCard}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                  <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {t.emailTemplateTitle}
                </h3>
                <button type="button" onClick={copyToClipboard} className={styles.accentBtn}>
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  {t.copyTemplateBtn}
                </button>
              </div>

              <textarea
                readOnly
                value={emailTemplateText}
                rows={10}
                className="w-full p-3 rounded-xl bg-select-bg border border-border-glass text-text-sub font-mono text-sm focus:outline-none resize-none"
              />
            </div>

            {/* Offboarding Checklist */}
            <div className={styles.glassCard}>
              <h3 className={styles.cardTitle}>
                <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t.checklistTitle}
              </h3>

              <ul className="flex flex-col gap-2.5 text-sm text-text-sub">
                <li className="flex items-start gap-2">
                  <span className={`inline-block mt-0.5 w-4 h-4 rounded border border-border-glass flex-shrink-0 flex items-center justify-center text-xs ${styles.accentText}`}>✓</span>
                  <span>{t.item1}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className={`inline-block mt-0.5 w-4 h-4 rounded border border-border-glass flex-shrink-0 flex items-center justify-center text-xs ${styles.accentText}`}>✓</span>
                  <span>{t.item2}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className={`inline-block mt-0.5 w-4 h-4 rounded border border-border-glass flex-shrink-0 flex items-center justify-center text-xs ${styles.accentText}`}>✓</span>
                  <span>{t.item3}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className={`inline-block mt-0.5 w-4 h-4 rounded border border-border-glass flex-shrink-0 flex items-center justify-center text-xs ${styles.accentText}`}>✓</span>
                  <span>{t.item4}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className={`inline-block mt-0.5 w-4 h-4 rounded border border-border-glass flex-shrink-0 flex items-center justify-center text-xs ${styles.accentText}`}>✓</span>
                  <span>{t.item5}</span>
                </li>
              </ul>
            </div>

            {/* 法條說明 */}
            <div className="p-4 rounded-xl bg-select-bg/50 border border-border-glass text-text-sub leading-relaxed space-y-3">
              {/* 1. 勞基法第 16 條 */}
              <div>
                <div className="text-sm font-semibold text-text-main mb-1.5 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {t.laborLawRefTitle}
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-sm">
                  <li>{t.lawRule1}</li>
                  <li>{t.lawRule2}</li>
                  <li>{t.lawRule3}</li>
                </ul>
                <div className="mt-1.5 text-xs opacity-85 leading-normal">{t.lawNote}</div>
              </div>

              <hr className="border-border-glass" />

              {/* 2. 勞基法第 38 條 */}
              <div>
                <div className="text-sm font-semibold text-text-main mb-1.5 flex items-center gap-1.5">
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {t.laborLawArt38Title}
                </div>
                <ul className="list-disc list-inside space-y-1 pl-1 text-sm">
                  <li>{t.art38Rule1}</li>
                  <li>{t.art38Rule2}</li>
                  <li>{t.art38Rule3}</li>
                  <li>{t.art38Rule4}</li>
                </ul>
              </div>

              <hr className="border-border-glass" />

              {/* 3. 官方法規連結與更新日期 */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-text-sub pt-0.5">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                  <span className="font-semibold text-text-main flex items-center gap-1">
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    {lang === 'zh-TW' ? '官方法規來源與參考連結：' : 'Official Legal Sources:'}
                  </span>
                  <div className="flex flex-wrap gap-2.5">
                    <a
                      href="https://law.moj.gov.tw/LawClass/LawSingle.aspx?flno=16&pcode=N0030001"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`hover:underline flex items-center gap-1 ${styles.accentText}`}
                    >
                      <span>{lang === 'zh-TW' ? '勞基法第 16 條預告期規範 (全國法規資料庫)' : 'Labor Standards Act Art. 16 Notice Period'}</span>
                      <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                    <span className="opacity-40">|</span>
                    <a
                      href="https://laws.mol.gov.tw/FLAW/FLAWDOC01.aspx?flno=38&id=FL014930"
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`hover:underline flex items-center gap-1 ${styles.accentText}`}
                    >
                      <span>{lang === 'zh-TW' ? '勞基法第 38 條特別休假規範 (勞動部主管法規系統)' : 'Labor Standards Act Art. 38 Annual Leave'}</span>
                      <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="text-xs opacity-75 font-mono shrink-0">
                  {lang === 'zh-TW' ? '最後更新日期：2026/07/31' : 'Last Updated: 2026/07/31'}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Toast 反饋浮層 */}
      {toastMessage && (
        <div className={styles.toast}>
          <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          {toastMessage}
        </div>
      )}
    </ToolLayout>
  );
}

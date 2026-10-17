'use client';

import React, { useState, useEffect, useRef, useId } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import { downloadBlob } from '../utils/downloadBlob';
import styles from './resignation-calculator.module.css';
import {
  calculateResignation,
  formatDateStr,
  formatDateFriendly,
  parseYmd,
  isWeekend,
} from './engine';
import {
  generateResignationEmail,
  buildResignationIcsContent,
  type EmailTemplateVariant,
} from './icsExport';
import { TRANSLATIONS } from './translations';
import NoticeCalendarCard from './NoticeCalendarCard';
import OffboardingToolsSection from './OffboardingToolsSection';

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
  const holidaysCheckboxId = useId();
  const leaveDaysInputId = useId();
  const leaveHandlingSelectId = useId();
  const officeDayModeSelectId = useId();
  const customOfficeInputId = useId();
  const salaryInputId = useId();
  const shortNoticeDaysInputId = useId();

  // 預設日期設定（使用者本地零時）
  const today = new Date();
  const today0 = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const defaultNoticeDateStr = formatDateStr(today0);

  const oneYearAgo = new Date(today0.getTime());
  oneYearAgo.setFullYear(today0.getFullYear() - 1);
  const defaultOnboardingStr = formatDateStr(oneYearAgo);

  const defaultTargetLastDate = new Date(today0.getTime());
  defaultTargetLastDate.setDate(today0.getDate() + 20);
  const defaultTargetLastDateStr = formatDateStr(defaultTargetLastDate);

  // States
  const [calcDirection, setCalcDirection] = useState<'noticeToLast' | 'lastToNotice'>('noticeToLast');
  const [onboardingDate, setOnboardingDate] = useState<string>(defaultOnboardingStr);
  const [noticeDate, setNoticeDate] = useState<string>(defaultNoticeDateStr);
  const [targetLastWorkingDate, setTargetLastWorkingDate] = useState<string>(defaultTargetLastDateStr);

  const [noticeMode, setNoticeMode] = useState<'auto' | 'custom'>('auto');
  const [customDays, setCustomDays] = useState<number | ''>(20);
  const [resignationType, setResignationType] = useState<'voluntary' | 'involuntary'>('voluntary');
  const [useTaiwanHolidays, setUseTaiwanHolidays] = useState<boolean>(true);
  const [annualLeaveDays, setAnnualLeaveDays] = useState<number | ''>(5);
  const [leaveDaysToTake, setLeaveDaysToTake] = useState<number | ''>(5);
  const [customLeaveDates, setCustomLeaveDates] = useState<string[]>([]);
  const [officeDayMode, setOfficeDayMode] = useState<'autoLeaveEnd' | 'lastWorkingDay' | 'custom'>('autoLeaveEnd');
  const [customOfficeDate, setCustomOfficeDate] = useState<string>('');
  const [monthlySalary, setMonthlySalary] = useState<number | ''>(60000);
  const [employerShortNoticeDays, setEmployerShortNoticeDays] = useState<number | ''>(0);

  // 信件範本設定
  const [emailVariant, setEmailVariant] = useState<EmailTemplateVariant>('standard');
  const [senderName, setSenderName] = useState<string>('');
  const [handoverPerson, setHandoverPerson] = useState<string>('');

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const isMountedRef = useRef<boolean>(false);

  // 掛載時設置主題色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);

  // URL 雙向狀態連動（反向讀取與邊界清洗）
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const dirParam = params.get('dir');
    if (dirParam === 'noticeToLast' || dirParam === 'lastToNotice') {
      setCalcDirection(dirParam);
    }
    if (params.has('onboarding')) {
      const v = params.get('onboarding') || '';
      if (parseYmd(v)) setOnboardingDate(v);
    }
    if (params.has('notice')) {
      const v = params.get('notice') || '';
      if (parseYmd(v)) setNoticeDate(v);
    }
    if (params.has('targetLast')) {
      const v = params.get('targetLast') || '';
      if (parseYmd(v)) setTargetLastWorkingDate(v);
    }
    const modeParam = params.get('mode');
    if (modeParam === 'auto' || modeParam === 'custom') {
      setNoticeMode(modeParam);
    }
    if (params.has('customDays')) {
      const parsed = parseInt(params.get('customDays') || '20', 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 365) setCustomDays(parsed);
    }
    const typeParam = params.get('type');
    if (typeParam === 'voluntary' || typeParam === 'involuntary') {
      setResignationType(typeParam);
      if (typeParam === 'involuntary') setEmailVariant('involuntary');
    }
    if (params.has('holidays')) {
      setUseTaiwanHolidays(params.get('holidays') !== '0');
    }
    if (params.has('leave')) {
      const parsed = parseFloat(params.get('leave') || '5');
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 99) setAnnualLeaveDays(parsed);
    }
    if (params.has('leaveToTake')) {
      const parsed = parseFloat(params.get('leaveToTake') || '5');
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 99) setLeaveDaysToTake(parsed);
    } else if (params.get('leaveMode') === 'payout') {
      setLeaveDaysToTake(0);
    }
    const officeModeParam = params.get('officeMode');
    if (
      officeModeParam === 'autoLeaveEnd' ||
      officeModeParam === 'lastWorkingDay' ||
      officeModeParam === 'custom'
    ) {
      setOfficeDayMode(officeModeParam);
    }
    if (params.has('customOffice')) {
      const v = params.get('customOffice') || '';
      if (parseYmd(v)) setCustomOfficeDate(v);
    }
    if (params.has('salary')) {
      const parsed = parseInt(params.get('salary') || '60000', 10);
      if (!isNaN(parsed) && parsed >= 0) setMonthlySalary(parsed);
    }
    if (params.has('shortDays')) {
      const parsed = parseInt(params.get('shortDays') || '0', 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 60) setEmployerShortNoticeDays(parsed);
    }

    isMountedRef.current = true;
  }, [defaultOnboardingStr, defaultNoticeDateStr, defaultTargetLastDateStr]);

  // 正向更新 URL 參數
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
    if (!useTaiwanHolidays) params.set('holidays', '0');
    if (annualLeaveDays !== '') params.set('leave', annualLeaveDays.toString());
    if (leaveDaysToTake !== '') params.set('leaveToTake', leaveDaysToTake.toString());
    params.set('officeMode', officeDayMode);
    if (officeDayMode === 'custom' && customOfficeDate) {
      params.set('customOffice', customOfficeDate);
    }
    if (monthlySalary !== '') params.set('salary', monthlySalary.toString());
    if (resignationType === 'involuntary' && employerShortNoticeDays !== '' && employerShortNoticeDays > 0) {
      params.set('shortDays', employerShortNoticeDays.toString());
    }

    const newUrl = `${window.location.pathname}?${params.toString()}`;
    window.history.replaceState(null, '', newUrl);
  }, [
    calcDirection,
    onboardingDate,
    noticeDate,
    targetLastWorkingDate,
    noticeMode,
    customDays,
    resignationType,
    useTaiwanHolidays,
    annualLeaveDays,
    leaveDaysToTake,
    officeDayMode,
    customOfficeDate,
    monthlySalary,
    employerShortNoticeDays,
  ]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // --- 計算核心邏輯（純函數引擎，見 ./engine.ts） ---
  const {
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
    monthEndInsight,
  } = calculateResignation({
    calcDirection,
    onboardingDate,
    noticeDate,
    targetLastWorkingDate,
    noticeMode,
    customDays: customDays === '' ? 0 : customDays,
    resignationType,
    annualLeaveDays: annualLeaveDays === '' ? 0 : annualLeaveDays,
    leaveDaysToTake: leaveDaysToTake === '' ? 0 : leaveDaysToTake,
    officeDayMode,
    customOfficeDate,
    monthlySalary: monthlySalary === '' ? 0 : monthlySalary,
    useTaiwanHolidays,
    customLeaveDates,
    employerShortNoticeDays: employerShortNoticeDays === '' ? 0 : employerShortNoticeDays,
    today: formatDateStr(today0),
  });

  const excessPayoutLeaveDays = payoutDaysTotal;
  const leaveDaysTotal = annualLeaveDays === '' ? 0 : annualLeaveDays;
  const intendedTakeDays = Math.min(leaveDaysTotal, leaveDaysToTake === '' ? 0 : leaveDaysToTake);
  const noticeWeeks = Math.ceil(requiredNoticeDays / 7);
  const tenureText =
    lang === 'zh-TW'
      ? `${tenureYears} 年 ${tenureMonths} 個月 (${totalDaysTenure} 天)`
      : `${tenureYears}y ${tenureMonths}m (${totalDaysTenure}d)`;
  const isDateInPast = (d: Date) => {
    const d0 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
    return d0.getTime() < today0.getTime();
  };

  // 互動月曆切換單日特休排休
  const handleToggleCalendarLeaveDate = (dateStr: string) => {
    setCustomLeaveDates((prev) => {
      const baseSet =
        prev.length > 0
          ? new Set(prev)
          : new Set(
              calendarDays
                .filter((d) => d.status === 'annualLeave')
                .map((d) => d.dateStr),
            );
      if (baseSet.has(dateStr)) {
        baseSet.delete(dateStr);
      } else {
        baseSet.add(dateStr);
      }
      const nextArr = Array.from(baseSet);
      setLeaveDaysToTake(nextArr.length);
      return nextArr;
    });
  };

  const handleResetCustomLeave = () => {
    setCustomLeaveDates([]);
  };

  const handleExtendToSunday = (sundayDateStr: string) => {
    setCalcDirection('lastToNotice');
    setTargetLastWorkingDate(sundayDateStr);
    setCustomLeaveDates([]);
  };

  // 離職預告範本內文
  const emailTemplateText = generateResignationEmail({
    lang,
    variant: emailVariant,
    senderName,
    handoverPerson,
    tenureYears,
    tenureMonths,
    requiredNoticeDays,
    calculatedNoticeDate: calculatedNoticeD,
    noticeStartDate,
    calculatedLastWorkingDate: calculatedLastWorkingD,
    actualOfficeDate,
    effectiveDate,
    actualTakeLeaveDays,
    payoutDaysTotal,
    estimatedLeavePayout,
    estimatedSeverancePay,
    maxJobSeekingLeaveDays,
  });

  const copyToClipboard = () => {
    navigator.clipboard.writeText(emailTemplateText);
    showToast(t.copiedSuccess);
  };

  const handleExportIcs = () => {
    const icsText = buildResignationIcsContent({
      lang,
      calculatedNoticeDate: calculatedNoticeD,
      actualOfficeDate,
      calculatedLastWorkingDate: calculatedLastWorkingD,
      effectiveDate,
      requiredNoticeDays,
      actualTakeLeaveDays,
    });
    const blob = new Blob([icsText], { type: 'text/calendar;charset=utf-8' });
    downloadBlob(blob, `resignation-schedule-${formatDateStr(calculatedLastWorkingD)}.ics`);
    showToast(t.exportIcsSuccess);
  };

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#00f5a0"
      accentGlow="rgba(0, 245, 160, 0.6)"
    >
      <div className={styles.container}>
        {/* 頂部：合規天數檢查 Banner + 匯出 .ics 行事曆按鈕 */}
        {isNoticeOverdueFromToday ? (
          <div className={styles.warningBanner}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold flex items-center gap-2 text-base">
                <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{t.pastNoticeOverdueTitle}</span>
              </div>
              <button type="button" onClick={handleExportIcs} className={styles.secondaryBtn}>
                {t.exportIcsBtn}
              </button>
            </div>
            <div className="text-sm leading-relaxed flex flex-col gap-1 mt-0.5">
              <div>
                {t.pastNoticeOverdueDesc1} <strong>{formatDateStr(calculatedNoticeD)}</strong> {t.pastNoticeOverdueDesc2}{' '}
                <strong>{Math.max(0, daysRemainingFromToday)}</strong> {t.pastNoticeOverdueDesc3}{' '}
                <strong>{requiredNoticeDays}</strong> {t.pastNoticeOverdueDesc4}{' '}
                <strong>{missingDaysFromToday}</strong> {t.pastNoticeOverdueDesc5}
              </div>
            </div>
            <div className="text-xs opacity-95 leading-relaxed font-mono mt-1.5 flex flex-wrap items-center gap-2">
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <span>{t.recommendPostponeDate} <strong>{formatDateStr(postponeLastWorkingFromToday)}</strong></span>
              <button
                type="button"
                onClick={() => {
                  setCalcDirection('lastToNotice');
                  setTargetLastWorkingDate(formatDateStr(postponeLastWorkingFromToday));
                }}
                className="px-2.5 py-0.5 rounded-lg bg-select-bg border border-border-glass text-text-main hover:border-[var(--theme-color)] transition-colors cursor-pointer text-xs font-sans font-semibold"
              >
                {t.applyPostponeBtn}
              </button>
            </div>
            <div className="text-xs opacity-80 mt-0.5 flex items-center gap-1.5">
              <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>{t.lawAgreementNote}</span>
            </div>
          </div>
        ) : !isPeriodSufficient ? (
          <div className={styles.warningBanner}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-bold flex items-center gap-2 text-base">
                <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span>{t.insufficientNoticeWarningTitle}</span>
              </div>
              <button type="button" onClick={handleExportIcs} className={styles.secondaryBtn}>
                {t.exportIcsBtn}
              </button>
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
          <div className={styles.successBanner}>
            <div className="flex items-center gap-2.5">
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="font-medium text-sm">
                {t.sufficientNoticeSuccess} ({noticeDiffDays} / {requiredNoticeDays} {t.daysUnit})
                {isNoticeInPast && <span className="opacity-80 block text-xs mt-0.5">{t.pastNoticeSuccessNote}</span>}
              </div>
            </div>
            <button
              type="button"
              onClick={handleExportIcs}
              className={`${styles.accentBtn} shrink-0`}
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span>{t.exportIcsBtn}</span>
            </button>
          </div>
        )}

        <div className={styles.gridSection}>
          {/* 左側：Sticky 控制輸入面板 */}
          <div className={`${styles.glassCard} ${styles.stickySidebar}`}>
            <h2 className={styles.cardTitle}>
              <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span>{t.paramsSectionTitle}</span>
            </h2>

            <div className="flex flex-col gap-3.5">
              {/* 試算方向選擇 */}
              <div>
                <label htmlFor={calcDirSelectId} className="block text-sm font-semibold text-text-main mb-1">
                  {t.calcDirectionLabel}
                </label>
                <select
                  id={calcDirSelectId}
                  value={calcDirection}
                  onChange={(e) => {
                    setCalcDirection(e.target.value as 'noticeToLast' | 'lastToNotice');
                    setCustomLeaveDates([]);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main font-semibold focus:border-[var(--theme-color)] outline-none text-sm leading-snug"
                >
                  <option value="noticeToLast">{t.dirNoticeToLast}</option>
                  <option value="lastToNotice">{t.dirLastToNotice}</option>
                </select>
              </div>

              {/* 到職日 + 提出離職日 / 目標最後在職日 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
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

                {calcDirection === 'noticeToLast' ? (
                  <div>
                    <label htmlFor={noticeInputId} className="block text-sm font-medium text-text-sub mb-1">
                      {t.noticeDateLabel}
                    </label>
                    <input
                      id={noticeInputId}
                      type="date"
                      value={noticeDate}
                      onChange={(e) => {
                        setNoticeDate(e.target.value);
                        setCustomLeaveDates([]);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm [color-scheme:dark]"
                    />
                  </div>
                ) : (
                  <div>
                    <label htmlFor={targetLastWorkingInputId} className="block text-sm font-medium text-text-sub mb-1">
                      {t.targetLastWorkingDateLabel}
                    </label>
                    <input
                      id={targetLastWorkingInputId}
                      type="date"
                      value={targetLastWorkingDate}
                      onChange={(e) => {
                        setTargetLastWorkingDate(e.target.value);
                        setCustomLeaveDates([]);
                      }}
                      className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm [color-scheme:dark]"
                    />
                  </div>
                )}
              </div>

              {/* 預告天數計算模式 */}
              <div>
                <label htmlFor={noticeModeSelectId} className="block text-sm font-medium text-text-sub mb-1">
                  {t.noticeOptionLabel}
                </label>
                <select
                  id={noticeModeSelectId}
                  value={noticeMode}
                  onChange={(e) => {
                    setNoticeMode(e.target.value as 'auto' | 'custom');
                    setCustomLeaveDates([]);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
                >
                  <option value="auto">{t.autoLaborLaw}</option>
                  <option value="custom">{t.customNotice}</option>
                </select>
              </div>

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
                    onChange={(e) => {
                      setCustomDays(e.target.value === '' ? '' : parseInt(e.target.value, 10));
                      setCustomLeaveDates([]);
                    }}
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
                  onChange={(e) => {
                    const nextType = e.target.value as 'voluntary' | 'involuntary';
                    setResignationType(nextType);
                    if (nextType === 'involuntary') {
                      setEmailVariant('involuntary');
                    } else if (emailVariant === 'involuntary') {
                      setEmailVariant('standard');
                    }
                  }}
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
                    onClick={() => {
                      setAnnualLeaveDays(statutoryAnnualLeave);
                      setCustomLeaveDates([]);
                    }}
                    className={`text-xs ${styles.accentText} hover:underline flex items-center gap-1 font-medium cursor-pointer`}
                  >
                    <svg viewBox="0 0 24 24" width={13} height={13} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-0a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>
                      {t.statutoryLeaveHint}
                      <strong>
                        {statutoryAnnualLeave} {t.daysUnit}
                      </strong>{' '}
                      ({t.fillStatutoryBtn})
                    </span>
                  </button>
                </div>
                <input
                  id={leaveDaysInputId}
                  type="number"
                  step="0.5"
                  min={0}
                  max={99}
                  value={annualLeaveDays}
                  onChange={(e) => {
                    setAnnualLeaveDays(e.target.value === '' ? '' : parseFloat(e.target.value));
                    setCustomLeaveDates([]);
                  }}
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
                      onClick={() => {
                        setLeaveDaysToTake(0);
                        setCustomLeaveDates([]);
                      }}
                      className="px-2 py-0.5 rounded bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors cursor-pointer"
                    >
                      {t.btnTakeZero}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setLeaveDaysToTake(annualLeaveDays === '' ? 0 : annualLeaveDays);
                        setCustomLeaveDates([]);
                      }}
                      className="px-2 py-0.5 rounded bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors cursor-pointer"
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
                  onChange={(e) => {
                    setLeaveDaysToTake(e.target.value === '' ? '' : parseFloat(e.target.value));
                    setCustomLeaveDates([]);
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
                />
              </div>

              {/* 台灣國定假日自動扣除開關 */}
              <div className="p-2.5 rounded-xl bg-select-bg border border-border-glass">
                <div className="flex items-center gap-2">
                  <input
                    id={holidaysCheckboxId}
                    type="checkbox"
                    checked={useTaiwanHolidays}
                    onChange={(e) => {
                      setUseTaiwanHolidays(e.target.checked);
                      setCustomLeaveDates([]);
                    }}
                    className="w-4 h-4 accent-[#00f5a0] cursor-pointer"
                  />
                  <label
                    htmlFor={holidaysCheckboxId}
                    className="text-sm font-medium text-text-main cursor-pointer"
                  >
                    {t.useTaiwanHolidaysLabel}
                  </label>
                </div>
                {useTaiwanHolidays && holidaysInPeriod.length > 0 && (
                  <div className={`text-xs mt-1.5 pl-6 font-medium ${styles.accentText}`}>
                    <div className="flex flex-wrap gap-1 mt-0.5">
                      {holidaysInPeriod.map((h) => (
                        <span
                          key={h.date}
                          className="px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass font-mono text-xs"
                        >
                          {h.date.slice(5)} {lang === 'zh-TW' ? h.nameZh : h.nameEn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* 最後到辦公室出勤日推算模式 */}
              <div>
                <label htmlFor={officeDayModeSelectId} className="block text-sm font-medium text-text-sub mb-1">
                  {t.officeDayModeLabel}
                </label>
                <select
                  id={officeDayModeSelectId}
                  value={officeDayMode}
                  onChange={(e) => {
                    const nextMode = e.target.value as 'autoLeaveEnd' | 'lastWorkingDay' | 'custom';
                    setOfficeDayMode(nextMode);
                    setCustomLeaveDates([]);
                    if (nextMode === 'custom') {
                      setCustomOfficeDate(formatDateStr(actualOfficeDate));
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
                >
                  <option value="autoLeaveEnd">{t.officeDayAutoLeaveEnd}</option>
                  <option value="lastWorkingDay">{t.officeDayLastWorking}</option>
                  <option value="custom">{t.officeDayCustom}</option>
                </select>
              </div>

              {officeDayMode === 'custom' && (
                <div>
                  <label htmlFor={customOfficeInputId} className="block text-sm font-medium text-text-sub mb-1">
                    {t.customOfficeDateLabel}
                  </label>
                  <input
                    id={customOfficeInputId}
                    type="date"
                    min={formatDateStr(calculatedNoticeD)}
                    max={formatDateStr(calculatedLastWorkingD)}
                    value={formatDateStr(actualOfficeDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        setCustomOfficeDate(e.target.value);
                        setCustomLeaveDates([]);
                      }
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm [color-scheme:dark]"
                  />
                  <p className="text-xs text-text-sub mt-1 leading-relaxed">
                    {t.customOfficeDateHint}（{formatDateStr(calculatedNoticeD)} ~ {formatDateStr(calculatedLastWorkingD)}）
                  </p>
                </div>
              )}

              {/* 月薪輸入 */}
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

              {/* 非自願離職：雇主未足額預告天數 */}
              {resignationType === 'involuntary' && (
                <div>
                  <label htmlFor={shortNoticeDaysInputId} className="block text-sm font-medium text-text-sub mb-1">
                    {t.employerShortNoticeDaysLabel}
                  </label>
                  <input
                    id={shortNoticeDaysInputId}
                    type="number"
                    min={0}
                    max={60}
                    value={employerShortNoticeDays}
                    onChange={(e) =>
                      setEmployerShortNoticeDays(e.target.value === '' ? '' : parseInt(e.target.value, 10))
                    }
                    className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
                  />
                  <p className="text-xs text-text-sub mt-1">{t.employerShortNoticeHint}</p>
                </div>
              )}
            </div>
          </div>

          {/* 右側：核心數據與分析工作區 */}
          <div className="flex flex-col gap-5 min-w-0">
            {/* 第一排：4 等寬核心指標看板 */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {/* 1. 法定預告期 & 年資 */}
              <div className={styles.statCard}>
                <div>
                  <div className="text-sm font-semibold text-text-sub mb-1">{t.legalNoticeDays}</div>
                  <div className={`text-2xl font-extrabold ${styles.accentText}`}>
                    {requiredNoticeDays}{' '}
                    <span className="text-sm font-normal text-text-sub">{t.daysUnit}</span>
                  </div>
                </div>
                <div className="text-xs text-text-sub mt-2 truncate" title={tenureText}>
                  {t.tenure}: {tenureText}
                </div>
              </div>

              {/* 2. 實際最後出勤日（高亮主卡） */}
              <div className={`${styles.statCard} ${styles.statCardHighlight}`}>
                <div>
                  <div className="text-sm font-semibold text-text-sub mb-1">{t.actualOfficeDay}</div>
                  <div className={`text-base sm:text-lg font-bold font-mono truncate ${isDateInPast(actualOfficeDate) ? 'text-red-500' : styles.accentText}`}>
                    {formatDateFriendly(actualOfficeDate, lang)}
                  </div>
                </div>
                <div className="text-xs text-text-sub mt-2 truncate">
                  {actualTakeLeaveDays > 0
                    ? `${t.leaveDaysCount}: ${actualTakeLeaveDays} ${t.leaveDaysCountUnit}`
                    : t.lastWorkingDay}
                </div>
              </div>

              {/* 3. 契約最後在職日 */}
              <div className={styles.statCard}>
                <div>
                  <div className="text-sm font-semibold text-text-sub mb-1">{t.lastWorkingDay}</div>
                  <div className={`text-base sm:text-lg font-bold truncate font-mono ${isDateInPast(calculatedLastWorkingD) ? 'text-red-500' : 'text-text-main'}`}>
                    {formatDateFriendly(calculatedLastWorkingD, lang)}
                  </div>
                </div>
                <div className="text-xs text-text-sub mt-2 truncate">
                  {calcDirection === 'noticeToLast'
                    ? t.calcLastWorkingDayNote
                    : t.targetLastWorkingDayNote}
                </div>
              </div>

              {/* 4. 離職生效日（退保日） */}
              <div className={styles.statCard}>
                <div>
                  <div className="text-sm font-semibold text-text-sub mb-1">{t.effectiveDate}</div>
                  <div className={`text-base sm:text-lg font-bold truncate font-mono ${isDateInPast(effectiveDate) ? 'text-red-500' : 'text-text-main'}`}>
                    {formatDateFriendly(effectiveDate, lang)}
                  </div>
                </div>
                <div className="text-xs text-text-sub mt-2 truncate">{t.effectiveDateNote}</div>
              </div>
            </div>

            {/* 第二排：左「關鍵離職時程時間軸」＋ 右「預告期視覺化排休月曆」並排雙欄 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
              {/* 時間軸卡片 */}
              <div className={styles.glassCard}>
                <h3 className={styles.cardTitle}>
                  <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>{t.timelineTitle}</span>
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
                            ? t.noticeGivenDescForward
                            : t.noticeGivenDescBackward}
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
                        <div className={styles.timelineDesc}>{t.noticeStartDesc}</div>
                      </div>
                    );
                  })()}

                  {/* 2.5 資遣謀職假得請假期間 */}
                  {resignationType === 'involuntary' && requiredNoticeDays > 0 && (() => {
                    const isPast = isDateInPast(calculatedLastWorkingD);
                    const isFullLeaveTaken = actualTakeLeaveDays >= maxTakeableLeaveDays && maxTakeableLeaveDays > 0;
                    return (
                      <div className={styles.timelineItem}>
                        <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : styles.timelineNodeActive}`}>
                          {isPast ? '!' : '✓'}
                        </div>
                        <div className={styles.timelineLabel}>
                          {t.jobSeekingLeavePeriodNode} ({maxJobSeekingLeaveDays} {t.paidDaysUnit})
                        </div>
                        <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : styles.accentText}`}>
                          {formatDateFriendly(noticeStartDate, lang)} ~ {formatDateFriendly(calculatedLastWorkingD, lang)}
                        </div>
                        <div className={styles.timelineDesc}>
                          <div>{t.jobSeekingLeaveTimelineDesc}</div>
                          {isFullLeaveTaken && (
                            <div className={`mt-1 text-xs ${styles.accentText} font-medium`}>
                              {t.jobSeekingFullLeaveNote}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* 3 & 4. 依實際發生時間順序排列「特休排休期間」與「最後一天到辦公室出勤」 */}
                  {(() => {
                    const hasLeaveNode =
                      annualLeaveDays !== '' &&
                      actualTakeLeaveDays > 0 &&
                      leaveStartDate !== null &&
                      leaveEndDate !== null;

                    const leaveNodeEl = hasLeaveNode ? (() => {
                      const isPast = isDateInPast(leaveEndDate);
                      return (
                        <div key="leave-node" className={styles.timelineItem}>
                          <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : styles.timelineNodeActive}`}>
                            {isPast ? '!' : '✓'}
                          </div>
                          <div className={styles.timelineLabel}>
                            {t.leavePeriodNode} ({actualTakeLeaveDays} {t.leaveDaysCountUnit})
                          </div>
                          <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : ''}`}>
                            {formatDateFriendly(leaveStartDate, lang)} ~ {formatDateFriendly(leaveEndDate, lang)}
                          </div>
                          <div className={styles.timelineDesc}>
                            {`${t.leavePayoutEstimate}: ${excessPayoutLeaveDays} ${t.payoutDaysSuffix}`}
                          </div>
                        </div>
                      );
                    })() : null;

                    const officeNodeEl = (() => {
                      const isPast = isDateInPast(actualOfficeDate);
                      const isWeekendOffice = isWeekend(actualOfficeDate);
                      return (
                        <div key="office-node" className={styles.timelineItem}>
                          <div className={`${styles.timelineNode} ${isPast ? styles.timelineNodeRed : styles.timelineNodeActive}`}>
                            {isPast ? '!' : '✓'}
                          </div>
                          <div className={styles.timelineLabel}>
                            {t.actualOfficeNode}
                            {isWeekendOffice && (
                              <span className="text-xs text-amber-500 ml-1.5 font-normal">
                                ({t.weekendTag})
                              </span>
                            )}
                          </div>
                          <div className={`${styles.timelineDate} ${isPast ? styles.timelineDateRed : styles.accentText}`}>
                            {formatDateFriendly(actualOfficeDate, lang)} {isPast ? t.nodePastTag : ''}
                          </div>
                          <div className={styles.timelineDesc}>
                            {officeDayMode === 'autoLeaveEnd'
                              ? t.actualOfficeDescAuto
                              : officeDayMode === 'lastWorkingDay'
                              ? t.actualOfficeDescSpread
                              : t.actualOfficeDescCustom}
                          </div>
                        </div>
                      );
                    })();

                    if (!leaveNodeEl || !leaveStartDate) return officeNodeEl;
                    const leaveBeforeOffice =
                      leaveStartDate.getTime() < actualOfficeDate.getTime();
                    return leaveBeforeOffice
                      ? [leaveNodeEl, officeNodeEl]
                      : [officeNodeEl, leaveNodeEl];
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
                        <div className={styles.timelineDesc}>{t.lastWorkingDesc}</div>
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
                        <div className={styles.timelineDesc}>{t.effectiveDesc}</div>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* 預告期視覺化排休互動月曆 */}
              <NoticeCalendarCard
                lang={lang}
                t={t}
                calendarDays={calendarDays}
                hasCustomLeaveSelection={customLeaveDates.length > 0}
                onToggleDate={handleToggleCalendarLeaveDate}
                onResetCustomLeave={handleResetCustomLeave}
              />
            </div>

            {/* 第三排：整合「特休折現、當月破月薪資、健保歸屬與資遣財務試算」總覽卡 */}
            <div className={styles.glassCard}>
              <h3 className={styles.cardTitle}>
                <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth={2} className={styles.accentText}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>{t.leaveAnalysisTitle}</span>
              </h3>

              {/* 離職結算預估領取總額高亮看板 (非自願離職) */}
              {resignationType === 'involuntary' && (
                <div className={`${styles.payoutHighlightBox} mb-4`}>
                  <div className="text-sm font-semibold text-text-main">
                    {t.totalEstimatedPayoutTitle}
                  </div>
                  <div className={`text-2xl sm:text-3xl font-extrabold font-mono mt-1 ${styles.accentText}`}>
                    ${totalEstimatedPayout.toLocaleString('zh-TW')} TWD
                  </div>
                  <div className="text-xs text-text-sub mt-1">
                    {t.totalEstimatedPayoutSub}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                {/* 1. 特休不休假代金 */}
                <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
                  <div className="text-sm font-semibold text-text-sub">{t.leavePayoutEstimate}</div>
                  <div className={`text-xl font-bold font-mono mt-1 ${styles.accentText}`}>
                    ${estimatedLeavePayout.toLocaleString('zh-TW')} TWD
                  </div>
                  <div className="text-xs text-text-sub mt-2">
                    {t.dailyAvgSalary}: ${dailyAvgSalary.toLocaleString('zh-TW')} × {payoutDaysTotal} {t.payoutDaysSuffix}
                  </div>
                </div>

                {/* 2. 當月預估破月薪資 */}
                <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
                  <div className="text-sm font-semibold text-text-sub">
                    {t.proratedSalaryLabel}
                  </div>
                  <div className={`text-xl font-bold font-mono mt-1 ${styles.accentText}`}>
                    ${monthEndInsight.proratedFinalMonthSalary.toLocaleString('zh-TW')} TWD
                  </div>
                  <div className="text-xs text-text-sub mt-2">
                    {monthEndInsight.isLastDayOfMonth && (monthlySalary === '' ? 0 : monthlySalary) > 0
                      ? t.proratedSalaryFullMonth
                      : `${t.proratedSalaryDescPrefix} ${monthEndInsight.workedDaysInLastMonth} / ${monthEndInsight.daysInLastMonth} ${t.daysUnit}`}
                  </div>
                </div>

                {/* 3. 全民健保當月扣費歸屬 */}
                <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
                  <div className="text-sm font-semibold text-text-main">
                    {t.nhiBillingRuleTitle}
                  </div>
                  <div className="text-xs text-text-sub mt-2 leading-relaxed">
                    {monthEndInsight.isLastDayOfMonth
                      ? t.nhiBillingFullMonthDesc
                      : t.nhiBillingMidMonthDesc}
                  </div>
                </div>

                {/* 4. 勞退新制資遣費試算 (非自願離職) */}
                {resignationType === 'involuntary' && (
                  <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
                    <div className="text-sm font-semibold text-text-sub">{t.severancePayTitle}</div>
                    <div className={`text-xl font-bold font-mono mt-1 ${styles.accentText}`}>
                      ${estimatedSeverancePay.toLocaleString('zh-TW')} TWD
                    </div>
                    <div className="text-xs text-text-sub mt-2 font-mono">
                      {t.severancePayBasisPrefix}
                      <strong>{severanceMonths}</strong>
                      {t.severancePayBasisSuffix}
                    </div>
                    <div className="text-xs text-text-sub mt-1">{t.severancePayLawNote}</div>
                  </div>
                )}

                {/* 5. 雇主未足額預告工資 */}
                {resignationType === 'involuntary' && estimatedNoticePay > 0 && (
                  <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
                    <div className="text-sm font-semibold text-text-sub">{t.noticePayTitle}</div>
                    <div className={`text-xl font-bold font-mono mt-1 ${styles.accentText}`}>
                      ${estimatedNoticePay.toLocaleString('zh-TW')} TWD
                    </div>
                    <div className="text-xs text-text-sub mt-2">
                      {t.noticePayDescPrefix} {employerShortNoticeDays} {t.noticePayDescSuffix}
                    </div>
                  </div>
                )}

                {/* 6. 資遣謀職假權益 */}
                {resignationType === 'involuntary' && (
                  <div className="p-4 rounded-xl bg-select-bg border border-border-glass">
                    <div className="text-sm font-semibold text-text-sub">{t.jobSeekingLeaveTitle}</div>
                    <div className="text-xl font-bold font-mono mt-1 text-text-main">
                      {maxJobSeekingLeaveDays}{' '}
                      <span className="text-sm font-normal text-text-sub">{t.paidDaysUnit}</span>
                    </div>
                    <div className="text-xs text-text-sub mt-2">
                      {t.jobSeekingLeaveDesc} {noticeWeeks} {t.jobSeekingLeaveWeeksSuffix}
                    </div>
                    <div className={`text-xs mt-1 font-medium ${styles.accentText}`}>
                      {t.jobSeekingLeaveUseFirstNote}
                    </div>
                  </div>
                )}
              </div>

              {/* 週末順延多領例假日薪資提示 */}
              {monthEndInsight.canExtendToSunday && (
                <div className="p-4 rounded-xl bg-select-bg border border-border-glass mt-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div className="space-y-1">
                    <div className={`text-sm font-bold flex items-center gap-2 ${styles.accentText}`}>
                      <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2} className="flex-shrink-0">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                      </svg>
                      <span>{t.weekendExtendTitle}</span>
                    </div>
                    <div className="text-sm text-text-sub leading-relaxed">
                      {t.weekendExtendDesc1}
                      <strong className="text-text-main font-mono">{monthEndInsight.sundayDateStr}</strong>
                      {t.weekendExtendDesc2}{' '}
                      <strong className="text-text-main">{monthEndInsight.extraWeekendDays}</strong>{' '}
                      {t.weekendExtendDesc3}{' '}
                      <strong className={styles.accentText}>
                        ${monthEndInsight.extraWeekendSalary.toLocaleString('zh-TW')} TWD
                      </strong>
                      ！
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleExtendToSunday(monthEndInsight.sundayDateStr)}
                    className={`${styles.accentBtn} shrink-0`}
                  >
                    <span>
                      {t.applySundayExtendBtn} ({monthEndInsight.sundayDateStr})
                    </span>
                  </button>
                </div>
              )}

              {/* 被資遣最佳換錢策略提示卡片 */}
              {resignationType === 'involuntary' && leaveDaysTotal > 0 && intendedTakeDays > 0 && (
                <div className="p-4 rounded-xl bg-select-bg border border-border-glass leading-relaxed space-y-2 mt-3.5">
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
                      {t.severanceStrategyDesc2}{' '}
                      <strong className={styles.accentText}>
                        ${Math.round(dailyAvgSalary * Math.min(leaveDaysTotal, intendedTakeDays)).toLocaleString('zh-TW')} TWD
                      </strong>
                      ！
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setLeaveDaysToTake(0);
                        setCustomLeaveDates([]);
                      }}
                      className={styles.accentBtn}
                    >
                      <span>{t.btnStrategicSeverance}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 第四排：雙欄「互動式離職手續檢核表」＋「一鍵生成離職預告範本」與法規說明 */}
            <OffboardingToolsSection
              t={t}
              resignationType={resignationType}
              emailVariant={emailVariant}
              onChangeEmailVariant={setEmailVariant}
              senderName={senderName}
              onChangeSenderName={setSenderName}
              handoverPerson={handoverPerson}
              onChangeHandoverPerson={setHandoverPerson}
              emailTemplateText={emailTemplateText}
              onCopyEmail={copyToClipboard}
            />
          </div>
        </div>

        {/* 通用 FAQ 常見問題區塊 */}
        <FaqSection
          items={t.faqItems}
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          accentColor="#00ff66"
        />
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

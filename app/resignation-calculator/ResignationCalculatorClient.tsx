'use client';

import React, { useState, useEffect, useRef } from 'react';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import { downloadBlob } from '../utils/downloadBlob';
import styles from './resignation-calculator.module.css';
import {
  calculateResignation,
  formatDateStr,
  parseYmd,
} from './engine';
import {
  generateResignationEmail,
  buildResignationIcsContent,
  type EmailTemplateVariant,
} from './icsExport';
import { TRANSLATIONS } from './translations';
import NoticeCalendarCard from './NoticeCalendarCard';
import OffboardingToolsSection from './OffboardingToolsSection';
import ResignationNoticeBanner from './components/ResignationNoticeBanner';
import ResignationParamsSidebar from './components/ResignationParamsSidebar';
import ResignationMilestonesCards from './components/ResignationMilestonesCards';
import ResignationTimelineCard from './components/ResignationTimelineCard';
import ResignationFinancialSettlementCard from './components/ResignationFinancialSettlementCard';

interface Props {
  lang?: 'zh-TW' | 'en';
}

export default function ResignationCalculatorClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

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
        <ResignationNoticeBanner
          t={t}
          isNoticeOverdueFromToday={isNoticeOverdueFromToday}
          isPeriodSufficient={isPeriodSufficient}
          isNoticeInPast={isNoticeInPast}
          noticeDiffDays={noticeDiffDays}
          requiredNoticeDays={requiredNoticeDays}
          daysRemainingFromToday={daysRemainingFromToday}
          missingDaysStandard={missingDaysStandard}
          missingDaysFromToday={missingDaysFromToday}
          calculatedNoticeD={calculatedNoticeD}
          postponeLastWorkingFromToday={postponeLastWorkingFromToday}
          onApplyPostpone={(postponeStr) => {
            setCalcDirection('lastToNotice');
            setTargetLastWorkingDate(postponeStr);
          }}
          onExportIcs={handleExportIcs}
        />

        <div className={styles.gridSection}>
          {/* 左側：Sticky 控制輸入面板 */}
          <ResignationParamsSidebar
            t={t}
            lang={lang}
            calcDirection={calcDirection}
            onChangeCalcDirection={(dir) => {
              setCalcDirection(dir);
              setCustomLeaveDates([]);
            }}
            onboardingDate={onboardingDate}
            onChangeOnboardingDate={setOnboardingDate}
            noticeDate={noticeDate}
            onChangeNoticeDate={(date) => {
              setNoticeDate(date);
              setCustomLeaveDates([]);
            }}
            targetLastWorkingDate={targetLastWorkingDate}
            onChangeTargetLastWorkingDate={(date) => {
              setTargetLastWorkingDate(date);
              setCustomLeaveDates([]);
            }}
            noticeMode={noticeMode}
            onChangeNoticeMode={(mode) => {
              setNoticeMode(mode);
              setCustomLeaveDates([]);
            }}
            customDays={customDays}
            onChangeCustomDays={(days) => {
              setCustomDays(days);
              setCustomLeaveDates([]);
            }}
            resignationType={resignationType}
            onChangeResignationType={(nextType) => {
              setResignationType(nextType);
              if (nextType === 'involuntary') {
                setEmailVariant('involuntary');
              } else if (emailVariant === 'involuntary') {
                setEmailVariant('standard');
              }
            }}
            statutoryAnnualLeave={statutoryAnnualLeave}
            annualLeaveDays={annualLeaveDays}
            onChangeAnnualLeaveDays={(days) => {
              setAnnualLeaveDays(days);
              setCustomLeaveDates([]);
            }}
            leaveDaysToTake={leaveDaysToTake}
            onChangeLeaveDaysToTake={(days) => {
              setLeaveDaysToTake(days);
              setCustomLeaveDates([]);
            }}
            useTaiwanHolidays={useTaiwanHolidays}
            onChangeUseTaiwanHolidays={(use) => {
              setUseTaiwanHolidays(use);
              setCustomLeaveDates([]);
            }}
            holidaysInPeriod={holidaysInPeriod}
            officeDayMode={officeDayMode}
            onChangeOfficeDayMode={(nextMode) => {
              setOfficeDayMode(nextMode);
              setCustomLeaveDates([]);
              if (nextMode === 'custom') {
                setCustomOfficeDate(formatDateStr(actualOfficeDate));
              }
            }}
            actualOfficeDate={actualOfficeDate}
            calculatedNoticeD={calculatedNoticeD}
            calculatedLastWorkingD={calculatedLastWorkingD}
            onChangeCustomOfficeDate={(date) => {
              setCustomOfficeDate(date);
              setCustomLeaveDates([]);
            }}
            monthlySalary={monthlySalary}
            onChangeMonthlySalary={setMonthlySalary}
            employerShortNoticeDays={employerShortNoticeDays}
            onChangeEmployerShortNoticeDays={setEmployerShortNoticeDays}
          />

          {/* 右側：核心數據與分析工作區 */}
          <div className="flex flex-col gap-5 min-w-0">
            {/* 第一排：4 等寬核心指標看板 */}
            <ResignationMilestonesCards
              t={t}
              lang={lang}
              requiredNoticeDays={requiredNoticeDays}
              tenureText={tenureText}
              actualOfficeDate={actualOfficeDate}
              actualTakeLeaveDays={actualTakeLeaveDays}
              calculatedLastWorkingD={calculatedLastWorkingD}
              effectiveDate={effectiveDate}
              calcDirection={calcDirection}
              isDateInPast={isDateInPast}
            />

            {/* 第二排：左「關鍵離職時程時間軸」＋ 右「預告期視覺化排休月曆」並排雙欄 */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
              {/* 時間軸卡片 */}
              <ResignationTimelineCard
                t={t}
                lang={lang}
                calculatedNoticeD={calculatedNoticeD}
                noticeStartDate={noticeStartDate}
                calculatedLastWorkingD={calculatedLastWorkingD}
                actualOfficeDate={actualOfficeDate}
                effectiveDate={effectiveDate}
                leaveStartDate={leaveStartDate}
                leaveEndDate={leaveEndDate}
                actualTakeLeaveDays={actualTakeLeaveDays}
                annualLeaveDays={annualLeaveDays}
                excessPayoutLeaveDays={excessPayoutLeaveDays}
                calcDirection={calcDirection}
                resignationType={resignationType}
                requiredNoticeDays={requiredNoticeDays}
                maxTakeableLeaveDays={maxTakeableLeaveDays}
                maxJobSeekingLeaveDays={maxJobSeekingLeaveDays}
                officeDayMode={officeDayMode}
                isDateInPast={isDateInPast}
              />

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
            <ResignationFinancialSettlementCard
              t={t}
              resignationType={resignationType}
              totalEstimatedPayout={totalEstimatedPayout}
              estimatedLeavePayout={estimatedLeavePayout}
              dailyAvgSalary={dailyAvgSalary}
              payoutDaysTotal={payoutDaysTotal}
              monthlySalary={monthlySalary}
              monthEndInsight={monthEndInsight}
              severanceMonths={severanceMonths}
              estimatedSeverancePay={estimatedSeverancePay}
              estimatedNoticePay={estimatedNoticePay}
              employerShortNoticeDays={employerShortNoticeDays}
              maxJobSeekingLeaveDays={maxJobSeekingLeaveDays}
              noticeWeeks={noticeWeeks}
              leaveDaysTotal={leaveDaysTotal}
              intendedTakeDays={intendedTakeDays}
              onExtendToSunday={handleExtendToSunday}
              onStrategicSeverance={() => {
                setLeaveDaysToTake(0);
                setCustomLeaveDates([]);
              }}
            />

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

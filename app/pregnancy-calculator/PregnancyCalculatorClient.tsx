'use client';

import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  calculateDueDate,
  calculateGestationalAge,
  calculateMaternityBenefits,
  crlToGestationalAge,
  getClinicalStageStatus,
  buildClinicalMilestones,
  type CalcMode,
  type ScanInputType,
  type IvfType,
  formatDate,
} from './engine';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './pregnancy-calculator.module.css';
import { TRANSLATIONS } from './translations';
import { getBabySizeInfo } from './constants';
import PregnancyInputPanel from './components/PregnancyInputPanel';
import MetricsOverviewCard from './components/MetricsOverviewCard';
import MaternityBenefitsCard from './components/MaternityBenefitsCard';
import LeaveTemplateCard from './components/LeaveTemplateCard';
import ClinicalTimelineCard from './components/ClinicalTimelineCard';
import PregnancyChecklistCard from './components/PregnancyChecklistCard';

export default function PregnancyCalculatorClient({ lang = 'zh-TW' }: { lang?: 'zh-TW' | 'en' }) {
  const t = TRANSLATIONS[lang];

  // IDs for accessibility
  const modeSelectId = useId();
  const lmpInputId = useId();
  const cycleInputId = useId();
  const eddInputId = useId();
  const scanDateId = useId();
  const scanTypeSelectId = useId();
  const scanWeeksId = useId();
  const scanDaysId = useId();
  const crlInputId = useId();
  const ivfDateId = useId();
  const ivfTypeId = useId();
  const salaryInputId = useId();
  const leaveStartId = useId();

  // 狀態管理
  const [calcMode, setCalcMode] = useState<CalcMode>('lmp');

  // 預設日期為 12 週前（方便使用者一進入頁面就有生動的數據呈現）
  const defaultLmp = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 84); // 12 weeks ago
    return formatDate(d);
  }, []);

  const [lmpDate, setLmpDate] = useState<string>(defaultLmp);
  const [cycleDays, setCycleDays] = useState<number>(28);
  const [eddDateInput, setEddDateInput] = useState<string>('');
  const [scanDate, setScanDate] = useState<string>(() => formatDate(new Date()));
  const [scanInputType, setScanInputType] = useState<ScanInputType>('weeks');
  const [scanWeeks, setScanWeeks] = useState<number>(12);
  const [scanDays, setScanDays] = useState<number>(0);
  const [crlValue, setCrlValue] = useState<number | ''>(45);
  const [ivfDate, setIvfDate] = useState<string>(() => formatDate(new Date()));
  const [ivfType, setIvfType] = useState<IvfType>('d5');

  // 依 CRL (mm) 換算胎兒天數與週數（純函數引擎）
  const crlConvertedAge = useMemo(() => crlToGestationalAge(crlValue), [crlValue]);

  // 薪資、產假與摺疊設定
  const [monthlySalary, setMonthlySalary] = useState<number | ''>(45800);
  const [leaveStartWeeksOption, setLeaveStartWeeksOption] = useState<number>(2); // 產前 2 週開始請
  const [showSalaryTooltip, setShowSalaryTooltip] = useState<boolean>(false);
  const [isBenefitsExpanded, setIsBenefitsExpanded] = useState<boolean>(true);
  const [isTemplateExpanded, setIsTemplateExpanded] = useState<boolean>(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [shareLinkToast, setShareLinkToast] = useState(false);
  const isMountedRef = React.useRef<boolean>(false);

  // Checklist 狀態（預設不勾選，由使用者自由互動打勾）
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  // 設定主題色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff4081');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 64, 129, 0.6)');
  }, []);

  // 50 週 (350天) 本地儲存常數
  const STORAGE_KEY = 'smalltools_pregnancy_calc_v1';
  const TTL_50_WEEKS_MS = 50 * 7 * 24 * 60 * 60 * 1000;

  // 初次載入：從 LocalStorage 還原（具備 50 週存活期）或解析分享 URL 參數
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let hasLoadedFromStorage = false;

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const data = JSON.parse(raw);
        const age = Date.now() - (data.updatedAt || 0);

        if (age < TTL_50_WEEKS_MS) {
          if (data.calcMode) setCalcMode(data.calcMode);
          if (data.lmpDate) setLmpDate(data.lmpDate);
          if (typeof data.cycleDays === 'number') setCycleDays(data.cycleDays);
          if (data.eddDateInput !== undefined) setEddDateInput(data.eddDateInput);
          if (data.scanDate) setScanDate(data.scanDate);
          if (data.scanInputType) setScanInputType(data.scanInputType);
          if (typeof data.scanWeeks === 'number') setScanWeeks(data.scanWeeks);
          if (typeof data.scanDays === 'number') setScanDays(data.scanDays);
          if (data.crlValue !== undefined) setCrlValue(data.crlValue);
          if (data.ivfDate) setIvfDate(data.ivfDate);
          if (data.ivfType) setIvfType(data.ivfType);
          if (data.monthlySalary !== undefined) setMonthlySalary(data.monthlySalary);
          if (typeof data.leaveStartWeeksOption === 'number') setLeaveStartWeeksOption(data.leaveStartWeeksOption);
          if (data.checkedItems) setCheckedItems(data.checkedItems);
          if (typeof data.isBenefitsExpanded === 'boolean') setIsBenefitsExpanded(data.isBenefitsExpanded);
          if (typeof data.isTemplateExpanded === 'boolean') setIsTemplateExpanded(data.isTemplateExpanded);

          hasLoadedFromStorage = true;
        }
      }
    } catch {
      // ignore
    }

    // 解析 URL 參數（分享連結優先級高於 localStorage）
    const params = new URLSearchParams(window.location.search);
    if (params.has('mode')) {
      const m = params.get('mode') as CalcMode;
      if (m === 'lmp' || m === 'edd' || m === 'ultrasound' || m === 'ivf') {
        setCalcMode(m);
      }
    }
    if (params.has('lmp')) {
      const v = params.get('lmp');
      if (v) setLmpDate(v);
    }
    if (params.has('cycle')) {
      const parsed = parseInt(params.get('cycle') || '28', 10);
      if (!isNaN(parsed)) setCycleDays(parsed);
    }
    if (params.has('edd')) {
      const v = params.get('edd');
      if (v) setEddDateInput(v);
    }
    if (params.has('scanDate')) {
      const v = params.get('scanDate');
      if (v) setScanDate(v);
    }
    if (params.has('scanType')) {
      const v = params.get('scanType');
      if (v === 'weeks' || v === 'crl') setScanInputType(v);
    }
    if (params.has('scanWeeks')) {
      const parsed = parseInt(params.get('scanWeeks') || '12', 10);
      if (!isNaN(parsed)) setScanWeeks(parsed);
    }
    if (params.has('scanDays')) {
      const parsed = parseInt(params.get('scanDays') || '0', 10);
      if (!isNaN(parsed)) setScanDays(parsed);
    }
    if (params.has('crl')) {
      const parsed = parseFloat(params.get('crl') || '45');
      if (!isNaN(parsed)) setCrlValue(parsed);
    }
    if (params.has('ivfDate')) {
      const v = params.get('ivfDate');
      if (v) setIvfDate(v);
    }
    if (params.has('ivfType')) {
      const v = params.get('ivfType');
      if (v === 'd5' || v === 'd3' || v === 'egg') setIvfType(v);
    }
    if (params.has('salary')) {
      const parsed = parseInt(params.get('salary') || '45800', 10);
      if (!isNaN(parsed)) setMonthlySalary(parsed);
    }
    if (params.has('leaveStart')) {
      const parsed = parseInt(params.get('leaveStart') || '2', 10);
      if (!isNaN(parsed)) setLeaveStartWeeksOption(parsed);
    }

    isMountedRef.current = true;
  }, [defaultLmp]);

  // 本地狀態持續儲存：每次修改或開啟網頁，自動刷新 50 週過期時間
  useEffect(() => {
    if (!isMountedRef.current || typeof window === 'undefined') return;

    const payload = {
      calcMode,
      lmpDate,
      cycleDays,
      eddDateInput,
      scanDate,
      scanInputType,
      scanWeeks,
      scanDays,
      crlValue,
      ivfDate,
      ivfType,
      monthlySalary,
      leaveStartWeeksOption,
      checkedItems,
      isBenefitsExpanded,
      isTemplateExpanded,
      updatedAt: Date.now(), // 刷新最後存取時間戳記 (50 週 TTL)
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // ignore
    }
  }, [
    calcMode,
    lmpDate,
    cycleDays,
    eddDateInput,
    scanDate,
    scanInputType,
    scanWeeks,
    scanDays,
    crlValue,
    ivfDate,
    ivfType,
    monthlySalary,
    leaveStartWeeksOption,
    checkedItems,
    isBenefitsExpanded,
    isTemplateExpanded,
  ]);

  // 複製試算分享連結（動態組裝 Query String，平時保持網址純淨）
  const handleCopyShareLink = async () => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams();

    params.set('mode', calcMode);
    if (calcMode === 'lmp') {
      if (lmpDate) params.set('lmp', lmpDate);
      if (cycleDays !== 28) params.set('cycle', cycleDays.toString());
    } else if (calcMode === 'edd') {
      if (eddDateInput) params.set('edd', eddDateInput);
    } else if (calcMode === 'ultrasound') {
      if (scanDate) params.set('scanDate', scanDate);
      params.set('scanType', scanInputType);
      if (scanInputType === 'crl') {
        if (crlValue !== '') params.set('crl', crlValue.toString());
      } else {
        params.set('scanWeeks', scanWeeks.toString());
        if (scanDays > 0) params.set('scanDays', scanDays.toString());
      }
    } else if (calcMode === 'ivf') {
      if (ivfDate) params.set('ivfDate', ivfDate);
      params.set('ivfType', ivfType);
    }

    if (monthlySalary !== '' && monthlySalary !== 45800) {
      params.set('salary', monthlySalary.toString());
    }
    if (leaveStartWeeksOption !== 2) {
      params.set('leaveStart', leaveStartWeeksOption.toString());
    }

    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`;

    try {
      await navigator.clipboard.writeText(shareUrl);
      setShareLinkToast(true);
      setTimeout(() => setShareLinkToast(false), 3000);
    } catch (err) {
      console.warn('[PregnancyCalculator] Clipboard write failed:', err);
    }
  };

  // 核心計算：推算預產期 (EDD Date) 與 受孕日 (Conception Date)
  const { estimatedDueDate, conceptionDate } = useMemo(
    () =>
      calculateDueDate({
        calcMode,
        lmpDate,
        cycleDays,
        eddDateInput,
        fallbackDate: defaultLmp,
        scanDate,
        scanInputType,
        scanWeeks,
        scanDays,
        crlValue,
        ivfDate,
        ivfType,
      }),
    [calcMode, lmpDate, cycleDays, eddDateInput, defaultLmp, scanDate, scanInputType, scanWeeks, scanDays, crlValue, ivfDate, ivfType],
  );

  // 當前懷孕週數與倒數（純函數引擎）
  const gestational = useMemo(() => calculateGestationalAge(estimatedDueDate), [estimatedDueDate]);
  const { currentGestationalDays, currentWeeks, currentDays, daysRemaining, progressPercent } = gestational;
  const trimester =
    gestational.trimesterIndex === 3 ? t.trimester3 : gestational.trimesterIndex === 2 ? t.trimester2 : t.trimester1;

  // 胎兒成長比喻
  const babyGrowth = useMemo(() => {
    return getBabySizeInfo(currentWeeks);
  }, [currentWeeks]);

  // 臨床產檢里程碑狀態推算（純函數引擎）
  const stageStatus = useMemo(
    () => getClinicalStageStatus(currentGestationalDays),
    [currentGestationalDays],
  );

  // 產檢與里程碑時間軸清單（9 大階段結構化引擎）
  const milestones = useMemo(
    () => buildClinicalMilestones(estimatedDueDate, stageStatus),
    [estimatedDueDate, stageStatus],
  );

  // 下一個里程碑標題與倒數文案
  const nextMilestoneTitle = useMemo(() => {
    if (stageStatus.nextMilestoneIndex === null) return '';
    const nextM = milestones[stageStatus.nextMilestoneIndex];
    if (!nextM) return '';
    return lang === 'zh-TW' ? nextM.titleZh : nextM.titleEn;
  }, [stageStatus.nextMilestoneIndex, milestones, lang]);

  const countdownText = useMemo(() => {
    if (stageStatus.daysToNextMilestone === null || !nextMilestoneTitle) return '';
    const days = stageStatus.daysToNextMilestone;
    const weeks = stageStatus.weeksToNextMilestone || 0;
    if (weeks >= 1) {
      return t.stageNextCountdownText
        .replace('{nextTitle}', nextMilestoneTitle)
        .replace('{days}', days.toString())
        .replace('{weeks}', weeks.toString());
    }
    return t.stageNextCountdownTextDaysOnly
      .replace('{nextTitle}', nextMilestoneTitle)
      .replace('{days}', days.toString());
  }, [stageStatus, nextMilestoneTitle, t]);

  // 當前空檔期/特殊期詳細說明
  const gapInfo = useMemo(() => {
    if (!stageStatus.gapKey) return null;
    switch (stageStatus.gapKey) {
      case 'pre_5':
        return { title: t.gapPre5Title, desc: t.gapPre5Desc };
      case 'gap_15':
        return { title: t.gap15Title, desc: t.gap15Desc };
      case 'post_40':
        return { title: t.gapPost40Title, desc: t.gapPost40Desc };
      default:
        return null;
    }
  }, [stageStatus.gapKey, t]);

  // 產假與津貼試算（純函數引擎）
  const benefits = useMemo(
    () => calculateMaternityBenefits(estimatedDueDate, leaveStartWeeksOption, monthlySalary),
    [estimatedDueDate, leaveStartWeeksOption, monthlySalary],
  );

  // 一鍵複製範本文字
  const leaveApplicationTemplate = useMemo(() => {
    if (lang === 'zh-TW') {
      return `【產假與產檢假請假申請通知】

敬啟者 / 主管您好：

本人預計於本年度迎接新生兒，相關孕產時程與休假規劃如下，特此向主管與人事部門提出申請與備查：

1. 預估預產期 (EDD)：${formatDate(estimatedDueDate)}
2. 目前孕期：第 ${currentWeeks} 週 + ${currentDays} 天
3. 法定產檢假：依法享有 8 天全薪產檢假，將依產檢時程分次提前提出。
4. 預計產假休假區間（共 56 日曆天）：
   - 預計產假開始日：${formatDate(benefits.leaveStart)}
   - 預計產假結束日：${formatDate(benefits.leaveEnd)}
   - 預計產後復職工作日：${formatDate(benefits.returnDate)}
5. 職務代理與工作交接：
   - 產假期間職務代理人：[請填寫代理人姓名]
   - 相關專案與例行業務交接清單已建立並妥善移交。

感謝主管與團隊一直以來的支持與體諒！

申請人：[您的姓名]
日期：${formatDate(new Date())}`;
    } else {
      return `[Subject: Maternity Leave Application & Handover Plan]

Dear [Manager's Name / HR Team],

I am writing to formally request maternity leave in preparation for the birth of my child. Below are the details regarding my timeline and handover arrangements:

1. Estimated Due Date (EDD): ${formatDate(estimatedDueDate)}
2. Current Gestational Age: Week ${currentWeeks} + ${currentDays} days
3. Statutory Prenatal Checkup Leave: 8 days of paid checkup leave to be taken as needed.
4. Planned Maternity Leave Period (56 consecutive calendar days):
   - Leave Start Date: ${formatDate(benefits.leaveStart)}
   - Leave End Date: ${formatDate(benefits.leaveEnd)}
   - Expected Return to Work Date: ${formatDate(benefits.returnDate)}
5. Coverage & Handover:
   - Primary Coverage Colleague: [Colleague's Name]
   - Key project status, operational procedures, and essential documentation have been prepared for a smooth handover.

Thank you very much for your continuous support and understanding.

Best regards,
[Your Name]
Date: ${formatDate(new Date())}`;
    }
  }, [lang, estimatedDueDate, currentWeeks, currentDays, benefits]);

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(leaveApplicationTemplate);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch (err) {
      console.warn('[PregnancyCalculator] Clipboard write failed:', err);
    }
  };

  const toggleCheck = (key: string) => {
    setCheckedItems((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#ff4081"
      accentGlow="rgba(255, 64, 129, 0.6)"
    >
      <div className={styles.container}>
        {/* 上方左右雙欄排版 */}
        <div className={styles.gridSection}>
          {/* 左側：設定面板 */}
          <PregnancyInputPanel
            t={t}
            calcMode={calcMode}
            setCalcMode={setCalcMode}
            lmpDate={lmpDate}
            setLmpDate={setLmpDate}
            cycleDays={cycleDays}
            setCycleDays={setCycleDays}
            eddDateInput={eddDateInput}
            setEddDateInput={setEddDateInput}
            defaultLmp={defaultLmp}
            scanDate={scanDate}
            setScanDate={setScanDate}
            scanInputType={scanInputType}
            setScanInputType={setScanInputType}
            scanWeeks={scanWeeks}
            setScanWeeks={setScanWeeks}
            scanDays={scanDays}
            setScanDays={setScanDays}
            crlValue={crlValue}
            setCrlValue={setCrlValue}
            crlConvertedAge={crlConvertedAge}
            ivfDate={ivfDate}
            setIvfDate={setIvfDate}
            ivfType={ivfType}
            setIvfType={setIvfType}
            monthlySalary={monthlySalary}
            setMonthlySalary={setMonthlySalary}
            leaveStartWeeksOption={leaveStartWeeksOption}
            setLeaveStartWeeksOption={setLeaveStartWeeksOption}
            showSalaryTooltip={showSalaryTooltip}
            setShowSalaryTooltip={setShowSalaryTooltip}
            shareLinkToast={shareLinkToast}
            onCopyShareLink={handleCopyShareLink}
            modeSelectId={modeSelectId}
            lmpInputId={lmpInputId}
            cycleInputId={cycleInputId}
            eddInputId={eddInputId}
            scanDateId={scanDateId}
            scanTypeSelectId={scanTypeSelectId}
            scanWeeksId={scanWeeksId}
            scanDaysId={scanDaysId}
            crlInputId={crlInputId}
            ivfDateId={ivfDateId}
            ivfTypeId={ivfTypeId}
            salaryInputId={salaryInputId}
            leaveStartId={leaveStartId}
          />

          {/* 右側：核心看板與胎兒成長 */}
          <div className="flex flex-col gap-6">
            <MetricsOverviewCard
              t={t}
              lang={lang}
              estimatedDueDate={estimatedDueDate}
              daysRemaining={daysRemaining}
              currentWeeks={currentWeeks}
              currentDays={currentDays}
              conceptionDate={conceptionDate}
              trimester={trimester}
              currentGestationalDays={currentGestationalDays}
              progressPercent={progressPercent}
              babyGrowth={babyGrowth}
            />

            <MaternityBenefitsCard
              t={t}
              benefits={benefits}
              monthlySalary={monthlySalary}
              isBenefitsExpanded={isBenefitsExpanded}
              setIsBenefitsExpanded={setIsBenefitsExpanded}
            />
          </div>
        </div>

        {/* 一鍵生成請假範本 (支援摺疊) */}
        <LeaveTemplateCard
          t={t}
          leaveApplicationTemplate={leaveApplicationTemplate}
          isTemplateExpanded={isTemplateExpanded}
          setIsTemplateExpanded={setIsTemplateExpanded}
          copiedToast={copiedToast}
          onCopyTemplate={handleCopyTemplate}
        />

        {/* 40 週產檢里程碑時間軸 */}
        <ClinicalTimelineCard
          t={t}
          lang={lang}
          stageStatus={stageStatus}
          milestones={milestones}
          currentWeeks={currentWeeks}
          currentDays={currentDays}
          countdownText={countdownText}
          gapInfo={gapInfo}
        />

        {/* 孕期與待產包 Checklist（5~36 週每 8 週一階段 + 最後 4 週足月衝刺） */}
        <PregnancyChecklistCard
          t={t}
          lang={lang}
          currentWeeks={currentWeeks}
          checkedItems={checkedItems}
          onToggleCheck={toggleCheck}
        />

        {/* 免責聲明 */}
        <div className="p-4 rounded-xl bg-surface-glass border border-border-glass text-xs text-text-sub leading-relaxed">
          <strong className="text-text-main font-semibold block mb-1">
            {t.disclaimerTitle}
          </strong>
          {t.disclaimerDesc}
        </div>

        {/* 常見問題 FAQ */}
        <FaqSection
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          items={t.faqItems}
          accentColor="#ff4081"
        />
      </div>
    </ToolLayout>
  );
}

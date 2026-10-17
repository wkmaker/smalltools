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

// 胎兒成長每週水果與尺寸字典
interface BabySizeInfo {
  fruit: string;
  fruitEn: string;
  lengthCm: number;
  weightG: number;
  descZh: string;
  descEn: string;
}

const FETAL_GROWTH_DATA: Record<number, BabySizeInfo> = {
  4: { fruit: '罌粟籽 (Poppy Seed)', fruitEn: 'Poppy Seed', lengthCm: 0.1, weightG: 0.1, descZh: '受精卵已成功著床，開始分化為胚胎與胎盤', descEn: 'Blastocyst implanting in the uterine lining' },
  8: { fruit: '覆盆莓 (Raspberry)', fruitEn: 'Raspberry', lengthCm: 1.6, weightG: 1, descZh: '心臟規律跳動，微小手腳指頭正在成形', descEn: 'Heart is beating steadily, tiny fingers and toes forming' },
  12: { fruit: '李子 (Plum)', fruitEn: 'Plum', lengthCm: 5.4, weightG: 14, descZh: '器官系統基本成形，反射神經開始運作', descEn: 'All vital organs formed, reflexes developing' },
  16: { fruit: '酪梨 (Avocado)', fruitEn: 'Avocado', lengthCm: 11.6, weightG: 100, descZh: '指紋已經形成，開始有微弱抓握反射', descEn: 'Fingerprints developed, begins sucking and grasping' },
  20: { fruit: '香蕉 (Banana)', fruitEn: 'Banana', lengthCm: 25.6, weightG: 300, descZh: '孕期過半！開始能清晰感覺到胎動', descEn: 'Halfway mark! Baby movements easily felt' },
  24: { fruit: '木瓜 (Papaya)', fruitEn: 'Papaya', lengthCm: 30.0, weightG: 600, descZh: '聽力發育完善，對外界聲音有反應', descEn: 'Inner ear fully developed, responds to sounds' },
  28: { fruit: '茄子 (Eggplant)', fruitEn: 'Eggplant', lengthCm: 37.6, weightG: 1000, descZh: '進入第三孕期，眼睛可以睜開眨眼', descEn: 'Enters 3rd trimester, can open and blink eyes' },
  32: { fruit: '鳳梨 (Pineapple)', fruitEn: 'Pineapple', lengthCm: 42.4, weightG: 1700, descZh: '骨骼逐漸變硬，皮下脂肪持續增厚', descEn: 'Bones hardening, accumulating body fat' },
  36: { fruit: '哈密瓜 (Cantaloupe)', fruitEn: 'Cantaloupe', lengthCm: 47.4, weightG: 2600, descZh: '肺部發育近乎成熟，胎位多已轉為頭位朝下', descEn: 'Lungs almost fully mature, mostly head-down position' },
  40: { fruit: '大西瓜 (Watermelon)', fruitEn: 'Watermelon', lengthCm: 51.2, weightG: 3400, descZh: '發育完全成熟的足月寶寶，準備誕生！', descEn: 'Full-term baby ready to meet the world!' },
};

function getBabySizeInfo(gestationalWeeks: number): BabySizeInfo {
  const weeks = Math.max(4, Math.min(40, Math.round(gestationalWeeks)));
  const milestones = [4, 8, 12, 16, 20, 24, 28, 32, 36, 40];
  let closestWeek = 4;
  for (const m of milestones) {
    if (weeks >= m) closestWeek = m;
  }
  return FETAL_GROWTH_DATA[closestWeek] || FETAL_GROWTH_DATA[40];
}


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

  // 依 CRL (mm) 換算胎兒天數與週數（純函數引擎，見 ./engine.ts）
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
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch {
      // ignore
    }

    // 若 URL 帶有分享參數，URL 權重最高並覆蓋
    const params = new URLSearchParams(window.location.search);
    if (params.has('mode')) {
      const m = params.get('mode');
      if (m === 'lmp' || m === 'edd' || m === 'ultrasound' || m === 'ivf') setCalcMode(m);
    }
    if (params.has('lmp')) {
      const v = params.get('lmp');
      if (v) setLmpDate(v);
    }
    if (params.has('cycle')) {
      const parsed = parseInt(params.get('cycle') || '28', 10);
      if (!isNaN(parsed) && parsed >= 20 && parsed <= 45) setCycleDays(parsed);
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
      const st = params.get('scanType');
      if (st === 'weeks' || st === 'crl') setScanInputType(st);
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
    } catch {
      // fallback
    }
  };

  // 核心計算：推算預產期 (EDD Date) 與 受孕日 (Conception Date)
  // 預產期 (EDD) 與受孕日推算（純函數引擎，見 ./engine.ts）
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

  // 當前懷孕週數與倒數計算
  // 當前懷孕週數與倒數（純函數引擎，見 ./engine.ts）
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

  // 產假與津貼試算（純函數引擎，見 ./engine.ts）
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
    } catch {
      // fallback
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
          <div className="flex flex-col gap-6">
            <div className={styles.glassCard}>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
                  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
                    <path d="M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11zM7 10h5v5H7z" />
                  </svg>
                  {t.calcModeLabel}
                </h2>
                <button
                  type="button"
                  onClick={handleCopyShareLink}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-surface-glass border border-border-glass text-text-sub hover:text-text-main transition-colors flex items-center gap-1.5"
                  title={t.shareLinkBtn}
                >
                  <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                    <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
                  </svg>
                  {t.shareLinkBtn}
                </button>
              </div>

              {shareLinkToast && (
                <div className={`mb-3 ${styles.copiedToastBanner}`}>
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  {t.shareLinkCopied}
                </div>
              )}

              <div className="flex flex-col gap-4">
                {/* 模式選擇 */}
                <div className="flex flex-col gap-1.5">
                  <label htmlFor={modeSelectId} className="text-xs font-semibold text-text-sub">
                    {t.calcModeLabel}
                  </label>
                  <select
                    id={modeSelectId}
                    value={calcMode}
                    onChange={(e) => setCalcMode(e.target.value as CalcMode)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                  >
                    <option value="lmp">{t.modeLmp}</option>
                    <option value="edd">{t.modeEdd}</option>
                    <option value="ultrasound">{t.modeUltrasound}</option>
                    <option value="ivf">{t.modeIvf}</option>
                  </select>
                </div>

                {/* 模式一：LMP */}
                {calcMode === 'lmp' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={lmpInputId} className="text-xs font-semibold text-text-sub">
                        {t.lmpDateLabel}
                      </label>
                      <input
                        id={lmpInputId}
                        type="date"
                        value={lmpDate}
                        onChange={(e) => setLmpDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors [color-scheme:dark]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={cycleInputId} className="text-xs font-semibold text-text-sub">
                        {t.cycleDaysLabel}
                      </label>
                      <input
                        id={cycleInputId}
                        type="number"
                        min="20"
                        max="45"
                        value={cycleDays}
                        onChange={(e) => setCycleDays(parseInt(e.target.value) || 28)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                      />
                    </div>
                  </>
                )}

                {/* 模式二：EDD */}
                {calcMode === 'edd' && (
                  <div className="flex flex-col gap-1.5">
                    <label htmlFor={eddInputId} className="text-xs font-semibold text-text-sub">
                      {t.eddDateLabel}
                    </label>
                    <input
                      id={eddInputId}
                      type="date"
                      value={eddDateInput || defaultLmp}
                      onChange={(e) => setEddDateInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors [color-scheme:dark]"
                    />
                  </div>
                )}

                {/* 模式三：超音波 */}
                {calcMode === 'ultrasound' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={scanDateId} className="text-xs font-semibold text-text-sub">
                        {t.scanDateLabel}
                      </label>
                      <input
                        id={scanDateId}
                        type="date"
                        value={scanDate}
                        onChange={(e) => setScanDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors [color-scheme:dark]"
                      />
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={scanTypeSelectId} className="text-xs font-semibold text-text-sub">
                        {t.scanInputTypeLabel}
                      </label>
                      <select
                        id={scanTypeSelectId}
                        value={scanInputType}
                        onChange={(e) => setScanInputType(e.target.value as ScanInputType)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                      >
                        <option value="weeks">{t.scanInputWeeks}</option>
                        <option value="crl">{t.scanInputCrl}</option>
                      </select>
                    </div>

                    {scanInputType === 'weeks' ? (
                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={scanWeeksId} className="text-xs font-semibold text-text-sub">
                            {t.scanWeeksLabel}
                          </label>
                          <input
                            id={scanWeeksId}
                            type="number"
                            min="4"
                            max="40"
                            value={scanWeeks}
                            onChange={(e) => setScanWeeks(parseInt(e.target.value) || 0)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                          />
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={scanDaysId} className="text-xs font-semibold text-text-sub">
                            {t.scanDaysLabel}
                          </label>
                          <input
                            id={scanDaysId}
                            type="number"
                            min="0"
                            max="6"
                            value={scanDays}
                            onChange={(e) => setScanDays(parseInt(e.target.value) || 0)}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor={crlInputId} className="text-xs font-semibold text-text-sub">
                            {t.crlInputLabel}
                          </label>
                          <input
                            id={crlInputId}
                            type="number"
                            step="0.1"
                            min="5"
                            max="84"
                            placeholder={t.crlPlaceholder}
                            value={crlValue}
                            onChange={(e) => {
                              const raw = e.target.value;
                              setCrlValue(raw === '' ? '' : parseFloat(raw));
                            }}
                            className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                          />
                        </div>
                        <div className="p-2.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col gap-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-text-sub">{t.crlCalculatedAge}</span>
                            <strong className={`${styles.accentText} font-bold text-sm`}>
                              {crlConvertedAge.weeks} {t.weeksUnit} + {crlConvertedAge.days} {t.daysUnit}
                            </strong>
                          </div>
                          <p className="text-xs text-text-sub leading-tight">
                            {t.crlFormulaHint}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* 模式四：IVF */}
                {calcMode === 'ivf' && (
                  <>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={ivfTypeId} className="text-xs font-semibold text-text-sub">
                        {t.ivfTypeLabel}
                      </label>
                      <select
                        id={ivfTypeId}
                        value={ivfType}
                        onChange={(e) => setIvfType(e.target.value as IvfType)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                      >
                        <option value="d5">{t.ivfTypeD5}</option>
                        <option value="d3">{t.ivfTypeD3}</option>
                        <option value="egg">{t.ivfTypeEgg}</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor={ivfDateId} className="text-xs font-semibold text-text-sub">
                        {t.ivfDateLabel}
                      </label>
                      <input
                        id={ivfDateId}
                        type="date"
                        value={ivfDate}
                        onChange={(e) => setIvfDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors [color-scheme:dark]"
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 產假與薪資津貼設定 */}
            <div className={styles.glassCard}>
              <h2 className={styles.cardTitle}>
                <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm0-15.86v2.06c-1.1 0-2 .9-2 2v1H9v-3c0-.55-.45-1-1-1H7.1c.91-1.31 2.36-2.28 4.05-2.62z" />
                </svg>
                {t.leaveSettingsTitle}
              </h2>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <label htmlFor={salaryInputId} className="text-xs font-semibold text-text-sub">
                      {t.monthlySalaryLabel}
                    </label>
                    <div className="relative inline-block">
                      <button
                        type="button"
                        onClick={() => setShowSalaryTooltip((prev) => !prev)}
                        onMouseEnter={() => setShowSalaryTooltip(true)}
                        onMouseLeave={() => setShowSalaryTooltip(false)}
                        aria-label={t.salaryTooltipBtnAria}
                        className="p-1 rounded-full text-text-sub hover:text-text-main hover:bg-white/10 transition-colors focus:outline-none flex items-center justify-center"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </button>

                      {showSalaryTooltip && (
                        <div className={`absolute right-0 top-full mt-1.5 w-72 sm:w-80 p-3.5 z-30 text-xs rounded-xl shadow-xl ${styles.tooltipContainer}`}>
                          <p className="font-bold mb-1.5 text-text-main flex items-center gap-1.5">
                            <svg className="w-4 h-4 text-[#ff4081]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {t.salaryTooltipTitle}
                          </p>
                          <div className="flex flex-col gap-1.5 text-text-sub leading-relaxed text-xs">
                            <p>・{t.salaryTooltipLabor}</p>
                            <p>・{t.salaryTooltipParental}</p>
                            <p className="opacity-85">・{t.salaryTooltipCap}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <input
                    id={salaryInputId}
                    type="text"
                    inputMode="numeric"
                    placeholder={t.monthlySalaryPlaceholder}
                    value={monthlySalary === '' ? '' : Number(monthlySalary).toLocaleString('zh-TW')}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setMonthlySalary(raw === '' ? '' : parseInt(raw, 10));
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                  />
                  <span className="text-xs text-text-sub flex items-center gap-1.5">
                    <svg className="w-3.5 h-3.5 text-[#ff4081] shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 01-2 2h-4a2 2 0 01-2-2v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    {t.monthlySalaryHelper}
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label htmlFor={leaveStartId} className="text-xs font-semibold text-text-sub">
                    {t.leaveStartWeeksLabel}
                  </label>
                  <select
                    id={leaveStartId}
                    value={leaveStartWeeksOption}
                    onChange={(e) => setLeaveStartWeeksOption(parseInt(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[var(--theme-color)] transition-colors"
                  >
                    <option value={2}>{t.leaveStartOpt2Weeks}</option>
                    <option value={3}>{t.leaveStartOpt3Weeks}</option>
                    <option value={4}>{t.leaveStartOpt4Weeks}</option>
                    <option value={0}>{t.leaveStartOptDue}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* 右側：核心看板與胎兒成長 */}
          <div className="flex flex-col gap-6">
            {/* 四大指標卡片 */}
            <div className={styles.glassCard}>
              <h2 className={styles.cardTitle}>
                <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                {t.metricsTitle}
              </h2>

              <div className={styles.metricsGrid}>
                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>{t.metricEdd}</span>
                  <span className={`${styles.metricValue} ${styles.accentText}`}>{formatDate(estimatedDueDate)}</span>
                  <span className={styles.metricSubtext}>
                    {t.metricDaysRemaining}: <strong className="text-text-main">{daysRemaining} {t.daysUnit}</strong>
                  </span>
                </div>

                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>{t.metricCurrentWeek}</span>
                  <span className={styles.metricValue}>
                    {currentWeeks} <span className="text-sm font-semibold">{t.weeksUnit}</span> + {currentDays} <span className="text-sm font-semibold">{t.daysUnit}</span>
                  </span>
                  <span className={styles.metricSubtext}>
                    {t.metricConception}: {formatDate(conceptionDate)}
                  </span>
                </div>

                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>{t.metricTrimester}</span>
                  <span className="text-base font-bold text-text-main">{trimester}</span>
                  <span className={styles.metricSubtext}>
                    {currentGestationalDays} / 280 {t.daysUnit}
                  </span>
                </div>

                <div className={styles.metricCard}>
                  <span className={styles.metricLabel}>{t.progressLabel}</span>
                  <span className={`${styles.metricValue} ${styles.accentText}`}>{progressPercent}%</span>
                  <div className={styles.progressBarContainer}>
                    <div className={styles.progressBarFill} style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>
              </div>
            </div>

            {/* 胎兒成長卡片 */}
            <div className={styles.babyGrowthCard}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className={`p-2 rounded-xl bg-surface-glass border border-border-glass flex items-center justify-center ${styles.accentText}`}>
                    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor">
                      <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 19.4c-.39.39-.39 1.02 0 1.41.39.39 1.02.39 1.41 0l1.9-1.9C9.31 19.57 10.59 20 12 20c4.97 0 9-4.03 9-9s-4.03-9-9-9zm0 15c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-text-main text-base">
                      {t.babySizeTitle}：<span className={styles.accentText}>{lang === 'zh-TW' ? babyGrowth.fruit : babyGrowth.fruitEn}</span>
                    </h3>
                    <p className="text-xs text-text-sub mt-0.5">
                      {lang === 'zh-TW' ? babyGrowth.descZh : babyGrowth.descEn}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-xs font-medium text-text-sub bg-surface-glass px-3 py-1.5 rounded-xl border border-border-glass">
                  <div>{t.babyLengthLabel}: <strong className="text-text-main text-sm">{babyGrowth.lengthCm} cm</strong></div>
                  <div>{t.babyWeightLabel}: <strong className="text-text-main text-sm">{babyGrowth.weightG} g</strong></div>
                </div>
              </div>
            </div>

            {/* 產假與津貼試算卡片 (支援摺疊) */}
            <div className={styles.glassCard}>
              <div
                className="flex flex-wrap items-center justify-between gap-2 cursor-pointer select-none"
                onClick={() => setIsBenefitsExpanded((prev) => !prev)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    setIsBenefitsExpanded((prev) => !prev);
                  }
                }}
              >
                <div className="flex flex-col">
                  <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
                    <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
                      <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
                    </svg>
                    {t.benefitsTitle}
                  </h2>
                  {!isBenefitsExpanded && (
                    <span className="text-xs text-text-sub mt-1">
                      {t.benefitsToggleDesc}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-text-sub">
                    {isBenefitsExpanded ? t.btnCollapse : t.btnExpand}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-lg bg-surface-glass border border-border-glass flex items-center justify-center text-text-sub transition-transform duration-200 ${
                      isBenefitsExpanded ? 'rotate-180' : ''
                    }`}
                  >
                    <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                      <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                    </svg>
                  </div>
                </div>
              </div>

              {isBenefitsExpanded && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-border-glass">
                  <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-main text-sm">{t.checkupLeaveLabel}</span>
                      <span className={styles.badge}>8 {t.daysUnit}</span>
                    </div>
                    <p className="text-xs text-text-sub">{t.checkupLeaveDesc}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-main text-sm">{t.paternityLeaveLabel}</span>
                      <span className={styles.badge}>7 {t.daysUnit}</span>
                    </div>
                    <p className="text-xs text-text-sub">{t.paternityLeaveDesc}</p>
                  </div>

                  <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col gap-2 md:col-span-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-text-main text-sm">{t.maternityLeaveLabel}</span>
                      <span className={styles.badge}>56 {t.daysUnit} (8 {t.weeksUnit})</span>
                    </div>
                    <p className="text-xs text-text-sub">{t.maternityLeaveDesc}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 text-xs border-t border-border-glass">
                      <span className="text-text-sub">{t.maternityLeavePeriod}:</span>
                      <strong className="text-text-main">{formatDate(benefits.leaveStart)} ~ {formatDate(benefits.leaveEnd)}</strong>
                      <span className="text-text-sub ml-auto">{t.expectedReturnDate}: <strong className={styles.accentText}>{formatDate(benefits.returnDate)}</strong></span>
                    </div>
                  </div>

                  {typeof monthlySalary === 'number' && monthlySalary > 0 && (
                    <>
                      <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col gap-1">
                        <span className="font-semibold text-text-main text-sm">{t.laborInsuranceTitle}</span>
                        <span className={`text-lg font-bold ${styles.accentText}`}>
                          {t.approxUnit} {benefits.laborBenefit.toLocaleString('zh-TW')}
                        </span>
                        <p className="text-xs text-text-sub">{t.laborInsuranceDesc}</p>
                      </div>

                      <div className="p-3.5 rounded-xl bg-surface-glass border border-border-glass flex flex-col gap-1">
                        <span className="font-semibold text-text-main text-sm">{t.parentalLeaveTitle}</span>
                        <span className={`text-lg font-bold ${styles.accentText}`}>
                          {t.approxUnit} {benefits.parentalAllowanceTotal.toLocaleString('zh-TW')}
                        </span>
                        <p className="text-xs text-text-sub">
                          {t.parentalLeaveDesc} (約 {benefits.parentalAllowanceMonthly.toLocaleString('zh-TW')} / 月)
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 一鍵生成請假範本 (支援摺疊) */}
        <div className={styles.glassCard}>
          <div
            className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
            onClick={() => setIsTemplateExpanded((prev) => !prev)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setIsTemplateExpanded((prev) => !prev);
              }
            }}
          >
            <div className="flex flex-col">
              <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
                <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                </svg>
                {t.templateTitle}
              </h2>
              {!isTemplateExpanded && (
                <span className="text-xs text-text-sub mt-1">
                  {t.templateToggleDesc}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-text-sub">
                {isTemplateExpanded ? t.btnCollapse : t.btnExpand}
              </span>
              <div
                className={`w-7 h-7 rounded-lg bg-surface-glass border border-border-glass flex items-center justify-center text-text-sub transition-transform duration-200 ${
                  isTemplateExpanded ? 'rotate-180' : ''
                }`}
              >
                <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                  <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
                </svg>
              </div>
            </div>
          </div>

          {isTemplateExpanded && (
            <div className="mt-4 pt-4 border-t border-border-glass flex flex-col gap-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleCopyTemplate();
                  }}
                  className={styles.accentBtn}
                >
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                  {t.templateCopyBtn}
                </button>
              </div>

              {copiedToast && (
                <div className={`mb-2 ${styles.copiedToastBanner}`}>
                  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                  </svg>
                  {t.copiedSuccess}
                </div>
              )}

              <div className={styles.templateBox}>{leaveApplicationTemplate}</div>
            </div>
          )}
        </div>

        {/* 40 週產檢里程碑時間軸 */}
        <div className={styles.glassCard}>
          <div className="flex flex-col gap-1 mb-4">
            <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
              <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
              </svg>
              {t.timelineTitle}
            </h2>
            <p className="text-xs text-text-sub">{t.timelineSubtitle}</p>
          </div>

          {/* 衛教說明小註解 */}
          <div className={styles.timelineNoteBox}>
            <svg className={`w-4 h-4 ${styles.accentText} shrink-0 mt-0.5`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-text-sub leading-relaxed">
              {t.timelineNote}
            </p>
          </div>

          {/* 即時產檢階段導引卡片 (空檔過渡期 / 重大檢查期) */}
          <div
            className={`${styles.stageBanner} ${
              stageStatus.statusType === 'active_milestone'
                ? styles.stageBannerActive
                : stageStatus.statusType === 'stable_gap'
                ? styles.stageBannerGap
                : styles.stageBannerPre
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`${styles.badge} ${
                    stageStatus.statusType === 'active_milestone'
                      ? styles.badge
                      : stageStatus.statusType === 'stable_gap'
                      ? styles.badgeGap
                      : styles.badgeSuccess
                  }`}
                >
                  {stageStatus.statusType === 'active_milestone'
                    ? t.stageStatusActiveBadge
                    : stageStatus.statusType === 'stable_gap'
                    ? t.stageStatusGapBadge
                    : stageStatus.statusType === 'pre_checkup'
                    ? t.stageStatusPreBadge
                    : t.stageStatusPostBadge}
                </span>
                <span className="text-xs font-semibold text-text-sub font-mono">
                  {currentWeeks} {t.weeksUnit} + {currentDays} {t.daysUnit}
                </span>
              </div>
              {countdownText && (
                <span className={`text-xs font-medium ${styles.accentText}`}>
                  {countdownText}
                </span>
              )}
            </div>

            {/* 標題與說明 */}
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-bold text-text-main">
                {stageStatus.statusType === 'active_milestone' && stageStatus.activeMilestoneIndex !== null
                  ? `${lang === 'zh-TW' ? '進行中：' : 'Active: '}${
                      lang === 'zh-TW'
                        ? milestones[stageStatus.activeMilestoneIndex]?.titleZh
                        : milestones[stageStatus.activeMilestoneIndex]?.titleEn
                    }`
                  : gapInfo?.title || ''}
              </h3>
              <p className="text-xs text-text-sub leading-relaxed">
                {stageStatus.statusType === 'active_milestone' && stageStatus.activeMilestoneIndex !== null
                  ? lang === 'zh-TW'
                    ? milestones[stageStatus.activeMilestoneIndex]?.descZh
                    : milestones[stageStatus.activeMilestoneIndex]?.descEn
                  : gapInfo?.desc || ''}
              </p>
            </div>
          </div>

          <div className={styles.timeline}>
            {milestones.map((m, idx) => (
              <div key={idx} className={styles.timelineItem}>
                <div
                  className={`${styles.timelineDot} ${
                    m.isCurrent
                      ? styles.timelineDotActive
                      : m.isPast
                      ? styles.timelineDotCompleted
                      : m.isNextUpcoming
                      ? styles.timelineDotUpcoming
                      : ''
                  }`}
                >
                  {m.isPast && (
                    <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" className={styles.dotCheckIcon}>
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </div>

                <div
                  className={`${styles.timelineContent} ${
                    m.isCurrent
                      ? styles.timelineContentActive
                      : m.isPast
                      ? styles.timelineContentPast
                      : m.isNextUpcoming
                      ? styles.timelineContentUpcoming
                      : ''
                  }`}
                >
                  {/* 第一層 (Tier 1)：週數膠囊 + 預估日期區間 + 狀態徽章 */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <span className={`${styles.weekPill} ${m.isCurrent ? styles.weekPillActive : ''}`}>
                        <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor" className="shrink-0">
                          <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
                        </svg>
                        {lang === 'zh-TW' ? m.weekRange : m.weekRangeEn}
                      </span>
                      <span className="text-xs text-text-sub font-mono inline-flex items-center gap-1">
                        <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor" className="opacity-70 shrink-0">
                          <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10z" />
                        </svg>
                        {formatDate(m.startDate)} ~ {formatDate(m.endDate)}
                      </span>
                    </div>

                    <div className="flex items-center shrink-0">
                      {m.isPast ? (
                        <span className={`${styles.badge} ${styles.badgeSuccess}`}>{t.tagPast}</span>
                      ) : m.isCurrent ? (
                        <span className={styles.badge}>{t.tagCurrent}</span>
                      ) : m.isNextUpcoming ? (
                        <span className={`${styles.badge} ${styles.badgeUpcoming}`}>{t.tagNextUpcoming}</span>
                      ) : (
                        <span className="text-xs text-text-sub px-2.5 py-0.5 rounded-full bg-surface-glass border border-border-glass">
                          {t.tagFuture}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 第二層 (Tier 2)：階段主標題 + 簡要衛教說明 */}
                  <div className="flex flex-col gap-1 min-w-0">
                    <h3 className="text-base font-bold text-text-main leading-snug">
                      {lang === 'zh-TW' ? m.titleZh : m.titleEn}
                    </h3>
                    <p className="text-xs text-text-sub leading-relaxed">
                      {lang === 'zh-TW' ? m.descZh : m.descEn}
                    </p>
                  </div>

                  {/* 第三層 (Tier 3)：雙欄結構化檢查細項清單 + 公費/自費小標籤 */}
                  {m.items && m.items.length > 0 && (
                    <div className={styles.checkpointGrid}>
                      {m.items.map((item, itemIdx) => (
                        <div key={itemIdx} className={styles.checkpointItem}>
                          <div className="flex items-center gap-2 min-w-0">
                            <svg
                              viewBox="0 0 24 24"
                              width={14}
                              height={14}
                              fill="currentColor"
                              className={`shrink-0 ${m.isPast ? styles.pastCheckIcon : styles.accentText}`}
                            >
                              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            <span className="text-xs font-medium text-text-main leading-snug min-w-0 break-words">
                              {lang === 'zh-TW' ? item.labelZh : item.labelEn}
                            </span>
                          </div>
                          {item.tag === 'public' && (
                            <span className={styles.tagPublicPill}>{t.tagPublic}</span>
                          )}
                          {item.tag === 'self' && (
                            <span className={styles.tagSelfPill}>{t.tagSelfPaid}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 孕期與待產包 Checklist（5~36 週每 8 週一階段 + 最後 4 週足月衝刺） */}
        <div className={styles.glassCard}>
          <div className="flex flex-col gap-1 mb-4">
            <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
              <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
              </svg>
              {t.checklistTitle}
            </h2>
            <p className="text-xs text-text-sub">{t.checklistSubtitle}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              {
                key: 'stage1',
                title: t.checkStage1,
                weekBadgeZh: '5 ~ 12 週',
                weekBadgeEn: 'Weeks 5 - 12',
                isCurrentStage: currentWeeks <= 12,
                spanFullOnMd: false,
                items: [
                  { id: 'folicAcid', labelZh: '備妥葉酸與孕初期營養補充品（劑量請依醫囑為主）', labelEn: 'Prepare folic acid & early prenatal vitamins (Consult doctor for dosage)' },
                  { id: 'dietHabits', labelZh: '調整日常飲食與作息（戒菸酒、減少咖啡因、避免生食與未全熟肉蛋）', labelEn: 'Adjust daily diet & routine (avoid alcohol, tobacco & raw/undercooked foods)' },
                  { id: 'confinementCenter', labelZh: '參觀與下訂月子中心（產後護理之家）或預約到府月嫂、月子餐', labelEn: 'Tour & book postpartum confinement center, postpartum nanny, or meal delivery' },
                  { id: 'maternityBook', labelZh: '準備止吐舒緩小點心（蘇打餅、氣泡水）與防滑舒適平底鞋', labelEn: 'Prepare anti-nausea snacks (crackers, sparkling water) & non-slip flat shoes' },
                  { id: 'skincareSwitch', labelZh: '檢視日常保養品與用藥成分（停用含 A 酸、高濃度水楊酸保養品與不明成藥）', labelEn: 'Review daily skincare & medications (avoid retinoids/vitamin A derivatives)' },
                ],
              },
              {
                key: 'stage2',
                title: t.checkStage2,
                weekBadgeZh: '13 ~ 20 週',
                weekBadgeEn: 'Weeks 13 - 20',
                isCurrentStage: currentWeeks >= 13 && currentWeeks <= 20,
                spanFullOnMd: false,
                items: [
                  { id: 'nutrition', labelZh: '備妥孕中期營養品：鈣質、鐵質、維生素 D 與藻油/魚油 DHA（依醫囑為主）', labelEn: 'Prepare 2nd-trimester supplements: Calcium, Iron, Vit D & DHA (per doctor)' },
                  { id: 'stretchMark', labelZh: '採購孕婦妊娠霜與撫紋油，養成每日早晚塗抹肚皮與大腿保養習慣', labelEn: 'Buy belly stretch-mark cream & oil for daily morning/night care' },
                  { id: 'chromosomalScreen', labelZh: '添購無鋼圈孕哺內衣、托腹帶、孕婦褲與側睡月亮枕（減緩腰背壓力）', labelEn: 'Buy wireless maternity bras, belly support band, pants & pregnancy pillow' },
                  { id: 'dentalScaling', labelZh: '預約孕婦健保洗牙與口腔檢查（健保補助每 90 天一次，孕中期躺診療椅最舒適）', labelEn: 'Schedule prenatal dental scaling & checkup (best done comfortably in 2nd trimester)' },
                  { id: 'anatomyScan', labelZh: '討論產後育兒分工，提前參觀住家周邊托嬰中心（公托/準公共）或諮詢保母', labelEn: 'Discuss childcare division & tour local daycare centers or inquire nannies early' },
                ],
              },
              {
                key: 'stage3',
                title: t.checkStage3,
                weekBadgeZh: '21 ~ 28 週',
                weekBadgeEn: 'Weeks 21 - 28',
                isCurrentStage: currentWeeks >= 21 && currentWeeks <= 28,
                spanFullOnMd: false,
                items: [
                  { id: 'babyStroller', labelZh: '實地試推與挑選嬰兒推車、揹帶（趁體力佳逛門市/婦幼展，實測收折、重量與車廂空間並定案型號）', labelEn: 'Test & shortlist baby strollers and carriers in-store (test folding, weight & trunk space)' },
                  { id: 'babyCarSeat', labelZh: '選定新生兒汽車安全座椅 / 提籃，並一併評估「汽車隔熱紙 / 後座遮陽簾與後座寶寶觀察鏡」（列入清單最後買）', labelEn: 'Shortlist infant car seat / carrier, plus evaluate car window tint / sunshade & rear-facing baby mirror' },
                  { id: 'babyCrib', labelZh: '丈量房間尺寸並挑選定案嬰兒床、透氣床墊與尿布台（預先規劃嬰兒睡眠安全動線）', labelEn: 'Measure room space & shortlist baby crib, breathable mattress & changing table' },
                  { id: 'daycareSurvey', labelZh: '比較並選定奶瓶消毒烘乾鍋、調乳器 / 溫奶器與嬰兒澡盆（先定案清單，避免太早買佔空間與起算保固）', labelEn: 'Compare & shortlist bottle sterilizer, warmer & bathtub (finalize list first to save space & warranty)' },
                  { id: 'babyNaming', labelZh: '預先構思寶寶名字 / 小名，並可預約「孕婦寫真留念」（建議 28~32 週肚型最圓潤且未水腫時拍攝）', labelEn: 'Brainstorm baby names / nicknames early & book maternity photoshoot (best shot at weeks 28-32)' },
                ],
              },
              {
                key: 'stage4',
                title: t.checkStage4,
                weekBadgeZh: '29 ~ 36 週',
                weekBadgeEn: 'Weeks 29 - 36',
                isCurrentStage: currentWeeks >= 29 && currentWeeks <= 36,
                spanFullOnMd: false,
                items: [
                  { id: 'deliveryKit', labelZh: '打包待產包【媽媽衛生】：產褥墊、看護墊、免洗內褲、會陰沖洗瓶、衛生紙與拖鞋', labelEn: 'Pack Hospital Bag [Mom Hygiene]: maternity pads, underpads, disposable underwear, peri bottle & slippers' },
                  { id: 'breastfeedingKit', labelZh: '打包待產包【哺育日用】：哺乳內衣、溢乳墊、羊脂膏、保溫杯、長充電線', labelEn: 'Pack Hospital Bag [Nursing & Daily]: nursing bras, pads, lanolin cream, thermos & long charger' },
                  { id: 'gearSetup', labelZh: '採買新生兒耗材（奶瓶奶嘴、NB 尿布、洗沐乳、屁屁膏）並預先清洗紗布衣與包巾', labelEn: 'Buy newborn consumables (bottles, NB diapers, wash, diaper cream) & pre-wash gauze clothes/swaddles' },
                  { id: 'newbornInsurance', labelZh: '拍攝孕婦寫真留念、申請彌月蛋糕 / 油飯試吃，並預先規劃「新生兒醫療保險」方案', labelEn: 'Take maternity photos, sample full-month gift cakes/meals & pre-plan newborn health insurance' },
                  { id: 'leaveHandover', labelZh: '整理職場產假工作交接清單，並確認生產醫院待產流程與月子中心入住通知方式', labelEn: 'Prepare work maternity leave handover list & confirm hospital/confinement center check-in process' },
                ],
              },
              {
                key: 'stage5',
                title: t.checkStage5,
                weekBadgeZh: '37 ~ 40 週',
                weekBadgeEn: 'Weeks 37 - 40',
                isCurrentStage: currentWeeks >= 37,
                spanFullOnMd: true,
                items: [
                  { id: 'babyClothes', labelZh: '最後一個月正式採購 / 安排到貨前期選定的「嬰兒推車、汽座提籃、遮陽簾與後視觀察鏡、嬰兒床、消毒鍋與溫奶器」', labelEn: 'Purchase / receive pre-selected stroller, car seat, sunshade/mirror, crib & sterilizer in the final month' },
                  { id: 'carSeatInstall', labelZh: '完成嬰兒床組裝，並施工/安裝汽車隔熱紙或後座遮陽簾、將「安全座椅與後座寶寶觀察鏡」穩固鎖定於車內待命', labelEn: 'Assemble baby crib & install car window tint/sunshade, infant car seat, and rear baby mirror on standby' },
                  { id: 'hospitalDocuments', labelZh: '備妥【入院隨身證件袋】（夫妻身分證、健保卡、媽媽手冊）與待產包，設定產房電話與叫車路線', labelEn: 'Prepare [Hospital Document Pouch] (both IDs, health cards, handbook) & hospital bag; save transport route' },
                  { id: 'laborSignsCheck', labelZh: '隨時留意足月產兆（規則陣痛、破水、落紅），並確認住院期間家中大寶或寵物照顧後援', labelEn: 'Watch closely for labor signs (contractions, water breaking, bloody show) & confirm home/pet care backup' },
                  { id: 'postpartumBenefits', labelZh: '備妥戶口名簿、印章與存摺影本（供產後報戶口、新生兒投保及申請生育給付/育嬰津貼）', labelEn: 'Prepare household registry, seals & bankbook copy for birth registration, baby insurance & benefit claims' },
                ],
              },
            ].map((group) => {
              const doneCount = group.items.filter((i) => !!checkedItems[i.id]).length;
              return (
                <div
                  key={group.key}
                  className={`${styles.checklistGroupCard} ${
                    group.isCurrentStage ? styles.checklistGroupCardActive : ''
                  } ${group.spanFullOnMd ? 'md:col-span-2' : ''}`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border-glass">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={`${styles.weekPill} ${group.isCurrentStage ? styles.weekPillActive : ''}`}>
                        {lang === 'zh-TW' ? group.weekBadgeZh : group.weekBadgeEn}
                      </span>
                      {group.isCurrentStage && (
                        <span className={styles.badge}>{t.tagCurrent}</span>
                      )}
                    </div>
                    <span className="text-xs font-mono text-text-sub">
                      {doneCount} / {group.items.length}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-text-main leading-snug">
                    {group.title}
                  </h3>

                  <div className={group.spanFullOnMd ? 'grid grid-cols-1 md:grid-cols-2 gap-2.5' : 'flex flex-col gap-2.5'}>
                    {group.items.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        className={`${styles.checklistItem} ${checkedItems[item.id] ? styles.checklistItemDone : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={!!checkedItems[item.id]}
                          onChange={() => {}}
                          className="mt-0.5 accent-[#ff4081] shrink-0"
                        />
                        <span className={`${styles.checklistText} text-xs leading-relaxed text-text-main`}>
                          {lang === 'zh-TW' ? item.labelZh : item.labelEn}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

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

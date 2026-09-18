'use client';

import React, { useState, useEffect, useId, useMemo } from 'react';
import {
  calculateDueDate,
  calculateGestationalAge,
  calculateMaternityBenefits,
  crlToGestationalAge,
  type CalcMode,
  type ScanInputType,
  type IvfType,
  addDays,
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

  // 產檢與里程碑時間軸清單
  const milestones = useMemo(() => {
    const lmpBase = addDays(estimatedDueDate, -280);

    return [
      {
        weekRange: '6 ~ 8 週',
        weekRangeEn: 'Weeks 6 - 8',
        titleZh: '第一次產檢：超音波確認胚胎著床與心跳',
        titleEn: '1st Visit: Ultrasound confirms heartbeat & gestational sac',
        descZh: '確認胎兒心跳與著床位置，領取【孕婦健康手冊（媽媽手冊）】。血液常規、梅毒、愛滋、德國麻疹抗體檢查。',
        descEn: 'Confirms embryo heartbeat and intrauterine pregnancy. First blood & antibody panels.',
        startDate: addDays(lmpBase, 6 * 7),
        endDate: addDays(lmpBase, 8 * 7),
        isCurrent: currentWeeks >= 6 && currentWeeks <= 8,
        isPast: currentWeeks > 8,
      },
      {
        weekRange: '11 ~ 13 週',
        weekRangeEn: 'Weeks 11 - 13',
        titleZh: '第一孕期唐氏症篩檢 (頸部透明帶超音波)',
        titleEn: '1st Trimester Nuchal Translucency & Down Syndrome Screen',
        descZh: '測量胎兒頸部透明帶 (NT) 厚度搭配母血游離 β-hCG 與 PAPP-A，或選擇自費 NIPT 非侵入性胎兒染色體基因檢測。',
        descEn: 'Nuchal translucency scan + maternal serum biochemistry or non-invasive prenatal testing (NIPT).',
        startDate: addDays(lmpBase, 11 * 7),
        endDate: addDays(lmpBase, 13 * 7),
        isCurrent: currentWeeks >= 11 && currentWeeks <= 13,
        isPast: currentWeeks > 13,
      },
      {
        weekRange: '16 ~ 20 週',
        weekRangeEn: 'Weeks 16 - 20',
        titleZh: '羊膜穿刺 / 羊水晶片 / 第二孕期常規產檢',
        titleEn: 'Amniocentesis & 2nd Trimester Routine Visit',
        descZh: '高齡產婦（滿 34 歲享國健署補助 5,000 元）或高風險孕婦建議進行羊膜穿刺與基因晶片檢查，確認染色體數目與微片段缺失。',
        descEn: 'Amniocentesis and microarray for high-risk or advanced maternal age (34+).',
        startDate: addDays(lmpBase, 16 * 7),
        endDate: addDays(lmpBase, 20 * 7),
        isCurrent: currentWeeks >= 16 && currentWeeks <= 20,
        isPast: currentWeeks > 20,
      },
      {
        weekRange: '20 ~ 24 週',
        weekRangeEn: 'Weeks 20 - 24',
        titleZh: '【黃金期】健保與自費高層次超音波 (Level II Scan)',
        titleEn: 'Level II Detailed Anatomy Scan (Gold Standard)',
        descZh: '全面系統性檢查胎兒腦部、心臟四腔室、面部脊椎、四肢五官與內部重要臟器結構是否發育完整。',
        descEn: 'Detailed anatomical scan evaluating heart chambers, brain, spine, kidneys, and limbs.',
        startDate: addDays(lmpBase, 20 * 7),
        endDate: addDays(lmpBase, 24 * 7),
        isCurrent: currentWeeks >= 20 && currentWeeks <= 24,
        isPast: currentWeeks > 24,
      },
      {
        weekRange: '24 ~ 28 週',
        weekRangeEn: 'Weeks 24 - 28',
        titleZh: '妊娠糖尿病篩檢 (75g 喝糖水耐糖試驗) & 貧血複查',
        titleEn: 'Gestational Diabetes Glucose Tolerance Test (OGTT)',
        descZh: '空腹 8 小時後喝 75g 葡萄糖水，檢測空腹、1小時、2小時血糖值，預防妊娠糖尿病併發症。',
        descEn: '75g oral glucose tolerance test (OGTT) and complete blood count for gestational anemia.',
        startDate: addDays(lmpBase, 24 * 7),
        endDate: addDays(lmpBase, 28 * 7),
        isCurrent: currentWeeks >= 24 && currentWeeks <= 28,
        isPast: currentWeeks > 28,
      },
      {
        weekRange: '28 ~ 32 週',
        weekRangeEn: 'Weeks 28 - 32',
        titleZh: '進入第三孕期：密集例行產檢 & 評估胎位',
        titleEn: '3rd Trimester Visits & Fetal Position Assessment',
        descZh: '產檢頻率改為每兩週一次。監測母體血壓、尿蛋白（預防子癇前症）、胎心音及胎兒體重成長曲線。',
        descEn: 'Visits increase to bi-weekly. Monitoring blood pressure, urine protein, and fetal growth.',
        startDate: addDays(lmpBase, 28 * 7),
        endDate: addDays(lmpBase, 32 * 7),
        isCurrent: currentWeeks >= 28 && currentWeeks <= 32,
        isPast: currentWeeks > 32,
      },
      {
        weekRange: '35 ~ 37 週',
        weekRangeEn: 'Weeks 35 - 37',
        titleZh: '乙型鏈球菌篩檢 (GBS) & 待產包確認',
        titleEn: 'Group B Streptococcus (GBS) Screening',
        descZh: '陰道與肛門抹片篩檢乙型鏈球菌，若為陽性於待產時給予預防性抗生素注射，保護新生兒產道感染。',
        descEn: 'Vaginal and rectal GBS swab culture to prevent neonatal infection during labor.',
        startDate: addDays(lmpBase, 35 * 7),
        endDate: addDays(lmpBase, 37 * 7),
        isCurrent: currentWeeks >= 35 && currentWeeks <= 37,
        isPast: currentWeeks > 37,
      },
      {
        weekRange: '37 週 ~ 預產期',
        weekRangeEn: 'Week 37 - Due Date',
        titleZh: '正式足月 (Full Term)！隨時準備迎接新生命',
        titleEn: 'Full Term! Ready for Delivery Anytime',
        descZh: '每週例行產檢與胎兒監視器 (NST) 監測宮縮與胎心率。注意產兆：落紅、規則陣痛、破水。',
        descEn: 'Weekly checkups. Monitor labor signs: regular contractions, bloody show, water breaking.',
        startDate: addDays(lmpBase, 37 * 7),
        endDate: estimatedDueDate,
        isCurrent: currentWeeks >= 37 && currentWeeks <= 40,
        isPast: currentWeeks > 40,
      },
    ];
  }, [estimatedDueDate, currentWeeks]);

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

          <div className={styles.timeline}>
            {milestones.map((m, idx) => (
              <div key={idx} className={styles.timelineItem}>
                <div
                  className={`${styles.timelineDot} ${
                    m.isCurrent ? styles.timelineDotActive : m.isPast ? styles.timelineDotCompleted : ''
                  }`}
                >
                  {m.isPast && (
                    <svg viewBox="0 0 24 24" width={12} height={12} fill="white">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  )}
                </div>
                <div
                  className={`${styles.timelineContent} ${
                    m.isCurrent ? styles.timelineContentActive : ''
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-text-main">
                        {lang === 'zh-TW' ? m.titleZh : m.titleEn}
                      </span>
                      <span className="text-xs font-medium text-text-sub">
                        ({lang === 'zh-TW' ? m.weekRange : m.weekRangeEn})
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-sub font-mono">
                        {formatDate(m.startDate)} ~ {formatDate(m.endDate)}
                      </span>
                      {m.isPast ? (
                        <span className={`${styles.badge} ${styles.badgeSuccess}`}>{t.tagPast}</span>
                      ) : m.isCurrent ? (
                        <span className={styles.badge}>{t.tagCurrent}</span>
                      ) : (
                        <span className="text-xs text-text-sub px-2 py-0.5 rounded-md bg-surface-glass border border-border-glass">
                          {t.tagFuture}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-text-sub leading-relaxed">
                    {lang === 'zh-TW' ? m.descZh : m.descEn}
                  </p>
                </div>
              </div>
            ))}
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

        {/* 孕期與待產包 Checklist */}
        <div className={styles.glassCard}>
          <h2 className={styles.cardTitle}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            {t.checklistTitle}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 第一孕期 */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold text-text-main pb-1 border-b border-border-glass">{t.checkStage1}</h3>
              {[
                { id: 'folicAcid', labelZh: '每日補充葉酸 400~600 mcg (劑量請依醫囑為主)', labelEn: 'Daily folic acid 400-600 mcg (Consult doctor for dosage)' },
                { id: 'dietHabits', labelZh: '戒菸、戒酒、避免生食生乳', labelEn: 'Avoid alcohol, tobacco & raw foods' },
                { id: 'maternityBook', labelZh: '領取媽媽手冊與產檢假規劃', labelEn: 'Obtain handbook & plan checkup leaves' },
                { id: 'confinementCenter', labelZh: '熱門月子中心 / 產後護理之家參觀預約', labelEn: 'Book postpartum confinement center' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`${styles.checklistItem} ${checkedItems[item.id] ? styles.checklistItemDone : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={!!checkedItems[item.id]}
                    onChange={() => {}}
                    className="mt-0.5 accent-[#ff4081]"
                  />
                  <span className={`${styles.checklistText} text-xs leading-relaxed text-text-main`}>
                    {lang === 'zh-TW' ? item.labelZh : item.labelEn}
                  </span>
                </div>
              ))}
            </div>

            {/* 第二孕期 */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold text-text-main pb-1 border-b border-border-glass">{t.checkStage2}</h3>
              {[
                { id: 'nutrition', labelZh: '補充鈣質、維生素 D 與藻油/魚油 DHA (請依醫囑為主)', labelEn: 'Supplement calcium, Vit D & DHA (Please follow medical advice)' },
                { id: 'anatomyScan', labelZh: '預約高層次超音波 (20~24週)', labelEn: 'Book detailed anatomy scan (Weeks 20-24)' },
                { id: 'stretchMark', labelZh: '早晚塗抹孕婦妊娠霜與撫紋油', labelEn: 'Apply belly moisturizer/oil' },
                { id: 'daycareSurvey', labelZh: '托嬰中心登記或保母初步諮詢', labelEn: 'Inquire daycare or nanny services' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`${styles.checklistItem} ${checkedItems[item.id] ? styles.checklistItemDone : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={!!checkedItems[item.id]}
                    onChange={() => {}}
                    className="mt-0.5 accent-[#ff4081]"
                  />
                  <span className={`${styles.checklistText} text-xs leading-relaxed text-text-main`}>
                    {lang === 'zh-TW' ? item.labelZh : item.labelEn}
                  </span>
                </div>
              ))}
            </div>

            {/* 第三孕期 */}
            <div className="flex flex-col gap-2.5">
              <h3 className="text-xs font-bold text-text-main pb-1 border-b border-border-glass">{t.checkStage3}</h3>
              {[
                { id: 'hospitalDocuments', labelZh: '夫妻身分證、健保卡、媽媽手冊', labelEn: 'IDs, health cards & maternity book' },
                { id: 'deliveryKit', labelZh: '產褥墊、看護墊、免洗內褲、沖洗瓶', labelEn: 'Maternity pads, disposable underwear' },
                { id: 'breastfeedingKit', labelZh: '溢乳墊、集乳器、羊脂膏、哺乳內衣', labelEn: 'Nursing pads, breast pump & bras' },
                { id: 'babyClothes', labelZh: '新生兒出院包巾、紗布衣、汽車安全座椅', labelEn: 'Baby going-home outfit & car seat' },
              ].map((item) => (
                <div
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`${styles.checklistItem} ${checkedItems[item.id] ? styles.checklistItemDone : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={!!checkedItems[item.id]}
                    onChange={() => {}}
                    className="mt-0.5 accent-[#ff4081]"
                  />
                  <span className={`${styles.checklistText} text-xs leading-relaxed text-text-main`}>
                    {lang === 'zh-TW' ? item.labelZh : item.labelEn}
                  </span>
                </div>
              ))}
            </div>
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

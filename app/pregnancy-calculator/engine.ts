/**
 * 孕期試算純函數引擎（無副作用、可毫秒級單元測試）。
 *
 * 從 `PregnancyCalculatorClient.tsx` 抽離：4 種推算模式的預產期 (EDD) 與受孕日、
 * 當前懷孕週數與進度、CRL（頭臀長）換算週數，以及台灣法定產假區間與
 * 勞保生育給付 / 育嬰留停津貼試算。
 *
 * 純日期字串（YYYY-MM-DD）一律以「本地零時」建構，不做時區轉換（鐵則 7、8）。
 * 津貼金額計算走 BigNumber.js 定點數（鐵則 5、6）。
 */

import { D, toMoney } from '../utils/decimal.ts';

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** 將 YYYY-MM-DD 以本地零時建構 Date；無效輸入回傳 null */
export function parseYmd(value: string | null | undefined): Date | null {
  if (!value) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return Number.isNaN(d.getTime()) ? null : d;
}

export function formatDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setDate(result.getDate() + days);
  return result;
}

export type CalcMode = 'lmp' | 'edd' | 'ultrasound' | 'ivf';
export type ScanInputType = 'weeks' | 'crl';
export type IvfType = 'd5' | 'd3' | 'egg';

export interface CrlAge {
  totalDays: number;
  weeks: number;
  days: number;
}

/**
 * 依 CRL (mm) 以 Hadlock 公式換算胎兒日齡：
 * Days = 52.37 + 1.315·CRL − 0.0022·CRL²，夾在 35 ~ 110 天（約 5 ~ 15 週）。
 */
export function crlToGestationalAge(crl: number | ''): CrlAge {
  if (typeof crl !== 'number' || crl <= 0) return { totalDays: 84, weeks: 12, days: 0 };
  const raw = Math.round(52.37 + 1.315 * crl - 0.0022 * crl * crl);
  const totalDays = Math.max(35, Math.min(110, raw));
  return { totalDays, weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}

export interface DueDateInput {
  calcMode: CalcMode;
  lmpDate: string;
  cycleDays: number;
  eddDateInput: string;
  /** eddDateInput 為空時的回退日期字串 */
  fallbackDate: string;
  scanDate: string;
  scanInputType: ScanInputType;
  scanWeeks: number;
  scanDays: number;
  crlValue: number | '';
  ivfDate: string;
  ivfType: IvfType;
}

export interface DueDateResult {
  estimatedDueDate: Date;
  conceptionDate: Date;
}

/** 依所選模式推算預產期 (EDD) 與受孕日 */
export function calculateDueDate(input: DueDateInput): DueDateResult {
  let edd = new Date();
  let conception = new Date();

  if (input.calcMode === 'lmp') {
    const lmp = parseYmd(input.lmpDate);
    if (lmp) {
      // 奈格爾法則：280 天 + (週期天數 − 28)
      const cycleAdjustment = (input.cycleDays || 28) - 28;
      edd = addDays(lmp, 280 + cycleAdjustment);
      conception = addDays(lmp, 14 + cycleAdjustment);
    }
  } else if (input.calcMode === 'edd') {
    const parsedEdd = parseYmd(input.eddDateInput) ?? parseYmd(input.fallbackDate);
    if (parsedEdd) {
      edd = parsedEdd;
      conception = addDays(parsedEdd, -266);
    }
  } else if (input.calcMode === 'ultrasound') {
    const scanD = parseYmd(input.scanDate);
    if (scanD) {
      const totalScanDays =
        input.scanInputType === 'crl'
          ? crlToGestationalAge(input.crlValue).totalDays
          : (input.scanWeeks || 0) * 7 + (input.scanDays || 0);
      edd = addDays(scanD, 280 - totalScanDays);
      conception = addDays(edd, -266);
    }
  } else if (input.calcMode === 'ivf') {
    const ivfD = parseYmd(input.ivfDate);
    if (ivfD) {
      if (input.ivfType === 'd5') {
        edd = addDays(ivfD, 280 - 19); // 261 天
        conception = addDays(ivfD, -5);
      } else if (input.ivfType === 'd3') {
        edd = addDays(ivfD, 280 - 17); // 263 天
        conception = addDays(ivfD, -3);
      } else {
        edd = addDays(ivfD, 280 - 14); // 266 天（取卵 / IUI）
        conception = ivfD;
      }
    }
  }

  return { estimatedDueDate: edd, conceptionDate: conception };
}

export interface GestationalAge {
  currentGestationalDays: number;
  currentWeeks: number;
  currentDays: number;
  daysRemaining: number;
  progressPercent: number;
  /** 1 / 2 / 3 孕期（由 UI 對應本地化字串） */
  trimesterIndex: 1 | 2 | 3;
}

/** 依 EDD 與「今天」計算當前懷孕週數、倒數與進度 */
export function calculateGestationalAge(estimatedDueDate: Date, today: Date = new Date()): GestationalAge {
  const daysLeft = Math.ceil((estimatedDueDate.getTime() - today.getTime()) / MS_PER_DAY);
  const totalDays = Math.max(0, Math.min(300, 280 - daysLeft));
  const weeks = Math.floor(totalDays / 7);
  const progress = Math.min(100, Math.max(0, Math.round((totalDays / 280) * 100)));

  const trimesterIndex: 1 | 2 | 3 = weeks >= 28 ? 3 : weeks >= 13 ? 2 : 1;

  return {
    currentGestationalDays: totalDays,
    currentWeeks: weeks,
    currentDays: totalDays % 7,
    daysRemaining: daysLeft,
    progressPercent: progress,
    trimesterIndex,
  };
}

export interface MaternityBenefits {
  leaveStart: Date;
  leaveEnd: Date;
  returnDate: Date;
  /** 勞保生育給付：2 個月平均月投保薪資 */
  laborBenefit: number;
  /** 育嬰留停津貼每月（8 成薪） */
  parentalAllowanceMonthly: number;
  /** 育嬰留停津貼 6 個月合計 */
  parentalAllowanceTotal: number;
}

/**
 * 台灣法定產假區間（8 週 = 56 天，含例假日）與津貼試算。
 * @param leaveStartWeeksOption 產前幾週開始請產假（0 = 預產期當日）
 */
export function calculateMaternityBenefits(
  estimatedDueDate: Date,
  leaveStartWeeksOption: number,
  monthlySalary: number | '',
): MaternityBenefits {
  const leaveStart = addDays(estimatedDueDate, -(leaveStartWeeksOption * 7));
  const leaveEnd = addDays(leaveStart, 55);
  const returnDate = addDays(leaveEnd, 1);

  const salary = typeof monthlySalary === 'number' && Number.isFinite(monthlySalary) ? monthlySalary : 0;
  const parentalMonthly = toMoney(D(salary).times('0.8'));

  return {
    leaveStart,
    leaveEnd,
    returnDate,
    laborBenefit: toMoney(D(salary).times(2)),
    parentalAllowanceMonthly: parentalMonthly,
    parentalAllowanceTotal: toMoney(D(parentalMonthly).times(6)),
  };
}

export type ClinicalStageType = 'pre_checkup' | 'active_milestone' | 'stable_gap' | 'post_term';
export type ClinicalGapKey = 'pre_5' | 'gap_15' | 'post_40';
export type MilestoneItemTag = 'public' | 'self';

export interface MilestoneCheckItem {
  labelZh: string;
  labelEn: string;
  tag?: MilestoneItemTag;
}

export interface ClinicalMilestoneDef {
  startWeek: number;
  endWeek: number;
  weekRange: string;
  weekRangeEn: string;
  titleZh: string;
  titleEn: string;
  descZh: string;
  descEn: string;
  items: MilestoneCheckItem[];
}

export interface ClinicalMilestone extends ClinicalMilestoneDef {
  startDate: Date;
  endDate: Date;
  isCurrent: boolean;
  isPast: boolean;
  isNextUpcoming: boolean;
}

/**
 * 40 週 9 大關鍵產檢與里程碑結構化定義
 */
export const CLINICAL_MILESTONE_DEFS: ClinicalMilestoneDef[] = [
  {
    startWeek: 5,
    endWeek: 8,
    weekRange: '5 ~ 8 週',
    weekRangeEn: 'Weeks 5 - 8',
    titleZh: '第一次產檢：超音波確認胚胎著床與心跳',
    titleEn: '1st Visit: Ultrasound Confirms Implantation & Heartbeat',
    descZh: '確認胚胎著床位置與心跳，由醫師測量胚胎大小、推估預產期並領取【孕婦健康手冊（媽媽手冊）】。',
    descEn: 'Confirm intrauterine implantation and fetal heartbeat, measure embryo size, estimate due date, and receive the Maternal Health Handbook.',
    items: [
      { labelZh: '確認著床位置', labelEn: 'Confirm implantation site' },
      { labelZh: '確認胚胎數量', labelEn: 'Confirm embryo count' },
      { labelZh: '確認寶寶心跳', labelEn: 'Confirm fetal heartbeat' },
      { labelZh: '測量胎兒大小 (CRL)', labelEn: 'Measure embryo size (CRL)' },
      { labelZh: '推估預產期 (EDD)', labelEn: 'Estimate due date (EDD)' },
      { labelZh: '領取媽媽手冊', labelEn: 'Receive Maternal Handbook', tag: 'public' },
    ],
  },
  {
    startWeek: 8,
    endWeek: 12,
    weekRange: '8 ~ 12 週',
    weekRangeEn: 'Weeks 8 - 12',
    titleZh: '第一次完整產檢：例行抽血與第一次公費超音波',
    titleEn: '1st Comprehensive Visit: Blood Panel & 1st Public Ultrasound',
    descZh: '進行孕期首次完整血液、尿液與傳染病抗體篩檢，並搭配第一次公費超音波評估胎兒早期發育。',
    descEn: 'Complete initial blood and urine panels, infectious disease antibody screenings, and the 1st public prenatal ultrasound.',
    items: [
      { labelZh: '檢查血型與 Rh 因子', labelEn: 'Blood type & Rh factor', tag: 'public' },
      { labelZh: '血液常規檢查', labelEn: 'Complete blood count (CBC)', tag: 'public' },
      { labelZh: '尿液常規檢查', labelEn: 'Routine urinalysis', tag: 'public' },
      { labelZh: '梅毒篩檢', labelEn: 'Syphilis screening', tag: 'public' },
      { labelZh: 'HIV 愛滋篩檢', labelEn: 'HIV screening', tag: 'public' },
      { labelZh: '德國麻疹抗體檢查', labelEn: 'Rubella antibody test', tag: 'public' },
      { labelZh: 'B 型肝炎相關檢查', labelEn: 'Hepatitis B antigen screen', tag: 'public' },
      { labelZh: '第一次公費一般超音波', labelEn: '1st public routine ultrasound', tag: 'public' },
    ],
  },
  {
    startWeek: 11,
    endWeek: 14,
    weekRange: '11 ~ 14 週',
    weekRangeEn: 'Weeks 11 - 14',
    titleZh: '第一孕期唐氏症篩檢與染色體檢測',
    titleEn: '1st Trimester Down Syndrome & Chromosomal Screening',
    descZh: '透過超音波測量胎兒頸部透明帶厚度搭配母血指標，或選擇非侵入性胎兒染色體基因檢測 (NIPT/NIPS)。',
    descEn: 'Assess chromosomal risk via Nuchal Translucency (NT) scan with maternal serum markers, or opt for NIPT/NIPS cell-free DNA testing.',
    items: [
      { labelZh: '第一孕期唐氏症篩檢', labelEn: '1st trimester Down syndrome screen', tag: 'self' },
      { labelZh: '頸部透明帶超音波檢查 (NT)', labelEn: 'Nuchal Translucency (NT) scan', tag: 'self' },
      { labelZh: 'NIPT / NIPS 非侵入性染色體檢測', labelEn: 'NIPT / NIPS chromosomal test', tag: 'self' },
    ],
  },
  {
    startWeek: 16,
    endWeek: 20,
    weekRange: '16 ~ 20 週',
    weekRangeEn: 'Weeks 16 - 20',
    titleZh: '第二孕期唐氏症篩檢與例行產檢追蹤',
    titleEn: '2nd Trimester Down Syndrome Screen & Routine Checkup',
    descZh: '進行例行產檢追蹤胎兒發育，並進行第二孕期唐氏症篩檢；高齡或高風險孕婦由醫師評估是否進一步安排羊膜穿刺。',
    descEn: 'Routine prenatal checkup, 2nd trimester Down syndrome quad screen, and physician evaluation for amniocentesis if indicated.',
    items: [
      { labelZh: '例行產檢：體重、血壓、胎心音等', labelEn: 'Routine: weight, BP & fetal heart tones', tag: 'public' },
      { labelZh: '第二孕期唐氏症篩檢', labelEn: '2nd trimester quad screen', tag: 'self' },
      { labelZh: '醫師評估是否需進一步檢查（如羊膜穿刺）', labelEn: 'Evaluate need for amniocentesis', tag: 'self' },
      { labelZh: '追蹤胎兒發育與成長', labelEn: 'Track fetal growth & development' },
    ],
  },
  {
    startWeek: 20,
    endWeek: 24,
    weekRange: '20 ~ 24 週',
    weekRangeEn: 'Weeks 20 - 24',
    titleZh: '高層次胎兒超音波與第二次公費超音波',
    titleEn: 'Level II Detailed Anatomy Scan & 2nd Public Ultrasound',
    descZh: '胎兒結構篩檢黃金期！全面檢視胎兒器官發育、胎盤羊水與臍帶狀況，確認是否有明顯結構異常。',
    descEn: 'Golden window for fetal anatomy screening! Evaluate organ development, placenta, amniotic fluid, umbilical cord, and structural integrity.',
    items: [
      { labelZh: '高層次胎兒超音波', labelEn: 'Level II detailed anatomy scan', tag: 'self' },
      { labelZh: '第二次公費一般超音波', labelEn: '2nd public routine ultrasound', tag: 'public' },
      { labelZh: '檢查胎兒器官發育狀況', labelEn: 'Examine fetal organ development' },
      { labelZh: '評估胎盤、羊水、臍帶狀況', labelEn: 'Assess placenta, amniotic fluid & cord' },
      { labelZh: '測量胎兒大小與成長情形', labelEn: 'Measure fetal size & biometry' },
      { labelZh: '確認是否有明顯結構異常', labelEn: 'Screen for major structural anomalies' },
    ],
  },
  {
    startWeek: 24,
    endWeek: 28,
    weekRange: '24 ~ 28 週',
    weekRangeEn: 'Weeks 24 - 28',
    titleZh: '妊娠糖尿病篩檢與貧血檢驗',
    titleEn: 'Gestational Diabetes (OGTT) & Anemia Screening',
    descZh: '空腹喝 75 克葡萄糖水進行耐糖試驗，篩檢妊娠糖尿病風險，並同步執行公費貧血檢驗與例行產檢。',
    descEn: '75g Oral Glucose Tolerance Test (OGTT) for gestational diabetes, along with public gestational anemia screening and routine checkup.',
    items: [
      { labelZh: '妊娠糖尿病篩檢（75克葡萄糖耐受試驗）', labelEn: '75g Oral Glucose Tolerance Test (OGTT)', tag: 'public' },
      { labelZh: '孕期貧血檢驗', labelEn: 'Gestational anemia blood test', tag: 'public' },
      { labelZh: '例行產檢：體重、血壓、胎心音等', labelEn: 'Routine: weight, BP & fetal heart tones', tag: 'public' },
    ],
  },
  {
    startWeek: 28,
    endWeek: 32,
    weekRange: '28 ~ 32 週',
    weekRangeEn: 'Weeks 28 - 32',
    titleZh: '邁入第三孕期：第三次公費超音波、胎位與百日咳疫苗',
    titleEn: '3rd Trimester: 3rd Public Ultrasound, Position & Tdap Vaccine',
    descZh: '產檢頻率改為每兩週一次，透過第三次公費一般超音波測量胎兒成長、確認胎位與羊水量，並建議評估自費施打百日咳疫苗。',
    descEn: 'Visits increase to bi-weekly. Includes 3rd public ultrasound to measure fetal growth, confirm position and amniotic fluid, plus Tdap vaccine evaluation.',
    items: [
      { labelZh: '例行產檢：體重、血壓、胎心音等', labelEn: 'Routine: weight, BP & fetal heart tones', tag: 'public' },
      { labelZh: '第三次公費一般超音波', labelEn: '3rd public routine ultrasound', tag: 'public' },
      { labelZh: '測量胎兒大小與成長情形', labelEn: 'Measure fetal size & growth curve' },
      { labelZh: '確認胎位與評估胎盤位置', labelEn: 'Confirm fetal position & placenta location' },
      { labelZh: '評估羊水量', labelEn: 'Assess amniotic fluid volume' },
      { labelZh: '自費百日咳疫苗 (Tdap) 接種（28~36週，抗體傳給寶寶）', labelEn: 'Tdap (pertussis) vaccine (Weeks 28-36 for newborn antibodies)', tag: 'self' },
    ],
  },
  {
    startWeek: 33,
    endWeek: 37,
    weekRange: '33 ~ 37 週',
    weekRangeEn: 'Weeks 33 - 37',
    titleZh: '乙型鏈球菌 (GBS) 篩檢、疫苗評估與生產方式確認',
    titleEn: 'Group B Strep (GBS) Screen, RSV Vaccine & Birth Plan',
    descZh: '執行公費乙型鏈球菌抹片篩檢預防新生兒感染，評估自費 RSV 疫苗，並與醫師確認胎位、生產方式與待產包。',
    descEn: 'Public Group B Strep (GBS) swab culture, optional maternal RSV vaccine evaluation, and confirming fetal presentation and delivery method.',
    items: [
      { labelZh: '例行產檢：體重、血壓、胎心音等', labelEn: 'Routine: weight, BP & fetal heart tones', tag: 'public' },
      { labelZh: '乙型鏈球菌 (GBS) 篩檢', labelEn: 'Group B Streptococcus (GBS) screening', tag: 'public' },
      { labelZh: '自費 RSV 呼吸道融合病毒疫苗評估（32~36週施打）', labelEn: 'Maternal RSV vaccine evaluation (Weeks 32-36)', tag: 'self' },
      { labelZh: '確認胎位', labelEn: 'Confirm fetal presentation' },
      { labelZh: '確認生產方式', labelEn: 'Confirm delivery method' },
      { labelZh: '待產包準備與確認', labelEn: 'Prepare & verify hospital bag' },
    ],
  },
  {
    startWeek: 38,
    endWeek: 40,
    weekRange: '38 ~ 40 週',
    weekRangeEn: 'Weeks 38 - 40',
    titleZh: '足月每週產檢：胎心音監測與待產評估',
    titleEn: 'Full-Term Weekly Visits: NST Monitoring & Labor Readiness',
    descZh: '正式邁入足月！每週密集回診監測胎心音與宮縮、評估羊水量和胎盤功能，並視產兆進行內診檢查。',
    descEn: 'Full term reached! Weekly checkups for fetal heart monitoring (NST), amniotic fluid and placental function evaluation, and pelvic exam.',
    items: [
      { labelZh: '例行產檢：體重、血壓、胎心音等', labelEn: 'Routine: weight, BP & fetal heart tones', tag: 'public' },
      { labelZh: '確認胎位', labelEn: 'Confirm fetal position' },
      { labelZh: '評估羊水量和胎盤功能', labelEn: 'Evaluate amniotic fluid & placental function' },
      { labelZh: '胎心音與宮縮監測 (NST)', labelEn: 'Fetal heart & contraction monitoring (NST)' },
      { labelZh: '內診檢查（評估子宮頸成熟度）', labelEn: 'Pelvic / cervical exam as needed' },
    ],
  },
];

export interface ClinicalStageStatus {
  statusType: ClinicalStageType;
  /** 當前正在進行之重大檢查里程碑索引（0~8），若為空檔期則為 null */
  activeMilestoneIndex: number | null;
  /** 下一個即將到來的重大檢查里程碑索引（0~8），若超過足月則為 null */
  nextMilestoneIndex: number | null;
  /** 距離下一個里程碑開始尚餘天數 */
  daysToNextMilestone: number | null;
  /** 距離下一個里程碑開始尚餘週數（無條件捨去） */
  weeksToNextMilestone: number | null;
  /** 若處於空檔過渡期或極早期/足月，對應之語系 Key */
  gapKey?: ClinicalGapKey;
}

/**
 * 依當前懷孕天數 (currentGestationalDays) 推算臨床產檢階段狀態與空檔過渡期定位（共 9 大階段，索引 0~8）。
 */
export function getClinicalStageStatus(currentGestationalDays: number): ClinicalStageStatus {
  const weeks = Math.floor(currentGestationalDays / 7);

  // 1. 未滿 5 週：胚胎早期著床發育
  if (weeks < 5) {
    const daysLeft = Math.max(1, 35 - currentGestationalDays);
    return {
      statusType: 'pre_checkup',
      activeMilestoneIndex: null,
      nextMilestoneIndex: 0,
      daysToNextMilestone: daysLeft,
      weeksToNextMilestone: Math.floor(daysLeft / 7),
      gapKey: 'pre_5',
    };
  }

  // 2. 5 ~ 7 週（5~8 週階段）：第一次產檢（確認著床、心跳、領媽媽手冊）
  if (weeks < 8) {
    const daysLeft = Math.max(1, 56 - currentGestationalDays);
    return {
      statusType: 'active_milestone',
      activeMilestoneIndex: 0,
      nextMilestoneIndex: 1,
      daysToNextMilestone: daysLeft,
      weeksToNextMilestone: Math.floor(daysLeft / 7),
    };
  }

  // 3. 8 ~ 10 週（8~12 週階段）：第一次完整產檢（例行抽血、驗尿、第一次公費超音波）
  if (weeks <= 10) {
    const daysLeft = Math.max(1, 77 - currentGestationalDays);
    return {
      statusType: 'active_milestone',
      activeMilestoneIndex: 1,
      nextMilestoneIndex: 2,
      daysToNextMilestone: daysLeft,
      weeksToNextMilestone: Math.floor(daysLeft / 7),
    };
  }

  // 4. 11 ~ 14 週：第一孕期唐氏症篩檢 / 頸部透明帶 / NIPT
  if (weeks <= 14) {
    const daysLeft = Math.max(1, 112 - currentGestationalDays);
    return {
      statusType: 'active_milestone',
      activeMilestoneIndex: 2,
      nextMilestoneIndex: 3,
      daysToNextMilestone: daysLeft,
      weeksToNextMilestone: Math.floor(daysLeft / 7),
    };
  }

  // 5. 15 週：第二孕期初期舒適過渡期
  if (weeks === 15) {
    const daysLeft = Math.max(1, 112 - currentGestationalDays);
    return {
      statusType: 'stable_gap',
      activeMilestoneIndex: null,
      nextMilestoneIndex: 3,
      daysToNextMilestone: daysLeft,
      weeksToNextMilestone: Math.floor(daysLeft / 7),
      gapKey: 'gap_15',
    };
  }

  // 6. 16 ~ 19 週（16~20 週階段）：第二孕期唐氏症篩檢 / 羊膜穿刺評估 / 例行產檢
  if (weeks < 20) {
    const daysLeft = Math.max(1, 140 - currentGestationalDays);
    return {
      statusType: 'active_milestone',
      activeMilestoneIndex: 3,
      nextMilestoneIndex: 4,
      daysToNextMilestone: daysLeft,
      weeksToNextMilestone: Math.floor(daysLeft / 7),
    };
  }

  // 7. 20 ~ 23 週（20~24 週階段）：高層次超音波 & 第二次公費超音波
  if (weeks < 24) {
    const daysLeft = Math.max(1, 168 - currentGestationalDays);
    return {
      statusType: 'active_milestone',
      activeMilestoneIndex: 4,
      nextMilestoneIndex: 5,
      daysToNextMilestone: daysLeft,
      weeksToNextMilestone: Math.floor(daysLeft / 7),
    };
  }

  // 8. 24 ~ 27 週（24~28 週階段）：妊娠糖尿病篩檢（喝糖水）& 貧血檢驗
  if (weeks < 28) {
    const daysLeft = Math.max(1, 196 - currentGestationalDays);
    return {
      statusType: 'active_milestone',
      activeMilestoneIndex: 5,
      nextMilestoneIndex: 6,
      daysToNextMilestone: daysLeft,
      weeksToNextMilestone: Math.floor(daysLeft / 7),
    };
  }

  // 9. 28 ~ 32 週：第三次公費超音波 & 胎位評估
  if (weeks <= 32) {
    const daysLeft = Math.max(1, 231 - currentGestationalDays);
    return {
      statusType: 'active_milestone',
      activeMilestoneIndex: 6,
      nextMilestoneIndex: 7,
      daysToNextMilestone: daysLeft,
      weeksToNextMilestone: Math.floor(daysLeft / 7),
    };
  }

  // 10. 33 ~ 37 週：乙型鏈球菌 (GBS) 篩檢 & 生產方式確認 & 待產包準備
  if (weeks <= 37) {
    const daysLeft = Math.max(1, 266 - currentGestationalDays);
    return {
      statusType: 'active_milestone',
      activeMilestoneIndex: 7,
      nextMilestoneIndex: 8,
      daysToNextMilestone: daysLeft,
      weeksToNextMilestone: Math.floor(daysLeft / 7),
    };
  }

  // 11. 38 ~ 40 週：足月每週產檢、胎音監測與內診評估
  if (weeks <= 40) {
    return {
      statusType: 'active_milestone',
      activeMilestoneIndex: 8,
      nextMilestoneIndex: null,
      daysToNextMilestone: null,
      weeksToNextMilestone: null,
    };
  }

  // 12. > 40 週：過期妊娠待產監測
  return {
    statusType: 'post_term',
    activeMilestoneIndex: null,
    nextMilestoneIndex: null,
    daysToNextMilestone: null,
    weeksToNextMilestone: null,
    gapKey: 'post_40',
  };
}

/**
 * 依預產期與當前階段狀態，建立帶有各階段起訖日期與進度標記的 9 大產檢里程碑清單。
 */
export function buildClinicalMilestones(
  estimatedDueDate: Date,
  stageStatus: ClinicalStageStatus,
): ClinicalMilestone[] {
  const lmpBase = addDays(estimatedDueDate, -280);
  const effectiveActive = stageStatus.activeMilestoneIndex;
  const effectiveNext = stageStatus.nextMilestoneIndex;

  return CLINICAL_MILESTONE_DEFS.map((item, idx) => {
    const isCurrent = effectiveActive === idx;
    const isPast =
      effectiveActive !== null
        ? idx < effectiveActive
        : effectiveNext !== null
        ? idx < effectiveNext
        : true;
    const isNextUpcoming = !isCurrent && effectiveNext === idx;

    return {
      ...item,
      startDate: addDays(lmpBase, item.startWeek * 7),
      endDate: item.endWeek === 40 ? estimatedDueDate : addDays(lmpBase, item.endWeek * 7),
      isCurrent,
      isPast,
      isNextUpcoming,
    };
  });
}

'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import {
  YEAR_CONFIGS_JSON,
  SUPPORTED_YEARS,
  findInsuredAmount,
  calculateTaxFromConfig,
} from './salaryConfig';
import styles from './my-salary-calculator.module.css';

interface Props {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: '薪資勞健保計算機',
    subtitle: 'TAIWAN SALARY & TAX CALCULATOR',
    description:
      '專業免費的線上台灣薪資勞保健保計算機！支援 2024~2026 最新法規級距、實領薪資試算、勞退自提%、財政部扣繳稅額表與雇主負擔成本明細。',
    langToggleLabel: 'English',
    langToggleUrl: '/my-salary-calculator/en/',
    salarySettings: '薪資與投保設定',
    yearLabel: '適用法規年份',
    latestBadge: '(最新)',
    minSalaryText: (year: number, amount: string) => `${year} 年基本工資為 $${amount} 元`,
    monthlySalaryLabel: '約定月薪總額 (元)',
    monthlySalaryPlaceholder: '例如：50000',
    insuranceBaseLabel: '申報投保薪資基底 (元)',
    insuranceBasePlaceholder: (amount: string) => `預設同月薪 ($${amount})`,
    insuranceBaseDesc: '可自訂投保薪資，預設自動採用約定月薪',
    healthDependentsLabel: '健保扶養眷屬 (人)',
    depSelfOnly: '0 人 (本人)',
    dep1: '1 人 (本人 + 1眷)',
    dep2: '2 人 (本人 + 2眷)',
    dep3Max: '3 人以上 (上限扣3眷)',
    pensionSelfLabel: '勞退個人自提 (%)',
    pensionNo: '0% (不自提)',
    pensionMax: '6% (提繳上限)',
    taxMethodLabel: '所得稅預扣方式',
    taxNone: '不預扣所得稅 (0%)',
    taxFixed5: '固定按 5% 預扣 (滿 $2,000 才起扣)',
    taxMatrix: '依財政部薪資所得扣繳稅額表 (查表速算)',
    taxDependentsLabel: '所得稅扶養親屬人數 (人)',
    copyLinkBtn: '複製薪資勞健保試算分享連結',
    employeeStatementTitle: (year: number) => `員工每月薪資結算表 (${year} 年法規)`,
    takeHomeHeader: '每月實領金額',
    takeHomePayLabel: '實領薪資 (Take-Home Pay)',
    empLaborLabel: '勞保自負額 (20%):',
    empLaborBracket: (amount: string) => `對應勞保投保級距：$${amount} 元`,
    empHealthLabel: (deps: number) => `健保自負額 (${deps}口):`,
    empHealthBracket: (amount: string) => `對應健保投保級距：$${amount} 元`,
    empPensionLabel: (ratio: number) => `勞退個人自提 (${ratio}%):`,
    empPensionBracket: (amount: string) => `對應勞退提繳級距：$${amount} 元`,
    empTaxLabel: '預扣所得稅:',
    empTaxDescNone: '未預扣',
    empTaxDesc5: '固定 5% 預扣',
    empTaxDescMatrix: (deps: number) => `財政部扣繳稅額表 (扶養 ${deps} 人)`,
    employerTotalCostTitle: '雇主營運總勞務成本 (Employer Total Cost)',
    emprLaborLabel: '雇主勞保 (70%)',
    emprHealthLabel: '雇主健保 (60% * 眷口)',
    emprPensionLabel: '雇主強制提繳 (6%)',
    bracketLabel: (amount: string) => `級距 $${amount}`,
    toastCopied: '已複製薪資勞健保試算分享連結',

    // FAQ
    faqTitle: '常見問題與專業指南 (FAQ)',
    faqSubtitle: '全方位掌握台灣勞健保分攤公式、眷屬計費上限、勞退自提節稅與雇主總營運勞務成本',
    faqItems: [
      {
        q: '「每月伙食津貼 3,000 元」所得稅免稅，那申報勞保、健保與勞退時需要計入投保金額嗎？',
        a: '必須全額計入！所得稅的「免稅額度」與勞動法規的「投保工資」定義不同，許多勞工與企業容易在此產生混淆：\n\n① 稅法上的「伙食費免稅額」（所得稅視角）：\n依財政部現行規定，雇主提供給員工之伙食津貼在每人每月 3,000 元以內，免視為員工薪資所得課徵綜合所得稅，此為國家給予上班族的租稅減免優惠。\n\n② 勞基法上的「經常性給與」（勞健保視角）：\n依勞動基準法第 2 條規定，只要是勞工因工作獲得且屬於「每月固定、經常性發給」的報酬（包含底薪、固定職務加給、伙食津貼、固定全勤獎金等），均屬法定工資範疇。\n\n③ 勞健保投保金額不得扣除伙食津貼：\n在申報勞工保險、全民健康保險投保級距及勞退 6% 提繳時，必須以「全額約定月薪總額（底薪 + 伙食津貼 + 其他經常性加給）」作為投保薪資基礎。若將 3,000 元伙食津貼擅自扣除後申報，將構成勞動部所認定的「以多報少（高薪低報）」，依法將面臨處以短報金額數倍罰鍰，並損及勞工退休金與各項給付權益。',
      },
      {
        q: '台灣薪資勞保費與健保費是如何計算的？員工與雇主各自的分攤比例是多少？',
        a: '台灣勞工保險與全民健康保險的法定費率及勞雇政三方負擔比例如下：\n\n① 勞工保險（普通事故 11% + 就業保險 1% = 合計 12%）：\n勞工本人負擔 20%、雇主負擔 70%、政府補助 10%。計算公式為「勞保投保級距金額 × 12% × 20%」。\n\n② 全民健康保險（現行費率 5.17%）：\n勞工本人負擔 30%（含依附眷屬口數，最多計 3 口）、雇主負擔 60%（依法加計平均眷口數 0.56）、政府補助 10%。計算公式為「健保投保級距金額 × 5.17% × 30% × (1 + 眷屬人數)」。\n\n③ 投保級距查表制：\n勞健保並非直接以實領毛薪乘算，而是依「約定月薪總額」對照官方公告之投保薪資分級表級距進行申報。',
      },
      {
        q: '健保「依附扶養眷屬」是如何收費的？若眷屬超過 3 人該如何計算？',
        a: '健保眷屬計費與上限保護機制規定如下：\n\n① 眷屬計費原則：\n無職業之配偶、直系血親尊親屬（父母、祖父母）或未成年/無謀生能力子女，依附在被保險人名下投保時，每位眷屬須繳納一份等額的個人健保自負額。\n\n② 3 人上限封頂保障（全民健康保險法第 18 條）：\n為減輕多子女或撫養多位長輩家庭的經濟負擔，法定眷屬計費人數上限為 3 人。若依附眷屬達 4 人以上，第 4 位起免收健保費，個人每月健保費最多僅收取「本人 + 3 口眷屬（共 4 份）」。',
      },
      {
        q: '什麼是「勞退新制個人自提 (0% ~ 6%)」？勞退自提有哪些節稅與退休優勢？',
        a: '勞退新制個人自願提繳退休金具備雙重財務效益：\n\n① 當年度全額免稅（所得稅節稅）：\n勞工可在每月工資 1% 至 6% 範圍內自願提繳退休金，自提金額得全數自當年度個人綜合所得總額中扣除，免計入薪資所得課稅，對適用較高所得稅率級距（如 12% 以上）的上班族節稅效果顯著。\n\n② 專屬個人專戶與保證收益：\n自提款項全額累積於勞保局個人專屬退休金專戶，所有權完全屬於勞工個人，換工作隨身帶著走，並享有「不低於 2 年期定期存款利率」的國庫法定收益保證。',
      },
      {
        q: '薪資每月「預扣所得稅」是如何計算的？有哪些扣繳方式？',
        a: '雇主發放每月薪資時之所得稅扣繳規定如下：\n\n① 財政部薪資所得扣繳稅額表（查表法）：\n依員工每月應稅給付薪資總額及填報之扶養親屬人數查表扣繳。若薪資未達當年度起扣標準（例如單身無扶養約 88,501 元以下），當月預扣稅額為 0 元。\n\n② 固定 5% 預扣率：\n若未填報免稅額申報表或約定固定率扣繳，按每月給付總額預扣 5%。若每次應扣繳稅額未達新台幣 2,000 元（即月薪在 40,000 元以下），依法免予預扣。\n\n③ 預扣稅多退少補：\n每月預扣之稅款本質為「預先繳納」，於隔年 5 月申報綜合所得稅時會全數列為已扣繳稅額，多繳退稅、少繳補稅。',
      },
      {
        q: '雇主每個月聘僱一名員工的「總人事勞務營運成本」包含哪些項目？',
        a: '雇主每聘僱一名正職員工，實際支出的法定人事成本顯著高於約定月薪：\n\n① 約定月薪：\n全額發給員工之約定工資（包含底薪、固定津貼與績效加給）。\n\n② 雇主負擔法定規費：\n包含「雇主負擔勞保費 (70%)」、「雇主負擔健保費 (60% × 1.56 眷口)」、「雇主負擔職業災害保險費」以及依法強制提繳之「6% 勞工退休金（雇主法定提繳，不得由員工薪資扣除）」\n\n③ 實質營運成本比率：\n一般而言，雇主實際每月需支出的法定人事成本約為該員工約定月薪的 115% ~ 120% 左右。',
      },
      {
        q: '基本工資調漲對勞保、健保投保級距有何直接影響？',
        a: '當行政院公告基本工資調升時，相關投保分級表將同步聯動：\n\n① 第一級級距自動上調：\n勞動部與衛福部會配合修正「勞工保險投保薪資分級表」與「全民健康保險投保金額分級表」，將分級表第一級（最低投保門檻）直接修正為當年度最新基本工資月薪標準。\n\n② 全民保障與費率連動：\n薪資低於基本工資之全職勞工依法強制以最新基本工資級距投保，勞工自負額與雇主負擔額均會微幅增加，確保各項給付保障（如生育給付、傷病給付、勞退提繳金）隨工資同步提升。',
      },
      {
        q: '本薪資與勞健保計算機試算結果是否具備法律效力？（免責條款聲明）',
        a: '本線上薪資與勞健保計算機係依據台灣勞工保險條例、全民健康保險法、勞工退休金條例及財政部薪資所得扣繳稅額表等公開法規級距進行數學模擬試算，僅供勞資雙方核對薪資結構、試算人事成本與個人財務規劃參考，不構成任何勞動契約承諾或法律保證。\n\n實際每月發放薪資、實領金額、代扣所得稅額及雇主負擔成本，請以各事業單位正式核發之薪資明細單（薪資條）及主管機關（勞工保險局、中央健康保險署、國稅局）之正式核定單據為準。',
      },
    ],
  },
  en: {
    title: 'Taiwan Salary & Tax Calculator',
    subtitle: 'TAIWAN SALARY & TAX CALCULATOR',
    description:
      'Professional free online Taiwan salary & labor/health insurance calculator. Supports 2024-2026 regulations, net take-home pay, labor pension self-contribution, withholding tax, and employer total cost breakdowns.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/my-salary-calculator/',
    salarySettings: 'Salary & Insurance Settings',
    yearLabel: 'Regulatory Year',
    latestBadge: '(Latest)',
    minSalaryText: (year: number, amount: string) => `Min. Wage for ${year}: $${amount} TWD`,
    monthlySalaryLabel: 'Monthly Gross Salary (TWD)',
    monthlySalaryPlaceholder: 'e.g., 50000',
    insuranceBaseLabel: 'Declared Insurance Base (TWD)',
    insuranceBasePlaceholder: (amount: string) => `Default same as salary ($${amount})`,
    insuranceBaseDesc: 'Custom insurance base, defaults to gross monthly salary',
    healthDependentsLabel: 'Health Ins. Dependents',
    depSelfOnly: '0 (Employee only)',
    dep1: '1 (Employee + 1)',
    dep2: '2 (Employee + 2)',
    dep3Max: '3+ (Capped at 3)',
    pensionSelfLabel: 'Voluntary Pension Self-Contribution (%)',
    pensionNo: '0% (No Contribution)',
    pensionMax: '6% (Max Limit)',
    taxMethodLabel: 'Withholding Tax Method',
    taxNone: 'No Withholding (0%)',
    taxFixed5: 'Fixed 5% (Threshold $2,000)',
    taxMatrix: 'MOF Tax Withholding Table (Matrix Lookup)',
    taxDependentsLabel: 'Tax Dependents Count',
    copyLinkBtn: 'Copy Share Link for Calculation',
    employeeStatementTitle: (year: number) => `Employee Monthly Breakdown (${year})`,
    takeHomeHeader: 'Net Take-Home Pay',
    takeHomePayLabel: 'Take-Home Pay',
    empLaborLabel: 'Labor Ins. Employee (20%):',
    empLaborBracket: (amount: string) => `Labor Bracket: $${amount} TWD`,
    empHealthLabel: (deps: number) => `Health Ins. Employee (${deps} ind.):`,
    empHealthBracket: (amount: string) => `Health Bracket: $${amount} TWD`,
    empPensionLabel: (ratio: number) => `Voluntary Pension (${ratio}%):`,
    empPensionBracket: (amount: string) => `Pension Bracket: $${amount} TWD`,
    empTaxLabel: 'Withholding Tax:',
    empTaxDescNone: 'None',
    empTaxDesc5: 'Fixed 5%',
    empTaxDescMatrix: (deps: number) => `MOF Matrix (${deps} dependents)`,
    employerTotalCostTitle: 'Employer Total Labor Cost',
    emprLaborLabel: 'Employer Labor Ins. (70%)',
    emprHealthLabel: 'Employer Health Ins. (60% * Dep.)',
    emprPensionLabel: 'Mandatory Pension (6%)',
    bracketLabel: (amount: string) => `Bracket $${amount}`,
    toastCopied: 'Shareable link copied to clipboard',

    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Everything you need to know about Taiwan labor/health insurance formulas, dependent caps, pension deductions, and employer labor overhead',
    faqItems: [
      {
        q: 'The monthly meal allowance ($3,000 TWD) is tax-exempt for income tax. Must it be included when declaring Labor and Health Insurance salary brackets?',
        a: 'Yes, it must be fully included! Income tax exemptions and statutory labor insurance wages operate under different legal definitions:\n\n① Income Tax Exemption Perspective (Tax Law):\nUnder Ministry of Finance regulations, employer-provided monthly meal allowances up to $3,000 TWD per employee are exempt from personal consolidated income tax, serving as a statutory tax benefit for workers.\n\n② "Regular Remuneration" under the Labor Standards Act (Labor Law):\nAccording to Article 2 of the Labor Standards Act, any payment granted to workers for work performed on a regular, recurring basis (including base salary, fixed duty allowances, meal allowances, and attendance bonuses) legally constitutes "wage/salary."\n\n③ Meal Allowances Cannot Be Excluded from Social Insurance:\nWhen reporting declared salary brackets for Labor Insurance, National Health Insurance, and mandatory 6% Labor Pension contributions, the base must be the full agreed monthly remuneration (Base + Meal Allowance + Fixed Allowances). Excluding the $3,000 TWD meal allowance constitutes unlawful "underreporting of insured salary," subjecting employers to administrative fines and depriving workers of their full statutory pension and benefit rights.',
      },
      {
        q: 'How are Taiwan Labor Insurance and National Health Insurance calculated? What are the contribution shares?',
        a: 'Taiwan statutory social insurance premium rates and cost-sharing ratios among employees, employers, and government are as follows:\n\n① Labor Insurance (Ordinary Risk 11% + Employment Insurance 1% = 12% total):\nEmployee pays 20%, employer pays 70%, and government subsidizes 10%. Formula: Insured Salary Bracket × 12% × 20%.\n\n② National Health Insurance (Current rate 5.17%):\nEmployee pays 30% (including eligible dependents, capped at 3 dependents), employer pays 60% (factoring in statutory average dependent coefficient of 0.56), and government subsidizes 10%. Formula: Insured Health Bracket × 5.17% × 30% × (1 + Dependents Count).\n\n③ Salary Bracket System:\nContributions are determined by mapping gross monthly salary to official government tiered wage brackets rather than direct multiplication of gross earnings.',
      },
      {
        q: 'How are Health Insurance Dependents charged? What happens if an employee has more than 3 dependents?',
        a: 'Health insurance dependent billing and statutory protection caps operate as follows:\n\n① Dependent Coverage Principle:\nNon-working spouses, direct ascendants (parents, grandparents), and minor/dependent children enrolled under the primary insured employee are each charged one full employee health insurance contribution.\n\n② 3-Dependent Statutory Cap (National Health Insurance Act Article 18):\nTo alleviate the financial burden on larger families, statutory dependent charges are strictly capped at 3 dependents. If an employee has 4 or more dependents, all dependents from the 4th onward receive free coverage. The maximum deduction is strictly limited to 4 units (Employee + 3 Dependents).',
      },
      {
        q: 'What is Voluntary Labor Pension Self-Contribution (0% to 6%)? What are the tax and retirement benefits?',
        a: 'Voluntary labor pension self-contribution provides significant dual financial benefits:\n\n① Immediate Income Tax Deduction:\nEmployees can voluntarily contribute between 1% and 6% of their monthly wage into their individual pension account. The entire self-contributed amount is 100% tax-deductible from gross annual personal consolidated income, offering meaningful tax savings for higher tax bracket earners.\n\n② Dedicated Portable Account & Guaranteed Return:\nContributions are deposited into the employee\'s individual retirement account with the Bureau of Labor Insurance. The account is fully portable across employers and guarantees a statutory return rate no lower than the 2-year bank fixed deposit interest rate.',
      },
      {
        q: 'How is Monthly Salary Withholding Tax calculated? What are the standard withholding methods?',
        a: 'Income tax withholding on monthly employment earnings operates under Ministry of Finance regulations:\n\n① MOF Tax Withholding Table (Matrix Lookup):\nTax is withheld according to official monthly salary tax withholding tables based on taxable earnings and claimed dependents count. If earnings fall below the minimum withholding threshold (e.g., ~$88,501 TWD for single filers with zero dependents), zero tax is withheld.\n\n② Fixed 5% Withholding Rate:\nIf requested or without exemption filings, a flat 5% rate is applied. Under statutory threshold rules, if the computed tax is under 2,000 TWD (monthly salary below ~40,000 TWD), no withholding is required.\n\n③ Annual Tax Reconciliation:\nAll monthly withheld taxes are credited on annual tax returns filed in May, where excess deductions are refunded and underpayments settled.',
      },
      {
        q: 'What is the Employer Total Labor Cost for hiring an employee in Taiwan?',
        a: 'An employer\'s statutory labor cost for hiring a full-time employee in Taiwan is significantly higher than gross agreed wages:\n\n① Gross Monthly Salary:\nAgreed contract wage paid to the employee (including base salary, fixed allowances, and performance bonuses).\n\n② Mandatory Statutory Employer Contributions:\nIncludes employer labor insurance share (70%), employer health insurance share (60% × 1.56 dependent factor), occupational accident insurance, and mandatory 6% labor pension contributions (legally funded entirely by the employer and never deducted from worker wages).\n\n③ Total Cost Ratio:\nTotal employer labor expense typically equates to approximately 115% to 120% of the employee\'s gross monthly salary.',
      },
      {
        q: 'How do statutory minimum wage increases affect Labor and Health Insurance brackets?',
        a: 'When the government officially raises the national statutory minimum wage, social insurance bracket tables automatically adjust:\n\n① Bottom Bracket Upward Adjustment:\nThe Ministry of Labor and Ministry of Health and Welfare adjust Tier 1 of their respective insurance tables to match the new minimum wage floor.\n\n② Automatic Coverage Realignment:\nWorkers earning at or below minimum wage are automatically mapped to the new base tier, slightly adjusting deductions while elevating benefit protection ceilings (e.g., maternity benefits, injury compensations, and pension accruals).',
      },
      {
        q: "Are the salary calculator's computations legally binding? (Legal & Tax Disclaimer)",
        a: 'All payroll calculations, net pay figures, insurance contribution amounts, and employer overhead totals generated by this calculator are mathematical simulations based on published Taiwan statutory regulations for personal verification and budgeting purposes only.\n\nActual monthly net salaries, deductions, and tax withholdings are governed strictly by formal pay slips issued by employing enterprises and official determinations from administrative authorities (Bureau of Labor Insurance, National Health Insurance Administration, and National Taxation Bureau).',
      },
    ],
  },
};

function formatNumber(val: number): string {
  if (isNaN(val) || !isFinite(val)) return '0';
  return Math.round(val).toLocaleString('en-US');
}

export default function MySalaryCalculatorClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  const [selectedYear, setSelectedYear] = useState<number>(SUPPORTED_YEARS[0] || 2026);
  const [monthlySalary, setMonthlySalary] = useState<number | ''>(50000);
  const [customInsuranceBase, setCustomInsuranceBase] = useState<number | ''>('');
  const [dependents, setDependents] = useState<number>(0);
  const [selfPensionRatio, setSelfPensionRatio] = useState<number>(0);

  // 所得稅預扣方式: 'none' | 'rate_5' | 'matrix'
  const [taxMethod, setTaxMethod] = useState<'none' | 'rate_5' | 'matrix'>('none');
  const [taxDependents, setTaxDependents] = useState<number>(0);

  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(false);

  const yearSelectId = useId();
  const salaryInputId = useId();
  const baseInputId = useId();
  const dependentsInputId = useId();
  const pensionInputId = useId();
  const taxMethodInputId = useId();
  const taxDependentsInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  // 設定全頁背景粒子主題色 (活力火焰橘)
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff7300');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 115, 0, 0.6)');
  }, []);

  // 1. 初次掛載從 URL Query Parameters 反向解析狀態
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);

    const yearParam = params.get('y');
    if (yearParam) {
      const parsedY = parseInt(yearParam, 10);
      if (SUPPORTED_YEARS.includes(parsedY)) setSelectedYear(parsedY);
    }

    const salaryParam = params.get('s');
    if (salaryParam !== null) {
      const parsedS = parseFloat(salaryParam);
      if (!isNaN(parsedS) && parsedS >= 0) setMonthlySalary(parsedS);
    }

    const baseParam = params.get('ib');
    if (baseParam !== null && baseParam !== '') {
      const parsedIb = parseFloat(baseParam);
      if (!isNaN(parsedIb) && parsedIb >= 0) setCustomInsuranceBase(parsedIb);
    }

    const depParam = params.get('d');
    if (depParam !== null) {
      const parsedD = parseInt(depParam, 10);
      if ([0, 1, 2, 3].includes(parsedD)) setDependents(parsedD);
    }

    const pensionParam = params.get('p');
    if (pensionParam !== null) {
      const parsedP = parseFloat(pensionParam);
      if (!isNaN(parsedP) && parsedP >= 0 && parsedP <= 6) setSelfPensionRatio(parsedP);
    }

    const taxParam = params.get('t');
    if (taxParam && ['none', 'rate_5', 'matrix'].includes(taxParam)) {
      setTaxMethod(taxParam as 'none' | 'rate_5' | 'matrix');
    }

    const taxDepParam = params.get('td');
    if (taxDepParam !== null) {
      const parsedTd = parseInt(taxDepParam, 10);
      if (!isNaN(parsedTd) && parsedTd >= 0 && parsedTd <= 11) setTaxDependents(parsedTd);
    }

    isMountedRef.current = true;
  }, []);

  // 2. 正向連動 URL 網址參數 (防抖 300ms replaceState)
  useEffect(() => {
    if (!isMountedRef.current || typeof window === 'undefined') return;

    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      params.set('y', selectedYear.toString());
      if (monthlySalary !== '') params.set('s', monthlySalary.toString());
      if (customInsuranceBase !== '') params.set('ib', customInsuranceBase.toString());
      if (dependents > 0) params.set('d', dependents.toString());
      if (selfPensionRatio > 0) params.set('p', selfPensionRatio.toString());
      if (taxMethod !== 'none') params.set('t', taxMethod);
      if (taxMethod === 'matrix' && taxDependents > 0) params.set('td', taxDependents.toString());

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedYear, monthlySalary, customInsuranceBase, dependents, selfPensionRatio, taxMethod, taxDependents]);

  const config = YEAR_CONFIGS_JSON[selectedYear] || YEAR_CONFIGS_JSON[2026];
  const numSalary = monthlySalary === '' ? 0 : monthlySalary;
  const numBase = customInsuranceBase === '' ? numSalary : customInsuranceBase;

  // 1. 查投保級距金額 (直接對照 JSON brackets)
  const insuredLabor = findInsuredAmount(numBase, config.labor_insurance.brackets);
  const insuredHealth = findInsuredAmount(numBase, config.health_insurance.brackets);
  const insuredPension = findInsuredAmount(numBase, config.labor_pension.brackets);

  // 2. 員工自負額計算
  const empLabor = Math.round(
    insuredLabor * config.labor_insurance.rate * config.labor_insurance.employee_ratio + 1e-9
  );
  const singleHealth = Math.round(
    insuredHealth * config.health_insurance.rate * config.health_insurance.employee_ratio + 1e-9
  );
  const empHealth = singleHealth * (1 + dependents);
  const empPension = Math.round(insuredPension * (selfPensionRatio / 100) + 1e-9);

  let empTax = 0;
  if (taxMethod === 'rate_5') {
    const calcTax = numSalary * 0.05;
    if (calcTax >= 2000) {
      empTax = Math.round(calcTax + 1e-9);
    }
  } else if (taxMethod === 'matrix') {
    empTax = calculateTaxFromConfig(numSalary, taxDependents, config, selectedYear);
  }

  const takeHomePay = Math.max(0, Math.round(numSalary - empLabor - empHealth - empPension - empTax));

  // 3. 雇主負擔計算
  const emprLabor = Math.round(
    insuredLabor * config.labor_insurance.rate * config.labor_insurance.employer_ratio + 1e-9
  );
  const emprHealth = Math.round(
    insuredHealth *
      config.health_insurance.rate *
      config.health_insurance.employer_ratio *
      (1 + (config.health_insurance.employer_average_dependents ?? 0.56)) +
      1e-9
  );
  const emprPension = Math.round(
    insuredPension * config.labor_pension.employer_rate + 1e-9
  );
  const emprTotalCost = Math.round(numSalary + emprLabor + emprHealth + emprPension);

  // 最小基本工資級距
  const minSalary = config.labor_insurance.brackets[0]?.insured || 29500;

  // 複製試算分享連結
  const copyShareLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => showToast(t.toastCopied));
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#00f5a0"
        accentGlow="rgba(0, 245, 160, 0.6)"
        extraHeaderControls={
          <Link
            href={t.langToggleUrl}
            className="relative inline-flex items-center justify-center gap-1.5 h-[42px] px-3.5 text-xs font-semibold rounded-xl bg-white/[.06] border border-white/10 text-text-sub hover:text-text-main backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-[var(--theme-color,#00f5a0)] hover:shadow-[0_0_12px_var(--theme-glow,rgba(0,245,160,0.4))] select-none"
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{t.langToggleLabel}</span>
          </Link>
        }
      >

        <div className="grid grid-cols-[1.1fr_1.9fr] gap-8 items-start text-left max-[1024px]:grid-cols-1">
          {/* 左欄：表單設定區 */}
          <div className={styles.panelCard}>
            <h3 className={styles.sectionTitle}>{t.salarySettings}</h3>

            {/* 法規年份切換 */}
            <div className="flex flex-col gap-2">
              <label htmlFor={yearSelectId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                {t.yearLabel}
              </label>
              <select
                id={yearSelectId}
                value={selectedYear}
                onChange={e => setSelectedYear(parseInt(e.target.value))}
                className="w-full bg-select-bg border border-border-glass text-text-main px-4 py-3 rounded-xl text-sm outline-none cursor-pointer font-mono font-medium"
              >
                {SUPPORTED_YEARS.map((y, idx) => (
                  <option key={y} value={y}>
                    {y} {idx === 0 ? t.latestBadge : ''}
                  </option>
                ))}
              </select>
              <span className="text-xs text-text-sub">
                {t.minSalaryText(selectedYear, formatNumber(minSalary))}
              </span>
            </div>

            {/* 約定月薪與投保基底 */}
            <div className="flex flex-col gap-4 border-t border-border-glass pt-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={salaryInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.monthlySalaryLabel}
                </label>
                <input
                  id={salaryInputId}
                  type="text"
                  inputMode="numeric"
                  placeholder={t.monthlySalaryPlaceholder}
                  value={monthlySalary === '' ? '' : monthlySalary.toLocaleString('zh-TW')}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setMonthlySalary(raw === '' ? '' : parseInt(raw, 10));
                  }}
                  className={styles.inputField}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={baseInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.insuranceBaseLabel}
                </label>
                <input
                  id={baseInputId}
                  type="text"
                  inputMode="numeric"
                  placeholder={t.insuranceBasePlaceholder(formatNumber(numSalary))}
                  value={customInsuranceBase === '' ? '' : customInsuranceBase.toLocaleString('zh-TW')}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setCustomInsuranceBase(raw === '' ? '' : parseInt(raw, 10));
                  }}
                  className={styles.inputField}
                />
                <span className="text-xs text-text-sub">{t.insuranceBaseDesc}</span>
              </div>
            </div>

            {/* 健保眷屬與勞退自提 */}
            <div className="grid grid-cols-2 gap-4 border-t border-border-glass pt-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={dependentsInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.healthDependentsLabel}
                </label>
                <select
                  id={dependentsInputId}
                  value={dependents}
                  onChange={e => setDependents(parseInt(e.target.value))}
                  className="w-full bg-select-bg border border-border-glass text-text-main px-3 py-3 rounded-xl text-sm outline-none cursor-pointer font-mono font-medium"
                >
                  <option value={0}>{t.depSelfOnly}</option>
                  <option value={1}>{t.dep1}</option>
                  <option value={2}>{t.dep2}</option>
                  <option value={3}>{t.dep3Max}</option>
                </select>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={pensionInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.pensionSelfLabel}
                </label>
                <select
                  id={pensionInputId}
                  value={selfPensionRatio}
                  onChange={e => setSelfPensionRatio(parseFloat(e.target.value))}
                  className="w-full bg-select-bg border border-border-glass text-text-main px-3 py-3 rounded-xl text-sm outline-none cursor-pointer font-mono font-medium"
                >
                  <option value={0}>{t.pensionNo}</option>
                  <option value={1}>1%</option>
                  <option value={2}>2%</option>
                  <option value={3}>3%</option>
                  <option value={4}>4%</option>
                  <option value={5}>5%</option>
                  <option value={6}>{t.pensionMax}</option>
                </select>
              </div>
            </div>

            {/* 所得稅預扣設定 */}
            <div className="flex flex-col gap-4 border-t border-border-glass pt-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={taxMethodInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                  {t.taxMethodLabel}
                </label>
                <select
                  id={taxMethodInputId}
                  value={taxMethod}
                  onChange={e => setTaxMethod(e.target.value as 'none' | 'rate_5' | 'matrix')}
                  className="w-full bg-select-bg border border-border-glass text-text-main px-4 py-3 rounded-xl text-sm outline-none cursor-pointer font-medium"
                >
                  <option value="none">{t.taxNone}</option>
                  <option value="rate_5">{t.taxFixed5}</option>
                  <option value="matrix">{t.taxMatrix}</option>
                </select>
              </div>

              {taxMethod === 'matrix' && (
                <div className="flex flex-col gap-2 bg-select-bg p-4 rounded-xl border border-border-glass">
                  <label htmlFor={taxDependentsInputId} className={`text-sm font-medium uppercase tracking-[1px] ${styles.accentText}`}>
                    {t.taxDependentsLabel}
                  </label>
                  <select
                    id={taxDependentsInputId}
                    value={taxDependents}
                    onChange={e => setTaxDependents(parseInt(e.target.value))}
                    className="w-full bg-select-bg border border-border-glass text-text-main px-3 py-2 rounded-lg text-sm outline-none font-mono font-medium"
                  >
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map(n => (
                      <option key={n} value={n}>{n}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {/* 複製分享按鈕 */}
            <button
              type="button"
              onClick={copyShareLink}
              className={styles.shareBtn}
            >
              {t.copyLinkBtn}
            </button>
          </div>

          {/* 右欄：雙面板試算 */}
          <div className="flex flex-col gap-6">
            {/* 板塊 1：員工每月薪資結算表 */}
            <div className={styles.panelCard}>
              <div className="flex justify-between items-center border-b border-border-glass pb-3">
                <h3 className={styles.sectionTitle}>
                  {t.employeeStatementTitle(selectedYear)}
                </h3>
                <span className="text-sm text-text-sub font-semibold">{t.takeHomeHeader}</span>
              </div>

              <div className={styles.takeHomeCard}>
                <span className="text-sm font-semibold text-text-main">{t.takeHomePayLabel}</span>
                <span className={`text-3xl font-bold font-mono ${styles.accentText}`}>
                  ${formatNumber(takeHomePay)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm font-mono max-sm:grid-cols-1">
                <div className={styles.subStatCard}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-text-sub">{t.empLaborLabel}</span>
                    <span className="text-text-main font-bold">${formatNumber(empLabor)}</span>
                  </div>
                  <span className="text-xs text-text-sub">
                    {t.empLaborBracket(formatNumber(insuredLabor))}
                  </span>
                </div>

                <div className={styles.subStatCard}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-text-sub">{t.empHealthLabel(1 + Math.min(3, dependents))}</span>
                    <span className="text-text-main font-bold">${formatNumber(empHealth)}</span>
                  </div>
                  <span className="text-xs text-text-sub">
                    {t.empHealthBracket(formatNumber(insuredHealth))}
                  </span>
                </div>

                <div className={styles.subStatCard}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-text-sub">{t.empPensionLabel(selfPensionRatio)}</span>
                    <span className="text-text-main font-bold">${formatNumber(empPension)}</span>
                  </div>
                  <span className="text-xs text-text-sub">
                    {t.empPensionBracket(formatNumber(insuredPension))}
                  </span>
                </div>

                <div className={styles.subStatCard}>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-semibold text-text-sub">{t.empTaxLabel}</span>
                    <span className="text-text-main font-bold">${formatNumber(empTax)}</span>
                  </div>
                  <span className="text-xs text-text-sub">
                    {taxMethod === 'none'
                      ? t.empTaxDescNone
                      : taxMethod === 'rate_5'
                      ? t.empTaxDesc5
                      : t.empTaxDescMatrix(taxDependents)}
                  </span>
                </div>
              </div>
            </div>

            {/* 板塊 2：雇主人力負擔成本 */}
            <div className={styles.panelCard}>
              <div className="flex justify-between items-center border-b border-border-glass pb-3">
                <h3 className="text-sm text-text-sub uppercase tracking-[1px] font-semibold">
                  {t.employerTotalCostTitle}
                </h3>
                <span className="text-base font-bold text-text-main font-mono">
                  ${formatNumber(emprTotalCost)} / Mo
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm font-mono max-sm:grid-cols-1">
                <div className={styles.subStatCard}>
                  <span className="text-sm font-semibold text-text-sub">{t.emprLaborLabel}</span>
                  <span className="text-text-main font-bold">${formatNumber(emprLabor)}</span>
                  <span className="text-xs text-text-sub">{t.bracketLabel(formatNumber(insuredLabor))}</span>
                </div>

                <div className={styles.subStatCard}>
                  <span className="text-sm font-semibold text-text-sub">{t.emprHealthLabel}</span>
                  <span className="text-text-main font-bold">${formatNumber(emprHealth)}</span>
                  <span className="text-xs text-text-sub">{t.bracketLabel(formatNumber(insuredHealth))}</span>
                </div>

                <div className={styles.subStatCard}>
                  <span className="text-sm font-semibold text-text-sub">{t.emprPensionLabel}</span>
                  <span className="text-text-main font-bold">${formatNumber(emprPension)}</span>
                  <span className="text-xs text-text-sub">{t.bracketLabel(formatNumber(insuredPension))}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection
            title={t.faqTitle}
            subtitle={t.faqSubtitle}
            items={t.faqItems}
            accentColor="#ff7300"
          />
        </div>
      </ToolLayout>

      {/* Toast 提示條 */}
      <div
        className={`${styles.toastBar} ${toast.show ? styles.toastShow : styles.toastHide}`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}

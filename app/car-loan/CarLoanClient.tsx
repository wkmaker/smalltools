'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './car-loan.module.css';

interface LoanRow {
  period: number;
  startBalance: number;
  principalPaid: number;
  interestPaid: number;
  totalPayment: number;
  endBalance: number;
  statusTag: string;
}

function formatNumber(val: number): string {
  if (isNaN(val) || val === 0) return '0';
  return Math.round(val).toLocaleString('zh-TW');
}

function calculateAPR(loanAmount: number, fee: number, payments: number[]): number {
  const netAmount = loanAmount - fee;
  if (netAmount <= 0 || payments.length === 0) return 0;

  let low = 0;
  let high = 2; // 月折現率上限 200%
  let mid = 0;

  for (let iter = 0; iter < 80; iter++) {
    mid = (low + high) / 2;
    let npv = -netAmount;
    for (let t = 0; t < payments.length; t++) {
      npv += payments[t] / Math.pow(1 + mid, t + 1);
    }
    if (npv > 0) {
      low = mid;
    } else {
      high = mid;
    }
  }

  return mid * 12 * 100;
}

interface Props {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: '汽車貸款試算器',
    subtitle: 'CAR LOAN CALCULATOR',
    description:
      '專業免費的線上汽車貸款計算機！支援車價與自備款成數連動、新車/中古車貸款、寬限期、階梯式低月付、氣球貸尾款與 APR 實質年利率評估。',
    langToggleLabel: 'English',
    langToggleUrl: '/car-loan/en/',
    schemeModeLabel: '還款方案模式',
    schemeStandard: '一般攤還',
    schemeGrace: '寬限期方案',
    schemeStepped: '階梯低月付',
    schemeBalloon: '氣球貸尾款',
    carPriceLabel: '新車/中古車 車價 (元)',
    downPaymentPctLabel: '頭期自備 (%)',
    downPaymentAmtLabel: '自備金額 (元)',
    loanAmountLabel: '申貸總額 (元)',
    interestRateLabel: '年利率 (%)',
    loanPeriodLabel: '貸款期限',
    yearUnit: '年',
    monthUnit: '月',
    repayMethodLabel: '攤還方式',
    repayEqualTotal: '本息均攤',
    repayEqualPrincipal: '本金均攤',
    feeLabel: '設定規費/手續費',
    gracePeriodLabel: '寬限期月數 (前息後本)',
    stepPaymentLabel: '前期超低月付金額 (元)',
    stepPeriodsLabel: '低月付期數 (月)',
    balloonAmountLabel: '氣球貸尾款保留金額 (元)',
    copyShareBtn: '複製試算分享連結',
    firstMonthPayment: '首期月付額',
    afterGracePayment: (amt: string) => `期滿後約 $${amt}`,
    aprLabel: '實質年利率 (APR)',
    aprSub: '含手續費攤提真實年利率',
    totalInterestLabel: '總利息支出',
    totalInterestSub: '車貸期間利息總和',
    totalPaymentLabel: '總還款金額',
    totalPaymentSub: '含本金、利息與規費',
    balanceTrendTitle: '車貸本金剩餘趨勢',
    scheduleTitle: '車貸還款明細表',
    colPeriod: '期數',
    colStartBal: '期初餘額',
    colPrincipal: '當期本金',
    colInterest: '當期利息',
    colTotal: '當期本息',
    colEndBal: '期末餘額',
    initialPeriod: '初始',
    periodText: (p: number) => `第 ${p} 期`,
    tagGrace: '寬限期',
    tagAmort: '攤還期',
    tagStep: '低月付期',
    tagNormal: '正常攤還',
    tagBalloon: '含尾款',
    toastCopied: '已複製試算分享連結到剪貼簿',
    negAmortWarning: '警告：前期月付金額低於每月利息，導致本金不減反增！',
    showingLimit: '僅展示前 120 期資料',
    unitY: '年',
    unitM: '月',
    unitCurrency: '元',

    // FAQ 常見問題
    faqTitle: '汽車貸款常見問題與還款指南 (FAQ)',
    faqSubtitle: '全方位掌握車貸利率試算、攤還方式差異、氣球貸尾款與提前結清等關鍵問題',
    faqItems: [
      {
        q: '汽車貸款常見的年利率是多少？新車與中古車（二手車）利率有何差異？',
        a: '汽車貸款利率主要依據「車輛新舊」、「借款人信用條件」與「承辦機構（銀行 vs 融資公司）」而定：\n\n① 新車貸款：\n通常利率最低，常態年利率約在 2.5% ~ 5% 之間。若搭配車商特定零利率或低利促銷，利率甚至可更低（但可能折抵車價折扣）。\n\n② 原車融資 / 二手中古車貸款：\n中古車因折舊與殘值風險較高，銀行利率約 4.5% ~ 9%，民間融資公司或中古車商配合之分期專案則約在 6% ~ 14% 不等。\n\n③ 信用與擔保影響：\n良好的個人聯徵信用評分、穩定的薪資收入證明或提供保證人，皆有助於爭取更優惠的核貸利率與成數。',
      },
      {
        q: '車貸還款方式「本息均攤」與「本金均攤」哪一種更划算？',
        a: '兩者計算原理與適合對象如下：\n\n① 本息平均攤還（本息均攤，最常見）：\n將整個貸款期間的本金與總利息加總後，平均分攤到每個月。每月還款金額固定不變，前期還款利息佔比較高、後期本金佔比較高。適合上班族與一般家庭編列固定每月收支預算。\n\n② 本金平均攤還（本金均攤）：\n將全部本金平均分攤到每期，利息則按剩餘本金逐期遞減計算。前期每月還款金額最高，隨後逐月減少。優點是「總利息支出低於本息均攤」，適合前期還款能力充裕、希望節省利息總額的借款人。',
      },
      {
        q: '什麼是「氣球貸（尾款保留）」與「階梯低月付」？有什麼隱藏風險？',
        a: '氣球貸與階梯低月付常見於進口車或新車銷售方案中，旨在降低買車初期的月繳門檻：\n\n① 氣球貸 (Balloon Payment)：\n將貸款金額的一部分（如 20%~30%）保留到最後一期作為「尾款」，前面期數僅攤還剩餘部分本金與利息。期滿時借款人必須「一次清償高額尾款」、「申請尾款再分期」或「將車輛售出折抵尾款」。\n\n② 階梯式低月付：\n在前 1~2 年提供超低月付額，期滿後恢復正常本息攤還，使後期的月付金額大幅跳升。\n\n③ 隱藏風險：\n此類方案雖然讓您在前期輕鬆交車，但因本金在前中期減少速度緩慢，導致「總利息支出明顯高於一般標準攤還」。若最後一期無力清償尾款或車輛中古殘值下跌，可能面臨二胎高利貸款或車輛遭查封拍賣之資金斷鏈風險。',
      },
      {
        q: '什麼是「實質年利率 (APR)」？為什麼車貸不能只看表面標示利率？',
        a: '實質年利率（APR, Annual Percentage Rate）是將貸款本金、表面年利率以及所有衍生手續費（如動保設定費、銀行開辦費、帳管費）納入內部報酬率公式進行折現攤提後計算出的「真實借款年化成本」。\n\n① 手續費對短天期或小額貸款影響巨大：\n例如借款 30 萬元、年利率 3.5%、貸款 3 年，表面看利率不高，但若加計 5,000 元設定費與手續費，實質 APR 會立即上升至約 4.6% 以上。\n\n② 比較方案最佳工具：\n比較不同銀行或車商方案時，以 APR 為統一比較基準，才能避免落入「低表面利率、高昂手續費」的數字盲區。',
      },
      {
        q: '什麼是「動保設定費」？為什麼辦理車貸都需要收取？',
        a: '動保設定費全稱為「車輛動產擔保設定登記規費」：\n\n① 法定擔保登記：\n當您向銀行或融資公司貸款買車時，債權人為保障債權，會向公路監理機關辦理動產抵押設定，防止車主在貸款未清償前擅自過戶或轉賣車輛。\n\n② 收費標準：\n監理所官方規費約為 900 ~ 1,200 元，但承貸金融機構通常會加上代辦作業手續費，市場常態收費約在 3,500 ~ 5,000 元之間，通常於撥款時內扣或於交車前一次性收取。',
      },
      {
        q: '車貸可以提前全部還清（提前結清）嗎？會有違約金嗎？',
        a: '車貸提前清償規定視各合約條款而定：\n\n① 綁約期限制：\n多數車貸合約會約定 12 ~ 20 個月不等的「限制清償期（綁約期）」。若在綁約期內提前大額還款或結清，金融機構會依剩餘本金收取 3% ~ 5% 的提前清償違約金。\n\n② 綁約期滿免違約金：\n超過綁約期後通常可隨時全額結清且免收違約金。結清後請務必向承辦機構索取「清償證明」與「抵押權塗銷同意書」，並前往監理機關辦理塗銷登記，車輛所有權才算完全解除抵押限制。',
      },
      {
        q: '本車貸計算機試算結果是否具備法律效力？（免責條款）',
        a: '本線上車貸試算工具所提供之月付金、總利息、攤還明細與 APR 數值，係依據標準金融複利數學模型進行理論估算，僅供消費者購車財務規劃與比較參考之用，不構成任何融資承諾或法律要約。\n\n實際核貸利率、最高可貸成數、手續費用、綁約期限、違約金條件與最終每月應繳金額，均以各承辦銀行、融資機構或車商金融部門依申請人信用狀況與車況審核之正式合約為準。',
      },
    ],
  },
  en: {
    title: 'Car Loan Calculator',
    subtitle: 'CAR LOAN CALCULATOR',
    description:
      'Professional free online auto loan calculator. Supports down payment link, new/used car loan, grace periods, stepped low payments, balloon payments, and APR solver.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/car-loan/',
    schemeModeLabel: 'Repayment Scheme',
    schemeStandard: 'Standard Amortization',
    schemeGrace: 'Grace Period',
    schemeStepped: 'Stepped Payments',
    schemeBalloon: 'Balloon Payment',
    carPriceLabel: 'Car Price ($)',
    downPaymentPctLabel: 'Down Payment (%)',
    downPaymentAmtLabel: 'Down Payment Amount ($)',
    loanAmountLabel: 'Loan Amount ($)',
    interestRateLabel: 'Annual Interest Rate (%)',
    loanPeriodLabel: 'Loan Term',
    yearUnit: 'Years',
    monthUnit: 'Months',
    repayMethodLabel: 'Repayment Method',
    repayEqualTotal: 'Equal Principal & Interest',
    repayEqualPrincipal: 'Equal Principal',
    feeLabel: 'Loan / Admin Fee ($)',
    gracePeriodLabel: 'Grace Period (Months)',
    stepPaymentLabel: 'Initial Low Monthly Payment ($)',
    stepPeriodsLabel: 'Low Payment Duration (Months)',
    balloonAmountLabel: 'Balloon Payment Amount ($)',
    copyShareBtn: 'Copy Shareable Link',
    firstMonthPayment: 'First Month Payment',
    afterGracePayment: (amt: string) => `After grace: $${amt}`,
    aprLabel: 'Effective APR',
    aprSub: 'True annual rate including fees',
    totalInterestLabel: 'Total Interest',
    totalInterestSub: 'Total interest over loan term',
    totalPaymentLabel: 'Total Payment',
    totalPaymentSub: 'Principal + Interest + Fees',
    balanceTrendTitle: 'Loan Balance Trend',
    scheduleTitle: 'Amortization Schedule',
    colPeriod: 'Period',
    colStartBal: 'Start Balance',
    colPrincipal: 'Principal',
    colInterest: 'Interest',
    colTotal: 'Payment',
    colEndBal: 'End Balance',
    initialPeriod: 'Initial',
    periodText: (p: number) => `Month ${p}`,
    tagGrace: 'Grace',
    tagAmort: 'Amortizing',
    tagStep: 'Low Pay',
    tagNormal: 'Normal',
    tagBalloon: 'Balloon',
    toastCopied: 'Shareable link copied to clipboard',
    negAmortWarning: 'Warning: Initial payment is lower than monthly interest. Loan balance will increase!',
    showingLimit: 'Showing first 120 periods',
    unitY: 'yr',
    unitM: 'mo',
    unitCurrency: '$',

    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Everything you need to know about auto loan rates, balloon payments, APR, and early payoff',
    faqItems: [
      {
        q: 'What is the typical interest rate for an auto loan, and how do new vs. used car loans differ?',
        a: 'Auto loan interest rates vary based on vehicle age, credit score, loan term, and the lender:\n\n① New Car Loans:\nTypically offer the lowest rates, generally ranging between 2.5% and 5.0% APR. Automakers may also offer promotional low APRs or dealer incentives.\n\n② Used Car / Refinance Loans:\nDue to vehicle depreciation and collateral risk, used car loan rates typically range from 4.5% to 12.0%+ depending on credit tier and vehicle mileage.\n\n③ Credit & Income Factors:\nA solid credit score, verifiable income history, and a lower debt-to-income (DTI) ratio significantly help in securing top-tier interest rates.',
      },
      {
        q: 'Which repayment method is better: Equal Monthly Payment (Amortization) or Equal Principal Payment?',
        a: 'The two repayment methods cater to different financial strategies:\n\n① Equal Principal and Interest (Standard Amortization):\nYour monthly payment remains constant throughout the loan term. Interest represents a larger portion of earlier payments and gradually declines. This makes monthly budgeting predictable and straightforward.\n\n② Equal Principal Payment:\nYou repay a fixed amount of principal each month, plus accrued interest on the remaining balance. Monthly payments start at their highest and decline over time. Total interest paid is lower, which suits borrowers who have higher initial cash flow and want to save on total interest.',
      },
      {
        q: 'What are Balloon Payments and Stepped Low Monthly Payments? What are the hidden risks?',
        a: 'These creative financing options are designed to lower upfront monthly payments for buyers:\n\n① Balloon Payment Structure:\nA significant portion of the principal (e.g. 20% to 30%) is deferred to the final payment. Monthly installments during the term are substantially lower, but the borrower must pay off the balloon lump sum, refinance it, or trade in the vehicle at maturity.\n\n② Stepped Low Payments:\nPayments are kept very low for the first 1 to 2 years, followed by sharp step-up increases in monthly installments for the remaining years.\n\n③ Associated Risks:\nBecause the principal is amortized much more slowly, total interest costs are substantially higher than standard loans. If vehicle market value depreciates faster than expected or if the borrower lacks funds for the balloon payment, refinancing at higher rates or repossession risks may arise.',
      },
      {
        q: 'What is Annual Percentage Rate (APR), and why should I look beyond the nominal interest rate?',
        a: 'Annual Percentage Rate (APR) reflects the true, all-in annualized cost of borrowing by factoring in the nominal interest rate along with mandatory fees (such as loan origination, vehicle mortgage registration, and documentation fees) amortized over the loan term.\n\n① Impact of Fixed Fees:\nOn shorter-term or smaller car loans, a $3,500 to $5,000 upfront fee can increase the effective borrowing cost by 1.0% to 2.0% above the advertised rate.\n\n② Accurate Comparison:\nComparing offers based on APR rather than nominal rates ensures an apples-to-apples evaluation without hidden fee surprises.',
      },
      {
        q: 'What is the Vehicle Mortgage Registration Fee (動保設定費)?',
        a: 'When financing a vehicle, the lender places a legal lien on the vehicle title registered with motor vehicle regulatory authorities to prevent unauthorized resale before loan completion.\n\nLenders and finance companies charge a one-time administrative and filing fee (typically around TWD 3,500 to 5,000 / USD 100 to 200) either deducted from the disbursed loan proceeds or billed at vehicle delivery.',
      },
      {
        q: 'Can I pay off my auto loan early, and is there a prepayment penalty?',
        a: 'Early repayment terms depend on your specific loan agreement:\n\n① Lock-in / Prepayment Penalty Period:\nMost auto loan contracts specify a lock-in window (typically 12 to 20 months). Settling the loan early within this period may incur a 3% to 5% penalty on the remaining principal.\n\n② Post-Lockout Settlement:\nOnce the lock-in period expires, you can typically pay off the remaining balance without penalties. After full payoff, obtain the official Release of Lien / Certificate of Settlement from your lender and cancel the vehicle registration lien.',
      },
      {
        q: "Is the car loan calculator's result legally binding? (Financial Disclaimer)",
        a: 'All monthly payments, total interest figures, amortization schedules, and APR computations generated by this tool are theoretical estimates based on standard compound interest formulas for budgeting and educational purposes only.\n\nFinal interest rates, maximum loan-to-value (LTV) limits, origination fees, prepayment terms, and approved payment schedules are subject to formal underwriting and contractual terms issued by your lending bank or licensed automotive finance company.',
      },
    ],
  },
};

export default function CarLoanClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  const [carPrice, setCarPrice] = useState<number | ''>(1000000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number | ''>(20);
  const [downPaymentAmount, setDownPaymentAmount] = useState<number | ''>(200000);
  const [loanAmount, setLoanAmount] = useState<number | ''>(800000);
  const [interestRate, setInterestRate] = useState<number | ''>(2.5);
  const [periodVal, setPeriodVal] = useState<number | ''>(5);
  const [periodUnit, setPeriodUnit] = useState<'year' | 'month'>('year');
  const [repayType, setRepayType] = useState<'equal-total' | 'equal-principal'>('equal-total');
  const [loanScheme, setLoanScheme] = useState<'standard' | 'grace' | 'stepped' | 'balloon'>('standard');
  const [fee, setFee] = useState<number | ''>(3500);

  // 條件方案欄位
  const [gracePeriod, setGracePeriod] = useState<number | ''>(12);
  const [stepPayment, setStepPayment] = useState<number | ''>(5000);
  const [stepPeriods, setStepPeriods] = useState<number | ''>(12);
  const [balloonAmount, setBalloonAmount] = useState<number | ''>(200000);

  // 運算結果
  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [afterSpecialPayment, setAfterSpecialPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalPayment, setTotalPayment] = useState<number>(0);
  const [apr, setApr] = useState<number>(0);
  const [isNegAmort, setIsNegAmort] = useState<boolean>(false);
  const [schedule, setSchedule] = useState<LoanRow[]>([]);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMountedRef = useRef<boolean>(false);

  const carPriceInputId = useId();
  const downPaymentPercentInputId = useId();
  const downPaymentAmountInputId = useId();
  const loanAmountInputId = useId();
  const interestRateInputId = useId();
  const periodValInputId = useId();
  const feeInputId = useId();
  const gracePeriodInputId = useId();
  const stepPaymentInputId = useId();
  const stepPeriodsInputId = useId();
  const balloonAmountInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(st => ({ ...st, show: false })), 2500);
  }, []);

  // 設定全頁背景主題色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff0055');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 0, 85, 0.6)');
  }, []);

  // 初次掛載：讀取 URL Query 參數進行狀態同步
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const searchParams = new URLSearchParams(window.location.search);
    const pPrice = searchParams.get('price');
    const pDpPct = searchParams.get('dpPct');
    const pDpAmt = searchParams.get('dpAmt');
    const pLoan = searchParams.get('loan');
    const pRate = searchParams.get('rate');
    const pPeriod = searchParams.get('period');
    const pUnit = searchParams.get('unit');
    const pScheme = searchParams.get('scheme');
    const pRepay = searchParams.get('repay');
    const pFee = searchParams.get('fee');
    const pGrace = searchParams.get('grace');
    const pStepPmt = searchParams.get('stepPmt');
    const pStepPer = searchParams.get('stepPer');
    const pBalloon = searchParams.get('balloon');

    if (pPrice && !isNaN(Number(pPrice))) {
      const priceVal = Number(pPrice);
      setCarPrice(priceVal);
      if (pDpAmt && !isNaN(Number(pDpAmt))) {
        setDownPaymentAmount(Number(pDpAmt));
      } else if (pDpPct && !isNaN(Number(pDpPct))) {
        const pct = Number(pDpPct);
        setDownPaymentPercent(pct);
        setDownPaymentAmount(Math.round(priceVal * (pct / 100)));
      }
      if (pLoan && !isNaN(Number(pLoan))) {
        setLoanAmount(Number(pLoan));
      }
    }
    if (pRate && !isNaN(Number(pRate))) setInterestRate(Number(pRate));
    if (pPeriod && !isNaN(Number(pPeriod))) setPeriodVal(Number(pPeriod));
    if (pUnit && (pUnit === 'year' || pUnit === 'month')) setPeriodUnit(pUnit);
    if (pScheme && ['standard', 'grace', 'stepped', 'balloon'].includes(pScheme)) setLoanScheme(pScheme as any);
    if (pRepay && (pRepay === 'equal-total' || pRepay === 'equal-principal')) setRepayType(pRepay as any);
    if (pFee && !isNaN(Number(pFee))) setFee(Number(pFee));
    if (pGrace && !isNaN(Number(pGrace))) setGracePeriod(Number(pGrace));
    if (pStepPmt && !isNaN(Number(pStepPmt))) setStepPayment(Number(pStepPmt));
    if (pStepPer && !isNaN(Number(pStepPer))) setStepPeriods(Number(pStepPer));
    if (pBalloon && !isNaN(Number(pBalloon))) setBalloonAmount(Number(pBalloon));

    isMountedRef.current = true;
  }, []);

  // 狀態變更時更新網址 (URL replaceState)
  useEffect(() => {
    if (!isMountedRef.current) return;
    const params = new URLSearchParams({
      price: carPrice.toString(),
      dpPct: downPaymentPercent.toString(),
      dpAmt: downPaymentAmount.toString(),
      loan: loanAmount.toString(),
      rate: interestRate.toString(),
      period: periodVal.toString(),
      unit: periodUnit,
      scheme: loanScheme,
      repay: repayType,
      fee: fee.toString(),
    });
    if (loanScheme === 'grace') params.set('grace', gracePeriod.toString());
    if (loanScheme === 'stepped') {
      params.set('stepPmt', stepPayment.toString());
      params.set('stepPer', stepPeriods.toString());
    }
    if (loanScheme === 'balloon') params.set('balloon', balloonAmount.toString());

    window.history.replaceState(null, '', `?${params.toString()}`);
  }, [
    carPrice,
    downPaymentPercent,
    downPaymentAmount,
    loanAmount,
    interestRate,
    periodVal,
    periodUnit,
    loanScheme,
    repayType,
    fee,
    gracePeriod,
    stepPayment,
    stepPeriods,
    balloonAmount,
  ]);

  // 車價與自備款連動處理
  const handleCarPriceChange = (val: number | '') => {
    setCarPrice(val);
    if (val === '') {
      setDownPaymentAmount('');
      setLoanAmount('');
      return;
    }
    const numPct = downPaymentPercent === '' ? 0 : downPaymentPercent;
    const newDpAmount = Math.round(val * (numPct / 100));
    setDownPaymentAmount(newDpAmount);
    setLoanAmount(Math.max(0, val - newDpAmount));
  };

  const handleDownPercentChange = (pct: number | '') => {
    if (pct === '') {
      setDownPaymentPercent('');
      return;
    }
    const validPct = Math.min(100, Math.max(0, pct));
    setDownPaymentPercent(validPct);
    const numCar = carPrice === '' ? 0 : carPrice;
    const newDpAmount = Math.round(numCar * (validPct / 100));
    setDownPaymentAmount(newDpAmount);
    setLoanAmount(Math.max(0, numCar - newDpAmount));
  };

  const handleDownAmountChange = (amt: number | '') => {
    setDownPaymentAmount(amt);
    if (amt === '') {
      setDownPaymentPercent('');
      return;
    }
    const numCar = carPrice === '' ? 0 : carPrice;
    const newPct = numCar > 0 ? (amt / numCar) * 100 : 0;
    setDownPaymentPercent(parseFloat(newPct.toFixed(1)));
    setLoanAmount(Math.max(0, numCar - amt));
  };

  const handleLoanAmountChange = (amt: number | '') => {
    setLoanAmount(amt);
    if (amt === '') {
      setDownPaymentAmount('');
      return;
    }
    const numCar = carPrice === '' ? 0 : carPrice;
    const newDpAmount = Math.max(0, numCar - amt);
    setDownPaymentAmount(newDpAmount);
    const newPct = numCar > 0 ? (newDpAmount / numCar) * 100 : 0;
    setDownPaymentPercent(parseFloat(newPct.toFixed(1)));
  };

  // 主計算邏輯
  const runCalculation = useCallback(() => {
    const numLoanAmount = loanAmount === '' ? 0 : loanAmount;
    const numPeriodVal = periodVal === '' ? 0 : periodVal;
    const numInterestRate = interestRate === '' ? 0 : interestRate;
    const numGracePeriod = gracePeriod === '' ? 0 : gracePeriod;
    const numStepPayment = stepPayment === '' ? 0 : stepPayment;
    const numStepPeriods = stepPeriods === '' ? 0 : stepPeriods;
    const numBalloonAmount = balloonAmount === '' ? 0 : balloonAmount;
    const numFee = fee === '' ? 0 : fee;

    const totalMonths = Math.max(0, periodUnit === 'year' ? numPeriodVal * 12 : numPeriodVal);
    if (totalMonths <= 0 || numLoanAmount <= 0) {
      setMonthlyPayment(0);
      setAfterSpecialPayment(0);
      setTotalInterest(0);
      setTotalPayment(0);
      setApr(0);
      setIsNegAmort(false);
      setSchedule([]);
      return;
    }

    const monthlyRate = numInterestRate / 100 / 12;
    const paymentArray: number[] = [];
    const rows: LoanRow[] = [];
    let remBalance = numLoanAmount;
    let interestSum = 0;
    let firstPay = 0;
    let afterPay = 0;
    let negAmortFlag = false;

    rows.push({
      period: 0,
      startBalance: 0,
      principalPaid: 0,
      interestPaid: 0,
      totalPayment: 0,
      endBalance: numLoanAmount,
      statusTag: '',
    });

    if (loanScheme === 'standard') {
      if (repayType === 'equal-total') {
        let pmt = 0;
        if (monthlyRate === 0) {
          pmt = numLoanAmount / totalMonths;
        } else {
          pmt = (numLoanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        }
        firstPay = pmt;

        for (let m = 1; m <= totalMonths; m++) {
          const start = remBalance;
          const interest = start * monthlyRate;
          const principal = pmt - interest;
          remBalance -= principal;
          if (m === totalMonths) remBalance = 0;

          interestSum += interest;
          paymentArray.push(pmt);
          rows.push({
            period: m,
            startBalance: start,
            principalPaid: principal,
            interestPaid: interest,
            totalPayment: pmt,
            endBalance: Math.max(0, remBalance),
            statusTag: '',
          });
        }
      } else {
        const principalPerMonth = numLoanAmount / totalMonths;
        for (let m = 1; m <= totalMonths; m++) {
          const start = remBalance;
          const interest = start * monthlyRate;
          const pmt = principalPerMonth + interest;
          remBalance -= principalPerMonth;
          if (m === totalMonths) remBalance = 0;

          if (m === 1) firstPay = pmt;
          interestSum += interest;
          paymentArray.push(pmt);
          rows.push({
            period: m,
            startBalance: start,
            principalPaid: principalPerMonth,
            interestPaid: interest,
            totalPayment: pmt,
            endBalance: Math.max(0, remBalance),
            statusTag: '',
          });
        }
      }
    } else if (loanScheme === 'grace') {
      const validGrace = totalMonths > 0 ? Math.max(0, Math.min(numGracePeriod, totalMonths - 1)) : 0;
      const remMonths = totalMonths - validGrace;

      for (let m = 1; m <= validGrace; m++) {
        const start = remBalance;
        const interest = start * monthlyRate;
        interestSum += interest;
        paymentArray.push(interest);
        rows.push({
          period: m,
          startBalance: start,
          principalPaid: 0,
          interestPaid: interest,
          totalPayment: interest,
          endBalance: remBalance,
          statusTag: t.tagGrace,
        });
      }

      firstPay = validGrace > 0 ? remBalance * monthlyRate : 0;

      let postPmt = 0;
      if (remMonths > 0) {
        if (repayType === 'equal-total') {
          if (monthlyRate === 0) {
            postPmt = remBalance / remMonths;
          } else {
            postPmt = (remBalance * (monthlyRate * Math.pow(1 + monthlyRate, remMonths))) / (Math.pow(1 + monthlyRate, remMonths) - 1);
          }
        }
      }
      afterPay = postPmt;

      const postPrincipalPerMonth = repayType === 'equal-principal' && remMonths > 0 ? remBalance / remMonths : 0;

      for (let m = validGrace + 1; m <= totalMonths; m++) {
        const start = remBalance;
        const interest = start * monthlyRate;
        let pmt = 0;
        let principal = 0;

        if (repayType === 'equal-total') {
          pmt = postPmt;
          principal = pmt - interest;
        } else {
          principal = postPrincipalPerMonth;
          pmt = principal + interest;
        }
        remBalance -= principal;
        if (m === totalMonths) remBalance = 0;

        interestSum += interest;
        paymentArray.push(pmt);
        rows.push({
          period: m,
          startBalance: start,
          principalPaid: principal,
          interestPaid: interest,
          totalPayment: pmt,
          endBalance: Math.max(0, remBalance),
          statusTag: t.tagAmort,
        });
      }
    } else if (loanScheme === 'stepped') {
      const validStepMonths = totalMonths > 0 ? Math.max(0, Math.min(numStepPeriods, totalMonths - 1)) : 0;
      const remMonths = totalMonths - validStepMonths;

      const firstMonthInterest = numLoanAmount * monthlyRate;
      if (numStepPayment < firstMonthInterest && validStepMonths > 0) {
        negAmortFlag = true;
      }

      for (let m = 1; m <= validStepMonths; m++) {
        const start = remBalance;
        const interest = start * monthlyRate;
        const pmt = numStepPayment;
        const principal = pmt - interest;
        remBalance -= principal;
        interestSum += interest;
        paymentArray.push(pmt);
        rows.push({
          period: m,
          startBalance: start,
          principalPaid: principal,
          interestPaid: interest,
          totalPayment: pmt,
          endBalance: Math.max(0, remBalance),
          statusTag: t.tagStep,
        });
      }

      firstPay = validStepMonths > 0 ? numStepPayment : 0;

      let postPmt = 0;
      if (remMonths > 0) {
        if (repayType === 'equal-total') {
          if (monthlyRate === 0) {
            postPmt = remBalance / remMonths;
          } else {
            postPmt = (remBalance * (monthlyRate * Math.pow(1 + monthlyRate, remMonths))) / (Math.pow(1 + monthlyRate, remMonths) - 1);
          }
        }
      }
      afterPay = postPmt;

      const postPrincipalPerMonth = repayType === 'equal-principal' && remMonths > 0 ? remBalance / remMonths : 0;

      for (let m = validStepMonths + 1; m <= totalMonths; m++) {
        const start = remBalance;
        const interest = start * monthlyRate;
        let pmt = 0;
        let principal = 0;

        if (repayType === 'equal-total') {
          pmt = postPmt;
          principal = pmt - interest;
        } else {
          principal = postPrincipalPerMonth;
          pmt = principal + interest;
        }
        remBalance -= principal;
        if (m === totalMonths) remBalance = 0;

        interestSum += interest;
        paymentArray.push(pmt);
        rows.push({
          period: m,
          startBalance: start,
          principalPaid: principal,
          interestPaid: interest,
          totalPayment: pmt,
          endBalance: Math.max(0, remBalance),
          statusTag: t.tagNormal,
        });
      }
    } else if (loanScheme === 'balloon') {
      const validBalloon = Math.min(numBalloonAmount, numLoanAmount);
      const amortizePrincipal = numLoanAmount - validBalloon;

      let pmt = 0;
      if (repayType === 'equal-total') {
        if (monthlyRate === 0) {
          pmt = amortizePrincipal / totalMonths;
        } else {
          pmt = (amortizePrincipal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
        }
      }

      const principalPerMonth = repayType === 'equal-principal' ? amortizePrincipal / totalMonths : 0;

      for (let m = 1; m <= totalMonths; m++) {
        const start = remBalance;
        const interest = start * monthlyRate;
        let curPmt = 0;
        let principal = 0;

        if (repayType === 'equal-total') {
          principal = pmt - (amortizePrincipal * monthlyRate);
          curPmt = pmt + (validBalloon * monthlyRate);
        } else {
          principal = principalPerMonth;
          curPmt = principal + interest;
        }

        if (m === totalMonths) {
          principal += validBalloon;
          curPmt += validBalloon;
        }

        remBalance -= principal;
        if (m === totalMonths) remBalance = 0;

        if (m === 1) firstPay = curPmt;
        interestSum += interest;
        paymentArray.push(curPmt);
        rows.push({
          period: m,
          startBalance: start,
          principalPaid: principal,
          interestPaid: interest,
          totalPayment: curPmt,
          endBalance: Math.max(0, remBalance),
          statusTag: m === totalMonths ? t.tagBalloon : '',
        });
      }
    }

    setMonthlyPayment(firstPay);
    setAfterSpecialPayment(afterPay);
    setTotalInterest(interestSum);
    setTotalPayment(numLoanAmount + interestSum + numFee);
    setIsNegAmort(negAmortFlag);
    setSchedule(rows);

    const calculatedApr = calculateAPR(numLoanAmount, numFee, paymentArray);
    setApr(calculatedApr);
  }, [carPrice, loanAmount, interestRate, periodVal, periodUnit, repayType, loanScheme, fee, gracePeriod, stepPayment, stepPeriods, balloonAmount, t]);

  useEffect(() => {
    runCalculation();
  }, [runCalculation]);

  // 繪製 Canvas 趨勢圖表 (Theme-Aware)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || schedule.length <= 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const isLight = document.documentElement.getAttribute('data-theme') === 'light';

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    ctx.clearRect(0, 0, width, height);

    const maxBal = Math.max(...schedule.map(r => r.endBalance), schedule[0]?.endBalance || 1);
    const points = schedule.map((row, idx) => ({
      x: (idx / (schedule.length - 1)) * (width - 60) + 40,
      y: height - 30 - (row.endBalance / maxBal) * (height - 60),
    }));

    // 漸層背景 (亮暗模式色調)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (isLight) {
      grad.addColorStop(0, 'rgba(220, 38, 38, 0.18)');
      grad.addColorStop(1, 'rgba(220, 38, 38, 0.02)');
    } else {
      grad.addColorStop(0, 'rgba(255, 0, 85, 0.35)');
      grad.addColorStop(1, 'rgba(255, 0, 85, 0.0)');
    }

    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.lineTo(points[points.length - 1].x, height - 30);
    ctx.lineTo(points[0].x, height - 30);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // 趨勢主線
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = isLight ? '#dc2626' : '#ff0055';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 網格座標
    ctx.strokeStyle = isLight ? 'rgba(203, 213, 225, 0.6)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();

    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('0', 35, height - 12);
    ctx.fillText(`${schedule.length - 1}`, width - 45, height - 12);
    ctx.fillText(`$${formatNumber(maxBal)}`, 5, 20);
  }, [schedule]);

  const copyShareLink = () => {
    const params = new URLSearchParams({
      price: carPrice.toString(),
      dpPct: downPaymentPercent.toString(),
      dpAmt: downPaymentAmount.toString(),
      loan: loanAmount.toString(),
      rate: interestRate.toString(),
      period: periodVal.toString(),
      unit: periodUnit,
      scheme: loanScheme,
      repay: repayType,
      fee: fee.toString(),
    });
    if (loanScheme === 'grace') params.set('grace', gracePeriod.toString());
    if (loanScheme === 'stepped') {
      params.set('stepPmt', stepPayment.toString());
      params.set('stepPer', stepPeriods.toString());
    }
    if (loanScheme === 'balloon') params.set('balloon', balloonAmount.toString());

    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    navigator.clipboard.writeText(url).then(() => showToast(t.toastCopied));
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#ff0055"
        accentGlow="rgba(255,0,85,0.6)"
        extraHeaderControls={
          <Link
            href={t.langToggleUrl}
            className="relative inline-flex items-center justify-center gap-1.5 h-[42px] px-3.5 text-xs font-semibold rounded-xl bg-white/[.06] border border-white/10 text-text-sub hover:text-text-main backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-[var(--theme-color,#ff0055)] hover:shadow-[0_0_12px_var(--theme-glow,rgba(255,0,85,0.4))] select-none"
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

        {/* 負攤還警示 Banner */}
        {isNegAmort && (
          <div className="mb-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-500 text-sm font-medium flex items-center gap-2">
            <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" className="shrink-0">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
            </svg>
            <span>{t.negAmortWarning}</span>
          </div>
        )}

        <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
          {/* 左欄：表單設定區 */}
          <div className={`${styles.glassCard} p-8 flex flex-col gap-6 shadow-lg`}>
            {/* 還款方案切換 */}
            <div className="flex flex-col gap-2">
              <span className="text-sm font-medium text-text-sub uppercase tracking-[1px]">{t.schemeModeLabel}</span>
              <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
                {([
                  { id: 'standard', label: t.schemeStandard },
                  { id: 'grace', label: t.schemeGrace },
                  { id: 'stepped', label: t.schemeStepped },
                  { id: 'balloon', label: t.schemeBalloon },
                ] as const).map(s => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setLoanScheme(s.id)}
                    className={`py-2.5 px-3 text-sm font-medium rounded-lg transition-all cursor-pointer border ${
                      loanScheme === s.id
                        ? styles.activeScheme
                        : 'bg-transparent border-transparent text-text-sub hover:text-text-main'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 車價與自備款 */}
            <div className={`flex flex-col gap-5 ${styles.divider} pt-5`}>
              <div className="flex flex-col gap-2">
                <label htmlFor={carPriceInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                  {t.carPriceLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={carPriceInputId}
                    type="text"
                    inputMode="numeric"
                    value={carPrice === '' ? '' : carPrice.toLocaleString('zh-TW')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      handleCarPriceChange(raw === '' ? '' : parseInt(raw, 10));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-12 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                  <span className="absolute right-4 text-xs text-text-sub">{t.unitCurrency}</span>
                </div>
              </div>

              {/* 自備款 (成數 + 金額) */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label htmlFor={downPaymentPercentInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                    {t.downPaymentPctLabel}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id={downPaymentPercentInputId}
                      type="number"
                      value={downPaymentPercent}
                      onChange={e => {
                        const val = e.target.value;
                        handleDownPercentChange(val === '' ? '' : parseFloat(val));
                      }}
                      className={`w-full ${styles.inputField} px-4 py-3 pr-10 rounded-xl text-base outline-none transition-all font-mono`}
                    />
                    <span className="absolute right-4 text-xs text-text-sub">%</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <label htmlFor={downPaymentAmountInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                    {t.downPaymentAmtLabel}
                  </label>
                  <div className="relative flex items-center">
                    <input
                      id={downPaymentAmountInputId}
                      type="text"
                      inputMode="numeric"
                      value={downPaymentAmount === '' ? '' : downPaymentAmount.toLocaleString('zh-TW')}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        handleDownAmountChange(raw === '' ? '' : parseInt(raw, 10));
                      }}
                      className={`w-full ${styles.inputField} px-4 py-3 pr-10 rounded-xl text-base outline-none transition-all font-mono`}
                    />
                    <span className="absolute right-4 text-xs text-text-sub">{t.unitCurrency}</span>
                  </div>
                </div>
              </div>

              {/* 實際貸款金額 */}
              <div className="flex flex-col gap-2">
                <label htmlFor={loanAmountInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                  {t.loanAmountLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={loanAmountInputId}
                    type="text"
                    inputMode="numeric"
                    value={loanAmount === '' ? '' : loanAmount.toLocaleString('zh-TW')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      handleLoanAmountChange(raw === '' ? '' : parseInt(raw, 10));
                    }}
                    className={`w-full ${styles.inputField} ${styles.accentText} font-bold px-4 py-3 pr-12 rounded-xl text-lg outline-none transition-all font-mono`}
                  />
                  <span className={`absolute right-4 text-xs ${styles.accentText}`}>{t.unitCurrency}</span>
                </div>
              </div>
            </div>

            {/* 利率與年期 */}
            <div className={`grid grid-cols-2 gap-4 ${styles.divider} pt-5`}>
              <div className="flex flex-col gap-2">
                <label htmlFor={interestRateInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                  {t.interestRateLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={interestRateInputId}
                    type="number"
                    step="0.1"
                    value={interestRate}
                    onChange={e => {
                      const val = e.target.value;
                      setInterestRate(val === '' ? '' : parseFloat(val));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-10 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                  <span className="absolute right-4 text-xs text-text-sub">%</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={periodValInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                  {t.loanPeriodLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={periodValInputId}
                    type="number"
                    value={periodVal}
                    onChange={e => {
                      const val = e.target.value;
                      setPeriodVal(val === '' ? '' : parseFloat(val));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-16 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                  <div className="absolute right-1 top-1 bottom-1 flex rounded-lg overflow-hidden border border-border-glass bg-surface-glass">
                    <button
                      type="button"
                      onClick={() => setPeriodUnit('year')}
                      className={`px-2 text-xs border-none cursor-pointer transition-colors ${periodUnit === 'year' ? styles.accentText + ' font-semibold' : 'text-text-sub'}`}
                    >
                      {t.unitY}
                    </button>
                    <button
                      type="button"
                      onClick={() => setPeriodUnit('month')}
                      className={`px-2 text-xs border-none cursor-pointer transition-colors ${periodUnit === 'month' ? styles.accentText + ' font-semibold' : 'text-text-sub'}`}
                    >
                      {t.unitM}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 本息/本金攤還模式與開辦費 */}
            <div className={`grid grid-cols-2 gap-4 ${styles.divider} pt-5`}>
              <div className="flex flex-col gap-2">
                <span className="text-sm font-medium text-text-sub uppercase tracking-[1px]">{t.repayMethodLabel}</span>
                <div className={`grid grid-cols-2 gap-1 ${styles.segmentGroup} p-1 rounded-xl`}>
                  <button
                    type="button"
                    onClick={() => setRepayType('equal-total')}
                    className={`py-2 text-sm font-medium rounded-lg cursor-pointer border ${
                      repayType === 'equal-total' ? styles.activeScheme : 'border-transparent text-text-sub hover:text-text-main'
                    }`}
                  >
                    {t.repayEqualTotal}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRepayType('equal-principal')}
                    className={`py-2 text-sm font-medium rounded-lg cursor-pointer border ${
                      repayType === 'equal-principal' ? styles.activeScheme : 'border-transparent text-text-sub hover:text-text-main'
                    }`}
                  >
                    {t.repayEqualPrincipal}
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={feeInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">
                  {t.feeLabel}
                </label>
                <div className="relative flex items-center">
                  <input
                    id={feeInputId}
                    type="text"
                    inputMode="numeric"
                    value={fee === '' ? '' : fee.toLocaleString('zh-TW')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setFee(raw === '' ? '' : parseInt(raw, 10));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-3 pr-12 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                  <span className="absolute right-4 text-xs text-text-sub">{t.unitCurrency}</span>
                </div>
              </div>
            </div>

            {/* 條件式方案延伸欄位 */}
            {loanScheme === 'grace' && (
              <div className="border-l-2 border-[var(--theme-color)] pl-4 flex flex-col gap-2 py-1">
                <label htmlFor={gracePeriodInputId} className={`text-sm font-medium ${styles.accentText} uppercase tracking-[1px]`}>
                  {t.gracePeriodLabel}
                </label>
                <input
                  id={gracePeriodInputId}
                  type="number"
                  value={gracePeriod}
                  onChange={e => {
                    const val = e.target.value;
                    setGracePeriod(val === '' ? '' : parseInt(val, 10));
                  }}
                  className={`w-full ${styles.inputField} px-4 py-2.5 rounded-xl text-base outline-none`}
                />
              </div>
            )}

            {loanScheme === 'stepped' && (
              <div className="border-l-2 border-[var(--theme-color)] pl-4 flex flex-col gap-3 py-1">
                <div className="flex flex-col gap-1">
                  <label htmlFor={stepPaymentInputId} className={`text-sm font-medium ${styles.accentText} uppercase tracking-[1px]`}>
                    {t.stepPaymentLabel}
                  </label>
                  <input
                    id={stepPaymentInputId}
                    type="text"
                    inputMode="numeric"
                    value={stepPayment === '' ? '' : stepPayment.toLocaleString('zh-TW')}
                    onChange={e => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setStepPayment(raw === '' ? '' : parseInt(raw, 10));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-2.5 rounded-xl text-base outline-none`}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label htmlFor={stepPeriodsInputId} className={`text-sm font-medium ${styles.accentText} uppercase tracking-[1px]`}>
                    {t.stepPeriodsLabel}
                  </label>
                  <input
                    id={stepPeriodsInputId}
                    type="number"
                    value={stepPeriods}
                    onChange={e => {
                      const val = e.target.value;
                      setStepPeriods(val === '' ? '' : parseInt(val, 10));
                    }}
                    className={`w-full ${styles.inputField} px-4 py-2.5 rounded-xl text-base outline-none`}
                  />
                </div>
              </div>
            )}

            {loanScheme === 'balloon' && (
              <div className="border-l-2 border-[var(--theme-color)] pl-4 flex flex-col gap-2 py-1">
                <label htmlFor={balloonAmountInputId} className={`text-sm font-medium ${styles.accentText} uppercase tracking-[1px]`}>
                  {t.balloonAmountLabel} <span className="text-[0.75rem] text-text-sub">({((((balloonAmount === '' ? 0 : balloonAmount) / ((loanAmount === '' ? 0 : loanAmount) || 1))) * 100).toFixed(1)}%)</span>
                </label>
                <input
                  id={balloonAmountInputId}
                  type="text"
                  inputMode="numeric"
                  value={balloonAmount === '' ? '' : balloonAmount.toLocaleString('zh-TW')}
                  onChange={e => {
                    const raw = e.target.value.replace(/[^\d]/g, '');
                    setBalloonAmount(raw === '' ? '' : parseInt(raw, 10));
                  }}
                  className={`w-full ${styles.inputField} px-4 py-2.5 rounded-xl text-base outline-none`}
                />
              </div>
            )}

            <button
              type="button"
              onClick={copyShareLink}
              className={`mt-2 w-full h-[44px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
                ${styles.activeScheme} rounded-xl transition-all duration-300 cursor-pointer`}
            >
              {t.copyShareBtn}
            </button>
          </div>

          {/* 右欄：試算結果面板 */}
          <div className="flex flex-col gap-6">
            {/* 四大指標看板 */}
            <div className="grid grid-cols-2 gap-4">
              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">{t.firstMonthPayment}</span>
                <span className={`font-mono text-2xl font-bold ${styles.accentText}`}>
                  ${formatNumber(monthlyPayment)}
                </span>
                {loanScheme === 'grace' && (
                  <span className="text-xs text-text-sub mt-1">{t.afterGracePayment(formatNumber(afterSpecialPayment))}</span>
                )}
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">{t.aprLabel}</span>
                <span className={`font-mono text-2xl font-bold ${styles.accentText}`}>
                  {apr.toFixed(2)} %
                </span>
                <span className="text-xs text-text-sub mt-1">{t.aprSub}</span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">{t.totalInterestLabel}</span>
                <span className={`font-mono text-xl font-bold ${styles.interestText}`}>
                  ${formatNumber(totalInterest)}
                </span>
                <span className="text-xs text-text-sub mt-1">{t.totalInterestSub}</span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px] mb-1">{t.totalPaymentLabel}</span>
                <span className="font-mono text-xl font-bold text-text-main">
                  ${formatNumber(totalPayment)}
                </span>
                <span className="text-xs text-text-sub mt-1">{t.totalPaymentSub}</span>
              </div>
            </div>

            {/* 本金剩餘趨勢圖表 (Canvas) */}
            <div className={`${styles.glassCard} p-5 flex flex-col gap-3`}>
              <span className="text-sm font-semibold text-text-sub uppercase tracking-[1px]">{t.balanceTrendTitle}</span>
              <div className="relative w-full h-[220px]">
                <canvas ref={canvasRef} className="w-full h-full block" />
              </div>
            </div>

            {/* 攤還明細表格 (Sticky Column) */}
            <div className={styles.tableContainer}>
              <h3 className="text-sm font-semibold text-text-main uppercase tracking-[1px] mb-4">{t.scheduleTitle}</h3>
              <table className="w-full text-right text-sm">
                <thead>
                  <tr className="border-b border-border-glass text-text-sub text-sm font-semibold">
                    <th className={`text-left p-2.5 ${styles.stickyPeriod}`}>{t.colPeriod}</th>
                    <th className="p-2.5">{t.colStartBal}</th>
                    <th className="p-2.5">{t.colPrincipal}</th>
                    <th className="p-2.5">{t.colInterest}</th>
                    <th className="p-2.5">{t.colTotal}</th>
                    <th className="p-2.5">{t.colEndBal}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-glass">
                  {schedule.slice(0, 120).map(row => (
                    <tr key={row.period} className="hover:bg-white/[.03] text-text-main transition-colors">
                      <td className={`text-left p-2.5 font-mono ${styles.stickyPeriod}`}>
                        {row.period === 0 ? t.initialPeriod : t.periodText(row.period)}
                        {row.statusTag && (
                          <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded ${styles.activeScheme} font-sans font-medium`}>
                            {row.statusTag}
                          </span>
                        )}
                      </td>
                      <td className="p-2.5 font-mono">${formatNumber(row.startBalance)}</td>
                      <td className="p-2.5 font-mono">${formatNumber(row.principalPaid)}</td>
                      <td className={`p-2.5 font-mono ${styles.interestText}`}>${formatNumber(row.interestPaid)}</td>
                      <td className={`p-2.5 font-mono font-semibold ${styles.accentText}`}>${formatNumber(row.totalPayment)}</td>
                      <td className="p-2.5 font-mono text-text-sub">${formatNumber(row.endBalance)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {schedule.length > 120 && (
                <div className="text-center text-xs text-text-sub mt-3">{t.showingLimit}</div>
              )}
            </div>
          </div>
        </div>

        {/* 常見問題 FAQ 區塊 */}
        <div className="mt-8">
          <FaqSection
            title={t.faqTitle}
            subtitle={t.faqSubtitle}
            items={t.faqItems}
            accentColor="#ff3b30"
          />
        </div>
      </ToolLayout>

      <div className={`fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 text-sm rounded-xl z-[100] pointer-events-none
        ${styles.activeScheme} backdrop-blur-[10px] shadow-2xl transition-all duration-400 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-[100px]'}`}>
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}

'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './mortgage-loan.module.css';

interface Stage {
  durationValue: number | '' | null;
  durationUnit: 'year' | 'month' | null;
  rate: number | '';
}

interface SingleLoanDetailRow {
  period: number;
  startBalance: number;
  principalPaid: number;
  interestPaid: number;
  totalPayment: number;
  endBalance: number;
}

interface CombinedDetailRow extends SingleLoanDetailRow {
  detail1?: SingleLoanDetailRow;
  detail2?: SingleLoanDetailRow;
}

interface Props {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: '房屋貸款試算器',
    subtitle: 'MORTGAGE LOAN CALCULATOR',
    description:
      '專業免費的線上房貸計算機！支援自備款與貸款成數雙向連動、單一與雙貸款組合模式 (如新青安+一般房貸)、多段式階梯利率、開辦費與 APR 實質年率試算。',
    langToggleLabel: 'English',
    langToggleUrl: '/mortgage-loan/en/',
    toastCopied: '已複製房貸試算分享連結到剪貼簿',
    housePriceLabel: '房屋總價 (萬元)',
    downPaymentPercentLabel: '自備款成數 (%)',
    downPaymentAmountLabel: '自備款金額 (萬元)',
    loanModeLabel: '貸款模式',
    totalLoanAmountLabel: '貸款總金額：',
    unitWan: '萬元',
    unitYuan: '元',
    unitYear: '年',
    unitMonth: '期',
    singleLoanMode: '單一貸款',
    combinedLoanMode: '組合貸款 (雙貸款 A+B)',
    loanTermLabel: '貸款期間 (年)',
    gracePeriodLabel: '寬限期 (年)',
    rateTypeLabel: '利率類型',
    singleRateMode: '單一利率',
    multiRateMode: '多段式階梯利率',
    annualRateLabel: '年利率 (%)',
    multiRateSettings: '多段式階梯利率設定',
    stagePrefix: '第 ',
    stageSuffix: ' 段',
    remainingPeriods: ' (剩餘期數)',
    untilExpiry: '直至期滿',
    addRateStage: '＋ 新增利率段落',
    remove: '移除',
    placeholderPeriod: '期間',
    placeholderRate: '利率',
    repayTypeLabel: '還款方式',
    equalTotal: '本息平均攤還',
    equalPrincipal: '本金平均攤還',
    originationFeeLabel: '開辦手續費 (元)',
    firstLoan: '第一筆貸款',
    secondLoan: '第二筆貸款',
    loanAmountLabel: '貸款金額 (萬元)',
    quick1000m: '1,000 萬 (如新青安)',
    allToA: '全部給 A',
    copyShareLink: '複製試算分享連結',
    firstMonthPayment: '首期每月還款額',
    aprTotalFeeRate: 'APR 總費用年率',
    totalInterestExpense: '總利息支出',
    totalRepaymentAmount: '總還款金額',
    trendChartTitle: '房貸展示本金遞減趨勢圖',
    remainingPrincipalLegend: '賸餘本金餘額',
    scheduleTableTitle: '房貸還款期數明細表',
    totalPeriodsText: (count: number) => `共 ${count} 期`,
    preview120Periods: '前 120 期預覽',
    expandAllPeriodsText: (count: number) => `展開全期明細 (${count} 期)`,
    collapseTo120: '收合為前 120 期',
    colPeriod: '期數',
    colStartBalance: '期初本金',
    colPrincipal: '當期本金',
    colInterest: '當期利息',
    colTotalPayment: '當期本息',
    colEndBalance: '期末本金',
    initialPeriod: '初始',
    periodText: (num: number) => `第 ${num} 期`,
    defaultLoanName1: '新青安房貸',
    defaultLoanName2: '一般商業房貸',

    // FAQ
    faqTitle: '常見問題與專業指南 (FAQ)',
    faqSubtitle: '全方位掌握房貸本息均攤、寬限期衝擊、新青安雙貸款組合與 APR 實質利率',
    faqItems: [
      {
        q: '「本息平均攤還」與「本金平均攤還」有何差異？哪一種還款方式比較划算？',
        a: '房貸常見的兩大還款方式計算原理與適用情境如下：\n\n① 本息平均攤還（最普及）：\n將整個貸款年限內的本金與總利息加總，平均分攤至每個月。每月還款金額固定不變，前期利息佔比較高、後期本金佔比較高。優點是每月支出固定，便於上班族與家庭編列穩定預算。\n\n② 本金平均攤還（省息首選）：\n將貸款本金平均分攤至每一期，利息則依剩餘本金按月計算。前期每月還款金額最高，隨後逐月遞減。總利息支出通常比本息均攤少約 15%~25%，適合前期還款能力充足、希望極大化節省利息的借款人。',
      },
      {
        q: '什麼是「房貸寬限期」？使用寬限期有哪些潛在風險？',
        a: '房貸寬限期是指在約定期限內（通常為 1~5 年），借款人「只繳利息、不還本金」的還款機制：\n\n① 適用優勢：\n寬限期間每月支出極低，適合購屋初期需要充裕現金流進行裝潢、添購家具或保留週轉金的買方。\n\n② 攤提壓縮風險：\n寬限期結束後，剩餘本金必須在「縮短的剩餘年限」內攤還完畢。例如 30 年房貸使用 5 年寬限期，第 6 年起必須在 25 年內攤還全部本金，每月還款金額可能瞬間暴增 40% ~ 70%，若未提前規劃收入現金流，容易引發繳款斷鏈危機。',
      },
      {
        q: '什麼是「多段式階梯利率」與「新青安房貸」組合貸款方案？',
        a: '階梯利率與政策組合貸款是台灣房貸市場常見的形式：\n\n① 多段式階梯利率：\n貸款期間分成 2 段或 3 段不同利率，常見為前期 1~2 年提供低利優惠吸引申辦，隨後各段依基準利率加碼逐步調升。\n\n② 組合貸款（如新青安 1,000 萬 + 一般房貸）：\n政府新青安貸款優惠額度上限為 1,000 萬元。若購屋總貸款額達 1,500 萬元，超出之 500 萬元需搭配承貸銀行的自營房貸專案。本計算機支援雙筆貸款獨立設定年限、寬限期與利率，精確計算合併月付負擔。',
      },
      {
        q: '什麼是「實質總費用年率 (APR)」？為什麼房貸不能只看表面利率？',
        a: '總費用年率（APR, Annual Percentage Rate）是將借款期間內的所有借貸成本納入折現計算出的真實年化負擔：\n\n① 包含相關規費與開辦費：\n包含銀行開辦手續費、徵信查詢費、帳管費及房屋鑑價設定費等前期支出。透過將前期固定費用攤提至各期還款現金流中，計算出實質年化利率。\n\n② 方案客觀比較：\n比較不同銀行的房貸專案時，以 APR 為統一標準，才能精確判斷「表面低利率但高額開辦費」與「表面利率略高但免手續費」哪一個更具成本效益。',
      },
      {
        q: '房貸成數與自備款一般如何估算？影響銀行核貸成數的關鍵因素有哪些？',
        a: '房貸成數與自備款通常依據銀行鑑價而非買賣合約價計算：\n\n① 一般成數標準：\n目前市場常態首購成數約為 7 ~ 8 成，購屋者需準備至少 2 ~ 3 成自備款，並預留約 30~50 萬元的契稅、印花稅、代書費、規費與裝修保證金。\n\n② 關鍵審核因素：\n包含房屋地段與屋齡、借款人聯徵信用分數、收支負債比（DTI 建議維持在 60% 以下）、在職公司規模與穩定財力證明，以及央行最新信用管制規定（如名下第二戶以上之成數限制）。',
      },
      {
        q: '房貸可以提前大額還款或提前結清嗎？會有違約金嗎？',
        a: '提前清償房貸之規定依各家銀行房貸合約而定：\n\n① 限制清償期（綁約期）：\n銀行常態綁約期約為 2 ~ 3 年。若在綁約期內提前大額還本或全額結清轉貸，銀行通常會依提前償還金額收取 0.5% ~ 1.5% 的提前清償違約金。\n\n② 滿期塗銷流程：\n綁約期滿後可隨時提前清償且免違約金。全額清償後，請向銀行申請「抵押權塗銷同意書」及「他項權利證明書」，並至地政事務所辦理抵押權塗銷登記。',
      },
      {
        q: '本房貸計算機試算結果是否具備法律效力？（免責條款聲明）',
        a: '本線上房屋貸款計算機所提供之各期月付額、本息攤還明細、利息總額與 APR 數值，均為依據標準金融複利數學公式所產出之理論估算結果，僅供消費者購屋財務規劃與比較參考，不構成任何融資承諾或法律要約。\n\n實際核貸金額、可貸成數、適用利率、寬限期年限、開辦手續費與最終每月繳款金額，均以各承貸銀行依申請人財務條件、信用評等與房屋鑑價審核之正式貸款合約為準。',
      },
    ],
  },
  en: {
    title: 'Mortgage Loan Calculator',
    subtitle: 'MORTGAGE LOAN CALCULATOR',
    description:
      'Free online mortgage loan calculator! Supports property price down payment sync, single and combined loan modes, grace periods, stepped rates, and APR solver.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/mortgage-loan/',
    toastCopied: 'Shareable link copied to clipboard',
    housePriceLabel: 'Home Price (10k TWD)',
    downPaymentPercentLabel: 'Down Payment (%)',
    downPaymentAmountLabel: 'Down Payment (10k TWD)',
    loanModeLabel: 'Loan Mode',
    totalLoanAmountLabel: 'Total Loan: ',
    unitWan: '10k TWD',
    unitYuan: 'TWD',
    unitYear: 'Yrs',
    unitMonth: 'm',
    singleLoanMode: 'Single Loan',
    combinedLoanMode: 'Combined Loans (A+B)',
    loanTermLabel: 'Loan Term (Years)',
    gracePeriodLabel: 'Grace Period (Years)',
    rateTypeLabel: 'Rate Type',
    singleRateMode: 'Single Rate',
    multiRateMode: 'Stepped Rates',
    annualRateLabel: 'Annual Rate (%)',
    multiRateSettings: 'Stepped Rate Settings',
    stagePrefix: 'Stage ',
    stageSuffix: '',
    remainingPeriods: ' (Remaining)',
    untilExpiry: 'Until Maturity',
    addRateStage: '+ Add Rate Stage',
    remove: 'Remove',
    placeholderPeriod: 'Term',
    placeholderRate: 'Rate',
    repayTypeLabel: 'Repayment Method',
    equalTotal: 'Equal Monthly (P+I)',
    equalPrincipal: 'Equal Principal',
    originationFeeLabel: 'Origination Fee (TWD)',
    firstLoan: 'Loan A',
    secondLoan: 'Loan B',
    loanAmountLabel: 'Loan Amount (10k TWD)',
    quick1000m: '10M (Govt Policy)',
    allToA: 'All to Loan A',
    copyShareLink: 'Copy Shareable Link',
    firstMonthPayment: '1st Month Payment',
    aprTotalFeeRate: 'APR (Annual Rate)',
    totalInterestExpense: 'Total Interest',
    totalRepaymentAmount: 'Total Repayment',
    trendChartTitle: 'Mortgage Balance Trend',
    remainingPrincipalLegend: 'Remaining Principal',
    scheduleTableTitle: 'Amortization Schedule',
    totalPeriodsText: (count: number) => `Total ${count} Periods`,
    preview120Periods: 'Preview First 120 Periods',
    expandAllPeriodsText: (count: number) => `Expand All (${count} Periods)`,
    collapseTo120: 'Collapse to 120 Periods',
    colPeriod: 'Period',
    colStartBalance: 'Start Balance',
    colPrincipal: 'Principal',
    colInterest: 'Interest',
    colTotalPayment: 'Total Payment',
    colEndBalance: 'End Balance',
    initialPeriod: 'Start',
    periodText: (num: number) => `Period ${num}`,
    defaultLoanName1: 'Policy Mortgage Loan',
    defaultLoanName2: 'Standard Bank Loan',

    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Everything you need to know about mortgage payments, grace periods, stepped rates, and APR',
    faqItems: [
      {
        q: 'What is the difference between Equal Monthly Payments (Amortization) and Equal Principal Payments?',
        a: 'The two primary mortgage repayment methods serve different financial goals:\n\n① Equal Principal and Interest (Standard Amortization):\nYour total monthly payment remains constant throughout the loan term. Earlier payments consist mostly of interest, while later payments consist primarily of principal. This predictability is ideal for salaried employees and families budgeting monthly income.\n\n② Equal Principal Payment:\nA fixed amount of principal is repaid every month, while interest declines as the remaining balance shrinks. Monthly payments start at their highest and decline each month. Total interest expense is typically 15% to 25% lower than equal amortization, making it suitable for borrowers with strong initial cash flow.',
      },
      {
        q: 'What is a Mortgage Grace Period, and what are the risks involved?',
        a: 'A mortgage grace period is an initial window (typically 1 to 5 years) during which the borrower only pays interest and no principal:\n\n① Key Advantages:\nSubstantially lowers monthly cash outflow during the initial period, helping buyers allocate funds for renovations, furniture, and moving expenses.\n\n② Compressed Amortization Risk:\nOnce the grace period ends, the entire principal balance must be repaid over a shortened remaining term. For example, on a 30-year mortgage with a 5-year grace period, principal must be fully amortized in the remaining 25 years, causing monthly payments from year 6 onward to surge by 40% to 70%.',
      },
      {
        q: 'What are Stepped Interest Rates and Combined Loan Schemes (e.g., Policy + Bank Loan)?',
        a: 'Stepped interest rates and blended loan structures are common in residential property financing:\n\n① Stepped Interest Rates:\nThe loan term is divided into multiple stages. Lenders often provide discounted lower rates for the first 1 to 2 years, with rates stepping up based on benchmark indexes in later stages.\n\n② Combined Loans (e.g., Policy Loan capped at 10M + Commercial Mortgage):\nGovernment-subsidized policy loans (such as Taiwan Young Adult First-Time Homebuyer Loans) are capped at 10 million TWD. If you require 15 million TWD, the extra 5 million TWD is financed under a standard bank mortgage. This calculator supports separate terms, grace periods, and rates for both loans.',
      },
      {
        q: 'What is Annual Percentage Rate (APR), and why should I look beyond nominal interest rates?',
        a: 'Annual Percentage Rate (APR) measures the comprehensive annual cost of borrowing by factoring in the nominal interest rate alongside all upfront fees:\n\n① Inclusion of Origination Fees:\nOrigination fees, appraisal fees, credit check fees, and documentation charges are discounted into the periodic cash flows to reveal the true annualized rate.\n\n② Objective Comparison:\nWhen comparing loan quotes across different financial institutions, APR provides an apples-to-apples metric to identify whether a low-rate offer with hefty upfront fees is actually more expensive than a zero-fee standard rate loan.',
      },
      {
        q: 'How are Loan-to-Value (LTV) ratios and down payments determined?',
        a: 'Lenders determine maximum loan amounts based on professional property appraisals rather than contract purchase prices:\n\n① Typical Down Payment Ratios:\nStandard residential homebuyer loans generally offer 70% to 80% LTV, requiring buyers to prepare 20% to 30% in down payment capital plus an additional 300,000 to 500,000 TWD for deed taxes, escrow fees, insurance, and notary costs.\n\n② Underwriting Criteria:\nKey determinants include property location and age, credit history, debt-to-income (DTI) ratio (ideally under 60%), employment stability, and central bank macroprudential mortgage regulations.',
      },
      {
        q: 'Can I pay off my mortgage early or make lump-sum prepayments? Are there penalty fees?',
        a: 'Prepayment terms depend on your specific mortgage contract:\n\n① Lock-in / Prepayment Penalty Period:\nMost mortgage agreements include a 2 to 3 year lock-in period. Refinancing or settling the entire balance during this period may incur a 0.5% to 1.5% penalty on the prepaid amount.\n\n② Post-Lockout Discharge:\nOnce the lock-in period expires, partial or full prepayments are fee-free. After complete payoff, obtain the official Mortgage Discharge Certificate from your lender and cancel the registered property lien with the local land registry office.',
      },
      {
        q: "Are the mortgage calculator's results legally binding? (Financial Disclaimer)",
        a: 'All monthly repayment amounts, amortization schedules, total interest costs, and APR calculations generated by this tool are theoretical estimates based on standard compound interest mathematics for personal financial planning only.\n\nFinal approved loan amounts, LTV caps, interest rates, grace period eligibility, origination fees, and monthly payment obligations are subject to formal underwriting and contractual approval issued by your lending institution.',
      },
    ],
  },
};

function calculateAPR(loanAmount: number, fee: number, payments: number[]): number {
  const netAmount = loanAmount - fee;
  if (netAmount <= 0 || payments.length === 0) return 0;

  let low = 0;
  let high = 2; // 月折現率上限設為 200%
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

function calculateSingleLoanDetail(
  loanAmount: number,
  periodVal: number,
  periodUnit: 'year' | 'month',
  graceVal: number,
  graceUnit: 'year' | 'month',
  rateType: 'single' | 'multi',
  singleRate: number,
  stageList: Stage[],
  repayType: 'equal-total' | 'equal-principal'
) {
  const totalMonths = Math.max(0, periodUnit === 'year' ? Math.round(periodVal * 12) : Math.round(periodVal));
  let graceMonths = Math.max(0, graceUnit === 'year' ? Math.round(graceVal * 12) : Math.round(graceVal));
  if (graceMonths > totalMonths) graceMonths = totalMonths;

  const stageRates: number[] = [];
  if (rateType === 'single') {
    for (let k = 0; k < totalMonths; k++) stageRates.push(singleRate);
  } else {
    let consumed = 0;
    for (let si = 0; si < stageList.length - 1; si++) {
      const s = stageList[si];
      const durationVal = s.durationValue === '' || s.durationValue === null ? 0 : s.durationValue;
      const sMonths = s.durationUnit === 'year' ? Math.round(durationVal * 12) : Math.round(durationVal);
      const sRate = s.rate === '' ? 0 : s.rate;
      for (let k = 0; k < sMonths; k++) {
        stageRates.push(sRate);
      }
      consumed += sMonths;
    }
    const lastStage = stageList[stageList.length - 1];
    const lastRate = lastStage && lastStage.rate !== '' ? lastStage.rate : 0;
    for (let k = consumed; k < totalMonths; k++) {
      stageRates.push(lastRate);
    }
  }

  const resultData: SingleLoanDetailRow[] = [];
  const paymentArray: number[] = [];
  let totalInterest = 0;

  resultData.push({
    period: 0,
    startBalance: 0,
    principalPaid: 0,
    interestPaid: 0,
    totalPayment: 0,
    endBalance: loanAmount,
  });

  if (totalMonths > 0 && loanAmount > 0) {
    let remainingBalance = loanAmount;
    const graceBal = loanAmount;
    const repayMonths = totalMonths - graceMonths;
    const principalPerMonth = repayMonths > 0 ? graceBal / repayMonths : 0;

    for (let m = 1; m <= totalMonths; m++) {
      const startBal = remainingBalance;
      const currentAnnualRate = stageRates[m - 1] !== undefined ? stageRates[m - 1] : 0;
      const r_m = currentAnnualRate / 100 / 12;

      let principalPaid = 0;
      let interestPaid = 0;
      let totalPayment = 0;

      if (m <= graceMonths) {
        interestPaid = startBal * r_m;
        principalPaid = 0;
        totalPayment = interestPaid;
        remainingBalance = startBal;
      } else {
        const activeRepayMonthsLeft = totalMonths - m + 1;
        if (repayType === 'equal-total') {
          if (r_m === 0) {
            totalPayment = startBal / activeRepayMonthsLeft;
          } else {
            totalPayment =
              (startBal * (r_m * Math.pow(1 + r_m, activeRepayMonthsLeft))) /
              (Math.pow(1 + r_m, activeRepayMonthsLeft) - 1);
          }
          interestPaid = startBal * r_m;
          principalPaid = totalPayment - interestPaid;
          remainingBalance = startBal - principalPaid;
        } else {
          principalPaid = principalPerMonth;
          interestPaid = startBal * r_m;
          totalPayment = principalPaid + interestPaid;
          remainingBalance = startBal - principalPaid;
        }
      }

      if (m === totalMonths) {
        remainingBalance = 0;
        principalPaid = startBal;
        totalPayment = principalPaid + interestPaid;
      }

      totalInterest += interestPaid;
      paymentArray.push(totalPayment);

      resultData.push({
        period: m,
        startBalance: startBal,
        principalPaid,
        interestPaid,
        totalPayment,
        endBalance: Math.max(0, remainingBalance),
      });
    }
  }

  return {
    totalMonths,
    graceMonths,
    totalInterest,
    paymentArray,
    resultData,
  };
}

export default function MortgageLoanClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];
  // 基礎連動參數 (單位：萬元)
  const [housePrice, setHousePrice] = useState<number | ''>(1500);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number | ''>(20);
  const [downPaymentAmount, setDownPaymentAmount] = useState<number | ''>(300);

  // 貸款模式
  const [loanMode, setLoanMode] = useState<'single' | 'combined'>('single');

  // 單一貸款設定
  const [singlePeriodVal, setSinglePeriodVal] = useState<number | ''>(30);
  const [singlePeriodUnit, setSinglePeriodUnit] = useState<'year' | 'month'>('year');
  const [singleGraceVal, setSingleGraceVal] = useState<number | ''>(3);
  const [singleGraceUnit, setSingleGraceUnit] = useState<'year' | 'month'>('year');
  const [singleRateType, setSingleRateType] = useState<'single' | 'multi'>('single');
  const [singleRate, setSingleRate] = useState<number | ''>(2.185);
  const [singleStages, setSingleStages] = useState<Stage[]>([
    { durationValue: 2, durationUnit: 'year', rate: 2.0 },
    { durationValue: 1, durationUnit: 'year', rate: 2.1 },
    { durationValue: null, durationUnit: null, rate: 2.25 },
  ]);
  const [singleRepayType, setSingleRepayType] = useState<'equal-total' | 'equal-principal'>('equal-total');
  const [singleFee, setSingleFee] = useState<number | ''>(5000);

  // 組合貸款設定 (貸款 A + 貸款 B)
  const [loanName1, setLoanName1] = useState<string>(t.defaultLoanName1);
  const [loanAmount1, setLoanAmount1] = useState<number | ''>(1000); // 萬元
  const [periodVal1, setPeriodVal1] = useState<number | ''>(40);
  const [periodUnit1, setPeriodUnit1] = useState<'year' | 'month'>('year');
  const [graceVal1, setGraceVal1] = useState<number | ''>(5);
  const [graceUnit1, setGraceUnit1] = useState<'year' | 'month'>('year');
  const [repayType1, setRepayType1] = useState<'equal-total' | 'equal-principal'>('equal-total');
  const [rateType1, setRateType1] = useState<'single' | 'multi'>('single');
  const [singleRate1, setSingleRate1] = useState<number | ''>(1.775);
  const [stages1, setStages1] = useState<Stage[]>([
    { durationValue: 3, durationUnit: 'year', rate: 1.775 },
    { durationValue: 2, durationUnit: 'year', rate: 2.15 },
    { durationValue: null, durationUnit: null, rate: 2.15 },
  ]);
  const [fee1, setFee1] = useState<number | ''>(3000);

  const [loanName2, setLoanName2] = useState<string>(t.defaultLoanName2);
  const [loanAmount2, setLoanAmount2] = useState<number | ''>(200); // 萬元
  const [periodVal2, setPeriodVal2] = useState<number | ''>(30);
  const [periodUnit2, setPeriodUnit2] = useState<'year' | 'month'>('year');
  const [graceVal2, setGraceVal2] = useState<number | ''>(3);
  const [graceUnit2, setGraceUnit2] = useState<'year' | 'month'>('year');
  const [repayType2, setRepayType2] = useState<'equal-total' | 'equal-principal'>('equal-total');
  const [rateType2, setRateType2] = useState<'single' | 'multi'>('single');
  const [singleRate2, setSingleRate2] = useState<number | ''>(2.185);
  const [stages2, setStages2] = useState<Stage[]>([
    { durationValue: 2, durationUnit: 'year', rate: 2.185 },
    { durationValue: 1, durationUnit: 'year', rate: 2.25 },
    { durationValue: null, durationUnit: null, rate: 2.25 },
  ]);
  const [fee2, setFee2] = useState<number | ''>(3000);

  // 運算結果狀態
  const [totalLoan, setTotalLoan] = useState<number>(1200); // 萬元
  const [firstPayment, setFirstPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [totalRepay, setTotalRepay] = useState<number>(0);
  const [aprRate, setAprRate] = useState<number>(0);
  const [schedule, setSchedule] = useState<CombinedDetailRow[]>([]);
  const [showAllRows, setShowAllRows] = useState<boolean>(false);

  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const priceInputId = useId();
  const percentInputId = useId();
  const downInputId = useId();
  const singlePeriodInputId = useId();
  const singleGraceInputId = useId();
  const singleRateInputId = useId();
  const singleFeeInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  const isMountedRef = useRef<boolean>(false);

  // 全頁背景 Theme 設定
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);

  // 初次掛載：讀取 URL Query 參數進行狀態同步
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const pHp = params.get('hp') || params.get('p');
    const pDp = params.get('dp');
    const pDa = params.get('da');
    const pM = params.get('m');
    const pSp = params.get('sp');
    const pSg = params.get('sg');
    const pSr = params.get('sr');
    const pSf = params.get('sf');

    if (pHp !== null && !isNaN(Number(pHp))) setHousePrice(Math.max(0, Number(pHp)));
    if (pDp !== null && !isNaN(Number(pDp))) setDownPaymentPercent(Math.max(0, Number(pDp)));
    if (pDa !== null && !isNaN(Number(pDa))) setDownPaymentAmount(Math.max(0, Number(pDa)));
    if (pM === 'single' || pM === 'combined') setLoanMode(pM);
    if (pSp !== null && !isNaN(Number(pSp))) setSinglePeriodVal(Math.max(1, Number(pSp)));
    if (pSg !== null && !isNaN(Number(pSg))) setSingleGraceVal(Math.max(0, Number(pSg)));
    if (pSr !== null && !isNaN(Number(pSr))) setSingleRate(Math.max(0, Number(pSr)));
    if (pSf !== null && !isNaN(Number(pSf))) setSingleFee(Math.max(0, Number(pSf)));

    isMountedRef.current = true;
  }, []);

  // 狀態變更時更新網址 (URL replaceState)
  useEffect(() => {
    if (!isMountedRef.current) return;
    const timer = setTimeout(() => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams();
      if (housePrice !== '') params.set('hp', housePrice.toString());
      if (downPaymentPercent !== '') params.set('dp', downPaymentPercent.toString());
      if (downPaymentAmount !== '') params.set('da', downPaymentAmount.toString());
      params.set('m', loanMode);
      if (singlePeriodVal !== '') params.set('sp', singlePeriodVal.toString());
      if (singleGraceVal !== '') params.set('sg', singleGraceVal.toString());
      if (singleRate !== '') params.set('sr', singleRate.toString());
      if (singleFee !== '') params.set('sf', singleFee.toString());

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }, 300);

    return () => clearTimeout(timer);
  }, [housePrice, downPaymentPercent, downPaymentAmount, loanMode, singlePeriodVal, singleGraceVal, singleRate, singleFee]);

  // 房屋總價變更處理
  const handlePriceChange = (valStr: string) => {
    if (valStr === '') {
      setHousePrice('');
      return;
    }
    const hp = parseFloat(valStr) || 0;
    setHousePrice(hp);

    const pct = downPaymentPercent === '' ? 0 : downPaymentPercent;
    const newDownAmt = Math.round((hp * pct) / 100);
    setDownPaymentAmount(newDownAmt);

    const newLoan = Math.max(0, hp - newDownAmt);
    setTotalLoan(newLoan);

    if (loanMode === 'combined') {
      const loanA = Math.min(newLoan, 1000);
      setLoanAmount1(loanA);
      setLoanAmount2(Math.max(0, newLoan - loanA));
    }
  };

  // 自備款成數變更處理
  const handlePercentChange = (valStr: string) => {
    if (valStr === '') {
      setDownPaymentPercent('');
      return;
    }
    const pct = parseFloat(valStr) || 0;
    setDownPaymentPercent(pct);

    const hp = housePrice === '' ? 0 : housePrice;
    const newDownAmt = Math.round((hp * pct) / 100);
    setDownPaymentAmount(newDownAmt);

    const newLoan = Math.max(0, hp - newDownAmt);
    setTotalLoan(newLoan);

    if (loanMode === 'combined') {
      const loanA = Math.min(newLoan, 1000);
      setLoanAmount1(loanA);
      setLoanAmount2(Math.max(0, newLoan - loanA));
    }
  };

  // 自備款金額變更處理
  const handleDownAmountChange = (valStr: string) => {
    if (valStr === '') {
      setDownPaymentAmount('');
      return;
    }
    const downAmt = parseFloat(valStr) || 0;
    setDownPaymentAmount(downAmt);

    const hp = housePrice === '' ? 0 : housePrice;
    const newPct = hp > 0 ? parseFloat(((downAmt / hp) * 100).toFixed(2)) : 0;
    setDownPaymentPercent(newPct);

    const newLoan = Math.max(0, hp - downAmt);
    setTotalLoan(newLoan);

    if (loanMode === 'combined') {
      const loanA = Math.min(newLoan, 1000);
      setLoanAmount1(loanA);
      setLoanAmount2(Math.max(0, newLoan - loanA));
    }
  };

  // 快捷設置貸款 A 金額
  const setLoanAQuickValue = (val: number | null) => {
    if (val === null) {
      setLoanAmount1(totalLoan);
      setLoanAmount2(0);
    } else {
      const amtA = Math.min(val, totalLoan);
      setLoanAmount1(amtA);
      setLoanAmount2(Math.max(0, totalLoan - amtA));
    }
  };

  // 階梯利率新增與刪除
  const addStageSingle = () => {
    if (singleStages.length >= 6) return;
    const next = [...singleStages];
    next.splice(next.length - 1, 0, { durationValue: 1, durationUnit: 'year', rate: 2.1 });
    setSingleStages(next);
  };

  const removeStageSingle = (idx: number) => {
    if (singleStages.length <= 2) return;
    const next = singleStages.filter((_, i) => i !== idx);
    setSingleStages(next);
  };

  const addStage1 = () => {
    if (stages1.length >= 6) return;
    const next =
      stages1.length < 2
        ? [
            { durationValue: 3, durationUnit: 'year' as const, rate: 1.775 },
            { durationValue: null, durationUnit: null, rate: 2.15 },
          ]
        : [...stages1];
    next.splice(next.length - 1, 0, { durationValue: 1, durationUnit: 'year', rate: 1.775 });
    setStages1(next);
  };

  const removeStage1 = (idx: number) => {
    if (stages1.length <= 2) return;
    const next = stages1.filter((_, i) => i !== idx);
    setStages1(next);
  };

  const handleRateType1Change = (type: 'single' | 'multi') => {
    setRateType1(type);
    if (type === 'multi' && stages1.length < 2) {
      setStages1([
        { durationValue: 3, durationUnit: 'year', rate: typeof singleRate1 === 'number' ? singleRate1 : 1.775 },
        { durationValue: 2, durationUnit: 'year', rate: 2.15 },
        { durationValue: null, durationUnit: null, rate: 2.15 },
      ]);
    }
  };

  const addStage2 = () => {
    if (stages2.length >= 6) return;
    const next =
      stages2.length < 2
        ? [
            { durationValue: 2, durationUnit: 'year' as const, rate: 2.185 },
            { durationValue: null, durationUnit: null, rate: 2.25 },
          ]
        : [...stages2];
    next.splice(next.length - 1, 0, { durationValue: 1, durationUnit: 'year', rate: 2.185 });
    setStages2(next);
  };

  const removeStage2 = (idx: number) => {
    if (stages2.length <= 2) return;
    const next = stages2.filter((_, i) => i !== idx);
    setStages2(next);
  };

  const handleRateType2Change = (type: 'single' | 'multi') => {
    setRateType2(type);
    if (type === 'multi' && stages2.length < 2) {
      setStages2([
        { durationValue: 2, durationUnit: 'year', rate: typeof singleRate2 === 'number' ? singleRate2 : 2.185 },
        { durationValue: 1, durationUnit: 'year', rate: 2.25 },
        { durationValue: null, durationUnit: null, rate: 2.25 },
      ]);
    }
  };

  // 房貸核心試算邏輯
  const calculateLoan = useCallback(() => {
    const hp = housePrice === '' ? 0 : housePrice;
    const dpAmt = downPaymentAmount === '' ? 0 : downPaymentAmount;
    const currentTotalLoanAmt = Math.max(0, (hp - dpAmt) * 10000);

    if (currentTotalLoanAmt <= 0) {
      setFirstPayment(0);
      setTotalInterest(0);
      setTotalRepay(0);
      setAprRate(0);
      setSchedule([]);
      return;
    }

    if (loanMode === 'single') {
      const periodV = singlePeriodVal === '' ? 0 : singlePeriodVal;
      const graceV = singleGraceVal === '' ? 0 : singleGraceVal;
      const sRate = singleRate === '' ? 0 : singleRate;
      const sFee = singleFee === '' ? 0 : singleFee;

      const calcResult = calculateSingleLoanDetail(
        currentTotalLoanAmt,
        periodV,
        singlePeriodUnit,
        graceV,
        singleGraceUnit,
        singleRateType,
        sRate,
        singleStages,
        singleRepayType
      );

      const firstP = calcResult.resultData[1]?.totalPayment || 0;
      setFirstPayment(firstP);
      setTotalInterest(calcResult.totalInterest);
      setTotalRepay(currentTotalLoanAmt + calcResult.totalInterest + sFee);

      const apr = calculateAPR(currentTotalLoanAmt, sFee, calcResult.paymentArray);
      setAprRate(parseFloat(apr.toFixed(2)));

      setSchedule(calcResult.resultData);
    } else {
      const lAmt1 = (loanAmount1 === '' ? 0 : loanAmount1) * 10000;
      const lAmt2 = (loanAmount2 === '' ? 0 : loanAmount2) * 10000;

      const pVal1 = periodVal1 === '' ? 0 : periodVal1;
      const gVal1 = graceVal1 === '' ? 0 : graceVal1;
      const rRate1 = singleRate1 === '' ? 0 : singleRate1;
      const f1 = fee1 === '' ? 0 : fee1;

      const pVal2 = periodVal2 === '' ? 0 : periodVal2;
      const gVal2 = graceVal2 === '' ? 0 : graceVal2;
      const rRate2 = singleRate2 === '' ? 0 : singleRate2;
      const f2 = fee2 === '' ? 0 : fee2;

      const calc1 = calculateSingleLoanDetail(
        lAmt1,
        pVal1,
        periodUnit1,
        gVal1,
        graceUnit1,
        rateType1,
        rRate1,
        stages1,
        repayType1
      );

      const calc2 = calculateSingleLoanDetail(
        lAmt2,
        pVal2,
        periodUnit2,
        gVal2,
        graceUnit2,
        rateType2,
        rRate2,
        stages2,
        repayType2
      );

      const maxMonths = Math.max(calc1.totalMonths, calc2.totalMonths);
      const combinedRows: CombinedDetailRow[] = [];
      const combinedPayments: number[] = [];

      for (let m = 0; m <= maxMonths; m++) {
        const d1 = calc1.resultData[m] || {
          period: m,
          startBalance: 0,
          principalPaid: 0,
          interestPaid: 0,
          totalPayment: 0,
          endBalance: 0,
        };
        const d2 = calc2.resultData[m] || {
          period: m,
          startBalance: 0,
          principalPaid: 0,
          interestPaid: 0,
          totalPayment: 0,
          endBalance: 0,
        };

        const totalPmt = d1.totalPayment + d2.totalPayment;
        if (m > 0) combinedPayments.push(totalPmt);

        combinedRows.push({
          period: m,
          startBalance: d1.startBalance + d2.startBalance,
          principalPaid: d1.principalPaid + d2.principalPaid,
          interestPaid: d1.interestPaid + d2.interestPaid,
          totalPayment: totalPmt,
          endBalance: d1.endBalance + d2.endBalance,
          detail1: d1,
          detail2: d2,
        });
      }

      const firstP = combinedRows[1]?.totalPayment || 0;
      const combinedTotalInterest = calc1.totalInterest + calc2.totalInterest;
      const combinedFee = f1 + f2;

      setFirstPayment(firstP);
      setTotalInterest(combinedTotalInterest);
      setTotalRepay(currentTotalLoanAmt + combinedTotalInterest + combinedFee);

      const apr = calculateAPR(currentTotalLoanAmt, combinedFee, combinedPayments);
      setAprRate(parseFloat(apr.toFixed(2)));

      setSchedule(combinedRows);
    }
  }, [
    housePrice,
    downPaymentAmount,
    loanMode,
    singlePeriodVal,
    singlePeriodUnit,
    singleGraceVal,
    singleGraceUnit,
    singleRateType,
    singleRate,
    singleStages,
    singleRepayType,
    singleFee,
    loanAmount1,
    periodVal1,
    periodUnit1,
    graceVal1,
    graceUnit1,
    repayType1,
    rateType1,
    singleRate1,
    stages1,
    fee1,
    loanAmount2,
    periodVal2,
    periodUnit2,
    graceVal2,
    graceUnit2,
    repayType2,
    rateType2,
    singleRate2,
    stages2,
    fee2,
  ]);

  useEffect(() => {
    calculateLoan();
  }, [calculateLoan]);

  // 繪製 HTML5 Canvas 房貸餘額遞減趨勢圖 (Theme-Aware)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || schedule.length === 0) return;
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

    const maxVal = schedule[0]?.endBalance || 1;
    const points = schedule.map((row, idx) => ({
      x: (idx / (schedule.length - 1)) * (width - 60) + 40,
      y: height - 30 - (row.endBalance / maxVal) * (height - 60),
    }));

    // 漸層背景 (亮暗雙模式)
    const grad = ctx.createLinearGradient(0, 0, 0, height);
    if (isLight) {
      grad.addColorStop(0, 'rgba(5, 150, 105, 0.18)');
      grad.addColorStop(1, 'rgba(5, 150, 105, 0.02)');
    } else {
      grad.addColorStop(0, 'rgba(0, 245, 160, 0.3)');
      grad.addColorStop(1, 'rgba(0, 245, 160, 0.02)');
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

    // 賸餘本金折線
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = isLight ? '#059669' : '#00f5a0';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // X/Y 軸刻度
    ctx.strokeStyle = isLight ? 'rgba(203, 213, 225, 0.6)' : 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();

    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('初始', 35, height - 12);
    ctx.fillText(`第 ${schedule.length - 1} 期`, width - 50, height - 12);
    ctx.fillText(`$${Math.round(maxVal).toLocaleString('zh-TW')}元`, 5, 20);
  }, [schedule]);

  // 複製試算分享連結
  const copyShareLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => showToast(t.toastCopied));
  };

  const visibleSchedule = showAllRows ? schedule : schedule.slice(0, 121);

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

        <div className="grid grid-cols-[1.1fr_1.9fr] gap-10 items-start text-left max-[1024px]:grid-cols-1 max-[1024px]:gap-8">
          {/* 左欄：表單設定區 */}
          <div className={`${styles.glassCard} p-8 flex flex-col gap-6 shadow-lg`}>
            {/* 房屋總價 */}
            <div className="flex flex-col gap-2">
              <label htmlFor={priceInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.housePriceLabel}</label>
              <input
                id={priceInputId}
                type="number"
                value={housePrice}
                onChange={e => handlePriceChange(e.target.value)}
                className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
              />
            </div>

            {/* 自備款成數 & 金額 雙向連動 */}
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label htmlFor={percentInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.downPaymentPercentLabel}</label>
                <input
                  id={percentInputId}
                  type="number"
                  step="0.5"
                  value={downPaymentPercent}
                  onChange={e => handlePercentChange(e.target.value)}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={downInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.downPaymentAmountLabel}</label>
                <input
                  id={downInputId}
                  type="number"
                  value={downPaymentAmount}
                  onChange={e => handleDownAmountChange(e.target.value)}
                  className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                />
              </div>
            </div>

            {/* 貸款模式切換 */}
            <div className={`flex flex-col gap-2 ${styles.divider} pt-4`}>
              <div className="flex justify-between items-center">
                <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.loanModeLabel}</span>
                <span className={`text-sm font-semibold font-mono ${styles.accentText}`}>
                  {t.totalLoanAmountLabel}{totalLoan.toLocaleString('zh-TW')} {t.unitWan}
                </span>
              </div>
              <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
                <button
                  type="button"
                  onClick={() => setLoanMode('single')}
                  className={`py-2 text-sm rounded-xl cursor-pointer transition-all border ${
                    loanMode === 'single'
                      ? styles.activeScheme
                      : 'border-transparent text-text-sub hover:text-text-main'
                  }`}
                >
                  {t.singleLoanMode}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setLoanMode('combined');
                    const loanA = Math.min(totalLoan, 1000);
                    setLoanAmount1(loanA);
                    setLoanAmount2(Math.max(0, totalLoan - loanA));
                  }}
                  className={`py-2 text-sm rounded-xl cursor-pointer transition-all border ${
                    loanMode === 'combined'
                      ? styles.activeScheme
                      : 'border-transparent text-text-sub hover:text-text-main'
                  }`}
                >
                  {t.combinedLoanMode}
                </button>
              </div>
            </div>

            {/* ====== 單一貸款模式設定 ====== */}
            {loanMode === 'single' && (
              <div className={`flex flex-col gap-5 ${styles.divider} pt-5`}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <label htmlFor={singlePeriodInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.loanTermLabel}</label>
                    <input
                      id={singlePeriodInputId}
                      type="number"
                      value={singlePeriodVal}
                      onChange={e => setSinglePeriodVal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                      className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label htmlFor={singleGraceInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.gracePeriodLabel}</label>
                    <input
                      id={singleGraceInputId}
                      type="number"
                      value={singleGraceVal}
                      onChange={e => setSingleGraceVal(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                      className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                    />
                  </div>
                </div>

                {/* 利率類型 */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.rateTypeLabel}</span>
                  <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
                    <button
                      type="button"
                      onClick={() => setSingleRateType('single')}
                      className={`py-2 text-sm font-semibold rounded-xl cursor-pointer border ${
                        singleRateType === 'single'
                          ? styles.activeScheme
                          : 'border-transparent text-text-sub hover:text-text-main'
                      }`}
                    >
                      {t.singleRateMode}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleRateType('multi')}
                      className={`py-2 text-sm font-semibold rounded-xl cursor-pointer border ${
                        singleRateType === 'multi'
                          ? styles.activeScheme
                          : 'border-transparent text-text-sub hover:text-text-main'
                      }`}
                    >
                      {t.multiRateMode}
                    </button>
                  </div>
                </div>

                {singleRateType === 'single' ? (
                  <div className="flex flex-col gap-2">
                    <label htmlFor={singleRateInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">{t.annualRateLabel}</label>
                    <input
                      id={singleRateInputId}
                      type="number"
                      step="0.01"
                      value={singleRate}
                      onChange={e => setSingleRate(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                    />
                  </div>
                ) : (
                  <div className={`flex flex-col gap-3 ${styles.subCard} p-4 rounded-xl`}>
                    <span className={`text-xs ${styles.accentText} font-medium`}>{t.multiRateSettings}</span>
                    {singleStages.map((stg, sIdx) => {
                      const isLast = sIdx === singleStages.length - 1;
                      return (
                        <div key={sIdx} className={`flex flex-col gap-2 ${styles.divider} pb-3`}>
                          <div className="flex justify-between items-center text-sm font-medium text-text-sub">
                            <span>{isLast ? `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}${t.remainingPeriods}` : `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}`}</span>
                            {!isLast && singleStages.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeStageSingle(sIdx)}
                                className="text-[0.75rem] text-[#ef4444] hover:underline cursor-pointer"
                              >
                                {t.remove}
                              </button>
                            )}
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            {!isLast ? (
                              <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                                <input
                                  type="number"
                                  placeholder={t.placeholderPeriod}
                                  value={stg.durationValue ?? ''}
                                  onChange={e => {
                                    const next = [...singleStages];
                                    next[sIdx].durationValue = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                    setSingleStages(next);
                                  }}
                                  className="w-full bg-transparent text-text-main text-xs py-2 outline-none font-mono"
                                />
                                <span className="text-sm text-text-sub ml-1">{t.unitYear}</span>
                              </div>
                            ) : (
                              <div className="flex items-center text-sm text-text-sub px-2">{t.untilExpiry}</div>
                            )}
                            <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                              <input
                                type="number"
                                step="0.01"
                                placeholder={t.placeholderRate}
                                value={stg.rate}
                                onChange={e => {
                                  const next = [...singleStages];
                                  next[sIdx].rate = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                  setSingleStages(next);
                                }}
                                className="w-full bg-transparent text-text-main text-xs py-2 outline-none font-mono"
                              />
                              <span className="text-sm text-text-sub ml-1">%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                    {singleStages.length < 6 && (
                      <button
                        type="button"
                        onClick={addStageSingle}
                        className={`text-xs ${styles.accentText} ${styles.activeScheme} py-2 rounded-lg transition-all cursor-pointer`}
                      >
                        {t.addRateStage}
                      </button>
                    )}
                  </div>
                )}

                {/* 還款方式 */}
                <div className="flex flex-col gap-2">
                  <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.repayTypeLabel}</span>
                  <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
                    <button
                      type="button"
                      onClick={() => setSingleRepayType('equal-total')}
                      className={`py-2 text-sm font-semibold rounded-xl cursor-pointer border ${
                        singleRepayType === 'equal-total'
                          ? styles.activeScheme
                          : 'border-transparent text-text-sub hover:text-text-main'
                      }`}
                    >
                      {t.equalTotal}
                    </button>
                    <button
                      type="button"
                      onClick={() => setSingleRepayType('equal-principal')}
                      className={`py-2 text-sm font-semibold rounded-xl cursor-pointer border ${
                        singleRepayType === 'equal-principal'
                          ? styles.activeScheme
                          : 'border-transparent text-text-sub hover:text-text-main'
                      }`}
                    >
                      {t.equalPrincipal}
                    </button>
                  </div>
                </div>

                {/* 開辦費 */}
                <div className="flex flex-col gap-2">
                  <label htmlFor={singleFeeInputId} className="text-sm font-medium text-text-sub uppercase tracking-[1px]">{t.originationFeeLabel}</label>
                  <input
                    id={singleFeeInputId}
                    type="number"
                    value={singleFee}
                    onChange={e => setSingleFee(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
                  />
                </div>
              </div>
            )}

            {/* ====== 組合貸款模式設定 (貸款 A + 貸款 B) ====== */}
            {loanMode === 'combined' && (
              <div className={`flex flex-col gap-6 ${styles.divider} pt-5`}>
                {/* 貸款 A 卡片 */}
                <div className={styles.subCard}>
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={loanName1}
                      onChange={e => setLoanName1(e.target.value)}
                      className={`bg-transparent border-b border-dashed border-[var(--theme-color)] ${styles.accentText} text-sm font-semibold outline-none px-1 py-0.5`}
                    />
                    <span className={`text-[0.7rem] ${styles.activeScheme} px-2 py-0.5 rounded-md font-mono`}>
                      {t.firstLoan}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-sub">{t.loanAmountLabel}</span>
                    <input
                      type="number"
                      value={loanAmount1}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                        const amtA = typeof val === 'number' ? Math.min(val, totalLoan) : 0;
                        setLoanAmount1(val);
                        setLoanAmount2(Math.max(0, totalLoan - amtA));
                      }}
                      className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono`}
                    />
                    <div className="flex gap-2 mt-1">
                      <button
                        type="button"
                        onClick={() => setLoanAQuickValue(1000)}
                        className={`flex-1 py-1 text-[0.7rem] ${styles.activeScheme} rounded-md cursor-pointer`}
                      >
                        {t.quick1000m}
                      </button>
                      <button
                        type="button"
                        onClick={() => setLoanAQuickValue(null)}
                        className="flex-1 py-1 text-[0.7rem] bg-surface-glass border border-border-glass text-text-sub rounded-md cursor-pointer hover:text-text-main"
                      >
                        {t.allToA}
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-text-sub">{t.loanTermLabel}</span>
                      <input
                        type="number"
                        value={periodVal1}
                        onChange={e => setPeriodVal1(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-text-sub">{t.gracePeriodLabel}</span>
                      <input
                        type="number"
                        value={graceVal1}
                        onChange={e => setGraceVal1(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                      />
                    </div>
                  </div>

                  {/* 利率類型切換 */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">{t.rateTypeLabel}</span>
                    <div className={`grid grid-cols-2 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl`}>
                      <button
                        type="button"
                        onClick={() => handleRateType1Change('single')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          rateType1 === 'single'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        {t.singleRateMode}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRateType1Change('multi')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          rateType1 === 'multi'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        {t.multiRateMode}
                      </button>
                    </div>
                  </div>

                  {rateType1 === 'single' ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-text-sub">{t.annualRateLabel}</span>
                      <input
                        type="number"
                        step="0.001"
                        value={singleRate1}
                        onChange={e => setSingleRate1(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                        className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                      />
                    </div>
                  ) : (
                    <div className={`flex flex-col gap-2.5 ${styles.subCard} p-3 rounded-xl border border-border-glass`}>
                      <span className={`text-xs ${styles.accentText} font-medium`}>{t.multiRateSettings}</span>
                      {stages1.map((stg, sIdx) => {
                        const isLast = sIdx === stages1.length - 1;
                        return (
                          <div key={sIdx} className={`flex flex-col gap-1.5 ${styles.divider} pb-2`}>
                            <div className="flex justify-between items-center text-xs font-medium text-text-sub">
                              <span>{isLast ? `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}${t.remainingPeriods}` : `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}`}</span>
                              {!isLast && stages1.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeStage1(sIdx)}
                                  className="text-[0.7rem] text-[#ef4444] hover:underline cursor-pointer"
                                >
                                  移除
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {!isLast ? (
                                <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                                  <input
                                    type="number"
                                    placeholder="期間"
                                    value={stg.durationValue ?? ''}
                                    onChange={e => {
                                      const next = [...stages1];
                                      next[sIdx].durationValue = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                      setStages1(next);
                                    }}
                                    className="w-full bg-transparent text-text-main text-xs py-1.5 outline-none font-mono"
                                  />
                                  <span className="text-xs text-text-sub ml-1">年</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-xs text-text-sub px-2">直至期滿</div>
                              )}
                              <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder="利率"
                                  value={stg.rate}
                                  onChange={e => {
                                    const next = [...stages1];
                                    next[sIdx].rate = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                    setStages1(next);
                                  }}
                                  className="w-full bg-transparent text-text-main text-xs py-1.5 outline-none font-mono"
                                />
                                <span className="text-xs text-text-sub ml-1">%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {stages1.length < 6 && (
                        <button
                          type="button"
                          onClick={addStage1}
                          className={`text-xs ${styles.accentText} ${styles.activeScheme} py-1.5 rounded-lg transition-all cursor-pointer`}
                        >
                          ＋ 新增利率段落
                        </button>
                      )}
                    </div>
                  )}

                  {/* 還款方式 */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">還款方式</span>
                    <div className={`grid grid-cols-2 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl`}>
                      <button
                        type="button"
                        onClick={() => setRepayType1('equal-total')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          repayType1 === 'equal-total'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        本息平均攤還
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepayType1('equal-principal')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          repayType1 === 'equal-principal'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        本金平均攤還
                      </button>
                    </div>
                  </div>

                  {/* 開辦手續費 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">開辦手續費 (元)</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      value={fee1 === '' ? '' : fee1.toLocaleString('zh-TW')}
                      onChange={e => {
                        const raw = e.target.value.replace(/[^\d]/g, '');
                        setFee1(raw === '' ? '' : parseInt(raw, 10));
                      }}
                      className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                    />
                  </div>
                </div>

                {/* 貸款 B 卡片 */}
                <div className={styles.subCard}>
                  <div className="flex justify-between items-center">
                    <input
                      type="text"
                      value={loanName2}
                      onChange={e => setLoanName2(e.target.value)}
                      className={`bg-transparent border-b border-dashed border-amber-500/40 ${styles.interestText} text-sm font-semibold outline-none px-1 py-0.5`}
                    />
                    <span className={`text-[0.7rem] bg-amber-500/15 border border-amber-500/30 ${styles.interestText} px-2 py-0.5 rounded-md font-mono`}>
                      {t.secondLoan}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <span className="text-sm font-medium text-text-sub">{t.loanAmountLabel}</span>
                    <input
                      type="number"
                      value={loanAmount2}
                      onChange={e => {
                        const val = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                        const amtB = typeof val === 'number' ? Math.min(val, totalLoan) : 0;
                        setLoanAmount2(val);
                        setLoanAmount1(Math.max(0, totalLoan - amtB));
                      }}
                      className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-sm outline-none font-mono`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-text-sub">{t.loanTermLabel}</span>
                      <input
                        type="number"
                        value={periodVal2}
                        onChange={e => setPeriodVal2(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-text-sub">{t.gracePeriodLabel}</span>
                      <input
                        type="number"
                        value={graceVal2}
                        onChange={e => setGraceVal2(e.target.value === '' ? '' : parseInt(e.target.value) || 0)}
                        className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                      />
                    </div>
                  </div>

                  {/* 利率類型切換 */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">{t.rateTypeLabel}</span>
                    <div className={`grid grid-cols-2 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl`}>
                      <button
                        type="button"
                        onClick={() => handleRateType2Change('single')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          rateType2 === 'single'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        {t.singleRateMode}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRateType2Change('multi')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          rateType2 === 'multi'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        {t.multiRateMode}
                      </button>
                    </div>
                  </div>

                  {rateType2 === 'single' ? (
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-text-sub">{t.annualRateLabel}</span>
                      <input
                        type="number"
                        step="0.001"
                        value={singleRate2}
                        onChange={e => setSingleRate2(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                        className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                      />
                    </div>
                  ) : (
                    <div className={`flex flex-col gap-2.5 ${styles.subCard} p-3 rounded-xl border border-border-glass`}>
                      <span className={`text-xs ${styles.accentText} font-medium`}>{t.multiRateSettings}</span>
                      {stages2.map((stg, sIdx) => {
                        const isLast = sIdx === stages2.length - 1;
                        return (
                          <div key={sIdx} className={`flex flex-col gap-1.5 ${styles.divider} pb-2`}>
                            <div className="flex justify-between items-center text-xs font-medium text-text-sub">
                              <span>{isLast ? `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}${t.remainingPeriods}` : `${t.stagePrefix}${sIdx + 1}${t.stageSuffix}`}</span>
                              {!isLast && stages2.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeStage2(sIdx)}
                                  className="text-[0.7rem] text-[#ef4444] hover:underline cursor-pointer"
                                >
                                  {t.remove}
                                </button>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              {!isLast ? (
                                <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                                  <input
                                    type="number"
                                    placeholder={t.placeholderPeriod}
                                    value={stg.durationValue ?? ''}
                                    onChange={e => {
                                      const next = [...stages2];
                                      next[sIdx].durationValue = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                      setStages2(next);
                                    }}
                                    className="w-full bg-transparent text-text-main text-xs py-1.5 outline-none font-mono"
                                  />
                                  <span className="text-xs text-text-sub ml-1">{t.unitYear}</span>
                                </div>
                              ) : (
                                <div className="flex items-center text-xs text-text-sub px-2">{t.untilExpiry}</div>
                              )}
                              <div className="flex items-center rounded-lg px-2 border border-border-glass bg-surface-glass">
                                <input
                                  type="number"
                                  step="0.01"
                                  placeholder={t.placeholderRate}
                                  value={stg.rate}
                                  onChange={e => {
                                    const next = [...stages2];
                                    next[sIdx].rate = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                    setStages2(next);
                                  }}
                                  className="w-full bg-transparent text-text-main text-xs py-1.5 outline-none font-mono"
                                />
                                <span className="text-xs text-text-sub ml-1">%</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      {stages2.length < 6 && (
                        <button
                          type="button"
                          onClick={addStage2}
                          className={`text-xs ${styles.accentText} ${styles.activeScheme} py-1.5 rounded-lg transition-all cursor-pointer`}
                        >
                          {t.addRateStage}
                        </button>
                      )}
                    </div>
                  )}

                  {/* 還款方式 */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">{t.repayTypeLabel}</span>
                    <div className={`grid grid-cols-2 gap-1.5 ${styles.segmentGroup} p-1 rounded-xl`}>
                      <button
                        type="button"
                        onClick={() => setRepayType2('equal-total')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          repayType2 === 'equal-total'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        {t.equalTotal}
                      </button>
                      <button
                        type="button"
                        onClick={() => setRepayType2('equal-principal')}
                        className={`py-1.5 text-xs font-semibold rounded-lg cursor-pointer border ${
                          repayType2 === 'equal-principal'
                            ? styles.activeScheme
                            : 'border-transparent text-text-sub hover:text-text-main'
                        }`}
                      >
                        {t.equalPrincipal}
                      </button>
                    </div>
                  </div>

                  {/* 開辦手續費 */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-medium text-text-sub uppercase tracking-[1px]">{t.originationFeeLabel}</span>
                    <input
                      type="number"
                      value={fee2}
                      onChange={e => setFee2(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                      className={`w-full ${styles.inputField} px-3 py-2 rounded-lg text-xs outline-none font-mono`}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 複製分享按鈕 */}
            <button
              type="button"
              onClick={copyShareLink}
              className={`mt-2 w-full h-[44px] flex items-center justify-center gap-2 text-sm font-medium tracking-[1px]
                ${styles.activeScheme} rounded-xl transition-all duration-300 cursor-pointer`}
            >
              {t.copyShareLink}
            </button>
          </div>

          {/* 右欄：看板、圖表與攤銷明細 */}
          <div className="flex flex-col gap-6">
            {/* 看板 */}
            <div className="grid grid-cols-4 gap-3 max-md:grid-cols-2 max-sm:grid-cols-1">
              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">{t.firstMonthPayment}</span>
                <span className={`text-lg font-bold font-mono ${styles.accentText}`}>
                  ${Math.round(firstPayment).toLocaleString('zh-TW')}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">{t.aprTotalFeeRate}</span>
                <span className={`text-lg font-bold font-mono ${styles.aprText}`}>
                  {aprRate}%
                </span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">{t.totalInterestExpense}</span>
                <span className={`text-lg font-bold font-mono ${styles.interestText}`}>
                  ${Math.round(totalInterest).toLocaleString('zh-TW')}
                </span>
              </div>

              <div className={styles.statCard}>
                <span className="text-sm font-semibold text-text-sub">{t.totalRepaymentAmount}</span>
                <span className="text-lg font-bold text-text-main font-mono">
                  ${Math.round(totalRepay).toLocaleString('zh-TW')}
                </span>
              </div>
            </div>

            {/* Canvas 房貸餘額遞減趨勢圖 */}
            <div className={`${styles.glassCard} p-5 flex flex-col gap-3 shadow-lg`}>
              <div className="flex justify-between items-center text-sm text-text-sub font-semibold uppercase tracking-[1px]">
                <span>{t.trendChartTitle}</span>
                <div className="flex gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${styles.dotBg}`} />
                    {t.remainingPrincipalLegend}
                  </span>
                </div>
              </div>
              <div className="relative w-full h-[220px]">
                <canvas ref={canvasRef} className="w-full h-full block" />
              </div>
            </div>

            {/* 還款明細表 (支援展開全期與 Mobile Sticky Column) */}
            <div className={`${styles.glassCard} p-6 flex flex-col gap-4 shadow-lg`}>
              <div className="flex justify-between items-center">
                <h3 className={`text-sm ${styles.accentText} uppercase tracking-[1px] font-semibold`}>
                  {t.scheduleTableTitle} ({showAllRows ? t.totalPeriodsText(schedule.length - 1) : t.preview120Periods})
                </h3>
                {schedule.length > 121 && (
                  <button
                    type="button"
                    onClick={() => setShowAllRows(!showAllRows)}
                    className={`text-sm font-medium ${styles.activeScheme} px-3.5 py-1.5 rounded-xl transition-all cursor-pointer`}
                  >
                    {showAllRows ? t.collapseTo120 : t.expandAllPeriodsText(schedule.length - 1)}
                  </button>
                )}
              </div>

              <div className={styles.tableWrapper}>
                <table className="w-full text-right text-sm font-mono">
                  <thead>
                    <tr className="border-b border-border-glass text-text-sub text-sm font-semibold">
                      <th className={`text-left p-3 ${styles.stickyPeriod}`}>{t.colPeriod}</th>
                      <th className="p-3">{t.colStartBalance}</th>
                      <th className="p-3">{t.colPrincipal}</th>
                      <th className="p-3">{t.colInterest}</th>
                      <th className="p-3">{t.colTotalPayment}</th>
                      <th className="p-3">{t.colEndBalance}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-glass">
                    {visibleSchedule.map(row => (
                      <tr key={row.period} className="hover:bg-white/[.04] text-text-main transition-colors">
                        <td className={`text-left p-3 font-mono ${styles.stickyPeriod}`}>
                          {row.period === 0 ? t.initialPeriod : t.periodText(row.period)}
                        </td>
                        <td className="p-3 font-mono">{row.period === 0 ? '-' : `$${Math.round(row.startBalance).toLocaleString('zh-TW')}`}</td>
                        <td className="p-3 font-mono text-text-main">{row.period === 0 ? '-' : `$${Math.round(row.principalPaid).toLocaleString('zh-TW')}`}</td>
                        <td className={`p-3 font-mono ${styles.interestText}`}>{row.period === 0 ? '-' : `$${Math.round(row.interestPaid).toLocaleString('zh-TW')}`}</td>
                        <td className={`p-3 font-mono font-semibold ${styles.accentText}`}>{row.period === 0 ? '-' : `$${Math.round(row.totalPayment).toLocaleString('zh-TW')}`}</td>
                        <td className="p-3 font-mono text-text-sub">${Math.round(row.endBalance).toLocaleString('zh-TW')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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
            accentColor="#00ffaa"
          />
        </div>
      </ToolLayout>

      {/* Toast 提示條 */}
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

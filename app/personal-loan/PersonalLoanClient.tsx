'use client';

import { useState, useEffect, useRef, useCallback, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './personal-loan.module.css';

interface LoanScheduleRow {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  remaining: number;
}

/**
 * 採用二分搜尋法 (Bisection Method) 精確求解折現淨現值 (NPV = 0) 之 APR 實質年利率
 */
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

  return parseFloat((mid * 12 * 100).toFixed(2));
}

interface Props {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: '個人信貸試算器',
    subtitle: 'PERSONAL LOAN CALCULATOR',
    description:
      '專業免費的線上個人信貸計算機！支援本息均攤、本金均攤、開辦費/手續費攤提與 APR 實質總費用年率試算，即時提供月還款額與歷期攤還明細表。',
    langToggleLabel: 'English',
    langToggleUrl: '/personal-loan/en/',
    settingTitle: '貸款條件設定',
    shareBtn: '分享連結',
    amountLabel: '貸款金額 (萬元)',
    yearsLabel: '貸款期限 (年)',
    rateLabel: '申貸利率 (%)',
    feeLabel: '開辦手續費 (元)',
    repayMethodLabel: '還款方式',
    repayEqualPayment: '本息平均攤還',
    repayEqualPrincipal: '本金平均攤還',
    firstMonthPayment: '首期月付金額',
    aprRateLabel: 'APR 總費用年率',
    totalInterestLabel: '總利息支出',
    trendTitle: '賸餘本金遞減趨勢圖',
    legendRemaining: '賸餘本金餘額',
    scheduleTitle: '信貸還款明細表',
    colPeriod: '期數',
    colPayment: '月付金額',
    colPrincipal: '償還本金',
    colInterest: '償還利息',
    colRemaining: '剩餘本金',
    initialPeriod: '初始',
    periodText: (m: number) => `第 ${m} 期`,
    toastCopied: '已複製試算分享連結到剪貼簿',

    // FAQ
    faqTitle: '常見問題與專業指南 (FAQ)',
    faqSubtitle: '深入解析個人信用貸款年利率、本息/本金均攤選擇、APR 手續費影響與 DBR 22 倍限制',
    faqItems: [
      {
        q: '為什麼需要本信貸計算機？如何看懂電話行銷或貸款專員的「利率包裝話術」以破除資訊不對稱？',
        a: '許多借款人在接到銀行電話行銷 (電銷) 或業務專員推薦時，常會聽到各種經過包裝的行銷話術，容易因資訊不對稱而誤判真實借貸成本：\n\n① 「月付金只要幾千元」的盲區：\n專員常以「一天只要幾十元」或「每月只要繳 3,000 元」來降低消費者的心理門檻，但可能拉長貸款年限至 7 年，導致總利息支出大幅膨脹。\n\n② 「前低後高」或「超低首期利率」包裝：\n宣傳「首期 0.88% 起」或「前三期超低利」，但第四期起利率跳升至 8%~12%，實際平均負擔遠高於直覺認知。\n\n③ 忽略高額開辦費與手續費：\n標榜低利率專案，卻在核貸時收取高達 6,000 ~ 9,000 元的開辦手續費，直接吃掉利率優惠。\n\n④ 工具初衷與資訊對稱：\n本計算機正是為了打破這類話術盲點而設計。只要輸入「實際核貸金額」、「每月月付金」、「期數」與「開辦費」，即可精算出標準的「實質總費用年百分率 (APR)」與完整攤還明細，讓每位使用者都能清楚掌握每一分利息的去向，自主捍衛自身的金融借貸權益。',
      },
      {
        q: '個人信用貸款常見的年利率區間是多少？影響信貸利率高低的關鍵因素為何？',
        a: '銀行個人信貸的核貸年利率主要依據申請人的職業類別、收入穩定度與個人信用條件而定：\n\n① 常見利率區間：\n優質客群（如軍公教、公立學校教師、百大上市櫃員工、醫療從業人員）常態利率約在 2.1% ~ 4.5% 之間；一般企業上班族利率約在 5.0% ~ 10.0%；若信用狀況較弱或曾有遲繳紀錄，利率可能落在 10% ~ 15%（法定上限為 16%）。\n\n② 關鍵評估條件：\n包含聯徵信用評分（無卡債、無預借現金、繳款正常）、現職在職年資（建議滿 6 個月以上）、負債收支比（DBR 22 倍原則）以及提供完整之薪資轉帳存摺或扣繳憑單。',
      },
      {
        q: '信貸還款方式「本息平均攤還」與「本金平均攤還」有何不同？如何選擇？',
        a: '兩種還款方式計算機制與優缺點如下：\n\n① 本息平均攤還（最常見）：\n將貸款本金與總利息平均分攤到每個期數中，每月繳納固定金額。前期利息佔比高、後期本金佔比高。優點是支出固定可預期，絕大多數銀行信貸預設採用此方式。\n\n② 本金平均攤還（總利息較低）：\n每月償還固定金額的本金，利息則隨剩餘本金減少而逐期遞減。前期月付額最高，隨後逐月減少。總利息支出低於本息均攤，適合前期還款能力充裕、希望節省利息總額的借款人。',
      },
      {
        q: '什麼是「實質年利率 (APR)」？為什麼開辦費與手續費會大幅拉高借款成本？',
        a: '實質年利率（APR, Annual Percentage Rate）是將貸款本金、表面利率與所有衍生手續費（如開辦費、帳管費、徵信查詢費）折現攤提後計算出的真實借款年化成本：\n\n① 手續費對小額貸款影響極大：\n信貸額度通常在 30 ~ 100 萬元之間。若借款 30 萬元、表面利率 3.5%、年限 5 年，若加上一次性收取 6,000 元開辦費，實質 APR 會立即拉高至約 4.35% 以上。\n\n② 客觀比價工具：\n比較不同銀行的信貸專案時，切勿只看廣告上的「前三期超低利率」或「表面低利率」，務必以包含所有開辦手續費的「總費用年百分率 (APR)」進行統一比較。',
      },
      {
        q: '什麼是金管會規範的「DBR 22 倍原則」？我最高可以貸到多少額度？',
        a: 'DBR 22 倍（Debt Burden Ratio）是台灣金管會為防範過度借貸所訂定的法規天花板：\n\n① 法定上限：\n金融機構對個人之「無擔保債務總餘額」（包含信用貸款、信用卡未結清分期、循環信用餘額與現金卡），合計不得超過該借款人「平均月收入的 22 倍」。\n\n② 銀行實務核貸標準：\n實務上銀行為保留風險緩衝空間，一般核貸額度通常落在月收入的 15 ~ 18 倍左右。若負債比過高或接近 22 倍上限，核貸機率將大幅降低。',
      },
      {
        q: '個人信貸可以提前清償還本或結清嗎？會有違約金嗎？',
        a: '信貸提前還款規定視申貸專案合約條款而定：\n\n① 限制清償期（綁約期）：\n多數銀行信貸會約定 12 ~ 18 個月的限制清償期。若在綁約期內提前還本或結清，銀行會依提前償還金額收取 1.5% ~ 3% 的提前清償違約金。\n\n② 隨借隨還（無綁約型信貸）：\n部分銀行提供無綁約的循環型信用貸款，隨借隨還、按日計息，提前清償無需違約金，但表面牌告利率通常較一般分期信貸略高。',
      },
      {
        q: '向多家銀行同時送件申請信貸會比較好嗎？頻繁聯徵查詢有何影響？',
        a: '同時向多家銀行送件申請信貸會產生嚴重的「聯徵多查」負面效應：\n\n① 聯徵查詢次數警示：\n每當您向銀行提出信貸申請，銀行即會向財團法人金融聯合徵信中心查詢您的信用紀錄。若 3 個月內聯徵「新業務查詢」次數達 3 次以上，銀行系統會判定該申請人「近期資金極度匱乏」或「被其他銀行婉拒」，導致信用評分下降。\n\n② 建議策略：\n應事先評估個人條件，挑選 1 ~ 2 家最具利率優勢且條件匹配的銀行專注申請，切忌亂槍打鳥式同時送件。',
      },
      {
        q: '本個人信貸計算機試算結果是否具備法律效力？（免責條款聲明）',
        a: '本線上個人信貸試算工具所提供之每月應繳本息、總利息支出、歷期攤還明細表與 APR 總費用年率數值，均為依據標準金融複利數學公式估算之理論參考數值，不構成任何核貸承諾或要約保證。\n\n實際核貸金額、核准利率、開辦手續費、綁約期條款與每月還款金額，均以各承貸銀行依申請人財務收入、信用條件與內部授信審核之正式貸款合約為準。',
      },
    ],
  },
  en: {
    title: 'Personal Loan Calculator',
    subtitle: 'PERSONAL LOAN CALCULATOR',
    description:
      'Professional free online personal loan calculator! Supports equal payment, equal principal, fee amortization, APR solver, and detailed repayment schedule.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/personal-loan/',
    settingTitle: 'Loan Terms',
    shareBtn: 'Share Link',
    amountLabel: 'Loan Amount (10k TWD / $10,000)',
    yearsLabel: 'Loan Term (Years)',
    rateLabel: 'Interest Rate (%)',
    feeLabel: 'Origination Fee ($)',
    repayMethodLabel: 'Repayment Method',
    repayEqualPayment: 'Equal Principal & Interest',
    repayEqualPrincipal: 'Equal Principal',
    firstMonthPayment: 'First Month Payment',
    aprRateLabel: 'Effective APR Rate',
    totalInterestLabel: 'Total Interest',
    trendTitle: 'Remaining Balance Trend',
    legendRemaining: 'Remaining Balance',
    scheduleTitle: 'Repayment Schedule',
    colPeriod: 'Period',
    colPayment: 'Payment',
    colPrincipal: 'Principal',
    colInterest: 'Interest',
    colRemaining: 'Remaining',
    initialPeriod: 'Initial',
    periodText: (m: number) => `Month ${m}`,
    toastCopied: 'Shareable link copied to clipboard',

    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Everything you need to know about personal loan interest rates, repayment methods, APR, and DBR limits',
    faqItems: [
      {
        q: 'Why is this Personal Loan Calculator needed? How does it help identify telemarketing sales tactics and eliminate information asymmetry?',
        a: 'Borrowers frequently encounter packaged marketing claims from telemarketers or loan sales representatives that obscure the true cost of borrowing:\n\n① The "Low Daily / Monthly Payment" Trap:\nSales pitches often emphasize affordable payments (e.g. "Only $10 a day" or "$300 a month") by extending terms to 7 years, significantly inflating total lifetime interest paid.\n\n② "Tiered / Teaser Introductory Rates":\nPromotions advertising "Starting at 0.88% APR" often only apply to the first 3 months, after which rates jump to 8% to 12%+, making the overall loan much more expensive than expected.\n\n③ Concealed Origination & Administrative Fees:\nAttractive nominal rates may come with $200 to $300 (TWD 6,000 to 9,000) upfront processing fees, neutralizing any nominal rate advantage.\n\n④ Calculator Purpose & Transparency:\nThis tool was created specifically to eliminate information asymmetry. By entering your loan amount, monthly payment, term, and origination fees, our APR solver reveals your true effective borrowing cost and monthly principal/interest schedule, empowering you to make informed financial decisions.',
      },
      {
        q: 'What is the typical interest rate range for personal loans, and what factors determine it?',
        a: 'Personal loan interest rates typically depend on employment stability, credit rating, and borrower risk profile:\n\n① Common Rate Ranges:\nPrime tier borrowers (civil servants, healthcare workers, employees of large public corporations) generally receive rates between 2.1% and 4.5% APR. Standard private-sector employees typically see rates between 5.0% and 10.0%, while higher-risk applicants may be quoted 10.0% to 15.0% (statutory cap is 16.0%).\n\n② Key Underwriting Factors:\nThese include credit scores (no delinquent credit card balances or cash advances), verifiable job tenure (ideally 6+ months), debt-to-income limits (DBR 22x rule), and official income proof (bank statements or tax withholding slips).',
      },
      {
        q: 'How do Equal Monthly Payments (Amortization) and Equal Principal Payments differ for personal loans?',
        a: 'The mechanisms and financial trade-offs are as follows:\n\n① Equal Principal and Interest (Standard Amortization):\nYour monthly payment remains constant throughout the loan tenure. Earlier installments consist mostly of interest, while later payments consist mostly of principal. Predictable payments make monthly budgeting easy, making this the default choice for most lenders.\n\n② Equal Principal Payment:\nYou repay a fixed amount of principal each month, with interest computed on the reducing balance. Monthly payments start at their highest and decline over time. Total interest expense is lower than standard amortization, ideal for borrowers with strong initial cash flow.',
      },
      {
        q: 'What is Annual Percentage Rate (APR), and why do origination fees significantly increase borrowing costs?',
        a: 'Annual Percentage Rate (APR) reflects the true annualized cost of borrowing by factoring in the nominal interest rate along with all mandatory upfront fees (origination fees, account management charges, and credit check costs):\n\n① Impact of Upfront Fees:\nBecause personal loan amounts are relatively moderate (e.g., $10,000 to $30,000 / TWD 300,000 to 1,000,000), an upfront origination fee of $200 to $300 (TWD 6,000 to 9,000) can increase the effective APR by 0.5% to 1.5% above the advertised rate.\n\n② Objective Price Comparison:\nAlways compare loan offers based on their total APR rather than nominal introductory rates to avoid hidden fee surprises.',
      },
      {
        q: 'What is the DBR 22x Rule (Debt Burden Ratio)? What is my maximum borrowing capacity?',
        a: 'The DBR 22x rule is a regulatory ceiling established by financial supervisory authorities to prevent over-indebtedness:\n\n① Statutory Limit:\nAn individual\'s total unsecured borrowing balance (including personal loans, credit card installment plans, revolving credit, and cash card balances) across all financial institutions cannot exceed 22 times their average monthly income.\n\n② Practical Approval Limits:\nIn practice, conservative banks generally cap total unsecured borrowing at 15 to 18 times monthly income to maintain safety margins.',
      },
      {
        q: 'Can I pay off my personal loan early? What is a Lock-in / Prepayment Penalty Period?',
        a: 'Early payoff terms depend on the specific loan contract:\n\n① Lock-in / Prepayment Penalty Window:\nMost personal loan contracts include a 12 to 18 month lock-in period. Settling all or part of the loan principal early within this window typically incurs a 1.5% to 3.0% prepayment penalty fee.\n\n② Revolving / Flexible Personal Loans:\nCertain lenders offer revolving personal credit lines that accrue interest on a daily basis with zero prepayment penalties, though nominal interest rates are generally slightly higher.',
      },
      {
        q: 'Should I submit loan applications to multiple banks simultaneously? What are the risks of frequent credit inquiries?',
        a: 'Submitting simultaneous applications to multiple lenders triggers adverse credit scoring consequences:\n\n① Excessive Credit Inquiries:\nEach application causes a hard inquiry on your central credit report. Generating 3 or more hard inquiries within a 3-month window signals urgent liquidity distress to lenders, negatively impacting your credit score and potentially causing outright application rejections.\n\n② Recommended Approach:\nEvaluate bank rate matrices beforehand, target 1 or 2 institutions that best match your financial profile, and avoid shotgun applications.',
      },
      {
        q: "Are the personal loan calculator's estimates legally binding? (Financial Disclaimer)",
        a: 'All monthly installment computations, interest breakdowns, amortization schedules, and APR metrics provided by this calculator are theoretical estimates based on standard compound interest mathematics for personal budgeting only.\n\nActual approved loan amounts, interest rates, origination fees, prepayment conditions, and monthly payment schedules are determined solely by your lender based on formal underwriting and credit assessments.',
      },
    ],
  },
};

export default function PersonalLoanClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  const [loanAmount, setLoanAmount] = useState<number | ''>(50); // 萬
  const [loanYears, setLoanYears] = useState<number | ''>(7);
  const [annualRate, setAnnualRate] = useState<number | ''>(3.25); // %
  const [fee, setFee] = useState<number | ''>(6000); // 元手續費
  const [method, setMethod] = useState<'equal-payment' | 'equal-principal'>('equal-payment');

  const [monthlyPayment, setMonthlyPayment] = useState<number>(0);
  const [totalInterest, setTotalInterest] = useState<number>(0);
  const [aprRate, setAprRate] = useState<number>(0);
  const [schedule, setSchedule] = useState<LoanScheduleRow[]>([]);

  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isMountedRef = useRef<boolean>(false);

  const amountInputId = useId();
  const yearsInputId = useId();
  const rateInputId = useId();
  const feeInputId = useId();

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ msg, show: true });
    toastTimerRef.current = setTimeout(() => setToast(st => ({ ...st, show: false })), 2500);
  }, []);

  // 設定全頁背景主題發光色
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f5a0');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 245, 160, 0.6)');
  }, []);

  // 初始載入網址 Query 參數與防呆解析
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const a = params.get('a') || params.get('amount');
    const y = params.get('y') || params.get('years');
    const r = params.get('r') || params.get('rate');
    const f = params.get('f') || params.get('fee');
    const m = params.get('m') || params.get('method');

    if (a !== null && !isNaN(Number(a))) setLoanAmount(Math.max(0, Number(a)));
    if (y !== null && !isNaN(Number(y))) setLoanYears(Math.max(1, Number(y)));
    if (r !== null && !isNaN(Number(r))) setAnnualRate(Math.max(0, Number(r)));
    if (f !== null && !isNaN(Number(f))) setFee(Math.max(0, Number(f)));
    if (m === 'equal-principal' || m === 'equal-payment') setMethod(m);

    isMountedRef.current = true;
  }, []);

  // 網址參數雙向連動 (isMountedRef 鎖定防護)
  useEffect(() => {
    if (!isMountedRef.current) return;
    const timer = setTimeout(() => {
      if (typeof window === 'undefined') return;
      const params = new URLSearchParams();
      if (loanAmount !== '') params.set('a', loanAmount.toString());
      if (loanYears !== '') params.set('y', loanYears.toString());
      if (annualRate !== '') params.set('r', annualRate.toString());
      if (fee !== '') params.set('f', fee.toString());
      params.set('m', method);

      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState(null, '', newUrl);
    }, 300);

    return () => clearTimeout(timer);
  }, [loanAmount, loanYears, annualRate, fee, method]);

  // 個人信貸主試算邏輯
  const calculatePersonalLoan = useCallback(() => {
    const numAmount = loanAmount === '' ? 0 : loanAmount;
    const numYears = loanYears === '' ? 0 : loanYears;
    const numRate = annualRate === '' ? 0 : annualRate;
    const numFee = fee === '' ? 0 : fee;

    const loanAmt = numAmount * 10000;
    const totalMonths = numYears * 12;
    const monthlyRate = numRate / 100 / 12;

    let remaining = loanAmt;
    let sumInterest = 0;
    const rows: LoanScheduleRow[] = [];

    if (totalMonths > 0 && loanAmt > 0) {
      for (let m = 1; m <= totalMonths; m++) {
        let interest = Math.round(remaining * monthlyRate);
        let principal = 0;

        if (method === 'equal-payment') {
          if (monthlyRate === 0) {
            principal = Math.round(loanAmt / totalMonths);
          } else {
            const pow = Math.pow(1 + monthlyRate, totalMonths);
            const pmt = (loanAmt * monthlyRate * pow) / (pow - 1);
            principal = Math.round(pmt - interest);
          }
        } else {
          principal = Math.round(loanAmt / totalMonths);
        }

        // 最後一期清算剩餘本金，避免 JS 浮點數誤差殘留
        if (m === totalMonths) {
          principal = remaining;
        }

        const payment = principal + interest;
        remaining = Math.max(0, remaining - principal);
        if (m === totalMonths) {
          remaining = 0;
        }
        sumInterest += interest;

        rows.push({
          month: m,
          payment,
          principal,
          interest,
          remaining,
        });
      }
    }

    setMonthlyPayment(rows[0]?.payment || 0);
    setTotalInterest(sumInterest);
    setSchedule(rows);

    // 金融級二分搜尋法求解 APR (實質總費用年率)
    const paymentsList = rows.map(r => r.payment);
    const calculatedApr = calculateAPR(loanAmt, numFee, paymentsList);
    setAprRate(calculatedApr > 0 ? calculatedApr : numRate);
  }, [loanAmount, loanYears, annualRate, fee, method]);

  useEffect(() => {
    calculatePersonalLoan();
  }, [calculatePersonalLoan]);

  // 繪製 賸餘本金遞減趨勢圖 (Theme-Aware Canvas)
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

    const numAmt = (loanAmount === '' ? 0 : loanAmount) * 10000;
    const maxVal = numAmt > 0 ? numAmt : 1;

    const chartData = [
      { month: 0, remaining: numAmt },
      ...schedule,
    ];

    const points = chartData.map((row, idx) => ({
      x: (idx / (chartData.length - 1)) * (width - 60) + 40,
      y: height - 30 - (row.remaining / maxVal) * (height - 60),
    }));

    // 漸層背景 (亮暗雙模式色調調和)
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

    // 折線主軌跡
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = isLight ? '#059669' : '#00f5a0';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // X / Y 軸刻度線與文字
    ctx.strokeStyle = isLight ? 'rgba(203, 213, 225, 0.6)' : 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, height - 30);
    ctx.lineTo(width - 20, height - 30);
    ctx.stroke();

    ctx.fillStyle = isLight ? '#475569' : '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText(t.initialPeriod, 35, height - 12);
    ctx.fillText(t.periodText(schedule.length), width - 45, height - 12);
    ctx.fillText(`$${Math.round(maxVal).toLocaleString('zh-TW')}`, 5, 20);
  }, [schedule, loanAmount, t]);

  const copyShareLink = () => {
    if (typeof window === 'undefined') return;
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast(t.toastCopied);
    });
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
        {/* 左欄：輸入選項區塊 */}
        <div className={`${styles.glassCard} p-8 flex flex-col gap-6 shadow-lg`}>
          <div className="flex justify-between items-center pb-2 border-b border-border-glass">
            <h2 className="text-base font-semibold text-text-main">{t.settingTitle}</h2>
            <button
              type="button"
              onClick={copyShareLink}
              className="flex items-center gap-1.5 text-xs text-text-sub hover:text-text-main transition-colors cursor-pointer px-2.5 py-1 rounded-lg border border-border-glass bg-surface-glass"
              title="複製分享連結"
            >
              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                <path d="M18 16.08c-.76 0-1.44.3-1.96.77L8.91 12.7c.05-.23.09-.46.09-.7s-.04-.47-.09-.7l7.05-4.11c.54.5 1.25.81 2.04.81 1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3c0 .24.04.47.09.7L8.04 9.81C7.5 9.31 6.79 9 6 9c-1.66 0-3 1.34-3 3c.79 0 1.5-.31 2.04-.81l7.12 4.16c-.05.21-.08.43-.08.65 0 1.61 1.31 2.92 2.92 2.92 1.61 0 2.92-1.31 2.92-2.92s-1.31-2.92-2.92-2.92z"/>
              </svg>
              <span>{t.shareBtn}</span>
            </button>
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor={amountInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
              {t.amountLabel}
            </label>
            <input
              id={amountInputId}
              type="number"
              value={loanAmount}
              onChange={e => {
                const val = e.target.value;
                setLoanAmount(val === '' ? '' : parseFloat(val));
              }}
              className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label htmlFor={yearsInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                {t.yearsLabel}
              </label>
              <input
                id={yearsInputId}
                type="number"
                value={loanYears}
                onChange={e => {
                  const val = e.target.value;
                  setLoanYears(val === '' ? '' : parseInt(val, 10));
                }}
                className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor={rateInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
                {t.rateLabel}
              </label>
              <input
                id={rateInputId}
                type="number"
                step="0.01"
                value={annualRate}
                onChange={e => {
                  const val = e.target.value;
                  setAnnualRate(val === '' ? '' : parseFloat(val));
                }}
                className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
              />
            </div>
          </div>

          <div className={`flex flex-col gap-2 ${styles.divider} pt-4`}>
            <label htmlFor={feeInputId} className="text-sm text-text-sub font-medium uppercase tracking-[1px]">
              {t.feeLabel}
            </label>
            <input
              id={feeInputId}
              type="text"
              inputMode="numeric"
              value={fee === '' ? '' : fee.toLocaleString('zh-TW')}
              onChange={e => {
                const raw = e.target.value.replace(/[^\d]/g, '');
                setFee(raw === '' ? '' : parseInt(raw, 10));
              }}
              className={`w-full ${styles.inputField} px-4 py-3 rounded-xl text-base outline-none transition-all font-mono`}
            />
          </div>

          {/* 還款方式 */}
          <div className={`flex flex-col gap-2 ${styles.divider} pt-4`}>
            <span className="text-sm text-text-sub font-medium uppercase tracking-[1px]">{t.repayMethodLabel}</span>
            <div className={`grid grid-cols-2 gap-2 ${styles.segmentGroup} p-1.5 rounded-xl`}>
              <button
                type="button"
                onClick={() => setMethod('equal-payment')}
                className={`py-2 text-sm rounded-xl cursor-pointer transition-all border ${
                  method === 'equal-payment'
                    ? styles.activeMethod
                    : 'border-transparent text-text-sub hover:text-text-main'
                }`}
              >
                {t.repayEqualPayment}
              </button>
              <button
                type="button"
                onClick={() => setMethod('equal-principal')}
                className={`py-2 text-sm rounded-xl cursor-pointer transition-all border ${
                  method === 'equal-principal'
                    ? styles.activeMethod
                    : 'border-transparent text-text-sub hover:text-text-main'
                }`}
              >
                {t.repayEqualPrincipal}
              </button>
            </div>
          </div>
        </div>

        {/* 右欄：看板與歷期明細 */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-4 max-sm:grid-cols-1">
            <div className={styles.statCard}>
              <span className="text-sm font-semibold text-text-sub">{t.firstMonthPayment}</span>
              <span className={`text-xl font-bold font-mono ${styles.accentText}`}>
                ${monthlyPayment.toLocaleString('zh-TW')}
              </span>
            </div>

            <div className={styles.statCard}>
              <span className="text-sm font-semibold text-text-sub">{t.aprRateLabel}</span>
              <span className={`text-xl font-bold font-mono ${styles.aprText}`}>
                {aprRate}%
              </span>
            </div>

            <div className={styles.statCard}>
              <span className="text-sm font-semibold text-text-sub">{t.totalInterestLabel}</span>
              <span className={`text-xl font-bold font-mono ${styles.interestText}`}>
                ${totalInterest.toLocaleString('zh-TW')}
              </span>
            </div>
          </div>

          {/* 賸餘本金遞減趨勢圖 */}
          <div className={`${styles.glassCard} p-5 flex flex-col gap-3 shadow-lg`}>
            <div className="flex justify-between items-center text-sm text-text-sub font-semibold uppercase tracking-[1px]">
              <span>{t.trendTitle}</span>
              <div className="flex gap-4">
                <span className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${styles.dotBg}`} />
                  {t.legendRemaining}
                </span>
              </div>
            </div>
            <div className="relative w-full h-[220px]">
              <canvas ref={canvasRef} className="w-full h-full block" />
            </div>
          </div>

          {/* 還款明細表 */}
          <div className={`${styles.glassCard} p-6 flex flex-col gap-4 shadow-lg`}>
            <h3 className="text-sm font-semibold text-text-main uppercase tracking-[1px]">{t.scheduleTitle}</h3>
            <div className={styles.tableWrapper}>
              <table className="w-full text-right text-sm font-mono">
                <thead>
                  <tr className="border-b border-border-glass text-text-sub text-sm font-semibold">
                    <th className={`text-left p-3 ${styles.stickyPeriod}`}>{t.colPeriod}</th>
                    <th className="p-3">{t.colPayment}</th>
                    <th className="p-3">{t.colPrincipal}</th>
                    <th className="p-3">{t.colInterest}</th>
                    <th className="p-3">{t.colRemaining}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-glass">
                  {schedule.map(row => (
                    <tr key={row.month} className="hover:bg-white/[.04] text-text-main transition-colors">
                      <td className={`text-left p-3 font-mono ${styles.stickyPeriod}`}>{t.periodText(row.month)}</td>
                      <td className={`p-3 font-semibold ${styles.accentText}`}>${row.payment.toLocaleString('zh-TW')}</td>
                      <td className="p-3 text-text-main">${row.principal.toLocaleString('zh-TW')}</td>
                      <td className={`p-3 ${styles.interestText}`}>${row.interest.toLocaleString('zh-TW')}</td>
                      <td className="p-3 text-text-sub">${row.remaining.toLocaleString('zh-TW')}</td>
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
          accentColor="#00f5a0"
        />
      </div>

      {/* Toast 提示框 */}
      {toast.show && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 bg-black/80 text-white border border-white/20 px-6 py-3 rounded-full text-sm shadow-2xl backdrop-blur-md animate-fade-in flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${styles.dotBg}`} />
          {toast.msg}
        </div>
      )}
    </ToolLayout>
  );
}

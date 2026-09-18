/**
 * 線上複利試算器頁面中英文案（從 CompoundInterestClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    title: '線上複利試算器',
    subtitle: 'COMPOUND INTEREST CALCULATOR',
    description:
      '專業免費的線上複利計算機，支援單筆本金與定期定額（月/年）投資試算，提供動態資產成長圖表與本息增長明細，助您精準規劃長期理財目標。',
    langToggleLabel: 'English',
    langToggleUrl: '/compound-interest/en/',
    principalLabel: '初始本金 (元)',
    contributionLabel: '定期定額投入金額 (元)',
    contribFreqLabel: '定期定額頻率',
    contribMonth: '按月投入',
    contribYear: '按年投入',
    rateLabel: '預期報酬率 (%)',
    rateYear: '年',
    rateMonth: '月',
    periodLabel: '投資期間',
    periodYear: '年',
    periodMonth: '月',
    freqLabel: '複利計息頻率',
    freqMonthly: '按月複利 (每月滾利)',
    freqQuarterly: '按季複利 (每三月滾利)',
    freqYearly: '按年複利 (每年滾利)',
    freqSimple: '單利計息 (不滾利)',
    copyShareBtn: '複製試算分享連結',
    totalAssetLabel: '累積總金額',
    totalPrincipalLabel: '總投入本金',
    totalInterestLabel: '累積利息收益',
    chartTitle: '複利資產累積趨勢圖',
    legendInterest: '複利利息',
    legendPrincipal: '投入本金',
    scheduleYearTitle: '歷年本利和明細表',
    scheduleMonthTitle: '歷月本利和明細表',
    colYearMonth: (isYr: boolean) => (isYr ? '年度' : '月份'),
    colStartBal: '期初金額',
    colContrib: '當期投入',
    colInterest: '當期利息',
    colCumulPrincipal: '累計本金',
    colTotal: '本利和累計',
    initialLabel: '初始',
    yearLabel: (y: number) => `第 ${y} 年`,
    monthLabel: (m: number) => `第 ${m} 月`,
    toastCopied: '已複製試算分享連結到剪貼簿',
    unitY: '年',
    unitM: '月',
    unitCurrency: '元',
    faqTitle: '常見問題與複利理財指南 (FAQ)',
    faqSubtitle: '深入瞭解複利效應、72 法則、定期定額優劣與財務規劃原則',
    faqItems: [
      {
        q: '什麼是複利效應 (Compound Interest)？與單利有何不同？',
        a: `複利（Compound Interest）是指將每期獲得的利息或投資收益，滾入下一期的本金中繼續計算利息，即俗稱的「利滾利」。

與「單利（Simple Interest，利息僅依據最初本金計算且不滾入）」相比，複利在投資初期與單利差異不大，但隨著時間推移與期數增加，資產增長曲線會呈現指數級（Exponential）的暴發性飛躍。

愛因斯坦曾稱複利為「世界第八大奇蹟」，時間越長，複利所產生的利息佔比將遠遠超越您當初投入的原始本金。`,
      },
      {
        q: '什麼是 72 法則 (Rule of 72)？如何快速估算資產翻倍時間？',
        a: `72 法則是一項常用於心算資產翻倍所需年數的經驗公式：

計算公式為 資產翻倍年數 ≈ 72 / 年化報酬率(%)。

例如：
① 年化報酬率為 6% 時，資產翻倍約需 72 / 6 = 12 年。
② 年化報酬率為 12% 時，資產翻倍約需 72 / 12 = 6 年。

此法則能讓您在不使用計算機的情況下，快速評估不同報酬率下的資產翻倍效率。

延伸閱讀：[計算本金翻倍的72法!快速3秒內得解](https://www.cjkuo.net/72_double_answer/)`,
      },
      {
        q: '定期定額 (DCA) 與單筆投入 (Lump-Sum) 何者複利效果更好？',
        a: `兩者各有優劣，取決於市場趨勢與資金狀況：

① 單筆投入：若市場長期呈上升趨勢，越早將大筆資金一次性投入，享受複利的總時間最長，歷史回測的長期總報酬通常高於定期定額。

② 定期定額 (Dollar-Cost Averaging, DCA)：適合每月有穩定薪資收入的上班族。定期定額可以在市場下跌時自動買入更多單位數，平攤持股成本與波動風險，降低擇時入場心理壓力。

本試算器支援同時組合「初始本金」與「定期定額（月/年）」進行混合計算，精準呈現雙引擎驅動下的資產累積軌跡。`,
      },
      {
        q: '複利計息頻率（按月複利 vs 按年複利）對最終投資收益影響有多大？',
        a: `計息與滾利頻率越高，複利效應越顯著！

假設年利率為 8%、本金 100 萬元、投資 20 年：
① 按年複利（每年滾利 1 次）：期末本利和約為 466 萬元。
② 按月複利（每月滾利 12 次）：期末本利和約為 492 萬元（比按年複利多出約 26 萬元！）。

這是因為每月產生的微小利息會立刻投入下一個月繼續計息。本試算器提供「按月複利」、「按季複利」、「按年複利」與「單利」多種頻率供自由切換比對。`,
      },
      {
        q: '考慮通貨膨脹 (Inflation) 後，實質報酬率與複利該如何評估？',
        a: `名目報酬率（Nominal Return）並未扣除物價上漲幅度，若要計算未來的「實際購買力」，應參考費雪效果（Fisher Effect）評估實質報酬率（Real Rate of Return）：

計算公式為 實質報酬率 ≈ 名目年化報酬率 - 年通貨膨脹率。

例如預期投資名目年報酬率為 7%，若平均通膨率為 2.5%，則實質年化報酬率約為 4.5%。在試算長期退休金規劃時，建議將報酬率欄位適度扣除預期通膨率，以估算最具真實購買力的資產價值。`,
      },
      {
        q: '在線上使用複利試算器時，輸入的財務資料會被儲存或紀錄嗎？',
        a: `100% 不會！本試算器採用純前端客戶端 (Client-Side) 即時運算技術。

您輸入的所有初始本金、月扣金額、報酬率與試算結果，完全僅在您的瀏覽器記憶體中進行運算與 Canvas 圖表繪製。

全過程完全不透過網路傳送至伺服器 Log 或資料庫，亦無任何個人財務資料留存，您可以安心進行私密財務試算。`,
      },
      {
        q: '投資與理財試算免責聲明',
        a: `【理財試算免責聲明】

① 本工具提供之試算結果、年化報酬率與資產成長曲線僅供財務規劃、學習與模擬參考，不構成任何形式的投資建議、招攬或保證。

② 實際投資市場存在波動風險，歷史報酬率不代表未來績效，且實際收益受交易手續費、稅負、匯率波動與市場極端行情影響。

③ 進行任何實質投資決定前，請務必評估個人風險承受能力，並諮詢合格的專業財務顧問或金融機構。`,
      },
    ],
  },
  en: {
    title: 'Compound Interest Calculator',
    subtitle: 'COMPOUND INTEREST CALCULATOR',
    description:
      'Professional free online compound interest calculator. Supports lump sum & recurring (monthly/yearly) investments, visual growth charts, and detailed breakdown tables.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/compound-interest/',
    principalLabel: 'Initial Investment ($)',
    contributionLabel: 'Recurring Contribution ($)',
    contribFreqLabel: 'Contribution Frequency',
    contribMonth: 'Monthly',
    contribYear: 'Yearly',
    rateLabel: 'Expected Return Rate (%)',
    rateYear: 'Annual',
    rateMonth: 'Monthly',
    periodLabel: 'Investment Period',
    periodYear: 'Years',
    periodMonth: 'Months',
    freqLabel: 'Compounding Frequency',
    freqMonthly: 'Monthly Compounding',
    freqQuarterly: 'Quarterly Compounding',
    freqYearly: 'Annual Compounding',
    freqSimple: 'Simple Interest (No Compounding)',
    copyShareBtn: 'Copy Shareable Link',
    totalAssetLabel: 'Total Portfolio Value',
    totalPrincipalLabel: 'Total Principal Invested',
    totalInterestLabel: 'Total Interest Earned',
    chartTitle: 'Asset Growth Trend',
    legendInterest: 'Compound Interest',
    legendPrincipal: 'Principal Invested',
    scheduleYearTitle: 'Annual Breakdown Schedule',
    scheduleMonthTitle: 'Monthly Breakdown Schedule',
    colYearMonth: (isYr: boolean) => (isYr ? 'Year' : 'Month'),
    colStartBal: 'Start Balance',
    colContrib: 'Contribution',
    colInterest: 'Interest Earned',
    colCumulPrincipal: 'Total Principal',
    colTotal: 'End Balance',
    initialLabel: 'Initial',
    yearLabel: (y: number) => `Year ${y}`,
    monthLabel: (m: number) => `Month ${m}`,
    toastCopied: 'Shareable link copied to clipboard',
    unitY: 'yr',
    unitM: 'mo',
    unitCurrency: '$',
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Learn about compound growth, Rule of 72, DCA vs lump-sum strategy, and financial modeling disclaimers',
    faqItems: [
      {
        q: 'What is compound interest? How does it differ from simple interest?',
        a: `Compound interest is the interest calculated on the initial principal as well as all accumulated interest from previous periods. In simple terms, it is "interest earned on interest."

Unlike simple interest (where interest is calculated solely on the original principal), compound interest creates an exponential growth curve over time.

Often referred to as the "eighth wonder of the world," the compounding effect becomes dramatically pronounced over longer investment horizons, eventually causing interest earnings to far exceed original contributions.`,
      },
      {
        q: 'What is the Rule of 72? How to quickly estimate doubling time?',
        a: `The Rule of 72 is a quick financial mental math formula used to estimate the number of years required to double your investment value given a fixed annual rate of return.

Formula: Doubling Time (Years) ≈ 72 / Annual Return Rate (%).

Examples:
① At a 6% annual return, your money doubles in ~12 years (72 / 6).
② At a 12% annual return, your money doubles in ~6 years (72 / 12).

This rule offers a handy shortcut to gauge wealth multiplication speed without complex calculation engines.`,
      },
      {
        q: 'Lump-Sum vs Recurring Contribution (DCA): Which yields higher compound returns?',
        a: `Both investment strategies serve distinct market conditions and capital profiles:

① Lump-Sum Investment: If the overall market trend is bullish, allocating all capital upfront maximizes time-in-the-market, historically outperforming DCA in overall long-term yield.

② Dollar-Cost Averaging (DCA): Ideal for regular income earners. Monthly contributions automatically purchase more shares during market pullbacks, smoothing entry costs and reducing psychological timing stress.

This calculator allows you to model both initial lump-sum and recurring (monthly/annual) contributions simultaneously.`,
      },
      {
        q: 'How does compounding frequency (Monthly vs Annual) affect total returns?',
        a: `Higher compounding frequency generates slightly higher effective annual yields!

For example, with $100,000 at an 8% annual return over 20 years:
① Annual Compounding (Once per year): End balance is ~$466,095.
② Monthly Compounding (12 times per year): End balance is ~$492,680 (over $26,000 more!).

This difference occurs because earned interest is reinvested back into the balance every single month. Our calculator supports Monthly, Quarterly, Annual compounding, and Simple interest modes.`,
      },
      {
        q: 'How should I account for inflation when calculating compound interest?',
        a: `Nominal returns do not reflect purchasing power deterioration over long horizons. To evaluate true future purchasing power, apply the real return rate formula:

Formula: Real Return Rate ≈ Nominal Annual Return Rate - Annual Inflation Rate.

For example, if your nominal investment portfolio yields 7% per year and average inflation is 2.5%, your real return rate is ~4.5%. When planning long-term retirement funds, consider subtracting expected inflation from your return rate to estimate purchasing power accurately.`,
      },
      {
        q: 'Is my financial inputs or calculation data stored on any server?',
        a: `100% No! This calculator operates purely client-side inside your browser engine.

All inputs—including principal, monthly contribution amounts, rates of return, and financial projection schedules—are computed transiently in your local browser memory.

No financial numbers are sent to backend server logs or database systems, ensuring complete privacy for your personal wealth planning.`,
      },
      {
        q: 'Investment & Financial Planning Disclaimer',
        a: `[Financial Planning Disclaimer]

① All calculations, projected rates of return, and growth schedules produced by this tool are provided solely for educational, analytical, and informational reference, and do not constitute financial advice or investment solicitation.

② Market investments carry inherent risk of capital loss. Past performance is no guarantee of future results, and actual yields vary due to market volatility, transaction fees, taxes, and inflation.

③ Always evaluate your personal risk tolerance and consult a certified financial planner before committing real capital.`,
      },
    ],
  },
};

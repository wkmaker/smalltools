/**
 * 股票質押維持率計算機頁面中英文案（從 PledgeCalculatorClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    title: '股票質押維持率計算機',
    subtitle: 'STOCK PLEDGE & MARGIN CALCULATOR',
    description:
      '專業免費的線上股票質押與維持率壓力測試計算機！支援張/股單位切換、自訂 130%/160% 門檻、動態 SVG 儀表板、0%-60% 大跌模擬與保證金回補金額試算。',
    langToggleLabel: 'English',
    langToggleUrl: '/pledge-calculator/en/',
    assetSettingTitle: '質押資產設定',
    stockPriceLabel: '目前個股單價 (元)',
    stockQtyLabel: '持股數量',
    unitShares: '股',
    unitLots: '張',
    marketValueLabel: '目前股票總市值',
    loanAmountLabel: '借款本金 (元)',
    loanAnnualRateLabel: '質押年利率 (%)',
    monthlyInterestLabel: '預估每月利息支出',
    semiAnnualInterestLabel: '半年結算利息',
    maxLoan60: '60% 上限',
    loanBtn60: '帶入 60% 借款 (成數上限)',
    loanBtn50: '帶入 50% 借款 (保留緩衝)',
    presetsTitle: '快速套用試算情境',
    presetTsmc: '台積電滿額 (借 6 成)',
    presetEtf: '高股息低成數 (借 4 成)',
    presetAlert: '警戒體驗 (維持率 132%)',
    warnRateLabel: '追繳維持率門檻 (%)',
    safeRateLabel: '目標緩衝維持率 (%)',
    copyShareBtn: '複製質押試算分享連結',
    copySummaryBtn: '複製分析摘要文字',
    dashboardTitle: '質押維持率風險儀表板',
    gaugeAriaLabel: '質押擔保維持率風險儀表板',
    currentRatioLabel: '目前整戶維持率',
    ltvRatioLabel: '借款佔市值比 (LTV)',
    bufferToSafeLabel: '距目標線空間',
    bufferToWarnLabel: '距追繳線空間',
    legendDanger: (w: number) => `< ${w}% 追繳區`,
    legendWarn: (w: number, s: number) => `${w}%–${s}% 警戒區`,
    legendSafe: (s: number) => `≥ ${s}% 目標區`,
    statusNoLoan: '目前無借款部位',
    statusSafe: '高於目標維持率',
    statusWarning: '低於目標維持率 (注意緩衝)',
    statusDanger: '觸發追繳門檻 (面臨斷頭風險)',
    stressTestTitle: '模擬大盤 / 股價大跌壓力測試',
    stressShortcut10: '-10% (1 根跌停)',
    stressShortcut20: '-20% (回檔修正)',
    stressShortcut30: '-30% (空頭崩盤)',
    stressReset: '重設 0%',
    simPriceLabel: '模擬股價',
    simValueLabel: '模擬總市值',
    warnPriceTitle: (rate: number) => `觸發追繳臨界價 (${rate}%)`,
    safePriceTitle: (rate: number) => `目標緩衝臨界價 (${rate}%)`,
    allowDrop: '容許跌幅',
    limitDownDaysDesc: (days: number) => `相當於 ${days} 根跌停板`,
    replenishAlertBelow: (rate: number) => `已低於目標維持率 ${rate}%，回補方案試算：`,
    replenishAlertSafe: '目前高於目標維持率（仍須留意極端行情與流動性風險）',
    planA: '方案 A：償還借款本金',
    planB: '方案 B：補繳現金擔保',
    planC: '方案 C：追加現股擔保品',
    planCDesc: (shares: number, lots: number) => `需追加約 ${shares.toLocaleString('zh-TW')} 股（約 ${lots.toLocaleString('zh-TW')} 張）`,
    collateralPriceLabel: '現股單價',
    toastCopied: '已複製質押維持率試算分享連結',
    toastSummaryCopied: '已複製質押分析摘要報告至剪貼簿',
    currencyUnit: '元',

    faqTitle: '常問問題與專業指南 (FAQ)',
    faqSubtitle: '深入了解股票質押借款、維持率 130% 斷頭臨界價算式與追繳補救策略',
    faqItems: [
      {
        q: '什麼是股票質押？成數與維持率公式如何計算？',
        a: `股票質押（擔保品貸款）是將手中持有的股票向券商或銀行抵押借出現金。

公式如下：
① 借款金額上限：
股票總市值 × 質押成數（台股常規最高成數為 60%）。

② 維持率 (%) 算式：
維持率 = (股票當前總市值 ÷ 總借款金額) × 100%。

例如借款 60 萬元買 100 萬股票，起始維持率即為 166.7%。`,
      },
      {
        q: '股票質押維持率低於 130% 會發生什麼事？什麼是「追繳通知」與「斷頭賣出」？',
        a: `追繳與斷頭機制如下：

① 追繳通知 (Margin Call)：
當台股大跌導致質押股票總市值下滑，使整戶維持率低於 130% 時，券商或銀行會發出追繳通知，要求借款人在 2 個營業日內補繳現金或追加股票擔保品至維持率恢復至 166% 以上。

② 斷頭處分：
若未在期限內補繳，券商將於第 3 個營業日開盤時，以市價強行賣出質押股票抵償借款，稱為「斷頭」。`,
      },
      {
        q: '如何精準計算股票質押的「斷頭追繳臨界股價」？',
        a: `追繳臨界股價即為維持率降至 130% 時的股票價格算式：

① 追繳臨界股價算式：
追繳臨界股價 = (總借款金額 × 1.3) ÷ 持有總股數。

② 算例說明：
例如您借款 60 萬元，持有 1,000 股，追繳臨界股價即為 (600,000 × 1.3) ÷ 1,000 = 780 元。本工具會自動試算並在地圖儀表板上醒目標示。`,
      },
      {
        q: '當維持率面臨追繳警告時，有哪些補救與提升維持率的方法？',
        a: `提升維持率有三大常見策略：

① 直接償還部分本金：
還款可立即降低分母（借款金額），迅速拉高維持率。

② 追加劃撥擔保股票：
將名下其他優質現股劃撥質押至同一個質押帳戶，增加分子（總市值）。

③ 補繳現金保證金：
依券商規定存入保證金專戶。`,
      },
      {
        q: '股票質押有哪些隱藏槓桿風險？為什麼說券商可能「雨天收傘」？',
        a: `股票質押本質上是利用既有股票開槓桿。在市場多頭時可放大資金效率，但在股市暴跌時，擔保品市值急遽縮水，維持率會加速逼近 130% 追繳門檻。

此外，特別需要注意券商「雨天收傘」風險：
① 拒絕展延或強制要求還款：
質押借款期限多為 6 個月，到期時若適逢市場大跌或券商內部質押總額度用盡，券商有權拒絕申請展延，要求您一次還清本金。

② 機動調升借款利率：
券商得依市場資金成本隨時調整質押利率。

因此建議切勿將槓桿開滿，隨時預留足夠的流動性備用金。`,
      },
      {
        q: '本工具的試算結果是否適用於所有券商與銀行？（免責警語與計算差異）',
        a: `本工具計算結果僅供投資參考，實際數字請務必以各券商或銀行官方公告為主。

各家券商與銀行在細節規範上可能有所差異，例如：
① 維持率計算基準價：
部分券商採用「前一日收盤價」，部分採用「盤中即時價」或「當日收盤價」。

② 個別股票成數上限：
部分中小型股或高波動股質押成數可能低於 60%（如 50% 或 40%）。

③ 費用與手續費：
撥款手續費、開戶規費與跨行轉帳費用未列入本工具利息估算。`,
      },
      {
        q: '股票質押發放的「股利與股息」歸誰所有？會被券商扣走嗎？',
        a: `股利與股息完全歸借款人所有！

在股票質押期間，股票所有權人仍為借款人本人。除權息時產生的現金股利會直接匯入您的交割帳戶，股票股利亦會劃撥入戶。`,
      },
      {
        q: '股票質押利息如何計算？借款期限多長？',
        a: `利息計算與借款期限說明：

① 利息算式：
股票質押利息按天計算（年利率 ÷ 365 × 借款天數），每半年結算一次利息。

② 借款與展延期限：
常規質押期限為 6 個月，到期前若維持率維持良好且付清利息，得申請展延 6 個月，最長可連續展延至 1.5 年至 2 年，無須強制賣股還款。`,
      },
    ],
  },
  en: {
    title: 'Stock Margin & Pledge Calculator',
    subtitle: 'STOCK PLEDGE & MARGIN CALCULATOR',
    description:
      'Free online stock pledge & margin ratio calculator! Supports shares/lots toggle, customizable 130%/160% thresholds, SVG risk gauge, 0%-60% market crash stress test, and cash replenishment simulation.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/pledge-calculator/',
    assetSettingTitle: 'Pledged Asset Settings',
    stockPriceLabel: 'Current Stock Price ($)',
    stockQtyLabel: 'Share Quantity',
    unitShares: 'Shares',
    unitLots: 'Lots (1,000)',
    marketValueLabel: 'Total Market Value',
    loanAmountLabel: 'Loan Principal ($)',
    loanAnnualRateLabel: 'Annual Interest Rate (%)',
    monthlyInterestLabel: 'Estimated Monthly Interest',
    semiAnnualInterestLabel: 'Semi-Annual Interest',
    maxLoan60: '60% Cap',
    loanBtn60: '60% Loan Cap',
    loanBtn50: '50% Loan (With Buffer)',
    presetsTitle: 'Quick Presets',
    presetTsmc: 'TSMC 60% Max Loan',
    presetEtf: 'Dividend ETF 40% LTV',
    presetAlert: 'Warning Simulation (132%)',
    warnRateLabel: 'Margin Call Threshold (%)',
    safeRateLabel: 'Target Buffer Margin (%)',
    copyShareBtn: 'Copy Shareable Link',
    copySummaryBtn: 'Copy Text Summary',
    dashboardTitle: 'Margin Ratio Risk Gauge',
    gaugeAriaLabel: 'Stock Pledge Margin Ratio Risk Gauge',
    currentRatioLabel: 'Current Margin Ratio',
    ltvRatioLabel: 'Loan-to-Value (LTV)',
    bufferToSafeLabel: 'To Target Margin',
    bufferToWarnLabel: 'To Margin Call',
    legendDanger: (w: number) => `< ${w}% Margin Call`,
    legendWarn: (w: number, s: number) => `${w}%–${s}% Caution`,
    legendSafe: (s: number) => `≥ ${s}% Target`,
    statusNoLoan: 'No Active Loan',
    statusSafe: 'Above Target Margin',
    statusWarning: 'Below Target Margin (Caution)',
    statusDanger: 'Margin Call Triggered!',
    stressTestTitle: 'Market Crash Stress Test Simulation',
    stressShortcut10: '-10% (1 Limit Down)',
    stressShortcut20: '-20% (Market Pullback)',
    stressShortcut30: '-30% (Market Crash)',
    stressReset: 'Reset 0%',
    simPriceLabel: 'Simulated Stock Price',
    simValueLabel: 'Simulated Market Value',
    warnPriceTitle: (rate: number) => `Margin Call Trigger Price (${rate}%)`,
    safePriceTitle: (rate: number) => `Target Buffer Price (${rate}%)`,
    allowDrop: 'Max Allowed Drop',
    limitDownDaysDesc: (days: number) => `Equivalent to approx. ${days} limit-downs`,
    replenishAlertBelow: (rate: number) => `Below target margin (${rate}%). Replenishment required:`,
    replenishAlertSafe: 'Currently above target margin (Always monitor market volatility & liquidity risks)',
    planA: 'Plan A: Repay Loan Principal',
    planB: 'Plan B: Deposit Cash Guarantee',
    planC: 'Plan C: Deposit Stock Collateral',
    planCDesc: (shares: number, lots: number) => `Requires approx. ${shares.toLocaleString('en-US')} shares (${lots.toLocaleString('en-US')} lots)`,
    collateralPriceLabel: 'Stock Price',
    toastCopied: 'Shareable link copied to clipboard',
    toastSummaryCopied: 'Pledge analysis summary copied to clipboard',
    currencyUnit: '$',

    faqTitle: 'Frequently Asked Questions & Guide',
    faqSubtitle: 'Learn more about stock pledging, maintenance ratio calculations, margin call thresholds, and risk mitigation strategies.',
    faqItems: [
      {
        q: 'What is stock pledging, and how are loan-to-value (LTV) and maintenance ratios calculated?',
        a: `Stock pledging allows investors to use held shares as collateral for cash loans.

Formulas:
① Max Loan Amount:
Total Stock Market Value × Pledge Ratio (usually up to 60% in Taiwan).

② Maintenance Ratio (%):
(Current Total Stock Value ÷ Total Loan Amount) × 100%.

For instance, pledging $1M in stock to borrow $600K results in an initial maintenance ratio of 166.7%.`,
      },
      {
        q: 'What happens when the maintenance ratio falls below 130%? What is a Margin Call and Liquidation?',
        a: `Margin calls and liquidation mechanisms:

① Margin Call:
If market drops reduce collateral value below 130%, brokers issue a margin call requiring additional cash or shares within 2 business days to restore maintenance above 166%.

② Forced Liquidation:
Failing to meet margin calls results in brokers forcibly selling pledged shares at market open on the 3rd business day.`,
      },
      {
        q: 'How is the 130% Margin Call Threshold Stock Price calculated?',
        a: `Margin Call Price Formula:

① Formula:
Margin Call Price = (Total Loan Amount × 1.3) ÷ Total Shares.

② Example:
Borrowing $600,000 against 1,000 shares yields a threshold price of ($600,000 × 1.3) ÷ 1,000 = $780. Our calculator automatically computes and displays this threshold.`,
      },
      {
        q: 'How can investors increase their maintenance ratio during a market crash?',
        a: `Three common strategies:

① Repay Loan Principal:
Directly reduces loan amount (denominator), rapidly elevating maintenance ratio.

② Deposit Additional Collateral Shares:
Transfer other eligible stocks into the pledge account to increase total collateral value (numerator).

③ Deposit Cash Margin:
Deposit cash directly into the margin account as required by brokers.`,
      },
      {
        q: 'What are the leverage risks of stock pledging? What does broker "umbrella recall" risk mean?',
        a: `Stock pledging is inherently leverage. During market crashes, collateral value drops rapidly, accelerating margin call risks.

Crucially, beware of broker "umbrella recall" risks:
① Refusal to extend or demanding early repayment:
Brokers retain full discretion to deny loan extensions upon 6-month term expiration, especially during market turmoil or when total lending quotas are reached.

② Floating interest rate hikes:
Brokers may adjust pledge interest rates based on market capital costs.

Always maintain conservative leverage and reserve liquidity!`,
      },
      {
        q: 'Are calculation results identical across all brokers and banks? (Disclaimer & Variations)',
        a: `Results provided by this tool are for estimation and reference only. Please refer to your broker's official statements for actual settlement numbers.

Variations between institutions include:
① Reference Price for Maintenance Ratio:
Some brokers use previous day closing prices, while others use real-time intraday or daily closing prices.

② Pledge Ratio Caps:
High-volatility or small-cap stocks may have lower pledge ratios (e.g. 40%–50% instead of 60%).

③ Fees & Charges:
Origination fees or wire transfer costs are excluded from calculations.`,
      },
      {
        q: 'Who receives dividends and stock distributions during stock pledging?',
        a: `Dividends and stock splits belong 100% to the borrower!

The borrower retains underlying stock ownership throughout the pledge term. Cash dividends are deposited into your settlement account.`,
      },
      {
        q: 'How is pledge loan interest calculated, and what is the maximum loan duration?',
        a: `Interest and loan duration:

① Interest Calculation:
Interest is calculated daily (Annual Rate ÷ 365 × Days) and settled semi-annually.

② Term & Extensions:
Standard terms are 6 months, expandable up to 1.5–2 years upon request provided maintenance ratios remain healthy.`,
      },
    ],
  },
};

/**
 * 台股期貨槓桿計算機頁面中英文案（從 FuturesCalculatorClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    title: '台股期貨槓桿計算機',
    subtitle: 'TAIWAN FUTURES RISK & MARGIN CALCULATOR',
    description:
      '專業免費的線上台指期 (大台/小台/微台/自訂) 槓桿與維持率計算器！支援多空雙向部位切換、實質槓桿試算、0%-60%逆風壓力測試與保證金回補金額估算。',
    sectionSettings: '期貨部位與保證金設定',
    scenariosTitle: '快速套用試算情境',
    scenarioConservative: '穩健波段 (微台 2 口・3 倍金)',
    scenarioStandard: '標準配置 (小台 1 口・2 倍金)',
    scenarioAlert: '高槓桿警戒 (大台 1 口・1.2 倍金)',
    presetLabel: '商品規格',
    presetTx: '大台 (TX)',
    presetMtx: '小台 (MTX)',
    presetTmf: '微台 (TMF)',
    presetCustom: '自訂商品',
    customPtValLabel: '自訂每點點值 (元/點)',
    directionLabel: '交易方向 (部位)',
    positionLong: '多頭 (看漲 做多)',
    positionShort: '空頭 (看跌 做空)',
    indexLabel: '成交指數點位 (點)',
    indexPlaceholder: '例如：22,000',
    qtyLabel: '下單口數 (口)',
    lotsUnit: '口',
    capitalLabel: '準備本金 (元)',
    capPreset10: '1.0x 最低開倉',
    capPreset15: '1.5x 原始保證金',
    capPreset20: '2.0x 原始保證金',
    capPreset30: '3.0x 低槓桿緩衝',
    initMarginLabel: '單口原始保證金 (元)',
    maintMarginLabel: '單口維持保證金 (元)',
    shareBtn: '複製期貨槓桿試算分享連結',
    copySummaryBtn: '複製分析摘要文字',
    dashboardTitle: '風控指標與實質槓桿儀表板',
    gaugeAriaLabel: '期貨帳戶風險指標儀表板',
    currentRiskRatioLabel: '目前風險指標',
    excessMarginLabel: '超額可用保證金',
    bufferToMarginCallLabel: '距追繳線空間',
    bufferToLiqLabel: '距砍倉線空間 (25%)',
    legendLiq: '< 25% 砍倉區',
    legendCall: (m: number) => `25%–${m}% 追繳區`,
    legendWarn: (m: number) => `${m}%–100% 警戒區`,
    legendSafe: '≥ 100% 原始線',
    statusSafeFull: '目前無持倉部位',
    statusSafe: '高於原始保證金 (≥100%)',
    statusWarning: '低於原始保證金 (注意緩衝)',
    statusMarginCall: '低於維持保證金 (觸發盤後追繳)',
    statusLiquidation: '低於 25% 門檻 (面臨強制平倉)',
    contractValTitle: '合約總價值 (規模)',
    leverageTitle: '當前實質資金槓桿',
    leverageLow: '低槓桿緩衝區 (≤2.5x)',
    leverageMid: '中等槓桿區間 (2.5x–5x)',
    leverageHigh: '高槓桿波動風險 (>5x)',
    stressTitleLong: '模擬逆風波段 (指數下跌)',
    stressTitleShort: '模擬逆風波段 (指數上漲)',
    stressReset: '重設 0%',
    stressShortcut5: '逆風 5%',
    stressShortcut10: '逆風 10% (1 根停板)',
    stressShortcut20: '逆風 20% (波段重挫)',
    stressPoints: '折合',
    stressPointsUnit: '點',
    simIndexLabel: '模擬成交指數',
    simCapitalLabel: '預估模擬權益數',
    simLossLabel: '模擬損益：',
    marginCallTitle: '追繳警示點位 (維持保證金)',
    liqTitle: '強制平倉點位 (風險指標 25%)',
    noTriggerFloor: '0 點 (指數歸零前不觸發)',
    allowWind: '容許逆風：',
    alreadyBelowThreshold: '0 點 (已低於門檻)',
    limitMoveDaysLong: (days: number) => `相當於可承受約 ${days} 根跌停板`,
    limitMoveDaysShort: (days: number) => `相當於可承受約 ${days} 根漲停板`,
    pointsUnit: '點',
    topupAlertMarginCall: '已低於維持保證金（觸發盤後追繳），回補與減倉方案試算：',
    topupWarning: '模擬權益數低於總原始保證金（<100%），回補與減倉方案試算：',
    topupSafe: '目前權益數高於原始保證金（仍須留意隔夜跳空與極端行情穿價風險）',
    topupCashLabel: '方案 A：補足至 100% 原始保證金需入金',
    maintGapDesc: (gap: number) => `（距離維持保證金警戒線差額：$${gap.toLocaleString('zh-TW')} 元）`,
    maintAboveDesc: '（目前高於維持保證金，未觸發盤後追繳）',
    planBLabel: '方案 B：不入金・平倉減碼降部位',
    planBDesc: (reduceLots: number, remainLots: number) =>
      remainLots > 0
        ? `需平倉減少 ${reduceLots} 口（剩餘 ${remainLots} 口可維持 100% 原始保證金）`
        : `需全數平倉 ${reduceLots} 口（現有權益不足維持 1 口原始保證金）`,
    planBSafeDesc: (qty: number) => `目前權益足以維持現有 ${qty} 口部位之 100% 原始保證金`,
    currencyUnit: '元',
    toastCopied: '已複製期貨槓桿試算分享連結',
    toastSummaryCopied: '已複製期貨風控分析摘要至剪貼簿',
    langToggleLabel: 'English',
    langToggleUrl: '/futures-calculator/en/',

    faqTitle: '常見問題與專業指南',
    faqSubtitle: '深入了解台指期保證金制度、實質槓桿計算、逆風耐受點數與盤中追繳斷頭機制',
    faqItems: [
      {
        q: '什麼是期貨交易的「原始保證金」與「維持保證金」？',
        a: `期貨採用保證金交易制度 (Margin Trading)：

① 原始保證金 (Initial Margin)：
建立期貨部位（開倉）時，期貨帳戶內必須具備的最少資金門檻。

② 維持保證金 (Maintenance Margin)：
持有部位期間，帳戶權益數（權益總值）必須維持的最低警戒金額。若權益數低於維持保證金，將觸發盤後追繳通知。`,
      },
      {
        q: '大台 (TX)、小台 (MTX) 與微台 (TMF) 每點契約價值與保證金有何差別？',
        a: `台指期貨三大合約對照如下：

① 大台 (TX)：
每點 200 元。原始保證金約 241,000 元。

② 小台 (MTX)：
每點 50 元 (大台的 1/4)。原始保證金約 60,250 元。

③ 微台 (TMF)：
每點 10 元 (小台的 1/5)。原始保證金約 12,050 元。

投資人可依自身資金規模與風險承受度，靈活選擇適合的槓桿合約。`,
      },
      {
        q: '什麼是期貨「追繳 (Margin Call)」與「砍倉 / 斷頭 (Liquidation)」？在劇烈行情下砍倉能保證止損嗎？',
        a: `期貨風控與極端行情穿價風險如下：

① 期貨追繳 (Margin Call)：
盤後結算時，若帳戶權益數低於「維持保證金」，期貨商會發出追繳通知，要求在下個交易日中午 12:00 前補足至「原始保證金」。

② 盤中強制砍倉 (斷頭)：
盤中交易時，若行情劇烈逆風導致帳戶風險指標降至 25% 以下，期貨商系統將不經通知自動以市價委託單強行平倉（砍倉）所有部位。

③ 【極端行情滑價與超額虧損警示 (Over-Loss / 穿價風險)】：
請特別注意！即使觸發砍倉門檻，並不代表就能在該價位「完美止損」！

在市場發生暴跌、跳空、滑價 (Slippage) 或漲跌停鎖死等極端劇烈行情時，期貨商的市價砍倉單可能遭遇無人承接或成交在極度不利的價位，導致實際虧損遠超過帳戶內的全部本金（產生超額虧損 Over-Loss，需追繳負債現金）！

交易者切勿將強制砍倉當成安全防線，務必嚴格控制槓桿與風控。`,
      },
      {
        q: '如何計算期貨部位的「實質槓桿倍數」？高槓桿有何風險？',
        a: `計算方式與槓桿風險說明：

① 實質槓桿倍數算式：
實質槓桿倍數 = 期貨部位總名目價值 ÷ 帳戶實際投入總資金。

② 算例說明：
以台指期在 22,000 點為例，一口大台總名目價值為 22,000 × 200 = 4,400,000 元。若您帳戶僅存入最低原始保證金 241,000 元，實質槓桿即高達 18.25 倍！大盤僅需反向波動 5.4% 即可能導致帳戶本金全數歸零。

③ 建議：
建議帳戶保留 2 至 3 倍以上的原始保證金，以有效降低槓桿與爆倉風險。`,
      },
      {
        q: '什麼是期貨的「逆風承受點數 (Adverse Movement Range)」？',
        a: `逆風承受點數代表在部位觸發追繳或斷頭前，大盤指數最多允許反向波動的點數。

① 多單算式：
多單逆風點數 = (帳戶當前權益數 - 維持保證金) ÷ 每點價值。

② 空單算式：
空單逆風點數 = (帳戶當前權益數 - 維持保證金) ÷ 每點價值。

本工具能精準算出多單與空單在不同資金配置下的耐受點數，協助交易者掌握停損與補繳警戒線。`,
      },
      {
        q: '期貨留倉過夜有哪些風險？如何預防跳空開高 / 開低？',
        a: `留倉過夜面臨國際股市（如美股、台指夜盤）劇烈波動帶來的「隔日跳空風險」。

預防措施包含：
① 避開重大事件：避開美聯儲利率決議、重大財報日過夜。
② 降低槓桿：適度降低持倉口數與槓桿倍數。
③ 設定停損單：掛好停損單 (Stop-Loss Order) 或利用停損限價單保護部位。
④ 微台避險：利用微台指 (TMF) 進行精細化的部位對沖。`,
      },
    ],

    // 場景化贊助呼籲
    sponsorCardTitle: '嚴控槓桿，安心交易！',
    sponsorCardDesc:
      '若這份期貨保證金試算、逆風點數與壓力測試有幫助您精準掌握維持保證金與斷頭風險，歡迎請作者喝杯咖啡，支持系統獨立維護！',
    sponsorCardBtn: '請作者喝杯咖啡',
  },
  en: {
    title: 'Futures Risk & Margin Calculator',
    subtitle: 'TAIWAN FUTURES RISK & MARGIN CALCULATOR',
    description:
      'Free online Taiwan Index Futures (TX, MTX, TMF) risk & margin calculator! Supports Long/Short positions, actual leverage, 0-60% adverse stress testing, and margin call threshold estimation.',
    sectionSettings: 'Position & Margin Settings',
    scenariosTitle: 'Quick Scenario Presets',
    scenarioConservative: 'Low Leverage (2 TMF · 3x Margin)',
    scenarioStandard: 'Balanced (1 MTX · 2x Margin)',
    scenarioAlert: 'High Leverage (1 TX · 1.2x Margin)',
    presetLabel: 'Contract Type',
    presetTx: 'Large TX',
    presetMtx: 'Mini MTX',
    presetTmf: 'Micro TMF',
    presetCustom: 'Custom',
    customPtValLabel: 'Custom Point Value ($/pt)',
    directionLabel: 'Position Direction',
    positionLong: 'Long (Bullish)',
    positionShort: 'Short (Bearish)',
    indexLabel: 'Entry Index Price (pts)',
    indexPlaceholder: 'e.g. 22,000',
    qtyLabel: 'Order Quantity (lots)',
    lotsUnit: 'lots',
    capitalLabel: 'Total Capital ($)',
    capPreset10: '1.0x Min Initial',
    capPreset15: '1.5x Initial Margin',
    capPreset20: '2.0x Initial Margin',
    capPreset30: '3.0x Low Leverage',
    initMarginLabel: 'Initial Margin / Lot ($)',
    maintMarginLabel: 'Maintenance Margin / Lot ($)',
    shareBtn: 'Copy Futures Share Link',
    copySummaryBtn: 'Copy Summary Report',
    dashboardTitle: 'Risk Indicator & Real Leverage Dashboard',
    gaugeAriaLabel: 'Futures Account Risk Indicator Gauge',
    currentRiskRatioLabel: 'Current Risk Ratio',
    excessMarginLabel: 'Excess Margin',
    bufferToMarginCallLabel: 'Buffer to Margin Call',
    bufferToLiqLabel: 'Buffer to Liquidation (25%)',
    legendLiq: '< 25% Liq.',
    legendCall: (m: number) => `25%–${m}% Call`,
    legendWarn: (m: number) => `${m}%–100% Buffer`,
    legendSafe: '≥ 100% Initial',
    statusSafeFull: 'No Active Position',
    statusSafe: 'Above Initial Margin (≥100%)',
    statusWarning: 'Below Initial Margin (Watch Buffer)',
    statusMarginCall: 'Below Maintenance (Margin Call)',
    statusLiquidation: 'Below 25% Threshold (Liquidation Risk)',
    contractValTitle: 'Total Contract Value',
    leverageTitle: 'Actual Capital Leverage',
    leverageLow: 'Low Leverage Buffer (≤2.5x)',
    leverageMid: 'Moderate Leverage (2.5x–5x)',
    leverageHigh: 'High Leverage Volatility (>5x)',
    stressTitleLong: 'Adverse Stress Test (Index Drop)',
    stressTitleShort: 'Adverse Stress Test (Index Rise)',
    stressReset: 'Reset 0%',
    stressShortcut5: 'Adverse 5%',
    stressShortcut10: 'Adverse 10% (1 Limit)',
    stressShortcut20: 'Adverse 20% (Crash)',
    stressPoints: 'Equivalent to',
    stressPointsUnit: 'pts',
    simIndexLabel: 'Simulated Index Price',
    simCapitalLabel: 'Simulated Equity',
    simLossLabel: 'Sim. P&L: ',
    marginCallTitle: 'Margin Call Threshold (Maint. Margin)',
    liqTitle: 'Liquidation Threshold (Risk 25%)',
    noTriggerFloor: '0 pts (Not triggered above 0)',
    allowWind: 'Adverse Tolerance: ',
    alreadyBelowThreshold: '0 pts (Below threshold)',
    limitMoveDaysLong: (days: number) => `Approx. ${days} limit-down days (10%)`,
    limitMoveDaysShort: (days: number) => `Approx. ${days} limit-up days (10%)`,
    pointsUnit: 'pts',
    topupAlertMarginCall: 'Below Maintenance Margin (Margin Call Triggered). Remedy Options:',
    topupWarning: 'Simulated Equity Below Initial Margin (<100%). Remedy Options:',
    topupSafe: 'Currently Above Initial Margin (Monitor overnight gap & slippage risks)',
    topupCashLabel: 'Plan A: Deposit Cash to Restore 100% Initial Margin',
    maintGapDesc: (gap: number) => `(Shortfall to Maintenance Margin: $${gap.toLocaleString('en-US')})`,
    maintAboveDesc: '(Above Maintenance Margin; post-market call not yet triggered)',
    planBLabel: 'Plan B: Reduce Position (No Cash Deposit)',
    planBDesc: (reduceLots: number, remainLots: number) =>
      remainLots > 0
        ? `Close ${reduceLots} lot(s) (${remainLots} lot(s) can maintain 100% initial margin)`
        : `Close all ${reduceLots} lot(s) (Equity insufficient for 1 lot initial margin)`,
    planBSafeDesc: (qty: number) => `Current equity covers 100% initial margin for all ${qty} lot(s)`,
    currencyUnit: '$',
    toastCopied: 'Futures share link copied to clipboard',
    toastSummaryCopied: 'Futures risk summary copied to clipboard',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/futures-calculator/',

    faqTitle: 'Frequently Asked Questions & Guide',
    faqSubtitle: 'Learn more about Taiwan Futures margin systems, actual leverage calculations, points tolerance, and liquidation mechanisms.',
    faqItems: [
      {
        q: 'What are Initial Margin and Maintenance Margin in futures trading?',
        a: `Futures use a margin-based trading framework:

① Initial Margin:
Minimum capital required in your account to open a new futures position.

② Maintenance Margin:
Minimum equity threshold required to keep a position open. Falling below this triggers a post-market Margin Call.`,
      },
      {
        q: 'What are the differences between TX (Large), MTX (Mini), and TMF (Micro) Taiwan Index Futures?',
        a: `Comparison of Taiwan Index Futures contracts:

① TX (Large):
NT$200 per point. Initial margin ~NT$241,000.

② MTX (Mini):
NT$50 per point (1/4 of TX). Initial margin ~NT$60,250.

③ TMF (Micro):
NT$10 per point (1/5 of MTX). Initial margin ~NT$12,050.

Investors can select contracts matching their capital size and risk tolerance.`,
      },
      {
        q: 'What is a Futures Margin Call and Forced Liquidation? Does forced liquidation guarantee loss prevention during extreme market volatility?',
        a: `Risk management rules and extreme slippage risks:

① Margin Call:
Issued after market close if equity falls below Maintenance Margin, requiring deposits back up to Initial Margin by 12:00 PM next business day.

② Forced Liquidation:
If intraday risk indicator drops below 25%, brokers automatically liquidate positions via market orders without prior notice.

③ [Extreme Volatility Slippage & Over-Loss Risk]:
Crucial Warning: Triggering liquidation threshold DOES NOT guarantee an ideal exit price!

During extreme market crashes, limit locks, overnight gaps, or severe slippage, broker liquidation market orders may fail to execute immediately or fill at catastrophic prices. This can result in losses exceeding your entire account capital (Over-Loss deficit requiring cash repayment).

Traders must never rely on forced liquidation as a safety net and must strictly control leverage and risk.`,
      },
      {
        q: 'How is actual leverage calculated, and what are the risks of high leverage?',
        a: `Calculation and leverage risks:

① Actual Leverage Formula:
Actual Leverage = Total Contract Nominal Value ÷ Total Capital Deposited.

② Example:
At 22,000 points, 1 TX contract is worth NT$4,400,000. Depositing only initial margin (NT$241,000) yields 18.25x leverage! A 5.4% adverse market move wipes out 100% of equity.

③ Recommendation:
Maintain 2x to 3x initial margin to prevent liquidation risks.`,
      },
      {
        q: 'What is Adverse Movement Range (Points Tolerance)?',
        a: `Adverse Movement Range represents the maximum index points the market can move against your position before triggering margin calls or liquidation.

Formulas:
① Long Adverse Points = (Current Equity - Maintenance Margin) ÷ Point Value.
② Short Adverse Points = (Current Equity - Maintenance Margin) ÷ Point Value.`,
      },
      {
        q: 'What are the risks of holding overnight futures positions?',
        a: `Overnight positions face gap risks driven by global market movements.

Risk mitigation strategies:
① Avoid Major Events: Close positions before Fed interest rate decisions or major earnings calls.
② Lower Leverage: Reduce position lot sizes and leverage multiples.
③ Use Stop-Loss Orders: Set stop-loss orders or stop-limit orders.
④ Micro Hedging: Utilize Micro Taiwan Index Futures (TMF) for fine-tuned hedging.`,
      },
    ],

    // Contextual Sponsor Card
    sponsorCardTitle: 'Master Leverage, Trade with Discipline!',
    sponsorCardDesc:
      'If this futures margin calculator and stress testing helped safeguard your equity and manage risk, consider supporting continuous maintenance with a coffee!',
    sponsorCardBtn: 'Buy Author a Coffee',
  },
};

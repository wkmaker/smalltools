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
    capitalLabel: '準備本金 (元)',
    capPreset15: '投入 1.5 倍原始保證金',
    capPreset20: '投入 2.0 倍原始保證金',
    initMarginLabel: '單口原始保證金 (元)',
    maintMarginLabel: '單口維持保證金 (元)',
    shareBtn: '複製期貨槓桿試算分享連結',
    dashboardTitle: '風控指標與實質槓桿儀表板',
    statusSafeFull: '部位完全安全',
    statusSafe: '安全 (高於原始保證金)',
    statusWarning: '警示 (低於原始保證金)',
    statusMarginCall: '追繳 (低於維持保證金)',
    statusLiquidation: '即將強制平倉 (風險 < 25%)',
    contractValTitle: '合約總價值 (規模)',
    leverageTitle: '當前實質資金槓桿',
    leverageLow: '安全風控等級',
    leverageMid: '適中風險等級',
    leverageHigh: '高槓桿高風險',
    stressTitleLong: '模擬逆風波段 (指數下跌)',
    stressTitleShort: '模擬逆風波段 (指數上漲)',
    stressPoints: '折合',
    stressPointsUnit: '點',
    simIndexLabel: '模擬成交指數',
    simCapitalLabel: '預估模擬權益數',
    simLossLabel: '損益：',
    marginCallTitle: '追繳警示點位 (維持保證金)',
    liqTitle: '強制平倉點位 (風險指標 25%)',
    allowWind: '容許逆風：',
    pointsUnit: '點',
    topupWarning: '模擬權益數已低於總原始保證金，回補至 100% 原始保證金水位：',
    topupSafe: '權益數高於原始保證金，無須補繳',
    topupCashLabel: '需補足至 100% 原始保證金之現金',
    currencyUnit: '元',
    toastCopied: '已複製期貨槓桿試算分享連結',
    langToggleLabel: 'English',
    langToggleUrl: '/futures-calculator/en/',

    faqTitle: '常問問題與專業指南 (FAQ)',
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
  },
  en: {
    title: 'Futures Risk & Margin Calculator',
    subtitle: 'TAIWAN FUTURES RISK & MARGIN CALCULATOR',
    description:
      'Free online Taiwan Index Futures (TX, MTX, TMF) risk & margin calculator! Supports Long/Short positions, actual leverage, 0-60% adverse stress testing, and margin call threshold estimation.',
    sectionSettings: 'Position & Margin Settings',
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
    capitalLabel: 'Total Capital ($)',
    capPreset15: 'Use 1.5x Initial Margin',
    capPreset20: 'Use 2.0x Initial Margin',
    initMarginLabel: 'Initial Margin / Lot ($)',
    maintMarginLabel: 'Maintenance Margin / Lot ($)',
    shareBtn: 'Copy Futures Share Link',
    dashboardTitle: 'Risk Indicator & Real Leverage Dashboard',
    statusSafeFull: 'Fully Safe',
    statusSafe: 'Safe (Above Initial Margin)',
    statusWarning: 'Warning (Below Initial Margin)',
    statusMarginCall: 'Margin Call (Below Maintenance)',
    statusLiquidation: 'Liquidation Risk (Risk < 25%)',
    contractValTitle: 'Total Contract Value',
    leverageTitle: 'Actual Capital Leverage',
    leverageLow: 'Safe Risk Level',
    leverageMid: 'Moderate Risk Level',
    leverageHigh: 'High Leverage Risk',
    stressTitleLong: 'Adverse Stress Test (Index Drop)',
    stressTitleShort: 'Adverse Stress Test (Index Rise)',
    stressPoints: 'Equivalent to',
    stressPointsUnit: 'pts',
    simIndexLabel: 'Simulated Index Price',
    simCapitalLabel: 'Simulated Equity',
    simLossLabel: 'P&L: ',
    marginCallTitle: 'Margin Call Threshold (Maint. Margin)',
    liqTitle: 'Liquidation Threshold (Risk 25%)',
    allowWind: 'Adverse Tolerance: ',
    pointsUnit: 'pts',
    topupWarning: 'Simulated Equity below Initial Margin! Deposit required for 100% level:',
    topupSafe: 'Equity above Initial Margin. No deposit required.',
    topupCashLabel: 'Deposit Cash Needed for 100% Initial Margin',
    currencyUnit: '$',
    toastCopied: 'Futures share link copied to clipboard',
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
  },
};

import type { FaqItem } from '@/app/utils/faqSchema';

export type Lang = 'zh-TW' | 'en';

export const FAQ_ITEMS: Record<Lang, FaqItem[]> = {
  'zh-TW': [
    {
      q: '胎動減少或測不到時該怎麼辦？這個工具可以告訴我寶寶安不安全嗎？',
      a: '【重要聲明：本工具純屬自主紀錄輔助，絕不能取代醫療專業的胎心音監測器 (NST) 或超音波診斷】\n\n① 胎兒睡眠週期：寶寶通常有約 20 到 40 分鐘（最長可能達 90 分鐘）的睡眠週期。若剛開始測量時寶寶沒有動，請先不要過度恐慌，可以嘗試喝杯溫水、吃點甜食稍微提升血糖，或是輕輕撫摸肚子、變換為「左側臥」姿勢稍作休息。\n\n② 立即就醫警訊：若經過上述刺激與休息後，連續 2 小時仍完全測不到 10 次胎動、或是胎動頻率比平時驟減一半以上、甚至整天幾乎感覺不到活動，請「立即前往產房急診或聯絡您的主治婦產科醫師」，切勿等待或延誤就醫。',
    },
    {
      q: '為什麼工具只呈現「前七天趨勢與平均」，而不直接給出「寶寶活潑／活力低」等結論？',
      a: '因為我們是輔助工具而不是醫生，醫學上也沒有單一標準能直接判定胎動「好或壞」：\n\n① 個體節奏差異極大：每個寶寶的活動週期、胎盤位置（前壁/後壁）、羊水量與媽媽體質皆不同。有的寶寶天生動作溫和、有的動作劇烈；有的 15 分鐘動滿，有的需要 45 分鐘，兩者皆屬正常健康。\n\n② 臨床真正關鍵是「與自己比較」：婦產科臨床最重視的是寶寶當前的活動是否「偏離了自己的日常基準 (Baseline)」。若寶寶平時均耗 25 分鐘，今天卻花了 90 分鐘才動滿，即使仍在 2 小時規範內，也應引起注意。\n\n【數據回歸客觀】工具只提供真實的耗時、七日平均與走勢折線，不妄加斷言，讓媽媽向產房醫師諮詢時能提供最精確中立的口述客觀數據。',
    },
    {
      q: '為什麼胎動計數器使用「倒數計時」，而不是從零開始正數？',
      a: '因為在婦產科醫學指引中，不論採用哪一種胎動計算法，都有明確的「時間上限」：\n\n① 「數滿 10 次法 (Cardiff)」的時間上限是 2 小時（120 分鐘）：健康的胎兒通常在 20~30 分鐘內就能動滿 10 次，醫學界定義的正常觀察上限即為 2 小時。若倒數 2 小時歸零仍未達標，代表寶寶活力偏弱或可能處於長時間深層睡眠，媽媽應立即提高警覺。\n\n② 「1 小時觀察法 (Sadovsky)」的時間上限是 60 分鐘：固定在 60 分鐘倒數區間內，檢視寶寶是否有達到 3 次以上有效胎動。\n\n【倒數的好處】從時間上限開始往回倒數，能讓媽媽一眼看清「還剩下多少時間可以達標」，避免無止境等待而忽略了胎動減少的警訊。',
    },
    {
      q: '什麼是「兩分鐘內標記為小寶的連環踢」？連續踢擊為什麼不算多次有效胎動？',
      a: '依據台灣國健署與美國婦產科醫學會 (ACOG) 臨床衛教標準：\n\n① 連續動作在醫學上屬於「同一波胎動事件」：當寶寶伸展手腳、連續踢好幾下或大翻身連動 5~10 秒，這一整組連貫動作在生理上只能計為 1 次有效胎動。\n\n② 靜止停頓後才算下一波：必須等寶寶完全停頓休息（臨床通常以間隔 1~2 分鐘為標準），再次感受到的動作才能算作第 2 波。\n\n【貼心雙軌紀錄】媽媽感覺有動就放心點！在 2 分鐘之內的連續點擊，系統會跳出「兩分鐘內標記為小寶的連環踢」溫馨提示，既如實記錄寶寶踢了多少下，醫學統計上又能精準計算獨立波數，避免把一陣 5 秒的翻身誤算成多次達標。\n\n【防卡死時窗保護】若寶寶特別活潑、每隔 1~2 分鐘就揮拳一次，系統會以「本波起始點」為基準（單波上限 2 分鐘），一旦距離本波起點滿 2 分鐘，下一拳便會自動認列為「新的一波有效胎動」，絕不會因為小寶過於活躍而無限卡在連環踢。',
    },
    {
      q: '為什麼紀錄保留「8 天」？如果我剛開始記錄未滿 7 天，還能看平均嗎？',
      a: '① 保留 8 天的巧思：保留 8 天是為了讓媽媽可以用「今天（第 8 天）」的即時耗時，精準比對「前 7 天（一整週）」的個人基準線平均。\n\n② 未滿 7 天自動動態計算：不用硬等累積滿一週！系統會根據您目前現有的天數動態計算（例如第 3 天會自動顯示「累積前 2 日平均」），口述小抄也會自動填入「我前 2 天平均大約是 XX 分鐘」，隨時提供最貼合您現況的參考值。',
    },
    {
      q: '測量完成後需要手動按「儲存」嗎？中途想放棄怎麼辦？',
      a: '① 數滿自動結算保存：本工具完全不需要手動按儲存！只要數滿 10 波胎動（或 1 小時定時結束），系統就會立刻在裝置本地自動保存，並立即繪入走勢圖中，讓媽媽躺著測完可以直接放心休息。\n\n② 放棄本次測量：若測量到一半遇到突發狀況（如臨時有事出門、被電話打斷），點擊圓圈下方的「重設 / 放棄本次」即可清空本次未完成的片段，完全不會污染歷史趨勢圖。',
    },
    {
      q: '「數到 10 次法 (Cardiff)」和「1 小時觀察法 (Sadovsky)」有什麼差別？該選哪一種？',
      a: '本工具提供兩種婦產科最主流的胎動測量模式：\n\n① 數到 10 次法 (Cardiff 模式，最推薦)：每天挑選寶寶平時最活躍的時段（如晚餐後或睡前），記錄累積達到 10 波胎動總共花了幾分鐘。一般健康狀態下通常會在 20~30 分鐘內達標，若 2 小時內達標皆屬正常。\n\n② 1 小時定時法 (Sadovsky 模式)：固定倒數計時 60 分鐘，記錄這 1 小時內一共出現了幾波胎動。臨床建議 1 小時內應有 3 次以上有效胎動。',
    },
    {
      q: '懷孕幾週開始需要每天數胎動？什麼姿勢最好測？',
      a: '① 建議開始週數：進入懷孕第 28 週（約 7 個月）以後，胎兒神經與骨骼發育更健全，作息與睡眠週期逐漸規律，是婦產科建議開始每日規律數胎動的黃金時期。\n\n② 最佳姿勢：建議採「左側躺」或放鬆半臥姿。左側臥能夠減輕下腔靜脈受壓迫，增加回心血量與胎盤供氧量，也最容易清楚感受胎兒手腳的碰觸。',
    },
    {
      q: '紀錄資料會上傳到網路上嗎？換手機還看得到嗎？',
      a: '100% 不會上傳。所有點擊時間、連環踢與活力走勢僅保存在您當前裝置的瀏覽器內部 (localStorage)，無任何後端資料庫也無需註冊登入。\n\n若更換手機、更換瀏覽器或開啟無痕瀏覽，紀錄將無法跨裝置讀取。需要告知另一半或主治醫師時，可直接點擊「一鍵複製小抄」，貼到 LINE 等通訊軟體即可。',
    },
  ],
  en: [
    {
      q: 'What should I do if fetal movements decrease? Can this tool tell if my baby is safe?',
      a: '[Important Notice: This tool is strictly an aid for personal tracking and cannot replace clinical fetal heart monitoring (NST) or ultrasound evaluation]\n\n① Sleep cycles: Babies typically have sleep cycles of 20 to 40 minutes (sometimes up to 90 minutes). If there is no movement at first, try drinking cold water, having a small snack, gently shifting positions, or lying on your left side.\n\n② When to seek emergency care: If after resting and stimulation you do not feel 10 movements in 2 hours, or if movement is significantly less than your baby\'s normal pattern, contact your maternity unit or OB-GYN immediately.',
    },
    {
      q: 'Why does the tool show "7-Day Trend & Average" instead of medical conclusions like "Active/Low Vitality"?',
      a: 'Because we are a supportive tracking tool rather than a physician, and medical guidelines recognize that there is no universal number defining "good" or "bad" fetal activity:\n\n① Broad individual variation: Every baby has unique sleep-wake cycles, placenta location, and movement intensity. One baby may routinely finish 10 kicks in 15 minutes while another takes 45 minutes; both are completely normal and healthy.\n\n② Clinical focus is comparing with baby\'s own baseline: Obstetricians emphasize whether activity deviates significantly from your baby\'s typical daily pattern. If baby normally finishes in 25 minutes but takes 90 minutes today, it merits attention even if under the 2-hour ceiling.\n\n[Objective Data]: By providing pure durations, dynamic 7-day averages, and charts without subjective labels, mothers can report accurate, unbiased numbers to their healthcare team.',
    },
    {
      q: 'Why does the kick counter use a countdown instead of counting up from zero?',
      a: 'Because in clinical obstetrics, both counting methods have a strict "maximum time limit":\n\n① "Count to 10" (Cardiff Method) has a 2-hour (120 min) ceiling: A healthy baby usually reaches 10 movements within 20 to 30 minutes, and 2 hours is the medical upper limit. If the 2-hour countdown expires before reaching 10 kicks, it alerts you that fetal movement is lower than expected.\n\n② "1-Hour Observation" (Sadovsky Method) has a 60-minute ceiling: It evaluates whether at least 3 distinct movements occur during a fixed 60-minute window.\n\n[Why Countdown Helps]: Counting down from the ceiling keeps you informed of exactly how much time remains to meet clinical criteria, preventing indefinite waiting and ensuring timely alert if activity is low.',
    },
    {
      q: 'What is "Marked as baby\'s combo kick within 2 minutes"? Why don\'t rapid kicks count separately?',
      a: 'According to ACOG and clinical obstetric standards:\n\n① Continuous activity counts as ONE episode: A series of continuous kicks, jabs, or a roll is physiologically considered a single movement event.\n\n② Wait for a pause: Only when the baby completely pauses (typically at least 1-2 minutes) does the next movement count as a separate episode.\n\n[Dual-Track Design]: Feel free to tap whenever baby moves! Taps within 2 minutes show a friendly combo tag. This honors every flutter while medically recording distinct episodes, preventing a 5-second roll from falsely counting as 5 separate movements.\n\n[Active Window Protection]: If baby is exceptionally active and kicks every 1 to 2 minutes, episodes are anchored to the start of the current burst (capped at 2 minutes). Once 2 minutes pass from the episode\'s onset, the next kick automatically qualifies as a new valid episode, preventing rolling combos from locking up the counter.',
    },
    {
      q: 'Why are records kept for 8 days? Can I see an average if I have fewer than 7 days of data?',
      a: '① 8-Day Retention: Keeping 8 days enables comparing "Today (Day 8)" directly against your baby\'s personal "Past 7 Days" baseline average.\n\n② Dynamic Calculation: You do not need to wait a full week! The system dynamically calculates averages using available records (e.g., "Avg of past 2 days"), and the cheat sheet automatically adapts to your current history.',
    },
    {
      q: 'Do I need to tap "Save" after finishing? How do I discard an incomplete session?',
      a: '① Automatic Saving: No manual save button is needed! As soon as 10 kicks are reached (or 1 hour elapses), the session is instantly saved to your browser\'s local storage and plotted on the chart.\n\n② Discarding: If you get interrupted by an urgent phone call or need to leave, simply tap "Reset / Discard current" below the counter to clear the session without affecting your historical trends.',
    },
    {
      q: 'What is the difference between "Count to 10" and "1-Hour Timed" methods?',
      a: 'This tool supports both recognized clinical tracking methods:\n\n① Count to 10 (Cardiff Method - Recommended): Start timing during an active time of day and see how long it takes to reach 10 distinct episodes. Most healthy babies reach this within 20-30 minutes, and reaching 10 within 2 hours is considered standard.\n\n② 1-Hour Observation (Sadovsky Method): Counts how many distinct movements occur in a fixed 60-minute window. Obstetricians typically look for at least 3 distinct episodes per hour.',
    },
    {
      q: 'At how many weeks should I start counting kicks, and what is the best position?',
      a: '① Recommended timing: Daily kick tracking is generally recommended starting around 28 weeks of gestation, when fetal sleep-wake cycles and movements become more structured.\n\n② Recommended position: Lying on your left side or resting in a semi-reclined position is best. Lying on your left side optimizes blood flow and oxygen to the placenta, making kicks easier to perceive.',
    },
    {
      q: 'Is my data uploaded to the cloud? Can I see it on another phone?',
      a: 'Never uploaded. All timestamps and session records are stored 100% locally in your current browser (localStorage). No login is required.\n\nBecause data stays on this device, it will not appear on a different device or in private browsing mode. To share your update, use the one-tap "Copy Cheat Sheet" button.',
    },
  ],
};

export const TRANSLATIONS = {
  'zh-TW': {
    title: '胎動計數器',
    subtitle: 'FETAL KICK COUNTER',
    description:
      '寶寶有動就按！支援「數滿 10 次」與「1 小時定時」雙模式，自動依 2 分鐘門檻識別連環踢，精算有效胎動波數與總踢擊數，繪製每日活力趨勢並提供防慌報備小抄。資料僅留本機。',

    modeCount10: '數滿 10 次法',
    modeCount10Desc: '計算動滿 10 波胎動所需時間\n（一般建議 2 小時內達標）',
    modeTimed1h: '1 小時定時法',
    modeTimed1hDesc: '倒數計時 60 分鐘\n（記錄該小時內胎動次數，建議 3 次以上）',

    btnStart: '開始數胎動',
    btnRecordKick: '記錄一次胎動',
    btnCancel: '重設 / 放棄本次',

    tapHintActive: '感覺到胎動就按一下（連續踢擊自動標為連環踢）',
    tapHintCombo: '兩分鐘內標記為小寶的連環踢',
    countdownRemaining: '剩餘 {time}',
    countdownExpired: '已達時間上限',

    statusTitle: '本次測量狀況',
    timeElapsed: '已測量時間',
    timeRemaining: '剩餘時間',
    validEpisodes: '有效胎動波數',
    totalTaps: '總踢擊下數',
    comboTag: '連環踢 {n} 次',
    targetReachedBadge: '今日已達標',
    inProgressBadge: '測量中',

    targetTextCount10: '目標：滿 10 波',
    targetTextTimed1h: '目標：滿 3 波 (60分鐘)',

    sevenDayAvgLabel: '七日平均',
    sevenDayAvgValue: '{min} 分鐘',
    sevenDayAvgSubFull: '前 7 天達標平均',
    sevenDayAvgSubPartial: '累積前 {days} 日平均',
    sevenDayAvgCalculating: '累積中',

    summaryTitle: '報備小抄（防慌照唸守則）',
    summarySubtitle: '致電產房詢問或傳訊息給另一半時，直接照唸這段：',
    summarySpokenCount10WithAvg:
      '「今天數滿 10 波胎動花了 {min} 分鐘，寶寶總共動了 {total} 下（含 {combo} 次連環踢），我前 {days} 天平均大約是 {avg} 分鐘。」',
    summarySpokenCount10NoAvg:
      '「今天數滿 10 波胎動花了 {min} 分鐘，寶寶總共動了 {total} 下（含 {combo} 次連環踢）。」',
    summarySpokenTimed1h:
      '「今天 1 小時內測到了 {episodes} 波有效胎動，寶寶總共動了 {total} 下（含 {combo} 次連環踢）。」',
    summaryEmpty: '開始測量並記錄胎動後，這裡會自動生成清楚的口述回報小抄。',

    copyBtn: '一鍵複製小抄',
    copied: '已複製小抄',
    copyFailed: '複製失敗',
    copyHeader: '【胎動紀錄 {time}】',

    chartTitle: '近 8 日胎動達標耗時走勢',
    chartYAxis: '達標耗時 (分鐘)',
    chartEmpty: '累積 2 次以上「數滿 10 次」紀錄後將自動繪製走勢圖',

    listTitle: '本次點擊明細',
    listHeaderTime: '時間',
    listHeaderType: '類型',
    listHeaderGap: '與上一動間隔',
    listTypeEpisode: '獨立胎動',
    listTypeCombo: '連環踢',
    listFirstKick: '首動起算',
    deleteSessionBtn: '刪除本次測量',

    historyTitle: '歷史測量紀錄',
    historyCount10Result: '耗時 {min} 分鐘達標 (共踢 {total} 下)',
    historyTimed1hResult: '1 小時共 {episodes} 波胎動 (共踢 {total} 下)',

    demoBarTitle: '快速載入情境資料：',
    demoActive: '活潑 (22分鐘達標)',
    demoSlow: '偏慢 (58分鐘達標)',
    demoCombos: '連環踢滿滿 (10波/16下)',
    demoClear: '清空資料',

    faqTitle: '常見問題',
    faqSubtitle: '計算方式、連環踢原則與就醫警訊',
  },
  en: {
    title: 'Fetal Kick Counter',
    subtitle: 'FETAL KICK COUNTER',
    description:
      'Tap whenever baby moves! Supports "Count to 10" and "1-Hour Observation" modes, automatically recognizing combo kicks within 2 minutes. Tracks clinical episodes vs total taps with vitality trends and phone scripts.',

    modeCount10: 'Count to 10',
    modeCount10Desc: 'Track time to feel 10 distinct episodes\n(Typically within 2 hours)',
    modeTimed1h: '1-Hour Observation',
    modeTimed1hDesc: '60-minute countdown session\n(Recommended >= 3 movements per hour)',

    btnStart: 'Start Session',
    btnRecordKick: 'Record Movement',
    btnCancel: 'Reset / Cancel',

    tapHintActive: 'Tap whenever you feel baby move (continuous jabs tagged as combos)',
    tapHintCombo: "Tagged as Baby's combo kicks within 2 min",
    countdownRemaining: 'Remaining {time}',
    countdownExpired: 'Time Limit Reached',

    statusTitle: 'Current Session Status',
    timeElapsed: 'Time Elapsed',
    timeRemaining: 'Time Remaining',
    validEpisodes: 'Distinct Episodes',
    totalTaps: 'Total Kicks',
    comboTag: 'Combos: {n}',
    targetReachedBadge: 'Target Reached',
    inProgressBadge: 'Timing',

    targetTextCount10: 'Target: 10 Episodes',
    targetTextTimed1h: 'Target: 3+ Episodes (60 min)',

    sevenDayAvgLabel: '7-Day Average',
    sevenDayAvgValue: '{min} min',
    sevenDayAvgSubFull: 'Past 7 days average',
    sevenDayAvgSubPartial: 'Past {days} days average',
    sevenDayAvgCalculating: 'Calculating',

    summaryTitle: 'Phone Cheat Sheet (Quick Script)',
    summarySubtitle: 'When calling triage or texting your partner, read this directly:',
    summarySpokenCount10WithAvg:
      '"It took {min} minutes to reach 10 distinct fetal movements today. Baby kicked {total} times total (including {combo} combo kicks), and my past {days}-day average is about {avg} minutes."',
    summarySpokenCount10NoAvg:
      '"It took {min} minutes to reach 10 distinct fetal movements today. Baby kicked {total} times total (including {combo} combo kicks)."',
    summarySpokenTimed1h:
      '"In a 1-hour session today, baby had {episodes} distinct movement episodes with {total} kicks total (including {combo} combos)."',
    summaryEmpty: 'Start counting kicks to automatically generate a clear spoken script here.',

    copyBtn: 'Copy Cheat Sheet',
    copied: 'Copied',
    copyFailed: 'Copy failed',
    copyHeader: '[Fetal Movement Log {time}]',

    chartTitle: 'Past 8 Days Time-to-10 Trend',
    chartYAxis: 'Minutes to 10 Kicks',
    chartEmpty: 'The trend chart appears after 2 or more completed Count-to-10 sessions',

    listTitle: 'Session Tap Log',
    listHeaderTime: 'Time',
    listHeaderType: 'Type',
    listHeaderGap: 'Gap from Previous',
    listTypeEpisode: 'Distinct Episode',
    listTypeCombo: 'Combo Kick',
    listFirstKick: 'First movement',
    deleteSessionBtn: 'Delete Session',

    historyTitle: 'Past Sessions',
    historyCount10Result: 'Reached in {min} min ({total} kicks total)',
    historyTimed1hResult: '{episodes} episodes in 1 hr ({total} kicks total)',

    demoBarTitle: 'Quick Demo Presets:',
    demoActive: 'Active (22 min)',
    demoSlow: 'Slower (58 min)',
    demoCombos: 'High Combos (10 ep / 16 kicks)',
    demoClear: 'Clear Data',

    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'Medical counting rules, combos & red flags',
  },
} as const;

export type Translation = (typeof TRANSLATIONS)[Lang];

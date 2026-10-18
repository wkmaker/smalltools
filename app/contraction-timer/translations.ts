import type { FaqItem } from '@/app/utils/faqSchema';

export type Lang = 'zh-TW' | 'en';

/**
 * FAQ 獨立匯出，page.tsx / en/page.tsx 的 JSON-LD 與 Client 端 FaqSection 共用同一份，
 * 確保結構化資料與畫面文字 100% 同步。
 */
export const FAQ_ITEMS: Record<Lang, FaqItem[]> = {
  'zh-TW': [
    {
      q: '這個工具可以告訴我什麼時候該去醫院嗎？',
      a: '【重要聲明：本工具純屬紀錄與數據計算輔助，絕不構成任何醫療判斷或就醫建議】\n\n本工具僅客觀呈現您所按下的時間紀錄，並透過數學統計算出間隔頻率、持續秒數與規律走勢。\n\n① 每位產婦體質、胎次（第一胎或經產婦）與產程進展皆不同，何時該前往產房或急診，請務必嚴格遵循您的主治婦產科醫師、助產師或醫院產檢時給予的專屬衛教指引。\n\n② 若出現「破水」、「持續落紅或鮮血出血」、「胎動明顯減少」、「劇烈無法忍受的腹痛」或任何讓您感到不安的警訊，請立即前往醫院或致電產房急診，切勿因等待工具計算數據而延誤就醫。',
    },
    {
      q: '這個工具是怎麼算出「多久痛一次」和「一次痛多久」的？',
      a: '每次按下開始、再按停止，就會記下一筆宮縮的開始與結束時間：\n\n① 一次痛多久：停止時間減去開始時間。\n\n② 多久痛一次：這次「開始」到上次「開始」的時間，這是產科衛教常用的量法，不是從上次結束才開始算。\n\n畫面上的數字取「最近 5 次宮縮」的中位數。用中位數而不是平均，是因為漏按或手滑一次時，平均值會被拉歪，中位數比較穩定。',
    },
    {
      q: '「規律」是怎麼判斷的？「這個規律已經維持多久」又是怎麼算？',
      a: '【規律判斷】看最近 5 次宮縮之間的 4 個間隔有多一致（變異係數 = 標準差 ÷ 平均）：差異在 20% 以內為「規律」，35% 以內為「大致規律」，超過則為「不規律」。\n\n【維持多久】從最新一次往回逐筆比對，間隔落在目前數值的 ±25%（至少 ±1.5 分鐘）、持續落在 ±30%（至少 ±15 秒）內就算同一個規律。中間允許 1 筆不符合（例如漏按），連續 2 筆不符合就停止，最早仍符合的那一次就是規律的起點。\n\n【趨勢】把最近 5 次與再往前 5 次比較，變化超過 15% 才會顯示「變密集」「變長」等趨勢。',
    },
    {
      q: '為什麼要用最近 5 次？剛開始記錄時為什麼看不到數字？',
      a: '衛教常見的教法是「連續記錄 5 到 6 次」再看規律，所以本工具以最近 5 次為計算視窗。\n\n累積到 3 次（2 個間隔）就會先顯示初步數字，並標示「資料累積中」；滿 5 次後數字會更穩定。\n\n兩次宮縮相隔超過 30 分鐘時，視為中斷，之後會重新起算。',
    },
    {
      q: '按錯了，或忘記按停止怎麼辦？',
      a: '① 計時中可以按「取消這次」直接放棄這一筆。\n\n② 短於 10 秒的紀錄會標示為「疑似誤按」，長於 3 分鐘的會標示為「疑似忘記停止」，兩者都不會列入計算。\n\n③ 下方紀錄清單的每一筆都可以單獨刪除。',
    },
    {
      q: '我的紀錄存在哪裡？會上傳到網路嗎？',
      a: '不會上傳。所有紀錄只存在你目前這支手機或電腦的瀏覽器裡（瀏覽器的本機儲存空間 localStorage），本工具沒有伺服器資料庫、不需要登入，也不會把任何宮縮資料傳送出去。\n\n因此換一支手機、換瀏覽器或使用無痕模式時，會看不到之前的紀錄。想讓另一半知道狀況，請用「一鍵複製」把摘要貼到通訊軟體。',
    },
    {
      q: '紀錄會保存多久？可以手動刪除嗎？',
      a: '本工具只看 6 小時內的變化，超過 6 小時的紀錄會自動刪除，不會長期留存。\n\n你也可以隨時按「清除全部紀錄」立即刪除所有資料；清除瀏覽器的網站資料同樣會一併刪除。',
    },
  ],
  en: [
    {
      q: 'Can this tool tell me when to go to the hospital?',
      a: '[Important Notice: This tool is strictly a calculation aid and does NOT constitute medical judgment or clinical advice]\n\nThis application objectively tracks your timestamps and computes frequency intervals, durations, and regularity trends purely mathematically.\n\n① Every labor progression is unique. When to go to the hospital or birth center depends on whether this is your first baby, your specific clinical background, and your OB-GYN or midwife\'s customized instructions.\n\n② If you experience water breaking, persistent bright-red bleeding, significantly reduced fetal movement, intolerable severe pain, or any symptom that concerns you, please contact your maternity unit or proceed to the hospital immediately without waiting for numbers in this tool.',
    },
    {
      q: 'How does this tool calculate "how often" and "how long" contractions are?',
      a: 'Each time you press Start and then Stop, the tool records the start and end time of one contraction:\n\n① Duration (how long): end time minus start time.\n\n② Frequency (how often): from the start of one contraction to the start of the next. This is the standard method taught in prenatal classes, not measured from the end of the previous one.\n\nThe numbers shown are the median of the most recent 5 contractions. The median is used instead of the average because a single missed or accidental press would skew the average, while the median stays stable.',
    },
    {
      q: 'How is "regular" determined, and how is "how long this pattern has lasted" calculated?',
      a: '[Regularity] The tool checks how consistent the 4 intervals between the latest 5 contractions are (coefficient of variation = standard deviation ÷ mean): within 20% is "Regular", within 35% is "Fairly regular", above that is "Irregular".\n\n[Pattern duration] Starting from the latest contraction and walking backward, a contraction belongs to the same pattern if its interval is within ±25% (at least ±1.5 minutes) and its duration within ±30% (at least ±15 seconds) of the current values. One mismatch in between (such as a missed press) is tolerated; two in a row ends the scan. The earliest matching contraction marks the start of the pattern.\n\n[Trend] The latest 5 contractions are compared with the 5 before them. A trend such as "Getting closer" or "Getting longer" is only shown when the change exceeds 15%.',
    },
    {
      q: 'Why use the latest 5 contractions? Why are there no numbers at first?',
      a: 'Prenatal education commonly advises timing 5 to 6 contractions in a row before judging the pattern, so this tool uses the latest 5 as its calculation window.\n\nPreliminary numbers appear after 3 contractions (2 intervals), marked as "Collecting data"; they become more stable after 5.\n\nIf two contractions are more than 30 minutes apart, the tool treats it as a break and starts counting again.',
    },
    {
      q: 'What if I pressed by mistake or forgot to press Stop?',
      a: '① While timing, press "Cancel this one" to discard the current record.\n\n② Records shorter than 10 seconds are marked as "Possible mis-press" and records longer than 3 minutes as "Possibly forgot to stop". Neither is included in the calculations.\n\n③ Every record in the list below can be deleted individually.',
    },
    {
      q: 'Where is my data stored? Is it uploaded anywhere?',
      a: 'Nothing is uploaded. All records are stored only in the browser on this phone or computer (the browser\'s local storage, localStorage). This tool has no server database, requires no login, and never sends any contraction data anywhere.\n\nThis means you will not see previous records on another phone, another browser, or in private browsing mode. To keep your partner informed, use "Copy summary" and paste it into a messaging app.',
    },
    {
      q: 'How long are records kept? Can I delete them manually?',
      a: 'This tool only looks at changes within the last 6 hours. Records older than 6 hours are deleted automatically and are never kept long term.\n\nYou can also press "Clear all records" at any time to delete everything immediately. Clearing the site data in your browser will delete them as well.',
    },
  ],
};

export const TRANSLATIONS = {
  'zh-TW': {
    title: '宮縮計時器',
    subtitle: 'CONTRACTION TIMER',
    description:
      '按一下開始、再按一下停止，自動以最近 5 次宮縮算出多久痛一次、一次痛多久、規律程度與已維持時間，並畫出 6 小時趨勢。資料只存在本機，6 小時後自動刪除。',

    btnStart: '開始宮縮',
    btnStop: '宮縮結束',
    btnStartHint: '開始痛時按一下',
    btnStopHint: '不痛了再按一下',
    btnCancel: '取消這次',
    sinceLast: '距離上次開始 {min} 分鐘',
    noRecordYet: '尚無紀錄，宮縮開始時按下按鈕',

    statusTitle: '目前狀態',
    collecting: '資料累積中（{n}/5）',
    needMore: '再記錄 {n} 次就能開始計算',
    headlineFreq: '{min} 分鐘/次',
    headlineDur: '痛 {sec} 秒',
    headlinePattern: '已持續 {duration}',
    headlinePatternNone: '尚未形成規律',

    metricFreq: '頻率',
    metricFreqUnit: '分鐘/次',
    metricDur: '持續',
    metricDurUnit: '秒',
    metricReg: '規律',
    rangeText: '間隔落在 {min}～{max} 分鐘',
    regular: '規律',
    fair: '大致規律',
    irregular: '不規律',

    trendTitle: '趨勢',
    trendCloser: '變密集',
    trendApart: '趨緩',
    trendSteadyInterval: '間隔持平',
    trendLonger: '變長',
    trendShorter: '變短',
    trendSteadyDuration: '持續持平',
    trendPending: '再累積幾次即可判斷趨勢',

    countLastHour: '最近 1 小時',
    countLast10Min: '最近 10 分鐘',
    countUnit: '{n} 次',

    durationHours: '{h} 小時',
    durationMinutes: '{m} 分鐘',

    cheatTitle: '報備小抄（防慌照唸守則）',
    cheatSubtitle: '打電話給醫院產房或告知另一半時，直接照唸這段：',
    cheatSentence: '「目前大約 {min} 分鐘痛一次，每次痛約 {sec} 秒，這個規律已經維持大約 {duration}。」',
    cheatSentenceIrregular: '「目前大約 {min} 分鐘痛一次，每次痛約 {sec} 秒，但痛的時間還不夠規律。」',
    cheatEmpty: '記錄 3 次宮縮後，這裡會自動產生清楚的照唸口訣，供產婦或先生直接照著唸。',
    cheatPointsTitle: '產房電話通常必問 3 題（這裡都算好了）：',
    cheatPointFreq: '多久痛一次：約 {min} 分鐘一次',
    cheatPointDur: '一次痛多久：約 {sec} 秒',
    cheatPointPattern: '這樣維持多久：約 {duration}（{reg}）',

    copyBtn: '一鍵複製小抄',
    copied: '已複製小抄',
    copyFailed: '複製失敗，請手動選取文字',
    copyHeader: '【產兆狀況回報 {time}】',
    copySpoken: '口述照唸：「{sentence}」',
    copyTrend: '目前趨勢：{interval}、{duration}。',
    copyCounts: '最近 1 小時內共宮縮 {n} 次。',
    copyRegularity: '規律評估：{label}（間隔分佈 {range}）。',

    chartTitle: '6 小時趨勢',
    chartInterval: '間隔（分鐘）',
    chartDuration: '持續（秒）',
    chartRolling: '間隔中位數',
    chartEmpty: '累積 2 次以上宮縮後顯示趨勢圖',

    listTitle: '宮縮紀錄',
    listCount: '共 {n} 筆（6 小時內）',
    colTime: '開始時間',
    colDuration: '持續',
    colInterval: '間隔',
    colAction: '操作',
    flagTooShort: '疑似誤按',
    flagTooLong: '疑似忘記停止',
    deleteRecord: '刪除這筆紀錄',
    secUnit: '{n} 秒',
    minUnit: '{n} 分',
    clearAll: '清除全部紀錄',
    clearConfirm: '再按一次確認清除',

    wakeLockOn: '螢幕保持常亮',
    wakeLockOff: '螢幕可能自動關閉',
    wakeLockUnsupported: '此瀏覽器不支援螢幕常亮',

    privacyNote: '資料只存在這台裝置的瀏覽器，不會上傳；超過 6 小時自動刪除。本工具僅供紀錄與計算，不提供醫療判斷。',

    faqTitle: '常見問題',
    faqSubtitle: '計算方式、資料隱私與使用限制',

    demoBarTitle: '快速載入資料預覽：',
    demoRegular: '規律 5-1-1 模式',
    demoAccelerating: '漸進密集趨勢',
    demoIrregular: '不規律假性陣痛',
    demoReset: '清空資料',
  },
  en: {
    title: 'Contraction Timer',
    subtitle: 'CONTRACTION TIMER',
    description:
      'Tap once to start and again to stop. The tool uses your latest 5 contractions to calculate how often they come, how long they last, how regular they are and how long the pattern has lasted, with a 6-hour trend chart. Data stays on this device and is deleted after 6 hours.',

    btnStart: 'Start',
    btnStop: 'Stop',
    btnStartHint: 'Tap when it starts',
    btnStopHint: 'Tap when it ends',
    btnCancel: 'Cancel this one',
    sinceLast: '{min} min since last start',
    noRecordYet: 'No records yet. Tap the button when a contraction starts.',

    statusTitle: 'Current Status',
    collecting: 'Collecting data ({n}/5)',
    needMore: 'Record {n} more to start calculating',
    headlineFreq: 'Every {min} min',
    headlineDur: 'Lasting {sec} sec',
    headlinePattern: 'For {duration}',
    headlinePatternNone: 'No regular pattern yet',

    metricFreq: 'Frequency',
    metricFreqUnit: 'min apart',
    metricDur: 'Duration',
    metricDurUnit: 'sec',
    metricReg: 'Regularity',
    rangeText: 'Intervals between {min} and {max} min',
    regular: 'Regular',
    fair: 'Fairly regular',
    irregular: 'Irregular',

    trendTitle: 'Trend',
    trendCloser: 'Getting closer',
    trendApart: 'Spacing out',
    trendSteadyInterval: 'Interval steady',
    trendLonger: 'Getting longer',
    trendShorter: 'Getting shorter',
    trendSteadyDuration: 'Duration steady',
    trendPending: 'A few more records are needed to show a trend',

    countLastHour: 'Last hour',
    countLast10Min: 'Last 10 min',
    countUnit: '{n} times',

    durationHours: '{h} hours',
    durationMinutes: '{m} minutes',

    cheatTitle: 'Phone Cheat Sheet (Quick Script)',
    cheatSubtitle: 'When calling your maternity unit or texting your partner, read this directly:',
    cheatSentence: '"Contractions are about {min} minutes apart, lasting about {sec} seconds each, and this pattern has lasted for about {duration}."',
    cheatSentenceIrregular: '"Contractions are about {min} minutes apart, lasting about {sec} seconds each, but the intervals are still irregular."',
    cheatEmpty: 'After 3 contractions, a ready-to-read spoken script will appear here.',
    cheatPointsTitle: 'The 3 questions triage nurses always ask:',
    cheatPointFreq: 'Frequency: ~{min} min apart',
    cheatPointDur: 'Duration: ~{sec} seconds',
    cheatPointPattern: 'Pattern lasted: ~{duration} ({reg})',

    copyBtn: 'Copy cheat sheet',
    copied: 'Copied',
    copyFailed: 'Copy failed. Please select the text manually.',
    copyHeader: '[Labor Status Update {time}]',
    copySpoken: 'Read aloud: "{sentence}"',
    copyTrend: 'Current trend: {interval}, {duration}.',
    copyCounts: '{n} contractions in the last hour.',
    copyRegularity: 'Regularity: {label} (intervals {range}).',

    chartTitle: '6-Hour Trend',
    chartInterval: 'Interval (min)',
    chartDuration: 'Duration (sec)',
    chartRolling: 'Median interval',
    chartEmpty: 'The trend chart appears after 2 or more contractions',

    listTitle: 'Contraction Log',
    listCount: '{n} records (last 6 hours)',
    colTime: 'Start time',
    colDuration: 'Duration',
    colInterval: 'Interval',
    colAction: 'Action',
    flagTooShort: 'Possible mis-press',
    flagTooLong: 'Possibly forgot to stop',
    deleteRecord: 'Delete this record',
    secUnit: '{n} sec',
    minUnit: '{n} min',
    clearAll: 'Clear all records',
    clearConfirm: 'Tap again to confirm',

    wakeLockOn: 'Screen stays on',
    wakeLockOff: 'Screen may turn off',
    wakeLockUnsupported: 'Keep-screen-on is not supported in this browser',

    privacyNote: 'Data stays in this device\'s browser and is never uploaded; records older than 6 hours are deleted automatically. This tool is for recording and calculation only and does not provide medical judgment.',

    faqTitle: 'Frequently Asked Questions',
    faqSubtitle: 'Calculation method, data privacy and limitations',

    demoBarTitle: 'Quick Demo Presets:',
    demoRegular: 'Regular 5-1-1',
    demoAccelerating: 'Accelerating Trend',
    demoIrregular: 'Irregular False Labor',
    demoReset: 'Clear Data',
  },
} as const;

export type Translation = (typeof TRANSLATIONS)[Lang];

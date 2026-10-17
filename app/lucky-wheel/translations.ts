/**
 * 幸運轉盤頁面中英文案（完整雙語對稱，繁中介面純淨無冗餘英文括號）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    title: '幸運轉盤與拉霸抽獎小工具',
    subtitle: 'LUCKY WHEEL & SLOT SPINNER',
    description:
      '免費線上幸運轉盤與擬真拉霸機抽獎小工具！支援雙視覺模式切換、尾牙雙抽獎項池、多人連抽、快速批次貼上名單、不在場放棄重抽、網址分享轉盤與全螢幕舞台展示。',
    latestWinnerTag: '最新中獎',
    justWon: '剛抽出：',
    welcomeMsg: '歡迎使用幸運轉盤抽獎小工具！自訂獎項或貼上名單即刻體驗！',
    historyBtn: '中獎紀錄',
    soundOn: '音效：開',
    soundOff: '音效：關',
    fullscreenBtn: '全螢幕舞台',
    shareLinkBtn: '分享轉盤',
    wheelMode: '幸運轉盤',
    slotMode: '擬真拉霸機',
    enableQtyLimit: '啟用數量限制（關閉即為無限抽模式）',
    enableAwardMode: '尾牙雙抽模式（先選獎項、轉盤抽得獎人）',
    spinSpeedLabel: '轉速：',
    speedFast: '極速 1.8秒',
    speedNormal: '標準 4.8秒',
    speedSuspense: '懸念 7.8秒',
    drawCountLabel: '連抽人數：',
    drawSingle: '單抽 1 名',
    drawThree: '連抽 3 名',
    drawFive: '連抽 5 名',
    drawTen: '連抽 10 名',
    currentAwardLabel: '目前抽取獎項：',
    awardExhausted: '此獎項名額已抽完',
    awardRemainFmt: '剩餘 {remain} / {total} 名',
    manageAwardsBtn: '管理獎項池',
    closeAwardModeBtn: '關閉雙抽模式',
    addAwardBtn: '＋ 新增獎項',
    awardNamePlaceholder: '輸入獎項名稱，例如：頭獎 iPhone 16',
    awardQtyLabel: '名額：',
    resetAwardsBtn: '重置獎項名額',
    spinReadySlot: '準備就緒，點擊開始抽獎！',
    spinWheelBtn: '開始幸運抽獎',
    spinSlotBtn: '開始拉霸抽獎',
    spinCountSuffix: '（連抽 {n} 名）',
    latestBatchLabel: '本次抽出得主：',
    multiSpinningFmt: '連抽進行中（第 {current} / {total} 抽）...',
    multiRevealTitle: '連抽即時開獎進度（{current} / {total}）',
    spinning: '幸運旋轉中...',
    allDrawn: '項目已全部抽完',
    spacebarHint: '支援空白鍵快速啟動抽獎與關閉彈窗',
    prizesSettingsTitle: '轉盤項目與名單設定',
    viewModeList: '逐項設定',
    viewModeBatch: '快速貼上名單',
    batchTextareaLabel: '批次輸入名單或獎項（每行一項，或以逗號分隔「名稱, 權重, 數量」）：',
    batchTextareaPlaceholder: '王小明\n林怡君\n張家豪\n\n或帶權重與數量：\n頭獎 iPhone, 1, 2\n普獎禮券, 5, 10',
    applyBatchBtn: '套用批次名單至轉盤',
    shuffleListBtn: '隨機打亂順序',
    dedupListBtn: '去除重複名稱',
    saveSlotsTitle: '本地存檔槽：',
    saveSlotPlaceholder: '輸入存檔名稱（如：晚場尾牙名單）',
    saveCurrentSlotBtn: '儲存目前轉盤',
    loadSlotBtn: '載入',
    deleteSlotBtn: '刪除存檔',
    noSavedSlots: '尚無已儲存的轉盤配置',
    presetSelectDefault: '載入快速範例...',
    presetAnnual: '公司年會獎項盤',
    presetStaff: '尾牙員工姓名盤（10人範例）',
    presetLucky: '幸運數字轉盤',
    presetPunish: '聚會懲罰遊戲',
    presetDinner: '今天晚餐吃什麼',
    presetEmpty: '清空全部項目',
    exportTxt: '匯出 TXT',
    importTxt: '匯入檔案',
    resetCount: '重置已抽次數',
    addPrize: '＋ 新增項目',
    newPrizeDefault: '新項目',
    prizeTitlePlaceholder: '獎項或人員姓名',
    weightLabel: '權重：',
    qtyLabel: '數量：',
    remainLabel: '剩',
    drawnDoneLabel: '已抽完',
    unlimitedLabel: '不限數量模式',
    isFinishedLabel: '標記抽完',
    deleteLabel: '刪除此項目',
    stageTitleWheel: '幸運轉盤抽獎舞台',
    stageTitleSlot: '擬真拉霸機抽獎舞台',
    browserFullscreenBtn: '視窗滿版',
    exitFullscreen: '✕ 退出舞台',
    stageSpin: '抽獎',
    availableItems: '待抽項目',
    liveList: '即時名單',
    allFinishedMsg: '所有項目皆已抽出！',
    lastWinner: '最新得獎結果',
    noRecord: '尚無紀錄',
    historyModalTitle: '歷史中獎紀錄與名單匯出',
    noHistory: '目前尚無任何中獎紀錄',
    exportCsvBtn: '匯出 CSV 報表',
    copyWinnersBtn: '複製得獎名單',
    revertSingleBtn: '撤銷並回補',
    clearHistory: '清空所有紀錄',
    close: '關閉視窗',
    congrats: '恭喜幸運得主！',
    batchResultSubtitle: '本次共抽出 {n} 名幸運得主',
    continueSpin: '確認領獎，繼續抽獎',
    abandonRedrawBtn: '不在場放棄（回補庫存重抽）',
    toastLoadedTemplate: '已成功載入範例模板！',
    toastResetCount: '已重置所有項目與獎項之抽中次數！',
    toastImportPeople: '成功匯入 {n} 位人員名單！',
    toastImportPrizes: '成功匯入 {n} 個獎項項目！',
    toastInvalidFile: '未找到有效名單，請檢查內容格式',
    toastClearedHistory: '已清空歷史中獎紀錄',
    toastRevertedWinner: '已作廢該筆結果並將庫存無損回補至轉盤！',
    toastCopiedShareLink: '已複製專屬轉盤分享連結至剪貼簿！',
    toastCopiedWinners: '已複製全部得獎名單至剪貼簿！',
    toastSavedSlot: '已儲存轉盤配置：{name}',
    toastLoadedSlot: '已載入轉盤配置：{name}',
    toastShuffled: '已隨機打亂轉盤項目順序！',
    toastDeduped: '已清除重複項目，目前共 {n} 項！',
    faqTitle: '常見問題與抽獎指南',
    faqSubtitle: '深入了解密碼學隨機抽獎演算法、尾牙雙抽模式、批次名單貼上與大螢幕舞台展示技巧',
    faqItems: [
      {
        q: '幸運轉盤的抽獎演算法是如何運作的？真的完全公平隨機嗎？',
        a: `100% 公平且完全隨機！本工具採用瀏覽器底層的密碼學級安全亂數產生器（Web Cryptography API - crypto.getRandomValues）與高隨機度亂數演算法，並搭配扇區內隨機偏移落點，確保每一次旋轉的結果與停靠角度均具備極高熵值，徹底杜絕任何人工操控或規律預測。`,
      },
      {
        q: '獎項的「權重」是如何影響中獎機率與扇區面積的？',
        a: `每個獎項的中獎機率由該獎項的「權重值」除以「所有未抽完獎項的權重總和」決定：

① 扇區面積視覺連動：在幸運轉盤模式中，每個獎項所佔據的圓弧角度與其權重比例嚴格呈正比（角度 = 360° × 該獎項權重 / 總權重）。

② 浮動機率再平衡：當特定獎項數量抽完（或被手動標記為抽完）時，系統會動態剔除該項目，並將其機率比例無損平攤給剩餘所有可抽獎項。`,
      },
      {
        q: '什麼是「尾牙雙抽模式」？如何先選獎項再抽出得獎員工？',
        a: `真實公司尾牙或活動抽獎時，轉盤上通常是「全體員工姓名」，而非獎品名稱。開啟「尾牙雙抽模式」後：

① 獨立獎項池管理：您可預先設定「特等獎 1 名、頭獎 2 名、普獎 10 名」等獎項階層。

② 自動綁定得獎紀錄：抽獎前於舞台上方選擇當前要抽出的獎項，再轉動人員轉盤（支援單抽或連抽），系統會自動記錄「得獎人 — 所屬獎項」並同步扣減該獎項名額與得獎人資格。`,
      },
      {
        q: '抽出的得獎者不在現場怎麼辦？支援「作廢重抽」與「多人連抽」嗎？',
        a: `完全支援！針對活動現場常見突發狀況提供兩大機制：

① 不在場放棄重抽：當得獎彈窗跳出但得獎人不在現場時，點擊「不在場放棄（回補庫存重抽）」，系統會立即撤銷本次紀錄並將名額無損加回轉盤中。

② 多人連抽與轉速切換：抽普獎時可切換為「連抽 3 / 5 / 10 名」並搭配「極速 1.8 秒」模式，一次抽出多位得主，大幅加快尾牙活動節奏。`,
      },
      {
        q: '如何快速匯入大量人員名單？一定要上傳檔案嗎？',
        a: `除了點擊「匯入檔案」上傳 TXT/CSV 外，您也可以切換至「快速貼上名單」模式，直接從 Excel、Line 或網頁複製整列姓名貼進文字框，一鍵生成轉盤，並內建「隨機打亂順序」與「去除重複名稱」工具。同時支援「分享轉盤」將配置編碼為專屬網址傳給同事。`,
      },
      {
        q: '在公司尾牙或大型活動中，如何配合大螢幕投影機進行「全螢幕抽獎」？',
        a: `點擊右上角的「全螢幕舞台」按鈕即可切換至專屬的活動投影模式：

① 獨立沉浸舞台與空白鍵盲按：自動隱藏設定面板，支援按鍵盤「空白鍵」直接啟動抽獎或關閉得獎彈窗，方便主持人使用簡報筆或無線鍵盤操作。

② 歡慶彩帶與 CSV 核銷報表：抽中時自動播放慶祝音效與滿版五彩碎紙彩帶，活動結束後可於中獎紀錄一鍵匯出 Excel 相容的 CSV 完整得獎名單。`,
      },
      {
        q: '我輸入的員工名單或獎項資料會被上傳到伺服器嗎？網頁關閉後資料會遺失嗎？',
        a: `絕不上傳，100% 隱私安全！

① 本地純前端運算：所有名單、中獎紀錄與機率運算均 100% 於您的瀏覽器本機記憶體處理，甚至無網路狀態下也能順暢抽獎。

② 自動儲存與多組存檔槽：系統會自動將最新清單與歷史保存在瀏覽器的 localStorage 中，並提供「本地存檔槽」讓您預先保存早場、晚場等多組活動名單隨時切換。`,
      },
    ],
  },
  en: {
    title: 'Lucky Wheel & Slot Spinner',
    subtitle: 'LUCKY WHEEL & SLOT SPINNER',
    description:
      'Free online Lucky Wheel and realistic Slot Machine prize drawer! Supports dual-draw award tiers, multi-winner batch draws, quick text list paste, absent winner redraw, shareable wheel URLs, and fullscreen stage mode.',
    latestWinnerTag: 'LATEST WINNER',
    justWon: 'Just drawn: ',
    welcomeMsg: 'Welcome to Lucky Wheel! Customize prizes or paste your participant list to start!',
    historyBtn: 'History',
    soundOn: 'Sound: ON',
    soundOff: 'Sound: OFF',
    fullscreenBtn: 'Stage Mode',
    shareLinkBtn: 'Share URL',
    wheelMode: 'Lucky Wheel',
    slotMode: 'Slot Machine',
    enableQtyLimit: 'Enable quantity limit (Disable for unlimited draws)',
    enableAwardMode: 'Gala Dual-Draw Mode (Select Award Tier + Spin Participants)',
    spinSpeedLabel: 'Speed:',
    speedFast: 'Fast 1.8s',
    speedNormal: 'Normal 4.8s',
    speedSuspense: 'Suspense 7.8s',
    drawCountLabel: 'Draw Count:',
    drawSingle: '1 Winner',
    drawThree: '3 Winners',
    drawFive: '5 Winners',
    drawTen: '10 Winners',
    currentAwardLabel: 'Current Award Tier:',
    awardExhausted: 'All slots for this award have been drawn',
    awardRemainFmt: '{remain} / {total} left',
    manageAwardsBtn: 'Manage Award Pool',
    closeAwardModeBtn: 'Exit Dual-Draw',
    addAwardBtn: '＋ Add Award Tier',
    awardNamePlaceholder: 'Award name, e.g., 1st Prize iPhone 16',
    awardQtyLabel: 'Quota:',
    resetAwardsBtn: 'Reset Award Quotas',
    spinReadySlot: 'Ready! Click to spin!',
    spinWheelBtn: 'Spin Lucky Wheel',
    spinSlotBtn: 'Spin Slot Machine',
    spinCountSuffix: ' ({n} Winners)',
    latestBatchLabel: 'Latest Draw Winners:',
    multiSpinningFmt: 'Auto-Spinning ({current} / {total})...',
    multiRevealTitle: 'Live Multi-Draw ({current} / {total})',
    spinning: 'Spinning...',
    allDrawn: 'All Items Drawn',
    spacebarHint: 'Press Spacebar to spin or dismiss winner dialog',
    prizesSettingsTitle: 'Wheel Items & Participant List',
    viewModeList: 'Item List',
    viewModeBatch: 'Quick Paste Text',
    batchTextareaLabel: 'Paste names (one per line) or "Title, Weight, Quantity":',
    batchTextareaPlaceholder: 'Alice Smith\nBob Jones\nCharlie Brown\n\nOr with weight & quantity:\n1st Prize iPhone, 1, 2\nGift Card, 5, 10',
    applyBatchBtn: 'Apply Text List to Wheel',
    shuffleListBtn: 'Shuffle Order',
    dedupListBtn: 'Remove Duplicates',
    saveSlotsTitle: 'Saved Presets:',
    saveSlotPlaceholder: 'Preset name (e.g., Evening Gala)',
    saveCurrentSlotBtn: 'Save Current Wheel',
    loadSlotBtn: 'Load',
    deleteSlotBtn: 'Delete',
    noSavedSlots: 'No saved wheel presets yet',
    presetSelectDefault: 'Load Sample Template...',
    presetAnnual: 'Annual Gala Prizes',
    presetStaff: 'Employee Name List (10 names)',
    presetLucky: 'Lucky Numbers (1-6)',
    presetPunish: 'Party Game Penalties',
    presetDinner: 'What to Eat for Dinner?',
    presetEmpty: 'Clear All Items',
    exportTxt: 'Export TXT',
    importTxt: 'Import File',
    resetCount: 'Reset Counts',
    addPrize: '＋ Add Item',
    newPrizeDefault: 'New Item',
    prizeTitlePlaceholder: 'Prize name or participant',
    weightLabel: 'Weight:',
    qtyLabel: 'Qty:',
    remainLabel: 'Left',
    drawnDoneLabel: 'Finished',
    unlimitedLabel: 'Unlimited Mode',
    isFinishedLabel: 'Done',
    deleteLabel: 'Delete item',
    stageTitleWheel: 'Lucky Wheel Stage',
    stageTitleSlot: 'Slot Machine Stage',
    browserFullscreenBtn: 'Fullscreen Window',
    exitFullscreen: '✕ Exit Stage',
    stageSpin: 'SPIN',
    availableItems: 'Available Items',
    liveList: 'LIVE LIST',
    allFinishedMsg: 'All items have been drawn!',
    lastWinner: 'LATEST WINNER',
    noRecord: 'No Record',
    historyModalTitle: 'Draw History & Winner Export',
    noHistory: 'No draw history records yet',
    exportCsvBtn: 'Export CSV',
    copyWinnersBtn: 'Copy Winner List',
    revertSingleBtn: 'Revoke & Restore',
    clearHistory: 'Clear All',
    close: 'Close',
    congrats: 'CONGRATULATIONS!',
    batchResultSubtitle: 'Selected {n} lucky winners in this draw',
    continueSpin: 'Confirm & Continue',
    abandonRedrawBtn: 'Absent / Forfeit (Restore Stock)',
    toastLoadedTemplate: 'Successfully loaded sample template!',
    toastResetCount: 'Reset drawn counts for all items and awards!',
    toastImportPeople: 'Successfully imported {n} participants!',
    toastImportPrizes: 'Successfully imported {n} prize items!',
    toastInvalidFile: 'No valid items found. Please check the format.',
    toastClearedHistory: 'History cleared',
    toastRevertedWinner: 'Reverted winner record and restored stock to the wheel!',
    toastCopiedShareLink: 'Shareable wheel URL copied to clipboard!',
    toastCopiedWinners: 'Winner list copied to clipboard!',
    toastSavedSlot: 'Saved wheel preset: {name}',
    toastLoadedSlot: 'Loaded wheel preset: {name}',
    toastShuffled: 'Randomly shuffled wheel items!',
    toastDeduped: 'Removed duplicate names ({n} unique items remaining)!',
    faqTitle: 'Frequently Asked Questions & Guide',
    faqSubtitle: 'Guide to cryptographic random drawing, dual-draw gala mode, batch list pasting, and fullscreen stage presentation',
    faqItems: [
      {
        q: 'How does the random drawing algorithm work? Is it completely fair and unbiased?',
        a: `100% fair and mathematically unbiased! The tool utilizes the browser's cryptographic-grade random number generator (Web Cryptography API - crypto.getRandomValues) combined with intra-sector random landing offsets. Every spin angle and outcome is determined independently with high entropy, eliminating any possibility of bias or predictable patterns.`,
      },
      {
        q: "How does the 'Weight' setting affect win probability and slice proportions?",
        a: `Each prize's probability is calculated by dividing its weight by the sum of weights of all currently available prizes:

1. Visual Proportion: In wheel mode, the arc angle of each slice is strictly proportional to its weight (Angle = 360° × Prize Weight / Total Weights).

2. Dynamic Rebalancing: When a prize runs out of stock (or is marked finished), it is excluded from future draws, and its probability is automatically redistributed proportionally among the remaining available items.`,
      },
      {
        q: "What is 'Gala Dual-Draw Mode' and how do I draw employees for specific award tiers?",
        a: `At company galas, the wheel usually holds participant names while the host draws for specific prize tiers. When you enable 'Gala Dual-Draw Mode':

1. Dedicated Award Pool: Configure your prize tiers in advance (e.g., Grand Prize × 1, 1st Prize × 2, Consolation × 10).

2. Automatic Pairing: Select the active award tier above the wheel and spin (single or multi-draw). Each winner is automatically logged alongside the selected award tier while deducting both the award quota and participant eligibility.`,
      },
      {
        q: 'What if a drawn winner is absent? Can I forfeit and redraw or draw multiple winners at once?',
        a: `Yes! We built two dedicated event-hosting features:

1. Absent Winner Redraw: Click 'Absent / Forfeit (Restore Stock)' directly inside the winner celebration popup (or inside History) to revoke the draw and immediately restore the item's stock back to the wheel.

2. Multi-Winner Batch Draw & Speed Control: Choose 3, 5, or 10 winners per spin and switch between Fast (1.8s), Normal (4.8s), or Suspense (7.8s) spin speeds to keep large events moving smoothly.`,
      },
      {
        q: 'How can I quickly import large participant lists without uploading a file?',
        a: `Switch to the 'Quick Paste Text' tab to paste names directly from Excel, Google Sheets, or chat apps (one name per line, or 'Name, Weight, Quantity'). You can also one-click shuffle or deduplicate names, and click 'Share URL' to generate a self-contained link to share your wheel setup with colleagues.`,
      },
      {
        q: "How do I use 'Stage Mode' for projector presentations at live events?",
        a: `Click 'Stage Mode' at the top right for a distraction-free presentation layout:

1. Spacebar Control & Fullscreen Window: Press the Spacebar to trigger spins or dismiss the winner popup hands-free with a presentation remote.

2. Celebratory Confetti & CSV Export: Winning triggers celebratory fanfare and physics confetti. After the event, export the complete winner log with timestamps as a UTF-8 CSV file for Excel.`,
      },
      {
        q: 'Are employee names or prize data uploaded to any server? Will data be lost if I close the browser?',
        a: `Never uploaded — 100% private and secure!

1. Zero-Server Architecture: All participant lists, draw history, and random logic operate purely inside your browser's local memory. The tool works 100% offline without internet connectivity.

2. Local Persistence & Presets: Settings and history are automatically saved in localStorage, plus you can save multiple named wheel presets to switch between different event sessions effortlessly.`,
      },
    ],
  },
};

export type LuckyWheelTranslations = (typeof TRANSLATIONS)['zh-TW'];

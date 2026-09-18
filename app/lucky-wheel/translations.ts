/**
 * 幸運轉盤頁面中英文案（從 LuckyWheelClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    title: '幸運轉盤與拉霸抽獎小工具',
    subtitle: 'LUCKY WHEEL & SLOT SPINNER',
    description:
      '免費線上幸運轉盤與擬真拉霸機抽獎小工具！支援雙視覺模式切換、預設年會與遊戲模板、數量限制與展場無限抽獎、TXT 名單一鍵匯入匯出、全螢幕抽獎舞台與彩帶音效。',
    latestWinnerTag: '最新中獎',
    justWon: '剛抽出：',
    welcomeMsg: '歡迎使用幸運轉盤抽獎小工具！自訂獎項即刻體驗！',
    historyBtn: '紀錄',
    soundOn: '音效: 開',
    soundOff: '音效: 關',
    fullscreenBtn: '全螢幕',
    wheelMode: '幸運轉盤',
    slotMode: '擬真拉霸機',
    enableQtyLimit: '啟用數量限制 (關閉為展場無限抽)',
    spinReadySlot: '準備就緒，點擊抽獎！',
    spinWheelBtn: '開始幸運抽獎',
    spinSlotBtn: '開始拉霸抽獎',
    spinning: '旋轉中...',
    allDrawn: '全部抽完',
    prizesSettingsTitle: '獎項與人員設定',
    presetSelectDefault: '快速範例模板...',
    presetAnnual: '公司年會尾牙',
    presetLucky: '幸運大轉盤 (6項)',
    presetPunish: '歡樂懲罰遊戲',
    presetDinner: '晚餐吃什麼？',
    presetEmpty: '清空全新自訂',
    exportTxt: '匯出 TXT',
    importTxt: '匯入 TXT/名單',
    resetCount: '重置次數',
    addPrize: '＋ 新增項目',
    newPrizeDefault: '新獎項',
    prizeTitlePlaceholder: '獎項或人員姓名',
    weightLabel: '權重:',
    qtyLabel: '數量:',
    remainLabel: '剩',
    drawnDoneLabel: '已抽完',
    unlimitedLabel: '展場不限數量模式',
    isFinishedLabel: '抽完',
    deleteLabel: '刪除',
    stageTitleWheel: '幸運轉盤抽獎舞台',
    stageTitleSlot: '擬真拉霸機抽獎舞台',
    exitFullscreen: '✕ 退出全螢幕 (Esc)',
    stageSpin: '抽獎',
    availableItems: '可抽項目',
    liveList: 'LIVE LIST',
    allFinishedMsg: '所有項目已抽完！',
    lastWinner: '上一位得獎者',
    noRecord: '尚無紀錄',
    historyModalTitle: '歷史中獎紀錄',
    noHistory: '尚無抽獎紀錄',
    clearHistory: '清空紀錄',
    close: '關閉',
    congrats: 'CONGRATULATIONS!',
    continueSpin: '太棒了！繼續抽獎',
    toastLoadedTemplate: '已成功載入範例模板！',
    toastResetCount: '已重置所有項目抽中次數！',
    toastImportPeople: '成功匯入 {n} 位人員名單！',
    toastImportPrizes: '成功匯入 {n} 個獎項！',
    toastInvalidFile: '未找到有效名單，請檢查檔案格式',
    toastClearedHistory: '已清空歷史紀錄',
    faqTitle: '常問問題與抽獎指南 (FAQ)',
    faqSubtitle: '深入了解隨機抽獎演算法、機率權重分配、全螢幕舞台展示與名單管理技巧',
    faqItems: [
      {
        q: '幸運轉盤的抽獎演算法是如何運作的？真的完全公平隨機嗎？',
        a: `100% 公平且完全隨機！本工具採用瀏覽器底層的密碼學級安全亂數產生器（Web Cryptography API - crypto.getRandomValues）與高隨機度亂數演算法，確保每一次旋轉的落點角度均具備極高的熵值（Entropy），徹底杜絕任何人工操控或規律預測。`,
      },
      {
        q: '獎項的「權重 (Weight)」是如何影響中獎機率與扇區面積的？',
        a: `每個獎項的中獎機率由該獎項的「權重值」除以「所有未抽完獎項的權重總和」決定：

① 扇區面積視覺連動：在幸運轉盤模式中，每個獎項所佔據的圓弧角度與其權重比例嚴格呈正比（角度 = 360° × 該獎項權重 / 總權重）。

② 浮動機率再平衡：當特定獎項數量抽完（或被手動標記為抽完）時，系統會動態剔除該項目，並將其機率比例無損平攤給剩餘所有可抽獎項。`,
      },
      {
        q: '「幸運轉盤」與「擬真拉霸機 (Slot Machine)」兩種模式有何不同？',
        a: `兩者共享同一套獎項清單與機率設定，但提供截然不同的視覺與活動氛圍：

① 幸運轉盤 (Lucky Wheel)：經典圓形轉盤，具備指針停靠與動態扇區視覺，適合聚會、懲罰遊戲與快速做決定。

② 擬真拉霸機 (Slot Machine)：霓虹三滾輪動態旋轉與跑馬燈音效，帶來沉浸刺激感，特別適合公司尾牙、展覽攤位抽獎或大型發表會。`,
      },
      {
        q: '如何設定「數量限制」？「展場無限抽模式」適用於什麼情境？',
        a: `本工具支援彈性的庫存扣減機制：

① 啟用數量限制：可針對每個獎項設定總數量（例如頭獎 1 台、二獎 3 台）。抽中時自動扣減庫存，扣至 0 時自動標記為已抽完並移出轉盤，防止重複抽出超額大獎。

② 關閉數量限制 (展場無限抽)：所有項目均無數量上限，抽中後不會扣減庫存，適合展覽現場發放宣傳品、無限次互動遊戲或輪盤日常決策。`,
      },
      {
        q: '如何快速匯入大量人員名單或自訂獎項？支援什麼檔案格式？',
        a: `點擊「匯入 TXT/名單」按鈕，支援以下兩種便捷格式：

① 單純人員名單：每行輸入一個姓名或編號（如「王小明」），系統會自動以相同權重批次生成名單項目。

② 完整獎項格式 (CSV/TXT)：每行以逗號分隔「獎項名稱, 權重, 數量」（例如「iPad, 2, 3」），即可一次性匯入完整權重與數量設定。

同時可點擊「匯出 TXT」隨時備份目前設定，便於跨電腦或未來活動重複載入。`,
      },
      {
        q: '在公司尾牙或大型活動中，如何配合大螢幕投影機進行「全螢幕抽獎」？',
        a: `點擊右上角的「全螢幕」按鈕即可切換至專屬的抽獎舞台模式：

① 獨立沉浸舞台：自動隱藏所有設定面板與邊框，僅保留高畫質轉盤/拉霸機、即時可抽獎項列表以及「上一位中獎者」名牌。

② 歡慶彩帶與音效：抽中大獎時會自動播放慶祝音效，並在全螢幕觸發滿版五彩碎紙彩帶動畫（Confetti），將現場氣氛推至最高潮！`,
      },
      {
        q: '我輸入的員工名單或獎項資料會被上傳到伺服器嗎？網頁關閉後資料會遺失嗎？',
        a: `絕不上傳，100% 隱私安全！

① 本地純前端運算：所有名單、中獎紀錄與機率運算均 100% 於您的瀏覽器本機記憶體處理，甚至無網路狀態下也能順暢抽獎。

② 自動持久化儲存：系統會自動將您的最新獎項清單與中獎歷史保存在瀏覽器的 localStorage 中，即使重新整理或關閉網頁，下次開啟依然能完整還原所有設定。`,
      },
    ],
  },
  en: {
    title: 'Lucky Wheel & Slot Spinner',
    subtitle: 'LUCKY WHEEL & SLOT SPINNER',
    description:
      'Free online Lucky Wheel and realistic Slot Machine prize drawer! Customize prize titles, weights, quantities, and colors. Features fullscreen stage, physics spin animation, sound effects, and TXT import/export.',
    latestWinnerTag: 'LATEST WINNER',
    justWon: 'Just drawn: ',
    welcomeMsg: 'Welcome to Lucky Wheel! Customize your prizes and spin to win!',
    historyBtn: 'History',
    soundOn: 'Sound: ON',
    soundOff: 'Sound: OFF',
    fullscreenBtn: 'Fullscreen',
    wheelMode: 'Lucky Wheel',
    slotMode: 'Slot Machine',
    enableQtyLimit: 'Enable quantity limit (Disable for unlimited draws)',
    spinReadySlot: 'Ready! Click to spin!',
    spinWheelBtn: 'Spin Lucky Wheel',
    spinSlotBtn: 'Spin Slot Machine',
    spinning: 'Spinning...',
    allDrawn: 'All Prizes Drawn',
    prizesSettingsTitle: 'Prizes & Participants',
    presetSelectDefault: 'Preset Templates...',
    presetAnnual: 'Annual Party Raffle',
    presetLucky: 'Lucky Wheel (6 items)',
    presetPunish: 'Party Game Penalties',
    presetDinner: 'What to Eat for Dinner?',
    presetEmpty: 'Clear & Start Custom',
    exportTxt: 'Export TXT',
    importTxt: 'Import TXT/List',
    resetCount: 'Reset Counts',
    addPrize: '＋ Add Item',
    newPrizeDefault: 'New Prize',
    prizeTitlePlaceholder: 'Prize name or participant',
    weightLabel: 'Weight:',
    qtyLabel: 'Qty:',
    remainLabel: 'Left',
    drawnDoneLabel: 'Finished',
    unlimitedLabel: 'Unlimited Mode',
    isFinishedLabel: 'Done',
    deleteLabel: 'Delete',
    stageTitleWheel: 'Lucky Wheel Stage',
    stageTitleSlot: 'Slot Machine Stage',
    exitFullscreen: '✕ Exit Fullscreen (Esc)',
    stageSpin: 'SPIN',
    availableItems: 'Available Items',
    liveList: 'LIVE LIST',
    allFinishedMsg: 'All items have been drawn!',
    lastWinner: 'LAST WINNER',
    noRecord: 'No Record',
    historyModalTitle: 'Draw History',
    noHistory: 'No history records',
    clearHistory: 'Clear History',
    close: 'Close',
    congrats: 'CONGRATULATIONS!',
    continueSpin: 'Awesome! Keep Spinning',
    toastLoadedTemplate: 'Successfully loaded template!',
    toastResetCount: 'Reset drawn counts for all items!',
    toastImportPeople: 'Successfully imported {n} participants!',
    toastImportPrizes: 'Successfully imported {n} prizes!',
    toastInvalidFile: 'No valid items found. Please check file format.',
    toastClearedHistory: 'History cleared',
    faqTitle: 'Frequently Asked Questions & Guide (FAQ)',
    faqSubtitle: 'Guide to random drawing math, probability weight distribution, fullscreen stage setup, and list management',
    faqItems: [
      {
        q: 'How does the random drawing algorithm work? Is it completely fair and unbiased?',
        a: `100% fair and mathematically unbiased! The tool utilizes the browser's cryptographic-grade random number generator (Web Cryptography API - crypto.getRandomValues) and high-entropy randomness algorithms. Every spin angle and outcome is determined independently, eliminating any possibility of bias or predictable patterns.`,
      },
      {
        q: "How does the 'Weight' setting affect win probability and slice proportions?",
        a: `Each prize's probability is calculated by dividing its weight by the sum of weights of all currently available prizes:

1. Visual Proportion: In wheel mode, the arc angle of each slice is strictly proportional to its weight (Angle = 360° × Prize Weight / Total Weights).

2. Dynamic Rebalancing: When a prize runs out of stock (or is marked finished), it is excluded from future draws, and its probability is automatically redistributed proportionally among the remaining available items.`,
      },
      {
        q: "What is the difference between 'Lucky Wheel' and 'Slot Machine' modes?",
        a: `Both modes share the identical prize pool and probability calculations, offering distinct visual experiences:

1. Lucky Wheel: Classic circular wheel with an indicator pointer and visual slice proportions. Ideal for small gatherings, party games, and quick decisions.

2. Slot Machine: Features glowing three-reel animations, flashing neon lights, and slot sound effects. Creates casino-grade excitement, perfect for annual company galas, trade shows, and live events.`,
      },
      {
        q: "How does 'Quantity Limit' work? When should I use 'Unlimited Mode'?",
        a: `The tool offers flexible inventory management:

1. Quantity Limit Enabled: Set a fixed inventory count for each prize (e.g., Grand Prize × 1, Second Prize × 3). Each draw automatically deducts stock, and exhausted items are removed from the wheel to prevent over-awarding.

2. Unlimited Mode (Exhibition Mode): Disables stock limits, allowing items to be drawn indefinitely. Best suited for trade show giveaways, recurring party games, or daily decision-making.`,
      },
      {
        q: 'How can I quickly import large participant or prize lists? What formats are supported?',
        a: `Click the 'Import TXT/List' button to import data in two convenient formats:

1. Simple Name List: Enter one name or ID per line (e.g., 'Alice Smith'). The system automatically generates equal-weighted items.

2. Full Prize Format (CSV/TXT): Use comma-separated values 'Prize Name, Weight, Quantity' per line (e.g., 'iPad, 2, 3') to batch configure names, probabilities, and stock counts at once.

You can also click 'Export TXT' to backup your configuration for future events.`,
      },
      {
        q: "How do I use 'Fullscreen Stage Mode' for projector presentations at events?",
        a: `Click the 'Fullscreen' button at the top right to enter dedicated stage presentation mode:

1. Immersive Display: Hides administrative settings, highlighting the high-definition wheel/slot spinner, available prize counter, and recent winner banner.

2. Celebratory Confetti & Sounds: Winning a prize triggers celebratory sound effects alongside full-screen physics confetti particles to hype up the audience.`,
      },
      {
        q: 'Are employee names or prize data uploaded to any server? Will data be lost if I close the browser?',
        a: `Never uploaded — 100% private and secure!

1. Zero-Server Architecture: All participant lists, draw history, and random logic operate purely inside your browser's local memory. The tool works 100% offline without internet connectivity.

2. Local Persistence: Settings and history are automatically preserved in your browser's localStorage. Refreshing or closing the tab will not lose your configured prizes or winners log.`,
      },
    ],
  },
};

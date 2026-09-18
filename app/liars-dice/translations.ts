/**
 * 吹牛骰子搖骰器頁面中英文案（從 LiarsDiceClient.tsx 抽離，避免單檔過長）。
 */
interface Translations {
  title: string;
  subtitle: string;
  description: string;
  antiCheatTitle: string;
  lastRollTime: string;
  elapsedTime: string;
  notRolledYet: string;
  diceCountLabel: string;
  rollButton: string;
  rolling: string;
  coverCup: string;
  revealCup: string;
  peekBtn: string;
  autoCoverLabel: string;
  summaryTitle: string;
  historyTitle: string;
  historySubtitle: string;
  clearHistory: string;
  emptyHistory: string;
  oneIsWild: string;
  wildDesc: string;
  diceUnit: string;
  fullscreen: string;
  exitFullscreen: string;
  onlineVersionText: string;
  onlineVersionLinkText: string;
  faqTitle: string;
  faqSubtitle: string;
  faqItems: Array<{ q: string; a: string }>;
}

export const TRANSLATIONS: Record<'zh-TW' | 'en', Translations> = {
  'zh-TW': {
    title: '吹牛骰子搖骰器',
    subtitle: 'LIAR\'S DICE ROLLER',
    description: '專為派對酒吧吹牛遊戲打造！具備防作弊計時器（精確顯示距離上次搖骰過了多久）與歷史 5 次紀錄，支援搖骰音效與杯蓋遮擋。',
    antiCheatTitle: '防作弊防重複搖骰看板',
    lastRollTime: '最後搖骰時間',
    elapsedTime: '已過時間',
    notRolledYet: '尚無搖骰紀錄，準備開始遊戲！',
    diceCountLabel: '骰子顆數',
    rollButton: '搖骰子！',
    rolling: '搖骰中...',
    coverCup: '蓋上骰杯',
    revealCup: '開蓋揭曉',
    peekBtn: '按住窺視',
    autoCoverLabel: '搖骰後自動遮蓋',
    summaryTitle: '當前盤面點數統計',
    historyTitle: '搖骰歷史紀錄',
    historySubtitle: '（保留最新 5 筆）',
    clearHistory: '清除紀錄',
    emptyHistory: '尚無歷史紀錄',
    oneIsWild: '1 點為萬能點數 (Wild)',
    wildDesc: '吹牛常見規則：尚未喊過 1 點時，1 點可當作任何點數。',
    diceUnit: '顆',
    fullscreen: '全螢幕舞台',
    exitFullscreen: '退出全螢幕',
    onlineVersionText: '另外提供連線版本',
    onlineVersionLinkText: 'Drink Games',

    // FAQ
    faqTitle: '常見問題與專業指南 (FAQ)',
    faqSubtitle: '深入了解防作弊計時原理、吹牛規則與萬能1點、遮杯窺視防偷看與全螢幕派對玩法',
    faqItems: [
      {
        q: '什麼是「防作弊計時器 (Anti-Cheat Timer)」？它如何杜絕二次重搖？',
        a: '專為派對聚會打造的公正防作弊機制：\n\n① 即時累計流逝秒數：\n每次按下搖骰後，頂部計時器會瞬間歸零並精準跳秒（如「剛剛搖骰 (00:05)」）。\n\n② 杜絕重搖爭議：\n在吹牛遊戲中，若有玩家趁他人不注意偷偷重搖，計時器會立刻重置為 0 秒，其他玩家一目了然即可抓包作弊，維護聚會公平性。',
      },
      {
        q: '吹牛骰子（Liar\'s Dice）的基本遊戲規則與叫牌喊點邏輯是什麼？',
        a: '派對經典吹牛玩法規則：\n\n① 遊戲開局：\n每人各有 5 顆骰子，搖骰後各自看自己的點數並蓋上骰杯。\n\n② 順時針叫牌：\n由莊家開始叫點（例如「3 個 4」），下一位玩家必須「加顆數（如 4 個 4）」或「喊更大點數（如 3 個 5）」；若不信上一家喊的數量，可喊「開！」。\n\n③ 結算輸贏：\n全場所有人開蓋計算總顆數，若實際顆數 ≥ 叫牌顆數則開牌者輸，否則叫牌者輸。',
      },
      {
        q: '什麼是「1 點為萬能骰 (Wild Card)」？在何種情況下 1 點會失效（變回純 1 點）？',
        a: '萬能骰判定規則速查：\n\n① 萬能替換規則：\n在一般局中，1 點可代表任何點數（例如自己有兩個 1 點和一個 5 點，計算 5 點時相當於有三個 5 點）。\n\n② 叫 1 點後失效（齋）：\n只要全場有任何一位玩家叫過 1 點（例如「3 個 1」），則本局 1 點立即失去萬能效果，僅能代表 1 點本身。',
      },
      {
        q: '「骰杯遮蓋 (Cover Cup)」與「按住窺視 (Peek)」功能在線下聚會時該如何使用？',
        a: '保護個人底牌防偷窺設計：\n\n① 自動遮蓋：\n搖骰後系統可自動蓋上磨砂金屬骰杯，防止身旁朋友斜眼偷看。\n\n② 按住窺視 (Peek)：\n在手機螢幕上「按住窺視按鈕」時骰杯會半透明顯示，鬆開手指即刻重新蓋上，隱密性極佳。',
      },
      {
        q: '「歷史前 5 次搖骰紀錄」在遊戲爭議或抓作弊時有何作用？',
        a: '可追溯的遊戲存證看板：\n\n① 紀錄時間與點數：\n系統會完整保留最近 5 次的搖骰時間與 5 顆骰子點數排列。\n\n② 爭議裁決：\n當發生「剛才開蓋是否為上一局點數」或「是否不小心手滑搖到」時，可隨時點開歷史紀錄調閱核對。',
      },
      {
        q: '本工具是否具備真隨機數產生器 (RNG)？點數分佈是否絕對公平？',
        a: '採用現代瀏覽器密碼學隨機數標準：\n\n① Crypto API 高度隨機：\n底層採用 Web Cryptography API 或高精度 Math.random() 隨機數引擎，確保 1 到 6 點出現之機率嚴格均等（各約 16.67%）。\n\n② 零演算法偏誤：\n絕無固定套路或預先排定的點數組合。',
      },
      {
        q: '在酒吧派對、KTV 或平板大螢幕上如何開啟全螢幕模式？',
        a: '點擊介面右上角的「全螢幕展示」按鈕，系統將自動隱藏頂部導航與雜項元素，切換為超大字體計時器與動態 3D 搖骰舞台，極適合放置於桌面中央供全場檢視。',
      },
      {
        q: '本吹牛骰子工具是否支援多人線上連線對戰？',
        a: '本工具主要為「線下面對面派對輔助搖骰器」，專為現場聚會設計（省去攜帶實體骰盅與骰子的麻煩，並透過防作弊計時器與遮杯功能杜絕爭議）。\n\n若您與異地好友想玩「多人即時線上連線吹牛遊戲」，歡迎使用我們另外提供的專屬線上派對遊戲服務【Drink Games】（https://dgames.cjkuo.net/），支援跨裝置開房連線、線上叫牌與輸贏自動結算！',
      },
    ],
  },
  en: {
    title: 'Liar\'s Dice Roller',
    subtitle: 'LIAR\'S DICE ROLLER',
    description: 'Designed for Liar\'s Dice party games! Features an anti-cheat timer (displays time elapsed since last roll) and logs top 5 history records.',
    antiCheatTitle: 'Anti-Cheat Timer Banner',
    lastRollTime: 'Last Roll Time',
    elapsedTime: 'Time Elapsed',
    notRolledYet: 'No roll yet. Ready for the game!',
    diceCountLabel: 'Dice Count',
    rollButton: 'Roll Dice!',
    rolling: 'Rolling...',
    coverCup: 'Cover Cup',
    revealCup: 'Reveal Dice',
    peekBtn: 'Hold to Peek',
    autoCoverLabel: 'Auto-cover after roll',
    summaryTitle: 'Current Dice Summary',
    historyTitle: 'Roll History',
    historySubtitle: '(Top 5 recent records)',
    clearHistory: 'Clear History',
    emptyHistory: 'No history yet',
    oneIsWild: '1 is Wild',
    wildDesc: 'Common Liar\'s Dice rule: 1s count as any number unless 1s have been called.',
    diceUnit: 'dice',
    fullscreen: 'Fullscreen Stage',
    exitFullscreen: 'Exit Fullscreen',
    onlineVersionText: 'Online multiplayer version available:',
    onlineVersionLinkText: 'Drink Games',

    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Everything you need to know about the anti-cheat timer, game rules, wild 1s, peek features, and fullscreen setups',
    faqItems: [
      {
        q: 'What is the Anti-Cheat Timer and how does it prevent stealth re-rolling?',
        a: 'A dedicated fairness mechanism engineered for party and bar games:\n\n① Live Elapsed Seconds:\nEvery time the dice are rolled, the header timer resets to zero and counts upward in real-time (e.g., "Just rolled (00:05)").\n\n② Catching Re-Rolls Instantly:\nIf a player secretly re-rolls to get better dice, the timer immediately resets to 0 seconds, making unauthorized re-rolls obvious to all participants.',
      },
      {
        q: 'What are the standard rules and bidding mechanics of Liar\'s Dice?',
        a: 'Party gameplay walkthrough:\n\n① Round Start:\nEach player receives 5 dice, rolls under a covered cup, and privately peeks at their own roll.\n\n② Sequential Bidding:\nThe starting player bids on total dice across the table (e.g. "three 4s"). Successive players must raise the quantity (e.g. "four 4s") or call a higher face value (e.g. "three 5s"), or challenge the previous bid by calling "Liar / Open!".\n\n③ Showdown:\nAll players reveal cups; if total matching dice are equal to or greater than the bid, the challenger loses; otherwise, the bidder loses.',
      },
      {
        q: 'How does the "1s are Wild" rule work, and when do 1s lose wild status?',
        a: 'Wild card rules summary:\n\n① Universal Substitute:\nBy default, 1s count as wild cards and can represent whatever face value is currently being bid.\n\n② De-Wilding ("Pure 1s"):\nOnce any player bids 1s (e.g., "three 1s"), 1s immediately lose their wild card property for the remainder of the round and only count as 1s.',
      },
      {
        q: 'How should the "Cover Cup" and "Hold to Peek" features be used during in-person parties?',
        a: 'Privacy-focused cup controls:\n\n① Auto-Cover:\nWith auto-cover enabled, the frosted virtual dice cup drops immediately upon rolling, shielding dice from neighboring glances.\n\n② Hold to Peek:\nPress and hold the peek button to temporarily make the cup translucent, releasing it to instantly re-cover.',
      },
      {
        q: 'What is the purpose of the "Top 5 Roll History" log?',
        a: 'Audit trail for dispute resolution:\n\n① Timestamped Log:\nStores the exact local time and dice array for the last 5 consecutive rolls.\n\n② Resolving Disagreements:\nEasily verify whether someone accidentally touched the roll button or inspect previous hand distributions.',
      },
      {
        q: 'Does this dice roller use a cryptographically secure random number generator (RNG)?',
        a: 'Strictly unbiased digital dice:\n\n① Web Crypto & Modern PRNG:\nPowered by high-entropy browser randomness, each die face (1 to 6) has an exactly equal 16.67% probability.\n\n② Zero Pre-Programmed Biases:\nCompletely decentralized and free of predetermined roll patterns.',
      },
      {
        q: 'How do I activate Fullscreen Mode on tablets or large displays in party settings?',
        a: 'Click the "Fullscreen" button in the upper right to expand into a stage-ready table view with oversized timer typography and dynamic 3D dice physics.',
      },
      {
        q: 'Does this tool support real-time online multiplayer over the internet?',
        a: 'This web app is designed as an in-person physical party companion tool (eliminating the need to carry physical dice cups while preventing cheats via the anti-cheat timer).\n\nIf you want to play a real-time online multiplayer version with friends remotely, check out our dedicated online party game platform: Drink Games (https://dgames.cjkuo.net/), which features live multiplayer rooms, synchronized turn-based bidding, and automatic winner calculation!',
      },
    ],
  },
};

/**
 * 文字處理助手 頁面中英文案（從 TextUtilityClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    title: '文字處理助手',
    subtitle: 'TEXT UTILITY & STATS',
    description: '專業免費的線上文字處理助手！支援即時中英文/字元數/行數統計、大小寫轉換、去除重複行與多餘空白。',
    defaultText: 'Hello World! 這是一段測試文字。\n\n包含重複行\n包含重複行\n   帶有頭尾多餘空白   ',
    totalChars: '總字元數',
    noSpaceChars: '不含空白字元',
    chineseChars: '中文字數',
    englishWords: '英文字詞數',
    totalLines: '總行數',
    editorTitle: '文字內容編輯器',
    placeholder: '請輸入或貼上欲處理的文字內容...',
    clear: '清空',
    copy: '複製內文',
    copiedToast: '已複製處理後的文字',
    upper: '大寫 (UPPER)',
    lower: '小寫 (lower)',
    titleCase: '首字大寫 (Title)',
    removeEmpty: '移除空行',
    removeDups: '去除重複行',
    trimSpaces: '修剪首尾空白',
    langSwitchLabel: 'English',
    langSwitchHref: '/text-utility/en/',

    // FAQ
    faqTitle: '常見問題與專業指南 (FAQ)',
    faqSubtitle: '深入了解多語系字數計算機制、字元與單詞統計標準、文本清洗排版與隱私安全性',
    faqItems: [
      {
        q: '中文字數與英文字詞數 (Word Count) 的計算標準與統計規則為何？',
        a: '多語系文字統計採行業界標準演算法：\n\n① 中文字數統計：\n依據 Unicode CJK 統一表意文字編碼區間（`\\u4e00-\\u9fa5`），每一個漢字獨立計為 1 個中文字。\n\n② 英文單詞統計：\n以連續英文字母、數字或連字號構成的完整詞彙（`\\b[a-zA-Z0-9_-]+\\b`）作為獨立單詞計算，不受詞間多重空白影響。',
      },
      {
        q: '「總字元數」與「不含空白字元數」有何差異？在投稿或論文中如何參照？',
        a: '兩者的計算範圍與常見用途如下：\n\n① 總字元數 (Total Characters)：\n包含所有中英文字母、數字、標點符號、換行符號（`\\n`）與空格。\n\n② 不含空白字元數 (Excl. Spaces)：\n完全剔除半形空格、全形空格、Tab 縮排與換行符號。許多學術論文、出版稿費計酬或社群貼文（如 Twitter/Threads）皆以不含空白之實體字元或英文字詞作為嚴格上限基準。',
      },
      {
        q: '文字大小寫轉換（UPPERCASE, lowercase, Title Case）的運作邏輯為何？',
        a: '支援常見的三種大小寫規格：\n\n① 全大寫 (UPPERCASE)：\n將所有英文英文字母轉換為大寫形式（如 `hello world` → `HELLO WORLD`）。\n\n② 全小寫 (lowercase)：\n將所有英文英文字母轉換為小寫形式。\n\n③ 首字大寫 (Title Case)：\n將每個英文單詞的首字母轉換為大寫、其餘字母轉換為小寫（如 `hello world` → `Hello World`），適合文章標題排版。',
      },
      {
        q: '「去除重複行 (Remove Duplicates)」是否會打亂原始文字的先後排序？',
        a: '不會打亂原始先後順序：\n\n① 保持首次出現順序 (Stable Order)：\n本工具採用 Set 集合過濾機制，僅移除後續重複出現的多餘行，嚴格保留每筆唯一資料首次出現的相對位置。\n\n② 適用場景：\n非常適合清理整理名單、電話列表、Email 清單、關鍵字列表與資料庫匯出資料。',
      },
      {
        q: '在線上貼上大量文字或機密文章時是否有隱私外洩疑慮？',
        a: '完全零隱私風險！本工具為 100% 純前端（Client-Side）本地瀏覽器運算架構：\n\n① 零後端傳輸：\n所有字數統計、大小寫轉換與排版清理皆在您電腦本地的 JavaScript 引擎中完成。\n\n② 零伺服器儲存：\n不會向任何伺服器發送或備份您的文字內容，即使離線斷網亦能流暢使用。',
      },
      {
        q: '「移除空行」與「修剪首尾空白 (Trim)」對資料清洗有何實質幫助？',
        a: '排版與資料預處理的高效輔助：\n\n① 移除空行：\n自動過濾純換行與僅包含空白字元的無效空白行，大幅壓縮文件篇幅。\n\n② 修剪首尾空白：\n自動移除每行開頭與結尾多餘的半形/全形空格，消除從 PDF 或網頁複製時夾帶的排版雜訊，便於後續匯入 Excel 或資料庫。',
      },
      {
        q: '本文字處理助手是否支援超長篇小說或數十萬字的大型文本？',
        a: '完美支援！本工具採用高度優化的正則表達式與原生 String API 運算，處理 50 萬字以上的超長文稿或大型資料集僅需數毫秒即可完成即時統計與批次排版。',
      },
    ],
  },
  en: {
    title: 'Text Utility & Stats',
    subtitle: 'TEXT UTILITY & STATS',
    description:
      'Free professional online Text Utility & Statistics tool! Supports character count, word count, line count, case conversion, and line cleanup.',
    defaultText:
      'Hello World! This is sample text.\n\nDuplicate line\nDuplicate line\n   Leading and trailing spaces   ',
    totalChars: 'Total Characters',
    noSpaceChars: 'Excl. Spaces',
    chineseChars: 'Chinese Characters',
    englishWords: 'English Words',
    totalLines: 'Total Lines',
    editorTitle: 'Text Content Editor',
    placeholder: 'Type or paste your text here...',
    clear: 'Clear',
    copy: 'Copy Text',
    copiedToast: 'Copied text to clipboard',
    upper: 'UPPERCASE',
    lower: 'lowercase',
    titleCase: 'Title Case',
    removeEmpty: 'Remove Empty Lines',
    removeDups: 'Remove Duplicate Lines',
    trimSpaces: 'Trim Line Spaces',
    langSwitchLabel: '繁體中文',
    langSwitchHref: '/text-utility/',

    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Learn about tokenization standards, character statistics, text formatting, and offline client-side security',
    faqItems: [
      {
        q: 'How are Chinese characters and English words counted in this tool?',
        a: 'We use industry-standard multilingual tokenization algorithms:\n\n① Chinese Character Count:\nMatches Unicode CJK Unified Ideographs (`\\u4e00-\\u9fa5`), counting each distinct Chinese character individually.\n\n② English Word Count:\nMatches continuous alphanumeric sequences and hyphenated words (`\\b[a-zA-Z0-9_-]+\\b`) as standalone words, unaffected by irregular spacing.',
      },
      {
        q: 'What is the difference between "Total Characters" and "Excluding Spaces"?',
        a: 'Their counting scopes and usage conventions differ:\n\n① Total Characters:\nIncludes letters, digits, punctuation marks, newline breaks (`\\n`), and all spaces.\n\n② Excluding Spaces:\nStrips ASCII spaces, full-width spaces, tab indents, and newlines. Many essay submissions, character-limited publishing rates, and social media constraints (Twitter/Threads) rely strictly on character counts excluding spaces.',
      },
      {
        q: 'How do the case conversion functions (UPPERCASE, lowercase, Title Case) operate?',
        a: 'Supports standard letter case transformations:\n\n① UPPERCASE:\nConverts all letters to capital form (e.g. `hello world` → `HELLO WORLD`).\n\n② lowercase:\nConverts all letters to small form.\n\n③ Title Case:\nCapitalizes the first letter of each word and lowers remaining letters (e.g. `hello world` → `Hello World`), ideal for headline typesetting.',
      },
      {
        q: 'Does "Remove Duplicate Lines" preserve the original line ordering?',
        a: 'Yes, original sequence is strictly maintained:\n\n① Stable Order Preservation:\nUsing a Set-based deduplication filter, only subsequent redundant duplicates are removed, preserving the first appearance of each unique line.\n\n② Best Use Cases:\nIdeal for cleaning up mailing lists, phone rosters, keyword sets, and raw database exports.',
      },
      {
        q: 'Is there any privacy or data leakage risk when pasting sensitive text into this tool?',
        a: 'Zero Risk! This tool operates entirely client-side inside your local browser memory:\n\n① Zero Backend Transmission:\nAll character statistics, case transformations, and cleanups execute in your local JavaScript runtime.\n\n② Zero Cloud Logging:\nNo text is ever dispatched to or stored on remote servers. Works fully offline.',
      },
      {
        q: 'How do "Remove Empty Lines" and "Trim Line Spaces" help with data cleansing?',
        a: 'Efficient preprocessing utilities:\n\n① Remove Empty Lines:\nEliminates blank lines and lines containing only whitespace, condensing document layout.\n\n② Trim Line Spaces:\nStrips leading and trailing spaces from every line, cleaning up artifacts copied from PDFs or web tables before importing into Excel or databases.',
      },
      {
        q: 'Can this text utility handle very long manuscripts or large datasets (100,000+ words)?',
        a: 'Yes! Optimized with high-efficiency regular expressions and native JavaScript string APIs, the tool processes manuscripts exceeding 500,000 words in just a few milliseconds.',
      },
    ],
  },
};

/**
 * JSON 格式化與驗證器 頁面中英文案（從 JsonFormatterClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    title: 'JSON 格式化與美化器',
    subtitle: 'JSON FORMATTER & MINIFIER',
    description:
      '專業免費的線上 JSON 格式化與美化器，支援即時語法 Lint 驗證定位、多縮排格式排版、單行壓縮與互動式樹狀檢視。',
    langToggleLabel: 'English',
    langToggleUrl: '/json/en/',
    inputLabel: '原始 JSON 輸入',
    placeholderInput: '貼上或拖曳 JSON 內容至此處...',
    sampleBtn: '載入範例',
    clearBtn: '清除',
    copyBtn: '複製',
    downloadBtn: '下載 .json',
    tabFormatted: '美化 (Format)',
    tabMinified: '單行壓縮 (Minify)',
    tabTree: '樹狀結構 (Tree)',
    indentLabel: '縮排:',
    spaceOption: (num: number) => `${num} 空格`,
    emptyPrompt: '請在左側輸入或拖曳 JSON 內容',
    errorPrompt: '語法錯誤，無法展示結果',
    lintErrorTitle: 'JSON 語法錯誤',
    toastCopied: '已複製到剪貼簿',
    toastCopyFailed: '複製失敗',
    toastNoContent: '無可複製的內容',
    toastEmptyExport: '內容為空無法匯出',
    toastExported: '已匯出 JSON 檔案',

    // FAQ
    faqTitle: '常見問題與專業指南 (FAQ)',
    faqSubtitle: '深入了解 JSON 規範、語法除錯技巧、純前端隱私安全性與大型資料集效能優化',
    faqItems: [
      {
        q: '什麼是 JSON 格式？為什麼現代 Web API 與前端開發廣泛採用 JSON？',
        a: 'JSON（JavaScript Object Notation）是一種輕量級的開放文字資料交換格式：\n\n① 簡潔易讀與高解析效能：\n具備人類直觀可讀性與電腦極速解析特性，相比 XML 更加輕量，能大幅節省網路頻寬與序列化開銷。\n\n② 語言原生相容：\n與 JavaScript 原生物件 (Object) 及陣列 (Array) 結構完美對應，在各主流後端語言（Python、Go、Java、Node.js、Rust）中皆有內建高效解析支援，為 RESTful API 與微服務通訊的黃金標準。',
      },
      {
        q: '常見的 JSON 語法錯誤 (Syntax Error) 有哪些？如何快速除錯？',
        a: '常見的 JSON 格式語法錯誤包括：\n\n① 尾隨逗號 (Trailing Comma)：\n在物件或陣列的最後一個元素後方多加了逗號 `,`（標準 JSON 嚴格禁止尾隨逗號）。\n\n② 引號不符合規範：\n鍵名 (Key) 或字串值使用了單引號 或未加引號，標準 JSON 規定所有 Key 與字串必須使用雙引號。\n\n③ 包含註解或特殊跳脫字元：\n標準 JSON（RFC 8259）不允許加入單行或多行註解。本工具在解析失敗時會精確標示出錯行號與字元位置，協助快速修正。',
      },
      {
        q: '在線上貼上包含 API Key、Token 或機密商業資料的 JSON 是否安全？',
        a: '絕對安全！本工具採用 100% 純前端（Client-Side）本地瀏覽器運算架構：\n\n① 零後端傳輸：\n所有 JSON 格式化、縮排排版、錯誤定位與互動樹狀圖渲染皆完全在您的電腦瀏覽器記憶體中執行。\n\n② 零雲端儲存：\n系統不會向任何伺服器發送或備份您的輸入內容，即使在斷網離線環境下依然能正常操作，確保企業機密與個人隱私安全無虞。',
      },
      {
        q: 'JSON「格式化美化 (Beautify)」與「壓縮縮排 (Minify)」有何差異？各自適用於何種情境？',
        a: '兩者主要在於閱讀性與傳輸效率的權衡：\n\n① 格式化美化 (Beautify)：\n自動加入換行與 2 空格/4 空格/Tab 階層縮排，使巢狀資料層次分明，適合開發者 Debug、閱覽 API 回應結果或撰寫技術文件。\n\n② 壓縮縮排 (Minify)：\n移除所有不必要的空格、換行符號與縮排，將整個 JSON 壓縮成單行文字，體積通常可縮減 30%~50%，適合正式上線環境傳輸以降低網路延遲與頻寬消耗。',
      },
      {
        q: '標準 JSON、JSON5 與 JavaScript 物件字面量 (Object Literal) 有何主要區別？',
        a: '三者的語法寬容度與設計目標不同：\n\n① 標準 JSON（RFC 8259）：\n語法最為嚴格，鍵名與字串必須使用雙引號，不支援註解、尾隨逗號、多行字串或十六進位數值。\n\n② JSON5 與 JS Object：\n為人類手寫配置而擴充的超集格式，允許單引號、省略 Key 的引號、尾隨逗號以及單行與多行註解。本工具遵循最嚴格的標準 JSON 規範進行驗證。',
      },
      {
        q: '如何處理龐大 JSON 檔案（例如超過 50MB）在瀏覽器中的卡頓問題？',
        a: '處理大型資料集時的效能建議：\n\n① 避免過度 DOM 節點渲染：\n超過數萬行的大型 JSON 若一次性渲染語法高亮 DOM 節點，容易佔用過多瀏覽器記憶體。\n\n② 建議操作方式：\n建議使用本工具的「純文字視圖」或「收折根節點樹狀圖」，亦可直接點擊「一鍵壓縮 (Minify)」快速輸出壓縮代碼，避免 UI 重繪造成的短暫延遲。',
      },
      {
        q: '本 JSON 格式化工具支援哪些實用功能與快捷操作？',
        a: '本工具整合全方位開發者工作流：\n\n① 互動式可折疊樹狀導航 (Interactive Collapsible Tree View)：\n支援點擊節點展開/收折各階層物件與陣列，便於探索深層巢狀結構。\n\n② 多功能操作面板：\n支援自訂 2 空格/4 空格/Tab 縮排切換、即時行號語法驗證、一鍵清空、一鍵複製與匯出下載為 `.json` 檔案。',
      },
    ],
  },
  en: {
    title: 'JSON Formatter & Validator',
    subtitle: 'JSON FORMATTER & MINIFIER',
    description:
      'Professional free online JSON formatter and validator tool. Supports live syntax error positioning, custom indent sizes, minification, and interactive tree view.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/json/',
    inputLabel: 'Input JSON',
    placeholderInput: 'Paste or drag JSON content here...',
    sampleBtn: 'Sample',
    clearBtn: 'Clear',
    copyBtn: 'Copy',
    downloadBtn: 'Export .json',
    tabFormatted: 'Beautify (Format)',
    tabMinified: 'Minify',
    tabTree: 'Tree View',
    indentLabel: 'Indent:',
    spaceOption: (num: number) => `${num} spaces`,
    emptyPrompt: 'Paste or drag JSON on the left to start',
    errorPrompt: 'Syntax error, unable to render output',
    lintErrorTitle: 'JSON Syntax Error',
    toastCopied: 'Copied to clipboard',
    toastCopyFailed: 'Copy failed',
    toastNoContent: 'Nothing to copy',
    toastEmptyExport: 'Cannot export empty content',
    toastExported: 'Exported JSON file',

    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Everything you need to know about JSON standards, syntax debugging, client-side security, and large-file performance',
    faqItems: [
      {
        q: 'What is JSON, and why is it ubiquitous in modern Web APIs and front-end development?',
        a: 'JSON (JavaScript Object Notation) is a lightweight, human-readable text-based data interchange format:\n\n① High Efficiency & Readability:\nMore lightweight and faster to serialize/deserialize than XML, saving network bandwidth and compute resources.\n\n② Native Compatibility:\nMaps directly to JavaScript Objects and Arrays, with built-in first-class parser support across all backend languages (Python, Go, Java, Node.js, Rust), making it the gold standard for RESTful and microservice architectures.',
      },
      {
        q: 'What are the most common JSON syntax errors, and how can they be fixed?',
        a: 'Common JSON syntax violations include:\n\n① Trailing Commas:\nLeaving a trailing comma `,` after the final element in an Object or Array (strictly forbidden by standard JSON).\n\n② Quote Inconsistencies:\nUsing single quotes or unquoted keys; standard JSON requires strict double quotes around all keys and string values.\n\n③ Comments & Escape Sequences:\nStandard JSON (RFC 8259) prohibits single-line or multi-line comments. Our tool instantly identifies the exact error line and column index for rapid resolution.',
      },
      {
        q: 'Is it secure to paste confidential JSON data (API Keys, Tokens, Business Payloads) into this tool?',
        a: '100% Secure! This tool runs entirely on a client-side architecture in your local browser:\n\n① Zero Backend Transmission:\nAll parsing, linting, syntax highlighting, and tree rendering occur purely within your local browser memory.\n\n② Zero Cloud Logging:\nNo data is ever dispatched or persisted to remote servers. The tool functions seamlessly even when completely offline.',
      },
      {
        q: 'What is the difference between JSON "Beautify / Format" and "Minify / Compress"?',
        a: 'The trade-off lies between human readability and network efficiency:\n\n① Beautify / Format:\nAdds clear line breaks and 2-space / 4-space / Tab indentation to display nested data hierarchy, ideal for debugging, API testing, and code review.\n\n② Minify / Compress:\nStrips all unnecessary whitespace and newlines into a compact single line, reducing payload size by 30% to 50% for high-throughput production network transmissions.',
      },
      {
        q: 'How does Standard JSON differ from JSON5 and JavaScript Object Literals?',
        a: 'Their syntactic strictness and intended use cases differ:\n\n① Standard JSON (RFC 8259):\nStrict specification requiring double quotes on keys/strings, prohibiting comments, trailing commas, multiline strings, and hexadecimal numbers.\n\n② JSON5 & JS Objects:\nSuperset formats designed for human authoring that permit single quotes, unquoted keys, trailing commas, and inline comments. This validator strictly checks against standard RFC 8259 specifications.',
      },
      {
        q: 'How should very large JSON files (e.g. 50MB+) be handled to prevent browser lag?',
        a: 'Performance optimization tips for large datasets:\n\n① Avoid Over-rendering DOM Nodes:\nRendering hundreds of thousands of syntax-highlighted DOM elements can strain browser memory.\n\n② Recommended Approach:\nUse the "Plain Text View" or collapse root tree nodes. Alternatively, use the "Minify" action for instant compact text output without extensive UI repaints.',
      },
      {
        q: 'What productivity features does this online JSON Formatter provide?',
        a: 'Our formatter integrates an end-to-end developer workflow:\n\n① Interactive Collapsible Tree View:\nExpand or collapse any nested object or array level with a single click.\n\n② Developer Toolbox:\nOffers 2-space / 4-space / Tab indentation switching, real-time error markers, one-click copy, clear button, and direct `.json` file download.',
      },
    ],
  },
};

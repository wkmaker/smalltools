/**
 * URL 編碼解碼器 頁面中英文案（從 UrlEncoderClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
  'zh-TW': {
    title: 'URL 線上編碼與解碼器',
    subtitle: 'URL ENCODER & DECODER',
    description:
      '專業免費的線上 URL 編碼與解碼工具，支援 Percent-encoding 與 Unicode 即時雙向轉換，提供網址結構拆解與 Query 參數表格雙向連動編輯。',
    langToggleLabel: 'English',
    langToggleUrl: '/url/en/',
    plainLabel: '原始網址 / 文字 (Plain Text)',
    encodedLabel: 'URL 編碼文字 (Percent-Encoded)',
    placeholderPlain: '在此輸入要編碼的網址或文字...',
    placeholderEncoded: '在此貼上已編碼的文字進行解碼...',
    modeLabel: '編碼模式：',
    modeComponent: 'EncodeURIComponent (編碼所有參數)',
    modeUri: 'EncodeURI (保留網址基本結構)',
    spacePlusLabel: '空格轉 + (application/x-www-form-urlencoded)',
    exampleBtn: '範例',
    clearBtn: '清除',
    copyBtn: '複製',
    invalidFormat: '無效的 URL 編碼格式',
    parserTitle: '網址結構與 Query 參數解析 (連動編輯)',
    protocolLabel: '傳輸協定 (Protocol)',
    hostLabel: '域名主機 (Host Domain)',
    pathLabel: '路徑 (Pathname)',
    hashLabel: '錨點 (Hash / Fragment)',
    tableKeyHeader: '參數名稱 (Query Key)',
    tableValueHeader: '參數內容 (Value)',
    tableActionsHeader: '操作',
    paramCount: (count: number) => `共 ${count} 個參數`,
    addParamBtn: '新增參數行',
    toastCopied: '已複製到剪貼簿',
    toastCopyFailed: '複製失敗，請手動複製',
    toastNoContent: '沒有可複製的內容',

    // FAQ 常見問題
    faqTitle: 'URL 編碼與解碼常見問題 (FAQ)',
    faqSubtitle: '全方位掌握 URL 百分比編碼原理、encodeURIComponent 與 encodeURI 差異、雙重編碼防範與常見錯誤排查',
    faqItems: [
      {
        q: '什麼是 URL 編碼（Percent-encoding 百分比編碼）？為什麼網址需要編碼？',
        a: 'URL（統一資源定位器）在標準 RFC 3986 規範中僅允許使用 ASCII 字元集中的一部分安全字元（未保留字元包含 A-Z, a-z, 0-9, -, _, ., ~）。\n\n① 解決非 ASCII 字元傳輸問題：\n中文字、日文、Emoji 或其他 Unicode 字元在傳輸時，必須先轉為 UTF-8 位元組，再將每個位元組以「%」加上兩位十六進位數表示（例如「中」編碼為「%E4%B8%AD」）。\n\n② 避免語法歧義與解析錯誤：\n在 URL 中，問號 (?) 代表查詢參數開始、等號 (=) 代表鍵值分隔、井字號 (#) 代表錨點。若參數內容本身包含「&」、「=」、「?」或空格，必須先進行百分比編碼，否則後端伺服器會發生欄位切分錯誤。',
      },
      {
        q: 'encodeURIComponent() 與 encodeURI() 有什麼關鍵差別？我該在何時使用哪一個？',
        a: '兩者的核心差異在於「對 URL 保留字元（保留結構符號）」的處理策略：\n\n① encodeURIComponent()（推薦用於 Query 參數值）：\n會對所有保留字元（包含 : / ? # [ ] @ ! $ & \' ( ) * + , ; =）進行編碼。適合用於「網址參數的 Key 或 Value」，防止參數內容破壞整個網址結構。\n\n② encodeURI()（適用於完整 URL 整體轉碼）：\n會保留完整 URL 結構中的協定、路徑分隔與參數符號（如 ://, /, ?, &, # 不會被編碼），僅對非 ASCII 字元（如中文）及空格轉碼。若拿來編碼含 & 或 = 的參數值，則無法防止語意衝突。\n\n③ 結論簡記：處理單一參數內容請選 encodeURIComponent()；處理整串完整網址請選 encodeURI()。',
      },
      {
        q: '空格在 URL 中應該編碼為「%20」還是「+」？兩者有什麼差別？',
        a: '這取決於編碼規範與所在網址位置：\n\n① RFC 3986 標準規範（%20）：\n在標準 URI 規範與 HTTP 規範中，空格一律編碼為 %20。這在 Path 路徑部分（如 /user%20guide/）是唯一合法的表示方式。\n\n② application/x-www-form-urlencoded 表單規範（+）：\n早期 HTML Form 表單以 GET 或 POST 送出 application/x-www-form-urlencoded 資料時，規範將空格轉為加號「+」。現今多數後端框架（如 PHP, Spring, ASP.NET, Express）在解析 Query String 參數時，能相容將 + 與 %20 同時還原為空格。\n\n本工具下方提供「空格轉 +」快速切換開關，方便相容不同後端系統的需求。',
      },
      {
        q: '什麼是「二次編碼 / 雙重編碼 (Double Encoding)」？如何避免這種錯誤？',
        a: '雙重編碼是指「已經被 URL 編碼過的字串，被再次執行一次 URL 編碼」的常見 Bug：\n\n① 現象與範例：\n中文字「中」首次編碼為「%E4%B8%AD」，若前端或反向代理未經判斷再次呼叫 encodeURIComponent，百分比符號「%」會被二次轉碼為「%25」，字串變成「%25E4%25B8%25AD」。\n\n② 嚴重後果：\n後端伺服器在接收並執行一次解碼後，拿到的是字串「%E4%B8%AD」而非原始中文「中」，導致搜尋失敗、檔案路徑找不到或資料庫存入亂碼。\n\n③ 防範策略：\n在轉發或組裝 URL 時，確認資料進入管道的狀態，使用解析器只對原始純文字進行單次編碼，或在解碼端進行容錯判定。',
      },
      {
        q: '為什麼部分網址在 decodeURIComponent() 時會跳出「URI malformed」錯誤？',
        a: '「URI malformed (格式錯誤)」通常發生在以下情境：\n\n① 不完整的百分比序列：\n字串末尾截斷遺留了「%」或單一十六進位字元（如「%E」而非「%E4」）。\n\n② 無效的 UTF-8 位元組序列：\n中文字通常由 3 個連續 UTF-8 位元組（3 組 %XX）組成。若字串被不當截字，只留下前 1 或 2 組位元組（例如只有「%E4%B8」缺少最後一組），decodeURIComponent() 判定無法重構合法 Unicode 字元即會拋出例外。\n\n③ 非 UTF-8 編碼字串：\n早期以 Big5 或 GB2312 編碼的十六進位網址，直接用現代 UTF-8 解碼器處理時會因字節不合規範而報錯。',
      },
      {
        q: '什麼是 Base64 與 URL 編碼的差別？兩者可以互相替代嗎？',
        a: '兩者的設計目標與運作機制完全不同，不能直接互相取代：\n\n① URL 編碼 (Percent-encoding)：\n僅針對非法或特殊字元以 %XX 進行替換，原本合法的 ASCII 英文與數字維持不變，長度增加有限，主要用於確保網址語法合規與參數正確傳遞。\n\n② Base64 編碼：\n將任意二進位數據或字串轉換為由 64 個可列印字元（A-Z, a-z, 0-9, +, /）組成的文字，編碼後長度固定增加約 33%。標準 Base64 包含的「+」、「/」與「=」字元在 URL 中仍屬於保留字元，若要放在 URL 中必須再做 URL 編碼或改採「Base64URL」規範。',
      },
      {
        q: '本線上工具的資料安全性與隱私保護（無伺服器端紀錄聲明）',
        a: '本工具為 100% 純前端（Client-side）純 JavaScript 執行之離線計算工具：\n\n① 零伺服器傳輸：\n您所輸入、貼上或解析的任何網址、機密 API Key、Token 或 Query 參數，完全只在您的瀏覽器記憶體中運算，絕不會上傳或發送至任何雲端伺服器與第三方資料庫。\n\n② 隱私無痕：\n無快取與無日誌記錄，請安心用於開發除錯、授權網址 (OAuth Callback) 與機密參數之檢視與編輯。',
      },
    ],
  },
  en: {
    title: 'URL Encoder & Decoder',
    subtitle: 'URL ENCODER & DECODER',
    description:
      'Professional free online URL encoder and decoder tool. Instant Percent-encoding & Unicode conversion, URL structure parsing, and live interactive query parameter table editing.',
    langToggleLabel: '繁體中文',
    langToggleUrl: '/url/',
    plainLabel: 'Original URL / Text (Plain Text)',
    encodedLabel: 'URL Encoded Text (Percent-Encoded)',
    placeholderPlain: 'Type URL or text here to encode...',
    placeholderEncoded: 'Paste encoded URL string here to decode...',
    modeLabel: 'Encoding Mode:',
    modeComponent: 'EncodeURIComponent (Encode All Params)',
    modeUri: 'EncodeURI (Preserve Basic URL Structure)',
    spacePlusLabel: 'Encode Space as + (application/x-www-form-urlencoded)',
    exampleBtn: 'Sample',
    clearBtn: 'Clear',
    copyBtn: 'Copy',
    invalidFormat: 'Invalid URL encoded format',
    parserTitle: 'URL Structure & Query Parameter Parser (Interactive)',
    protocolLabel: 'Protocol',
    hostLabel: 'Host Domain',
    pathLabel: 'Pathname',
    hashLabel: 'Hash / Fragment',
    tableKeyHeader: 'Query Key',
    tableValueHeader: 'Value',
    tableActionsHeader: 'Actions',
    paramCount: (count: number) => `Total ${count} params`,
    addParamBtn: 'Add Query Row',
    toastCopied: 'Copied to clipboard',
    toastCopyFailed: 'Copy failed, please copy manually',
    toastNoContent: 'Nothing to copy',

    // FAQ
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Everything you need to know about Percent-encoding, encodeURIComponent vs encodeURI, double encoding, and URL troubleshooting',
    faqItems: [
      {
        q: 'What is URL Encoding (Percent-Encoding) and why is it necessary?',
        a: 'Under RFC 3986 standards, URLs are restricted to a limited set of ASCII characters (unreserved characters include A-Z, a-z, 0-9, -, _, ., ~).\n\n① Handling Non-ASCII & Unicode Characters:\nCharacters from non-Latin scripts (Chinese, Japanese, Arabic, etc.) and emojis must be converted into UTF-8 byte sequences, where each byte is represented by a percent sign followed by two hexadecimal digits (e.g., \'中\' becomes \'%E4%B8%AD\').\n\n② Preventing Syntax Ambiguities:\nIn a URL, characters like \'?\' denote the start of query parameters, \'=\' separates key-value pairs, and \'&\' separates parameters. If a parameter value itself contains \'&\', \'=\', \'?\', or spaces, it must be percent-encoded to prevent server-side parsing errors.',
      },
      {
        q: 'What is the difference between encodeURIComponent() and encodeURI()?',
        a: 'The primary difference lies in how reserved URL structural characters are treated:\n\n① encodeURIComponent() (Recommended for Query Parameter Values):\nEncodes all reserved characters including : / ? # [ ] @ ! $ & \' ( ) * + , ; =. This is essential for individual query parameter keys and values so they do not break the overall URL structure.\n\n② encodeURI() (Used for Complete URL Strings):\nPreserves URL structural syntax (e.g. ://, /, ?, &, # remain unencoded) and only encodes non-ASCII characters and spaces. It should not be used on parameter values containing \'&\' or \'=\' because it will not escape them.\n\n③ Rule of Thumb: Use encodeURIComponent() for individual parameter keys/values, and encodeURI() when encoding a whole, valid URL string.',
      },
      {
        q: 'Should space be encoded as \'%20\' or \'+\' in URLs?',
        a: 'This depends on the specification and context:\n\n① RFC 3986 Standard (%20):\nUnder standard URI and HTTP specifications, spaces must be encoded as %20. In the path component of a URL (e.g., /my%20documents/), %20 is the only valid representation.\n\n② application/x-www-form-urlencoded (+):\nHistorically, HTML form submissions using GET/POST with application/x-www-form-urlencoded encode spaces as \'+\'. Most backend frameworks (PHP, Spring, ASP.NET, Express) automatically decode both \'+\' and \'%20\' as spaces in query strings.\n\nThis tool provides a toggle switch to encode spaces as \'+\' if required by your specific backend.',
      },
      {
        q: 'What is Double Encoding and how do I prevent it?',
        a: 'Double encoding occurs when an already percent-encoded string is accidentally encoded a second time:\n\n① Mechanism:\nA character like \'中\' is encoded to \'%E4%B8%AD\'. If encoded again, the \'%\' character is converted to \'%25\', resulting in \'%25E4%25B8%25AD\'.\n\n② Negative Impact:\nWhen the receiving server decodes the URL once, it obtains the string \'%E4%B8%AD\' rather than the original character \'中\', resulting in broken search queries, 404 file not found errors, or corrupted database records.\n\n③ Prevention: Always ensure data is in its raw, unencoded state before applying encodeURIComponent().',
      },
      {
        q: 'Why does decodeURIComponent() throw a \'URI malformed\' error?',
        a: 'The \'URI malformed\' JavaScript runtime error typically happens in the following cases:\n\n① Truncated Percent Sequences:\nA trailing \'%\' sign or an incomplete hex pair (e.g., \'%E\' instead of \'%E4\').\n\n② Incomplete UTF-8 Byte Sequences:\nMost international characters require 2 to 4 consecutive %XX byte sequences. If a string was trimmed or truncated midway (e.g., \'%E4%B8\' missing its third byte), decodeURIComponent() cannot reconstruct a valid Unicode character and throws an exception.\n\n③ Legacy Non-UTF8 Encodings:\nURLs encoded using legacy character sets (such as Big5 or ISO-8859-1) fail when processed by modern UTF-8 decoders.',
      },
      {
        q: 'What is the difference between Base64 and URL encoding? Can they replace each other?',
        a: 'Base64 and URL encoding serve fundamentally different purposes and are not interchangeable:\n\n① URL Encoding (Percent-encoding):\nSelectively replaces invalid characters with %XX while keeping standard alphanumeric ASCII characters intact with minimal length overhead.\n\n② Base64 Encoding:\nEncodes arbitrary binary data or text into an ASCII string using a 64-character alphabet (A-Z, a-z, 0-9, +, /), increasing data size by ~33%. Standard Base64 contains \'+\', \'/\', and \'=\' which are reserved characters in URLs and must be URL-encoded or converted to \'Base64URL\' format before being placed in a query string.',
      },
      {
        q: 'Data Privacy & Zero Server Storage Guarantee',
        a: 'This tool operates 100% on the client side using pure browser JavaScript:\n\n① Zero Server Transmission:\nAll URLs, API keys, bearer tokens, and sensitive query parameters you paste or inspect remain entirely within your local browser memory. Nothing is ever sent to, logged by, or stored on any remote server.\n\n② Safe for Confidential Data:\nYou can safely inspect, parse, and debug sensitive OAuth redirect URLs, JWT tokens, and private API query parameters with total peace of mind.',
      },
    ],
  },
};

/**
 * app/taiwan-id-generator/translations.ts
 * ──────────────────────────────────────────────────────────────
 * 台灣身分證產生器與驗證器 100% 雙語字典 (zh-TW / en)
 */

import type { FaqItem } from '@/app/utils/faqSchema';

export interface TaiwanIdTranslation {
  title: string;
  subtitle: string;
  description: string;
  tabGenerate: string;
  tabValidate: string;
  disclaimerTitle: string;
  disclaimerBody: string;
  sectionOptions: string;
  labelIdType: string;
  typeNational: string;
  typeNationalDesc: string;
  typeNewResident: string;
  typeNewResidentDesc: string;
  typeOldResident: string;
  typeOldResidentDesc: string;
  labelCounty: string;
  countyRandom: string;
  countySelectedCount: string;
  countyPresetSix: string;
  countyClearSelection: string;
  countyHintMulti: string;
  includeLegacyLabel: string;
  labelGender: string;
  genderRandom: string;
  genderMale: string;
  genderFemale: string;
  labelBatchCount: string;
  btnGenerate: string;
  btnRegenerate: string;
  btnCopy: string;
  btnCopied: string;
  btnCopyAll: string;
  btnExportTxt: string;
  btnExportCsv: string;
  btnExportJson: string;
  sectionResult: string;
  resultBadgeCount: string;
  colIndex: string;
  colId: string;
  colType: string;
  colCounty: string;
  colGender: string;
  colAction: string;
  inspectBreakdown: string;
  breakdownTitle: string;
  breakdownFormulaPrefix: string;
  breakdownRemainderValid: string;
  breakdownRemainderInvalid: string;
  breakdownColPos: string;
  breakdownColChar: string;
  breakdownColDigit: string;
  breakdownColWeight: string;
  breakdownColProduct: string;
  breakdownTotalLabel: string;
  historyTitle: string;
  historyClear: string;
  validatorInputLabel: string;
  validatorInputPlaceholder: string;
  validatorSampleBtn: string;
  validatorClearBtn: string;
  validatorEmptyHint: string;
  validatorSummaryValid: string;
  validatorSummaryInvalid: string;
  statusValid: string;
  statusInvalid: string;
  errEmpty: string;
  errLength: string;
  errCounty: string;
  errFormat: string;
  errChecksum: string;
  countyRefTitle: string;
  countyRefSubtitle: string;
  countyRefCode: string;
  countyRefValue: string;
  countyRefName: string;
  countyRefStatus: string;
  countyRefActive: string;
  countyRefLegacy: string;
  toastCopied: string;
  toastCopiedAll: string;
  toastExported: string;
  toastCopyFailed: string;
  faqTitle: string;
  faqSubtitle: string;
  faqItems: FaqItem[];
}

export const TRANSLATIONS: Record<'zh-TW' | 'en', TaiwanIdTranslation> = {
  'zh-TW': {
    title: '台灣身分證產生器',
    subtitle: 'TAIWAN NATIONAL ID GENERATOR & VALIDATOR',
    description:
      '純前端台灣國民身分證字號與新／舊式外來人口統一證號產生及驗證工具。支援指定縣市與性別、批次匯出與加權檢查碼逐步拆解，完全於瀏覽器本機運算，專為軟體開發與表單測試打造。',
    tabGenerate: '證號產生器',
    tabValidate: '格式驗證與解析',
    disclaimerTitle: '僅供軟體開發與測試使用',
    disclaimerBody:
      '本工具依內政部公開檢核公式在瀏覽器本機隨機產生，不會連線或記錄任何資料。產出之字號僅供系統測試、表單驗證與演算法學習，嚴禁冒用他人身分或用於任何違法用途。',
    sectionOptions: '產生條件設定',
    labelIdType: '證號類型',
    typeNational: '國民身分證',
    typeNationalDesc: '第 2 碼為 1（男）或 2（女）',
    typeNewResident: '新式居留證',
    typeNewResidentDesc: '2021 年起核發，第 2 碼為 8（男）或 9（女）',
    typeOldResident: '舊式居留證',
    typeOldResidentDesc: '舊制外來人口，第 2 碼為 A／B／C／D',
    labelCounty: '發證縣市（可多選）',
    countyRandom: '全部隨機',
    countySelectedCount: '已選 {count} 個縣市',
    countyPresetSix: '六都',
    countyClearSelection: '重設為隨機',
    countyHintMulti: '未勾選時預設從現行 22 縣市隨機抽取；可點選多個縣市限定範圍。',
    includeLegacyLabel: '隨機時包含已停發舊縣市代碼（L、R、S、Y）',
    labelGender: '性別',
    genderRandom: '隨機',
    genderMale: '男性',
    genderFemale: '女性',
    labelBatchCount: '產生筆數',
    btnGenerate: '立即產生',
    btnRegenerate: '重新產生',
    btnCopy: '複製',
    btnCopied: '已複製',
    btnCopyAll: '複製全部',
    btnExportTxt: '下載文字檔',
    btnExportCsv: '下載試算表',
    btnExportJson: '下載 JSON',
    sectionResult: '產生結果',
    resultBadgeCount: '共 {count} 筆',
    colIndex: '#',
    colId: '證號',
    colType: '類型',
    colCounty: '發證縣市',
    colGender: '性別',
    colAction: '操作',
    inspectBreakdown: '驗算',
    breakdownTitle: '加權檢查碼驗算明細',
    breakdownFormulaPrefix: '加權總和',
    breakdownRemainderValid: '除以 10 餘 0，檢查碼完全合法',
    breakdownRemainderInvalid: '除以 10 餘 {remainder}（正確檢查碼應為 {expected}）',
    breakdownColPos: '位置',
    breakdownColChar: '字元',
    breakdownColDigit: '對應數值',
    breakdownColWeight: '權重',
    breakdownColProduct: '乘積',
    breakdownTotalLabel: '加權總計',
    historyTitle: '本次工作階段紀錄',
    historyClear: '清空紀錄',
    validatorInputLabel: '輸入單筆或多筆證號（每行一筆或以逗號分隔）',
    validatorInputPlaceholder: '例如：\nA123456789\nA800000014\nAC12345679',
    validatorSampleBtn: '載入測試範例',
    validatorClearBtn: '清空',
    validatorEmptyHint: '請於上方輸入 10 碼台灣身分證字號或新／舊式居留證統一證號，系統將即時解析縣市、性別與加權檢核結果。',
    validatorSummaryValid: '合法 {count} 筆',
    validatorSummaryInvalid: '無效 {count} 筆',
    statusValid: '合法',
    statusInvalid: '無效',
    errEmpty: '輸入內容為空',
    errLength: '長度須為 10 碼',
    errCounty: '首碼須為 A–Z 英文字母',
    errFormat: '第 2 碼須為 1/2、8/9 或 A–D，後 8 碼須為數字',
    errChecksum: '檢查碼錯誤，正確應為 {expected}',
    countyRefTitle: '26 縣市字母代碼對照表',
    countyRefSubtitle: '展開查閱 A–Z 對應數值與現況',
    countyRefCode: '代碼',
    countyRefValue: '對應數值',
    countyRefName: '縣市名稱',
    countyRefStatus: '核發狀態',
    countyRefActive: '現行',
    countyRefLegacy: '已停發',
    toastCopied: '已複製 {id}',
    toastCopiedAll: '已複製全部 {count} 筆證號',
    toastExported: '已下載 {filename}',
    toastCopyFailed: '無法存取剪貼簿，請手動選取複製',
    faqTitle: '常見問題與編碼規則指南',
    faqSubtitle: '深入了解台灣身分證字號與新舊式居留證的檢核公式與合法用途',
    faqItems: [
      {
        q: '台灣國民身分證字號的 10 碼結構與檢查碼演算法是什麼？',
        a: `台灣國民身分證字號共 10 碼，由「1 位英文字母 + 9 位數字」組成：

① 第 1 碼（英文字母 A–Z）：代表初次設籍的縣市代碼，換算時需依內政部對照表轉為兩位數（例如 A 臺北市 = 10、I 嘉義市 = 34、O 新竹市 = 35），再拆成十位數與個位數。

② 第 2 碼（性別碼）：1 代表男性，2 代表女性。

③ 第 3 至 9 碼：7 位流水編號。

④ 第 10 碼（檢查碼）：將前述拆解後的 10 個數字加上檢查碼（共 11 個數字），依序乘上權重 [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1] 並加總，總和必須能被 10 整除（餘數為 0）才屬合法字號。`,
      },
      {
        q: '新式外來人口統一證號（居留證）與舊式有什麼差別？',
        a: `內政部移民署自 2021 年 1 月 2 日起實施新式外來人口統一證號，使居留證格式與本國人身分證全面接軌：

① 新式統一證號：第 1 碼為縣市英文字母，第 2 碼改為數字 8（男性）或 9（女性），第 3 至 10 碼為數字，加權檢核公式與國民身分證完全相同。

② 舊式統一證號：第 1 碼為縣市字母，第 2 碼為英文字母（A、C 為男性，B、D 為女性），驗算時第 2 碼字母需換算為對應代碼的個位數（A=0、B=1、C=2、D=3），其餘權重與規則相同。

本工具的產生器與驗證器皆完整支援這三種格式。`,
      },
      {
        q: '為什麼縣市代碼表中的 I、O、W、X、Y、Z 數值不是依字母順序遞增？',
        a: `台灣早年制定身分證縣市代碼時，嘉義市（I）與新竹市（O）是在 1982 年升格為省轄市後才增補，因此數值分別排在 34 與 35，而非緊接在 H（17）或 N（22）之後。

同理，金門縣（W=32）、澎湖縣（X=30）、陽明山管理局（Y=31）與連江縣（Z=33）亦因歷史行政區劃調整而採用非連續編碼。撰寫驗證程式時切勿僅用 ASCII 碼相減推算，務必查閱完整 26 字母對照表。`,
      },
      {
        q: '為什麼有些縣市代碼標註「已停發」（L、R、S、Y）？',
        a: `2010 年底五都改制升格後，原臺中縣（L）、臺南縣（R）、高雄縣（S）分別併入臺中市、臺南市與高雄市，陽明山管理局（Y）亦早年併入臺北市。

雖然新生兒與新設籍民眾已不再核發這 4 組代碼，但過去領有該代碼的國民依然持續沿用終身，因此實務系統在做格式驗證時，仍必須將 L、R、S、Y 視為合法縣市代碼。本工具預設隨機僅產生現行 22 縣市，您也可勾選納入已停發代碼進行相容性測試。`,
      },
      {
        q: '這個產生器產出的身分證字號是真實人物的資料嗎？安全嗎？',
        a: `不是！本工具完全在您的瀏覽器本機使用密碼學安全亂數（Web Crypto API）依公開數學公式隨機演算，並未連結任何政府戶政資料庫，也不會上傳、記錄或透過 localStorage 保存任何產出或驗證過的字號。

由於檢核演算法為公開數學規則，隨機產出的字號有可能純屬巧合與真實字號碰撞，請務必僅用於軟體開發、自動化測試或教學演示。`,
      },
      {
        q: '【免責聲明】使用本工具產生之測試字號有哪些法律與合規注意事項？',
        a: `【重要免責聲明】

① 本工具產出之字號僅供工程師、QA 測試人員進行表單驗證、單元測試、資料庫假資料填充及演算法學習之用。

② 嚴禁將本工具產出之字號用於冒名註冊、金融開戶、政府申報、偽造文書或任何侵害他人權益之違法行為。

③ 使用者須自行承擔操作與使用產出資料之一切法律責任，本站及作者不對任何不當使用所衍生之法律責任或損失負責。`,
      },
    ],
  },
  en: {
    title: 'Taiwan National ID Generator',
    subtitle: 'TAIWAN NATIONAL ID GENERATOR & VALIDATOR',
    description:
      'Pure client-side generator and validator for Taiwan National ID and New/Legacy Resident Certificate numbers. Filter by county and gender, batch export in TXT/CSV/JSON, and inspect step-by-step checksum weights for QA and software testing.',
    tabGenerate: 'ID Generator',
    tabValidate: 'Validator & Parser',
    disclaimerTitle: 'For Software Development & Testing Only',
    disclaimerBody:
      'Numbers are randomly computed locally in your browser using the public checksum formula with zero network requests or storage. Use strictly for QA, form validation, and learning — never for impersonation or unlawful purposes.',
    sectionOptions: 'Generator Options',
    labelIdType: 'ID Format',
    typeNational: 'National ID',
    typeNationalDesc: '2nd char: 1 (Male) or 2 (Female)',
    typeNewResident: 'New Resident ID',
    typeNewResidentDesc: 'Issued since 2021, 2nd char: 8 (Male) or 9 (Female)',
    typeOldResident: 'Legacy Resident ID',
    typeOldResidentDesc: 'Pre-2021 ARC format, 2nd char: A / B / C / D',
    labelCounty: 'Issuing County / City (Multi-select)',
    countyRandom: 'All Random',
    countySelectedCount: '{count} selected',
    countyPresetSix: '6 Major Cities',
    countyClearSelection: 'Reset to Random',
    countyHintMulti: 'Leave unselected to pick randomly from 22 active counties, or select multiple to filter.',
    includeLegacyLabel: 'Include discontinued county codes (L, R, S, Y) when random',
    labelGender: 'Gender',
    genderRandom: 'Random',
    genderMale: 'Male',
    genderFemale: 'Female',
    labelBatchCount: 'Quantity',
    btnGenerate: 'Generate Now',
    btnRegenerate: 'Regenerate',
    btnCopy: 'Copy',
    btnCopied: 'Copied',
    btnCopyAll: 'Copy All',
    btnExportTxt: 'Export TXT',
    btnExportCsv: 'Export CSV',
    btnExportJson: 'Export JSON',
    sectionResult: 'Generated Results',
    resultBadgeCount: '{count} items',
    colIndex: '#',
    colId: 'ID Number',
    colType: 'Format',
    colCounty: 'County / City',
    colGender: 'Gender',
    colAction: 'Action',
    inspectBreakdown: 'Inspect',
    breakdownTitle: 'Weighted Checksum Breakdown',
    breakdownFormulaPrefix: 'Weighted Sum',
    breakdownRemainderValid: 'Divisible by 10 (remainder 0) — valid checksum',
    breakdownRemainderInvalid: 'Remainder {remainder} mod 10 (expected check digit: {expected})',
    breakdownColPos: 'Pos',
    breakdownColChar: 'Char',
    breakdownColDigit: 'Value',
    breakdownColWeight: 'Weight',
    breakdownColProduct: 'Product',
    breakdownTotalLabel: 'Total Sum',
    historyTitle: 'Session History',
    historyClear: 'Clear History',
    validatorInputLabel: 'Enter one or more ID numbers (one per line or comma-separated)',
    validatorInputPlaceholder: 'Example:\nA123456789\nA800000014\nAC12345679',
    validatorSampleBtn: 'Load Samples',
    validatorClearBtn: 'Clear',
    validatorEmptyHint: 'Enter any 10-character Taiwan National ID or Resident ID above to validate its checksum and inspect county, gender, and weighted calculation details.',
    validatorSummaryValid: '{count} Valid',
    validatorSummaryInvalid: '{count} Invalid',
    statusValid: 'Valid',
    statusInvalid: 'Invalid',
    errEmpty: 'Input is empty',
    errLength: 'Must be exactly 10 characters',
    errCounty: 'First character must be A–Z',
    errFormat: '2nd char must be 1/2, 8/9, or A–D, followed by 8 digits',
    errChecksum: 'Invalid checksum (expected {expected})',
    countyRefTitle: '26 County / City Letter Code Table',
    countyRefSubtitle: 'Expand to view A–Z numeric mappings and status',
    countyRefCode: 'Code',
    countyRefValue: 'Numeric Value',
    countyRefName: 'County / City',
    countyRefStatus: 'Status',
    countyRefActive: 'Active',
    countyRefLegacy: 'Legacy',
    toastCopied: 'Copied {id}',
    toastCopiedAll: 'Copied all {count} IDs',
    toastExported: 'Downloaded {filename}',
    toastCopyFailed: 'Clipboard access failed. Please copy manually.',
    faqTitle: 'FAQ & Checksum Rules',
    faqSubtitle: 'Learn how Taiwan National ID and Resident Certificate checksums work',
    faqItems: [
      {
        q: 'How is a 10-character Taiwan National ID structured and validated?',
        a: `A Taiwan National ID consists of 1 uppercase letter followed by 9 digits:

1. 1st character (A–Z): Represents the county or city of initial household registration. It maps to a 2-digit number (e.g., A Taipei = 10, I Chiayi City = 34, O Hsinchu City = 35), which is split into tens and ones digits.

2. 2nd character (Gender): 1 for Male, 2 for Female.

3. 3rd–9th characters: 7 serial digits.

4. 10th character (Check digit): Multiply the resulting 11 digits by weights [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1] and sum them. The ID is valid if and only if the total sum is divisible by 10.`,
      },
      {
        q: 'What is the difference between New and Legacy Taiwan Resident IDs (ARC)?',
        a: `Since January 2, 2021, Taiwan's National Immigration Agency introduced the New UI Number (New Resident ID) to align with the National ID format:

1. New Resident ID: Starts with a county letter (A–Z), uses 8 (Male) or 9 (Female) as the 2nd character, followed by 8 digits. Its checksum formula is identical to the National ID.

2. Legacy Resident ID: Starts with a county letter (A–Z), uses a second letter (A/C for Male, B/D for Female) mapped to the ones digit of its letter code (A=0, B=1, C=2, D=3), followed by 8 digits.

Both the generator and validator here support all three formats.`,
      },
      {
        q: 'Why are the numeric codes for I, O, W, X, Y, and Z not in alphabetical order?',
        a: `Chiayi City (I=34) and Hsinchu City (O=35) were upgraded to provincial cities in 1982 after the initial A–Z assignment, so they received appended numeric codes rather than consecutive numbers.

Similarly, Kinmen (W=32), Penghu (X=30), Yangmingshan (Y=31), and Lienchiang (Z=33) reflect historical administrative reorganizations. Always use the official lookup table instead of ASCII offset arithmetic when implementing validators.`,
      },
      {
        q: 'Why are L, R, S, and Y marked as Legacy / Discontinued?',
        a: `Following Taiwan's 2010 municipal mergers, Taichung County (L), Tainan County (R), and Kaohsiung County (S) were merged into their respective special municipalities, while Yangmingshan (Y) was merged into Taipei City earlier.

New registrations no longer receive these codes, but existing citizens keep them for life. Production validators must still accept L, R, S, and Y as valid county codes. You can opt in to include them when testing legacy compatibility.`,
      },
      {
        q: 'Do the generated numbers belong to real people? Is any data uploaded?',
        a: `No. Every ID is computed locally in your browser using the Web Crypto API (crypto.getRandomValues) and the public modulo-10 checksum formula. No government database is queried, and nothing is sent to a server or saved to localStorage.

Because the checksum rule is purely mathematical, a randomly generated string could coincidentally match an issued ID. Use generated outputs strictly for software testing and educational demonstrations.`,
      },
      {
        q: '[Disclaimer] Legal and compliance notice for using generated test IDs',
        a: `[Important Disclaimer]

1. Outputs from this tool are strictly intended for developers and QA engineers performing form validation, automated testing, mock dataset seeding, and algorithm study.

2. Do not use generated IDs for impersonation, account registration fraud, financial applications, government filings, or any unlawful activity.

3. Users assume full legal responsibility for how generated values are used. This website and its authors bear no liability for any misuse or damages.`,
      },
    ],
  },
};

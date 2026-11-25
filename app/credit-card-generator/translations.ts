/**
 * app/credit-card-generator/translations.ts
 * ──────────────────────────────────────────────────────────────
 * 測試信用卡號產生器與 Luhn 驗證器 100% 雙語字典 (zh-TW / en)
 */

import type { FaqItem } from '@/app/utils/faqSchema';

export interface CreditCardTranslation {
  title: string;
  subtitle: string;
  description: string;
  tabGenerate: string;
  tabValidate: string;
  disclaimerTitle: string;
  disclaimerBody: string;
  heroNotRealNote: string;
  sectionOptions: string;
  labelNetworks: string;
  networksAllRandom: string;
  networksSelectedCount: string;
  networksClearBtn: string;
  networksHint: string;
  labelCustomBin: string;
  customBinPlaceholder: string;
  customBinHint: string;
  labelBatchCount: string;
  labelDisplayOptions: string;
  optIncludeSpaces: string;
  optIncludeMeta: string;
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
  colNumber: string;
  colNetwork: string;
  colExpiry: string;
  colCvv: string;
  colAction: string;
  metaExpiryLabel: string;
  metaCvvLabel: string;
  inspectBreakdown: string;
  breakdownTitle: string;
  breakdownFormulaPrefix: string;
  breakdownRemainderValid: string;
  breakdownRemainderInvalid: string;
  breakdownDoubledTag: string;
  breakdownKeepTag: string;
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
  errNonNumeric: string;
  errLength: string;
  errChecksum: string;
  sandboxTitle: string;
  sandboxSubtitle: string;
  sandboxProviderCol: string;
  sandboxScenarioCol: string;
  sandboxNumberCol: string;
  sandboxActionCol: string;
  toastCopied: string;
  toastCopiedAll: string;
  toastExported: string;
  toastCopyFailed: string;
  faqTitle: string;
  faqSubtitle: string;
  faqItems: FaqItem[];
}

export const TRANSLATIONS: Record<'zh-TW' | 'en', CreditCardTranslation> = {
  'zh-TW': {
    title: '測試信用卡號產生器',
    subtitle: 'TEST CREDIT CARD GENERATOR & LUHN VALIDATOR',
    description:
      '純前端隨機測試信用卡號產生與 Luhn 演算法驗證工具。支援多選 Visa、Mastercard、JCB、Amex、銀聯與 Discover、自訂 BIN 前綴與批次匯出。所有卡號皆依公開數學公式隨機產生，並非實際可用的信用卡，僅供軟體開發與金流表單測試。',
    tabGenerate: '測試卡號產生器',
    tabValidate: 'Luhn 驗證與辨識',
    disclaimerTitle: '重要提醒：所有卡號皆為隨機產生，並非實際可用的信用卡',
    disclaimerBody:
      '本工具僅依 ISO/IEC 7812 公開 Luhn 檢核公式與發卡組織前綴在瀏覽器本機隨機演算，未連結任何銀行或發卡機構，不含真實持卡人資料、帳戶或消費額度，無法用於任何實際刷卡、扣款或驗證交易。僅供軟體開發、表單防呆與金流沙盒測試使用。',
    heroNotRealNote: '隨機測試卡號（僅通過 Luhn 格式檢核，無對應帳戶與額度，無法用於真實交易）',
    sectionOptions: '產生條件設定',
    labelNetworks: '發卡組織（可多選）',
    networksAllRandom: '全部隨機',
    networksSelectedCount: '已選 {count} 種',
    networksClearBtn: '重設為隨機',
    networksHint: '未勾選時預設從 6 大發卡組織隨機抽取；若填入自訂 BIN 前綴則優先依前綴產生。',
    labelCustomBin: '自訂 BIN 前綴（選填，最多 12 位數字）',
    customBinPlaceholder: '例如 424242 或 555555',
    customBinHint: '留空則依所選發卡組織自動搭配公開前綴。',
    labelBatchCount: '產生筆數',
    labelDisplayOptions: '顯示與匯出選項',
    optIncludeSpaces: '卡號加入空格分段（如 4242 4242 ...）',
    optIncludeMeta: '一併產生模擬有效期限與安全碼（僅供測試表單填入）',
    btnGenerate: '立即產生',
    btnRegenerate: '重新產生',
    btnCopy: '複製',
    btnCopied: '已複製',
    btnCopyAll: '複製全部',
    btnExportTxt: '下載文字檔',
    btnExportCsv: '下載試算表',
    btnExportJson: '下載 JSON',
    sectionResult: '隨機測試卡號結果',
    resultBadgeCount: '共 {count} 筆',
    colIndex: '#',
    colNumber: '隨機測試卡號',
    colNetwork: '發卡組織',
    colExpiry: '模擬效期',
    colCvv: '模擬安全碼',
    colAction: '操作',
    metaExpiryLabel: '模擬效期',
    metaCvvLabel: '模擬安全碼',
    inspectBreakdown: '驗算',
    breakdownTitle: 'Luhn 演算法（Mod 10）逐步驗算明細',
    breakdownFormulaPrefix: 'Luhn 總和',
    breakdownRemainderValid: '除以 10 餘 0，符合 Luhn 檢核格式',
    breakdownRemainderInvalid: '除以 10 餘 {remainder}（正確檢查碼應為 {expected}）',
    breakdownDoubledTag: '×2',
    breakdownKeepTag: '×1',
    historyTitle: '本次工作階段紀錄',
    historyClear: '清空紀錄',
    validatorInputLabel: '輸入單筆或多筆卡號（每行一筆或以逗號分隔，自動忽略空白與連字號）',
    validatorInputPlaceholder: '例如：\n4242 4242 4242 4242\n3782 822463 10005\n5555-5555-5555-4444',
    validatorSampleBtn: '載入測試範例',
    validatorClearBtn: '清空',
    validatorEmptyHint:
      '請於上方輸入 13 至 19 碼卡號，系統將即時以 Luhn 演算法檢核格式並辨識發卡組織。所有資料僅於瀏覽器記憶體中運算，絕不上傳。',
    validatorSummaryValid: '格式合法 {count} 筆',
    validatorSummaryInvalid: '無效 {count} 筆',
    statusValid: '格式合法',
    statusInvalid: '無效',
    errEmpty: '輸入內容為空',
    errNonNumeric: '僅能包含數字、空白與連字號',
    errLength: '卡號長度須介於 13 至 19 碼',
    errChecksum: 'Luhn 檢查碼錯誤，正確檢查碼應為 {expected}',
    sandboxTitle: '常見金流商官方沙盒測試卡速查',
    sandboxSubtitle: '展開查看 Stripe 等金流沙盒測試環境常用公開測試卡號',
    sandboxProviderCol: '金流服務',
    sandboxScenarioCol: '測試情境',
    sandboxNumberCol: '公開測試卡號',
    sandboxActionCol: '操作',
    toastCopied: '已複製 {value}',
    toastCopiedAll: '已複製全部 {count} 筆測試卡號',
    toastExported: '已下載 {filename}',
    toastCopyFailed: '無法存取剪貼簿，請手動選取複製',
    faqTitle: '常見問題與 Luhn 演算法說明',
    faqSubtitle: '了解測試卡號為何無法實際消費，以及 Luhn 檢核公式的運作原理',
    faqItems: [
      {
        q: '這些隨機產生的信用卡號可以拿來實際刷卡、綁定試用或線上購物嗎？',
        a: `完全不行！本工具產生的卡號、模擬效期與模擬安全碼皆為瀏覽器端隨機演算的測試假資料，並非實際存在的信用卡。

真正的信用卡交易必須經過收單銀行、發卡組織與發卡銀行的即時授權連線，核對真實帳戶狀態、實際有效期限、安全碼與可用額度。任何由 Luhn 演算法隨機產出的號碼都不對應真實帳戶與額度，在真實商店或付費服務中只會被立即拒絕交易。`,
      },
      {
        q: '什麼是 Luhn 演算法（Mod 10）？它是如何驗證卡號格式的？',
        a: `Luhn 演算法（又稱 Mod 10 演算法，收錄於 ISO/IEC 7812 國際標準）是全球信用卡號用來防止「手動輸入打錯字」的檢核公式：

① 從卡號最右側的檢查碼往左數，將偶數位（由右算起第 2、4、6... 位）乘以 2。

② 若乘以 2 後大於 9（例如 7 × 2 = 14），則減去 9（等價於十位數加個位數：1 + 4 = 5）。

③ 將所有調整後的數字加總，若總和能被 10 整除（餘數為 0），代表這組卡號通過格式檢核。`,
      },
      {
        q: '各家發卡組織（Visa、Mastercard、JCB、Amex 等）的卡號前綴與長度有什麼差別？',
        a: `卡號最前面的 1 至 6 碼稱為 BIN／IIN（銀行識別碼），用來辨識發卡組織與發卡機構：

① Visa：以 4 開頭，標準為 16 碼，安全碼 3 碼。

② Mastercard：以 51–55 或 2221–2720 開頭，16 碼，安全碼 3 碼。

③ JCB：以 3528–3589 開頭，16 碼，安全碼 3 碼。

④ American Express：以 34 或 37 開頭，15 碼（4-6-5 分段），安全碼為 4 碼。

⑤ UnionPay 銀聯：以 62 開頭，常見為 16 碼，安全碼 3 碼。

⑥ Discover：以 6011、644–649 或 65 開頭，16 碼，安全碼 3 碼。`,
      },
      {
        q: '為什麼開發與 QA 測試需要測試信用卡號產生器？',
        a: `工程師在開發結帳頁面、會員付款表單或串接金流 SDK 時，需要快速驗證前端即時格式分段、卡別圖示自動切換、Luhn 即時錯誤提示、表單欄位長度與自動化端對端測試（E2E Testing）。

使用純前端隨機產生的測試卡號，可以避免在程式碼或測試腳本中誤填真實個人信用卡號，大幅降低個資與金融資料外洩風險。`,
      },
      {
        q: '在驗證器貼上卡號檢查安全嗎？資料會被傳送到伺服器嗎？',
        a: `本工具採用 100% 純前端瀏覽器記憶體運算，不會發送任何網路請求，也不會將任何輸入或產出的卡號寫入 localStorage、Cookie 或伺服器日誌。

不過出於良好資安習慣，我們仍強烈建議切勿在任何線上網頁輸入您本人或他人的真實信用卡資訊，驗證器請僅用於測試卡號與演算法教學。`,
      },
      {
        q: '【免責聲明】使用測試信用卡號產生器的合法範圍與注意事項',
        a: `【重要免責聲明】

① 本工具產生的所有卡號、效期與安全碼皆為隨機數學測試資料，並非實際發行或可供交易使用的信用卡。

② 本工具僅供軟體工程師、QA 測試人員與學習者進行表單驗證、Luhn 演算法研究與金流測試環境開發使用。

③ 嚴禁嘗試將產出號碼用於任何未經授權的真實交易、系統濫用或違法行為。使用者須自行承擔操作責任，本站與作者不負任何法律責任或損失賠償。`,
      },
    ],
  },
  en: {
    title: 'Test Credit Card Generator',
    subtitle: 'TEST CREDIT CARD GENERATOR & LUHN VALIDATOR',
    description:
      'Pure client-side random test credit card generator and Luhn algorithm validator. Multi-select Visa, Mastercard, JCB, Amex, UnionPay, and Discover, customize BIN prefixes, and export batches. All numbers are randomly generated for QA/dev testing only — not real working cards.',
    tabGenerate: 'Card Generator',
    tabValidate: 'Luhn Validator',
    disclaimerTitle: 'Important: Randomly Generated Test Numbers Only — Not Real Working Cards',
    disclaimerBody:
      'Numbers here are randomly computed locally in your browser using the public ISO/IEC 7812 Luhn formula and network prefixes. They are not linked to any bank account, carry zero funds, and cannot be used for real purchases or billing. Strictly for QA, form validation, and sandbox testing.',
    heroNotRealNote: 'Random Luhn test number only — no real bank account or balance, cannot be used for real payments',
    sectionOptions: 'Generator Options',
    labelNetworks: 'Card Networks (Multi-select)',
    networksAllRandom: 'All Random',
    networksSelectedCount: '{count} selected',
    networksClearBtn: 'Reset to Random',
    networksHint: 'Leave unselected to pick randomly from all 6 networks. Entering a custom BIN takes priority.',
    labelCustomBin: 'Custom BIN Prefix (Optional, up to 12 digits)',
    customBinPlaceholder: 'e.g. 424242 or 555555',
    customBinHint: 'Leave blank to use standard public prefixes for the selected networks.',
    labelBatchCount: 'Quantity',
    labelDisplayOptions: 'Display & Export Options',
    optIncludeSpaces: 'Format card number with spaces (e.g. 4242 4242 ...)',
    optIncludeMeta: 'Include mock expiry date & CVV (for test form input only)',
    btnGenerate: 'Generate Now',
    btnRegenerate: 'Regenerate',
    btnCopy: 'Copy',
    btnCopied: 'Copied',
    btnCopyAll: 'Copy All',
    btnExportTxt: 'Export TXT',
    btnExportCsv: 'Export CSV',
    btnExportJson: 'Export JSON',
    sectionResult: 'Random Test Card Results',
    resultBadgeCount: '{count} items',
    colIndex: '#',
    colNumber: 'Random Test Card',
    colNetwork: 'Network',
    colExpiry: 'Mock Expiry',
    colCvv: 'Mock CVV',
    colAction: 'Action',
    metaExpiryLabel: 'Mock Expiry',
    metaCvvLabel: 'Mock CVV',
    inspectBreakdown: 'Inspect',
    breakdownTitle: 'Luhn Algorithm (Mod 10) Breakdown',
    breakdownFormulaPrefix: 'Luhn Total Sum',
    breakdownRemainderValid: 'Divisible by 10 (remainder 0) — valid Luhn format',
    breakdownRemainderInvalid: 'Remainder {remainder} mod 10 (expected check digit: {expected})',
    breakdownDoubledTag: '×2',
    breakdownKeepTag: '×1',
    historyTitle: 'Session History',
    historyClear: 'Clear History',
    validatorInputLabel: 'Enter one or more card numbers (one per line or comma-separated; spaces/hyphens ignored)',
    validatorInputPlaceholder: 'Example:\n4242 4242 4242 4242\n3782 822463 10005\n5555-5555-5555-4444',
    validatorSampleBtn: 'Load Samples',
    validatorClearBtn: 'Clear',
    validatorEmptyHint:
      'Enter any 13–19 digit card number above to validate its Luhn checksum and detect the issuing network. Everything runs strictly in browser memory.',
    validatorSummaryValid: '{count} Valid',
    validatorSummaryInvalid: '{count} Invalid',
    statusValid: 'Valid Format',
    statusInvalid: 'Invalid',
    errEmpty: 'Input is empty',
    errNonNumeric: 'Only digits, spaces, and hyphens are allowed',
    errLength: 'Card length must be between 13 and 19 digits',
    errChecksum: 'Invalid Luhn check digit (expected {expected})',
    sandboxTitle: 'Official Payment Gateway Sandbox Test Cards',
    sandboxSubtitle: 'Expand to copy public sandbox test cards for Stripe and common payment gateways',
    sandboxProviderCol: 'Provider',
    sandboxScenarioCol: 'Test Scenario',
    sandboxNumberCol: 'Public Test Number',
    sandboxActionCol: 'Action',
    toastCopied: 'Copied {value}',
    toastCopiedAll: 'Copied all {count} test numbers',
    toastExported: 'Downloaded {filename}',
    toastCopyFailed: 'Clipboard access failed. Please copy manually.',
    faqTitle: 'FAQ & Luhn Algorithm Guide',
    faqSubtitle: 'Why random test cards cannot make real payments and how Luhn validation works',
    faqItems: [
      {
        q: 'Can these randomly generated credit card numbers be used for real purchases or free trials?',
        a: `No, never. Every card number, mock expiry date, and mock CVV generated here is purely random mathematical test data — not a real working credit card.

Real payment authorization requires live verification with the card network and issuing bank against an active account, real expiration date, security code, and available credit limit. Random Luhn numbers have no backing account or funds and will always be declined by real merchants.`,
      },
      {
        q: 'What is the Luhn algorithm (Mod 10) and how does it check card numbers?',
        a: `The Luhn algorithm (ISO/IEC 7812 Mod 10 checksum) is designed to catch accidental typing errors when entering card numbers:

1. Starting from the rightmost check digit and moving left, double every second digit (2nd, 4th, 6th, etc. from the right).

2. If doubling a digit produces a number greater than 9 (e.g. 7 × 2 = 14), subtract 9 (equivalent to summing its digits: 1 + 4 = 5).

3. Sum all resulting digits. The card number passes format validation if and only if the total sum is divisible by 10.`,
      },
      {
        q: 'How do BIN prefixes and lengths differ across major card networks?',
        a: `The leading 1 to 6 digits (BIN/IIN) identify the card network and issuer:

1. Visa: Starts with 4, 16 digits, 3-digit CVV.

2. Mastercard: Starts with 51–55 or 2221–2720, 16 digits, 3-digit CVC.

3. JCB: Starts with 3528–3589, 16 digits, 3-digit CVV.

4. American Express: Starts with 34 or 37, 15 digits (4-6-5 grouping), 4-digit CID.

5. UnionPay: Starts with 62, typically 16 digits, 3-digit CVV.

6. Discover: Starts with 6011, 644–649, or 65, 16 digits, 3-digit CVV.`,
      },
      {
        q: 'Why do developers and QA engineers use a test credit card generator?',
        a: `When building checkout flows, payment forms, or gateway integrations, developers need valid-format dummy data to test auto-spacing, network icon detection, Luhn error handling, field length constraints, and automated E2E suites.

Using random client-side test numbers avoids putting real personal card numbers into staging environments or test scripts.`,
      },
      {
        q: 'Is it safe to paste card numbers into the validator? Is anything uploaded?',
        a: `All validation and generation run 100% locally in your browser memory with zero network requests, no localStorage persistence, and no server logs.

Even so, as a security best practice, never enter your real personal credit card details on any third-party website. Use the validator strictly with test numbers and educational samples.`,
      },
      {
        q: '[Disclaimer] Acceptable use and legal notice for test card numbers',
        a: `[Important Disclaimer]

1. All numbers, expiry dates, and CVV values generated by this tool are random synthetic test data — not real issued cards and not usable for real transactions.

2. This tool is strictly intended for software development, QA form validation, Luhn algorithm study, and payment sandbox integration.

3. Never attempt to use generated values for unauthorized transactions, fraud, or any unlawful purpose. Users bear full responsibility for how outputs are used.`,
      },
    ],
  },
};

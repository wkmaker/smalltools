'use client';

import { useState, useRef, useCallback, useEffect, useId, useMemo } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './har-cleaner.module.css';

// SVG 向量圖示元件
const ShieldIcon = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
  </svg>
);

const UploadIcon = () => (
  <svg viewBox="0 0 24 24" width={32} height={32} fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
  </svg>
);

const DownloadIcon = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
  </svg>
);

const CheckIcon = () => (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
    <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
    <path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const PlayIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EyeOffIcon = () => (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
    <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
  </svg>
);

const ListCheckIcon = () => (
  <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
    <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
  </svg>
);

// 輔助函式：將字串或物件安全格式化為漂亮 JSON (兩邊排版對齊)
function formatPayload(raw: any): string {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'object') {
    try {
      return JSON.stringify(raw, null, 2);
    } catch {
      return String(raw);
    }
  }
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return raw;
    }
  }
  return String(raw);
}

// 輔助函式：將脫敏關鍵字以醒目黃色標記高亮顯示
function renderHighlightedCode(code: string, highlightText: string) {
  if (!code) return null;
  if (!highlightText || !code.includes(highlightText)) {
    return code;
  }

  const parts = code.split(highlightText);
  return parts.flatMap((part, idx) =>
    idx < parts.length - 1
      ? [part, <mark key={idx} className={styles.highlightRedacted}>{highlightText}</mark>]
      : [part]
  );
}

// 輔助函式：根據 HTTP Method 提供對應的高奢彩色膠囊樣式
function getMethodBadgeClass(method: string | undefined): string {
  const m = (method || '').toUpperCase();
  switch (m) {
    case 'GET':
      return styles.methodBadgeGet;
    case 'POST':
      return styles.methodBadgePost;
    case 'PUT':
      return styles.methodBadgePut;
    case 'DELETE':
      return styles.methodBadgeDelete;
    case 'PATCH':
      return styles.methodBadgePatch;
    default:
      return styles.methodBadgeOther;
  }
}

// 雙語翻譯字典 (100% 完整覆蓋)
const TRANSLATIONS = {
  'zh-TW': {
    title: 'HAR 敏感資料清理工具',
    subtitle: 'HAR SANITIZER & PRIVACY CLEANER',
    description:
      '專業純前端 HAR 封包脫敏與瘦身神器！一鍵清除 Cookie、授權 Token、JWT、API 密鑰與敏感個資，並可自動刪除肥大二進位媒體酬載，100% 本機運算守護資安。',
    langToggleUrl: '/har-cleaner/en/',
    langToggleLabel: 'English',
    dropzoneTitle: '拖曳 HAR 檔案至此處，或點擊選擇檔案',
    dropzoneHint: '支援所有標準 HTTP Archive (.har, .json) 檔案，純本機記憶體處理不外傳',
    loadSampleBtn: '載入示範 HAR 封包',
    clearBtn: '清空重置',
    rulesTitle: '脫敏與清理全域規則配置',
    ruleAuthHeaders: '身分認證標頭 (Authorization, Bearer, Basic, X-Api-Key 等)',
    ruleCookies: 'Cookie 與 Session 憑證 (Cookie, Set-Cookie 及 Cookies 陣列)',
    ruleQueryParams: '網址敏感參數 (token, secret, key, password, code 等)',
    rulePostData: 'POST 表單與 JSON Payload 機密欄位 (密碼, 憑據等)',
    ruleCreditCard: '信用卡與支付機密 (卡號、CVV、有效期限與 PCI-DSS 支付欄位)',
    ruleRegexDeep: '正則深度掃描 (JWT Token, AWS Key, Stripe Key, Private Key, Email)',
    ruleStripMedia: '大檔媒體瘦身 (清除圖片/影音/字體 Base64，大幅縮減檔案體積)',
    ruleStripTrackers: '過濾第三方追蹤請求 (Google Analytics, Facebook Pixel, Sentry 等)',
    customKeywordsLabel: '自訂敏感欄位名稱 (逗號或換行分隔)',
    customKeywordsPlaceholder: '例如：client_id, internal_secret, user_ssn, phone_number',
    redactionTextLabel: '脫敏替換文字',
    // 敏感標頭控制區
    headersSectionTitle: '不重複敏感標頭審核與消除控制',
    headersSectionSubtitle: '系統已自動彙整所有命中的敏感標頭，您可以個別決定是否要執行脫敏消除，或取消勾選以保留特定標頭進行除錯。',
    headersColRedact: '脫敏消除',
    headersColName: '標頭名稱 (Header Name)',
    headersColScope: '類型 (Scope)',
    headersColRule: '命中規則 (Matched Rule)',
    headersColCount: '出現次數',
    headersColSample: '範例數值預覽',
    headersSelectAll: '全部脫敏消除',
    headersDeselectAll: '全部保留不消除',
    headersNoSensitiveFound: '封包中未發現任何符合規則的敏感標頭',
    scopeReq: 'Request 請求',
    scopeRes: 'Response 回應',
    scopeBoth: '雙向 (Req & Res)',
    statsTotalRequests: '總請求數',
    statsSanitizedRequests: '已脫敏請求',
    statsRedactedItems: '脫敏項目累計',
    statsSizeChange: '檔案體積變化',
    statsSavings: '容量縮減節省',
    tabSummary: '摘要與脫敏統計',
    tabInspector: '請求詳細檢視器',
    tabRawJson: '乾淨 HAR JSON',
    searchPlaceholder: '搜尋 URL 網址、網域或方法...',
    filterAll: '全部',
    filterSanitizedOnly: '僅顯示已脫敏項目',
    ruleFilterAll: '命中規則: 全部',
    ruleFilterAuth: '身分認證標頭',
    ruleFilterCookies: 'Cookie 與 Session 憑證',
    ruleFilterQuery: '網址 Query 參數',
    ruleFilterPost: 'POST / JSON 機密欄位',
    ruleFilterCard: '信用卡與支付機密 (PCI-DSS)',
    ruleFilterCustom: '自訂敏感欄位',
    ruleFilterRegex: '正則深度掃描',
    ruleFilterMedia: '肥大媒體酬載清理',
    ruleFilterClean: '未脫敏乾淨項目 (Clean)',
    colMethod: '方法',
    colStatus: '狀態',
    colUrl: '請求 URL',
    colTime: '耗時',
    colSanitized: '脫敏標記',
    noMatchingEntries: '沒有符合篩選條件的請求紀錄',
    modalTitle: '請求封包詳細審核與脫敏對照',
    modalTabOverview: '概覽與摘要',
    modalTabRequest: '請求內容 (Request)',
    modalTabResponse: '回應內容 (Response)',
    modalTabRaw: '原始 JSON 對照',
    modalClose: '關閉',
    modalCopyEntryJson: '複製本請求 JSON',
    modalCopyUrl: '複製網址',
    modalCleanedVersion: '脫敏後版本',
    modalOriginalVersion: '原始版本',
    modalTiming: '連線耗時',
    modalMimeType: '資源類型',
    modalTriggersTitle: '本請求觸發之脫敏項目 (Redactions Triggered)',
    modalNoRedactions: '本請求未包含敏感項目，保持原樣',
    modalReqHeadersTitle: 'Request 請求標頭',
    modalResHeadersTitle: 'Response 回應標頭',
    modalQueryParamsTitle: '網址 Query 參數',
    modalPostDataTitle: 'POST 請求酬載 (Payload)',
    modalResBodyTitle: 'Response 回應內文',
    modalNameCol: '名稱 (Name)',
    modalValueCol: '數值 (Value)',
    modalActionCol: '操作',
    copyBtnText: '複製',
    copiedSingle: '已複製',
    breakdownCustomKeys: '自訂敏感欄位命中 (Custom Keywords)',
    breakdownCreditCards: '信用卡與支付機密 (PCI-DSS)',
    noHeaders: '無標頭資料',
    noParams: '無網址參數',
    noBody: '無內文資料',
    downloadBtn: '下載清理後 HAR',
    copyJsonBtn: '複製乾淨 JSON',
    copiedToast: '已複製乾淨 HAR JSON 至剪貼簿！',
    exportReportBtn: '匯出脫敏稽核報告',
    faqTitle: '常見問題 (FAQ)',
    faqSubtitle: '深入了解 HAR 檔案架構、脫敏原理與資安最佳實踐',
    faqItems: [
      {
        q: '什麼是 HAR (HTTP Archive) 檔案？為什麼直接分享會有資安風險？',
        a: 'HAR (HTTP Archive) 是一種基於 JSON 的標準格式，用於記錄瀏覽器或客戶端與伺服器之間的所有 HTTP/HTTPS 請求與回應細節：\n\n① 涵蓋高度敏感憑據：\nHAR 檔案會忠實記錄請求發送時的 `Authorization` 標頭 (如 Bearer JWT、Basic Auth)、`Cookie` / `Set-Cookie` (含有使用者的登入 Session ID、購物車與身分識別碼)。\n\n② 容易遭到帳號劫持 (Account Takeover)：\n若未經脫敏即將 HAR 檔上傳至公開 Jira、GitHub Issue 或直接傳送給第三方廠商，攻擊者可藉由 HAR 內的 Cookie 或 Token 直接重放請求 (Replay Attack)，無需密碼即可劫持您的真實帳號。',
      },
      {
        q: '本工具是如何進行脫敏與清理的？我的封包資料會被上傳到伺服器嗎？',
        a: '100% 絕對安全！本工具採用純前端 (Client-Side) 零伺服器架構：\n\n① 記憶體內本機即時處理：\n所有 HAR 解析、正則表達式掃描、JSON 遞迴脫敏與檔案生成皆完全在您的瀏覽器 JavaScript 執行環境中完成。\n\n② 零雲端留存：\n封包內容絕不會透過網路發送到任何後端伺服器或第三方分析平台，即使拔掉網路線（離線狀態）也能順暢使用。',
      },
      {
        q: '什麼是「大檔媒體瘦身 (Media Stripping)」？開啟後有何好處？',
        a: '「大檔媒體瘦身」是本工具極具實用價值的特色功能：\n\n① 解決 HAR 檔案動輒數十 MB 的痛點：\n瀏覽器在錄製 HAR 時，會將所有圖片 (PNG, JPEG, WebP)、字型 (WOFF2)、影片及二進位檔案以 Base64 形式編碼寫入 Response Body，導致檔案體積迅速膨脹至 30MB~100MB。\n\n② 保留關鍵排錯資訊同時大幅減重：\n開啟此選項後，系統會清除這類二進位 Base64 酬載，但完整保留 HTTP 狀態碼 (如 200, 404, 500)、連線時間軸、請求與回應 Headers 以及 JSON API 數據，瞬間將檔案壓縮 90% 以上 (<1MB)，便於郵件寄送與客服上傳。',
      },
      {
        q: '工具支援脫敏哪些敏感欄位與模式？',
        a: '系統內建多層級的智慧偵測引擎：\n\n① 身分認證與標頭：\n自動脫敏 `Authorization`, `Proxy-Authorization`, `X-Api-Key`, `X-Auth-Token`, `Bearer`, `Cookie`, `Set-Cookie` 等。\n\n② 網址與表單機密 Key：\n自動攔截 `token`, `access_token`, `auth`, `api_key`, `secret`, `password`, `code`, `session_id`, `refresh_token` 等。\n\n③ 深度正則掃描 (Deep Regex)：\n自動識別並脫敏 JWT 簽章字串 (`eyJ...`)、AWS Access Key (`AKIA...`)、Stripe 密鑰 (`sk_live_...`)、電子郵件地址與 RSA/OpenSSH 私鑰。',
      },
      {
        q: '清理過後的 HAR 檔案能否重新載入到 Chrome DevTools 或 Postman 中？',
        a: '完全相容！本工具嚴格遵循 W3C HAR 1.2 規格：\n\n① 保持標準 JSON 結構：\n脫敏程序僅替換敏感字串內容（如將值替換為 `[REDACTED]`），絕不破壞 JSON 語法、陣列結構或時間戳記欄位。\n\n② 跨工具完美載入：\n匯出的 `.har` 檔案可直接重新拖曳回 Google Chrome DevTools Network 面板、Charles Proxy、Wireshark、Postman、Fiddler 或 Datadog 中正常檢視與分析。',
      },
      {
        q: '如果我有系統專屬的自訂敏感欄位（如 `customer_ssn`），該如何處理？',
        a: '您可以透過「自訂敏感欄位」功能靈活擴充：\n\n① 自訂關鍵字清單：\n在輸入框中填寫欄位名稱（以逗號或換行分隔），如 `customer_ssn, internal_org_id, pay_secret`。\n\n② 全域自動匹配：\n系統會在 Request Headers、Query 參數、POST Form 表單以及遞迴 JSON Body 中同步比對並自動脫敏該欄位。',
      },
      {
        q: '什麼是「第三方追蹤請求過濾 (Tracker Filter)」？',
        a: '過濾無效噪音請求：\n\n① 排除干擾分析的追蹤代碼：\n在錄製網站操作時，通常會伴隨大量的 Google Analytics, Facebook Pixel, Hotjar, Sentry, Datadog 等遙測封包。\n\n② 提升除錯專注度：\n開啟此功能後，系統可自動剔除這些第三方追蹤請求，讓 HAR 檔案只專注於您要排查的核心業務 API 與系統連線。',
      },
      {
        q: '如何快速驗證本工具的效果？',
        a: '一鍵體驗示範封包：\n\n① 點擊「載入示範 HAR 封包」：\n系統會載入包含真實常見情境（含 Bearer JWT、登入 Cookie、敏感 Query 參數、JSON 密碼與肥大圖片酬載）的測試 HAR。\n\n② 立即檢視對照：\n您可以切換規則開關、檢視請求詳細面板，並觀察檔案大小與脫敏前後的差異高亮。',
      },
    ],
  },
  en: {
    title: 'HAR Sensitive Data Sanitizer',
    subtitle: 'HAR SANITIZER & PRIVACY CLEANER',
    description:
      'Professional client-side HAR privacy scrubber and file size slimmer! Redact cookies, auth tokens, JWTs, API keys, and sensitive payloads with zero server transmission. 100% in-browser security.',
    langToggleUrl: '/har-cleaner/',
    langToggleLabel: '繁體中文',
    dropzoneTitle: 'Drag and drop a HAR file here, or click to browse',
    dropzoneHint: 'Supports all standard HTTP Archive (.har, .json) files. 100% processed in local browser memory.',
    loadSampleBtn: 'Load Sample HAR File',
    clearBtn: 'Clear & Reset',
    rulesTitle: 'Sanitization & Cleaning Configuration',
    ruleAuthHeaders: 'Auth Headers (Authorization, Bearer, Basic, X-Api-Key, etc.)',
    ruleCookies: 'Cookies & Session IDs (Cookie, Set-Cookie headers and cookie arrays)',
    ruleQueryParams: 'Sensitive Query Params (token, secret, key, password, code, etc.)',
    rulePostData: 'POST & JSON Payloads (password, credentials, etc.)',
    ruleCreditCard: 'Credit Cards & Payment Data (Card No, CVV, Expiry, PCI-DSS)',
    ruleRegexDeep: 'Deep Regex Scanning (JWT Tokens, AWS Keys, Stripe Keys, Private Keys, Emails)',
    ruleStripMedia: 'Strip Heavy Media Payloads (Removes Base64 images/videos to shrink file size)',
    ruleStripTrackers: 'Filter 3rd-Party Trackers (Google Analytics, Facebook Pixel, Sentry, etc.)',
    customKeywordsLabel: 'Custom Sensitive Field Keys (comma or newline separated)',
    customKeywordsPlaceholder: 'e.g. client_id, internal_secret, user_ssn, phone_number',
    redactionTextLabel: 'Redaction Replacement Text',
    // Unique Headers Section
    headersSectionTitle: 'Unique Sensitive Headers Audit & Control',
    headersSectionSubtitle: 'Review all unique sensitive headers detected across requests. Toggle individual headers to sanitize or preserve intact for troubleshooting.',
    headersColRedact: 'Redact',
    headersColName: 'Header Name',
    headersColScope: 'Scope',
    headersColRule: 'Matched Rule',
    headersColCount: 'Count',
    headersColSample: 'Sample Value',
    headersSelectAll: 'Redact All',
    headersDeselectAll: 'Keep All (No Redact)',
    headersNoSensitiveFound: 'No sensitive headers matching the active rules were found in this archive.',
    scopeReq: 'Request',
    scopeRes: 'Response',
    scopeBoth: 'Both (Req & Res)',
    statsTotalRequests: 'Total Requests',
    statsSanitizedRequests: 'Sanitized Requests',
    statsRedactedItems: 'Redacted Items',
    statsSizeChange: 'File Size Change',
    statsSavings: 'Size Reduction',
    tabSummary: 'Overview & Stats',
    tabInspector: 'Entries Inspector',
    tabRawJson: 'Clean HAR JSON',
    searchPlaceholder: 'Search URL, domain, or method...',
    filterAll: 'All',
    filterSanitizedOnly: 'Sanitized Entries Only',
    ruleFilterAll: 'Rule: All Categories',
    ruleFilterAuth: 'Auth Headers',
    ruleFilterCookies: 'Cookies & Session',
    ruleFilterQuery: 'Query Parameters',
    ruleFilterPost: 'POST / JSON Payloads',
    ruleFilterCard: 'Credit Cards & Payment (PCI-DSS)',
    ruleFilterCustom: 'Custom Keywords',
    ruleFilterRegex: 'Deep Regex Matching',
    ruleFilterMedia: 'Media Stripped',
    ruleFilterClean: 'Unsanitized / Clean',
    colMethod: 'Method',
    colStatus: 'Status',
    colUrl: 'Request URL',
    colTime: 'Time',
    colSanitized: 'Sanitized',
    noMatchingEntries: 'No request entries match the current filter criteria.',
    modalTitle: 'Entry Details Audit & Redaction Inspector',
    modalTabOverview: 'Overview & Diff',
    modalTabRequest: 'Request Content',
    modalTabResponse: 'Response Content',
    modalTabRaw: 'Raw JSON Diff',
    modalClose: 'Close',
    modalCopyEntryJson: 'Copy Entry JSON',
    modalCopyUrl: 'Copy URL',
    modalCleanedVersion: 'Cleaned Version',
    modalOriginalVersion: 'Original Version',
    modalTiming: 'Timing',
    modalMimeType: 'Content Type',
    modalTriggersTitle: 'Redaction Triggers Detected',
    modalNoRedactions: 'No sensitive data detected in this entry. Kept intact.',
    modalReqHeadersTitle: 'Request Headers',
    modalResHeadersTitle: 'Response Headers',
    modalQueryParamsTitle: 'Query Parameters',
    modalPostDataTitle: 'POST Body / Payload',
    modalResBodyTitle: 'Response Body',
    modalNameCol: 'Name',
    modalValueCol: 'Value',
    modalActionCol: 'Action',
    copyBtnText: 'Copy',
    copiedSingle: 'Copied',
    breakdownCustomKeys: 'Custom Sensitive Field Hits',
    breakdownCreditCards: 'Credit Cards & Payment Hits (PCI-DSS)',
    noHeaders: 'No headers found',
    noParams: 'No query parameters',
    noBody: 'No body content',
    downloadBtn: 'Download Cleaned HAR',
    copyJsonBtn: 'Copy Clean JSON',
    copiedToast: 'Cleaned HAR JSON copied to clipboard!',
    exportReportBtn: 'Export Audit Report',
    faqTitle: 'Frequently Asked Questions (FAQ)',
    faqSubtitle: 'Learn more about HAR structure, privacy redaction, and security best practices',
    faqItems: [
      {
        q: 'What is a HAR (HTTP Archive) file, and why is sharing it risky?',
        a: 'A HAR (HTTP Archive) file is a standard JSON-formatted log containing comprehensive records of HTTP/HTTPS communications between a browser and servers:\n\n① Contains Highly Sensitive Credentials:\nHAR files faithfully record `Authorization` headers (Bearer tokens, Basic auth), session `Cookie` / `Set-Cookie` identifiers, API keys, and request/response payloads.\n\n② Account Takeover Risk:\nIf an un-sanitized HAR is shared with support desks, posted on GitHub, or shared with vendors, attackers can extract session cookies or tokens to replay requests and hijack active user sessions without credentials.',
      },
      {
        q: 'How does this tool sanitize HAR files? Is my data uploaded anywhere?',
        a: '100% Private & Safe! This tool operates entirely on a Zero-Server client-side architecture:\n\n① In-Memory Local Processing:\nAll JSON parsing, regex pattern matching, field scrubbing, and file generation execute strictly inside your local browser memory.\n\n② Zero Network Transmission:\nYour archive contents are never transmitted to any remote servers, cloud endpoints, or third-party telemetry services. It works seamlessly even when offline.',
      },
      {
        q: 'What is "Media Stripping" and how does it reduce file size?',
        a: 'Media Stripping is a powerful feature designed to tackle bloated HAR archives:\n\n① Solves Huge File Sizes:\nWhen recording web sessions, browsers serialize images (PNG, JPEG, WebP), fonts (WOFF2), and binary assets into massive Base64 strings inside Response Bodies, inflating files to 30MB-100MB+.\n\n② Retains Critical Diagnostics while Slashing File Size:\nEnabling this option strips heavy Base64 media data while perfectly preserving HTTP status codes, network timing, request/response headers, and JSON API payloads—typically shrinking the file by over 90% (<1MB).',
      },
      {
        q: 'Which sensitive patterns and fields are automatically sanitized?',
        a: 'The engine features multi-tier automated detection:\n\n① Authentication & Headers:\nRedacts `Authorization`, `Proxy-Authorization`, `X-Api-Key`, `X-Auth-Token`, `Bearer`, `Cookie`, `Set-Cookie`, and session identifiers.\n\n② URL & Form Keys:\nIntercepts `token`, `access_token`, `auth`, `api_key`, `secret`, `password`, `code`, `session_id`, and `refresh_token`.\n\n③ Deep Regex Detection:\nDetects and masks JWT signatures (`eyJ...`), AWS Access Keys (`AKIA...`), Stripe keys (`sk_live_...`), emails, and RSA/OpenSSH private keys.',
      },
      {
        q: 'Can the cleaned HAR file be re-imported into Chrome DevTools or Postman?',
        a: 'Fully Compatible! The tool strictly adheres to the W3C HAR 1.2 specification:\n\n① Preserves JSON Integrity:\nSanitization modifies sensitive string values (e.g. replacing them with `[REDACTED]`) without altering object hierarchies, timestamps, or required structure.\n\n② Seamless Multi-Tool Support:\nExported `.har` files can be immediately dragged back into Chrome DevTools Network tab, Charles Proxy, Wireshark, Postman, Fiddler, or Datadog for continued troubleshooting.',
      },
      {
        q: 'How can I add custom sensitive fields specific to my company or app?',
        a: 'You can easily configure custom rules:\n\n① Custom Keywords List:\nEnter field names (comma or newline separated) such as `customer_ssn, internal_org_id, pay_secret`.\n\n② Global Automatic Matching:\nThe scrubber will automatically redact these keys across Request Headers, Query parameters, POST form bodies, and nested JSON objects.',
      },
      {
        q: 'What does the "Tracker Filter" option do?',
        a: 'Eliminates telemetry noise:\n\n① Removes Third-Party Analytics Requests:\nRecorded browser sessions often contain dozens of tracking beacons from Google Analytics, Facebook Pixel, Hotjar, Sentry, Datadog, etc.\n\n② Focuses on Core APIs:\nEnabling this filter purges these irrelevant telemetry requests so you can focus purely on your application\'s primary endpoints.',
      },
      {
        q: 'How can I quickly try out and test this tool?',
        a: 'One-Click Sample Experience:\n\n① Click "Load Sample HAR File":\nThe tool will immediately load a realistic sample HAR containing JWTs, auth cookies, sensitive query params, and image payloads.\n\n② Real-time Inspection:\nToggle cleaning rules, view entry diffs, and observe instant file size reduction and sanitization statistics.',
      },
    ],
  },
};

// 示範用 Sample HAR 資料產生器
function generateSampleHar(): any {
  return {
    log: {
      version: '1.2',
      creator: { name: 'Smalltools HAR Generator', version: '1.0' },
      entries: [
        {
          startedDateTime: '2026-08-22T10:00:00.123Z',
          time: 85,
          request: {
            method: 'POST',
            url: 'https://api.example.com/v1/auth/login?client_id=demo_app&redirect_token=sec_tok_987654321',
            httpVersion: 'HTTP/2.0',
            cookies: [
              { name: 'session_id', value: 'sess_live_98a76b54c3210' },
              { name: 'user_pref', value: 'dark_mode' },
            ],
            headers: [
              { name: 'Host', value: 'api.example.com' },
              { name: 'User-Agent', value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
              { name: 'Authorization', value: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiYWRtaW4iOnRydWV9.TJVA95OrM7E2cBab30RMHrHDcEfxjoYZgeFONFh7HgQ' },
              { name: 'X-Api-Key', value: 'test_mock_apikey_9876543210abcdef' },
              { name: 'Cookie', value: 'session_id=sess_live_98a76b54c3210; token=secret_cookie_token_999; theme=dark' },
              { name: 'Content-Type', value: 'application/json' },
            ],
            queryString: [
              { name: 'client_id', value: 'demo_app' },
              { name: 'redirect_token', value: 'sec_tok_987654321' },
            ],
            postData: {
              mimeType: 'application/json',
              text: JSON.stringify({
                username: 'admin@example.com',
                password: 'SuperSecretP@ssw0rd!2026',
                credit_card: '4532-1234-5678-9012',
                aws_access_key: 'AKIAIOSFODNN7EXAMPLE',
              }, null, 2),
            },
          },
          response: {
            status: 200,
            statusText: 'OK',
            httpVersion: 'HTTP/2.0',
            cookies: [
              { name: 'session_id', value: 'sess_live_new_updated_token_999' },
            ],
            headers: [
              { name: 'Content-Type', value: 'application/json; charset=utf-8' },
              { name: 'Set-Cookie', value: 'session_id=sess_live_new_updated_token_999; Path=/; HttpOnly; Secure' },
            ],
            content: {
              size: 256,
              mimeType: 'application/json',
              text: JSON.stringify({
                status: 'success',
                accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c3JfOTA5MCIsImV4cCI6MTgwMDAwMDAwMH0.K7kK7mQ6lE23fG9h7j2k1L8',
                user: {
                  email: 'admin@example.com',
                  name: 'System Administrator',
                  internal_secret: 'confidential_server_key_888',
                },
              }, null, 2),
            },
          },
        },
        {
          startedDateTime: '2026-08-22T10:00:01.000Z',
          time: 145,
          request: {
            method: 'GET',
            url: 'https://cdn.example.com/assets/hero-banner.png?auth_token=tok_image_secret_123',
            httpVersion: 'HTTP/2.0',
            cookies: [],
            headers: [
              { name: 'Host', value: 'cdn.example.com' },
              { name: 'Accept', value: 'image/png' },
            ],
            queryString: [
              { name: 'auth_token', value: 'tok_image_secret_123' },
            ],
          },
          response: {
            status: 200,
            statusText: 'OK',
            httpVersion: 'HTTP/2.0',
            cookies: [],
            headers: [
              { name: 'Content-Type', value: 'image/png' },
              { name: 'Content-Length', value: '450000' },
            ],
            content: {
              size: 450000,
              mimeType: 'image/png',
              encoding: 'base64',
              text: 'iVBORw0KGgoAAAANSUhEUgAABAAAAAMACAYAAACW0wt...[Extremely Large Base64 Image Payload 450KB]...AAAABJRU5ErkJggg==',
            },
          },
        },
        {
          startedDateTime: '2026-08-22T10:00:02.500Z',
          time: 42,
          request: {
            method: 'POST',
            url: 'https://www.google-analytics.com/g/collect?v=2&tid=G-XXXXX&cid=12345.67890',
            httpVersion: 'HTTP/2.0',
            cookies: [],
            headers: [
              { name: 'Host', value: 'www.google-analytics.com' },
            ],
            queryString: [
              { name: 'v', value: '2' },
              { name: 'tid', value: 'G-XXXXX' },
            ],
          },
          response: {
            status: 204,
            statusText: 'No Content',
            httpVersion: 'HTTP/2.0',
            cookies: [],
            headers: [],
            content: { size: 0, mimeType: 'text/plain' },
          },
        },
      ],
    },
  };
}

interface SanitizeRules {
  authHeaders: boolean;
  cookies: boolean;
  queryParams: boolean;
  postData: boolean;
  creditCard: boolean;
  regexDeep: boolean;
  stripMedia: boolean;
  stripTrackers: boolean;
  customKeywords: string;
  redactionText: string;
}

interface SanitizedStats {
  totalRequests: number;
  sanitizedRequests: number;
  redactedHeaders: number;
  redactedCookies: number;
  redactedQueryParams: number;
  redactedBodies: number;
  redactedRegexItems: number;
  redactedCustomKeywords: number;
  redactedCreditCards: number;
  strippedMediaItems: number;
  strippedTrackers: number;
  originalSizeBytes: number;
  cleanedSizeBytes: number;
}

export interface DetectedHeaderItem {
  name: string;
  normalizedName: string;
  scope: 'request' | 'response' | 'both';
  count: number;
  matchedRule: string;
  sampleValue: string;
}

export default function HarCleanerClient({ lang = 'zh-TW' }: { lang?: 'zh-TW' | 'en' }) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  // IDs for accessibility
  const customKeywordsId = useId();
  const redactionTextId = useId();
  const searchInputId = useId();
  const fileInputId = useId();

  // Theme Registration
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#06b6d4');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(6, 182, 212, 0.6)');
  }, []);

  // State
  const [rawHarData, setRawHarData] = useState<any | null>(null);
  const [originalFileSize, setOriginalFileSize] = useState<number>(0);
  const [fileName, setFileName] = useState<string>('session.har');
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'summary' | 'inspector' | 'raw'>('summary');
  const [selectedEntryIndex, setSelectedEntryIndex] = useState<number | null>(null);
  const [modalTab, setModalTab] = useState<'overview' | 'request' | 'response' | 'raw'>('overview');
  const [modalRawMode, setModalRawMode] = useState<'cleaned' | 'original'>('cleaned');
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // 原始值 vs 脫敏值 即時對照眼睛狀態
  const [showOriginalMap, setShowOriginalMap] = useState<Record<string, boolean>>({});
  const [postBodyMode, setPostBodyMode] = useState<'cleaned' | 'original' | 'split'>('cleaned');
  const [resBodyMode, setResBodyMode] = useState<'cleaned' | 'original' | 'split'>('cleaned');

  const toggleShowOriginal = (key: string) => {
    setShowOriginalMap((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState<string>('ALL');
  const [sanitizedOnly, setSanitizedOnly] = useState<boolean>(false);

  // Rules Configuration
  const [rules, setRules] = useState<SanitizeRules>({
    authHeaders: true,
    cookies: true,
    queryParams: true,
    postData: true,
    creditCard: true,
    regexDeep: true,
    stripMedia: true,
    stripTrackers: true,
    customKeywords: '',
    redactionText: '[REDACTED]',
  });

  // 個別不消除的標頭黑名單 (Key is normalized header name, true = DO NOT REDACT)
  const [excludedHeaders, setExcludedHeaders] = useState<Record<string, boolean>>({});

  // 監聽鍵盤 ESC 鍵關閉 Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && selectedEntryIndex !== null) {
        setSelectedEntryIndex(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEntryIndex]);

  // 複製單一文字小工具
  const copyText = (text: string, fieldId: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldId);
    setTimeout(() => setCopiedField(null), 1800);
  };

  // 脫敏/命中字串黃字高亮渲染器
  const renderHighlightedCode = (text: string, customRedactText: string = '[REDACTED]') => {
    if (!text) return null;
    const tokens = [customRedactText, '[MEDIA_BINARY_STRIPPED]', '[REDACTED]'];
    const uniqueTokens = Array.from(new Set(tokens.filter(Boolean)));
    const escaped = uniqueTokens.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|');
    const regex = new RegExp(`(${escaped})`, 'g');
    const parts = text.split(regex);

    return (
      <>
        {parts.map((part, i) => {
          if (uniqueTokens.includes(part)) {
            return (
              <mark key={i} className={styles.redactedYellowHighlight}>
                {part}
              </mark>
            );
          }
          return part;
        })}
      </>
    );
  };

  // 計算一筆請求觸發的不同規則大項總數
  const getEntryRuleCategoriesCount = (reasons: string[]) => {
    if (!reasons || reasons.length === 0) return 0;
    const categories = new Set<string>();
    for (const r of reasons) {
      if (r.includes('Cookie')) {
        categories.add('COOKIES');
      } else if (r.includes('Query')) {
        categories.add('QUERY');
      } else if (r.includes('PCI-DSS') || r.includes('Payment') || r.includes('Card')) {
        categories.add('CREDIT_CARD');
      } else if (r.includes('Custom:')) {
        categories.add('CUSTOM');
      } else if (r.includes('Post') || r.includes('Response JSON') || r.includes('JSON')) {
        categories.add('POST_JSON');
      } else if (r.includes('Media Stripped')) {
        categories.add('MEDIA');
      } else if (r.includes('Tracker')) {
        categories.add('TRACKER');
      } else if (r.includes('Regex')) {
        categories.add('REGEX');
      } else if (r.includes('Header')) {
        categories.add('AUTH_HEADER');
      } else {
        categories.add('GENERAL');
      }
    }
    return categories.size;
  };

  // 將脫敏原因陣列解析聚合為結構化審核清單 (包含來源位置、欄位路徑、命中規則、聚合命中數與處理動作)
  const parseStructuredRedactions = (reasons: string[]) => {
    if (!reasons || reasons.length === 0) return [];

    interface ParsedRedactionGroup {
      scope: string;
      scopeType: 'post_json' | 'response_json' | 'header' | 'cookie' | 'query' | 'media' | 'other';
      fieldPath: string;
      ruleCategory: string;
      action: string;
      hitCount: number;
      samplePath?: string;
    }

    const map = new Map<string, ParsedRedactionGroup>();

    for (const r of reasons) {
      let scope = lang === 'en' ? 'General' : '一般項目';
      let scopeType: ParsedRedactionGroup['scopeType'] = 'other';
      let fieldPath = r;
      let ruleCategory = lang === 'en' ? 'Security Rule' : '安全脫敏規則';
      let action = lang === 'en' ? 'Replaced with [REDACTED]' : '已替換為 [REDACTED]';

      if (r.startsWith('Post JSON')) {
        scope = 'POST JSON';
        scopeType = 'post_json';
        const pathPart = r.replace(/^Post JSON\s*/, '').replace(/^\./, '');
        if (pathPart.includes('Field:')) {
          const parts = pathPart.split('Field:');
          const prefixPath = parts[0].trim().replace(/\.$/, '');
          const fieldName = parts[1].trim();
          fieldPath = prefixPath ? `${prefixPath}.${fieldName}` : fieldName;
          ruleCategory = lang === 'en' ? `Sensitive Key (${fieldName})` : `機密欄位名稱 (${fieldName})`;
        } else if (pathPart.includes('(Regex Match')) {
          fieldPath = pathPart.replace(/\(Regex Match.*\)/, '').trim().replace(/\.$/, '');
          ruleCategory = lang === 'en' ? 'Deep Regex Pattern' : '深度正則特徵 (Regex)';
        } else if (pathPart.includes('(Custom:')) {
          fieldPath = pathPart.replace(/\(Custom:.*\)/, '').trim().replace(/\.$/, '');
          ruleCategory = lang === 'en' ? 'Custom Keyword' : '自訂敏感關鍵字';
        } else if (pathPart.includes('(PCI-DSS:')) {
          fieldPath = pathPart.replace(/\(PCI-DSS:.*\)/, '').trim().replace(/\.$/, '');
          ruleCategory = lang === 'en' ? 'PCI-DSS Payment Secret' : '信用卡 / 支付機密 (PCI-DSS)';
        } else {
          fieldPath = pathPart;
        }
      } else if (r.startsWith('Response JSON')) {
        scope = 'Response JSON';
        scopeType = 'response_json';
        const pathPart = r.replace(/^Response JSON\s*/, '').replace(/^\./, '');
        if (pathPart.includes('Field:')) {
          const parts = pathPart.split('Field:');
          const prefixPath = parts[0].trim().replace(/\.$/, '');
          const fieldName = parts[1].trim();
          fieldPath = prefixPath ? `${prefixPath}.${fieldName}` : fieldName;
          ruleCategory = lang === 'en' ? `Sensitive Key (${fieldName})` : `機密欄位名稱 (${fieldName})`;
        } else if (pathPart.includes('(Regex Match')) {
          fieldPath = pathPart.replace(/\(Regex Match.*\)/, '').trim().replace(/\.$/, '');
          ruleCategory = lang === 'en' ? 'Deep Regex Pattern' : '深度正則特徵 (Regex)';
        } else if (pathPart.includes('(Custom:')) {
          fieldPath = pathPart.replace(/\(Custom:.*\)/, '').trim().replace(/\.$/, '');
          ruleCategory = lang === 'en' ? 'Custom Keyword' : '自訂敏感關鍵字';
        } else if (pathPart.includes('(PCI-DSS:')) {
          fieldPath = pathPart.replace(/\(PCI-DSS:.*\)/, '').trim().replace(/\.$/, '');
          ruleCategory = lang === 'en' ? 'PCI-DSS Payment Secret' : '信用卡 / 支付機密 (PCI-DSS)';
        } else {
          fieldPath = pathPart;
        }
      } else if (r.includes('Header')) {
        scopeType = 'header';
        scope = r.startsWith('Res') ? (lang === 'en' ? 'Response Header' : '回應標頭') : (lang === 'en' ? 'Request Header' : '請求標頭');
        fieldPath = r.replace(/^(Res|Req)\s+(Payment\s+)?Header(\s+\(.*\))?:\s*/, '').replace(/^Regex Match in Header\s*/, '').trim();
        if (r.includes('Custom:')) ruleCategory = lang === 'en' ? 'Custom Keyword' : '自訂敏感關鍵字';
        else if (r.includes('PCI-DSS') || r.includes('Payment')) ruleCategory = lang === 'en' ? 'PCI-DSS Payment Header' : '信用卡支付機密標頭';
        else if (r.includes('Cookie Header')) { ruleCategory = 'Cookie Session Header'; scopeType = 'cookie'; }
        else if (r.includes('Regex Match')) ruleCategory = lang === 'en' ? 'Regex in Header' : '標頭正則特徵命中';
        else ruleCategory = lang === 'en' ? 'Authentication Header' : '身分認證機密標頭';
      } else if (r.includes('Cookie')) {
        scopeType = 'cookie';
        scope = r.startsWith('Res') ? (lang === 'en' ? 'Response Cookie' : '回應 Cookie') : (lang === 'en' ? 'Request Cookie' : '請求 Cookie');
        fieldPath = r.replace(/^(Res|Req)\s+Cookie(\s+\(.*\))?:\s*/, '').trim();
        if (r.includes('Custom:')) ruleCategory = lang === 'en' ? 'Custom Cookie' : '自訂 Cookie 敏感詞';
        else if (r.includes('PCI-DSS')) ruleCategory = lang === 'en' ? 'PCI-DSS Cookie Secret' : '支付 Cookie 憑證';
        else ruleCategory = lang === 'en' ? 'Session Cookie' : '身分認證 Cookie 憑證';
      } else if (r.includes('Query')) {
        scopeType = 'query';
        scope = lang === 'en' ? 'Query Parameter' : 'URL 查詢參數';
        fieldPath = r.replace(/^Query Param(\s+\(.*\))?:\s*/, '').replace(/^Regex Match in Query:\s*/, '').trim();
        if (r.includes('Custom:')) ruleCategory = lang === 'en' ? 'Custom Query' : '自訂 Query 敏感詞';
        else if (r.includes('PCI-DSS')) ruleCategory = lang === 'en' ? 'PCI-DSS Payment Query' : '支付查詢參數 (PCI-DSS)';
        else if (r.includes('Regex Match')) ruleCategory = lang === 'en' ? 'Query Regex Match' : 'Query 正則特徵命中';
        else ruleCategory = lang === 'en' ? 'Sensitive Query Token' : 'URL 敏感查詢參數';
      } else if (r.includes('Post Param')) {
        scope = lang === 'en' ? 'POST Param' : 'POST 表單參數';
        scopeType = 'post_json';
        fieldPath = r.replace(/^Post Param(\s+\(.*\))?:\s*/, '').replace(/^Regex Match in Post Param\s*/, '').trim();
        if (r.includes('Custom:')) ruleCategory = lang === 'en' ? 'Custom Param' : '自訂表單敏感詞';
        else if (r.includes('PCI-DSS')) ruleCategory = lang === 'en' ? 'PCI-DSS Post Secret' : '支付表單欄位 (PCI-DSS)';
        else if (r.includes('Regex Match')) ruleCategory = lang === 'en' ? 'Param Regex Match' : '表單內容正則命中';
        else ruleCategory = lang === 'en' ? 'Sensitive Form Field' : 'POST 機密表單欄位';
      } else if (r.includes('Media Stripped')) {
        scope = lang === 'en' ? 'Response Media' : '回應媒體二進位';
        scopeType = 'media';
        fieldPath = r.replace(/^Media Stripped\s*\(/, '').replace(/\)$/, '').trim();
        ruleCategory = lang === 'en' ? 'Heavy Media Binary' : '肥大媒體二進位檔案';
        action = lang === 'en' ? 'Stripped to [MEDIA_BINARY_STRIPPED]' : '已剔除二進位內文瘦身';
      }

      // 將重複陣列索引例如 result[0], result[1] 聚合為 result[*]
      const normalizedPath = fieldPath.replace(/\[\d+\]/g, '[*]');
      const groupKey = `${scope}:::${normalizedPath}:::${ruleCategory}:::${action}`;

      if (map.has(groupKey)) {
        const item = map.get(groupKey)!;
        item.hitCount += 1;
      } else {
        map.set(groupKey, {
          scope,
          scopeType,
          fieldPath: normalizedPath,
          ruleCategory,
          action,
          hitCount: 1,
          samplePath: fieldPath !== normalizedPath ? fieldPath : undefined,
        });
      }
    }

    return Array.from(map.values());
  };

  // 掃描偵測所有不重複的敏感標頭
  const detectedHeadersList = useMemo<DetectedHeaderItem[]>(() => {
    if (!rawHarData?.log?.entries || !Array.isArray(rawHarData.log.entries)) {
      return [];
    }

    const map = new Map<string, {
      name: string;
      normalizedName: string;
      hasReq: boolean;
      hasRes: boolean;
      count: number;
      matchedRule: string;
      sampleValue: string;
    }>();

    const customKeys = rules.customKeywords
      .split(/[,;\n]+/)
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const defaultSensitiveKeys = [
      'password', 'passwd', 'pwd', 'secret', 'token', 'access_token', 'refresh_token',
      'api_key', 'apikey', 'auth', 'authorization', 'signature', 'sig', 'ssn',
      'client_secret', 'private_key',
    ];

    const paymentKeys = [
      'card_number', 'cardnumber', 'card_no', 'cardno', 'credit_card', 'creditcard',
      'cc_num', 'cc_number', 'pan', 'account_no', 'account_number', 'cvv', 'cvc',
      'cvv2', 'cvc2', 'security_code', 'csc', 'exp_month', 'exp_year', 'expiry',
      'expiration_date', 'card_exp', 'cardholder_name',
    ];

    const isMatchingKey = (key: string, sensitiveList: string[]) => {
      const lower = key.toLowerCase();
      if (lower.startsWith(':')) return false; // 忽略 HTTP/2 虛擬標頭 (:authority, :path 等)

      return sensitiveList.some((target) => {
        if (lower === target) return true;
        const tokens = lower.split(/[-_.:/\\]+/);
        return tokens.includes(target);
      });
    };

    const jwtRegex = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.?[A-Za-z0-9_.+/=-]*/;
    const bearerRegex = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/i;
    const awsKeyRegex = /(AKIA|ASIA)[0-9A-Z]{16}/;
    const stripeKeyRegex = /sk_live_[0-9a-zA-Z]{24,}/;

    const inspectHeader = (h: { name: string; value: string }, isResponse: boolean) => {
      if (!h || !h.name) return;
      const name = h.name.trim();
      const norm = name.toLowerCase();
      if (norm.startsWith(':')) return; // 忽略 HTTP/2 虛擬標頭
      const val = h.value || '';

      const isAuthHeaderName =
        norm === 'authorization' ||
        norm === 'proxy-authorization' ||
        norm === 'x-api-key' ||
        norm === 'x-auth-token' ||
        norm === 'api-key' ||
        norm === 'session-token' ||
        norm === 'access-token' ||
        norm === 'bearer';

      const isCookieHeaderName = norm === 'cookie' || norm === 'set-cookie';

      let matchedRule = '';

      // 1. 如果勾選了「身分認證標頭」
      if (rules.authHeaders && (isAuthHeaderName || isMatchingKey(norm, defaultSensitiveKeys))) {
        matchedRule = lang === 'en' ? 'Auth Header' : '身分認證標頭';
      }
      // 2. 如果勾選了「Cookie 與 Session 憑證」
      else if (rules.cookies && isCookieHeaderName) {
        matchedRule = lang === 'en' ? 'Cookie / Session' : 'Cookie / Session 憑證';
      }
      // 3. 如果勾選了「信用卡與支付機密」
      else if (rules.creditCard && isMatchingKey(norm, paymentKeys)) {
        matchedRule = lang === 'en' ? 'Credit Card / Payment (PCI-DSS)' : '信用卡與支付機密 (PCI-DSS)';
      }
      // 4. 檢查自訂敏感關鍵字 (只有當使用者有輸入 customKeys 時)
      else if (customKeys.length > 0 && isMatchingKey(norm, customKeys)) {
        const matchedCustom = customKeys.find((k) => norm === k || norm.split(/[-_.:/\\]+/).includes(k));
        matchedRule = lang === 'en' ? `Custom Keyword (${matchedCustom || 'Custom'})` : `自訂敏感欄位 (${matchedCustom || '自訂'})`;
      }
      // 5. 正則深度掃描 (只有在 rules.regexDeep 開啟時)
      else if (rules.regexDeep) {
        if (jwtRegex.test(val)) {
          matchedRule = lang === 'en' ? 'Deep Regex (JWT Token)' : '正則深度掃描 (JWT Token)';
        } else if (bearerRegex.test(val)) {
          matchedRule = lang === 'en' ? 'Deep Regex (Bearer Token)' : '正則深度掃描 (Bearer Token)';
        } else if (awsKeyRegex.test(val)) {
          matchedRule = lang === 'en' ? 'Deep Regex (AWS Key)' : '正則深度掃描 (AWS Key)';
        } else if (stripeKeyRegex.test(val)) {
          matchedRule = lang === 'en' ? 'Deep Regex (Stripe Key)' : '正則深度掃描 (Stripe Key)';
        }
      }

      if (matchedRule) {
        if (!map.has(norm)) {
          map.set(norm, {
            name,
            normalizedName: norm,
            hasReq: !isResponse,
            hasRes: isResponse,
            count: 1,
            matchedRule,
            sampleValue: val,
          });
        } else {
          const item = map.get(norm)!;
          item.count += 1;
          if (isResponse) item.hasRes = true;
          else item.hasReq = true;
          if (!item.sampleValue && val) item.sampleValue = val;
        }
      }
    };

    for (const entry of rawHarData.log.entries) {
      if (Array.isArray(entry.request?.headers)) {
        entry.request.headers.forEach((h: any) => inspectHeader(h, false));
      }
      if (Array.isArray(entry.response?.headers)) {
        entry.response.headers.forEach((h: any) => inspectHeader(h, true));
      }
    }

    return Array.from(map.values()).map((item) => ({
      name: item.name,
      normalizedName: item.normalizedName,
      scope: item.hasReq && item.hasRes ? 'both' : item.hasRes ? 'response' : 'request',
      count: item.count,
      matchedRule: item.matchedRule,
      sampleValue: item.sampleValue,
    }));
  }, [rawHarData, rules, lang]);

  // 切換個別標頭脫敏狀態
  const handleToggleHeaderRedaction = (normalizedName: string) => {
    setExcludedHeaders((prev) => ({
      ...prev,
      [normalizedName]: !prev[normalizedName],
    }));
  };

  // 全部脫敏
  const handleSelectAllHeaders = () => {
    setExcludedHeaders({});
  };

  // 全部保留 (不脫敏)
  const handleDeselectAllHeaders = () => {
    const next: Record<string, boolean> = {};
    detectedHeadersList.forEach((h) => {
      next[h.normalizedName] = true;
    });
    setExcludedHeaders(next);
  };

  // Sanitization Engine
  const sanitizeEngine = useCallback(() => {
    if (!rawHarData || !rawHarData.log || !Array.isArray(rawHarData.log.entries)) {
      return {
        cleanedHar: null,
        stats: {
          totalRequests: 0,
          sanitizedRequests: 0,
          redactedHeaders: 0,
          redactedCookies: 0,
          redactedQueryParams: 0,
          redactedBodies: 0,
          redactedRegexItems: 0,
          redactedCustomKeywords: 0,
          redactedCreditCards: 0,
          strippedMediaItems: 0,
          strippedTrackers: 0,
          originalSizeBytes: originalFileSize,
          cleanedSizeBytes: 0,
        } as SanitizedStats,
        entriesAnalysis: [] as Array<{
          original: any;
          cleaned: any;
          isSanitized: boolean;
          reasons: string[];
        }>,
      };
    }

    const redactVal = rules.redactionText || '[REDACTED]';
    const customKeys = rules.customKeywords
      .split(/[,;\n]+/)
      .map((k) => k.trim().toLowerCase())
      .filter(Boolean);

    const defaultSensitiveKeys = [
      'password', 'passwd', 'pwd', 'secret', 'token', 'access_token', 'refresh_token',
      'api_key', 'apikey', 'auth', 'authorization', 'signature', 'sig', 'ssn',
      'client_secret', 'private_key',
    ];

    const paymentKeys = [
      'card_number', 'cardnumber', 'card_no', 'cardno', 'credit_card', 'creditcard',
      'cc_num', 'cc_number', 'pan', 'account_no', 'account_number', 'cvv', 'cvc',
      'cvv2', 'cvc2', 'security_code', 'csc', 'exp_month', 'exp_year', 'expiry',
      'expiration_date', 'card_exp', 'cardholder_name', 'billing_address',
    ];

    const isMatchingKey = (key: string, sensitiveList: string[]) => {
      const lower = key.toLowerCase();
      if (lower.startsWith(':')) return false;

      return sensitiveList.some((target) => {
        if (lower === target) return true;
        const tokens = lower.split(/[-_.:/\\]+/);
        return tokens.includes(target);
      });
    };

    const trackerDomains = [
      'google-analytics.com', 'analytics.google.com', 'googletagmanager.com',
      'connect.facebook.net', 'facebook.net/tr', 'hotjar.com', 'sentry.io',
      'browser-intake-datadoghq.com', 'datadoghq.com', 'mixpanel.com',
      'segment.io', 'analytics.tiktok.com', 'clarity.ms',
    ];

    // Deep Regex Patterns
    const jwtRegex = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.?[A-Za-z0-9_.+/=-]*/g;
    const bearerRegex = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
    const awsKeyRegex = /(AKIA|ASIA)[0-9A-Z]{16}/g;
    const stripeKeyRegex = /sk_live_[0-9a-zA-Z]{24,}/g;
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
    // 信用卡卡號正則 (支援 13~19 位標準卡號，可含破折號或空格)
    const creditCardRegex = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|2[2-7][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11}|(?:\d{4}[ -]){3}\d{4})\b/g;

    let totalSanitizedReqs = 0;
    let totalRedactedHeaders = 0;
    let totalRedactedCookies = 0;
    let totalRedactedQueryParams = 0;
    let totalRedactedBodies = 0;
    let totalRedactedRegex = 0;
    let totalRedactedCustomKeywords = 0;
    let totalRedactedCreditCards = 0;
    let totalStrippedMedia = 0;
    let totalStrippedTrackers = 0;

    const sanitizeStringWithRegex = (str: string): { result: string; matches: number } => {
      if (typeof str !== 'string') return { result: str, matches: 0 };
      let matchCount = 0;
      let text = str;

      if (rules.creditCard) {
        text = text.replace(creditCardRegex, () => {
          matchCount++;
          totalRedactedCreditCards++;
          return redactVal;
        });
      }

      if (rules.regexDeep) {
        text = text.replace(jwtRegex, () => {
          matchCount++;
          totalRedactedRegex++;
          return redactVal;
        });
        text = text.replace(bearerRegex, () => {
          matchCount++;
          totalRedactedRegex++;
          return `Bearer ${redactVal}`;
        });
        text = text.replace(awsKeyRegex, () => {
          matchCount++;
          totalRedactedRegex++;
          return redactVal;
        });
        text = text.replace(stripeKeyRegex, () => {
          matchCount++;
          totalRedactedRegex++;
          return redactVal;
        });
        text = text.replace(emailRegex, () => {
          matchCount++;
          totalRedactedRegex++;
          return redactVal;
        });
      }

      return { result: text, matches: matchCount };
    };

    const sanitizeJsonObj = (
      obj: any,
      prefix: string = 'JSON',
      fieldReasons?: string[]
    ): { cleaned: any; changed: number } => {
      if (obj === null || typeof obj !== 'object') {
        if (typeof obj === 'string') {
          const res = sanitizeStringWithRegex(obj);
          if (res.matches > 0 && fieldReasons) {
            fieldReasons.push(`${prefix} (Regex Match)`);
          }
          return { cleaned: res.result, changed: res.matches };
        }
        return { cleaned: obj, changed: 0 };
      }

      let changeCount = 0;
      if (Array.isArray(obj)) {
        const newArr = obj.map((item, idx) => {
          const res = sanitizeJsonObj(item, `${prefix}[${idx}]`, fieldReasons);
          changeCount += res.changed;
          return res.cleaned;
        });
        return { cleaned: newArr, changed: changeCount };
      }

      const newObj: Record<string, any> = {};
      for (const key of Object.keys(obj)) {
        if (customKeys.length > 0 && isMatchingKey(key, customKeys)) {
          newObj[key] = redactVal;
          changeCount++;
          totalRedactedCustomKeywords++;
          if (fieldReasons) {
            fieldReasons.push(`${prefix} (Custom: ${key})`);
          }
        } else if (rules.creditCard && isMatchingKey(key, paymentKeys)) {
          newObj[key] = redactVal;
          changeCount++;
          totalRedactedCreditCards++;
          if (fieldReasons) {
            fieldReasons.push(`${prefix} (PCI-DSS: ${key})`);
          }
        } else if (rules.postData && isMatchingKey(key, defaultSensitiveKeys)) {
          newObj[key] = redactVal;
          changeCount++;
          totalRedactedBodies++;
          if (fieldReasons) {
            fieldReasons.push(`${prefix} Field: ${key}`);
          }
        } else {
          const res = sanitizeJsonObj(obj[key], `${prefix}.${key}`, fieldReasons);
          newObj[key] = res.cleaned;
          changeCount += res.changed;
        }
      }
      return { cleaned: newObj, changed: changeCount };
    };

    const cleanedEntries: any[] = [];
    const entriesAnalysis: Array<{
      original: any;
      cleaned: any;
      isSanitized: boolean;
      reasons: string[];
    }> = [];

    const rawEntries = rawHarData.log.entries;

    for (let i = 0; i < rawEntries.length; i++) {
      const entry = rawEntries[i];
      const reasons: string[] = [];

      const reqUrl = entry.request?.url || '';

      // Check tracker stripping
      if (rules.stripTrackers && trackerDomains.some((d) => reqUrl.includes(d))) {
        totalStrippedTrackers++;
        continue; // Drop this tracker entry
      }

      // Deep clone entry for modification
      const clonedEntry = JSON.parse(JSON.stringify(entry));

      // 1. Sanitize Request & Response Headers
      const sanitizeHeaders = (headers: any[], isResponse = false) => {
        if (!Array.isArray(headers)) return;
        for (const h of headers) {
          const nameLower = (h.name || '').toLowerCase();
          if (nameLower.startsWith(':')) continue; // 不處理偽標頭

          // 若使用者手動取消了此標頭的脫敏消除，則直接跳過保留原值
          if (excludedHeaders[nameLower]) {
            continue;
          }

          if (customKeys.length > 0 && isMatchingKey(nameLower, customKeys)) {
            h.value = redactVal;
            totalRedactedCustomKeywords++;
            reasons.push(`${isResponse ? 'Res' : 'Req'} Header (Custom: ${nameLower})`);
          } else if (rules.creditCard && isMatchingKey(nameLower, paymentKeys)) {
            h.value = redactVal;
            totalRedactedCreditCards++;
            reasons.push(`${isResponse ? 'Res' : 'Req'} Payment Header (PCI-DSS): ${h.name}`);
          } else if (
            rules.authHeaders &&
            (nameLower === 'authorization' ||
              nameLower === 'proxy-authorization' ||
              nameLower === 'x-api-key' ||
              nameLower === 'x-auth-token' ||
              nameLower === 'api-key' ||
              nameLower === 'session-token' ||
              nameLower === 'access-token' ||
              nameLower === 'bearer' ||
              isMatchingKey(nameLower, defaultSensitiveKeys))
          ) {
            h.value = redactVal;
            totalRedactedHeaders++;
            reasons.push(`${isResponse ? 'Res' : 'Req'} Header: ${h.name}`);
          } else if (rules.cookies && (nameLower === 'cookie' || nameLower === 'set-cookie')) {
            h.value = redactVal;
            totalRedactedCookies++;
            reasons.push(`${isResponse ? 'Res' : 'Req'} Cookie Header`);
          } else if (rules.regexDeep || rules.creditCard) {
            const res = sanitizeStringWithRegex(h.value);
            if (res.matches > 0) {
              h.value = res.result;
              reasons.push(`Regex Match in Header ${h.name}`);
            }
          }
        }
      };

      if (clonedEntry.request?.headers) sanitizeHeaders(clonedEntry.request.headers, false);
      if (clonedEntry.response?.headers) sanitizeHeaders(clonedEntry.response.headers, true);

      // 2. Sanitize Request & Response Cookies Array
      if (rules.cookies || customKeys.length > 0 || rules.creditCard) {
        if (Array.isArray(clonedEntry.request?.cookies)) {
          for (const c of clonedEntry.request.cookies) {
            if (customKeys.length > 0 && isMatchingKey(c.name, customKeys)) {
              c.value = redactVal;
              totalRedactedCustomKeywords++;
              reasons.push(`Req Cookie (Custom: ${c.name})`);
            } else if (rules.creditCard && isMatchingKey(c.name, paymentKeys)) {
              c.value = redactVal;
              totalRedactedCreditCards++;
              reasons.push(`Req Cookie (PCI-DSS Payment: ${c.name})`);
            } else if (rules.cookies) {
              c.value = redactVal;
              totalRedactedCookies++;
              reasons.push(`Req Cookie: ${c.name}`);
            }
          }
        }
        if (Array.isArray(clonedEntry.response?.cookies)) {
          for (const c of clonedEntry.response.cookies) {
            if (customKeys.length > 0 && isMatchingKey(c.name, customKeys)) {
              c.value = redactVal;
              totalRedactedCustomKeywords++;
              reasons.push(`Res Cookie (Custom: ${c.name})`);
            } else if (rules.creditCard && isMatchingKey(c.name, paymentKeys)) {
              c.value = redactVal;
              totalRedactedCreditCards++;
              reasons.push(`Res Cookie (PCI-DSS Payment: ${c.name})`);
            } else if (rules.cookies) {
              c.value = redactVal;
              totalRedactedCookies++;
              reasons.push(`Res Cookie: ${c.name}`);
            }
          }
        }
      }

      // 3. Sanitize Query Parameters
      if (rules.queryParams || customKeys.length > 0 || rules.creditCard || rules.regexDeep) {
        const hasQueryStringArray = Array.isArray(clonedEntry.request?.queryString) && clonedEntry.request.queryString.length > 0;
        
        if (hasQueryStringArray) {
          for (const q of clonedEntry.request.queryString) {
            if (customKeys.length > 0 && isMatchingKey(q.name, customKeys)) {
              q.value = redactVal;
              totalRedactedCustomKeywords++;
              reasons.push(`Query Param (Custom: ${q.name})`);
            } else if (rules.creditCard && isMatchingKey(q.name, paymentKeys)) {
              q.value = redactVal;
              totalRedactedCreditCards++;
              reasons.push(`Query Param (PCI-DSS Payment: ${q.name})`);
            } else if (rules.queryParams && isMatchingKey(q.name, defaultSensitiveKeys)) {
              q.value = redactVal;
              totalRedactedQueryParams++;
              reasons.push(`Query Param: ${q.name}`);
            } else if (rules.regexDeep || rules.creditCard) {
              const res = sanitizeStringWithRegex(q.value);
              if (res.matches > 0) {
                q.value = res.result;
                reasons.push(`Regex Match in Query: ${q.name}`);
              }
            }
          }
        }

        // Also clean sensitive query string inside request.url (if not already counted in queryString array)
        try {
          const parsedUrl = new URL(clonedEntry.request.url);
          let urlChanged = false;
          parsedUrl.searchParams.forEach((val, key) => {
            if (customKeys.length > 0 && isMatchingKey(key, customKeys)) {
              parsedUrl.searchParams.set(key, redactVal);
              if (!hasQueryStringArray) {
                totalRedactedCustomKeywords++;
                reasons.push(`Query Param (Custom: ${key})`);
              }
              urlChanged = true;
            } else if (rules.creditCard && isMatchingKey(key, paymentKeys)) {
              parsedUrl.searchParams.set(key, redactVal);
              if (!hasQueryStringArray) {
                totalRedactedCreditCards++;
                reasons.push(`Query Param (PCI-DSS Payment: ${key})`);
              }
              urlChanged = true;
            } else if (rules.queryParams && isMatchingKey(key, defaultSensitiveKeys)) {
              parsedUrl.searchParams.set(key, redactVal);
              if (!hasQueryStringArray) {
                totalRedactedQueryParams++;
                reasons.push(`Query Param: ${key}`);
              }
              urlChanged = true;
            } else if (rules.regexDeep || rules.creditCard) {
              const res = sanitizeStringWithRegex(val);
              if (res.matches > 0) {
                parsedUrl.searchParams.set(key, res.result);
                if (!hasQueryStringArray) {
                  reasons.push(`Regex Match in Query: ${key}`);
                }
                urlChanged = true;
              }
            }
          });
          if (urlChanged) {
            clonedEntry.request.url = parsedUrl.toString();
          }
        } catch {
          if (rules.regexDeep || rules.creditCard) {
            const res = sanitizeStringWithRegex(clonedEntry.request.url);
            if (res.matches > 0) {
              clonedEntry.request.url = res.result;
              reasons.push('URL Regex Redacted');
            }
          }
        }
      }

      // 4. Sanitize POST Data
      if (clonedEntry.request?.postData) {
        const pd = clonedEntry.request.postData;
        const hasParams = Array.isArray(pd.params) && pd.params.length > 0;

        if (hasParams) {
          for (const p of pd.params) {
            if (customKeys.length > 0 && isMatchingKey(p.name, customKeys)) {
              p.value = redactVal;
              totalRedactedCustomKeywords++;
              reasons.push(`Post Param (Custom: ${p.name})`);
            } else if (rules.creditCard && isMatchingKey(p.name, paymentKeys)) {
              p.value = redactVal;
              totalRedactedCreditCards++;
              reasons.push(`Post Param (PCI-DSS Payment: ${p.name})`);
            } else if (rules.postData && isMatchingKey(p.name, defaultSensitiveKeys)) {
              p.value = redactVal;
              totalRedactedBodies++;
              reasons.push(`Post Param: ${p.name}`);
            } else if (rules.regexDeep || rules.creditCard) {
              const res = sanitizeStringWithRegex(p.value);
              if (res.matches > 0) {
                p.value = res.result;
                reasons.push(`Regex Match in Post Param ${p.name}`);
              }
            }
          }
        }

        // Only process pd.text if there are no params (e.g. JSON payload, raw body) to avoid double counting form data
        if (!hasParams && typeof pd.text === 'string' && pd.text && (rules.postData || rules.creditCard || customKeys.length > 0 || rules.regexDeep)) {
          try {
            const parsed = JSON.parse(pd.text);
            const res = sanitizeJsonObj(parsed, 'Post JSON', reasons);
            if (res.changed > 0) {
              pd.text = JSON.stringify(res.cleaned, null, 2);
            }
          } catch {
            const res = sanitizeStringWithRegex(pd.text);
            if (res.matches > 0) {
              pd.text = res.result;
              reasons.push('Post Body Regex Redacted');
            }
          }
        }
      }

      // 5. Sanitize Response Body & Strip Heavy Media
      if (clonedEntry.response?.content) {
        const content = clonedEntry.response.content;
        const mimeType = (content.mimeType || '').toLowerCase();
        const hasLargeBinary = (content.encoding === 'base64' && (content.size || 0) > 10240) || (content.text && content.text.length > 2000 && content.encoding === 'base64');
        const isMediaMime =
          mimeType.startsWith('image/') ||
          mimeType.startsWith('video/') ||
          mimeType.startsWith('audio/') ||
          mimeType.startsWith('font/') ||
          mimeType.includes('font') ||
          mimeType.includes('woff') ||
          mimeType === 'application/octet-stream' ||
          mimeType === 'application/pdf' ||
          mimeType === 'application/wasm';

        if (rules.stripMedia && (isMediaMime || hasLargeBinary)) {
          if (content.text || content.encoding) {
            content.text = '[MEDIA_BINARY_STRIPPED]';
            delete content.encoding;
            totalStrippedMedia++;
            reasons.push(`Media Stripped (${mimeType || 'binary'})`);
          }
        } else if (typeof content.text === 'string' && content.text && (rules.postData || rules.creditCard || customKeys.length > 0 || rules.regexDeep)) {
          try {
            const parsed = JSON.parse(content.text);
            const res = sanitizeJsonObj(parsed, 'Response JSON', reasons);
            if (res.changed > 0) {
              content.text = JSON.stringify(res.cleaned, null, 2);
            }
          } catch {
            const res = sanitizeStringWithRegex(content.text);
            if (res.matches > 0) {
              content.text = res.result;
              reasons.push('Response Body Regex Redacted');
            }
          }
        }
      }

      const isEntrySanitized = reasons.length > 0;
      if (isEntrySanitized) {
        totalSanitizedReqs++;
      }

      cleanedEntries.push(clonedEntry);
      entriesAnalysis.push({
        original: entry,
        cleaned: clonedEntry,
        isSanitized: isEntrySanitized,
        reasons,
      });
    }

    const cleanedHar = {
      ...rawHarData,
      log: {
        ...rawHarData.log,
        creator: {
          name: 'Smalltools HAR Sanitizer',
          version: '1.0.0 (https://tools.cjkuo.net/har-cleaner/)',
        },
        entries: cleanedEntries,
      },
    };

    const cleanedJsonStr = JSON.stringify(cleanedHar);
    const cleanedSizeBytes = new Blob([cleanedJsonStr]).size;

    return {
      cleanedHar,
      stats: {
        totalRequests: rawEntries.length,
        sanitizedRequests: totalSanitizedReqs,
        redactedHeaders: totalRedactedHeaders,
        redactedCookies: totalRedactedCookies,
        redactedQueryParams: totalRedactedQueryParams,
        redactedBodies: totalRedactedBodies,
        redactedRegexItems: totalRedactedRegex,
        redactedCustomKeywords: totalRedactedCustomKeywords,
        redactedCreditCards: totalRedactedCreditCards,
        strippedMediaItems: totalStrippedMedia,
        strippedTrackers: totalStrippedTrackers,
        originalSizeBytes: originalFileSize,
        cleanedSizeBytes,
      },
      entriesAnalysis,
    };
  }, [rawHarData, originalFileSize, rules, excludedHeaders]);

  const { cleanedHar, stats, entriesAnalysis } = sanitizeEngine();

  // Load sample HAR
  const handleLoadSample = () => {
    const sample = generateSampleHar();
    const jsonStr = JSON.stringify(sample);
    setRawHarData(sample);
    setOriginalFileSize(new Blob([jsonStr]).size);
    setFileName('sample_session.har');
    setExcludedHeaders({});
  };

  // Reset
  const handleReset = () => {
    setRawHarData(null);
    setOriginalFileSize(0);
    setFileName('session.har');
    setSelectedEntryIndex(null);
    setExcludedHeaders({});
  };

  // File Upload Handlers
  const handleFileChange = (file: File) => {
    if (!file) return;
    setFileName(file.name);
    setOriginalFileSize(file.size);
    setExcludedHeaders({});

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text);
        if (!parsed || !parsed.log) {
          alert(lang === 'en' ? 'Invalid HAR file format (missing root "log" object).' : '無效的 HAR 格式（缺少根 "log" 物件）。');
          return;
        }
        setRawHarData(parsed);
      } catch (err) {
        alert(lang === 'en' ? 'Failed to parse JSON. Please verify your HAR file.' : 'JSON 解析失敗，請確認檔案是否為合法的 HAR 格式。');
      }
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  // Download Cleaned HAR
  const handleDownload = () => {
    if (!cleanedHar) return;
    const jsonStr = JSON.stringify(cleanedHar, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const outName = fileName.replace(/\.har$/i, '') + '_sanitized.har';
    a.href = url;
    a.download = outName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy Clean JSON
  const handleCopyJson = () => {
    if (!cleanedHar) return;
    const jsonStr = JSON.stringify(cleanedHar, null, 2);
    navigator.clipboard.writeText(jsonStr);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Export Audit Report
  const handleExportReport = () => {
    if (!cleanedHar) return;
    const lines = [
      `# HAR Sanitization Audit Report`,
      `Date: ${new Date().toISOString()}`,
      `Original File: ${fileName}`,
      `Original Size: ${(stats.originalSizeBytes / 1024).toFixed(1)} KB`,
      `Cleaned Size: ${(stats.cleanedSizeBytes / 1024).toFixed(1)} KB (Savings: ${savingsPercent}%)`,
      ``,
      `## Summary Statistics`,
      `- Total Scanned Requests: ${stats.totalRequests}`,
      `- Sanitized Requests: ${stats.sanitizedRequests}`,
      `- Redacted Headers: ${stats.redactedHeaders}`,
      `- Redacted Cookies: ${stats.redactedCookies}`,
      `- Redacted Query Params: ${stats.redactedQueryParams}`,
      `- Redacted Body Fields: ${stats.redactedBodies}`,
      `- Custom Keyword Redactions: ${stats.redactedCustomKeywords}`,
      `- Credit Card & Payment Redactions: ${stats.redactedCreditCards}`,
      `- Regex Pattern Redactions: ${stats.redactedRegexItems}`,
      `- Stripped Media Payloads: ${stats.strippedMediaItems}`,
      `- Filtered Trackers: ${stats.strippedTrackers}`,
      ``,
      `## Unique Detected Headers & Decisions`,
    ];

    detectedHeadersList.forEach((h) => {
      const isRedacted = !excludedHeaders[h.normalizedName];
      lines.push(`- **${h.name}** [${h.scope}] (${h.count} instances) -> Rule: ${h.matchedRule} -> Action: ${isRedacted ? 'REDACTED' : 'PRESERVED'}`);
    });

    lines.push(``);
    lines.push(`## Sanitized Entries Breakdown`);

    entriesAnalysis.forEach((entry, idx) => {
      if (entry.isSanitized) {
        lines.push(`### [${idx + 1}] ${entry.original.request?.method || 'GET'} ${entry.original.request?.url}`);
        lines.push(`- Status: ${entry.original.response?.status || 200}`);
        lines.push(`- Redaction Triggers:`);
        entry.reasons.forEach((r) => lines.push(`  * ${r}`));
        lines.push(``);
      }
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sanitization_report_${Date.now()}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format Helper
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const savingsPercent =
    stats.originalSizeBytes > 0
      ? Math.max(0, Math.round(((stats.originalSizeBytes - stats.cleanedSizeBytes) / stats.originalSizeBytes) * 100))
      : 0;

  // Filtered Entries for Inspector
  const filteredEntries = entriesAnalysis.filter((item) => {
    if (sanitizedOnly && !item.isSanitized) return false;
    const method = (item.cleaned.request?.method || 'GET').toUpperCase();
    if (methodFilter !== 'ALL' && method !== methodFilter) return false;
    const status = item.cleaned.response?.status || 0;
    if (statusFilter === '2xx' && (status < 200 || status >= 300)) return false;
    if (statusFilter === '3xx' && (status < 300 || status >= 400)) return false;
    if (statusFilter === '4xx' && (status < 400 || status >= 500)) return false;
    if (statusFilter === '5xx' && (status < 500 || status >= 600)) return false;

    // Rule Category Filter
    if (ruleCategoryFilter !== 'ALL') {
      if (ruleCategoryFilter === 'CLEAN_ONLY') {
        if (item.isSanitized) return false;
      } else {
        if (!item.isSanitized) return false;
        if (ruleCategoryFilter === 'AUTH_HEADER') {
          const hasAuth = item.reasons.some((r) => r.includes('Header') && !r.includes('Custom') && !r.includes('Regex') && !r.includes('Cookie'));
          if (!hasAuth) return false;
        } else if (ruleCategoryFilter === 'COOKIES') {
          const hasCookie = item.reasons.some((r) => r.includes('Cookie'));
          if (!hasCookie) return false;
        } else if (ruleCategoryFilter === 'QUERY_PARAMS') {
          const hasQuery = item.reasons.some((r) => r.includes('Query'));
          if (!hasQuery) return false;
        } else if (ruleCategoryFilter === 'POST_PAYLOAD') {
          const hasPost = item.reasons.some((r) => r.includes('Post') || r.includes('JSON'));
          if (!hasPost) return false;
        } else if (ruleCategoryFilter === 'CREDIT_CARD') {
          const hasCard = item.reasons.some((r) => r.toLowerCase().includes('card') || r.toLowerCase().includes('pci') || r.toLowerCase().includes('payment'));
          if (!hasCard) return false;
        } else if (ruleCategoryFilter === 'CUSTOM_KEY') {
          const hasCustom = item.reasons.some((r) => r.includes('Custom'));
          if (!hasCustom) return false;
        } else if (ruleCategoryFilter === 'REGEX_DEEP') {
          const hasRegex = item.reasons.some((r) => r.includes('Regex'));
          if (!hasRegex) return false;
        } else if (ruleCategoryFilter === 'STRIP_MEDIA') {
          const hasMedia = item.reasons.some((r) => r.includes('Media Stripped'));
          if (!hasMedia) return false;
        }
      }
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const url = (item.cleaned.request?.url || '').toLowerCase();
      if (!url.includes(q) && !method.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const selectedItem = selectedEntryIndex !== null ? filteredEntries[selectedEntryIndex] : null;

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#06b6d4"
      accentGlow="rgba(6, 182, 212, 0.6)"
      extraHeaderControls={
        <Link
          href={t.langToggleUrl}
          className="text-sm font-medium px-3 py-1.5 rounded-xl bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
        >
          {t.langToggleLabel}
        </Link>
      }
    >
      <div className="w-full space-y-6">
        {/* 上傳與快速測試區塊 */}
        {!rawHarData ? (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragActive(true); }}
            onDragLeave={() => setIsDragActive(false)}
            onDrop={handleDrop}
            className={`w-full rounded-2xl p-10 text-center cursor-pointer transition-all ${styles.dropzone} ${isDragActive ? styles.dropzoneActive : ''}`}
            onClick={() => document.getElementById(fileInputId)?.click()}
          >
            <input
              id={fileInputId}
              type="file"
              accept=".har,.json"
              className="hidden"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  handleFileChange(e.target.files[0]);
                }
              }}
            />
            <div className={`flex justify-center mb-4 ${styles.dropzoneIcon}`}>
              <UploadIcon />
            </div>
            <h3 className="text-lg font-semibold text-text-main mb-2">{t.dropzoneTitle}</h3>
            <p className="text-sm text-text-sub mb-6 max-w-xl mx-auto">{t.dropzoneHint}</p>
            <div className="flex justify-center gap-4 flex-wrap" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={handleLoadSample}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium ${styles.accentBtn}`}
              >
                <PlayIcon />
                <span>{t.loadSampleBtn}</span>
              </button>
            </div>
          </div>
        ) : (
          /* 已載入檔案控制列 */
          <div className="w-full rounded-2xl p-4 bg-surface-glass border border-border-glass flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main">
                <ShieldIcon />
              </div>
              <div>
                <div className="text-sm font-semibold text-text-main flex items-center gap-2">
                  <span>{fileName}</span>
                  <span className="text-xs px-2 py-0.5 rounded-md bg-select-bg text-text-sub font-mono">
                    {formatBytes(originalFileSize)}
                  </span>
                </div>
                <div className="text-xs text-text-sub">
                  {stats.totalRequests} Requests Scanned
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 flex-wrap">
              <button
                type="button"
                onClick={handleDownload}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${styles.accentBtn}`}
              >
                <DownloadIcon />
                <span>{t.downloadBtn}</span>
              </button>
              <button
                type="button"
                onClick={handleCopyJson}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium ${styles.secondaryBtn}`}
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
                <span>{copied ? t.copiedToast : t.copyJsonBtn}</span>
              </button>
              <button
                type="button"
                onClick={handleExportReport}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-sm font-medium ${styles.secondaryBtn}`}
              >
                <span>{t.exportReportBtn}</span>
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
              >
                <TrashIcon />
                <span>{t.clearBtn}</span>
              </button>
            </div>
          </div>
        )}

        {/* 脫敏配置全域規則面板 */}
        <div className="w-full rounded-2xl p-6 bg-surface-glass border border-border-glass space-y-4">
          <div className="flex items-center justify-between border-b border-border-glass pb-3">
            <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
              <ShieldIcon />
              <span>{t.rulesTitle}</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Rule 1: Auth Headers */}
            <div className={styles.ruleCard}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.authHeaders}
                  onChange={(e) => setRules({ ...rules, authHeaders: e.target.checked })}
                  className="mt-1 rounded accent-[var(--theme-color)]"
                />
                <div className="text-xs text-text-main leading-5 font-medium">{t.ruleAuthHeaders}</div>
              </label>
            </div>

            {/* Rule 2: Cookies */}
            <div className={styles.ruleCard}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.cookies}
                  onChange={(e) => setRules({ ...rules, cookies: e.target.checked })}
                  className="mt-1 rounded accent-[var(--theme-color)]"
                />
                <div className="text-xs text-text-main leading-5 font-medium">{t.ruleCookies}</div>
              </label>
            </div>

            {/* Rule 3: Query Params */}
            <div className={styles.ruleCard}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.queryParams}
                  onChange={(e) => setRules({ ...rules, queryParams: e.target.checked })}
                  className="mt-1 rounded accent-[var(--theme-color)]"
                />
                <div className="text-xs text-text-main leading-5 font-medium">{t.ruleQueryParams}</div>
              </label>
            </div>

            {/* Rule 4: POST Data */}
            <div className={styles.ruleCard}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.postData}
                  onChange={(e) => setRules({ ...rules, postData: e.target.checked })}
                  className="mt-1 rounded accent-[var(--theme-color)]"
                />
                <div className="text-xs text-text-main leading-5 font-medium">{t.rulePostData}</div>
              </label>
            </div>

            {/* Rule 5: Credit Cards & Payment (PCI-DSS) */}
            <div className={styles.ruleCard}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.creditCard}
                  onChange={(e) => setRules({ ...rules, creditCard: e.target.checked })}
                  className="mt-1 rounded accent-[var(--theme-color)]"
                />
                <div className="text-xs text-text-main leading-5 font-medium">{t.ruleCreditCard}</div>
              </label>
            </div>

            {/* Rule 5: Regex Deep Scan */}
            <div className={styles.ruleCard}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.regexDeep}
                  onChange={(e) => setRules({ ...rules, regexDeep: e.target.checked })}
                  className="mt-1 rounded accent-[var(--theme-color)]"
                />
                <div className="text-xs text-text-main leading-5 font-medium">{t.ruleRegexDeep}</div>
              </label>
            </div>

            {/* Rule 6: Strip Media */}
            <div className={styles.ruleCard}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.stripMedia}
                  onChange={(e) => setRules({ ...rules, stripMedia: e.target.checked })}
                  className="mt-1 rounded accent-[var(--theme-color)]"
                />
                <div className="text-xs text-text-main leading-5 font-medium">{t.ruleStripMedia}</div>
              </label>
            </div>

            {/* Rule 7: Strip Trackers */}
            <div className={styles.ruleCard}>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rules.stripTrackers}
                  onChange={(e) => setRules({ ...rules, stripTrackers: e.target.checked })}
                  className="mt-1 rounded accent-[var(--theme-color)]"
                />
                <div className="text-xs text-text-main leading-5 font-medium">{t.ruleStripTrackers}</div>
              </label>
            </div>
          </div>

          {/* Custom Keywords & Replacement String */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border-glass">
            <div>
              <label htmlFor={customKeywordsId} className="block text-xs text-text-sub font-medium mb-1.5">
                {t.customKeywordsLabel}
              </label>
              <input
                id={customKeywordsId}
                type="text"
                value={rules.customKeywords}
                onChange={(e) => setRules({ ...rules, customKeywords: e.target.value })}
                placeholder={t.customKeywordsPlaceholder}
                className="w-full text-xs px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:outline-none focus:border-[var(--theme-color)]"
              />
            </div>
            <div>
              <label htmlFor={redactionTextId} className="block text-xs text-text-sub font-medium mb-1.5">
                {t.redactionTextLabel}
              </label>
              <input
                id={redactionTextId}
                type="text"
                value={rules.redactionText}
                onChange={(e) => setRules({ ...rules, redactionText: e.target.value })}
                className="w-full text-xs px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main font-mono focus:outline-none focus:border-[var(--theme-color)]"
              />
            </div>
          </div>
        </div>

        {/* 不重複敏感標頭審核與消除控制區塊 */}
        {rawHarData && (
          <div className="w-full rounded-2xl p-6 bg-surface-glass border border-border-glass space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-glass pb-3">
              <div>
                <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
                  <ListCheckIcon />
                  <span>{t.headersSectionTitle}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-select-bg border border-border-glass text-text-sub font-mono font-medium">
                    {detectedHeadersList.length} Unique Headers ({detectedHeadersList.reduce((acc, h) => acc + h.count, 0)} Total Hits)
                  </span>
                </h2>
                <p className="text-xs text-text-sub mt-1 max-w-3xl">
                  {t.headersSectionSubtitle}
                </p>
              </div>

              {/* 批次操作快捷按鈕 */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSelectAllHeaders}
                  className={`text-xs px-3 py-1.5 rounded-lg font-medium ${styles.secondaryBtn}`}
                >
                  {t.headersSelectAll}
                </button>
                <button
                  type="button"
                  onClick={handleDeselectAllHeaders}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
                >
                  {t.headersDeselectAll}
                </button>
              </div>
            </div>

            {detectedHeadersList.length === 0 ? (
              <div className="py-8 text-center text-xs text-text-sub">
                {t.headersNoSensitiveFound}
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {detectedHeadersList.map((header) => {
                  const isRedacted = !excludedHeaders[header.normalizedName];

                  let scopeBadgeClass = styles.scopeBadgeReq;
                  let scopeLabel = t.scopeReq;
                  if (header.scope === 'response') {
                    scopeBadgeClass = styles.scopeBadgeRes;
                    scopeLabel = t.scopeRes;
                  } else if (header.scope === 'both') {
                    scopeBadgeClass = styles.scopeBadgeBoth;
                    scopeLabel = t.scopeBoth;
                  }

                  return (
                    <div
                      key={header.normalizedName}
                      onClick={() => handleToggleHeaderRedaction(header.normalizedName)}
                      className={`flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
                        isRedacted
                          ? 'bg-select-bg/80 border-border-glass hover:border-[var(--theme-color)]'
                          : 'bg-black/10 border-border-glass opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isRedacted}
                          onChange={() => {}} // Controlled via row click
                          className="rounded accent-[var(--theme-color)] cursor-pointer"
                        />
                        {/* Header Name & Scope */}
                        <div className="min-w-0 flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold font-mono text-text-main">
                            {header.name}
                          </span>
                          <span className={scopeBadgeClass}>{scopeLabel}</span>
                          <span className={styles.ruleBadge}>{header.matchedRule}</span>
                        </div>
                      </div>

                      {/* Count & Sample Value Preview */}
                      <div className="flex items-center gap-2.5 flex-shrink-0 text-xs">
                        <span className={styles.hitsBadge}>
                          {header.count} hits
                        </span>
                        {header.sampleValue && (
                          <div
                            className={styles.sampleValueBadge}
                            title={`${lang === 'en' ? 'Sample Header Value:' : '標頭原始值預覽：'} ${header.sampleValue}`}
                          >
                            <span className="text-xs text-text-sub uppercase font-sans font-semibold">
                              {lang === 'en' ? 'Value:' : '預覽:'}
                            </span>
                            <span className="truncate font-semibold text-text-main">
                              {header.sampleValue}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 儀表板指標卡片 (當有載入 HAR 資料時) */}
        {rawHarData && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className={styles.statCard}>
              <div className="text-xs text-text-sub font-medium mb-1">{t.statsTotalRequests}</div>
              <div className={styles.statValue}>{stats.totalRequests}</div>
            </div>
            <div className={styles.statCard}>
              <div className="text-xs text-text-sub font-medium mb-1">{t.statsSanitizedRequests}</div>
              <div className={styles.statValue}>{stats.sanitizedRequests}</div>
            </div>
            <div className={styles.statCard}>
              <div className="text-xs text-text-sub font-medium mb-1">{t.statsRedactedItems}</div>
              <div className={styles.statValue}>
                {stats.redactedHeaders + stats.redactedCookies + stats.redactedQueryParams + stats.redactedBodies + stats.redactedRegexItems + stats.redactedCustomKeywords + stats.redactedCreditCards + stats.strippedMediaItems + stats.strippedTrackers}
              </div>
            </div>
            <div className={styles.statCard}>
              <div className="text-xs text-text-sub font-medium mb-1">{t.statsSizeChange}</div>
              <div className="text-sm font-bold text-text-main mt-1 font-mono">
                {formatBytes(stats.originalSizeBytes)} ➔ {formatBytes(stats.cleanedSizeBytes)}
              </div>
            </div>
            <div className={styles.statCard}>
              <div className="text-xs text-text-sub font-medium mb-1">{t.statsSavings}</div>
              <div className={styles.statValue}>
                -{savingsPercent}%
              </div>
            </div>
          </div>
        )}

        {/* 視圖分頁切換 Tabs */}
        {rawHarData && (
          <div className="w-full space-y-4">
            <div className="flex border-b border-border-glass gap-2 pb-2">
              <button
                type="button"
                onClick={() => setActiveTab('summary')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'summary'
                    ? 'bg-select-bg text-text-main border border-border-glass shadow-sm'
                    : 'text-text-sub hover:text-text-main'
                }`}
              >
                {t.tabSummary}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('inspector')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'inspector'
                    ? 'bg-select-bg text-text-main border border-border-glass shadow-sm'
                    : 'text-text-sub hover:text-text-main'
                }`}
              >
                {t.tabInspector} ({filteredEntries.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('raw')}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  activeTab === 'raw'
                    ? 'bg-select-bg text-text-main border border-border-glass shadow-sm'
                    : 'text-text-sub hover:text-text-main'
                }`}
              >
                {t.tabRawJson}
              </button>
            </div>

            {/* TAB 1: 摘要看板 */}
            {activeTab === 'summary' && (
              <div className="rounded-2xl p-6 bg-surface-glass border border-border-glass space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* 脫敏類別細部統計 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-text-main">脫敏項目分佈明細 (Sanitization Breakdown)</h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
                        <span className="text-text-sub">認證與請求/回應標頭 (Headers):</span>
                        <span className="font-mono font-bold text-text-main">{stats.redactedHeaders}</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
                        <span className="text-text-sub">Cookie 與 Session 憑證:</span>
                        <span className="font-mono font-bold text-text-main">{stats.redactedCookies}</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
                        <span className="text-text-sub">網址 Query 參數:</span>
                        <span className="font-mono font-bold text-text-main">{stats.redactedQueryParams}</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
                        <span className="text-text-sub">POST / JSON Payload 機密欄位:</span>
                        <span className="font-mono font-bold text-text-main">{stats.redactedBodies}</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
                        <span className="text-text-sub">{t.breakdownCreditCards}:</span>
                        <span className="font-mono font-bold text-text-main">{stats.redactedCreditCards}</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
                        <span className="text-text-sub">{t.breakdownCustomKeys}:</span>
                        <span className="font-mono font-bold text-text-main">{stats.redactedCustomKeywords}</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
                        <span className="text-text-sub">深度正則掃描命中 (JWT / AWS / Key):</span>
                        <span className="font-mono font-bold text-text-main">{stats.redactedRegexItems}</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
                        <span className="text-text-sub">肥大二進位媒體酬載清理 (Media Stripped):</span>
                        <span className="font-mono font-bold text-text-main">{stats.strippedMediaItems}</span>
                      </div>
                      <div className="flex justify-between p-2.5 rounded-lg bg-select-bg border border-border-glass">
                        <span className="text-text-sub">過濾第三方追蹤請求 (Trackers Dropped):</span>
                        <span className="font-mono font-bold text-text-main">{stats.strippedTrackers}</span>
                      </div>
                    </div>
                  </div>

                  {/* 體積瘦身對比 */}
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-text-main">HAR 檔案瘦身成果 (Archive Compression)</h3>
                    <div className="p-4 rounded-xl bg-select-bg border border-border-glass space-y-4">
                      <div>
                        <div className="flex justify-between text-xs text-text-sub mb-1">
                          <span>原始檔案大小:</span>
                          <span className="font-mono font-bold text-text-main">{formatBytes(stats.originalSizeBytes)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-text-sub mb-1">
                          <span>清理後檔案大小:</span>
                          <span className={`font-mono font-bold ${styles.themeAccentText}`}>{formatBytes(stats.cleanedSizeBytes)}</span>
                        </div>
                        <div className="flex justify-between text-xs text-text-sub">
                          <span>節省空間比例:</span>
                          <span className={`font-mono font-bold ${styles.savingsText}`}>-{savingsPercent}%</span>
                        </div>
                      </div>
                      {/* 進度條 */}
                      <div className="w-full h-2.5 bg-black/20 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${styles.themeAccentBg} transition-all duration-500`}
                          style={{ width: `${Math.min(100, (stats.cleanedSizeBytes / (stats.originalSizeBytes || 1)) * 100)}%` }}
                        />
                      </div>
                      <p className="text-xs text-text-sub leading-relaxed">
                        清理後的檔案完全符合 HAR 1.2 標準格式，去除了機密隱私憑據與肥大圖片二進位酬載，可安全上傳至 Jira 或發送給技術支援。
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: 請求檢視器 (Entries Inspector) */}
            {activeTab === 'inspector' && (
              <div className="rounded-2xl p-6 bg-surface-glass border border-border-glass space-y-4">
                {/* 搜尋與篩選列 */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[240px] relative">
                    <label htmlFor={searchInputId} className="sr-only">{t.searchPlaceholder}</label>
                    <div className="absolute left-3 top-2.5 text-text-sub pointer-events-none">
                      <SearchIcon />
                    </div>
                    <input
                      id={searchInputId}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:outline-none focus:border-[var(--theme-color)]"
                    />
                  </div>

                  {/* Method Filter */}
                  <select
                    value={methodFilter}
                    onChange={(e) => setMethodFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:outline-none"
                  >
                    <option value="ALL">Method: ALL</option>
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                  </select>

                  {/* Status Filter */}
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:outline-none"
                  >
                    <option value="ALL">Status: ALL</option>
                    <option value="2xx">2xx Success</option>
                    <option value="3xx">3xx Redirect</option>
                    <option value="4xx">4xx Client Error</option>
                    <option value="5xx">5xx Server Error</option>
                  </select>

                  {/* Redaction Rule Category Filter */}
                  <select
                    value={ruleCategoryFilter}
                    onChange={(e) => setRuleCategoryFilter(e.target.value)}
                    className="text-xs px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:outline-none"
                  >
                    <option value="ALL">{t.ruleFilterAll}</option>
                    <option value="AUTH_HEADER">{t.ruleFilterAuth}</option>
                    <option value="COOKIES">{t.ruleFilterCookies}</option>
                    <option value="QUERY_PARAMS">{t.ruleFilterQuery}</option>
                    <option value="POST_PAYLOAD">{t.ruleFilterPost}</option>
                    <option value="CREDIT_CARD">{t.ruleFilterCard}</option>
                    <option value="CUSTOM_KEY">{t.ruleFilterCustom}</option>
                    <option value="REGEX_DEEP">{t.ruleFilterRegex}</option>
                    <option value="STRIP_MEDIA">{t.ruleFilterMedia}</option>
                    <option value="CLEAN_ONLY">{t.ruleFilterClean}</option>
                  </select>

                  {/* Toggle Sanitized Only */}
                  <label className="flex items-center gap-2 text-xs text-text-main cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={sanitizedOnly}
                      onChange={(e) => setSanitizedOnly(e.target.checked)}
                      className="rounded accent-[var(--theme-color)]"
                    />
                    <span>{t.filterSanitizedOnly}</span>
                  </label>
                </div>

                {/* 請求列表 */}
                {filteredEntries.length === 0 ? (
                  <div className="py-12 text-center text-sm text-text-sub">
                    {t.noMatchingEntries}
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
                    {filteredEntries.map((item, idx) => {
                      const method = item.cleaned.request?.method || 'GET';
                      const status = item.cleaned.response?.status || 200;
                      const url = item.cleaned.request?.url || '';
                      const time = Math.round(item.cleaned.time || 0);

                      let methodBadgeClass = styles.badgeGet;
                      if (method === 'POST') methodBadgeClass = styles.badgePost;
                      else if (method === 'PUT' || method === 'PATCH') methodBadgeClass = styles.badgePut;
                      else if (method === 'DELETE') methodBadgeClass = styles.badgeDelete;

                      let statusBadgeClass = styles.status2xx;
                      if (status >= 300 && status < 400) statusBadgeClass = styles.status3xx;
                      else if (status >= 400 && status < 500) statusBadgeClass = styles.status4xx;
                      else if (status >= 500) statusBadgeClass = styles.status5xx;

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setSelectedEntryIndex(idx);
                            setModalTab('overview');
                          }}
                          className={`${styles.entryRow} flex items-center justify-between gap-3`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <span className={`${styles.badgeMethod} ${methodBadgeClass}`}>{method}</span>
                            <span className={`${styles.statusBadge} ${statusBadgeClass}`}>{status}</span>
                            <span className="text-xs text-text-main font-mono truncate">{url}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {item.isSanitized && (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={styles.ruleHitBadge}
                                  title={lang === 'en' ? `${getEntryRuleCategoriesCount(item.reasons)} rule categories triggered` : `觸發 ${getEntryRuleCategoriesCount(item.reasons)} 類全域規則`}
                                >
                                  <ShieldIcon />
                                  <span>
                                    {lang === 'en'
                                      ? `${getEntryRuleCategoriesCount(item.reasons)} ${getEntryRuleCategoriesCount(item.reasons) === 1 ? 'Rule' : 'Rules'}`
                                      : `${getEntryRuleCategoriesCount(item.reasons)} 條規則`}
                                  </span>
                                </span>
                                <span
                                  className={styles.redactionCountBadge}
                                  title={lang === 'en' ? `${item.reasons.length} sensitive fields/items redacted` : `共脫敏 ${item.reasons.length} 個敏感欄位/項目`}
                                >
                                  <span>
                                    {lang === 'en'
                                      ? `${item.reasons.length} ${item.reasons.length === 1 ? 'Redaction' : 'Redactions'}`
                                      : `${item.reasons.length} 項脫敏`}
                                  </span>
                                </span>
                              </div>
                            )}
                            <span className="text-xs text-text-sub font-mono">{time}ms</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: 乾淨 HAR JSON */}
            {activeTab === 'raw' && (
              <div className="rounded-2xl p-6 bg-surface-glass border border-border-glass space-y-3">
                <div className="flex justify-between items-center">
                  <div className="text-xs text-text-sub">HAR 1.2 JSON (Cleaned & Formatted)</div>
                  <button
                    type="button"
                    onClick={handleCopyJson}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium ${styles.secondaryBtn}`}
                  >
                    {copied ? <CheckIcon /> : <CopyIcon />}
                    <span>{copied ? t.copiedToast : t.copyJsonBtn}</span>
                  </button>
                </div>
                <pre className={`p-4 text-xs overflow-x-auto max-h-[500px] text-text-main leading-5 ${styles.codeBox}`}>
                  {JSON.stringify(cleanedHar, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* 【全新重構優化】詳細檢視 Modal (分頁導航、無巢狀滾動、高奢毛玻璃) */}
        {selectedItem && (
          <div className={styles.modalBackdrop} onClick={() => setSelectedEntryIndex(null)}>
            <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
              {/* Modal 頂部 Header */}
              <div className={styles.modalHeader}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 w-full min-w-0">
                  <div className="flex items-start gap-2.5 min-w-0 flex-1">
                    <div className="p-2 rounded-xl bg-select-bg border border-border-glass text-text-main flex-shrink-0 mt-0.5">
                      <ShieldIcon />
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-bold text-text-main truncate">{t.modalTitle}</span>
                        <button
                          type="button"
                          onClick={() => setSelectedEntryIndex(null)}
                          className="sm:hidden text-text-sub hover:text-text-main w-7 h-7 rounded-lg bg-select-bg border border-border-glass flex items-center justify-center transition-colors text-xs font-bold flex-shrink-0"
                          aria-label="Close modal"
                        >
                          ✕
                        </button>
                      </div>

                      {/* 膠囊徽章列 */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {selectedItem.isSanitized ? (
                          <>
                            <span
                              className={styles.ruleHitBadge}
                              title={lang === 'en' ? `${getEntryRuleCategoriesCount(selectedItem.reasons)} rule categories triggered` : `觸發 ${getEntryRuleCategoriesCount(selectedItem.reasons)} 類全域規則`}
                            >
                              <ShieldIcon />
                              <span>
                                {lang === 'en'
                                  ? `${getEntryRuleCategoriesCount(selectedItem.reasons)} ${getEntryRuleCategoriesCount(selectedItem.reasons) === 1 ? 'Rule' : 'Rules'}`
                                  : `${getEntryRuleCategoriesCount(selectedItem.reasons)} 條規則`}
                              </span>
                            </span>
                            <span
                              className={styles.redactionCountBadge}
                              title={lang === 'en' ? `${selectedItem.reasons.length} sensitive fields/items redacted` : `共脫敏 ${selectedItem.reasons.length} 個敏感欄位/項目`}
                            >
                              <span>
                                {lang === 'en'
                                  ? `${selectedItem.reasons.length} ${selectedItem.reasons.length === 1 ? 'Redaction' : 'Redactions'}`
                                  : `${selectedItem.reasons.length} 項脫敏`}
                              </span>
                            </span>
                          </>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-md bg-select-bg border border-border-glass text-text-sub font-mono">
                            Clean
                          </span>
                        )}
                      </div>
                      
                      {/* 網址卡牌展示條 (手機版自適應卡片，電腦版單行) */}
                      <div className={`flex items-start sm:items-center gap-2 p-2 sm:p-0 min-w-0 ${styles.urlDisplayCard} sm:bg-transparent sm:border-transparent sm:shadow-none`}>
                        <span
                          className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider flex-shrink-0 mt-0.5 sm:mt-0 ${getMethodBadgeClass(selectedItem.cleaned.request?.method)}`}
                        >
                          {selectedItem.cleaned.request?.method || 'REQ'}
                        </span>
                        <span
                          className="text-xs text-text-sub font-mono break-all sm:truncate select-all flex-1 leading-4 sm:leading-normal"
                          title={selectedItem.cleaned.request?.url}
                        >
                          {selectedItem.cleaned.request?.url}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 電腦版關閉按鈕 */}
                  <button
                    type="button"
                    onClick={() => setSelectedEntryIndex(null)}
                    className="hidden sm:flex text-text-sub hover:text-text-main w-8 h-8 rounded-xl bg-select-bg border border-border-glass items-center justify-center transition-colors text-sm font-bold flex-shrink-0 self-start mt-0.5"
                    aria-label="Close modal"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Modal Sub-Tabs 導航條 */}
              <div className={styles.modalTabs}>
                <button
                  type="button"
                  onClick={(e) => {
                    setModalTab('overview');
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                  className={`${styles.modalTabBtn} ${modalTab === 'overview' ? styles.modalTabBtnActive : ''}`}
                >
                  {t.modalTabOverview}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setModalTab('request');
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                  className={`${styles.modalTabBtn} ${modalTab === 'request' ? styles.modalTabBtnActive : ''}`}
                >
                  {t.modalTabRequest} ({selectedItem.cleaned.request?.headers?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setModalTab('response');
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                  className={`${styles.modalTabBtn} ${modalTab === 'response' ? styles.modalTabBtnActive : ''}`}
                >
                  {t.modalTabResponse} ({selectedItem.cleaned.response?.headers?.length || 0})
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    setModalTab('raw');
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
                  }}
                  className={`${styles.modalTabBtn} ${modalTab === 'raw' ? styles.modalTabBtnActive : ''}`}
                >
                  {t.modalTabRaw}
                </button>
              </div>

              {/* Modal 內容區 (單一流暢滾動，告別巢狀雙重滾動條) */}
              <div className={styles.modalBody}>
                {/* 1. 概覽 TAB */}
                {modalTab === 'overview' && (
                  <div className="space-y-4">
                    {/* 基本資訊卡片 */}
                    <div className="p-4 rounded-xl bg-select-bg border border-border-glass space-y-3">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold uppercase tracking-wider ${getMethodBadgeClass(selectedItem.cleaned.request?.method)}`}
                          >
                            {selectedItem.cleaned.request?.method || 'REQ'}
                          </span>
                          <span className="text-xs text-text-sub font-medium">Request URL:</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => copyText(selectedItem.cleaned.request?.url || '', 'url')}
                          className={styles.copyMiniBtn}
                        >
                          {copiedField === 'url' ? t.copiedSingle : t.modalCopyUrl}
                        </button>
                      </div>
                      
                      <div className={`p-3 font-mono text-xs text-text-main break-all leading-relaxed select-all ${styles.urlDisplayCard}`}>
                        {selectedItem.cleaned.request?.url}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-border-glass text-xs">
                        <div>
                          <div className="text-text-sub mb-0.5">Method:</div>
                          <div className="font-mono font-bold text-text-main">{selectedItem.cleaned.request?.method}</div>
                        </div>
                        <div>
                          <div className="text-text-sub mb-0.5">Status:</div>
                          <div className="font-mono font-bold text-text-main">
                            {selectedItem.cleaned.response?.status} {selectedItem.cleaned.response?.statusText}
                          </div>
                        </div>
                        <div>
                          <div className="text-text-sub mb-0.5">{t.modalTiming}:</div>
                          <div className="font-mono font-bold text-text-main">{Math.round(selectedItem.cleaned.time || 0)} ms</div>
                        </div>
                        <div>
                          <div className="text-text-sub mb-0.5">{t.modalMimeType}:</div>
                          <div className="font-mono text-text-main truncate">
                            {selectedItem.cleaned.response?.content?.mimeType || '-'}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 脫敏觸發詳細審核表 */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-bold text-text-main flex items-center gap-1.5">
                          <ShieldIcon />
                          <span>{t.modalTriggersTitle}</span>
                        </div>
                        <span className="text-xs text-text-sub font-mono">
                          {selectedItem.reasons.length} {selectedItem.reasons.length === 1 ? 'total hit' : 'total hits'}
                        </span>
                      </div>

                      {selectedItem.reasons.length > 0 ? (
                        <>
                          {/* 手機版：直式脫敏審核卡片清單 (零橫向滾動、直覺清晰) */}
                          <div className="block sm:hidden space-y-2.5">
                            {parseStructuredRedactions(selectedItem.reasons).map((item, idx) => (
                              <div key={idx} className="p-3 rounded-xl bg-select-bg border border-border-glass space-y-2">
                                <div className="flex items-center justify-between gap-2">
                                  <span
                                    className={`whitespace-nowrap inline-block ${
                                      item.scopeType === 'post_json'
                                        ? styles.scopeBadgePost
                                        : item.scopeType === 'response_json'
                                        ? styles.scopeBadgeRes
                                        : item.scopeType === 'header'
                                        ? styles.scopeBadgeReq
                                        : item.scopeType === 'cookie'
                                        ? styles.scopeBadgeBoth
                                        : styles.scopeBadgeReq
                                    }`}
                                  >
                                    {item.scope}
                                  </span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${styles.badgeOriginal}`}>
                                    {item.hitCount} {lang === 'en' ? (item.hitCount === 1 ? 'hit' : 'hits') : '處命中'}
                                  </span>
                                </div>
                                <div>
                                  <div className="font-mono font-bold text-text-main text-xs break-all">
                                    {item.fieldPath}
                                  </div>
                                  {item.samplePath && (
                                    <div className="text-xs text-text-sub font-mono truncate mt-0.5 opacity-80">
                                      {lang === 'en' ? 'Sample: ' : '範例：'}{item.samplePath}
                                    </div>
                                  )}
                                </div>
                                <div className="flex items-center justify-between pt-2 border-t border-border-glass text-xs">
                                  <span className="text-text-sub">{item.ruleCategory}</span>
                                  <span className={`inline-flex items-center gap-1 font-medium ${styles.badgeCleaned}`}>
                                    <CheckIcon />
                                    <span>{item.action}</span>
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* 平板與電腦版：標準 5 欄完整審核表格 */}
                          <div className="hidden sm:block rounded-xl border border-border-glass bg-select-bg overflow-hidden">
                            <div className="overflow-x-auto w-full">
                              <table className={`${styles.kvTable} w-full min-w-[560px]`}>
                                <thead>
                                  <tr>
                                    <th className="w-32 min-w-[100px] whitespace-nowrap">{lang === 'en' ? 'Scope / Location' : '來源位置'}</th>
                                    <th className="w-auto min-w-[180px]">{lang === 'en' ? 'Field / Path' : '目標欄位與路徑'}</th>
                                    <th className="w-44 min-w-[130px] whitespace-nowrap">{lang === 'en' ? 'Matched Rule' : '命中規則'}</th>
                                    <th className="w-20 min-w-[70px] text-center whitespace-nowrap">{lang === 'en' ? 'Hits' : '命中次數'}</th>
                                    <th className="w-40 min-w-[130px] text-right whitespace-nowrap">{lang === 'en' ? 'Action' : '處理動作'}</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {parseStructuredRedactions(selectedItem.reasons).map((item, idx) => (
                                    <tr key={idx} className="hover:bg-white/[0.02]">
                                      <td>
                                        <span
                                          className={`whitespace-nowrap inline-block ${
                                            item.scopeType === 'post_json'
                                              ? styles.scopeBadgePost
                                              : item.scopeType === 'response_json'
                                              ? styles.scopeBadgeRes
                                              : item.scopeType === 'header'
                                              ? styles.scopeBadgeReq
                                              : item.scopeType === 'cookie'
                                              ? styles.scopeBadgeBoth
                                              : styles.scopeBadgeReq
                                          }`}
                                        >
                                          {item.scope}
                                        </span>
                                      </td>
                                      <td>
                                        <div className="font-mono font-semibold text-text-main text-xs break-all">
                                          {item.fieldPath}
                                        </div>
                                        {item.samplePath && (
                                          <div className="text-xs text-text-sub font-mono truncate max-w-xs mt-0.5 opacity-80">
                                            {lang === 'en' ? 'Array sample: ' : '陣列範例：'}{item.samplePath}
                                          </div>
                                        )}
                                      </td>
                                      <td>
                                        <span className="text-xs text-text-sub font-medium">
                                          {item.ruleCategory}
                                        </span>
                                      </td>
                                      <td className="text-center font-mono">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${styles.badgeOriginal}`}>
                                          {item.hitCount}
                                        </span>
                                      </td>
                                      <td className="text-right">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium ${styles.badgeCleaned}`}>
                                          <CheckIcon />
                                          <span>{item.action}</span>
                                        </span>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="p-3 rounded-xl bg-select-bg border border-border-glass text-xs text-text-sub">
                          {t.modalNoRedactions}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 2. 請求 (Request) TAB */}
                {modalTab === 'request' && (
                  <div className="space-y-5">
                    {/* Request Query Parameters */}
                    {selectedItem.cleaned.request?.queryString?.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-text-main">{t.modalQueryParamsTitle}</div>
                        
                        {/* 手機版：直式卡片清單 */}
                        <div className="block sm:hidden space-y-2">
                          {selectedItem.cleaned.request.queryString.map((q: any, idx: number) => {
                            const isRedacted = q.value === rules.redactionText;
                            const origQuery = selectedItem.original.request?.queryString?.[idx];
                            const origVal = origQuery?.value ?? q.value;
                            const rowKey = `query_${idx}`;
                            const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                            return (
                              <div key={idx} className="p-3 rounded-xl bg-select-bg border border-border-glass space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono font-bold text-xs text-text-main break-all">{q.name}</span>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {isRedacted && (
                                      <button
                                        type="button"
                                        onClick={() => toggleShowOriginal(rowKey)}
                                        className={`${styles.copyMiniBtn} ${isShowingOriginal ? styles.modalTabBtnActive : ''}`}
                                        title={isShowingOriginal ? (lang === 'en' ? 'Hide original value' : '隱藏原值') : (lang === 'en' ? 'Show original value' : '查看原值')}
                                      >
                                        {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => copyText(isShowingOriginal ? origVal : q.value, rowKey)}
                                      className={styles.copyMiniBtn}
                                    >
                                      {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                                    </button>
                                  </div>
                                </div>
                                <div className="font-mono text-xs">
                                  {isShowingOriginal ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`${styles.badgeOriginal} select-all break-all`}>
                                        {origVal || '(empty)'}
                                      </span>
                                      <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                        {lang === 'en' ? 'Original' : '原值'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className={isRedacted ? styles.redactedValue : 'text-text-main break-all'}>
                                      {q.value}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* 平板與電腦版：表格 */}
                        <div className="hidden sm:block rounded-xl border border-border-glass bg-select-bg overflow-hidden">
                          <div className="overflow-x-auto w-full">
                            <table className={`${styles.kvTable} min-w-[500px]`}>
                              <thead>
                                <tr>
                                  <th className="w-1/4 min-w-[120px]">{t.modalNameCol}</th>
                                  <th className="w-auto">{t.modalValueCol}</th>
                                  <th className="w-28 min-w-[90px] text-right whitespace-nowrap">{t.modalActionCol}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedItem.cleaned.request.queryString.map((q: any, idx: number) => {
                                  const isRedacted = q.value === rules.redactionText;
                                  const origQuery = selectedItem.original.request?.queryString?.[idx];
                                  const origVal = origQuery?.value ?? q.value;
                                  const rowKey = `query_${idx}`;
                                  const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                                  return (
                                    <tr key={idx} className="border-b border-border-glass/40 hover:bg-white/[0.02]">
                                      <td className="font-mono font-medium text-text-main align-middle">{q.name}</td>
                                      <td className="font-mono align-middle">
                                        {isShowingOriginal ? (
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`${styles.badgeOriginal} select-all break-all`}>
                                              {origVal || '(empty)'}
                                            </span>
                                            <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                              {lang === 'en' ? 'Original' : '原值'}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className={isRedacted ? styles.redactedValue : 'text-text-main break-all'}>
                                            {q.value}
                                          </span>
                                        )}
                                      </td>
                                      <td className="w-28 min-w-[90px] text-right whitespace-nowrap align-middle">
                                        <div className="flex items-center justify-end gap-1.5">
                                          {isRedacted && (
                                            <button
                                              type="button"
                                              onClick={() => toggleShowOriginal(rowKey)}
                                              className={`${styles.copyMiniBtn} ${isShowingOriginal ? styles.modalTabBtnActive : ''}`}
                                              title={isShowingOriginal ? (lang === 'en' ? 'Hide original value' : '隱藏原值') : (lang === 'en' ? 'Show original value' : '查看原值')}
                                            >
                                              {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => copyText(isShowingOriginal ? origVal : q.value, rowKey)}
                                            className={styles.copyMiniBtn}
                                          >
                                            {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Request Headers */}
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-text-main">{t.modalReqHeadersTitle}</div>
                      
                      {/* 手機版：直式卡片清單 */}
                      <div className="block sm:hidden space-y-2">
                        {selectedItem.cleaned.request?.headers?.map((h: any, idx: number) => {
                          const isRedacted = h.value === rules.redactionText;
                          const origHeader = selectedItem.original.request?.headers?.find((orig: any) => (orig.name || '').toLowerCase() === (h.name || '').toLowerCase()) || selectedItem.original.request?.headers?.[idx];
                          const origVal = origHeader?.value ?? h.value;
                          const rowKey = `req_h_${idx}`;
                          const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                          return (
                            <div key={idx} className="p-3 rounded-xl bg-select-bg border border-border-glass space-y-1.5">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-mono font-bold text-xs text-text-main break-all">{h.name}</span>
                                <div className="flex items-center gap-1.5 flex-shrink-0">
                                  {isRedacted && (
                                    <button
                                      type="button"
                                      onClick={() => toggleShowOriginal(rowKey)}
                                      className={`${styles.copyMiniBtn} ${isShowingOriginal ? styles.modalTabBtnActive : ''}`}
                                      title={isShowingOriginal ? (lang === 'en' ? 'Hide original value' : '隱藏原值') : (lang === 'en' ? 'Show original value' : '查看原值')}
                                    >
                                      {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => copyText(isShowingOriginal ? origVal : h.value, rowKey)}
                                    className={styles.copyMiniBtn}
                                  >
                                    {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                                  </button>
                                </div>
                              </div>
                              <div className="font-mono text-xs">
                                {isShowingOriginal ? (
                                  <div className="flex items-center gap-1.5 flex-wrap">
                                    <span className={`${styles.badgeOriginal} select-all break-all`}>
                                      {origVal || '(empty)'}
                                    </span>
                                    <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                      {lang === 'en' ? 'Original' : '原值'}
                                    </span>
                                  </div>
                                ) : (
                                  <span className={isRedacted ? styles.redactedValue : 'text-text-main break-all'}>
                                    {h.value}
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        }) || (
                          <div className="p-3 rounded-xl bg-select-bg border border-border-glass text-xs text-text-sub text-center">{t.noHeaders}</div>
                        )}
                      </div>

                      {/* 平板與電腦版：表格 */}
                      <div className="hidden sm:block rounded-xl border border-border-glass bg-select-bg overflow-hidden">
                        <div className="overflow-x-auto w-full">
                          <table className={`${styles.kvTable} min-w-[500px]`}>
                            <thead>
                              <tr>
                                <th className="w-1/4 min-w-[120px]">{t.modalNameCol}</th>
                                <th className="w-auto">{t.modalValueCol}</th>
                                <th className="w-28 min-w-[90px] text-right whitespace-nowrap">{t.modalActionCol}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {selectedItem.cleaned.request?.headers?.map((h: any, idx: number) => {
                                const isRedacted = h.value === rules.redactionText;
                                const origHeader = selectedItem.original.request?.headers?.find((orig: any) => (orig.name || '').toLowerCase() === (h.name || '').toLowerCase()) || selectedItem.original.request?.headers?.[idx];
                                const origVal = origHeader?.value ?? h.value;
                                const rowKey = `req_h_${idx}`;
                                const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                                return (
                                  <tr key={idx} className="border-b border-border-glass/40 hover:bg-white/[0.02]">
                                    <td className="font-mono font-medium text-text-main align-middle">{h.name}</td>
                                    <td className="font-mono align-middle">
                                      {isShowingOriginal ? (
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <span className={`${styles.badgeOriginal} select-all break-all`}>
                                            {origVal || '(empty)'}
                                          </span>
                                          <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                            {lang === 'en' ? 'Original' : '原值'}
                                          </span>
                                        </div>
                                      ) : (
                                        <span className={isRedacted ? styles.redactedValue : 'text-text-main break-all'}>
                                          {h.value}
                                        </span>
                                      )}
                                    </td>
                                    <td className="w-28 min-w-[90px] text-right whitespace-nowrap align-middle">
                                      <div className="flex items-center justify-end gap-1.5">
                                        {isRedacted && (
                                          <button
                                            type="button"
                                            onClick={() => toggleShowOriginal(rowKey)}
                                            className={`${styles.copyMiniBtn} ${isShowingOriginal ? styles.modalTabBtnActive : ''}`}
                                            title={isShowingOriginal ? (lang === 'en' ? 'Hide original value' : '隱藏原值') : (lang === 'en' ? 'Show original value' : '查看原值')}
                                          >
                                            {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                          </button>
                                        )}
                                        <button
                                          type="button"
                                          onClick={() => copyText(isShowingOriginal ? origVal : h.value, rowKey)}
                                          className={styles.copyMiniBtn}
                                        >
                                          {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              }) || (
                                <tr>
                                  <td colSpan={3} className="text-center text-text-sub">{t.noHeaders}</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Request POST Payload */}
                    {selectedItem.cleaned.request?.postData && (() => {
                      const cleanedPostFormatted = formatPayload(
                        selectedItem.cleaned.request?.postData?.text || selectedItem.cleaned.request?.postData
                      );
                      const origPostFormatted = formatPayload(
                        selectedItem.original.request?.postData?.text || selectedItem.original.request?.postData
                      );

                      return (
                        <div className="space-y-3 min-w-0 max-w-full">
                          {/* If Post Params exist (Form Data) */}
                          {selectedItem.cleaned.request.postData.params?.length > 0 && (
                            <div className="space-y-2">
                              <div className="text-xs font-semibold text-text-main">POST Form Data Parameters</div>
                              
                              {/* 手機版：直式卡片清單 */}
                              <div className="block sm:hidden space-y-2">
                                {selectedItem.cleaned.request.postData.params.map((p: any, idx: number) => {
                                  const isRedacted = p.value === rules.redactionText;
                                  const origParam = selectedItem.original.request?.postData?.params?.[idx];
                                  const origVal = origParam?.value ?? p.value;
                                  const rowKey = `post_param_${idx}`;
                                  const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                                  return (
                                    <div key={idx} className="p-3 rounded-xl bg-select-bg border border-border-glass space-y-1.5">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-mono font-bold text-xs text-text-main break-all">{p.name}</span>
                                        <div className="flex items-center gap-1.5 flex-shrink-0">
                                          {isRedacted && (
                                            <button
                                              type="button"
                                              onClick={() => toggleShowOriginal(rowKey)}
                                              className={`${styles.copyMiniBtn} ${isShowingOriginal ? styles.modalTabBtnActive : ''}`}
                                              title={isShowingOriginal ? (lang === 'en' ? 'Hide original value' : '隱藏原值') : (lang === 'en' ? 'Show original value' : '查看原值')}
                                            >
                                              {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => copyText(isShowingOriginal ? origVal : p.value, rowKey)}
                                            className={styles.copyMiniBtn}
                                          >
                                            {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                                          </button>
                                        </div>
                                      </div>
                                      <div className="font-mono text-xs">
                                        {isShowingOriginal ? (
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`${styles.badgeOriginal} select-all break-all`}>
                                              {origVal || '(empty)'}
                                            </span>
                                            <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                              {lang === 'en' ? 'Original' : '原值'}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className={isRedacted ? styles.redactedValue : 'text-text-main break-all'}>
                                            {p.value}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* 平板與電腦版：表格 */}
                              <div className="hidden sm:block rounded-xl border border-border-glass bg-select-bg overflow-hidden">
                                <div className="overflow-x-auto w-full">
                                  <table className={`${styles.kvTable} min-w-[500px]`}>
                                    <thead>
                                      <tr>
                                        <th className="w-1/4 min-w-[120px]">{t.modalNameCol}</th>
                                        <th className="w-auto">{t.modalValueCol}</th>
                                        <th className="w-28 min-w-[90px] text-right whitespace-nowrap">{t.modalActionCol}</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {selectedItem.cleaned.request.postData.params.map((p: any, idx: number) => {
                                        const isRedacted = p.value === rules.redactionText;
                                        const origParam = selectedItem.original.request?.postData?.params?.[idx];
                                        const origVal = origParam?.value ?? p.value;
                                        const rowKey = `post_param_${idx}`;
                                        const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                                        return (
                                          <tr key={idx} className="border-b border-border-glass/40 hover:bg-white/[0.02]">
                                            <td className="font-mono font-medium text-text-main align-middle">{p.name}</td>
                                            <td className="font-mono align-middle">
                                              {isShowingOriginal ? (
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                  <span className={`${styles.badgeOriginal} select-all break-all`}>
                                                    {origVal || '(empty)'}
                                                  </span>
                                                  <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                                    {lang === 'en' ? 'Original' : '原值'}
                                                  </span>
                                                </div>
                                              ) : (
                                                <span className={isRedacted ? styles.redactedValue : 'text-text-main break-all'}>
                                                  {p.value}
                                                </span>
                                              )}
                                            </td>
                                            <td className="w-28 min-w-[90px] text-right whitespace-nowrap align-middle">
                                              <div className="flex items-center justify-end gap-1.5">
                                                {isRedacted && (
                                                  <button
                                                    type="button"
                                                    onClick={() => toggleShowOriginal(rowKey)}
                                                    className={`${styles.copyMiniBtn} ${isShowingOriginal ? styles.modalTabBtnActive : ''}`}
                                                    title={isShowingOriginal ? (lang === 'en' ? 'Hide original value' : '隱藏原值') : (lang === 'en' ? 'Show original value' : '查看原值')}
                                                  >
                                                    {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                                  </button>
                                                )}
                                                <button
                                                  type="button"
                                                  onClick={() => copyText(isShowingOriginal ? origVal : p.value, rowKey)}
                                                  className={styles.copyMiniBtn}
                                                >
                                                  {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        );
                                      })}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Raw or JSON Text */}
                          {(selectedItem.cleaned.request.postData.text || !selectedItem.cleaned.request.postData.params?.length) && (
                            <div className="space-y-2 min-w-0 max-w-full">
                              <div className="flex items-center justify-between gap-3 flex-wrap">
                                <div className="text-xs font-semibold text-text-main flex items-center gap-2">
                                  <span>{t.modalPostDataTitle}</span>
                                  {selectedItem.cleaned.request.postData.mimeType && (
                                    <span className="text-xs font-normal text-text-sub font-mono">
                                      ({selectedItem.cleaned.request.postData.mimeType})
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2">
                                  {/* 檢視模式切換器 */}
                                  <div className="flex items-center gap-1 p-0.5 rounded-lg bg-select-bg border border-border-glass">
                                    <button
                                      type="button"
                                      onClick={() => setPostBodyMode('cleaned')}
                                      className={`${styles.viewModeBtn} ${postBodyMode === 'cleaned' ? styles.viewModeBtnActive : ''}`}
                                    >
                                      {lang === 'en' ? 'Cleaned' : '脫敏後'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPostBodyMode('original')}
                                      className={`${styles.viewModeBtn} ${postBodyMode === 'original' ? styles.viewModeBtnActive : ''}`}
                                    >
                                      {lang === 'en' ? 'Original' : '原始內容'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setPostBodyMode('split')}
                                      className={`${styles.viewModeBtn} ${postBodyMode === 'split' ? styles.viewModeBtnActive : ''}`}
                                    >
                                      {lang === 'en' ? 'Split Diff' : '左右對照'}
                                    </button>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      copyText(
                                        postBodyMode === 'original' ? origPostFormatted : cleanedPostFormatted,
                                        'post_body'
                                      )
                                    }
                                    className={styles.copyMiniBtn}
                                  >
                                    {copiedField === 'post_body' ? t.copiedSingle : t.copyBtnText}
                                  </button>
                                </div>
                              </div>

                              {postBodyMode === 'split' ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0 max-w-full">
                                  <div className="space-y-1 min-w-0">
                                    <div className="text-xs font-semibold flex items-center gap-1">
                                      <span className={styles.badgeOriginal}>
                                        {lang === 'en' ? 'Original Payload:' : '原始酬載內容:'}
                                      </span>
                                    </div>
                                    <div className="rounded-xl border border-border-glass bg-select-bg overflow-hidden min-w-0">
                                      <pre className={`p-3 text-xs text-text-main leading-5 min-h-[320px] max-h-[550px] overflow-y-auto whitespace-pre-wrap break-all ${styles.codeBox}`}>
                                        {origPostFormatted || t.noBody}
                                      </pre>
                                    </div>
                                  </div>
                                  <div className="space-y-1 min-w-0">
                                    <div className="text-xs font-semibold flex items-center gap-1">
                                      <span className={styles.badgeCleaned}>
                                        {lang === 'en' ? 'Cleaned Payload:' : '脫敏後酬載內容:'}
                                      </span>
                                    </div>
                                    <div className="rounded-xl border border-border-glass bg-select-bg overflow-hidden min-w-0">
                                      <pre className={`p-3 text-xs text-text-main leading-5 min-h-[320px] max-h-[550px] overflow-y-auto whitespace-pre-wrap break-all ${styles.codeBox}`}>
                                        {renderHighlightedCode(
                                          cleanedPostFormatted || t.noBody,
                                          rules.redactionText
                                        )}
                                      </pre>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="rounded-xl border border-border-glass bg-select-bg overflow-hidden min-w-0 max-w-full">
                                  <pre className={`p-4 text-xs text-text-main leading-5 min-h-[320px] max-h-[550px] overflow-y-auto whitespace-pre-wrap break-all ${styles.codeBox}`}>
                                    {postBodyMode === 'original'
                                      ? (origPostFormatted || t.noBody)
                                      : renderHighlightedCode(
                                          cleanedPostFormatted || t.noBody,
                                          rules.redactionText
                                        )}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* 3. 回應 (Response) TAB */}
                {modalTab === 'response' && (() => {
                  const cleanedResFormatted = formatPayload(selectedItem.cleaned.response?.content?.text);
                  const origResFormatted = formatPayload(selectedItem.original.response?.content?.text);

                  return (
                    <div className="space-y-5 min-w-0 max-w-full">
                      {/* Response Headers */}
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-text-main">{t.modalResHeadersTitle}</div>
                        
                        {/* 手機版：直式卡片清單 */}
                        <div className="block sm:hidden space-y-2">
                          {selectedItem.cleaned.response?.headers?.map((h: any, idx: number) => {
                            const isRedacted = h.value === rules.redactionText;
                            const origHeader = selectedItem.original.response?.headers?.find((orig: any) => (orig.name || '').toLowerCase() === (h.name || '').toLowerCase()) || selectedItem.original.response?.headers?.[idx];
                            const origVal = origHeader?.value ?? h.value;
                            const rowKey = `res_h_${idx}`;
                            const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                            return (
                              <div key={idx} className="p-3 rounded-xl bg-select-bg border border-border-glass space-y-1.5">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="font-mono font-bold text-xs text-text-main break-all">{h.name}</span>
                                  <div className="flex items-center gap-1.5 flex-shrink-0">
                                    {isRedacted && (
                                      <button
                                        type="button"
                                        onClick={() => toggleShowOriginal(rowKey)}
                                        className={`${styles.copyMiniBtn} ${isShowingOriginal ? styles.modalTabBtnActive : ''}`}
                                        title={isShowingOriginal ? (lang === 'en' ? 'Hide original value' : '隱藏原值') : (lang === 'en' ? 'Show original value' : '查看原值')}
                                      >
                                        {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      onClick={() => copyText(isShowingOriginal ? origVal : h.value, rowKey)}
                                      className={styles.copyMiniBtn}
                                    >
                                      {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                                    </button>
                                  </div>
                                </div>
                                <div className="font-mono text-xs">
                                  {isShowingOriginal ? (
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className={`${styles.badgeOriginal} select-all break-all`}>
                                        {origVal || '(empty)'}
                                      </span>
                                      <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                        {lang === 'en' ? 'Original' : '原值'}
                                      </span>
                                    </div>
                                  ) : (
                                    <span className={isRedacted ? styles.redactedValue : 'text-text-main break-all'}>
                                      {h.value}
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          }) || (
                            <div className="p-3 rounded-xl bg-select-bg border border-border-glass text-xs text-text-sub text-center">{t.noHeaders}</div>
                          )}
                        </div>

                        {/* 平板與電腦版：表格 */}
                        <div className="hidden sm:block rounded-xl border border-border-glass bg-select-bg overflow-hidden">
                          <div className="overflow-x-auto w-full">
                            <table className={`${styles.kvTable} min-w-[500px]`}>
                              <thead>
                                <tr>
                                  <th className="w-1/4 min-w-[120px]">{t.modalNameCol}</th>
                                  <th className="w-auto">{t.modalValueCol}</th>
                                  <th className="w-28 min-w-[90px] text-right whitespace-nowrap">{t.modalActionCol}</th>
                                </tr>
                              </thead>
                              <tbody>
                                {selectedItem.cleaned.response?.headers?.map((h: any, idx: number) => {
                                  const isRedacted = h.value === rules.redactionText;
                                  const origHeader = selectedItem.original.response?.headers?.find((orig: any) => (orig.name || '').toLowerCase() === (h.name || '').toLowerCase()) || selectedItem.original.response?.headers?.[idx];
                                  const origVal = origHeader?.value ?? h.value;
                                  const rowKey = `res_h_${idx}`;
                                  const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                                  return (
                                    <tr key={idx} className="border-b border-border-glass/40 hover:bg-white/[0.02]">
                                      <td className="font-mono font-medium text-text-main align-middle">{h.name}</td>
                                      <td className="font-mono align-middle">
                                        {isShowingOriginal ? (
                                          <div className="flex items-center gap-1.5 flex-wrap">
                                            <span className={`${styles.badgeOriginal} select-all break-all`}>
                                              {origVal || '(empty)'}
                                            </span>
                                            <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                                              {lang === 'en' ? 'Original' : '原值'}
                                            </span>
                                          </div>
                                        ) : (
                                          <span className={isRedacted ? styles.redactedValue : 'text-text-main break-all'}>
                                            {h.value}
                                          </span>
                                        )}
                                      </td>
                                      <td className="w-28 min-w-[90px] text-right whitespace-nowrap align-middle">
                                        <div className="flex items-center justify-end gap-1.5">
                                          {isRedacted && (
                                            <button
                                              type="button"
                                              onClick={() => toggleShowOriginal(rowKey)}
                                              className={`${styles.copyMiniBtn} ${isShowingOriginal ? styles.modalTabBtnActive : ''}`}
                                              title={isShowingOriginal ? (lang === 'en' ? 'Hide original value' : '隱藏原值') : (lang === 'en' ? 'Show original value' : '查看原值')}
                                            >
                                              {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                                            </button>
                                          )}
                                          <button
                                            type="button"
                                            onClick={() => copyText(isShowingOriginal ? origVal : h.value, rowKey)}
                                            className={styles.copyMiniBtn}
                                          >
                                            {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                }) || (
                                  <tr>
                                    <td colSpan={3} className="text-center text-text-sub">{t.noHeaders}</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>

                      {/* Response Body */}
                      <div className="space-y-2 min-w-0 max-w-full">
                        <div className="flex items-center justify-between gap-3 flex-wrap">
                          <div className="text-xs font-semibold text-text-main flex items-center gap-2">
                            <span>{t.modalResBodyTitle}</span>
                            {selectedItem.cleaned.response?.content?.mimeType && (
                              <span className="text-xs font-normal text-text-sub font-mono">
                                ({selectedItem.cleaned.response.content.mimeType})
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {/* 檢視模式切換器 */}
                            <div className="flex items-center gap-1 p-0.5 rounded-lg bg-select-bg border border-border-glass">
                              <button
                                type="button"
                                onClick={() => setResBodyMode('cleaned')}
                                className={`${styles.viewModeBtn} ${resBodyMode === 'cleaned' ? styles.viewModeBtnActive : ''}`}
                              >
                                {lang === 'en' ? 'Cleaned' : '脫敏後'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setResBodyMode('original')}
                                className={`${styles.viewModeBtn} ${resBodyMode === 'original' ? styles.viewModeBtnActive : ''}`}
                              >
                                {lang === 'en' ? 'Original' : '原始內容'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setResBodyMode('split')}
                                className={`${styles.viewModeBtn} ${resBodyMode === 'split' ? styles.viewModeBtnActive : ''}`}
                              >
                                {lang === 'en' ? 'Split Diff' : '左右對照'}
                              </button>
                            </div>
                            {selectedItem.cleaned.response?.content?.text && (
                              <button
                                type="button"
                                onClick={() =>
                                  copyText(
                                    resBodyMode === 'original' ? origResFormatted : cleanedResFormatted,
                                    'res_body'
                                  )
                                }
                                className={styles.copyMiniBtn}
                              >
                                {copiedField === 'res_body' ? t.copiedSingle : t.copyBtnText}
                              </button>
                            )}
                          </div>
                        </div>

                        {resBodyMode === 'split' ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 min-w-0 max-w-full">
                            <div className="space-y-1 min-w-0">
                              <div className="text-xs font-semibold flex items-center gap-1">
                                <span className={styles.badgeOriginal}>
                                  {lang === 'en' ? 'Original Response Body:' : '原始回應內文:'}
                                </span>
                              </div>
                              <div className="rounded-xl border border-border-glass bg-select-bg overflow-hidden min-w-0">
                                <pre className={`p-3 text-xs text-text-main leading-5 min-h-[320px] max-h-[550px] overflow-y-auto whitespace-pre-wrap break-all ${styles.codeBox}`}>
                                  {origResFormatted || t.noBody}
                                </pre>
                              </div>
                            </div>
                            <div className="space-y-1 min-w-0">
                              <div className="text-xs font-semibold flex items-center gap-1">
                                <span className={styles.badgeCleaned}>
                                  {lang === 'en' ? 'Cleaned Response Body:' : '脫敏後回應內文:'}
                                </span>
                              </div>
                              <div className="rounded-xl border border-border-glass bg-select-bg overflow-hidden min-w-0">
                                <pre className={`p-3 text-xs text-text-main leading-5 min-h-[320px] max-h-[550px] overflow-y-auto whitespace-pre-wrap break-all ${styles.codeBox}`}>
                                  {renderHighlightedCode(
                                    cleanedResFormatted || t.noBody,
                                    rules.redactionText
                                  )}
                                </pre>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="rounded-xl border border-border-glass bg-select-bg overflow-hidden min-w-0 max-w-full">
                            <pre className={`p-4 text-xs text-text-main leading-5 min-h-[320px] max-h-[550px] overflow-y-auto whitespace-pre-wrap break-all ${styles.codeBox}`}>
                              {resBodyMode === 'original'
                                ? (origResFormatted || t.noBody)
                                : renderHighlightedCode(
                                    cleanedResFormatted || t.noBody,
                                    rules.redactionText
                                  )}
                            </pre>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}

                {/* 4. 原始 JSON 對照 TAB */}
                {modalTab === 'raw' && (
                  <div className="flex flex-col min-h-0 space-y-3 min-w-0 max-w-full h-full min-h-[480px]">
                    <div className="flex items-center justify-between gap-3 flex-wrap flex-shrink-0">
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setModalRawMode('cleaned')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            modalRawMode === 'cleaned' ? styles.modalTabBtnActive : styles.secondaryBtn
                          }`}
                        >
                          {t.modalCleanedVersion}
                        </button>
                        <button
                          type="button"
                          onClick={() => setModalRawMode('original')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                            modalRawMode === 'original' ? styles.modalTabBtnActive : styles.secondaryBtn
                          }`}
                        >
                          {t.modalOriginalVersion}
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          const targetObj = modalRawMode === 'cleaned' ? selectedItem.cleaned : selectedItem.original;
                          copyText(JSON.stringify(targetObj, null, 2), 'raw_entry_json');
                        }}
                        className={styles.copyMiniBtn}
                      >
                        {copiedField === 'raw_entry_json' ? t.copiedSingle : t.modalCopyEntryJson}
                      </button>
                    </div>

                    <div className="flex-1 rounded-xl border border-border-glass bg-select-bg overflow-hidden min-w-0 max-w-full flex flex-col min-h-[400px]">
                      <pre className={`p-4 text-xs text-text-main leading-5 flex-1 overflow-y-auto whitespace-pre-wrap break-all ${styles.codeBox}`}>
                        {renderHighlightedCode(
                          JSON.stringify(modalRawMode === 'cleaned' ? selectedItem.cleaned : selectedItem.original, null, 2),
                          rules.redactionText
                        )}
                      </pre>
                    </div>
                  </div>
                )}
              </div>

              {/* Modal 底部 Footer 控制列 */}
              <div className={styles.modalFooter}>
                <button
                  type="button"
                  onClick={() => copyText(JSON.stringify(selectedItem.cleaned, null, 2), 'footer_copy')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium ${styles.secondaryBtn}`}
                >
                  <CopyIcon />
                  <span>{copiedField === 'footer_copy' ? t.copiedToast : t.modalCopyEntryJson}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedEntryIndex(null)}
                  className={`px-4 py-1.5 rounded-xl text-xs font-medium ${styles.accentBtn}`}
                >
                  {t.modalClose}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 常見問題 FAQ 區塊 */}
      <FaqSection
        title={t.faqTitle}
        subtitle={t.faqSubtitle}
        items={t.faqItems}
        accentColor="#06b6d4"
      />
    </ToolLayout>
  );
}

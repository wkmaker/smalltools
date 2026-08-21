'use client';

import { useState, useRef, useCallback, useEffect, useId } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './url.module.css';

type UrlMode = 'component' | 'uri';

interface QueryParam {
  id: number;
  key: string;
  value: string;
}

interface UrlMeta {
  protocol: string;
  host: string;
  pathname: string;
  hash: string;
}

interface Props {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
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

function smartEncodeURI(input: string): string {
  const trimText = input.trim();
  const qIndex = trimText.indexOf('?');
  if (qIndex === -1) return encodeURI(trimText);

  const basePart = trimText.substring(0, qIndex);
  const queryPart = trimText.substring(qIndex + 1);
  const encodedBase = encodeURI(basePart);
  if (!queryPart) return encodedBase + '?';

  let hashPart = '';
  let paramsStr = queryPart;
  const hashIndex = queryPart.indexOf('#');
  if (hashIndex !== -1) {
    paramsStr = queryPart.substring(0, hashIndex);
    hashPart = queryPart.substring(hashIndex);
  }

  const encodedPairs = paramsStr.split('&').map(pair => {
    if (!pair) return '';
    const eqIndex = pair.indexOf('=');
    if (eqIndex === -1) return encodeURIComponent(pair);
    return encodeURIComponent(pair.substring(0, eqIndex)) + '=' + encodeURIComponent(pair.substring(eqIndex + 1));
  });

  const encodedHash = hashPart ? '#' + encodeURI(hashPart.substring(1)) : '';
  return encodedBase + '?' + encodedPairs.filter(Boolean).join('&') + encodedHash;
}

function parseUrlStructure(rawText: string): {
  meta: UrlMeta;
  params: QueryParam[];
  isFullUrl: boolean;
  urlObj: URL | null;
} {
  if (!rawText.trim()) return { meta: { protocol: '-', host: '-', pathname: '-', hash: '-' }, params: [], isFullUrl: false, urlObj: null };

  let urlToParse = rawText.trim();
  let isFullUrl = false;

  if (/^[a-zA-Z0-9+.-]+:\/\//i.test(urlToParse)) {
    isFullUrl = true;
  } else {
    urlToParse = 'http://temporary-domain.com/' + urlToParse.replace(/^\/+/, '');
  }

  try {
    const urlObj = new URL(urlToParse);
    const params: QueryParam[] = [];
    let id = 0;
    urlObj.searchParams.forEach((value, key) => {
      params.push({ id: id++, key, value });
    });

    return {
      meta: {
        protocol: isFullUrl ? urlObj.protocol : '(Relative)',
        host: isFullUrl ? urlObj.host : '(None)',
        pathname: urlObj.pathname,
        hash: urlObj.hash || '-',
      },
      params,
      isFullUrl,
      urlObj,
    };
  } catch {
    return { meta: { protocol: '-', host: '-', pathname: '-', hash: '-' }, params: [], isFullUrl: false, urlObj: null };
  }
}

let _nextParamId = 100;

export default function UrlEncoderClient({ lang = 'zh-TW' }: Props) {
  const t = TRANSLATIONS[lang];

  const plainTextId = useId();
  const encodedTextId = useId();
  const modeSelectId = useId();
  const spacePlusId = useId();

  const [plainText, setPlainText] = useState('');
  const [encodedText, setEncodedText] = useState('');
  const [mode, setMode] = useState<UrlMode>('uri');
  const [spacePlus, setSpacePlus] = useState(false);
  const [encodedError, setEncodedError] = useState(false);
  const [urlMeta, setUrlMeta] = useState<UrlMeta | null>(null);
  const [params, setParams] = useState<QueryParam[]>([]);
  const [showParser, setShowParser] = useState(false);
  const [toast, setToast] = useState<{ msg: string; show: boolean }>({ msg: '', show: false });

  const isCalculating = useRef(false);
  const activeUrlObjRef = useRef<URL | null>(null);
  const isFullUrlRef = useRef(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#ff7300');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(255, 115, 0, 0.6)');
  }, []);

  const showToast = useCallback((msg: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ msg, show: true });
    toastTimer.current = setTimeout(() => setToast(t => ({ ...t, show: false })), 2500);
  }, []);

  const encodeValue = useCallback((text: string, m: UrlMode, sp: boolean): string => {
    if (!text) return '';
    let encoded = m === 'component' ? encodeURIComponent(text) : smartEncodeURI(text);
    if (sp) encoded = encoded.replace(/%20/g, '+');
    return encoded;
  }, []);

  const parseAndUpdate = useCallback((text: string) => {
    if (!text.trim()) { setShowParser(false); setUrlMeta(null); setParams([]); return; }
    const { meta, params: p, isFullUrl, urlObj } = parseUrlStructure(text);
    if (urlObj) {
      activeUrlObjRef.current = urlObj;
      isFullUrlRef.current = isFullUrl;
      setUrlMeta(meta);
      setParams(p);
      setShowParser(true);
    } else {
      setShowParser(false);
    }
  }, []);

  const handlePlainChange = (val: string) => {
    if (isCalculating.current) return;
    isCalculating.current = true;
    setPlainText(val);
    try {
      const encoded = encodeValue(val, mode, spacePlus);
      setEncodedText(encoded);
      setEncodedError(false);
    } catch { setEncodedText(''); }
    isCalculating.current = false;
    parseAndUpdate(val);
  };

  const handleEncodedChange = (val: string) => {
    if (isCalculating.current) return;
    isCalculating.current = true;
    setEncodedText(val);
    if (!val) { setPlainText(''); setEncodedError(false); setShowParser(false); isCalculating.current = false; return; }
    try {
      let str = spacePlus ? val.replace(/\+/g, '%20') : val;
      const decoded = decodeURIComponent(str);
      setPlainText(decoded);
      setEncodedError(false);
      isCalculating.current = false;
      parseAndUpdate(decoded);
    } catch { setEncodedError(true); isCalculating.current = false; }
  };

  useEffect(() => {
    if (plainText) {
      const enc = encodeValue(plainText, mode, spacePlus);
      setEncodedText(enc);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, spacePlus]);

  const loadExample = () => {
    const ex = 'https://tools.cjkuo.net/search/v1?q=Hello World!&category=developer&debug=true#result-hash';
    handlePlainChange(ex);
  };

  const clearPanel = () => {
    setPlainText(''); setEncodedText(''); setEncodedError(false); setShowParser(false);
  };

  const copyValue = (val: string) => {
    if (!val) { showToast(t.toastNoContent); return; }
    navigator.clipboard.writeText(val).then(() => showToast(t.toastCopied)).catch(() => showToast(t.toastCopyFailed));
  };

  const onParamChange = (id: number, field: 'key' | 'value', val: string) => {
    const newParams = params.map(p => p.id === id ? { ...p, [field]: val } : p);
    setParams(newParams);
    rebuildFromParams(newParams);
  };

  const addParam = () => {
    const newP: QueryParam = { id: _nextParamId++, key: '', value: '' };
    const newParams = [...params, newP];
    setParams(newParams);
    rebuildFromParams(newParams);
  };

  const deleteParam = (id: number) => {
    const newParams = params.filter(p => p.id !== id);
    setParams(newParams);
    rebuildFromParams(newParams);
  };

  const rebuildFromParams = (p: QueryParam[]) => {
    if (!activeUrlObjRef.current) return;
    const activeUrl = activeUrlObjRef.current;
    const queryArr = p.filter(r => r.key.trim()).map(r => r.key + '=' + r.value);
    const searchStr = queryArr.length > 0 ? '?' + queryArr.join('&') : '';
    const newUrl = isFullUrlRef.current
      ? activeUrl.protocol + '//' + activeUrl.host + activeUrl.pathname + searchStr + activeUrl.hash
      : activeUrl.pathname.substring(1) + searchStr + activeUrl.hash;

    isCalculating.current = true;
    setPlainText(newUrl);
    try {
      const encoded = encodeValue(newUrl, mode, spacePlus);
      setEncodedText(encoded);
      setEncodedError(false);
    } catch { setEncodedText(''); }
    isCalculating.current = false;

    try {
      const urlToParse = isFullUrlRef.current
        ? newUrl
        : 'http://temporary-domain.com/' + newUrl.replace(/^\/+/, '');
      activeUrlObjRef.current = new URL(urlToParse);
    } catch {}
  };

  return (
    <>
      <ToolLayout
        title={t.title}
        subtitle={t.subtitle}
        description={t.description}
        accentColor="#ff7300"
        accentGlow="rgba(255,115,0,0.6)"
        extraHeaderControls={
          <Link
            href={t.langToggleUrl}
            className="relative inline-flex items-center justify-center gap-1.5 h-[42px] px-3.5 text-xs font-semibold rounded-xl bg-white/[.06] border border-white/10 text-text-sub hover:text-text-main backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-[var(--theme-color,#ff7300)] hover:shadow-[0_0_12px_var(--theme-glow,rgba(255,115,0,0.4))] select-none"
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>{t.langToggleLabel}</span>
          </Link>
        }
      >
        <div className={styles.mainLayout}>

          <div className={styles.panelsGrid}>
            {/* Plain Text Panel */}
            <div className={`${styles.panelContainer} ${encodedError ? styles.errorState : ''}`}>
              <div className={styles.panelHeader}>
                <label htmlFor={plainTextId} className="text-sm font-semibold text-text-main flex items-center gap-2 cursor-pointer">
                  <span className="w-1.5 h-4 bg-[var(--theme-color,#ff7300)] rounded-full shadow-[0_0_8px_var(--theme-color,#ff7300)] inline-block flex-shrink-0" />
                  {t.plainLabel}
                </label>
              </div>
              <div className={styles.textAreaWrapper}>
                <textarea
                  id={plainTextId}
                  className={styles.customTextarea}
                  placeholder={t.placeholderPlain}
                  value={plainText}
                  onChange={e => handlePlainChange(e.target.value)}
                />
              </div>
              <div className={styles.panelFooter}>
                <div className={styles.controlGroup}>
                  <label htmlFor={modeSelectId} className="text-sm font-medium text-text-sub flex-shrink-0">
                    {t.modeLabel}
                  </label>
                  <select id={modeSelectId} className={styles.selectStyle} value={mode} onChange={e => setMode(e.target.value as UrlMode)}>
                    <option value="uri">{t.modeUri}</option>
                    <option value="component">{t.modeComponent}</option>
                  </select>
                </div>
                <div className={styles.btnGroup}>
                  <button type="button" onClick={loadExample} className={styles.techBtn}>{t.exampleBtn}</button>
                  <button type="button" onClick={clearPanel} className={styles.techBtn}>{t.clearBtn}</button>
                  <button type="button" onClick={() => copyValue(plainText)} className={`${styles.techBtn} ${styles.techBtnPrimary}`}>{t.copyBtn}</button>
                </div>
              </div>
            </div>

            {/* URL Encoded Panel */}
            <div className={`${styles.panelContainer} ${encodedError ? styles.errorState : ''}`}>
              <div className={styles.panelHeader}>
                <label htmlFor={encodedTextId} className="text-sm font-semibold text-text-main flex items-center gap-2 cursor-pointer">
                  <span className="w-1.5 h-4 bg-[var(--theme-color,#ff7300)] rounded-full shadow-[0_0_8px_var(--theme-color,#ff7300)] inline-block flex-shrink-0" />
                  {t.encodedLabel}
                </label>
                {encodedError && (
                  <div className={styles.errorMsg}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
                    </svg>
                    {t.invalidFormat}
                  </div>
                )}
              </div>
              <div className={styles.textAreaWrapper}>
                <textarea
                  id={encodedTextId}
                  className={styles.customTextarea}
                  placeholder={t.placeholderEncoded}
                  value={encodedText}
                  onChange={e => handleEncodedChange(e.target.value)}
                />
              </div>
              <div className={styles.panelFooter}>
                <div className={styles.controlGroup}>
                  <label htmlFor={spacePlusId} className={styles.checkboxContainer}>
                    <input id={spacePlusId} type="checkbox" checked={spacePlus} onChange={e => setSpacePlus(e.target.checked)} />
                    <span className={styles.checkmark} />
                    <span>{t.spacePlusLabel}</span>
                  </label>
                </div>
                <div className={styles.btnGroup}>
                  <button type="button" onClick={clearPanel} className={styles.techBtn}>{t.clearBtn}</button>
                  <button type="button" onClick={() => copyValue(encodedText)} className={`${styles.techBtn} ${styles.techBtnPrimary}`}>{t.copyBtn}</button>
                </div>
              </div>
            </div>
          </div>

          {/* URL Parser Section */}
          {showParser && urlMeta && (
            <div className={styles.urlParserSection}>
              <div className="text-base font-semibold text-text-main flex items-center gap-2">
                <span className="w-1.5 h-4 bg-[var(--theme-color,#ff7300)] rounded-full shadow-[0_0_8px_var(--theme-color,#ff7300)] inline-block flex-shrink-0" />
                {t.parserTitle}
              </div>

              <div className={styles.urlMetaGrid}>
                {[
                  { label: t.protocolLabel, value: urlMeta.protocol },
                  { label: t.hostLabel, value: urlMeta.host },
                  { label: t.pathLabel, value: urlMeta.pathname },
                  { label: t.hashLabel, value: urlMeta.hash },
                ].map(item => (
                  <div key={item.label} className={styles.metaItem}>
                    <span className="text-xs text-text-sub uppercase tracking-[0.5px] font-semibold">{item.label}</span>
                    <div className={styles.metaValueWrapper}>
                      <span className={styles.metaValue}>{item.value}</span>
                      <button type="button" onClick={() => copyValue(item.value === '-' || item.value === '(無)' || item.value === '(None)' || item.value === '(Relative)' ? '' : item.value)}
                        className={styles.metaCopyBtn} title="Copy">
                        <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.paramsTableWrapper}>
                <table className={styles.paramsTable}>
                  <thead>
                    <tr>
                      <th style={{ width: '35%' }} className="p-3 text-sm font-semibold text-text-sub">{t.tableKeyHeader}</th>
                      <th style={{ width: '45%' }} className="p-3 text-sm font-semibold text-text-sub">{t.tableValueHeader}</th>
                      <th style={{ width: '20%', textAlign: 'center' }} className="p-3 text-sm font-semibold text-text-sub">{t.tableActionsHeader}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {params.map(p => (
                      <tr key={p.id}>
                        <td><input type="text" className={styles.tableInput} value={p.key} onChange={e => onParamChange(p.id, 'key', e.target.value)} aria-label="Query Key" /></td>
                        <td><input type="text" className={styles.tableInput} value={p.value} onChange={e => onParamChange(p.id, 'value', e.target.value)} aria-label="Query Value" /></td>
                        <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                          <button type="button" className={styles.techBtn} onClick={() => copyValue(p.value)} title="Copy Value" style={{ display: 'inline-flex', padding: '0.3rem 0.6rem' }}>
                            <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" /></svg>
                          </button>
                          <button type="button" className={styles.techBtn} onClick={() => deleteParam(p.id)} title="Delete Param" style={{ display: 'inline-flex', padding: '0.3rem 0.6rem', marginLeft: '6px' }}>
                            <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" /></svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className={styles.tableFooter}>
                  <span className="text-sm font-medium text-text-sub">{t.paramCount(params.filter(p => p.key.trim()).length)}</span>
                  <button type="button" onClick={addParam} className={`${styles.techBtn} ${styles.techBtnPrimary}`} style={{ padding: '0.4rem 0.8rem' }}>
                    <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" style={{ marginRight: '2px' }}><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" /></svg>
                    {t.addParamBtn}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 常見問題 FAQ 區塊 */}
          <div className="mt-8">
            <FaqSection
              title={t.faqTitle}
              subtitle={t.faqSubtitle}
              items={t.faqItems}
              accentColor="#ff7300"
            />
          </div>
        </div>
      </ToolLayout>

      {/* Toast Notification */}
      <div
        className={`fixed bottom-8 right-8 flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl z-[100] pointer-events-none
          bg-surface-glass border border-border-glass backdrop-blur-[16px] text-text-main shadow-lg
          transition-all duration-300 ${toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="#ff7300">
          <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
        </svg>
        {toast.msg}
      </div>
    </>
  );
}

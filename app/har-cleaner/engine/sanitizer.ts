import {
  SanitizeRules,
  SanitizedStats,
  DetectedHeaderItem,
  ParsedRedactionGroup,
  HarEntryAnalysis,
  SanitizationResult,
} from '../types';
import {
  DEFAULT_SENSITIVE_KEYS,
  PAYMENT_KEYS,
  TRACKER_DOMAINS,
} from '../constants';

// 正則表達式特徵 (深度掃描)
const JWT_REGEX = /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.?[A-Za-z0-9_.+/=-]*/g;
const BEARER_REGEX = /Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi;
const AWS_KEY_REGEX = /(AKIA|ASIA)[0-9A-Z]{16}/g;
const STRIPE_KEY_REGEX = /sk_live_[0-9a-zA-Z]{24,}/g;
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,7}\b/g;
// 信用卡卡號正則 (支援 13~19 位標準卡號，可含破折號或空格)
const CREDIT_CARD_REGEX = /\b(?:4[0-9]{12}(?:[0-9]{3})?|5[1-5][0-9]{14}|2[2-7][0-9]{14}|3[47][0-9]{13}|3(?:0[0-5]|[68][0-9])[0-9]{11}|6(?:011|5[0-9]{2})[0-9]{12}|(?:2131|1800|35\d{3})\d{11}|(?:\d{4}[ -]){3}\d{4})\b/g;

// 鍵名匹配檢查
export function isMatchingKey(key: string, sensitiveList: string[]): boolean {
  const lower = key.toLowerCase();
  if (lower.startsWith(':')) return false; // 忽略 HTTP/2 虛擬標頭 (:authority, :path 等)

  return sensitiveList.some((target) => {
    if (lower === target) return true;
    const tokens = lower.split(/[-_.:/\\]+/);
    return tokens.includes(target);
  });
}

// 輔助函式：格式化 JSON 或字串
export function formatPayload(raw: any): string {
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

// 計算一筆請求觸發的不同規則大項總數
export function getEntryRuleCategoriesCount(reasons: string[]): number {
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
}

// 將脫敏原因陣列解析聚合為結構化審核清單
export function parseStructuredRedactions(
  reasons: string[],
  lang: 'zh-TW' | 'en' = 'zh-TW'
): ParsedRedactionGroup[] {
  if (!reasons || reasons.length === 0) return [];

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
      scope = r.startsWith('Res')
        ? lang === 'en' ? 'Response Header' : '回應標頭'
        : lang === 'en' ? 'Request Header' : '請求標頭';
      fieldPath = r
        .replace(/^(Res|Req)\s+(Payment\s+)?Header(\s+\(.*\))?:\s*/, '')
        .replace(/^Regex Match in Header\s*/, '')
        .trim();
      if (r.includes('Custom:')) ruleCategory = lang === 'en' ? 'Custom Keyword' : '自訂敏感關鍵字';
      else if (r.includes('PCI-DSS') || r.includes('Payment'))
        ruleCategory = lang === 'en' ? 'PCI-DSS Payment Header' : '信用卡支付機密標頭';
      else if (r.includes('Cookie Header')) {
        ruleCategory = 'Cookie Session Header';
        scopeType = 'cookie';
      } else if (r.includes('Regex Match'))
        ruleCategory = lang === 'en' ? 'Regex in Header' : '標頭正則特徵命中';
      else ruleCategory = lang === 'en' ? 'Authentication Header' : '身分認證機密標頭';
    } else if (r.includes('Cookie')) {
      scopeType = 'cookie';
      scope = r.startsWith('Res')
        ? lang === 'en' ? 'Response Cookie' : '回應 Cookie'
        : lang === 'en' ? 'Request Cookie' : '請求 Cookie';
      fieldPath = r.replace(/^(Res|Req)\s+Cookie(\s+\(.*\))?:\s*/, '').trim();
      if (r.includes('Custom:')) ruleCategory = lang === 'en' ? 'Custom Cookie' : '自訂 Cookie 敏感詞';
      else if (r.includes('PCI-DSS')) ruleCategory = lang === 'en' ? 'PCI-DSS Cookie Secret' : '支付 Cookie 憑證';
      else ruleCategory = lang === 'en' ? 'Session Cookie' : '身分認證 Cookie 憑證';
    } else if (r.includes('Query')) {
      scopeType = 'query';
      scope = lang === 'en' ? 'Query Parameter' : 'URL 查詢參數';
      fieldPath = r
        .replace(/^Query Param(\s+\(.*\))?:\s*/, '')
        .replace(/^Regex Match in Query:\s*/, '')
        .trim();
      if (r.includes('Custom:')) ruleCategory = lang === 'en' ? 'Custom Query' : '自訂 Query 敏感詞';
      else if (r.includes('PCI-DSS'))
        ruleCategory = lang === 'en' ? 'PCI-DSS Payment Query' : '支付查詢參數 (PCI-DSS)';
      else if (r.includes('Regex Match'))
        ruleCategory = lang === 'en' ? 'Query Regex Match' : 'Query 正則特徵命中';
      else ruleCategory = lang === 'en' ? 'Sensitive Query Token' : 'URL 敏感查詢參數';
    } else if (r.includes('Post Param')) {
      scope = lang === 'en' ? 'POST Param' : 'POST 表單參數';
      scopeType = 'post_json';
      fieldPath = r
        .replace(/^Post Param(\s+\(.*\))?:\s*/, '')
        .replace(/^Regex Match in Post Param\s*/, '')
        .trim();
      if (r.includes('Custom:')) ruleCategory = lang === 'en' ? 'Custom Param' : '自訂表單敏感詞';
      else if (r.includes('PCI-DSS'))
        ruleCategory = lang === 'en' ? 'PCI-DSS Post Secret' : '支付表單欄位 (PCI-DSS)';
      else if (r.includes('Regex Match'))
        ruleCategory = lang === 'en' ? 'Param Regex Match' : '表單內容正則命中';
      else ruleCategory = lang === 'en' ? 'Sensitive Form Field' : 'POST 機密表單欄位';
    } else if (r.includes('Media Stripped')) {
      scope = lang === 'en' ? 'Response Media' : '回應媒體二進位';
      scopeType = 'media';
      fieldPath = r.replace(/^Media Stripped\s*\(/, '').replace(/\)$/, '').trim();
      ruleCategory = lang === 'en' ? 'Heavy Media Binary' : '肥大媒體二進位檔案';
      action = lang === 'en' ? 'Stripped to [MEDIA_BINARY_STRIPPED]' : '已剔除二進位內文瘦身';
    }

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
}

// 核心脫敏運算函式 (支援非同步時間片 Yielding)
export async function sanitizeHarAsync(
  rawHarData: any,
  originalFileSize: number,
  rules: SanitizeRules,
  excludedHeaders: Record<string, boolean> = {},
  lang: 'zh-TW' | 'en' = 'zh-TW',
  onProgress?: (progressPercent: number) => void
): Promise<SanitizationResult> {
  if (!rawHarData?.log?.entries || !Array.isArray(rawHarData.log.entries)) {
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
      },
      entriesAnalysis: [],
      detectedHeaders: [],
    };
  }

  const redactVal = rules.redactionText || '[REDACTED]';
  const customKeys = rules.customKeywords
    .split(/[,;\n]+/)
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  const rawEntries = rawHarData.log.entries;
  const totalEntries = rawEntries.length;

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

  // 敏感標頭 Map (Single-Pass 彙整)
  const headerMap = new Map<
    string,
    {
      name: string;
      normalizedName: string;
      hasReq: boolean;
      hasRes: boolean;
      count: number;
      matchedRule: string;
      sampleValue: string;
    }
  >();

  const inspectAndCollectHeader = (
    h: { name: string; value: string },
    isResponse: boolean
  ) => {
    if (!h || !h.name) return;
    const name = h.name.trim();
    const norm = name.toLowerCase();
    if (norm.startsWith(':')) return;
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

    if (rules.authHeaders && (isAuthHeaderName || isMatchingKey(norm, DEFAULT_SENSITIVE_KEYS))) {
      matchedRule = lang === 'en' ? 'Auth Header' : '身分認證標頭';
    } else if (rules.cookies && isCookieHeaderName) {
      matchedRule = lang === 'en' ? 'Cookie / Session' : 'Cookie / Session 憑證';
    } else if (rules.creditCard && isMatchingKey(norm, PAYMENT_KEYS)) {
      matchedRule = lang === 'en' ? 'Credit Card / Payment (PCI-DSS)' : '信用卡與支付機密 (PCI-DSS)';
    } else if (customKeys.length > 0 && isMatchingKey(norm, customKeys)) {
      const matchedCustom = customKeys.find(
        (k) => norm === k || norm.split(/[-_.:/\\]+/).includes(k)
      );
      matchedRule =
        lang === 'en'
          ? `Custom Keyword (${matchedCustom || 'Custom'})`
          : `自訂敏感欄位 (${matchedCustom || '自訂'})`;
    } else if (rules.regexDeep) {
      if (/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.?[A-Za-z0-9_.+/=-]*/.test(val)) {
        matchedRule = lang === 'en' ? 'Deep Regex (JWT Token)' : '正則深度掃描 (JWT Token)';
      } else if (/Bearer\s+[A-Za-z0-9\-._~+/]+=*/i.test(val)) {
        matchedRule = lang === 'en' ? 'Deep Regex (Bearer Token)' : '正則深度掃描 (Bearer Token)';
      } else if (/(AKIA|ASIA)[0-9A-Z]{16}/.test(val)) {
        matchedRule = lang === 'en' ? 'Deep Regex (AWS Key)' : '正則深度掃描 (AWS Key)';
      } else if (/sk_live_[0-9a-zA-Z]{24,}/.test(val)) {
        matchedRule = lang === 'en' ? 'Deep Regex (Stripe Key)' : '正則深度掃描 (Stripe Key)';
      }
    }

    if (matchedRule) {
      if (!headerMap.has(norm)) {
        headerMap.set(norm, {
          name,
          normalizedName: norm,
          hasReq: !isResponse,
          hasRes: isResponse,
          count: 1,
          matchedRule,
          sampleValue: val,
        });
      } else {
        const item = headerMap.get(norm)!;
        item.count += 1;
        if (isResponse) item.hasRes = true;
        else item.hasReq = true;
        if (!item.sampleValue && val) item.sampleValue = val;
      }
    }
  };

  const sanitizeStringWithRegex = (str: string): { result: string; matches: number } => {
    if (typeof str !== 'string') return { result: str, matches: 0 };
    let matchCount = 0;
    let text = str;

    if (rules.creditCard) {
      text = text.replace(CREDIT_CARD_REGEX, () => {
        matchCount++;
        totalRedactedCreditCards++;
        return redactVal;
      });
    }

    if (rules.regexDeep) {
      text = text.replace(JWT_REGEX, () => {
        matchCount++;
        totalRedactedRegex++;
        return redactVal;
      });
      text = text.replace(BEARER_REGEX, () => {
        matchCount++;
        totalRedactedRegex++;
        return `Bearer ${redactVal}`;
      });
      text = text.replace(AWS_KEY_REGEX, () => {
        matchCount++;
        totalRedactedRegex++;
        return redactVal;
      });
      text = text.replace(STRIPE_KEY_REGEX, () => {
        matchCount++;
        totalRedactedRegex++;
        return redactVal;
      });
      text = text.replace(EMAIL_REGEX, () => {
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
      } else if (rules.creditCard && isMatchingKey(key, PAYMENT_KEYS)) {
        newObj[key] = redactVal;
        changeCount++;
        totalRedactedCreditCards++;
        if (fieldReasons) {
          fieldReasons.push(`${prefix} (PCI-DSS: ${key})`);
        }
      } else if (rules.postData && isMatchingKey(key, DEFAULT_SENSITIVE_KEYS)) {
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
  const entriesAnalysis: HarEntryAnalysis[] = [];

  const CHUNK_SIZE = 150; // 每 150 筆 entry 讓出主執行緒時間片

  for (let i = 0; i < totalEntries; i++) {
    // 釋放時間片
    if (i > 0 && i % CHUNK_SIZE === 0) {
      if (onProgress) {
        onProgress(Math.round((i / totalEntries) * 100));
      }
      await new Promise((resolve) => setTimeout(resolve, 0));
    }

    const entry = rawEntries[i];
    const reasons: string[] = [];
    const reqUrl = entry.request?.url || '';

    // 1. 檢查並收集標頭
    if (Array.isArray(entry.request?.headers)) {
      entry.request.headers.forEach((h: any) => inspectAndCollectHeader(h, false));
    }
    if (Array.isArray(entry.response?.headers)) {
      entry.response.headers.forEach((h: any) => inspectAndCollectHeader(h, true));
    }

    // 2. 追蹤過濾 (Trackers)
    if (rules.stripTrackers && TRACKER_DOMAINS.some((d) => reqUrl.includes(d))) {
      totalStrippedTrackers++;
      continue;
    }

    // 3. 建立深拷貝進行脫敏
    const clonedEntry = JSON.parse(JSON.stringify(entry));

    // A. 脫敏 Headers
    const sanitizeHeaders = (headers: any[], isResponse = false) => {
      if (!Array.isArray(headers)) return;
      for (const h of headers) {
        const nameLower = (h.name || '').toLowerCase();
        if (nameLower.startsWith(':')) continue;

        if (excludedHeaders[nameLower]) {
          continue;
        }

        if (customKeys.length > 0 && isMatchingKey(nameLower, customKeys)) {
          h.value = redactVal;
          totalRedactedCustomKeywords++;
          reasons.push(`${isResponse ? 'Res' : 'Req'} Header (Custom: ${nameLower})`);
        } else if (rules.creditCard && isMatchingKey(nameLower, PAYMENT_KEYS)) {
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
            isMatchingKey(nameLower, DEFAULT_SENSITIVE_KEYS))
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

    // B. 脫敏 Cookies
    if (rules.cookies || customKeys.length > 0 || rules.creditCard) {
      if (Array.isArray(clonedEntry.request?.cookies)) {
        for (const c of clonedEntry.request.cookies) {
          if (customKeys.length > 0 && isMatchingKey(c.name, customKeys)) {
            c.value = redactVal;
            totalRedactedCustomKeywords++;
            reasons.push(`Req Cookie (Custom: ${c.name})`);
          } else if (rules.creditCard && isMatchingKey(c.name, PAYMENT_KEYS)) {
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
          } else if (rules.creditCard && isMatchingKey(c.name, PAYMENT_KEYS)) {
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

    // C. 脫敏 Query Parameters
    if (rules.queryParams || customKeys.length > 0 || rules.creditCard || rules.regexDeep) {
      const hasQueryStringArray =
        Array.isArray(clonedEntry.request?.queryString) && clonedEntry.request.queryString.length > 0;

      if (hasQueryStringArray) {
        for (const q of clonedEntry.request.queryString) {
          if (customKeys.length > 0 && isMatchingKey(q.name, customKeys)) {
            q.value = redactVal;
            totalRedactedCustomKeywords++;
            reasons.push(`Query Param (Custom: ${q.name})`);
          } else if (rules.creditCard && isMatchingKey(q.name, PAYMENT_KEYS)) {
            q.value = redactVal;
            totalRedactedCreditCards++;
            reasons.push(`Query Param (PCI-DSS Payment: ${q.name})`);
          } else if (rules.queryParams && isMatchingKey(q.name, DEFAULT_SENSITIVE_KEYS)) {
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
          } else if (rules.creditCard && isMatchingKey(key, PAYMENT_KEYS)) {
            parsedUrl.searchParams.set(key, redactVal);
            if (!hasQueryStringArray) {
              totalRedactedCreditCards++;
              reasons.push(`Query Param (PCI-DSS Payment: ${key})`);
            }
            urlChanged = true;
          } else if (rules.queryParams && isMatchingKey(key, DEFAULT_SENSITIVE_KEYS)) {
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

    // D. 脫敏 POST Payload
    if (clonedEntry.request?.postData) {
      const pd = clonedEntry.request.postData;
      const hasParams = Array.isArray(pd.params) && pd.params.length > 0;

      if (hasParams) {
        for (const p of pd.params) {
          if (customKeys.length > 0 && isMatchingKey(p.name, customKeys)) {
            p.value = redactVal;
            totalRedactedCustomKeywords++;
            reasons.push(`Post Param (Custom: ${p.name})`);
          } else if (rules.creditCard && isMatchingKey(p.name, PAYMENT_KEYS)) {
            p.value = redactVal;
            totalRedactedCreditCards++;
            reasons.push(`Post Param (PCI-DSS Payment: ${p.name})`);
          } else if (rules.postData && isMatchingKey(p.name, DEFAULT_SENSITIVE_KEYS)) {
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

      if (
        !hasParams &&
        typeof pd.text === 'string' &&
        pd.text &&
        (rules.postData || rules.creditCard || customKeys.length > 0 || rules.regexDeep)
      ) {
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

    // E. 脫敏 Response Body & 大檔媒體瘦身
    if (clonedEntry.response?.content) {
      const content = clonedEntry.response.content;
      const mimeType = (content.mimeType || '').toLowerCase();
      const hasLargeBinary =
        (content.encoding === 'base64' && (content.size || 0) > 10240) ||
        (content.text && content.text.length > 2000 && content.encoding === 'base64');
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
      } else if (
        typeof content.text === 'string' &&
        content.text &&
        (rules.postData || rules.creditCard || customKeys.length > 0 || rules.regexDeep)
      ) {
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

  const detectedHeaders: DetectedHeaderItem[] = Array.from(headerMap.values()).map((item) => ({
    name: item.name,
    normalizedName: item.normalizedName,
    scope: item.hasReq && item.hasRes ? 'both' : item.hasRes ? 'response' : 'request',
    count: item.count,
    matchedRule: item.matchedRule,
    sampleValue: item.sampleValue,
  }));

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
    detectedHeaders,
  };
}

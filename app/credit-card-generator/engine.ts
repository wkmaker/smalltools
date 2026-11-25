/**
 * app/credit-card-generator/engine.ts
 * ──────────────────────────────────────────────────────────────
 * 測試信用卡號產生與 Luhn (Mod 10) 驗證純函數核心引擎
 * - 零副作用、純記憶體 CSPRNG 運算
 * - 產出號碼僅符合 ISO/IEC 7812 Luhn 檢核公式，並非真實有效信用卡
 */

export type CardNetwork = 'visa' | 'mastercard' | 'jcb' | 'amex' | 'unionpay' | 'discover';

export interface NetworkSpec {
  id: CardNetwork;
  nameZh: string;
  nameEn: string;
  shortLabel: string;
  length: number;
  cvvLength: number;
  prefixHint: string;
  generatePrefix: () => string;
  matches: (digits: string) => boolean;
}

export interface LuhnStep {
  position: number; // 1-based from left
  digit: number;
  doubled: boolean;
  rawDoubled: number;
  adjusted: number;
}

export interface GeneratedCardItem {
  number: string; // 純數字
  formatted: string; // 依卡別分段格式化
  network: CardNetwork | 'custom';
  networkNameZh: string;
  networkNameEn: string;
  expiryMonth: string; // MM
  expiryYear: string; // YY
  expiry: string; // MM/YY
  cvv: string;
  checkDigit: number;
  luhnSum: number;
  steps: LuhnStep[];
}

export type CardValidationErrorCode =
  | 'EMPTY'
  | 'NON_NUMERIC'
  | 'INVALID_LENGTH'
  | 'INVALID_CHECKSUM';

export interface CardValidationResult {
  input: string;
  normalized: string;
  formatted: string;
  valid: boolean;
  errorCode?: CardValidationErrorCode;
  network: CardNetwork | 'unknown';
  networkNameZh: string;
  networkNameEn: string;
  checkDigit?: number;
  expectedCheckDigit?: number;
  luhnSum?: number;
  remainder?: number;
  steps?: LuhnStep[];
}

export interface GenerateCardOptions {
  networks?: readonly CardNetwork[];
  customBin?: string;
}

export interface SandboxCardItem {
  provider: string;
  scenarioZh: string;
  scenarioEn: string;
  network: CardNetwork;
  number: string;
  formatted: string;
}

export const MAX_BATCH_COUNT = 100;
export const BATCH_COUNT_PRESETS = [1, 5, 10, 20, 50] as const;

/**
 * 產生 [0, max) 區間的無偏差密碼學安全隨機整數
 */
export function secureRandomInt(max: number): number {
  if (!Number.isInteger(max) || max <= 0) {
    throw new RangeError('max must be a positive integer');
  }
  if (max === 1) return 0;

  const limit = Math.floor(0x100000000 / max) * max;
  const buf = new Uint32Array(1);
  let val = 0;
  do {
    globalThis.crypto.getRandomValues(buf);
    val = buf[0];
  } while (val >= limit);
  return val % max;
}

function randomIntRange(min: number, max: number): number {
  return min + secureRandomInt(max - min + 1);
}

export const NETWORK_SPECS: readonly NetworkSpec[] = [
  {
    id: 'visa',
    nameZh: 'Visa',
    nameEn: 'Visa',
    shortLabel: 'VISA',
    length: 16,
    cvvLength: 3,
    prefixHint: '4',
    generatePrefix: () => '4',
    matches: (d) => d.startsWith('4'),
  },
  {
    id: 'mastercard',
    nameZh: 'Mastercard',
    nameEn: 'Mastercard',
    shortLabel: 'MC',
    length: 16,
    cvvLength: 3,
    prefixHint: '51–55 / 2221–2720',
    generatePrefix: () =>
      secureRandomInt(2) === 0
        ? String(randomIntRange(51, 55))
        : String(randomIntRange(2221, 2720)),
    matches: (d) => {
      if (d.length >= 2) {
        const p2 = Number(d.slice(0, 2));
        if (p2 >= 51 && p2 <= 55) return true;
      }
      if (d.length >= 4) {
        const p4 = Number(d.slice(0, 4));
        if (p4 >= 2221 && p4 <= 2720) return true;
      }
      return false;
    },
  },
  {
    id: 'jcb',
    nameZh: 'JCB',
    nameEn: 'JCB',
    shortLabel: 'JCB',
    length: 16,
    cvvLength: 3,
    prefixHint: '3528–3589',
    generatePrefix: () => String(randomIntRange(3528, 3589)),
    matches: (d) => {
      if (d.length < 4) return false;
      const p4 = Number(d.slice(0, 4));
      return p4 >= 3528 && p4 <= 3589;
    },
  },
  {
    id: 'amex',
    nameZh: 'American Express',
    nameEn: 'American Express',
    shortLabel: 'AMEX',
    length: 15,
    cvvLength: 4,
    prefixHint: '34 / 37 (15 碼)',
    generatePrefix: () => (secureRandomInt(2) === 0 ? '34' : '37'),
    matches: (d) => d.startsWith('34') || d.startsWith('37'),
  },
  {
    id: 'unionpay',
    nameZh: 'UnionPay 銀聯',
    nameEn: 'UnionPay',
    shortLabel: 'CUP',
    length: 16,
    cvvLength: 3,
    prefixHint: '62',
    generatePrefix: () => '62',
    matches: (d) => d.startsWith('62'),
  },
  {
    id: 'discover',
    nameZh: 'Discover',
    nameEn: 'Discover',
    shortLabel: 'DISC',
    length: 16,
    cvvLength: 3,
    prefixHint: '6011 / 644–649 / 65',
    generatePrefix: () => {
      const pick = secureRandomInt(3);
      if (pick === 0) return '6011';
      if (pick === 1) return String(randomIntRange(644, 649));
      return '65';
    },
    matches: (d) => {
      if (d.startsWith('6011') || d.startsWith('65')) return true;
      if (d.length >= 3) {
        const p3 = Number(d.slice(0, 3));
        if (p3 >= 644 && p3 <= 649) return true;
      }
      return false;
    },
  },
];

export const NETWORK_MAP: ReadonlyMap<CardNetwork, NetworkSpec> = new Map(
  NETWORK_SPECS.map((s) => [s.id, s])
);

/** 常見金流商官方公開沙盒測試卡號（僅供開發串接測試，無法於真實消費使用） */
export const SANDBOX_CARDS: readonly SandboxCardItem[] = [
  {
    provider: 'Stripe',
    scenarioZh: '一般付款成功（Visa）',
    scenarioEn: 'Standard Payment Succeeds (Visa)',
    network: 'visa',
    number: '4242424242424242',
    formatted: '4242 4242 4242 4242',
  },
  {
    provider: 'Stripe',
    scenarioZh: '一般付款成功（Mastercard）',
    scenarioEn: 'Standard Payment Succeeds (Mastercard)',
    network: 'mastercard',
    number: '5555555555554444',
    formatted: '5555 5555 5555 4444',
  },
  {
    provider: 'Stripe',
    scenarioZh: '一般付款成功（American Express）',
    scenarioEn: 'Standard Payment Succeeds (Amex)',
    network: 'amex',
    number: '378282246310005',
    formatted: '3782 822463 10005',
  },
  {
    provider: 'Stripe',
    scenarioZh: '3D Secure 驗證必要（Visa）',
    scenarioEn: '3D Secure Authentication Required (Visa)',
    network: 'visa',
    number: '4000002500003155',
    formatted: '4000 0025 0000 3155',
  },
  {
    provider: 'Stripe',
    scenarioZh: '付款被拒（一般拒絕）',
    scenarioEn: 'Card Declined (Generic)',
    network: 'visa',
    number: '4000000000000002',
    formatted: '4000 0000 0000 0002',
  },
  {
    provider: 'Stripe',
    scenarioZh: '餘額不足拒絕',
    scenarioEn: 'Declined — Insufficient Funds',
    network: 'visa',
    number: '4000000000009995',
    formatted: '4000 0000 0000 9995',
  },
  {
    provider: 'Stripe',
    scenarioZh: '卡片已過期拒絕',
    scenarioEn: 'Declined — Expired Card',
    network: 'visa',
    number: '4000000000000069',
    formatted: '4000 0000 0000 0069',
  },
  {
    provider: 'Stripe',
    scenarioZh: '一般付款成功（Discover）',
    scenarioEn: 'Standard Payment Succeeds (Discover)',
    network: 'discover',
    number: '6011111111111117',
    formatted: '6011 1111 1111 1117',
  },
];

/**
 * 依據卡號與發卡組織格式化顯示（Amex 4-6-5，其餘每 4 碼一組）
 */
export function formatCardNumber(digits: string, network?: CardNetwork | 'custom' | 'unknown'): string {
  const clean = digits.replace(/\D/g, '');
  if (!clean) return '';
  const isAmex = network === 'amex' || (clean.length === 15 && (clean.startsWith('34') || clean.startsWith('37')));
  if (isAmex) {
    return [clean.slice(0, 4), clean.slice(4, 10), clean.slice(10, 15)].filter(Boolean).join(' ');
  }
  return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
}

/**
 * 根據卡號前綴辨識發卡組織
 */
export function detectCardNetwork(digits: string): NetworkSpec | null {
  for (const spec of NETWORK_SPECS) {
    if (spec.matches(digits)) return spec;
  }
  return null;
}

/**
 * 計算完整卡號（含最後一碼檢查碼）的 Luhn (Mod 10) 逐步明細與總和
 */
export function computeLuhnBreakdown(digits: string): { steps: LuhnStep[]; luhnSum: number } {
  const len = digits.length;
  const steps: LuhnStep[] = [];
  let luhnSum = 0;

  for (let i = 0; i < len; i++) {
    const digit = Number(digits[i]);
    // 由右往左數，從檢查碼（最右側 index = len - 1）算起第 2、4、6... 位需加倍
    const fromRight = len - 1 - i;
    const doubled = fromRight % 2 === 1;
    const rawDoubled = doubled ? digit * 2 : digit;
    const adjusted = rawDoubled > 9 ? rawDoubled - 9 : rawDoubled;
    luhnSum += adjusted;
    steps.push({
      position: i + 1,
      digit,
      doubled,
      rawDoubled,
      adjusted,
    });
  }

  return { steps, luhnSum };
}

/**
 * 給定不含檢查碼的前置數字，算出符合 Luhn 演算法的最後一碼檢查碼 (0-9)
 */
export function computeLuhnCheckDigit(payloadWithoutCheckDigit: string): number {
  if (!/^\d+$/.test(payloadWithoutCheckDigit)) {
    throw new RangeError('payloadWithoutCheckDigit must contain digits only');
  }
  const { luhnSum } = computeLuhnBreakdown(`${payloadWithoutCheckDigit}0`);
  return (10 - (luhnSum % 10)) % 10;
}

/**
 * 清洗使用者自訂 BIN 前綴（僅保留數字，最多 12 碼）
 */
export function sanitizeCustomBin(raw?: string): string {
  if (!raw) return '';
  return raw.replace(/\D/g, '').slice(0, 12);
}

/**
 * 產生單筆符合 Luhn 檢核公式的隨機測試卡號（非真實信用卡）
 */
export function generateTestCard(
  options: GenerateCardOptions = {},
  now: Date = new Date()
): GeneratedCardItem {
  const cleanBin = sanitizeCustomBin(options.customBin);

  let prefix: string;
  let targetLength: number;
  let cvvLength: number;
  let network: CardNetwork | 'custom';
  let networkNameZh: string;
  let networkNameEn: string;

  if (cleanBin.length > 0) {
    const detected = detectCardNetwork(cleanBin);
    prefix = cleanBin;
    if (detected) {
      network = detected.id;
      networkNameZh = detected.nameZh;
      networkNameEn = detected.nameEn;
      targetLength = detected.length;
      cvvLength = detected.cvvLength;
    } else {
      network = 'custom';
      networkNameZh = '自訂前綴';
      networkNameEn = 'Custom BIN';
      targetLength = 16;
      cvvLength = 3;
    }
  } else {
    const validSelected = (options.networks ?? [])
      .map((id) => NETWORK_MAP.get(id))
      .filter((s): s is NetworkSpec => Boolean(s));
    const pool = validSelected.length > 0 ? validSelected : NETWORK_SPECS;
    const spec = pool[secureRandomInt(pool.length)];

    network = spec.id;
    networkNameZh = spec.nameZh;
    networkNameEn = spec.nameEn;
    prefix = spec.generatePrefix();
    targetLength = spec.length;
    cvvLength = spec.cvvLength;
  }

  // 補齊中間隨機數字（保留最後 1 碼給 Luhn 檢查碼）
  const bodyLen = Math.max(targetLength - 1 - prefix.length, 0);
  let payload = prefix.slice(0, targetLength - 1);
  for (let i = 0; i < bodyLen; i++) {
    payload += String(secureRandomInt(10));
  }

  const checkDigit = computeLuhnCheckDigit(payload);
  const fullNumber = `${payload}${checkDigit}`;
  const { steps, luhnSum } = computeLuhnBreakdown(fullNumber);

  // 模擬未來 1~5 年有效期限與隨機安全碼
  const monthNum = randomIntRange(1, 12);
  const yearNum = (now.getFullYear() + randomIntRange(1, 5)) % 100;
  const expiryMonth = String(monthNum).padStart(2, '0');
  const expiryYear = String(yearNum).padStart(2, '0');

  let cvv = '';
  for (let i = 0; i < cvvLength; i++) {
    cvv += String(secureRandomInt(10));
  }

  return {
    number: fullNumber,
    formatted: formatCardNumber(fullNumber, network),
    network,
    networkNameZh,
    networkNameEn,
    expiryMonth,
    expiryYear,
    expiry: `${expiryMonth}/${expiryYear}`,
    cvv,
    checkDigit,
    luhnSum,
    steps,
  };
}

/**
 * 批次產生多筆不重複測試卡號
 */
export function generateTestCardBatch(
  options: GenerateCardOptions,
  count: number,
  now: Date = new Date()
): GeneratedCardItem[] {
  const safeCount = Math.min(Math.max(Math.floor(Number.isFinite(count) ? count : 1), 1), MAX_BATCH_COUNT);
  const results: GeneratedCardItem[] = [];
  const seen = new Set<string>();
  const maxAttempts = safeCount * 5;
  let attempts = 0;

  while (results.length < safeCount && attempts < maxAttempts) {
    attempts++;
    const item = generateTestCard(options, now);
    if (!seen.has(item.number)) {
      seen.add(item.number);
      results.push(item);
    }
  }

  return results;
}

/**
 * 驗證單筆信用卡號（支援含空白或連字號輸入）
 */
export function validateCardNumber(rawInput: string): CardValidationResult {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return {
      input: rawInput,
      normalized: '',
      formatted: '',
      valid: false,
      errorCode: 'EMPTY',
      network: 'unknown',
      networkNameZh: '未知',
      networkNameEn: 'Unknown',
    };
  }

  // 僅允許數字、空白與連字號
  if (/[^\d\s-]/.test(trimmed)) {
    const cleaned = trimmed.replace(/\D/g, '');
    return {
      input: rawInput,
      normalized: trimmed,
      formatted: cleaned ? formatCardNumber(cleaned) : trimmed,
      valid: false,
      errorCode: 'NON_NUMERIC',
      network: 'unknown',
      networkNameZh: '未知',
      networkNameEn: 'Unknown',
    };
  }

  const normalized = trimmed.replace(/[\s-]/g, '');
  const detected = detectCardNetwork(normalized);
  const network: CardNetwork | 'unknown' = detected ? detected.id : 'unknown';
  const networkNameZh = detected ? detected.nameZh : '其他 / 未知組織';
  const networkNameEn = detected ? detected.nameEn : 'Other / Unknown';
  const formatted = formatCardNumber(normalized, network);

  // ISO/IEC 7812 卡號長度介於 13~19 碼（常見為 15 或 16 碼）
  if (normalized.length < 13 || normalized.length > 19) {
    return {
      input: rawInput,
      normalized,
      formatted,
      valid: false,
      errorCode: 'INVALID_LENGTH',
      network,
      networkNameZh,
      networkNameEn,
    };
  }

  const { steps, luhnSum } = computeLuhnBreakdown(normalized);
  const remainder = luhnSum % 10;
  const valid = remainder === 0;
  const actualCheckDigit = Number(normalized[normalized.length - 1]);
  const expectedCheckDigit = computeLuhnCheckDigit(normalized.slice(0, -1));

  return {
    input: rawInput,
    normalized,
    formatted,
    valid,
    errorCode: valid ? undefined : 'INVALID_CHECKSUM',
    network,
    networkNameZh,
    networkNameEn,
    checkDigit: actualCheckDigit,
    expectedCheckDigit,
    luhnSum,
    remainder,
    steps,
  };
}

/**
 * 批次驗證多行卡號
 */
export function validateCardBatch(rawMultiline: string, maxLines = 200): CardValidationResult[] {
  const lines = rawMultiline
    .split(/[\r\n,;]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, maxLines);

  return lines.map((line) => validateCardNumber(line));
}

/**
 * 批次匯出 TXT / CSV / JSON
 */
export function formatCardBatchExport(
  items: readonly GeneratedCardItem[],
  format: 'txt' | 'csv' | 'json',
  options: { lang: 'zh-TW' | 'en'; includeSpaces: boolean; includeMeta: boolean }
): string {
  const { lang, includeSpaces, includeMeta } = options;

  if (format === 'txt') {
    return items
      .map((item) => {
        const num = includeSpaces ? item.formatted : item.number;
        return includeMeta ? `${num} | ${item.expiry} | ${item.cvv}` : num;
      })
      .join('\n');
  }

  if (format === 'csv') {
    const header =
      lang === 'en'
        ? includeMeta
          ? 'cardNumber,network,expiry,cvv,note'
          : 'cardNumber,network,note'
        : includeMeta
          ? '測試卡號,發卡組織,模擬效期,模擬安全碼,備註'
          : '測試卡號,發卡組織,備註';
    const note = lang === 'en' ? 'Random Luhn test number only (not a real card)' : '隨機 Luhn 測試卡號（非實際可用卡片）';

    const rows = items.map((item) => {
      const num = includeSpaces ? item.formatted : item.number;
      const net = lang === 'en' ? item.networkNameEn : item.networkNameZh;
      return includeMeta
        ? `"${num}","${net}","${item.expiry}","${item.cvv}","${note}"`
        : `"${num}","${net}","${note}"`;
    });
    return [header, ...rows].join('\n');
  }

  return JSON.stringify(
    items.map((item) => ({
      cardNumber: includeSpaces ? item.formatted : item.number,
      network: lang === 'en' ? item.networkNameEn : item.networkNameZh,
      ...(includeMeta ? { expiry: item.expiry, cvv: item.cvv } : {}),
      testOnly: true,
    })),
    null,
    2
  );
}

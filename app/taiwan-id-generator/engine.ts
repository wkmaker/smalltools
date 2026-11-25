/**
 * app/taiwan-id-generator/engine.ts
 * ──────────────────────────────────────────────────────────────
 * 台灣身分證字號 & 外來人口統一證號（新式 / 舊式）純函數核心引擎
 * - 零副作用、可獨立於 Node.js 與瀏覽器環境執行
 * - 使用 Web Crypto CSPRNG (crypto.getRandomValues) 搭配 Rejection Sampling
 */

export type IdType = 'national' | 'new-resident' | 'old-resident';
export type GenderOption = 'random' | 'male' | 'female';
export type ResolvedGender = 'male' | 'female';

export interface CountyInfo {
  code: string;
  numericValue: number;
  nameZh: string;
  nameEn: string;
  legacy?: boolean;
}

export interface WeightStep {
  label: string;
  rawChar: string;
  digit: number;
  weight: number;
  product: number;
}

export interface GeneratedIdItem {
  id: string;
  type: IdType;
  countyCode: string;
  countyNameZh: string;
  countyNameEn: string;
  countyLegacy: boolean;
  gender: ResolvedGender;
  genderCode: string;
  checkDigit: number;
  weightedSum: number;
  steps: WeightStep[];
}

export type ValidationErrorCode =
  | 'EMPTY'
  | 'INVALID_LENGTH'
  | 'INVALID_COUNTY'
  | 'INVALID_FORMAT'
  | 'INVALID_CHECKSUM';

export interface ValidationResult {
  input: string;
  normalized: string;
  valid: boolean;
  errorCode?: ValidationErrorCode;
  expectedCheckDigit?: number;
  type?: IdType;
  countyCode?: string;
  countyNameZh?: string;
  countyNameEn?: string;
  countyLegacy?: boolean;
  gender?: ResolvedGender;
  genderCode?: string;
  checkDigit?: number;
  weightedSum?: number;
  remainder?: number;
  steps?: WeightStep[];
}

export interface GenerateOptions {
  type: IdType;
  countyCode?: string; // 單選相容：'RANDOM' 或 'A'~'Z'
  countyCodes?: readonly string[]; // 多選縣市清單；空陣列或未傳時代表全部隨機
  gender: GenderOption;
  includeLegacyCounties?: boolean;
}

export const WEIGHTS = [1, 9, 8, 7, 6, 5, 4, 3, 2, 1, 1] as const;

export const MAX_BATCH_COUNT = 100;
export const BATCH_COUNT_PRESETS = [1, 5, 10, 20, 50] as const;

/**
 * 26 個台灣縣市字母對照表（依內政部戶政司公告數值）
 * 順序依字母 A-Z 排列，含 4 個已併入直轄市之停發代碼（L, R, S, Y）
 */
export const COUNTY_LIST: readonly CountyInfo[] = [
  { code: 'A', numericValue: 10, nameZh: '臺北市', nameEn: 'Taipei City' },
  { code: 'B', numericValue: 11, nameZh: '臺中市', nameEn: 'Taichung City' },
  { code: 'C', numericValue: 12, nameZh: '基隆市', nameEn: 'Keelung City' },
  { code: 'D', numericValue: 13, nameZh: '臺南市', nameEn: 'Tainan City' },
  { code: 'E', numericValue: 14, nameZh: '高雄市', nameEn: 'Kaohsiung City' },
  { code: 'F', numericValue: 15, nameZh: '新北市', nameEn: 'New Taipei City' },
  { code: 'G', numericValue: 16, nameZh: '宜蘭縣', nameEn: 'Yilan County' },
  { code: 'H', numericValue: 17, nameZh: '桃園市', nameEn: 'Taoyuan City' },
  { code: 'I', numericValue: 34, nameZh: '嘉義市', nameEn: 'Chiayi City' },
  { code: 'J', numericValue: 18, nameZh: '新竹縣', nameEn: 'Hsinchu County' },
  { code: 'K', numericValue: 19, nameZh: '苗栗縣', nameEn: 'Miaoli County' },
  { code: 'L', numericValue: 20, nameZh: '臺中縣（已停發）', nameEn: 'Taichung County (Legacy)', legacy: true },
  { code: 'M', numericValue: 21, nameZh: '南投縣', nameEn: 'Nantou County' },
  { code: 'N', numericValue: 22, nameZh: '彰化縣', nameEn: 'Changhua County' },
  { code: 'O', numericValue: 35, nameZh: '新竹市', nameEn: 'Hsinchu City' },
  { code: 'P', numericValue: 23, nameZh: '雲林縣', nameEn: 'Yunlin County' },
  { code: 'Q', numericValue: 24, nameZh: '嘉義縣', nameEn: 'Chiayi County' },
  { code: 'R', numericValue: 25, nameZh: '臺南縣（已停發）', nameEn: 'Tainan County (Legacy)', legacy: true },
  { code: 'S', numericValue: 26, nameZh: '高雄縣（已停發）', nameEn: 'Kaohsiung County (Legacy)', legacy: true },
  { code: 'T', numericValue: 27, nameZh: '屏東縣', nameEn: 'Pingtung County' },
  { code: 'U', numericValue: 28, nameZh: '花蓮縣', nameEn: 'Hualien County' },
  { code: 'V', numericValue: 29, nameZh: '臺東縣', nameEn: 'Taitung County' },
  { code: 'W', numericValue: 32, nameZh: '金門縣', nameEn: 'Kinmen County' },
  { code: 'X', numericValue: 30, nameZh: '澎湖縣', nameEn: 'Penghu County' },
  { code: 'Y', numericValue: 31, nameZh: '陽明山管理局（已停發）', nameEn: 'Yangmingshan (Legacy)', legacy: true },
  { code: 'Z', numericValue: 33, nameZh: '連江縣', nameEn: 'Lienchiang County' },
];

export const COUNTY_MAP: ReadonlyMap<string, CountyInfo> = new Map(
  COUNTY_LIST.map((item) => [item.code, item])
);

export const ACTIVE_COUNTIES: readonly CountyInfo[] = COUNTY_LIST.filter((c) => !c.legacy);

/** 舊式外來人口統一證號第 2 碼字母對應之個位數值與性別 */
const OLD_RESIDENT_SECOND_CHAR: Record<string, { digit: number; gender: ResolvedGender }> = {
  A: { digit: 0, gender: 'male' },
  B: { digit: 1, gender: 'female' },
  C: { digit: 2, gender: 'male' },
  D: { digit: 3, gender: 'female' },
};

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

/**
 * 依據 11 個數字向量建立權重明細與總和
 */
function buildWeightSteps(
  countyCode: string,
  secondChar: string,
  digits11: readonly number[]
): { steps: WeightStep[]; weightedSum: number } {
  const steps: WeightStep[] = digits11.map((digit, idx) => {
    const weight = WEIGHTS[idx];
    const product = digit * weight;
    let label = '';
    let rawChar = String(digit);

    if (idx === 0) {
      label = `${countyCode} (10s)`;
      rawChar = countyCode;
    } else if (idx === 1) {
      label = `${countyCode} (1s)`;
      rawChar = countyCode;
    } else if (idx === 2) {
      label = '#2';
      rawChar = secondChar;
    } else if (idx === 10) {
      label = '#10';
    } else {
      label = `#${idx}`;
    }

    return { label, rawChar, digit, weight, product };
  });

  const weightedSum = steps.reduce((acc, s) => acc + s.product, 0);
  return { steps, weightedSum };
}

/**
 * 計算前 10 個加權數字對應的檢查碼 (0-9)
 */
export function computeCheckDigit(first10Digits: readonly number[]): number {
  if (first10Digits.length !== 10) {
    throw new RangeError('first10Digits must have length 10');
  }
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += first10Digits[i] * WEIGHTS[i];
  }
  return (10 - (sum % 10)) % 10;
}

/** 六都直轄市縣市代碼預設組合（臺北、新北、桃園、臺中、臺南、高雄） */
export const SIX_MUNICIPALITIES = ['A', 'F', 'H', 'B', 'D', 'E'] as const;

/**
 * 產生單筆合法的台灣證號
 */
export function generateTaiwanId(options: GenerateOptions): GeneratedIdItem {
  const defaultPool = options.includeLegacyCounties ? COUNTY_LIST : ACTIVE_COUNTIES;

  let county: CountyInfo;
  if (Array.isArray(options.countyCodes) && options.countyCodes.length > 0) {
    const validSelected = options.countyCodes
      .map((code) => COUNTY_MAP.get(code.trim().toUpperCase()))
      .filter((item): item is CountyInfo => Boolean(item));
    const pool = validSelected.length > 0 ? validSelected : defaultPool;
    county = pool[secureRandomInt(pool.length)];
  } else {
    const normalizedCounty = (options.countyCode ?? 'RANDOM').trim().toUpperCase();
    county =
      normalizedCounty !== 'RANDOM' && COUNTY_MAP.has(normalizedCounty)
        ? COUNTY_MAP.get(normalizedCounty)!
        : defaultPool[secureRandomInt(defaultPool.length)];
  }

  const resolvedGender: ResolvedGender =
    options.gender === 'random'
      ? secureRandomInt(2) === 0
        ? 'male'
        : 'female'
      : options.gender;

  let secondChar: string;
  let secondDigit: number;

  if (options.type === 'national') {
    secondChar = resolvedGender === 'male' ? '1' : '2';
    secondDigit = resolvedGender === 'male' ? 1 : 2;
  } else if (options.type === 'new-resident') {
    secondChar = resolvedGender === 'male' ? '8' : '9';
    secondDigit = resolvedGender === 'male' ? 8 : 9;
  } else {
    // 舊式外來人口統一證號：男 A/C、女 B/D
    const candidates = resolvedGender === 'male' ? ['A', 'C'] : ['B', 'D'];
    secondChar = candidates[secureRandomInt(candidates.length)];
    secondDigit = OLD_RESIDENT_SECOND_CHAR[secondChar].digit;
  }

  const serialDigits: number[] = [];
  for (let i = 0; i < 7; i++) {
    serialDigits.push(secureRandomInt(10));
  }

  const n1 = Math.floor(county.numericValue / 10);
  const n2 = county.numericValue % 10;
  const first10 = [n1, n2, secondDigit, ...serialDigits];
  const checkDigit = computeCheckDigit(first10);
  const digits11 = [...first10, checkDigit];

  const { steps, weightedSum } = buildWeightSteps(county.code, secondChar, digits11);
  const id = `${county.code}${secondChar}${serialDigits.join('')}${checkDigit}`;

  return {
    id,
    type: options.type,
    countyCode: county.code,
    countyNameZh: county.nameZh,
    countyNameEn: county.nameEn,
    countyLegacy: Boolean(county.legacy),
    gender: resolvedGender,
    genderCode: secondChar,
    checkDigit,
    weightedSum,
    steps,
  };
}

/**
 * 批次產生多筆不重複（盡可能去重）之台灣證號
 */
export function generateTaiwanIdBatch(
  options: GenerateOptions,
  count: number
): GeneratedIdItem[] {
  const safeCount = Math.min(Math.max(Math.floor(Number.isFinite(count) ? count : 1), 1), MAX_BATCH_COUNT);
  const results: GeneratedIdItem[] = [];
  const seen = new Set<string>();
  const maxAttempts = safeCount * 5;
  let attempts = 0;

  while (results.length < safeCount && attempts < maxAttempts) {
    attempts++;
    const item = generateTaiwanId(options);
    if (!seen.has(item.id)) {
      seen.add(item.id);
      results.push(item);
    }
  }

  return results;
}

/**
 * 驗證並解析單筆台灣身分證字號或新／舊式外來人口統一證號
 */
export function validateTaiwanId(rawInput: string): ValidationResult {
  const normalized = rawInput.trim().toUpperCase();

  if (!normalized) {
    return {
      input: rawInput,
      normalized,
      valid: false,
      errorCode: 'EMPTY',
    };
  }

  if (normalized.length !== 10) {
    return {
      input: rawInput,
      normalized,
      valid: false,
      errorCode: 'INVALID_LENGTH',
    };
  }

  const firstChar = normalized[0];
  const county = COUNTY_MAP.get(firstChar);
  if (!county) {
    return {
      input: rawInput,
      normalized,
      valid: false,
      errorCode: 'INVALID_COUNTY',
    };
  }

  const secondChar = normalized[1];
  const tail = normalized.slice(2);
  if (!/^\d{8}$/.test(tail)) {
    return {
      input: rawInput,
      normalized,
      valid: false,
      errorCode: 'INVALID_FORMAT',
    };
  }

  let type: IdType;
  let gender: ResolvedGender;
  let secondDigit: number;

  if (secondChar === '1' || secondChar === '2') {
    type = 'national';
    gender = secondChar === '1' ? 'male' : 'female';
    secondDigit = Number(secondChar);
  } else if (secondChar === '8' || secondChar === '9') {
    type = 'new-resident';
    gender = secondChar === '8' ? 'male' : 'female';
    secondDigit = Number(secondChar);
  } else if (secondChar in OLD_RESIDENT_SECOND_CHAR) {
    type = 'old-resident';
    gender = OLD_RESIDENT_SECOND_CHAR[secondChar].gender;
    secondDigit = OLD_RESIDENT_SECOND_CHAR[secondChar].digit;
  } else {
    return {
      input: rawInput,
      normalized,
      valid: false,
      errorCode: 'INVALID_FORMAT',
    };
  }

  const tailDigits = tail.split('').map((ch) => Number(ch));
  const serialDigits = tailDigits.slice(0, 7);
  const actualCheckDigit = tailDigits[7];

  const n1 = Math.floor(county.numericValue / 10);
  const n2 = county.numericValue % 10;
  const first10 = [n1, n2, secondDigit, ...serialDigits];
  const expectedCheckDigit = computeCheckDigit(first10);
  const digits11 = [...first10, actualCheckDigit];

  const { steps, weightedSum } = buildWeightSteps(county.code, secondChar, digits11);
  const remainder = weightedSum % 10;
  const valid = remainder === 0;

  return {
    input: rawInput,
    normalized,
    valid,
    errorCode: valid ? undefined : 'INVALID_CHECKSUM',
    expectedCheckDigit,
    type,
    countyCode: county.code,
    countyNameZh: county.nameZh,
    countyNameEn: county.nameEn,
    countyLegacy: Boolean(county.legacy),
    gender,
    genderCode: secondChar,
    checkDigit: actualCheckDigit,
    weightedSum,
    remainder,
    steps,
  };
}

/**
 * 批次驗證多行輸入（自動忽略空白行，限制上限避免主執行緒過載）
 */
export function validateTaiwanIdBatch(rawMultiline: string, maxLines = 200): ValidationResult[] {
  const lines = rawMultiline
    .split(/[\r\n,;]+/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .slice(0, maxLines);

  return lines.map((line) => validateTaiwanId(line));
}

/**
 * 將批次產生結果格式化為純文字 / CSV / JSON
 */
export function formatBatchExport(
  items: readonly GeneratedIdItem[],
  format: 'txt' | 'csv' | 'json',
  lang: 'zh-TW' | 'en'
): string {
  if (format === 'txt') {
    return items.map((item) => item.id).join('\n');
  }

  if (format === 'csv') {
    const header =
      lang === 'en'
        ? 'id,type,countyCode,county,gender'
        : '證號,類型,縣市代碼,發證縣市,性別';
    const typeLabel = (t: IdType) => {
      if (lang === 'en') {
        return t === 'national' ? 'National ID' : t === 'new-resident' ? 'New Resident ID' : 'Legacy Resident ID';
      }
      return t === 'national' ? '國民身分證' : t === 'new-resident' ? '新式居留證' : '舊式居留證';
    };
    const genderLabel = (g: ResolvedGender) =>
      lang === 'en' ? (g === 'male' ? 'Male' : 'Female') : g === 'male' ? '男' : '女';

    const rows = items.map((item) => {
      const county = lang === 'en' ? item.countyNameEn : item.countyNameZh;
      return `${item.id},${typeLabel(item.type)},${item.countyCode},"${county}",${genderLabel(item.gender)}`;
    });
    return [header, ...rows].join('\n');
  }

  return JSON.stringify(
    items.map((item) => ({
      id: item.id,
      type: item.type,
      countyCode: item.countyCode,
      county: lang === 'en' ? item.countyNameEn : item.countyNameZh,
      gender: item.gender,
    })),
    null,
    2
  );
}

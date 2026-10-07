import type { ConditionType, PacImportResult, PacProjectConfig, ProxyNode, ProxyType, RoutingRule } from './types.ts';

/**
 * 將子網遮罩轉為 CIDR 前綴 (例如 255.255.255.0 -> 24)
 */
export function netmaskToCidr(mask: string): number {
  const parts = mask.trim().split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => isNaN(p) || p < 0 || p > 255)) {
    return 32;
  }
  let count = 0;
  for (const part of parts) {
    let n = part;
    while (n > 0) {
      if (n & 128) count++;
      n = (n << 1) & 255;
    }
  }
  return count;
}

/**
 * 解析代理字串 (例如 "PROXY wcg1.example.com:8080" 或 "SOCKS5 127.0.0.1:1080")
 */
/**
 * 提取 return 表達式（引號感知，防止被字串內的分號截斷）
 */
export function extractReturnExpressions(code: string): string[] {
  const results: string[] = [];
  let i = 0;
  while (i < code.length) {
    const returnIdx = code.indexOf('return', i);
    if (returnIdx === -1) break;

    // 確認 return 是獨立單詞（前後不能是識別碼字元）
    const prevChar = returnIdx > 0 ? code[returnIdx - 1] : ' ';
    const nextChar = returnIdx + 6 < code.length ? code[returnIdx + 6] : ' ';
    if (/[a-zA-Z0-9_$]/.test(prevChar) || /[a-zA-Z0-9_$]/.test(nextChar)) {
      i = returnIdx + 6;
      continue;
    }

    // 尋找 return 表達式的結束位置（在未被引號包裹時的分號 ; 或大括號 }）
    const exprStart = returnIdx + 6;
    let exprEnd = exprStart;
    let inSingleQuote = false;
    let inDoubleQuote = false;
    let inBacktick = false;

    while (exprEnd < code.length) {
      const ch = code[exprEnd];
      const prev = exprEnd > 0 ? code[exprEnd - 1] : '';

      if (ch === "'" && !inDoubleQuote && !inBacktick && prev !== '\\') {
        inSingleQuote = !inSingleQuote;
      } else if (ch === '"' && !inSingleQuote && !inBacktick && prev !== '\\') {
        inDoubleQuote = !inDoubleQuote;
      } else if (ch === '`' && !inSingleQuote && !inDoubleQuote && prev !== '\\') {
        inBacktick = !inBacktick;
      } else if (!inSingleQuote && !inDoubleQuote && !inBacktick) {
        if (ch === ';' || ch === '}') {
          break;
        }
      }
      exprEnd++;
    }

    const expr = code.slice(exprStart, exprEnd).trim();
    if (expr) {
      results.push(expr);
    }
    i = exprEnd + 1;
  }
  return results;
}

/**
 * 從 return 表達式中解析字串（支援多個字串以 + 拼接與多行換行）
 */
export function parseStringFromExpr(expr: string): string {
  const parts: string[] = [];
  const strRegex = /(["'`])((?:\\.|[^\\])*?)\1/g;
  let match;
  while ((match = strRegex.exec(expr)) !== null) {
    parts.push(match[2]);
  }
  if (parts.length > 0) {
    return parts.join('').replace(/\s+/g, ' ').trim();
  }
  return expr.replace(/['"]/g, '').replace(/\s+/g, ' ').trim();
}

/**
 * 提取 return 語句的回傳字串（支援多個字串以 + 拼接與多行換行）
 */
export function extractReturnString(statementOrCode: string): string | null {
  const expressions = extractReturnExpressions(statementOrCode);
  if (expressions.length === 0) return null;
  return parseStringFromExpr(expressions[0]);
}

/**
 * 解析代理字串 (例如 "PROXY wcg1.example.com:8080" 或多重備援代理鏈)
 */
export function parseProxyNodeFromString(raw: string, index: number): ProxyNode | null {
  const trimmed = raw.trim().replace(/\s+/g, ' ');
  if (!trimmed || trimmed.toUpperCase() === 'DIRECT') return null;

  // 若包含分號多重代理（備援鏈）
  if (trimmed.includes(';')) {
    return {
      id: `proxy_${Date.now()}_${index}`,
      name: `備援代理鏈 ${index + 1}`,
      type: 'PROXY',
      host: 'cluster',
      port: 8080,
      customString: trimmed,
    };
  }

  const match = trimmed.match(/^(PROXY|HTTP|HTTPS|SOCKS|SOCKS5)\s+([^:;\s]+)(?::(\d+))?/i);
  if (match) {
    const type = match[1].toUpperCase() as ProxyType;
    const host = match[2];
    const port = match[3] ? parseInt(match[3], 10) : 8080;
    return {
      id: `proxy_${Date.now()}_${index}`,
      name: `${host}:${port}`,
      type,
      host,
      port,
    };
  }

  // 若為複雜自訂字串
  return {
    id: `proxy_${Date.now()}_${index}`,
    name: `代理節點 ${index + 1}`,
    type: 'PROXY',
    host: 'custom',
    port: 8080,
    customString: trimmed,
  };
}

export interface ExtractedIfBlock {
  comment: string;
  condition: string;
  body: string;
}

/**
 * 利用括號深度平衡精確提取所有 if 區塊，並自動解開 isResolvable 等外層 wrapper
 */
export function extractAllIfBlocks(code: string): ExtractedIfBlock[] {
  const results: ExtractedIfBlock[] = [];
  let i = 0;

  while (i < code.length) {
    const match = code.slice(i).match(/^(\s*(?:\/\*([\s\S]*?)\*\/|\/\/([^\r\n]*)))*\s*if\s*\(/);
    if (!match) {
      i++;
      continue;
    }

    // 取得緊鄰 if 前的註解
    const fullPrefix = match[0];
    let comment = '';
    const comments = Array.from(fullPrefix.matchAll(/\/\*([\s\S]*?)\*\/|\/\/([^\r\n]*)/g));
    if (comments.length > 0) {
      const last = comments[comments.length - 1];
      comment = (last[1] || last[2] || '').trim();
    }

    const condStart = i + fullPrefix.length;
    let parenDepth = 1;
    let condEnd = condStart;

    while (condEnd < code.length && parenDepth > 0) {
      const ch = code[condEnd];
      if (ch === '(') parenDepth++;
      else if (ch === ')') parenDepth--;
      condEnd++;
    }

    const condition = code.slice(condStart, condEnd - 1).trim();

    let bodyStart = condEnd;
    while (bodyStart < code.length && /\s/.test(code[bodyStart])) {
      bodyStart++;
    }

    let body = '';
    let nextI = bodyStart;

    if (code[bodyStart] === '{') {
      let braceDepth = 1;
      let bodyEnd = bodyStart + 1;
      while (bodyEnd < code.length && braceDepth > 0) {
        const ch = code[bodyEnd];
        if (ch === '{') braceDepth++;
        else if (ch === '}') braceDepth--;
        bodyEnd++;
      }
      body = code.slice(bodyStart + 1, bodyEnd - 1).trim();
      nextI = bodyEnd;
    } else {
      const semi = code.indexOf(';', bodyStart);
      if (semi !== -1) {
        body = code.slice(bodyStart, semi + 1).trim();
        nextI = semi + 1;
      } else {
        nextI = bodyStart + 1;
      }
    }

    // 若為 isResolvable 或內部有其他 if 且非單一 return，解開 wrapper 遞迴處理內部
    if (condition.includes('isResolvable') || ((body.includes('if (') || body.includes('if(')) && !/^\s*return\s+/.test(body))) {
      const inners = extractAllIfBlocks(body);
      results.push(...inners);
    } else {
      results.push({ comment, condition, body });
    }

    i = nextI;
  }

  return results;
}

/**
 * 在最外層（括號深度 0、非字串內）切割 || 運算子，取得各個子條件子句
 */
export function splitTopLevelOr(condition: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  let inSingleQuote = false;
  let inDoubleQuote = false;

  for (let i = 0; i < condition.length; i++) {
    const ch = condition[i];
    const prev = i > 0 ? condition[i - 1] : '';
    if (ch === "'" && !inDoubleQuote && prev !== '\\') {
      inSingleQuote = !inSingleQuote;
    } else if (ch === '"' && !inSingleQuote && prev !== '\\') {
      inDoubleQuote = !inDoubleQuote;
    } else if (!inSingleQuote && !inDoubleQuote) {
      if (ch === '(') {
        depth++;
      } else if (ch === ')') {
        depth--;
      } else if (depth === 0 && ch === '|' && condition[i + 1] === '|') {
        parts.push(condition.slice(start, i).trim());
        i++; // 跳過緊接的第二個 |
        start = i + 1;
      }
    }
  }
  parts.push(condition.slice(start).trim());
  return parts.filter(Boolean);
}

/**
 * 擷取網路環境偵測比對：dnsResolve("探測主機") === "IP"（左右對調、== 皆可），回傳「主機=IP」值清單
 */
function matchDnsProbes(clause: string): string[] {
  const re =
    /dnsResolve\s*\(\s*['"]([^'"]+)['"]\s*\)\s*===?\s*['"]([^'"]+)['"]|['"]([^'"]+)['"]\s*===?\s*dnsResolve\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
  return Array.from(clause.matchAll(re), (m) =>
    m[1] !== undefined ? `${m[1].trim()}=${m[2].trim()}` : `${m[4].trim()}=${m[3].trim()}`
  );
}

/**
 * 依規則解析的既有優先序，分類單一子句所屬的條件類型分組鍵（僅用於分組，不影響實際欄位解析）
 */
function classifyConditionClauseBucket(clause: string, helpers: ReadonlyMap<string, HostHelperKind>): string {
  if (matchDnsProbes(clause).length > 0) return 'dnsProbe';
  if (clause.includes('isPlainHostName')) return 'plainHost';
  if (clause.includes('isInNet(') || clause.includes('isInNet (')) return 'ipv4';
  if (clause.includes('isInNetEx')) return 'ipv6';
  if (clause.includes('url.substring') || clause.includes('url.startsWith')) return 'protocol';
  if (clause.includes('shExpMatch') && clause.includes('*:')) return 'port';
  if (clause.includes('weekdayRange')) return 'weekday';
  if (clause.includes('timeRange')) return 'timeRange';
  if (
    clause.includes('dnsDomainIs') ||
    clause.includes('host ==') ||
    clause.includes('host ===') ||
    hasHostHelperCall(clause, helpers)
  ) {
    return 'domain';
  }
  if (clause.includes('shExpMatch') && clause.includes('host')) return 'wildcardHost';
  if (clause.includes('shExpMatch') && clause.includes('url')) return 'wildcardUrl';
  if (clause.includes('.test(url)') || clause.includes('.test(host)')) return 'regex';
  return 'other';
}

/**
 * 將一個 if 條件依最外層 || 拆開後，依條件類型分組：
 * 同類型的子句合併回同一段（保留原本的多值 OR 解析能力，如多個 dnsDomainIs），
 * 不同類型的子句則拆成獨立的一段（避免像 isPlainHostName(host) || dnsDomainIs(host, ".x") 這種
 * 混合類型條件，被單一判斷分支整個吃掉、導致其餘子句被靜默丟棄）。
 * 拆出的多段最終都會指向同一個 targetProxy，語意與原始 OR 完全等價（由上而下命中即離開）。
 */
export function splitConditionByType(
  condition: string,
  helpers: ReadonlyMap<string, HostHelperKind> = BUILTIN_HOST_HELPERS
): string[] {
  const clauses = splitTopLevelOr(condition);
  if (clauses.length <= 1) {
    return [condition];
  }

  const order: string[] = [];
  const buckets = new Map<string, string[]>();
  for (const clause of clauses) {
    const key = classifyConditionClauseBucket(clause, helpers);
    if (!buckets.has(key)) {
      order.push(key);
      buckets.set(key, []);
    }
    buckets.get(key)!.push(clause);
  }

  return order.map((key) => buckets.get(key)!.join(' || '));
}

/**
 * 移除 JS 註解（引號感知，避免誤刪字串內的 "http://"）
 */
export function stripJsComments(code: string): string {
  let out = '';
  let quote: string | null = null;
  for (let i = 0; i < code.length; i++) {
    const ch = code[i];
    if (quote) {
      out += ch;
      if (ch === '\\' && i + 1 < code.length) {
        out += code[++i];
      } else if (ch === quote) {
        quote = null;
      }
      continue;
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      quote = ch;
      out += ch;
    } else if (ch === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      i = end === -1 ? code.length : end + 1;
      out += ' ';
    } else if (ch === '/' && code[i + 1] === '/') {
      const end = code.indexOf('\n', i + 2);
      i = end === -1 ? code.length : end - 1;
    } else {
      out += ch;
    }
  }
  return out;
}

/**
 * 從 start（指向 '{'）以大括號深度平衡找到對應的 '}'，回傳其索引；找不到回傳 -1
 */
function findMatchingBrace(code: string, start: number): number {
  let depth = 0;
  for (let i = start; i < code.length; i++) {
    if (code[i] === '{') depth++;
    else if (code[i] === '}') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/**
 * 只保留 FindProxyForURL 的函式本體，並移除其中（或其外）定義的輔助函式
 * （如 var hostOrDomainIs = function(host, val) { return ... }），
 * 避免輔助函式內的 return 被誤認為代理字串、if 被誤認為分流規則。
 */
export function extractRoutingBody(code: string): string {
  let body = code;
  const mainMatch = /function\s+FindProxyForURL\s*\([^)]*\)\s*\{/.exec(code);
  if (mainMatch) {
    const open = mainMatch.index + mainMatch[0].length - 1;
    const close = findMatchingBrace(code, open);
    if (close !== -1) {
      body = code.slice(open + 1, close);
    }
  }

  const fnRegex = /\bfunction\b[^(]*\([^)]*\)\s*\{/g;
  let result = '';
  let cursor = 0;
  let m: RegExpExecArray | null;
  while ((m = fnRegex.exec(body)) !== null) {
    const open = m.index + m[0].length - 1;
    const close = findMatchingBrace(body, open);
    if (close === -1) break;
    result += body.slice(cursor, m.index);
    cursor = close + 1;
    fnRegex.lastIndex = close + 1;
  }
  return result + body.slice(cursor);
}

/** 主機比對輔助函式的語意：等同網域後綴或精確主機 */
export type HostHelperKind = 'domainSuffix' | 'domainExact';

/**
 * PAC 內建函式。localHostOrDomainIs 的規格是「完全相符，或 host 不含網域時比對主機名」，
 * 匯入時近似為精確主機；若腳本自行重新定義同名函式，則改以腳本中的定義為準。
 */
export const BUILTIN_HOST_HELPERS: ReadonlyMap<string, HostHelperKind> = new Map([
  ['localHostOrDomainIs', 'domainExact'],
]);

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** 比對 name(host, "值") 呼叫；排除 obj.name( 與名稱為其他識別碼一部分的情況 */
function hostHelperCallRegex(name: string, flags = ''): RegExp {
  return new RegExp(`(?<![\\w$.])${escapeRegExp(name)}\\s*\\(\\s*host\\s*,\\s*['"]([^'"]+)['"]\\s*\\)`, flags);
}

function hasHostHelperCall(clause: string, helpers: ReadonlyMap<string, HostHelperKind>): boolean {
  for (const name of helpers.keys()) {
    if (hostHelperCallRegex(name).test(clause)) return true;
  }
  return false;
}

/** 剝除包住整個運算式的外層括號，例如 ((a === b)) -> a === b */
function stripOuterParens(expr: string): string {
  let s = expr.trim();
  while (s.startsWith('(')) {
    let depth = 0;
    let end = -1;
    for (let i = 0; i < s.length; i++) {
      if (s[i] === '(') depth++;
      else if (s[i] === ')') {
        depth--;
        if (depth === 0) {
          end = i;
          break;
        }
      }
    }
    if (end !== s.length - 1) break;
    s = s.slice(1, -1).trim();
  }
  return s;
}

/**
 * 依函式本體（而非函式名稱）判斷輔助函式語意。只接受「單一 return」且符合下列其一的寫法，
 * 其餘一律視為無法辨識（回傳 null），交由一般流程產生警告，不做猜測：
 * - 精確主機：return h === v（或 ==、左右對調）
 * - 網域後綴：return h === v || dnsDomainIs(h, '.' + v)（子句順序不拘），與產生器輸出的後綴規則等價
 */
export function classifyHostHelper(params: string[], body: string): HostHelperKind | null {
  if (params.length !== 2) return null;
  const [h, v] = params;
  if (!/^[A-Za-z_$][\w$]*$/.test(h) || !/^[A-Za-z_$][\w$]*$/.test(v) || h === v) return null;

  const m = /^return\b([\s\S]*?);?$/.exec(stripJsComments(body).trim());
  if (!m || /\breturn\b|;/.test(m[1])) return null;

  // 參數改名為固定佔位符（# 不是合法識別碼字元，不會與腳本內其他名稱撞名），再去空白、統一引號
  const rename = (s: string, from: string, to: string) =>
    s.replace(new RegExp(`(?<![\\w$.])${escapeRegExp(from)}(?![\\w$])`, 'g'), to);
  const expr = rename(rename(m[1], h, '#H'), v, '#V').replace(/\s+/g, '').replace(/'/g, '"');

  const clauses = splitTopLevelOr(stripOuterParens(expr)).map(stripOuterParens);
  const isEquality = (c: string) => ['#H===#V', '#H==#V', '#V===#H', '#V==#H'].includes(c);
  const isDotSuffix = (c: string) => c === 'dnsDomainIs(#H,"."+#V)';

  if (clauses.length === 1 && isEquality(clauses[0])) return 'domainExact';
  if (clauses.length === 2 && clauses.some(isEquality) && clauses.some(isDotSuffix)) return 'domainSuffix';
  return null;
}

/**
 * 收集腳本中定義的主機比對輔助函式（function 宣告與 var x = function 兩種寫法），
 * 依本體語意分類。同名重複定義以最後一次為準；無法辨識的定義會覆蓋掉同名內建函式的預設語意。
 */
export function collectHostHelpers(code: string): Map<string, HostHelperKind> {
  const helpers = new Map(BUILTIN_HOST_HELPERS);
  const src = stripJsComments(code);
  const declRegex =
    /\bfunction\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)\s*\{|\b([A-Za-z_$][\w$]*)\s*=\s*function\b[^(]*\(([^)]*)\)\s*\{/g;
  let m: RegExpExecArray | null;
  while ((m = declRegex.exec(src)) !== null) {
    const name = m[1] ?? m[3];
    if (name === 'FindProxyForURL') continue;
    const params = (m[2] ?? m[4]).split(',').map((p) => p.trim()).filter(Boolean);
    const open = m.index + m[0].length - 1;
    const close = findMatchingBrace(src, open);
    if (close === -1) continue;
    const kind = classifyHostHelper(params, src.slice(open + 1, close));
    if (kind) helpers.set(name, kind);
    else helpers.delete(name);
  }
  return helpers;
}

/**
 * 智慧解析 PAC 腳本或 JSON 設定檔
 */
export function parsePacScript(content: string): PacImportResult {
  const raw = content.trim();
  if (!raw) {
    return {
      success: false,
      proxies: [],
      rules: [],
      defaultAction: 'DIRECT',
      enableIpv6: false,
      resolveIpFirst: false,
      messageZh: '輸入內容為空，請貼上 PAC 腳本或 JSON 設定檔。',
      messageEn: 'Input is empty. Please paste a PAC script or JSON configuration.',
    };
  }

  // 1. 嘗試解析 JSON 專案設定檔
  if (raw.startsWith('{') && raw.endsWith('}')) {
    try {
      const parsed = JSON.parse(raw) as Partial<PacProjectConfig>;
      if (Array.isArray(parsed.proxies) && Array.isArray(parsed.rules)) {
        return {
          success: true,
          proxies: parsed.proxies,
          rules: parsed.rules,
          defaultAction: parsed.defaultAction || 'DIRECT',
          enableIpv6: !!parsed.enableIpv6,
          resolveIpFirst: !!parsed.resolveIpFirst,
          messageZh: `成功匯入 Smalltools 專案設定檔！載入 ${parsed.proxies.length} 個節點與 ${parsed.rules.length} 條規則。`,
          messageEn: `Successfully imported Smalltools config with ${parsed.proxies.length} proxies and ${parsed.rules.length} rules.`,
        };
      }
    } catch {
      // 非合法 JSON，繼續嘗試以 PAC JavaScript 解析
    }
  }

  // 2. PAC JavaScript 逆向解析
  const warnings: string[] = [];
  // 僅分析 FindProxyForURL 本體（排除輔助函式），旗標偵測另外排除註解，避免「Don't check IPv6」之類註解誤觸
  const routingBody = extractRoutingBody(raw);
  // 輔助函式先依本體語意分類，再從分析範圍中移除
  const hostHelpers = collectHostHelpers(raw);
  const codeOnly = stripJsComments(routingBody);
  let enableIpv6 = /isInNetEx|dnsResolveEx|myIpAddressEx/.test(codeOnly);
  let resolveIpFirst = /dnsResolve\s*\(\s*host\s*\)|hostIP\s*=|isResolvable/i.test(codeOnly);
  let defaultAction = 'DIRECT';

  const proxies: ProxyNode[] = [];
  const rules: RoutingRule[] = [];

  // 提取所有代理節點字串 (支援字串拼接與引號內分號)
  const returnExpressions = extractReturnExpressions(stripJsComments(routingBody));
  const foundProxyStrings = new Set<string>();

  for (const expr of returnExpressions) {
    const pStr = parseStringFromExpr(expr);
    if (pStr && pStr.toUpperCase() !== 'DIRECT') {
      foundProxyStrings.add(pStr);
    }
  }

  // 建立 ProxyNode 池
  Array.from(foundProxyStrings).forEach((pStr, idx) => {
    const node = parseProxyNodeFromString(pStr, idx);
    if (node) {
      proxies.push(node);
    }
  });

  // 尋找兜底預設行為 (通常是函式末尾的 return 語句)
  if (returnExpressions.length > 0) {
    const lastExpr = returnExpressions[returnExpressions.length - 1];
    const lastReturn = parseStringFromExpr(lastExpr) || 'DIRECT';
    const matchedProxy = proxies.find((p) => {
      if (p.customString && p.customString === lastReturn) return true;
      return `${p.type} ${p.host}:${p.port}` === lastReturn;
    });
    defaultAction = matchedProxy ? matchedProxy.id : lastReturn;
  }

  const ifBlocks = extractAllIfBlocks(routingBody);
  let ruleIndex = 1;

  for (const block of ifBlocks) {
    const blockComment = block.comment;
    const condition = block.condition;
    const body = block.body;

    // 忽略無效結構，如 if (false) 或純除錯 if
    if (condition === 'false' || condition === '0') {
      continue;
    }

    // 取得該規則目標代理（支援字串拼接）
    const targetRaw = extractReturnString(body) || 'DIRECT';
    const matchedProxy = proxies.find((p) => {
      if (p.customString && p.customString === targetRaw) return true;
      return `${p.type} ${p.host}:${p.port}` === targetRaw;
    });
    const targetProxy = matchedProxy ? matchedProxy.id : targetRaw;

    // 若同一個 if 內以最外層 || 混合了不同類型的條件（例如 isPlainHostName(host) || dnsDomainIs(host, ".x")），
    // 拆成多段各自解析，避免其中一段被單一判斷分支整個消化、導致其餘子句被靜默丟棄
    const subConditions = splitConditionByType(condition, hostHelpers);

    for (const subCondition of subConditions) {
      // 是否為用戶端本機 IP (myIpAddress / myIpAddressEx)
      const isClientIp = subCondition.includes('myIpAddress');

      // 0. 網路環境偵測 (dnsResolve("探測主機") === "IP")，常見於判斷是否位於公司內網
      const dnsProbes = matchDnsProbes(subCondition);
      if (dnsProbes.length > 0) {
        rules.push({
          id: `rule_${Date.now()}_${ruleIndex++}`,
          name: blockComment || '網路環境偵測',
          enabled: true,
          conditionType: 'dnsProbe',
          value: Array.from(new Set(dnsProbes)).join('\n'),
          targetProxy,
          description: blockComment || undefined,
        });
        continue;
      }

      // 1. 純主機名
      if (subCondition.includes('isPlainHostName')) {
        rules.push({
          id: `rule_${Date.now()}_${ruleIndex++}`,
          name: blockComment || '內部純主機直連',
          enabled: true,
          conditionType: 'plainHost',
          value: '',
          targetProxy,
          description: blockComment || undefined,
        });
        continue;
      }

      // 2. IPv4 CIDR / isInNet (目標伺服器 或 用戶端本機)
      if (subCondition.includes('isInNet(') || subCondition.includes('isInNet (')) {
        const ipMatches = Array.from(
          subCondition.matchAll(/isInNet\s*\(\s*[^,]+,\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\s*\)/g)
        );
        if (ipMatches.length > 0) {
          const cidrList: string[] = [];
          for (const m of ipMatches) {
            const ip = m[1].trim();
            const mask = m[2].trim();
            const prefix = netmaskToCidr(mask);
            if (prefix === 32) {
              cidrList.push(ip);
            } else {
              cidrList.push(`${ip}/${prefix}`);
            }
          }
          const uniqueCidrs = Array.from(new Set(cidrList));
          rules.push({
            id: `rule_${Date.now()}_${ruleIndex++}`,
            name: blockComment || (isClientIp ? '用戶端本機 IP 分流' : 'IPv4 網段分流'),
            enabled: true,
            conditionType: isClientIp ? 'clientIpv4' : 'ipv4Cidr',
            value: uniqueCidrs.join('\n'),
            targetProxy,
            description: blockComment || undefined,
          });
          continue;
        }
      }

      // 3. IPv6 CIDR / isInNetEx (目標伺服器 或 用戶端本機)
      if (subCondition.includes('isInNetEx')) {
        const ip6Matches = Array.from(
          subCondition.matchAll(/isInNetEx\s*\(\s*[^,]+,\s*['"]([^'"]+)['"]\s*\)/g)
        );
        if (ip6Matches.length > 0) {
          const list = Array.from(new Set(ip6Matches.map((m) => m[1].trim())));
          rules.push({
            id: `rule_${Date.now()}_${ruleIndex++}`,
            name: blockComment || (isClientIp ? '用戶端本機 IPv6 分流' : 'IPv6 網段分流'),
            enabled: true,
            conditionType: isClientIp ? 'clientIpv6' : 'ipv6Cidr',
            value: list.join('\n'),
            targetProxy,
            description: blockComment || undefined,
          });
          continue;
        }
      }

      // 4. 傳輸協定 (url.substring / url.startsWith)
      if (subCondition.includes('url.substring') || subCondition.includes('url.startsWith')) {
        const protoMatches = Array.from(subCondition.matchAll(/['"]([a-zA-Z0-9]+):?['"]/g));
        const protos = Array.from(
          new Set(
            protoMatches
              .map((m) => m[1].replace(/:$/, '').toLowerCase())
              .filter((p) => ['http', 'https', 'ftp', 'ws', 'wss', 'socks'].includes(p))
          )
        );
        if (protos.length > 0) {
          rules.push({
            id: `rule_${Date.now()}_${ruleIndex++}`,
            name: blockComment || '通訊協定分流',
            enabled: true,
            conditionType: 'protocol',
            value: protos.join('\n'),
            targetProxy,
            description: blockComment || undefined,
          });
          continue;
        }
      }

      // 5. 連接埠號 (shExpMatch url *:port)
      if (subCondition.includes('shExpMatch') && subCondition.includes('*:')) {
        const portMatches = Array.from(subCondition.matchAll(/\*:(\d+)/g));
        if (portMatches.length > 0) {
          const ports = Array.from(new Set(portMatches.map((m) => m[1])));
          rules.push({
            id: `rule_${Date.now()}_${ruleIndex++}`,
            name: blockComment || '連接埠分流',
            enabled: true,
            conditionType: 'port',
            value: ports.join('\n'),
            targetProxy,
            description: blockComment || undefined,
          });
          continue;
        }
      }

      // 6. 星期排程 (weekdayRange)
      if (subCondition.includes('weekdayRange')) {
        const dayMatches = Array.from(subCondition.matchAll(/weekdayRange\s*\(\s*['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?/g));
        if (dayMatches.length > 0) {
          const d1 = dayMatches[0][1];
          const d2 = dayMatches[0][2];
          const val = d2 ? `${d1}-${d2}` : d1;
          rules.push({
            id: `rule_${Date.now()}_${ruleIndex++}`,
            name: blockComment || '工作日/週末分流',
            enabled: true,
            conditionType: 'weekday',
            value: val,
            targetProxy,
            description: blockComment || undefined,
          });
          continue;
        }
      }

      // 7. 時段排程 (timeRange)
      if (subCondition.includes('timeRange')) {
        const timeMatches = Array.from(subCondition.matchAll(/timeRange\s*\(\s*(\d+)(?:,\s*(\d+))?/g));
        if (timeMatches.length > 0) {
          const t1 = timeMatches[0][1];
          const t2 = timeMatches[0][2];
          const val = t2 ? `${t1}-${t2}` : t1;
          rules.push({
            id: `rule_${Date.now()}_${ruleIndex++}`,
            name: blockComment || '時段範圍分流',
            enabled: true,
            conditionType: 'timeRange',
            value: val,
            targetProxy,
            description: blockComment || undefined,
          });
          continue;
        }
      }

      // 8. 網域與主機名 (dnsDomainIs / host == "..." / host === "...")
      if (
        subCondition.includes('dnsDomainIs') ||
        subCondition.includes('host ==') ||
        subCondition.includes('host ===') ||
        hasHostHelperCall(subCondition, hostHelpers)
      ) {
        const domainMatches = Array.from(
          subCondition.matchAll(/dnsDomainIs\s*\(\s*host,\s*['"]([^'"]+)['"]\s*\)/g)
        );
        const hostMatches = Array.from(
          subCondition.matchAll(/(?:host\s*===?|host\s*==)\s*['"]([^'"]+)['"]/g)
        );
        // 輔助函式呼叫（如 Menlo / Zscaler PAC 的 hostOrDomainIs），語意已由 collectHostHelpers 依函式本體判定
        const suffixHelperMatches: RegExpMatchArray[] = [];
        const exactHelperMatches: RegExpMatchArray[] = [];
        for (const [name, kind] of hostHelpers) {
          const calls = Array.from(subCondition.matchAll(hostHelperCallRegex(name, 'g')));
          (kind === 'domainSuffix' ? suffixHelperMatches : exactHelperMatches).push(...calls);
        }

        // 若同時有 .example.com 與 example.com，統一保留乾淨網域名稱
        const normalizeDomain = (d: string) => {
          const t = d.trim();
          return t.startsWith('.') ? t.slice(1) : t;
        };
        const suffixDomains = Array.from(
          new Set([...domainMatches, ...suffixHelperMatches].map((m) => normalizeDomain(m[1])))
        );
        // 精確主機與網域後綴分成兩條規則，避免精確主機（如 go.microsoft.com）被併入後綴、連子網域都一起命中；
        // 已被後綴涵蓋的主機（後綴規則本身含 host === 頂層網域）不重複列出
        const exactHosts = Array.from(
          new Set([...hostMatches, ...exactHelperMatches].map((m) => m[1].trim()))
        ).filter((h) => !suffixDomains.includes(h));

        if (suffixDomains.length > 0 || exactHosts.length > 0) {
          if (suffixDomains.length > 0) {
            rules.push({
              id: `rule_${Date.now()}_${ruleIndex++}`,
              name: blockComment || '特定網域分流',
              enabled: true,
              conditionType: 'domainSuffix',
              value: suffixDomains.join('\n'),
              targetProxy,
              description: blockComment || undefined,
            });
          }
          if (exactHosts.length > 0) {
            rules.push({
              id: `rule_${Date.now()}_${ruleIndex++}`,
              name: blockComment || '精確主機分流',
              enabled: true,
              conditionType: 'domainExact',
              value: exactHosts.join('\n'),
              targetProxy,
              description: blockComment || undefined,
            });
          }
          continue;
        }
      }

      // 9. 主機名萬用字元 (shExpMatch host)
      if (subCondition.includes('shExpMatch') && subCondition.includes('host')) {
        const matchPatterns = Array.from(
          subCondition.matchAll(/shExpMatch\s*\(\s*host,\s*['"]([^'"]+)['"]\s*\)/g)
        );
        if (matchPatterns.length > 0) {
          const patterns = Array.from(new Set(matchPatterns.map((m) => m[1].trim())));
          rules.push({
            id: `rule_${Date.now()}_${ruleIndex++}`,
            name: blockComment || '主機名萬用字元',
            enabled: true,
            conditionType: 'wildcardHost',
            value: patterns.join('\n'),
            targetProxy,
            description: blockComment || undefined,
          });
          continue;
        }
      }

      // 10. URL 萬用字元 (shExpMatch url)
      if (subCondition.includes('shExpMatch') && subCondition.includes('url')) {
        const matchPatterns = Array.from(
          subCondition.matchAll(/shExpMatch\s*\(\s*url,\s*['"]([^'"]+)['"]\s*\)/g)
        );
        if (matchPatterns.length > 0) {
          const patterns = Array.from(new Set(matchPatterns.map((m) => m[1].trim())));
          rules.push({
            id: `rule_${Date.now()}_${ruleIndex++}`,
            name: blockComment || 'URL 萬用字元',
            enabled: true,
            conditionType: 'wildcardUrl',
            value: patterns.join('\n'),
            targetProxy,
            description: blockComment || undefined,
          });
          continue;
        }
      }

      // 11. 正則表達式
      if (subCondition.includes('.test(url)') || subCondition.includes('.test(host)')) {
        const regexMatch = subCondition.match(/\/([^\/]+)\/([a-z]*)\.test/);
        if (regexMatch) {
          rules.push({
            id: `rule_${Date.now()}_${ruleIndex++}`,
            name: blockComment || '正則表達式分流',
            enabled: true,
            conditionType: 'regex',
            value: regexMatch[1],
            targetProxy,
            description: blockComment || undefined,
          });
          continue;
        }
      }

      // 兜底：未能精準辨識的自訂複合條件
      warnings.push(`條件「${subCondition.slice(0, 30)}...」未能完全解析為標準樣式，已轉換為 URL 萬用比對。`);
      rules.push({
        id: `rule_${Date.now()}_${ruleIndex++}`,
        name: blockComment || `自訂規則 ${ruleIndex}`,
        enabled: true,
        conditionType: 'wildcardUrl',
        value: subCondition,
        targetProxy,
        description: blockComment || undefined,
      });
    }
  }

  return {
    success: true,
    proxies,
    rules,
    defaultAction,
    enableIpv6,
    resolveIpFirst,
    messageZh: `成功解析 PAC 腳本！共匯入 ${proxies.length} 個代理節點與 ${rules.length} 條分流規則。`,
    messageEn: `Successfully imported PAC script with ${proxies.length} proxy nodes and ${rules.length} routing rules.`,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

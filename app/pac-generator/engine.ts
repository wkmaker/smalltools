import type { ConditionType, PacImportResult, PacPreset, PacProjectConfig, ProxyNode, RoutingRule } from './types.ts';
import { isValidIpv4 as sharedIsValidIpv4, isValidIpv6 as sharedIsValidIpv6 } from '../utils/ipUtils.ts';
export { netmaskToCidr, parsePacScript, parseProxyNodeFromString, splitConditionByType, splitTopLevelOr } from './importer.ts';

/**
 * 將 IPv4 CIDR 前綴 (0-32) 轉換為標準子網遮罩 (例如 24 -> 255.255.255.0)
 */
export function cidrToNetmask(prefix: number): string {
  if (prefix < 0) prefix = 0;
  if (prefix > 32) prefix = 32;
  const maskInt = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  return [
    (maskInt >>> 24) & 255,
    (maskInt >>> 16) & 255,
    (maskInt >>> 8) & 255,
    maskInt & 255,
  ].join('.');
}

/**
 * 檢查是否為合法 IPv4 位址
 */
export function isValidIpv4(ip: string): boolean {
  return sharedIsValidIpv4(ip);
}

/**
 * 檢查是否為合法 IPv4 CIDR 或單一 IP
 */
export function isValidIpv4CidrOrIp(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.includes('/')) {
    const [ip, prefix] = trimmed.split('/');
    if (!isValidIpv4(ip)) return false;
    if (!/^\d+$/.test(prefix)) return false;
    const p = parseInt(prefix, 10);
    return p >= 0 && p <= 32;
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length === 2) {
    return isValidIpv4(parts[0]) && isValidIpv4(parts[1]);
  }
  return isValidIpv4(trimmed);
}

/**
 * 檢查是否為合法 IPv6 位址
 */
export function isValidIpv6(ip: string): boolean {
  return sharedIsValidIpv6(ip);
}

/**
 * 檢查是否為合法 IPv6 CIDR 或單一 IP
 */
export function isValidIpv6CidrOrIp(input: string): boolean {
  const trimmed = input.trim();
  if (!trimmed) return false;
  if (trimmed.includes('/')) {
    const [ip, prefix] = trimmed.split('/');
    if (!isValidIpv6(ip)) return false;
    if (!/^\d+$/.test(prefix)) return false;
    const p = parseInt(prefix, 10);
    return p >= 0 && p <= 128;
  }
  return isValidIpv6(trimmed);
}

export interface RuleValidationResult {
  isValid: boolean;
  messageZh?: string;
  messageEn?: string;
}

/**
 * 切割分流規則的多個輸入值（支援換行、逗號、分號分割）
 */
export function splitRuleValues(input: string, conditionType?: ConditionType): string[] {
  if (!input) return [];
  if (conditionType === 'plainHost') return [];
  if (conditionType === 'regex') {
    const lines = input.split('\n').map((s) => s.trim()).filter(Boolean);
    return lines.length > 0 ? lines : [input.trim()];
  }
  return input
    .split(/[\r\n,;]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/**
 * 檢查單一目標值語法
 */
export function validateSingleRuleValue(conditionType: ConditionType, value: string): RuleValidationResult {
  const val = value.trim();
  if (!val) {
    return { isValid: true };
  }

  switch (conditionType) {
    case 'plainHost':
      return { isValid: true };

    case 'domainSuffix':
      if (val.includes('://') || val.includes('/')) {
        return {
          isValid: false,
          messageZh: '網域後綴無須協定 (http://) 或路徑 (/)，例如：.google.com',
          messageEn: 'Domain suffix should not contain protocol or path, e.g. .google.com',
        };
      }
      return { isValid: true };

    case 'domainExact':
      if (val.includes('://') || val.includes('/')) {
        return {
          isValid: false,
          messageZh: '主機名稱無須協定或路徑，例如：api.github.com',
          messageEn: 'Hostname should not contain protocol or path, e.g. api.github.com',
        };
      }
      return { isValid: true };

    case 'wildcardHost':
      if (val.includes('://') || val.includes('/')) {
        return {
          isValid: false,
          messageZh: '主機名萬用字元無須包含路徑 (/)，例如：*.internal.*',
          messageEn: 'Hostname wildcard should not contain path (/), e.g. *.internal.*',
        };
      }
      return { isValid: true };

    case 'ipv4Cidr':
    case 'clientIpv4':
      if (!isValidIpv4CidrOrIp(val)) {
        return {
          isValid: false,
          messageZh: '請輸入有效的 IPv4 位址或 CIDR 網段 (如 192.168.1.1 或 10.0.0.0/8)',
          messageEn: 'Invalid IPv4 address or CIDR subnet (e.g. 192.168.1.1 or 10.0.0.0/8)',
        };
      }
      return { isValid: true };

    case 'ipv6Cidr':
    case 'clientIpv6':
      if (!isValidIpv6CidrOrIp(val)) {
        return {
          isValid: false,
          messageZh: '請輸入有效的 IPv6 位址或 CIDR 網段 (如 2001:db8::1 或 fc00::/7)',
          messageEn: 'Invalid IPv6 address or CIDR subnet (e.g. 2001:db8::1 or fc00::/7)',
        };
      }
      return { isValid: true };

    case 'regex':
      try {
        const cleaned = val.replace(/^\/|\/[a-z]*$/g, '');
        new RegExp(cleaned);
        return { isValid: true };
      } catch {
        return {
          isValid: false,
          messageZh: '正則表達式語法無效，請檢查特殊字元轉義',
          messageEn: 'Invalid regular expression syntax, please verify escaped characters',
        };
      }

    case 'protocol': {
      const p = val.toLowerCase().replace(/:$/, '');
      const validProtocols = ['http', 'https', 'ftp', 'ws', 'wss', 'socks'];
      if (!validProtocols.includes(p)) {
        return {
          isValid: false,
          messageZh: '請輸入常用協定，例如：http、https、ftp、ws、wss',
          messageEn: 'Please enter a valid protocol, e.g. http, https, ftp, ws, wss',
        };
      }
      return { isValid: true };
    }

    case 'port': {
      if (!/^\d+$/.test(val)) {
        return {
          isValid: false,
          messageZh: '請輸入有效通訊埠號（1 ~ 65535）',
          messageEn: 'Please enter a valid port number (1 ~ 65535)',
        };
      }
      const portNum = parseInt(val, 10);
      if (portNum < 1 || portNum > 65535) {
        return {
          isValid: false,
          messageZh: '通訊埠號超出範圍（1 ~ 65535）',
          messageEn: 'Port out of range (1 ~ 65535)',
        };
      }
      return { isValid: true };
    }

    case 'weekday': {
      const validDays = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
      const tokens = val.toUpperCase().split(/[-\s]+/);
      const allValid = tokens.every((t) => validDays.includes(t));
      if (!allValid || tokens.length > 2) {
        return {
          isValid: false,
          messageZh: '請輸入有效星期範圍，例如：MON-FRI（工作日）或 SAT-SUN（週末）',
          messageEn: 'Please enter a valid weekday range, e.g. MON-FRI or SAT-SUN',
        };
      }
      return { isValid: true };
    }

    case 'timeRange': {
      const parts = val.split(/[-:,\s]+/).map((s) => parseInt(s, 10));
      if (parts.length < 2 || isNaN(parts[0]) || isNaN(parts[1])) {
        return {
          isValid: false,
          messageZh: '請輸入小時時間範圍，例如：9-18（代表 09:00 至 18:00）',
          messageEn: 'Please enter an hour range, e.g. 9-18 (meaning 09:00 to 18:00)',
        };
      }
      if (parts[0] < 0 || parts[0] > 23 || parts[1] < 0 || parts[1] > 24) {
        return {
          isValid: false,
          messageZh: '小時數超出範圍（0 ~ 23）',
          messageEn: 'Hour out of range (0 ~ 23)',
        };
      }
      return { isValid: true };
    }

    default:
      return { isValid: true };
  }
}

/**
 * 即時檢查分流規則條件目標值語法（支援多值批次檢查）
 */
export function validateRuleValue(conditionType: ConditionType, value: string): RuleValidationResult {
  const tokens = splitRuleValues(value, conditionType);
  if (tokens.length === 0) {
    return { isValid: true };
  }

  for (let i = 0; i < tokens.length; i++) {
    const val = tokens[i];
    const res = validateSingleRuleValue(conditionType, val);
    if (!res.isValid) {
      if (tokens.length > 1) {
        return {
          isValid: false,
          messageZh: `第 ${i + 1} 項「${val}」不符合規範：${res.messageZh}`,
          messageEn: `Item #${i + 1} "${val}" is invalid: ${res.messageEn}`,
        };
      }
      return res;
    }
  }

  return { isValid: true };
}

/**
 * 解析 IPv4 CIDR 或單一 IP 字串（如 192.168.0.0/16 或 10.0.0.1）
 */
export function parseIpv4Cidr(input: string): { ip: string; mask: string } | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (trimmed.includes('/')) {
    const [ipPart, prefixPart] = trimmed.split('/');
    const prefix = parseInt(prefixPart, 10);
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return null;
    return { ip: ipPart.trim(), mask: cidrToNetmask(prefix) };
  }

  // 檢查是否已包含遮罩 (例如 "192.168.1.0 255.255.255.0")
  const parts = trimmed.split(/\s+/);
  if (parts.length === 2) {
    return { ip: parts[0], mask: parts[1] };
  }

  // 單一主機 IP 預設為 /32 (255.255.255.255)
  return { ip: trimmed, mask: '255.255.255.255' };
}

/**
 * 將 ProxyNode 物件轉換為標準 PAC Proxy 返回字串 (例如 "SOCKS5 127.0.0.1:1080"、"DIRECT" 或備援代理鏈)
 */
export function formatProxyString(node: ProxyNode, allProxies?: ProxyNode[]): string {
  if (node.type === 'DIRECT') return 'DIRECT';
  if (node.customString?.trim()) return node.customString.trim();

  // 若為備援代理鏈且定義了 hops 序列
  if (node.type === 'CHAIN' && Array.isArray(node.chainHops) && node.chainHops.length > 0) {
    const hops = node.chainHops.map((hopId) => {
      if (hopId === 'DIRECT') return 'DIRECT';
      const target = allProxies?.find((p) => p.id === hopId);
      if (target) {
        if (target.customString?.trim()) return target.customString.trim();
        if (target.type === 'DIRECT') return 'DIRECT';
        return `${target.type} ${target.host}:${target.port}`;
      }
      return hopId;
    });
    return hops.join('; ');
  }

  const host = node.host.trim() || '127.0.0.1';
  const port = node.port || 8080;
  return `${node.type} ${host}:${port}`;
}

/**
 * 格式化常數表達式（支援單行或 JavaScript 多行字串拼接格式）
 */
export function formatConstantValue(formattedStr: string, isConcat?: boolean): string {
  if (!isConcat || !formattedStr.includes(';')) {
    return `"${formattedStr}"`;
  }
  const parts = formattedStr.split(';').map((s) => s.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return `"${formattedStr}"`;
  }
  const lines = parts.map((part, i) => {
    const isLast = i === parts.length - 1;
    return isLast ? `  "${part}"` : `  "${part}; " +`;
  });
  return `\n${lines.join('\n')}`;
}

/**
 * 解析目標代理字串（可為 Proxy Node ID，或直接為 "DIRECT"，或複合 Fallback 字串）
 */
export function resolveTargetProxyString(target: string, proxies: ProxyNode[]): string {
  if (!target || target === 'DIRECT') return 'DIRECT';
  const found = proxies.find((p) => p.id === target);
  if (found) return formatProxyString(found, proxies);
  return target;
}

/**
 * 將單一條件值轉為 JavaScript 條件運算式
 */
export function buildSingleConditionExpression(
  conditionType: ConditionType,
  val: string,
  enableIpv6: boolean,
  resolveIpFirst: boolean
): string {
  switch (conditionType) {
    case 'plainHost':
      return 'isPlainHostName(host)';

    case 'domainExact':
      return `host === "${val}"`;

    case 'domainSuffix': {
      const formattedDomain = val.startsWith('.') ? val : `.${val}`;
      const apexDomain = formattedDomain.replace(/^\./, '');
      return `dnsDomainIs(host, "${formattedDomain}") || host === "${apexDomain}"`;
    }

    case 'wildcardHost':
      return `shExpMatch(host, "${val}")`;

    case 'wildcardUrl':
      return `shExpMatch(url, "${val}")`;

    case 'ipv4Cidr': {
      const parsed = parseIpv4Cidr(val);
      if (parsed) {
        if (resolveIpFirst) {
          return `isInNet(dnsResolve(host), "${parsed.ip}", "${parsed.mask}")`;
        }
        return `isInNet(host, "${parsed.ip}", "${parsed.mask}")`;
      }
      return `host === "${val}"`;
    }

    case 'ipv6Cidr': {
      if (enableIpv6) {
        const formatted = val.includes('/') ? val : `${val}/128`;
        if (resolveIpFirst) {
          return `(typeof isInNetEx === "function" && isInNetEx(dnsResolve(host), "${formatted}"))`;
        }
        return `(typeof isInNetEx === "function" && isInNetEx(host, "${formatted}"))`;
      }
      return `/* IPv6: ${val} (請啟用 IPv6 擴展) */ false`;
    }

    case 'clientIpv4': {
      const parsed = parseIpv4Cidr(val);
      if (parsed) {
        return `isInNet(myIpAddress(), "${parsed.ip}", "${parsed.mask}")`;
      }
      return `myIpAddress() === "${val}"`;
    }

    case 'clientIpv6': {
      if (enableIpv6) {
        const formatted = val.includes('/') ? val : `${val}/128`;
        return `(typeof isInNetEx === "function" && isInNetEx(myIpAddressEx(), "${formatted}"))`;
      }
      return `/* myIpAddressEx IPv6: ${val} */ false`;
    }

    case 'protocol': {
      const proto = val.toLowerCase().replace(/:$/, '');
      return `(url.substring(0, ${proto.length + 1}) === "${proto}:" || url.startsWith("${proto}:"))`;
    }

    case 'port':
      return `(shExpMatch(url, "*:${val}/*") || shExpMatch(url, "*:${val}"))`;

    case 'weekday': {
      const tokens = val.toUpperCase().split(/[-\s]+/);
      if (tokens.length >= 2) {
        return `weekdayRange("${tokens[0]}", "${tokens[1]}")`;
      }
      return `weekdayRange("${tokens[0]}")`;
    }

    case 'timeRange': {
      const parts = val.split(/[-:,\s]+/).map(Number);
      const h1 = !isNaN(parts[0]) ? parts[0] : 9;
      const h2 = !isNaN(parts[1]) ? parts[1] : 18;
      return `timeRange(${h1}, ${h2})`;
    }

    case 'regex':
      return `/${val.replace(/^\/|\/[a-z]*$/g, '')}/i.test(url)`;

    default:
      return `host === "${val}"`;
  }
}

/**
 * 將單一條件（含同類型多值，以 || 串聯）轉為 JavaScript 運算式；無合法值時回傳 null
 */
export function buildConditionGroupExpression(
  condition: { conditionType: ConditionType; value: string },
  enableIpv6: boolean,
  resolveIpFirst: boolean
): string | null {
  if (condition.conditionType === 'plainHost') {
    return 'isPlainHostName(host)';
  }

  const tokens = splitRuleValues(condition.value, condition.conditionType);
  if (tokens.length === 0) {
    return null;
  }

  if (tokens.length === 1) {
    return buildSingleConditionExpression(condition.conditionType, tokens[0], enableIpv6, resolveIpFirst);
  }

  const subExprs = tokens.map((t) =>
    buildSingleConditionExpression(condition.conditionType, t, enableIpv6, resolveIpFirst)
  );

  // 若子條件本身包含 ||，用括號包起以防優先權問題
  const formattedExprs = subExprs.map((expr) => (expr.includes(' || ') ? `(${expr})` : expr));
  return formattedExprs.join(' ||\n    ');
}

/**
 * 將分流規則轉為完整的 JavaScript 條件運算式。
 * 主要條件與 andConditions（若有）之間以 AND 疊加，各自內部的多值仍以 || 串聯。
 */
export function buildConditionExpression(
  rule: RoutingRule,
  enableIpv6: boolean,
  resolveIpFirst: boolean
): string {
  const conditions = [
    { conditionType: rule.conditionType, value: rule.value },
    ...(rule.andConditions ?? []),
  ];

  const groupExprs = conditions
    .map((c) => buildConditionGroupExpression(c, enableIpv6, resolveIpFirst))
    .filter((expr): expr is string => expr !== null);

  if (groupExprs.length === 0) {
    return 'false';
  }
  if (groupExprs.length === 1) {
    return groupExprs[0];
  }

  // 有多個群組以 AND 疊加時，若群組內為多值 || 串聯，用括號包起以防優先權混淆
  const formattedGroups = groupExprs.map((expr) => (expr.includes(' || ') ? `(${expr})` : expr));
  return formattedGroups.join(' &&\n    ');
}

/**
 * 產生乾淨且合法的 JavaScript 常數識別碼 (避免純中文轉出過多底線)
 */
export function generateProxyVarName(name: string, id: string, index: number): string {
  const sanitized = name.trim().replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').toUpperCase();
  if (sanitized.length >= 2) {
    return `PROXY_${sanitized}`;
  }
  return `PROXY_NODE_${index + 1}`;
}

/**
 * 核心：根據規則與代理池配置生成標準 PAC 檔案 JavaScript
 */
export function generatePacScript(options: {
  proxies: ProxyNode[];
  rules: RoutingRule[];
  defaultAction: string;
  enableIpv6: boolean;
  resolveIpFirst: boolean;
  title?: string;
  timestamp?: string;
}): string {
  const {
    proxies,
    rules,
    defaultAction,
    enableIpv6,
    resolveIpFirst,
    title = 'Proxy Auto-Configuration (PAC) Script',
    timestamp,
  } = options;

  const defaultProxyStr = resolveTargetProxyString(defaultAction, proxies);
  const validRules = rules.filter((r) => r.conditionType === 'plainHost' || r.value.trim().length > 0);

  const lines: string[] = [];
  lines.push('/**');
  lines.push(` * ${title}`);
  lines.push(` * Generated with Smalltools PAC Generator (https://tools.cjkuo.net/pac-generator/)`);
  if (timestamp) {
    lines.push(` * Generated at: ${timestamp}`);
  }
  lines.push(' * 100% Client-Side & Zero-Server Logging');
  lines.push(' */');
  lines.push('');

  // 宣告代理池備查常數
  lines.push('// ==================== 代理伺服器常數定義 ====================');
  proxies.forEach((p, idx) => {
    const formatted = formatProxyString(p, proxies);
    const varName = generateProxyVarName(p.name, p.id, idx);
    const comment = p.name ? ` // ${p.name}` : '';
    const valExpr = formatConstantValue(formatted, p.isConcatFormat);
    lines.push(`const ${varName} = ${valExpr};${comment}`);
  });
  lines.push(`const DEFAULT_PROXY = "${defaultProxyStr}";`);
  lines.push('');

  lines.push('// ==================== 核心路由函式 ====================');
  lines.push('function FindProxyForURL(url, host) {');
  lines.push('  // 預先轉小寫以確保比對一致性');
  lines.push('  host = host.toLowerCase();');
  lines.push('');

  if (validRules.length === 0) {
    lines.push('  // 尚未配置分流規則，直接走預設行為');
    lines.push('  return DEFAULT_PROXY;');
    lines.push('}');
    return lines.join('\n');
  }

  validRules.forEach((rule, idx) => {
    const targetStr = resolveTargetProxyString(rule.targetProxy, proxies);
    const condExpr = buildConditionExpression(rule, enableIpv6, resolveIpFirst);

    if (rule.enabled) {
      const comment = rule.name ? `// [規則 ${idx + 1}] ${rule.name}` : `// [規則 ${idx + 1}]`;
      lines.push(`  ${comment}`);
      if (rule.description) {
        lines.push(`  // 說明: ${rule.description}`);
      }
      lines.push(`  if (${condExpr}) {`);
      lines.push(`    return "${targetStr}";`);
      lines.push('  }');
      lines.push('');
    } else {
      const comment = rule.name ? `// [已停用規則 ${idx + 1}] ${rule.name}` : `// [已停用規則 ${idx + 1}]`;
      lines.push(`  ${comment}`);
      if (rule.description) {
        lines.push(`  // 說明: ${rule.description}`);
      }
      lines.push(`  // if (${condExpr}) { return "${targetStr}"; }`);
      lines.push('');
    }
  });

  lines.push('  // ==================== 預設行為 ====================');
  lines.push('  return DEFAULT_PROXY;');
  lines.push('}');
  lines.push('');

  return lines.join('\n');
}

/**
 * 產生 Data URL (RFC 2397)，方便直接複製並貼入作業系統或外掛 PAC 網址
 */
export function generatePacDataUrl(pacScript: string): string {
  const base64 = typeof window !== 'undefined'
    ? window.btoa(unescape(encodeURIComponent(pacScript)))
    : Buffer.from(pacScript, 'utf-8').toString('base64');
  return `data:application/x-ns-proxy-autoconfig;base64,${base64}`;
}

/**
 * 四大精選情境範本
 */
export const PRESET_TEMPLATES: PacPreset[] = [
  {
    id: 'corporate-bypass',
    nameZh: '企業內網直連 + 外網代理',
    nameEn: 'Corporate LAN Bypass & Proxy',
    descriptionZh: 'RFC 1918 私有 IP、本機與企業內部網域直連 (DIRECT)，其餘所有網際網路流量均轉發至公司代理伺服器。',
    descriptionEn: 'RFC 1918 private subnets, localhost, and internal domains go DIRECT; all public traffic routes through corporate proxy.',
    proxies: [
      { id: 'p_corp', name: '公司外網代理', type: 'PROXY', host: 'proxy.company.com', port: 8080 },
      { id: 'p_backup', name: '備援外網代理', type: 'PROXY', host: 'backup-proxy.company.com', port: 8080 },
    ],
    rules: [
      { id: 'r1', name: '本機無點純主機名 (如 intranet/)', enabled: true, conditionType: 'plainHost', value: '', targetProxy: 'DIRECT', description: '純主機名直接連線' },
      { id: 'r2', name: '本機回傳與內部測試網域', enabled: true, conditionType: 'domainSuffix', value: '.local', targetProxy: 'DIRECT', description: '.local 結尾之 mDNS / 區域網域' },
      { id: 'r3', name: '公司內部網域', enabled: true, conditionType: 'domainSuffix', value: '.corp.internal', targetProxy: 'DIRECT', description: '公司內網私有網域' },
      { id: 'r4', name: '私有 A 類網段 (10.0.0.0/8)', enabled: true, conditionType: 'ipv4Cidr', value: '10.0.0.0/8', targetProxy: 'DIRECT' },
      { id: 'r5', name: '私有 B 類網段 (172.16.0.0/12)', enabled: true, conditionType: 'ipv4Cidr', value: '172.16.0.0/12', targetProxy: 'DIRECT' },
      { id: 'r6', name: '私有 C 類網段 (192.168.0.0/16)', enabled: true, conditionType: 'ipv4Cidr', value: '192.168.0.0/16', targetProxy: 'DIRECT' },
      { id: 'r7', name: 'IPv6 唯一本地位址 (fc00::/7)', enabled: true, conditionType: 'ipv6Cidr', value: 'fc00::/7', targetProxy: 'DIRECT' },
      { id: 'r8', name: 'IPv6 區域鏈路位址 (fe80::/10)', enabled: true, conditionType: 'ipv6Cidr', value: 'fe80::/10', targetProxy: 'DIRECT' },
    ],
    defaultAction: 'p_corp',
    enableIpv6: true,
    resolveIpFirst: false,
  },
  {
    id: 'developer-local',
    nameZh: '本地開發者除錯環境 (Localhost Bypass)',
    nameEn: 'Developer Localhost Bypass',
    descriptionZh: 'Localhost、Docker、Minikube、127.0.0.1 及本機測試網域直連，外部請求透過本機 SOCKS5 代理轉發。',
    descriptionEn: 'Localhost, Docker, Minikube, and local dev domains go DIRECT; external requests route through local SOCKS5 proxy.',
    proxies: [
      { id: 'p_socks', name: '本機 SOCKS5', type: 'SOCKS5', host: '127.0.0.1', port: 1080 },
    ],
    rules: [
      { id: 'd1', name: '純主機名', enabled: true, conditionType: 'plainHost', value: '', targetProxy: 'DIRECT' },
      { id: 'd2', name: 'Localhost 網域', enabled: true, conditionType: 'domainExact', value: 'localhost', targetProxy: 'DIRECT' },
      { id: 'd3', name: '本機 IPv4 環回位址', enabled: true, conditionType: 'ipv4Cidr', value: '127.0.0.0/8', targetProxy: 'DIRECT' },
      { id: 'd4', name: '開發測試網域 (*.test)', enabled: true, conditionType: 'domainSuffix', value: '.test', targetProxy: 'DIRECT' },
      { id: 'd5', name: '開發測試網域 (*.local)', enabled: true, conditionType: 'domainSuffix', value: '.local', targetProxy: 'DIRECT' },
    ],
    defaultAction: 'p_socks',
    enableIpv6: true,
    resolveIpFirst: false,
  },
  {
    id: 'whitelist-proxy',
    nameZh: '指定服務代理名單 (Proxy Whitelist)',
    nameEn: 'Selective Service Proxy Whitelist',
    descriptionZh: '僅針對特定外網雲端服務（如 Google、GitHub、OpenAI、AWS）走指定代理節點，其餘流量一律 DIRECT 直連。',
    descriptionEn: 'Route only designated cloud services (Google, GitHub, OpenAI, etc.) through proxy; all other traffic connects DIRECT.',
    proxies: [
      { id: 'p_fast', name: '高速翻牆/雲端代理', type: 'SOCKS5', host: '127.0.0.1', port: 7890 },
    ],
    rules: [
      { id: 'w1', name: 'Google 相關服務', enabled: true, conditionType: 'domainSuffix', value: '.google.com', targetProxy: 'p_fast' },
      { id: 'w2', name: 'GitHub 服務', enabled: true, conditionType: 'domainSuffix', value: '.github.com', targetProxy: 'p_fast' },
      { id: 'w3', name: 'OpenAI / ChatGPT', enabled: true, conditionType: 'domainSuffix', value: '.openai.com', targetProxy: 'p_fast' },
      { id: 'w4', name: 'Anthropic / Claude', enabled: true, conditionType: 'domainSuffix', value: '.anthropic.com', targetProxy: 'p_fast' },
      { id: 'w5', name: 'YouTube 影音', enabled: true, conditionType: 'domainSuffix', value: '.youtube.com', targetProxy: 'p_fast' },
    ],
    defaultAction: 'DIRECT',
    enableIpv6: true,
    resolveIpFirst: false,
  },
  {
    id: 'blank-template',
    nameZh: '空白自訂範本',
    nameEn: 'Blank Custom Configuration',
    descriptionZh: '乾淨的初始畫布，由您自由新增代理伺服器節點與客製化分流條件。',
    descriptionEn: 'A clean slate to freely add proxy servers and customized routing rules from scratch.',
    proxies: [
      { id: 'p_custom', name: '我的代理伺服器', type: 'PROXY', host: '192.168.1.1', port: 8080 },
    ],
    rules: [
      { id: 'b1', name: '區域網路直連', enabled: true, conditionType: 'ipv4Cidr', value: '192.168.0.0/16', targetProxy: 'DIRECT' },
    ],
    defaultAction: 'DIRECT',
    enableIpv6: true,
    resolveIpFirst: false,
  },
];

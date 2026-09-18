import type { ConditionType, PacPreset, ProxyNode, RoutingRule } from './types.ts';

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
 * 解析 IPv4 CIDR 字串（如 192.168.0.0/16 或 10.0.0.1）
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

  // 單一主機 IP 預設為 /32
  return { ip: trimmed, mask: '255.255.255.255' };
}

/**
 * 將 ProxyNode 物件轉換為標準 PAC Proxy 返回字串 (例如 "SOCKS5 127.0.0.1:1080" 或 "DIRECT")
 */
export function formatProxyString(node: ProxyNode): string {
  if (node.type === 'DIRECT') return 'DIRECT';
  if (node.customString?.trim()) return node.customString.trim();
  const host = node.host.trim() || '127.0.0.1';
  const port = node.port || 8080;
  return `${node.type} ${host}:${port}`;
}

/**
 * 解析目標代理字串（可為 Proxy Node ID，或直接為 "DIRECT"，或複合 Fallback 字串）
 */
export function resolveTargetProxyString(target: string, proxies: ProxyNode[]): string {
  if (!target || target === 'DIRECT') return 'DIRECT';
  const found = proxies.find((p) => p.id === target);
  if (found) return formatProxyString(found);
  return target;
}

/**
 * 將單一條件轉為 JavaScript 條件運算式
 */
export function buildConditionExpression(
  rule: RoutingRule,
  enableIpv6: boolean,
  resolveIpFirst: boolean
): string {
  const val = rule.value.trim();

  switch (rule.conditionType) {
    case 'plainHost':
      return 'isPlainHostName(host)';

    case 'domainExact':
      return `host === "${val}"`;

    case 'domainSuffix': {
      const formattedDomain = val.startsWith('.') ? val : `.${val}`;
      return `dnsDomainIs(host, "${formattedDomain}") || host === "${formattedDomain.slice(1)}"`;
    }

    case 'wildcardHost':
      return `shExpMatch(host, "${val}")`;

    case 'wildcardUrl':
      return `shExpMatch(url, "${val}")`;

    case 'ipv4Cidr': {
      const parsed = parseIpv4Cidr(val);
      if (!parsed) return `isInNet(host, "${val}", "255.255.255.0")`;
      if (resolveIpFirst) {
        return `isInNet(dnsResolve(host), "${parsed.ip}", "${parsed.mask}")`;
      }
      return `isInNet(host, "${parsed.ip}", "${parsed.mask}")`;
    }

    case 'ipv6Cidr': {
      if (enableIpv6) {
        if (resolveIpFirst) {
          return `(typeof isInNetEx === "function" && isInNetEx(dnsResolve(host), "${val}"))`;
        }
        return `(typeof isInNetEx === "function" && isInNetEx(host, "${val}"))`;
      }
      return `/* IPv6: ${val} (請啟用 IPv6 擴展) */ false`;
    }

    case 'regex':
      return `/${val.replace(/^\/|\/[a-z]*$/g, '')}/i.test(url)`;

    default:
      return `host === "${val}"`;
  }
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
}): string {
  const {
    proxies,
    rules,
    defaultAction,
    enableIpv6,
    resolveIpFirst,
    title = 'Proxy Auto-Configuration (PAC) Script',
  } = options;

  const defaultProxyStr = resolveTargetProxyString(defaultAction, proxies);
  const activeRules = rules.filter((r) => r.enabled && (r.conditionType === 'plainHost' || r.value.trim().length > 0));

  const lines: string[] = [];
  lines.push('/**');
  lines.push(` * ${title}`);
  lines.push(` * Generated with Smalltools PAC Generator (https://tools.cjkuo.net/pac-generator/)`);
  lines.push(` * Generated at: ${new Date().toISOString()}`);
  lines.push(' * 100% Client-Side & Zero-Server Logging');
  lines.push(' */');
  lines.push('');

  // 宣告代理池備查常數
  lines.push('// ==================== 代理伺服器常數定義 ====================');
  proxies.forEach((p) => {
    const formatted = formatProxyString(p);
    const varName = `PROXY_${p.name.replace(/[^a-zA-Z0-9_]/g, '_').toUpperCase() || p.id.toUpperCase()}`;
    lines.push(`const ${varName} = "${formatted}";`);
  });
  lines.push(`const DEFAULT_PROXY = "${defaultProxyStr}";`);
  lines.push('');

  lines.push('// ==================== 核心路由函式 ====================');
  lines.push('function FindProxyForURL(url, host) {');
  lines.push('  // 預先轉小寫以確保比對一致性');
  lines.push('  host = host.toLowerCase();');
  lines.push('');

  if (activeRules.length === 0) {
    lines.push('  // 尚未配置分流規則，直接走預設行為');
    lines.push('  return DEFAULT_PROXY;');
    lines.push('}');
    return lines.join('\n');
  }

  activeRules.forEach((rule, idx) => {
    const targetStr = resolveTargetProxyString(rule.targetProxy, proxies);
    const condExpr = buildConditionExpression(rule, enableIpv6, resolveIpFirst);
    const comment = rule.name ? `// [規則 ${idx + 1}] ${rule.name}` : `// [規則 ${idx + 1}]`;

    lines.push(`  ${comment}`);
    if (rule.description) {
      lines.push(`  // 說明: ${rule.description}`);
    }
    lines.push(`  if (${condExpr}) {`);
    lines.push(`    return "${targetStr}";`);
    lines.push('  }');
    lines.push('');
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

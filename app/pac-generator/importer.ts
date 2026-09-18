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
  let enableIpv6 = /isInNetEx|IPv6|dnsResolveEx|myIpAddressEx/i.test(raw);
  let resolveIpFirst = /dnsResolve\s*\(\s*host\s*\)|hostIP\s*=|isResolvable/i.test(raw);
  let defaultAction = 'DIRECT';

  const proxies: ProxyNode[] = [];
  const rules: RoutingRule[] = [];

  // 提取所有代理節點字串 (支援字串拼接與引號內分號)
  const returnExpressions = extractReturnExpressions(raw);
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

  const ifBlocks = extractAllIfBlocks(raw);
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

    // 清洗註解作為規則名稱
    let ruleName = blockComment
      .replace(/^(Don't proxy|Route|Proxy|Bypass)\s+/i, '')
      .replace(/\*+/g, '')
      .trim();
    if (!ruleName || ruleName.length > 50) {
      ruleName = `分流規則 ${ruleIndex}`;
    }

    // 是否為用戶端本機 IP (myIpAddress / myIpAddressEx)
    const isClientIp = condition.includes('myIpAddress');

    // 1. 純主機名
    if (condition.includes('isPlainHostName')) {
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
    if (condition.includes('isInNet(') || condition.includes('isInNet (')) {
      const ipMatches = Array.from(
        condition.matchAll(/isInNet\s*\(\s*[^,]+,\s*['"]([^'"]+)['"],\s*['"]([^'"]+)['"]\s*\)/g)
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
    if (condition.includes('isInNetEx')) {
      const ip6Matches = Array.from(
        condition.matchAll(/isInNetEx\s*\(\s*[^,]+,\s*['"]([^'"]+)['"]\s*\)/g)
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
    if (condition.includes('url.substring') || condition.includes('url.startsWith')) {
      const protoMatches = Array.from(condition.matchAll(/['"]([a-zA-Z0-9]+):?['"]/g));
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
    if (condition.includes('shExpMatch') && condition.includes('*:')) {
      const portMatches = Array.from(condition.matchAll(/\*:(\d+)/g));
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
    if (condition.includes('weekdayRange')) {
      const dayMatches = Array.from(condition.matchAll(/weekdayRange\s*\(\s*['"]([^'"]+)['"](?:,\s*['"]([^'"]+)['"])?/g));
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
    if (condition.includes('timeRange')) {
      const timeMatches = Array.from(condition.matchAll(/timeRange\s*\(\s*(\d+)(?:,\s*(\d+))?/g));
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
    if (condition.includes('dnsDomainIs') || condition.includes('host ==') || condition.includes('host ===') || condition.includes('localHostOrDomainIs')) {
      const domainMatches = Array.from(
        condition.matchAll(/dnsDomainIs\s*\(\s*host,\s*['"]([^'"]+)['"]\s*\)/g)
      );
      const hostMatches = Array.from(
        condition.matchAll(/(?:host\s*===?|host\s*==)\s*['"]([^'"]+)['"]/g)
      );

      const domainList: string[] = [];
      domainMatches.forEach((m) => domainList.push(m[1].trim()));
      hostMatches.forEach((m) => domainList.push(m[1].trim()));

      if (domainList.length > 0) {
        // 整理去重
        const cleanedDomains = Array.from(
          new Set(
            domainList.map((d) => {
              // 若同時有 .example.com 與 example.com，統一保留乾淨網域名稱
              return d.startsWith('.') ? d.slice(1) : d;
            })
          )
        );

        const hasSuffix = domainMatches.length > 0;
        rules.push({
          id: `rule_${Date.now()}_${ruleIndex++}`,
          name: blockComment || (hasSuffix ? '特定網域分流' : '精確主機分流'),
          enabled: true,
          conditionType: hasSuffix ? 'domainSuffix' : 'domainExact',
          value: cleanedDomains.join('\n'),
          targetProxy,
          description: blockComment || undefined,
        });
        continue;
      }
    }

    // 9. 主機名萬用字元 (shExpMatch host)
    if (condition.includes('shExpMatch') && condition.includes('host')) {
      const matchPatterns = Array.from(
        condition.matchAll(/shExpMatch\s*\(\s*host,\s*['"]([^'"]+)['"]\s*\)/g)
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
    if (condition.includes('shExpMatch') && condition.includes('url')) {
      const matchPatterns = Array.from(
        condition.matchAll(/shExpMatch\s*\(\s*url,\s*['"]([^'"]+)['"]\s*\)/g)
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
    if (condition.includes('.test(url)') || condition.includes('.test(host)')) {
      const regexMatch = condition.match(/\/([^\/]+)\/([a-z]*)\.test/);
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
    warnings.push(`條件「${condition.slice(0, 30)}...」未能完全解析為標準樣式，已轉換為 URL 萬用比對。`);
    rules.push({
      id: `rule_${Date.now()}_${ruleIndex++}`,
      name: blockComment || `自訂規則 ${ruleIndex}`,
      enabled: true,
      conditionType: 'wildcardUrl',
      value: condition,
      targetProxy,
      description: blockComment || undefined,
    });
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

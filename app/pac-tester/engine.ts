import type {
  MockContext,
  PacBatchItemResult,
  PacLintIssue,
  PacSingleTestResult,
  PacTestTraceStep,
} from './types.ts';

/**
 * 將 IPv4 字串轉為 32-bit 無號整數
 */
export function ipv4ToInt(ip: string): number | null {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return null;
  let res = 0;
  for (let i = 0; i < 4; i++) {
    const num = parseInt(parts[i], 10);
    if (isNaN(num) || num < 0 || num > 255 || parts[i] !== String(num)) return null;
    res = ((res << 8) | num) >>> 0;
  }
  return res >>> 0;
}

/**
 * 將 IPv6 字串展開並解析為 128-bit BigInt
 */
export function ipv6ToBigInt(ip: string): bigint | null {
  try {
    let clean = ip.trim().toLowerCase();
    // 去除可選的方括號例如 [2001:db8::1]
    if (clean.startsWith('[') && clean.endsWith(']')) {
      clean = clean.slice(1, -1);
    }
    // 檢查是否有包含 IPv4 映射 (如 ::ffff:192.168.1.1)
    if (clean.includes('.')) {
      const lastColon = clean.lastIndexOf(':');
      if (lastColon === -1) return null;
      const ipv4Part = clean.slice(lastColon + 1);
      const ipv4Int = ipv4ToInt(ipv4Part);
      if (ipv4Int === null) return null;
      const hex1 = ((ipv4Int >>> 16) & 0xffff).toString(16);
      const hex2 = (ipv4Int & 0xffff).toString(16);
      clean = clean.slice(0, lastColon + 1) + hex1 + ':' + hex2;
    }

    const doubleColonCount = (clean.match(/::/g) || []).length;
    if (doubleColonCount > 1) return null;

    let parts: string[] = [];
    if (clean.includes('::')) {
      const [left, right] = clean.split('::');
      const leftParts = left ? left.split(':') : [];
      const rightParts = right ? right.split(':') : [];
      const missingZeros = 8 - (leftParts.length + rightParts.length);
      if (missingZeros < 0) return null;
      parts = [...leftParts, ...Array(missingZeros).fill('0'), ...rightParts];
    } else {
      parts = clean.split(':');
      if (parts.length !== 8) return null;
    }

    if (parts.length !== 8) return null;

    let result = BigInt(0);
    for (let i = 0; i < 8; i++) {
      const val = parseInt(parts[i], 16);
      if (isNaN(val) || val < 0 || val > 0xffff) return null;
      result = (result << BigInt(16)) | BigInt(val);
    }
    return result;
  } catch {
    return null;
  }
}

/**
 * 萬用字元轉正則匹配 (shExpMatch)
 */
export function matchShExp(str: string, pattern: string): boolean {
  try {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp(`^${escaped}$`, 'i');
    return regex.test(str);
  } catch {
    return false;
  }
}

/**
 * IPv4 子網段比對 (isInNet)
 */
export function checkIsInNet(ip: string, pattern: string, mask: string): boolean {
  const ipInt = ipv4ToInt(ip);
  const patInt = ipv4ToInt(pattern);
  const maskInt = ipv4ToInt(mask);
  if (ipInt === null || patInt === null || maskInt === null) return false;
  return (ipInt & maskInt) === (patInt & maskInt);
}

/**
 * IPv6 / IPv4 擴充前綴比對 (isInNetEx)
 */
export function checkIsInNetEx(ip: string, prefixWithMask: string): boolean {
  const trimmedPrefix = prefixWithMask.trim();
  const [prefixIp, prefixLenStr] = trimmedPrefix.split('/');
  if (!prefixIp || prefixLenStr === undefined) return false;
  const prefixLen = parseInt(prefixLenStr, 10);
  if (isNaN(prefixLen)) return false;

  // 判斷是否為 IPv6
  if (trimmedPrefix.includes(':')) {
    const ipBig = ipv6ToBigInt(ip);
    const prefixBig = ipv6ToBigInt(prefixIp);
    if (ipBig === null || prefixBig === null) return false;
    if (prefixLen < 0 || prefixLen > 128) return false;
    if (prefixLen === 0) return true;

    const maskBig = ((BigInt(1) << BigInt(prefixLen)) - BigInt(1)) << BigInt(128 - prefixLen);
    return (ipBig & maskBig) === (prefixBig & maskBig);
  }

  // IPv4 CIDR 比對
  const ipInt = ipv4ToInt(ip);
  const patInt = ipv4ToInt(prefixIp);
  if (ipInt === null || patInt === null) return false;
  if (prefixLen < 0 || prefixLen > 32) return false;
  const maskInt = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  return (ipInt & maskInt) === (patInt & maskInt);
}

/**
 * 建立標準 PAC 模擬沙盒環境
 */
export function createPacSandbox(
  mockContext: MockContext,
  traceSteps: PacTestTraceStep[]
) {
  const recordTrace = (fnName: string, args: (string | number | boolean)[], result: string | number | boolean) => {
    traceSteps.push({
      functionName: fnName,
      args,
      result,
    });
    return result;
  };

  const isPlainHostName = (host: string) => {
    if (typeof host !== 'string') return false;
    // IPv6 位址 (含冒號或中括號) 不屬於純主機名稱
    if (host.includes(':') || host.startsWith('[')) {
      return recordTrace('isPlainHostName', [host], false);
    }
    const res = host.indexOf('.') === -1;
    return recordTrace('isPlainHostName', [host], res);
  };

  const dnsDomainIs = (host: string, domain: string) => {
    if (typeof host !== 'string' || typeof domain !== 'string') return false;
    const h = host.toLowerCase();
    const d = domain.toLowerCase();
    let res = false;
    if (d.startsWith('.')) {
      res = h === d.slice(1) || h.endsWith(d);
    } else {
      res = h === d || h.endsWith(`.${d}`);
    }
    return recordTrace('dnsDomainIs', [host, domain], res);
  };

  const localHostOrDomainIs = (host: string, hostdom: string) => {
    if (typeof host !== 'string' || typeof hostdom !== 'string') return false;
    const h = host.toLowerCase();
    const hd = hostdom.toLowerCase();
    const res = h === hd || (h.indexOf('.') === -1 && hd.startsWith(h + '.'));
    return recordTrace('localHostOrDomainIs', [host, hostdom], res);
  };

  const isResolvable = (host: string) => {
    const res = true;
    return recordTrace('isResolvable', [host], res);
  };

  const dnsResolve = (host: string) => {
    if (typeof host !== 'string') return '';
    const h = host.toLowerCase();
    // 優先查 Mock DNS 字典
    if (mockContext.dnsMap[h]) {
      const resolved = mockContext.dnsMap[h].split(/[\s,]+/)[0];
      return recordTrace('dnsResolve', [host], resolved) as string;
    }
    // 若本身即為 IPv4 或 IPv6 則直接回傳
    if (ipv4ToInt(h) !== null || ipv6ToBigInt(h) !== null) {
      return recordTrace('dnsResolve', [host], host) as string;
    }
    // 依域名性質模擬安全 IP
    if (h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.corp')) {
      return recordTrace('dnsResolve', [host], '10.0.0.100') as string;
    }
    const defaultPublicIp = '93.184.216.34'; // example.com
    return recordTrace('dnsResolve', [host], defaultPublicIp) as string;
  };

  const myIpAddress = () => {
    const res = mockContext.clientIpv4 || '192.168.1.100';
    return recordTrace('myIpAddress', [], res) as string;
  };

  const dnsDomainLevels = (host: string) => {
    if (typeof host !== 'string') return 0;
    const res = (host.match(/\./g) || []).length;
    return recordTrace('dnsDomainLevels', [host], res) as number;
  };

  const shExpMatch = (str: string, shexp: string) => {
    const res = matchShExp(str, shexp);
    return recordTrace('shExpMatch', [str, shexp], res);
  };

  const isInNet = (host: string, pattern: string, mask: string) => {
    let checkIp = host;
    if (ipv4ToInt(host) === null) {
      checkIp = dnsResolve(host);
    }
    const res = checkIsInNet(checkIp, pattern, mask);
    return recordTrace('isInNet', [host, pattern, mask], res);
  };

  // IPv6 現代瀏覽器擴充函式
  const isInNetEx = (ipAddress: string, ipPrefix: string) => {
    let checkIp = ipAddress;
    if (ipv4ToInt(ipAddress) === null && ipv6ToBigInt(ipAddress) === null) {
      checkIp = dnsResolve(ipAddress);
    }
    const res = checkIsInNetEx(checkIp, ipPrefix);
    return recordTrace('isInNetEx', [ipAddress, ipPrefix], res);
  };

  const dnsResolveEx = (host: string) => {
    const ipv4 = dnsResolve(host);
    const ipv6 = '2001:db8::1';
    const res = `${ipv4};${ipv6}`;
    return recordTrace('dnsResolveEx', [host], res) as string;
  };

  const myIpAddressEx = () => {
    const ipv4 = mockContext.clientIpv4 || '192.168.1.100';
    const ipv6 = mockContext.clientIpv6 || '2001:db8::100';
    const res = `${ipv4};${ipv6}`;
    return recordTrace('myIpAddressEx', [], res) as string;
  };

  const isResolvableEx = (host: string) => {
    return recordTrace('isResolvableEx', [host], true);
  };

  return {
    isPlainHostName,
    dnsDomainIs,
    localHostOrDomainIs,
    isResolvable,
    isInNet,
    dnsResolve,
    myIpAddress,
    dnsDomainLevels,
    shExpMatch,
    isInNetEx,
    dnsResolveEx,
    myIpAddressEx,
    isResolvableEx,
  };
}

/**
 * 解析 URL 取得 protocol, host, port 等資訊
 */
export function parseTargetUrl(rawUrl: string): {
  url: string;
  host: string;
  protocol: string;
  port: string;
} {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url) && !/^ftp:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  try {
    const parsed = new URL(url);
    let host = parsed.hostname;
    if (host.startsWith('[') && host.endsWith(']')) {
      host = host.slice(1, -1);
    }
    const protocol = parsed.protocol.replace(':', '');
    const port = parsed.port || (protocol === 'https' ? '443' : protocol === 'http' ? '80' : '21');
    return { url, host, protocol, port };
  } catch {
    let cleanHost = url.replace(/^[a-z]+:\/\//i, '').split('/')[0].split(':')[0];
    if (cleanHost.startsWith('[') && cleanHost.endsWith(']')) {
      cleanHost = cleanHost.slice(1, -1);
    }
    return { url, host: cleanHost || url, protocol: 'https', port: '443' };
  }
}

/**
 * 判斷回傳字串的狀態等級
 */
export function classifyProxyStatus(
  returnString: string
): 'DIRECT' | 'PROXY' | 'SOCKS' | 'HTTPS' | 'ERROR' {
  const upper = (returnString || '').toUpperCase().trim();
  if (!upper) return 'ERROR';
  if (upper.startsWith('DIRECT')) return 'DIRECT';
  if (upper.includes('SOCKS')) return 'SOCKS';
  if (upper.includes('HTTPS')) return 'HTTPS';
  if (upper.includes('PROXY') || upper.includes('HTTP')) return 'PROXY';
  return 'DIRECT';
}

/**
 * 執行單次 PAC 模擬測試
 */
export function runSinglePacTest(
  pacScript: string,
  testUrl: string,
  mockContext: MockContext
): PacSingleTestResult {
  const { url, host, protocol, port } = parseTargetUrl(testUrl);
  const traceSteps: PacTestTraceStep[] = [];
  const startTime = performance.now();

  try {
    const sandbox = createPacSandbox(mockContext, traceSteps);

    // 建立安全的封閉執行作用域，阻斷對全域物件的存取
    const sandboxScopeKeys = Object.keys(sandbox);
    const sandboxScopeValues = Object.values(sandbox);

    // 防護遮罩：阻斷 window, document, fetch 等瀏覽器環境
    const forbiddenGlobals = [
      'window',
      'document',
      'globalThis',
      'fetch',
      'XMLHttpRequest',
      'localStorage',
      'sessionStorage',
      'indexedDB',
      'WebSocket',
    ];

    const runnerCode = `
      "use strict";
      ${pacScript}
      if (typeof FindProxyForURL !== "function") {
        throw new Error("PAC 腳本中未定義 FindProxyForURL(url, host) 函式！");
      }
      return FindProxyForURL(PAC_TEST_URL, PAC_TEST_HOST);
    `;

    const evaluator = new Function(
      ...forbiddenGlobals,
      ...sandboxScopeKeys,
      'PAC_TEST_URL',
      'PAC_TEST_HOST',
      runnerCode
    );

    const forbiddenMocks = forbiddenGlobals.map(() => undefined);
    const rawResult = evaluator(
      ...forbiddenMocks,
      ...sandboxScopeValues,
      url,
      host
    );

    const returnString = typeof rawResult === 'string' ? rawResult : String(rawResult || '');
    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    const status = classifyProxyStatus(returnString);

    return {
      url,
      host,
      protocol,
      port,
      returnString,
      status,
      executionTimeMs: duration,
      traceSteps,
    };
  } catch (err: unknown) {
    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      url,
      host,
      protocol,
      port,
      returnString: 'ERROR',
      status: 'ERROR',
      executionTimeMs: duration,
      traceSteps,
      error: errorMsg,
    };
  }
}

/**
 * 執行批次回歸測試
 */
export function runBatchPacTest(
  pacScript: string,
  urls: string[],
  mockContext: MockContext
): PacBatchItemResult[] {
  return urls
    .map((u) => u.trim())
    .filter((u) => u.length > 0)
    .map((url, idx) => {
      const res = runSinglePacTest(pacScript, url, mockContext);
      return {
        id: `batch_${idx + 1}`,
        url: res.url,
        host: res.host,
        returnString: res.returnString,
        status: res.status,
        executionTimeMs: res.executionTimeMs,
        error: res.error,
      };
    });
}

/**
 * PAC 靜態語法與相容性診斷 (Static Linter)
 */
export function lintPacScript(pacScript: string): PacLintIssue[] {
  const issues: PacLintIssue[] = [];
  const script = pacScript.trim();

  if (!script) {
    issues.push({
      severity: 'error',
      messageZh: '尚未輸入 PAC 腳本內容。',
      messageEn: 'PAC script content is empty.',
    });
    return issues;
  }

  // 1. 檢查 FindProxyForURL 函式
  if (!script.includes('FindProxyForURL')) {
    issues.push({
      severity: 'error',
      messageZh: '未找到 FindProxyForURL(url, host) 函式定義，此為 PAC 規範的唯一核心入口。',
      messageEn: 'Missing FindProxyForURL(url, host) function definition.',
    });
  }

  // 2. 檢查舊版 isInNet 使用 IPv6 的情況
  const isInNetIpv6Match = script.match(/isInNet\s*\([^)]*:[^)]*\)/);
  if (isInNetIpv6Match) {
    issues.push({
      severity: 'warning',
      messageZh: '偵測到在傳統 isInNet() 中使用包含冒號「:」的 IPv6 位址。建議改用 IPv6 擴展函式 isInNetEx()。',
      messageEn: 'Detected IPv6 address in legacy isInNet(). Consider upgrading to isInNetEx() for IPv6 support.',
    });
  }

  // 3. 檢查是否存在 return 語句
  if (!script.includes('return')) {
    issues.push({
      severity: 'warning',
      messageZh: '腳本中似乎沒有任何 return 語句，可能導致未回傳有效的代理指令。',
      messageEn: 'No return statement detected in the script.',
    });
  }

  // 4. 檢查常用回傳標籤拼寫
  const hasValidReturnToken = /(DIRECT|PROXY|SOCKS|SOCKS5|HTTPS)/i.test(script);
  if (!hasValidReturnToken) {
    issues.push({
      severity: 'info',
      messageZh: '未偵測到常見的 DIRECT、PROXY 或 SOCKS5 回傳關鍵字，請確認傳回值格式是否符合標準。',
      messageEn: 'Standard return tokens (DIRECT, PROXY, SOCKS5) not found.',
    });
  }

  return issues;
}

/**
 * 預設測試用示範 PAC 腳本
 */
export const SAMPLE_PAC_SCRIPT = `function FindProxyForURL(url, host) {
  // 1. 純主機名稱 (如 http://intranet/) 直連
  if (isPlainHostName(host)) {
    return "DIRECT";
  }

  // 2. 本地開發環境直連
  if (dnsDomainIs(host, ".local") || host === "localhost") {
    return "DIRECT";
  }

  // 3. 私有 IPv4 網段直連
  if (isInNet(host, "10.0.0.0", "255.0.0.0") ||
      isInNet(host, "172.16.0.0", "255.240.0.0") ||
      isInNet(host, "192.168.0.0", "255.255.0.0") ||
      isInNet(host, "127.0.0.0", "255.0.0.0")) {
    return "DIRECT";
  }

  // 4. 支援 IPv6 唯一本地位址 (ULA) 直連
  if (typeof isInNetEx === "function" && isInNetEx(host, "fc00::/7")) {
    return "DIRECT";
  }

  // 5. 企業內部私有網域
  if (dnsDomainIs(host, ".corp.internal")) {
    return "DIRECT";
  }

  // 6. 指定外部雲端走 SOCKS5 代理
  if (dnsDomainIs(host, ".google.com") || dnsDomainIs(host, ".github.com")) {
    return "SOCKS5 127.0.0.1:1080; DIRECT";
  }

  // 7. 其餘流量走公司代理，故障時降階直連
  return "PROXY proxy.company.com:8080; DIRECT";
}`;

/**
 * 預設批量測試用 URL 清單
 */
export const DEFAULT_BATCH_TEST_URLS = [
  'http://intranet/dashboard',
  'https://localhost:3000',
  'http://192.168.1.1/admin',
  'https://10.20.30.40:8443/api',
  'https://git.corp.internal/repo',
  'https://www.google.com/search',
  'https://github.com/trending',
  'https://developer.mozilla.org/zh-TW/',
  'https://news.ycombinator.com',
  'https://[fc00::1]/service',
];

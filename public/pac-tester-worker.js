/**
 * PAC 測試器（/pac-tester）專用的獨立 Worker 執行緒。
 *
 * 使用者貼上的 PAC 腳本內容完全不受控（可能含無窮迴圈或效能極差的比對邏輯）。
 * 若直接在主執行緒以 new Function() 同步 eval 執行，一旦腳本卡住就會凍結整個
 * 分頁且無法恢復。搬到這支獨立 Worker 執行後，主執行緒維持可回應狀態，呼叫端
 * （見 app/pac-tester/pacWorkerClient.ts）可設定逾時並呼叫 worker.terminate()
 * 強制中止卡死的腳本。
 *
 * 放在 public/ 而非透過 `new Worker(new URL('./x.ts', import.meta.url))` 讓打包器
 * 自動切 chunk，是因為實測發現本專案使用的 Next.js 版本在 Turbopack + 靜態匯出
 * （next.config.ts 的 output: 'export'）組合下，並不會把該 pattern 編譯成可執行
 * 的 JS chunk，而是把 .ts 原始碼原封不動複製成靜態資源，瀏覽器載入後會直接報錯。
 * 改用 webpack（next build --webpack）則正常，但切換全站打包器影響所有其他 40+
 * 個工具，屬於需要另外評估的獨立決策。改放 public/ 以純靜態檔案提供則不受此
 * 打包器限制影響，任何打包器都能穩定運作（沿用本專案 public/sw.js 的既有作法）。
 *
 * ⚠️ 這份程式是 app/pac-tester/engine.ts 中 IP 解析、PAC 沙盒模擬與
 * runSinglePacTest / runBatchPacTest 邏輯的手動同步副本（拿掉 TypeScript 型別
 * 標註後的純 JS 版本，因為 Worker 不經過 Next.js/TypeScript 編譯管線）。修改
 * engine.ts 的這些函式時必須同步修改這裡；tests/engine/pac-tester-worker.test.mjs
 * 會在 Node 中直接載入這支檔案，並比對它與 engine.ts 真正實作在同一組測試案例下
 * 的輸出是否逐位元一致，兩邊沒同步時測試會直接失敗，不會靜默出現行為落差。
 */

function parseIpv4ToInt(ipStr) {
  if (typeof ipStr !== 'string') return null;
  const parts = ipStr.trim().split('.');
  if (parts.length !== 4) return null;
  let num = 0;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return null;
    if (part.length > 1 && part.startsWith('0')) return null;
    const n = parseInt(part, 10);
    if (n < 0 || n > 255) return null;
    num = (num << 8) + n;
  }
  return num >>> 0;
}

function parseIpv6ToBigInt(ipStr) {
  try {
    let clean = ipStr.trim().toLowerCase();
    if (clean.startsWith('[') && clean.endsWith(']')) {
      clean = clean.slice(1, -1);
    }
    if (!clean) return null;

    if (clean.includes('.')) {
      const lastColon = clean.lastIndexOf(':');
      if (lastColon === -1) return null;
      const ipv4Part = clean.slice(lastColon + 1);
      const ipv4Int = parseIpv4ToInt(ipv4Part);
      if (ipv4Int === null) return null;
      const hex1 = ((ipv4Int >>> 16) & 0xffff).toString(16);
      const hex2 = (ipv4Int & 0xffff).toString(16);
      clean = clean.slice(0, lastColon + 1) + hex1 + ':' + hex2;
    }

    const doubleColonCount = (clean.match(/::/g) || []).length;
    if (doubleColonCount > 1) return null;

    let parts = [];
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
    for (const part of parts) {
      const val = parseInt(part, 16);
      if (isNaN(val) || val < 0 || val > 0xffff || !/^[0-9a-f]{1,4}$/i.test(part)) return null;
      result = (result << BigInt(16)) | BigInt(val);
    }
    return result;
  } catch {
    return null;
  }
}

const ipv4ToInt = parseIpv4ToInt;
const ipv6ToBigInt = parseIpv6ToBigInt;

function matchShExp(str, pattern) {
  try {
    const escaped = pattern
      .replace(/[.+^${}()|[\]\\]/g, '\\$&')
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.');
    const regex = new RegExp('^' + escaped + '$', 'i');
    return regex.test(str);
  } catch {
    return false;
  }
}

function checkIsInNet(ip, pattern, mask) {
  const ipInt = ipv4ToInt(ip);
  const patInt = ipv4ToInt(pattern);
  const maskInt = ipv4ToInt(mask);
  if (ipInt === null || patInt === null || maskInt === null) return false;
  return (ipInt & maskInt) === (patInt & maskInt);
}

function checkIsInNetEx(ip, prefixWithMask) {
  const trimmedPrefix = prefixWithMask.trim();
  const [prefixIp, prefixLenStr] = trimmedPrefix.split('/');
  if (!prefixIp || prefixLenStr === undefined) return false;
  const prefixLen = parseInt(prefixLenStr, 10);
  if (isNaN(prefixLen)) return false;

  if (trimmedPrefix.includes(':')) {
    const ipBig = ipv6ToBigInt(ip);
    const prefixBig = ipv6ToBigInt(prefixIp);
    if (ipBig === null || prefixBig === null) return false;
    if (prefixLen < 0 || prefixLen > 128) return false;
    if (prefixLen === 0) return true;

    const maskBig = ((BigInt(1) << BigInt(prefixLen)) - BigInt(1)) << BigInt(128 - prefixLen);
    return (ipBig & maskBig) === (prefixBig & maskBig);
  }

  const ipInt = ipv4ToInt(ip);
  const patInt = ipv4ToInt(prefixIp);
  if (ipInt === null || patInt === null) return false;
  if (prefixLen < 0 || prefixLen > 32) return false;
  const maskInt = prefixLen === 0 ? 0 : (~0 << (32 - prefixLen)) >>> 0;
  return (ipInt & maskInt) === (patInt & maskInt);
}

function createPacSandbox(mockContext, traceSteps) {
  mockContext = mockContext || {};
  traceSteps = traceSteps || [];
  const safeContext = Object.assign(
    {
      clientIpv4: '192.168.1.100',
      clientIpv6: '2001:db8::100',
      dnsMap: {},
      simulatedDay: 'AUTO',
      simulatedHour: -1,
    },
    mockContext
  );

  const recordTrace = (fnName, args, result) => {
    traceSteps.push({ functionName: fnName, args, result });
    return result;
  };

  const isPlainHostName = (host) => {
    if (typeof host !== 'string') return false;
    if (host.includes(':') || host.startsWith('[')) {
      return recordTrace('isPlainHostName', [host], false);
    }
    const res = host.indexOf('.') === -1;
    return recordTrace('isPlainHostName', [host], res);
  };

  const dnsDomainIs = (host, domain) => {
    if (typeof host !== 'string' || typeof domain !== 'string') return false;
    const h = host.toLowerCase();
    const d = domain.toLowerCase();
    let res = false;
    if (d.startsWith('.')) {
      res = h === d.slice(1) || h.endsWith(d);
    } else {
      res = h === d || h.endsWith('.' + d);
    }
    return recordTrace('dnsDomainIs', [host, domain], res);
  };

  const localHostOrDomainIs = (host, hostdom) => {
    if (typeof host !== 'string' || typeof hostdom !== 'string') return false;
    const h = host.toLowerCase();
    const hd = hostdom.toLowerCase();
    const res = h === hd || (h.indexOf('.') === -1 && hd.startsWith(h + '.'));
    return recordTrace('localHostOrDomainIs', [host, hostdom], res);
  };

  const isResolvable = (host) => {
    const res = true;
    return recordTrace('isResolvable', [host], res);
  };

  const dnsResolve = (host) => {
    if (typeof host !== 'string') return '';
    const h = host.toLowerCase();
    if (safeContext.dnsMap && safeContext.dnsMap[h]) {
      const resolved = safeContext.dnsMap[h].split(/[\s,]+/)[0];
      return recordTrace('dnsResolve', [host], resolved);
    }
    if (ipv4ToInt(h) !== null || ipv6ToBigInt(h) !== null) {
      return recordTrace('dnsResolve', [host], host);
    }
    if (h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.corp')) {
      return recordTrace('dnsResolve', [host], '10.0.0.100');
    }
    const defaultPublicIp = '93.184.216.34';
    return recordTrace('dnsResolve', [host], defaultPublicIp);
  };

  const myIpAddress = () => {
    const res = safeContext.clientIpv4 || '192.168.1.100';
    return recordTrace('myIpAddress', [], res);
  };

  const dnsDomainLevels = (host) => {
    if (typeof host !== 'string') return 0;
    const res = (host.match(/\./g) || []).length;
    return recordTrace('dnsDomainLevels', [host], res);
  };

  const shExpMatch = (str, shexp) => {
    const res = matchShExp(str, shexp);
    return recordTrace('shExpMatch', [str, shexp], res);
  };

  const isInNet = (host, pattern, mask) => {
    let checkIp = host;
    if (ipv4ToInt(host) === null) {
      checkIp = dnsResolve(host);
    }
    const res = checkIsInNet(checkIp, pattern, mask);
    return recordTrace('isInNet', [host, pattern, mask], res);
  };

  const isInNetEx = (ipAddress, ipPrefix) => {
    let checkIp = ipAddress;
    if (ipv4ToInt(ipAddress) === null && ipv6ToBigInt(ipAddress) === null) {
      checkIp = dnsResolve(ipAddress);
    }
    const res = checkIsInNetEx(checkIp, ipPrefix);
    return recordTrace('isInNetEx', [ipAddress, ipPrefix], res);
  };

  const dnsResolveEx = (host) => {
    const ipv4 = dnsResolve(host);
    const ipv6 = '2001:db8::1';
    const res = ipv4 + ';' + ipv6;
    return recordTrace('dnsResolveEx', [host], res);
  };

  const myIpAddressEx = () => {
    const ipv4 = safeContext.clientIpv4 || '192.168.1.100';
    const ipv6 = safeContext.clientIpv6 || '2001:db8::100';
    const res = ipv4 + ';' + ipv6;
    return recordTrace('myIpAddressEx', [], res);
  };

  const isResolvableEx = (host) => {
    return recordTrace('isResolvableEx', [host], true);
  };

  const DAY_MAP = { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 };

  const weekdayRange = (wd1, wd2, gmt) => {
    const isGmt = wd2 === 'GMT' || gmt === 'GMT';
    const actualWd2 = wd2 === 'GMT' ? undefined : wd2;

    const now = new Date();
    let currentDayIdx = isGmt ? now.getUTCDay() : now.getDay();
    if (
      safeContext.simulatedDay &&
      safeContext.simulatedDay !== 'AUTO' &&
      DAY_MAP[safeContext.simulatedDay] !== undefined
    ) {
      currentDayIdx = DAY_MAP[safeContext.simulatedDay];
    }

    const startIdx = DAY_MAP[String(wd1).toUpperCase().trim()];
    if (startIdx === undefined) return recordTrace('weekdayRange', [wd1], false);

    if (!actualWd2) {
      const res = currentDayIdx === startIdx;
      return recordTrace('weekdayRange', [wd1], res);
    }

    const endIdx = DAY_MAP[String(actualWd2).toUpperCase().trim()];
    if (endIdx === undefined) return recordTrace('weekdayRange', [wd1, actualWd2], false);

    let res = false;
    if (startIdx <= endIdx) {
      res = currentDayIdx >= startIdx && currentDayIdx <= endIdx;
    } else {
      res = currentDayIdx >= startIdx || currentDayIdx <= endIdx;
    }
    return recordTrace('weekdayRange', [wd1, actualWd2], res);
  };

  const timeRange = (...args) => {
    const isGmt = args.includes('GMT');
    const nums = args.filter((a) => typeof a === 'number');

    const now = new Date();
    let currentHour = isGmt ? now.getUTCHours() : now.getHours();
    const currentMin = isGmt ? now.getUTCMinutes() : now.getMinutes();
    const currentSec = isGmt ? now.getUTCSeconds() : now.getSeconds();

    if (
      typeof safeContext.simulatedHour === 'number' &&
      safeContext.simulatedHour >= 0 &&
      safeContext.simulatedHour <= 23
    ) {
      currentHour = safeContext.simulatedHour;
    }

    const currentTimeInSeconds = currentHour * 3600 + currentMin * 60 + currentSec;

    let res = false;
    if (nums.length === 1) {
      res = currentHour === nums[0];
    } else if (nums.length === 2) {
      const [h1, h2] = nums;
      if (h1 <= h2) {
        res = currentHour >= h1 && currentHour <= h2;
      } else {
        res = currentHour >= h1 || currentHour <= h2;
      }
    } else if (nums.length === 4) {
      const t1 = nums[0] * 3600 + nums[1] * 60;
      const t2 = nums[2] * 3600 + nums[3] * 60;
      if (t1 <= t2) {
        res = currentTimeInSeconds >= t1 && currentTimeInSeconds <= t2;
      } else {
        res = currentTimeInSeconds >= t1 || currentTimeInSeconds <= t2;
      }
    } else if (nums.length >= 6) {
      const t1 = nums[0] * 3600 + nums[1] * 60 + nums[2];
      const t2 = nums[3] * 3600 + nums[4] * 60 + nums[5];
      if (t1 <= t2) {
        res = currentTimeInSeconds >= t1 && currentTimeInSeconds <= t2;
      } else {
        res = currentTimeInSeconds >= t1 || currentTimeInSeconds <= t2;
      }
    }
    return recordTrace('timeRange', args, res);
  };

  const dateRange = (...args) => {
    const nums = args.filter((a) => typeof a === 'number');
    const now = new Date();
    const currentDay = now.getDate();
    let res = true;
    if (nums.length === 1) {
      res = currentDay === nums[0];
    } else if (nums.length >= 2) {
      res = currentDay >= nums[0] && currentDay <= nums[1];
    }
    return recordTrace('dateRange', args, res);
  };

  const sortIpAddressList = (ipAddressList) => {
    if (typeof ipAddressList !== 'string') return '';
    const list = ipAddressList.split(';').map((s) => s.trim()).filter(Boolean);
    list.sort((a, b) => {
      const isA6 = a.includes(':');
      const isB6 = b.includes(':');
      if (isA6 && !isB6) return -1;
      if (!isA6 && isB6) return 1;
      return a.localeCompare(b);
    });
    const res = list.join(';');
    return recordTrace('sortIpAddressList', [ipAddressList], res);
  };

  const getClientVersion = () => {
    return recordTrace('getClientVersion', [], '1.0');
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
    weekdayRange,
    timeRange,
    dateRange,
    sortIpAddressList,
    getClientVersion,
  };
}

function parseTargetUrl(rawUrl) {
  let url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url) && !/^ftp:\/\//i.test(url) && !/^wss?:\/\//i.test(url)) {
    url = 'https://' + url;
  }

  try {
    const parsed = new URL(url);
    let host = parsed.hostname;
    if (host.startsWith('[') && host.endsWith(']')) {
      host = host.slice(1, -1);
    }
    const protocol = parsed.protocol.replace(':', '');
    const port = parsed.port || (protocol === 'https' ? '443' : protocol === 'http' ? '80' : protocol === 'ftp' ? '21' : '80');
    return { url, host, protocol, port };
  } catch {
    let cleanHost = url.replace(/^[a-z]+:\/\//i, '').split('/')[0].split(':')[0];
    if (cleanHost.startsWith('[') && cleanHost.endsWith(']')) {
      cleanHost = cleanHost.slice(1, -1);
    }
    return { url, host: cleanHost || url, protocol: 'https', port: '443' };
  }
}

function classifyProxyStatus(returnString) {
  const upper = (returnString || '').toUpperCase().trim();
  if (!upper) return 'ERROR';
  if (upper.startsWith('DIRECT')) return 'DIRECT';
  if (upper.includes('SOCKS')) return 'SOCKS';
  if (upper.includes('HTTPS')) return 'HTTPS';
  if (upper.includes('PROXY') || upper.includes('HTTP')) return 'PROXY';
  return 'DIRECT';
}

function runSinglePacTest(pacScript, testUrl, mockContext) {
  const parsed = parseTargetUrl(testUrl);
  const url = parsed.url;
  const host = parsed.host;
  const protocol = parsed.protocol;
  const port = parsed.port;
  const traceSteps = [];
  const startTime = performance.now();

  try {
    const sandbox = createPacSandbox(mockContext, traceSteps);
    const resolvedIp = sandbox.dnsResolve(host);
    const hostType = ipv4ToInt(host) !== null ? 'IPv4' : ipv6ToBigInt(host) !== null ? 'IPv6' : 'Domain';
    const clientIp = sandbox.myIpAddress();

    const sandboxScopeKeys = Object.keys(sandbox);
    const sandboxScopeValues = Object.values(sandbox);

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

    const runnerCode =
      '"use strict";\n' +
      pacScript +
      '\n' +
      'if (typeof FindProxyForURL !== "function") {\n' +
      '  throw new Error("PAC 腳本中未定義 FindProxyForURL(url, host) 函式！");\n' +
      '}\n' +
      'return FindProxyForURL(PAC_TEST_URL, PAC_TEST_HOST);';

    const evaluator = new Function(
      ...forbiddenGlobals,
      ...sandboxScopeKeys,
      'PAC_TEST_URL',
      'PAC_TEST_HOST',
      runnerCode
    );

    const forbiddenMocks = forbiddenGlobals.map(() => undefined);
    const rawResult = evaluator(...forbiddenMocks, ...sandboxScopeValues, url, host);

    const returnString = typeof rawResult === 'string' ? rawResult : String(rawResult || '');
    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    const status = classifyProxyStatus(returnString);

    return {
      url,
      host,
      protocol,
      port,
      resolvedIp,
      hostType,
      clientIp,
      returnString,
      status,
      executionTimeMs: duration,
      traceSteps,
    };
  } catch (err) {
    const duration = Math.round((performance.now() - startTime) * 100) / 100;
    const errorMsg = err instanceof Error ? err.message : String(err);
    const hostType = ipv4ToInt(host) !== null ? 'IPv4' : ipv6ToBigInt(host) !== null ? 'IPv6' : 'Domain';

    return {
      url,
      host,
      protocol,
      port,
      resolvedIp: 'N/A',
      hostType,
      clientIp: (mockContext && mockContext.clientIpv4) || '192.168.1.100',
      returnString: 'ERROR',
      status: 'ERROR',
      executionTimeMs: duration,
      traceSteps,
      error: errorMsg,
    };
  }
}

function runBatchPacTest(pacScript, urls, mockContext) {
  return urls
    .map((u) => u.trim())
    .filter((u) => u.length > 0)
    .map((url, idx) => {
      const res = runSinglePacTest(pacScript, url, mockContext);
      return {
        id: 'batch_' + (idx + 1),
        url: res.url,
        host: res.host,
        returnString: res.returnString,
        status: res.status,
        executionTimeMs: res.executionTimeMs,
        error: res.error,
      };
    });
}

self.onmessage = function (event) {
  const data = event.data;
  try {
    if (data.kind === 'single') {
      const result = runSinglePacTest(data.pacScript, data.testUrl, data.mockContext);
      self.postMessage({ kind: 'single', requestId: data.requestId, result: result });
    } else {
      const results = runBatchPacTest(data.pacScript, data.urls, data.mockContext);
      self.postMessage({ kind: 'batch', requestId: data.requestId, results: results });
    }
  } catch (err) {
    self.postMessage({
      kind: 'error',
      requestId: data.requestId,
      message: err instanceof Error ? err.message : String(err),
    });
  }
};

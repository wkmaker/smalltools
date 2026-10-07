import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cidrToNetmask,
  parseIpv4Cidr,
  formatProxyString,
  formatConstantValue,
  buildConditionExpression,
  generatePacScript,
  generatePacDataUrl,
  generateProxyVarName,
  isValidIpv4,
  isValidIpv4CidrOrIp,
  isValidIpv6,
  isValidIpv6CidrOrIp,
  validateRuleValue,
  splitRuleValues,
  parsePacScript,
  splitConditionByType,
  classifyHostHelper,
  PRESET_TEMPLATES,
} from '../../app/pac-generator/engine.ts';

test('cidrToNetmask: 正確換算 CIDR 前綴為子網遮罩', () => {
  assert.equal(cidrToNetmask(0), '0.0.0.0');
  assert.equal(cidrToNetmask(8), '255.0.0.0');
  assert.equal(cidrToNetmask(16), '255.255.0.0');
  assert.equal(cidrToNetmask(24), '255.255.255.0');
  assert.equal(cidrToNetmask(32), '255.255.255.255');
  assert.equal(cidrToNetmask(20), '255.255.240.0');
});

test('parseIpv4Cidr: 正確解析 CIDR 與單一 IP', () => {
  const r1 = parseIpv4Cidr('192.168.1.0/24');
  assert.deepEqual(r1, { ip: '192.168.1.0', mask: '255.255.255.0' });

  const r2 = parseIpv4Cidr('10.0.0.0/8');
  assert.deepEqual(r2, { ip: '10.0.0.0', mask: '255.0.0.0' });

  const r3 = parseIpv4Cidr('172.16.1.5');
  assert.deepEqual(r3, { ip: '172.16.1.5', mask: '255.255.255.255' });

  const invalid = parseIpv4Cidr('invalid/99');
  assert.equal(invalid, null);
});

test('formatProxyString: 輸出標準 PAC 返回格式', () => {
  assert.equal(formatProxyString({ id: '1', name: 'd', type: 'DIRECT', host: '', port: '' }), 'DIRECT');
  assert.equal(
    formatProxyString({ id: '2', name: 'p', type: 'PROXY', host: 'proxy.corp.com', port: 8080 }),
    'PROXY proxy.corp.com:8080'
  );
  assert.equal(
    formatProxyString({ id: '3', name: 's', type: 'SOCKS5', host: '127.0.0.1', port: 1080 }),
    'SOCKS5 127.0.0.1:1080'
  );
  assert.equal(
    formatProxyString({ id: '4', name: 'c', type: 'PROXY', host: '', port: '', customString: 'PROXY a:80; DIRECT' }),
    'PROXY a:80; DIRECT'
  );
});

test('generateProxyVarName: 中文與英數常數命名防呆', () => {
  assert.equal(generateProxyVarName('公司外網代理', 'p1', 0), 'PROXY_NODE_1');
  assert.equal(generateProxyVarName('US_East_Proxy', 'p2', 1), 'PROXY_US_EAST_PROXY');
  assert.equal(generateProxyVarName('10.0.0.1節點', 'p3', 2), 'PROXY_10_0_0_1');
  assert.equal(generateProxyVarName('---', 'p4', 3), 'PROXY_NODE_4');
});

test('buildConditionExpression: 支援各種 PAC 條件表達式', () => {
  const rulePlain = { id: '1', name: 'Plain', enabled: true, conditionType: 'plainHost', value: '', targetProxy: 'DIRECT' };
  assert.equal(buildConditionExpression(rulePlain, true, false), 'isPlainHostName(host)');

  const ruleDomain = { id: '2', name: 'Domain', enabled: true, conditionType: 'domainSuffix', value: '.google.com', targetProxy: 'DIRECT' };
  assert.equal(buildConditionExpression(ruleDomain, true, false), 'dnsDomainIs(host, ".google.com") || host === "google.com"');

  const ruleWildcard = { id: '3', name: 'Wildcard', enabled: true, conditionType: 'wildcardHost', value: '*.internal.*', targetProxy: 'DIRECT' };
  assert.equal(buildConditionExpression(ruleWildcard, true, false), 'shExpMatch(host, "*.internal.*")');

  const ruleIpv4 = { id: '4', name: 'IPv4', enabled: true, conditionType: 'ipv4Cidr', value: '10.0.0.0/8', targetProxy: 'DIRECT' };
  assert.equal(buildConditionExpression(ruleIpv4, true, false), 'isInNet(host, "10.0.0.0", "255.0.0.0")');

  const ruleIpv6 = { id: '5', name: 'IPv6', enabled: true, conditionType: 'ipv6Cidr', value: '2001:db8::/32', targetProxy: 'DIRECT' };
  assert.match(buildConditionExpression(ruleIpv6, true, false), /isInNetEx\(host, "2001:db8::\/32"\)/);
});

test('generatePacScript: 產生包含 FindProxyForURL 的合法 JS 腳本', () => {
  const preset = PRESET_TEMPLATES[0]; // corporate-bypass
  const script = generatePacScript({
    proxies: preset.proxies,
    rules: preset.rules,
    defaultAction: preset.defaultAction,
    enableIpv6: preset.enableIpv6,
    resolveIpFirst: preset.resolveIpFirst,
  });

  assert.ok(script.includes('const DEFAULT_PROXY = "PROXY proxy.company.com:8080";'));
  assert.ok(script.includes('return DEFAULT_PROXY;'));
  assert.ok(script.includes('return "DIRECT";'));
  assert.ok(script.includes('isInNet(host, "10.0.0.0", "255.0.0.0")'));
});

test('generatePacDataUrl: 產生合法的 Data URL', () => {
  const script = 'function FindProxyForURL(url, host) { return "DIRECT"; }';
  const dataUrl = generatePacDataUrl(script);
  assert.ok(dataUrl.startsWith('data:application/x-ns-proxy-autoconfig;base64,'));
});

test('isValidIpv4 & isValidIpv4CidrOrIp: 正確驗證單一 IPv4 及 CIDR 語法', () => {
  assert.equal(isValidIpv4('192.168.1.1'), true);
  assert.equal(isValidIpv4('10.0.0.1'), true);
  assert.equal(isValidIpv4('256.0.0.1'), false);
  assert.equal(isValidIpv4('192.168.1'), false);
  assert.equal(isValidIpv4('abc'), false);

  assert.equal(isValidIpv4CidrOrIp('192.168.1.1'), true);
  assert.equal(isValidIpv4CidrOrIp('10.0.0.0/8'), true);
  assert.equal(isValidIpv4CidrOrIp('172.16.0.0/12'), true);
  assert.equal(isValidIpv4CidrOrIp('192.168.1.0/24'), true);
  assert.equal(isValidIpv4CidrOrIp('10.0.0.0/33'), false);
  assert.equal(isValidIpv4CidrOrIp('10.0.0.0/-1'), false);
  assert.equal(isValidIpv4CidrOrIp('not-an-ip/24'), false);
});

test('isValidIpv6 & isValidIpv6CidrOrIp: 正確驗證單一 IPv6 及 CIDR 語法', () => {
  assert.equal(isValidIpv6('2001:db8::1'), true);
  assert.equal(isValidIpv6('::1'), true);
  assert.equal(isValidIpv6('fe80::1ff:fe23:4567:890a'), true);
  assert.equal(isValidIpv6('1200::AB00:1234:0000:2552:7777:1313'), true);
  assert.equal(isValidIpv6('2001:::1'), false); // multiple ::
  assert.equal(isValidIpv6('2001:xyz::1'), false);

  assert.equal(isValidIpv6CidrOrIp('2001:db8::1'), true);
  assert.equal(isValidIpv6CidrOrIp('2001:db8::/32'), true);
  assert.equal(isValidIpv6CidrOrIp('fc00::/7'), true);
  assert.equal(isValidIpv6CidrOrIp('fc00::/129'), false);
  assert.equal(isValidIpv6CidrOrIp('invalid-ipv6/64'), false);
});

test('validateRuleValue: 即時語法檢查並支援雙語錯誤訊息', () => {
  // IPv4 檢查
  assert.deepEqual(validateRuleValue('ipv4Cidr', '192.168.1.1'), { isValid: true });
  assert.deepEqual(validateRuleValue('ipv4Cidr', '10.0.0.0/8'), { isValid: true });
  const badIpv4 = validateRuleValue('ipv4Cidr', '999.0.0.1');
  assert.equal(badIpv4.isValid, false);
  assert.ok(badIpv4.messageZh?.includes('IPv4'));
  assert.ok(badIpv4.messageEn?.includes('IPv4'));

  // IPv6 檢查
  assert.deepEqual(validateRuleValue('ipv6Cidr', '2001:db8::1'), { isValid: true });
  assert.deepEqual(validateRuleValue('ipv6Cidr', 'fc00::/7'), { isValid: true });
  const badIpv6 = validateRuleValue('ipv6Cidr', 'not-ipv6');
  assert.equal(badIpv6.isValid, false);
  assert.ok(badIpv6.messageZh?.includes('IPv6'));

  // 網域不能包含協定或斜線
  const badDomain = validateRuleValue('domainSuffix', 'https://google.com/');
  assert.equal(badDomain.isValid, false);

  // 空值允許（尚未輸入完畢）
  assert.deepEqual(validateRuleValue('ipv4Cidr', ''), { isValid: true });
});

test('buildConditionExpression: 單一 IPv6 自動補齊 /128 遮罩', () => {
  const ruleSingleIpv6 = {
    id: '6',
    name: 'Single IPv6',
    enabled: true,
    conditionType: 'ipv6Cidr',
    value: '2001:db8::1',
    targetProxy: 'DIRECT',
  };
  const expr = buildConditionExpression(ruleSingleIpv6, true, false);
  assert.equal(expr, '(typeof isInNetEx === "function" && isInNetEx(host, "2001:db8::1/128"))');

  const ruleSingleIpv4 = {
    id: '7',
    name: 'Single IPv4',
    enabled: true,
    conditionType: 'ipv4Cidr',
    value: '192.168.1.1',
    targetProxy: 'DIRECT',
  };
  const expr4 = buildConditionExpression(ruleSingleIpv4, true, false);
  assert.equal(expr4, 'isInNet(host, "192.168.1.1", "255.255.255.255")');
});

test('generatePacScript: 未啟用規則應以註解方式保留在腳本中', () => {
  const script = generatePacScript({
    proxies: [{ id: 'p1', name: '代理', type: 'PROXY', host: 'proxy.corp', port: 8080 }],
    rules: [
      { id: 'r1', name: '已啟用規則', enabled: true, conditionType: 'plainHost', value: '', targetProxy: 'DIRECT' },
      { id: 'r2', name: '已停用規則', enabled: false, conditionType: 'domainSuffix', value: '.internal', targetProxy: 'p1' },
    ],
    defaultAction: 'DIRECT',
    enableIpv6: true,
    resolveIpFirst: false,
  });

  assert.ok(script.includes('// [規則 1] 已啟用規則'));
  assert.ok(script.includes('if (isPlainHostName(host)) {'));
  assert.ok(script.includes('// [已停用規則 2] 已停用規則'));
  assert.ok(script.includes('// if (dnsDomainIs(host, ".internal") || host === "internal") { return "PROXY proxy.corp:8080"; }'));
});

test('buildConditionExpression: 支援 MDN 協定、埠號、星期與時段條件表達式', () => {
  // 1. 協定 (HTTP / HTTPS)
  const ruleHttp = { id: 'p1', name: 'HTTP Only', enabled: true, conditionType: 'protocol', value: 'http', targetProxy: 'DIRECT' };
  assert.equal(buildConditionExpression(ruleHttp, true, false), '(url.substring(0, 5) === "http:" || url.startsWith("http:"))');

  const ruleHttps = { id: 'p2', name: 'HTTPS Only', enabled: true, conditionType: 'protocol', value: 'https:', targetProxy: 'DIRECT' };
  assert.equal(buildConditionExpression(ruleHttps, true, false), '(url.substring(0, 6) === "https:" || url.startsWith("https:"))');

  // 2. 通訊埠 (8080)
  const rulePort = { id: 'p3', name: 'Port 8080', enabled: true, conditionType: 'port', value: '8080', targetProxy: 'DIRECT' };
  assert.equal(buildConditionExpression(rulePort, true, false), '(shExpMatch(url, "*:8080/*") || shExpMatch(url, "*:8080"))');

  // 3. 星期範圍 (MON-FRI)
  const ruleWeek = { id: 'w1', name: 'Workdays', enabled: true, conditionType: 'weekday', value: 'MON-FRI', targetProxy: 'DIRECT' };
  assert.equal(buildConditionExpression(ruleWeek, true, false), 'weekdayRange("MON", "FRI")');

  // 4. 時段範圍 (9-18)
  const ruleTime = { id: 't1', name: 'Work hours', enabled: true, conditionType: 'timeRange', value: '9-18', targetProxy: 'DIRECT' };
  assert.equal(buildConditionExpression(ruleTime, true, false), 'timeRange(9, 18)');
});

test('buildConditionExpression: andConditions 應以 AND 疊加主要條件（例如協定為 https 且網域為 x）', () => {
  // 1. 主要條件 + 一個 AND 條件：協定為 https 且網域後綴為 .example.com
  const ruleHttpsAndDomain = {
    id: 'a1',
    name: 'HTTPS to example.com only',
    enabled: true,
    conditionType: 'protocol',
    value: 'https',
    andConditions: [{ conditionType: 'domainSuffix', value: '.example.com' }],
    targetProxy: 'DIRECT',
  };
  const expr = buildConditionExpression(ruleHttpsAndDomain, true, false);
  assert.equal(
    expr,
    '((url.substring(0, 6) === "https:" || url.startsWith("https:"))) &&\n    (dnsDomainIs(host, ".example.com") || host === "example.com")'
  );

  // 2. 沒有 andConditions 時行為應與過去完全一致（不應多包一層括號）
  const ruleNoAnd = { id: 'a2', name: 'HTTPS Only', enabled: true, conditionType: 'protocol', value: 'https', targetProxy: 'DIRECT' };
  assert.equal(buildConditionExpression(ruleNoAnd, true, false), '(url.substring(0, 6) === "https:" || url.startsWith("https:"))');

  // 3. andConditions 中值為空的項目應被忽略，不會導致整條規則恆為 false
  const ruleWithEmptyAnd = {
    id: 'a3',
    name: 'Port 443 with empty AND',
    enabled: true,
    conditionType: 'port',
    value: '443',
    andConditions: [{ conditionType: 'domainSuffix', value: '' }],
    targetProxy: 'DIRECT',
  };
  assert.equal(
    buildConditionExpression(ruleWithEmptyAnd, true, false),
    '(shExpMatch(url, "*:443/*") || shExpMatch(url, "*:443"))'
  );

  // 4. 多個 andConditions 應依序以 AND 疊加
  const ruleMultiAnd = {
    id: 'a4',
    name: 'HTTPS + example.com + port 443',
    enabled: true,
    conditionType: 'protocol',
    value: 'https',
    andConditions: [
      { conditionType: 'domainSuffix', value: '.example.com' },
      { conditionType: 'port', value: '443' },
    ],
    targetProxy: 'DIRECT',
  };
  const exprMulti = buildConditionExpression(ruleMultiAnd, true, false);
  const andParts = exprMulti.split(' &&\n    ');
  assert.equal(andParts.length, 3);
});

test('validateRuleValue: 正確檢驗 MDN 協定、埠號、星期與時段格式', () => {
  assert.equal(validateRuleValue('protocol', 'http').isValid, true);
  assert.equal(validateRuleValue('protocol', 'https:').isValid, true);
  assert.equal(validateRuleValue('protocol', 'invalid-proto').isValid, false);

  assert.equal(validateRuleValue('port', '80').isValid, true);
  assert.equal(validateRuleValue('port', '8080').isValid, true);
  assert.equal(validateRuleValue('port', '70000').isValid, false);

  assert.equal(validateRuleValue('weekday', 'MON-FRI').isValid, true);
  assert.equal(validateRuleValue('weekday', 'SAT-SUN').isValid, true);
  assert.equal(validateRuleValue('weekday', 'XYZ').isValid, false);

  assert.equal(validateRuleValue('timeRange', '9-18').isValid, true);
  assert.equal(validateRuleValue('timeRange', '25-30').isValid, false);
});

test('splitRuleValues & buildConditionExpression: 支援一條規則包含多個值 (換行/逗號/分號)', () => {
  // 1. splitRuleValues 分割
  assert.deepEqual(splitRuleValues('example1.com\nexample2.com, example3.com; example4.com'), [
    'example1.com',
    'example2.com',
    'example3.com',
    'example4.com',
  ]);

  // 2. 多網域後綴 OR 串聯
  const ruleMultiDomains = {
    id: 'r_multi',
    name: '多網域',
    enabled: true,
    conditionType: 'domainSuffix',
    value: 'example1.com\nexample2.com\nexample3.com',
    targetProxy: 'DIRECT',
  };
  const exprMulti = buildConditionExpression(ruleMultiDomains, true, false);
  assert.ok(exprMulti.includes('dnsDomainIs(host, ".example1.com") || host === "example1.com"'));
  assert.ok(exprMulti.includes('dnsDomainIs(host, ".example2.com") || host === "example2.com"'));
  assert.ok(exprMulti.includes('dnsDomainIs(host, ".example3.com") || host === "example3.com"'));
  assert.ok(exprMulti.includes(' ||\n    '));

  // 3. 多 IPv4 網段 OR 串聯
  const ruleMultiIps = {
    id: 'r_ips',
    name: 'RFC 1918 私有網段',
    enabled: true,
    conditionType: 'ipv4Cidr',
    value: '10.0.0.0/8\n172.16.0.0/12\n192.168.0.0/16',
    targetProxy: 'DIRECT',
  };
  const exprIps = buildConditionExpression(ruleMultiIps, true, false);
  assert.equal(
    exprIps,
    'isInNet(host, "10.0.0.0", "255.0.0.0") ||\n    isInNet(host, "172.16.0.0", "255.240.0.0") ||\n    isInNet(host, "192.168.0.0", "255.255.0.0")'
  );

  // 4. 多值語法驗證（若其中一項錯誤能精確指出）
  const badMultiIps = validateRuleValue('ipv4Cidr', '10.0.0.0/8\n999.0.0.1\n192.168.1.1');
  assert.equal(badMultiIps.isValid, false);
  assert.ok(badMultiIps.messageZh?.includes('第 2 項'));
});

test('parsePacScript: 逆向解析使用者提供的標準 PAC 腳本', () => {
  const userSampleScript = `
function FindProxyForURL(url, host)
/* Normalize the URL for pattern matching */
url = url.toLowerCase(); host = host.toLowerCase();

{
/* Don't proxy local hostnames */ 
if (isPlainHostName(host))
{
return 'DIRECT';
}

/* Don't proxy local domains */ 
if (dnsDomainIs(host, ".example1.com") ||
(host == "example1.com") || 
dnsDomainIs(host, ".example2.com") ||
(host == "example2.com") || 
dnsDomainIs(host, ".example3.com") ||
(host == "example3.com"))
{
return 'DIRECT';
}

/* Don't proxy Windows Update */ 
if ((host == "download.microsoft.com") || 
(host == "ntservicepack.microsoft.com") || 
(host == "cdm.microsoft.com") ||
(host == "wustat.windows.com") ||
(host == "windowsupdate.microsoft.com") || 
(dnsDomainIs(host, ".windowsupdate.microsoft.com")) ||
(host == "update.microsoft.com") || 
(dnsDomainIs(host, ".update.microsoft.com")) ||
(dnsDomainIs(host, ".windowsupdate.com")))
{
return 'DIRECT';
}
if (isResolvable(host))
{
var hostIP = dnsResolve(host);

/* Don't proxy non-routable addresses (RFC 3330) */ 
if (isInNet(hostIP, '0.0.0.0', '255.0.0.0') ||
isInNet(hostIP, '10.0.0.0', '255.0.0.0') ||
isInNet(hostIP, '127.0.0.0', '255.0.0.0') ||
isInNet(hostIP, '169.254.0.0', '255.255.0.0') ||
isInNet(hostIP, '172.16.0.0', '255.240.0.0') ||
isInNet(hostIP, '192.0.2.0', '255.255.255.0') ||
isInNet(hostIP, '192.88.99.0', '255.255.255.0') ||
isInNet(hostIP, '192.168.0.0', '255.255.0.0') ||
isInNet(hostIP, '198.18.0.0', '255.254.0.0') ||
isInNet(hostIP, '224.0.0.0', '240.0.0.0') ||
isInNet(hostIP, '240.0.0.0', '240.0.0.0'))
{
return 'DIRECT';
}
}
if (url.substring(0, 5) == 'http:' || 
url.substring(0, 6) == 'https:' || 
url.substring(0, 4) == 'ftp:')
{
return 'PROXY wcg1.example.com:8080';
}
return 'DIRECT';
}
  `;

  const result = parsePacScript(userSampleScript);
  assert.equal(result.success, true);

  // 1. 自動提取代理節點
  assert.equal(result.proxies.length, 1);
  assert.equal(result.proxies[0].type, 'PROXY');
  assert.equal(result.proxies[0].host, 'wcg1.example.com');
  assert.equal(result.proxies[0].port, 8080);

  // 2. 自動偵測 resolveIpFirst
  assert.equal(result.resolveIpFirst, true);

  // 3. 預設行為為 DIRECT
  assert.equal(result.defaultAction, 'DIRECT');

  // 4. 規則解析驗證
  assert.ok(result.rules.length >= 5);

  // 規則 1: isPlainHostName
  const plainHostRule = result.rules.find((r) => r.conditionType === 'plainHost');
  assert.ok(plainHostRule);
  assert.equal(plainHostRule.targetProxy, 'DIRECT');

  // 規則 2: local domains
  const domainRule = result.rules.find((r) => r.conditionType === 'domainSuffix' && r.value.includes('example1.com'));
  assert.ok(domainRule);
  assert.ok(domainRule.value.includes('example2.com'));
  assert.ok(domainRule.value.includes('example3.com'));

  // 規則 3: RFC 3330 non-routable IPs (自動換算為 CIDR)
  const cidrRule = result.rules.find((r) => r.conditionType === 'ipv4Cidr');
  assert.ok(cidrRule);
  assert.ok(cidrRule.value.includes('10.0.0.0/8'));
  assert.ok(cidrRule.value.includes('192.168.0.0/16'));
  assert.ok(cidrRule.value.includes('172.16.0.0/12'));

  // 規則 4: 通訊協定
  const protoRule = result.rules.find((r) => r.conditionType === 'protocol');
  assert.ok(protoRule);
  assert.ok(protoRule.value.includes('http'));
  assert.ok(protoRule.value.includes('https'));
  assert.ok(protoRule.value.includes('ftp'));
  assert.equal(protoRule.targetProxy, result.proxies[0].id);
});

test('parsePacScript: 同一個 if 內以 || 混合不同類型條件時，不應靜默丟棄任何子句', () => {
  const mixedConditionScript = `
function FindProxyForURL(url, host) {
  if (isPlainHostName(host) || dnsDomainIs(host, ".example.com")) {
    return "DIRECT";
  } else if (shExpMatch(host, "*.com")) {
    return "PROXY proxy1.example.com:8080; PROXY proxy4.example.com:8080";
  } else if (shExpMatch(host, "*.edu")) {
    return "PROXY proxy2.example.com:8080; PROXY proxy4.example.com:8080";
  }
  return "DIRECT";
}
`;
  const result = parsePacScript(mixedConditionScript);
  assert.equal(result.success, true);

  // 混合類型的第一個 if 應拆成兩條規則，且都指向 DIRECT（與原始 OR 語意等價）
  const plainHostRule = result.rules.find((r) => r.conditionType === 'plainHost');
  assert.ok(plainHostRule, '應保留 isPlainHostName 子句');
  assert.equal(plainHostRule.targetProxy, 'DIRECT');

  const domainRule = result.rules.find((r) => r.conditionType === 'domainSuffix' && r.value.includes('example.com'));
  assert.ok(domainRule, '不應丟棄 dnsDomainIs(host, ".example.com") 子句');
  assert.equal(domainRule.targetProxy, 'DIRECT');

  // 其餘兩條 wildcardHost 規則應各自指向不同的備援代理鏈
  const wildcardRules = result.rules.filter((r) => r.conditionType === 'wildcardHost');
  assert.equal(wildcardRules.length, 2);
  assert.equal(result.rules.length, 4);
});

test('splitConditionByType: 同類型子句應合併保留多值 OR，不同類型子句應拆開', () => {
  const sameType = splitConditionByType('dnsDomainIs(host, ".a.com") || dnsDomainIs(host, ".b.com")');
  assert.equal(sameType.length, 1);

  const mixedType = splitConditionByType('isPlainHostName(host) || dnsDomainIs(host, ".example.com")');
  assert.equal(mixedType.length, 2);
  assert.equal(mixedType[0], 'isPlainHostName(host)');
  assert.equal(mixedType[1], 'dnsDomainIs(host, ".example.com")');

  const single = splitConditionByType('isPlainHostName(host)');
  assert.deepEqual(single, ['isPlainHostName(host)']);
});

test('parsePacScript & buildConditionExpression: 支援用戶端本機 IP (myIpAddress) 與字串拼接備援代理鏈', () => {
  const userClientIpScript = `
function FindProxyForURL(url, host) {
  if (isInNet(myIpAddress(), "10.1.0.0", "255.255.0.0"))
  { return "PROXY wcg1.example.com:8080; " + 
  "PROXY wcg2.example.com:8080";
  }

  if (isInNet(myIpAddress(), "10.2.0.0", "255.255.0.0"))
  { return "PROXY wcg1.example.com:8080; " + 
  "PROXY wcg2.example.com:8080";
  }

  if (isInNet(myIpAddress(), "10.3.0.0", "255.255.0.0"))
  { return "PROXY wcg2.example.com:8080; " + 
  "PROXY wcg1.example.com:8080";
  }

  if (isInNet(myIpAddress(), "10.4.0.0", "255.255.0.0"))
  { return "PROXY wcg2.example.com:8080; " + "PROXY wcg1.example.com:8080";
  }

  return "DIRECT";
}
  `;

  const parsed = parsePacScript(userClientIpScript);
  assert.equal(parsed.success, true);
  assert.equal(parsed.defaultAction, 'DIRECT');
  assert.equal(parsed.rules.length, 4);

  // 1. 驗證所有規則皆識別為 clientIpv4
  parsed.rules.forEach((r) => {
    assert.equal(r.conditionType, 'clientIpv4');
  });

  // 2. 驗證字串拼接後的代理鏈完整性
  assert.equal(parsed.proxies.length, 2);
  const p1 = parsed.proxies.find((p) => p.customString?.includes('wcg1.example.com:8080; PROXY wcg2.example.com:8080'));
  assert.ok(p1, '應成功還原字串拼接的備援代理鏈 1');
  const p2 = parsed.proxies.find((p) => p.customString?.includes('wcg2.example.com:8080; PROXY wcg1.example.com:8080'));
  assert.ok(p2, '應成功還原字串拼接的備援代理鏈 2');

  // 3. 測試 clientIpv4 重新生成條件表達式
  const clientRule = {
    id: 'cr1',
    name: '辦公室網段',
    enabled: true,
    conditionType: 'clientIpv4',
    value: '10.1.0.0/16\n10.2.0.0/16',
    targetProxy: 'DIRECT',
  };
  const expr = buildConditionExpression(clientRule, true, false);
  assert.equal(
    expr,
    'isInNet(myIpAddress(), "10.1.0.0", "255.255.0.0") ||\n    isInNet(myIpAddress(), "10.2.0.0", "255.255.0.0")'
  );
});

test('formatProxyString & CHAIN: 支援視覺化組合多重備援代理鏈與 DIRECT 容錯', () => {
  const proxies = [
    { id: 'p1', name: 'Primary Proxy', type: 'PROXY', host: 'wcg1.example.com', port: 8080 },
    { id: 'p2', name: 'Secondary Proxy', type: 'PROXY', host: 'wcg2.example.com', port: 8080 },
    {
      id: 'chain1',
      name: 'HA Cluster',
      type: 'CHAIN',
      host: 'cluster',
      port: 8080,
      chainHops: ['p1', 'p2', 'DIRECT'],
      isConcatFormat: true,
    },
  ];

  // 1. formatProxyString 應成功串聯多個節點並以分號分隔
  const formatted = formatProxyString(proxies[2], proxies);
  assert.equal(formatted, 'PROXY wcg1.example.com:8080; PROXY wcg2.example.com:8080; DIRECT');

  // 2. formatConstantValue 應生成多行 JS 字串拼接語法
  const concatCode = formatConstantValue(formatted, true);
  assert.ok(concatCode.includes('"PROXY wcg1.example.com:8080; " +'));
  assert.ok(concatCode.includes('"PROXY wcg2.example.com:8080; " +'));
  assert.ok(concatCode.includes('"DIRECT"'));

  // 3. 在 generatePacScript 中應以拼接常數輸出
  const script = generatePacScript({
    proxies,
    rules: [],
    defaultAction: 'chain1',
    enableIpv6: true,
    resolveIpFirst: false,
  });
  assert.ok(script.includes('const PROXY_HA_CLUSTER = \n'));
  assert.ok(script.includes('const DEFAULT_PROXY = "PROXY wcg1.example.com:8080; PROXY wcg2.example.com:8080; DIRECT";'));
});



test('parsePacScript: 內嵌輔助函式（hostOrDomainIs / hostIs）不應被誤判為代理節點或自訂規則', () => {
  // 精簡自 Menlo Security 雲端代理 PAC：FindProxyForURL 內以 var 定義輔助函式，註解含「IPv6」字樣
  const menloStyleScript = `
function FindProxyForURL(url, host)
{
   var hostOrDomainIs = function(host, val) {
      return (host === val) || dnsDomainIs(host, '.' + val);
   };
   var hostIs = function(host, val) {
      return (host === val);
   };
   /* Don't check IPv6 addresses */
   if (isResolvable(host))
   {
      var hostIP = dnsResolve(host);
      if (!shExpMatch(hostIP, "*:*"))
      {
        if (isInNet(hostIP, '10.0.0.0', '255.0.0.0') || isInNet(hostIP, '192.168.0.0', '255.255.0.0'))
        {
           return 'DIRECT';
        }
      }
   }
   if ( hostOrDomainIs(host, "itunes.apple.com") || dnsDomainIs(host, ".icloud.com") )
   {
      return 'DIRECT';
   }
   if ( hostOrDomainIs(host, "netflix.com") || isInNet(host, "23.246.0.0","255.255.192.0") )
   {
      return 'DIRECT';
   }
   if ( hostIs(host, "sso.example.com") )
   {
      return 'DIRECT';
   }
   if ( url.substring(0, 6) === 'https:' )
   {
      return 'PROXY p0.menlosecurity.com:3131; PROXY p1.menlosecurity.com:3131; DIRECT';
   }
   return 'DIRECT';
}
`;
  const result = parsePacScript(menloStyleScript);
  assert.equal(result.success, true);
  assert.equal(result.warnings, undefined, '不應有未能解析的條件');

  // 輔助函式內的 return 不應被當成代理字串
  assert.equal(result.proxies.length, 1);
  assert.equal(result.proxies[0].customString, 'PROXY p0.menlosecurity.com:3131; PROXY p1.menlosecurity.com:3131; DIRECT');

  // 註解中的「IPv6」不應開啟 IPv6 模式
  assert.equal(result.enableIpv6, false);

  const appleRule = result.rules.find((r) => r.value.includes('itunes.apple.com'));
  assert.equal(appleRule.conditionType, 'domainSuffix');
  assert.deepEqual(appleRule.value.split('\n').sort(), ['icloud.com', 'itunes.apple.com']);

  const netflixDomain = result.rules.find((r) => r.value === 'netflix.com');
  assert.equal(netflixDomain.conditionType, 'domainSuffix');
  assert.ok(result.rules.some((r) => r.conditionType === 'ipv4Cidr' && r.value === '23.246.0.0/18'));

  const exactRule = result.rules.find((r) => r.value === 'sso.example.com');
  assert.equal(exactRule.conditionType, 'domainExact');

  assert.ok(result.rules.every((r) => r.conditionType !== 'wildcardUrl'));
});

test('classifyHostHelper: 依函式本體判斷語意，而非函式名稱', () => {
  // 網域後綴：子句順序、括號、空白、引號、參數名稱皆不影響
  assert.equal(classifyHostHelper(['host', 'val'], "return (host === val) || dnsDomainIs(host, '.' + val);"), 'domainSuffix');
  assert.equal(classifyHostHelper(['h', 'd'], 'return dnsDomainIs(h, "." + d) || d == h'), 'domainSuffix');
  // 精確主機
  assert.equal(classifyHostHelper(['host', 'val'], 'return (host === val);'), 'domainExact');
  // 無法辨識：多敘述、額外條件、少了點號、參數數量不符
  assert.equal(classifyHostHelper(['host', 'val'], 'if (!host) return false; return host === val;'), null);
  assert.equal(classifyHostHelper(['host', 'val'], 'return host === val && isResolvable(host);'), null);
  assert.equal(classifyHostHelper(['host', 'val'], 'return host === val || dnsDomainIs(host, val);'), null);
  assert.equal(classifyHostHelper(['host'], 'return host === "x";'), null);
});

test('parsePacScript: 同名輔助函式意義不同時，以腳本中的實際定義為準', () => {
  const script = `
function hostOrDomainIs(host, val) {
  return host === val;
}
function FindProxyForURL(url, host) {
  var hostIs = function(host, val) {
    return shExpMatch(host, val + "*");
  };
  if (hostOrDomainIs(host, "a.example.com")) {
    return "DIRECT";
  }
  if (hostIs(host, "b.example.com")) {
    return "DIRECT";
  }
  return "PROXY p.example.com:8080";
}
`;
  const result = parsePacScript(script);

  // 這裡的 hostOrDomainIs 定義成精確比對，不應被當成網域後綴
  const a = result.rules.find((r) => r.value === 'a.example.com');
  assert.ok(a);
  assert.equal(a.conditionType, 'domainExact');

  // 這裡的 hostIs 定義無法辨識，不應被猜成精確主機，而是產生警告
  assert.ok(!result.rules.some((r) => r.value === 'b.example.com'));
  assert.ok(result.warnings?.some((w) => w.includes('hostIs')));
});

test('parsePacScript: 同一個 if 內混合精確主機與網域後綴時，應拆成兩條規則，精確主機不可被併入後綴', () => {
  const script = `
function FindProxyForURL(url, host) {
  var hostIs = function(host, val) { return (host === val); };
  if ( dnsDomainIs(host, ".office.com") ||
    hostIs(host, "go.microsoft.com") ||
    host === "aka.ms" ||
    hostIs(host, "office.com") )
  {
    return 'DIRECT';
  }
  return 'PROXY p.example.com:8080';
}
`;
  const result = parsePacScript(script);
  const suffix = result.rules.find((r) => r.conditionType === 'domainSuffix');
  const exact = result.rules.find((r) => r.conditionType === 'domainExact');
  assert.equal(suffix.value, 'office.com');
  // office.com 已被後綴規則涵蓋，不重複列入精確主機
  assert.deepEqual(exact.value.split('\n').sort(), ['aka.ms', 'go.microsoft.com']);
  assert.equal(suffix.targetProxy, 'DIRECT');
  assert.equal(exact.targetProxy, 'DIRECT');
});

test('dnsProbe: 網路環境偵測條件的驗證與腳本產生', () => {
  assert.equal(validateRuleValue('dnsProbe', 'dns2.corp.local=10.10.10.10').isValid, true);
  assert.equal(validateRuleValue('dnsProbe', 'dns2.corp.local = 10.10.10.10').isValid, true);
  assert.equal(validateRuleValue('dnsProbe', 'dns2.corp.local').isValid, false);
  assert.equal(validateRuleValue('dnsProbe', 'dns2.corp.local=10.10.10.300').isValid, false);
  assert.equal(validateRuleValue('dnsProbe', 'a"b.com=10.0.0.1').isValid, false);

  const rule = { id: 'r', name: 'n', enabled: true, conditionType: 'dnsProbe', value: 'DNS2.corp.local=10.10.10.10', targetProxy: 'DIRECT' };
  assert.equal(buildConditionExpression(rule, false, false), 'dnsResolve("dns2.corp.local") === "10.10.10.10"');
  // 格式不符時輸出 false，不把原始輸入拼進腳本
  const injected = buildConditionExpression({ ...rule, value: 'x");alert(1);("=1' }, false, false);
  assert.ok(!injected.includes('alert'));
  assert.match(injected, /^false( \|\|\s+false)*$/);
});

test('parsePacScript & 往返：公司內網偵測 (dnsResolve === IP) 匯入後重新產生，行為與原始腳本一致', async () => {
  const { runSinglePacTest } = await import('../../app/pac-tester/engine.ts');
  const original = `
function FindProxyForURL(url, host) {
  if (isPlainHostName(host)) { return 'DIRECT'; }
  /* Corporate network detection */
  if ( dnsResolve('dns2.mydomain.com') === '10.10.10.10' )
  {
    return 'PROXY proxy.domain.local:8080';
  }
  if (dnsDomainIs(host, ".office.com")) { return 'DIRECT'; }
  return 'PROXY cloud.example.com:3129';
}
`;
  const parsed = parsePacScript(original);
  assert.equal(parsed.warnings, undefined);
  const probe = parsed.rules.find((r) => r.conditionType === 'dnsProbe');
  assert.equal(probe.value, 'dns2.mydomain.com=10.10.10.10');
  assert.equal(probe.name, 'Corporate network detection');

  const regenerated = generatePacScript({
    proxies: parsed.proxies,
    rules: parsed.rules,
    defaultAction: parsed.defaultAction,
    enableIpv6: parsed.enableIpv6,
    resolveIpFirst: parsed.resolveIpFirst,
  });
  const base = { clientIpv4: '192.168.1.100', clientIpv6: '2001:db8::100', simulatedDay: 'AUTO', simulatedHour: -1 };
  for (const dnsMap of [{}, { 'dns2.mydomain.com': '10.10.10.10' }]) {
    for (const url of ['http://intranet/', 'https://outlook.office.com/', 'https://www.google.com/']) {
      const a = runSinglePacTest(original, url, { ...base, dnsMap });
      const b = runSinglePacTest(regenerated, url, { ...base, dnsMap });
      assert.equal(b.returnString, a.returnString, `${url} @ ${JSON.stringify(dnsMap)}`);
    }
  }
});

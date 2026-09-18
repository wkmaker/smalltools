import test from 'node:test';
import assert from 'node:assert/strict';
import {
  cidrToNetmask,
  parseIpv4Cidr,
  formatProxyString,
  buildConditionExpression,
  generatePacScript,
  generatePacDataUrl,
  generateProxyVarName,
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

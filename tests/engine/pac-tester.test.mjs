import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ipv4ToInt,
  ipv6ToBigInt,
  checkIsInNet,
  checkIsInNetEx,
  runSinglePacTest,
  runBatchPacTest,
  lintPacScript,
  SAMPLE_PAC_SCRIPT,
} from '../../app/pac-tester/engine.ts';

test('ipv4ToInt: 正確轉換 IPv4 為 32 位元整數並拒絕非法值', () => {
  assert.equal(ipv4ToInt('192.168.1.1'), 3232235777);
  assert.equal(ipv4ToInt('10.0.0.1'), 167772161);
  assert.equal(ipv4ToInt('256.0.0.1'), null);
  assert.equal(ipv4ToInt('abc.1.2.3'), null);
  assert.equal(ipv4ToInt('1.2.3'), null);
});

test('ipv6ToBigInt: 正確解析標準與縮寫 IPv6 為 128 位元 BigInt', () => {
  const localhost = ipv6ToBigInt('::1');
  assert.equal(localhost, BigInt(1));

  const docIp = ipv6ToBigInt('2001:db8::1');
  assert.ok(docIp !== null);
  assert.ok(docIp > BigInt(0));

  const invalidIp = ipv6ToBigInt('2001:db8:::1');
  assert.equal(invalidIp, null);
});

test('checkIsInNet: IPv4 網段命中判斷', () => {
  assert.equal(checkIsInNet('192.168.1.50', '192.168.0.0', '255.255.0.0'), true);
  assert.equal(checkIsInNet('10.1.2.3', '10.0.0.0', '255.0.0.0'), true);
  assert.equal(checkIsInNet('172.32.1.1', '172.16.0.0', '255.240.0.0'), false);
});

test('checkIsInNetEx: 支援 IPv6 CIDR 與 IPv4 CIDR 網段命中', () => {
  // IPv6 ULA 命中
  assert.equal(checkIsInNetEx('fc00::1', 'fc00::/7'), true);
  assert.equal(checkIsInNetEx('fd12:3456:789a::1', 'fc00::/7'), true);
  assert.equal(checkIsInNetEx('2001:db8::1', 'fc00::/7'), false);

  // IPv6 常用文檔網段
  assert.equal(checkIsInNetEx('2001:db8:0:0:0:0:0:42', '2001:db8::/32'), true);

  // IPv4 CIDR 格式
  assert.equal(checkIsInNetEx('192.168.5.10', '192.168.0.0/16'), true);
  assert.equal(checkIsInNetEx('8.8.8.8', '192.168.0.0/16'), false);
});

test('runSinglePacTest: 模擬沙盒正確執行 FindProxyForURL 並輸出 Trace', () => {
  const mockContext = {
    clientIpv4: '192.168.1.100',
    clientIpv6: '2001:db8::100',
    dnsMap: {},
  };

  // 1. 純主機名 -> DIRECT
  const res1 = runSinglePacTest(SAMPLE_PAC_SCRIPT, 'http://intranet/', mockContext);
  assert.equal(res1.status, 'DIRECT');
  assert.equal(res1.returnString, 'DIRECT');
  assert.ok(res1.traceSteps.some((s) => s.functionName === 'isPlainHostName' && s.result === true));

  // 2. Google 服務 -> SOCKS5
  const res2 = runSinglePacTest(SAMPLE_PAC_SCRIPT, 'https://www.google.com/search', mockContext);
  assert.equal(res2.status, 'SOCKS');
  assert.match(res2.returnString, /SOCKS5 127\.0\.0\.1:1080/);

  // 3. 一般外部服務 -> PROXY
  const res3 = runSinglePacTest(SAMPLE_PAC_SCRIPT, 'https://developer.mozilla.org/en-US/', mockContext);
  assert.equal(res3.status, 'PROXY');
  assert.match(res3.returnString, /PROXY proxy\.company\.com:8080/);
});

test('runBatchPacTest: 批次執行回歸測試', () => {
  const mockContext = {
    clientIpv4: '192.168.1.100',
    clientIpv6: '2001:db8::100',
    dnsMap: {},
  };
  const urls = ['http://intranet/', 'https://github.com', 'https://example.com'];
  const results = runBatchPacTest(SAMPLE_PAC_SCRIPT, urls, mockContext);

  assert.equal(results.length, 3);
  assert.equal(results[0].status, 'DIRECT');
  assert.equal(results[1].status, 'SOCKS');
  assert.equal(results[2].status, 'PROXY');
});

test('lintPacScript: 靜態相容性診斷', () => {
  const invalidScript = 'function wrong() { return "DIRECT"; }';
  const issues1 = lintPacScript(invalidScript);
  assert.ok(issues1.some((i) => i.severity === 'error' && i.messageZh.includes('FindProxyForURL')));

  const ipv6LegacyScript = `function FindProxyForURL(url, host) {
    if (isInNet(host, "2001:db8::1", "ffff::")) return "DIRECT";
    return "DIRECT";
  }`;
  const issues2 = lintPacScript(ipv6LegacyScript);
  assert.ok(issues2.some((i) => i.severity === 'warning' && i.messageZh.includes('isInNetEx')));
});

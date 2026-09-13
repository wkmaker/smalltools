import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ipToInt,
  intToIp,
  intToBinary,
  cidrToMaskInt,
  getIpScopeInfo,
  calculateSubnet,
  isIpInRange,
  isRangeWithin,
  normalizeIpOctets,
  parseRangeQuery,
} from '../../app/ip-calculator/engine.ts';

test('ipToInt / intToIp：互轉一致，並拒絕非法格式', () => {
  assert.equal(ipToInt('192.168.1.50'), (192 << 24 | 168 << 16 | 1 << 8 | 50) >>> 0);
  assert.equal(intToIp(ipToInt('192.168.1.50')), '192.168.1.50');
  assert.equal(ipToInt('999.1.1.1'), null);
  assert.equal(ipToInt('1.2.3'), null);
  assert.equal(ipToInt('01.2.3.4'), null);
});

test('intToBinary：輸出 4 組 8 位元二進位字串', () => {
  assert.equal(intToBinary(ipToInt('255.0.128.1')), '11111111.00000000.10000000.00000001');
});

test('cidrToMaskInt：邊界值 /0 與 /32', () => {
  assert.equal(cidrToMaskInt(0), 0);
  assert.equal(cidrToMaskInt(32) >>> 0, 0xffffffff);
  assert.equal(intToIp(cidrToMaskInt(24)), '255.255.255.0');
});

test('getIpScopeInfo：RFC 1918 私有網段判斷為 private', () => {
  const info = getIpScopeInfo(ipToInt('192.168.1.1'));
  assert.equal(info.scope, 'Private');
  assert.equal(info.badgeKind, 'private');
});

test('getIpScopeInfo：公網 IP 判斷為 public', () => {
  const info = getIpScopeInfo(ipToInt('8.8.8.8'));
  assert.equal(info.scope, 'Public');
  assert.equal(info.badgeKind, 'public');
});

test('calculateSubnet：192.168.1.50/24 網路位址、廣播位址與可用範圍', () => {
  const ipInt = ipToInt('192.168.1.50');
  const r = calculateSubnet(ipInt, '192.168.1.50', 24);

  assert.equal(r.networkAddress, '192.168.1.0');
  assert.equal(r.broadcastAddress, '192.168.1.255');
  assert.equal(r.subnetMask, '255.255.255.0');
  assert.equal(r.usableCount, 254);
  assert.equal(r.firstUsableStr, '192.168.1.1');
  assert.equal(r.lastUsableStr, '192.168.1.254');
});

test('calculateSubnet：/31 與 /32 屬於特殊邊界（RFC 3021 點對點與單一主機）', () => {
  const ipInt = ipToInt('10.0.0.5');

  const r31 = calculateSubnet(ipInt, '10.0.0.5', 31);
  assert.equal(r31.usableCount, 2);
  assert.equal(r31.firstUsableStr, r31.networkAddress);
  assert.equal(r31.lastUsableStr, r31.broadcastAddress);

  const r32 = calculateSubnet(ipInt, '10.0.0.5', 32);
  assert.equal(r32.usableCount, 1);
  assert.equal(r32.firstUsableStr, '10.0.0.5');
  assert.equal(r32.lastUsableStr, '10.0.0.5');
});

test('normalizeIpOctets：省略末尾 Octet 時自動補 0', () => {
  assert.equal(normalizeIpOctets('192.168.20'), '192.168.20.0');
  assert.equal(normalizeIpOctets('192.168'), '192.168.0.0');
  assert.equal(normalizeIpOctets('10'), '10.0.0.0');
  assert.equal(normalizeIpOctets('192.168.1.50'), '192.168.1.50');
});

test('normalizeIpOctets：拒絕非法格式（超過 4 段、非數字、前導零、超出範圍）', () => {
  assert.equal(normalizeIpOctets('1.2.3.4.5'), null);
  assert.equal(normalizeIpOctets('192.168.a.1'), null);
  assert.equal(normalizeIpOctets('01.2'), null);
  assert.equal(normalizeIpOctets('256.1'), null);
  assert.equal(normalizeIpOctets(''), null);
  assert.equal(normalizeIpOctets('192.'), null);
  assert.equal(normalizeIpOctets('.192'), null);
});

test('isRangeWithin：子網完整落在外層網段範圍內才回傳 true', () => {
  const outer = calculateSubnet(ipToInt('192.168.0.0'), '192.168.0.0', 20); // 192.168.0.0 ~ 192.168.15.255
  const insideSub = calculateSubnet(ipToInt('192.168.3.0'), '192.168.3.0', 24); // 192.168.3.0 ~ 192.168.3.255
  const supernetSub = calculateSubnet(ipToInt('192.168.0.0'), '192.168.0.0', 19); // 192.168.0.0 ~ 192.168.31.255（比外層更大，僅重疊非包含）
  const outsideSub = calculateSubnet(ipToInt('192.168.20.0'), '192.168.20.0', 24); // 完全在外層之外

  assert.equal(
    isRangeWithin(insideSub.networkInt, insideSub.broadcastInt, outer.networkInt, outer.broadcastInt),
    true
  );
  assert.equal(
    isRangeWithin(supernetSub.networkInt, supernetSub.broadcastInt, outer.networkInt, outer.broadcastInt),
    false
  );
  assert.equal(
    isRangeWithin(outsideSub.networkInt, outsideSub.broadcastInt, outer.networkInt, outer.broadcastInt),
    false
  );
});

test('parseRangeQuery：完整 IPv4 回傳 ip 種類，供 isIpInRange 判定', () => {
  const q = parseRangeQuery('192.168.3.200');
  assert.deepEqual(q, { kind: 'ip', ipInt: ipToInt('192.168.3.200') });
});

test('parseRangeQuery：IP/CIDR（含省略末尾 Octet）回傳 cidr 種類與正確網路/廣播位址（回歸：192.168.0.0/20 網段搜尋 192.168.3.0/24 曾誤判為無效關鍵字）', () => {
  const full = parseRangeQuery('192.168.3.0/24');
  assert.deepEqual(full, {
    kind: 'cidr',
    networkInt: ipToInt('192.168.3.0'),
    broadcastInt: ipToInt('192.168.3.255'),
  });

  const abbreviated = parseRangeQuery('192.168.3/24');
  assert.deepEqual(abbreviated, full);
});

test('parseRangeQuery：格式符合但數值不合法回傳 invalid，一般過濾字串與空字串回傳 null', () => {
  assert.deepEqual(parseRangeQuery('999.1.1.1'), { kind: 'invalid' });
  assert.deepEqual(parseRangeQuery('192.168.1.1/33'), { kind: 'invalid' });
  assert.deepEqual(parseRangeQuery('999.1.1.0/24'), { kind: 'invalid' });

  assert.equal(parseRangeQuery('.100'), null);
  assert.equal(parseRangeQuery('192.168'), null);
  assert.equal(parseRangeQuery(''), null);
  assert.equal(parseRangeQuery('   '), null);
});

test('isIpInRange：邊界含網路位址與廣播位址，範圍外回傳 false', () => {
  const r = calculateSubnet(ipToInt('192.168.1.50'), '192.168.1.50', 24);

  assert.equal(isIpInRange(ipToInt('192.168.1.0'), r.networkInt, r.broadcastInt), true);
  assert.equal(isIpInRange(ipToInt('192.168.1.255'), r.networkInt, r.broadcastInt), true);
  assert.equal(isIpInRange(ipToInt('192.168.1.128'), r.networkInt, r.broadcastInt), true);
  assert.equal(isIpInRange(ipToInt('192.168.2.0'), r.networkInt, r.broadcastInt), false);
  assert.equal(isIpInRange(ipToInt('192.168.0.255'), r.networkInt, r.broadcastInt), false);
});

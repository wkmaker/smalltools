import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hexToBytes,
  bytesToHex,
  bytesToBase64,
  parseSvcbHttps,
  parseTlsa,
  parseSshfp,
  parseDs,
  parseRfc3597,
  formatDnsData,
} from '../../app/dns-dig/dnsDecoder.ts';

test('hexToBytes & bytesToHex: 16 進位字串與位元組互轉', () => {
  const hex = '0102030405060708090a0b0c0d0e0f10';
  const bytes = hexToBytes(hex);
  assert.ok(bytes instanceof Uint8Array);
  assert.equal(bytes.length, 16);
  assert.equal(bytesToHex(bytes), hex);

  // 包含空格應能自動清理
  const spaced = hexToBytes('01 02 03 04');
  assert.equal(bytesToHex(spaced), '01020304');

  // 長度為奇數或非法字元應回傳 null
  assert.equal(hexToBytes('abc'), null);
  assert.equal(hexToBytes('zz'), null);
});

test('bytesToBase64: 正確編碼二進位位元組為 Base64', () => {
  const bytes = new Uint8Array([72, 101, 108, 108, 111]); // "Hello"
  assert.equal(bytesToBase64(bytes), 'SGVsbG8=');
});

test('parseTlsa: RFC 6698 TLSA 憑證指紋記錄解碼', () => {
  // Usage: 3 (DANE-EE), Selector: 1 (SPKI), MatchingType: 1 (SHA-256), + 32-byte hash
  const hex = '030101' + 'a'.repeat(64);
  const bytes = hexToBytes(hex);
  const result = parseTlsa(bytes);

  assert.equal(result, `3 1 1 ${'a'.repeat(64)}`);
  assert.equal(parseTlsa(new Uint8Array([1, 2])), null, '長度不足 3 位元組應回傳 null');
});

test('parseSshfp: RFC 4255 SSHFP 主機公鑰指紋解碼', () => {
  // Algorithm: 4 (Ed25519), FP Type: 2 (SHA-256), + hash
  const hex = '0402' + 'b'.repeat(64);
  const bytes = hexToBytes(hex);
  const result = parseSshfp(bytes);

  assert.equal(result, `4 2 ${'b'.repeat(64)}`);
  assert.equal(parseSshfp(new Uint8Array([1])), null, '長度不足 2 位元組應回傳 null');
});

test('parseDs: RFC 4034 DNSSEC 委派簽署者 DS 記錄解碼', () => {
  // KeyTag: 12345 (0x3039), Algorithm: 13 (ECDSA P-256), DigestType: 2 (SHA-256), + hash
  const hex = '30390d02' + 'c'.repeat(64);
  const bytes = hexToBytes(hex);
  const result = parseDs(bytes);

  assert.equal(result, `12345 13 2 ${'c'.repeat(64)}`);
  assert.equal(parseDs(new Uint8Array([0, 1, 2])), null, '長度不足 4 位元組應回傳 null');
});

test('parseSvcbHttps: RFC 9460 HTTPS/SVCB AliasMode 解碼', () => {
  // Priority: 0 (AliasMode), Target: cloudflare.com. (10 + "cloudflare" + 3 + "com" + 0)
  const hex = '0000' + '0a636c6f7564666c61726503636f6d00';
  const bytes = hexToBytes(hex);
  const result = parseSvcbHttps(bytes);

  assert.equal(result, '0 cloudflare.com.');
});

test('parseRfc3597 & formatDnsData: 通用 Wire-Format 封裝與派發解碼', () => {
  // RFC 3597 格式通常以 \# 或 \\# 開頭，後跟長度與 Hex
  // 測試 TLSA (Type 52)
  const tlsaData = '\\# 35 030101' + 'f'.repeat(64);
  const formattedTlsa = formatDnsData({ type: 52, data: tlsaData });
  assert.equal(formattedTlsa, `3 1 1 ${'f'.repeat(64)}`);

  // 非 RFC 3597 格式的一般字串原樣返回
  assert.equal(formatDnsData({ type: 1, data: '1.1.1.1' }), '1.1.1.1');
  assert.equal(formatDnsData(null), '');
});

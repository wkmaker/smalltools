import test from 'node:test';
import assert from 'node:assert/strict';
import {
  md5Hex,
  crc32Hex,
  computeHashHex,
  computeAllHashes,
  detectAlgorithmByLength,
  normalizeHex,
  parseChecksumText,
  matchEntryAgainstFile,
  entryAppliesToFileName,
  looksLikeChecksumManifestFilename,
} from '../../app/checksum-verifier/engine.ts';

function toBytes(str) {
  return new TextEncoder().encode(str);
}

test('md5Hex：符合 RFC 1321 標準測試向量', async () => {
  assert.equal(await md5Hex(toBytes('')), 'd41d8cd98f00b204e9800998ecf8427e');
  assert.equal(await md5Hex(toBytes('abc')), '900150983cd24fb0d6963f7d28e17f72');
  assert.equal(
    await md5Hex(toBytes('The quick brown fox jumps over the lazy dog')),
    '9e107d9d372bb6826bd81d3542a419d6'
  );
});

test('md5Hex：跨越多個 64-byte 區塊（含 yield 分支）仍計算正確', async () => {
  const big = 'a'.repeat(200000);
  const progressCalls = [];
  const hash = await md5Hex(toBytes(big), p => progressCalls.push(p));
  // 與 Node crypto 內建 md5 交叉驗證
  const nodeCrypto = await import('node:crypto');
  const expected = nodeCrypto.createHash('md5').update(big).digest('hex');
  assert.equal(hash, expected);
  assert.ok(progressCalls.length > 0, '應觸發至少一次進度回呼');
});

test('computeHashHex：SHA-256 / SHA-1 / SHA-512 對應標準測試向量', async () => {
  assert.equal(
    await computeHashHex(toBytes('abc').buffer, 'SHA-256'),
    'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad'
  );
  assert.equal(await computeHashHex(toBytes('abc').buffer, 'SHA-1'), 'a9993e364706816aba3e25717850c26c9cd0d89d');
  assert.equal(
    await computeHashHex(toBytes('abc').buffer, 'SHA-512'),
    'ddaf35a193617abacc417349ae20413112e6fa4e89a97ea20a9eeee64b55d39a2192992a274fc1a836ba3c23a3feebbd454d4423643ce80e2a9ac94fa54ca49f'
  );
});

test('computeAllHashes：一次計算全部五種演算法（含 CRC32）', async () => {
  const result = await computeAllHashes(toBytes('abc').buffer);
  assert.equal(Object.keys(result).length, 5);
  assert.equal(result.MD5, '900150983cd24fb0d6963f7d28e17f72');
  assert.equal(result['SHA-256'], 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
});

test('crc32Hex：符合 CRC-32/ISO-HDLC 官方測試向量 "123456789" -> cbf43926', async () => {
  assert.equal(await crc32Hex(toBytes('123456789')), 'cbf43926');
  assert.equal(await crc32Hex(toBytes('')), '00000000');
});

test('crc32Hex：跨越 yield 區間（大型資料）仍與 Node zlib.crc32 結果一致', async () => {
  const big = 'x'.repeat(20 * 1024 * 1024); // 20MB，觸發多次 yield
  const zlib = await import('node:zlib');
  const expected = zlib.crc32(big).toString(16).padStart(8, '0');
  assert.equal(await crc32Hex(toBytes(big)), expected);
});

test('computeHashHex：CRC32 透過統一入口計算', async () => {
  assert.equal(await computeHashHex(toBytes('123456789').buffer, 'CRC32'), 'cbf43926');
});

test('detectAlgorithmByLength：依十六進位字元長度反推演算法', () => {
  assert.equal(detectAlgorithmByLength(8), 'CRC32');
  assert.equal(detectAlgorithmByLength(32), 'MD5');
  assert.equal(detectAlgorithmByLength(40), 'SHA-1');
  assert.equal(detectAlgorithmByLength(64), 'SHA-256');
  assert.equal(detectAlgorithmByLength(128), 'SHA-512');
  assert.equal(detectAlgorithmByLength(96), null); // SHA-384，本工具不支援
  assert.equal(detectAlgorithmByLength(10), null);
});

test('normalizeHex：去除首尾空白並轉小寫', () => {
  assert.equal(normalizeHex('  ABC123  '), 'abc123');
});

test('parseChecksumText：GNU coreutils 格式（雙空白 / 星號二進位標記）', () => {
  const text = [
    'd41d8cd98f00b204e9800998ecf8427e  empty.txt',
    '900150983cd24fb0d6963f7d28e17f72 *binary.bin',
  ].join('\n');
  const entries = parseChecksumText(text);
  assert.equal(entries.length, 2);
  assert.deepEqual(entries[0], { hash: 'd41d8cd98f00b204e9800998ecf8427e', algorithm: 'MD5', filename: 'empty.txt' });
  assert.deepEqual(entries[1], {
    hash: '900150983cd24fb0d6963f7d28e17f72',
    algorithm: 'MD5',
    filename: 'binary.bin',
  });
});

test('parseChecksumText：BSD/OpenSSL 格式', () => {
  const text = 'SHA256 (installer.dmg) = ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad';
  const entries = parseChecksumText(text);
  assert.equal(entries.length, 1);
  assert.equal(entries[0].algorithm, 'SHA-256');
  assert.equal(entries[0].filename, 'installer.dmg');
});

test('parseChecksumText：SFV 格式（檔名在前、8 碼 CRC32 在後）', () => {
  const text = ';SFV created by tool\nrelease/file one.rar cbf43926\n';
  const entries = parseChecksumText(text);
  assert.equal(entries.length, 1);
  assert.deepEqual(entries[0], { hash: 'cbf43926', algorithm: 'CRC32', filename: 'release/file one.rar' });
});

test('parseChecksumText：純雜湊字串（無檔名）套用於任一檔案', () => {
  const entries = parseChecksumText('  ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad  ');
  assert.equal(entries.length, 1);
  assert.equal(entries[0].filename, null);
  assert.equal(entries[0].algorithm, 'SHA-256');
});

test('parseChecksumText：忽略空白行與註解行', () => {
  const text = '# CHECKSUMS\n\n; comment\nd41d8cd98f00b204e9800998ecf8427e  a.txt\n';
  const entries = parseChecksumText(text);
  assert.equal(entries.length, 1);
});

test('parseChecksumText：無法辨識的雜湊長度與亂碼一律忽略', () => {
  assert.deepEqual(parseChecksumText('not a hash at all'), []);
  assert.deepEqual(parseChecksumText('12345'), []);
});

test('matchEntryAgainstFile：檔名相符且雜湊一致 -> match', () => {
  const entry = { hash: 'abc123', algorithm: 'SHA-256', filename: 'foo/bar.iso' };
  const result = matchEntryAgainstFile(entry, 'BAR.iso', { 'SHA-256': 'abc123' });
  assert.deepEqual(result, { entry, status: 'match' });
});

test('matchEntryAgainstFile：雜湊不一致 -> mismatch', () => {
  const entry = { hash: 'abc123', algorithm: 'SHA-256', filename: 'bar.iso' };
  const result = matchEntryAgainstFile(entry, 'bar.iso', { 'SHA-256': 'zzz999' });
  assert.equal(result.status, 'mismatch');
});

test('matchEntryAgainstFile：檔名不符 -> 回傳 null（與該檔案無關）', () => {
  const entry = { hash: 'abc123', algorithm: 'SHA-256', filename: 'other.iso' };
  assert.equal(matchEntryAgainstFile(entry, 'bar.iso', { 'SHA-256': 'abc123' }), null);
});

test('matchEntryAgainstFile：無檔名限制的通用雜湊套用於任一檔案', () => {
  const entry = { hash: 'abc123', algorithm: 'SHA-256', filename: null };
  const result = matchEntryAgainstFile(entry, 'anything.zip', { 'SHA-256': 'abc123' });
  assert.equal(result.status, 'match');
});

test('matchEntryAgainstFile：未計算對應演算法（如 SHA-384）-> unsupported', () => {
  const entry = { hash: 'a'.repeat(96), algorithm: null, filename: null };
  const result = matchEntryAgainstFile(entry, 'anything.zip', { 'SHA-256': 'abc123' });
  assert.equal(result.status, 'unsupported');
});

test('entryAppliesToFileName：忽略路徑與大小寫，僅比對 basename', () => {
  const entry = { hash: 'abc', algorithm: null, filename: './dist/App-1.0.0.dmg' };
  assert.equal(entryAppliesToFileName(entry, 'app-1.0.0.dmg'), true);
  assert.equal(entryAppliesToFileName(entry, 'other.dmg'), false);
});

test('entryAppliesToFileName：無檔名限制永遠適用', () => {
  const entry = { hash: 'abc', algorithm: null, filename: null };
  assert.equal(entryAppliesToFileName(entry, 'whatever.bin'), true);
});

test('looksLikeChecksumManifestFilename：常見校驗清單副檔名與慣用檔名', () => {
  assert.equal(looksLikeChecksumManifestFilename('release.sha256'), true);
  assert.equal(looksLikeChecksumManifestFilename('release.SHA256SUM'), true);
  assert.equal(looksLikeChecksumManifestFilename('SHA256SUMS'), true);
  assert.equal(looksLikeChecksumManifestFilename('CHECKSUMS.txt'), true);
  assert.equal(looksLikeChecksumManifestFilename('md5sums'), true);
});

test('looksLikeChecksumManifestFilename：一般檔案不應被誤判', () => {
  assert.equal(looksLikeChecksumManifestFilename('installer.exe'), false);
  assert.equal(looksLikeChecksumManifestFilename('notes.txt'), false);
  assert.equal(looksLikeChecksumManifestFilename('archive.zip'), false);
});

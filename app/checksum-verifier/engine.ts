/**
 * checksum-verifier/engine.ts
 * ──────────────────────────────────────────────────────────────
 * 純函數雜湊計算與校驗清單解析引擎，與 UI 完全分離，可獨立單元測試。
 * - SHA-1 / SHA-256 / SHA-512 使用瀏覽器原生 Web Crypto SubtleCrypto。
 * - MD5 為純 JS 實作（RFC 1321），因 SubtleCrypto 未內建 MD5。
 * - CRC32 為純 JS 實作（CRC-32/ISO-HDLC，與 zlib/ZIP/PNG/SFV 相同變體），
 *   用於常見的 .sfv 校驗清單格式，非密碼學安全雜湊，僅供簡易錯誤偵測比對。
 */

export type HashAlgorithm = 'CRC32' | 'MD5' | 'SHA-1' | 'SHA-256' | 'SHA-512';

export const HASH_ALGORITHMS: HashAlgorithm[] = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512', 'CRC32'];

// 依標準輸出十六進位字元長度反推演算法（用於無檔名/無標頭的純雜湊字串）
export const HASH_HEX_LENGTH: Record<HashAlgorithm, number> = {
  CRC32: 8,
  MD5: 32,
  'SHA-1': 40,
  'SHA-256': 64,
  'SHA-512': 128,
};

function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

export function normalizeHex(input: string): string {
  return input.trim().toLowerCase();
}

export function detectAlgorithmByLength(hexLength: number): HashAlgorithm | null {
  const found = (Object.entries(HASH_HEX_LENGTH) as [HashAlgorithm, number][]).find(
    ([, len]) => len === hexLength
  );
  return found ? found[0] : null;
}

// ── MD5 (RFC 1321) 純 JS 實作 ──────────────────────────────────

const MD5_K = new Uint32Array(64);
for (let i = 0; i < 64; i++) {
  MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32) >>> 0;
}

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15,
  21,
];

function leftRotate(x: number, c: number): number {
  return ((x << c) | (x >>> (32 - c))) >>> 0;
}

function uint32ToHexLE(x: number): string {
  const buf = new Uint8Array(4);
  new DataView(buf.buffer).setUint32(0, x, true);
  return Array.from(buf)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// 每處理多少個 64-byte 區塊後 yield 一次主執行緒，避免大檔案卡死 UI
const MD5_YIELD_BLOCK_INTERVAL = 65536; // 約每 4MB 讓出一次

/**
 * 純 JS MD5，分塊處理並定期讓出主執行緒（大檔案不卡 UI）。
 */
export async function md5Hex(data: ArrayBuffer | Uint8Array, onProgress?: (percent: number) => void): Promise<string> {
  const message = data instanceof Uint8Array ? data : new Uint8Array(data);
  const paddedLength = Math.ceil((message.length + 9) / 64) * 64;
  const padded = new Uint8Array(paddedLength);
  padded.set(message);
  padded[message.length] = 0x80;
  new DataView(padded.buffer).setBigUint64(paddedLength - 8, BigInt(message.length) * BigInt(8), true);

  const view = new DataView(padded.buffer);
  const chunkCount = paddedLength / 64;
  const M = new Uint32Array(16);

  let a0 = 0x67452301;
  let b0 = 0xefcdab89;
  let c0 = 0x98badcfe;
  let d0 = 0x10325476;

  for (let chunk = 0; chunk < chunkCount; chunk++) {
    const offset = chunk * 64;
    for (let j = 0; j < 16; j++) {
      M[j] = view.getUint32(offset + j * 4, true);
    }

    let A = a0;
    let B = b0;
    let C = c0;
    let D = d0;

    for (let i = 0; i < 64; i++) {
      let F: number;
      let g: number;
      if (i < 16) {
        F = (B & C) | (~B & D);
        g = i;
      } else if (i < 32) {
        F = (D & B) | (~D & C);
        g = (5 * i + 1) % 16;
      } else if (i < 48) {
        F = B ^ C ^ D;
        g = (3 * i + 5) % 16;
      } else {
        F = C ^ (B | ~D);
        g = (7 * i) % 16;
      }
      F = (F + A + MD5_K[i] + M[g]) >>> 0;
      A = D;
      D = C;
      C = B;
      B = (B + leftRotate(F, MD5_S[i])) >>> 0;
    }

    a0 = (a0 + A) >>> 0;
    b0 = (b0 + B) >>> 0;
    c0 = (c0 + C) >>> 0;
    d0 = (d0 + D) >>> 0;

    if (onProgress && chunk % MD5_YIELD_BLOCK_INTERVAL === 0) {
      onProgress(Math.round((chunk / chunkCount) * 100));
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  onProgress?.(100);
  return uint32ToHexLE(a0) + uint32ToHexLE(b0) + uint32ToHexLE(c0) + uint32ToHexLE(d0);
}

// ── CRC32 (CRC-32/ISO-HDLC，polynomial 0xEDB88320，與 zlib/ZIP/PNG/SFV 相同) ──

const CRC32_TABLE = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    table[n] = c >>> 0;
  }
  return table;
})();

const CRC32_YIELD_BYTE_INTERVAL = 8 * 1024 * 1024; // 約每 8MB 讓出一次主執行緒

export async function crc32Hex(data: ArrayBuffer | Uint8Array, onProgress?: (percent: number) => void): Promise<string> {
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  const total = bytes.length;
  let crc = 0xffffffff;
  let sinceYield = 0;

  for (let i = 0; i < total; i++) {
    crc = CRC32_TABLE[(crc ^ bytes[i]) & 0xff] ^ (crc >>> 8);
    sinceYield++;
    if (onProgress && sinceYield >= CRC32_YIELD_BYTE_INTERVAL) {
      sinceYield = 0;
      onProgress(Math.round((i / total) * 100));
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  crc = (crc ^ 0xffffffff) >>> 0;
  onProgress?.(100);
  return crc.toString(16).padStart(8, '0');
}

// ── 統一雜湊計算入口 ────────────────────────────────────────────

export async function computeHashHex(
  data: ArrayBuffer,
  algorithm: HashAlgorithm,
  onProgress?: (percent: number) => void
): Promise<string> {
  if (algorithm === 'MD5') {
    return md5Hex(data, onProgress);
  }
  if (algorithm === 'CRC32') {
    return crc32Hex(data, onProgress);
  }
  const digest = await crypto.subtle.digest(algorithm, data);
  onProgress?.(100);
  return bufferToHex(digest);
}

export async function computeAllHashes(
  data: ArrayBuffer,
  algorithms: HashAlgorithm[] = HASH_ALGORITHMS,
  onProgress?: (algorithm: HashAlgorithm, percent: number) => void
): Promise<Record<HashAlgorithm, string>> {
  const result = {} as Record<HashAlgorithm, string>;
  for (const algorithm of algorithms) {
    result[algorithm] = await computeHashHex(data, algorithm, onProgress ? p => onProgress(algorithm, p) : undefined);
  }
  return result;
}

// ── 校驗清單解析 ────────────────────────────────────────────────

export interface ChecksumEntry {
  /** 已正規化為小寫的十六進位雜湅值 */
  hash: string;
  /** 從格式標頭明確得知的演算法；未標明則為 null（比對時依長度反推） */
  algorithm: HashAlgorithm | null;
  /** 對應的檔名；null 表示無檔名限制的通用雜湊（套用於任一檔案） */
  filename: string | null;
}

const BSD_LINE = /^(MD5|SHA1|SHA256|SHA384|SHA512)\s*\(([^)]+)\)\s*=\s*([0-9a-fA-F]+)\s*$/i;
const GNU_LINE = /^([0-9a-fA-F]{32,128})\s+[*U ]?(.+)$/;
// SFV 格式：`filename crc32hex`（檔名在前、8 碼 CRC32 在後），常見於 .sfv 檔案
const SFV_LINE = /^(.+)\s+([0-9a-fA-F]{8})$/;
const BARE_HASH = /^[0-9a-fA-F]+$/;

const BSD_ALGO_MAP: Record<string, HashAlgorithm | null> = {
  MD5: 'MD5',
  SHA1: 'SHA-1',
  SHA256: 'SHA-256',
  SHA384: null, // 本工具未提供 SHA-384 運算，僅記錄雜湊值供人工比對
  SHA512: 'SHA-512',
};

/**
 * 解析常見的雜湅校驗清單文字，支援：
 * - GNU coreutils 格式：`<hash>  <filename>` 或 `<hash> *<filename>`（md5sum/sha256sum/shasum 輸出）
 * - BSD/OpenSSL 格式：`SHA256 (filename) = <hash>`
 * - SFV 格式：`<filename> <crc32hex>`（檔名在前，.sfv 檔案慣例）
 * - 純雜湊字串（無檔名，套用於任一檔案）
 * 空白行與以 `#`/`;` 開頭的註解行會被忽略。
 */
export function parseChecksumText(text: string): ChecksumEntry[] {
  const entries: ChecksumEntry[] = [];

  for (const rawLine of text.split(/\r\n|\r|\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;

    const bsdMatch = line.match(BSD_LINE);
    if (bsdMatch) {
      const algorithm = BSD_ALGO_MAP[bsdMatch[1].toUpperCase()] ?? null;
      entries.push({ hash: normalizeHex(bsdMatch[3]), algorithm, filename: bsdMatch[2].trim() });
      continue;
    }

    const gnuMatch = line.match(GNU_LINE);
    if (gnuMatch) {
      const hash = normalizeHex(gnuMatch[1]);
      entries.push({ hash, algorithm: detectAlgorithmByLength(hash.length), filename: gnuMatch[2].trim() });
      continue;
    }

    const sfvMatch = line.match(SFV_LINE);
    if (sfvMatch) {
      entries.push({ hash: normalizeHex(sfvMatch[2]), algorithm: 'CRC32', filename: sfvMatch[1].trim() });
      continue;
    }

    if (BARE_HASH.test(line) && detectAlgorithmByLength(line.length)) {
      const hash = normalizeHex(line);
      entries.push({ hash, algorithm: detectAlgorithmByLength(hash.length), filename: null });
    }
  }

  return entries;
}

function baseName(name: string): string {
  return name
    .trim()
    .replace(/^\.\//, '')
    .split(/[\\/]/)
    .pop()!
    .toLowerCase();
}

/**
 * 判斷校驗清單項目是否適用於指定檔名：無檔名限制（通用雜湊）永遠適用；
 * 有檔名限制者僅比對 basename（忽略路徑與大小寫）。
 */
export function entryAppliesToFileName(entry: ChecksumEntry, fileName: string): boolean {
  return entry.filename === null || baseName(entry.filename) === baseName(fileName);
}

export type MatchStatus = 'match' | 'mismatch' | 'unsupported';

export interface HashMatchResult {
  entry: ChecksumEntry;
  status: MatchStatus;
}

/**
 * 判斷單一校驗清單項目是否適用於指定檔案，並回傳比對結果。
 * - 有檔名限制的項目：檔名（僅比對 basename，忽略路徑與大小寫）需相符才會比對。
 * - 無檔名限制的項目（純雜湊字串）：套用於任一檔案。
 * - 若演算法無法辨識或本工具未計算該演算法（如 SHA-384），回傳 'unsupported'。
 * 回傳 null 表示此項目與該檔案無關（檔名不符），不應顯示比對結果。
 */
export function matchEntryAgainstFile(
  entry: ChecksumEntry,
  fileName: string,
  computedHashes: Partial<Record<HashAlgorithm, string>>
): HashMatchResult | null {
  if (!entryAppliesToFileName(entry, fileName)) {
    return null;
  }

  const algorithm = entry.algorithm ?? detectAlgorithmByLength(entry.hash.length);
  const computed = algorithm ? computedHashes[algorithm] : undefined;
  if (!algorithm || computed === undefined) {
    return { entry, status: 'unsupported' };
  }

  return { entry, status: computed === entry.hash ? 'match' : 'mismatch' };
}

// ── 校驗清單檔案偵測（拖曳分流用） ────────────────────────────────

const CHECKSUM_EXTENSION_RE =
  /\.(sha256|sha256sum|sha1|sha1sum|sha512|sha512sum|md5|md5sum|sfv|cksum|checksum)$/i;
const CHECKSUM_BASENAME_RE = /^(CHECKSUMS?|SHA1SUMS?|SHA256SUMS?|SHA512SUMS?|MD5SUMS?)$/i;

/**
 * 依副檔名或慣用檔名（如 SHA256SUMS、CHECKSUMS）判斷這是一份校驗清單檔案，
 * 而非需要被計算雜湊的目標檔案。用於拖曳上傳時自動分流。
 */
export function looksLikeChecksumManifestFilename(fileName: string): boolean {
  const name = fileName.trim();
  if (CHECKSUM_EXTENSION_RE.test(name)) return true;
  const withoutExt = name.replace(/\.[^./\\]+$/, '');
  return CHECKSUM_BASENAME_RE.test(withoutExt) || CHECKSUM_BASENAME_RE.test(name);
}

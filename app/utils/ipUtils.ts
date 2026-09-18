/**
 * IPv4 / IPv6 位址底層解析（無 UI 依賴，可獨立單元測試）。
 *
 * 原本在 ip-calculator、pac-generator、pac-tester 三處各自重複實作 IPv4 字串轉
 * 整數、IPv6 字串轉 128-bit 數值的邏輯，寫法略有差異，統一抽到這裡共用。
 * 各工具仍保留自己的格式化 / 驗證訊息 / 沙盒模擬等外層邏輯。
 */

/**
 * 將 IPv4 字串轉為 32-bit 無號整數；格式不合法（含前導零、超出 0~255）回傳 null。
 */
export function parseIpv4ToInt(ipStr: string): number | null {
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

/**
 * 檢查是否為合法 IPv4 位址。
 */
export function isValidIpv4(ipStr: string): boolean {
  return parseIpv4ToInt(ipStr) !== null;
}

/**
 * 將 32-bit 無號整數轉回 IPv4 點分十進制字串。
 */
export function formatIntToIpv4(intVal: number): string {
  return [
    (intVal >>> 24) & 255,
    (intVal >>> 16) & 255,
    (intVal >>> 8) & 255,
    intVal & 255,
  ].join('.');
}

/**
 * 將 IPv6 字串（支援 "::" 縮寫與 IPv4 映射寫法如 ::ffff:192.168.1.1）解析為
 * 128-bit BigInt；格式不合法回傳 null。
 */
export function parseIpv6ToBigInt(ipStr: string): bigint | null {
  try {
    let clean = ipStr.trim().toLowerCase();
    // 去除可選的方括號例如 [2001:db8::1]
    if (clean.startsWith('[') && clean.endsWith(']')) {
      clean = clean.slice(1, -1);
    }
    if (!clean) return null;

    // 檢查是否包含 IPv4 映射 (如 ::ffff:192.168.1.1)
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

/**
 * 檢查是否為合法 IPv6 位址。
 */
export function isValidIpv6(ipStr: string): boolean {
  return parseIpv6ToBigInt(ipStr) !== null;
}

export interface DnsAnswer {
  name: string;
  type: number;
  TTL: number;
  data: string;
}

/**
 * 將 16 進位字串轉換為 Uint8Array
 */
export function hexToBytes(hex: string): Uint8Array | null {
  const cleaned = hex.replace(/\s+/g, '');
  if (cleaned.length % 2 !== 0) return null;
  const bytes = new Uint8Array(cleaned.length / 2);
  for (let i = 0; i < cleaned.length; i += 2) {
    const b = parseInt(cleaned.substring(i, i + 2), 16);
    if (isNaN(b)) return null;
    bytes[i / 2] = b;
  }
  return bytes;
}

/**
 * 將 Uint8Array 安全轉換為 Base64 字串
 */
export function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

/**
 * 將 Uint8Array 轉換為小寫 16 進位字串
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * RFC 9460 / RFC 3597 SVCB (Type 64) 與 HTTPS (Type 65) 解碼器
 */
export function parseSvcbHttps(bytes: Uint8Array): string | null {
  if (bytes.length < 3) return null;
  let offset = 0;

  const priority = (bytes[offset] << 8) | bytes[offset + 1];
  offset += 2;

  const targetParts: string[] = [];
  while (offset < bytes.length) {
    const len = bytes[offset++];
    if (len === 0) break;
    if (offset + len > bytes.length) return null;
    const labelBytes = bytes.subarray(offset, offset + len);
    targetParts.push(new TextDecoder().decode(labelBytes));
    offset += len;
  }
  const targetName = targetParts.length === 0 ? '.' : targetParts.join('.') + '.';

  const params: string[] = [];
  const KEY_NAMES: Record<number, string> = {
    0: 'mandatory',
    1: 'alpn',
    2: 'no-default-alpn',
    3: 'port',
    4: 'ipv4hint',
    5: 'ech',
    6: 'ipv6hint',
    7: 'dohpath',
  };

  while (offset + 4 <= bytes.length) {
    const key = (bytes[offset] << 8) | bytes[offset + 1];
    const valLen = (bytes[offset + 2] << 8) | bytes[offset + 3];
    offset += 4;

    if (offset + valLen > bytes.length) break;
    const valBytes = bytes.subarray(offset, offset + valLen);
    offset += valLen;

    const keyName = KEY_NAMES[key] || `key${key}`;
    let valStr = '';

    if (key === 1) {
      const alpnList: string[] = [];
      let aOffset = 0;
      while (aOffset < valBytes.length) {
        const aLen = valBytes[aOffset++];
        if (aOffset + aLen > valBytes.length) break;
        alpnList.push(new TextDecoder().decode(valBytes.subarray(aOffset, aOffset + aLen)));
        aOffset += aLen;
      }
      valStr = alpnList.join(',');
    } else if (key === 3) {
      if (valBytes.length === 2) {
        valStr = ((valBytes[0] << 8) | valBytes[1]).toString();
      }
    } else if (key === 4) {
      const ips: string[] = [];
      for (let i = 0; i + 4 <= valBytes.length; i += 4) {
        ips.push(`${valBytes[i]}.${valBytes[i + 1]}.${valBytes[i + 2]}.${valBytes[i + 3]}`);
      }
      valStr = ips.join(',');
    } else if (key === 6) {
      const ips: string[] = [];
      for (let i = 0; i + 16 <= valBytes.length; i += 16) {
        const groups: string[] = [];
        for (let j = 0; j < 16; j += 2) {
          groups.push(((valBytes[i + j] << 8) | valBytes[i + j + 1]).toString(16));
        }
        ips.push(groups.join(':'));
      }
      valStr = ips.join(',');
    } else if (key === 5) {
      // RFC 9460: ech (Encrypted Client Hello) 二進位資料必須 Base64 編碼
      valStr = bytesToBase64(valBytes);
    } else if (key === 2) {
      valStr = '';
    } else {
      const isPrintable = valBytes.every(b => b >= 32 && b <= 126);
      if (isPrintable) {
        valStr = new TextDecoder().decode(valBytes);
      } else {
        valStr = bytesToBase64(valBytes);
      }
    }

    if (key === 2 && !valStr) {
      params.push(keyName);
    } else {
      params.push(`${keyName}=${valStr}`);
    }
  }

  let result = `${priority} ${targetName}`;
  if (params.length > 0) {
    result += ` ${params.join(' ')}`;
  }
  return result;
}

/**
 * RFC 6844 CAA Record (Type 257) 解碼器
 */
export function parseCaa(bytes: Uint8Array): string | null {
  if (bytes.length < 2) return null;
  const flags = bytes[0];
  const tagLen = bytes[1];
  if (bytes.length < 2 + tagLen) return null;

  const tag = new TextDecoder().decode(bytes.subarray(2, 2 + tagLen));
  const valueBytes = bytes.subarray(2 + tagLen);
  const value = new TextDecoder().decode(valueBytes);

  return `${flags} ${tag} "${value}"`;
}

/**
 * RFC 6698 TLSA Record (Type 52) 解碼器
 */
export function parseTlsa(bytes: Uint8Array): string | null {
  if (bytes.length < 3) return null;
  const usage = bytes[0];
  const selector = bytes[1];
  const matchingType = bytes[2];
  const certDataHex = bytesToHex(bytes.subarray(3));
  return `${usage} ${selector} ${matchingType} ${certDataHex}`;
}

/**
 * RFC 4255 SSHFP Record (Type 44) 解碼器
 */
export function parseSshfp(bytes: Uint8Array): string | null {
  if (bytes.length < 2) return null;
  const algorithm = bytes[0];
  const fpType = bytes[1];
  const fingerprintHex = bytesToHex(bytes.subarray(2));
  return `${algorithm} ${fpType} ${fingerprintHex}`;
}

/**
 * RFC 4034 DS Record (Type 43) 解碼器
 */
export function parseDs(bytes: Uint8Array): string | null {
  if (bytes.length < 4) return null;
  const keyTag = (bytes[0] << 8) | bytes[1];
  const algorithm = bytes[2];
  const digestType = bytes[3];
  const digestHex = bytesToHex(bytes.subarray(4));
  return `${keyTag} ${algorithm} ${digestType} ${digestHex}`;
}

/**
 * RFC 3597 通用 Wire-Format (Hex) 轉譯派發主函式
 */
export function parseRfc3597(dataStr: string, recordType: number): string | null {
  try {
    const cleaned = dataStr.replace(/^\\?\#\s*/, '').trim();
    const tokens = cleaned.split(/\s+/);
    if (tokens.length < 2) return null;

    const rawHex = tokens.slice(1).join('');
    const bytes = hexToBytes(rawHex);
    if (!bytes) return null;

    switch (recordType) {
      case 64: // SVCB
      case 65: // HTTPS
        return parseSvcbHttps(bytes);
      case 257: // CAA
        return parseCaa(bytes);
      case 52: // TLSA
        return parseTlsa(bytes);
      case 44: // SSHFP
        return parseSshfp(bytes);
      case 43: // DS
        return parseDs(bytes);
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * 格式化 Answer Data，若為 RFC 3597 Hex 則自動進行對應 Type 解碼
 */
export function formatDnsData(ans: { type: number; data: string }): string {
  if (!ans || !ans.data) return '';
  const rawData = String(ans.data);

  if (/^\\?\#\s*/.test(rawData)) {
    const parsed = parseRfc3597(rawData, ans.type);
    if (parsed) return parsed;
  }
  return rawData;
}

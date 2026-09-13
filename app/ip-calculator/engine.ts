/**
 * IPv4 子網段計算引擎（無 UI 依賴、可獨立單元測試）。
 *
 * 從 `IpCalculatorClient.tsx` 抽離：IP/整數互轉、CIDR 遮罩運算、RFC 保留
 * 位址範圍查表與子網段（網路位址/廣播位址/可用範圍）計算等純函數。
 */

export function ipToInt(ipStr: string): number | null {
  if (typeof ipStr !== 'string') return null;
  const parts = ipStr.trim().split('.');
  if (parts.length !== 4) return null;
  let num = 0;
  for (let i = 0; i < 4; i++) {
    const p = parts[i];
    if (!/^\d+$/.test(p)) return null;
    const n = parseInt(p, 10);
    if (n < 0 || n > 255 || (p.length > 1 && p.startsWith('0'))) return null;
    num = (num << 8) + n;
  }
  return num >>> 0;
}

/**
 * 將可能省略末尾 Octet 的縮寫 IP（如 "192.168.20" 或 "10"）正規化為完整
 * 四段點分十進制字串，缺少的 Octet 一律補 0（"192.168.20" → "192.168.20.0"）。
 * 每段仍需符合 0~255 且無多餘前導零，格式不合法回傳 null。
 */
export function normalizeIpOctets(ipStr: string): string | null {
  if (typeof ipStr !== 'string') return null;
  const trimmed = ipStr.trim();
  if (trimmed === '' || trimmed.startsWith('.') || trimmed.endsWith('.')) return null;

  const parts = trimmed.split('.');
  if (parts.length < 1 || parts.length > 4) return null;

  const octets: number[] = [];
  for (const p of parts) {
    if (!/^\d+$/.test(p)) return null;
    const n = parseInt(p, 10);
    if (n < 0 || n > 255 || (p.length > 1 && p.startsWith('0'))) return null;
    octets.push(n);
  }

  while (octets.length < 4) octets.push(0);
  return octets.join('.');
}

export function intToIp(intVal: number): string {
  return [
    (intVal >>> 24) & 255,
    (intVal >>> 16) & 255,
    (intVal >>> 8) & 255,
    intVal & 255,
  ].join('.');
}

export function intToBinary(intVal: number): string {
  return [
    (intVal >>> 24) & 255,
    (intVal >>> 16) & 255,
    (intVal >>> 8) & 255,
    intVal & 255,
  ]
    .map((b) => b.toString(2).padStart(8, '0'))
    .join('.');
}

export function cidrToMaskInt(cidr: number): number {
  if (cidr === 0) return 0;
  return (~0 << (32 - cidr)) >>> 0;
}

export type IpBadgeKind = 'private' | 'special' | 'public';

interface IpRangeRuleV4 {
  scope: string;
  baseInt: number;
  maskInt: number;
  badgeKind: IpBadgeKind;
}

const RFC_RESERVED_RANGES_V4: IpRangeRuleV4[] = [
  // RFC 1918 - Private Networks
  { scope: 'Private', baseInt: ipToInt('10.0.0.0')!, maskInt: cidrToMaskInt(8), badgeKind: 'private' },
  { scope: 'Private', baseInt: ipToInt('172.16.0.0')!, maskInt: cidrToMaskInt(12), badgeKind: 'private' },
  { scope: 'Private', baseInt: ipToInt('192.168.0.0')!, maskInt: cidrToMaskInt(16), badgeKind: 'private' },

  // RFC 1122 - Loopback
  { scope: 'Loopback', baseInt: ipToInt('127.0.0.0')!, maskInt: cidrToMaskInt(8), badgeKind: 'special' },

  // RFC 6598 - CGNAT (Shared Address Space)
  { scope: 'CGNAT', baseInt: ipToInt('100.64.0.0')!, maskInt: cidrToMaskInt(10), badgeKind: 'special' },

  // RFC 3927 - Link-Local / APIPA
  { scope: 'Link-Local', baseInt: ipToInt('169.254.0.0')!, maskInt: cidrToMaskInt(16), badgeKind: 'special' },

  // RFC 5771 / Class D & E Multicast & Experimental
  { scope: 'Reserved', baseInt: ipToInt('224.0.0.0')!, maskInt: cidrToMaskInt(4), badgeKind: 'special' },
];

export function getIpScopeInfo(ipInt: number): { classStr: string; scope: string; badgeKind: IpBadgeKind } {
  const firstOctet = (ipInt >>> 24) & 255;
  let ipClass = 'C';
  if (firstOctet <= 127) ipClass = 'A';
  else if (firstOctet <= 191) ipClass = 'B';
  else if (firstOctet <= 223) ipClass = 'C';
  else if (firstOctet <= 239) ipClass = 'D (Multicast)';
  else ipClass = 'E (Experimental)';

  // 宣告式 RFC 對照表位元遮罩查表 (Bitwise Subnet Check)
  const matchedRule = RFC_RESERVED_RANGES_V4.find(
    (rule) => (ipInt & rule.maskInt) === (rule.baseInt & rule.maskInt)
  );

  if (matchedRule) {
    return { classStr: `${ipClass} Class`, scope: matchedRule.scope, badgeKind: matchedRule.badgeKind };
  }

  return { classStr: `${ipClass} Class`, scope: 'Public', badgeKind: 'public' };
}

export interface SubnetResult {
  inputIp: string;
  cidr: number;
  subnetMask: string;
  wildcardMask: string;
  networkAddress: string;
  networkInt: number;
  broadcastAddress: string;
  broadcastInt: number;
  totalIps: number;
  usableCount: number;
  firstUsableInt: number;
  lastUsableInt: number;
  firstUsableStr: string;
  lastUsableStr: string;
  scopeInfo: {
    classStr: string;
    scope: string;
    badgeKind: IpBadgeKind;
  };
  binaryIp: string;
}

export function isIpInRange(targetIpInt: number, networkInt: number, broadcastInt: number): boolean {
  return targetIpInt >= networkInt && targetIpInt <= broadcastInt;
}

/**
 * 判斷一段子網範圍（子網路位址 ~ 子廣播位址）是否完整落在外層網段範圍內
 * （兩端皆須介於外層網路位址與廣播位址之間，含邊界）。
 */
export function isRangeWithin(
  subNetworkInt: number,
  subBroadcastInt: number,
  networkInt: number,
  broadcastInt: number
): boolean {
  return (
    isIpInRange(subNetworkInt, networkInt, broadcastInt) &&
    isIpInRange(subBroadcastInt, networkInt, broadcastInt)
  );
}

export function calculateSubnet(ipInt: number, rawIpStr: string, cidr: number): SubnetResult {
  const maskInt = cidrToMaskInt(cidr);
  const maskStr = intToIp(maskInt);
  const wildcardInt = (~maskInt) >>> 0;
  const wildcardStr = intToIp(wildcardInt);

  const netInt = (ipInt & maskInt) >>> 0;
  const netStr = intToIp(netInt);

  const broadcastInt = (netInt | wildcardInt) >>> 0;
  const broadcastStr = intToIp(broadcastInt);

  const totalIps = Math.pow(2, 32 - cidr);

  let usableCount = 0;
  let firstUsableInt = 0;
  let lastUsableInt = 0;

  if (cidr === 31) {
    usableCount = 2;
    firstUsableInt = netInt;
    lastUsableInt = broadcastInt;
  } else if (cidr === 32) {
    usableCount = 1;
    firstUsableInt = netInt;
    lastUsableInt = netInt;
  } else {
    usableCount = totalIps - 2;
    firstUsableInt = netInt + 1;
    lastUsableInt = broadcastInt - 1;
  }

  const firstUsableStr = intToIp(firstUsableInt);
  const lastUsableStr = intToIp(lastUsableInt);
  const scopeInfo = getIpScopeInfo(ipInt);
  const binaryIp = intToBinary(ipInt);

  return {
    inputIp: rawIpStr,
    cidr,
    subnetMask: maskStr,
    wildcardMask: wildcardStr,
    networkAddress: netStr,
    networkInt: netInt,
    broadcastAddress: broadcastStr,
    broadcastInt: broadcastInt,
    totalIps,
    usableCount,
    firstUsableInt,
    lastUsableInt,
    firstUsableStr,
    lastUsableStr,
    scopeInfo,
    binaryIp,
  };
}

export type RangeQuery =
  | { kind: 'ip'; ipInt: number }
  | { kind: 'cidr'; networkInt: number; broadcastInt: number }
  | { kind: 'invalid' };

/**
 * 解析「範圍搜尋」輸入框的內容（UI 搜尋框同時身兼清單過濾與範圍搜尋兩種用途，
 * 抽成純函數以便獨立單元測試，避免只在元件內用 useMemo/正規表示式判斷而未受測試覆蓋）。
 *
 * - 完整 IPv4（四段數字）→ { kind: 'ip', ipInt }，呼叫端應以 isIpInRange 判斷。
 * - IP/CIDR（IP 可省略末尾 Octet，如 "192.168.3/24"）→ { kind: 'cidr', networkInt,
 *   broadcastInt }，呼叫端應以 isRangeWithin 判斷子網是否完整落在目標網段內。
 * - 格式符合上述兩種但數值不合法（Octet 超出 0~255、CIDR 超過 32 等）→
 *   { kind: 'invalid' }，呼叫端應顯示格式錯誤訊息。
 * - 其餘（一般過濾關鍵字、空字串）→ null，呼叫端應視為單純清單過濾，不觸發範圍搜尋。
 */
export function parseRangeQuery(raw: string): RangeQuery | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^\d+\.\d+\.\d+\.\d+$/.test(trimmed)) {
    const ipInt = ipToInt(trimmed);
    return ipInt === null ? { kind: 'invalid' } : { kind: 'ip', ipInt };
  }

  const cidrMatch = trimmed.match(/^([\d.]+)\/(\d{1,3})$/);
  if (cidrMatch) {
    const cidr = parseInt(cidrMatch[2], 10);
    const normalizedIp = normalizeIpOctets(cidrMatch[1]);
    const ipInt = normalizedIp ? ipToInt(normalizedIp) : null;
    if (normalizedIp === null || ipInt === null || isNaN(cidr) || cidr < 0 || cidr > 32) {
      return { kind: 'invalid' };
    }
    const sub = calculateSubnet(ipInt, normalizedIp, cidr);
    return { kind: 'cidr', networkInt: sub.networkInt, broadcastInt: sub.broadcastInt };
  }

  return null;
}

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

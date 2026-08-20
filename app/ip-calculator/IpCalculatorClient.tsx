'use client';

import { useState, useEffect, useCallback, useMemo, useId, useRef } from 'react';
import Link from 'next/link';
import ToolLayout from '../components/ToolLayout';
import FaqSection from '../components/FaqSection';
import styles from './ip-calculator.module.css';

interface SubnetResult {
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
    badgeClass: string;
  };
  binaryIp: string;
}

interface IpCalculatorClientProps {
  lang?: 'zh-TW' | 'en';
}

const TRANSLATIONS = {
  'zh-TW': {
    title: 'IP 子網段與可用 IP 計算器',
    subtitle: 'IPV4 & CIDR SUBNET CALCULATOR',
    description:
      '專業免費的線上 IP 子網段與可用 IP 計算器！支援 CIDR 標記與標準點分十進制切換，精確計算網路位址、廣播位址、子網遮罩、可用 IP 範圍與百萬級 TXT/CSV 導出。',
    paramsTitle: '輸入網段參數',
    modeCidr: 'CIDR 標記法',
    modeStd: '標準 IP + 遮罩',
    labelCidr: 'IP 位址 / CIDR 前綴 (例如: 192.168.1.50/24)',
    labelIp: 'IP 位址 (例如: 192.168.1.50)',
    labelMask: '子網遮罩 Subnet Mask',
    btnClear: '清空重填',
    btnExample: '載入範例 (/24)',
    summaryTitle: '計算摘要 Summary',
    networkAddr: '網路位址 (Network IP)',
    broadcastAddr: '廣播位址 (Broadcast IP)',
    subnetMaskLabel: '子網遮罩 (Subnet Mask)',
    wildcardMaskLabel: '通配符遮罩 (Wildcard Mask)',
    cidrNotation: 'CIDR 標記法',
    totalIpsLabel: 'IP 總數量 (Total IPs)',
    usableHostsLabel: '可用 IP 總數 (Usable Hosts)',
    classScopeLabel: 'IP 類別與屬性 (Class & Scope)',
    usableRangeLabel: '可用 IP 範圍 (Usable IP Range)',
    binaryLabel: 'IP 二進制 (Binary Representation)',
    usableListTitle: '可用 IP 位址列表',
    copyAllBtn: '複製全量',
    exportTxtBtn: '匯出 TXT',
    exportCsvBtn: '匯出 CSV',
    filterPlaceholder: '過濾 IP 位址 (例如 .100)...',
    largeNetNotice: '目前網段包含 {count} 個可用 IP。畫面上預設呈現前 1,000 筆分頁；完整數據可點擊右上角「匯出 TXT / CSV」極速線上下載。',
    colIndex: '編號 #',
    colIp: 'IP 位址',
    colAction: '操作',
    copyBtn: '複製',
    noMatchingIps: '查無符合關鍵字的可用 IP',
    paginationInfo: '顯示第 {start} - {end} 筆 / 共 {total} 筆',
    prevPage: '上一頁',
    nextPage: '下一頁',
    toastCleared: '已清空輸入項目',
    toastExampleLoaded: '已載入預設範例 /24',
    toastCopied: '已複製',
    toastExporting: '正在產生 {count} 筆可用 IP 匯出檔...',
    toastExportSuccess: '全量 {count} 筆 IP 已成功匯出 .{type} 檔案！',
    errCidrSlash: 'CIDR 格式錯誤，僅能包含一個斜線 (例如 192.168.1.1/24)',
    errCidrRange: 'CIDR 前綴長度必須在 0 到 32 之間的整數 (例如 /24)',
    errInvalidIp: '無效的 IP 位址，各 Octet 需為 0~255',
    errStdIp: '請輸入有效的 IPv4 位址 (例如 192.168.1.50)',
    hostsUnit: '個',
    faqTitle: '常問問題與專業指南 (FAQ)',
    faqSubtitle: '深入解析 IPv4 子網劃分、CIDR 原理、可用主機計算與網路架構實務',
    faqItems: [
      {
        q: '什麼是 CIDR 標記法？子網遮罩（Subnet Mask）是如何劃分網路的？',
        a: `CIDR（Classless Inter-Domain Routing，無類別域間路由）使用斜線加數字（例如 /24）來表示子網遮罩中連續「1」的二進制位元數。

子網遮罩的作用是將 32 位元的 IPv4 位址分割為兩部分：

① 網路識別碼 (Network ID)：由子網遮罩中為 1 的位元決定，用來識別設備所在的子網路。
② 主機識別碼 (Host ID)：由子網遮罩中為 0 的位元決定，用來分配給該子網路內的個別主機設備。

透過子網劃分，網管人員能有效節省 IPv4 位址空間、劃分廣播網域並強化網路安全。`,
      },
      {
        q: '如何計算網段中「可用主機 IP 數量」？為什麼需要減去 2？',
        a: `若 CIDR 前綴為 /n，則主機位元數為 (32 - n)，總 IP 數量為 2^(32 - n) 個。

在標準子網中，必須扣除 2 個保留位址：

① 網路位址 (Network Address)：主機位元全為 0 的位址（例如 192.168.1.0），代表該子網本身，用於路由表識別。
② 廣播位址 (Broadcast Address)：主機位元全為 1 的位址（例如 192.168.1.255），用於對該子網內所有主機發送廣播封包。

因此，實際可用主機數量公式為：2^(32 - n) - 2。例如 /24 網段總共有 256 個 IP，可用主機數為 254 個（192.168.1.1 ~ 192.168.1.254）。`,
      },
      {
        q: '什麼是私有 IP 位址（Private IP）與公有 IP（Public IP）？RFC 1918 規範了哪些範圍？',
        a: `公有 IP 位址可在全球網際網路中直接路由存取，由 IANA 與各區域網際網路註冊機構 (RIR) 統一指派；私有 IP 位址則僅限於內部區域網路 (LAN) 使用，無法直接在網際網路路由，需透過 NAT (網路位址轉譯) 共享公網連線。

根據 RFC 1918 規範，三大私有 IP 網段為：

① A 類私有網段：10.0.0.0/8 (10.0.0.0 ~ 10.255.255.255，共 16,777,216 個 IP)
② B 類私有網段：172.16.0.0/12 (172.16.0.0 ~ 172.31.255.255，共 1,048,576 個 IP)
③ C 類私有網段：192.168.0.0/16 (192.168.0.0 ~ 192.168.255.255，共 65,536 個 IP)

此外，127.0.0.0/8 為本機回傳 (Loopback)，169.254.0.0/16 為自動私人 IP 定址 (APIPA)。`,
      },
      {
        q: '什麼是 /31 與 /32 子網？它們在點對點連線或單主機中有何特殊用途？',
        a: `一般子網至少需要 /30（提供 4 個 IP，其中 2 個可用）來建立路由器間的點對點連線，但這會浪費 50% 的 IP。

① /31 子網 (RFC 3021)：
子網遮罩為 255.255.255.254，僅有 2 個 IP。RFC 3021 標準允許在點對點 (Point-to-Point) 路由連線中省略網路與廣播位址，讓這 2 個 IP 全數作為主機介面位址，節省珍貴的 IPv4 資源。

② /32 子網：
子網遮罩為 255.255.255.255，僅代表「單一主機 (Single Host)」。常用於路由器 Loopback 介面位址、防火牆單一來源/目的規則以及 VPN 客戶端固定路由指定。`,
      },
      {
        q: '通配符遮罩（Wildcard Mask / 反向遮罩）是什麼？與子網遮罩有何關係？',
        a: `通配符遮罩（Wildcard Mask，又稱 Inverse Mask）在網路設備（如 Cisco 路由器之 ACL 存取控制清單或 OSPF 協定設定）中被廣泛使用。

它的數值是將子網遮罩的二進制 0 與 1 完全反轉（反相），計算方式為「255.255.255.255 減去 子網遮罩」。

例如：
子網遮罩 255.255.255.0 (/24) 對應的通配符遮罩即為 0.0.0.255。
子網遮罩 255.255.240.0 (/20) 對應的通配符遮罩即為 0.0.15.255。

在 ACL 規則中，0 代表該位元必須完全精確比對，1 則代表該位元可為任意值（忽略比對）。`,
      },
      {
        q: 'IPv4 位址的「點分十進制」與「二進制」是如何相互對應轉換的？',
        a: `IPv4 位址由 32 個二進制位元（Bits）組成，被平均分割為 4 個 8 位元組（稱為 Octet，每個 Octet 為 1 Byte），彼此以點號「.」區隔。

每個 Octet 的 8 個位元權重由高至低分別為 128, 64, 32, 16, 8, 4, 2, 1，能表示 0 ~ 255 的十進制整數。

以 192.168.1.1 為例：
192 = 128 + 64 = 11000000
168 = 128 + 32 + 8 = 10101000
1 = 00000001
1 = 00000001
組合後即為完整的 32 位元二進制：11000000.10101000.00000001.00000001。`,
      },
      {
        q: '使用本計算器試算 IP 網段或匯出百萬級可用 IP 列表時安全嗎？瀏覽器會卡死嗎？',
        a: `本工具採用「100% 純前端本地運算 (Zero-Server Architecture)」：

① 隱私與安全性：您輸入的所有 IP 位址、內網架構與網段資訊均直接於瀏覽器本地記憶體運算，絕不傳輸至任何雲端伺服器或後端資料庫。

② 巨量數據非阻塞架構：當計算大型子網（如 /16 包含 65,534 個 IP）並點擊匯出 TXT 或 CSV 時，工具採用時間片分塊演算法 (Yielding Chunk Processing) 非阻塞處理，並於 CSV 檔首植入 UTF-8 BOM 確保 Microsoft Excel 開啟時零亂碼，流暢不卡死。`,
      },
    ],
  },
  en: {
    title: 'IPv4 Subnet & CIDR Calculator',
    subtitle: 'IPV4 & CIDR SUBNET CALCULATOR',
    description:
      'Free online IPv4 & CIDR subnet calculator! Calculate network address, broadcast address, subnet mask, wildcard mask, usable IP range, and export full IP lists to TXT or CSV.',
    paramsTitle: 'Subnet Input Parameters',
    modeCidr: 'CIDR Notation',
    modeStd: 'Standard IP + Mask',
    labelCidr: 'IP Address / CIDR Prefix (e.g., 192.168.1.50/24)',
    labelIp: 'IP Address (e.g., 192.168.1.50)',
    labelMask: 'Subnet Mask',
    btnClear: 'Clear Fields',
    btnExample: 'Load Example (/24)',
    summaryTitle: 'Calculation Summary',
    networkAddr: 'Network Address (IP)',
    broadcastAddr: 'Broadcast Address (IP)',
    subnetMaskLabel: 'Subnet Mask',
    wildcardMaskLabel: 'Wildcard Mask',
    cidrNotation: 'CIDR Notation',
    totalIpsLabel: 'Total IP Addresses',
    usableHostsLabel: 'Usable Hosts Count',
    classScopeLabel: 'IP Class & Scope',
    usableRangeLabel: 'Usable IP Range',
    binaryLabel: 'Binary Representation',
    usableListTitle: 'Usable IP Addresses List',
    copyAllBtn: 'Copy All',
    exportTxtBtn: 'Export TXT',
    exportCsvBtn: 'Export CSV',
    filterPlaceholder: 'Filter IP address (e.g. .100)...',
    largeNetNotice: 'This subnet contains {count} usable IPs. The list displays the first 1,000 items. Click "Export TXT / CSV" to download all IPs.',
    colIndex: 'Index #',
    colIp: 'IP Address',
    colAction: 'Action',
    copyBtn: 'Copy',
    noMatchingIps: 'No usable IP address matching filter',
    paginationInfo: 'Showing {start} - {end} of {total} entries',
    prevPage: 'Previous',
    nextPage: 'Next',
    toastCleared: 'Cleared input fields',
    toastExampleLoaded: 'Loaded default example /24',
    toastCopied: 'Copied',
    toastExporting: 'Generating export file for {count} IPs...',
    toastExportSuccess: 'Successfully exported {count} IPs to .{type} file!',
    errCidrSlash: 'Invalid CIDR format. Include exactly one slash (e.g. 192.168.1.1/24)',
    errCidrRange: 'CIDR prefix length must be an integer between 0 and 32',
    errInvalidIp: 'Invalid IP address. Each octet must be 0-255',
    errStdIp: 'Please enter a valid IPv4 address (e.g. 192.168.1.50)',
    hostsUnit: 'hosts',
    faqTitle: 'Frequently Asked Questions & Guide (FAQ)',
    faqSubtitle: 'Comprehensive guide to IPv4 subnetting, CIDR prefix, host capacity, and network design',
    faqItems: [
      {
        q: 'What is CIDR notation and how does a Subnet Mask divide a network?',
        a: `CIDR (Classless Inter-Domain Routing) uses a slash followed by a prefix number (e.g., /24) to denote the number of contiguous leading bits set to 1 in the subnet mask.

A subnet mask divides a 32-bit IPv4 address into two key portions:

1. Network ID: Determined by the binary 1s in the mask, identifying the logical network segment.
2. Host ID: Determined by the remaining binary 0s, identifying specific host devices within that subnet.

Subnetting allows network administrators to conserve IPv4 address space, minimize broadcast domains, and enhance network security.`,
      },
      {
        q: 'How is the usable host IP count calculated? Why subtract 2?',
        a: `For a prefix length /n, the number of host bits is (32 - n), yielding a total of 2^(32 - n) IP addresses.

In standard subnets, 2 addresses are reserved and cannot be assigned to hosts:

1. Network Address: All host bits set to 0 (e.g., 192.168.1.0), representing the subnet itself for routing tables.
2. Broadcast Address: All host bits set to 1 (e.g., 192.168.1.255), used to broadcast packets to all devices on the subnet.

Therefore, the usable host count formula is 2^(32 - n) - 2. For example, a /24 subnet has 256 total IPs and 254 usable host addresses (.1 to .254).`,
      },
      {
        q: 'What are Private and Public IP addresses? What ranges are defined by RFC 1918?',
        a: `Public IPs are globally routable across the internet and managed by IANA/RIRs. Private IPs are reserved exclusively for Local Area Networks (LANs) and cannot be routed over the public internet without Network Address Translation (NAT).

RFC 1918 defines three private IPv4 address blocks:

1. Class A: 10.0.0.0/8 (10.0.0.0 to 10.255.255.255, 16,777,216 IPs)
2. Class B: 172.16.0.0/12 (172.16.0.0 to 172.31.255.255, 1,048,576 IPs)
3. Class C: 192.168.0.0/16 (192.168.0.0 to 192.168.255.255, 65,536 IPs)

Other special ranges include 127.0.0.0/8 for Loopback and 169.254.0.0/16 for Link-Local (APIPA).`,
      },
      {
        q: 'What are /31 and /32 subnets, and how are they used in point-to-point links or single hosts?',
        a: `Standard point-to-point links traditionally used /30 (4 total IPs with 2 usable), wasting half the addresses.

1. /31 Subnet (RFC 3021):
Subnet mask 255.255.255.254 has only 2 IP addresses. RFC 3021 enables modern routers to utilize both addresses on point-to-point links without dedicated network and broadcast addresses, conserving IPv4 space.

2. /32 Subnet:
Subnet mask 255.255.255.255 represents a single specific host. Commonly used for router Loopback interfaces, specific firewall rules, and host routes in VPN configurations.`,
      },
      {
        q: 'What is a Wildcard Mask (Inverse Mask) and how is it related to a Subnet Mask?',
        a: `A Wildcard Mask (or Inverse Mask) is extensively used in networking equipment (such as Cisco ACLs and OSPF configurations) to specify IP ranges.

It is the bitwise inverse of a subnet mask, calculated by subtracting the subnet mask from 255.255.255.255.

For example:
Subnet mask 255.255.255.0 (/24) yields a wildcard mask of 0.0.0.255.
Subnet mask 255.255.240.0 (/20) yields a wildcard mask of 0.0.15.255.

In ACL rules, a binary 0 bit requires an exact match, while a binary 1 bit indicates a 'don't care' (wildcard) match.`,
      },
      {
        q: 'How are IPv4 dotted-decimal format and binary representations converted?',
        a: `An IPv4 address consists of 32 binary bits divided into 4 segments called octets (8 bits or 1 byte each), separated by dots.

The 8 bit weights in each octet are 128, 64, 32, 16, 8, 4, 2, 1, representing decimal values from 0 to 255.

For example, 192.168.1.1 translates to:
192 = 128 + 64 = 11000000
168 = 128 + 32 + 8 = 10101000
1 = 00000001
1 = 00000001
Resulting 32-bit binary: 11000000.10101000.00000001.00000001.`,
      },
      {
        q: 'Is it secure to calculate IP subnets here? Will the browser freeze when exporting large IP lists?',
        a: `This tool operates entirely on the client side (Zero-Server Architecture):

1. Privacy & Security: All IP addresses, network masks, and subnet topology stay 100% in your browser's local memory. No data is transmitted to external servers or logged in backend databases.

2. High-Performance Non-Blocking Export: When exporting large subnets (such as a /16 with 65,534 hosts) to TXT or CSV, the engine leverages asynchronous yielding chunks to maintain smooth UI responsiveness without freezing the main thread. Exported CSV files include UTF-8 BOM for full Microsoft Excel compatibility.`,
      },
    ],
  },
};

function ipToInt(ipStr: string): number | null {
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

function intToIp(intVal: number): string {
  return [
    (intVal >>> 24) & 255,
    (intVal >>> 16) & 255,
    (intVal >>> 8) & 255,
    intVal & 255,
  ].join('.');
}

function intToBinary(intVal: number): string {
  return [
    (intVal >>> 24) & 255,
    (intVal >>> 16) & 255,
    (intVal >>> 8) & 255,
    intVal & 255,
  ]
    .map((b) => b.toString(2).padStart(8, '0'))
    .join('.');
}

function cidrToMaskInt(cidr: number): number {
  if (cidr === 0) return 0;
  return (~0 << (32 - cidr)) >>> 0;
}

interface IpRangeRuleV4 {
  scope: string;
  baseInt: number;
  maskInt: number;
  badgeClass: string;
}

const RFC_RESERVED_RANGES_V4: IpRangeRuleV4[] = [
  // RFC 1918 - Private Networks
  { scope: 'Private', baseInt: ipToInt('10.0.0.0')!, maskInt: cidrToMaskInt(8), badgeClass: styles.badgePrivate },
  { scope: 'Private', baseInt: ipToInt('172.16.0.0')!, maskInt: cidrToMaskInt(12), badgeClass: styles.badgePrivate },
  { scope: 'Private', baseInt: ipToInt('192.168.0.0')!, maskInt: cidrToMaskInt(16), badgeClass: styles.badgePrivate },

  // RFC 1122 - Loopback
  { scope: 'Loopback', baseInt: ipToInt('127.0.0.0')!, maskInt: cidrToMaskInt(8), badgeClass: styles.badgeSpecial },

  // RFC 6598 - CGNAT (Shared Address Space)
  { scope: 'CGNAT', baseInt: ipToInt('100.64.0.0')!, maskInt: cidrToMaskInt(10), badgeClass: styles.badgeSpecial },

  // RFC 3927 - Link-Local / APIPA
  { scope: 'Link-Local', baseInt: ipToInt('169.254.0.0')!, maskInt: cidrToMaskInt(16), badgeClass: styles.badgeSpecial },

  // RFC 5771 / Class D & E Multicast & Experimental
  { scope: 'Reserved', baseInt: ipToInt('224.0.0.0')!, maskInt: cidrToMaskInt(4), badgeClass: styles.badgeSpecial },
];

function getIpScopeInfo(ipInt: number) {
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
    return { classStr: `${ipClass} Class`, scope: matchedRule.scope, badgeClass: matchedRule.badgeClass };
  }

  return { classStr: `${ipClass} Class`, scope: 'Public', badgeClass: styles.badgePublic };
}

/**
 * IPv6 屬性與 Scope 判斷 (RFC 4193 / RFC 4291 / RFC 6890)
 */
export function getIpv6ScopeInfo(ipv6Str: string) {
  const normalized = ipv6Str.trim().toLowerCase();
  if (normalized === '::1' || normalized === '0:0:0:0:0:0:0:1') {
    return { scope: 'Loopback', type: '::1/128' };
  }

  const firstBlockHex = normalized.split(':')[0] || '0';
  const firstVal = parseInt(firstBlockHex, 16);

  if (isNaN(firstVal)) return { scope: 'Invalid', type: 'Unknown' };

  // fc00::/7 -> Unique Local Address (私有 IPv6)
  if ((firstVal & 0xfe00) === 0xfc00) {
    return { scope: 'Private (ULA)', type: 'fc00::/7' };
  }
  // fe80::/10 -> Link-Local
  if ((firstVal & 0xffc0) === 0xfe80) {
    return { scope: 'Link-Local', type: 'fe80::/10' };
  }
  // ff00::/8 -> Multicast
  if ((firstVal & 0xff00) === 0xff00) {
    return { scope: 'Multicast', type: 'ff00::/8' };
  }
  // 2000::/3 -> Global Unicast (公網 IP)
  if ((firstVal & 0xe000) === 0x2000) {
    return { scope: 'Public', type: 'Global Unicast (2000::/3)' };
  }

  return { scope: 'Reserved', type: 'RFC Reserved' };
}

export default function IpCalculatorClient({ lang = 'zh-TW' }: IpCalculatorClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  const [mode, setMode] = useState<'cidr' | 'std'>('cidr');
  const [inputCidr, setInputCidr] = useState<string>('192.168.1.50/24');
  const [inputIp, setInputIp] = useState<string>('192.168.1.50');
  const [selectMask, setSelectMask] = useState<number>(24);
  const [errMessage, setErrMessage] = useState<string>('');

  const [calcResult, setCalcResult] = useState<SubnetResult | null>(null);

  const [filterKeyword, setFilterKeyword] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 100;

  const [toast, setToast] = useState<string>('');
  const isMountedRef = useRef<boolean>(false);

  const inputCidrId = useId();
  const inputIpId = useId();
  const selectMaskId = useId();
  const filterInputId = useId();

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f0ff');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 240, 255, 0.6)');
  }, []);

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  }, []);

  const calculateSubnet = useCallback((ipInt: number, rawIpStr: string, cidr: number): SubnetResult => {
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
  }, []);

  // URL 初始化讀取
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const cidrParam = params.get('cidr');
    const ipParam = params.get('ip');
    const maskParam = params.get('mask');

    if (cidrParam) {
      setMode('cidr');
      setInputCidr(cidrParam);
    } else if (ipParam) {
      setMode('std');
      setInputIp(ipParam);
      if (maskParam) {
        const m = parseInt(maskParam, 10);
        if (!isNaN(m) && m >= 0 && m <= 32) {
          setSelectMask(m);
        }
      }
    }
    isMountedRef.current = true;
  }, []);

  // 核心計算
  useEffect(() => {
    setErrMessage('');

    if (mode === 'cidr') {
      const val = inputCidr.trim();
      if (!val) {
        setCalcResult(null);
        return;
      }
      const parts = val.split('/');
      const rawIp = parts[0].trim();

      if (parts.length > 2) {
        setErrMessage(t.errCidrSlash);
        setCalcResult(null);
        return;
      }

      let cidr = 32;
      if (parts.length === 2) {
        const cStr = parts[1].trim();
        if (cStr === '') return;
        const c = parseInt(cStr, 10);
        if (isNaN(c) || c < 0 || c > 32 || cStr !== c.toString()) {
          setErrMessage(t.errCidrRange);
          setCalcResult(null);
          return;
        }
        cidr = c;
      }

      if (rawIp.endsWith('.')) return;
      const ipInt = ipToInt(rawIp);
      if (ipInt === null) {
        setErrMessage(`${t.errInvalidIp}: "${rawIp}"`);
        setCalcResult(null);
        return;
      }

      setCalcResult(calculateSubnet(ipInt, rawIp, cidr));
    } else {
      const rawIp = inputIp.trim();
      if (!rawIp) {
        setCalcResult(null);
        return;
      }
      if (rawIp.endsWith('.')) return;
      const ipInt = ipToInt(rawIp);
      if (ipInt === null) {
        setErrMessage(t.errStdIp);
        setCalcResult(null);
        return;
      }

      setCalcResult(calculateSubnet(ipInt, rawIp, selectMask));
    }

    setCurrentPage(1);
  }, [mode, inputCidr, inputIp, selectMask, calculateSubnet, t.errCidrSlash, t.errCidrRange, t.errInvalidIp, t.errStdIp]);

  // URL 正向同步 (replaceState)
  useEffect(() => {
    if (!isMountedRef.current || !calcResult) return;

    const handler = setTimeout(() => {
      const params = new URLSearchParams();
      if (mode === 'cidr') {
        params.set('cidr', `${calcResult.inputIp}/${calcResult.cidr}`);
      } else {
        params.set('ip', calcResult.inputIp);
        params.set('mask', calcResult.cidr.toString());
      }
      window.history.replaceState(null, '', '?' + params.toString());
    }, 300);

    return () => clearTimeout(handler);
  }, [calcResult, mode]);

  const filteredUsableIps = useMemo(() => {
    if (!calcResult) return [];

    const { firstUsableInt, usableCount } = calcResult;
    const kw = filterKeyword.trim().toLowerCase();
    const result: Array<{ index: number; ipStr: string }> = [];

    const limit = usableCount > 1000 && !kw ? 1000 : Math.min(usableCount, 100000);

    for (let i = 0; i < limit; i++) {
      const currentIpInt = firstUsableInt + i;
      const ipStr = intToIp(currentIpInt);

      if (!kw || ipStr.includes(kw)) {
        result.push({ index: i + 1, ipStr });
      }
    }

    return result;
  }, [calcResult, filterKeyword]);

  const handleClear = () => {
    setInputCidr('');
    setInputIp('');
    setFilterKeyword('');
    setErrMessage('');
    setCalcResult(null);
    showToast(t.toastCleared);
  };

  const loadExample = () => {
    setMode('cidr');
    setInputCidr('192.168.1.50/24');
    setFilterKeyword('');
    showToast(t.toastExampleLoaded);
  };

  const copyText = (txt: string) => {
    navigator.clipboard.writeText(txt).then(() => showToast(`${t.toastCopied}: ${txt}`));
  };

  const copyAllUsableIps = () => {
    if (!calcResult) return;
    if (calcResult.usableCount > 50000) {
      showToast(`網段 IP 數量較大 (${calcResult.usableCount.toLocaleString()} 筆)，請點擊「匯出 TXT/CSV」`);
      return;
    }

    const list: string[] = [];
    for (let i = 0; i < calcResult.usableCount; i++) {
      list.push(intToIp(calcResult.firstUsableInt + i));
    }
    copyText(list.join('\n'));
  };

  const exportFile = (type: 'txt' | 'csv') => {
    if (!calcResult) return;

    const { usableCount, firstUsableInt, inputIp: safeIp, cidr } = calcResult;
    showToast(t.toastExporting.replace('{count}', usableCount.toLocaleString()));

    const chunks: string[] = [];
    const chunkSize = 20000;
    if (type === 'csv') {
      chunks.push('\uFEFFIndex,IP Address\n');
    }

    let renderedCount = 0;

    const processChunk = () => {
      const end = Math.min(renderedCount + chunkSize, usableCount);
      const lines: string[] = [];

      for (let i = renderedCount; i < end; i++) {
        const ipStr = intToIp(firstUsableInt + i);
        if (type === 'csv') {
          lines.push(`${i + 1},${ipStr}`);
        } else {
          lines.push(ipStr);
        }
      }

      chunks.push(lines.join('\n') + '\n');
      renderedCount = end;

      if (renderedCount < usableCount) {
        setTimeout(processChunk, 0);
      } else {
        const mimeType = type === 'csv' ? 'text/csv;charset=utf-8;' : 'text/plain;charset=utf-8;';
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const safeFilename = safeIp.replace(/[^a-zA-Z0-9.]/g, '_');
        a.download = `ip_subnet_${safeFilename}_slash${cidr}.${type}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast(
          t.toastExportSuccess.replace('{count}', usableCount.toLocaleString()).replace('{type}', type)
        );
      }
    };

    setTimeout(processChunk, 10);
  };

  const totalItems = filteredUsableIps.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (validCurrentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalItems);
  const pageData = filteredUsableIps.slice(startIdx, endIdx);

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#00f0ff"
      accentGlow="rgba(0, 240, 255, 0.6)"
      extraHeaderControls={
        <Link
          href={lang === 'en' ? '/ip-calculator/' : '/ip-calculator/en/'}
          className="relative inline-flex items-center justify-center gap-1.5 h-[42px] px-3.5 text-xs font-semibold rounded-xl bg-white/[.06] border border-white/10 text-text-sub hover:text-text-main backdrop-blur-md transition-all duration-300 ease-out hover:scale-105 active:scale-95 hover:border-[var(--theme-color,#00f0ff)] hover:shadow-[0_0_12px_var(--theme-glow,rgba(0,240,255,0.4))] select-none"
        >
          <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 shrink-0">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
          <span>{lang === 'en' ? '繁體中文' : 'English'}</span>
        </Link>
      }
    >

      <div className="flex flex-col gap-8 text-left w-full px-4 max-sm:px-0">
        {/* 控制卡片：輸入網段參數 */}
        <div className={styles.cardPanel}>
          <div className="flex justify-between items-center flex-wrap gap-4 border-b border-border-glass pb-4">
            <h3 className="text-lg font-bold text-text-main flex items-center gap-2">
              <svg viewBox="0 0 24 24" className={`w-5 h-5 fill-current ${styles.accentText}`}>
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
              <span>{t.paramsTitle}</span>
            </h3>

            {/* 模式分頁 Tabs */}
            <div className="flex bg-select-bg p-1 rounded-xl border border-border-glass">
              <button
                type="button"
                onClick={() => setMode('cidr')}
                className={`px-4 py-1.5 text-sm rounded-lg cursor-pointer transition-all ${
                  mode === 'cidr' ? styles.toggleBtnActive : styles.toggleBtnInactive
                }`}
              >
                {t.modeCidr}
              </button>
              <button
                type="button"
                onClick={() => setMode('std')}
                className={`px-4 py-1.5 text-sm rounded-lg cursor-pointer transition-all ${
                  mode === 'std' ? styles.toggleBtnActive : styles.toggleBtnInactive
                }`}
              >
                {t.modeStd}
              </button>
            </div>
          </div>

          {/* CIDR 模式輸入 */}
          {mode === 'cidr' ? (
            <div className="flex flex-col gap-2">
              <label htmlFor={inputCidrId} className="text-sm font-medium text-text-sub">
                {t.labelCidr}
              </label>
              <div className={styles.inputWrapper}>
                <input
                  id={inputCidrId}
                  type="text"
                  value={inputCidr}
                  onChange={(e) => setInputCidr(e.target.value)}
                  placeholder="192.168.1.50/24"
                  spellCheck={false}
                  autoComplete="off"
                  className="w-full bg-transparent border-none outline-none text-text-main text-base font-mono font-medium placeholder-text-sub/50"
                />
              </div>
            </div>
          ) : (
            /* 標準模式輸入 */
            <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
              <div className="flex flex-col gap-2">
                <label htmlFor={inputIpId} className="text-sm font-medium text-text-sub">
                  {t.labelIp}
                </label>
                <div className={styles.inputWrapper}>
                  <input
                    id={inputIpId}
                    type="text"
                    value={inputIp}
                    onChange={(e) => setInputIp(e.target.value)}
                    placeholder="192.168.1.50"
                    spellCheck={false}
                    autoComplete="off"
                    className="w-full bg-transparent border-none outline-none text-text-main text-base font-mono font-medium placeholder-text-sub/50"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label htmlFor={selectMaskId} className="text-sm font-medium text-text-sub">
                  {t.labelMask}
                </label>
                <select
                  id={selectMaskId}
                  value={selectMask}
                  onChange={(e) => setSelectMask(parseInt(e.target.value, 10))}
                  className="w-full bg-select-bg text-text-main border border-border-glass rounded-xl px-4 py-3 outline-none focus:border-[#00f0ff]/40 text-sm font-mono font-medium cursor-pointer"
                >
                  {Array.from({ length: 33 }).map((_, idx) => {
                    const c = 32 - idx;
                    const maskInt = cidrToMaskInt(c);
                    const maskIp = intToIp(maskInt);
                    const total = Math.pow(2, 32 - c);
                    return (
                      <option key={c} value={c}>
                        /{c} ({maskIp}) — {total.toLocaleString()} IPs
                      </option>
                    );
                  })}
                </select>
              </div>
            </div>
          )}

          {/* 錯誤警告訊息 */}
          {errMessage && (
            <div className="text-red-500 dark:text-red-400 text-xs font-medium bg-red-500/10 border border-red-500/20 px-3.5 py-2 rounded-xl flex items-center gap-2">
              <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <span>{errMessage}</span>
            </div>
          )}

          {/* 按鈕組 */}
          <div className="flex gap-3 flex-wrap pt-2">
            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-text-main bg-select-bg border border-border-glass rounded-xl hover:text-text-main hover:border-slate-400 transition-all cursor-pointer"
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
              <span>{t.btnClear}</span>
            </button>
            <button
              type="button"
              onClick={loadExample}
              className={styles.exampleBtn}
            >
              <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
              </svg>
              <span>{t.btnExample}</span>
            </button>
          </div>
        </div>

        {/* 網段摘要結果 Summary Section */}
        {calcResult && (
          <div className={styles.cardPanel}>
            <h3 className={`text-sm uppercase tracking-[1px] font-semibold border-b border-border-glass pb-3 ${styles.accentText}`}>
              {t.summaryTitle} ({calcResult.inputIp}/{calcResult.cidr})
            </h3>

            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-sm:grid-cols-1 font-mono text-xs">
              <div className={styles.summaryBox}>
                <span className="text-sm font-semibold text-text-sub">{t.networkAddr}</span>
                <span className={`text-base font-bold ${styles.accentText}`}>{calcResult.networkAddress}</span>
              </div>

              <div className={styles.summaryBox}>
                <span className="text-sm font-semibold text-text-sub">{t.broadcastAddr}</span>
                <span className={`text-base font-bold ${styles.accentText}`}>{calcResult.broadcastAddress}</span>
              </div>

              <div className={styles.summaryBox}>
                <span className="text-sm font-semibold text-text-sub">{t.subnetMaskLabel}</span>
                <span className="text-base text-text-main font-bold">{calcResult.subnetMask}</span>
              </div>

              <div className={styles.summaryBox}>
                <span className="text-sm font-semibold text-text-sub">{t.wildcardMaskLabel}</span>
                <span className="text-base text-text-sub font-bold">{calcResult.wildcardMask}</span>
              </div>

              <div className={styles.summaryBox}>
                <span className="text-sm font-semibold text-text-sub">{t.cidrNotation}</span>
                <span className="text-base text-text-main font-bold">/{calcResult.cidr}</span>
              </div>

              <div className={styles.summaryBox}>
                <span className="text-sm font-semibold text-text-sub">{t.totalIpsLabel}</span>
                <span className="text-base text-text-main font-bold">{calcResult.totalIps.toLocaleString()}</span>
              </div>

              <div className={styles.summaryBox}>
                <span className="text-sm font-semibold text-text-sub">{t.usableHostsLabel}</span>
                <span className={`text-base font-bold ${styles.successText}`}>
                  {calcResult.usableCount.toLocaleString()} {t.hostsUnit}
                </span>
              </div>

              <div className={styles.summaryBox}>
                <span className="text-sm font-semibold text-text-sub">{t.classScopeLabel}</span>
                <div className="flex items-center gap-1 mt-1 text-sm font-bold text-text-main">
                  <span>{calcResult.scopeInfo.classStr}</span>
                  <span className={calcResult.scopeInfo.badgeClass}>{calcResult.scopeInfo.scope}</span>
                </div>
              </div>
            </div>

            {/* 可用 IP 範圍 */}
            <div className={`${styles.summaryBox} flex justify-between items-center flex-wrap gap-2 font-mono text-xs`}>
              <span className="text-sm font-semibold text-text-sub">{t.usableRangeLabel}</span>
              <span className="text-text-main font-bold text-sm">
                {calcResult.cidr === 32
                  ? `${calcResult.firstUsableStr} (Single Host)`
                  : `${calcResult.firstUsableStr} ~ ${calcResult.lastUsableStr}`}
              </span>
            </div>

            {/* 二進制表示 */}
            <div className={styles.summaryBox}>
              <span className="text-sm font-semibold text-text-sub">{t.binaryLabel}</span>
              <code className={styles.binaryCode}>{calcResult.binaryIp}</code>
            </div>
          </div>
        )}

        {/* 可用 IP 列表區段 */}
        {calcResult && (
          <div className={styles.cardPanel}>
            <div className="flex justify-between items-center flex-wrap gap-4">
              <h3 className="text-sm font-semibold text-text-main flex items-center gap-2">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-text-sub">
                  <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
                </svg>
                <span>{t.usableListTitle}</span>
              </h3>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={copyAllUsableIps}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-main bg-select-bg border border-border-glass rounded-xl hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                  </svg>
                  <span>{t.copyAllBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportFile('txt')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-main bg-select-bg border border-border-glass rounded-xl hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  <span>{t.exportTxtBtn}</span>
                </button>
                <button
                  type="button"
                  onClick={() => exportFile('csv')}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-text-main bg-select-bg border border-border-glass rounded-xl hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current">
                    <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
                  </svg>
                  <span>{t.exportCsvBtn}</span>
                </button>
              </div>
            </div>

            {/* 搜尋與過濾 */}
            <div className="w-full">
              <div className={styles.inputWrapper}>
                <label htmlFor={filterInputId}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-text-sub mr-2">
                    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
                  </svg>
                </label>
                <input
                  id={filterInputId}
                  type="text"
                  value={filterKeyword}
                  onChange={(e) => {
                    setFilterKeyword(e.target.value);
                    setCurrentPage(1);
                  }}
                  placeholder={t.filterPlaceholder}
                  className="w-full bg-transparent border-none outline-none text-text-main text-xs font-mono font-medium placeholder-text-sub/50"
                />
              </div>
            </div>

            {/* 大網段優化提示 */}
            {calcResult.usableCount > 1000 && (
              <div className="flex gap-2.5 bg-[#00f0ff]/5 border border-[#00f0ff]/20 rounded-xl p-3.5 text-xs text-[#00f0ff] dark:text-[#00f0ff] items-center">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0">
                  <path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                </svg>
                <span>{t.largeNetNotice.replace('{count}', calcResult.usableCount.toLocaleString())}</span>
              </div>
            )}

            {/* 表格容器 */}
            <div className={styles.tableContainer}>
              <table className={styles.ipTable}>
                <thead>
                  <tr>
                    <th className={styles.indexCol}>{t.colIndex}</th>
                    <th>{t.colIp}</th>
                    <th className={styles.actionCol}>{t.colAction}</th>
                  </tr>
                </thead>
                <tbody>
                  {pageData.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-8 text-text-sub text-sm">
                        {t.noMatchingIps}
                      </td>
                    </tr>
                  ) : (
                    pageData.map((item) => (
                      <tr key={item.index}>
                        <td className={styles.indexCol}>#{item.index.toLocaleString()}</td>
                        <td className="font-medium text-text-main">{item.ipStr}</td>
                        <td className={styles.actionCol}>
                          <button
                            type="button"
                            onClick={() => copyText(item.ipStr)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-text-main bg-select-bg border border-border-glass rounded-lg hover:border-[#00f0ff] hover:text-[#00f0ff] transition-all cursor-pointer"
                          >
                            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-current">
                              <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
                            </svg>
                            <span>{t.copyBtn}</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* 分頁控制條 */}
            <div className="flex justify-between items-center flex-wrap gap-4 text-sm text-text-sub border-t border-border-glass pt-3">
              <div>
                {t.paginationInfo
                  .replace('{start}', (startIdx + 1).toLocaleString())
                  .replace('{end}', endIdx.toLocaleString())
                  .replace('{total}', totalItems.toLocaleString())}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={validCurrentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  className="px-3 py-1.5 text-sm font-medium text-text-main bg-select-bg border border-border-glass rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:not-disabled:border-[#00f0ff] hover:not-disabled:text-[#00f0ff] transition-all cursor-pointer"
                >
                  {t.prevPage}
                </button>
                <span className="font-mono text-text-main">
                  {validCurrentPage} / {totalPages}
                </span>
                <button
                  type="button"
                  disabled={validCurrentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  className="px-3 py-1.5 text-sm font-medium text-text-main bg-select-bg border border-border-glass rounded-lg disabled:opacity-30 disabled:cursor-not-allowed hover:not-disabled:border-[#00f0ff] hover:not-disabled:text-[#00f0ff] transition-all cursor-pointer"
                >
                  {t.nextPage}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 通用 FAQ 常見問題區塊 */}
      <FaqSection
        items={t.faqItems}
        title={t.faqTitle}
        subtitle={t.faqSubtitle}
        accentColor="#00f0ff"
      />

      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm font-medium rounded-xl bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] backdrop-blur-md shadow-lg z-50">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

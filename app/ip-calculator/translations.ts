/**
 * IP 位址計算機頁面中英文案（從 IpCalculatorClient.tsx 抽離，避免單檔過長）。
 */
export const TRANSLATIONS = {
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
    rangeCheckInRange: '位於此網段範圍內',
    rangeCheckNotInRange: '不在此網段範圍內',
    rangeCheckErrInvalid: '請輸入有效的 IPv4 位址',
    usableListTitle: '可用 IP 位址列表、網段搜尋',
    copyAllBtn: '複製全量',
    exportTxtBtn: '匯出 TXT',
    exportCsvBtn: '匯出 CSV',
    filterPlaceholder: '過濾清單 (例如 .100)，或輸入完整 IP／子網 CIDR (例如 192.168.3.0/24) 檢查是否在範圍內...',
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
      {
        q: '如何快速確認某個 IP 位址是否落在指定的網段（CIDR Range）範圍內？',
        a: `在上方輸入欲檢查的網段（CIDR 標記法或 IP + 子網遮罩）算出網路位址與廣播位址後，於下方「可用 IP 位址列表、網段搜尋」欄位直接輸入完整的目標 IP。

工具會即時將該 IP 轉換為 32 位元整數，比對是否介於網路位址與廣播位址之間（含邊界），並直接顯示「位於此網段範圍內」或「不在此網段範圍內」的結果，不需手動換算二進位或位元運算即可判斷該 IP 是否屬於此子網。`,
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
    rangeCheckInRange: 'Inside this subnet range',
    rangeCheckNotInRange: 'Outside this subnet range',
    rangeCheckErrInvalid: 'Please enter a valid IPv4 address',
    usableListTitle: 'Usable IP List & Range Search',
    copyAllBtn: 'Copy All',
    exportTxtBtn: 'Export TXT',
    exportCsvBtn: 'Export CSV',
    filterPlaceholder: 'Filter the list (e.g. .100), or enter a full IP / CIDR range (e.g. 192.168.3.0/24) to check...',
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
      {
        q: 'How can I quickly check whether a specific IP address falls within a given CIDR range?',
        a: `Enter the subnet you want to check above (CIDR notation, or IP + subnet mask) to calculate its network and broadcast addresses, then enter a full target IP directly into the "Usable IP List & Range Search" field below.

The tool instantly converts that IP to a 32-bit integer and checks whether it falls between the network and broadcast addresses (inclusive), showing "Inside this subnet range" or "Outside this subnet range" — no manual binary conversion or bitwise math required.`,
      },
    ],
  },
};

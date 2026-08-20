import type { Metadata } from 'next';
import IpCalculatorClient from './IpCalculatorClient';
import { generateFaqSchema } from '@/app/utils/faqSchema';

export const metadata: Metadata = {
  title: 'IP 子網段與可用 IP 計算器 - 免費線上 IPv4 / CIDR 子網遮罩運算工具',
  description:
    '專業免費的線上 IP 子網段與可用 IP 計算器！支援 CIDR 標記與點分十進制切換，精確計算網路位址、廣播位址、子網遮罩、可用 IP 範圍與數量。',
  keywords: 'IP計算器,子網計算器,IP Subnet Calculator,CIDR計算,子網遮罩,網路位址,廣播位址,可用IP範圍,IPv4',
  alternates: {
    canonical: 'https://tools.cjkuo.net/ip-calculator/',
    languages: {
      'zh-TW': 'https://tools.cjkuo.net/ip-calculator/',
      en: 'https://tools.cjkuo.net/ip-calculator/en/',
      'x-default': 'https://tools.cjkuo.net/ip-calculator/en/',
    },
  },
  openGraph: {
    title: 'IP 子網段與可用 IP 計算器 - 免費線上 IPv4 / CIDR 計算工具',
    description: '毫秒級精確計算 IPv4 / CIDR 子網段、網路位址、廣播位址與可用 IP 列表。',
    url: 'https://tools.cjkuo.net/ip-calculator/',
    images: [{ url: '/support.svg' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'IP 子網段與可用 IP 計算器 - 免費線上 IPv4 / CIDR 計算工具',
    description: '毫秒級精確計算 IPv4 / CIDR 子網段、網路位址、廣播位址與可用 IP 列表。',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'IP 子網段與可用 IP 計算器',
  url: 'https://tools.cjkuo.net/ip-calculator/',
  description: '專業免費的線上 IP 子網段與可用 IP 計算器，支援 CIDR 標記法與標準 IP/Subnet Mask 計算。',
  applicationCategory: 'UtilitiesApplication',
  operatingSystem: 'All',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'TWD' },
};

const faqJsonLd = generateFaqSchema([
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
]);

export default function IpCalculatorPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify([jsonLd, faqJsonLd]) }} />
      <IpCalculatorClient lang="zh-TW" />
    </>
  );
}

export type ProxyType = 'DIRECT' | 'PROXY' | 'SOCKS' | 'SOCKS5' | 'HTTP' | 'HTTPS' | 'CHAIN';

export interface ProxyNode {
  id: string;
  name: string;
  type: ProxyType;
  host: string;
  port: number | '';
  customString?: string;
  chainHops?: string[]; // 備援鏈序列 (Proxy ID 或 raw 字串如 "DIRECT")
  isConcatFormat?: boolean; // 是否以 JavaScript 字串拼接 (+) 排版
}

export type ConditionType =
  | 'plainHost'     // isPlainHostName(host)
  | 'domainSuffix'   // dnsDomainIs(host, ".example.com")
  | 'domainExact'    // host === "example.com"
  | 'wildcardHost'   // shExpMatch(host, "*.example.com")
  | 'wildcardUrl'    // shExpMatch(url, "http://*")
  | 'ipv4Cidr'       // isInNet(host, "192.168.0.0", "255.255.0.0")
  | 'ipv6Cidr'       // isInNetEx(host, "2001:db8::/32")
  | 'clientIpv4'     // isInNet(myIpAddress(), "10.1.0.0", "255.255.0.0")
  | 'clientIpv6'     // isInNetEx(myIpAddressEx(), "2001:db8:1::/48")
  | 'protocol'       // url.startsWith("http:") / url.substring(...) (MDN)
  | 'port'           // 指定通訊埠 (如 80, 443, 8080)
  | 'weekday'        // weekdayRange("MON", "FRI") (MDN)
  | 'timeRange'      // timeRange(9, 18) (MDN)
  | 'regex';         // /pattern/.test(url)

export interface RuleCondition {
  conditionType: ConditionType;
  value: string;
}

export interface RoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  conditionType: ConditionType; // 主要條件（與 andConditions 為 AND 疊加關係）
  value: string;
  andConditions?: RuleCondition[]; // 額外的 AND 疊加條件（如「協定為 https」且「網域為 x」）
  targetProxy: string; // ID of proxy node or raw string e.g. "DIRECT" or node ID
  description?: string;
}

export interface PacGeneratorOptions {
  pacFileName: string;
  enableIpv6: boolean;
  resolveIpFirst: boolean;
  defaultAction: string; // Proxy ID or "DIRECT"
}

export interface PacPreset {
  id: string;
  nameZh: string;
  nameEn: string;
  descriptionZh: string;
  descriptionEn: string;
  proxies: ProxyNode[];
  rules: RoutingRule[];
  defaultAction: string;
  enableIpv6: boolean;
  resolveIpFirst: boolean;
}

export interface PacProjectConfig {
  version: number;
  proxies: ProxyNode[];
  rules: RoutingRule[];
  defaultAction: string;
  enableIpv6: boolean;
  resolveIpFirst: boolean;
}

export interface PacImportResult {
  success: boolean;
  proxies: ProxyNode[];
  rules: RoutingRule[];
  defaultAction: string;
  enableIpv6: boolean;
  resolveIpFirst: boolean;
  messageZh: string;
  messageEn: string;
  warnings?: string[];
}

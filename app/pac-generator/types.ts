export type ProxyType = 'DIRECT' | 'PROXY' | 'SOCKS' | 'SOCKS5' | 'HTTP' | 'HTTPS';

export interface ProxyNode {
  id: string;
  name: string;
  type: ProxyType;
  host: string;
  port: number | '';
  customString?: string;
}

export type ConditionType =
  | 'plainHost'     // isPlainHostName(host)
  | 'domainSuffix'   // dnsDomainIs(host, ".example.com")
  | 'domainExact'    // host === "example.com"
  | 'wildcardHost'   // shExpMatch(host, "*.example.com")
  | 'wildcardUrl'    // shExpMatch(url, "http://*")
  | 'ipv4Cidr'       // isInNet(host, "192.168.0.0", "255.255.0.0")
  | 'ipv6Cidr'       // isInNetEx(host, "2001:db8::/32")
  | 'regex';         // /pattern/.test(url)

export interface RoutingRule {
  id: string;
  name: string;
  enabled: boolean;
  conditionType: ConditionType;
  value: string;
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

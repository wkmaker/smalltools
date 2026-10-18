export interface HttpsDnsConfig {
  mode: 'service' | 'alias';
  host?: string;
  ttl?: number;
  priority?: number;
  target?: string;
  alpnH3?: boolean;
  alpnH2?: boolean;
  alpnH1?: boolean;
  noDefaultAlpn?: boolean;
  port?: string;
  ipv4hint?: string;
  ipv6hint?: string;
  ech?: string;
}

/**
 * 依據 RFC 9460 SVCB/HTTPS 規範產生 SvcParams 字串
 */
export function generateSvcParams(config: HttpsDnsConfig): string {
  if (config.mode === 'alias') return '';

  const params: string[] = [];
  const alpnList: string[] = [];

  if (config.alpnH3) alpnList.push('h3');
  if (config.alpnH2) alpnList.push('h2');
  if (config.alpnH1) alpnList.push('http/1.1');
  if (alpnList.length > 0) {
    params.push(`alpn="${alpnList.join(',')}"`);
  }

  if (config.noDefaultAlpn) {
    params.push('no-default-alpn');
  }

  if (config.port && !isNaN(parseInt(config.port, 10))) {
    params.push(`port=${config.port}`);
  }

  if (config.ipv4hint && config.ipv4hint.trim()) {
    params.push(`ipv4hint="${config.ipv4hint.trim()}"`);
  }

  if (config.ipv6hint && config.ipv6hint.trim()) {
    params.push(`ipv6hint="${config.ipv6hint.trim()}"`);
  }

  if (config.ech && config.ech.trim()) {
    params.push(`ech="${config.ech.trim()}"`);
  }

  return params.join(' ');
}

/**
 * 組合完整的 BIND 9 / RFC 9460 格式記錄字串
 */
export function generateFullBindRecord(config: HttpsDnsConfig): string {
  const host = config.host || '@';
  const ttl = config.ttl || 300;
  const prio = config.mode === 'alias' ? 0 : (config.priority ?? 1);
  const target = (config.target && config.target.trim()) || '.';
  const svcParams = generateSvcParams(config);

  return `${host}. ${ttl} IN HTTPS ${prio} ${target} ${svcParams}`.trim();
}

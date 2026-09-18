export interface MockContext {
  clientIpv4: string;
  clientIpv6: string;
  dnsMap: Record<string, string>; // hostname -> comma or space separated IPs
  simulatedDay?: string; // e.g. 'AUTO', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'
  simulatedHour?: number; // e.g. -1 (auto) or 0-23
}

export interface PacTestTraceStep {
  functionName: string;
  args: (string | number | boolean)[];
  result: string | number | boolean;
}

export interface PacSingleTestResult {
  url: string;
  host: string;
  protocol: string;
  port: string;
  resolvedIp: string;
  hostType: 'IPv4' | 'IPv6' | 'Domain';
  clientIp: string;
  returnString: string;
  status: 'DIRECT' | 'PROXY' | 'SOCKS' | 'HTTPS' | 'ERROR';
  executionTimeMs: number;
  traceSteps: PacTestTraceStep[];
  error?: string;
}

export interface PacBatchItemResult {
  id: string;
  url: string;
  host: string;
  returnString: string;
  status: 'DIRECT' | 'PROXY' | 'SOCKS' | 'HTTPS' | 'ERROR';
  executionTimeMs: number;
  error?: string;
}

export interface PacLintIssue {
  severity: 'error' | 'warning' | 'info';
  messageZh: string;
  messageEn: string;
  line?: number;
}

export interface SanitizeRules {
  authHeaders: boolean;
  cookies: boolean;
  queryParams: boolean;
  postData: boolean;
  creditCard: boolean;
  regexDeep: boolean;
  stripMedia: boolean;
  stripTrackers: boolean;
  customKeywords: string;
  redactionText: string;
}

export interface SanitizedStats {
  totalRequests: number;
  sanitizedRequests: number;
  redactedHeaders: number;
  redactedCookies: number;
  redactedQueryParams: number;
  redactedBodies: number;
  redactedRegexItems: number;
  redactedCustomKeywords: number;
  redactedCreditCards: number;
  strippedMediaItems: number;
  strippedTrackers: number;
  originalSizeBytes: number;
  cleanedSizeBytes: number;
}

export interface DetectedHeaderItem {
  name: string;
  normalizedName: string;
  scope: 'request' | 'response' | 'both';
  count: number;
  matchedRule: string;
  sampleValue: string;
}

export interface ParsedRedactionGroup {
  scope: string;
  scopeType: 'post_json' | 'response_json' | 'header' | 'cookie' | 'query' | 'media' | 'other';
  fieldPath: string;
  ruleCategory: string;
  action: string;
  hitCount: number;
  samplePath?: string;
}

export interface HarEntryAnalysis {
  original: any;
  cleaned: any;
  isSanitized: boolean;
  reasons: string[];
}

export interface SanitizationResult {
  cleanedHar: any;
  stats: SanitizedStats;
  entriesAnalysis: HarEntryAnalysis[];
  detectedHeaders: DetectedHeaderItem[];
}

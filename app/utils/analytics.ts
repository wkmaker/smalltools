const GA_MEASUREMENT_ID_PATTERN = /^G-[A-Z0-9]+$/i;

/**
 * 驗證是否為合法的 GA4 Measurement ID（例如 G-4WBEYWFEYD）。
 * 防止無效字串或非預期內容被插入初始化腳本。
 */
export function isValidGaMeasurementId(id: string | undefined | null): id is string {
  return typeof id === 'string' && GA_MEASUREMENT_ID_PATTERN.test(id.trim());
}

/**
 * 將任意網址脫敏為「origin + pathname」，徹底剝除 ?query 與 #hash。
 */
export function sanitizeAnalyticsUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  try {
    const parsed = new URL(rawUrl);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return '';
    return `${parsed.origin}${parsed.pathname || '/'}`;
  } catch {
    return '';
  }
}

/**
 * 脫敏 referrer：無論外部來源或同站導覽，皆移除 ?query 與 #hash。
 */
export function sanitizeAnalyticsReferrer(referrer: string): string | undefined {
  const cleaned = sanitizeAnalyticsUrl(referrer);
  return cleaned || undefined;
}

/**
 * 建構最小、脫敏的 GA4 初始化腳本（供 next/script afterInteractive 執行）。
 * - 先以 gtag('set', ...) 鎖定純路徑與靜態標題，再以 gtag('config', ...) 送出首頁 PV。
 * - 關閉 Google Signals 與廣告個人化訊號。
 */
export function buildGaInitScript(measurementId: string): string {
  if (!isValidGaMeasurementId(measurementId)) {
    throw new Error(`Invalid GA4 Measurement ID: ${measurementId}`);
  }
  const safeId = measurementId.trim();
  return [
    'window.dataLayer = window.dataLayer || [];',
    'function gtag(){window.dataLayer.push(arguments);}',
    'window.gtag = gtag;',
    '(function(){',
    "  var cleanPath = window.location.pathname || '/';",
    '  var cleanLocation = window.location.origin + cleanPath;',
    '  var cleanReferrer;',
    '  try {',
    '    if (document.referrer) {',
    '      var refUrl = new URL(document.referrer);',
    "      if (refUrl.protocol === 'http:' || refUrl.protocol === 'https:') {",
    "        cleanReferrer = refUrl.origin + (refUrl.pathname || '/');",
    '      }',
    '    }',
    '  } catch (e) {}',
    '  var baseParams = {',
    '    page_location: cleanLocation,',
    '    page_path: cleanPath,',
    '    page_title: cleanPath,',
    '    allow_google_signals: false,',
    '    allow_ad_personalization_signals: false',
    '  };',
    '  if (cleanReferrer) {',
    '    baseParams.page_referrer = cleanReferrer;',
    '  }',
    "  gtag('set', baseParams);",
    "  gtag('js', new Date());",
    `  gtag('config', ${JSON.stringify(safeId)}, baseParams);`,
    '})();',
  ].join('\n');
}

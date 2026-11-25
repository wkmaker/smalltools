/**
 * IP 檢測助手資料解析純函式引擎（Cloudflare Trace 與 GeoIP 正規化），可獨立單元測試。
 */

export interface CfTraceInfo {
  ip?: string;
  colo?: string;
  loc?: string;
  http?: string;
  uag?: string;
  latency?: number;
  error?: boolean;
}

export interface GeoInfo {
  org?: string;
  asn?: string;
  network?: string;
  location?: string;
  latlon?: string;
  timezone?: string;
  currency?: string;
  source?: string;
  error?: boolean;
}

export function parseCfTraceText(
  text: string,
  options: { latency?: number; unknownLabel?: string; fallbackUserAgent?: string } = {}
): CfTraceInfo {
  const { latency, unknownLabel = 'Unknown', fallbackUserAgent } = options;
  const map: Record<string, string> = {};
  text.split(/\r?\n/).forEach((line) => {
    const eqIdx = line.indexOf('=');
    if (eqIdx > 0) {
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim();
      if (key) map[key] = val;
    }
  });

  return {
    ip: map.ip || unknownLabel,
    colo: map.colo || unknownLabel,
    loc: map.loc || unknownLabel,
    http: map.http || unknownLabel,
    uag: map.uag || fallbackUserAgent || unknownLabel,
    latency,
  };
}

export function normalizeIpapiGeo(
  raw: Record<string, unknown>,
  unknownLabel = 'Unknown'
): GeoInfo {
  const locStr = [raw.city, raw.region, raw.country_name].filter(Boolean).join(', ') || unknownLabel;
  const latlonStr =
    raw.latitude != null && raw.longitude != null ? `${raw.longitude}, ${raw.latitude}` : unknownLabel;
  const tzStr = raw.timezone ? `${raw.timezone} (UTC${raw.utc_offset || ''})` : unknownLabel;
  const currStr = raw.currency ? `${raw.currency} (${raw.currency_name || ''})` : unknownLabel;

  return {
    org: (raw.org as string) || unknownLabel,
    asn: (raw.asn as string) || unknownLabel,
    network: (raw.network as string) || undefined,
    location: locStr,
    latlon: latlonStr,
    timezone: tzStr,
    currency: currStr,
    source: 'ipapi.co',
  };
}

export function normalizeIpwhoisGeo(
  raw: Record<string, unknown>,
  unknownLabel = 'Unknown'
): GeoInfo {
  const locStr = [raw.city, raw.region, raw.country].filter(Boolean).join(', ') || unknownLabel;
  const latlonStr =
    raw.latitude != null && raw.longitude != null ? `${raw.longitude}, ${raw.latitude}` : unknownLabel;
  const tzStr = raw.timezone ? `${raw.timezone} (UTC${raw.timezone_gmt || ''})` : unknownLabel;
  const currStr = raw.currency_code ? `${raw.currency_code} (${raw.currency || ''})` : unknownLabel;

  return {
    org: (raw.org as string) || (raw.isp as string) || unknownLabel,
    asn: (raw.asn as string) || unknownLabel,
    network: undefined,
    location: locStr,
    latlon: latlonStr,
    timezone: tzStr,
    currency: currStr,
    source: 'ipwhois.app',
  };
}

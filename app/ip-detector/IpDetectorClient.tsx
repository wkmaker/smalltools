'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import ToolLayout from '../components/ToolLayout';
import styles from './ip-detector.module.css';

interface CloudTarget {
  key: string;
  name: string;
  url: string;
  latency: number | null;
  status: 'loading' | 'connected' | 'failed';
}

interface CfTraceInfo {
  ip?: string;
  colo?: string;
  loc?: string;
  http?: string;
  uag?: string;
  latency?: number;
  error?: boolean;
}

interface GeoInfo {
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

const CLOUD_ENDPOINTS: Array<{ key: string; name: string; url: string }> = [
  { key: 'aws', name: 'Amazon AWS', url: 'https://checkip.amazonaws.com/' },
  { key: 'gcp', name: 'Google Cloud', url: 'https://clients3.google.com/generate_204' },
  { key: 'azure', name: 'Microsoft Azure', url: 'https://azure.microsoft.com/' },
  { key: 'aliyun', name: 'Alibaba Cloud', url: 'https://www.aliyun.com/' },
  { key: 'tencent', name: 'Tencent Cloud', url: 'https://www.tencentcloud.com/' },
  { key: 'apple', name: 'Apple Captive', url: 'https://captive.apple.com/hotspot-detect.html' },
  { key: 'fastly', name: 'Fastly CDN', url: 'https://www.fastly.com/' },
  { key: 'akamai', name: 'Akamai CDN', url: 'https://www.akamai.com/' },
  { key: 'line', name: 'LINE', url: 'https://line.me/' },
  { key: 'facebook', name: 'Meta / FB', url: 'https://www.facebook.com/' },
];

export default function IpDetectorClient() {
  // IPv4 / IPv6 雙棧狀態
  const [ipv4, setIpv4] = useState<string>('偵測中...');
  const [ipv4Status, setIpv4Status] = useState<'loading' | 'success' | 'unsupported'>('loading');

  const [ipv6, setIpv6] = useState<string>('偵測中...');
  const [ipv6Status, setIpv6Status] = useState<'loading' | 'success' | 'unsupported'>('loading');

  // Cloudflare Trace 診斷
  const [cfTrace, setCfTrace] = useState<CfTraceInfo | null>(null);
  const [cfLoading, setCfLoading] = useState<boolean>(true);

  // IP 地理位置與隱私診斷
  const [geoInfo, setGeoInfo] = useState<GeoInfo | null>(null);
  const [geoLoading, setGeoLoading] = useState<boolean>(true);

  // 公有雲與服務延遲測速
  const [cloudTargets, setCloudTargets] = useState<CloudTarget[]>(
    CLOUD_ENDPOINTS.map(ep => ({ ...ep, latency: null, status: 'loading' }))
  );

  // Toast 浮動提示
  const [toast, setToast] = useState<string>('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(''), 2500);
  }, []);

  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#00f0ff');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(0, 240, 255, 0.6)');
  }, []);

  // 1. 檢測 IPv4
  const detectIpv4 = useCallback(async () => {
    setIpv4('偵測中...');
    setIpv4Status('loading');
    try {
      const res = await fetch('https://api.ipify.org?format=json', {
        signal: AbortSignal.timeout(4000),
      });
      const data = await res.json();
      if (data && data.ip) {
        setIpv4(data.ip);
        setIpv4Status('success');
      } else {
        throw new Error('No IP');
      }
    } catch {
      setIpv4('不支援');
      setIpv4Status('unsupported');
    }
  }, []);

  // 2. 檢測 IPv6
  const detectIpv6 = useCallback(async () => {
    setIpv6('偵測中...');
    setIpv6Status('loading');
    try {
      const res = await fetch('https://api6.ipify.org?format=json', {
        signal: AbortSignal.timeout(4000),
      });
      const data = await res.json();
      if (data && data.ip) {
        setIpv6(data.ip);
        setIpv6Status('success');
      } else {
        throw new Error('No IP');
      }
    } catch {
      setIpv6('不支援');
      setIpv6Status('unsupported');
    }
  }, []);

  // 3. 檢測 Cloudflare Trace
  const detectCfTrace = useCallback(async () => {
    setCfLoading(true);
    const start = performance.now();
    try {
      const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
        signal: AbortSignal.timeout(4500),
      });
      const latency = Math.round(performance.now() - start);
      const text = await res.text();
      const lines = text.split('\n');
      const map: Record<string, string> = {};
      lines.forEach(line => {
        const parts = line.split('=');
        if (parts.length >= 2) {
          map[parts[0].trim()] = parts.slice(1).join('=').trim();
        }
      });

      setCfTrace({
        ip: map.ip || '未知',
        colo: map.colo || '未知',
        loc: map.loc || '未知',
        http: map.http || '未知',
        uag: map.uag || (typeof navigator !== 'undefined' ? navigator.userAgent : '未知'),
        latency,
      });
    } catch {
      setCfTrace({ error: true });
    } finally {
      setCfLoading(false);
    }
  }, []);

  // 4. 檢測 IP 地理位置資訊 (ipapi.co 主軌 + ipwhois.app 備用軌)
  const detectGeoLocation = useCallback(async () => {
    setGeoLoading(true);

    try {
      // 軌道 1：ipapi.co
      const res = await fetch('https://ipapi.co/json/', {
        signal: AbortSignal.timeout(4500),
      });
      const raw = await res.json();
      if (raw.error) throw new Error(raw.reason || 'Rate limit');

      const locStr = [raw.city, raw.region, raw.country_name].filter(Boolean).join(', ') || '未知';
      const latlonStr = raw.latitude != null && raw.longitude != null ? `${raw.longitude}, ${raw.latitude}` : '未知';
      const tzStr = raw.timezone ? `${raw.timezone} (UTC${raw.utc_offset || ''})` : '未知';
      const currStr = raw.currency ? `${raw.currency} (${raw.currency_name || ''})` : '未知';

      setGeoInfo({
        org: raw.org || '未知',
        asn: raw.asn || '未知',
        network: raw.network || undefined,
        location: locStr,
        latlon: latlonStr,
        timezone: tzStr,
        currency: currStr,
        source: 'ipapi.co',
      });
    } catch {
      // 軌道 2：fallback 至 ipwhois.app
      try {
        const resFallback = await fetch('https://ipwhois.app/json/', {
          signal: AbortSignal.timeout(4500),
        });
        const rawFallback = await resFallback.json();
        if (!rawFallback.success) throw new Error('ipwhois failed');

        const locStr = [rawFallback.city, rawFallback.region, rawFallback.country].filter(Boolean).join(', ') || '未知';
        const latlonStr =
          rawFallback.latitude != null && rawFallback.longitude != null
            ? `${rawFallback.longitude}, ${rawFallback.latitude}`
            : '未知';
        const tzStr = rawFallback.timezone ? `${rawFallback.timezone} (UTC${rawFallback.timezone_gmt || ''})` : '未知';
        const currStr = rawFallback.currency_code ? `${rawFallback.currency_code} (${rawFallback.currency || ''})` : '未知';

        setGeoInfo({
          org: rawFallback.org || rawFallback.isp || '未知',
          asn: rawFallback.asn || '未知',
          network: undefined,
          location: locStr,
          latlon: latlonStr,
          timezone: tzStr,
          currency: currStr,
          source: 'ipwhois.app',
        });
      } catch {
        setGeoInfo({ error: true });
      }
    } finally {
      setGeoLoading(false);
    }
  }, []);

  // 5. 檢測公有雲與 CDN 連線延遲
  const runCloudDiagnostics = useCallback(async () => {
    setCloudTargets(prev => prev.map(t => ({ ...t, latency: null, status: 'loading' })));

    const updated = await Promise.all(
      CLOUD_ENDPOINTS.map(async ep => {
        const start = performance.now();
        try {
          await fetch(ep.url, {
            mode: 'no-cors',
            cache: 'no-store',
            signal: AbortSignal.timeout(4500),
          });
          const latency = Math.round(performance.now() - start);
          return { ...ep, latency, status: 'connected' as const };
        } catch {
          return { ...ep, latency: null, status: 'failed' as const };
        }
      })
    );

    setCloudTargets(updated);
  }, []);

  // 一鍵執行所有連線診斷
  const runAllChecks = useCallback(() => {
    detectIpv4();
    detectIpv6();
    detectCfTrace();
    detectGeoLocation();
    runCloudDiagnostics();
  }, [detectIpv4, detectIpv6, detectCfTrace, detectGeoLocation, runCloudDiagnostics]);

  useEffect(() => {
    runAllChecks();
  }, [runAllChecks]);

  const copyText = (text: string, label: string) => {
    if (!text || text === '偵測中...' || text === '不支援') return;
    navigator.clipboard.writeText(text).then(() => showToast(`已複製 ${label}`));
  };

  return (
    <ToolLayout
      title="線上 IP 檢測助手"
      subtitle="MY IP ADDRESS & DIAGNOSTICS"
      description="專業免費的線上 IP 檢測與診斷工具！支援 IPv4/IPv6 雙棧即時查詢、Cloudflare Trace 機房節點解析、IP 地理位置與 10 大公有雲 (AWS, GCP, Azure) 連線延遲診斷。"
      accentColor="#00f0ff"
      accentGlow="rgba(0, 240, 255, 0.6)"
    >
      <div className="flex flex-col gap-8 text-left w-full">
        {/* 頂部：IPv4 & IPv6 雙棧卡片 */}
        <div className="grid grid-cols-2 gap-6 max-sm:grid-cols-1">
          {/* IPv4 卡片 */}
          <div
            className={`${styles.ipCard} ${
              ipv4Status === 'success' ? styles.ipCardSuccess : ipv4Status === 'unsupported' ? styles.ipCardUnsupported : ''
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-sub font-semibold uppercase tracking-[1px]">IPv4 地址</span>
              <button
                type="button"
                onClick={() => copyText(ipv4, 'IPv4 位址')}
                disabled={ipv4Status !== 'success'}
                className="text-sm font-medium text-[#00f0ff] hover:underline disabled:opacity-40 cursor-pointer"
              >
                複製
              </button>
            </div>
            <div className={styles.ipBadge}>{ipv4}</div>
          </div>

          {/* IPv6 卡片 */}
          <div
            className={`${styles.ipCard} ${
              ipv6Status === 'success' ? styles.ipCardSuccess : ipv6Status === 'unsupported' ? styles.ipCardUnsupported : ''
            }`}
          >
            <div className="flex justify-between items-center">
              <span className="text-sm text-text-sub font-semibold uppercase tracking-[1px]">IPv6 地址</span>
              <button
                type="button"
                onClick={() => copyText(ipv6, 'IPv6 位址')}
                disabled={ipv6Status !== 'success'}
                className="text-sm font-medium text-[#00f0ff] hover:underline disabled:opacity-40 cursor-pointer"
              >
                複製
              </button>
            </div>
            <div
              className={`${styles.ipBadge} ${
                ipv6Status === 'unsupported' ? 'text-amber-400 text-shadow-none text-xl' : ''
              }`}
            >
              {ipv6}
            </div>
          </div>
        </div>

        {/* 中部：雙欄連線與地理隱私資訊 */}
        <div className="grid grid-cols-2 gap-6 max-md:grid-cols-1">
          {/* 左欄：Cloudflare Trace 連線診斷 */}
          <div className="bg-black/20 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-4 shadow-lg">
            <h3 className="text-sm text-[#00f0ff] uppercase tracking-[1px] font-semibold border-b border-white/[.06] pb-3">
              Cloudflare Trace 連線診斷
            </h3>

            {cfLoading ? (
              <div className="py-8 text-center text-sm text-text-sub font-mono">
                <span className={`${styles.statusDot} ${styles.statusDotLoading} mr-2`} /> 讀取連線資訊中...
              </div>
            ) : cfTrace?.error ? (
              <div className="py-6 text-center text-sm text-red-400">⚠️ Cloudflare 診斷失敗 / 網路連線阻斷</div>
            ) : (
              <div className="flex flex-col gap-3 font-mono text-xs">
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[.04]">
                  <span className="text-sm font-semibold text-text-sub">連線 IP:</span>
                  <span className="text-sm text-white font-bold">{cfTrace?.ip || '未知'}</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[.04]">
                  <span className="text-sm font-semibold text-text-sub">機房節點 (colo):</span>
                  <span className="text-sm text-[#00f0ff] font-bold">{cfTrace?.colo || '未知'}</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[.04]">
                  <span className="text-sm font-semibold text-text-sub">地理位置 (loc):</span>
                  <span className="text-sm text-white font-bold">{cfTrace?.loc || '未知'}</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[.04]">
                  <span className="text-sm font-semibold text-text-sub">最高連線協定:</span>
                  <span className="text-sm text-white font-bold">{cfTrace?.http || '未知'}</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[.04]">
                  <span className="text-sm font-semibold text-text-sub">連線延遲 (Latency):</span>
                  <span className="text-sm text-emerald-400 font-bold">{cfTrace?.latency !== undefined ? `${cfTrace.latency} ms` : '-'}</span>
                </div>
                <div className="flex flex-col gap-1 bg-black/40 p-3 rounded-xl border border-white/[.04]">
                  <span className="text-sm font-semibold text-text-sub">瀏覽器 UA (User Agent):</span>
                  <span className="text-xs text-text-sub break-all leading-relaxed">{cfTrace?.uag || '未知'}</span>
                </div>
              </div>
            )}
          </div>

          {/* 右欄：IP 地理位置與 ISP 診斷 */}
          <div className="bg-black/20 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-4 shadow-lg">
            <h3 className="text-sm text-[#00f0ff] uppercase tracking-[1px] font-semibold border-b border-white/[.06] pb-3">
              IP 地理位置與網路診斷
            </h3>

            {geoLoading ? (
              <div className="py-8 text-center text-sm text-text-sub font-mono">
                <span className={`${styles.statusDot} ${styles.statusDotLoading} mr-2`} /> 查詢地理位置資訊中...
              </div>
            ) : geoInfo?.error ? (
              <div className="py-6 text-center text-sm text-red-400">⚠️ 地理位置查詢失敗，主備來源皆無回應</div>
            ) : (
              <div className="flex flex-col gap-3 font-mono text-xs">
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[.04]">
                  <span className="text-sm font-semibold text-text-sub">所屬機構 (ISP):</span>
                  <span className="text-sm text-white font-bold truncate max-w-[60%]">{geoInfo?.org || '未知'}</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[.04]">
                  <span className="text-sm font-semibold text-text-sub">ASN:</span>
                  <span className="text-sm text-white font-bold">{geoInfo?.asn || '未知'}</span>
                </div>
                {geoInfo?.network && (
                  <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[.04]">
                    <span className="text-sm font-semibold text-text-sub">網段 (CIDR):</span>
                    <span className="text-sm text-white font-bold">{geoInfo.network}</span>
                  </div>
                )}
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[.04]">
                  <span className="text-sm font-semibold text-text-sub">地理位置:</span>
                  <span className="text-sm text-white font-bold truncate max-w-[60%]">{geoInfo?.location || '未知'}</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[.04]">
                  <span className="text-sm font-semibold text-text-sub">地理經緯度:</span>
                  <span className="text-sm text-white font-bold">{geoInfo?.latlon || '未知'}</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[.04]">
                  <span className="text-sm font-semibold text-text-sub">時區:</span>
                  <span className="text-sm text-white font-bold truncate max-w-[60%]">{geoInfo?.timezone || '未知'}</span>
                </div>
                <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/[.04]">
                  <span className="text-sm font-semibold text-text-sub">貨幣:</span>
                  <span className="text-sm text-white font-bold">{geoInfo?.currency || '未知'}</span>
                </div>
                <div className="flex justify-between items-center text-xs text-text-sub pt-1">
                  <span>資料來源:</span>
                  <span>{geoInfo?.source}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部：公有雲與 CDN 連線延遲測速 */}
        <div className="bg-black/30 border border-white/[.08] rounded-2xl p-6 flex flex-col gap-6 shadow-lg">
          <div className="flex justify-between items-center border-b border-white/[.06] pb-3">
            <h3 className="text-sm text-[#00f0ff] uppercase tracking-[1px] font-semibold">
              公有雲及重要服務連線延遲診斷 (Latency)
            </h3>
            <button
              type="button"
              onClick={runCloudDiagnostics}
              className="px-3.5 py-1.5 text-sm bg-[#00f0ff]/15 border border-[#00f0ff]/30 text-[#00f0ff] rounded-xl hover:bg-[#00f0ff] hover:text-[#030305] transition-all cursor-pointer font-medium"
            >
              重新測速
            </button>
          </div>

          <div className="grid grid-cols-5 gap-4 max-lg:grid-cols-3 max-sm:grid-cols-2">
            {cloudTargets.map(t => (
              <div
                key={t.key}
                className="bg-black/40 border border-white/[.05] rounded-xl p-4 flex flex-col items-center gap-2 text-center hover:border-[#00f0ff]/30 transition-all"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`${styles.statusDot} ${
                      t.status === 'loading'
                        ? styles.statusDotLoading
                        : t.status === 'connected'
                        ? styles.statusDotConnected
                        : styles.statusDotFailed
                    }`}
                  />
                </div>
                <span className="text-sm font-bold text-white">{t.name}</span>
                <span
                  className={`text-sm font-mono font-bold ${
                    t.status === 'connected'
                      ? 'text-emerald-400'
                      : t.status === 'failed'
                      ? 'text-red-400'
                      : 'text-text-sub'
                  }`}
                >
                  {t.status === 'loading'
                    ? '測速中...'
                    : t.status === 'connected' && t.latency !== null
                    ? `${t.latency} ms`
                    : '連線失敗'}
                </span>
              </div>
            ))}
          </div>

          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={runAllChecks}
              className="py-3.5 px-10 bg-[#00f0ff]/15 border border-[#00f0ff]/40 text-[#00f0ff] font-semibold text-sm rounded-full hover:bg-[#00f0ff] hover:text-[#030305] transition-all cursor-pointer shadow-[0_0_20px_rgba(0,240,255,0.2)]"
            >
              一鍵重新檢測全站網路連線
            </button>
          </div>
        </div>
      </div>

      {/* Toast 提示條 */}
      {toast && (
        <div className="fixed bottom-8 right-8 px-6 py-3 text-sm rounded-lg bg-[#00f0ff]/20 border border-[#00f0ff]/40 text-[#00f0ff] backdrop-blur-md shadow-lg z-[100]">
          {toast}
        </div>
      )}
    </ToolLayout>
  );
}

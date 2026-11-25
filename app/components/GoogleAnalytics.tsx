'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Script from 'next/script';
import { buildGaInitScript, isValidGaMeasurementId } from '@/app/utils/analytics';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID?.trim();
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

/**
 * 模組層記錄上次已追蹤的純路徑（pathname）：
 * 1. 首次掛載僅記錄路徑，不重複送出（首頁 PV 由 init script 送出，避免重複計數與 StrictMode 重跑）。
 * 2. 同路徑略過（避免計算機即時改寫 ?query 時觸發多餘事件）。
 */
let lastTrackedPath: string | null = null;

export default function GoogleAnalytics() {
  const pathname = usePathname();
  const isEnabled = IS_PRODUCTION && isValidGaMeasurementId(GA_MEASUREMENT_ID);

  useEffect(() => {
    if (!isEnabled || !pathname) return;

    if (lastTrackedPath === null) {
      lastTrackedPath = pathname;
      return;
    }

    if (pathname === lastTrackedPath) return;

    const prevPath = lastTrackedPath;
    lastTrackedPath = pathname;

    if (typeof window === 'undefined' || typeof window.gtag !== 'function') return;

    const cleanLocation = `${window.location.origin}${pathname}`;
    const cleanReferrer = `${window.location.origin}${prevPath}`;

    window.gtag('set', {
      page_location: cleanLocation,
      page_path: pathname,
      page_title: pathname,
    });

    window.gtag('event', 'page_view', {
      page_location: cleanLocation,
      page_path: pathname,
      page_title: pathname,
      page_referrer: cleanReferrer,
    });
  }, [isEnabled, pathname]);

  if (!isEnabled || !GA_MEASUREMENT_ID) {
    return null;
  }

  return (
    <>
      <Script id="ga4-init" strategy="afterInteractive">
        {buildGaInitScript(GA_MEASUREMENT_ID)}
      </Script>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
        strategy="afterInteractive"
      />
    </>
  );
}

import type { ReactNode } from 'react';
import type { Category } from './tools-meta';

export const CATEGORY_ICONS: Record<Category, ReactNode> = {
  finance: (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ffb800] shrink-0" aria-hidden="true">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  workplace: (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00f5a0] shrink-0" aria-hidden="true">
      <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  developer: (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00f0ff] shrink-0" aria-hidden="true">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  network: (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#38bdf8] shrink-0" aria-hidden="true">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  media: (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#d946ef] shrink-0" aria-hidden="true">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  utility: (
    <svg viewBox="0 0 24 24" width={20} height={20} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#8b5cf6] shrink-0" aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 8h.01" />
      <path d="M8 8h.01" />
      <path d="M8 16h.01" />
      <path d="M16 16h.01" />
      <path d="M12 12h.01" />
    </svg>
  ),
};

export const TOOL_ICONS: Record<string, ReactNode> = {
  "/compound-interest/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ffb800]">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" />
              </svg>
  ),
  "/personal-loan/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f5a0]">
                <path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.1-.9-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
              </svg>
  ),
  "/car-loan/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff3b30]">
                <path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.85 7h10.29l1.04 3H5.81l1.04-3zM19 17H5v-4h14v4z" />
                <circle cx="7.5" cy="14.5" r="1.5" />
                <circle cx="16.5" cy="14.5" r="1.5" />
              </svg>
  ),
  "/mortgage-loan/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ffaa]">
                <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
              </svg>
  ),
  "/pledge-calculator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#eab308]">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
  ),
  "/futures-calculator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff5252]">
                <path d="M3.5 18.49l6-6.01 4 4L22 6.92l-1.41-1.41-7.09 7.97-4-4L2 15.66z" />
              </svg>
  ),
  "/my-salary-calculator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff7300]">
                <path d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
              </svg>
  ),
  "/hourly-rate-calculator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f0ff]">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zm4.24 16L12 15.45 7.77 18l1.12-4.81-3.73-3.23 4.92-.42L12 5l1.92 4.53 4.92.42-3.73 3.23L16.23 18z" />
              </svg>
  ),
  "/resignation-calculator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ff66]">
                <path d="M17 7l-1.41 1.41L18.17 11H8v2h10.17l-2.58 2.58L17 17l5-5zM4 5h8V3H4c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h8v-2H4V5z" />
              </svg>
  ),
  "/pregnancy-calculator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff4081]">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
  ),
  "/contraction-timer/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#8b5cf6]">
                <path d="M15 1H9v2h6V1zm-4 13h2V8h-2v6zm8.03-6.61l1.42-1.42c-.43-.51-.9-.99-1.41-1.41l-1.42 1.42C16.07 4.74 14.12 4 12 4c-4.97 0-9 4.03-9 9s4.02 9 9 9 9-4.03 9-9c0-2.12-.74-4.07-1.97-5.61zM12 20c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
              </svg>
  ),
  "/kick-counter/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#fb7185]">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
  ),
  "/base64/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff7300]">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z" />
              </svg>
  ),
  "/url/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#6366f1]">
                <path d="M3.9 12c0-1.71 1.39-3.1 3.1-3.1h4V7H7c-2.76 0-5 2.24-5 5s2.24 5 5 5h4v-1.9H7c-1.71 0-3.1-1.39-3.1-3.1zM8 13h8v-2H8v2zm9-6h-4v1.9h4c1.71 0 3.1 1.39 3.1 3.1s-1.39 3.1-3.1 3.1h-4V17h4c2.76 0 5-2.24 5-5s-2.24-5-5-5z" />
              </svg>
  ),
  "/password/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ff66]">
                <path d="M12.65 10C11.83 7.67 9.61 6 7 6c-3.31 0-6 2.69-6 6s2.69 6 6 6c2.61 0 4.83-1.67 5.65-4H17v2h2v-2h2v-2h-8.35zM7 14c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
              </svg>
  ),
  "/json/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff00aa]">
                <path d="M7 2v11h3v9l7-12h-4l4-8z" />
              </svg>
  ),
  "/ssl-converter/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ffaa]">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-1 6h2v2h-2V7zm0 4h2v6h-2v-6z" />
              </svg>
  ),
  "/cert-generator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#38bdf8]">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm3 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z" />
              </svg>
  ),
  "/har-cleaner/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#06b6d4]">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z" />
              </svg>
  ),
  "/checksum-verifier/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#10b981]">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z" />
              </svg>
  ),
  "/epoch/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f5a0]">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zm0-12H5V6h14v2z" />
              </svg>
  ),
  "/taiwan-id-generator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#00ffaa]">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <circle cx="8" cy="11" r="2" />
      <path d="M5.5 16c.6-1.4 1.5-2 2.5-2s1.9.6 2.5 2" />
      <line x1="13" y1="10" x2="19" y2="10" />
      <line x1="13" y1="14" x2="17" y2="14" />
    </svg>
  ),
  "/credit-card-generator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#ffb800]">
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <line x1="2" y1="10" x2="22" y2="10" />
      <line x1="6" y1="15" x2="10" y2="15" />
    </svg>
  ),
  "/dns-dig/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#8b5cf6]">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-5 14H4v-2h6v2h-6zm-10-7l3.5-3.5L7 10l-2.5 2.5L2 10l2.5-2.5L3 6l-3.5 3.5L3 13z" />
              </svg>
  ),
  "/ip-detector/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f0ff]">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
              </svg>
  ),
  "/https-dns-generator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#6366f1]">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm1 14h-2v-2h2v2zm0-4h-2V7h2v4z" />
              </svg>
  ),
  "/ip-calculator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#a3e635]">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14h-4v-2h4v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
              </svg>
  ),
  "/pac-generator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f5a0]">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14h2v2h-2v-2zm0-10h2v8h-2V6zm8.9 6c0 1.12-.22 2.19-.62 3.17l-1.57-.91c.24-.71.39-1.47.39-2.26 0-3.87-3.13-7-7-7-1.07 0-2.07.25-2.98.67L7.23 3.73C8.65 3.26 10.27 3 12 3c4.97 0 9 4.03 9 9z" />
              </svg>
  ),
  "/pac-tester/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f0ff]">
                <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
              </svg>
  ),
  "/og-generator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#6366f1]">
                <path d="M21 3H3C2 3 1 4 1 5v14c0 1.1.9 2 2 2h18c1 0 2-.9 2-2V5c0-1-1-2-2-2zm0 15.92c-.02.03-.06.06-.08.08H3.08L3 18.92V5.08L3.08 5h17.84l.08.08v13.84zM11 15.51l-2.5-3.01L5 17h14l-4.5-6-3.5 4.51z" />
              </svg>
  ),
  "/image-processor/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#d946ef]">
                <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" />
              </svg>
  ),
  "/pdf-processor/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff3b30]">
                <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
              </svg>
  ),
  "/pdf-compressor/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#eab308]">
                <path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z" />
              </svg>
  ),
  "/diff-checker/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#8b5cf6]">
                <path d="M10 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h5v-2H5V5h5V3zm9 0h-5v2h5v14h-5v2h5c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
              </svg>
  ),
  "/text-utility/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff007f]">
                <path d="M5 4v3h5v12h3V7h5V4H5zm11 7H9v2h7v-2z" />
              </svg>
  ),
  "/qr-generator/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00ff66]">
                <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zm8-2v8h8V3h-8zm6 6h-4V5h4v4zM3 21h8v-8H3v8zm2-6h4v4H5v-4zm13-2h-2v2h2v-2zm1 2h2v2h-2v-2zm-3 2h2v2h-2v-2zm3 2h2v2h-2v-2z" />
              </svg>
  ),
  "/time/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#00f0ff]">
                <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67z" />
              </svg>
  ),
  "/lucky-wheel/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ffb800]">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm0-15.86v2.06c-1.1 0-2 .9-2 2v1H9v-3c0-.55-.45-1-1-1H7.1c.91-1.31 2.36-2.28 4.05-2.62z" />
              </svg>
  ),
  "/liars-dice/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff5252]">
                <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7.5 18c-.83 0-1.5-.67-1.5-1.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm0-9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm0-9c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6s1.5.67 1.5 1.5S17.33 9 16.5 9z" />
              </svg>
  ),
  "/calendar-split/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#06b6d4]">
                <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
              </svg>
  ),
  "/screen-capture/": (
    <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff3b30]">
                <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
              </svg>
  ),
};

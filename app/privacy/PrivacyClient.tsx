'use client';

import ToolLayout from '@/app/components/ToolLayout';

interface PrivacyClientProps {
  lang?: 'zh-TW' | 'en';
}

const CONTENT = {
  'zh-TW': {
    title: '隱私權說明',
    subtitle: '純前端本機運算承諾、極簡脫敏流量統計與開源透明說明',
    updatedLabel: '最後更新：2026-11-25',
    sections: [
      {
        heading: '1. 100% 純前端本機運算',
        items: [
          '本站所有工具（包含密碼生成器、SSL 憑證轉換、HAR 清理、PDF / 圖片處理、各式財務與生活計算機）均在您的瀏覽器本機端執行。',
          '您在工具中輸入的數值、文字、檔案、憑證或試算結果不會上傳至本站伺服器。',
          '部分網路診斷工具（如 DNS 查詢、IP 偵測）依功能需求會直接由瀏覽器向公開 DoH / 端點發起連線，僅用於顯示查詢結果。',
        ],
      },
      {
        heading: '2. 極簡脫敏版流量分析（Google Analytics 4）',
        items: [
          '為了解各工具實際使用熱度以排定維護與優化優先順序，正式站使用極簡設定的 Google Analytics 4（GA4）僅收集「不含參數的純頁面路徑（例如 /personal-loan/）」與基本停留時間。',
          '前端於初始化與站內換頁時均強制剝除所有網址查詢參數（?query）、錨點（#hash）、動態標題與同站來源參數，避免試算分享連結或自訂文字外洩。',
          'GA4 後台已全面關閉 Google Signals、廣告個人化、使用者提供資料自動偵測與所有自動事件偵測（不追蹤站內搜尋詞、表單輸入、按鈕點擊或下載檔名）。',
          'GA4 會使用匿名第一方 Cookie（如 _ga）區分工作階段與統計停留時間；您可隨時透過瀏覽器設定封鎖 Cookie，或安裝 Google 官方停用瀏覽器外掛程式（Google Analytics Opt-out）停用統計。',
        ],
      },
      {
        heading: '3. 本機儲存（localStorage / IndexedDB）',
        items: [
          '本站僅使用瀏覽器本機儲存空間保存您的亮暗主題偏好、首頁常用工具釘選、最近使用清單與部分工具草稿，資料完全留在您的裝置中。',
          '您可隨時透過瀏覽器的「清除網站資料」功能將這些本機紀錄完全刪除。',
        ],
      },
      {
        heading: '4. 開源透明與聯絡方式',
        items: [
          '本站為無廣告開源專案，完整原始碼與 GA4 脫敏實作皆公開於 GitHub，歡迎隨時檢視與監督。',
          '若對隱私權或資料處理方式有任何疑問或建議，請透過 GitHub Issues 與作者聯繫。',
        ],
      },
    ],
    optOutLinkText: 'Google Analytics 不透露資訊瀏覽器外掛程式',
    githubLinkText: '檢視 GitHub 原始碼 (wkmaker/smalltools)',
  },
  en: {
    title: 'Privacy Policy',
    subtitle: 'Local-first client-side processing, minimal anonymized analytics, and open-source transparency',
    updatedLabel: 'Last updated: 2026-11-25',
    sections: [
      {
        heading: '1. 100% Client-Side Local Processing',
        items: [
          'All tools on this site—including Password Generator, SSL Converter, HAR Cleaner, PDF/Image processors, and financial or daily calculators—run locally inside your browser.',
          'Values, text, files, certificates, and calculation results you enter are never uploaded to our servers.',
          'Network diagnostic tools (such as DNS Dig and IP Detector) connect directly from your browser to public DoH or connectivity endpoints solely to display lookup results.',
        ],
      },
      {
        heading: '2. Minimal Anonymized Analytics (Google Analytics 4)',
        items: [
          'To understand which tools are actively used and prioritize maintenance, the production site uses a minimal Google Analytics 4 (GA4) setup that collects only sanitized page paths (for example, /personal-loan/) and basic engagement duration.',
          'On both initial load and in-app navigation, our frontend strictly strips all URL query strings (?query), hashes (#hash), dynamic page titles, and internal referrer parameters so calculator inputs or custom labels are never transmitted.',
          'Google Signals, ad personalization, user-provided data auto-detection, and all automatic event detection (including site search, form interactions, and file downloads) are disabled.',
          'GA4 uses anonymous first-party cookies (such as _ga) to measure sessions and engagement time. You may block cookies in your browser settings or opt out using the official Google Analytics Opt-out Browser Add-on.',
        ],
      },
      {
        heading: '3. Local Storage (localStorage / IndexedDB)',
        items: [
          'Browser storage is used exclusively to save your light/dark theme preference, pinned or recent tools, and optional local drafts directly on your device.',
          'You can clear all locally stored data at any time through your browser site data settings.',
        ],
      },
      {
        heading: '4. Open-Source Transparency & Contact',
        items: [
          'This site is an ad-free, open-source project. The complete source code—including the GA4 sanitization logic—is publicly auditable on GitHub.',
          'If you have any privacy questions or suggestions, please reach out via GitHub Issues.',
        ],
      },
    ],
    optOutLinkText: 'Google Analytics Opt-out Browser Add-on',
    githubLinkText: 'Inspect source code on GitHub (wkmaker/smalltools)',
  },
} as const;

export default function PrivacyClient({ lang = 'zh-TW' }: PrivacyClientProps) {
  const t = CONTENT[lang];

  return (
    <ToolLayout
      title={t.title}
      subtitle={lang === 'en' ? 'PRIVACY & DATA TRANSPARENCY' : '隱私權與資料透明承諾'}
      description={t.subtitle}
      accentColor="#0ea5e9"
      accentGlow="rgba(14, 165, 233, 0.35)"
    >
      <article className="w-full space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-surface-glass border border-border-glass backdrop-blur-md text-xs text-text-sub">
          <span className="inline-flex items-center gap-2 font-medium text-text-main">
            <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            tools.cjkuo.net
          </span>
          <span className="font-mono">{t.updatedLabel}</span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {t.sections.map((section) => (
            <section
              key={section.heading}
              className="p-6 rounded-2xl bg-surface-glass border border-border-glass backdrop-blur-md space-y-3"
            >
              <h2 className="text-base font-semibold text-text-main tracking-tight">
                {section.heading}
              </h2>
              <ul className="space-y-2.5 text-sm leading-relaxed text-text-sub list-disc pl-5">
                {section.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-4 px-6 py-4 rounded-2xl bg-surface-glass border border-border-glass backdrop-blur-md text-sm">
          <a
            href="https://tools.google.com/dlpage/gaoptout"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-text-main underline decoration-sky-500/60 underline-offset-4 hover:decoration-sky-500 transition-colors"
          >
            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
            {t.optOutLinkText}
          </a>
          <span className="text-text-sub/40 hidden sm:inline">•</span>
          <a
            href="https://github.com/wkmaker/smalltools"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 font-medium text-text-main underline decoration-sky-500/60 underline-offset-4 hover:decoration-sky-500 transition-colors"
          >
            <svg viewBox="0 0 24 24" width={15} height={15} fill="currentColor" aria-hidden="true">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
            </svg>
            {t.githubLinkText}
          </a>
        </div>
      </article>
    </ToolLayout>
  );
}

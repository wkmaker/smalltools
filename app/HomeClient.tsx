'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import ThemeToggle from '@/components/ThemeToggle';

import { CATEGORIES, Category, Tool } from './config/tools';

type Tab = 'all' | Category;

const ARROW_SVG = (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
    <path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-8.29-1.42 1.42L16.86 11H5v2z" />
  </svg>
);

const ALL_TABS: Tab[] = ['all', 'finance', 'workplace', 'developer', 'network', 'media', 'utility'];

interface HomeTranslations {
  title: string;
  subtitleTop: string;
  pageDescription: string;
  searchPlaceholder: string;
  searchClearTitle: string;
  openTool: string;
  noResults: string;
  comingSoonTitle: string;
  comingSoonSubtitle: string;
  comingSoonDesc: string;
  comingSoonAction: string;
  langToggleUrl: string;
  langToggleLabel: string;
  tabLabels: Record<Tab, string>;
  sponsorText: string;
}

const TRANSLATIONS: Record<'zh-TW' | 'en', HomeTranslations> = {
  'zh-TW': {
    title: '工具庫',
    subtitleTop: 'MY TOOLBOX',
    pageDescription:
      '免費、無廣告、精緻的線上工具庫。涵蓋房貸/信貸/車貸計算機、JSON格式化、Base64/URL編碼解碼、密碼生成器、SSL憑證轉換、DNS診斷等 20+ 開發與理財工具，免下載即用。',
    searchPlaceholder: '搜尋工具... (e.g. loan, json, base64)',
    searchClearTitle: '清除搜尋',
    openTool: '開啟工具',
    noResults: '沒有找到符合的工具，請嘗試其他關鍵字',
    comingSoonTitle: '敬請期待',
    comingSoonSubtitle: 'COMING SOON',
    comingSoonDesc: '更多實用、唯美的工具正在開發中，敬請期待下一次的更新與功能推出。',
    comingSoonAction: '規劃中',
    langToggleUrl: '/en/',
    langToggleLabel: 'English',
    tabLabels: {
      all: '全部工具',
      finance: '金融理財',
      workplace: '職場生活',
      developer: '開發輔助',
      network: '網路維運',
      media: '圖片文件',
      utility: '生活娛樂',
    },
    sponsorText: '贊助支持',
  },
  en: {
    title: 'Online Toolbox',
    subtitleTop: 'FREE WEB UTILITIES',
    pageDescription:
      'Free, ad-free, and crafted online developer & utility toolbox. Featuring mortgage/loan calculators, JSON formatter, Base64/URL tools, CSPRNG password generator, SSL converter, DNS dig and 20+ utilities with 100% local privacy.',
    searchPlaceholder: 'Search tools... (e.g. loan, json, base64)',
    searchClearTitle: 'Clear search',
    openTool: 'Open Tool',
    noResults: 'No matching tools found, please try other keywords',
    comingSoonTitle: 'Coming Soon',
    comingSoonSubtitle: 'COMING SOON',
    comingSoonDesc: 'More powerful and elegant tools are under active development. Stay tuned for upcoming updates!',
    comingSoonAction: 'In Progress',
    langToggleUrl: '/',
    langToggleLabel: '繁體中文',
    tabLabels: {
      all: 'All Tools',
      finance: 'Finance',
      workplace: 'Workplace',
      developer: 'Dev Tools',
      network: 'Network',
      media: 'Media & Docs',
      utility: 'Utilities',
    },
    sponsorText: 'Sponsor',
  },
};

interface HomeClientProps {
  lang: 'zh-TW' | 'en';
}

export default function HomeClient({ lang }: HomeClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];
  const isEn = lang === 'en';
  const basePath = isEn ? '/en/' : '/';

  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const cat = searchParams.get('category') as Tab | null;
    const q = searchParams.get('search') || '';
    if (cat && ALL_TABS.includes(cat)) setActiveTab(cat);
    setSearchQuery(q);
    if (searchInputRef.current) searchInputRef.current.value = q;
  }, [searchParams]);

  useEffect(() => {
    let targetId = '';
    if (typeof window !== 'undefined') {
      const rawHash = window.location.hash;
      if (rawHash && rawHash.includes('tool-')) {
        const matches = rawHash.match(/tool-[a-zA-Z0-9-]+/g);
        if (matches && matches.length > 0) {
          targetId = matches[matches.length - 1];
          if (rawHash.indexOf('#', 1) !== -1) {
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${targetId}`);
          }
        }
      }

      if (!targetId) {
        const lastTool = sessionStorage.getItem('lastVisitedTool');
        if (lastTool) {
          targetId = `tool-${lastTool.replace(/^\/|\/$/g, '').replace(/\/en$/, '')}`;
        }
      }

      if (targetId) {
        sessionStorage.removeItem('lastVisitedTool');
        const timer = setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add(styles.highlightCard);
            setTimeout(() => {
              el.classList.remove(styles.highlightCard);
            }, 2000);
          }
        }, 150);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const syncURL = useCallback(
    (tab: Tab, q: string, immediate = false) => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      const update = () => {
        const params = new URLSearchParams();
        if (tab !== 'all') params.set('category', tab);
        if (q) params.set('search', q);
        const searchStr = params.toString();
        const url = searchStr ? `${basePath}?${searchStr}` : basePath;
        router.replace(url, { scroll: false });
      };
      if (immediate) update();
      else debounceRef.current = setTimeout(update, 300);
    },
    [router, basePath]
  );

  const isToolVisible = useCallback((tool: Tool, sectionId: Category, q: string, tab: Tab): boolean => {
    if (tab !== 'all' && sectionId !== tab) return false;
    if (!q) return true;
    const lower = q.toLowerCase();
    return (
      tool.name.toLowerCase().includes(lower) ||
      tool.nameEn.toLowerCase().includes(lower) ||
      tool.description.toLowerCase().includes(lower) ||
      tool.descriptionEn.toLowerCase().includes(lower) ||
      tool.keywords.toLowerCase().includes(lower) ||
      tool.keywordsEn.toLowerCase().includes(lower)
    );
  }, []);

  const handleTabClick = (tab: Tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    syncURL(tab, searchQuery, true);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const q = e.target.value;
    setSearchQuery(q);
    syncURL(activeTab, q);
  };

  const handleSearchClear = () => {
    setSearchQuery('');
    if (searchInputRef.current) searchInputRef.current.value = '';
    syncURL(activeTab, '', true);
    searchInputRef.current?.focus();
  };

  const handleCardMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    (e.currentTarget as HTMLElement).style.setProperty('--x', `${e.clientX - rect.left}px`);
    (e.currentTarget as HTMLElement).style.setProperty('--y', `${e.clientY - rect.top}px`);
  };

  let totalVisible = 0;
  CATEGORIES.forEach(s =>
    s.tools.forEach(t => {
      if (isToolVisible(t, s.id, searchQuery, activeTab)) totalVisible++;
    })
  );

  return (
    <div className={styles.homeContainer}>
      {/* 亮暗模式切換與語系切換按鈕 */}
      <div className="absolute top-6 right-6 z-10 flex items-center gap-2 max-sm:top-4 max-sm:right-4">
        <Link
          href={t.langToggleUrl}
          className="text-sm font-medium px-3 py-1.5 rounded-xl bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
        >
          {t.langToggleLabel}
        </Link>
        <ThemeToggle />
      </div>

      <h1 className={styles.homeTitle}>{t.title}</h1>
      <div className={styles.subtitleTop}>{t.subtitleTop}</div>
      <p className={styles.pageDescription}>{t.pageDescription}</p>

      {/* 搜尋與 Tab 控制面板 */}
      <div className={styles.controlPanel}>
        <div className={styles.searchWrapper}>
          <svg className={styles.searchIcon} viewBox="0 0 24 24" aria-hidden="true">
            <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
          </svg>
          <input
            ref={searchInputRef}
            type="text"
            placeholder={t.searchPlaceholder}
            autoComplete="off"
            onChange={handleSearchChange}
            aria-label={t.searchPlaceholder}
          />
          {searchQuery && (
            <button className={styles.searchClear} onClick={handleSearchClear} title={t.searchClearTitle} aria-label={t.searchClearTitle}>
              <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          )}
        </div>

        <div className={styles.tabGroup} role="tablist">
          {ALL_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => handleTabClick(tab)}
              className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
              role="tab"
              aria-selected={activeTab === tab}
            >
              {t.tabLabels[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* 分類區段 */}
      {CATEGORIES.map(section => {
        const visibleTools = section.tools.filter(tool => isToolVisible(tool, section.id, searchQuery, activeTab));
        if (visibleTools.length === 0) return null;

        const sectionLabel = isEn ? section.labelEn : section.label;

        return (
          <div key={section.id} className={styles.categorySection} data-section={section.id}>
            <h2 className={styles.sectionTitle}>
              {section.emoji} {sectionLabel}
            </h2>

            <div className={styles.toolsGrid}>
              {visibleTools.map(tool => {
                const targetHref = isEn ? tool.hrefEn : tool.href;
                const toolName = isEn ? tool.nameEn : tool.name;
                const toolSubtitle = isEn ? tool.subtitleEn : tool.subtitle;
                const toolDesc = isEn ? tool.descriptionEn : tool.description;
                const toolId = `tool-${tool.href.replace(/^\/|\/$/g, '')}`;

                return (
                  <Link
                    key={tool.href}
                    id={toolId}
                    href={targetHref}
                    className={`${styles.toolCard} ${styles[tool.cardClass] || ''}`}
                    onMouseMove={handleCardMouseMove}
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        sessionStorage.setItem('lastVisitedTool', tool.href);
                        if (window.location.hash) {
                          window.history.replaceState(null, '', window.location.pathname + window.location.search);
                        }
                      }
                    }}
                  >
                    <div>
                      <h3>{toolName}</h3>
                      <span className={styles.subtitle}>{toolSubtitle}</span>
                      <p>{toolDesc}</p>
                    </div>
                    <div className={styles.cardAction}>
                      {t.openTool} {ARROW_SVG}
                    </div>
                  </Link>
                );
              })}

              {section.id === 'utility' && activeTab === 'all' && !searchQuery && (
                <div className={`${styles.toolCard} ${styles.placeholderCard}`} onMouseMove={handleCardMouseMove}>
                  <div>
                    <h3>{t.comingSoonTitle}</h3>
                    <span className={styles.subtitle}>{t.comingSoonSubtitle}</span>
                    <p>{t.comingSoonDesc}</p>
                  </div>
                  <div className={styles.cardAction}>{t.comingSoonAction}</div>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {totalVisible === 0 && (
        <div className="flex flex-col items-center justify-center gap-4 w-full py-16 text-text-sub">
          <p className="text-lg">{t.noResults}</p>
        </div>
      )}

      {/* 頁尾資訊 */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 mt-14 pt-6 border-t border-white/[.05] text-sm text-text-sub w-full">
        <span>
          Powered by{' '}
          <a
            href="https://www.plumeintel.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-text-main font-semibold no-underline hover:text-cyan-400 transition-colors"
          >
            PLUME INTEL
          </a>
        </span>
        <span className="hidden sm:inline text-white/20">•</span>
        <a
          href="https://github.com/wkmaker/smalltools"
          target="_blank"
          rel="noopener noreferrer"
          title="GitHub Repository"
          aria-label="GitHub Repository"
          className="inline-flex items-center gap-1.5 text-text-sub hover:text-text-main transition-colors no-underline font-medium text-xs px-2.5 py-1 rounded-full bg-white/[.03] border border-white/[.08] hover:border-white/20 hover:bg-white/[.08]"
        >
          <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor" className="flex-shrink-0">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          <span>GitHub</span>
        </a>
        <span className="hidden sm:inline text-white/20">•</span>
        <a
          href="https://donate.stripe.com/fZufZh4sI3xf4KheFc3ZK00?client_reference_id=smalltools"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/30 text-pink-400 hover:text-pink-300 hover:border-pink-400 hover:bg-pink-500/20 transition-all duration-300 text-xs no-underline font-medium shadow-[0_0_10px_rgba(244,63,94,0.15)]"
        >
          <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          {t.sponsorText}
        </a>
      </div>
    </div>
  );
}

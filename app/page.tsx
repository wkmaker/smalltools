'use client';

import { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import styles from './page.module.css';
import ThemeToggle from '@/components/ThemeToggle';

import { CATEGORIES, Category, Tool } from './config/tools';

// ── 工具頁面標籤類別定義 ──────────────────────────────────────────────

type Tab = 'all' | Category;

const ARROW_SVG = (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
    <path d="M5 13h11.86l-5.43 5.43 1.42 1.42L21.14 12l-8.29-8.29-1.42 1.42L16.86 11H5v2z" />
  </svg>
);

const ALL_TABS: Tab[] = ['all', 'finance', 'developer', 'network', 'text', 'utility'];
const TAB_LABELS: Record<Tab, string> = {
  all: '全部工具', finance: '金融理財', developer: '開發輔助',
  network: '網路工具', text: '文字編輯', utility: '實用小工具',
};

const schemaJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: '工具庫',
  url: 'https://tools.cjkuo.net/',
  description: '免費線上工具庫，包含房貸計算機、信貸計算機、JSON格式化、Base64編碼解碼、SSL憑證轉換、密碼生成器、圖片壓縮裁切等 20+ 精緻實用工具。',
};

function HomePageContent() {
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
        // 從可能包含多個 # 的字串中精確提取最後一個合法的 tool- 標籤
        const matches = rawHash.match(/tool-[a-zA-Z0-9-]+/g);
        if (matches && matches.length > 0) {
          targetId = matches[matches.length - 1];
          // 如果發現 URL 包含重複的 #，自動淨化網址列為單一標準 Hash
          if (rawHash.indexOf('#', 1) !== -1) {
            window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${targetId}`);
          }
        }
      }
      
      if (!targetId) {
        const lastTool = sessionStorage.getItem('lastVisitedTool');
        if (lastTool) {
          targetId = `tool-${lastTool.replace(/^\/|\/$/g, '')}`;
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

  const syncURL = useCallback((tab: Tab, q: string, immediate = false) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const update = () => {
      const params = new URLSearchParams();
      if (tab !== 'all') params.set('category', tab);
      if (q) params.set('search', q);
      const url = params.toString() ? `/?${params.toString()}` : '/';
      router.replace(url, { scroll: false });
    };
    if (immediate) update();
    else debounceRef.current = setTimeout(update, 300);
  }, [router]);

  const isToolVisible = useCallback((tool: Tool, sectionId: Category, q: string, tab: Tab): boolean => {
    if (tab !== 'all' && sectionId !== tab) return false;
    if (!q) return true;
    const lower = q.toLowerCase();
    return (
      tool.name.toLowerCase().includes(lower) ||
      tool.description.toLowerCase().includes(lower) ||
      tool.keywords.toLowerCase().includes(lower)
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
  CATEGORIES.forEach(s => s.tools.forEach(t => { if (isToolVisible(t, s.id, searchQuery, activeTab)) totalVisible++; }));

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaJsonLd) }} />

      <div className={styles.homeContainer}>
        {/* 亮暗模式切換按鈕 */}
        <div className="absolute top-6 right-6 z-10 max-sm:top-4 max-sm:right-4">
          <ThemeToggle />
        </div>

        <h1 className={styles.homeTitle}>工具庫</h1>
        <div className={styles.subtitleTop}>MY TOOLBOX</div>
        <p className={styles.pageDescription}>
          免費、無廣告、精緻的線上工具庫。涵蓋房貸/信貸/車貸計算機、JSON格式化、Base64/URL編碼解碼、
          密碼生成器、SSL憑證轉換、DNS診斷等 20+ 開發與理財工具，免下載即用。
        </p>

        {/* 搜尋與 Tab 控制面板 */}
        <div className={styles.controlPanel}>
          <div className={styles.searchWrapper}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24">
              <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
            </svg>
            <input
              ref={searchInputRef}
              type="text"
              placeholder="搜尋工具... (e.g. loan, json, base64)"
              autoComplete="off"
              onChange={handleSearchChange}
            />
            {searchQuery && (
              <button className={styles.searchClear} onClick={handleSearchClear} title="清除搜尋">
                <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                </svg>
              </button>
            )}
          </div>

          <div className={styles.tabGroup}>
            {ALL_TABS.map(tab => (
              <button
                key={tab}
                onClick={() => handleTabClick(tab)}
                className={`${styles.tabBtn} ${activeTab === tab ? styles.active : ''}`}
              >
                {TAB_LABELS[tab]}
              </button>
            ))}
          </div>
        </div>

        {/* 分類區段 */}
        {CATEGORIES.map(section => {
          const visibleTools = section.tools.filter(t => isToolVisible(t, section.id, searchQuery, activeTab));
          if (visibleTools.length === 0) return null;

          return (
            <div key={section.id} className={styles.categorySection} data-section={section.id}>
              <h2 className={styles.sectionTitle}>
                {section.emoji} {section.label}
              </h2>

              <div className={styles.toolsGrid}>
                {visibleTools.map(tool => (
                  <Link
                    key={tool.href}
                    id={`tool-${tool.href.replace(/^\/|\/$/g, '')}`}
                    href={tool.href}
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
                      <h3>{tool.name}</h3>
                      <span className={styles.subtitle}>{tool.subtitle}</span>
                      <p>{tool.description}</p>
                    </div>
                    <div className={styles.cardAction}>
                      開啟工具 {ARROW_SVG}
                    </div>
                  </Link>
                ))}

                {section.id === 'utility' && activeTab === 'all' && !searchQuery && (
                  <div className={`${styles.toolCard} ${styles.placeholderCard}`} onMouseMove={handleCardMouseMove}>
                    <div>
                      <h3>敬請期待</h3>
                      <span className={styles.subtitle}>COMING SOON</span>
                      <p>更多實用、唯美的工具正在開發中，敬請期待下一次的更新與功能推出。</p>
                    </div>
                    <div className={styles.cardAction}>規劃中</div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {totalVisible === 0 && (
          <div className="flex flex-col items-center justify-center gap-4 w-full py-16 text-text-sub">
            <p className="text-lg">沒有找到符合的工具，請嘗試其他關鍵字</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-14 pt-6 border-t border-white/[.05] text-sm text-text-sub w-full">
          <span>
            Powered by{' '}
            <a href="https://www.cjkuo.net/" target="_blank" rel="noopener noreferrer" className="text-[var(--theme-color)] font-medium no-underline hover:text-white">
              CJKuo
            </a>
          </span>
          <span className="hidden sm:inline text-white/20">•</span>
          <a
            href="https://donate.stripe.com/fZufZh4sI3xf4KheFc3ZK00?client_reference_id=smalltools"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/30 text-pink-400 hover:text-pink-300 hover:border-pink-400 hover:bg-pink-500/20 transition-all duration-300 text-xs no-underline font-medium shadow-[0_0_10px_rgba(244,63,94,0.15)]"
          >
            <svg viewBox="0 0 24 24" width="13" height="13" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            贊助支持
          </a>
        </div>
      </div>
    </>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen text-text-sub">載入中...</div>}>
      <HomePageContent />
    </Suspense>
  );
}

'use client';

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { CATEGORIES, type Tool } from '@/app/config/tools';
import { useTheme } from '@/components/ThemeProvider';
import styles from './CommandPalette.module.css';

interface PaletteItem {
  id: string;
  type: 'tool' | 'action';
  title: string;
  subtitle?: string;
  categoryLabel?: string;
  icon: React.ReactNode;
  isPinned?: boolean;
  onSelect: () => void;
}

const SEARCH_ICON = (
  <svg viewBox="0 0 24 24" width={18} height={18} fill="currentColor" aria-hidden="true">
    <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" />
  </svg>
);

const THEME_ICON = (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
  </svg>
);

const GLOBE_ICON = (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <line x1="2" y1="12" x2="22" y2="12" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
  </svg>
);

const HOME_ICON = (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
    <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
  </svg>
);

const HEART_ICON = (
  <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
  </svg>
);

const STAR_ICON = (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="currentColor">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const ARROW_RIGHT_ICON = (
  <svg viewBox="0 0 24 24" width={14} height={14} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="9 18 15 12 9 6" />
  </svg>
);

export default function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [pinnedHrefs, setPinnedHrefs] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const isEn = pathname ? pathname.includes('/en/') || pathname.endsWith('/en') : false;

  // 讀取釘選工具
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem('smalltools_pinned_tools');
      if (raw) setPinnedHrefs(JSON.parse(raw));
    } catch (e) {}
  }, [isOpen]);

  // 全域快捷鍵監聽 (Cmd + K / Ctrl + K / Esc) 與自訂事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        e.preventDefault();
        setIsOpen(false);
      }
    };

    const handleCustomOpen = () => {
      setIsOpen(true);
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('open-command-palette', handleCustomOpen);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('open-command-palette', handleCustomOpen);
    };
  }, [isOpen]);

  // 開啟時自動聚焦搜尋輸入框並重設選擇
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
    }
  }, [isOpen]);

  const allTools = useMemo(() => {
    const list: { tool: Tool; categoryLabel: string }[] = [];
    CATEGORIES.forEach((cat) => {
      cat.tools.forEach((t) => {
        list.push({
          tool: t,
          categoryLabel: isEn ? cat.labelEn : cat.label,
        });
      });
    });
    return list;
  }, [isEn]);

  // 建構搜尋項目與過濾
  const filteredItems: PaletteItem[] = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items: PaletteItem[] = [];

    // 1. 工具搜尋項目
    allTools.forEach(({ tool, categoryLabel }) => {
      const name = isEn ? tool.nameEn : tool.name;
      const subtitle = isEn ? tool.subtitleEn : tool.subtitle;
      const desc = isEn ? tool.descriptionEn : tool.description;
      const keywords = isEn ? tool.keywordsEn : tool.keywords;
      const targetHref = isEn ? tool.hrefEn : tool.href;
      const isPinned = pinnedHrefs.includes(tool.href);

      const matches =
        !q ||
        name.toLowerCase().includes(q) ||
        tool.name.toLowerCase().includes(q) ||
        tool.nameEn.toLowerCase().includes(q) ||
        subtitle.toLowerCase().includes(q) ||
        desc.toLowerCase().includes(q) ||
        keywords.toLowerCase().includes(q) ||
        categoryLabel.toLowerCase().includes(q);

      if (matches) {
        items.push({
          id: `tool-${tool.href}`,
          type: 'tool',
          title: name,
          subtitle: desc,
          categoryLabel,
          icon: tool.svg,
          isPinned,
          onSelect: () => {
            setIsOpen(false);
            router.push(targetHref);
          },
        });
      }
    });

    // 依釘選狀態排序（釘選工具優先排在前面）
    if (!q) {
      items.sort((a, b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));
    }

    // 2. 系統快捷指令 (Actions)
    const actions: PaletteItem[] = [
      {
        id: 'action-theme',
        type: 'action',
        title: isEn
          ? `Switch Theme (Current: ${theme === 'dark' ? 'Dark' : 'Light'})`
          : `切換亮暗主題 (目前：${theme === 'dark' ? '深色' : '淺色'})`,
        subtitle: isEn ? 'Toggle between dark and light appearance' : '切換深色與淺色視覺風格',
        icon: THEME_ICON,
        onSelect: () => {
          toggleTheme();
          setIsOpen(false);
        },
      },
      {
        id: 'action-lang',
        type: 'action',
        title: isEn ? '切換至繁體中文 (Switch to Traditional Chinese)' : 'Switch to English (切換至英文)',
        subtitle: isEn ? '切換全站多語系介面' : 'Toggle site language to English',
        icon: GLOBE_ICON,
        onSelect: () => {
          setIsOpen(false);
          const targetUrl = isEn
            ? pathname.replace(/\/en(\/|$)/, '/')
            : (pathname.endsWith('/') ? `${pathname}en/` : `${pathname}/en/`);
          router.push(targetUrl || '/');
        },
      },
      {
        id: 'action-home',
        type: 'action',
        title: isEn ? 'Back to Home' : '返回首頁',
        subtitle: isEn ? 'Go to Smalltools homepage' : '前往工具庫主頁與分類列表',
        icon: HOME_ICON,
        onSelect: () => {
          setIsOpen(false);
          router.push(isEn ? '/en/' : '/');
        },
      },
      {
        id: 'action-sponsor',
        type: 'action',
        title: isEn ? 'Sponsor the Author' : '贊助支持作者',
        subtitle: isEn ? 'Support continuous development via Stripe' : '透過 Stripe 贊助支持持續開發',
        icon: HEART_ICON,
        onSelect: () => {
          setIsOpen(false);
          window.open('https://donate.stripe.com/fZufZh4sI3xf4KheFc3ZK00?client_reference_id=smalltools', '_blank');
        },
      },
    ];

    actions.forEach((act) => {
      if (!q || act.title.toLowerCase().includes(q) || (act.subtitle && act.subtitle.toLowerCase().includes(q))) {
        items.push(act);
      }
    });

    return items;
  }, [allTools, query, isEn, pinnedHrefs, theme, toggleTheme, pathname, router]);

  const lastMousePosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // 鍵盤上下與確認處理
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (filteredItems.length === 0) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredItems.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredItems.length) % filteredItems.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (filteredItems[selectedIndex]) {
          filteredItems[selectedIndex].onSelect();
        }
      }
    },
    [filteredItems, selectedIndex]
  );

  // 當選中項目變更時，即時捲動列表至可見範圍（使用 auto 避免快速連按時動畫衝突）
  useEffect(() => {
    if (!listRef.current) return;
    const activeEl = listRef.current.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement | null;
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest', behavior: 'auto' });
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div
      className={styles.overlay}
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label={isEn ? 'Command Palette' : '全域快捷搜尋'}
    >
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* ── 頂端搜尋欄 ── */}
        <div className={styles.searchBar}>
          <span className="text-text-sub flex-shrink-0">{SEARCH_ICON}</span>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder={isEn ? 'Search tools, actions or commands... (e.g. loan, json, base64)' : '搜尋小工具、分類或快捷指令... (例: 房貸, json, base64)'}
            className={styles.searchInput}
            autoComplete="off"
            spellCheck="false"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setSelectedIndex(0);
                inputRef.current?.focus();
              }}
              className={styles.clearBtn}
            >
              {isEn ? 'Clear' : '清除'}
            </button>
          )}
          <span className={styles.escBadge}>
            ESC
          </span>
        </div>

        {/* ── 列表區域 ── */}
        <div ref={listRef} className={styles.itemList}>
          {filteredItems.length === 0 ? (
            <div className={styles.emptyState}>
              {isEn ? 'No matching tools or commands found.' : '未找到符合的小工具或指令，請嘗試其他關鍵字。'}
            </div>
          ) : (
            filteredItems.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  data-index={idx}
                  onClick={() => item.onSelect()}
                  onMouseMove={(e) => {
                    // 僅當滑鼠座標真正改變時才更新，防止鍵盤或滾輪快速捲動時游標下方的元素觸發選取跳躍
                    if (
                      e.clientX !== lastMousePosRef.current.x ||
                      e.clientY !== lastMousePosRef.current.y
                    ) {
                      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
                      setSelectedIndex(idx);
                    }
                  }}
                  className={`${styles.item} ${isSelected ? styles.itemSelected : ''}`}
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className={`${styles.iconBox} ${isSelected ? styles.iconBoxActive : ''}`}>
                      {item.icon}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`${styles.itemTitle} ${isSelected ? styles.itemTitleSelected : ''}`}>
                          {item.title}
                        </span>
                        {item.isPinned && (
                          <span className="text-[#ffb800] flex-shrink-0" title={isEn ? 'Pinned' : '常用工具'}>
                            {STAR_ICON}
                          </span>
                        )}
                        {item.categoryLabel && (
                          <span className={styles.categoryBadge}>
                            {item.categoryLabel}
                          </span>
                        )}
                      </div>
                      {item.subtitle && (
                        <p className={styles.itemSubtitle}>
                          {item.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-text-sub flex-shrink-0">
                    {isSelected && (
                      <span className={styles.jumpAction}>
                        <span>{isEn ? 'Jump' : '前往'}</span>
                        <span className="text-xs">↵</span>
                      </span>
                    )}
                    <span className="opacity-60">{ARROW_RIGHT_ICON}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* ── 底部鍵盤提示 ── */}
        <div className={styles.footer}>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1">
              <kbd className={styles.kbd}>↑</kbd>
              <kbd className={styles.kbd}>↓</kbd>
              <span>{isEn ? 'Navigate' : '切換選項'}</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <kbd className={styles.kbd}>↵</kbd>
              <span>{isEn ? 'Select' : '選擇'}</span>
            </span>
          </div>

          <div className="flex items-center gap-1 opacity-80">
            <span>Smalltools Spotlight</span>
          </div>
        </div>
      </div>
    </div>
  );
}


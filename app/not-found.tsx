'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ToolLayout from './components/ToolLayout';
import { ALL_TOOLS, Category, Tool } from './config/tools';

// 預設熱門工具（6 個常駐，用於 SSR 與初始渲染）
const DEFAULT_POPULAR_TOOLS: Tool[] = ALL_TOOLS.slice(0, 6);

// 陣列隨機打亂函數 (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// 根據請求路徑判定分類
function detectCategoryFromPath(pathname: string): Category | null {
  if (!pathname) return null;
  const cleanPath = pathname.toLowerCase();

  // 1. 比對是否包含或匹配特定工具路徑 slug
  for (const tool of ALL_TOOLS) {
    const slug = tool.href.replace(/^\/|\/$/g, '');
    if (slug && cleanPath.includes(slug)) {
      return tool.category;
    }
  }

  // 2. 關鍵字比對
  if (/(loan|mortgage|salary|interest|pledge|futures|stock|money|pay|tax|bank|finance|rate|car|compound)/.test(cleanPath)) {
    return 'finance';
  }
  if (/(json|base64|url|password|ssl|dev|code|encode|decode|convert|cert)/.test(cleanPath)) {
    return 'developer';
  }
  if (/(ip|dig|dns|net|http|subnet|ping|trace|network)/.test(cleanPath)) {
    return 'network';
  }
  if (/(qr|text|diff|doc|string|font|word)/.test(cleanPath)) {
    return 'text';
  }
  if (/(pdf|time|clock|epoch|wheel|image|img|photo|crop|timer|compress|lucky)/.test(cleanPath)) {
    return 'utility';
  }

  return null;
}

// 取得推薦工具清單（優先挑選同類型，不足 6 個再隨機補滿）
function getRecommendedTools(pathname: string): Tool[] {
  const targetCategory = detectCategoryFromPath(pathname);
  const cleanPath = pathname.toLowerCase().replace(/\/+$/, '');

  // 排除當前完全相符的工具路徑
  const availableTools = ALL_TOOLS.filter(t => t.href.replace(/\/+$/, '') !== cleanPath);

  let selected: Tool[] = [];

  if (targetCategory) {
    // 先選同類型的工具
    const sameCategoryTools = availableTools.filter(t => t.category === targetCategory);
    const shuffledSameCategory = shuffleArray(sameCategoryTools);

    selected = shuffledSameCategory.slice(0, 6);

    // 如果同類型工具不足 6 個，再隨機補滿至 6 個
    if (selected.length < 6) {
      const selectedPaths = new Set(selected.map(t => t.href));
      const otherTools = availableTools.filter(t => !selectedPaths.has(t.href));
      const shuffledOthers = shuffleArray(otherTools);

      const needed = 6 - selected.length;
      selected = [...selected, ...shuffledOthers.slice(0, needed)];
    }
  } else {
    // 無法識別分類時，隨機選取 6 個
    selected = shuffleArray(availableTools).slice(0, 6);
  }

  return selected;
}

export default function NotFound() {
  const pathname = usePathname();
  const [recommendedTools, setRecommendedTools] = useState<Tool[]>(DEFAULT_POPULAR_TOOLS);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentPath = pathname || window.location.pathname;
      setRecommendedTools(getRecommendedTools(currentPath));
    }
  }, [pathname]);

  return (
    <ToolLayout
      title="404 - 找不到頁面"
      subtitle="404 PAGE NOT FOUND"
      description="抱歉！您存取的頁面不存在、已被移動或網址輸入錯誤。請選取下方常用工具或點擊返回首頁。"
      accentColor="#ff0055"
      accentGlow="rgba(255, 0, 85, 0.6)"
    >
      <div className="flex flex-col items-center gap-10 py-6 text-center">
        {/* 霓虹發光 404 大字區塊 */}
        <div className="relative flex items-center justify-center">
          <div className="text-[#ff0055] font-mono text-8xl font-extrabold tracking-wider drop-shadow-[0_0_35px_rgba(255,0,85,0.6)]">
            404
          </div>
        </div>

        <div className="flex max-w-[500px] flex-col gap-2">
          <h2 className="flex items-center justify-center gap-2 text-xl font-bold text-white">
            您尋找的網頁似乎飛走了
            <svg viewBox="0 0 24 24" width={22} height={22} fill="currentColor" className="text-[#ff0055]">
              <path d="M12 2.5s4.5 3.5 4.5 8.5c0 2.5-1 4.5-2.5 6l2.5 4.5-3.5-1.5-3.5 1.5 2.5-4.5c-1.5-1.5-2.5-3.5-2.5-6 0-5 4.5-8.5 4.5-8.5z" />
            </svg>
          </h2>
          <p className="text-text-sub text-sm leading-relaxed">
            別擔心！SmallTools 工具庫的所有工具均運作正常。您可以透過以下按鈕返回首頁或探索熱門工具：
          </p>
        </div>

        {/* 主行動按鈕 */}
        <Link
          href="/"
          className="bg-[#ff0055] rounded-xl border border-[#ff0055] px-8 py-3.5 text-sm font-bold text-white transition-all cursor-pointer hover:shadow-[0_0_25px_rgba(255,0,85,0.6)]"
        >
          返回工具庫首頁
        </Link>

        {/* 推薦熱門工具快速捷徑 */}
        <div className="flex w-full max-w-[800px] flex-col gap-4 border-t border-white/[.08] pt-8">
          <span className="text-[#ff0055] text-sm font-semibold uppercase tracking-[1px]">
            熱門線上工具推薦
          </span>

          <div className="grid grid-cols-3 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
            {recommendedTools.map(t => (
              <Link
                key={t.href}
                href={t.href}
                className="group flex items-center gap-3 rounded-xl border border-white/[.08] bg-black/30 p-4 transition-all hover:scale-[1.02] hover:border-white/[.2]"
              >
                <div className="shrink-0 transition-transform group-hover:scale-110">
                  {t.svg}
                </div>
                <div className="flex flex-col overflow-hidden text-left">
                  <span className="text-text-main group-hover:text-[#ff0055] text-sm font-semibold transition-colors truncate">
                    {t.name}
                  </span>
                  <span className="text-text-sub text-xs font-mono truncate">{t.href}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

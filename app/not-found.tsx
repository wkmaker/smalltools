'use client';

import Link from 'next/link';
import ToolLayout from './components/ToolLayout';
import { CATEGORIES } from './config/tools';

const CATEGORY_EN_LABELS: Record<string, string> = {
  finance: 'Financial Tools',
  developer: 'Developer Tools',
  network: 'Network Utilities',
  text: 'Text & Utilities',
  utility: 'Practical Tools',
};

export default function NotFound() {
  return (
    <ToolLayout
      title="404 - 頁面未找到 / Page Not Found"
      subtitle="404 PAGE NOT FOUND"
      description="您存取的頁面不存在或已被移動。別擔心，您可以透過下方全站工具地圖快速探索！ / Explore our full tool navigation hub below."
      accentColor="#ff0055"
      accentGlow="rgba(255, 0, 85, 0.6)"
    >
      <div className="flex flex-col items-center gap-10 py-4 text-center w-full max-w-[1000px] mx-auto">
        {/* 頂部霓虹 404 大字與雙語標題 */}
        <div className="flex flex-col items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="text-[#ff0055] dark:text-[#ff0055] light:text-[#dc2626] font-mono text-7xl sm:text-9xl font-extrabold tracking-wider drop-shadow-[0_0_35px_rgba(255,0,85,0.6)]">
              404
            </span>
          </div>

          <div className="flex max-w-[600px] flex-col gap-2 px-4">
            <h2 className="text-xl sm:text-2xl font-bold text-text-main flex items-center justify-center gap-2">
              找不到此頁面 / Page Not Found
            </h2>
            <p className="text-text-sub text-xs sm:text-sm leading-relaxed">
              您存取的網頁不存在或已搬移。點擊下方全站工具地圖快速跳轉：
              <br />
              <span className="text-text-sub/80 text-xs">
                The page you requested doesn’t exist. Jump to any tool below:
              </span>
            </p>
          </div>

          {/* 返回首頁按鈕 */}
          <Link
            href="/"
            className="mt-2 bg-[#ff0055] hover:bg-[#e0004c] rounded-xl border border-[#ff0055] px-7 py-3 text-xs sm:text-sm font-bold text-white transition-all cursor-pointer shadow-lg hover:shadow-[0_0_25px_rgba(255,0,85,0.6)] flex items-center gap-2"
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
              <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z" />
            </svg>
            返回工具庫首頁 / Back to Home
          </Link>
        </div>

        {/* 核心重點：全站 4 大領域微型地圖 (Tool Navigation Hub) */}
        <div className="flex flex-col gap-5 w-full border-t border-border-glass pt-8">
          <div className="flex items-center justify-between px-2">
            <span className="text-[#ff0055] dark:text-[#ff0055] light:text-[#dc2626] text-xs font-bold uppercase tracking-[1.5px] flex items-center gap-2">
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                <path d="M4 11h5V5H4v6zm0 7h5v-6H4v6zm6 0h5v-6h-5v6zm6 0h5v-6h-5v6zm-6-7h5V5h-5v6zm6-6v6h5V5h-5z" />
              </svg>
              全站微型工具地圖 / Tool Navigation Hub
            </span>
            <span className="text-text-sub text-xs inline-flex items-center gap-1">
              小工具運作正常
              <svg className="w-3.5 h-3.5 text-text-sub fill-current" viewBox="0 0 24 24">
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </span>
          </div>

          <div className="grid grid-cols-2 max-lg:grid-cols-1 gap-5 text-left">
            {CATEGORIES.map((cat) => (
              <div
                key={cat.id}
                className="bg-surface-glass border border-border-glass rounded-2xl p-5 flex flex-col gap-3.5 shadow-[var(--glass-shadow)] backdrop-blur-[24px] transition-all hover:border-[#ff0055]/30"
              >
                <div className="flex items-center justify-between border-b border-border-glass pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{cat.emoji}</span>
                    <span className="text-sm font-bold text-text-main">{cat.label}</span>
                    <span className="text-xs text-text-sub font-mono">
                      / {CATEGORY_EN_LABELS[cat.id] || cat.id}
                    </span>
                  </div>
                  <span className="text-[0.7rem] bg-select-bg px-2 py-0.5 rounded-full text-text-sub font-mono">
                    {cat.tools.length} Tools
                  </span>
                </div>

                <div className="grid grid-cols-2 max-sm:grid-cols-1 gap-2.5">
                  {cat.tools.slice(0, 4).map((tool) => (
                    <Link
                      key={tool.href}
                      href={tool.href}
                      className="group flex items-center gap-2.5 p-2.5 rounded-xl bg-select-bg border border-border-glass transition-all hover:scale-[1.02] hover:border-[#ff0055]/40 hover:shadow-sm"
                    >
                      <div className="shrink-0 transition-transform group-hover:scale-110">
                        {tool.svg}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-text-main group-hover:text-[#ff0055] transition-colors truncate">
                          {tool.name}
                        </span>
                        <span className="text-[0.65rem] font-mono text-text-sub truncate">
                          {tool.subtitle}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ToolLayout>
  );
}

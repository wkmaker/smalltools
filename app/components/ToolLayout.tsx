/**
 * ToolLayout.tsx
 * ──────────────────────────────────────────────────────────────
 * 全站工具頁面共用佈局元件（純 Tailwind v4 實作）
 *
 * Props:
 *   title        - 主標題（中文，會轉大寫）
 *   subtitle     - 英文副標題（會轉大寫）
 *   description  - 頁面描述文字
 *   accentColor  - 工具主題色（CSS color 字串，如 '#0077ff'）
 *   accentGlow   - 光暈色（rgba 字串，如 'rgba(0,119,255,0.6)'）
 *   children     - 工具主體內容
 *
 * 特性：
 *   - 玻璃擬物化外容器（backdrop-blur、border、shadow）
 *   - 左上角返回按鈕（absolute，hover 變主題色）
 *   - 主標題 + 下方動態彩色發光線條（animate-glow-pulse）
 *   - 副標題、描述文字
 *   - 響應式（手機版 padding 收縮、返回按鈕 static）
 */

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface ToolLayoutProps {
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;   // e.g. '#0077ff'
  accentGlow: string;    // e.g. 'rgba(0,119,255,0.6)'
  hideHeader?: boolean;  // 若為 true，隱藏上方標題與描述段落
  children: React.ReactNode;
}

export default function ToolLayout({
  title,
  subtitle,
  description,
  accentColor,
  accentGlow,
  hideHeader = false,
  children,
}: ToolLayoutProps) {
  const pathname = usePathname();
  const cleanPath = pathname ? pathname.replace(/^\/|\/$/g, '') : '';
  const backHref = cleanPath ? `/#tool-${cleanPath}` : '/';

  return (
    /*
     * 最外層玻璃容器
     * - flex flex-col 明確指定垂直堆疊，確保 description 在 children 之上
     * - max-w-[90%] → 對應原版 glass-container max-width: 90%
     * - padding 對應原版 3.5rem 3rem
     */
    <div
      className="
        tool-layout-container
        relative z-[1] w-full max-w-[90%] mx-auto
        flex flex-col
        bg-surface-glass border border-border-glass rounded-3xl
        backdrop-blur-[12px] [-webkit-backdrop-filter:blur(12px)]
        shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]
        px-12 pt-16 pb-14
        max-sm:px-5 max-sm:pt-12 max-sm:pb-10
        max-[768px]:max-w-[98%]
      "
    >
      {/* ── 返回按鈕 ── */}
      <Link
        href={backHref}
        onClick={() => {
          if (typeof window !== 'undefined' && pathname) {
            sessionStorage.setItem('lastVisitedTool', pathname);
          }
        }}
        className="
          tool-back-btn
          absolute top-6 left-6 z-[11]
          inline-flex items-center gap-2 text-sm font-medium
          px-4 py-2 rounded-lg
          bg-surface-glass-btn border border-border-glass
          text-text-sub no-underline
          transition-all duration-300
          hover:text-text-main hover:border-[var(--tool-accent)] hover:bg-white/[.06]
          hover:shadow-[0_0_15px_var(--tool-glow)]
          hover:-translate-y-0.5
          w-fit self-start
          max-sm:static max-sm:inline-flex max-sm:mb-6
        "
        style={
          {
            '--tool-accent': accentColor,
            '--tool-glow': accentGlow,
          } as React.CSSProperties
        }
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor"
          className="transition-transform duration-300 group-hover:-translate-x-1">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        返回首頁
      </Link>

      {/* ── 主標題 + 描述 (若 hideHeader 為 false 則渲染) ── */}
      {!hideHeader && (
        <>
          <div className="text-center mb-2 mt-2">
            <h1 className="tool-title font-light text-[2.2rem] tracking-[6px] text-text-main uppercase">
              {title}
            </h1>
            <div
              className="w-[80px] h-[2px] mx-auto mt-3 mb-3 animate-glow-pulse"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentGlow}, transparent)`,
                boxShadow: `0 0 8px ${accentGlow}`,
              }}
            />
          </div>

          <p className="tool-subtitle text-sm text-text-sub font-medium tracking-[2px] text-center mt-0 mb-6 uppercase">
            {subtitle}
          </p>

          <p className="tool-description w-full max-w-[800px] self-center text-base font-normal leading-relaxed text-text-sub text-center mb-10">
            {description}
          </p>
        </>
      )}

      {/* ── 工具主體內容（在描述文字之後垂直堆疊） ── */}
      <div className="w-full">
        {children}
      </div>
    </div>
  );

}

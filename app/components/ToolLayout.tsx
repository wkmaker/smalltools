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
import ThemeToggle from '@/components/ThemeToggle';

interface ToolLayoutProps {
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;   // e.g. '#0077ff'
  accentGlow: string;    // e.g. 'rgba(0,119,255,0.6)'
  hideHeader?: boolean;  // 若為 true，隱藏上方標題與描述段落
  hideFooter?: boolean;  // 若為 true，隱藏下方頁尾贊助連結
  hideThemeToggle?: boolean; // 若為 true，隱藏右上角獨立 ThemeToggle
  compactBackBtn?: boolean;  // 若為 true，返回按鈕僅顯示 ICON
  backHref?: string;         // 自訂返回按鈕連結 (例如 '/hourly-rate-calculator/')
  backTitle?: string;        // 自訂返回按鈕提示字彙 (title / aria-label)
  backText?: string;         // 自訂返回按鈕顯示文案
  onBackClick?: (e: React.MouseEvent) => void; // 自訂點擊返回按鈕事件
  containerClassName?: string; // 可選傳入自訂外容器 class
  extraHeaderControls?: React.ReactNode; // 可選傳入頂欄右側自訂按鈕組
  children: React.ReactNode;
}

export default function ToolLayout({
  title,
  subtitle,
  description,
  accentColor,
  accentGlow,
  hideHeader = false,
  hideFooter = false,
  hideThemeToggle = false,
  compactBackBtn = false,
  backHref: customBackHref,
  backTitle,
  backText,
  onBackClick,
  containerClassName = '',
  extraHeaderControls,
  children,
}: ToolLayoutProps) {
  const pathname = usePathname();
  const cleanPath = pathname ? pathname.replace(/^\/|\/$/g, '') : '';
  const defaultBackHref = cleanPath ? `/#tool-${cleanPath}` : '/';
  const targetBackHref = customBackHref || defaultBackHref;

  const isEn = pathname ? pathname.includes('/en/') || pathname.endsWith('/en') : false;

  return (
    /*
     * 最外層玻璃容器
     * - flex flex-col 明確指定垂直堆疊，確保 description 在 children 之上
     * - max-w-[90%] → 對應原版 glass-container max-width: 90%
     * - padding 對應原版 3.5rem 3rem
     */
    <div
      className={`
        tool-layout-container
        relative z-[1] w-full max-w-[90%] mx-auto
        flex flex-col
        bg-surface-glass border border-border-glass rounded-3xl
        backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)]
        shadow-[var(--glass-shadow)]
        px-12 pt-16 pb-14
        max-sm:px-5 max-sm:pt-12 max-sm:pb-10
        max-[768px]:max-w-[98%]
        transition-[max-width,width,padding,margin,border-radius] duration-500 ease-in-out
        ${containerClassName}
      `}
    >
      {/* ── 亮暗模式切換與頂欄右側功能按鈕組 ── */}
      <div className="absolute top-6 right-6 z-[20] flex items-center gap-2 max-sm:top-4 max-sm:right-4 max-sm:gap-1.5">
        {extraHeaderControls}
        {!hideThemeToggle && <ThemeToggle />}
      </div>

      {/* ── 返回按鈕 ── */}
      <Link
        href={targetBackHref}
        title={backTitle || backText || (isEn ? 'Back to Home' : '返回首頁')}
        aria-label={backTitle || backText || (isEn ? 'Back to Home' : '返回首頁')}
        onClick={(e) => {
          if (onBackClick) {
            e.preventDefault();
            onBackClick(e);
            return;
          }
          if (typeof window !== 'undefined' && pathname) {
            sessionStorage.setItem('lastVisitedTool', pathname);
          }
          if (typeof document !== 'undefined' && document.fullscreenElement) {
            document.exitFullscreen().catch(() => {});
          }
        }}
        className={`
          tool-back-btn
          absolute top-6 left-6 z-[11]
          inline-flex items-center gap-1.5 text-xs font-semibold
          h-[42px] rounded-xl
          ${compactBackBtn ? 'w-[42px] px-0 justify-center' : 'px-3.5'}
          bg-white/[.06] border border-white/10 backdrop-blur-md
          text-text-sub no-underline select-none
          transition-all duration-300 ease-out
          hover:text-text-main hover:border-[var(--tool-accent)] hover:bg-white/[.08]
          hover:shadow-[0_0_12px_var(--tool-glow)]
          hover:scale-105 active:scale-95
          w-fit self-start
          max-sm:top-4 max-sm:left-4
        `}
        style={
          {
            '--tool-accent': accentColor,
            '--tool-glow': accentGlow,
          } as React.CSSProperties
        }
      >
        <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor"
          className="transition-transform duration-300 group-hover:-translate-x-1 flex-shrink-0">
          <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
        </svg>
        {!compactBackBtn && <span>{backText || (isEn ? 'Back to Home' : '返回首頁')}</span>}
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

      {/* ── 頁尾贊助連結 (可透過 hideFooter 隱藏) ── */}
      {!hideFooter && (
        <div className="tool-layout-footer mt-12 pt-5 border-t border-white/[.06] flex items-center justify-center gap-2 text-xs text-text-sub">
          <span>{isEn ? 'Enjoying this tool?' : '喜歡這個小工具嗎？'}</span>
          <a
            href="https://donate.stripe.com/fZufZh4sI3xf4KheFc3ZK00?client_reference_id=smalltools"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-pink-400 hover:text-pink-300 hover:underline font-medium transition-colors"
          >
            <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {isEn ? 'Sponsor the Author ☕' : '贊助支持作者 ☕'}
          </a>
        </div>
      )}
    </div>
  );
}

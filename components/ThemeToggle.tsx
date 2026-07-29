'use client';

import React, { useEffect, useState } from 'react';
import { useTheme } from './ThemeProvider';

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const isLight = mounted && theme === 'light';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isLight ? '切換為暗色模式' : '切換為亮色模式'}
      aria-label={isLight ? '切換為暗色模式' : '切換為亮色模式'}
      className={`
        theme-toggle-btn
        relative inline-flex items-center justify-center gap-2
        p-2.5 rounded-xl
        bg-white/[.06] border border-white/10
        text-text-sub hover:text-text-main
        backdrop-blur-md
        transition-all duration-300 ease-out
        hover:scale-105 active:scale-95
        hover:border-[var(--theme-color)] hover:shadow-[0_0_12px_var(--theme-glow)]
        cursor-pointer select-none
        ${className}
      `}
    >
      <div className="relative w-5 h-5 flex items-center justify-center overflow-hidden">
        {/* 太陽圖示 (亮色模式) */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`
            w-5 h-5 text-amber-500 absolute transition-all duration-500 ease-in-out
            ${isLight ? 'rotate-0 scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0'}
          `}
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </svg>

        {/* 月亮圖示 (暗色模式) */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`
            w-5 h-5 text-cyan-400 absolute transition-all duration-500 ease-in-out
            ${!isLight ? 'rotate-0 scale-100 opacity-100' : 'rotate-90 scale-0 opacity-0'}
          `}
        >
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        </svg>
      </div>

      <span className="text-xs font-semibold tracking-wider uppercase hidden sm:inline-block">
        {mounted ? (isLight ? '亮色' : '暗色') : '主題'}
      </span>
    </button>
  );
}

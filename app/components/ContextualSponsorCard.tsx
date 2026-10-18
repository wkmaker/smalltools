'use client';

import React from 'react';
import { STRIPE_DONATION_URL } from '../config/sponsors';
import styles from './sponsor.module.css';

interface ContextualSponsorCardProps {
  title: string;
  description: string;
  buttonText: string;
  lang?: 'zh-TW' | 'en';
  accentColor?: string;
  className?: string;
}

/**
 * 場景化高光贊助小卡 (Contextual Sponsor Card)
 * 適用於各工具計算結果完成、提供高情緒價值之瞬間
 * 遵循 Smalltools 設計系統：毛玻璃、雙主題響應、零原生 Emoji、WCAG AA
 */
export function ContextualSponsorCard({
  title,
  description,
  buttonText,
  lang = 'zh-TW',
  accentColor = '#f43f5e',
  className = '',
}: ContextualSponsorCardProps) {
  const isEn = lang === 'en';

  return (
    <aside
      aria-label={isEn ? 'Support the Author' : '支持作者'}
      className={`${styles.sponsorCard} ${className}`}
    >
      {/* 輕微漸層光暈裝飾背景 */}
      <div
        className="pointer-events-none absolute -top-16 -right-16 h-36 w-36 rounded-full opacity-15 blur-2xl transition-opacity duration-300"
        style={{ backgroundColor: accentColor }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* 左側：圖示與標題內文 */}
        <div className="flex items-start gap-3.5">
          {/* 精緻咖啡杯向量圖示 */}
          <div className={styles.sponsorIconWrap} aria-hidden="true">
            <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor">
              <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z" />
            </svg>
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <h4 className="text-sm md:text-base font-semibold text-text-main flex items-center gap-2">
              <span>{title}</span>
              {/* 微小心形脈動圖示 */}
              <span className={styles.sponsorIconWrap} style={{ width: '1.25rem', height: '1.25rem', padding: 0 }} aria-hidden="true">
                <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
              </span>
            </h4>
            <p className="text-xs md:text-sm text-text-sub leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* 右側：贊助按鈕 */}
        <div className="shrink-0 self-start md:self-center">
          <a
            href={STRIPE_DONATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={buttonText}
            aria-label={`${buttonText} (${isEn ? 'Opens Stripe checkout in new window' : '在新分頁開啟 Stripe 結帳頁'})`}
            className={styles.sponsorBtn}
          >
            <span>{buttonText}</span>
            {/* 外部連結箭頭向量圖示 */}
            <svg
              viewBox="0 0 24 24"
              width={14}
              height={14}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </a>
        </div>
      </div>
    </aside>
  );
}

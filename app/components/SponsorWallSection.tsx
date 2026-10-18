'use client';

import React from 'react';
import { SPONSORS, SPONSOR_CONFIG, STRIPE_DONATION_URL } from '../config/sponsors';
import styles from './sponsor.module.css';

interface SponsorWallSectionProps {
  lang?: 'zh-TW' | 'en';
}

/**
 * 首頁贊助者芳名錄區塊 (Sponsor Wall Section)
 * 具備儀式感的「創始空狀態」與「名單展現」，激勵早期使用者破冰贊助
 * 嚴格遵循全站規範：零原生 Emoji、SVG 向量呈現、WCAG AA 亮暗色彩對稱
 */
export function SponsorWallSection({ lang = 'zh-TW' }: SponsorWallSectionProps) {
  const isEn = lang === 'en';
  const conf = SPONSOR_CONFIG[lang] || SPONSOR_CONFIG['zh-TW'];
  const hasSponsors = SPONSORS.length > 0;

  return (
    <section
      aria-labelledby="sponsor-wall-heading"
      className="w-full mt-14 pt-8 border-t border-white/[.08] flex flex-col items-center gap-6"
    >
      {/* 標題與簡介 */}
      <div className="flex flex-col items-center text-center gap-2 max-w-2xl px-4">
        <div className={styles.sponsorBadge}>
          {/* 星星向量圖示 */}
          <svg viewBox="0 0 24 24" width={13} height={13} fill="currentColor" aria-hidden="true">
            <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
          </svg>
          <span>{conf.wallTitle}</span>
        </div>
        <h2 id="sponsor-wall-heading" className="text-xl md:text-2xl font-bold text-text-main tracking-tight">
          {conf.wallTitle}
        </h2>
        <p className="text-xs md:text-sm text-text-sub leading-relaxed">
          {conf.wallSubtitle}
        </p>
      </div>

      {/* 內容區：依據是否有贊助者切換展示 */}
      {!hasSponsors ? (
        /* 空狀態：創始人激勵卡片 */
        <div className={styles.sponsorWallCard}>
          {/* 背景微光 */}
          <div
            className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-80 h-32 rounded-full blur-3xl opacity-20"
            style={{ backgroundColor: '#f43f5e' }}
            aria-hidden="true"
          />

          {/* 創始咖啡杯圖示 */}
          <div className={styles.sponsorIconWrap} style={{ width: '3.5rem', height: '3.5rem', borderRadius: '1rem' }} aria-hidden="true">
            <svg viewBox="0 0 24 24" width={28} height={28} fill="currentColor">
              <path d="M20 3H4v10c0 2.21 1.79 4 4 4h6c2.21 0 4-1.79 4-4v-3h2c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 5h-2V5h2v3zM4 19h16v2H4z" />
            </svg>
          </div>

          <div className="flex flex-col gap-2 max-w-lg z-10">
            <h3 className="text-base md:text-lg font-bold text-text-main flex items-center justify-center gap-2">
              <span>{conf.emptyTitle}</span>
            </h3>
            <p className="text-xs md:text-sm text-text-sub leading-relaxed">
              {conf.emptyDesc}
            </p>
          </div>

          {/* 創始贊助行動按鈕 */}
          <a
            href={STRIPE_DONATION_URL}
            target="_blank"
            rel="noopener noreferrer"
            title={conf.emptyBtn}
            aria-label={`${conf.emptyBtn} (${isEn ? 'Opens Stripe checkout in new window' : '在新分頁開啟 Stripe 結帳頁'})`}
            className={styles.sponsorHeroBtn}
          >
            {/* 心形圖示 */}
            <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor" aria-hidden="true">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            <span>{conf.emptyBtn}</span>
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
      ) : (
        /* 非空狀態：贊助者清單網格 */
        <div className="w-full max-w-4xl flex flex-col gap-5">
          <div className="flex items-center justify-between text-xs text-text-sub px-1">
            <span>{conf.countBadge(SPONSORS.length)}</span>
            <a
              href={STRIPE_DONATION_URL}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.sponsorBtn}
            >
              <span>{conf.ctaBtn}</span>
              <svg viewBox="0 0 24 24" width={12} height={12} fill="currentColor" aria-hidden="true">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </a>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {SPONSORS.map((sponsor) => (
              <div
                key={sponsor.id}
                className={styles.sponsorItemCard}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-sm text-text-main truncate">
                    {sponsor.name || conf.anonymous}
                  </span>
                  {sponsor.amount && (
                    <span className={styles.sponsorAmountTag}>
                      {sponsor.amount}
                    </span>
                  )}
                </div>

                {sponsor.message && (
                  <p className="text-xs text-text-sub leading-relaxed line-clamp-3 italic">
                    &ldquo;{sponsor.message}&rdquo;
                  </p>
                )}

                <div className="flex items-center justify-between text-xs text-text-sub opacity-75 font-mono pt-2 border-t border-white/[.05]">
                  <span>{sponsor.date}</span>
                  {sponsor.tool && <span className="truncate max-w-[120px]">{sponsor.tool}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

/**
 * FaqSection.tsx
 * ──────────────────────────────────────────────────────────────
 * 全站工具頁面共用 FAQ 手風琴組件
 * 支援整區折疊/展開 (Master Collapsible)
 * 支援亮/暗雙主題高對比度降階適配 (WCAG 2.1 AA Compliant)
 */

'use client';

import { useState } from 'react';
import type { FaqItem } from '@/app/utils/faqSchema';
import styles from './FaqSection.module.css';

export type { FaqItem };

export interface FaqSectionProps {
  items: FaqItem[];
  title?: string;
  subtitle?: string;
  accentColor?: string;
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * 亮色模式高對比度主題色降階對照表 (WCAG 2.1 AA 規範)
 */
export function getLightModeAccentColor(darkColor: string): string {
  const map: Record<string, string> = {
    '#00ff66': '#059669', // Emerald 600
    '#00f5a0': '#059669', // Emerald 600
    '#00ffaa': '#0d9488', // Teal 600
    '#4ade80': '#16a34a', // Green 600
    '#a3e635': '#65a30d', // Lime 600
    '#00f0ff': '#0284c7', // Sky 600
    '#0077ff': '#0369a1', // Sky 700
    '#6366f1': '#4338ca', // Indigo 700
    '#8b5cf6': '#7c3aed', // Violet 600
    '#ffb800': '#d97706', // Amber 600
    '#eab308': '#ca8a04', // Yellow 600
    '#ff7300': '#ea580c', // Orange 600
    '#ff00aa': '#c026d3', // Fuchsia 600
    '#ff007f': '#be185d', // Pink 700
    '#d946ef': '#c026d3', // Fuchsia 600
    '#ff3b30': '#dc2626', // Red 600
    '#ff5252': '#b91c1c', // Red 700
  };
  return map[darkColor.toLowerCase()] || darkColor;
}

function renderAnswerWithLinks(text: string) {
  const tokenRegex = /(\[[^\]]+\]\(https?:\/\/[^\s\)]+\)|https?:\/\/[^\s\)\n]+)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, i) => {
    const mdMatch = part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)$/);
    if (mdMatch) {
      const linkText = mdMatch[1];
      const linkUrl = mdMatch[2];
      return (
        <a
          key={i}
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-semibold hover:opacity-80 transition-opacity"
          style={{ color: 'var(--faq-accent-dark)' }}
        >
          {linkText}
        </a>
      );
    }

    if (part.match(/^https?:\/\//)) {
      return (
        <a
          key={i}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="underline font-medium hover:opacity-80 transition-opacity break-all"
          style={{ color: 'var(--faq-accent-dark)' }}
        >
          {part}
        </a>
      );
    }

    return part;
  });
}

export default function FaqSection({
  items,
  title = '常問問題與專業指南 (FAQ)',
  subtitle,
  accentColor = '#00ff66',
  defaultExpanded = false,
  className = '',
}: FaqSectionProps) {
  const [isExpanded, setIsExpanded] = useState<boolean>(defaultExpanded);
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  if (!items || items.length === 0) return null;

  const lightAccent = getLightModeAccentColor(accentColor);

  const containerStyle = {
    '--faq-accent-dark': accentColor,
    '--faq-accent-light': lightAccent,
    '--faq-glow-dark': `${accentColor}25`,
  } as React.CSSProperties;

  // 判斷是否為中文介面
  const isChinese = /[\u4e00-\u9fa5]/.test(title);
  const badgeText = isChinese ? `${items.length} 則問答` : `${items.length} Q&As`;
  const actionText = isExpanded
    ? (isChinese ? '收合' : 'Collapse')
    : (isChinese ? '展開問答' : 'Expand FAQ');

  return (
    <div
      className={`${styles.faqContainer} ${!isExpanded ? styles.faqContainerCollapsed : ''} ${className}`}
      style={containerStyle}
      onClick={() => {
        if (!isExpanded) setIsExpanded(true);
      }}
    >
      {/* FAQ 主折疊控制 Header */}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsExpanded((prev) => !prev);
        }}
        className={`${styles.faqMasterHeader} ${isExpanded ? styles.faqHeaderExpanded : ''}`}
        aria-expanded={isExpanded}
      >
        <div className={styles.faqTitleGroup}>
          <h2 className={styles.faqTitle}>
            <svg
              viewBox="0 0 24 24"
              className={styles.titleIcon}
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>{title}</span>
            <span className={styles.faqBadge}>{badgeText}</span>
          </h2>
          {isExpanded && subtitle && <p className={styles.faqSubtitle}>{subtitle}</p>}
        </div>

        <div className={styles.faqMasterAction}>
          <div className={styles.faqMasterActionBtn}>
            <span>{actionText}</span>
            <svg
              viewBox="0 0 24 24"
              className={`${styles.masterChevron} ${isExpanded ? styles.masterChevronExpanded : ''}`}
            >
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
            </svg>
          </div>
        </div>
      </button>

      {/* 手風琴列表（展開時呈現） */}
      {isExpanded && (
        <div className={styles.faqList}>
          {items.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`${styles.faqItem} ${isOpen ? styles.faqItemActive : ''}`}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className={styles.faqQuestionBtn}
                >
                  <span>{item.q}</span>
                  <svg
                    viewBox="0 0 24 24"
                    className={`${styles.faqIcon} ${isOpen ? styles.faqIconActive : ''}`}
                  >
                    <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6z" />
                  </svg>
                </button>

                {isOpen && (
                  <div className={styles.faqAnswer}>
                    {typeof item.a === 'string' ? renderAnswerWithLinks(item.a) : item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}



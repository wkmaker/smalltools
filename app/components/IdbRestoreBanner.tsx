'use client';

import type { ReactNode } from 'react';
import styles from './IdbRestoreBanner.module.css';

export interface IdbRestoreBannerProps {
  title: string;
  description: string;
  restoreLabel?: string;
  onRestore?: () => void;
  clearLabel: string;
  onClear: () => void;
  headingAs?: 'div' | 'h2' | 'h3' | 'h4';
  children?: ReactNode;
}

export default function IdbRestoreBanner({
  title,
  description,
  restoreLabel,
  onRestore,
  clearLabel,
  onClear,
  headingAs: HeadingTag = 'div',
  children,
}: IdbRestoreBannerProps) {
  return (
    <div className={styles.bannerCard} role="region" aria-label={title}>
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          <div className={styles.iconBadge} aria-hidden="true">
            <svg viewBox="0 0 24 24" width={18} height={18} fill="none" stroke="currentColor" strokeWidth={2}>
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <HeadingTag className="text-sm font-semibold text-text-main truncate">{title}</HeadingTag>
            <p className="text-xs text-text-sub mt-0.5 leading-relaxed break-words">{description}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          {onRestore && restoreLabel && (
            <button type="button" onClick={onRestore} className={styles.restoreBtn}>
              <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden="true">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              <span>{restoreLabel}</span>
            </button>
          )}
          <button type="button" onClick={onClear} className={styles.clearBtn}>
            <svg viewBox="0 0 24 24" width={15} height={15} fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            <span>{clearLabel}</span>
          </button>
        </div>
      </div>

      {children && <div className="pt-2 border-t border-border-glass">{children}</div>}
    </div>
  );
}

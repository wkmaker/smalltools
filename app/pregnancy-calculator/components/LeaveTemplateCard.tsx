'use client';

import React from 'react';
import styles from '../pregnancy-calculator.module.css';

interface LeaveTemplateCardProps {
  t: any;
  leaveApplicationTemplate: string;
  isTemplateExpanded: boolean;
  setIsTemplateExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  copiedToast: boolean;
  onCopyTemplate: () => void;
}

export default function LeaveTemplateCard({
  t,
  leaveApplicationTemplate,
  isTemplateExpanded,
  setIsTemplateExpanded,
  copiedToast,
  onCopyTemplate,
}: LeaveTemplateCardProps) {
  return (
    <div className={styles.glassCard}>
      <div
        className="flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
        onClick={() => setIsTemplateExpanded((prev) => !prev)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsTemplateExpanded((prev) => !prev);
          }
        }}
      >
        <div className="flex flex-col">
          <h2 className={styles.cardTitle} style={{ marginBottom: 0 }}>
            <svg viewBox="0 0 24 24" width={20} height={20} fill="currentColor" className={styles.accentText}>
              <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
            </svg>
            {t.templateTitle}
          </h2>
          {!isTemplateExpanded && (
            <span className="text-xs text-text-sub mt-1">
              {t.templateToggleDesc}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-text-sub">
            {isTemplateExpanded ? t.btnCollapse : t.btnExpand}
          </span>
          <div
            className={`w-7 h-7 rounded-lg bg-surface-glass border border-border-glass flex items-center justify-center text-text-sub transition-transform duration-200 ${
              isTemplateExpanded ? 'rotate-180' : ''
            }`}
          >
            <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
              <path d="M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z" />
            </svg>
          </div>
        </div>
      </div>

      {isTemplateExpanded && (
        <div className="mt-4 pt-4 border-t border-border-glass flex flex-col gap-3">
          <div className="flex justify-end">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onCopyTemplate();
              }}
              className={`${styles.accentBtn} cursor-pointer`}
            >
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z" />
              </svg>
              {t.templateCopyBtn}
            </button>
          </div>

          {copiedToast && (
            <div className={`mb-2 ${styles.copiedToastBanner}`}>
              <svg viewBox="0 0 24 24" width={16} height={16} fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
              </svg>
              {t.copiedSuccess}
            </div>
          )}

          <div className={styles.templateBox}>{leaveApplicationTemplate}</div>
        </div>
      )}
    </div>
  );
}

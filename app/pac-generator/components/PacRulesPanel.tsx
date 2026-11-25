'use client';

import React from 'react';
import styles from '../pac-generator.module.css';
import { ProxyNode, RoutingRule, RuleCondition } from '../types';
import { formatProxyString } from '../engine';
import { TRANSLATIONS } from '../translations';
import RuleCard from '../RuleCard';

type PacTranslations = (typeof TRANSLATIONS)[keyof typeof TRANSLATIONS];

interface PacRulesPanelProps {
  t: PacTranslations;
  isEn: boolean;
  proxies: ProxyNode[];
  rules: RoutingRule[];
  defaultAction: string;
  enableIpv6: boolean;
  resolveIpFirst: boolean;
  importWarnings: string[] | null;
  draggedRuleIndex: number | null;
  dropTargetIndex: number | null;
  setDraggedRuleIndex: React.Dispatch<React.SetStateAction<number | null>>;
  setDropTargetIndex: React.Dispatch<React.SetStateAction<number | null>>;
  onClearRules: () => void;
  onAddRule: () => void;
  onDismissWarnings: () => void;
  onReorderRule: (fromIdx: number, toIdx: number) => void;
  onDropAtIndex: (targetIndex: number) => void;
  onUpdateRule: (id: string, updates: Partial<RoutingRule>) => void;
  onDeleteRule: (id: string) => void;
  onAddAndCondition: (ruleId: string) => void;
  onUpdateAndCondition: (ruleId: string, index: number, updates: Partial<RuleCondition>) => void;
  onRemoveAndCondition: (ruleId: string, index: number) => void;
  onDefaultActionChange: (val: string) => void;
  onEnableIpv6Change: (val: boolean) => void;
  onResolveIpFirstChange: (val: boolean) => void;
}

export default function PacRulesPanel({
  t,
  isEn,
  proxies,
  rules,
  defaultAction,
  enableIpv6,
  resolveIpFirst,
  importWarnings,
  draggedRuleIndex,
  dropTargetIndex,
  setDraggedRuleIndex,
  setDropTargetIndex,
  onClearRules,
  onAddRule,
  onDismissWarnings,
  onReorderRule,
  onDropAtIndex,
  onUpdateRule,
  onDeleteRule,
  onAddAndCondition,
  onUpdateAndCondition,
  onRemoveAndCondition,
  onDefaultActionChange,
  onEnableIpv6Change,
  onResolveIpFirstChange,
}: PacRulesPanelProps) {
  return (
    <>
      {/* 規則清單 */}
      <div className={styles.panel}>
        <div className={styles.sectionHeader}>
          <div className={styles.sectionTitle}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
            </svg>
            <span>{t.rulesTitle} ({rules.length})</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            {rules.length > 0 && (
              <button
                type="button"
                onClick={onClearRules}
                className={styles.ghostButton}
                title={t.clearRulesBtn}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                </svg>
                <span>{t.clearRulesBtn}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onAddRule}
              className={`${styles.actionButton} ${styles.secondaryButton}`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
              </svg>
              <span>{t.addRuleBtn}</span>
            </button>
          </div>
        </div>

        {importWarnings && importWarnings.length > 0 && (
          <div className={styles.ruleWarningBar} role="alert" style={{ marginBottom: '0.75rem', alignItems: 'flex-start' }}>
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="currentColor"
              className={styles.ruleWarningIcon}
              aria-hidden="true"
              style={{ marginTop: '0.15rem', flexShrink: 0 }}
            >
              <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
            </svg>
            <div className="flex-1 min-w-0">
              <p className={styles.ruleWarningText}>{t.importWarningsTitle}</p>
              <ul className="mt-1 list-disc list-inside space-y-0.5">
                {importWarnings.map((w, i) => (
                  <li key={i} className={styles.ruleWarningText} style={{ fontWeight: 400 }}>{w}</li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={onDismissWarnings}
              aria-label={t.dismissBtn}
              className="shrink-0 text-text-sub hover:text-text-main transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>
        )}

        <div
          className="flex flex-col gap-3"
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
              setDropTargetIndex(null);
            }
          }}
        >
          {rules.map((rule, idx) => (
            <RuleCard
              key={rule.id}
              rule={rule}
              idx={idx}
              rulesLength={rules.length}
              t={t}
              isEn={isEn}
              proxies={proxies}
              draggedRuleIndex={draggedRuleIndex}
              dropTargetIndex={dropTargetIndex}
              setDraggedRuleIndex={setDraggedRuleIndex}
              setDropTargetIndex={setDropTargetIndex}
              onReorder={onReorderRule}
              onDropAtIndex={onDropAtIndex}
              onUpdateRule={onUpdateRule}
              onDeleteRule={onDeleteRule}
              onAddAndCondition={onAddAndCondition}
              onUpdateAndCondition={onUpdateAndCondition}
              onRemoveAndCondition={onRemoveAndCondition}
            />
          ))}
        </div>

        {/* 預設行為 */}
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-sm font-semibold text-text-main">{t.defaultActionTitle}：</span>
          <select
            value={defaultAction}
            onChange={(e) => onDefaultActionChange(e.target.value)}
            className="text-sm bg-select-bg border border-white/10 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:border-[var(--theme-color)] sm:max-w-xs"
          >
            <option value="DIRECT">{t.directOption}</option>
            {proxies.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({formatProxyString(p, proxies)})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 進階選項 */}
      <div className={styles.panel}>
        <div className={styles.sectionTitle}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
            <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z" />
          </svg>
          <span>{t.optionsTitle}</span>
        </div>
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={enableIpv6}
              onChange={(e) => onEnableIpv6Change(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 accent-[var(--theme-color)]"
            />
            <span className="text-sm text-text-sub">{t.enableIpv6Label}</span>
          </label>
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={resolveIpFirst}
              onChange={(e) => onResolveIpFirstChange(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 accent-[var(--theme-color)]"
            />
            <span className="text-sm text-text-sub">{t.resolveIpFirstLabel}</span>
          </label>
        </div>
      </div>
    </>
  );
}

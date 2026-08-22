'use client';

import React, { useState, useEffect, useRef } from 'react';
import { SanitizeRules } from '../types';
import { ShieldIcon } from './Icons';
import styles from '../har-cleaner.module.css';

interface RuleConfigPanelProps {
  rules: SanitizeRules;
  customKeywordsId: string;
  redactionTextId: string;
  t: any;
  onRulesChange: (newRules: SanitizeRules) => void;
}

export default function RuleConfigPanel({
  rules,
  customKeywordsId,
  redactionTextId,
  t,
  onRulesChange,
}: RuleConfigPanelProps) {
  // 本地輸入緩存，配合 Debounce 防抖，防止連續打字時頻繁重算卡死主執行緒
  const [localCustomKeywords, setLocalCustomKeywords] = useState(rules.customKeywords);
  const [localRedactionText, setLocalRedactionText] = useState(rules.redactionText);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // 當外部 rules 被重設或改變時同步本地狀態
  useEffect(() => {
    setLocalCustomKeywords(rules.customKeywords);
  }, [rules.customKeywords]);

  useEffect(() => {
    setLocalRedactionText(rules.redactionText);
  }, [rules.redactionText]);

  const triggerDebouncedUpdate = (updatedValues: Partial<SanitizeRules>) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onRulesChange({
        ...rules,
        ...updatedValues,
      });
    }, 300);
  };

  const handleCheckboxChange = (field: keyof SanitizeRules, value: boolean) => {
    onRulesChange({
      ...rules,
      [field]: value,
    });
  };

  const handleCustomKeywordsChange = (val: string) => {
    setLocalCustomKeywords(val);
    triggerDebouncedUpdate({ customKeywords: val });
  };

  const handleRedactionTextChange = (val: string) => {
    setLocalRedactionText(val);
    triggerDebouncedUpdate({ redactionText: val });
  };

  return (
    <div className="w-full rounded-2xl p-6 bg-surface-glass border border-border-glass space-y-4">
      <div className="flex items-center justify-between border-b border-border-glass pb-3">
        <h2 className="text-base font-semibold text-text-main flex items-center gap-2">
          <ShieldIcon />
          <span>{t.rulesTitle}</span>
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Rule 1: Auth Headers */}
        <div className={styles.ruleCard}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rules.authHeaders}
              onChange={(e) => handleCheckboxChange('authHeaders', e.target.checked)}
              className="mt-1 rounded accent-[var(--theme-color)]"
            />
            <div className="text-xs text-text-main leading-5 font-medium">{t.ruleAuthHeaders}</div>
          </label>
        </div>

        {/* Rule 2: Cookies */}
        <div className={styles.ruleCard}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rules.cookies}
              onChange={(e) => handleCheckboxChange('cookies', e.target.checked)}
              className="mt-1 rounded accent-[var(--theme-color)]"
            />
            <div className="text-xs text-text-main leading-5 font-medium">{t.ruleCookies}</div>
          </label>
        </div>

        {/* Rule 3: Query Params */}
        <div className={styles.ruleCard}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rules.queryParams}
              onChange={(e) => handleCheckboxChange('queryParams', e.target.checked)}
              className="mt-1 rounded accent-[var(--theme-color)]"
            />
            <div className="text-xs text-text-main leading-5 font-medium">{t.ruleQueryParams}</div>
          </label>
        </div>

        {/* Rule 4: POST Data */}
        <div className={styles.ruleCard}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rules.postData}
              onChange={(e) => handleCheckboxChange('postData', e.target.checked)}
              className="mt-1 rounded accent-[var(--theme-color)]"
            />
            <div className="text-xs text-text-main leading-5 font-medium">{t.rulePostData}</div>
          </label>
        </div>

        {/* Rule 5: Credit Cards & Payment (PCI-DSS) */}
        <div className={styles.ruleCard}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rules.creditCard}
              onChange={(e) => handleCheckboxChange('creditCard', e.target.checked)}
              className="mt-1 rounded accent-[var(--theme-color)]"
            />
            <div className="text-xs text-text-main leading-5 font-medium">{t.ruleCreditCard}</div>
          </label>
        </div>

        {/* Rule 6: Regex Deep Scan */}
        <div className={styles.ruleCard}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rules.regexDeep}
              onChange={(e) => handleCheckboxChange('regexDeep', e.target.checked)}
              className="mt-1 rounded accent-[var(--theme-color)]"
            />
            <div className="text-xs text-text-main leading-5 font-medium">{t.ruleRegexDeep}</div>
          </label>
        </div>

        {/* Rule 7: Strip Media */}
        <div className={styles.ruleCard}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rules.stripMedia}
              onChange={(e) => handleCheckboxChange('stripMedia', e.target.checked)}
              className="mt-1 rounded accent-[var(--theme-color)]"
            />
            <div className="text-xs text-text-main leading-5 font-medium">{t.ruleStripMedia}</div>
          </label>
        </div>

        {/* Rule 8: Strip Trackers */}
        <div className={styles.ruleCard}>
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={rules.stripTrackers}
              onChange={(e) => handleCheckboxChange('stripTrackers', e.target.checked)}
              className="mt-1 rounded accent-[var(--theme-color)]"
            />
            <div className="text-xs text-text-main leading-5 font-medium">{t.ruleStripTrackers}</div>
          </label>
        </div>
      </div>

      {/* Custom Keywords & Replacement String */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border-glass">
        <div>
          <label htmlFor={customKeywordsId} className="block text-xs text-text-sub font-medium mb-1.5">
            {t.customKeywordsLabel}
          </label>
          <input
            id={customKeywordsId}
            type="text"
            value={localCustomKeywords}
            onChange={(e) => handleCustomKeywordsChange(e.target.value)}
            placeholder={t.customKeywordsPlaceholder}
            className="w-full text-xs px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:outline-none focus:border-[var(--theme-color)]"
          />
        </div>
        <div>
          <label htmlFor={redactionTextId} className="block text-xs text-text-sub font-medium mb-1.5">
            {t.redactionTextLabel}
          </label>
          <input
            id={redactionTextId}
            type="text"
            value={localRedactionText}
            onChange={(e) => handleRedactionTextChange(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main font-mono focus:outline-none focus:border-[var(--theme-color)]"
          />
        </div>
      </div>
    </div>
  );
}

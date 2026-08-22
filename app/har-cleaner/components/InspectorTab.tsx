'use client';

import React, { useState, useMemo } from 'react';
import { HarEntryAnalysis } from '../types';
import { SearchIcon, ShieldIcon } from './Icons';
import { getEntryRuleCategoriesCount } from '../engine/sanitizer';
import styles from '../har-cleaner.module.css';

interface InspectorTabProps {
  entriesAnalysis: HarEntryAnalysis[];
  searchInputId: string;
  lang: 'zh-TW' | 'en';
  t: any;
  onSelectEntry: (entry: HarEntryAnalysis) => void;
}

const PAGE_SIZE = 50;

export default function InspectorTab({
  entriesAnalysis,
  searchInputId,
  lang,
  t,
  onSelectEntry,
}: InspectorTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [ruleCategoryFilter, setRuleCategoryFilter] = useState('ALL');
  const [sanitizedOnly, setSanitizedOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // 篩選請求
  const filteredEntries = useMemo(() => {
    return entriesAnalysis.filter((item) => {
      if (sanitizedOnly && !item.isSanitized) return false;
      const method = (item.cleaned.request?.method || 'GET').toUpperCase();
      if (methodFilter !== 'ALL' && method !== methodFilter) return false;
      const status = item.cleaned.response?.status || 0;
      if (statusFilter === '2xx' && (status < 200 || status >= 300)) return false;
      if (statusFilter === '3xx' && (status < 300 || status >= 400)) return false;
      if (statusFilter === '4xx' && (status < 400 || status >= 500)) return false;
      if (statusFilter === '5xx' && (status < 500 || status >= 600)) return false;

      // Rule Category Filter
      if (ruleCategoryFilter !== 'ALL') {
        if (ruleCategoryFilter === 'CLEAN_ONLY') {
          if (item.isSanitized) return false;
        } else {
          if (!item.isSanitized) return false;
          if (ruleCategoryFilter === 'AUTH_HEADER') {
            const hasAuth = item.reasons.some(
              (r) =>
                r.includes('Header') &&
                !r.includes('Custom') &&
                !r.includes('Regex') &&
                !r.includes('Cookie')
            );
            if (!hasAuth) return false;
          } else if (ruleCategoryFilter === 'COOKIES') {
            const hasCookie = item.reasons.some((r) => r.includes('Cookie'));
            if (!hasCookie) return false;
          } else if (ruleCategoryFilter === 'QUERY_PARAMS') {
            const hasQuery = item.reasons.some((r) => r.includes('Query'));
            if (!hasQuery) return false;
          } else if (ruleCategoryFilter === 'POST_PAYLOAD') {
            const hasPost = item.reasons.some((r) => r.includes('Post') || r.includes('JSON'));
            if (!hasPost) return false;
          } else if (ruleCategoryFilter === 'CREDIT_CARD') {
            const hasCard = item.reasons.some(
              (r) =>
                r.toLowerCase().includes('card') ||
                r.toLowerCase().includes('pci') ||
                r.toLowerCase().includes('payment')
            );
            if (!hasCard) return false;
          } else if (ruleCategoryFilter === 'CUSTOM_KEY') {
            const hasCustom = item.reasons.some((r) => r.includes('Custom'));
            if (!hasCustom) return false;
          } else if (ruleCategoryFilter === 'REGEX_DEEP') {
            const hasRegex = item.reasons.some((r) => r.includes('Regex'));
            if (!hasRegex) return false;
          } else if (ruleCategoryFilter === 'STRIP_MEDIA') {
            const hasMedia = item.reasons.some((r) => r.includes('Media Stripped'));
            if (!hasMedia) return false;
          }
        }
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const url = (item.cleaned.request?.url || '').toLowerCase();
        if (!url.includes(q) && !method.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [entriesAnalysis, sanitizedOnly, methodFilter, statusFilter, ruleCategoryFilter, searchQuery]);

  // 重設 visibleCount 當篩選條件改變
  React.useEffect(() => {
    setVisibleCount(PAGE_SIZE);
  }, [searchQuery, methodFilter, statusFilter, ruleCategoryFilter, sanitizedOnly]);

  const displayedEntries = useMemo(() => {
    return filteredEntries.slice(0, visibleCount);
  }, [filteredEntries, visibleCount]);

  const handleShowMore = () => {
    setVisibleCount((prev) => Math.min(prev + PAGE_SIZE, filteredEntries.length));
  };

  return (
    <div className="rounded-2xl p-6 bg-surface-glass border border-border-glass space-y-4">
      {/* 搜尋與篩選列 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[240px] relative">
          <label htmlFor={searchInputId} className="sr-only">
            {t.searchPlaceholder}
          </label>
          <div className="absolute left-3 top-2.5 text-text-sub pointer-events-none">
            <SearchIcon />
          </div>
          <input
            id={searchInputId}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full text-xs pl-9 pr-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:outline-none focus:border-[var(--theme-color)]"
          />
        </div>

        {/* Method Filter */}
        <select
          value={methodFilter}
          onChange={(e) => setMethodFilter(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:outline-none"
        >
          <option value="ALL">Method: ALL</option>
          <option value="GET">GET</option>
          <option value="POST">POST</option>
          <option value="PUT">PUT</option>
          <option value="DELETE">DELETE</option>
          <option value="PATCH">PATCH</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:outline-none"
        >
          <option value="ALL">Status: ALL</option>
          <option value="2xx">2xx Success</option>
          <option value="3xx">3xx Redirect</option>
          <option value="4xx">4xx Client Error</option>
          <option value="5xx">5xx Server Error</option>
        </select>

        {/* Redaction Rule Category Filter */}
        <select
          value={ruleCategoryFilter}
          onChange={(e) => setRuleCategoryFilter(e.target.value)}
          className="text-xs px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:outline-none"
        >
          <option value="ALL">{t.ruleFilterAll}</option>
          <option value="AUTH_HEADER">{t.ruleFilterAuth}</option>
          <option value="COOKIES">{t.ruleFilterCookies}</option>
          <option value="QUERY_PARAMS">{t.ruleFilterQuery}</option>
          <option value="POST_PAYLOAD">{t.ruleFilterPost}</option>
          <option value="CREDIT_CARD">{t.ruleFilterCard}</option>
          <option value="CUSTOM_KEY">{t.ruleFilterCustom}</option>
          <option value="REGEX_DEEP">{t.ruleFilterRegex}</option>
          <option value="STRIP_MEDIA">{t.ruleFilterMedia}</option>
          <option value="CLEAN_ONLY">{t.ruleFilterClean}</option>
        </select>

        {/* Toggle Sanitized Only */}
        <label className="flex items-center gap-2 text-xs text-text-main cursor-pointer select-none">
          <input
            type="checkbox"
            checked={sanitizedOnly}
            onChange={(e) => setSanitizedOnly(e.target.checked)}
            className="rounded accent-[var(--theme-color)]"
          />
          <span>{t.filterSanitizedOnly}</span>
        </label>
      </div>

      {/* 請求列表 */}
      {filteredEntries.length === 0 ? (
        <div className="py-12 text-center text-sm text-text-sub">{t.noMatchingEntries}</div>
      ) : (
        <div className="space-y-2 max-h-[520px] overflow-y-auto pr-1">
          {displayedEntries.map((item, idx) => {
            const method = item.cleaned.request?.method || 'GET';
            const status = item.cleaned.response?.status || 200;
            const url = item.cleaned.request?.url || '';
            const time = Math.round(item.cleaned.time || 0);

            let methodBadgeClass = styles.badgeGet;
            if (method === 'POST') methodBadgeClass = styles.badgePost;
            else if (method === 'PUT' || method === 'PATCH') methodBadgeClass = styles.badgePut;
            else if (method === 'DELETE') methodBadgeClass = styles.badgeDelete;

            let statusBadgeClass = styles.status2xx;
            if (status >= 300 && status < 400) statusBadgeClass = styles.status3xx;
            else if (status >= 400 && status < 500) statusBadgeClass = styles.status4xx;
            else if (status >= 500) statusBadgeClass = styles.status5xx;

            const ruleCount = getEntryRuleCategoriesCount(item.reasons);

            return (
              <div
                key={idx}
                onClick={() => onSelectEntry(item)}
                className={`${styles.entryRow} flex items-center justify-between gap-3`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className={`${styles.badgeMethod} ${methodBadgeClass}`}>{method}</span>
                  <span className={`${styles.statusBadge} ${statusBadgeClass}`}>{status}</span>
                  <span className="text-xs text-text-main font-mono truncate">{url}</span>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {item.isSanitized && (
                    <div className="flex items-center gap-1.5">
                      <span
                        className={styles.ruleHitBadge}
                        title={
                          lang === 'en'
                            ? `${ruleCount} rule categories triggered`
                            : `觸發 ${ruleCount} 類全域規則`
                        }
                      >
                        <ShieldIcon />
                        <span>
                          {lang === 'en'
                            ? `${ruleCount} ${ruleCount === 1 ? 'Rule' : 'Rules'}`
                            : `${ruleCount} 條規則`}
                        </span>
                      </span>
                      <span
                        className={styles.redactionCountBadge}
                        title={
                          lang === 'en'
                            ? `${item.reasons.length} sensitive fields/items redacted`
                            : `共脫敏 ${item.reasons.length} 個敏感欄位/項目`
                        }
                      >
                        <span>
                          {lang === 'en'
                            ? `${item.reasons.length} ${
                                item.reasons.length === 1 ? 'Redaction' : 'Redactions'
                              }`
                            : `${item.reasons.length} 項脫敏`}
                        </span>
                      </span>
                    </div>
                  )}
                  <span className="text-xs text-text-sub font-mono">{time}ms</span>
                </div>
              </div>
            );
          })}

          {/* 漸進加載按鈕 (避免數千 DOM 擠死瀏覽器) */}
          {visibleCount < filteredEntries.length && (
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleShowMore}
                className="text-xs px-4 py-2 rounded-xl bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors font-medium"
              >
                {lang === 'en'
                  ? `Show More (${filteredEntries.length - visibleCount} remaining)...`
                  : `載入更多 (尚有 ${filteredEntries.length - visibleCount} 筆)...`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

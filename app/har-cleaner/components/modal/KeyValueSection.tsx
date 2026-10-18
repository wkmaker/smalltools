'use client';

import React from 'react';
import { EyeIcon, EyeOffIcon } from '../Icons';
import styles from '../../har-cleaner.module.css';

interface KeyValueItem {
  name: string;
  value: string;
}

interface KeyValueSectionProps {
  title: string;
  items: KeyValueItem[] | undefined;
  originalItems?: KeyValueItem[] | undefined;
  redactionText: string;
  lang: 'zh-TW' | 'en';
  t: any;
  emptyText?: string;
  prefix: string;
  showOriginalMap: Record<string, boolean>;
  toggleShowOriginal: (key: string) => void;
  copiedField: string | null;
  copyText: (text: string, fieldId: string) => void;
}

export default function KeyValueSection({
  title,
  items,
  originalItems,
  redactionText,
  lang,
  t,
  emptyText,
  prefix,
  showOriginalMap,
  toggleShowOriginal,
  copiedField,
  copyText,
}: KeyValueSectionProps) {
  if (!items || items.length === 0) {
    if (!emptyText) return null;
    return (
      <div className="space-y-2">
        <div className="text-xs font-semibold text-text-main">{title}</div>
        <div className="p-3 rounded-xl bg-select-bg border border-border-glass text-xs text-text-sub text-center">
          {emptyText}
        </div>
      </div>
    );
  }

  const findOriginalValue = (item: KeyValueItem, idx: number): string => {
    if (!originalItems) return item.value;
    const match = originalItems.find(
      (orig) => (orig.name || '').toLowerCase() === (item.name || '').toLowerCase()
    );
    return (match ?? originalItems[idx])?.value ?? item.value;
  };

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-text-main">{title}</div>

      {/* 手機版：直式卡片清單 */}
      <div className="block sm:hidden space-y-2">
        {items.map((item, idx) => {
          const isRedacted = item.value === redactionText;
          const origVal = findOriginalValue(item, idx);
          const rowKey = `${prefix}_${idx}`;
          const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

          return (
            <div
              key={idx}
              className="p-3 rounded-xl bg-select-bg border border-border-glass space-y-1.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono font-bold text-xs text-text-main break-all">
                  {item.name}
                </span>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {isRedacted && (
                    <button
                      type="button"
                      onClick={() => toggleShowOriginal(rowKey)}
                      className={`${styles.copyMiniBtn} ${
                        isShowingOriginal ? styles.modalTabBtnActive : ''
                      }`}
                      title={
                        isShowingOriginal
                          ? lang === 'en'
                            ? 'Hide original value'
                            : '隱藏原值'
                          : lang === 'en'
                          ? 'Show original value'
                          : '查看原值'
                      }
                    >
                      {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() =>
                      copyText(isShowingOriginal ? origVal : item.value, rowKey)
                    }
                    className={styles.copyMiniBtn}
                  >
                    {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                  </button>
                </div>
              </div>
              <div className="font-mono text-xs">
                {isShowingOriginal ? (
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`${styles.badgeOriginal} select-all break-all`}>
                      {origVal || '(empty)'}
                    </span>
                    <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                      {lang === 'en' ? 'Original' : '原值'}
                    </span>
                  </div>
                ) : (
                  <span
                    className={isRedacted ? styles.redactedValue : 'text-text-main break-all'}
                  >
                    {item.value}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 平板與電腦版：表格 */}
      <div className="hidden sm:block rounded-xl border border-border-glass bg-select-bg overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className={`${styles.kvTable} min-w-[500px]`}>
            <thead>
              <tr>
                <th className="w-1/4 min-w-[120px]">{t.modalNameCol}</th>
                <th className="w-auto">{t.modalValueCol}</th>
                <th className="w-28 min-w-[90px] text-right whitespace-nowrap">
                  {t.modalActionCol}
                </th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const isRedacted = item.value === redactionText;
                const origVal = findOriginalValue(item, idx);
                const rowKey = `${prefix}_${idx}`;
                const isShowingOriginal = isRedacted && !!showOriginalMap[rowKey];

                return (
                  <tr
                    key={idx}
                    className="border-b border-border-glass/40 hover:bg-white/[0.02]"
                  >
                    <td className="font-mono font-medium text-text-main align-middle">
                      {item.name}
                    </td>
                    <td className="font-mono align-middle">
                      {isShowingOriginal ? (
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`${styles.badgeOriginal} select-all break-all`}>
                            {origVal || '(empty)'}
                          </span>
                          <span className="text-xs text-text-sub font-normal px-1.5 py-0.5 rounded bg-surface-glass border border-border-glass">
                            {lang === 'en' ? 'Original' : '原值'}
                          </span>
                        </div>
                      ) : (
                        <span
                          className={
                            isRedacted ? styles.redactedValue : 'text-text-main break-all'
                          }
                        >
                          {item.value}
                        </span>
                      )}
                    </td>
                    <td className="w-28 min-w-[90px] text-right whitespace-nowrap align-middle">
                      <div className="flex items-center justify-end gap-1.5">
                        {isRedacted && (
                          <button
                            type="button"
                            onClick={() => toggleShowOriginal(rowKey)}
                            className={`${styles.copyMiniBtn} ${
                              isShowingOriginal ? styles.modalTabBtnActive : ''
                            }`}
                            title={
                              isShowingOriginal
                                ? lang === 'en'
                                  ? 'Hide original value'
                                  : '隱藏原值'
                                : lang === 'en'
                                ? 'Show original value'
                                : '查看原值'
                            }
                          >
                            {isShowingOriginal ? <EyeOffIcon /> : <EyeIcon />}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            copyText(isShowingOriginal ? origVal : item.value, rowKey)
                          }
                          className={styles.copyMiniBtn}
                        >
                          {copiedField === rowKey ? t.copiedSingle : t.copyBtnText}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

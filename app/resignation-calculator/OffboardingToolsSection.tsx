'use client';

import React, { useState, useEffect, useId } from 'react';
import styles from './resignation-calculator.module.css';
import type { ResignationTranslations } from './translations';
import type { EmailTemplateVariant } from './icsExport';
import type { ResignationType } from './engine';

interface Props {
  t: ResignationTranslations;
  resignationType: ResignationType;
  emailVariant: EmailTemplateVariant;
  onChangeEmailVariant: (v: EmailTemplateVariant) => void;
  senderName: string;
  onChangeSenderName: (v: string) => void;
  handoverPerson: string;
  onChangeHandoverPerson: (v: string) => void;
  emailTemplateText: string;
  onCopyEmail: () => void;
}

const CHECKLIST_STORAGE_KEY = 'smalltools_resignation_checklist_v1';

export default function OffboardingToolsSection({
  t,
  resignationType,
  emailVariant,
  onChangeEmailVariant,
  senderName,
  onChangeSenderName,
  handoverPerson,
  onChangeHandoverPerson,
  emailTemplateText,
  onCopyEmail,
}: Props) {
  const senderNameInputId = useId();
  const handoverPersonInputId = useId();
  const emailTextareaId = useId();

  const [checkedIds, setCheckedIds] = useState<string[]>([]);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(CHECKLIST_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          setCheckedIds(parsed.filter((x): x is string => typeof x === 'string'));
        }
      }
    } catch {
      // localStorage 無法讀取時安全退回空陣列
    }
  }, []);

  const toggleCheckItem = (id: string) => {
    setCheckedIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((item) => item !== id)
        : [...prev, id];
      try {
        window.localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // 忽略無痕模式配額例外
      }
      return next;
    });
  };

  const resetChecklist = () => {
    setCheckedIds([]);
    try {
      window.localStorage.removeItem(CHECKLIST_STORAGE_KEY);
    } catch {
      // 忽略例外
    }
  };

  const checklistItems = [
    { id: 'c4', text: t.item4 },
    ...(resignationType === 'involuntary'
      ? [
          { id: 'inv1', text: t.involuntaryItem1 },
          { id: 'inv2', text: t.involuntaryItem2 },
        ]
      : []),
    { id: 'c1', text: t.item1 },
    { id: 'c2', text: t.item2 },
    { id: 'c3', text: t.item3 },
    { id: 'c5', text: t.item5 },
  ];

  const completedCount = checklistItems.filter((item) =>
    checkedIds.includes(item.id),
  ).length;
  const progressPercent =
    checklistItems.length > 0
      ? Math.round((completedCount / checklistItems.length) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* 雙欄工作區：左「互動式離職檢核表」＋ 右「一鍵生成離職預告信範本」 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
        {/* 1. 互動式離職檢核表（含明顯 20x20 勾選方框、進度條與 localStorage 持久化） */}
        <div className={`${styles.glassCard} flex flex-col justify-between`}>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  width={20}
                  height={20}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className={styles.accentText}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{t.checklistTitle}</span>
              </h3>

              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold ${styles.accentText}`}>
                  {t.checklistProgressPrefix}: {completedCount}/{checklistItems.length} ({progressPercent}%)
                </span>
                {completedCount > 0 && (
                  <button
                    type="button"
                    onClick={resetChecklist}
                    className="text-xs px-2.5 py-1 rounded-lg bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors cursor-pointer"
                  >
                    {t.checklistResetBtn}
                  </button>
                )}
              </div>
            </div>

            <div className={`${styles.progressTrack} mb-4`}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            <ul className="flex flex-col gap-2.5 text-sm">
              {checklistItems.map((item, idx) => {
                const isChecked = checkedIds.includes(item.id);
                const stepNum = String(idx + 1).padStart(2, '0');
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={isChecked}
                      onClick={() => toggleCheckItem(item.id)}
                      className={`${styles.checklistItemBtn} ${
                        isChecked ? styles.checklistItemChecked : ''
                      }`}
                    >
                      <span
                        className={`${styles.checkboxBox} ${
                          isChecked ? styles.checkboxBoxChecked : ''
                        }`}
                      >
                        {isChecked && (
                          <svg
                            viewBox="0 0 24 24"
                            width={14}
                            height={14}
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        )}
                      </span>
                      <div className="flex-1 min-w-0 leading-relaxed">
                        <span className={`font-mono text-xs font-bold mr-2 ${styles.accentText}`}>
                          {stepNum}.
                        </span>
                        <span
                          className={
                            isChecked
                              ? 'line-through opacity-60 text-text-sub'
                              : 'text-text-main font-medium'
                          }
                        >
                          {item.text}
                        </span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* 2. 離職預告信一鍵範本（支援三種情境與署名自訂） */}
        <div className={`${styles.glassCard} flex flex-col justify-between`}>
          <div>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h3 className="text-base font-bold text-text-main flex items-center gap-2">
                <svg
                  viewBox="0 0 24 24"
                  width={18}
                  height={18}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className={styles.accentText}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <span>{t.emailTemplateTitle}</span>
              </h3>
              <button type="button" onClick={onCopyEmail} className={styles.accentBtn}>
                <svg
                  viewBox="0 0 24 24"
                  width={16}
                  height={16}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                <span>{t.copyTemplateBtn}</span>
              </button>
            </div>

            {/* 範本風格切換按鈕組 */}
            <div className="flex flex-wrap gap-2 mb-3">
              {(
                [
                  { key: 'standard', label: t.emailVariantStandard },
                  { key: 'warm', label: t.emailVariantWarm },
                  { key: 'involuntary', label: t.emailVariantInvoluntary },
                ] as const
              ).map((tab) => {
                const active = emailVariant === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onChangeEmailVariant(tab.key)}
                    className={active ? styles.accentBtn : styles.secondaryBtn}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* 選填署名與交接對象 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
              <div>
                <label
                  htmlFor={senderNameInputId}
                  className="block text-sm font-medium text-text-sub mb-1"
                >
                  {t.senderNameLabel}
                </label>
                <input
                  id={senderNameInputId}
                  type="text"
                  value={senderName}
                  onChange={(e) => onChangeSenderName(e.target.value)}
                  placeholder={t.senderNamePlaceholder}
                  className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
                />
              </div>
              <div>
                <label
                  htmlFor={handoverPersonInputId}
                  className="block text-sm font-medium text-text-sub mb-1"
                >
                  {t.handoverPersonLabel}
                </label>
                <input
                  id={handoverPersonInputId}
                  type="text"
                  value={handoverPerson}
                  onChange={(e) => onChangeHandoverPerson(e.target.value)}
                  placeholder={t.handoverPersonPlaceholder}
                  className="w-full px-3 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main focus:border-[var(--theme-color)] outline-none text-sm"
                />
              </div>
            </div>

            <label htmlFor={emailTextareaId} className="sr-only">
              {t.emailTemplateTitle}
            </label>
            <textarea
              id={emailTextareaId}
              readOnly
              value={emailTemplateText}
              rows={10}
              className="w-full p-3 rounded-xl bg-select-bg border border-border-glass text-text-sub font-mono text-sm focus:outline-none resize-none"
            />
          </div>
        </div>
      </div>

      {/* 3. 法條說明（上下排列） */}
      <div className="p-4 rounded-xl bg-select-bg/50 border border-border-glass text-text-sub leading-relaxed space-y-3">
        <div>
          <div className="text-sm font-semibold text-text-main mb-1.5 flex items-center gap-1.5">
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={styles.accentText}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>{t.laborLawRefTitle}</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-sm">
            <li>{t.lawRule1}</li>
            <li>{t.lawRule2}</li>
            <li>{t.lawRule3}</li>
          </ul>
          <div className="mt-1.5 text-xs opacity-85 leading-normal">{t.lawNote}</div>
        </div>

        <hr className="border-border-glass" />

        <div>
          <div className="text-sm font-semibold text-text-main mb-1.5 flex items-center gap-1.5">
            <svg
              viewBox="0 0 24 24"
              width={16}
              height={16}
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              className={styles.accentText}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>{t.laborLawArt38Title}</span>
          </div>
          <ul className="list-disc list-inside space-y-1 pl-1 text-sm">
            <li>{t.art38Rule1}</li>
            <li>{t.art38Rule2}</li>
            <li>{t.art38Rule3}</li>
            <li>{t.art38Rule4}</li>
          </ul>
        </div>

        <hr className="border-border-glass" />

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs text-text-sub pt-0.5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <span className="font-semibold text-text-main flex items-center gap-1">
              <svg
                viewBox="0 0 24 24"
                width={14}
                height={14}
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                className={styles.accentText}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                />
              </svg>
              <span>{t.officialSourcesLabel}</span>
            </span>
            <div className="flex flex-wrap gap-2.5">
              <a
                href="https://law.moj.gov.tw/LawClass/LawSingle.aspx?flno=16&pcode=N0030001"
                target="_blank"
                rel="noopener noreferrer"
                className={`hover:underline flex items-center gap-1 ${styles.accentText}`}
              >
                <span>{t.lawLinkArt16}</span>
                <svg
                  viewBox="0 0 24 24"
                  width={12}
                  height={12}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
              <span className="opacity-40">|</span>
              <a
                href="https://laws.mol.gov.tw/FLAW/FLAWDOC01.aspx?flno=38&id=FL014930"
                target="_blank"
                rel="noopener noreferrer"
                className={`hover:underline flex items-center gap-1 ${styles.accentText}`}
              >
                <span>{t.lawLinkArt38}</span>
                <svg
                  viewBox="0 0 24 24"
                  width={12}
                  height={12}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          </div>

          <div className="text-xs opacity-75 font-mono shrink-0">
            {t.lastUpdatedText}
          </div>
        </div>
      </div>
    </div>
  );
}

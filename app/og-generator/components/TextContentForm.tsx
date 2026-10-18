'use client';

import React from 'react';

interface TextContentFormProps {
  t: any;
  title: string;
  setTitle: (v: string) => void;
  subtitle: string;
  setSubtitle: (v: string) => void;
  tag: string;
  setTag: (v: string) => void;
  siteName: string;
  setSiteName: (v: string) => void;
  author: string;
  setAuthor: (v: string) => void;
  dateStr: string;
  setDateStr: (v: string) => void;
  // A11y IDs
  titleInputId: string;
  subtitleInputId: string;
  tagInputId: string;
  siteInputId: string;
  authorInputId: string;
  dateInputId: string;
}

export default function TextContentForm({
  t,
  title,
  setTitle,
  subtitle,
  setSubtitle,
  tag,
  setTag,
  siteName,
  setSiteName,
  author,
  setAuthor,
  dateStr,
  setDateStr,
  titleInputId,
  subtitleInputId,
  tagInputId,
  siteInputId,
  authorInputId,
  dateInputId,
}: TextContentFormProps) {
  return (
    <div className="p-6 rounded-2xl bg-surface-glass border border-border-glass space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-[#818cf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <span className="text-sm font-semibold text-text-main">{t.textSettings}</span>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor={titleInputId} className="block text-sm font-medium text-text-sub mb-1.5">
            {t.titleField}
          </label>
          <input
            id={titleInputId}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.titlePlaceholder}
            className="w-full px-4 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[#6366f1]"
          />
        </div>

        <div>
          <label htmlFor={subtitleInputId} className="block text-sm font-medium text-text-sub mb-1.5">
            {t.subtitleField}
          </label>
          <textarea
            id={subtitleInputId}
            rows={2}
            value={subtitle}
            onChange={(e) => setSubtitle(e.target.value)}
            placeholder={t.subtitlePlaceholder}
            className="w-full px-4 py-2.5 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[#6366f1] resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={tagInputId} className="block text-sm font-medium text-text-sub mb-1.5">
              {t.tagField}
            </label>
            <input
              id={tagInputId}
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder={t.tagPlaceholder}
              className="w-full px-4 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[#6366f1]"
            />
          </div>
          <div>
            <label htmlFor={siteInputId} className="block text-sm font-medium text-text-sub mb-1.5">
              {t.siteField}
            </label>
            <input
              id={siteInputId}
              type="text"
              value={siteName}
              onChange={(e) => setSiteName(e.target.value)}
              placeholder={t.sitePlaceholder}
              className="w-full px-4 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[#6366f1]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor={authorInputId} className="block text-sm font-medium text-text-sub mb-1.5">
              {t.authorField}
            </label>
            <input
              id={authorInputId}
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder={t.authorPlaceholder}
              className="w-full px-4 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[#6366f1]"
            />
          </div>
          <div>
            <label htmlFor={dateInputId} className="block text-sm font-medium text-text-sub mb-1.5">
              {t.dateField}
            </label>
            <input
              id={dateInputId}
              type="text"
              value={dateStr}
              onChange={(e) => setDateStr(e.target.value)}
              placeholder={t.datePlaceholder}
              className="w-full px-4 py-2 rounded-xl bg-select-bg border border-border-glass text-text-main text-sm focus:outline-none focus:border-[#6366f1]"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

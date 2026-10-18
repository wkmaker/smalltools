'use client';

import React from 'react';

interface PresetSelectorProps {
  t: any;
  onSelectPreset: (presetKey: 'tech' | 'product' | 'devlog' | 'news') => void;
}

export default function PresetSelector({ t, onSelectPreset }: PresetSelectorProps) {
  return (
    <div className="p-4 rounded-2xl bg-surface-glass border border-border-glass flex flex-wrap items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-[#818cf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        <span className="text-sm font-semibold text-text-main">{t.presetsLabel}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {(['tech', 'product', 'devlog', 'news'] as const).map((pk) => (
          <button
            key={pk}
            type="button"
            onClick={() => onSelectPreset(pk)}
            className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors cursor-pointer"
          >
            {t.presets[pk]}
          </button>
        ))}
      </div>
    </div>
  );
}

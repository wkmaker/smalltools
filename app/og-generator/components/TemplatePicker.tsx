'use client';

import React from 'react';
import type { TemplateType } from '../types';
import styles from '../og-generator.module.css';

interface TemplatePickerProps {
  t: any;
  template: TemplateType;
  setTemplate: (temp: TemplateType) => void;
}

export default function TemplatePicker({ t, template, setTemplate }: TemplatePickerProps) {
  return (
    <div className="p-6 rounded-2xl bg-surface-glass border border-border-glass space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-main">{t.templateLabel}</span>
        <span className="text-xs text-text-sub">{t.templateCountLabel}</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(['minimal', 'gradient', 'split', 'impact'] as const).map((tempKey) => (
          <button
            key={tempKey}
            type="button"
            onClick={() => setTemplate(tempKey)}
            className={`p-3.5 rounded-xl text-left transition-all cursor-pointer ${styles.templateCard} ${
              template === tempKey ? styles.templateCardActive : ''
            }`}
          >
            <div className="text-sm font-bold text-text-main">{t.templates[tempKey].name}</div>
            <div className="text-xs text-text-sub mt-1 leading-relaxed">{t.templates[tempKey].desc}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

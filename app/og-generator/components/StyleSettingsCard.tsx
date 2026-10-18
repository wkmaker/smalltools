'use client';

import React from 'react';
import type { FontStyle, ThemeMode } from '../types';
import { PRESET_COLORS } from '../constants';

interface StyleSettingsCardProps {
  t: any;
  lang: 'zh-TW' | 'en';
  themeMode: ThemeMode;
  setThemeMode: (m: ThemeMode) => void;
  bgFillType: 'gradient' | 'solid';
  setBgFillType: (type: 'gradient' | 'solid') => void;
  color1: string;
  setColor1: (c: string) => void;
  color2: string;
  setColor2: (c: string) => void;
  lightColor1: string;
  setLightColor1: (c: string) => void;
  lightColor2: string;
  setLightColor2: (c: string) => void;
  accentColor: string;
  setAccentColor: (c: string) => void;
  fontFamily: FontStyle;
  setFontStyle: (f: FontStyle) => void;
  // A11y IDs
  colorPicker1Id: string;
  colorPicker2Id: string;
  accentPickerId: string;
}

export default function StyleSettingsCard({
  t,
  lang,
  themeMode,
  setThemeMode,
  bgFillType,
  setBgFillType,
  color1,
  setColor1,
  color2,
  setColor2,
  lightColor1,
  setLightColor1,
  lightColor2,
  setLightColor2,
  accentColor,
  setAccentColor,
  fontFamily,
  setFontStyle,
  colorPicker1Id,
  colorPicker2Id,
  accentPickerId,
}: StyleSettingsCardProps) {
  return (
    <div className="p-6 rounded-2xl bg-surface-glass border border-border-glass space-y-4">
      <div className="flex items-center gap-2">
        <svg className="w-5 h-5 text-[#818cf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
        <span className="text-sm font-semibold text-text-main">{t.styleSettings}</span>
      </div>

      {/* 深淺色調切換 */}
      <div>
        <span className="block text-xs font-medium text-text-sub mb-2">{t.themeMode}</span>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setThemeMode('dark')}
            className={`py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
              themeMode === 'dark'
                ? 'border-[#6366f1] bg-[#6366f1]/20 text-text-main font-semibold'
                : 'border-border-glass bg-select-bg text-text-sub hover:text-text-main'
            }`}
          >
            {t.themeDark}
          </button>
          <button
            type="button"
            onClick={() => setThemeMode('light')}
            className={`py-2 rounded-xl text-sm font-medium border transition-all cursor-pointer ${
              themeMode === 'light'
                ? 'border-[#6366f1] bg-[#6366f1]/20 text-text-main font-semibold'
                : 'border-border-glass bg-select-bg text-text-sub hover:text-text-main'
            }`}
          >
            {t.themeLight}
          </button>
        </div>
      </div>

      {/* 畫布背景底色設定 */}
      <div className="space-y-3 pt-3 border-t border-border-glass">
        <div className="flex items-center justify-between">
          <span className="block text-xs font-semibold text-text-main">{t.bgColorSection}</span>
          <div className="flex items-center gap-1.5 p-0.5 rounded-lg bg-select-bg border border-border-glass">
            <button
              type="button"
              onClick={() => setBgFillType('gradient')}
              className={`px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                bgFillType === 'gradient'
                  ? 'bg-[#6366f1] text-white font-semibold shadow-sm'
                  : 'text-text-sub hover:text-text-main'
              }`}
            >
              {t.fillGradient.split(' ')[0]}
            </button>
            <button
              type="button"
              onClick={() => {
                setBgFillType('solid');
                if (themeMode === 'dark') {
                  setColor2(color1);
                } else {
                  setLightColor2(lightColor1);
                }
              }}
              className={`px-2.5 py-1 text-xs rounded-md transition-all cursor-pointer ${
                bgFillType === 'solid'
                  ? 'bg-[#6366f1] text-white font-semibold shadow-sm'
                  : 'text-text-sub hover:text-text-main'
              }`}
            >
              {t.fillSolid.split(' ')[0]}
            </button>
          </div>
        </div>

        {bgFillType === 'gradient' ? (
          <>
            {/* 預設主題漸層色 */}
            <div className="space-y-2">
              <span className="block text-xs font-medium text-text-sub">{t.presetColors}</span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {PRESET_COLORS.map((pc) => {
                  const colorName = lang === 'zh-TW' ? pc.nameZh : pc.name;
                  return (
                    <button
                      key={pc.id}
                      type="button"
                      onClick={() => {
                        setColor1(pc.color1);
                        setColor2(pc.color2);
                        setLightColor1(pc.lightColor1);
                        setLightColor2(pc.lightColor2);
                        setAccentColor(pc.accent);
                      }}
                      className="p-2 rounded-xl border border-border-glass bg-select-bg flex flex-col items-center gap-1.5 hover:scale-105 transition-transform cursor-pointer"
                    >
                      <div
                        className="w-full h-5 rounded-md border border-border-glass/40 shadow-inner"
                        style={{
                          background:
                            themeMode === 'dark'
                              ? `linear-gradient(135deg, ${pc.color1}, ${pc.color2})`
                              : `linear-gradient(135deg, ${pc.lightColor1}, ${pc.lightColor2})`,
                        }}
                      />
                      <span className="text-[12px] text-text-sub truncate w-full text-center" title={colorName}>
                        {colorName}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 自訂雙色漸層選擇器 */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label htmlFor={colorPicker1Id} className="block text-[12px] font-medium text-text-sub mb-1.5">
                  {t.gradientStartColor}
                </label>
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-select-bg border border-border-glass focus-within:border-[#6366f1] transition-all">
                  <div
                    className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-border-glass shadow-inner"
                    style={{ backgroundColor: themeMode === 'dark' ? color1 : lightColor1 }}
                  >
                    <input
                      type="color"
                      value={
                        (themeMode === 'dark' ? color1 : lightColor1).startsWith('#') &&
                        (themeMode === 'dark' ? color1 : lightColor1).length === 7
                          ? themeMode === 'dark'
                            ? color1
                            : lightColor1
                          : '#0f172a'
                      }
                      onChange={(e) => {
                        if (themeMode === 'dark') {
                          setColor1(e.target.value);
                        } else {
                          setLightColor1(e.target.value);
                        }
                      }}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      aria-label={t.gradientStartColor}
                    />
                  </div>
                  <input
                    id={colorPicker1Id}
                    type="text"
                    value={themeMode === 'dark' ? color1 : lightColor1}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (themeMode === 'dark') {
                        setColor1(val);
                      } else {
                        setLightColor1(val);
                      }
                    }}
                    placeholder="#000000"
                    maxLength={7}
                    className="w-full text-xs font-mono font-medium text-text-main bg-transparent outline-none uppercase"
                  />
                </div>
              </div>

              <div>
                <label htmlFor={colorPicker2Id} className="block text-[12px] font-medium text-text-sub mb-1.5">
                  {t.gradientEndColor}
                </label>
                <div className="flex items-center gap-2 p-1.5 rounded-xl bg-select-bg border border-border-glass focus-within:border-[#6366f1] transition-all">
                  <div
                    className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-border-glass shadow-inner"
                    style={{ backgroundColor: themeMode === 'dark' ? color2 : lightColor2 }}
                  >
                    <input
                      type="color"
                      value={
                        (themeMode === 'dark' ? color2 : lightColor2).startsWith('#') &&
                        (themeMode === 'dark' ? color2 : lightColor2).length === 7
                          ? themeMode === 'dark'
                            ? color2
                            : lightColor2
                          : '#1e1b4b'
                      }
                      onChange={(e) => {
                        if (themeMode === 'dark') {
                          setColor2(e.target.value);
                        } else {
                          setLightColor2(e.target.value);
                        }
                      }}
                      className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                      aria-label={t.gradientEndColor}
                    />
                  </div>
                  <input
                    id={colorPicker2Id}
                    type="text"
                    value={themeMode === 'dark' ? color2 : lightColor2}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (themeMode === 'dark') {
                        setColor2(val);
                      } else {
                        setLightColor2(val);
                      }
                    }}
                    placeholder="#000000"
                    maxLength={7}
                    className="w-full text-xs font-mono font-medium text-text-main bg-transparent outline-none uppercase"
                  />
                </div>
              </div>
            </div>
          </>
        ) : (
          /* 自訂單色純底選擇器 */
          <div className="pt-1">
            <label htmlFor={colorPicker1Id} className="block text-[12px] font-medium text-text-sub mb-1.5">
              {t.solidBgColor}
            </label>
            <div className="flex items-center gap-2 p-1.5 rounded-xl bg-select-bg border border-border-glass focus-within:border-[#6366f1] transition-all max-w-[200px]">
              <div
                className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-border-glass shadow-inner"
                style={{ backgroundColor: themeMode === 'dark' ? color1 : lightColor1 }}
              >
                <input
                  type="color"
                  value={
                    (themeMode === 'dark' ? color1 : lightColor1).startsWith('#') &&
                    (themeMode === 'dark' ? color1 : lightColor1).length === 7
                      ? themeMode === 'dark'
                        ? color1
                        : lightColor1
                      : '#0f172a'
                  }
                  onChange={(e) => {
                    if (themeMode === 'dark') {
                      setColor1(e.target.value);
                      setColor2(e.target.value);
                    } else {
                      setLightColor1(e.target.value);
                      setLightColor2(e.target.value);
                    }
                  }}
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                  aria-label={t.solidBgColor}
                />
              </div>
              <input
                id={colorPicker1Id}
                type="text"
                value={themeMode === 'dark' ? color1 : lightColor1}
                onChange={(e) => {
                  const val = e.target.value;
                  if (themeMode === 'dark') {
                    setColor1(val);
                    setColor2(val);
                  } else {
                    setLightColor1(val);
                    setLightColor2(val);
                  }
                }}
                placeholder="#000000"
                maxLength={7}
                className="w-full text-xs font-mono font-medium text-text-main bg-transparent outline-none uppercase"
              />
            </div>
          </div>
        )}
      </div>

      {/* 強調發光色 (Accent Glow Color) */}
      <div className="space-y-2.5 pt-3 border-t border-border-glass">
        <div className="flex items-center justify-between">
          <label htmlFor={accentPickerId} className="block text-xs font-semibold text-text-main cursor-pointer">
            {t.accentColor}
          </label>
          <span className="text-[12px] text-text-sub font-mono uppercase">
            {accentColor}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-select-bg border border-border-glass focus-within:border-[#6366f1] transition-all w-36 shrink-0">
            <div
              className="relative w-7 h-7 rounded-lg overflow-hidden shrink-0 border border-border-glass shadow-inner"
              style={{ backgroundColor: accentColor }}
            >
              <input
                type="color"
                value={accentColor.startsWith('#') && accentColor.length === 7 ? accentColor : '#6366f1'}
                onChange={(e) => setAccentColor(e.target.value)}
                className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                aria-label={t.accentColor}
              />
            </div>
            <input
              id={accentPickerId}
              type="text"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#6366F1"
              maxLength={7}
              className="w-full text-xs font-mono font-medium text-text-main bg-transparent outline-none uppercase"
            />
          </div>

          {/* 常用 Accent 快捷色票 */}
          <div className="flex flex-wrap items-center gap-1.5 flex-1">
            {['#6366f1', '#818cf8', '#10b981', '#f43f5e', '#f59e0b', '#0284c7', '#06b6d4', '#ec4899'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setAccentColor(c)}
                title={c}
                className={`w-6 h-6 rounded-lg border transition-all cursor-pointer ${
                  accentColor.toLowerCase() === c.toLowerCase()
                    ? 'border-white scale-110 shadow-[0_0_8px_rgba(255,255,255,0.6)] ring-2 ring-[#6366f1]'
                    : 'border-border-glass/60 hover:scale-105'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* 字型風格選擇 */}
      <div className="pt-2">
        <span className="block text-xs font-medium text-text-sub mb-2">{t.fontFamily}</span>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(['sans', 'serif', 'mono', 'display'] as const).map((font) => (
            <button
              key={font}
              type="button"
              onClick={() => setFontStyle(font)}
              className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                fontFamily === font
                  ? 'border-[#6366f1] bg-[#6366f1]/20 text-text-main font-bold'
                  : 'border-border-glass bg-select-bg text-text-sub hover:text-text-main'
              }`}
            >
              {font === 'sans' ? t.fontSans.split(' ')[0] : font === 'serif' ? t.fontSerif.split(' ')[0] : font === 'mono' ? t.fontMono.split(' ')[0] : t.fontDisplay.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

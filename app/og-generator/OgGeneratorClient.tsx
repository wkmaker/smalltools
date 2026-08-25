'use client';

import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import ToolLayout from '@/app/components/ToolLayout';
import FaqSection from '@/app/components/FaqSection';
import styles from './og-generator.module.css';
import {
  TemplateType,
  AspectRatio,
  FontStyle,
  LogoShape,
  ThemeMode,
  ExportFormat,
  DrawCanvasParams,
  OgGeneratorClientProps,
} from './types';
import { PRESET_COLORS, PRESET_ICONS, RATIO_DIMENSIONS } from './constants';
import { TRANSLATIONS } from './translations';
import { renderCanvas } from './canvasRenderer';
import { exportImage, copyCanvasToClipboard, getExportCanvas } from './exportHelpers';

export type { OgGeneratorClientProps } from './types';

export default function OgGeneratorClient({ lang = 'zh-TW' }: OgGeneratorClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  // 無障礙 ID 宣告 (useId)
  const titleInputId = useId();
  const subtitleInputId = useId();
  const tagInputId = useId();
  const siteInputId = useId();
  const authorInputId = useId();
  const dateInputId = useId();
  const logoUploadId = useId();
  const bgUploadId = useId();
  const logoSizeId = useId();
  const bgOpacityId = useId();
  const bgBlurId = useId();
  const colorPicker1Id = useId();
  const colorPicker2Id = useId();
  const accentPickerId = useId();
  const retinaCheckboxId = useId();

  // 狀態管理
  const [template, setTemplate] = useState<TemplateType>('minimal');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('og');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [fontFamily, setFontStyle] = useState<FontStyle>('sans');
  const [title, setTitle] = useState(
    lang === 'zh-TW'
      ? '深入解析 Next.js 16 App Router 高效架構'
      : 'How to Build Lightning-Fast Web Applications'
  );
  const [subtitle, setSubtitle] = useState(
    lang === 'zh-TW'
      ? '掌握零延遲渲染、伺服器組件與流體式狀態同步的架構實踐。'
      : 'Explore modern frontend architecture, state synchronization, and zero-latency rendering techniques.'
  );
  const [tag, setTag] = useState(
    lang === 'zh-TW' ? '開發者工具箱 · 精選推薦' : 'NEXT.JS · ARCHITECTURE'
  );
  const [siteName, setSiteName] = useState('tools.cjkuo.net');
  const [author, setAuthor] = useState('C.J. Kuo');
  const [dateStr, setDateStr] = useState(
    lang === 'zh-TW' ? '2026-08-25 · 5 分鐘閱讀' : '2026-08-25 · 5 min read'
  );

  // 配色狀態
  const [bgFillType, setBgFillType] = useState<'gradient' | 'solid'>('gradient');
  const [color1, setColor1] = useState(PRESET_COLORS[0].color1);
  const [color2, setColor2] = useState(PRESET_COLORS[0].color2);
  const [lightColor1, setLightColor1] = useState(PRESET_COLORS[0].lightColor1);
  const [lightColor2, setLightColor2] = useState(PRESET_COLORS[0].lightColor2);
  const [accentColor, setAccentColor] = useState(PRESET_COLORS[0].accent);

  // 媒體與圖示
  const [enableLogo, setEnableLogo] = useState<boolean>(true);
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string>('code');
  const [logoShape, setLogoShape] = useState<LogoShape>('rounded');
  const [logoSize, setLogoSize] = useState<number>(64);

  const [enableBgImage, setEnableBgImage] = useState<boolean>(true);
  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgOpacity, setBgOpacity] = useState<number>(40);
  const [bgBlur, setBgBlur] = useState<number>(0);

  // 匯出與預覽
  const [retinaSupersample, setRetinaSupersample] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [modalImageUrl, setModalImageUrl] = useState<string>('');

  // Canvas 參照
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // 監聽 Modal 開啟時鎖定頁面滾動與 ESC 快捷鍵
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') setIsModalOpen(false);
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [isModalOpen]);

  // 設定主題 CSS 變數
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#6366f1');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(99, 102, 241, 0.6)');
  }, []);

  // 快速範本載入器
  const loadPreset = (presetKey: 'tech' | 'product' | 'devlog' | 'news') => {
    if (presetKey === 'tech') {
      setTitle(lang === 'zh-TW' ? '深入解析 Next.js 16 App Router 高效架構' : 'Deep Dive: Next.js 16 App Router Architecture');
      setSubtitle(lang === 'zh-TW' ? '掌握零延遲渲染、伺服器組件與流體式狀態同步的架構實踐。' : 'Master zero-latency rendering, server components, and fluid state management.');
      setTag(lang === 'zh-TW' ? '架構思維 · 技術專欄' : 'DEVELOPER · ARCHITECTURE');
      setAuthor('C.J. Kuo');
      setDateStr(lang === 'zh-TW' ? '2026-08-25 · 5 分鐘閱讀' : '2026-08-25 · 5 min read');
      setTemplate('minimal');
      const slate = PRESET_COLORS.find((c) => c.id === 'slate') || PRESET_COLORS[0];
      setColor1(slate.color1);
      setColor2(slate.color2);
      setLightColor1(slate.lightColor1);
      setLightColor2(slate.lightColor2);
      setAccentColor(slate.accent);
      setSelectedIconId('code');
    } else if (presetKey === 'product') {
      setTitle(lang === 'zh-TW' ? 'Smalltools 2.0 震撼發布：開源極致工具箱' : 'Smalltools 2.0 Released: The Ultimate Open-Source Suite');
      setSubtitle(lang === 'zh-TW' ? '超過 28 款純前端強大工具，無廣告、無後端、100% 隱私安全。' : 'Over 28 powerful client-side utilities with zero tracking and pure speed.');
      setTag(lang === 'zh-TW' ? '產品發布 · 全新改版' : 'PRODUCT LAUNCH · 2026');
      setAuthor(lang === 'zh-TW' ? '產品團隊' : 'Product Team');
      setDateStr(lang === 'zh-TW' ? '2026-08-25 · 重大更新' : '2026-08-25 · Major Update');
      setTemplate('gradient');
      const emerald = PRESET_COLORS.find((c) => c.id === 'emerald') || PRESET_COLORS[2];
      setColor1(emerald.color1);
      setColor2(emerald.color2);
      setLightColor1(emerald.lightColor1);
      setLightColor2(emerald.lightColor2);
      setAccentColor(emerald.accent);
      setSelectedIconId('rocket');
    } else if (presetKey === 'devlog') {
      setTitle(lang === 'zh-TW' ? '工程師的效能調優手記：Canvas 與 WebAssembly' : 'Engineer DevLog: WebAssembly & Canvas Performance');
      setSubtitle(lang === 'zh-TW' ? '如何利用非阻塞時間片與記憶體零拷貝技術打造 60 FPS 極速體驗。' : 'Unlocking 60 FPS with non-blocking slicing and zero-copy indexing.');
      setTag(lang === 'zh-TW' ? '工程日誌 · 效能調校' : 'ENGINEERING · PERFORMANCE');
      setAuthor(lang === 'zh-TW' ? '技術架構師' : 'Lead Architect');
      setDateStr(lang === 'zh-TW' ? '2026-08-25 · 效能專欄' : '2026-08-25 · Performance');
      setTemplate('split');
      const sky = PRESET_COLORS.find((c) => c.id === 'sky') || PRESET_COLORS[5];
      setColor1(sky.color1);
      setColor2(sky.color2);
      setLightColor1(sky.lightColor1);
      setLightColor2(sky.lightColor2);
      setAccentColor(sky.accent);
      setSelectedIconId('terminal');
    } else {
      setTitle(lang === 'zh-TW' ? '重大更新：全站無障礙 WCAG 2.1 AA 與雙主題特化' : 'Major Update: WCAG 2.1 AA & Fluid Dual Themes');
      setSubtitle(lang === 'zh-TW' ? '重塑視覺體驗，為所有使用者提供高對比度且細緻的毛玻璃美學。' : 'Reimagined visual experience with high contrast glassmorphism design.');
      setTag(lang === 'zh-TW' ? '趨勢觀察 · 深度報告' : 'ANNOUNCEMENT · DESIGN');
      setAuthor(lang === 'zh-TW' ? '編輯部精選' : 'Editorial Team');
      setDateStr(lang === 'zh-TW' ? '2026-08-25 · 特刊專題' : '2026-08-25 · Special Report');
      setTemplate('impact');
      const sunset = PRESET_COLORS.find((c) => c.id === 'sunset') || PRESET_COLORS[3];
      setColor1(sunset.color1);
      setColor2(sunset.color2);
      setLightColor1(sunset.lightColor1);
      setLightColor2(sunset.lightColor2);
      setAccentColor(sunset.accent);
      setSelectedIconId('sparkles');
    }
  };

  // Logo 上傳處理
  const handleLogoUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setLogoImage(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 背景圖上傳處理
  const handleBgUpload = (file: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        setBgImage(img);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  // 取得當前繪圖參數
  const getDrawParams = useCallback((): DrawCanvasParams | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return {
      canvas,
      template,
      aspectRatio,
      themeMode,
      fontFamily,
      title,
      subtitle,
      tag,
      siteName,
      author,
      dateStr,
      color1,
      color2,
      lightColor1,
      lightColor2,
      accentColor,
      enableLogo,
      enableBgImage,
      logoImage,
      selectedIconId,
      logoShape,
      logoSize,
      bgImage,
      bgOpacity,
      bgBlur,
    };
  }, [
    template,
    aspectRatio,
    themeMode,
    fontFamily,
    title,
    subtitle,
    tag,
    siteName,
    author,
    dateStr,
    color1,
    color2,
    lightColor1,
    lightColor2,
    accentColor,
    enableLogo,
    enableBgImage,
    logoImage,
    selectedIconId,
    logoShape,
    logoSize,
    bgImage,
    bgOpacity,
    bgBlur,
  ]);

  // 觸發畫布即時渲染
  useEffect(() => {
    const params = getDrawParams();
    if (params) {
      renderCanvas(params);
    }
  }, [getDrawParams]);

  // 提示訊息輔助函式
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // 下載圖片處理
  const handleDownload = (format: ExportFormat) => {
    const params = getDrawParams();
    if (!params) return;
    setIsExporting(true);
    try {
      exportImage(params, format, retinaSupersample);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // 複製到剪貼簿處理
  const handleCopyToClipboard = async () => {
    const params = getDrawParams();
    if (!params) return;
    try {
      const success = await copyCanvasToClipboard(params, retinaSupersample);
      if (success) {
        showToast(t.copySuccess);
      } else {
        showToast(t.copyError);
      }
    } catch {
      showToast(t.copyError);
    }
  };

  // 開啟高解析度大圖預覽懸浮視窗 (Lightbox Modal)
  const openLargePreview = () => {
    const params = getDrawParams();
    if (!params) return;
    const exportCanvas = getExportCanvas(params, retinaSupersample);
    const dataUrl = exportCanvas.toDataURL('image/png');
    setModalImageUrl(dataUrl);
    setIsModalOpen(true);
  };

  return (
    <ToolLayout
      title={t.title}
      subtitle={t.subtitle}
      description={t.description}
      accentColor="#6366f1"
      accentGlow="rgba(99, 102, 241, 0.6)"
      extraHeaderControls={
        <Link
          href={t.langToggleUrl}
          className="text-sm font-medium px-3.5 py-2 rounded-xl bg-select-bg border border-border-glass text-text-sub hover:text-text-main transition-colors"
        >
          {t.langToggleLabel}
        </Link>
      }
    >
      <div className={`space-y-8 ${styles.ogContainer}`}>
        {/* Toast 提示浮動通知 */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-surface-glass border border-border-glass shadow-2xl backdrop-blur-xl flex items-center gap-3 text-text-main text-sm font-semibold">
            <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. 快速範本選擇條 */}
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
                onClick={() => loadPreset(pk)}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors"
              >
                {t.presets[pk]}
              </button>
            ))}
          </div>
        </div>

        {/* 2. 主工作區 (左欄：各項控制設定面板，右欄：即時畫布預覽與匯出工具) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 左欄：表單控制面板 (7 欄寬) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 模板選擇 */}
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
                    className={`p-3.5 rounded-xl text-left transition-all ${styles.templateCard} ${
                      template === tempKey ? styles.templateCardActive : ''
                    }`}
                  >
                    <div className="text-sm font-bold text-text-main">{t.templates[tempKey].name}</div>
                    <div className="text-xs text-text-sub mt-1 leading-relaxed">{t.templates[tempKey].desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* 文字內容設定 */}
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

            {/* 媒體與圖示設定 */}
            <div className="p-6 rounded-2xl bg-surface-glass border border-border-glass space-y-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#818cf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold text-text-main">{t.mediaSettings}</span>
              </div>

              {/* Logo 區塊 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="block text-sm font-medium text-text-sub">{t.logoSectionTitle}</span>
                  <button
                    type="button"
                    onClick={() => setEnableLogo(!enableLogo)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                      enableLogo
                        ? 'border-[#6366f1] bg-[#6366f1]/20 text-text-main font-semibold'
                        : 'border-border-glass bg-select-bg text-text-sub'
                    }`}
                  >
                    {enableLogo ? t.logoEnabled : t.logoDisabled}
                  </button>
                </div>

                {enableLogo ? (
                  <>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) handleLogoUpload(e.dataTransfer.files[0]);
                      }}
                      className={`p-4 rounded-xl text-center cursor-pointer ${styles.dropzone}`}
                      onClick={() => document.getElementById(logoUploadId)?.click()}
                    >
                      <input
                        id={logoUploadId}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleLogoUpload(e.target.files[0]);
                        }}
                      />
                      <div className="text-sm font-medium text-text-main">
                        {logoImage ? t.logoLoaded : t.logoUploadHint}
                      </div>
                    </div>

                    {logoImage && (
                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-text-sub">{t.logoShape}:</span>
                          {(['rounded', 'circle', 'square', 'none'] as const).map((shape) => (
                            <button
                              key={shape}
                              type="button"
                              onClick={() => setLogoShape(shape)}
                              className={`px-2.5 py-1 text-xs rounded-lg border ${
                                logoShape === shape
                                  ? 'border-[#6366f1] bg-[#6366f1]/20 text-text-main font-semibold'
                                  : 'border-border-glass bg-select-bg text-text-sub'
                              }`}
                            >
                              {shape === 'circle' ? t.shapeCircle : shape === 'rounded' ? t.shapeRounded : shape === 'square' ? t.shapeSquare : t.shapeNone}
                            </button>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => setLogoImage(null)}
                          className="text-xs text-[#f43f5e] hover:underline"
                        >
                          {t.clearImage}
                        </button>
                      </div>
                    )}

                    {/* 內建圖示選擇 */}
                    {!logoImage && (
                      <div className="space-y-2 pt-2">
                        <span className="text-xs text-text-sub">{t.presetIconLabel}:</span>
                        <div className="flex flex-wrap gap-2">
                          {PRESET_ICONS.map((icon) => (
                            <button
                              key={icon.id}
                              type="button"
                              onClick={() => setSelectedIconId(icon.id)}
                              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition-all ${
                                selectedIconId === icon.id
                                  ? 'border-[#6366f1] bg-[#6366f1]/20 text-text-main font-bold'
                                  : 'border-border-glass bg-select-bg text-text-sub hover:text-text-main'
                              }`}
                            >
                              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                <path d={icon.path} />
                              </svg>
                              <span>{icon.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Logo 尺寸滑桿 */}
                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs text-text-sub mb-1">
                        <label htmlFor={logoSizeId}>{t.logoSize}</label>
                        <span>{logoSize}px</span>
                      </div>
                      <input
                        id={logoSizeId}
                        type="range"
                        min="40"
                        max="100"
                        value={logoSize}
                        onChange={(e) => setLogoSize(Number(e.target.value))}
                        className="w-full accent-[#6366f1]"
                      />
                    </div>
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-select-bg/50 border border-border-glass text-xs text-text-sub text-center">
                    {lang === 'zh-TW' ? '已關閉底部 Logo 與圖示顯示，點擊右上角「已關閉」可隨時重新開啟。' : 'Logo & Icon display is disabled. Click the button above to re-enable.'}
                  </div>
                )}
              </div>

              {/* 特色/背景圖片區塊 */}
              <div className="space-y-3 pt-4 border-t border-border-glass">
                <div className="flex items-center justify-between">
                  <span className="block text-sm font-medium text-text-sub">{t.bgSectionTitle}</span>
                  <button
                    type="button"
                    onClick={() => setEnableBgImage(!enableBgImage)}
                    className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                      enableBgImage
                        ? 'border-[#6366f1] bg-[#6366f1]/20 text-text-main font-semibold'
                        : 'border-border-glass bg-select-bg text-text-sub'
                    }`}
                  >
                    {enableBgImage ? t.bgEnabled : t.bgDisabled}
                  </button>
                </div>

                <div className="text-[12px] text-text-sub leading-relaxed">
                  {t.bgImageOptionalHint}
                </div>

                {enableBgImage ? (
                  <>
                    <div
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        if (e.dataTransfer.files?.[0]) handleBgUpload(e.dataTransfer.files[0]);
                      }}
                      className={`p-4 rounded-xl text-center cursor-pointer ${styles.dropzone}`}
                      onClick={() => document.getElementById(bgUploadId)?.click()}
                    >
                      <input
                        id={bgUploadId}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.[0]) handleBgUpload(e.target.files[0]);
                        }}
                      />
                      <div className="text-sm font-medium text-text-main">
                        {bgImage ? t.bgLoaded : t.bgImageHint}
                      </div>
                    </div>

                    {bgImage && (
                      <div className="space-y-3 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-text-sub">{t.bgOpacity}</span>
                          <button
                            type="button"
                            onClick={() => setBgImage(null)}
                            className="text-xs text-[#f43f5e] hover:underline"
                          >
                            {t.clearImage}
                          </button>
                        </div>
                        <input
                          id={bgOpacityId}
                          type="range"
                          min="10"
                          max="100"
                          value={bgOpacity}
                          onChange={(e) => setBgOpacity(Number(e.target.value))}
                          className="w-full accent-[#6366f1]"
                        />
                        <div className="flex items-center justify-between text-xs text-text-sub">
                          <label htmlFor={bgBlurId}>{t.bgBlur}</label>
                          <span>{bgBlur}px</span>
                        </div>
                        <input
                          id={bgBlurId}
                          type="range"
                          min="0"
                          max="20"
                          value={bgBlur}
                          onChange={(e) => setBgBlur(Number(e.target.value))}
                          className="w-full accent-[#6366f1]"
                        />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="p-3 rounded-xl bg-select-bg/50 border border-border-glass text-xs text-text-sub text-center">
                    {lang === 'zh-TW' ? '已關閉特色/背景圖片功能，頁面將維持純粹極簡幾何漸層。' : 'Background & feature image is disabled. Clean geometric gradients will be used.'}
                  </div>
                )}
              </div>
            </div>

            {/* 視覺配色與字型排版 */}
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
                    className={`py-2 rounded-xl text-sm font-medium border transition-all ${
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
                    className={`py-2 rounded-xl text-sm font-medium border transition-all ${
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
                      className={`px-2.5 py-1 text-xs rounded-md transition-all ${
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
                      className={`px-2.5 py-1 text-xs rounded-md transition-all ${
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
                              className="p-2 rounded-xl border border-border-glass bg-select-bg flex flex-col items-center gap-1.5 hover:scale-105 transition-transform"
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

                    {/* 自訂雙色漸層選擇器 (支援色盤與手動色碼輸入) */}
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

              {/* 強調發光色 (Accent Glow Color) 專屬精緻區塊 */}
              <div className="space-y-2.5 pt-3 border-t border-border-glass">
                <div className="flex items-center justify-between">
                  <span className="block text-xs font-semibold text-text-main">
                    {t.accentColor}
                  </span>
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
                      className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-all ${
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
          </div>

          {/* 右欄：畫布即時預覽與匯出工具列 (5 欄寬，Sticky 置頂) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            {/* 預覽展示卡片 */}
            <div className="p-6 rounded-2xl bg-surface-glass border border-border-glass space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold text-text-main">{t.previewTitle}</div>
                  <div className="text-xs text-text-sub">{t.previewDesc}</div>
                </div>
                <div className="text-xs font-mono px-2.5 py-1 rounded-md bg-select-bg border border-border-glass text-text-sub">
                  {RATIO_DIMENSIONS[aspectRatio].desc}
                </div>
              </div>

              {/* 長寬比切換按鈕組 */}
              <div className="flex flex-wrap gap-2">
                {(['og', 'twitter', 'square', 'story', 'linkedin'] as const).map((rKey) => (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => setAspectRatio(rKey)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      aspectRatio === rKey
                        ? 'border-[#6366f1] bg-[#6366f1]/25 text-text-main font-bold'
                        : 'border-border-glass bg-select-bg text-text-sub hover:text-text-main'
                    }`}
                  >
                    {RATIO_DIMENSIONS[rKey].label.split(' ')[0]}
                  </button>
                ))}
              </div>

              {/* Canvas 畫布容器 (支援點擊彈出高解析度大圖) */}
              <div
                onClick={openLargePreview}
                title={t.clickToEnlarge}
                className={`${styles.previewWrapper} ${styles.previewClickable}`}
              >
                <div className={styles.zoomBadge}>
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7" />
                  </svg>
                  <span>{t.clickToEnlarge}</span>
                </div>
                <canvas ref={canvasRef} className={styles.canvasElement} />
              </div>

              {/* 視網膜超採樣開關 */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  id={retinaCheckboxId}
                  type="checkbox"
                  checked={retinaSupersample}
                  onChange={(e) => setRetinaSupersample(e.target.checked)}
                  className="rounded border-border-glass accent-[#6366f1]"
                />
                <label htmlFor={retinaCheckboxId} className="text-xs text-text-sub cursor-pointer">
                  {t.retinaMode}
                </label>
              </div>

              {/* 下載與操作按鈕組 */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownload('png')}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  <span>{t.downloadPng}</span>
                </button>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => handleDownload('jpeg')}
                    className="py-2 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    {t.downloadJpeg.split(' ')[1] || 'JPEG'}
                  </button>
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => handleDownload('webp')}
                    className="py-2 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    WebP
                  </button>
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => handleDownload('svg')}
                    className="py-2 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors cursor-pointer disabled:opacity-50"
                  >
                    SVG
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="w-full py-2.5 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                  </svg>
                  <span>{t.copyClipboard}</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* 3. 完整常見問題 FAQ 區塊 */}
        <FaqSection
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          accentColor="#6366f1"
          items={t.faqItems}
        />

        {/* 4. 高解析度大圖懸浮視窗 (Lightbox Modal - DOM Portal 頂層隔離) */}
        {isModalOpen && typeof document !== 'undefined' && createPortal(
          <div
            className={styles.modalBackdrop}
            onClick={() => setIsModalOpen(false)}
          >
            <div
              className={styles.modalCard}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal 頂部控制列 */}
              <div className="px-6 py-4 border-b border-border-glass flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1] shadow-[0_0_10px_#6366f1]" />
                  <span className="text-sm font-bold text-text-main">{t.modalTitle}</span>
                  <span className="text-xs font-mono px-2.5 py-1 rounded-md bg-select-bg border border-border-glass text-text-sub">
                    {retinaSupersample
                      ? `${RATIO_DIMENSIONS[aspectRatio].width * 2} x ${RATIO_DIMENSIONS[aspectRatio].height * 2} px (2x Retina HD)`
                      : `${RATIO_DIMENSIONS[aspectRatio].width} x ${RATIO_DIMENSIONS[aspectRatio].height} px (1x)`}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyToClipboard}
                    className="px-3 py-1.5 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                    </svg>
                    <span>{t.copyClipboard}</span>
                  </button>
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => handleDownload('png')}
                    className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#6366f1] text-white hover:bg-[#4f46e5] transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    <span>PNG</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="p-1.5 rounded-xl text-text-sub hover:text-text-main hover:bg-select-bg border border-transparent hover:border-border-glass transition-colors cursor-pointer"
                    aria-label={t.closeModal}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Modal 圖片展示主體 */}
              <div className={styles.modalBody}>
                {modalImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={modalImageUrl}
                    alt={t.modalTitle}
                    className={styles.modalImage}
                  />
                )}
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </ToolLayout>
  );
}

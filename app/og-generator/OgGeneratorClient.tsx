'use client';

import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
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
import { PRESET_COLORS, RATIO_DIMENSIONS } from './constants';
import { TRANSLATIONS } from './translations';
import { renderCanvas } from './canvasRenderer';
import { exportImage, copyCanvasToClipboard, getExportCanvas } from './exportHelpers';

import PresetSelector from './components/PresetSelector';
import TemplatePicker from './components/TemplatePicker';
import TextContentForm from './components/TextContentForm';
import MediaSettingsCard from './components/MediaSettingsCard';
import StyleSettingsCard from './components/StyleSettingsCard';
import OgPreviewCard from './components/OgPreviewCard';
import ImagePreviewModal from './components/ImagePreviewModal';

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
        <PresetSelector t={t} onSelectPreset={loadPreset} />

        {/* 2. 主工作區 (左欄：各項控制設定面板，右欄：即時畫布預覽與匯出工具) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 左欄：表單控制面板 (7 欄寬) */}
          <div className="lg:col-span-7 space-y-6">
            {/* 模板選擇 */}
            <TemplatePicker t={t} template={template} setTemplate={setTemplate} />

            {/* 文字內容設定 */}
            <TextContentForm
              t={t}
              title={title}
              setTitle={setTitle}
              subtitle={subtitle}
              setSubtitle={setSubtitle}
              tag={tag}
              setTag={setTag}
              siteName={siteName}
              setSiteName={setSiteName}
              author={author}
              setAuthor={setAuthor}
              dateStr={dateStr}
              setDateStr={setDateStr}
              titleInputId={titleInputId}
              subtitleInputId={subtitleInputId}
              tagInputId={tagInputId}
              siteInputId={siteInputId}
              authorInputId={authorInputId}
              dateInputId={dateInputId}
            />

            {/* 媒體與圖示設定 */}
            <MediaSettingsCard
              t={t}
              lang={lang}
              enableLogo={enableLogo}
              setEnableLogo={setEnableLogo}
              logoImage={logoImage}
              setLogoImage={setLogoImage}
              selectedIconId={selectedIconId}
              setSelectedIconId={setSelectedIconId}
              logoShape={logoShape}
              setLogoShape={setLogoShape}
              logoSize={logoSize}
              setLogoSize={setLogoSize}
              handleLogoUpload={handleLogoUpload}
              enableBgImage={enableBgImage}
              setEnableBgImage={setEnableBgImage}
              bgImage={bgImage}
              setBgImage={setBgImage}
              bgOpacity={bgOpacity}
              setBgOpacity={setBgOpacity}
              bgBlur={bgBlur}
              setBgBlur={setBgBlur}
              handleBgUpload={handleBgUpload}
              logoUploadId={logoUploadId}
              bgUploadId={bgUploadId}
              logoSizeId={logoSizeId}
              bgOpacityId={bgOpacityId}
              bgBlurId={bgBlurId}
            />

            {/* 視覺配色與字型排版 */}
            <StyleSettingsCard
              t={t}
              lang={lang}
              themeMode={themeMode}
              setThemeMode={setThemeMode}
              bgFillType={bgFillType}
              setBgFillType={setBgFillType}
              color1={color1}
              setColor1={setColor1}
              color2={color2}
              setColor2={setColor2}
              lightColor1={lightColor1}
              setLightColor1={setLightColor1}
              lightColor2={lightColor2}
              setLightColor2={setLightColor2}
              accentColor={accentColor}
              setAccentColor={setAccentColor}
              fontFamily={fontFamily}
              setFontStyle={setFontStyle}
              colorPicker1Id={colorPicker1Id}
              colorPicker2Id={colorPicker2Id}
              accentPickerId={accentPickerId}
            />
          </div>

          {/* 右欄：畫布即時預覽與匯出工具列 (5 欄寬，Sticky 置頂) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            <OgPreviewCard
              t={t}
              aspectRatio={aspectRatio}
              setAspectRatio={setAspectRatio}
              canvasRef={canvasRef}
              openLargePreview={openLargePreview}
              retinaSupersample={retinaSupersample}
              setRetinaSupersample={setRetinaSupersample}
              retinaCheckboxId={retinaCheckboxId}
              isExporting={isExporting}
              handleDownload={handleDownload}
              handleCopyToClipboard={handleCopyToClipboard}
            />
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
        <ImagePreviewModal
          t={t}
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          modalImageUrl={modalImageUrl}
          aspectRatio={aspectRatio}
          retinaSupersample={retinaSupersample}
          isExporting={isExporting}
          handleDownload={handleDownload}
          handleCopyToClipboard={handleCopyToClipboard}
        />
      </div>
    </ToolLayout>
  );
}

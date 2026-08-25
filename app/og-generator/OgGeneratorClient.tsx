'use client';

import React, { useState, useEffect, useRef, useId, useCallback } from 'react';
import Link from 'next/link';
import ToolLayout from '@/app/components/ToolLayout';
import FaqSection from '@/app/components/FaqSection';
import styles from './og-generator.module.css';

export interface OgGeneratorClientProps {
  lang?: 'zh-TW' | 'en';
}

type TemplateType = 'minimal' | 'gradient' | 'split' | 'impact';
type AspectRatio = 'og' | 'twitter' | 'square' | 'story' | 'linkedin';
type FontStyle = 'sans' | 'serif' | 'mono' | 'display';
type LogoShape = 'circle' | 'rounded' | 'square' | 'none';
type ThemeMode = 'dark' | 'light';

interface PresetColor {
  id: string;
  name: string;
  color1: string;
  color2: string;
  accent: string;
}

const PRESET_COLORS: PresetColor[] = [
  { id: 'indigo', name: 'Cyber Indigo', color1: '#0f172a', color2: '#1e1b4b', accent: '#6366f1' },
  { id: 'emerald', name: 'Aurora Emerald', color1: '#022c22', color2: '#064e3b', accent: '#10b981' },
  { id: 'sunset', name: 'Sunset Crimson', color1: '#31102e', color2: '#4a044e', accent: '#f43f5e' },
  { id: 'ocean', name: 'Midnight Ocean', color1: '#082f49', color2: '#0c4a6e', accent: '#0284c7' },
  { id: 'amber', name: 'Golden Nebula', color1: '#291804', color2: '#451a03', accent: '#f59e0b' },
  { id: 'titanium', name: 'Titanium Dark', color1: '#0f0f12', color2: '#1c1917', accent: '#94a3b8' },
];

const PRESET_ICONS = [
  { id: 'code', label: 'Code', path: 'M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z' },
  { id: 'sparkles', label: 'Sparkles', path: 'M12 2l1.9 5.8L20 9.8l-4.7 4.2 1.4 6-4.7-3.6-4.7 3.6 1.4-6L4 9.8l6.1-2z' },
  { id: 'rocket', label: 'Rocket', path: 'M13.13 2.87a9 9 0 0 0-8.26 8.26L2 14.07l4.93 4.93 2.94-2.87a9 9 0 0 0 8.26-8.26l1.87-5-5 1.87zM9.5 14.5l-2.5 2.5-1.5-1.5 2.5-2.5 1.5 1.5zm6-6a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z' },
  { id: 'shield', label: 'Shield', path: 'M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-5.45 9-12V5l-9-4zm-2 16l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z' },
  { id: 'globe', label: 'Globe', path: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm6.9 9h-3.8a15.4 15.4 0 0 0-1.2-5.4A8.04 8.04 0 0 1 18.9 11zM12 4c.9 1.8 1.6 4.3 1.9 7H10.1c.3-2.7 1-5.2 1.9-7zm-4.9 1.6A15.4 15.4 0 0 0 5.9 11H2.1a8.04 8.04 0 0 1 5-5.4zM2.1 13h3.8c.2 2 .7 3.8 1.2 5.4A8.04 8.04 0 0 1 2.1 13zm5 7.4c-.9-1.8-1.6-4.3-1.9-7.4h6.8c-.3 3.1-1 5.6-1.9 7.4-1-.1-2.1-.1-3 0zm6.8-.4c.5-1.6 1-3.4 1.2-5.4h3.8a8.04 8.04 0 0 1-5 5.4z' },
  { id: 'terminal', label: 'Terminal', path: 'M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8h16v10zm-12-3l3.5-3.5L8 8l1.4-1.4 4.9 4.9-4.9 4.9L8 15zm6 0h4v2h-4v-2z' },
];

const RATIO_DIMENSIONS: Record<AspectRatio, { width: number; height: number; label: string; desc: string }> = {
  og: { width: 1200, height: 630, label: 'Open Graph / Facebook', desc: '1200 x 630 (1.91:1)' },
  twitter: { width: 1200, height: 675, label: 'Twitter / X', desc: '1200 x 675 (16:9)' },
  square: { width: 1080, height: 1080, label: 'Instagram / Square', desc: '1080 x 1080 (1:1)' },
  story: { width: 1080, height: 1920, label: 'Stories / Mobile', desc: '1080 x 1920 (9:16)' },
  linkedin: { width: 1200, height: 627, label: 'LinkedIn Post', desc: '1200 x 627 (1.91:1)' },
};

const TRANSLATIONS = {
  'zh-TW': {
    title: 'OG 圖片產生器',
    subtitle: 'OPEN GRAPH & SOCIAL IMAGE GENERATOR',
    description: '專業的 Open Graph 與社群封面圖片產生器。提供四款精緻模板、自訂文字、拖曳上傳 Logo 與特色背景圖，支援多社群尺寸及 PNG/JPEG/WEBP/SVG 多格式高速匯出。',
    langToggleUrl: '/og-generator/en/',
    langToggleLabel: 'English',
    templateLabel: '設計模板風格',
    templates: {
      minimal: { name: '現代極簡', desc: '清晰大氣、幾何線框、適合科技與開源專案' },
      gradient: { name: '科技光流', desc: '炫彩光暈、霓虹暗黑、適合 SaaS 與 AI 產品' },
      split: { name: '雜誌專欄', desc: '左文右圖、圖文並茂、適合深度文章與專案成果' },
      impact: { name: '醒目大字', desc: '巨大標題、高衝擊對比、適合社群推播與金句' },
    },
    presetsLabel: '快速載入範例',
    presets: {
      tech: '技術專欄',
      product: '產品發表',
      devlog: '開發日誌',
      news: '社群快訊',
    },
    textSettings: '文字內容設定',
    titleField: '主標題 (Title)',
    titlePlaceholder: '請輸入醒目的主要標題...',
    subtitleField: '副標題 / 摘要 (Subtitle / Description)',
    subtitlePlaceholder: '請輸入文章摘要或核心亮點描述...',
    tagField: '分類標籤 (Tag / Category)',
    tagPlaceholder: '例: NEXT.JS / REACT',
    siteField: '網站名稱 / 網域 (Site Name / Domain)',
    sitePlaceholder: '例: tools.cjkuo.net',
    authorField: '作者 / 發布者 (Author)',
    authorPlaceholder: '例: C.J. Kuo',
    dateField: '附註 / 發布日期 (Date / Note)',
    datePlaceholder: '例: 2026-08-25 · 5 分鐘閱讀',
    mediaSettings: '媒體與圖示設定',
    logoUpload: '自訂 Logo / 頭像',
    logoUploadHint: '點擊或拖曳上傳 PNG, JPG, SVG, WebP',
    logoShape: 'Logo 形狀',
    shapeCircle: '圓形',
    shapeRounded: '圓角',
    shapeSquare: '方形',
    shapeNone: '無框',
    logoSize: 'Logo 尺寸大小',
    presetIconLabel: '或選擇內建精選圖示',
    bgImageUpload: '特色圖片 / 背景圖 (Feature / Background Image)',
    bgImageHint: '點擊或拖曳上傳圖片 (右欄展示或背景覆蓋)',
    bgOpacity: '背景圖片不透明度',
    bgBlur: '背景模糊度',
    clearImage: '移除圖片',
    styleSettings: '視覺配色與排版',
    themeMode: '卡片風格色調',
    themeDark: '深色暗黑 (Dark)',
    themeLight: '清亮白透 (Light)',
    presetColors: '主題漸層配色',
    accentColor: '強調發光色 (Accent)',
    fontFamily: '字型風格',
    fontSans: '現代無襯線 (Modern Sans)',
    fontSerif: '典雅襯線 (Editorial Serif)',
    fontMono: '極客等寬 (Tech Monospace)',
    fontDisplay: '粗黑衝擊 (Heavy Display)',
    ratioSettings: '畫布尺寸比例',
    exportOptions: '匯出與下載設定',
    downloadPng: '下載 PNG (推薦)',
    downloadJpeg: '下載 JPEG (高品質)',
    downloadWebp: '下載 WebP',
    downloadSvg: '下載 SVG 向量檔',
    copyClipboard: '複製圖片到剪貼簿',
    copySuccess: '已成功複製圖片至剪貼簿！',
    copyError: '剪貼簿複製失敗，請直接點擊下載圖片',
    previewTitle: '即時視覺預覽',
    previewDesc: '支援即時互動編輯與高解析度超採樣渲染',
    retinaMode: '2x 視網膜超採樣 (匯出時生成雙倍高清解析度)',
    faqTitle: '常見問題與使用指南',
    faqSubtitle: '深入了解 Open Graph 圖片最佳實踐、規格與社群分享優化技巧',
    faqItems: [
      {
        q: '什麼是 Open Graph (OG) 圖片？為什麼每個網頁都必須具備？',
        a: 'Open Graph (簡稱 OG) 協定是由 Facebook 於 2010 年推出的社交中繼標籤標準。當您在 Facebook、Twitter / X、LinkedIn、LINE、Slack 或 Discord 等平台分享網址時，爬蟲會自動抓取頁面中的 `<meta property="og:image" ...>` 標籤，並將其渲染為一張大型視覺卡片。\n\n根據社群數據統計，具備精美 OG 圖片的連結點擊率 (CTR) 比純文字連結高出 180% 以上！是提升網頁 SEO 與品牌曝光不可或缺的關鍵利器。',
      },
      {
        q: '社群平台推薦的 OG 圖片尺寸與長寬比為何？',
        a: '目前各大主流平台的黃金標準尺寸為 1200 x 630 像素 (長寬比約為 1.91:1)。\n\n① Facebook / LinkedIn / Discord：完美支援 1200 x 630。\n② Twitter / X：支援 1200 x 675 (16:9) 大圖卡片 (summary_large_image)。\n③ Instagram 貼文：標準正方形 1080 x 1080 (1:1)。\n④ 限時動態 / 手機全螢幕：垂直直式 1080 x 1920 (9:16)。\n\n本工具已內建上述所有比例，可一鍵切換並即時重新排版！',
      },
      {
        q: '本工具提供的四種模板分別適合應用在什麼情境？',
        a: '我們精心打磨了四款涵蓋各類應用情境的設計模板：\n\n① 現代極簡 (Modern Minimal)：乾淨留白、幾何點陣與細緻邊框，非常適合技術部落格、官方公告、開源專案與設計展示。\n② 科技光流 (Cyber Gradient)：霓虹漸層與流動光暈，適合 SaaS 產品、AI 開發工具與 Web3 科技新聞。\n③ 雜誌專欄 (Split Showcase)：經典左文右圖排版，可上傳自訂產品截圖或成果照片，適合深度評測、電子報與專案報導。\n④ 醒目大字 (Bold Impact)：超大粗體與醒目色條，文字張力極強，最適合社群快訊、金句短語與促銷活動。',
      },
      {
        q: '產生的圖片可以在商業專案中使用嗎？是否有版權或浮水印限制？',
        a: '100% 免費且可用於任何商業或個人專案！本工具完全不添加任何浮水印，產生的所有圖像版權 100% 歸您所有。\n\n此外，本工具運作於 100% 純前端 (Client-side 瀏覽器環境)，您上傳的 Logo、背景圖片及輸入的文字均不會上傳至任何後端伺服器，完全守護您的資料隱私與商業機密。',
      },
      {
        q: '為什麼提供多種匯出格式 (PNG / JPEG / WebP / SVG)？該如何選擇？',
        a: '不同格式適用於不同社群與伺服器部署情境：\n\n① PNG：無損高清壓縮，文字邊緣最為銳利，是各大社群平台 OG Image 最推薦的通用格式。\n② JPEG：適合包含複雜攝影照片的背景，檔案體積比 PNG 小 50% 以上，適合伺服器頻寬有限的網站。\n③ WebP：新一代高壓縮網頁格式，在保持高畫質的同時兼具極小體積。\n④ SVG：向量封裝檔，方便設計師於 Figma 或 Illustrator 中進行二次編修。',
      },
      {
        q: '如何將產生的 OG 圖片整合至 HTML 或 Next.js 專案中？',
        a: '下載圖片並上傳至網站的 public 目錄或 CDN 後，在 HTML `<head>` 中加入以下標準標籤：\n\n```html\n<meta property="og:title" content="您的網頁標題" />\n<meta property="og:description" content="您的網頁描述" />\n<meta property="og:image" content="https://yourdomain.com/og-image.png" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:image" content="https://yourdomain.com/og-image.png" />\n```\n\nNext.js App Router 則可直接在 `app/page.tsx` 的 `export const metadata` 中宣告 `openGraph` 與 `twitter` 物件！',
      },
    ],
  },
  en: {
    title: 'OG Image Generator',
    subtitle: 'OPEN GRAPH & SOCIAL IMAGE GENERATOR',
    description: 'Professional Open Graph and social media cover image generator. Features 4 refined templates, custom typography, drag-and-drop Logo and feature image uploads, multi-aspect ratios, and high-speed multi-format export (PNG/JPEG/WEBP/SVG).',
    langToggleUrl: '/og-generator/',
    langToggleLabel: '繁體中文',
    templateLabel: 'Design Template Style',
    templates: {
      minimal: { name: 'Modern Minimal', desc: 'Clean typography, subtle grid, ideal for tech & open-source' },
      gradient: { name: 'Cyber Glow', desc: 'Vibrant neon mesh gradient, ideal for SaaS & AI tools' },
      split: { name: 'Split Showcase', desc: 'Side-by-side text & feature visual, ideal for articles & showcases' },
      impact: { name: 'Bold Impact', desc: 'Heavy headline typography, high contrast, ideal for social hits' },
    },
    presetsLabel: 'Quick Sample Presets',
    presets: {
      tech: 'Tech Article',
      product: 'Product Launch',
      devlog: 'Dev Log',
      news: 'Social Alert',
    },
    textSettings: 'Text Content Settings',
    titleField: 'Main Title',
    titlePlaceholder: 'Enter a compelling headline...',
    subtitleField: 'Subtitle / Description',
    subtitlePlaceholder: 'Enter a concise summary or key highlight...',
    tagField: 'Category / Tag',
    tagPlaceholder: 'e.g. NEXT.JS / REACT',
    siteField: 'Website / Domain',
    sitePlaceholder: 'e.g. tools.cjkuo.net',
    authorField: 'Author / Publisher',
    authorPlaceholder: 'e.g. C.J. Kuo',
    dateField: 'Note / Publish Date',
    datePlaceholder: 'e.g. 2026-08-25 · 5 min read',
    mediaSettings: 'Media & Icon Settings',
    logoUpload: 'Custom Logo / Avatar',
    logoUploadHint: 'Click or drag & drop PNG, JPG, SVG, WebP',
    logoShape: 'Logo Shape',
    shapeCircle: 'Circle',
    shapeRounded: 'Rounded',
    shapeSquare: 'Square',
    shapeNone: 'Original',
    logoSize: 'Logo Size',
    presetIconLabel: 'Or Choose Built-in Icon',
    bgImageUpload: 'Feature / Background Image',
    bgImageHint: 'Click or drag image (showcase visual or background cover)',
    bgOpacity: 'Background Image Opacity',
    bgBlur: 'Background Blur',
    clearImage: 'Remove Image',
    styleSettings: 'Visual Theme & Typography',
    themeMode: 'Card Theme Tone',
    themeDark: 'Dark Mode',
    themeLight: 'Light Mode',
    presetColors: 'Gradient Color Themes',
    accentColor: 'Accent Color',
    fontFamily: 'Typography Font Style',
    fontSans: 'Modern Sans-Serif',
    fontSerif: 'Editorial Serif',
    fontMono: 'Tech Monospace',
    fontDisplay: 'Heavy Impact Display',
    ratioSettings: 'Canvas Aspect Ratio',
    exportOptions: 'Export & Download Options',
    downloadPng: 'Download PNG (Recommended)',
    downloadJpeg: 'Download JPEG (High Quality)',
    downloadWebp: 'Download WebP',
    downloadSvg: 'Download SVG Vector',
    copyClipboard: 'Copy Image to Clipboard',
    copySuccess: 'Image copied to clipboard successfully!',
    copyError: 'Clipboard copy failed. Please download the image directly.',
    previewTitle: 'Real-Time Visual Preview',
    previewDesc: 'Interactive editing with high-res supersampling rendering',
    retinaMode: '2x Retina Supersampling (Double resolution on export)',
    faqTitle: 'Frequently Asked Questions & Guide',
    faqSubtitle: 'Master Open Graph image best practices, social card dimensions, and SEO optimization',
    faqItems: [
      {
        q: 'What is an Open Graph (OG) image? Why is it crucial for every webpage?',
        a: 'The Open Graph protocol was introduced by Facebook in 2010 to standardize social metadata. When a URL is shared on Facebook, Twitter/X, LinkedIn, Discord, Slack, or messaging apps, crawlers look for `<meta property="og:image" ...>` to render a rich link preview card.\n\nStatistical data shows that links with custom OG images receive over 180% higher click-through rates (CTR) compared to plain links, making it essential for SEO and brand visibility.',
      },
      {
        q: 'What are the recommended dimensions and aspect ratios for social platforms?',
        a: 'The universal golden standard is 1200 x 630 pixels (~1.91:1 aspect ratio).\n\n① Facebook / LinkedIn / Discord: Native 1200 x 630.\n② Twitter / X: Native 1200 x 675 (16:9) large image summary card.\n③ Instagram Post: Square 1080 x 1080 (1:1).\n④ Stories / Mobile: Vertical 1080 x 1920 (9:16).\n\nThis tool supports all standard dimensions with instant responsive redraw!',
      },
      {
        q: 'When should I use each of the four design templates?',
        a: 'Each template is tailored for distinct content styles:\n\n① Modern Minimal: Clean negative space and subtle geometric borders, ideal for tech blogs, release notes, and open-source repos.\n② Cyber Glow: Futuristic dark neon glow, ideal for SaaS products, AI platforms, and developer utilities.\n③ Split Showcase: Side-by-side layout featuring your uploaded product screenshot or illustration, ideal for in-depth reviews and portfolios.\n④ Bold Impact: Ultra-bold typography and high-contrast accent blocks, ideal for social headlines, quotes, and announcements.',
      },
      {
        q: 'Can I use the generated images in commercial projects? Are there watermarks?',
        a: '100% free with complete commercial rights! There are zero watermarks, and you retain 100% ownership of all exported assets.\n\nFurthermore, this tool runs entirely on the client-side (inside your browser). Your text, logos, and uploaded images are never uploaded to any remote server, guaranteeing complete privacy.',
      },
      {
        q: 'Why are multiple export formats (PNG / JPEG / WebP / SVG) supported?',
        a: 'Each format excels in specific use cases:\n\n① PNG: Lossless quality with crisp text edges, the industry standard for OG social cards.\n② JPEG: Great for photo-heavy backgrounds, reducing file sizes by over 50%.\n③ WebP: Modern web format balancing superior compression with high visual fidelity.\n④ SVG: Vector XML container for easy embedding or secondary tweaking in design tools like Figma.',
      },
      {
        q: 'How do I embed the generated OG image in HTML or Next.js?',
        a: 'After exporting and placing the image in your public directory or CDN, add these meta tags to your HTML `<head>`:\n\n```html\n<meta property="og:title" content="Your Page Title" />\n<meta property="og:description" content="Your Page Description" />\n<meta property="og:image" content="https://yourdomain.com/og-image.png" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />\n<meta name="twitter:card" content="summary_large_image" />\n<meta name="twitter:image" content="https://yourdomain.com/og-image.png" />\n```\n\nIn Next.js App Router, simply declare `openGraph` and `twitter` inside `export const metadata` in `app/page.tsx`!',
      },
    ],
  },
};

export default function OgGeneratorClient({ lang = 'zh-TW' }: OgGeneratorClientProps) {
  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh-TW'];

  // IDs for accessibility
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

  // State
  const [template, setTemplate] = useState<TemplateType>('minimal');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('og');
  const [themeMode, setThemeMode] = useState<ThemeMode>('dark');
  const [fontFamily, setFontStyle] = useState<FontStyle>('sans');
  const [title, setTitle] = useState('How to Build Lightning-Fast Web Applications');
  const [subtitle, setSubtitle] = useState('Explore modern frontend architecture, state synchronization, and zero-latency rendering techniques.');
  const [tag, setTag] = useState('NEXT.JS · ARCHITECTURE');
  const [siteName, setSiteName] = useState('tools.cjkuo.net');
  const [author, setAuthor] = useState('C.J. Kuo');
  const [dateStr, setDateStr] = useState('2026-08-25 · 5 min read');

  // Colors
  const [color1, setColor1] = useState('#0f172a');
  const [color2, setColor2] = useState('#1e1b4b');
  const [accentColor, setAccentColor] = useState('#6366f1');

  // Media
  const [logoImage, setLogoImage] = useState<HTMLImageElement | null>(null);
  const [selectedIconId, setSelectedIconId] = useState<string>('code');
  const [logoShape, setLogoShape] = useState<LogoShape>('rounded');
  const [logoSize, setLogoSize] = useState<number>(64);

  const [bgImage, setBgImage] = useState<HTMLImageElement | null>(null);
  const [bgOpacity, setBgOpacity] = useState<number>(40);
  const [bgBlur, setBgBlur] = useState<number>(0);

  const [retinaSupersample, setRetinaSupersample] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Canvas Refs
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Set theme colors on mount
  useEffect(() => {
    document.documentElement.style.setProperty('--theme-color', '#6366f1');
    document.documentElement.style.setProperty('--accent-glow', 'rgba(99, 102, 241, 0.6)');
  }, []);

  // Quick Preset loader
  const loadPreset = (presetKey: 'tech' | 'product' | 'devlog' | 'news') => {
    if (presetKey === 'tech') {
      setTitle(lang === 'zh-TW' ? '深入解析 Next.js 16 App Router 高效架構' : 'Deep Dive: Next.js 16 App Router Architecture');
      setSubtitle(lang === 'zh-TW' ? '掌握零延遲渲染、伺服器組件與流體式狀態同步的架構實踐。' : 'Master zero-latency rendering, server components, and fluid state management.');
      setTag('DEVELOPER · ARCHITECTURE');
      setTemplate('minimal');
      setColor1('#0f172a');
      setColor2('#1e1b4b');
      setAccentColor('#6366f1');
      setSelectedIconId('code');
    } else if (presetKey === 'product') {
      setTitle(lang === 'zh-TW' ? 'Smalltools 2.0 震撼發布：開源極致工具箱' : 'Smalltools 2.0 Released: The Ultimate Open-Source Suite');
      setSubtitle(lang === 'zh-TW' ? '超過 28 款純前端強大工具，無廣告、無後端、100% 隱私安全。' : 'Over 28 powerful client-side utilities with zero tracking and pure speed.');
      setTag('PRODUCT LAUNCH · 2026');
      setTemplate('gradient');
      setColor1('#022c22');
      setColor2('#064e3b');
      setAccentColor('#10b981');
      setSelectedIconId('rocket');
    } else if (presetKey === 'devlog') {
      setTitle(lang === 'zh-TW' ? '工程師的效能調優手記：Canvas 與 WebAssembly' : 'Engineer DevLog: WebAssembly & Canvas Performance');
      setSubtitle(lang === 'zh-TW' ? '如何利用非阻塞時間片與記憶體零拷貝技術打造 60 FPS 極速體驗。' : 'Unlocking 60 FPS with non-blocking slicing and zero-copy indexing.');
      setTag('ENGINEERING · PERFORMANCE');
      setTemplate('split');
      setColor1('#082f49');
      setColor2('#0c4a6e');
      setAccentColor('#0284c7');
      setSelectedIconId('terminal');
    } else {
      setTitle(lang === 'zh-TW' ? '重大更新：全站無障礙 WCAG 2.1 AA 與雙主題特化' : 'Major Update: WCAG 2.1 AA & Fluid Dual Themes');
      setSubtitle(lang === 'zh-TW' ? '重塑視覺體驗，為所有使用者提供高對比度且細緻的毛玻璃美學。' : 'Reimagined visual experience with high contrast glassmorphism design.');
      setTag('ANNOUNCEMENT · DESIGN');
      setTemplate('impact');
      setColor1('#31102e');
      setColor2('#4a044e');
      setAccentColor('#f43f5e');
      setSelectedIconId('sparkles');
    }
  };

  // Handle Logo Upload
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

  // Handle Background Upload
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

  // Draw Helper: Wrap Text
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    maxLines: number = 3
  ): number => {
    const words = text.split('');
    let line = '';
    let currentY = y;
    let lineCount = 0;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n];
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        lineCount++;
        if (lineCount >= maxLines) {
          ctx.fillText(line.slice(0, -1) + '...', x, currentY);
          return currentY + lineHeight;
        }
        ctx.fillText(line, x, currentY);
        line = words[n];
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
    return currentY + lineHeight;
  };

  // Draw Helper: Rounded Rect
  const drawRoundedRect = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ) => {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  };

  // Draw Canvas
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dim = RATIO_DIMENSIONS[aspectRatio];
    const width = dim.width;
    const height = dim.height;

    canvas.width = width;
    canvas.height = height;

    const isDark = themeMode === 'dark';
    const bgColor1 = isDark ? color1 : '#ffffff';
    const bgColor2 = isDark ? color2 : '#f8fafc';
    const primaryTextColor = isDark ? '#ffffff' : '#0f172a';
    const secondaryTextColor = isDark ? '#94a3b8' : '#475569';
    const glassCardBg = isDark ? 'rgba(15, 23, 42, 0.65)' : 'rgba(255, 255, 255, 0.85)';
    const glassBorder = isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(15, 23, 42, 0.08)';

    // Font Family Definition
    let fontPrimary = 'system-ui, -apple-system, sans-serif';
    if (fontFamily === 'serif') fontPrimary = '"Georgia", "Noto Serif TC", serif';
    if (fontFamily === 'mono') fontPrimary = '"Fira Code", "Courier New", monospace';
    if (fontFamily === 'display') fontPrimary = '"Impact", "Arial Black", sans-serif';

    // 1. Draw Background Gradient
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, bgColor1);
    bgGrad.addColorStop(1, bgColor2);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // 2. Draw Background Grid / Particles / Ambient Glow
    if (template === 'minimal') {
      // Subtle Grid
      ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(15, 23, 42, 0.03)';
      ctx.lineWidth = 1;
      const gridSize = 40;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }
    } else if (template === 'gradient') {
      // Ambient Luminous Spheres
      const glow1 = ctx.createRadialGradient(width * 0.8, height * 0.2, 20, width * 0.8, height * 0.2, width * 0.5);
      glow1.addColorStop(0, accentColor + (isDark ? '66' : '33'));
      glow1.addColorStop(1, 'transparent');
      ctx.fillStyle = glow1;
      ctx.fillRect(0, 0, width, height);

      const glow2 = ctx.createRadialGradient(width * 0.15, height * 0.85, 30, width * 0.15, height * 0.85, width * 0.4);
      glow2.addColorStop(0, (isDark ? '#3b82f6' : '#60a5fa') + (isDark ? '44' : '22'));
      glow2.addColorStop(1, 'transparent');
      ctx.fillStyle = glow2;
      ctx.fillRect(0, 0, width, height);
    } else if (template === 'impact') {
      // Bold Accent Stripes
      ctx.fillStyle = accentColor + '22';
      ctx.beginPath();
      ctx.moveTo(width * 0.7, 0);
      ctx.lineTo(width, 0);
      ctx.lineTo(width, height * 0.45);
      ctx.lineTo(width * 0.5, height * 0.45);
      ctx.closePath();
      ctx.fill();
    }

    // 3. Draw Background Image if uploaded
    if (bgImage && template !== 'split') {
      ctx.save();
      ctx.globalAlpha = bgOpacity / 100;
      if (bgBlur > 0) {
        ctx.filter = `blur(${bgBlur}px)`;
      }
      const imgRatio = bgImage.width / bgImage.height;
      const canvasRatio = width / height;
      let drawW = width;
      let drawH = height;
      let drawX = 0;
      let drawY = 0;

      if (imgRatio > canvasRatio) {
        drawW = height * imgRatio;
        drawX = (width - drawW) / 2;
      } else {
        drawH = width / imgRatio;
        drawY = (height - drawH) / 2;
      }
      ctx.drawImage(bgImage, drawX, drawY, drawW, drawH);
      ctx.restore();
    }

    // 4. Draw Outer Frame / Glass Border
    const pad = Math.min(width, height) * 0.06;
    const cardW = width - pad * 2;
    const cardH = height - pad * 2;

    if (template === 'minimal' || template === 'gradient') {
      // Outer subtle glass border
      drawRoundedRect(ctx, pad, pad, cardW, cardH, 24);
      ctx.fillStyle = glassCardBg;
      ctx.fill();
      ctx.strokeStyle = glassBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Top Accent Line
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(pad + 24, pad);
      ctx.lineTo(pad + cardW - 24, pad);
      const lineGrad = ctx.createLinearGradient(pad, pad, pad + cardW, pad);
      lineGrad.addColorStop(0, 'transparent');
      lineGrad.addColorStop(0.3, accentColor);
      lineGrad.addColorStop(0.7, accentColor);
      lineGrad.addColorStop(1, 'transparent');
      ctx.strokeStyle = lineGrad;
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.restore();
    } else if (template === 'impact') {
      // High-contrast full border with thick accent strip on left
      drawRoundedRect(ctx, pad, pad, cardW, cardH, 20);
      ctx.fillStyle = glassCardBg;
      ctx.fill();
      ctx.strokeStyle = glassBorder;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Left Heavy Accent Pillar
      drawRoundedRect(ctx, pad, pad, 14, cardH, 6);
      ctx.fillStyle = accentColor;
      ctx.fill();
    }

    // 5. Draw Content by Template
    const innerPadX = pad + Math.min(width, height) * 0.05;
    const innerPadY = pad + Math.min(width, height) * 0.06;

    if (template === 'split') {
      // === Template 3: Split Showcase (左文右圖) ===
      const colW = (cardW - 40) * 0.54;
      const imgColW = cardW - colW - 30;
      const imgColX = innerPadX + colW + 20;

      // Draw Left Column (Text)
      let curY = innerPadY;

      // Tag Badge
      if (tag) {
        ctx.font = `700 15px ${fontPrimary}`;
        const tagMetrics = ctx.measureText(tag);
        const tagW = tagMetrics.width + 24;
        drawRoundedRect(ctx, innerPadX, curY, tagW, 30, 8);
        ctx.fillStyle = accentColor + (isDark ? '25' : '20');
        ctx.fill();
        ctx.strokeStyle = accentColor + '60';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.fillText(tag, innerPadX + 12, curY + 20);
        curY += 50;
      }

      // Title
      ctx.fillStyle = primaryTextColor;
      ctx.font = `800 ${height > 800 ? '42px' : '36px'} ${fontPrimary}`;
      curY = wrapText(ctx, title, innerPadX, curY + 10, colW, height > 800 ? 50 : 44, 3);

      // Subtitle
      if (subtitle) {
        curY += 10;
        ctx.fillStyle = secondaryTextColor;
        ctx.font = `400 ${height > 800 ? '20px' : '17px'} ${fontPrimary}`;
        curY = wrapText(ctx, subtitle, innerPadX, curY, colW, height > 800 ? 28 : 24, 3);
      }

      // Footer (Author & Site)
      const footerY = pad + cardH - 35;
      ctx.fillStyle = secondaryTextColor;
      ctx.font = `600 16px ${fontPrimary}`;
      ctx.fillText(`${siteName}  •  ${author}  •  ${dateStr}`, innerPadX, footerY);

      // Draw Right Column (Image Showcase or Feature Container)
      const imgH = cardH - 20;
      const imgY = pad + 10;
      drawRoundedRect(ctx, imgColX, imgY, imgColW, imgH, 20);
      ctx.fillStyle = isDark ? 'rgba(0, 0, 0, 0.4)' : 'rgba(255, 255, 255, 0.7)';
      ctx.fill();
      ctx.strokeStyle = glassBorder;
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (bgImage) {
        ctx.save();
        drawRoundedRect(ctx, imgColX + 2, imgY + 2, imgColW - 4, imgH - 4, 18);
        ctx.clip();
        const imgRatio = bgImage.width / bgImage.height;
        const boxRatio = imgColW / imgH;
        let dw = imgColW;
        let dh = imgH;
        let dx = imgColX;
        let dy = imgY;

        if (imgRatio > boxRatio) {
          dw = imgH * imgRatio;
          dx = imgColX + (imgColW - dw) / 2;
        } else {
          dh = imgColW / imgRatio;
          dy = imgY + (imgH - dh) / 2;
        }
        ctx.drawImage(bgImage, dx, dy, dw, dh);
        ctx.restore();
      } else {
        // Feature Mockup Placeholder
        ctx.save();
        ctx.strokeStyle = accentColor + '40';
        ctx.lineWidth = 2;
        ctx.strokeRect(imgColX + 25, imgY + 25, imgColW - 50, imgH - 50);
        ctx.fillStyle = accentColor;
        ctx.font = `700 18px ${fontPrimary}`;
        ctx.textAlign = 'center';
        ctx.fillText(lang === 'zh-TW' ? '特色展示圖片區域' : 'Feature Visual Showcase', imgColX + imgColW / 2, imgY + imgH / 2);
        ctx.restore();
      }
    } else {
      // === Templates 1, 2, 4 (Minimal, Gradient, Impact) ===
      let curY = innerPadY;

      // 1. Top Header: Tag Badge + Site Domain
      ctx.save();
      if (tag) {
        ctx.font = `700 15px ${fontPrimary}`;
        const tagMetrics = ctx.measureText(tag);
        const tagW = tagMetrics.width + 24;
        drawRoundedRect(ctx, innerPadX, curY, tagW, 32, 8);
        ctx.fillStyle = accentColor + (isDark ? '25' : '20');
        ctx.fill();
        ctx.strokeStyle = accentColor + '60';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = accentColor;
        ctx.fillText(tag, innerPadX + 12, curY + 21);
      }

      // Site Name on Top Right
      if (siteName) {
        ctx.font = `600 16px ${fontPrimary}`;
        ctx.fillStyle = secondaryTextColor;
        ctx.textAlign = 'right';
        ctx.fillText(siteName, innerPadX + cardW - Math.min(width, height) * 0.1, curY + 22);
      }
      ctx.restore();

      curY += 65;

      // 2. Title Typography
      ctx.fillStyle = primaryTextColor;
      let titleFontSize = height > 800 ? 56 : 48;
      if (template === 'impact') titleFontSize = height > 800 ? 64 : 54;
      ctx.font = `800 ${titleFontSize}px ${fontPrimary}`;

      const titleLineHeight = titleFontSize * 1.25;
      curY = wrapText(ctx, title, innerPadX, curY + 15, cardW - Math.min(width, height) * 0.1, titleLineHeight, 3);

      // 3. Subtitle / Description
      if (subtitle) {
        curY += 15;
        ctx.fillStyle = secondaryTextColor;
        const subFontSize = height > 800 ? 22 : 19;
        ctx.font = `400 ${subFontSize}px ${fontPrimary}`;
        curY = wrapText(ctx, subtitle, innerPadX, curY, cardW - Math.min(width, height) * 0.1, subFontSize * 1.45, 3);
      }

      // 4. Bottom Footer Bar (Logo + Author + Date)
      const footerY = pad + cardH - innerPadY * 0.45;
      const logoX = innerPadX;
      const logoY = footerY - logoSize / 2;

      // Draw Logo or Preset Icon
      if (logoImage) {
        ctx.save();
        if (logoShape === 'circle') {
          ctx.beginPath();
          ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
          ctx.clip();
        } else if (logoShape === 'rounded') {
          drawRoundedRect(ctx, logoX, logoY, logoSize, logoSize, 12);
          ctx.clip();
        }
        ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      } else {
        // Draw Built-in Vector Icon Box
        drawRoundedRect(ctx, logoX, logoY, logoSize, logoSize, 12);
        ctx.fillStyle = accentColor + (isDark ? '33' : '20');
        ctx.fill();
        ctx.strokeStyle = accentColor + '60';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        const iconObj = PRESET_ICONS.find((i) => i.id === selectedIconId) || PRESET_ICONS[0];
        ctx.save();
        ctx.translate(logoX + logoSize * 0.2, logoY + logoSize * 0.2);
        const scale = (logoSize * 0.6) / 24;
        ctx.scale(scale, scale);
        ctx.fillStyle = accentColor;
        const path2d = new Path2D(iconObj.path);
        ctx.fill(path2d);
        ctx.restore();
      }

      // Author & Date beside Logo
      const textStartX = logoX + logoSize + 18;
      ctx.fillStyle = primaryTextColor;
      ctx.font = `700 18px ${fontPrimary}`;
      ctx.fillText(author, textStartX, footerY - 4);

      ctx.fillStyle = secondaryTextColor;
      ctx.font = `500 15px ${fontPrimary}`;
      ctx.fillText(dateStr, textStartX, footerY + 18);
    }
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
    accentColor,
    logoImage,
    selectedIconId,
    logoShape,
    logoSize,
    bgImage,
    bgOpacity,
    bgBlur,
    lang,
  ]);

  // Redraw when state changes
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Toast Helper
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3000);
  };

  // High-Resolution Export Handler
  const getExportCanvas = (): HTMLCanvasElement => {
    const mainCanvas = canvasRef.current;
    if (!mainCanvas) return document.createElement('canvas');

    if (!retinaSupersample) {
      return mainCanvas;
    }

    // Create 2x Supersampled Canvas
    const exportCanvas = document.createElement('canvas');
    const dim = RATIO_DIMENSIONS[aspectRatio];
    const scale = 2;
    exportCanvas.width = dim.width * scale;
    exportCanvas.height = dim.height * scale;

    const ctx = exportCanvas.getContext('2d');
    if (ctx) {
      ctx.scale(scale, scale);
      // Temporarily swap canvasRef to render at high res
      const oldCanvas = canvasRef.current;
      canvasRef.current = exportCanvas;
      drawCanvas();
      canvasRef.current = oldCanvas;
    }

    return exportCanvas;
  };

  // Download Image
  const handleDownload = (format: 'png' | 'jpeg' | 'webp' | 'svg') => {
    setIsExporting(true);
    try {
      const exportCanvas = getExportCanvas();

      if (format === 'svg') {
        // Package as SVG with embedded dataURL
        const dataUrl = exportCanvas.toDataURL('image/png');
        const dim = RATIO_DIMENSIONS[aspectRatio];
        const svgString = `<svg xmlns="http://www.w3.org/2000/svg" width="${dim.width}" height="${dim.height}" viewBox="0 0 ${dim.width} ${dim.height}"><image href="${dataUrl}" width="${dim.width}" height="${dim.height}" /></svg>`;
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `og-image-${aspectRatio}.svg`;
        a.click();
        URL.revokeObjectURL(url);
      } else {
        const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
        const quality = format === 'jpeg' ? 0.92 : 0.95;
        const dataUrl = exportCanvas.toDataURL(mimeType, quality);
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `og-image-${aspectRatio}.${format === 'jpeg' ? 'jpg' : format}`;
        a.click();
      }
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // Copy to Clipboard
  const handleCopyToClipboard = async () => {
    try {
      const exportCanvas = getExportCanvas();
      exportCanvas.toBlob(async (blob) => {
        if (!blob) {
          showToast(t.copyError);
          return;
        }
        try {
          await navigator.clipboard.write([
            new ClipboardItem({
              'image/png': blob,
            }),
          ]);
          showToast(t.copySuccess);
        } catch {
          showToast(t.copyError);
        }
      }, 'image/png');
    } catch {
      showToast(t.copyError);
    }
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
        {/* Toast Alert */}
        {toastMessage && (
          <div className="fixed bottom-6 right-6 z-50 px-5 py-3 rounded-xl bg-surface-glass border border-border-glass shadow-2xl backdrop-blur-xl flex items-center gap-3 text-text-main text-sm font-semibold">
            <svg className="w-5 h-5 text-[#10b981]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* 1. Quick Presets Banner */}
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
                onClick={() => loadPreset(pk)}
                className="px-3.5 py-1.5 rounded-lg text-sm font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors"
              >
                {t.presets[pk]}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Main Workbench Grid (Left: Settings, Right: Real-time Canvas & Download) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Form Controls (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Template Selection */}
            <div className="p-6 rounded-2xl bg-surface-glass border border-border-glass space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-text-main">{t.templateLabel}</span>
                <span className="text-xs text-text-sub">4 Professional Templates</span>
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

            {/* Typography & Text Inputs */}
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

            {/* Media: Logo & Background Uploads */}
            <div className="p-6 rounded-2xl bg-surface-glass border border-border-glass space-y-6">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#818cf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sm font-semibold text-text-main">{t.mediaSettings}</span>
              </div>

              {/* Logo Section */}
              <div className="space-y-3">
                <span className="block text-sm font-medium text-text-sub">{t.logoUpload}</span>
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
                    {logoImage ? '已載入自訂 Logo (點擊更換)' : t.logoUploadHint}
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

                {/* Built-in Preset Icons */}
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

                {/* Logo Size Slider */}
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
              </div>

              {/* Background Upload Section */}
              <div className="space-y-3 pt-4 border-t border-border-glass">
                <span className="block text-sm font-medium text-text-sub">{t.bgImageUpload}</span>
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
                    {bgImage ? '已載入特色/背景圖片 (點擊更換)' : t.bgImageHint}
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
              </div>
            </div>

            {/* Styling: Theme & Color Palette */}
            <div className="p-6 rounded-2xl bg-surface-glass border border-border-glass space-y-4">
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5 text-[#818cf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                <span className="text-sm font-semibold text-text-main">{t.styleSettings}</span>
              </div>

              {/* Theme Tone (Dark / Light) */}
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

              {/* Preset Gradients */}
              <div className="space-y-2">
                <span className="block text-xs font-medium text-text-sub">{t.presetColors}</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {PRESET_COLORS.map((pc) => (
                    <button
                      key={pc.id}
                      type="button"
                      onClick={() => {
                        setColor1(pc.color1);
                        setColor2(pc.color2);
                        setAccentColor(pc.accent);
                      }}
                      className="p-2 rounded-xl border border-border-glass bg-select-bg flex flex-col items-center gap-1.5 hover:scale-105 transition-transform"
                    >
                      <div
                        className="w-full h-5 rounded-md"
                        style={{ background: `linear-gradient(135deg, ${pc.color1}, ${pc.color2})` }}
                      />
                      <span className="text-[12px] text-text-sub truncate w-full text-center">{pc.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Color Pickers */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label htmlFor={colorPicker1Id} className="block text-[12px] text-text-sub mb-1">Color 1</label>
                  <input
                    id={colorPicker1Id}
                    type="color"
                    value={color1}
                    onChange={(e) => setColor1(e.target.value)}
                    className="w-full h-9 rounded-lg cursor-pointer bg-transparent border border-border-glass"
                  />
                </div>
                <div>
                  <label htmlFor={colorPicker2Id} className="block text-[12px] text-text-sub mb-1">Color 2</label>
                  <input
                    id={colorPicker2Id}
                    type="color"
                    value={color2}
                    onChange={(e) => setColor2(e.target.value)}
                    className="w-full h-9 rounded-lg cursor-pointer bg-transparent border border-border-glass"
                  />
                </div>
                <div>
                  <label htmlFor={accentPickerId} className="block text-[12px] text-text-sub mb-1">{t.accentColor}</label>
                  <input
                    id={accentPickerId}
                    type="color"
                    value={accentColor}
                    onChange={(e) => setAccentColor(e.target.value)}
                    className="w-full h-9 rounded-lg cursor-pointer bg-transparent border border-border-glass"
                  />
                </div>
              </div>

              {/* Font Family Selection */}
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

          {/* Right Column: Canvas Live Preview & Export Toolbar (5 cols) */}
          <div className="lg:col-span-5 space-y-6 lg:sticky lg:top-8">
            {/* Live Preview Card */}
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

              {/* Ratio Selector Buttons */}
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

              {/* Canvas Container */}
              <div className={styles.previewWrapper}>
                <canvas ref={canvasRef} className={styles.canvasElement} />
              </div>

              {/* Retina Supersampling Toggle */}
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

              {/* Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={() => handleDownload('png')}
                  className="w-full py-3 rounded-xl text-sm font-semibold bg-gradient-to-r from-[#6366f1] to-[#8b5cf6] text-white shadow-lg hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all flex items-center justify-center gap-2"
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
                    className="py-2 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors"
                  >
                    {t.downloadJpeg.split(' ')[1] || 'JPEG'}
                  </button>
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => handleDownload('webp')}
                    className="py-2 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors"
                  >
                    WebP
                  </button>
                  <button
                    type="button"
                    disabled={isExporting}
                    onClick={() => handleDownload('svg')}
                    className="py-2 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors"
                  >
                    SVG
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCopyToClipboard}
                  className="w-full py-2.5 rounded-xl text-xs font-medium bg-select-bg border border-border-glass text-text-sub hover:text-text-main hover:border-[#6366f1] transition-colors flex items-center justify-center gap-1.5"
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

        {/* 3. Full-width FAQ Section */}
        <FaqSection
          title={t.faqTitle}
          subtitle={t.faqSubtitle}
          accentColor="#6366f1"
          items={t.faqItems}
        />
      </div>
    </ToolLayout>
  );
}

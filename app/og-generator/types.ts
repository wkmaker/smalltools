export type TemplateType = 'minimal' | 'gradient' | 'split' | 'impact';
export type AspectRatio = 'og' | 'twitter' | 'square' | 'story' | 'linkedin';
export type FontStyle = 'sans' | 'serif' | 'mono' | 'display';
export type LogoShape = 'circle' | 'rounded' | 'square' | 'none';
export type ThemeMode = 'dark' | 'light';
export type ExportFormat = 'png' | 'jpeg' | 'webp' | 'svg';

export interface PresetColor {
  id: string;
  name: string;
  nameZh: string;
  color1: string;
  color2: string;
  lightColor1: string;
  lightColor2: string;
  accent: string;
}

export interface PresetIcon {
  id: string;
  label: string;
  path: string;
}

export interface RatioDimension {
  width: number;
  height: number;
  label: string;
  desc: string;
}

export interface FaqItem {
  q: string;
  a: string;
}

export interface OgTranslationTemplate {
  name: string;
  desc: string;
}

export interface OgTranslation {
  title: string;
  subtitle: string;
  description: string;
  langToggleUrl: string;
  langToggleLabel: string;
  templateLabel: string;
  templates: Record<TemplateType, OgTranslationTemplate>;
  presetsLabel: string;
  presets: {
    tech: string;
    product: string;
    devlog: string;
    news: string;
  };
  textSettings: string;
  titleField: string;
  titlePlaceholder: string;
  subtitleField: string;
  subtitlePlaceholder: string;
  tagField: string;
  tagPlaceholder: string;
  siteField: string;
  sitePlaceholder: string;
  authorField: string;
  authorPlaceholder: string;
  dateField: string;
  datePlaceholder: string;
  mediaSettings: string;
  logoSectionTitle: string;
  enableLogo: string;
  logoEnabled: string;
  logoDisabled: string;
  logoUpload: string;
  logoUploadHint: string;
  logoShape: string;
  shapeCircle: string;
  shapeRounded: string;
  shapeSquare: string;
  shapeNone: string;
  logoSize: string;
  presetIconLabel: string;
  bgSectionTitle: string;
  bgEnabled: string;
  bgDisabled: string;
  bgImageUpload: string;
  bgImageHint: string;
  bgImageOptionalHint: string;
  bgOpacity: string;
  bgBlur: string;
  clearImage: string;
  styleSettings: string;
  themeMode: string;
  themeDark: string;
  themeLight: string;
  presetColors: string;
  accentColor: string;
  fontFamily: string;
  fontSans: string;
  fontSerif: string;
  fontMono: string;
  fontDisplay: string;
  ratioSettings: string;
  exportOptions: string;
  downloadPng: string;
  downloadJpeg: string;
  downloadWebp: string;
  downloadSvg: string;
  copyClipboard: string;
  copySuccess: string;
  copyError: string;
  previewTitle: string;
  previewDesc: string;
  retinaMode: string;
  clickToEnlarge: string;
  modalTitle: string;
  closeModal: string;
  actualDimensions: string;
  faqTitle: string;
  faqSubtitle: string;
  faqItems: FaqItem[];
}

export interface OgGeneratorClientProps {
  lang?: 'zh-TW' | 'en';
}

export interface DrawCanvasParams {
  canvas: HTMLCanvasElement;
  template: TemplateType;
  aspectRatio: AspectRatio;
  themeMode: ThemeMode;
  fontFamily: FontStyle;
  title: string;
  subtitle: string;
  tag: string;
  siteName: string;
  author: string;
  dateStr: string;
  color1: string;
  color2: string;
  lightColor1?: string;
  lightColor2?: string;
  accentColor: string;
  enableLogo: boolean;
  enableBgImage: boolean;
  logoImage: HTMLImageElement | null;
  selectedIconId: string;
  logoShape: LogoShape;
  logoSize: number;
  bgImage: HTMLImageElement | null;
  bgOpacity: number;
  bgBlur: number;
}

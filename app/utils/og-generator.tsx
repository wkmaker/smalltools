import { ImageResponse } from 'next/og';
import { getGoogleFont } from '@/app/utils/og-font';
import { OgImageTemplate, OgTemplateProps } from '@/app/utils/og-template';
import { CATEGORIES, Tool } from '@/app/config/tools';

export const ogImageExports = {
  dynamic: 'force-static' as const,
  size: {
    width: 1200,
    height: 630,
  },
  contentType: 'image/png',
};

// 亮色模式高對比度主題色映射表 (符合 WCAG AA 規範)
const CARD_ACCENT_COLORS: Record<string, string> = {
  carCard: '#dc2626', // 深紅
  mortgageCard: '#059669', // 深翠綠
  interestCard: '#d97706', // 深琥珀金
  loanCard: '#059669', // 深翠綠
  personalLoanCard: '#059669', // 深翠綠
  salaryCard: '#0284c7', // 深海天藍
  hourlyCard: '#0284c7', // 深海天藍
  hourlyRateCard: '#0284c7', // 深海天藍
  futuresCard: '#ea580c', // 深橘
  pledgeCard: '#d97706', // 深琥珀金
  qrCard: '#4f46e5', // 湛藍靛青
  imageCard: '#0d9488', // 深藍綠
  imageProcessorCard: '#0d9488', // 深藍綠
  pdfCard: '#dc2626', // 深紅
  pdfProcessorCard: '#dc2626', // 深紅
  pdfCompressCard: '#dc2626', // 深紅
  pdfCompressorCard: '#dc2626', // 深紅
  jsonCard: '#0284c7', // 深天藍
  diffCard: '#4f46e5', // 湛藍靛青
  diffCheckerCard: '#4f46e5', // 湛藍靛青
  base64Card: '#0d9488', // 深藍綠
  passwordCard: '#059669', // 深翠綠
  sslCard: '#4f46e5', // 湛藍靛青
  sslConverterCard: '#4f46e5', // 湛藍靛青
  epochCard: '#d97706', // 深琥珀金
  dnsCard: '#0284c7', // 深天藍
  digCard: '#0284c7', // 深天藍
  ipCard: '#0284c7', // 深天藍
  ipDetectCard: '#0284c7', // 深天藍
  ipDetectorCard: '#0284c7', // 深天藍
  ipCalculatorCard: '#0284c7', // 深天藍
  httpsDnsCard: '#4f46e5', // 湛藍靛青
  harCard: '#ea580c', // 深橘
  harCleanerCard: '#ea580c', // 深橘
  timeCard: '#0284c7', // 深天藍
  timerCard: '#0284c7', // 深天藍
  textCard: '#059669', // 深翠綠
  textUtilityCard: '#059669', // 深翠綠
  urlCard: '#0d9488', // 深藍綠
  pregnancyCard: '#e11d48', // 玫瑰深紅
  resignationCard: '#0284c7', // 深天藍
  calendarCard: '#059669', // 深翠綠
  wheelCard: '#c026d3', // 深洋紅
  luckyWheelCard: '#c026d3', // 深洋紅
  diceCard: '#ea580c', // 深橘
  liarsDiceCard: '#ea580c', // 深橘
  ogGeneratorCard: '#4f46e5', // 湛藍靛青
};

const CATEGORY_NAMES_ZH: Record<string, string> = {
  finance: '金融理財',
  workplace: '職場生活',
  developer: '開發者工具',
  network: '網路工具',
  media: '媒體圖像',
  utility: '生活實用',
};

const CATEGORY_NAMES_EN: Record<string, string> = {
  finance: 'Finance & Wealth',
  workplace: 'Work & Career',
  developer: 'Developer Tools',
  network: 'Network Utilities',
  media: 'Media & Graphics',
  utility: 'Daily Utilities',
};

/**
 * 依據傳入的參數動態產生 OpenGraph 圖片
 */
export async function createOgImage(props: OgTemplateProps) {
  const { title, subtitle = '', description, category, badgeList = [], lang = 'zh' } = props;
  const isEn = lang === 'en';

  const defaultBadges = isEn
    ? ['100% Free & Online', 'Private & Safe', 'Instant Results']
    : ['免費即時', '隱私安全', '高速計算'];

  const badges = badgeList.length > 0 ? badgeList : defaultBadges;

  // 匯總所有文字，動態同時下載 700 (粗體) 與 400 (常規) 兩套精準字型檔，避免 Satori 人工描邊造成模糊
  const allText = `${title} ${subtitle} ${description} ${category} ${badges.join(' ')} Smalltools tools.cjkuo.net`;
  
  const [fontBold, fontRegular] = await Promise.all([
    getGoogleFont(allText, 'Noto+Sans+TC', 700),
    getGoogleFont(allText, 'Noto+Sans+TC', 400),
  ]);

  return new ImageResponse(<OgImageTemplate {...props} badgeList={badges} />, {
    ...ogImageExports.size,
    fonts: [
      {
        name: 'Noto Sans TC',
        data: fontBold,
        style: 'normal',
        weight: 700,
      },
      {
        name: 'Noto Sans TC',
        data: fontRegular,
        style: 'normal',
        weight: 400,
      },
    ],
  });
}

/**
 * 自動從 tools.tsx 讀取指定工具的設定，快速生成對應的 OG 圖片
 */
export async function createToolOgImage(
  toolSlug: string,
  lang: 'zh' | 'en' = 'zh',
  overrides: Partial<OgTemplateProps> = {}
) {
  const isEn = lang === 'en';
  let targetTool: Tool | undefined;

  for (const cat of CATEGORIES) {
    const found = cat.tools.find(
      (t) => t.href.replace(/\//g, '') === toolSlug.replace(/\//g, '')
    );
    if (found) {
      targetTool = found;
      break;
    }
  }

  if (!targetTool) {
    throw new Error(`Tool "${toolSlug}" not found in CATEGORIES config`);
  }

  const categoryLabel = isEn
    ? CATEGORY_NAMES_EN[targetTool.category] || 'Utilities'
    : CATEGORY_NAMES_ZH[targetTool.category] || '實用工具';

  const accentColor =
    overrides.accentColor ||
    CARD_ACCENT_COLORS[targetTool.cardClass] ||
    '#0284c7';

  const baseProps: OgTemplateProps = {
    title: isEn ? targetTool.nameEn : targetTool.name,
    subtitle: isEn ? targetTool.subtitleEn : targetTool.subtitle,
    description: isEn ? targetTool.descriptionEn : targetTool.description,
    category: categoryLabel,
    accentColor,
    lang,
    ...overrides,
  };

  return createOgImage(baseProps);
}

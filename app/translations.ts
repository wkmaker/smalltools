/**
 * 首頁中英文案（從 HomeClient.tsx 抽離，避免單檔過長）。
 */
import type { Category } from './config/tools';

type Tab = 'all' | Category;

interface HomeTranslations {
  title: string;
  subtitleTop: string;
  pageDescription: string;
  searchPlaceholder: string;
  searchClearTitle: string;
  openTool: string;
  noResults: string;
  comingSoonTitle: string;
  comingSoonSubtitle: string;
  comingSoonDesc: string;
  comingSoonAction: string;
  langToggleUrl: string;
  langToggleLabel: string;
  tabLabels: Record<Tab, string>;
  sponsorText: string;
  pinnedTitle: string;
  pinnedSubtitle: string;
  recentTitle: string;
  pinTool: string;
  unpinTool: string;
  clearRecent: string;
  noPinnedHint: string;
}

export const TRANSLATIONS: Record<'zh-TW' | 'en', HomeTranslations> = {
  'zh-TW': {
    title: '工具庫',
    subtitleTop: 'MY TOOLBOX',
    pageDescription:
      '免費、無廣告、精緻的線上工具庫。涵蓋房貸/信貸/車貸計算機、JSON格式化、Base64/URL編碼解碼、密碼生成器、SSL憑證轉換、DNS診斷等 20+ 開發與理財工具，免下載即用。',
    searchPlaceholder: '搜尋工具... (e.g. loan, json, base64)',
    searchClearTitle: '清除搜尋',
    openTool: '開啟工具',
    noResults: '沒有找到符合的工具，請嘗試其他關鍵字',
    comingSoonTitle: '敬請期待',
    comingSoonSubtitle: 'COMING SOON',
    comingSoonDesc: '更多實用、唯美的工具正在開發中，敬請期待下一次的更新與功能推出。',
    comingSoonAction: '規劃中',
    langToggleUrl: '/en/',
    langToggleLabel: 'English',
    tabLabels: {
      all: '全部工具',
      finance: '金融理財',
      workplace: '職場生活',
      developer: '開發輔助',
      network: '網路維運',
      media: '圖片文件',
      utility: '生活娛樂',
    },
    sponsorText: '贊助支持',
    pinnedTitle: '我的常用工具',
    pinnedSubtitle: 'PINNED FAVORITES',
    recentTitle: '最近使用',
    pinTool: '釘選至常用工具',
    unpinTool: '取消釘選',
    clearRecent: '清除紀錄',
    noPinnedHint: '點擊任何工具卡片右上角的星號即可釘選常用工具至此處快速存取。',
  },
  en: {
    title: 'Online Toolbox',
    subtitleTop: 'FREE WEB UTILITIES',
    pageDescription:
      'Free, ad-free, and crafted online developer & utility toolbox. Featuring mortgage/loan calculators, JSON formatter, Base64/URL tools, CSPRNG password generator, SSL converter, DNS dig and 20+ utilities with 100% local privacy.',
    searchPlaceholder: 'Search tools... (e.g. loan, json, base64)',
    searchClearTitle: 'Clear search',
    openTool: 'Open Tool',
    noResults: 'No matching tools found, please try other keywords',
    comingSoonTitle: 'Coming Soon',
    comingSoonSubtitle: 'COMING SOON',
    comingSoonDesc: 'More powerful and elegant tools are under active development. Stay tuned for upcoming updates!',
    comingSoonAction: 'In Progress',
    langToggleUrl: '/',
    langToggleLabel: '繁體中文',
    tabLabels: {
      all: 'All Tools',
      finance: 'Finance',
      workplace: 'Workplace',
      developer: 'Dev Tools',
      network: 'Network',
      media: 'Media & Docs',
      utility: 'Utilities',
    },
    sponsorText: 'Sponsor',
    pinnedTitle: 'Favorite Tools',
    pinnedSubtitle: 'PINNED FAVORITES',
    recentTitle: 'Recent Tools',
    pinTool: 'Pin to Favorites',
    unpinTool: 'Unpin tool',
    clearRecent: 'Clear recent',
    noPinnedHint: 'Click the star icon on any tool card to pin your favorite tools here for quick access.',
  },
};

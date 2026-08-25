import { createOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Smalltools 工具庫 - 免費線上工具集';

export default async function Image() {
  return createOgImage({
    title: 'Smalltools 線上實用工具庫',
    subtitle: 'ALL-IN-ONE UTILITIES HUB',
    description:
      '精選 30+ 款專為現代工作者、開發者與投資人打造的高效線上工具，\n100% 本地端即時運算、永久免費、隱私安全、無廣告干擾。',
    category: '全站總覽',
    accentColor: '#0284c7',
    badgeList: ['30+ 款實用工具', '100% 本地即時運算', '無廣告無追蹤'],
    lang: 'zh',
  });
}

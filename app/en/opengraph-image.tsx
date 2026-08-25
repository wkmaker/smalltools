import { createOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Smalltools - Free Online Utilities & Developer Tools';

export default async function Image() {
  return createOgImage({
    title: 'Smalltools All-in-One Hub',
    subtitle: 'ALL-IN-ONE UTILITIES HUB',
    description:
      '30+ fast, secure, and free online utilities for developers, investors, and creators.\n100% client-side computing with complete privacy guarantee.',
    category: 'All Tools Hub',
    accentColor: '#0284c7',
    badgeList: ['30+ Free Utilities', '100% Client-Side', 'No Ads & No Tracking'],
    lang: 'en',
  });
}

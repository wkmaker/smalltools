import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '幸運轉盤抽獎小工具 - LUCKY WHEEL SPINNER';

export default async function Image() {
  return createToolOgImage('lucky-wheel', 'zh');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'OG 圖片產生器 - OPEN GRAPH & SOCIAL IMAGE GENERATOR';

export default async function Image() {
  return createToolOgImage('og-generator', 'zh');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '離職時間與預告期計算機 - RESIGNATION & NOTICE PERIOD CALCULATOR';

export default async function Image() {
  return createToolOgImage('resignation-calculator', 'zh');
}

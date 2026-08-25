import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '孕期與產檢假計算機 - PREGNANCY & MATERNITY LEAVE';

export default async function Image() {
  return createToolOgImage('pregnancy-calculator', 'zh');
}

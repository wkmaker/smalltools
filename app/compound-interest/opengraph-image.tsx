import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '複利計算機 - COMPOUND INTEREST CALCULATOR';

export default async function Image() {
  return createToolOgImage('compound-interest', 'zh');
}

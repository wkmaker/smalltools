import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '房貸計算機 - MORTGAGE LOAN CALCULATOR';

export default async function Image() {
  return createToolOgImage('mortgage-loan', 'zh');
}

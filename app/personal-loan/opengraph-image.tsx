import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '信貸計算機 - PERSONAL LOAN CALCULATOR';

export default async function Image() {
  return createToolOgImage('personal-loan', 'zh');
}

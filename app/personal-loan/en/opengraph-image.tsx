import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Personal Loan Calculator - PERSONAL LOAN CALCULATOR';

export default async function Image() {
  return createToolOgImage('personal-loan', 'en');
}

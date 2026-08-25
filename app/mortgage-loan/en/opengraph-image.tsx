import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Mortgage Loan Calculator - MORTGAGE LOAN CALCULATOR';

export default async function Image() {
  return createToolOgImage('mortgage-loan', 'en');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Stock Pledging & Risk Calculator - STOCK PLEDGING & RISK CALCULATOR';

export default async function Image() {
  return createToolOgImage('pledge-calculator', 'en');
}

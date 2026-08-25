import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Resignation & Notice Period Calculator - RESIGNATION & NOTICE PERIOD CALCULATOR';

export default async function Image() {
  return createToolOgImage('resignation-calculator', 'en');
}

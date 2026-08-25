import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '真實時薪計算器 - REAL HOURLY RATE CALCULATOR';

export default async function Image() {
  return createToolOgImage('hourly-rate-calculator', 'zh');
}

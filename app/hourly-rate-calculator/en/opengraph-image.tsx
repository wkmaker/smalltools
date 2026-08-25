import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Real Hourly Rate Calculator - REAL HOURLY RATE CALCULATOR';

export default async function Image() {
  return createToolOgImage('hourly-rate-calculator', 'en');
}

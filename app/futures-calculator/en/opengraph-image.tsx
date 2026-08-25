import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Futures Margin & Leverage Calculator - FUTURES MARGIN & LEVERAGE CALCULATOR';

export default async function Image() {
  return createToolOgImage('futures-calculator', 'en');
}

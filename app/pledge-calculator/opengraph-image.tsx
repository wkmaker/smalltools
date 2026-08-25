import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '股票質押與維持率壓力測試器 - STOCK PLEDGING & RISK CALCULATOR';

export default async function Image() {
  return createToolOgImage('pledge-calculator', 'zh');
}

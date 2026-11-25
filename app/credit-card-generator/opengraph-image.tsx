import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '測試信用卡號產生器 - TEST CREDIT CARD GENERATOR & LUHN VALIDATOR';

export default async function Image() {
  return createToolOgImage('credit-card-generator', 'zh');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '台股期貨槓桿與逆風點數估算器 - FUTURES MARGIN & LEVERAGE CALCULATOR';

export default async function Image() {
  return createToolOgImage('futures-calculator', 'zh');
}

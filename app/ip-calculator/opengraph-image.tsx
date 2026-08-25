import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'IP 子網段計算器 - IP SUBNET CALCULATOR';

export default async function Image() {
  return createToolOgImage('ip-calculator', 'zh');
}

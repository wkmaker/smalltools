import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'IP Subnet Calculator - IP SUBNET CALCULATOR';

export default async function Image() {
  return createToolOgImage('ip-calculator', 'en');
}

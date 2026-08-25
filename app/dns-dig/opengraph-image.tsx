import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'DIG 網路診斷工具 - DNS DIG WEB TOOL';

export default async function Image() {
  return createToolOgImage('dns-dig', 'zh');
}

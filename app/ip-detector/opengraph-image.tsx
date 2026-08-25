import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'IP 檢測助手 - IP DIAGNOSTIC TOOL';

export default async function Image() {
  return createToolOgImage('ip-detector', 'zh');
}

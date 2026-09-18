import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'PAC 測試與除錯器 - PROXY AUTO-CONFIG DEBUGGER & SIMULATOR';

export default async function Image() {
  return createToolOgImage('pac-tester', 'zh');
}

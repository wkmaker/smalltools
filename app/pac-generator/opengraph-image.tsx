import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'PAC 規則產生器 - PROXY AUTO-CONFIG SCRIPT GENERATOR';

export default async function Image() {
  return createToolOgImage('pac-generator', 'zh');
}

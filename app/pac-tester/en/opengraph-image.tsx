import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'PAC Tester & Simulator - PROXY AUTO-CONFIG DEBUGGER & SIMULATOR';

export default async function Image() {
  return createToolOgImage('pac-tester', 'en');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'DNS DIG Web Tool - DNS DIG WEB TOOL';

export default async function Image() {
  return createToolOgImage('dns-dig', 'en');
}

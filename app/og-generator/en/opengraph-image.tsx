import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Open Graph Image Generator - OPEN GRAPH & SOCIAL IMAGE GENERATOR';

export default async function Image() {
  return createToolOgImage('og-generator', 'en');
}

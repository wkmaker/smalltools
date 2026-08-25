import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Text Processing Utility - TEXT PROCESSING UTILITY';

export default async function Image() {
  return createToolOgImage('text-utility', 'en');
}

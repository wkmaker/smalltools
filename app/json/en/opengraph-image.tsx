import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'JSON Formatter & Minifier - JSON FORMATTER & MINIFIER';

export default async function Image() {
  return createToolOgImage('json', 'en');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'PDF Page Composer - PDF PAGE COMPOSER';

export default async function Image() {
  return createToolOgImage('pdf-processor', 'en');
}

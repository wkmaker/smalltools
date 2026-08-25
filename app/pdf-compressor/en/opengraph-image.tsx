import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'PDF Compressor Master - PDF COMPRESSOR MASTER';

export default async function Image() {
  return createToolOgImage('pdf-compressor', 'en');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Universal Image Processor - UNIVERSAL IMAGE PROCESSOR';

export default async function Image() {
  return createToolOgImage('image-processor', 'en');
}

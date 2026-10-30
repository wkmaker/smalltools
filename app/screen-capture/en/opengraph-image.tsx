import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Free Online Screen Recorder - Screen Capture with Audio, No Install & No Watermark';

export default async function Image() {
  return createToolOgImage('screen-capture', 'en');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Base64 Encoder & Decoder - BASE64 ENCODER & DECODER';

export default async function Image() {
  return createToolOgImage('base64', 'en');
}

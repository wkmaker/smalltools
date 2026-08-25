import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Designer QR Code 產生器 - DESIGNER QR CODE GENERATOR';

export default async function Image() {
  return createToolOgImage('qr-generator', 'zh');
}

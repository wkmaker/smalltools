import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'URL 編碼/解碼 - URL ENCODER & DECODER';

export default async function Image() {
  return createToolOgImage('url', 'zh');
}

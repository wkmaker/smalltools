import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'SSL 憑證格式轉換器 - SSL CERTIFICATE CONVERTER';

export default async function Image() {
  return createToolOgImage('ssl-converter', 'zh');
}

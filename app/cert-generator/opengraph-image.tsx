import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'CA / 伺服器憑證產生器 - SELF-SIGNED CA & SERVER CERT GENERATOR';

export default async function Image() {
  return createToolOgImage('cert-generator', 'zh');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'PDF 頁面組合器 - PDF PAGE COMPOSER';

export default async function Image() {
  return createToolOgImage('pdf-processor', 'zh');
}

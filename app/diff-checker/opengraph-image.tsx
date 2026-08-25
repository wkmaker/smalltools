import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '兩份文件比對工具 - DOCUMENT DIFF CHECKER';

export default async function Image() {
  return createToolOgImage('diff-checker', 'zh');
}

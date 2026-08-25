import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '文字處理助手 - TEXT PROCESSING UTILITY';

export default async function Image() {
  return createToolOgImage('text-utility', 'zh');
}

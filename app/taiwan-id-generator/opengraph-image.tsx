import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '台灣身分證產生器 - TAIWAN NATIONAL ID GENERATOR & VALIDATOR';

export default async function Image() {
  return createToolOgImage('taiwan-id-generator', 'zh');
}

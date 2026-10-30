import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '極簡線上螢幕錄影工具 - 免安裝電腦螢幕錄影、麥克風旁白收音與無浮水印錄製';

export default async function Image() {
  return createToolOgImage('screen-capture', 'zh');
}

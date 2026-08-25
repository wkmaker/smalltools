import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '光影裁剪 - 萬能圖片處理大師 - UNIVERSAL IMAGE PROCESSOR';

export default async function Image() {
  return createToolOgImage('image-processor', 'zh');
}

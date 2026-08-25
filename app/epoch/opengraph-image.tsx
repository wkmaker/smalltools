import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Epoch 時間戳記轉換 - EPOCH TIMESTAMP CONVERTER';

export default async function Image() {
  return createToolOgImage('epoch', 'zh');
}

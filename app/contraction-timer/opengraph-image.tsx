import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '宮縮計時器 - CONTRACTION TIMER';

export default async function Image() {
  return createToolOgImage('contraction-timer', 'zh');
}

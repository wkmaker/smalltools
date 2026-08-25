import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '目標計時器 - TARGET TIMER';

export default async function Image() {
  return createToolOgImage('time', 'zh');
}

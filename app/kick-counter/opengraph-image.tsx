import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '胎動計數器 - FETAL KICK COUNTER';

export default async function Image() {
  return createToolOgImage('kick-counter', 'zh');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '吹牛骰子搖骰器 - LIAR';

export default async function Image() {
  return createToolOgImage('liars-dice', 'zh');
}

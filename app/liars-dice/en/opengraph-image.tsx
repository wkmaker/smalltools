import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Liar - LIAR';

export default async function Image() {
  return createToolOgImage('liars-dice', 'en');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Fetal Kick Counter - FETAL KICK COUNTER';

export default async function Image() {
  return createToolOgImage('kick-counter', 'en');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Target Timer - TARGET TIMER';

export default async function Image() {
  return createToolOgImage('time', 'en');
}

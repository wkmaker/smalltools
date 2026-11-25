import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Taiwan National ID Generator - TAIWAN NATIONAL ID GENERATOR & VALIDATOR';

export default async function Image() {
  return createToolOgImage('taiwan-id-generator', 'en');
}

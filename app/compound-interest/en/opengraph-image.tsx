import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Compound Interest Calculator - COMPOUND INTEREST CALCULATOR';

export default async function Image() {
  return createToolOgImage('compound-interest', 'en');
}

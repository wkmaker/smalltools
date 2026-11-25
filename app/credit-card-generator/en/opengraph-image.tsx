import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Test Credit Card Generator - TEST CREDIT CARD GENERATOR & LUHN VALIDATOR';

export default async function Image() {
  return createToolOgImage('credit-card-generator', 'en');
}

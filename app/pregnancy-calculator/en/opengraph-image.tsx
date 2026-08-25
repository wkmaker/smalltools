import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Pregnancy & Maternity Leave Calculator - PREGNANCY & MATERNITY LEAVE';

export default async function Image() {
  return createToolOgImage('pregnancy-calculator', 'en');
}

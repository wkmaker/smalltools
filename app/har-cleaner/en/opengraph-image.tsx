import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'HAR Sanitizer & Privacy Cleaner - HAR SANITIZER & PRIVACY CLEANER';

export default async function Image() {
  return createToolOgImage('har-cleaner', 'en');
}

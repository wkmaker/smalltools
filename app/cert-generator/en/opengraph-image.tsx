import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'CA & Server Certificate Generator - SELF-SIGNED CA & SERVER CERT GENERATOR';

export default async function Image() {
  return createToolOgImage('cert-generator', 'en');
}

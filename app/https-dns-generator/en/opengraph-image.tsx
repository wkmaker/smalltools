import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'DNS HTTPS Record Generator - DNS HTTPS (TYPE 65) GENERATOR';

export default async function Image() {
  return createToolOgImage('https-dns-generator', 'en');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'File Hash Calculator & Checksum Verifier - MD5 / SHA-256 / SHA-512 / CRC32';

export default async function Image() {
  return createToolOgImage('checksum-verifier', 'en');
}

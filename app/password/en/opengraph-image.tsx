import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'Secure Password Generator - PASSWORD GENERATOR (CSPRNG)';

export default async function Image() {
  return createToolOgImage('password', 'en');
}

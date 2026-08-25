import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '安全密碼生成器 - PASSWORD GENERATOR (CSPRNG)';

export default async function Image() {
  return createToolOgImage('password', 'zh');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = '檔案雜湊計算與校驗工具 - MD5 / SHA-256 / SHA-512 / CRC32';

export default async function Image() {
  return createToolOgImage('checksum-verifier', 'zh');
}

import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'HAR 敏感資料清理工具 - HAR SANITIZER & PRIVACY CLEANER';

export default async function Image() {
  return createToolOgImage('har-cleaner', 'zh');
}

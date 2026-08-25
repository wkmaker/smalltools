import { createToolOgImage, ogImageExports } from '@/app/utils/og-generator';

export const { dynamic, size, contentType } = ogImageExports;
export const alt = 'JSON 格式化與美化器 - JSON FORMATTER & MINIFIER';

export default async function Image() {
  return createToolOgImage('json', 'zh');
}
